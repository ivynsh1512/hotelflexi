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
  const totalRooms = Math.min(Math.max(parseInt(body.totalRooms, 10) || 6, 1), 50);

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
  const stmtProperty = c.env.DB.prepare(
    `INSERT INTO properties (
      id, tenant_id, name, slug, address_line1, city, state, country,
      phone, email, timezone, currency, check_in_time, check_out_time,
      description, amenities, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'India', ?, ?, 'Asia/Kolkata', 'INR', '14:00', '11:00', ?, ?, ?, ?)`
  ).bind(
    propertyId,
    tenantId,
    propertyName,
    propertySlug,
    address,
    city,
    state,
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

  // 6. Default Room Types
  const deluxeRoomTypeId = `rt_${crypto.randomUUID()}`;
  const suiteRoomTypeId = `rt_${crypto.randomUUID()}`;

  const stmtRoomType1 = c.env.DB.prepare(
    `INSERT INTO room_types (
      id, property_id, tenant_id, name, code, base_occupancy, max_occupancy,
      base_price_paise, weekend_price_paise, extra_adult_price_paise, description, amenities, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, 'Deluxe Room', 'DLX', 2, 3, 250000, 280000, 60000, 'Comfortable king-bed room with city view and ensuite bathroom', ?, 1, ?, ?)`
  ).bind(
    deluxeRoomTypeId,
    propertyId,
    tenantId,
    JSON.stringify(['King Bed', 'AC', 'Wi-Fi', 'TV', 'Ensuite Bathroom']),
    now,
    now
  );

  const stmtRoomType2 = c.env.DB.prepare(
    `INSERT INTO room_types (
      id, property_id, tenant_id, name, code, base_occupancy, max_occupancy,
      base_price_paise, weekend_price_paise, extra_adult_price_paise, description, amenities, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, 'Executive Suite', 'STE', 2, 4, 450000, 500000, 80000, 'Spacious luxury suite with living area and premium amenities', ?, 1, ?, ?)`
  ).bind(
    suiteRoomTypeId,
    propertyId,
    tenantId,
    JSON.stringify(['King Bed', 'Living Area', 'Mini Bar', 'Bathtub', 'High-speed Wi-Fi']),
    now,
    now
  );

  // 7. Default Rate Plans
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

  // 8. Generate sample rooms according to requested totalRooms
  const roomStatements: any[] = [];
  for (let i = 1; i <= totalRooms; i++) {
    const floorNum = i <= 6 ? 1 : 2;
    const roomNum = `${floorNum}0${i <= 6 ? i : i - 6}`;
    const roomTypeId = i % 3 === 0 ? suiteRoomTypeId : deluxeRoomTypeId;
    const roomId = `room_${crypto.randomUUID()}`;

    roomStatements.push(
      c.env.DB.prepare(
        `INSERT INTO rooms (
          id, property_id, tenant_id, room_type_id, room_number, floor, status, housekeeping_status, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'available', 'clean', 1, ?, ?)`
      ).bind(roomId, propertyId, tenantId, roomTypeId, roomNum, `Floor ${floorNum}`, now, now)
    );
  }

  // 9. Default Expense Categories
  const catNames = ['Food & Beverages', 'Electricity & Water', 'Linen & Laundry', 'Repairs & Maintenance', 'Staff Salaries'];
  const catStatements = catNames.map((name) =>
    c.env.DB.prepare(
      `INSERT INTO expense_categories (id, property_id, tenant_id, name, is_active, created_at)
       VALUES (?, ?, ?, ?, 1, ?)`
    ).bind(`cat_${crypto.randomUUID()}`, propertyId, tenantId, name, now)
  );

  // Execute all in batch
  await c.env.DB.batch([
    stmtTenant,
    stmtMembership,
    stmtEntitlements,
    stmtProperty,
    stmtSettings,
    stmtRoomType1,
    stmtRoomType2,
    stmtRatePlan1,
    stmtRatePlan2,
    ...roomStatements,
    ...catStatements,
  ]);

  await recordAuditLog(c, {
    tenantId,
    userId: user.uid,
    action: 'tenant.onboarded',
    resourceType: 'tenant',
    resourceId: tenantId,
    newValues: { tenantName: propertyName, totalRooms },
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
