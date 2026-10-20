import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const propertyRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

propertyRoutes.use('*', authMiddleware, tenantMiddleware);

// List properties in tenant
propertyRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')!;
  const rows = await c.env.DB.prepare(
    `SELECT p.*, ps.gst_number, ps.gst_rate_standard, ps.invoice_prefix, ps.enable_online_booking,
            ps.razorpay_key_id, ps.razorpay_enabled, ps.upi_id,
            ps.advance_payment_policy, ps.advance_payment_percent, ps.advance_payment_fixed_paise, ps.booking_engine_terms,
            (SELECT COUNT(*) FROM rooms r WHERE r.property_id = p.id AND r.is_active = 1) as total_rooms
     FROM properties p
     LEFT JOIN property_settings ps ON ps.property_id = p.id
     WHERE p.tenant_id = ?
     ORDER BY p.created_at ASC`
  )
    .bind(tenantId)
    .all();

  const properties = (rows.results || []).map((p: any) => {
    let code = p.hotel_code;
    if (!code) {
      let hash = 0;
      for (let i = 0; i < (p.id || '').length; i++) {
        hash = (hash << 5) - hash + p.id.charCodeAt(i);
        hash |= 0;
      }
      code = (Math.abs(hash) % 90000 + 10000).toString();
      c.env.DB.prepare(`UPDATE properties SET hotel_code = ? WHERE id = ?`).bind(code, p.id).run().catch(() => {});
    }
    return {
      ...p,
      hotel_code: code,
    };
  });

  return c.json({ properties });
});

// Get property by ID
propertyRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.param('id');

  const property: any = await c.env.DB.prepare(
    `SELECT p.*, ps.gst_number, ps.gst_rate_standard, ps.gst_rate_luxury, ps.invoice_prefix,
            ps.next_invoice_number, ps.enable_online_booking, ps.payment_terms, ps.upi_id,
            ps.razorpay_key_id, ps.razorpay_enabled,
            ps.advance_payment_policy, ps.advance_payment_percent, ps.advance_payment_fixed_paise, ps.booking_engine_terms,
            CASE WHEN ps.razorpay_key_secret IS NOT NULL AND LENGTH(ps.razorpay_key_secret) > 0 THEN 1 ELSE 0 END as has_razorpay_secret
     FROM properties p
     LEFT JOIN property_settings ps ON ps.property_id = p.id
     WHERE p.id = ? AND p.tenant_id = ?`
  )
    .bind(propertyId, tenantId)
    .first();

  if (!property) {
    return c.json({ error: 'Property not found' }, 404);
  }

  let code = property.hotel_code;
  if (!code) {
    let hash = 0;
    for (let i = 0; i < (property.id || '').length; i++) {
      hash = (hash << 5) - hash + property.id.charCodeAt(i);
      hash |= 0;
    }
    code = (Math.abs(hash) % 90000 + 10000).toString();
    c.env.DB.prepare(`UPDATE properties SET hotel_code = ? WHERE id = ?`).bind(code, property.id).run().catch(() => {});
  }

  return c.json({
    property: {
      ...property,
      hotel_code: code,
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
      galleryImages: property.gallery_images ? JSON.parse(property.gallery_images) : [],
    }
  });
});

// Update property settings
propertyRoutes.patch('/:id/settings', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  // Update property details
  if (
    body.name ||
    body.description !== undefined ||
    body.address_line1 ||
    body.city ||
    body.state ||
    body.postal_code ||
    body.latitude !== undefined ||
    body.longitude !== undefined ||
    body.phone ||
    body.email ||
    body.cancellation_policy ||
    body.logo_url !== undefined ||
    body.gallery_images !== undefined ||
    body.amenities !== undefined ||
    body.child_cutoff_age !== undefined ||
    body.child_rate_paise !== undefined
  ) {
    const galleryStr = Array.isArray(body.gallery_images)
      ? JSON.stringify(body.gallery_images)
      : typeof body.gallery_images === 'string'
      ? body.gallery_images
      : null;

    const amenitiesStr = Array.isArray(body.amenities)
      ? JSON.stringify(body.amenities)
      : typeof body.amenities === 'string'
      ? body.amenities
      : null;

    await c.env.DB.prepare(
      `UPDATE properties SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         address_line1 = COALESCE(?, address_line1),
         city = COALESCE(?, city),
         state = COALESCE(?, state),
         postal_code = COALESCE(?, postal_code),
         country = COALESCE(?, country),
         latitude = COALESCE(?, latitude),
         longitude = COALESCE(?, longitude),
         phone = COALESCE(?, phone),
         email = COALESCE(?, email),
         cancellation_policy = COALESCE(?, cancellation_policy),
         logo_url = COALESCE(?, logo_url),
         gallery_images = COALESCE(?, gallery_images),
         amenities = COALESCE(?, amenities),
         child_cutoff_age = COALESCE(?, child_cutoff_age),
         child_rate_paise = COALESCE(?, child_rate_paise),
         updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    )
      .bind(
        body.name || null,
        body.description !== undefined ? body.description : null,
        body.address_line1 || null,
        body.city || null,
        body.state || null,
        body.postal_code || null,
        body.country || null,
        body.latitude ?? null,
        body.longitude ?? null,
        body.phone || null,
        body.email || null,
        body.cancellation_policy || null,
        body.logo_url ?? null,
        galleryStr,
        amenitiesStr,
        body.child_cutoff_age ?? null,
        body.child_rate_paise ?? null,
        now,
        propertyId,
        tenantId
      )
      .run();

    // Sync property name with tenant name so top header instantly reflects it
    if (body.name) {
      await c.env.DB.prepare('UPDATE tenants SET name = ?, updated_at = ? WHERE id = ?')
        .bind(body.name, now, tenantId)
        .run();
    }
  }

  // Update property settings
  if (
    body.gst_number !== undefined ||
    body.invoice_prefix ||
    body.upi_id !== undefined ||
    body.enable_online_booking !== undefined ||
    body.razorpay_key_id !== undefined ||
    body.razorpay_key_secret !== undefined ||
    body.razorpay_enabled !== undefined ||
    body.advance_payment_policy !== undefined ||
    body.advance_payment_percent !== undefined ||
    body.advance_payment_fixed_paise !== undefined ||
    body.booking_engine_terms !== undefined
  ) {
    await c.env.DB.prepare(
      `UPDATE property_settings SET
         gst_number = COALESCE(?, gst_number),
         invoice_prefix = COALESCE(?, invoice_prefix),
         upi_id = COALESCE(?, upi_id),
         enable_online_booking = COALESCE(?, enable_online_booking),
         razorpay_key_id = COALESCE(?, razorpay_key_id),
         razorpay_key_secret = COALESCE(?, razorpay_key_secret),
         razorpay_enabled = COALESCE(?, razorpay_enabled),
         advance_payment_policy = COALESCE(?, advance_payment_policy),
         advance_payment_percent = COALESCE(?, advance_payment_percent),
         advance_payment_fixed_paise = COALESCE(?, advance_payment_fixed_paise),
         booking_engine_terms = COALESCE(?, booking_engine_terms),
         updated_at = ?
       WHERE property_id = ? AND tenant_id = ?`
    )
      .bind(
        body.gst_number ?? null,
        body.invoice_prefix ?? null,
        body.upi_id ?? null,
        body.enable_online_booking !== undefined ? (body.enable_online_booking ? 1 : 0) : null,
        body.razorpay_key_id ?? null,
        body.razorpay_key_secret ?? null,
        body.razorpay_enabled !== undefined ? (body.razorpay_enabled ? 1 : 0) : null,
        body.advance_payment_policy ?? null,
        body.advance_payment_percent !== undefined ? Number(body.advance_payment_percent) : null,
        body.advance_payment_fixed_paise !== undefined ? Number(body.advance_payment_fixed_paise) : null,
        body.booking_engine_terms ?? null,
        now,
        propertyId,
        tenantId
      )
      .run();
  }

  await recordAuditLog(c, {
    action: 'property.updated',
    resourceType: 'property',
    resourceId: propertyId,
    newValues: { ...body, razorpay_key_secret: body.razorpay_key_secret ? '***' : undefined },
  });

  return c.json({ success: true, message: 'Property settings updated successfully' });
});
