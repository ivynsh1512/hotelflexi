import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const taxRulesRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

taxRulesRoutes.use('*', authMiddleware, tenantMiddleware);

// -----------------------------------------------------------------------------
// 1. GET ALL TAX RULES & GST CONFIGURATION FOR PROPERTY
// -----------------------------------------------------------------------------
taxRulesRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  if (!propertyId) {
    return c.json({ error: 'property_id is required' }, 400);
  }

  // 1. Fetch GST settings from property_settings
  const settings: any = await c.env.DB.prepare(
    `SELECT gst_number, gst_rate_standard, gst_rate_luxury FROM property_settings WHERE property_id = ? AND tenant_id = ?`
  )
    .bind(propertyId, tenantId)
    .first();

  // 2. Fetch custom tax rules
  const rules = await c.env.DB.prepare(
    `SELECT * FROM property_tax_rules WHERE property_id = ? AND tenant_id = ? AND is_active = 1 ORDER BY created_at ASC`
  )
    .bind(propertyId, tenantId)
    .all();

  return c.json({
    gst: {
      gstNumber: settings?.gst_number || null,
      standardRateBasisPoints: settings?.gst_rate_standard ?? 1200, // 12.00%
      luxuryRateBasisPoints: settings?.gst_rate_luxury ?? 1800,     // 18.00%
    },
    rules: rules.results || [],
  });
});

// -----------------------------------------------------------------------------
// 2. CREATE A NEW TAX OR FIXED CHARGE RULE
// -----------------------------------------------------------------------------
taxRulesRoutes.post('/', requireRole(['owner', 'manager', 'accountant']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const {
    propertyId,
    name,
    taxType = 'percentage', // 'percentage' | 'fixed'
    rateBasisPoints = 0,
    ratePercentage,
    fixedAmountPaise = 0,
    fixedAmountRupees,
    scope = 'room', // 'room' | 'fnb' | 'all'
    frequency = 'per_stay', // 'per_night' | 'per_stay' | 'per_guest'
    isInclusive = false,
  } = body;

  if (!propertyId || !name || !name.trim()) {
    return c.json({ error: 'propertyId and a valid tax name are required' }, 400);
  }

  const finalRateBps = ratePercentage !== undefined
    ? Math.round(Number(ratePercentage) * 100)
    : Math.max(0, Number(rateBasisPoints) || 0);

  const finalFixedPaise = fixedAmountRupees !== undefined
    ? Math.round(Number(fixedAmountRupees) * 100)
    : Math.max(0, Number(fixedAmountPaise) || 0);

  if (taxType === 'percentage' && finalRateBps <= 0) {
    return c.json({ error: 'Percentage tax must have a rate greater than 0%' }, 400);
  }
  if (taxType === 'fixed' && finalFixedPaise <= 0) {
    return c.json({ error: 'Fixed fee must have an amount greater than ₹0' }, 400);
  }

  const ruleId = `tax_${crypto.randomUUID().slice(0, 8)}`;

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
      name.trim(),
      taxType,
      finalRateBps,
      finalFixedPaise,
      scope,
      frequency,
      isInclusive ? 1 : 0,
      now,
      now
    )
    .run();

  await recordAuditLog(c, {
    tenantId,
    userId: user.uid,
    action: 'CREATE_TAX_RULE',
    resourceType: 'property_tax_rules',
    resourceId: ruleId,
    newValues: { name, taxType, finalRateBps, finalFixedPaise, scope, frequency },
  });

  return c.json({
    success: true,
    ruleId,
    message: `Tax rule "${name}" successfully created.`,
  });
});

// -----------------------------------------------------------------------------
// 3. UPDATE AN EXISTING TAX RULE
// -----------------------------------------------------------------------------
taxRulesRoutes.put('/:id', requireRole(['owner', 'manager', 'accountant']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const ruleId = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const existing: any = await c.env.DB.prepare(
    `SELECT * FROM property_tax_rules WHERE id = ? AND tenant_id = ?`
  )
    .bind(ruleId, tenantId)
    .first();

  if (!existing) {
    return c.json({ error: 'Tax rule not found' }, 404);
  }

  const name = body.name !== undefined ? body.name.trim() : existing.name;
  const taxType = body.taxType || existing.tax_type;
  const rateBps = body.ratePercentage !== undefined
    ? Math.round(Number(body.ratePercentage) * 100)
    : body.rateBasisPoints !== undefined
    ? Number(body.rateBasisPoints)
    : existing.rate_basis_points;

  const fixedPaise = body.fixedAmountRupees !== undefined
    ? Math.round(Number(body.fixedAmountRupees) * 100)
    : body.fixedAmountPaise !== undefined
    ? Number(body.fixedAmountPaise)
    : existing.fixed_amount_paise;

  const scope = body.scope || existing.scope;
  const frequency = body.frequency || existing.frequency;
  const isInclusive = body.isInclusive !== undefined ? (body.isInclusive ? 1 : 0) : existing.is_inclusive;
  const isActive = body.isActive !== undefined ? (body.isActive ? 1 : 0) : existing.is_active;

  await c.env.DB.prepare(
    `UPDATE property_tax_rules SET
      name = ?, tax_type = ?, rate_basis_points = ?, fixed_amount_paise = ?,
      scope = ?, frequency = ?, is_inclusive = ?, is_active = ?, updated_at = ?
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(
      name,
      taxType,
      rateBps,
      fixedPaise,
      scope,
      frequency,
      isInclusive,
      isActive,
      now,
      ruleId,
      tenantId
    )
    .run();

  await recordAuditLog(c, {
    tenantId,
    userId: user.uid,
    action: 'UPDATE_TAX_RULE',
    resourceType: 'property_tax_rules',
    resourceId: ruleId,
    newValues: { name, taxType, rateBps, fixedPaise },
  });

  return c.json({
    success: true,
    message: 'Tax rule updated successfully.',
  });
});

// -----------------------------------------------------------------------------
// 4. DELETE / DEACTIVATE A TAX RULE
// -----------------------------------------------------------------------------
taxRulesRoutes.delete('/:id', requireRole(['owner', 'manager', 'accountant']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const ruleId = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);

  const existing: any = await c.env.DB.prepare(
    `SELECT * FROM property_tax_rules WHERE id = ? AND tenant_id = ?`
  )
    .bind(ruleId, tenantId)
    .first();

  if (!existing) {
    return c.json({ error: 'Tax rule not found' }, 404);
  }

  await c.env.DB.prepare(
    `UPDATE property_tax_rules SET is_active = 0, updated_at = ? WHERE id = ? AND tenant_id = ?`
  )
    .bind(now, ruleId, tenantId)
    .run();

  await recordAuditLog(c, {
    tenantId,
    userId: user.uid,
    action: 'DELETE_TAX_RULE',
    resourceType: 'property_tax_rules',
    resourceId: ruleId,
    newValues: { name: existing.name },
  });

  return c.json({ success: true, message: 'Tax rule deactivated successfully.' });
});

// -----------------------------------------------------------------------------
// 5. UPDATE GST BRACKETS & GSTIN NUMBER IN SETTINGS
// -----------------------------------------------------------------------------
taxRulesRoutes.post('/gst-settings', requireRole(['owner', 'manager', 'accountant']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const body = await c.req.json();
  const { propertyId, gstNumber, standardRatePercent = 12, luxuryRatePercent = 18 } = body;
  const now = Math.floor(Date.now() / 1000);

  if (!propertyId) {
    return c.json({ error: 'propertyId is required' }, 400);
  }

  const standardBps = Math.round(Number(standardRatePercent) * 100);
  const luxuryBps = Math.round(Number(luxuryRatePercent) * 100);

  await c.env.DB.prepare(
    `UPDATE property_settings SET
      gst_number = ?, gst_rate_standard = ?, gst_rate_luxury = ?, updated_at = ?
     WHERE property_id = ? AND tenant_id = ?`
  )
    .bind(
      gstNumber ? gstNumber.trim().toUpperCase() : null,
      standardBps,
      luxuryBps,
      now,
      propertyId,
      tenantId
    )
    .run();

  await recordAuditLog(c, {
    tenantId,
    userId: user.uid,
    action: 'UPDATE_GST_SETTINGS',
    resourceType: 'property_settings',
    resourceId: propertyId,
    newValues: { gstNumber, standardBps, luxuryBps },
  });

  return c.json({ success: true, message: 'GST settings updated successfully.' });
});

// -----------------------------------------------------------------------------
// 6. TAX CALCULATION PREVIEW ENGINE (Calculates exact invoice breakdown)
// -----------------------------------------------------------------------------
taxRulesRoutes.post('/preview', async (c) => {
  const body = await c.req.json();
  const {
    roomRatePaise = 300000, // ₹3,000 / night default
    nights = 2,
    guests = 2,
    scope = 'room',
    customRules = [],
    includeGst = true,
  } = body;

  const roomSubtotalPaise = Math.round(Number(roomRatePaise) * Number(nights));
  const nightlyRate = Math.round(Number(roomRatePaise));

  // 1. Indian GST 12% & 18% calculation
  let gstRateBps = nightlyRate > 750000 ? 1800 : 1200; // 18% if > ₹7,500/night, else 12%
  let gstAmountPaise = includeGst ? Math.round((roomSubtotalPaise * gstRateBps) / 10000) : 0;
  const cgstPaise = Math.round(gstAmountPaise / 2);
  const sgstPaise = gstAmountPaise - cgstPaise;

  const appliedItems: Array<{
    name: string;
    type: 'percentage' | 'fixed';
    rateOrFixedLabel: string;
    amountPaise: number;
    amountRupees: string;
    isInclusive: boolean;
  }> = [];

  if (includeGst && gstAmountPaise > 0) {
    appliedItems.push({
      name: `CGST Output (${(gstRateBps / 200).toFixed(1)}%)`,
      type: 'percentage',
      rateOrFixedLabel: `${(gstRateBps / 200).toFixed(1)}%`,
      amountPaise: cgstPaise,
      amountRupees: `₹${(cgstPaise / 100).toFixed(2)}`,
      isInclusive: false,
    });
    appliedItems.push({
      name: `SGST Output (${(gstRateBps / 200).toFixed(1)}%)`,
      type: 'percentage',
      rateOrFixedLabel: `${(gstRateBps / 200).toFixed(1)}%`,
      amountPaise: sgstPaise,
      amountRupees: `₹${(sgstPaise / 100).toFixed(2)}`,
      isInclusive: false,
    });
  }

  // 2. Custom Rules calculation
  let totalCustomTaxPaise = 0;
  for (const rule of customRules) {
    if (!rule.is_active && rule.is_active !== undefined) continue;

    let itemAmountPaise = 0;
    let label = '';

    if (rule.tax_type === 'percentage') {
      const bps = Number(rule.rate_basis_points || 0);
      itemAmountPaise = Math.round((roomSubtotalPaise * bps) / 10000);
      label = `${(bps / 100).toFixed(2)}%`;
    } else {
      // Fixed amount
      const fixedPaise = Number(rule.fixed_amount_paise || 0);
      const mult = rule.frequency === 'per_night' ? nights : rule.frequency === 'per_guest' ? guests : 1;
      itemAmountPaise = fixedPaise * mult;
      label = `₹${(fixedPaise / 100).toFixed(0)} ${rule.frequency.replace('_', ' ')}`;
    }

    if (!rule.is_inclusive) {
      totalCustomTaxPaise += itemAmountPaise;
    }

    appliedItems.push({
      name: rule.name,
      type: rule.tax_type,
      rateOrFixedLabel: label,
      amountPaise: itemAmountPaise,
      amountRupees: `₹${(itemAmountPaise / 100).toFixed(2)}`,
      isInclusive: Boolean(rule.is_inclusive),
    });
  }

  const grandTotalPaise = roomSubtotalPaise + gstAmountPaise + totalCustomTaxPaise;

  return c.json({
    roomSubtotalPaise,
    roomSubtotalRupees: `₹${(roomSubtotalPaise / 100).toFixed(2)}`,
    gstAmountPaise,
    gstAmountRupees: `₹${(gstAmountPaise / 100).toFixed(2)}`,
    totalCustomTaxPaise,
    totalCustomTaxRupees: `₹${(totalCustomTaxPaise / 100).toFixed(2)}`,
    grandTotalPaise,
    grandTotalRupees: `₹${(grandTotalPaise / 100).toFixed(2)}`,
    appliedLines: appliedItems,
  });
});
