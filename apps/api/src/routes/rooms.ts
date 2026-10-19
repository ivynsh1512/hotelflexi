import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const roomRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

roomRoutes.use('*', authMiddleware, tenantMiddleware);

// -----------------------------------------------------------------------------
// ROOM TYPES
// -----------------------------------------------------------------------------
roomRoutes.get('/types', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let query = `SELECT rt.*, (SELECT COUNT(*) FROM rooms r WHERE r.room_type_id = rt.id AND r.is_active = 1) as total_units
               FROM room_types rt WHERE rt.tenant_id = ? AND rt.is_active = 1`;
  const params: any[] = [tenantId];

  if (propertyId) {
    query += ` AND rt.property_id = ?`;
    params.push(propertyId);
  }
  query += ` ORDER BY rt.base_price_paise ASC`;

  const rows = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ roomTypes: rows.results || [] });
});

roomRoutes.post('/types', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const id = `rt_${crypto.randomUUID()}`;
  const now = Math.floor(Date.now() / 1000);

  if (!body.propertyId || !body.name || !body.basePricePaise) {
    return c.json({ error: 'Property ID, name and base price are required' }, 400);
  }

  const imagesStr = Array.isArray(body.images)
    ? JSON.stringify(body.images)
    : typeof body.images === 'string'
    ? body.images
    : '[]';

  const amenitiesStr = Array.isArray(body.amenities)
    ? JSON.stringify(body.amenities)
    : typeof body.amenities === 'string'
    ? body.amenities
    : '[]';

  await c.env.DB.prepare(
    `INSERT INTO room_types (
      id, property_id, tenant_id, name, code, base_occupancy, max_occupancy,
      base_price_paise, weekend_price_paise, extra_adult_price_paise, description, amenities, images, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  )
    .bind(
      id,
      body.propertyId,
      tenantId,
      body.name,
      body.code || body.name.substring(0, 3).toUpperCase(),
      body.baseOccupancy || 2,
      body.maxOccupancy || 3,
      Math.round(body.basePricePaise),
      body.weekendPricePaise ? Math.round(body.weekendPricePaise) : null,
      body.extraAdultPricePaise ? Math.round(body.extraAdultPricePaise) : 0,
      body.description || null,
      amenitiesStr,
      imagesStr,
      now,
      now
    )
    .run();

  await recordAuditLog(c, {
    action: 'room_type.created',
    resourceType: 'room_type',
    resourceId: id,
    newValues: body,
  });

  return c.json({ success: true, id });
});

roomRoutes.patch('/types/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const imagesStr = body.images !== undefined
    ? (Array.isArray(body.images) ? JSON.stringify(body.images) : String(body.images))
    : null;

  const amenitiesStr = body.amenities !== undefined
    ? (Array.isArray(body.amenities) ? JSON.stringify(body.amenities) : String(body.amenities))
    : null;

  await c.env.DB.prepare(
    `UPDATE room_types SET
       name = COALESCE(?, name),
       base_price_paise = COALESCE(?, base_price_paise),
       weekend_price_paise = COALESCE(?, weekend_price_paise),
       base_occupancy = COALESCE(?, base_occupancy),
       max_occupancy = COALESCE(?, max_occupancy),
       description = COALESCE(?, description),
       amenities = COALESCE(?, amenities),
       images = COALESCE(?, images),
       updated_at = ?
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(
      body.name ?? null,
      body.basePricePaise ? Math.round(body.basePricePaise) : null,
      body.weekendPricePaise ? Math.round(body.weekendPricePaise) : null,
      body.baseOccupancy ?? null,
      body.maxOccupancy ?? null,
      body.description ?? null,
      amenitiesStr,
      imagesStr,
      now,
      id,
      tenantId
    )
    .run();

  await recordAuditLog(c, {
    action: 'room_type.updated',
    resourceType: 'room_type',
    resourceId: id,
    newValues: body,
  });

  return c.json({ success: true, message: 'Room type updated' });
});

// -----------------------------------------------------------------------------
// ROOMS
// -----------------------------------------------------------------------------
roomRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const status = c.req.query('status');

  let query = `
    SELECT r.*, rt.name as room_type_name, rt.code as room_type_code,
           rt.base_price_paise, rt.weekend_price_paise
    FROM rooms r
    JOIN room_types rt ON rt.id = r.room_type_id
    WHERE r.tenant_id = ? AND r.is_active = 1
  `;
  const params: any[] = [tenantId];

  if (propertyId) {
    query += ` AND r.property_id = ?`;
    params.push(propertyId);
  }
  if (status) {
    query += ` AND r.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY r.room_number ASC`;

  const rows = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ rooms: rows.results || [] });
});

roomRoutes.post('/', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const id = `room_${crypto.randomUUID()}`;
  const now = Math.floor(Date.now() / 1000);

  if (!body.propertyId || !body.roomTypeId || !body.roomNumber) {
    return c.json({ error: 'Property ID, Room Type ID, and Room Number are required' }, 400);
  }

  // Check unique room number in property
  const existing = await c.env.DB.prepare(
    'SELECT id FROM rooms WHERE property_id = ? AND room_number = ?'
  )
    .bind(body.propertyId, body.roomNumber)
    .first();

  if (existing) {
    return c.json({ error: `Room ${body.roomNumber} already exists in this property` }, 409);
  }

  await c.env.DB.prepare(
    `INSERT INTO rooms (
      id, property_id, tenant_id, room_type_id, room_number, floor, status, housekeeping_status, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'available', 'clean', 1, ?, ?)`
  )
    .bind(
      id,
      body.propertyId,
      tenantId,
      body.roomTypeId,
      body.roomNumber,
      body.floor || 'Floor 1',
      now,
      now
    )
    .run();

  await recordAuditLog(c, {
    action: 'room.created',
    resourceType: 'room',
    resourceId: id,
    newValues: body,
  });

  return c.json({ success: true, id, roomNumber: body.roomNumber });
});

roomRoutes.patch('/:id/status', async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `UPDATE rooms SET
       status = COALESCE(?, status),
       housekeeping_status = COALESCE(?, housekeeping_status),
       updated_at = ?
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(body.status || null, body.housekeepingStatus || null, now, id, tenantId)
    .run();

  await recordAuditLog(c, {
    action: 'room.status_updated',
    resourceType: 'room',
    resourceId: id,
    newValues: body,
  });

  return c.json({ success: true, message: 'Room status updated' });
});

// -----------------------------------------------------------------------------
// RATE PLANS
// -----------------------------------------------------------------------------
roomRoutes.get('/rate-plans', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let query = `SELECT * FROM rate_plans WHERE tenant_id = ? AND is_active = 1`;
  const params: any[] = [tenantId];
  if (propertyId) {
    query += ` AND property_id = ?`;
    params.push(propertyId);
  }

  const rows = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ ratePlans: rows.results || [] });
});

roomRoutes.post('/rate-plans', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const id = `rp_${crypto.randomUUID()}`;
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `INSERT INTO rate_plans (
      id, property_id, tenant_id, room_type_id, name, code, meal_plan,
      price_multiplier, surcharge_paise, is_non_refundable, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  )
    .bind(
      id,
      body.propertyId,
      tenantId,
      body.roomTypeId || null,
      body.name,
      body.code || body.name.substring(0, 3).toUpperCase(),
      body.mealPlan || 'EP',
      body.priceMultiplier || 100,
      body.surchargePaise ? Math.round(body.surchargePaise) : 0,
      body.isNonRefundable ? 1 : 0,
      now,
      now
    )
    .run();

  return c.json({ success: true, id });
});
