import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, superAdminMiddleware } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const adminRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// All admin endpoints require verified Firebase auth AND email on ADMIN_EMAILS allowlist
adminRoutes.use('*', authMiddleware, superAdminMiddleware);

// -----------------------------------------------------------------------------
// OVERVIEW METRICS
// -----------------------------------------------------------------------------
adminRoutes.get('/overview', async (c) => {
  // Real D1 metrics
  const tenantStats: any = await c.env.DB.prepare(
    `SELECT 
       COUNT(*) as total_tenants,
       SUM(CASE WHEN account_access_status = 'active' THEN 1 ELSE 0 END) as active_tenants,
       SUM(CASE WHEN subscription_status IN ('trial', 'trialing') THEN 1 ELSE 0 END) as trial_tenants,
       SUM(CASE WHEN account_access_status = 'suspended' THEN 1 ELSE 0 END) as suspended_tenants,
       SUM(CASE WHEN account_access_status = 'locked' THEN 1 ELSE 0 END) as locked_tenants
     FROM tenants`
  ).first();

  const propertyStats: any = await c.env.DB.prepare('SELECT COUNT(*) as total_properties FROM properties').first();
  const roomStats: any = await c.env.DB.prepare('SELECT COUNT(*) as total_rooms FROM rooms').first();

  // MRR & Platform Finance Metrics
  const activeSubs: any = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(sp.monthly_price_paise), 0) as mrr_paise
     FROM tenants t
     JOIN subscription_plans sp ON sp.id = t.current_plan_id
     WHERE t.account_access_status = 'active' AND t.subscription_status = 'active'`
  ).first();

  const mrrPaise = activeSubs?.mrr_paise || 0;
  const arrPaise = mrrPaise * 12;

  // Recent administrative audit logs
  const recentLogs = await c.env.DB.prepare(
    `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10`
  ).all();

  return c.json({
    metrics: {
      totalTenants: tenantStats?.total_tenants || 0,
      activeTenants: tenantStats?.active_tenants || 0,
      trialTenants: tenantStats?.trial_tenants || 0,
      suspendedTenants: tenantStats?.suspended_tenants || 0,
      lockedTenants: tenantStats?.locked_tenants || 0,
      totalProperties: propertyStats?.total_properties || 0,
      totalRooms: roomStats?.total_rooms || 0,
      mrrPaise,
      mrrRupees: mrrPaise / 100,
      arrPaise,
      arrRupees: arrPaise / 100,
    },
    recentLogs: recentLogs.results || [],
  });
});

// -----------------------------------------------------------------------------
// TENANTS MANAGEMENT
// -----------------------------------------------------------------------------
adminRoutes.get('/tenants', async (c) => {
  const q = c.req.query('q');

  let sql = `
    SELECT t.*, u.email as owner_email, u.full_name as owner_name, u.phone as owner_phone,
           sp.name as plan_name,
           (SELECT COUNT(*) FROM properties p WHERE p.tenant_id = t.id) as property_count,
           (SELECT COUNT(*) FROM rooms r WHERE r.tenant_id = t.id) as room_count
    FROM tenants t
    JOIN users u ON u.id = t.owner_user_id
    LEFT JOIN subscription_plans sp ON sp.id = t.current_plan_id
  `;
  const params: any[] = [];

  if (q) {
    sql += ` WHERE t.name LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?`;
    const p = `%${q}%`;
    params.push(p, p, p);
  }

  sql += ` ORDER BY t.created_at DESC`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ tenants: rows.results || [] });
});

adminRoutes.get('/tenants/:id', async (c) => {
  const id = c.req.param('id');

  const tenant: any = await c.env.DB.prepare(
    `SELECT t.*, u.email as owner_email, u.full_name as owner_name, sp.name as plan_name
     FROM tenants t
     JOIN users u ON u.id = t.owner_user_id
     LEFT JOIN subscription_plans sp ON sp.id = t.current_plan_id
     WHERE t.id = ?`
  )
    .bind(id)
    .first();

  if (!tenant) {
    return c.json({ error: 'Tenant not found' }, 404);
  }

  const properties = await c.env.DB.prepare(
    `SELECT * FROM properties WHERE tenant_id = ?`
  )
    .bind(id)
    .all();

  const members = await c.env.DB.prepare(
    `SELECT tm.*, u.email, u.full_name FROM tenant_memberships tm
     JOIN users u ON u.id = tm.user_id
     WHERE tm.tenant_id = ?`
  )
    .bind(id)
    .all();

  const entitlements = await c.env.DB.prepare(
    `SELECT * FROM feature_entitlements WHERE tenant_id = ?`
  )
    .bind(id)
    .first();

  return c.json({
    tenant,
    properties: properties.results || [],
    members: members.results || [],
    entitlements,
  });
});

// Suspend / Reactivate / Lock / Unlock Tenant Access (Supports Payment Lock)
adminRoutes.patch('/tenants/:id/status', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const { status, reason, isPaymentIssue } = body; // 'active', 'suspended', 'locked'

  if (!status || !['active', 'suspended', 'locked'].includes(status)) {
    return c.json({ error: 'Status must be one of: active, suspended, locked' }, 400);
  }

  const oldTenant: any = await c.env.DB.prepare('SELECT account_access_status, subscription_status FROM tenants WHERE id = ?')
    .bind(id)
    .first();

  if (!oldTenant) {
    return c.json({ error: 'Tenant not found' }, 404);
  }

  let newSubStatus = oldTenant.subscription_status;
  if (status === 'active') {
    newSubStatus = oldTenant.subscription_status === 'payment_issue' ? 'active' : oldTenant.subscription_status;
  } else if (isPaymentIssue || (reason && reason.toLowerCase().includes('due'))) {
    newSubStatus = 'payment_issue';
  }

  await c.env.DB.prepare(
    `UPDATE tenants SET
       account_access_status = ?,
       subscription_status = ?,
       suspension_reason = ?,
       updated_at = ?
     WHERE id = ?`
  )
    .bind(status, newSubStatus, reason || null, now, id)
    .run();

  await recordAuditLog(c, {
    tenantId: id,
    userId: user.uid,
    actorType: 'super_admin',
    action: `tenant.${status}`,
    resourceType: 'tenant',
    resourceId: id,
    oldValues: { account_access_status: oldTenant.account_access_status, subscription_status: oldTenant.subscription_status },
    newValues: { account_access_status: status, subscription_status: newSubStatus, reason },
  });

  return c.json({
    success: true,
    message: status === 'active'
      ? 'Tenant account restored to active status.'
      : `Tenant account marked as ${status}${isPaymentIssue ? ' with payment lockout' : ''}.`,
  });
});

// Update Property & Tenant Details (Full Super Admin Override)
adminRoutes.patch('/tenants/:id/details', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user')!;
    const body = await c.req.json();
    const now = Math.floor(Date.now() / 1000);

    const tenant: any = await c.env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(id).first();
    if (!tenant) return c.json({ error: 'Tenant not found' }, 404);

    const {
      tenantName,
      tenantSlug,
      propertyId,
      propertyName,
      propertyAddress,
      propertyCity,
      propertyState,
      propertyPostalCode,
      propertyCountry,
      propertyPhone,
      propertyEmail,
      propertyDescription,
    } = body;

    // 1. Update Tenant Name & Slug if specified
    if (tenantName || tenantSlug) {
      await c.env.DB.prepare(
        `UPDATE tenants SET
           name = COALESCE(?, name),
           slug = COALESCE(?, slug),
           updated_at = ?
         WHERE id = ?`
      )
        .bind(tenantName || null, tenantSlug || null, now, id)
        .run();
    }

    // 2. Update Primary Property Details
    if (propertyName || propertyAddress || propertyPhone || propertyEmail || propertyDescription || propertyCity || propertyState || propertyPostalCode) {
      const targetProperty: any = propertyId
        ? await c.env.DB.prepare('SELECT id FROM properties WHERE id = ? AND tenant_id = ?').bind(propertyId, id).first()
        : await c.env.DB.prepare('SELECT id FROM properties WHERE tenant_id = ? ORDER BY created_at ASC LIMIT 1').bind(id).first();

      if (targetProperty) {
        await c.env.DB.prepare(
          `UPDATE properties SET
             name = COALESCE(?, name),
             address_line1 = COALESCE(?, address_line1),
             city = COALESCE(?, city),
             state = COALESCE(?, state),
             postal_code = COALESCE(?, postal_code),
             country = COALESCE(?, country),
             phone = COALESCE(?, phone),
             email = COALESCE(?, email),
             description = COALESCE(?, description),
             updated_at = ?
           WHERE id = ?`
        )
          .bind(
            propertyName || null,
            propertyAddress || null,
            propertyCity || null,
            propertyState || null,
            propertyPostalCode || null,
            propertyCountry || null,
            propertyPhone || null,
            propertyEmail || null,
            propertyDescription || null,
            now,
            targetProperty.id
          )
          .run();
      }
    }

    await recordAuditLog(c, {
      tenantId: id,
      userId: user.uid,
      actorType: 'super_admin',
      action: 'tenant.details_updated_by_admin',
      resourceType: 'tenant',
      resourceId: id,
      newValues: { tenantName, propertyName, propertyCity, propertyPhone },
    });

    return c.json({ success: true, message: 'Tenant & Property details updated successfully' });
  } catch (err: any) {
    console.error('[Admin Update Details Error]', err);
    return c.json({ error: err.message || 'Failed to update tenant details' }, 500);
  }
});

// Clear All Test & Operational Data (Fresh Slate Reset)
adminRoutes.post('/tenants/:id/clear-data', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));

  if (body.confirmation !== 'CLEAR') {
    return c.json({ error: 'Please provide confirmation: "CLEAR" to purge tenant data' }, 400);
  }

  const tenant: any = await c.env.DB.prepare('SELECT name FROM tenants WHERE id = ?').bind(id).first();
  if (!tenant) return c.json({ error: 'Tenant not found' }, 404);

  // Safely purge transactional records while preserving properties, room types, and rooms
  try {
    await c.env.DB.batch([
      // 1. Delete reservation guests and reservations
      c.env.DB.prepare('DELETE FROM reservation_guests WHERE reservation_id IN (SELECT id FROM reservations WHERE tenant_id = ?)').bind(id),
      c.env.DB.prepare('DELETE FROM folio_transactions WHERE reservation_id IN (SELECT id FROM reservations WHERE tenant_id = ?)').bind(id),
      c.env.DB.prepare('DELETE FROM reservations WHERE tenant_id = ?').bind(id),

      // 2. Clear housekeeping & maintenance operations
      c.env.DB.prepare('DELETE FROM housekeeping_tasks WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM maintenance_tickets WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM complaints WHERE tenant_id = ?').bind(id),

      // 3. Clear billing invoices & payments
      c.env.DB.prepare('DELETE FROM payments WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM invoices WHERE tenant_id = ?').bind(id),

      // 4. Reset all rooms back to available / clean
      c.env.DB.prepare("UPDATE rooms SET status = 'clean' WHERE tenant_id = ?").bind(id),
    ]);
  } catch (err: any) {
    return c.json({ error: `Failed to clear data: ${err.message}` }, 500);
  }

  await recordAuditLog(c, {
    tenantId: id,
    userId: user.uid,
    actorType: 'super_admin',
    action: 'tenant.data_cleared',
    resourceType: 'tenant',
    resourceId: id,
    newValues: { message: `All test reservations, housekeeping, and tickets cleared for ${tenant.name}` },
  });

  return c.json({
    success: true,
    message: `All test reservations, housekeeping, complaints, and billing data for ${tenant.name} have been purged. Properties and rooms are reset to clean!`,
  });
});

// Delete Tenant & All Associated Records Permanently
adminRoutes.delete('/tenants/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));

  if (body.confirmation !== 'DELETE') {
    return c.json({ error: 'Please provide confirmation: "DELETE" to delete this hotel permanently' }, 400);
  }

  const tenant: any = await c.env.DB.prepare('SELECT name FROM tenants WHERE id = ?').bind(id).first();
  if (!tenant) return c.json({ error: 'Tenant not found' }, 404);

  try {
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM reservation_guests WHERE reservation_id IN (SELECT id FROM reservations WHERE tenant_id = ?)').bind(id),
      c.env.DB.prepare('DELETE FROM reservations WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM housekeeping_tasks WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM maintenance_tickets WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM complaints WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM payments WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM invoices WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM rooms WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM room_types WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM properties WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM tenant_memberships WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM team_invitations WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM audit_logs WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM feature_entitlements WHERE tenant_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM tenants WHERE id = ?').bind(id),
    ]);
  } catch (err: any) {
    return c.json({ error: `Failed to delete tenant: ${err.message}` }, 500);
  }

  return c.json({
    success: true,
    message: `Tenant "${tenant.name}" and all associated data permanently removed.`,
  });
});

// Update Tenant Subscription Plan or Extend Trial
adminRoutes.patch('/tenants/:id/plan', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const { planId, subscriptionStatus, trialExtensionDays } = body;

  const tenant: any = await c.env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(id).first();
  if (!tenant) return c.json({ error: 'Tenant not found' }, 404);

  let newTrialEnds = tenant.trial_ends_at;
  if (trialExtensionDays) {
    newTrialEnds = (tenant.trial_ends_at || now) + trialExtensionDays * 86400;
  }

  await c.env.DB.prepare(
    `UPDATE tenants SET
       current_plan_id = COALESCE(?, current_plan_id),
       subscription_status = COALESCE(?, subscription_status),
       trial_ends_at = ?,
       updated_at = ?
     WHERE id = ?`
  )
    .bind(planId || null, subscriptionStatus || null, newTrialEnds, now, id)
    .run();

  await recordAuditLog(c, {
    tenantId: id,
    userId: user.uid,
    actorType: 'super_admin',
    action: 'tenant.plan_updated',
    resourceType: 'tenant',
    resourceId: id,
    newValues: { planId, subscriptionStatus, newTrialEnds },
  });

  return c.json({ success: true, message: 'Tenant plan updated successfully' });
});

// -----------------------------------------------------------------------------
// SUBSCRIPTION PLANS CONFIGURATION
// -----------------------------------------------------------------------------
adminRoutes.get('/plans', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM subscription_plans ORDER BY sort_order ASC').all();
  return c.json({ plans: rows.results || [] });
});

adminRoutes.patch('/plans/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `UPDATE subscription_plans SET
       name = COALESCE(?, name),
       description = COALESCE(?, description),
       monthly_price_paise = COALESCE(?, monthly_price_paise),
       annual_price_paise = COALESCE(?, annual_price_paise),
       max_rooms = COALESCE(?, max_rooms),
       max_properties = COALESCE(?, max_properties),
       max_users = COALESCE(?, max_users),
       has_ai_agent = COALESCE(?, has_ai_agent),
       ai_monthly_limit = COALESCE(?, ai_monthly_limit),
       has_channel_manager = COALESCE(?, has_channel_manager),
       max_channel_connections = COALESCE(?, max_channel_connections),
       has_custom_website = COALESCE(?, has_custom_website),
       has_website_maintenance = COALESCE(?, has_website_maintenance),
       has_advanced_reports = COALESCE(?, has_advanced_reports),
       has_accounting = COALESCE(?, has_accounting),
       has_multi_property = COALESCE(?, has_multi_property),
       is_active = COALESCE(?, is_active),
       updated_at = ?
     WHERE id = ?`
  )
    .bind(
      body.name || null,
      body.description || null,
      body.monthlyPricePaise !== undefined ? body.monthlyPricePaise : null,
      body.annualPricePaise !== undefined ? body.annualPricePaise : null,
      body.maxRooms || null,
      body.maxProperties || null,
      body.maxUsers || null,
      body.hasAiAgent !== undefined ? (body.hasAiAgent ? 1 : 0) : null,
      body.aiMonthlyLimit || null,
      body.hasChannelManager !== undefined ? (body.hasChannelManager ? 1 : 0) : null,
      body.maxChannelConnections || null,
      body.hasCustomWebsite !== undefined ? (body.hasCustomWebsite ? 1 : 0) : null,
      body.hasWebsiteMaintenance !== undefined ? (body.hasWebsiteMaintenance ? 1 : 0) : null,
      body.hasAdvancedReports !== undefined ? (body.hasAdvancedReports ? 1 : 0) : null,
      body.hasAccounting !== undefined ? (body.hasAccounting ? 1 : 0) : null,
      body.hasMultiProperty !== undefined ? (body.hasMultiProperty ? 1 : 0) : null,
      body.isActive !== undefined ? (body.isActive ? 1 : 0) : null,
      now,
      id
    )
    .run();

  await recordAuditLog(c, {
    userId: user.uid,
    actorType: 'super_admin',
    action: 'plan.updated',
    resourceType: 'subscription_plan',
    resourceId: id,
    newValues: body,
  });

  return c.json({ success: true, message: 'Subscription plan updated' });
});

// -----------------------------------------------------------------------------
// PLATFORM FINANCE
// -----------------------------------------------------------------------------
adminRoutes.get('/finance/summary', async (c) => {
  // Platform expenses
  const expRow: any = await c.env.DB.prepare(
    'SELECT COALESCE(SUM(amount_paise), 0) as total_expenses_paise FROM platform_expenses'
  ).first();

  // SaaS billings from subscriptions
  const revRow: any = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(sp.monthly_price_paise), 0) as mrr_paise
     FROM tenants t
     JOIN subscription_plans sp ON sp.id = t.current_plan_id
     WHERE t.account_access_status = 'active' AND t.subscription_status = 'active'`
  ).first();

  const mrrPaise = revRow?.mrr_paise || 0;
  const arrPaise = mrrPaise * 12;
  const totalExpensesPaise = expRow?.total_expenses_paise || 0;
  const netRecognizedMarginPaise = arrPaise - totalExpensesPaise;

  return c.json({
    mrrPaise,
    mrrRupees: mrrPaise / 100,
    arrPaise,
    arrRupees: arrPaise / 100,
    totalExpensesPaise,
    totalExpensesRupees: totalExpensesPaise / 100,
    netMarginPaise: netRecognizedMarginPaise,
    netMarginRupees: netRecognizedMarginPaise / 100,
  });
});

adminRoutes.get('/finance/expenses', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM platform_expenses ORDER BY expense_date DESC, created_at DESC LIMIT 100'
  ).all();

  return c.json({ expenses: rows.results || [] });
});

adminRoutes.post('/finance/expenses', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  const id = `pexp_${crypto.randomUUID()}`;

  const { vendorName, category, amountPaise, expenseDate, notes, isRecurring } = body;

  if (!vendorName || !category || !amountPaise) {
    return c.json({ error: 'Vendor name, category, and amount are required' }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO platform_expenses (
      id, vendor_name, category, amount_paise, expense_date, is_recurring,
      notes, approved_by_admin, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      vendorName,
      category,
      Math.round(amountPaise),
      expenseDate || new Date().toISOString().split('T')[0],
      isRecurring ? 1 : 0,
      notes || null,
      user.email,
      now,
      now
    )
    .run();

  await recordAuditLog(c, {
    userId: user.uid,
    actorType: 'super_admin',
    action: 'platform_expense.created',
    resourceType: 'platform_expense',
    resourceId: id,
    newValues: { vendorName, category, amountPaise },
  });

  return c.json({ success: true, id });
});

// Audit Logs
adminRoutes.get('/audit-logs', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100'
  ).all();

  return c.json({ auditLogs: rows.results || [] });
});
