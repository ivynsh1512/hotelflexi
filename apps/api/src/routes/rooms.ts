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
       extra_adult_price_paise = COALESCE(?, extra_adult_price_paise),
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
      body.extraAdultPricePaise !== undefined ? Math.round(body.extraAdultPricePaise) : null,
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

  if (c.req.path.includes('room-types')) {
    let rtQuery = `SELECT rt.*, (SELECT COUNT(*) FROM rooms r WHERE r.room_type_id = rt.id AND r.is_active = 1) as total_units
                 FROM room_types rt WHERE rt.tenant_id = ? AND rt.is_active = 1`;
    const rtParams: any[] = [tenantId];
    if (propertyId) {
      rtQuery += ` AND rt.property_id = ?`;
      rtParams.push(propertyId);
    }
    rtQuery += ` ORDER BY rt.base_price_paise ASC`;
    const rtRows = await c.env.DB.prepare(rtQuery).bind(...rtParams).all();
    return c.json({ roomTypes: rtRows.results || [] });
  }
  const status = c.req.query('status');

  let query = `
    SELECT r.*, rt.name as room_type_name, rt.code as room_type_code,
           rt.base_price_paise, rt.weekend_price_paise,
           rb.id as active_block_id,
           rb.reason as active_block_reason,
           rb.notes as active_block_notes,
           rb.start_date as active_block_start,
           rb.end_date as active_block_end
    FROM rooms r
    JOIN room_types rt ON rt.id = r.room_type_id
    LEFT JOIN room_blocks rb ON rb.room_id = r.id
      AND rb.is_active = 1
      AND rb.start_date <= date('now')
      AND rb.end_date > date('now')
    WHERE r.tenant_id = ? AND r.is_active = 1
  `;
  const params: any[] = [tenantId];

  if (propertyId) {
    query += ` AND r.property_id = ?`;
    params.push(propertyId);
  }

  query += ` ORDER BY r.room_number ASC`;

  const rows = await c.env.DB.prepare(query).bind(...params).all();
  let mappedRooms = (rows.results || []).map((r: any) => {
    const isBlocked = Boolean(r.active_block_id) || r.status === 'blocked';
    const effectiveStatus = (isBlocked && r.status !== 'occupied') ? 'blocked' : r.status;
    return {
      ...r,
      is_blocked: isBlocked ? 1 : 0,
      block_reason: r.active_block_reason || null,
      block_notes: r.active_block_notes || null,
      blocked_from: r.active_block_start || null,
      blocked_until: r.active_block_end || null,
      block_id: r.active_block_id || null,
      status: effectiveStatus,
    };
  });

  if (status) {
    mappedRooms = mappedRooms.filter((r: any) => r.status === status);
  }

  return c.json({ rooms: mappedRooms });
});

roomRoutes.post('/', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  let propertyId = body.propertyId;
  if (!propertyId) {
    const prop = await c.env.DB.prepare('SELECT id FROM properties WHERE tenant_id = ? ORDER BY created_at ASC LIMIT 1')
      .bind(tenantId)
      .first<{ id: string }>();
    if (prop) propertyId = prop.id;
  }

  if (!propertyId || !body.roomTypeId) {
    return c.json({ error: 'Property ID and Room Type ID are required' }, 400);
  }

  // Support single roomNumber or array roomNumbers
  let roomNumbers: string[] = [];
  if (Array.isArray(body.roomNumbers) && body.roomNumbers.length > 0) {
    roomNumbers = body.roomNumbers.map((rn: any) => String(rn).trim()).filter(Boolean);
  } else if (body.roomNumber) {
    roomNumbers = [String(body.roomNumber).trim()];
  }

  if (roomNumbers.length === 0) {
    return c.json({ error: 'At least one Room Number is required' }, 400);
  }

  // Deduplicate within the requested batch
  roomNumbers = Array.from(new Set(roomNumbers));

  // Find existing room numbers in this property
  const existingRows = await c.env.DB.prepare(
    'SELECT room_number FROM rooms WHERE property_id = ?'
  )
    .bind(propertyId)
    .all<{ room_number: string }>();

  const existingSet = new Set((existingRows.results || []).map((r) => r.room_number));

  const toInsert = roomNumbers.filter((num) => !existingSet.has(num));
  const skipped = roomNumbers.filter((num) => existingSet.has(num));

  if (toInsert.length === 0) {
    return c.json(
      {
        error: `All requested rooms (${skipped.join(', ')}) already exist in this property`,
        skipped,
      },
      409
    );
  }

  const insertStmts = toInsert.map((num) => {
    const roomId = `room_${crypto.randomUUID()}`;
    return c.env.DB.prepare(
      `INSERT INTO rooms (
        id, property_id, tenant_id, room_type_id, room_number, floor, status, housekeeping_status, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'available', 'clean', 1, ?, ?)`
    ).bind(
      roomId,
      propertyId,
      tenantId,
      body.roomTypeId,
      num,
      body.floor || 'Floor 1',
      now,
      now
    );
  });

  await c.env.DB.batch(insertStmts);

  await recordAuditLog(c, {
    action: 'room.created',
    resourceType: 'room',
    resourceId: toInsert[0],
    newValues: { ...body, createdCount: toInsert.length, rooms: toInsert, skipped },
  });

  return c.json({
    success: true,
    created: toInsert,
    createdCount: toInsert.length,
    skipped,
    skippedCount: skipped.length,
    message: `Successfully created ${toInsert.length} room(s)${skipped.length > 0 ? ` (${skipped.length} skipped as duplicates)` : ''}`,
  });
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

  if (body.housekeepingStatus === 'dirty') {
    const hkId = `hk_${crypto.randomUUID()}`;
    await c.env.DB.prepare(
      `INSERT INTO housekeeping_tasks (
        id, property_id, tenant_id, room_id, task_type, priority, status, notes, created_at, updated_at
      )
      SELECT ?, property_id, tenant_id, id, 'cleaning', 'urgent', 'pending', 'Room marked dirty for immediate cleaning', ?, ?
      FROM rooms WHERE id = ? AND tenant_id = ?`
    ).bind(hkId, now, now, id, tenantId).run().catch(() => {});
  } else if (body.housekeepingStatus === 'clean') {
    await c.env.DB.prepare(
      `UPDATE housekeeping_tasks SET status = 'completed', completed_at = ?, updated_at = ?
       WHERE room_id = ? AND tenant_id = ? AND status IN ('pending', 'in_progress')`
    ).bind(now, now, id, tenantId).run().catch(() => {});
  }

  await recordAuditLog(c, {
    action: 'room.status_updated',
    resourceType: 'room',
    resourceId: id,
    newValues: body,
  });

  return c.json({ success: true, message: 'Room status updated' });
});

roomRoutes.patch('/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  // If roomNumber is changing, ensure uniqueness within this property
  if (body.roomNumber) {
    const existing = await c.env.DB.prepare(
      'SELECT id FROM rooms WHERE property_id = (SELECT property_id FROM rooms WHERE id = ?) AND room_number = ? AND id != ?'
    )
      .bind(id, body.roomNumber, id)
      .first();

    if (existing) {
      return c.json({ error: `Room ${body.roomNumber} already exists in this property` }, 409);
    }
  }

  await c.env.DB.prepare(
    `UPDATE rooms SET
       room_number = COALESCE(?, room_number),
       room_type_id = COALESCE(?, room_type_id),
       floor = COALESCE(?, floor),
       status = COALESCE(?, status),
       housekeeping_status = COALESCE(?, housekeeping_status),
       updated_at = ?
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(
      body.roomNumber || null,
      body.roomTypeId || null,
      body.floor || null,
      body.status || null,
      body.housekeepingStatus || null,
      now,
      id,
      tenantId
    )
    .run();

  await recordAuditLog(c, {
    action: 'room.updated',
    resourceType: 'room',
    resourceId: id,
    newValues: body,
  });

  return c.json({ success: true, message: 'Room updated successfully' });
});

roomRoutes.delete('/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');

  await c.env.DB.prepare('UPDATE rooms SET is_active = 0 WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .run();

  return c.json({ success: true, message: 'Room removed successfully' });
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
