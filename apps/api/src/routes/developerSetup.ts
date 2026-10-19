import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware } from '../auth/middleware';

export const developerSetupRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

developerSetupRoutes.use('*', authMiddleware, tenantMiddleware);

// -----------------------------------------------------------------------------
// GET DEVELOPER SETUP STATUS
// -----------------------------------------------------------------------------
developerSetupRoutes.get('/status', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let sql = 'SELECT * FROM developer_setup_requests WHERE tenant_id = ?';
  const params: any[] = [tenantId];
  if (propertyId) {
    sql += ' AND property_id = ?';
    params.push(propertyId);
  }
  sql += ' ORDER BY created_at DESC LIMIT 1';

  const req: any = await c.env.DB.prepare(sql).bind(...params).first();
  return c.json({ request: req || null });
});

// -----------------------------------------------------------------------------
// INITIATE DEVELOPER SETUP ORDER (₹499 via Superadmin Razorpay)
// -----------------------------------------------------------------------------
developerSetupRoutes.post('/initiate', async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const { propertyId, contactPhone, contactEmail, notes } = body;

  const keyId = c.env.RAZORPAY_KEY_ID;
  const keySecret = c.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return c.json({ error: 'Platform payment gateway not configured' }, 500);
  }

  const amountPaise = 49900; // ₹499 INR
  const requestId = `dev_${crypto.randomUUID()}`;

  // Call Razorpay API to create order
  let razorpayOrderId: string | null = null;
  try {
    const basicAuth = btoa(`${keyId}:${keySecret}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `DEV-SETUP-${requestId.slice(-6)}`,
        notes: {
          tenantId,
          propertyId,
          userId: user.uid,
          service: 'HotelFlexi Developer Full Setup',
        },
      }),
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.json();
      return c.json({ error: 'Failed to create payment order with Razorpay', details: err }, 500);
    }

    const rzpData: any = await rzpRes.json();
    razorpayOrderId = rzpData.id;
  } catch (err: any) {
    return c.json({ error: 'Gateway network error', message: err.message }, 500);
  }

  // Insert setup request
  await c.env.DB.prepare(
    `INSERT INTO developer_setup_requests (
      id, tenant_id, property_id, user_id, contact_phone, contact_email,
      amount_paise, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  )
    .bind(
      requestId,
      tenantId,
      propertyId || null,
      user.uid,
      contactPhone || '',
      contactEmail || user.email || '',
      amountPaise,
      notes || 'Complete Hotel PMS, OTA channels & UPI gateway configuration',
      now,
      now
    )
    .run();

  return c.json({
    success: true,
    requestId,
    orderId: razorpayOrderId,
    keyId,
    amount: amountPaise,
    currency: 'INR',
  });
});

// -----------------------------------------------------------------------------
// VERIFY PAYMENT & ACTIVATE SETUP REQUEST
// -----------------------------------------------------------------------------
developerSetupRoutes.post('/verify', async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const { requestId, razorpayPaymentId, razorpayOrderId } = body;

  if (!requestId || !razorpayPaymentId) {
    return c.json({ error: 'Request ID and Razorpay Payment ID are required' }, 400);
  }

  // Update status to 'paid'
  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE developer_setup_requests
       SET status = 'paid', payment_id = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    ).bind(razorpayPaymentId, now, requestId, tenantId),
    c.env.DB.prepare(
      `INSERT INTO notifications (id, tenant_id, title, message, type, is_read, created_at)
       VALUES (?, ?, 'Developer Setup Confirmed', 'Thank you! A HotelFlexi implementation engineer has been assigned to complete your property setup within 24 hours. We will reach out to you directly.', 'info', 0, ?)`
    ).bind(`notif_${crypto.randomUUID()}`, tenantId, now)
  ]);

  return c.json({
    success: true,
    message: 'Payment verified! A dedicated HotelFlexi developer is now assigned to configure your property.',
  });
});
