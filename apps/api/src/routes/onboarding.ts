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

  // Prevent spam/unverified onboardings: Require email verification
  // email_verified is already true for Google OAuth users (sign_in_provider === 'google.com')
  let isEmailVerified = Boolean(user.email_verified);

  // Fallback: check DB in case user verified email but token hasn't refreshed yet
  if (!isEmailVerified) {
    try {
      const dbUser: any = await c.env.DB.prepare(
        'SELECT email_verified, is_platform_admin FROM users WHERE id = ?'
      )
        .bind(user.uid)
        .first();

      if (dbUser && (dbUser.email_verified === 1 || dbUser.is_platform_admin === 1)) {
        isEmailVerified = true;
      }
    } catch (dbErr) {
      console.warn('[Onboarding] DB email_verified fallback check failed:', dbErr);
    }
  }

  if (!isEmailVerified) {
    return c.json(
      { error: 'Email verification required before onboarding your property. Please check your inbox and verify your email.' },
      403
    );
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

  // Safely find existing user by Firebase UID or Email to avoid UNIQUE constraint collisions
  const existingUser: any = await c.env.DB.prepare(
    'SELECT id, email_verified FROM users WHERE id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?)) LIMIT 1'
  )
    .bind(user.uid, user.email)
    .first();

  const effectiveUserId = existingUser?.id || user.uid;

  if (existingUser) {
    await c.env.DB.prepare(
      `UPDATE users SET
         email = ?,
         full_name = COALESCE(?, full_name),
         phone = COALESCE(?, phone),
         email_verified = 1,
         updated_at = ?
       WHERE id = ?`
    )
      .bind(user.email, ownerName, phone, now, existingUser.id)
      .run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO users (id, email, full_name, phone, email_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`
    )
      .bind(user.uid, user.email, ownerName, phone, now, now)
      .run();
  }

  // 1. Create Tenant (Trial starts with Essential Plan)
  const stmtTenant = c.env.DB.prepare(
    `INSERT INTO tenants (
      id, name, slug, owner_user_id, account_access_status, subscription_status,
      current_plan_id, trial_ends_at, current_period_ends_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'active', 'trial', 'essential', ?, ?, ?, ?)`
  ).bind(tenantId, propertyName, tenantSlug, effectiveUserId, trialEnds, trialEnds, now, now);

  // 2. Create Owner Membership
  const stmtMembership = c.env.DB.prepare(
    `INSERT INTO tenant_memberships (id, tenant_id, user_id, role, created_at, updated_at)
     VALUES (?, ?, ?, 'owner', ?, ?)`
  ).bind(membershipId, tenantId, effectiveUserId, now, now);

  // 3. Create Feature Entitlements (Essential Plan 14-day trial features)
  const stmtEntitlements = c.env.DB.prepare(
    `INSERT INTO feature_entitlements (
      id, tenant_id, max_properties, max_rooms, max_users, has_pms, has_booking_engine,
      has_channel_manager, max_channel_connections, has_ai_agent, ai_monthly_limit,
      has_advanced_reports, has_accounting, has_multi_property, created_at, updated_at
    ) VALUES (?, ?, 1, 10, 2, 1, 1, 0, 0, 1, 50, 0, 0, 0, ?, ?)`
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

// -----------------------------------------------------------------------------
// DYNAMIC ONBOARDING CHECKLIST (Authoritative status from real DB records)
// -----------------------------------------------------------------------------
onboardingRoutes.get('/checklist', authMiddleware, async (c) => {
  const propertyId = c.req.query('property_id');
  const user = c.get('user')!;

  if (!propertyId) {
    return c.json({ error: 'property_id is required' }, 400);
  }

  // 1. Fetch Property details
  const prop: any = await c.env.DB.prepare(
    `SELECT p.*, ps.gst_number, ps.razorpay_enabled, ps.razorpay_key_id, ps.google_review_url
     FROM properties p
     LEFT JOIN property_settings ps ON ps.property_id = p.id
     WHERE p.id = ?`
  )
    .bind(propertyId)
    .first();

  if (!prop) {
    return c.json({ error: 'Property not found' }, 404);
  }

  // 2. Authoritative counts of rooms, categories, rate plans, taxes
  const [typesRow, roomsRow, ratesRow, taxesRow]: any = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM room_types WHERE property_id = ? AND is_active = 1`).bind(propertyId).first(),
    c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM rooms WHERE property_id = ? AND is_active = 1`).bind(propertyId).first(),
    c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM rate_plans WHERE property_id = ? AND is_active = 1`).bind(propertyId).first(),
    c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM property_tax_rules WHERE property_id = ? AND is_active = 1`).bind(propertyId).first(),
  ]);

  const categoriesCount = typesRow?.cnt || 0;
  const roomsCount = roomsRow?.cnt || 0;
  const ratesCount = ratesRow?.cnt || 0;
  const customTaxesCount = taxesRow?.cnt || 0;

  // Real authoritative validation rules
  const isProfileComplete = Boolean(prop.name && prop.phone && (prop.address_line1 || prop.city));
  const hasCategories = categoriesCount > 0;
  const hasRooms = roomsCount > 0;
  const hasRates = ratesCount > 0;
  const hasTaxes = Boolean(prop.gst_number || customTaxesCount > 0);
  const hasRazorpay = Boolean(prop.razorpay_enabled === 1 && prop.razorpay_key_id && prop.razorpay_key_id.length > 5);
  const hasGoogleReview = Boolean(prop.google_review_url && String(prop.google_review_url).trim().length > 5);

  const checklistItems = [
    {
      id: 'property_profile',
      title: 'Complete Property Profile',
      description: 'Add your property phone, full address, and check-in / check-out times.',
      isCompleted: isProfileComplete,
      actionUrl: '/app/settings',
      actionLabel: 'Edit Details',
      category: 'basic',
    },
    {
      id: 'room_categories',
      title: 'Create Room Categories',
      description: 'Define your room types such as Deluxe Room, Cottage, or Suite with occupancy & base rates.',
      isCompleted: hasCategories,
      actionUrl: '/app/room-types',
      actionLabel: 'Add Categories',
      category: 'inventory',
    },
    {
      id: 'physical_rooms',
      title: 'Add Physical Room Inventory',
      description: 'Map your individual room numbers (e.g. 101, 102) to room categories.',
      isCompleted: hasRooms,
      actionUrl: '/app/rooms',
      actionLabel: 'Add Room Numbers',
      category: 'inventory',
    },
    {
      id: 'rate_plans',
      title: 'Configure Rate Plans & Meals',
      description: 'Set up room-only (EP), breakfast included (CP), or package rate plans.',
      isCompleted: hasRates,
      actionUrl: '/app/rates',
      actionLabel: 'Configure Rates',
      category: 'pricing',
    },
    {
      id: 'tax_configuration',
      title: 'Configure Indian GST & Taxes',
      description: 'Add your GSTIN for 12%/18% tax invoices or configure custom resort fees.',
      isCompleted: hasTaxes,
      actionUrl: '/app/taxes',
      actionLabel: 'Set Up Taxes',
      category: 'compliance',
    },
    {
      id: 'google_review_url',
      title: 'Google Business Profile Review Link',
      description: 'Add your Google review link to boost 5-star ratings on Google Maps after guest checkout.',
      isCompleted: hasGoogleReview,
      actionUrl: '/app/settings',
      actionLabel: 'Add Review Link',
      category: 'marketing',
    },
    {
      id: 'razorpay_payments',
      title: 'Set up Razorpay payments',
      description: 'Continue to the Razorpay link provided for your payment setup.',
      isCompleted: hasRazorpay,
      actionUrl: 'https://rzp.io/rzp/fKRf0v8',
      actionLabel: 'Continue to Razorpay',
      isExternal: true,
      secondaryActionUrl: '/app/settings',
      secondaryActionLabel: 'Enter API Credentials',
      category: 'payments',
    },
  ];

  const completedCount = checklistItems.filter((it) => it.isCompleted).length;
  const totalCount = checklistItems.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return c.json({
    propertyId,
    propertyName: prop.name,
    items: checklistItems,
    pendingItems: checklistItems.filter((it) => !it.isCompleted),
    completedCount,
    totalCount,
    completionPercentage,
    isFullyOnboarded: completedCount === totalCount,
  });
});
