import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware } from '../auth/middleware';
import { isSuperAdmin } from '../auth/firebase';
import { recordAuditLog } from '../services/audit';

export const authRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// Sync user from Firebase Auth to D1
authRoutes.post('/sync', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);

  const fullName = body.name || user.name || 'HotelFlexi User';
  const phone = body.phone || null;
  const avatarUrl = body.picture || user.picture || null;
  const verifiedInt = user.email_verified ? 1 : 0;
  const adminAllowed = isSuperAdmin(user.email, c.env.ADMIN_EMAILS, user.email_verified) ? 1 : 0;

  await c.env.DB.prepare(
    `INSERT INTO users (id, email, full_name, phone, avatar_url, email_verified, is_platform_admin, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email,
       full_name = COALESCE(excluded.full_name, users.full_name),
       phone = COALESCE(excluded.phone, users.phone),
       avatar_url = COALESCE(excluded.avatar_url, users.avatar_url),
       email_verified = excluded.email_verified,
       is_platform_admin = excluded.is_platform_admin,
       updated_at = excluded.updated_at`
  )
    .bind(user.uid, user.email, fullName, phone, avatarUrl, verifiedInt, adminAllowed, now, now)
    .run();

  return c.json({
    success: true,
    user: {
      id: user.uid,
      email: user.email,
      fullName,
      emailVerified: user.email_verified,
      isPlatformAdmin: Boolean(adminAllowed),
    },
  });
});

// Get current user profile & tenants
authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const dbUser: any = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(user.uid)
    .first();

  const isPlatformAdmin = isSuperAdmin(user.email, c.env.ADMIN_EMAILS, user.email_verified);

  // Fetch tenants user is member of
  const memberships = await c.env.DB.prepare(
    `SELECT tm.id as membership_id, tm.role, tm.tenant_id,
            t.name as tenant_name, t.slug as tenant_slug,
            t.account_access_status, t.subscription_status, t.current_plan_id
     FROM tenant_memberships tm
     JOIN tenants t ON t.id = tm.tenant_id
     WHERE tm.user_id = ?
     ORDER BY t.created_at ASC`
  )
    .bind(user.uid)
    .all();

  return c.json({
    user: {
      id: user.uid,
      email: user.email,
      fullName: dbUser?.full_name || user.name || 'User',
      phone: dbUser?.phone || null,
      emailVerified: user.email_verified,
      isPlatformAdmin,
    },
    tenants: memberships.results || [],
  });
});
