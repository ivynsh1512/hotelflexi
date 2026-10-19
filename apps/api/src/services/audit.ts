import { Context } from 'hono';
import { Env, AppVariables } from '../types';

export interface AuditParams {
  tenantId?: string;
  userId?: string;
  actorType?: 'user' | 'super_admin' | 'system' | 'ai_agent';
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
}

export async function recordAuditLog(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  params: AuditParams
) {
  try {
    const id = `audit_${crypto.randomUUID()}`;
    const user = c.get('user');
    const tenantId = params.tenantId || c.get('tenantId') || null;
    const userId = params.userId || user?.uid || null;
    const actorType = params.actorType || (user ? 'user' : 'system');
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null;
    const userAgent = c.req.header('user-agent') || null;
    const now = Math.floor(Date.now() / 1000);

    await c.env.DB.prepare(
      `INSERT INTO audit_logs (
        id, tenant_id, user_id, actor_type, action, resource_type, resource_id,
        old_values_json, new_values_json, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        tenantId,
        userId,
        actorType,
        params.action,
        params.resourceType,
        params.resourceId || null,
        params.oldValues ? JSON.stringify(params.oldValues) : null,
        params.newValues ? JSON.stringify(params.newValues) : null,
        ip,
        userAgent,
        now
      )
      .run();
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
