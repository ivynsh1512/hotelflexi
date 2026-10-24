import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { callGroqChat } from '../services/groqClient';
import { recordAuditLog } from '../services/audit';

export const propertySetupRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

propertySetupRoutes.use('*', authMiddleware, tenantMiddleware);

const SETUP_EXTRACTION_SYSTEM_PROMPT = `
You are the HotelFlexi Principal Property Configuration Extraction Architect.
Your task is to analyze natural-language hotel property catalogues, WhatsApp rate sheets, room descriptions, menus, wedding packages, or tax instructions and convert them into a strictly typed, production-ready configuration draft.

Rules:
1. Extract ONLY facts supported by the text. Never hallucinate missing room counts, prices, or taxes.
2. If the user provides a room category with occupancy tiers (e.g., "Deluxe room is ₹3,500 for 2 guests and ₹1,000 for extra guest"), preserve basePriceRupees: 3500, baseOccupancy: 2, extraAdultPriceRupees: 1000.
3. Generate clean 3-4 letter uppercase alphanumeric codes for room categories if not explicitly provided (e.g. "DLX", "SUT", "CTG", "EXE").
4. If physical room numbers are listed (e.g. "101, 102, 103 on 1st floor"), extract them under physicalRooms.
5. If meal plans or inclusions are mentioned (CP, EP, MAP, AP, complimentary breakfast), configure rate plans.
6. If wedding, banquet, or event packages are described, extract them under packages.
7. If tax, GST, or fees (e.g., 12% GST, ₹100 resort fee) are mentioned, extract them under taxConfiguration.
8. If information is ambiguous, contradictory, or missing critical prices, add explicit clarifying questions into the missingOrAmbiguous array.

Return your response in pure JSON format:
{
  "propertyDetails": {
    "name": string | null,
    "phone": string | null,
    "email": string | null,
    "address": string | null,
    "city": string | null,
    "state": string | null,
    "checkInTime": string | null,
    "checkOutTime": string | null,
    "description": string | null,
    "amenities": string[]
  },
  "roomCategories": [
    {
      "name": string,
      "code": string,
      "description": string | null,
      "maxOccupancy": number,
      "baseOccupancy": number,
      "basePriceRupees": number,
      "extraAdultPriceRupees": number,
      "amenities": string[]
    }
  ],
  "physicalRooms": [
    {
      "roomNumber": string,
      "floor": string | null,
      "roomCategoryName": string
    }
  ],
  "ratePlans": [
    {
      "name": string,
      "code": string,
      "roomCategoryName": string,
      "mealPlan": "EP" | "CP" | "MAP" | "AP",
      "priceMultiplier": number,
      "surchargeRupees": number,
      "isNonRefundable": boolean
    }
  ],
  "packages": [
    {
      "name": string,
      "type": "wedding" | "banquet" | "holiday" | "package",
      "priceRupees": number,
      "inclusions": string[],
      "minGuests": number | null,
      "maxGuests": number | null,
      "notes": string | null
    }
  ],
  "taxConfiguration": {
    "gstNumber": string | null,
    "standardGstPercent": number | null,
    "customRules": [
      {
        "name": string,
        "taxType": "percentage" | "fixed",
        "ratePercentage": number,
        "fixedAmountRupees": number,
        "scope": "room" | "fnb" | "all",
        "frequency": "per_night" | "per_stay" | "per_guest",
        "isInclusive": boolean
      }
    ]
  },
  "missingOrAmbiguous": string[]
}
`.trim();

// -----------------------------------------------------------------------------
// 1. SUBMIT NATURAL LANGUAGE CHUNK & EXTRACT STRUCTURED DRAFT
// -----------------------------------------------------------------------------
propertySetupRoutes.post('/draft/chunk', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const { propertyId, draftId: incomingDraftId, chunkText, sessionTitle = 'Property Setup' } = body;

  if (!propertyId || !chunkText || !chunkText.trim()) {
    return c.json({ error: 'propertyId and chunkText are required' }, 400);
  }

  // Verify property ownership
  const property: any = await c.env.DB.prepare(
    `SELECT * FROM properties WHERE id = ? AND tenant_id = ?`
  )
    .bind(propertyId, tenantId)
    .first();

  if (!property) {
    return c.json({ error: 'Property not found' }, 404);
  }

  let draftId = incomingDraftId;
  let rawChunks: string[] = [];
  let existingDraft: any = null;

  if (draftId) {
    const row: any = await c.env.DB.prepare(
      `SELECT * FROM property_setup_drafts WHERE id = ? AND tenant_id = ?`
    )
      .bind(draftId, tenantId)
      .first();

    if (row) {
      existingDraft = row.extracted_draft ? JSON.parse(row.extracted_draft) : null;
      rawChunks = row.raw_input_chunks ? JSON.parse(row.raw_input_chunks) : [];
    }
  }

  if (!draftId) {
    draftId = `psd_${crypto.randomUUID().slice(0, 8)}`;
  }

  rawChunks.push(chunkText.trim());

  // Aggregate all chunk text
  const combinedContextText = rawChunks
    .map((chunk, idx) => `[Chunk #${idx + 1}]:\n${chunk}`)
    .join('\n\n');

  // Call Groq with openai/gpt-oss-120b
  const groqRes = await callGroqChat(
    c.env,
    [
      { role: 'system', content: SETUP_EXTRACTION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Here is the property information submitted by the hotel owner:\n\n${combinedContextText}\n\nParse into the required JSON configuration schema.`,
      },
    ],
    {
      taskType: 'reasoning',
      timeoutMs: 25000,
    }
  );

  let extractedConfig: any = null;
  if (groqRes.success && groqRes.content) {
    try {
      // Clean possible markdown code fences
      const cleanJson = groqRes.content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      extractedConfig = JSON.parse(cleanJson);
    } catch {
      // Fallback: extract JSON substring if extra conversational text exists
      const match = groqRes.content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          extractedConfig = JSON.parse(match[0]);
        } catch {}
      }
    }
  }

  if (!extractedConfig) {
    extractedConfig = {
      propertyDetails: { name: property.name, phone: property.phone, address: property.address_line1, amenities: [] },
      roomCategories: [],
      physicalRooms: [],
      ratePlans: [],
      packages: [],
      taxConfiguration: { gstNumber: null, standardGstPercent: 12, customRules: [] },
      missingOrAmbiguous: ['Could not automatically structure text. Please check prices and room names.'],
    };
  }

  // 3. Compare extracted draft against existing DB records
  const [existingRoomTypes, existingRooms, existingRates, existingTaxRules]: any = await Promise.all([
    c.env.DB.prepare(`SELECT * FROM room_types WHERE property_id = ? AND tenant_id = ? AND is_active = 1`).bind(propertyId, tenantId).all(),
    c.env.DB.prepare(`SELECT * FROM rooms WHERE property_id = ? AND tenant_id = ? AND is_active = 1`).bind(propertyId, tenantId).all(),
    c.env.DB.prepare(`SELECT * FROM rate_plans WHERE property_id = ? AND tenant_id = ? AND is_active = 1`).bind(propertyId, tenantId).all(),
    c.env.DB.prepare(`SELECT * FROM property_tax_rules WHERE property_id = ? AND tenant_id = ? AND is_active = 1`).bind(propertyId, tenantId).all(),
  ]);

  const existingTypesList = existingRoomTypes.results || [];
  const existingRoomsList = existingRooms.results || [];
  const existingRatesList = existingRates.results || [];

  const comparison = {
    roomCategoriesToCreate: (extractedConfig.roomCategories || []).filter(
      (cat: any) => !existingTypesList.some((ex: any) => ex.name.toLowerCase() === cat.name?.toLowerCase())
    ),
    roomCategoriesToUpdate: (extractedConfig.roomCategories || []).filter(
      (cat: any) => existingTypesList.some((ex: any) => ex.name.toLowerCase() === cat.name?.toLowerCase())
    ),
    roomsToCreate: (extractedConfig.physicalRooms || []).filter(
      (rm: any) => !existingRoomsList.some((ex: any) => String(ex.room_number) === String(rm.roomNumber))
    ),
    ratePlansToCreate: (extractedConfig.ratePlans || []).filter(
      (rp: any) => !existingRatesList.some((ex: any) => ex.name.toLowerCase() === rp.name?.toLowerCase())
    ),
    ambiguities: extractedConfig.missingOrAmbiguous || [],
  };

  // 4. Save or update draft in D1
  await c.env.DB.prepare(
    `INSERT INTO property_setup_drafts (
      id, property_id, tenant_id, session_title, status,
      raw_input_chunks, extracted_draft, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      raw_input_chunks = excluded.raw_input_chunks,
      extracted_draft = excluded.extracted_draft,
      updated_at = excluded.updated_at`
  )
    .bind(
      draftId,
      propertyId,
      tenantId,
      sessionTitle,
      JSON.stringify(rawChunks),
      JSON.stringify(extractedConfig),
      now,
      now
    )
    .run();

  return c.json({
    success: true,
    draftId,
    sessionTitle,
    extractedDraft: extractedConfig,
    comparison,
    rawChunksCount: rawChunks.length,
    modelUsed: groqRes.modelUsed,
  });
});

// -----------------------------------------------------------------------------
// 2. GET EXISTING DRAFT SESSION BY ID
// -----------------------------------------------------------------------------
propertySetupRoutes.get('/draft/:id', async (c) => {
  const tenantId = c.get('tenantId')!;
  const draftId = c.req.param('id');

  const draft: any = await c.env.DB.prepare(
    `SELECT * FROM property_setup_drafts WHERE id = ? AND tenant_id = ?`
  )
    .bind(draftId, tenantId)
    .first();

  if (!draft) {
    return c.json({ error: 'Setup draft not found' }, 404);
  }

  const extracted = draft.extracted_draft ? JSON.parse(draft.extracted_draft) : {};
  const chunks = draft.raw_input_chunks ? JSON.parse(draft.raw_input_chunks) : [];

  return c.json({
    draft: {
      id: draft.id,
      propertyId: draft.property_id,
      sessionTitle: draft.session_title,
      status: draft.status,
      extractedDraft: extracted,
      rawChunks: chunks,
      createdAt: draft.created_at,
      updatedAt: draft.updated_at,
    },
  });
});

// -----------------------------------------------------------------------------
// 3. EDIT / UPDATE DRAFT CONFIGURATION (Owner manually tweaks values)
// -----------------------------------------------------------------------------
propertySetupRoutes.put('/draft/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const draftId = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const existing: any = await c.env.DB.prepare(
    `SELECT * FROM property_setup_drafts WHERE id = ? AND tenant_id = ?`
  )
    .bind(draftId, tenantId)
    .first();

  if (!existing) {
    return c.json({ error: 'Setup draft not found' }, 404);
  }

  const updatedConfig = body.extractedDraft || {};

  await c.env.DB.prepare(
    `UPDATE property_setup_drafts SET extracted_draft = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`
  )
    .bind(JSON.stringify(updatedConfig), now, draftId, tenantId)
    .run();

  return c.json({
    success: true,
    message: 'Draft configuration updated.',
    extractedDraft: updatedConfig,
  });
});

// -----------------------------------------------------------------------------
// 4. APPLY APPROVED SETUP DRAFT (Authenticated execution of real changes)
// -----------------------------------------------------------------------------
propertySetupRoutes.post('/draft/:id/apply', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const draftId = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);

  const draft: any = await c.env.DB.prepare(
    `SELECT * FROM property_setup_drafts WHERE id = ? AND tenant_id = ?`
  )
    .bind(draftId, tenantId)
    .first();

  if (!draft) {
    return c.json({ error: 'Setup draft not found' }, 404);
  }

  if (draft.status === 'applied') {
    return c.json({ error: 'This draft has already been applied.' }, 400);
  }

  const config = draft.extracted_draft ? JSON.parse(draft.extracted_draft) : {};
  const propertyId = draft.property_id;

  const appliedSummary: {
    roomCategoriesCreated: number;
    roomsCreated: number;
    ratePlansCreated: number;
    taxRulesCreated: number;
    profileUpdated: boolean;
  } = {
    roomCategoriesCreated: 0,
    roomsCreated: 0,
    ratePlansCreated: 0,
    taxRulesCreated: 0,
    profileUpdated: false,
  };

  // 1. Update Property details if provided
  if (config.propertyDetails) {
    const pd = config.propertyDetails;
    await c.env.DB.prepare(
      `UPDATE properties SET
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address_line1 = COALESCE(?, address_line1),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        check_in_time = COALESCE(?, check_in_time),
        check_out_time = COALESCE(?, check_out_time),
        updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    )
      .bind(
        pd.phone || null,
        pd.email || null,
        pd.address || null,
        pd.city || null,
        pd.state || null,
        pd.checkInTime || null,
        pd.checkOutTime || null,
        now,
        propertyId,
        tenantId
      )
      .run();
    appliedSummary.profileUpdated = true;
  }

  // Map category name -> room_type_id for room/rate associations
  const categoryIdMap: Record<string, string> = {};

  // Fetch existing categories to reuse IDs
  const existingTypes: any = await c.env.DB.prepare(
    `SELECT id, name FROM room_types WHERE property_id = ? AND tenant_id = ?`
  )
    .bind(propertyId, tenantId)
    .all();

  for (const ex of existingTypes.results || []) {
    categoryIdMap[ex.name.toLowerCase()] = ex.id;
  }

  // 2. Create Room Categories
  if (config.roomCategories && Array.isArray(config.roomCategories)) {
    for (const cat of config.roomCategories) {
      if (!cat.name) continue;
      const lowerName = cat.name.toLowerCase();

      if (!categoryIdMap[lowerName]) {
        const typeId = `rt_${crypto.randomUUID().slice(0, 8)}`;
        const code = (cat.code || cat.name.slice(0, 3)).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const basePricePaise = Math.round((Number(cat.basePriceRupees) || 2000) * 100);
        const extraAdultPaise = Math.round((Number(cat.extraAdultPriceRupees) || 0) * 100);

        await c.env.DB.prepare(
          `INSERT INTO room_types (
            id, property_id, tenant_id, name, code,
            base_occupancy, max_occupancy, base_price_paise, extra_adult_price_paise,
            description, amenities, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
        )
          .bind(
            typeId,
            propertyId,
            tenantId,
            cat.name.trim(),
            code,
            Number(cat.baseOccupancy) || 2,
            Number(cat.maxOccupancy) || 3,
            basePricePaise,
            extraAdultPaise,
            cat.description || null,
            cat.amenities ? JSON.stringify(cat.amenities) : null
          )
          .run();

        categoryIdMap[lowerName] = typeId;
        appliedSummary.roomCategoriesCreated++;
      }
    }
  }

  // 3. Create Physical Rooms
  if (config.physicalRooms && Array.isArray(config.physicalRooms)) {
    for (const rm of config.physicalRooms) {
      if (!rm.roomNumber) continue;
      const catId = rm.roomCategoryName
        ? categoryIdMap[rm.roomCategoryName.toLowerCase()] || Object.values(categoryIdMap)[0]
        : Object.values(categoryIdMap)[0];

      if (catId) {
        const roomId = `rm_${crypto.randomUUID().slice(0, 8)}`;
        try {
          await c.env.DB.prepare(
            `INSERT INTO rooms (
              id, property_id, tenant_id, room_type_id, room_number, floor,
              status, housekeeping_status, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'available', 'clean', 1, ?, ?)`
          )
            .bind(
              roomId,
              propertyId,
              tenantId,
              catId,
              String(rm.roomNumber).trim(),
              rm.floor || '1st Floor',
              now,
              now
            )
            .run();
          appliedSummary.roomsCreated++;
        } catch {
          // Skip if room number already exists
        }
      }
    }
  }

  // 4. Create Rate Plans
  if (config.ratePlans && Array.isArray(config.ratePlans)) {
    for (const rp of config.ratePlans) {
      if (!rp.name) continue;
      const catId = rp.roomCategoryName ? categoryIdMap[rp.roomCategoryName.toLowerCase()] : null;
      const planId = `rp_${crypto.randomUUID().slice(0, 8)}`;
      const planCode = (rp.code || rp.name.slice(0, 4)).toUpperCase().replace(/[^A-Z0-9]/g, '');

      try {
        await c.env.DB.prepare(
          `INSERT INTO rate_plans (
            id, property_id, tenant_id, room_type_id, name, code,
            meal_plan, price_multiplier, surcharge_paise, is_non_refundable, is_active,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        )
          .bind(
            planId,
            propertyId,
            tenantId,
            catId || null,
            rp.name.trim(),
            planCode,
            rp.mealPlan || 'EP',
            Number(rp.priceMultiplier) || 100,
            Math.round((Number(rp.surchargeRupees) || 0) * 100),
            rp.isNonRefundable ? 1 : 0,
            now,
            now
          )
          .run();
        appliedSummary.ratePlansCreated++;
      } catch {
        // Skip duplicate
      }
    }
  }

  // 5. Create Custom Tax Rules
  if (config.taxConfiguration?.customRules && Array.isArray(config.taxConfiguration.customRules)) {
    for (const tr of config.taxConfiguration.customRules) {
      if (!tr.name) continue;
      const ruleId = `tax_${crypto.randomUUID().slice(0, 8)}`;
      const rateBps = Math.round((Number(tr.ratePercentage) || 0) * 100);
      const fixedPaise = Math.round((Number(tr.fixedAmountRupees) || 0) * 100);

      await c.env.DB.prepare(
        `INSERT INTO property_tax_rules (
          id, property_id, tenant_id, name, tax_type, rate_basis_points,
          fixed_amount_paise, scope, frequency, is_inclusive, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      )
        .bind(
          ruleId,
          propertyId,
          tenantId,
          tr.name.trim(),
          tr.taxType || 'percentage',
          rateBps,
          fixedPaise,
          tr.scope || 'room',
          tr.frequency || 'per_stay',
          tr.isInclusive ? 1 : 0,
          now,
          now
        )
        .run();
      appliedSummary.taxRulesCreated++;
    }
  }

  // 6. Update GST in settings if specified
  if (config.taxConfiguration?.gstNumber) {
    await c.env.DB.prepare(
      `UPDATE property_settings SET gst_number = ?, updated_at = ? WHERE property_id = ? AND tenant_id = ?`
    )
      .bind(config.taxConfiguration.gstNumber.trim().toUpperCase(), now, propertyId, tenantId)
      .run();
  }

  // Mark draft as applied
  await c.env.DB.prepare(
    `UPDATE property_setup_drafts SET status = 'applied', applied_entities = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`
  )
    .bind(JSON.stringify(appliedSummary), now, draftId, tenantId)
    .run();

  await recordAuditLog(c, {
    tenantId,
    userId: user.uid,
    action: 'APPLY_SETUP_DRAFT',
    resourceType: 'property_setup_drafts',
    resourceId: draftId,
    newValues: appliedSummary,
  });

  return c.json({
    success: true,
    message: 'Property configuration successfully created and applied!',
    appliedSummary,
  });
});
