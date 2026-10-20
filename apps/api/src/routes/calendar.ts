import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const calendarRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

calendarRoutes.use('*', authMiddleware, tenantMiddleware);

// Get calendar occupancy matrix for a date window (e.g. 7, 14, or 30 days)
calendarRoutes.get('/grid', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const startDate = c.req.query('start_date') || new Date().toISOString().split('T')[0];
  
  // Default window: 14 days
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + (parseInt(c.req.query('days') || '14', 10)));
  const endDate = end.toISOString().split('T')[0];

  if (!propertyId) {
    return c.json({ error: 'Property ID is required' }, 400);
  }

  // 1. Fetch all active rooms for this property
  const roomsQuery = await c.env.DB.prepare(
    `SELECT r.id, r.room_number, r.floor, r.status, r.housekeeping_status,
            rt.id as room_type_id, rt.name as room_type_name, rt.base_price_paise
     FROM rooms r
     JOIN room_types rt ON rt.id = r.room_type_id
     WHERE r.property_id = ? AND r.tenant_id = ? AND r.is_active = 1
     ORDER BY r.room_number ASC`
  )
    .bind(propertyId, tenantId)
    .all();

  const rooms = roomsQuery.results || [];

  // 2. Fetch reservations overlapping the window
  const reservationsQuery = await c.env.DB.prepare(
    `SELECT res.id, res.reservation_number, res.room_id, res.check_in_date, res.check_out_date,
            res.status, res.nightly_rate_paise, res.total_amount_paise, res.paid_amount_paise,
            res.balance_amount_paise, rg.full_name as guest_name, rg.phone as guest_phone
     FROM reservations res
     LEFT JOIN reservation_guests rg ON rg.reservation_id = res.id AND rg.is_primary = 1
     WHERE res.property_id = ? AND res.tenant_id = ?
       AND res.status NOT IN ('cancelled')
       AND res.check_in_date < ?
       AND res.check_out_date > ?`
  )
    .bind(propertyId, tenantId, endDate, startDate)
    .all();

  const reservations = reservationsQuery.results || [];

  // 3. Fetch room blocks overlapping the window
  const blocksQuery = await c.env.DB.prepare(
    `SELECT rb.id, rb.room_id, rb.start_date, rb.end_date, rb.reason, rb.notes
     FROM room_blocks rb
     WHERE rb.property_id = ? AND rb.tenant_id = ? AND rb.is_active = 1
       AND rb.start_date < ?
       AND rb.end_date > ?`
  )
    .bind(propertyId, tenantId, endDate, startDate)
    .all();

  const blocks = blocksQuery.results || [];

  return c.json({
    window: { startDate, endDate },
    rooms,
    reservations,
    blocks,
  });
});

// -----------------------------------------------------------------------------
// ROOM BLOCKS
// -----------------------------------------------------------------------------
calendarRoutes.get('/blocks', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let query = `
    SELECT rb.*, r.room_number, rt.name as room_type_name
    FROM room_blocks rb
    JOIN rooms r ON r.id = rb.room_id
    JOIN room_types rt ON rt.id = r.room_type_id
    WHERE rb.tenant_id = ? AND rb.is_active = 1
  `;
  const params: any[] = [tenantId];

  if (propertyId) {
    query += ` AND rb.property_id = ?`;
    params.push(propertyId);
  }
  query += ` ORDER BY rb.start_date DESC`;

  const rows = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ blocks: rows.results || [] });
});

calendarRoutes.post('/blocks', requireRole(['owner', 'manager', 'receptionist']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const { propertyId, roomId, roomIds, startDate, endDate, reason, notes } = body;

  const targetRoomIds: string[] = Array.isArray(roomIds) && roomIds.length > 0 
    ? roomIds 
    : roomId ? [roomId] : [];

  if (!propertyId || targetRoomIds.length === 0 || !startDate || !endDate || !reason) {
    return c.json({ error: 'Property ID, Room(s), start date, end date, and reason are required' }, 400);
  }

  // Validate present or future dates
  const todayStr = new Date().toISOString().split('T')[0];
  if (startDate < todayStr) {
    return c.json({ error: 'Please enter present or future dates. Cannot block rooms for past dates.' }, 400);
  }

  if (startDate >= endDate) {
    return c.json({ error: 'End date must be strictly after start date (inclusive check-in, exclusive check-out)' }, 400);
  }

  const blocked: string[] = [];
  const skipped: { roomId: string; reason: string }[] = [];

  for (const rId of targetRoomIds) {
    // 1. Conflict Check: Verify room has no conflicting active reservations
    const resConflict: any = await c.env.DB.prepare(
      `SELECT id, reservation_number, check_in_date, check_out_date FROM reservations
       WHERE room_id = ? AND tenant_id = ?
         AND status NOT IN ('cancelled', 'checked_out')
         AND check_in_date < ?
         AND check_out_date > ?`
    )
      .bind(rId, tenantId, endDate, startDate)
      .first();

    if (resConflict) {
      if (targetRoomIds.length === 1) {
        return c.json(
          {
            error: `Cannot block room: Conflicting reservation ${resConflict.reservation_number} exists from ${resConflict.check_in_date} to ${resConflict.check_out_date}.`,
            code: 'CONFLICT_RESERVATION',
            reservationId: resConflict.id,
          },
          409
        );
      }
      skipped.push({ rId, reason: `Conflicting reservation #${resConflict.reservation_number}` });
      continue;
    }

    // 2. Conflict Check: Verify room is not already blocked in this date range
    const blockConflict: any = await c.env.DB.prepare(
      `SELECT id, reason, start_date, end_date FROM room_blocks
       WHERE room_id = ? AND tenant_id = ? AND is_active = 1
         AND start_date < ?
         AND end_date > ?`
    )
      .bind(rId, tenantId, endDate, startDate)
      .first();

    if (blockConflict) {
      if (targetRoomIds.length === 1) {
        return c.json(
          {
            error: `Room is already blocked for '${blockConflict.reason}' between ${blockConflict.start_date} and ${blockConflict.end_date}.`,
            code: 'CONFLICT_BLOCK',
          },
          409
        );
      }
      skipped.push({ rId, reason: `Already blocked for '${blockConflict.reason}'` });
      continue;
    }

    const id = `blk_${crypto.randomUUID()}`;
    await c.env.DB.prepare(
      `INSERT INTO room_blocks (
        id, property_id, tenant_id, room_id, start_date, end_date,
        reason, notes, created_by_user_id, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    )
      .bind(id, propertyId, tenantId, rId, startDate, endDate, reason, notes || null, user.uid, now, now)
      .run();

    blocked.push(rId);

    await recordAuditLog(c, {
      action: 'room.blocked',
      resourceType: 'room_block',
      resourceId: id,
      newValues: { roomId: rId, startDate, endDate, reason },
    });
  }

  if (blocked.length === 0 && targetRoomIds.length > 1) {
    return c.json({
      error: `Could not block selected rooms due to conflicts: ${skipped.map(s => s.reason).join(', ')}`,
      skipped,
    }, 409);
  }

  return c.json({
    success: true,
    blockedCount: blocked.length,
    skippedCount: skipped.length,
    skipped,
    message: `Successfully blocked ${blocked.length} room(s) from ${startDate} to ${endDate}${skipped.length > 0 ? ` (${skipped.length} skipped due to conflicts)` : ''}`,
  });
});

calendarRoutes.delete('/blocks/:id', requireRole(['owner', 'manager', 'receptionist']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);

  const existing: any = await c.env.DB.prepare(
    'SELECT * FROM room_blocks WHERE id = ? AND tenant_id = ?'
  )
    .bind(id, tenantId)
    .first();

  if (!existing) {
    return c.json({ error: 'Room block not found' }, 404);
  }

  await c.env.DB.prepare(
    'UPDATE room_blocks SET is_active = 0, updated_at = ? WHERE id = ? AND tenant_id = ?'
  )
    .bind(now, id, tenantId)
    .run();

  await recordAuditLog(c, {
    action: 'room.unblocked',
    resourceType: 'room_block',
    resourceId: id,
    oldValues: existing,
  });

  return c.json({ success: true, message: 'Room block released' });
});
