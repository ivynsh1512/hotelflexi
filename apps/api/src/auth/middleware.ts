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

  if (!user.email_verified) {
    return c.json({ error: 'Forbidden: Verified email address required for super-admin access' }, 403);
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
            t.name as tenant_name, t.account_access_status, t.subscription_status, t.suspension_reason
     FROM tenant_memberships tm
     JOIN tenants t ON t.id = tm.tenant_id
     WHERE tm.tenant_id = ? AND tm.user_id = ?`
  )
    .bind(tenantId, user.uid)
    .first();

  if (!row) {
    return c.json({ error: 'Forbidden: You are not a member of this hotel organization' }, 403);
  }

  if (row.account_access_status === 'suspended' || row.account_access_status === 'locked') {
    return c.json(
      {
        error: 'Tenant access restricted',
        status: row.account_access_status,
        reason: row.suspension_reason || 'Please contact support or platform administration.',
      },
      403
    );
  }

  c.set('tenantId', tenantId);
  c.set('membership', {
    id: row.id,
    tenant_id: row.tenant_id,
    user_id: row.user_id,
    role: row.role as TenantRole,
    permissions: row.permissions,
    tenant_name: row.tenant_name,
    account_access_status: row.account_access_status,
    subscription_status: row.subscription_status,
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
