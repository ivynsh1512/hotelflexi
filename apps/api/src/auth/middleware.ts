import { MiddlewareHandler } from 'hono';
import { Env, AppVariables, TenantRole } from '../types';
import { verifyFirebaseToken, isSuperAdmin } from './firebase';

export const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: AppVariables }> = async (
  c,
  next
) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or malformed Authorization header' }, 401);
  }

  const token = authHeader.substring(7).trim();
  const user = await verifyFirebaseToken(token);

  if (!user) {
    return c.json({ error: 'Unauthorized: Invalid or expired Firebase ID token' }, 401);
  }

  c.set('user', user);
  await next();
};

export const superAdminMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: AppVariables }> = async (
  c,
  next
) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized: Authentication required' }, 401);
  }

  const adminEmails = c.env.ADMIN_EMAILS;
  const isAuthorized = isSuperAdmin(user.email, adminEmails, user.email_verified);

  if (!isAuthorized) {
    return c.json(
      {
        error: 'Forbidden: You do not have super-admin privileges',
        code: 'SUPER_ADMIN_REQUIRED',
      },
      403
    );
  }

  await next();
};

export const tenantMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: AppVariables }> = async (
  c,
  next
) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized: Authentication required' }, 401);
  }

  // Tenant ID from Header, Param or Query
  const tenantId =
    c.req.header('X-Tenant-ID') ||
    c.req.param('tenantId') ||
    c.req.query('tenant_id');

  if (!tenantId) {
    return c.json({ error: 'Bad Request: Missing tenant identification (X-Tenant-ID header)' }, 400);
  }

  // Fetch membership & tenant status from D1
  const row: any = await c.env.DB.prepare(
    `SELECT tm.id, tm.tenant_id, tm.user_id, tm.role, tm.permissions,
            t.name as tenant_name, t.account_access_status, t.subscription_status, t.suspension_reason,
            t.current_plan_id, t.trial_ends_at, t.current_period_ends_at
     FROM tenant_memberships tm
     JOIN tenants t ON t.id = tm.tenant_id
     WHERE tm.tenant_id = ? AND tm.user_id = ?`
  )
    .bind(tenantId, user.uid)
    .first();

  if (!row) {
    return c.json({ error: 'Forbidden: You are not a member of this hotel organization' }, 403);
  }

  const now = Math.floor(Date.now() / 1000);
  let accessStatus = row.account_access_status || 'active';
  let subStatus = row.subscription_status || 'trial';
  let suspensionReason = row.suspension_reason;

  // 1. Auto-lock when 14-day free trial has expired
  const isTrial = subStatus === 'trial' || subStatus === 'trialing';
  if (isTrial && row.trial_ends_at && row.trial_ends_at < now) {
    if (accessStatus !== 'locked') {
      accessStatus = 'locked';
      subStatus = 'expired';
      suspensionReason = 'Your 14-day free trial has expired. Please choose a subscription plan and complete payment to unlock your hotel operations.';
      c.env.DB.prepare(
        `UPDATE tenants
         SET account_access_status = 'locked',
             subscription_status = 'expired',
             suspension_reason = ?,
             updated_at = ?
         WHERE id = ?`
      )
        .bind(suspensionReason, now, tenantId)
        .run()
        .catch(() => {});
    }
  }

  // 2. Auto-lock when paid subscription period has expired (non-free plans)
  if (
    subStatus === 'active' &&
    row.current_plan_id &&
    row.current_plan_id !== 'starter' &&
    row.current_period_ends_at &&
    row.current_period_ends_at < now
  ) {
    if (accessStatus !== 'locked') {
      accessStatus = 'locked';
      subStatus = 'past_due';
      suspensionReason = 'Your subscription period has expired. Please renew your subscription to continue managing your hotel.';
      c.env.DB.prepare(
        `UPDATE tenants
         SET account_access_status = 'locked',
             subscription_status = 'past_due',
             suspension_reason = ?,
             updated_at = ?
         WHERE id = ?`
      )
        .bind(suspensionReason, now, tenantId)
        .run()
        .catch(() => {});
    }
  }

  // If locked or suspended, restrict all operational actions unless accessing subscription / support / properties
  if (accessStatus === 'suspended' || accessStatus === 'locked') {
    const path = c.req.path;
    const isAllowedRecoveryRoute =
      path.includes('/subscriptions') ||
      path.includes('/support') ||
      path.endsWith('/properties');

    if (!isAllowedRecoveryRoute) {
      return c.json(
        {
          error: 'Tenant access restricted',
          status: accessStatus,
          reason: suspensionReason || 'Please complete payment to unlock your hotel workspace.',
          locked: true,
          requiresPayment: true,
          trialExpired: isTrial && row.trial_ends_at && row.trial_ends_at < now,
          subscriptionExpired:
            subStatus === 'past_due' ||
            Boolean(row.current_period_ends_at && row.current_period_ends_at < now),
        },
        403
      );
    }
  }

  c.set('tenantId', tenantId);
  c.set('membership', {
    id: row.id,
    tenant_id: row.tenant_id,
    user_id: row.user_id,
    role: row.role as TenantRole,
    permissions: row.permissions,
    tenant_name: row.tenant_name,
    account_access_status: accessStatus,
    subscription_status: subStatus,
  });

  await next();
};

export function requireRole(allowedRoles: TenantRole[]) {
  const handler: MiddlewareHandler<{ Bindings: Env; Variables: AppVariables }> = async (c, next) => {
    const membership = c.get('membership');
    if (!membership) {
      return c.json({ error: 'Forbidden: Tenant membership context missing' }, 403);
    }

    // Owner role always has full access within their tenant
    if (membership.role === 'owner' || allowedRoles.includes(membership.role)) {
      return await next();
    }

    return c.json(
      {
        error: `Forbidden: Action requires one of [${allowedRoles.join(', ')}] role. Current role is ${membership.role}`,
      },
      403
    );
  };
  return handler;
}
