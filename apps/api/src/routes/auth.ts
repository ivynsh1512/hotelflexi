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
       email_verified = CASE WHEN users.email_verified = 1 THEN 1 ELSE excluded.email_verified END,
       is_platform_admin = excluded.is_platform_admin,
       updated_at = excluded.updated_at`
  )
    .bind(user.uid, user.email, fullName, phone, avatarUrl, verifiedInt, adminAllowed, now, now)
    .run();

  // Auto-accept any pending team invitations for this user's email
  if (user.email) {
    try {
      const pendingInvites = await c.env.DB.prepare(
        `SELECT * FROM team_invitations WHERE LOWER(email) = LOWER(?) AND status = 'pending'`
      )
        .bind(user.email)
        .all();

      for (const inv of (pendingInvites.results || []) as any[]) {
        const memId = `mem_${crypto.randomUUID()}`;
        await c.env.DB.prepare(
          `INSERT INTO tenant_memberships (id, tenant_id, user_id, role, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(tenant_id, user_id) DO UPDATE SET role = excluded.role, updated_at = excluded.updated_at`
        )
          .bind(memId, inv.tenant_id, user.uid, inv.role, now, now)
          .run();

        await c.env.DB.prepare(
          `UPDATE team_invitations SET status = 'accepted', accepted_at = ?, updated_at = ? WHERE id = ?`
        )
          .bind(now, now, inv.id)
          .run();
      }
    } catch (e) {
      console.error('[Auth Sync] Failed to auto-accept invitations:', e);
    }
  }

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
  const now = Math.floor(Date.now() / 1000);
  const dbUser: any = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(user.uid)
    .first();

  const isPlatformAdmin = isSuperAdmin(user.email, c.env.ADMIN_EMAILS, user.email_verified);

  // Auto-accept any pending invitations if user hasn't synced yet
  if (user.email) {
    try {
      const pendingInvites = await c.env.DB.prepare(
        `SELECT * FROM team_invitations WHERE LOWER(email) = LOWER(?) AND status = 'pending'`
      )
        .bind(user.email)
        .all();

      for (const inv of (pendingInvites.results || []) as any[]) {
        const memId = `mem_${crypto.randomUUID()}`;
        await c.env.DB.prepare(
          `INSERT INTO tenant_memberships (id, tenant_id, user_id, role, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(tenant_id, user_id) DO UPDATE SET role = excluded.role, updated_at = excluded.updated_at`
        )
          .bind(memId, inv.tenant_id, user.uid, inv.role, now, now)
          .run();

        await c.env.DB.prepare(
          `UPDATE team_invitations SET status = 'accepted', accepted_at = ?, updated_at = ? WHERE id = ?`
        )
          .bind(now, now, inv.id)
          .run();
      }
    } catch (e) {
      console.error('[Auth Me] Failed to auto-accept invitations:', e);
    }
  }

  // Fetch tenants user is member of
  const memberships = await c.env.DB.prepare(
    `SELECT tm.id as membership_id, tm.role, tm.tenant_id,
            t.name as tenant_name, t.slug as tenant_slug,
            t.account_access_status, t.subscription_status, t.current_plan_id,
            t.trial_ends_at, t.current_period_ends_at, t.suspension_reason
     FROM tenant_memberships tm
     JOIN tenants t ON t.id = tm.tenant_id
     WHERE tm.user_id = ?
     ORDER BY t.created_at ASC`
  )
    .bind(user.uid)
    .all();

  const evaluatedTenants = ((memberships.results || []) as any[]).map((m) => {
    let accessStatus = m.account_access_status || 'active';
    let subStatus = m.subscription_status || 'trial';
    let suspensionReason = m.suspension_reason;

    // Check trial expiration
    const isTrial = subStatus === 'trial' || subStatus === 'trialing';
    if (isTrial && m.trial_ends_at && m.trial_ends_at < now) {
      if (accessStatus !== 'locked') {
        accessStatus = 'locked';
        subStatus = 'expired';
        suspensionReason = 'Your 14-day free trial has expired. Please choose a subscription plan and complete payment to unlock your hotel operations.';
        c.env.DB.prepare(
          `UPDATE tenants SET account_access_status = 'locked', subscription_status = 'expired', suspension_reason = ?, updated_at = ? WHERE id = ?`
        ).bind(suspensionReason, now, m.tenant_id).run().catch(() => {});
      }
    } else if (
      subStatus === 'active' &&
      m.current_plan_id &&
      m.current_plan_id !== 'starter' &&
      m.current_period_ends_at &&
      m.current_period_ends_at < now
    ) {
      if (accessStatus !== 'locked') {
        accessStatus = 'locked';
        subStatus = 'past_due';
        suspensionReason = 'Your subscription period has expired. Please renew your subscription to continue managing your hotel.';
        c.env.DB.prepare(
          `UPDATE tenants SET account_access_status = 'locked', subscription_status = 'past_due', suspension_reason = ?, updated_at = ? WHERE id = ?`
        ).bind(suspensionReason, now, m.tenant_id).run().catch(() => {});
      }
    }

    return {
      ...m,
      account_access_status: accessStatus,
      subscription_status: subStatus,
      suspension_reason: suspensionReason,
    };
  });

  return c.json({
    user: {
      id: user.uid,
      email: user.email,
      fullName: dbUser?.full_name || user.name || 'User',
      phone: dbUser?.phone || null,
      emailVerified: user.email_verified,
      isPlatformAdmin,
    },
    tenants: evaluatedTenants,
  });
});
