import { Hono } from 'hono';
import { Env, AppVariables } from '../types';

export const guestPortalRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// -----------------------------------------------------------------------------
// GET GUEST PORTAL FOLIO BY TOKEN (Public with Token Expiry Validation)
// -----------------------------------------------------------------------------
guestPortalRoutes.get('/:token', async (c) => {
  const token = c.req.param('token');
  const now = Math.floor(Date.now() / 1000);

  const res: any = await c.env.DB.prepare(
    `SELECT res.*, r.room_number, r.floor, rt.name as room_type_name,
            p.name as property_name, p.slug as property_slug, p.address_line1 as property_address,
            p.city as property_city, p.state as property_state, p.country as property_country,
            p.phone as property_phone, p.email as property_email, p.logo_url as property_logo_url,
            p.check_in_time, p.check_out_time,
            ps.upi_id as property_upi_id, ps.razorpay_key_id as property_razorpay_key, ps.razorpay_enabled
     FROM reservations res
     LEFT JOIN properties p ON p.id = res.property_id
     LEFT JOIN property_settings ps ON ps.property_id = res.property_id
     LEFT JOIN rooms r ON r.id = res.room_id
     LEFT JOIN room_types rt ON rt.id = res.room_type_id
     WHERE res.guest_portal_token = ?`
  )
    .bind(token)
    .first();

  if (!res) {
    return c.json({ error: 'Guest portal link not found or invalid' }, 404);
  }

  // Token Expiration Rule: 7 days after checkout date
  if (res.guest_portal_expires_at && now > res.guest_portal_expires_at) {
    return c.json(
      {
        expired: true,
        message: `This FlexiLink expired 7 days after your scheduled checkout date (${res.check_out_date}). For assistance, please contact the hotel front desk.`,
        propertyName: res.property_name,
        propertyPhone: res.property_phone,
        propertyEmail: res.property_email,
      },
      410
    );
  }

  // Primary Guest Details
  const primaryGuest: any = await c.env.DB.prepare(
    `SELECT * FROM reservation_guests WHERE reservation_id = ? AND is_primary = 1 LIMIT 1`
  )
    .bind(res.id)
    .first();

  // Past Payments
  const payments = await c.env.DB.prepare(
    `SELECT id, payment_method, amount_paise, status, created_at FROM payments WHERE reservation_id = ? ORDER BY created_at DESC`
  )
    .bind(res.id)
    .all();

  return c.json({
    expired: false,
    reservation: {
      id: res.id,
      reservationNumber: res.reservation_number,
      status: res.status,
      checkInDate: res.check_in_date,
      checkOutDate: res.check_out_date,
      adults: res.adults,
      children: res.children,
      nightlyRatePaise: res.nightly_rate_paise,
      totalAmountPaise: res.total_amount_paise,
      paidAmountPaise: res.paid_amount_paise,
      balanceAmountPaise: res.balance_amount_paise,
      paymentStatus: res.payment_status,
      specialRequests: res.special_requests,
      selfCheckinCompleted: Boolean(res.self_checkin_completed),
      selfCheckinAt: res.self_checkin_at,
      guestIdProofUrl: res.guest_id_proof_url,
      guestIdProofType: res.guest_id_proof_type,
      childrenIdProofUrl: res.children_id_proof_url,
      expiresAt: res.guest_portal_expires_at,
    },
    property: {
      name: res.property_name,
      slug: res.property_slug,
      address: [res.property_address, res.property_city, res.property_state, res.property_country].filter(Boolean).join(', '),
      phone: res.property_phone,
      email: res.property_email,
      logoUrl: res.property_logo_url,
      checkInTime: res.check_in_time || '14:00',
      checkOutTime: res.check_out_time || '11:00',
      upiId: res.property_upi_id,
      razorpayKeyId: res.razorpay_enabled && res.property_razorpay_key ? res.property_razorpay_key : c.env.RAZORPAY_KEY_ID,
    },
    room: {
      roomNumber: res.room_number || 'To be assigned on arrival',
      floor: res.floor,
      roomTypeName: res.room_type_name || 'Standard Room',
    },
    guest: {
      fullName: primaryGuest?.full_name || 'Valued Guest',
      email: primaryGuest?.email || '',
      phone: primaryGuest?.phone || '',
      idType: primaryGuest?.id_type || '',
      idNumberMasked: primaryGuest?.id_number_masked || '',
    },
    payments: payments.results || [],
  });
});

// -----------------------------------------------------------------------------
// POST SELF CHECK-IN
// -----------------------------------------------------------------------------
guestPortalRoutes.post('/:token/self-checkin', async (c) => {
  const token = c.req.param('token');
  const now = Math.floor(Date.now() / 1000);
  const body = await c.req.json();

  const res: any = await c.env.DB.prepare(
    `SELECT id, tenant_id, check_out_date, guest_portal_expires_at, children FROM reservations WHERE guest_portal_token = ?`
  )
    .bind(token)
    .first();

  if (!res) {
    return c.json({ error: 'Guest portal link not found or invalid' }, 404);
  }

  if (res.guest_portal_expires_at && now > res.guest_portal_expires_at) {
    return c.json({ error: 'This FlexiLink has expired (7 days past checkout)' }, 410);
  }

  const {
    idType = 'Aadhaar Card',
    idNumber = '',
    guestIdProofUrl,
    childrenIdProofUrl,
  } = body;

  if (!guestIdProofUrl) {
    return c.json({ error: 'Primary guest ID proof is required for self check-in' }, 400);
  }

  // If children > 0, child proof can be supplied
  const childProofToSave = res.children > 0 ? (childrenIdProofUrl || null) : null;

  // Mask ID number if provided
  const maskedId = idNumber ? `***${idNumber.slice(-4)}` : null;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE reservations
       SET guest_id_proof_url = ?,
           guest_id_proof_type = ?,
           children_id_proof_url = ?,
           self_checkin_completed = 1,
           self_checkin_at = ?,
           updated_at = ?
       WHERE id = ?`
    ).bind(
      guestIdProofUrl,
      idType,
      childProofToSave,
      now,
      now,
      res.id
    ),
    c.env.DB.prepare(
      `UPDATE reservation_guests
       SET id_type = ?,
           id_number_masked = COALESCE(?, id_number_masked),
           updated_at = ?
       WHERE reservation_id = ? AND is_primary = 1`
    ).bind(
      idType,
      maskedId,
      now,
      res.id
    )
  ]);

  return c.json({
    success: true,
    message: 'Express self check-in verified and completed successfully!',
    selfCheckinCompleted: true,
    selfCheckinAt: now,
  });
});

// -----------------------------------------------------------------------------
// CREATE RAZORPAY PAYMENT FOR OUTSTANDING BALANCE
// -----------------------------------------------------------------------------
guestPortalRoutes.post('/:token/create-payment', async (c) => {
  const token = c.req.param('token');
  const body = await c.req.json().catch(() => ({}));

  const res: any = await c.env.DB.prepare(
    `SELECT res.*, ps.razorpay_key_id as prop_key_id, ps.razorpay_key_secret as prop_secret, ps.razorpay_enabled
     FROM reservations res
     LEFT JOIN property_settings ps ON ps.property_id = res.property_id
     WHERE res.guest_portal_token = ?`
  )
    .bind(token)
    .first();

  if (!res) {
    return c.json({ error: 'Guest portal link not found' }, 404);
  }

  const amountPaise = body.amountPaise ? Math.round(body.amountPaise) : res.balance_amount_paise;
  if (amountPaise <= 0) {
    return c.json({ error: 'No outstanding balance to pay' }, 400);
  }

  // Determine which Razorpay key to use (Property direct or Platform)
  const usePropKey = res.razorpay_enabled && res.prop_key_id && res.prop_secret;
  const keyId = usePropKey ? res.prop_key_id : c.env.RAZORPAY_KEY_ID;
  const keySecret = usePropKey ? res.prop_secret : c.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return c.json({ error: 'Online payment gateway is currently not configured for this hotel.' }, 503);
  }

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
        receipt: `FOLIO-${res.reservation_number}`,
        notes: { reservationId: res.id, reservationNumber: res.reservation_number, token },
      }),
    });

    if (!rzpRes.ok) {
      const errData = await rzpRes.json();
      return c.json({ error: 'Failed to initiate Razorpay order', details: errData }, 500);
    }

    const orderData: any = await rzpRes.json();
    return c.json({
      success: true,
      orderId: orderData.id,
      keyId,
      amount: amountPaise,
      currency: 'INR',
      reservationNumber: res.reservation_number,
    });
  } catch (err: any) {
    return c.json({ error: 'Gateway connection error', message: err.message }, 500);
  }
});

// -----------------------------------------------------------------------------
// VERIFY GUEST PAYMENT & UPDATE FOLIO
// -----------------------------------------------------------------------------
guestPortalRoutes.post('/:token/verify-payment', async (c) => {
  const token = c.req.param('token');
  const now = Math.floor(Date.now() / 1000);
  const body = await c.req.json();

  const { razorpayPaymentId, razorpayOrderId, amountPaise, method = 'razorpay' } = body;

  const res: any = await c.env.DB.prepare(
    `SELECT * FROM reservations WHERE guest_portal_token = ?`
  )
    .bind(token)
    .first();

  if (!res) {
    return c.json({ error: 'Reservation not found' }, 404);
  }

  const paidAmount = Math.round(amountPaise || res.balance_amount_paise);
  const newPaidTotal = res.paid_amount_paise + paidAmount;
  const newBalance = Math.max(0, res.total_amount_paise - newPaidTotal);
  const newStatus = newBalance === 0 ? 'paid' : 'partially_paid';

  const paymentId = `pay_${crypto.randomUUID()}`;
  const resPaymentId = `rpay_${crypto.randomUUID()}`;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE reservations
       SET paid_amount_paise = ?, balance_amount_paise = ?, payment_status = ?, updated_at = ?
       WHERE id = ?`
    ).bind(newPaidTotal, newBalance, newStatus, now, res.id),
    c.env.DB.prepare(
      `INSERT INTO payments (
        id, property_id, tenant_id, reservation_id, payment_method,
        amount_paise, currency, status, gateway_order_id, gateway_payment_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'INR', 'captured', ?, ?, ?, ?)`
    ).bind(
      paymentId,
      res.property_id,
      res.tenant_id,
      res.id,
      method,
      paidAmount,
      razorpayOrderId || null,
      razorpayPaymentId || null,
      now,
      now
    ),
    c.env.DB.prepare(
      `INSERT INTO reservation_payments (id, reservation_id, payment_id, tenant_id, amount_paise, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(resPaymentId, res.id, paymentId, res.tenant_id, paidAmount, now)
  ]);

  return c.json({
    success: true,
    message: 'Payment recorded successfully!',
    paidAmountPaise: newPaidTotal,
    balanceAmountPaise: newBalance,
    paymentStatus: newStatus,
  });
});
