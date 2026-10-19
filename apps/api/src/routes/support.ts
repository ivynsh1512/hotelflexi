import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, superAdminMiddleware } from '../auth/middleware';

export const supportRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// -----------------------------------------------------------------------------
// HOTELIER SUPPORT ROUTES (Raise Complaints & Technical Bugs)
// -----------------------------------------------------------------------------
supportRoutes.use('/tickets', authMiddleware, tenantMiddleware);

// List tickets submitted by current property / tenant
supportRoutes.get('/tickets', async (c) => {
  const tenantId = c.get('tenantId')!;

  const rows = await c.env.DB.prepare(
    `SELECT * FROM support_tickets WHERE tenant_id = ? ORDER BY created_at DESC`
  )
    .bind(tenantId)
    .all();

  return c.json({ tickets: rows.results || [] });
});

// Raise new support ticket / technical complaint
supportRoutes.post('/tickets', async (c) => {
  const user = c.get('user')!;
  const tenantId = c.get('tenantId')!;
  const propertyId = c.get('propertyId') || c.req.header('x-property-id');
  const body = await c.req.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);

  // Fetch property details to retrieve 5-digit hotel_code
  let property: any = await c.env.DB.prepare(
    `SELECT id, name, hotel_code FROM properties WHERE (id = ? OR tenant_id = ?) LIMIT 1`
  )
    .bind(propertyId || '', tenantId)
    .first();

  let hotelCode = property?.hotel_code;
  if (!hotelCode) {
    // Generate deterministic or random 5-digit code if missing
    hotelCode = Math.floor(10000 + Math.random() * 90000).toString();
    if (property?.id) {
      await c.env.DB.prepare(`UPDATE properties SET hotel_code = ? WHERE id = ?`).bind(hotelCode, property.id).run();
    }
  }

  const hotelName = property?.name || 'Hotel Workspace';
  const ticketId = `tick_${crypto.randomUUID()}`;
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const ticketNumber = `TICK-${randomNum}`;

  const category = body.category || 'technical_bug'; // 'technical_bug', 'payment_issue', 'channel_sync', 'feature_request', 'other'
  const priority = body.priority || 'medium'; // 'low', 'medium', 'high', 'urgent'
  const subject = (body.subject || '').trim();
  const description = (body.description || '').trim();
  const requesterPhone = body.phone || user.phone || '';

  if (!subject || !description) {
    return c.json({ error: 'Subject and description are required' }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO support_tickets (
      id, ticket_number, tenant_id, property_id, hotel_code, hotel_name,
      requester_name, requester_email, requester_phone, category, priority,
      subject, description, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`
  )
    .bind(
      ticketId,
      ticketNumber,
      tenantId,
      property?.id || tenantId,
      hotelCode,
      hotelName,
      user.name || user.email.split('@')[0],
      user.email,
      requesterPhone,
      category,
      priority,
      subject,
      description,
      now,
      now
    )
    .run();

  return c.json({
    success: true,
    ticket: {
      id: ticketId,
      ticket_number: ticketNumber,
      hotel_code: hotelCode,
      hotel_name: hotelName,
      category,
      priority,
      subject,
      status: 'open',
      created_at: now,
    },
  });
});

// -----------------------------------------------------------------------------
// SUPER ADMIN SUPPORT ROUTES (Review all complaints with 5-digit property code)
// -----------------------------------------------------------------------------
export const adminSupportRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();
adminSupportRoutes.use('*', authMiddleware, superAdminMiddleware);

adminSupportRoutes.get('/tickets', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT * FROM support_tickets ORDER BY
       CASE priority
         WHEN 'urgent' THEN 1
         WHEN 'high' THEN 2
         WHEN 'medium' THEN 3
         ELSE 4
       END,
       created_at DESC`
  ).all();

  return c.json({ tickets: rows.results || [] });
});

adminSupportRoutes.patch('/tickets/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const status = body.status; // 'open', 'in_progress', 'resolved', 'closed'
  const resolutionNotes = body.resolution_notes;
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `UPDATE support_tickets SET
       status = COALESCE(?, status),
       resolution_notes = COALESCE(?, resolution_notes),
       updated_at = ?
     WHERE id = ?`
  )
    .bind(status || null, resolutionNotes || null, now, id)
    .run();

  return c.json({ success: true, updated: true });
});
