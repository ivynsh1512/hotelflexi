import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const weddingRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// -----------------------------------------------------------------------------
// PUBLIC GUEST ENDPOINTS (No Auth Required)
// -----------------------------------------------------------------------------

// 1. GET Public Wedding Engine Data for Property Slug
weddingRoutes.get('/public/:slug', async (c) => {
  const slug = c.req.param('slug');

  // Find Property
  const property: any = await c.env.DB.prepare(
    `SELECT p.id, p.tenant_id, p.name, p.slug, p.address_line1, p.city, p.state, p.country,
            p.phone, p.email, p.logo_url, p.description, p.gallery_images,
            t.current_plan_id
     FROM properties p
     JOIN tenants t ON t.id = p.tenant_id
     WHERE p.slug = ?`
  )
    .bind(slug)
    .first();

  if (!property) {
    return c.json({ error: 'Property not found' }, 404);
  }

  // Gate check: Free Starter plan does not include public wedding engine
  if (property.current_plan_id === 'starter') {
    return c.json({
      error: 'Wedding Engine is not enabled on this property tier',
      isFreePlan: true,
    }, 403);
  }

  // Get Wedding Settings
  let settings: any = await c.env.DB.prepare(
    'SELECT * FROM wedding_settings WHERE property_id = ?'
  )
    .bind(property.id)
    .first();

  if (!settings || settings.is_enabled !== 1) {
    return c.json({
      error: 'Wedding Engine is currently not active for this property',
      disabled: true,
      propertyName: property.name,
    }, 404);
  }

  // Get Active Packages
  const packages = await c.env.DB.prepare(
    'SELECT * FROM wedding_packages WHERE property_id = ? AND is_active = 1 ORDER BY created_at ASC'
  )
    .bind(property.id)
    .all();

  // Get Active Decor Themes
  const decorThemes = await c.env.DB.prepare(
    'SELECT * FROM wedding_decor_themes WHERE property_id = ? AND is_active = 1 ORDER BY created_at ASC'
  )
    .bind(property.id)
    .all();

  return c.json({
    property: {
      id: property.id,
      name: property.name,
      slug: property.slug,
      address: [property.address_line1, property.city, property.state, property.country].filter(Boolean).join(', '),
      phone: property.phone,
      email: property.email,
      logoUrl: property.logo_url,
      description: property.description,
      gallery: property.gallery_images ? JSON.parse(property.gallery_images) : [],
    },
    settings: {
      ...settings,
      galleryImages: settings.gallery_images_json ? JSON.parse(settings.gallery_images_json) : [],
    },
    packages: (packages.results || []).map((p: any) => ({
      ...p,
      inclusions: p.inclusions_json ? JSON.parse(p.inclusions_json) : [],
    })),
    decorThemes: (decorThemes.results || []).map((d: any) => ({
      ...d,
      photos: d.photos_json ? JSON.parse(d.photos_json) : [],
    })),
  });
});

// 2. POST Submit Wedding Quotation Lead & Coordination Request
weddingRoutes.post('/public/:slug/inquire', async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const property: any = await c.env.DB.prepare(
    `SELECT p.id, p.tenant_id, p.name, p.email, p.phone FROM properties p WHERE p.slug = ?`
  )
    .bind(slug)
    .first();

  if (!property) {
    return c.json({ error: 'Property not found' }, 404);
  }

  const {
    guestName,
    guestPhone,
    guestEmail,
    eventDates,
    guestCount = 200,
    functionsCount = 2,
    mealPreference = 'veg',
    selectedDecorId,
    selectedPackageId,
    roomsNeeded = 0,
    estimatedTotalPaise = 0,
    specialNotes = '',
  } = body;

  if (!guestName || !guestPhone) {
    return c.json({ error: 'Guest name and phone number are required' }, 400);
  }

  const leadId = `wed_${crypto.randomUUID()}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const leadNumber = `WED-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;

  await c.env.DB.prepare(
    `INSERT INTO wedding_leads (
       id, property_id, tenant_id, lead_number, guest_name, guest_phone, guest_email,
       event_dates, guest_count, functions_count, meal_preference, selected_decor_id,
       selected_package_id, rooms_needed, estimated_total_paise, special_notes, status,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`
  ).bind(
    leadId,
    property.id,
    property.tenant_id,
    leadNumber,
    guestName,
    guestPhone,
    guestEmail || null,
    eventDates || null,
    Number(guestCount) || 0,
    Number(functionsCount) || 1,
    mealPreference,
    selectedDecorId || null,
    selectedPackageId || null,
    Number(roomsNeeded) || 0,
    Number(estimatedTotalPaise) || 0,
    specialNotes || null,
    now,
    now
  ).run();

  return c.json({
    success: true,
    message: 'Wedding quotation and coordination request received! Our events coordinator will contact you shortly.',
    leadNumber,
    leadId,
  });
});

// -----------------------------------------------------------------------------
// AUTHENTICATED PROPERTY ADMIN ENDPOINTS
// -----------------------------------------------------------------------------
export const weddingAdminRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();
weddingAdminRoutes.use('*', authMiddleware, tenantMiddleware);

// Middleware to check plan entitlement: block on free starter plan
weddingAdminRoutes.use('*', async (c, next) => {
  const tenantId = c.get('tenantId')!;
  const tenant: any = await c.env.DB.prepare('SELECT current_plan_id FROM tenants WHERE id = ?').bind(tenantId).first();
  if (tenant?.current_plan_id === 'starter') {
    return c.json({
      error: 'Wedding & Destination Engine is locked on the Free Starter tier. Upgrade to Growth or Enterprise to unlock.',
      locked: true,
    }, 403);
  }
  await next();
});

// GET Wedding Settings for property
weddingAdminRoutes.get('/settings', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  const property: any = propertyId
    ? await c.env.DB.prepare('SELECT * FROM properties WHERE id = ? AND tenant_id = ?').bind(propertyId, tenantId).first()
    : await c.env.DB.prepare('SELECT * FROM properties WHERE tenant_id = ? ORDER BY created_at ASC LIMIT 1').bind(tenantId).first();

  if (!property) {
    return c.json({ error: 'Property not found' }, 404);
  }

  let settings: any = await c.env.DB.prepare('SELECT * FROM wedding_settings WHERE property_id = ?').bind(property.id).first();

  // If no settings exist yet, create default settings
  if (!settings) {
    const id = `wset_${crypto.randomUUID()}`;
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.prepare(
      `INSERT INTO wedding_settings (
         id, tenant_id, property_id, is_enabled, title, tagline, description,
         cover_image_url, gallery_images_json, lawn_capacity, banquet_capacity,
         rooms_available_for_wedding, base_veg_plate_price_paise, base_nonveg_plate_price_paise,
         base_multicuisine_plate_price_paise, base_function_venue_charge_paise,
         contact_phone, contact_email, created_at, updated_at
       ) VALUES (?, ?, ?, 1, 'Royal Destination Wedding & Banquets', 'Experience unforgettable celebrations with royal hospitality', ?, ?, ?, 500, 300, 30, 120000, 160000, 200000, 5000000, ?, ?, ?, ?)`
    ).bind(
      id,
      tenantId,
      property.id,
      `Plan your dream wedding at ${property.name}. Grand lawn, luxury banquet halls, customized catering, and exquisite mandap decor.`,
      property.logo_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      JSON.stringify([
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=800&q=80',
      ]),
      property.phone,
      property.email,
      now,
      now
    ).run();

    settings = await c.env.DB.prepare('SELECT * FROM wedding_settings WHERE id = ?').bind(id).first();
  }

  // Fetch Packages, Decor Themes, and Leads
  const [packages, decorThemes, leads] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM wedding_packages WHERE property_id = ? ORDER BY created_at DESC').bind(property.id).all(),
    c.env.DB.prepare('SELECT * FROM wedding_decor_themes WHERE property_id = ? ORDER BY created_at DESC').bind(property.id).all(),
    c.env.DB.prepare('SELECT * FROM wedding_leads WHERE property_id = ? ORDER BY created_at DESC LIMIT 50').bind(property.id).all(),
  ]);

  return c.json({
    property: {
      id: property.id,
      name: property.name,
      slug: property.slug,
    },
    settings: {
      ...settings,
      galleryImages: settings.gallery_images_json ? JSON.parse(settings.gallery_images_json) : [],
    },
    packages: (packages.results || []).map((p: any) => ({
      ...p,
      inclusions: p.inclusions_json ? JSON.parse(p.inclusions_json) : [],
    })),
    decorThemes: (decorThemes.results || []).map((d: any) => ({
      ...d,
      photos: d.photos_json ? JSON.parse(d.photos_json) : [],
    })),
    leads: leads.results || [],
  });
});

// UPDATE Wedding Settings
weddingAdminRoutes.post('/settings', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  const { propertyId } = body;

  if (!propertyId) {
    return c.json({ error: 'Property ID is required' }, 400);
  }

  await c.env.DB.prepare(
    `UPDATE wedding_settings SET
       is_enabled = COALESCE(?, is_enabled),
       title = COALESCE(?, title),
       tagline = COALESCE(?, tagline),
       description = COALESCE(?, description),
       cover_image_url = COALESCE(?, cover_image_url),
       gallery_images_json = COALESCE(?, gallery_images_json),
       lawn_capacity = COALESCE(?, lawn_capacity),
       banquet_capacity = COALESCE(?, banquet_capacity),
       rooms_available_for_wedding = COALESCE(?, rooms_available_for_wedding),
       base_veg_plate_price_paise = COALESCE(?, base_veg_plate_price_paise),
       base_nonveg_plate_price_paise = COALESCE(?, base_nonveg_plate_price_paise),
       base_multicuisine_plate_price_paise = COALESCE(?, base_multicuisine_plate_price_paise),
       base_function_venue_charge_paise = COALESCE(?, base_function_venue_charge_paise),
       contact_phone = COALESCE(?, contact_phone),
       contact_email = COALESCE(?, contact_email),
       updated_at = ?
     WHERE property_id = ? AND tenant_id = ?`
  ).bind(
    body.isEnabled !== undefined ? (body.isEnabled ? 1 : 0) : null,
    body.title || null,
    body.tagline || null,
    body.description || null,
    body.coverImageUrl || null,
    body.galleryImages ? JSON.stringify(body.galleryImages) : null,
    body.lawnCapacity !== undefined ? Number(body.lawnCapacity) : null,
    body.banquetCapacity !== undefined ? Number(body.banquetCapacity) : null,
    body.roomsAvailable !== undefined ? Number(body.roomsAvailable) : null,
    body.baseVegPlatePaise !== undefined ? Number(body.baseVegPlatePaise) : null,
    body.baseNonvegPlatePaise !== undefined ? Number(body.baseNonvegPlatePaise) : null,
    body.baseMulticuisinePlatePaise !== undefined ? Number(body.baseMulticuisinePlatePaise) : null,
    body.baseFunctionVenueChargePaise !== undefined ? Number(body.baseFunctionVenueChargePaise) : null,
    body.contactPhone || null,
    body.contactEmail || null,
    now,
    propertyId,
    tenantId
  ).run();

  await recordAuditLog(c, {
    action: 'wedding_settings.updated',
    resourceType: 'wedding_settings',
    resourceId: propertyId,
    newValues: { isEnabled: body.isEnabled },
  });

  return c.json({ success: true, message: 'Wedding settings updated successfully' });
});

// CREATE / UPDATE Package
weddingAdminRoutes.post('/packages', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  const { id, propertyId, name, description, priceRange, coverImageUrl, maxGuests, inclusions, isActive } = body;

  if (!propertyId || !name) {
    return c.json({ error: 'Property ID and Package Name are required' }, 400);
  }

  const pkgId = id || `wpkg_${crypto.randomUUID()}`;
  const inclusionsJson = inclusions ? JSON.stringify(inclusions) : '[]';

  if (id) {
    await c.env.DB.prepare(
      `UPDATE wedding_packages SET
         name = ?, description = ?, price_range = ?, cover_image_url = ?,
         max_guests = ?, inclusions_json = ?, is_active = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    ).bind(
      name,
      description || null,
      priceRange || '₹5,00,000 - ₹10,00,000',
      coverImageUrl || null,
      maxGuests || 500,
      inclusionsJson,
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      now,
      id,
      tenantId
    ).run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO wedding_packages (
         id, property_id, tenant_id, name, description, price_range,
         cover_image_url, max_guests, inclusions_json, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).bind(
      pkgId,
      propertyId,
      tenantId,
      name,
      description || null,
      priceRange || '₹5,00,000 - ₹10,00,000',
      coverImageUrl || null,
      maxGuests || 500,
      inclusionsJson,
      now,
      now
    ).run();
  }

  return c.json({ success: true, packageId: pkgId, message: 'Package saved successfully' });
});

// DELETE Package
weddingAdminRoutes.delete('/packages/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM wedding_packages WHERE id = ? AND tenant_id = ?').bind(id, tenantId).run();
  return c.json({ success: true, message: 'Package removed' });
});

// CREATE / UPDATE Decor Theme
weddingAdminRoutes.post('/decor-themes', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  const { id, propertyId, name, description, priceRange, basePricePaise, photos, isActive } = body;

  if (!propertyId || !name) {
    return c.json({ error: 'Property ID and Theme Name are required' }, 400);
  }

  const decorId = id || `wdec_${crypto.randomUUID()}`;
  const photosJson = photos ? JSON.stringify(photos) : '[]';

  if (id) {
    await c.env.DB.prepare(
      `UPDATE wedding_decor_themes SET
         name = ?, description = ?, price_range = ?, base_price_paise = ?,
         photos_json = ?, is_active = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    ).bind(
      name,
      description || null,
      priceRange || '₹1,50,000 - ₹3,00,000',
      basePricePaise !== undefined ? Number(basePricePaise) : 15000000,
      photosJson,
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      now,
      id,
      tenantId
    ).run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO wedding_decor_themes (
         id, property_id, tenant_id, name, description, price_range,
         base_price_paise, photos_json, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).bind(
      decorId,
      propertyId,
      tenantId,
      name,
      description || null,
      priceRange || '₹1,50,000 - ₹3,00,000',
      basePricePaise !== undefined ? Number(basePricePaise) : 15000000,
      photosJson,
      now,
      now
    ).run();
  }

  return c.json({ success: true, decorId, message: 'Decoration theme saved successfully' });
});

// DELETE Decor Theme
weddingAdminRoutes.delete('/decor-themes/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM wedding_decor_themes WHERE id = ? AND tenant_id = ?').bind(id, tenantId).run();
  return c.json({ success: true, message: 'Theme removed' });
});

// UPDATE Lead Status
weddingAdminRoutes.patch('/leads/:id/status', requireRole(['owner', 'manager', 'receptionist']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `UPDATE wedding_leads SET status = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`
  ).bind(body.status || 'contacted', now, id, tenantId).run();

  return c.json({ success: true, message: 'Lead status updated' });
});
