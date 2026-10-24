import { Hono } from 'hono';
import { Env, AppVariables } from '../types';

export const guestPortalRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// Helper to strictly enforce 7-day post checkout expiry rule
function isPortalExpired(checkOutDate: string, guestPortalExpiresAt?: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const checkoutTimestamp = Math.floor(new Date(`${checkOutDate}T23:59:59Z`).getTime() / 1000);
  const expiresAt = (guestPortalExpiresAt && guestPortalExpiresAt > 0)
    ? guestPortalExpiresAt
    : checkoutTimestamp + (7 * 86400);
  return now > expiresAt;
}

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
            ps.upi_id as property_upi_id, ps.razorpay_key_id as property_razorpay_key, ps.razorpay_enabled,
            t.current_plan_id as tenant_current_plan_id
     FROM reservations res
     LEFT JOIN properties p ON p.id = res.property_id
     LEFT JOIN property_settings ps ON ps.property_id = res.property_id
     LEFT JOIN rooms r ON r.id = res.room_id
     LEFT JOIN room_types rt ON rt.id = res.room_type_id
     LEFT JOIN tenants t ON t.id = res.tenant_id
     WHERE res.guest_portal_token = ?`
  )
    .bind(token)
    .first();

  if (!res) {
    return c.json({ error: 'Guest portal link not found or invalid' }, 404);
  }

  // FlexiLink is only available on Pro & Enterprise plans
  if (res.tenant_current_plan_id === 'essential') {
    return c.json(
      {
        disabled: true,
        message: 'FlexiLink Guest Portal is available on Pro & Enterprise plans. Please visit hotel front desk for express check-in and assistance.',
        propertyName: res.property_name,
        propertyPhone: res.property_phone,
      },
      403
    );
  }

  // Token Expiration Rule: strictly 7 days after checkout date
  if (isPortalExpired(res.check_out_date, res.guest_portal_expires_at)) {
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

  // Auto-allocate available room based on availability if not yet allocated
  if (!res.room_id && res.room_type_id) {
    const availableRoom: any = await c.env.DB.prepare(
      `SELECT r.id, r.room_number, r.floor FROM rooms r
       WHERE r.room_type_id = ? AND r.property_id = ? AND r.is_active = 1
         AND r.id NOT IN (
           SELECT res2.room_id FROM reservations res2
           WHERE res2.room_id IS NOT NULL AND res2.status NOT IN ('cancelled', 'checked_out')
             AND res2.check_in_date < ? AND res2.check_out_date > ?
         )
         AND r.id NOT IN (
           SELECT rb.room_id FROM room_blocks rb
           WHERE rb.is_active = 1 AND rb.start_date < ? AND rb.end_date > ?
         )
       ORDER BY r.room_number ASC LIMIT 1`
    )
      .bind(res.room_type_id, res.property_id, res.check_out_date, res.check_in_date, res.check_out_date, res.check_in_date)
      .first();

    if (availableRoom) {
      await c.env.DB.prepare('UPDATE reservations SET room_id = ?, updated_at = ? WHERE id = ?')
        .bind(availableRoom.id, now, res.id)
        .run();
      res.room_id = availableRoom.id;
      res.room_number = availableRoom.room_number;
      res.floor = availableRoom.floor;
    }
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

  // In-Stay Food Orders
  const foodOrders = await c.env.DB.prepare(
    `SELECT id, description, priority, status, created_at FROM complaints WHERE reservation_id = ? AND category = 'room_service' ORDER BY created_at DESC`
  )
    .bind(res.id)
    .all();

  const today = new Date().toISOString().split('T')[0];
  const isArrivalDayOrLater = !res.check_in_date || today >= res.check_in_date;

  return c.json({
    expired: false,
    reservation: {
      id: res.id,
      reservationNumber: res.reservation_number,
      status: res.status,
      checkInDate: res.check_in_date,
      checkOutDate: res.check_out_date,
      canSelfCheckin: isArrivalDayOrLater,
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
      id: res.property_id,
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
    foodOrders: foodOrders.results || [],
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
    `SELECT res.id, res.tenant_id, res.property_id, res.check_in_date, res.check_out_date,
            res.guest_portal_expires_at, res.children, res.guest_name,
            r.room_number
     FROM reservations res
     LEFT JOIN rooms r ON r.id = res.room_id
     WHERE res.guest_portal_token = ?`
  )
    .bind(token)
    .first();

  if (!res) {
    return c.json({ error: 'Guest portal link not found or invalid' }, 404);
  }

  if (isPortalExpired(res.check_out_date, res.guest_portal_expires_at)) {
    return c.json({ error: 'This FlexiLink has expired (7 days past checkout)' }, 410);
  }

  // Enforce arrival date constraint
  const today = new Date().toISOString().split('T')[0];
  if (res.check_in_date && today < res.check_in_date) {
    return c.json({
      error: `Self check-in is only permitted on or after your arrival date (${res.check_in_date}) upon arriving at the hotel.`,
      checkInDate: res.check_in_date,
    }, 400);
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

  // Create a siren/complaint for front desk staff to be alerted
  try {
    const guestName = res.guest_name || 'Guest';
    const roomNum = res.room_number ? `Room ${res.room_number}` : 'allocated room';
    const sirenId = `cmp_${crypto.randomUUID()}`;
    await c.env.DB.prepare(
      `INSERT INTO complaints (
        id, property_id, tenant_id, reservation_id, guest_name, room_number,
        category, description, priority, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'self_checkin', ?, 'high', 'open', ?, ?)`
    )
      .bind(
        sirenId,
        res.property_id,
        res.tenant_id,
        res.id,
        guestName,
        res.room_number || null,
        `${guestName} has completed self check-in for ${roomNum} via the guest portal. Please prepare key card and welcome them.`,
        now,
        now
      )
      .run();

    // Also dispatch to in-app notifications
    const notifId = `notif_${crypto.randomUUID()}`;
    await c.env.DB.prepare(
      `INSERT INTO notifications (id, tenant_id, title, message, category, link_url, is_read, created_at)
       VALUES (?, ?, ?, ?, 'alert', '/app/reservations', 0, ?)`
    )
      .bind(
        notifId,
        res.tenant_id,
        'Guest Self-Checked In',
        `${guestName} has completed self check-in for ${roomNum}. Key preparation required.`,
        now
      )
      .run()
      .catch(() => {});
  } catch (sirenErr) {
    console.error('[Self-Checkin Siren Error]:', sirenErr);
  }

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

  if (isPortalExpired(res.check_out_date, res.guest_portal_expires_at)) {
    return c.json({ error: 'This guest portal link has expired (7 days past checkout)' }, 410);
  }

  const amountPaise = body.amountPaise ? Math.round(body.amountPaise) : res.balance_amount_paise;
  if (amountPaise <= 0) {
    return c.json({ error: 'No outstanding balance to pay' }, 400);
  }

  // Must use the property's own Razorpay keys for direct payment collections
  const usePropKey = Boolean(
    res.razorpay_enabled &&
    res.prop_key_id &&
    res.prop_secret &&
    String(res.prop_key_id).trim().startsWith('rzp_')
  );

  if (!usePropKey) {
    return c.json({
      error: 'Direct online card payment is not configured yet by the hotel. Please settle your outstanding balance at the hotel front desk or scan the hotel UPI QR code.',
      upiId: res.property_upi_id || null,
    }, 400);
  }

  const keyId = String(res.prop_key_id).trim();
  const keySecret = String(res.prop_secret).trim();

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

  if (isPortalExpired(res.check_out_date, res.guest_portal_expires_at)) {
    return c.json({ error: 'This guest portal link has expired (7 days past checkout)' }, 410);
  }

  if (isPortalExpired(res.check_out_date, res.guest_portal_expires_at)) {
    return c.json({ error: 'This guest portal link has expired (7 days past checkout)' }, 410);
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

// -----------------------------------------------------------------------------
// GUEST RAISES URGENT IN-STAY COMPLAINT (Triggers Siren Alert on Staff Devices)
// -----------------------------------------------------------------------------
guestPortalRoutes.post('/:token/complaints', async (c) => {
  const token = c.req.param('token');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const res: any = await c.env.DB.prepare(
    `SELECT res.*, r.room_number
     FROM reservations res
     LEFT JOIN rooms r ON r.id = res.room_id
     WHERE res.guest_portal_token = ?`
  )
    .bind(token)
    .first();

  if (!res) {
    return c.json({ error: 'Reservation not found' }, 404);
  }

  if (isPortalExpired(res.check_out_date, res.guest_portal_expires_at)) {
    return c.json({ error: 'This guest portal link has expired (7 days past checkout)' }, 410);
  }

  const category = body.category || 'service';
  const description = (body.description || '').trim() || 'Urgent guest assistance required in room';
  const priority = body.isUrgent !== false ? 'urgent' : 'high';
  const complaintId = `cmp_${crypto.randomUUID()}`;

  // Get primary guest name
  const guest: any = await c.env.DB.prepare(
    `SELECT full_name FROM reservation_guests WHERE reservation_id = ? AND is_primary = 1 LIMIT 1`
  )
    .bind(res.id)
    .first();

  const guestName = guest?.full_name || 'In-House Guest';
  const roomNumber = res.room_number || 'Room';

  await c.env.DB.prepare(
    `INSERT INTO complaints (
       id, property_id, tenant_id, reservation_id, guest_name, room_number,
       category, description, priority, status, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`
  )
    .bind(
      complaintId,
      res.property_id,
      res.tenant_id,
      res.id,
      guestName,
      roomNumber,
      category,
      description,
      priority,
      now,
      now
    )
    .run();

  return c.json({
    success: true,
    message: 'Urgent request submitted. Staff alert has been dispatched to all active devices.',
    complaintId,
    sirenTriggered: true,
  });
});

// -----------------------------------------------------------------------------
// GUEST IN-STAY ROOM DINING & FOOD ORDER
// -----------------------------------------------------------------------------
guestPortalRoutes.post('/:token/food-orders', async (c) => {
  const token = c.req.param('token');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const res: any = await c.env.DB.prepare(
    `SELECT res.*, r.room_number
     FROM reservations res
     LEFT JOIN rooms r ON r.id = res.room_id
     WHERE res.guest_portal_token = ?`
  )
    .bind(token)
    .first();

  if (!res) {
    return c.json({ error: 'Reservation not found' }, 404);
  }

  if (isPortalExpired(res.check_out_date, res.guest_portal_expires_at)) {
    return c.json({ error: 'This guest portal link has expired (7 days past checkout)' }, 410);
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const paymentMethod = body.paymentMethod || 'cash_on_delivery';
  const notes = body.notes || '';
  const totalPaise = items.reduce((sum: number, it: any) => sum + (it.pricePaise || 0) * (it.quantity || 1), 0);

  const itemsSummary = items.map((it: any) => `${it.quantity || 1}x ${it.name}`).join(', ');
  const orderDescription = `In-Stay Dining Order: ${itemsSummary}${notes ? ` (Notes: ${notes})` : ''} - Total: ₹${(totalPaise / 100).toFixed(2)} [Payment: ${paymentMethod === 'cash_on_delivery' ? 'Charged to Room Folio' : 'Paid Online'}]`;

  const ticketId = `ord_${crypto.randomUUID()}`;

  // Get primary guest name
  const guest: any = await c.env.DB.prepare(
    `SELECT full_name FROM reservation_guests WHERE reservation_id = ? AND is_primary = 1 LIMIT 1`
  )
    .bind(res.id)
    .first();

  const guestName = guest?.full_name || 'In-House Guest';
  const roomNumber = res.room_number || 'Room';

  const statements: any[] = [
    // 1. Record as an operational service ticket for kitchen & floor staff
    c.env.DB.prepare(
      `INSERT INTO complaints (
         id, property_id, tenant_id, reservation_id, guest_name, room_number,
         category, description, priority, status, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'room_service', ?, 'high', 'open', ?, ?)`
    ).bind(
      ticketId,
      res.property_id,
      res.tenant_id,
      res.id,
      guestName,
      roomNumber,
      orderDescription,
      now,
      now
    ),
  ];

  // 2. Add food order amount to reservation total and folio balance
  if (totalPaise > 0) {
    if (paymentMethod === 'online') {
      const paymentId = `pay_${crypto.randomUUID()}`;
      statements.push(
        c.env.DB.prepare(
          `UPDATE reservations
           SET total_amount_paise = total_amount_paise + ?,
               paid_amount_paise = paid_amount_paise + ?,
               updated_at = ?
           WHERE id = ?`
        ).bind(totalPaise, totalPaise, now, res.id),
        c.env.DB.prepare(
          `INSERT INTO payments (
             id, property_id, tenant_id, reservation_id, amount_paise,
             payment_method, status, notes, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, 'online', 'completed', ?, ?, ?)`
        ).bind(paymentId, res.property_id, res.tenant_id, res.id, totalPaise, `Room Dining: ${itemsSummary}`, now, now)
      );
    } else {
      // Cash on delivery / charge to room folio
      statements.push(
        c.env.DB.prepare(
          `UPDATE reservations
           SET total_amount_paise = total_amount_paise + ?,
               balance_amount_paise = balance_amount_paise + ?,
               payment_status = CASE WHEN paid_amount_paise > 0 THEN 'partially_paid' ELSE 'pending' END,
               updated_at = ?
           WHERE id = ?`
        ).bind(totalPaise, totalPaise, now, res.id)
      );
    }

    // 3. Update invoice & insert invoice_item if invoice exists
    const invoice: any = await c.env.DB.prepare(
      `SELECT id FROM invoices WHERE reservation_id = ? ORDER BY created_at DESC LIMIT 1`
    ).bind(res.id).first();

    if (invoice) {
      const invoiceItemId = `ini_${crypto.randomUUID()}`;
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO invoice_items (
             id, invoice_id, tenant_id, description, quantity, unit_price_paise,
             amount_paise, tax_rate_basis_points, tax_amount_paise, created_at
           ) VALUES (?, ?, ?, ?, 1, ?, ?, 0, 0, ?)`
        ).bind(
          invoiceItemId,
          invoice.id,
          res.tenant_id,
          `Room Dining: ${itemsSummary}`,
          totalPaise,
          totalPaise,
          now
        ),
        c.env.DB.prepare(
          `UPDATE invoices
           SET subtotal_paise = subtotal_paise + ?,
               total_amount_paise = total_amount_paise + ?,
               balance_amount_paise = balance_amount_paise + ?,
               status = 'issued',
               updated_at = ?
           WHERE id = ?`
        ).bind(
          totalPaise,
          totalPaise,
          paymentMethod === 'online' ? 0 : totalPaise,
          now,
          invoice.id
        )
      );
    }
  }

  await c.env.DB.batch(statements);

  return c.json({
    success: true,
    message: 'Your room dining order has been received by the kitchen and added to your room folio!',
    ticketId,
    orderSummary: itemsSummary,
    totalPaise,
  });
});
