import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const subscriptionRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

subscriptionRoutes.use('*', authMiddleware, tenantMiddleware);

// Helper: Verify Razorpay Payment Signature
async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const text = `${orderId}|${paymentId}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    return await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(text));
  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
}

// -----------------------------------------------------------------------------
// GET CURRENT SUBSCRIPTION & ENTITLEMENTS
// -----------------------------------------------------------------------------
subscriptionRoutes.get('/current', async (c) => {
  const tenantId = c.get('tenantId')!;
  const now = Math.floor(Date.now() / 1000);

  const tenant: any = await c.env.DB.prepare(
    `SELECT t.id, t.name, t.subscription_status, t.current_plan_id, t.trial_ends_at,
            t.current_period_ends_at, t.account_access_status, t.suspension_reason,
            sp.name as plan_name, sp.monthly_price_paise, sp.description
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

  const isTrial = tenant?.subscription_status === 'trial' || tenant?.subscription_status === 'trialing';
  const isTrialExpired = Boolean(isTrial && tenant?.trial_ends_at && tenant.trial_ends_at < now);
  const isSubscriptionExpired = Boolean(
    tenant?.subscription_status !== 'trial' &&
    tenant?.subscription_status !== 'trialing' &&
    tenant?.current_plan_id !== 'starter' &&
    tenant?.current_period_ends_at &&
    tenant.current_period_ends_at < now
  );
  const isLocked =
    tenant?.account_access_status === 'locked' ||
    tenant?.account_access_status === 'suspended' ||
    isTrialExpired ||
    isSubscriptionExpired;

  const trialDaysRemaining = tenant?.trial_ends_at
    ? Math.max(0, Math.ceil((tenant.trial_ends_at - now) / 86400))
    : 0;

  const subscriptionDaysRemaining = tenant?.current_period_ends_at
    ? Math.max(0, Math.ceil((tenant.current_period_ends_at - now) / 86400))
    : 0;

  return c.json({
    subscription: {
      ...tenant,
      is_locked: isLocked,
      is_trial_expired: isTrialExpired,
      is_subscription_expired: isSubscriptionExpired,
      trial_days_remaining: trialDaysRemaining,
      subscription_days_remaining: subscriptionDaysRemaining,
    },
    entitlements,
  });
});

// -----------------------------------------------------------------------------
// LIST ALL ACTIVE PUBLIC PLANS
// -----------------------------------------------------------------------------
subscriptionRoutes.get('/plans', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY sort_order ASC'
  ).all();

  return c.json({ plans: rows.results || [] });
});

// -----------------------------------------------------------------------------
// SWITCH TO FREE STARTER PLAN (₹0 - strictly free tier)
// -----------------------------------------------------------------------------
subscriptionRoutes.post('/switch-free', requireRole(['owner']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const now = Math.floor(Date.now() / 1000);

  const starterPlan: any = await c.env.DB.prepare(
    "SELECT * FROM subscription_plans WHERE id = 'starter'"
  ).first();

  if (!starterPlan) {
    return c.json({ error: 'Starter plan not configured in database' }, 500);
  }

  // Update tenant to active starter plan and unlock account immediately
  await c.env.DB.prepare(
    `UPDATE tenants
     SET current_plan_id = 'starter',
         subscription_status = 'active',
         account_access_status = 'active',
         suspension_reason = NULL,
         current_period_ends_at = NULL,
         updated_at = ?
     WHERE id = ?`
  )
    .bind(now, tenantId)
    .run();

  // Enforce strict Starter tier limits
  await c.env.DB.prepare(
    `UPDATE feature_entitlements
     SET max_properties = 1,
         max_rooms = 10,
         max_users = 2,
         has_pms = 1,
         has_booking_engine = 1,
         has_channel_manager = 0,
         max_channel_connections = 0,
         has_ai_agent = 1,
         ai_monthly_limit = 60,
         has_advanced_reports = 0,
         has_accounting = 0,
         has_multi_property = 0,
         updated_at = ?
     WHERE tenant_id = ?`
  )
    .bind(now, tenantId)
    .run();

  await recordAuditLog(c, {
    action: 'subscription.switched_free_starter',
    resourceType: 'tenant_subscription',
    resourceId: tenantId,
    newValues: { planId: 'starter', planName: 'Free Starter' },
  });

  return c.json({
    success: true,
    message: 'Switched to Free Starter plan successfully. Your hotel workspace is unlocked.',
  });
});

// -----------------------------------------------------------------------------
// CREATE PAYMENT ORDER (Razorpay) FOR PAID PLANS & SERVICE PACKAGES
// -----------------------------------------------------------------------------
subscriptionRoutes.post('/create-order', requireRole(['owner']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const body = await c.req.json();
  const { planId, packageId } = body;

  let targetAmount = 0;
  let targetName = '';
  let isPackage = false;

  if (packageId) {
    isPackage = true;
    if (packageId === 'developer_setup') {
      targetAmount = 49900;
      targetName = 'Dedicated Developer PMS Setup (₹499)';
    } else if (packageId === 'ota_setup') {
      targetAmount = 499900;
      targetName = 'Complete OTA Listing & HotelFlexi 2-Way Setup (₹4,999)';
    } else {
      return c.json({ error: 'Invalid package ID' }, 400);
    }
  } else if (planId) {
    const plan: any = await c.env.DB.prepare(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1'
    )
      .bind(planId)
      .first();

    if (!plan) {
      return c.json({ error: 'Selected plan does not exist' }, 404);
    }

    // If free plan, no payment order needed
    if (!plan.monthly_price_paise || plan.monthly_price_paise === 0) {
      return c.json({ freePlan: true, planId: plan.id });
    }

    targetAmount = plan.monthly_price_paise;
    targetName = plan.name;
  } else {
    return c.json({ error: 'Either planId or packageId is required' }, 400);
  }

  const keyId = c.env.RAZORPAY_KEY_ID;
  const keySecret = c.env.RAZORPAY_KEY_SECRET;

  // Real Razorpay gateway order creation
  if (keyId && keySecret) {
    try {
      const basicAuth = btoa(`${keyId}:${keySecret}`);
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: targetAmount,
          currency: 'INR',
          receipt: `ORD_${tenantId.slice(-6)}_${Date.now().toString().slice(-6)}`,
          notes: {
            tenantId,
            planId: planId || undefined,
            packageId: packageId || undefined,
            service: targetName,
            userId: user.uid,
          },
        }),
      });

      if (!rzpRes.ok) {
        const errData = await rzpRes.json();
        return c.json({ error: 'Payment gateway rejected order creation', details: errData }, 500);
      }

      const orderData: any = await rzpRes.json();
      return c.json({
        success: true,
        orderId: orderData.id,
        keyId,
        amount: targetAmount,
        currency: 'INR',
        planName: targetName,
        packageId,
        isSimulated: false,
      });
    } catch (err: any) {
      return c.json({ error: 'Failed to communicate with payment gateway', message: err.message }, 500);
    }
  }

  // In test/demo mode when Razorpay credentials are not yet configured on worker:
  const simOrderId = `order_sim_${crypto.randomUUID()}`;
  return c.json({
    success: true,
    orderId: simOrderId,
    keyId: 'rzp_test_simulated',
    amount: targetAmount,
    currency: 'INR',
    planName: targetName,
    packageId,
    isSimulated: true,
  });
});

// -----------------------------------------------------------------------------
// VERIFY PAYMENT & ACTIVATE PAID PLAN OR SERVICE PACKAGE
// -----------------------------------------------------------------------------
subscriptionRoutes.post('/verify-payment', requireRole(['owner']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  const { planId, packageId, orderId, paymentId, signature } = body;

  if (!orderId || !paymentId) {
    return c.json({ error: 'Order ID and Payment ID are required' }, 400);
  }

  const keySecret = c.env.RAZORPAY_KEY_SECRET;

  // Real cryptographic HMAC signature check if Razorpay secret is present
  if (keySecret && !orderId.startsWith('order_sim_')) {
    if (!signature) {
      return c.json({ error: 'Payment signature missing' }, 400);
    }
    const isValid = await verifyRazorpaySignature(orderId, paymentId, signature, keySecret);
    if (!isValid) {
      return c.json({ error: 'Payment signature verification failed. Tampering detected.' }, 400);
    }
  }

  // Handle Developer / OTA Setup Package Purchase
  if (packageId) {
    const reqId = `devreq_${crypto.randomUUID()}`;
    const amountPaise = packageId === 'developer_setup' ? 49900 : 499900;
    const packageName = packageId === 'developer_setup' ? 'Dedicated Developer PMS Setup' : 'Complete OTA Listing & HotelFlexi 2-Way Setup';

    await c.env.DB.prepare(
      `INSERT INTO developer_setup_requests (
         id, tenant_id, user_id, amount_paise, status, payment_id, razorpay_order_id, notes, created_at, updated_at
       ) VALUES (?, ?, ?, ?, 'paid', ?, ?, ?, ?, ?)`
    ).bind(
      reqId,
      tenantId,
      c.get('user')?.uid || 'user',
      amountPaise,
      paymentId,
      orderId,
      packageName,
      now,
      now
    ).run();

    await recordAuditLog(c, {
      tenantId,
      userId: c.get('user')?.uid,
      action: 'service_package.purchased',
      resourceType: 'developer_setup',
      resourceId: reqId,
      newValues: { packageId, packageName, amountPaise, paymentId },
    });

    return c.json({
      success: true,
      servicePackage: true,
      packageId,
      packageName,
      message: 'Payment verified! Here is your assigned developer. Kindly reach him out directly to begin your setup immediately.',
      assignedDeveloper: {
        name: 'Divyansh Shukla (Lead Technical Specialist)',
        phone: '+91 8400999966',
        whatsappUrl: 'https://wa.me/918400999966',
        contactText: 'Kindly reach out to your assigned developer at wa.me/918400999966 (+91 8400999966) with your property details.',
      },
    });
  }

  // Handle Subscription Plan Upgrade
  if (!planId) {
    return c.json({ error: 'Plan ID is required for subscription upgrades' }, 400);
  }

  const plan: any = await c.env.DB.prepare(
    'SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1'
  )
    .bind(planId)
    .first();

  if (!plan) {
    return c.json({ error: 'Selected plan not found' }, 404);
  }

  // 30 days validity from now
  const nextPeriod = now + 30 * 86400;

  // Update tenant subscription and unlock workspace
  await c.env.DB.prepare(
    `UPDATE tenants
     SET current_plan_id = ?,
         subscription_status = 'active',
         account_access_status = 'active',
         suspension_reason = NULL,
         current_period_ends_at = ?,
         updated_at = ?
     WHERE id = ?`
  )
    .bind(planId, nextPeriod, now, tenantId)
    .run();

  // Update feature entitlements from the purchased plan
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

  // Record payment in subscriptions table
  const subRecordId = `sub_${crypto.randomUUID()}`;
  await c.env.DB.prepare(
    `INSERT INTO subscriptions (
       id, tenant_id, plan_id, billing_cycle, amount_paise, status,
       start_date, current_period_start, current_period_end,
       gateway_subscription_id, created_at, updated_at
     ) VALUES (?, ?, ?, 'monthly', ?, 'active', ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      subRecordId,
      tenantId,
      planId,
      plan.monthly_price_paise,
      now,
      now,
      nextPeriod,
      paymentId,
      now,
      now
    )
    .run()
    .catch(() => {});

  // Add in-app confirmation notification
  await c.env.DB.prepare(
    `INSERT INTO notifications (id, tenant_id, title, message, category, link_url, is_read, created_at)
     VALUES (?, ?, ?, ?, 'system', '/app/subscription', 0, ?)`
  )
    .bind(
      `notif_${crypto.randomUUID()}`,
      tenantId,
      `Plan Activated: ${plan.name}`,
      `Your payment of ₹${plan.monthly_price_paise / 100} was successful. ${plan.name} features and channel limits are now active for the next 30 days.`,
      now
    )
    .run()
    .catch(() => {});

  await recordAuditLog(c, {
    action: 'subscription.paid_upgrade',
    resourceType: 'tenant_subscription',
    resourceId: tenantId,
    newValues: { planId, planName: plan.name, paymentId, orderId },
  });

  return c.json({
    success: true,
    message: `Payment verified! Plan successfully upgraded to ${plan.name}. Your hotel workspace is unlocked.`,
    plan,
  });
});

// -----------------------------------------------------------------------------
// LEGACY UPGRADE ENDPOINT GUARD: Reject paid upgrades without payment!
// -----------------------------------------------------------------------------
subscriptionRoutes.post('/upgrade', requireRole(['owner']), async (c) => {
  const body = await c.req.json();
  const planId = body.planId;

  // Free starter can be switched directly
  if (planId === 'starter') {
    const res = await c.env.DB.prepare(
      "SELECT * FROM subscription_plans WHERE id = 'starter'"
    ).first();
    if (res) {
      // Delegate to switch-free
      const tenantId = c.get('tenantId')!;
      const now = Math.floor(Date.now() / 1000);
      await c.env.DB.prepare(
        `UPDATE tenants
         SET current_plan_id = 'starter',
             subscription_status = 'active',
             account_access_status = 'active',
             suspension_reason = NULL,
             current_period_ends_at = NULL,
             updated_at = ?
         WHERE id = ?`
      )
        .bind(now, tenantId)
        .run();

      return c.json({
        success: true,
        message: 'Plan changed to Free Starter tier.',
      });
    }
  }

  // Reject all paid plan upgrades without payment
  return c.json(
    {
      error: 'Direct upgrade to a paid plan without payment verification is not permitted. Please initiate payment checkout.',
      code: 'PAYMENT_REQUIRED',
    },
    402
  );
});
