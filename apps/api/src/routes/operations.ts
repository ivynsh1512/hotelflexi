import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const operationsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

operationsRoutes.use('*', authMiddleware, tenantMiddleware);

// =============================================================================
// HOUSEKEEPING
// =============================================================================
operationsRoutes.get('/housekeeping', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const status = c.req.query('status');

  let sql = `
    SELECT hk.*, r.room_number, r.floor, rt.name as room_type_name, u.full_name as assigned_to_name
    FROM housekeeping_tasks hk
    JOIN rooms r ON r.id = hk.room_id
    JOIN room_types rt ON rt.id = r.room_type_id
    LEFT JOIN users u ON u.id = hk.assigned_to_user_id
    WHERE hk.tenant_id = ?
  `;
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ` AND hk.property_id = ?`;
    params.push(propertyId);
  }
  if (status) {
    sql += ` AND hk.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY hk.priority DESC, hk.scheduled_date ASC LIMIT 100`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ tasks: rows.results || [] });
});

operationsRoutes.post('/housekeeping', async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const id = `hk_${crypto.randomUUID()}`;
  const now = Math.floor(Date.now() / 1000);

  const { propertyId, roomId, taskType = 'cleaning', priority = 'medium', scheduledDate, notes, assignedToUserId } = body;

  if (!propertyId || !roomId) {
    return c.json({ error: 'Property ID and Room ID are required' }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO housekeeping_tasks (
      id, property_id, tenant_id, room_id, task_type, priority, status,
      assigned_to_user_id, scheduled_date, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      propertyId,
      tenantId,
      roomId,
      taskType,
      priority,
      assignedToUserId || null,
      scheduledDate || new Date().toISOString().split('T')[0],
      notes || null,
      now,
      now
    )
    .run();

  await recordAuditLog(c, {
    action: 'housekeeping.created',
    resourceType: 'housekeeping_task',
    resourceId: id,
    newValues: { roomId, taskType, priority },
  });

  return c.json({ success: true, id });
});

operationsRoutes.patch('/housekeeping/:id/status', async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  const status = body.status; // 'in_progress', 'completed', 'verified'

  const task: any = await c.env.DB.prepare(
    'SELECT * FROM housekeeping_tasks WHERE id = ? AND tenant_id = ?'
  )
    .bind(id, tenantId)
    .first();

  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  const statements: any[] = [
    c.env.DB.prepare(
      `UPDATE housekeeping_tasks SET
         status = ?,
         completed_at = CASE WHEN ? IN ('completed', 'verified') THEN ? ELSE completed_at END,
         updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    ).bind(status, status, now, now, id, tenantId)
  ];

  // If task completed, mark room as clean
  if (status === 'completed' || status === 'verified') {
    statements.push(
      c.env.DB.prepare(
        `UPDATE rooms SET housekeeping_status = 'clean', updated_at = ? WHERE id = ? AND tenant_id = ?`
      ).bind(now, task.room_id, tenantId)
    );
  }

  await c.env.DB.batch(statements);

  return c.json({ success: true, message: `Task status updated to ${status}` });
});

// =============================================================================
// MAINTENANCE
// =============================================================================
operationsRoutes.get('/maintenance', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const status = c.req.query('status');

  let sql = `
    SELECT m.*, r.room_number, u.full_name as assigned_to_name
    FROM maintenance_tickets m
    LEFT JOIN rooms r ON r.id = m.room_id
    LEFT JOIN users u ON u.id = m.assigned_to_user_id
    WHERE m.tenant_id = ?
  `;
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ` AND m.property_id = ?`;
    params.push(propertyId);
  }
  if (status) {
    sql += ` AND m.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY m.priority DESC, m.created_at DESC LIMIT 100`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ tickets: rows.results || [] });
});

operationsRoutes.post('/maintenance', async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const body = await c.req.json();
  const id = `maint_${crypto.randomUUID()}`;
  const now = Math.floor(Date.now() / 1000);

  const { propertyId, roomId, title, description, priority = 'medium', assignedToUserId } = body;

  if (!propertyId || !title || !description) {
    return c.json({ error: 'Property ID, title and description are required' }, 400);
  }

  const statements: any[] = [
    c.env.DB.prepare(
      `INSERT INTO maintenance_tickets (
        id, property_id, tenant_id, room_id, title, description, priority,
        status, assigned_to_user_id, created_by_user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)`
    ).bind(
      id,
      propertyId,
      tenantId,
      roomId || null,
      title,
      description,
      priority,
      assignedToUserId || null,
      user.uid,
      now,
      now
    )
  ];

  // If urgent maintenance on a room, mark room status maintenance
  if (roomId && (priority === 'urgent' || priority === 'high')) {
    statements.push(
      c.env.DB.prepare(
        `UPDATE rooms SET status = 'maintenance', updated_at = ? WHERE id = ? AND tenant_id = ?`
      ).bind(now, roomId, tenantId)
    );
  }

  await c.env.DB.batch(statements);

  return c.json({ success: true, id });
});

operationsRoutes.patch('/maintenance/:id/resolve', async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);

  const ticket: any = await c.env.DB.prepare(
    'SELECT * FROM maintenance_tickets WHERE id = ? AND tenant_id = ?'
  )
    .bind(id, tenantId)
    .first();

  if (!ticket) {
    return c.json({ error: 'Ticket not found' }, 404);
  }

  const statements: any[] = [
    c.env.DB.prepare(
      `UPDATE maintenance_tickets SET
         status = 'resolved',
         resolved_at = ?,
         cost_paise = ?,
         updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    ).bind(now, body.costPaise ? Math.round(body.costPaise) : 0, now, id, tenantId)
  ];

  if (ticket.room_id) {
    statements.push(
      c.env.DB.prepare(
        `UPDATE rooms SET status = 'available', updated_at = ? WHERE id = ? AND tenant_id = ?`
      ).bind(now, ticket.room_id, tenantId)
    );
  }

  await c.env.DB.batch(statements);

  return c.json({ success: true, message: 'Maintenance ticket resolved' });
});

// =============================================================================
// COMPLAINTS
// =============================================================================
operationsRoutes.get('/complaints', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const status = c.req.query('status');

  let sql = `SELECT * FROM complaints WHERE tenant_id = ?`;
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }
  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY created_at DESC LIMIT 100`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ complaints: rows.results || [] });
});

operationsRoutes.post('/complaints', async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const id = `cmp_${crypto.randomUUID()}`;
  const now = Math.floor(Date.now() / 1000);

  const { propertyId, reservationId, guestName, roomNumber, category = 'service', description, priority = 'medium' } = body;

  if (!propertyId || !guestName || !description) {
    return c.json({ error: 'Property ID, guest name and description are required' }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO complaints (
      id, property_id, tenant_id, reservation_id, guest_name, room_number,
      category, description, priority, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`
  )
    .bind(
      id,
      propertyId,
      tenantId,
      reservationId || null,
      guestName,
      roomNumber || null,
      category,
      description,
      priority,
      now,
      now
    )
    .run();

  await recordAuditLog(c, {
    action: 'complaint.created',
    resourceType: 'complaint',
    resourceId: id,
    newValues: { guestName, category, description },
  });

  return c.json({ success: true, id });
});

operationsRoutes.patch('/complaints/:id/resolve', async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `UPDATE complaints SET
       status = 'resolved',
       resolution_notes = ?,
       resolved_by_user_id = ?,
       resolved_at = ?,
       updated_at = ?
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(body.resolutionNotes || 'Resolved with guest satisfaction', user.uid, now, now, id, tenantId)
    .run();

  return c.json({ success: true, message: 'Complaint resolved' });
});
