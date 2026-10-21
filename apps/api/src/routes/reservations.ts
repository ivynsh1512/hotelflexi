import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';
import { sendBookingEmails, sendCancellationEmail } from '../services/email';

export const reservationRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

reservationRoutes.use('*', authMiddleware, tenantMiddleware);

// Helper: Calculate nights between dates
function getNights(start: string, end: string): number {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
}

// -----------------------------------------------------------------------------
// LIST & SEARCH RESERVATIONS
// -----------------------------------------------------------------------------
reservationRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const status = c.req.query('status');
  const queryText = c.req.query('q');
  const date = c.req.query('date'); // check-in or active date

  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

  // Auto-cleanup: permanently purge cancelled reservations older than 30 days from database
  try {
    const expiredCancelledQuery = await c.env.DB.prepare(
      `SELECT id FROM reservations
       WHERE tenant_id = ? AND status = 'cancelled'
         AND (cancelled_at <= ? OR (cancelled_at IS NULL AND updated_at <= ?))`
    )
      .bind(tenantId, thirtyDaysAgo, thirtyDaysAgo)
      .all();

    const expiredList = (expiredCancelledQuery.results || []) as { id: string }[];
    if (expiredList.length > 0) {
      const deleteStatements: any[] = [];
      for (const item of expiredList) {
        deleteStatements.push(c.env.DB.prepare('DELETE FROM reservation_guests WHERE reservation_id = ?').bind(item.id));
        deleteStatements.push(c.env.DB.prepare('DELETE FROM invoices WHERE reservation_id = ?').bind(item.id));
        deleteStatements.push(c.env.DB.prepare('DELETE FROM reservations WHERE id = ?').bind(item.id));
      }
      c.executionCtx.waitUntil(
        c.env.DB.batch(deleteStatements).catch((err) =>
          console.error('[Auto-delete Cancelled Reservations Error]', err)
        )
      );
    }
  } catch (cleanErr) {
    console.error('[Auto-delete Cancelled Check Error]', cleanErr);
  }

  let sql = `
    SELECT res.*, rg.full_name as guest_name, rg.email as guest_email, rg.phone as guest_phone,
           r.room_number, rt.name as room_type_name
    FROM reservations res
    LEFT JOIN reservation_guests rg ON rg.reservation_id = res.id AND rg.is_primary = 1
    LEFT JOIN rooms r ON r.id = res.room_id
    LEFT JOIN room_types rt ON rt.id = res.room_type_id
    WHERE res.tenant_id = ?
      AND NOT (res.status = 'cancelled' AND (res.cancelled_at <= ? OR (res.cancelled_at IS NULL AND res.updated_at <= ?)))
  `;
  const params: any[] = [tenantId, thirtyDaysAgo, thirtyDaysAgo];

  if (propertyId) {
    sql += ` AND res.property_id = ?`;
    params.push(propertyId);
  }
  if (status) {
    sql += ` AND res.status = ?`;
    params.push(status);
  }
  if (date) {
    sql += ` AND res.check_in_date <= ? AND res.check_out_date > ?`;
    params.push(date, date);
  }
  if (queryText) {
    sql += ` AND (res.reservation_number LIKE ? OR rg.full_name LIKE ? OR rg.phone LIKE ?)`;
    const searchParam = `%${queryText}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  sql += ` ORDER BY res.created_at DESC LIMIT 100`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ reservations: rows.results || [] });
});

// -----------------------------------------------------------------------------
// GET RESERVATION DETAILS
// -----------------------------------------------------------------------------
reservationRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');

  const res: any = await c.env.DB.prepare(
    `SELECT res.*, r.room_number, r.floor, rt.name as room_type_name,
            p.name as property_name, p.currency, p.check_in_time, p.check_out_time
     FROM reservations res
     LEFT JOIN rooms r ON r.id = res.room_id
     LEFT JOIN room_types rt ON rt.id = res.room_type_id
     LEFT JOIN properties p ON p.id = res.property_id
     WHERE res.id = ? AND res.tenant_id = ?`
  )
    .bind(id, tenantId)
    .first();

  if (!res) {
    return c.json({ error: 'Reservation not found' }, 404);
  }

  // Guests
  const guests = await c.env.DB.prepare(
    `SELECT * FROM reservation_guests WHERE reservation_id = ? ORDER BY is_primary DESC`
  )
    .bind(id)
    .all();

  // Invoices & Items
  const invoices = await c.env.DB.prepare(
    `SELECT * FROM invoices WHERE reservation_id = ? ORDER BY created_at DESC`
  )
    .bind(id)
    .all();

  // Payments
  const payments = await c.env.DB.prepare(
    `SELECT * FROM payments WHERE reservation_id = ? ORDER BY created_at DESC`
  )
    .bind(id)
    .all();

  return c.json({
    reservation: res,
    guests: guests.results || [],
    invoices: invoices.results || [],
    payments: payments.results || [],
  });
});

// -----------------------------------------------------------------------------
// CREATE RESERVATION (Direct, Walk-in, Booking Engine)
// -----------------------------------------------------------------------------
reservationRoutes.post('/', requireRole(['owner', 'manager', 'receptionist']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const {
    propertyId,
    roomId,
    roomTypeId,
    checkInDate,
    checkOutDate,
    guestName,
    guestPhone,
    guestEmail,
    adults = 1,
    children = 0,
    source = 'direct',
    ratePlanId,
    specialRequests,
    advancePaidPaise = 0,
    paymentMethod = 'cash',
  } = body;

  if (!propertyId || !roomTypeId || !checkInDate || !checkOutDate || !guestName) {
    return c.json({ error: 'Property ID, Room Type ID, dates, and Guest Name are required' }, 400);
  }

  if (checkInDate >= checkOutDate) {
    return c.json({ error: 'Check-out date must be strictly after check-in date' }, 400);
  }

  // If specific room requested, perform strict conflict checks
  let assignedRoomId: string | null = roomId || null;
  let assignedRoomNumber: string | undefined = undefined;

  if (assignedRoomId) {
    const resConflict: any = await c.env.DB.prepare(
      `SELECT id, reservation_number FROM reservations
       WHERE room_id = ? AND tenant_id = ?
         AND status NOT IN ('cancelled', 'checked_out')
         AND check_in_date < ? AND check_out_date > ?`
    )
      .bind(assignedRoomId, tenantId, checkOutDate, checkInDate)
      .first();

    if (resConflict) {
      return c.json(
        {
          error: `Room is already booked under reservation #${resConflict.reservation_number} for this period.`,
          code: 'ROOM_CONFLICT',
        },
        409
      );
    }

    const blockConflict: any = await c.env.DB.prepare(
      `SELECT id, reason FROM room_blocks
       WHERE room_id = ? AND tenant_id = ? AND is_active = 1
         AND start_date < ? AND end_date > ?`
    )
      .bind(assignedRoomId, tenantId, checkOutDate, checkInDate)
      .first();

    if (blockConflict) {
      return c.json(
        {
          error: `Room is currently blocked for '${blockConflict.reason}' during selected dates.`,
          code: 'ROOM_BLOCKED',
        },
        409
      );
    }

    const roomRow: any = await c.env.DB.prepare('SELECT room_number FROM rooms WHERE id = ?').bind(assignedRoomId).first();
    assignedRoomNumber = roomRow?.room_number;
  } else {
    // Auto-allocate available room based on availability
    const availableRoom: any = await c.env.DB.prepare(
      `SELECT r.id, r.room_number FROM rooms r
       WHERE r.room_type_id = ? AND r.property_id = ? AND r.is_active = 1
         AND r.id NOT IN (
           SELECT res.room_id FROM reservations res
           WHERE res.room_id IS NOT NULL AND res.status NOT IN ('cancelled', 'checked_out')
             AND res.check_in_date < ? AND res.check_out_date > ?
         )
         AND r.id NOT IN (
           SELECT rb.room_id FROM room_blocks rb
           WHERE rb.is_active = 1 AND rb.start_date < ? AND rb.end_date > ?
         )
       ORDER BY r.room_number ASC LIMIT 1`
    )
      .bind(roomTypeId, propertyId, checkOutDate, checkInDate, checkOutDate, checkInDate)
      .first();

    if (availableRoom) {
      assignedRoomId = availableRoom.id;
      assignedRoomNumber = availableRoom.room_number;
    }
  }

  // Get Property details for child policies and contact info
  const property: any = await c.env.DB.prepare(
    'SELECT * FROM properties WHERE id = ? AND tenant_id = ?'
  )
    .bind(propertyId, tenantId)
    .first();

  // Get Room Type Pricing & Name
  const roomType: any = await c.env.DB.prepare(
    'SELECT id, name, base_price_paise, weekend_price_paise, extra_adult_price_paise, extra_child_price_paise FROM room_types WHERE id = ? AND tenant_id = ?'
  )
    .bind(roomTypeId, tenantId)
    .first();

  if (!roomType) {
    return c.json({ error: 'Selected room type does not exist' }, 404);
  }

  const nights = getNights(checkInDate, checkOutDate);

  // Check Daily Rate Overrides
  const dailyRateRows: any = await c.env.DB.prepare(
    `SELECT date, price_paise FROM daily_rates
     WHERE room_type_id = ? AND date >= ? AND date < ?`
  )
    .bind(roomTypeId, checkInDate, checkOutDate)
    .all();

  const dailyOverrides = new Map<string, number>();
  for (const dr of dailyRateRows.results || []) {
    dailyOverrides.set(dr.date, dr.price_paise);
  }

  let calculatedRoomChargePaise = 0;
  const currentD = new Date(checkInDate);
  const endD = new Date(checkOutDate);

  while (currentD < endD) {
    const dStr = currentD.toISOString().split('T')[0];
    const isWeekend = currentD.getDay() === 0 || currentD.getDay() === 6;
    if (dailyOverrides.has(dStr)) {
      calculatedRoomChargePaise += dailyOverrides.get(dStr)!;
    } else if (body.nightlyRatePaise) {
      calculatedRoomChargePaise += body.nightlyRatePaise;
    } else if (isWeekend && roomType.weekend_price_paise) {
      calculatedRoomChargePaise += roomType.weekend_price_paise;
    } else {
      calculatedRoomChargePaise += roomType.base_price_paise;
    }
    currentD.setDate(currentD.getDate() + 1);
  }

  const nightlyRatePaise = Math.round(calculatedRoomChargePaise / nights);

  // Child Pricing Rules:
  // Admin can select cutoff age (default <= 10 yrs is child; > 10 yrs is extra adult)
  const childCutoffAge = property?.child_cutoff_age ?? 10;
  const configuredChildRatePaise = property?.child_rate_paise ?? roomType.extra_child_price_paise ?? 0;
  const extraAdultPricePaise = roomType.extra_adult_price_paise !== undefined && roomType.extra_adult_price_paise !== null
    ? roomType.extra_adult_price_paise
    : Math.round(roomType.base_price_paise * 0.3);

  // Extra Adult Surcharge (when adults > base_occupancy)
  const baseOccupancy = roomType.base_occupancy || 2;
  const extraAdultsCount = Math.max(0, adults - baseOccupancy);
  const extraAdultSurchargePaise = extraAdultsCount * extraAdultPricePaise * nights;

  let childSurchargePaise = 0;
  if (Array.isArray(body.childAges) && body.childAges.length > 0) {
    for (const age of body.childAges) {
      if (age > childCutoffAge) {
        childSurchargePaise += extraAdultPricePaise * nights;
      } else {
        childSurchargePaise += configuredChildRatePaise * nights;
      }
    }
  } else if (children > 0) {
    childSurchargePaise = children * configuredChildRatePaise * nights;
  }

  const totalRoomChargePaise = calculatedRoomChargePaise + extraAdultSurchargePaise + childSurchargePaise;

  // Coupon Code Application
  let discountPaise = body.discountPaise ? Math.round(body.discountPaise) : 0;
  let appliedCouponId: string | null = null;

  if (body.couponCode) {
    const cCode = String(body.couponCode).trim().toUpperCase();
    const coupon: any = await c.env.DB.prepare(
      `SELECT * FROM coupons WHERE property_id = ? AND UPPER(code) = ? AND is_active = 1`
    )
      .bind(propertyId, cCode)
      .first();

    if (coupon) {
      const today = checkInDate;
      const isValidDate = (!coupon.valid_from || coupon.valid_from <= today) && (!coupon.valid_to || coupon.valid_to >= today);
      const isUnderLimit = !coupon.usage_limit || coupon.times_used < coupon.usage_limit;
      const meetsMinSpend = !coupon.min_booking_amount_paise || totalRoomChargePaise >= coupon.min_booking_amount_paise;

      if (isValidDate && isUnderLimit && meetsMinSpend) {
        appliedCouponId = coupon.id;
        if (coupon.discount_type === 'percentage') {
          let calculated = Math.round((totalRoomChargePaise * coupon.discount_value) / 100);
          if (coupon.max_discount_paise && calculated > coupon.max_discount_paise) {
            calculated = coupon.max_discount_paise;
          }
          discountPaise = calculated;
        } else {
          discountPaise = Math.min(totalRoomChargePaise, coupon.discount_value);
        }
      }
    }
  }

  // Indian GST Tax Rules:
  // Standard basis: 12% if daily rate <= ₹7,500 (750000 paise), 18% if > ₹7,500
  const gstRateBasisPoints = nightlyRatePaise > 750000 ? 1800 : 1200;
  const totalTaxPaise = Math.round((totalRoomChargePaise * gstRateBasisPoints) / 10000);
  const totalAmountPaise = Math.max(0, totalRoomChargePaise + totalTaxPaise - discountPaise);
  const paidPaise = Math.min(totalAmountPaise, Math.max(0, Math.round(advancePaidPaise)));
  const balancePaise = totalAmountPaise - paidPaise;

  const paymentStatus =
    paidPaise >= totalAmountPaise ? 'paid' : paidPaise > 0 ? 'partially_paid' : 'pending';

  const reservationId = `res_${crypto.randomUUID()}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const reservationNumber = `RES-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;

  // FlexiLink Guest Portal Token & Expiry: 7 days after checkout
  const guestPortalToken = crypto.randomUUID();
  const guestPortalExpiresAt = Math.floor(new Date(`${checkOutDate}T23:59:59Z`).getTime() / 1000) + (7 * 86400);

  const guestId = `gst_${crypto.randomUUID()}`;
  const invoiceId = `inv_${crypto.randomUUID()}`;
  const invoiceItemId = `ini_${crypto.randomUUID()}`;
  const invoiceNumber = `INV-${randomSuffix}`;

  const statements: any[] = [];

  // 1. Insert Reservation with FlexiLink credentials
  statements.push(
    c.env.DB.prepare(
      `INSERT INTO reservations (
        id, property_id, tenant_id, reservation_number, source, status,
        room_id, room_type_id, rate_plan_id, check_in_date, check_out_date,
        adults, children, nightly_rate_paise, total_room_charge_paise,
        total_tax_paise, total_discount_paise, total_amount_paise, paid_amount_paise,
        balance_amount_paise, payment_status, special_requests, created_by_user_id,
        guest_portal_token, guest_portal_expires_at, self_checkin_completed,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).bind(
      reservationId,
      propertyId,
      tenantId,
      reservationNumber,
      source,
      assignedRoomId,
      roomTypeId,
      ratePlanId || null,
      checkInDate,
      checkOutDate,
      adults,
      children,
      nightlyRatePaise,
      totalRoomChargePaise,
      totalTaxPaise,
      discountPaise,
      totalAmountPaise,
      paidPaise,
      balancePaise,
      paymentStatus,
      specialRequests || null,
      user.uid,
      guestPortalToken,
      guestPortalExpiresAt,
      now,
      now
    )
  );

  // 2. Insert Primary Guest
  statements.push(
    c.env.DB.prepare(
      `INSERT INTO reservation_guests (
        id, reservation_id, tenant_id, is_primary, full_name, email, phone,
        id_type, id_number_masked, created_at, updated_at
      ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      guestId,
      reservationId,
      tenantId,
      guestName,
      guestEmail || null,
      guestPhone || null,
      body.idType || null,
      body.idNumber ? `***${body.idNumber.slice(-4)}` : null,
      now,
      now
    )
  );

  // 3. Generate Tax-Aware Invoice
  const cgstPaise = Math.round(totalTaxPaise / 2);
  const sgstPaise = totalTaxPaise - cgstPaise;

  statements.push(
    c.env.DB.prepare(
      `INSERT INTO invoices (
        id, property_id, tenant_id, reservation_id, invoice_number, status,
        guest_name, guest_email, guest_phone, issue_date, subtotal_paise,
        cgst_paise, sgst_paise, igst_paise, total_tax_paise, discount_paise,
        total_amount_paise, paid_amount_paise, balance_amount_paise, tax_snapshot_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      invoiceId,
      propertyId,
      tenantId,
      reservationId,
      invoiceNumber,
      paidPaise >= totalAmountPaise ? 'paid' : 'issued',
      guestName,
      guestEmail || null,
      guestPhone || null,
      checkInDate,
      totalRoomChargePaise,
      cgstPaise,
      sgstPaise,
      totalTaxPaise,
      discountPaise,
      totalAmountPaise,
      paidPaise,
      balancePaise,
      JSON.stringify({ gstRateBasisPoints, cgstRate: gstRateBasisPoints / 2, sgstRate: gstRateBasisPoints / 2 }),
      now,
      now
    )
  );

  // 4. Insert Invoice Line Item
  statements.push(
    c.env.DB.prepare(
      `INSERT INTO invoice_items (
        id, invoice_id, tenant_id, description, quantity, unit_price_paise,
        amount_paise, tax_rate_basis_points, tax_amount_paise, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      invoiceItemId,
      invoiceId,
      tenantId,
      `Room Accommodation (${nights} Nights) - ${checkInDate} to ${checkOutDate}`,
      nights,
      nightlyRatePaise,
      totalRoomChargePaise,
      gstRateBasisPoints,
      totalTaxPaise,
      now
    )
  );

  // 5. If advance paid, record payment
  if (paidPaise > 0) {
    const paymentId = `pay_${crypto.randomUUID()}`;
    const resPaymentId = `rpay_${crypto.randomUUID()}`;

    statements.push(
      c.env.DB.prepare(
        `INSERT INTO payments (
          id, property_id, tenant_id, reservation_id, invoice_id,
          payment_method, amount_paise, currency, status, recorded_by_user_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', 'captured', ?, ?, ?)`
      ).bind(
        paymentId,
        propertyId,
        tenantId,
        reservationId,
        invoiceId,
        paymentMethod,
        paidPaise,
        user.uid,
        now,
        now
      )
    );

    statements.push(
      c.env.DB.prepare(
        `INSERT INTO reservation_payments (id, reservation_id, payment_id, tenant_id, amount_paise, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(resPaymentId, reservationId, paymentId, tenantId, paidPaise, now)
    );
  }

  if (appliedCouponId) {
    statements.push(
      c.env.DB.prepare('UPDATE coupons SET times_used = times_used + 1, updated_at = ? WHERE id = ?').bind(now, appliedCouponId)
    );
  }

  // Execute batch
  await c.env.DB.batch(statements);

  const guestPortalUrl = `https://hotelflexi.vercel.app/guest/${guestPortalToken}`;
  const formatINR = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  // Check if tenant has FlexiLink enabled (Pro & Enterprise only, not Essential)
  const tenantRow: any = await c.env.DB.prepare(
    'SELECT current_plan_id FROM tenants WHERE id = ?'
  ).bind(tenantId).first().catch(() => null);
  const isEssential = (tenantRow?.current_plan_id || 'essential') === 'essential';

  // Dispatch confirmation emails to both guest and property admin/owner
  sendBookingEmails(c.env, {
    reservationNumber,
    guestName,
    guestEmail: guestEmail || undefined,
    guestPhone: guestPhone || undefined,
    propertyName: property?.name || 'HotelFlexi Property',
    propertyAddress: [property?.address_line1, property?.city, property?.state].filter(Boolean).join(', '),
    propertyPhone: property?.phone,
    propertyEmail: property?.email,
    ownerEmail: property?.email || user.email,
    checkInDate,
    checkOutDate,
    roomTypeName: roomType?.name || 'Deluxe Room',
    roomNumber: assignedRoomNumber,
    adults,
    children,
    totalAmountRupees: formatINR(totalAmountPaise),
    paidAmountRupees: formatINR(paidPaise),
    balanceAmountRupees: formatINR(balancePaise),
    guestPortalUrl,
    hasFlexiLink: !isEssential,
  }).catch((err) => console.error('[Email Notification Error]', err));

  await recordAuditLog(c, {
    action: 'reservation.created',
    resourceType: 'reservation',
    resourceId: reservationId,
    newValues: {
      reservationNumber,
      guestName,
      totalAmountPaise,
      checkInDate,
      checkOutDate,
      roomId: assignedRoomId,
      roomNumber: assignedRoomNumber,
      guestPortalToken,
    },
  });

  return c.json({
    success: true,
    id: reservationId,
    reservationNumber,
    roomId: assignedRoomId,
    roomNumber: assignedRoomNumber,
    totalAmountPaise,
    paidAmountPaise: paidPaise,
    balanceAmountPaise: balancePaise,
    guestPortalToken,
    guestPortalUrl,
  });
});

// -----------------------------------------------------------------------------
// CHECK-IN
// -----------------------------------------------------------------------------
reservationRoutes.patch('/:id/check-in', requireRole(['owner', 'manager', 'receptionist']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);

  const res: any = await c.env.DB.prepare('SELECT * FROM reservations WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first();

  if (!res) {
    return c.json({ error: 'Reservation not found' }, 404);
  }

  if (res.status === 'checked_in') {
    return c.json({ error: 'Reservation is already checked in' }, 400);
  }

  const statements: any[] = [
    c.env.DB.prepare(
      `UPDATE reservations SET status = 'checked_in', check_in_time_actual = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`
    ).bind(now, now, id, tenantId)
  ];

  if (res.room_id) {
    statements.push(
      c.env.DB.prepare(
        `UPDATE rooms SET status = 'occupied', updated_at = ? WHERE id = ? AND tenant_id = ?`
      ).bind(now, res.room_id, tenantId)
    );
  }

  await c.env.DB.batch(statements);

  await recordAuditLog(c, {
    action: 'reservation.check_in',
    resourceType: 'reservation',
    resourceId: id,
  });

  return c.json({ success: true, message: `Reservation #${res.reservation_number} checked in` });
});

// -----------------------------------------------------------------------------
// CHECK-OUT
// -----------------------------------------------------------------------------
reservationRoutes.patch('/:id/check-out', requireRole(['owner', 'manager', 'receptionist']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);
  const today = new Date().toISOString().split('T')[0];

  const res: any = await c.env.DB.prepare('SELECT * FROM reservations WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first();

  if (!res) {
    return c.json({ error: 'Reservation not found' }, 404);
  }

  // Check property setting for instant turnaround on checkout (defaults to true)
  let shouldAutoRelease = true;
  try {
    const propSettings: any = await c.env.DB.prepare(
      `SELECT auto_release_on_checkout FROM property_settings WHERE property_id = ?`
    ).bind(res.property_id).first();
    if (propSettings && propSettings.auto_release_on_checkout !== undefined && propSettings.auto_release_on_checkout !== null) {
      shouldAutoRelease = propSettings.auto_release_on_checkout !== 0;
    }
  } catch {
    shouldAutoRelease = true;
  }

  // If guest is checking out early (booked till tomorrow or later),
  // adjust check_out_date to today so today and future dates are immediately freed in all queries
  const effectiveCheckoutDate = res.check_out_date > today ? today : res.check_out_date;

  const statements: any[] = [
    c.env.DB.prepare(
      `UPDATE reservations
       SET status = 'checked_out',
           check_out_date = ?,
           check_out_time_actual = ?,
           updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    ).bind(effectiveCheckoutDate, now, now, id, tenantId)
  ];

  if (res.room_id) {
    if (shouldAutoRelease) {
      // Immediately mark room available and CLEAN so it is instantly bookable by other guests for today
      statements.push(
        c.env.DB.prepare(
          `UPDATE rooms SET status = 'available', housekeeping_status = 'clean', updated_at = ? WHERE id = ? AND tenant_id = ?`
        ).bind(now, res.room_id, tenantId)
      );

      // Record completed turnaround without raising an urgent siren/dirty alarm
      const taskId = `hk_${crypto.randomUUID()}`;
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO housekeeping_tasks (
            id, property_id, tenant_id, room_id, task_type, priority, status, scheduled_date, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'cleaning', 'low', 'completed', ?, 'Instant room turnaround completed on checkout - ready for same-day arrival', ?, ?)`
        ).bind(taskId, res.property_id, tenantId, res.room_id, today, now, now)
      );
    } else {
      // Admin configured holding room for housekeeping: mark dirty and queue cleaning task
      statements.push(
        c.env.DB.prepare(
          `UPDATE rooms SET status = 'available', housekeeping_status = 'dirty', updated_at = ? WHERE id = ? AND tenant_id = ?`
        ).bind(now, res.room_id, tenantId)
      );

      const taskId = `hk_${crypto.randomUUID()}`;
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO housekeeping_tasks (
            id, property_id, tenant_id, room_id, task_type, priority, status, scheduled_date, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'cleaning', 'high', 'pending', ?, 'Checkout clean required for new arrival', ?, ?)`
        ).bind(taskId, res.property_id, tenantId, res.room_id, today, now, now)
      );
    }
  }

  await c.env.DB.batch(statements);

  await recordAuditLog(c, {
    action: 'reservation.check_out',
    resourceType: 'reservation',
    resourceId: id,
    newValues: {
      autoReleasedClean: shouldAutoRelease,
      effectiveCheckoutDate,
    },
  });

  return c.json({
    success: true,
    message: shouldAutoRelease
      ? `Reservation #${res.reservation_number} checked out. Room is immediately available & clean for today's new arrivals.`
      : `Reservation #${res.reservation_number} checked out. Room marked dirty for housekeeping.`,
    roomReleased: true,
    isClean: shouldAutoRelease,
  });
});

// -----------------------------------------------------------------------------
// CANCEL
// -----------------------------------------------------------------------------
reservationRoutes.patch('/:id/cancel', requireRole(['owner', 'manager', 'receptionist']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);

  const res: any = await c.env.DB.prepare('SELECT * FROM reservations WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first();

  if (!res) {
    return c.json({ error: 'Reservation not found' }, 404);
  }

  const statements: any[] = [
    c.env.DB.prepare(
      `UPDATE reservations SET status = 'cancelled', cancellation_reason = ?, cancelled_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`
    ).bind(body.reason || 'Guest requested cancellation', now, now, id, tenantId)
  ];

  if (res.room_id && res.status === 'checked_in') {
    statements.push(
      c.env.DB.prepare(
        `UPDATE rooms SET status = 'available', updated_at = ? WHERE id = ? AND tenant_id = ?`
      ).bind(now, res.room_id, tenantId)
    );
  }

  await c.env.DB.batch(statements);

  await recordAuditLog(c, {
    action: 'reservation.cancelled',
    resourceType: 'reservation',
    resourceId: id,
    newValues: { reason: body.reason },
  });

  const formatINR = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  // Dispatch cancellation email to guest
  try {
    const primaryGuest: any = await c.env.DB.prepare(
      'SELECT full_name, email, phone FROM reservation_guests WHERE reservation_id = ? AND is_primary = 1 LIMIT 1'
    ).bind(id).first();

    const property: any = await c.env.DB.prepare(
      'SELECT name, address_line1, city, state, phone, email FROM properties WHERE id = ?'
    ).bind(res.property_id).first();

    const roomType: any = res.room_type_id
      ? await c.env.DB.prepare('SELECT name FROM room_types WHERE id = ?').bind(res.room_type_id).first()
      : null;

    if (primaryGuest?.email) {
      sendCancellationEmail(c.env, {
        reservationNumber: res.reservation_number,
        guestName: primaryGuest.full_name || 'Valued Guest',
        guestEmail: primaryGuest.email,
        guestPhone: primaryGuest.phone,
        propertyName: property?.name || 'HotelFlexi Property',
        propertyAddress: [property?.address_line1, property?.city, property?.state].filter(Boolean).join(', '),
        propertyPhone: property?.phone,
        propertyEmail: property?.email,
        checkInDate: res.check_in_date,
        checkOutDate: res.check_out_date,
        roomTypeName: roomType?.name || 'Deluxe Room',
        reason: body.reason || 'Guest requested cancellation',
        totalAmountRupees: formatINR(res.total_amount_paise || 0),
        paidAmountRupees: formatINR(res.paid_amount_paise || 0),
      }).catch((e) => console.error('[Cancellation Email Error]', e));
    }
  } catch (emailErr) {
    console.error('[Cancellation Email Error]', emailErr);
  }

  return c.json({ success: true, message: 'Reservation cancelled' });
});

// -----------------------------------------------------------------------------
// DELETE RESERVATION & GUEST RECORD
// -----------------------------------------------------------------------------
reservationRoutes.delete('/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');

  const res: any = await c.env.DB.prepare(
    'SELECT id, reservation_number, room_id FROM reservations WHERE id = ? AND tenant_id = ?'
  ).bind(id, tenantId).first();

  if (!res) {
    return c.json({ error: 'Reservation not found' }, 404);
  }

  // Batch delete related records
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM reservation_guests WHERE reservation_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM invoices WHERE reservation_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM payments WHERE reservation_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM reservations WHERE id = ? AND tenant_id = ?').bind(id, tenantId),
  ]);

  await recordAuditLog(c, {
    action: 'reservation.deleted',
    resourceType: 'reservation',
    resourceId: id,
    oldValues: { reservation_number: res.reservation_number },
  });

  return c.json({
    success: true,
    message: `Guest profile and reservation #${res.reservation_number} deleted successfully`,
  });
});
