import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const subscriptionRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

subscriptionRoutes.use('*', authMiddleware, tenantMiddleware);

// Get tenant's current plan and entitlements
subscriptionRoutes.get('/current', async (c) => {
  const tenantId = c.get('tenantId')!;

  const tenant: any = await c.env.DB.prepare(
    `SELECT t.id, t.name, t.subscription_status, t.current_plan_id, t.trial_ends_at,
            t.current_period_ends_at, sp.name as plan_name, sp.monthly_price_paise, sp.description
     FROM tenants t
     LEFT JOIN subscription_plans sp ON sp.id = t.current_plan_id
     WHERE t.id = ?`
  )
    .bind(tenantId)
    .first();

  const entitlements: any = await c.env.DB.prepare(
    'SELECT * FROM feature_entitlements WHERE tenant_id = ?'
  )
    .bind(tenantId)
    .first();

  return c.json({
    subscription: tenant,
    entitlements,
  });
});

// List all public subscription plans
subscriptionRoutes.get('/plans', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY sort_order ASC'
  ).all();

  return c.json({ plans: rows.results || [] });
});

// Upgrade / switch plan
subscriptionRoutes.post('/upgrade', requireRole(['owner']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  const planId = body.planId;

  if (!planId) {
    return c.json({ error: 'Plan ID is required' }, 400);
  }

  const plan: any = await c.env.DB.prepare(
    'SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1'
  )
    .bind(planId)
    .first();

  if (!plan) {
    return c.json({ error: 'Specified plan not found' }, 404);
  }

  // 30 days renewal from now
  const nextPeriod = now + 30 * 86400;

  await c.env.DB.prepare(
    `UPDATE tenants
     SET current_plan_id = ?,
         subscription_status = 'active',
         current_period_ends_at = ?,
         updated_at = ?
     WHERE id = ?`
  )
    .bind(planId, nextPeriod, now, tenantId)
    .run();

  // Update feature entitlements
  await c.env.DB.prepare(
    `UPDATE feature_entitlements
     SET max_properties = ?,
         max_rooms = ?,
         max_users = ?,
         has_pms = ?,
         has_booking_engine = ?,
         has_channel_manager = ?,
         max_channel_connections = ?,
         has_ai_agent = ?,
         ai_monthly_limit = ?,
         has_advanced_reports = ?,
         has_accounting = ?,
         has_multi_property = ?,
         updated_at = ?
     WHERE tenant_id = ?`
  )
    .bind(
      plan.max_properties || 1,
      plan.max_rooms || 10,
      plan.max_users || 2,
      plan.has_pms || 1,
      plan.has_booking_engine || 1,
      plan.has_channel_manager || 0,
      plan.max_channel_connections || 0,
      plan.has_ai_agent || 1,
      plan.ai_monthly_limit || 100,
      plan.has_advanced_reports || 0,
      plan.has_accounting || 0,
      plan.has_multi_property || 0,
      now,
      tenantId
    )
    .run();

  await recordAuditLog(c, {
    action: 'subscription.upgraded',
    resourceType: 'tenant_subscription',
    resourceId: tenantId,
    newValues: { planId, planName: plan.name },
  });

  return c.json({
    success: true,
    message: `Plan upgraded successfully to ${plan.name}`,
    plan,
  });
});
