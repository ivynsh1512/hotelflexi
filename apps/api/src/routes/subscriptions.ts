import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware } from '../auth/middleware';

export const subscriptionRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

subscriptionRoutes.use('*', authMiddleware, tenantMiddleware);

// Get tenant's current plan and entitlements
subscriptionRoutes.get('/current', async (c) => {
  const tenantId = c.get('tenantId')!;

  const tenant: any = await c.env.DB.prepare(
    `SELECT t.id, t.name, t.subscription_status, t.current_plan_id, t.trial_ends_at,
            t.current_period_ends_at, sp.name as plan_name, sp.monthly_price_paise
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
