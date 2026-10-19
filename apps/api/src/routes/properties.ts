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
            (SELECT COUNT(*) FROM rooms r WHERE r.property_id = p.id AND r.is_active = 1) as total_rooms
     FROM properties p
     LEFT JOIN property_settings ps ON ps.property_id = p.id
     WHERE p.tenant_id = ?
     ORDER BY p.created_at ASC`
  )
    .bind(tenantId)
    .all();

  return c.json({ properties: rows.results || [] });
});

// Get property by ID
propertyRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.param('id');

  const property: any = await c.env.DB.prepare(
    `SELECT p.*, ps.gst_number, ps.gst_rate_standard, ps.gst_rate_luxury, ps.invoice_prefix,
            ps.next_invoice_number, ps.enable_online_booking, ps.payment_terms, ps.upi_id
     FROM properties p
     LEFT JOIN property_settings ps ON ps.property_id = p.id
     WHERE p.id = ? AND p.tenant_id = ?`
  )
    .bind(propertyId, tenantId)
    .first();

  if (!property) {
    return c.json({ error: 'Property not found' }, 404);
  }

  return c.json({ property });
});

// Update property settings
propertyRoutes.patch('/:id/settings', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  // Update property details
  if (body.name || body.address_line1 || body.phone || body.email || body.cancellation_policy) {
    await c.env.DB.prepare(
      `UPDATE properties SET
         name = COALESCE(?, name),
         address_line1 = COALESCE(?, address_line1),
         city = COALESCE(?, city),
         state = COALESCE(?, state),
         phone = COALESCE(?, phone),
         email = COALESCE(?, email),
         cancellation_policy = COALESCE(?, cancellation_policy),
         updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    )
      .bind(
        body.name || null,
        body.address_line1 || null,
        body.city || null,
        body.state || null,
        body.phone || null,
        body.email || null,
        body.cancellation_policy || null,
        now,
        propertyId,
        tenantId
      )
      .run();
  }

  // Update property settings
  if (body.gst_number !== undefined || body.invoice_prefix || body.upi_id || body.enable_online_booking !== undefined) {
    await c.env.DB.prepare(
      `UPDATE property_settings SET
         gst_number = COALESCE(?, gst_number),
         invoice_prefix = COALESCE(?, invoice_prefix),
         upi_id = COALESCE(?, upi_id),
         enable_online_booking = COALESCE(?, enable_online_booking),
         updated_at = ?
       WHERE property_id = ? AND tenant_id = ?`
    )
      .bind(
        body.gst_number ?? null,
        body.invoice_prefix ?? null,
        body.upi_id ?? null,
        body.enable_online_booking !== undefined ? (body.enable_online_booking ? 1 : 0) : null,
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
    newValues: body,
  });

  return c.json({ success: true, message: 'Property settings updated' });
});
