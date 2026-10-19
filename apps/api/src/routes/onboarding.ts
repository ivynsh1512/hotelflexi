import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const onboardingRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

onboardingRoutes.post('/', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));

  const propertyName = (body.propertyName || body.name || '').trim();
  const ownerName = (body.ownerName || user.name || '').trim();
  const phone = (body.phone || '').trim();
  const address = (body.address || '').trim();
  const city = (body.city || 'New Delhi').trim();
  const state = (body.state || 'Delhi').trim();
  const country = (body.country || 'India').trim();
  const postalCode = (body.postalCode || body.pincode || body.postcode || null)?.toString().trim() || null;
  const latitude = typeof body.latitude === 'number' ? body.latitude : (body.latitude ? parseFloat(body.latitude) : null);
  const longitude = typeof body.longitude === 'number' ? body.longitude : (body.longitude ? parseFloat(body.longitude) : null);

  if (!propertyName) {
    return c.json({ error: 'Property name is required' }, 400);
  }

  // Generate tenant and property slugs
  const baseSlug = propertyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'hotel';
  const tenantSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  const propertySlug = tenantSlug;

  const tenantId = `tnt_${crypto.randomUUID()}`;
  const propertyId = `prop_${crypto.randomUUID()}`;
  const membershipId = `mem_${crypto.randomUUID()}`;
  const settingsId = `set_${crypto.randomUUID()}`;
  const entitlementId = `ent_${crypto.randomUUID()}`;

  const now = Math.floor(Date.now() / 1000);
  const trialEnds = now + 14 * 86400; // 14-day full feature trial

  // Check existing user in users table
  await c.env.DB.prepare(
    `INSERT INTO users (id, email, full_name, phone, email_verified, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       full_name = COALESCE(excluded.full_name, users.full_name),
       phone = COALESCE(excluded.phone, users.phone),
       updated_at = excluded.updated_at`
  )
    .bind(user.uid, user.email, ownerName, phone, user.email_verified ? 1 : 0, now, now)
    .run();

  // 1. Create Tenant
  const stmtTenant = c.env.DB.prepare(
    `INSERT INTO tenants (
      id, name, slug, owner_user_id, account_access_status, subscription_status,
      current_plan_id, trial_ends_at, current_period_ends_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'active', 'trial', 'starter', ?, ?, ?, ?)`
  ).bind(tenantId, propertyName, tenantSlug, user.uid, trialEnds, trialEnds, now, now);

  // 2. Create Owner Membership
  const stmtMembership = c.env.DB.prepare(
    `INSERT INTO tenant_memberships (id, tenant_id, user_id, role, created_at, updated_at)
     VALUES (?, ?, ?, 'owner', ?, ?)`
  ).bind(membershipId, tenantId, user.uid, now, now);

  // 3. Create Feature Entitlements
  const stmtEntitlements = c.env.DB.prepare(
    `INSERT INTO feature_entitlements (
      id, tenant_id, max_properties, max_rooms, max_users, has_pms, has_booking_engine,
      has_channel_manager, max_channel_connections, has_ai_agent, ai_monthly_limit,
      has_advanced_reports, has_accounting, has_multi_property, created_at, updated_at
    ) VALUES (?, ?, 1, 15, 5, 1, 1, 1, 2, 1, 200, 1, 1, 0, ?, ?)`
  ).bind(entitlementId, tenantId, now, now);

  // 4. Create Property
  const hotelCode = Math.floor(10000 + Math.random() * 90000).toString();

  const stmtProperty = c.env.DB.prepare(
    `INSERT INTO properties (
      id, tenant_id, name, slug, hotel_code, address_line1, city, state, country, postal_code,
      latitude, longitude,
      phone, email, timezone, currency, check_in_time, check_out_time,
      description, amenities, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Asia/Kolkata', 'INR', '14:00', '11:00', ?, ?, ?, ?)`
  ).bind(
    propertyId,
    tenantId,
    propertyName,
    propertySlug,
    hotelCode,
    address,
    city,
    state,
    country,
    postalCode,
    latitude,
    longitude,
    phone,
    user.email,
    `Welcome to ${propertyName}. Experience unmatched hospitality.`,
    JSON.stringify(['Free Wi-Fi', 'Room Service', 'Air Conditioning', 'Power Backup', '24/7 Front Desk']),
    now,
    now
  );

  // 5. Create Property Settings
  const stmtSettings = c.env.DB.prepare(
    `INSERT INTO property_settings (
      id, property_id, tenant_id, gst_rate_standard, gst_rate_luxury,
      invoice_prefix, next_invoice_number, enable_online_booking, created_at, updated_at
    ) VALUES (?, ?, ?, 1200, 1800, 'HF-', 1001, 1, ?, ?)`
  ).bind(settingsId, propertyId, tenantId, now, now);

  // 6. Default Rate Plans (EP & CP meal structures)
  const epRatePlanId = `rp_${crypto.randomUUID()}`;
  const cpRatePlanId = `rp_${crypto.randomUUID()}`;

  const stmtRatePlan1 = c.env.DB.prepare(
    `INSERT INTO rate_plans (
      id, property_id, tenant_id, name, code, meal_plan, price_multiplier, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, 'European Plan (Room Only)', 'EP', 'EP', 100, 1, ?, ?)`
  ).bind(epRatePlanId, propertyId, tenantId, now, now);

  const stmtRatePlan2 = c.env.DB.prepare(
    `INSERT INTO rate_plans (
      id, property_id, tenant_id, name, code, meal_plan, price_multiplier, surcharge_paise, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, 'Continental Plan (With Breakfast)', 'CP', 'CP', 100, 40000, 1, ?, ?)`
  ).bind(cpRatePlanId, propertyId, tenantId, now, now);

  // 7. Default Expense Categories
  const catNames = ['Food & Beverages', 'Electricity & Water', 'Linen & Laundry', 'Repairs & Maintenance', 'Staff Salaries'];
  const catStatements = catNames.map((name) =>
    c.env.DB.prepare(
      `INSERT INTO expense_categories (id, property_id, tenant_id, name, is_active, created_at)
       VALUES (?, ?, ?, ?, 1, ?)`
    ).bind(`cat_${crypto.randomUUID()}`, propertyId, tenantId, name, now)
  );

  // 8. Real System Notifications
  const notif1 = c.env.DB.prepare(
    `INSERT INTO notifications (id, tenant_id, user_id, title, message, category, is_read, created_at)
     VALUES (?, ?, ?, 'Welcome to HotelFlexi!', ?, 'system', 0, ?)`
  ).bind(
    `notif_${crypto.randomUUID()}`,
    tenantId,
    user.uid,
    `Your property "${propertyName}" has been created. Start by configuring your room categories and adding room units.`,
    now
  );

  const notif2 = c.env.DB.prepare(
    `INSERT INTO notifications (id, tenant_id, user_id, title, message, category, is_read, created_at)
     VALUES (?, ?, ?, '14-Day Free Trial Activated', 'All Starter modules including Front Desk PMS, Direct Booking Engine, and Invoicing are active.', 'billing', 0, ?)`
  ).bind(`notif_${crypto.randomUUID()}`, tenantId, user.uid, now);

  // Execute all in batch (NO mock rooms, pure hotel setup)
  await c.env.DB.batch([
    stmtTenant,
    stmtMembership,
    stmtEntitlements,
    stmtProperty,
    stmtSettings,
    stmtRatePlan1,
    stmtRatePlan2,
    ...catStatements,
    notif1,
    notif2,
  ]);

  await recordAuditLog(c, {
    tenantId,
    userId: user.uid,
    action: 'tenant.onboarded',
    resourceType: 'tenant',
    resourceId: tenantId,
    newValues: { tenantName: propertyName },
  });

  return c.json({
    success: true,
    tenant: {
      id: tenantId,
      name: propertyName,
      slug: tenantSlug,
      role: 'owner',
    },
    property: {
      id: propertyId,
      name: propertyName,
      slug: propertySlug,
    },
  });
});
