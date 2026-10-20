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

  let sql = `
    SELECT c.*, u.full_name as resolved_by_name, u.email as resolved_by_email
    FROM complaints c
    LEFT JOIN users u ON u.id = c.resolved_by_user_id
    WHERE c.tenant_id = ?
  `;
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ` AND c.property_id = ?`;
    params.push(propertyId);
  }
  if (status) {
    sql += ` AND c.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY c.created_at DESC LIMIT 100`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ complaints: rows.results || [] });
});

// Real-time Siren Check for Staff Devices
operationsRoutes.get('/complaints/active-sirens', async (c) => {
  const tenantId = c.get('tenantId')!;

  // Check subscription tier (Active trials and paid tiers have full siren access)
  const tenant: any = await c.env.DB.prepare(
    'SELECT current_plan_id, subscription_status FROM tenants WHERE id = ?'
  )
    .bind(tenantId)
    .first();

  const isLocked =
    tenant?.subscription_status === 'locked' ||
    tenant?.subscription_status === 'expired';

  if (isLocked) {
    return c.json({ sirens: [], isLocked: true });
  }

  // 1. Fetch open urgent in-stay guest complaints
  const urgentRows = await c.env.DB.prepare(
    `SELECT * FROM complaints
     WHERE tenant_id = ? AND priority = 'urgent' AND status = 'open'
     ORDER BY created_at DESC LIMIT 5`
  )
    .bind(tenantId)
    .all();

  const sirens: any[] = (urgentRows.results || []).map((r: any) => ({
    id: r.id,
    guest_name: r.guest_name,
    room_number: r.room_number,
    category: r.category,
    description: r.description,
    priority: r.priority,
    status: r.status,
    created_at: r.created_at,
  }));

  // 2. Also check for unread urgent broadcast alerts dispatched to this tenant
  const twoHoursAgo = Math.floor(Date.now() / 1000) - 7200;
  const urgentAlerts = await c.env.DB.prepare(
    `SELECT * FROM notifications
     WHERE (tenant_id = ? OR tenant_id IS NULL)
       AND category = 'alert'
       AND is_read = 0
       AND created_at >= ?
     ORDER BY created_at DESC LIMIT 3`
  )
    .bind(tenantId, twoHoursAgo)
    .all();

  for (const alert of (urgentAlerts.results || [])) {
    sirens.push({
      id: alert.id,
      guest_name: 'Priority System Broadcast',
      room_number: 'URGENT',
      category: 'emergency_alert',
      description: alert.message || alert.title,
      priority: 'urgent',
      status: 'open',
      created_at: alert.created_at,
    });
  }

  // 3. Check for open urgent housekeeping requests (urgent, high, or cleaning)
  const urgentHkTasks = await c.env.DB.prepare(
    `SELECT hk.*, COALESCE(r.room_number, hk.room_id, 'Room') as room_number 
     FROM housekeeping_tasks hk
     LEFT JOIN rooms r ON r.id = hk.room_id
     WHERE hk.tenant_id = ? AND hk.status = 'pending' AND (hk.priority IN ('urgent', 'high') OR hk.task_type IN ('urgent_sanitization', 'cleaning'))
     ORDER BY hk.created_at DESC LIMIT 5`
  )
    .bind(tenantId)
    .all()
    .catch(() => ({ results: [] }));

  for (const hk of (urgentHkTasks.results || [])) {
    sirens.push({
      id: hk.id,
      guest_name: 'Room Housekeeping',
      room_number: (hk as any).room_number || 'Room',
      category: 'housekeeping',
      description: (hk as any).notes || `Housekeeping cleaning required for Room ${(hk as any).room_number}`,
      priority: (hk as any).priority || 'urgent',
      status: 'pending',
      created_at: (hk as any).created_at,
    });
  }

  // 4. Also check for rooms marked dirty requiring active housekeeping
  const dirtyRooms = await c.env.DB.prepare(
    `SELECT r.id, r.room_number, r.updated_at
     FROM rooms r
     WHERE r.tenant_id = ? AND r.housekeeping_status = 'dirty' AND r.is_active = 1
     ORDER BY r.updated_at DESC LIMIT 5`
  )
    .bind(tenantId)
    .all()
    .catch(() => ({ results: [] }));

  for (const dr of (dirtyRooms.results || [])) {
    const rNum = (dr as any).room_number || 'Room';
    const alreadyIncluded = sirens.some(s => s.room_number === rNum || s.id === `room_dirty_${(dr as any).id}`);
    if (!alreadyIncluded) {
      sirens.push({
        id: `room_dirty_${(dr as any).id}`,
        guest_name: 'Room Dirty',
        room_number: rNum,
        category: 'housekeeping',
        description: `Room ${rNum} marked dirty. Housekeeping required.`,
        priority: 'urgent',
        status: 'pending',
        created_at: (dr as any).updated_at,
      });
    }
  }

  return c.json({
    sirens,
    isLocked: false,
  });
});

// Acknowledge and Pick Complaint (Silences Siren on All Staff Devices)
operationsRoutes.patch('/complaints/:id/acknowledge', async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);
  const staffName = body.staffName || user.email?.split('@')[0] || 'Staff Member';

  if (id.startsWith('notif_')) {
    await c.env.DB.prepare(
      `UPDATE notifications SET is_read = 1 WHERE id = ?`
    ).bind(id).run();
    return c.json({
      success: true,
      message: 'Urgent broadcast alert silenced.',
    });
  }

  if (id.startsWith('room_dirty_')) {
    const roomId = id.replace('room_dirty_', '');
    await c.env.DB.prepare(
      `UPDATE rooms SET housekeeping_status = 'clean', updated_at = ? WHERE id = ? AND tenant_id = ?`
    ).bind(now, roomId, tenantId).run().catch(() => {});
    return c.json({
      success: true,
      message: `Room housekeeping accepted by ${staffName}. Siren alarm silenced.`,
    });
  }

  if (id.startsWith('hk_')) {
    await c.env.DB.prepare(
      `UPDATE housekeeping_tasks SET 
         status = 'in_progress', 
         assigned_to_user_id = ?, 
         notes = CASE WHEN notes IS NOT NULL AND notes != '' THEN notes || ' (Taken by ' || ? || ')' ELSE 'Taken by ' || ? END,
         updated_at = ? 
       WHERE id = ? AND tenant_id = ?`
    ).bind(user.uid, staffName, staffName, now, id, tenantId).run();
    return c.json({
      success: true,
      message: `Housekeeping task picked by ${staffName}. Siren alarm silenced on all devices.`,
    });
  }

  await c.env.DB.prepare(
    `UPDATE complaints SET
       status = 'investigating',
       resolved_by_user_id = ?,
       resolution_notes = ?,
       updated_at = ?
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(user.uid, `Taken by ${staffName}`, now, id, tenantId)
    .run();

  return c.json({
    success: true,
    message: `Complaint acknowledged by ${staffName}. Siren alarm silenced on all devices.`,
  });
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

// =============================================================================
// NOTIFICATIONS
// =============================================================================
operationsRoutes.get('/notifications', async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const view = c.req.query('view') || 'active'; // 'active' (default: unread only) or 'history' / 'all'

  let sql = `SELECT * FROM notifications
     WHERE tenant_id = ? AND (user_id = ? OR user_id IS NULL)`;

  if (view === 'active') {
    sql += ` AND is_read = 0`;
  }

  sql += ` ORDER BY created_at DESC LIMIT 50`;

  const rows = await c.env.DB.prepare(sql)
    .bind(tenantId, user.uid)
    .all();

  return c.json({ notifications: rows.results || [] });
});

operationsRoutes.patch('/notifications/:id/read', async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');

  await c.env.DB.prepare(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND tenant_id = ?`
  )
    .bind(id, tenantId)
    .run();

  return c.json({ success: true, message: 'Notification marked read and removed from active list' });
});

operationsRoutes.patch('/notifications/read-all', async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;

  await c.env.DB.prepare(
    `UPDATE notifications SET is_read = 1
     WHERE tenant_id = ? AND (user_id = ? OR user_id IS NULL) AND is_read = 0`
  )
    .bind(tenantId, user.uid)
    .run();

  return c.json({ success: true, message: 'All active notifications marked as read' });
});

// =============================================================================
// AUDIT LOGS (TENANT SCOPED)
// =============================================================================
operationsRoutes.get('/audit-logs', async (c) => {
  const tenantId = c.get('tenantId')!;

  const rows = await c.env.DB.prepare(
    `SELECT * FROM audit_logs
     WHERE tenant_id = ?
     ORDER BY created_at DESC LIMIT 100`
  )
    .bind(tenantId)
    .all();

  return c.json({ auditLogs: rows.results || [] });
});
