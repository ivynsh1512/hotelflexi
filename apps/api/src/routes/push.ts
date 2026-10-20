import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware } from '../auth/middleware';
import { isSuperAdmin } from '../auth/firebase';

export const pushRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// 1. Subscribe device to FCM Push Notifications
pushRoutes.post('/subscribe', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const tenantId = c.req.header('x-tenant-id') || null;
  const propertyId = c.req.header('x-property-id') || null;
  const body = await c.req.json().catch(() => ({}));

  const token = (body.token || '').trim();
  const deviceInfo = body.device_info || c.req.header('user-agent') || 'Browser Web App';

  if (!token) {
    return c.json({ error: 'FCM push token is required' }, 400);
  }

  const id = `push_${crypto.randomUUID()}`;
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `INSERT INTO push_subscriptions (id, tenant_id, property_id, user_id, token, device_info, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
     ON CONFLICT(token) DO UPDATE SET
       user_id = excluded.user_id,
       tenant_id = COALESCE(excluded.tenant_id, push_subscriptions.tenant_id),
       property_id = COALESCE(excluded.property_id, push_subscriptions.property_id),
       is_active = 1,
       updated_at = excluded.updated_at`
  )
    .bind(id, tenantId, propertyId, user.uid, token, deviceInfo, now, now)
    .run();

  return c.json({ success: true, subscribed: true });
});

// 2. Broadcast push notifications (from Admin or Super Admin)
pushRoutes.post('/broadcast', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const target = body.target || 'all'; // 'all', 'tenant', 'staff'
  let targetTenantId = body.tenant_id || c.req.header('x-tenant-id');
  const hotelCode = (body.hotel_code || '').trim();

  if (!targetTenantId && hotelCode) {
    const prop: any = await c.env.DB.prepare(
      `SELECT tenant_id FROM properties WHERE hotel_code = ? LIMIT 1`
    ).bind(hotelCode).first();
    if (prop?.tenant_id) {
      targetTenantId = prop.tenant_id;
    }
  }

  const title = (body.title || 'HotelFlexi Alert').trim();
  const message = (body.message || body.body || '').trim();
  const priority = body.priority || 'normal'; // 'normal', 'urgent'
  const actionUrl = body.action_url || '/app';
  const now = Math.floor(Date.now() / 1000);

  if (!message) {
    return c.json({ error: 'Notification message is required' }, 400);
  }

  // Non-super-admins can only broadcast within their own tenant
  const isPlatformAdmin = user.is_platform_admin || isSuperAdmin(user.email, c.env.ADMIN_EMAILS, user.email_verified);
  if (!isPlatformAdmin && target === 'all') {
    return c.json({ error: 'Super Admin permissions required to broadcast to all tenants' }, 403);
  }

  // Query tokens
  let tokensQuery = `SELECT token, user_id, tenant_id FROM push_subscriptions WHERE is_active = 1`;
  const binds: any[] = [];

  if (target === 'tenant' && targetTenantId) {
    tokensQuery += ` AND tenant_id = ?`;
    binds.push(targetTenantId);
  }

  const subRows = await c.env.DB.prepare(tokensQuery).bind(...binds).all();
  const tokens = subRows.results || [];

  // Record in-app notifications
  const tenantIds: string[] = [];
  if (targetTenantId) {
    tenantIds.push(targetTenantId);
  } else if (target === 'all') {
    const allTenants = await c.env.DB.prepare('SELECT id FROM tenants LIMIT 100').all();
    for (const t of (allTenants.results || [])) {
      if (t.id) tenantIds.push(t.id as string);
    }
  }

  for (const tid of tenantIds) {
    const notifId = `notif_${crypto.randomUUID()}`;
    await c.env.DB.prepare(
      `INSERT INTO notifications (id, tenant_id, title, message, category, link_url, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
    )
      .bind(
        notifId,
        tid,
        title,
        message,
        priority === 'urgent' ? 'alert' : 'broadcast',
        actionUrl,
        now
      )
      .run()
      .catch((err: any) => console.warn('Could not insert in-app notification:', err));
  }

  return c.json({
    success: true,
    recipient_count: tokens.length,
    broadcast: {
      title,
      message,
      target,
      priority,
      action_url: actionUrl,
      timestamp: now,
    },
  });
});
