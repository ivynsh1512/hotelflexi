import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { sendBookingEmails, sendPaymentSuccessEmail } from '../services/email';

export const bookingEngineRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// Helper: Calculate nights between dates
function getNights(start: string, end: string): number {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
}

// -----------------------------------------------------------------------------
// PUBLIC PROPERTY INFO
// -----------------------------------------------------------------------------
bookingEngineRoutes.get('/properties/:slug', async (c) => {
  const slug = c.req.param('slug');

  const property: any = await c.env.DB.prepare(
    `SELECT p.id, p.tenant_id, p.name, p.slug, p.address_line1, p.city, p.state,
            p.country, p.postal_code, p.phone, p.email, p.timezone, p.currency, p.check_in_time,
            p.check_out_time, p.cancellation_policy, p.description, p.amenities,
            p.logo_url, p.gallery_images, p.photos, p.child_cutoff_age, p.child_rate_paise,
            ps.enable_online_booking, ps.advance_payment_policy, ps.advance_payment_percent,
            ps.advance_payment_fixed_paise, ps.booking_engine_terms, ps.upi_id,
            ps.razorpay_enabled,
            CASE WHEN ps.razorpay_enabled = 1 AND ps.razorpay_key_id IS NOT NULL AND LENGTH(ps.razorpay_key_id) > 0 THEN ps.razorpay_key_id ELSE NULL END as razorpay_key_id,
            CASE WHEN ps.razorpay_enabled = 1 AND ps.razorpay_key_id IS NOT NULL AND ps.razorpay_key_secret IS NOT NULL AND LENGTH(ps.razorpay_key_secret) > 0 THEN 1 ELSE 0 END as razorpay_ready
     FROM properties p
     LEFT JOIN property_settings ps ON ps.property_id = p.id
     WHERE p.slug = ?`
  )
    .bind(slug)
    .first();

  if (!property) {
    return c.json({ error: 'Property not found' }, 404);
  }

  // Fetch active room types
  const roomTypes = await c.env.DB.prepare(
    `SELECT id, name, code, base_occupancy, max_occupancy, base_price_paise,
            weekend_price_paise, extra_adult_price_paise, extra_child_price_paise,
            description, amenities, images
     FROM room_types
     WHERE property_id = ? AND is_active = 1
     ORDER BY base_price_paise ASC`
  )
    .bind(property.id)
    .all();

  const parsedGallery = property.photos
    ? JSON.parse(property.photos)
    : (property.gallery_images ? JSON.parse(property.gallery_images) : []);

  return c.json({
    property: {
      ...property,
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
      galleryImages: parsedGallery,
      photos: parsedGallery,
      childCutoffAge: property.child_cutoff_age ?? 10,
      childRatePaise: property.child_rate_paise ?? 0,
      advancePaymentPolicy: property.advance_payment_policy || 'full',
      advancePaymentPercent: property.advance_payment_percent ?? 100,
      advancePaymentFixedPaise: property.advance_payment_fixed_paise ?? 0,
      bookingEngineTerms: property.booking_engine_terms || '',
      razorpayReady: Boolean(property.razorpay_ready),
    },
    roomTypes: (roomTypes.results || []).map((rt: any) => ({
      ...rt,
      amenities: rt.amenities ? JSON.parse(rt.amenities) : [],
      images: rt.images ? JSON.parse(rt.images) : [],
    })),
  });
});

// -----------------------------------------------------------------------------
// PUBLIC AVAILABILITY SEARCH
// -----------------------------------------------------------------------------
bookingEngineRoutes.get('/properties/:slug/availability', async (c) => {
  const slug = c.req.param('slug');
  const checkIn = c.req.query('check_in') || new Date().toISOString().split('T')[0];
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkOut = c.req.query('check_out') || tomorrow.toISOString().split('T')[0];
  const guests = parseInt(c.req.query('guests') || '1', 10);

  if (checkIn >= checkOut) {
    return c.json({ error: 'Check-out date must be after check-in date' }, 400);
  }

  const property: any = await c.env.DB.prepare('SELECT id, tenant_id FROM properties WHERE slug = ?')
    .bind(slug)
    .first();

  if (!property) {
    return c.json({ error: 'Property not found' }, 404);
  }

  const nights = getNights(checkIn, checkOut);

  // Fetch all room types
  const roomTypesQuery = await c.env.DB.prepare(
    `SELECT rt.* FROM room_types rt WHERE rt.property_id = ? AND rt.is_active = 1`
  )
    .bind(property.id)
    .all();

  const roomTypes = roomTypesQuery.results || [];
  const availableRoomTypes = [];

  for (const rt of roomTypes as any[]) {
    // Count total rooms for this type
    const totalRoomsResult: any = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM rooms WHERE room_type_id = ? AND is_active = 1`
    )
      .bind(rt.id)
      .first();

    const totalRooms = totalRoomsResult?.count || 0;

    // Count conflicting reservations
    const resConflictResult: any = await c.env.DB.prepare(
      `SELECT COUNT(DISTINCT res.room_id) as count FROM reservations res
       JOIN rooms r ON r.id = res.room_id
       WHERE res.room_type_id = ? AND res.status NOT IN ('cancelled', 'checked_out')
         AND res.check_in_date < ? AND res.check_out_date > ?`
    )
      .bind(rt.id, checkOut, checkIn)
      .first();

    // Count conflicting room blocks
    const blockConflictResult: any = await c.env.DB.prepare(
      `SELECT COUNT(DISTINCT rb.room_id) as count FROM room_blocks rb
       JOIN rooms r ON r.id = rb.room_id
       WHERE r.room_type_id = ? AND rb.is_active = 1
         AND rb.start_date < ? AND rb.end_date > ?`
    )
      .bind(rt.id, checkOut, checkIn)
      .first();

    const bookedRooms = resConflictResult?.count || 0;
    const blockedRooms = blockConflictResult?.count || 0;
    const availableCount = Math.max(0, totalRooms - bookedRooms - blockedRooms);

    const maxOcc = rt.max_occupancy || 2;
    const baseOcc = rt.base_occupancy || 2;
    const roomsNeeded = Math.max(1, Math.ceil(guests / maxOcc));

    if (availableCount >= roomsNeeded) {
      // Check Daily Rate Overrides
      const dailyRateRows: any = await c.env.DB.prepare(
        `SELECT date, price_paise FROM daily_rates
         WHERE room_type_id = ? AND date >= ? AND date < ?`
      )
        .bind(rt.id, checkIn, checkOut)
        .all();

      const dailyMap = new Map<string, number>();
      for (const d of dailyRateRows.results || []) {
        dailyMap.set(d.date, d.price_paise);
      }

      let singleRoomChargePaise = 0;
      let weekendNightsCount = 0;
      let weekdayNightsCount = 0;
      const cur = new Date(`${checkIn}T12:00:00Z`);
      const end = new Date(`${checkOut}T12:00:00Z`);
      while (cur < end) {
        const dStr = cur.toISOString().split('T')[0];
        const day = cur.getUTCDay();
        const isWeekend = day === 0 || day === 5 || day === 6; // Friday, Saturday, Sunday
        if (dailyMap.has(dStr)) {
          singleRoomChargePaise += dailyMap.get(dStr)!;
        } else if (isWeekend && rt.weekend_price_paise) {
          singleRoomChargePaise += rt.weekend_price_paise;
          weekendNightsCount++;
        } else {
          singleRoomChargePaise += rt.base_price_paise;
          weekdayNightsCount++;
        }
        cur.setUTCDate(cur.getUTCDate() + 1);
      }

      // Calculate extra adult surcharge
      const totalBaseGuests = baseOcc * roomsNeeded;
      const extraAdultsCount = Math.max(0, guests - totalBaseGuests);
      const extraAdultPricePaise = rt.extra_adult_price_paise || Math.round(rt.base_price_paise * 0.25);
      const totalExtraAdultChargePaise = extraAdultsCount * extraAdultPricePaise * nights;

      const roomChargePaise = (singleRoomChargePaise * roomsNeeded) + totalExtraAdultChargePaise;
      const effectiveNightlyPaise = Math.round(roomChargePaise / nights);
      const perRoomNightlyPaise = Math.round(singleRoomChargePaise / nights);
      const gstRate = (effectiveNightlyPaise / roomsNeeded) > 750000 ? 1800 : 1200;
      const taxPaise = Math.round((roomChargePaise * gstRate) / 10000);
      const totalPaise = roomChargePaise + taxPaise;

      availableRoomTypes.push({
        id: rt.id,
        name: rt.name,
        code: rt.code,
        baseOccupancy: baseOcc,
        maxOccupancy: maxOcc,
        roomsNeeded,
        guests,
        extraAdultsCount,
        extraAdultPricePaise,
        totalExtraAdultChargePaise,
        availableCount,
        basePricePaise: rt.base_price_paise,
        weekendPricePaise: rt.weekend_price_paise || rt.base_price_paise,
        hasWeekendPricing: Boolean(rt.weekend_price_paise && rt.weekend_price_paise !== rt.base_price_paise),
        isWeekendPricingActive: weekendNightsCount > 0 && Boolean(rt.weekend_price_paise && rt.weekend_price_paise !== rt.base_price_paise),
        weekendNightsCount,
        weekdayNightsCount,
        nightlyPricePaise: effectiveNightlyPaise,
        perRoomNightlyPaise,
        totalRoomChargePaise: roomChargePaise,
        taxPaise,
        totalPaise,
        description: rt.description,
        amenities: rt.amenities ? JSON.parse(rt.amenities) : [],
        images: rt.images ? JSON.parse(rt.images) : [],
      });
    }
  }

  return c.json({
    dates: { checkIn, checkOut, nights },
    roomTypes: availableRoomTypes,
  });
});

// -----------------------------------------------------------------------------
// CREATE DIRECT BOOKING
// -----------------------------------------------------------------------------
bookingEngineRoutes.post('/properties/:slug/book', async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const {
    roomTypeId,
    checkInDate,
    checkOutDate,
    guestName,
    guestEmail,
    guestPhone,
    adults = 1,
    children = 0,
    childAges = [],
    couponCode = '',
    specialRequests,
  } = body;

  if (!roomTypeId || !checkInDate || !checkOutDate || !guestName || !guestPhone) {
    return c.json({ error: 'Missing required booking details (dates, guest name, phone, room type)' }, 400);
  }

  const property: any = await c.env.DB.prepare(
    `SELECT p.*, ps.razorpay_key_id as prop_key_id, ps.razorpay_key_secret as prop_secret, ps.razorpay_enabled,
            ps.advance_payment_policy, ps.advance_payment_percent, ps.advance_payment_fixed_paise
     FROM properties p
     LEFT JOIN property_settings ps ON ps.property_id = p.id
     WHERE p.slug = ?`
  )
    .bind(slug)
    .first();

  if (!property) {
    return c.json({ error: 'Property not found' }, 404);
  }

  // Find an available room of this type
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
     LIMIT 1`
  )
    .bind(roomTypeId, property.id, checkOutDate, checkInDate, checkOutDate, checkInDate)
    .first();

  if (!availableRoom) {
    return c.json({ error: 'Sorry, no rooms of this type are available for the selected dates.' }, 409);
  }

  // Get Room Type Pricing & Name
  const roomType: any = await c.env.DB.prepare(
    'SELECT id, name, base_price_paise, weekend_price_paise, extra_adult_price_paise, extra_child_price_paise FROM room_types WHERE id = ?'
  )
    .bind(roomTypeId)
    .first();

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
  let bookingWeekendNights = 0;
  const currentD = new Date(`${checkInDate}T12:00:00Z`);
  const endD = new Date(`${checkOutDate}T12:00:00Z`);

  while (currentD < endD) {
    const dStr = currentD.toISOString().split('T')[0];
    const day = currentD.getUTCDay();
    const isWeekend = day === 0 || day === 5 || day === 6; // Friday, Saturday, Sunday
    if (dailyOverrides.has(dStr)) {
      calculatedRoomChargePaise += dailyOverrides.get(dStr)!;
    } else if (isWeekend && roomType.weekend_price_paise) {
      calculatedRoomChargePaise += roomType.weekend_price_paise;
      bookingWeekendNights++;
    } else {
      calculatedRoomChargePaise += roomType.base_price_paise;
    }
    currentD.setUTCDate(currentD.getUTCDate() + 1);
  }

  const nightlyRatePaise = Math.round(calculatedRoomChargePaise / nights);

  // Child Pricing Calculation
  const childCutoffAge = property.child_cutoff_age ?? 10;
  const configuredChildRatePaise = property.child_rate_paise ?? roomType.extra_child_price_paise ?? 0;
  const extraAdultPricePaise = roomType.extra_adult_price_paise || Math.round(roomType.base_price_paise * 0.3);

  let childSurchargePaise = 0;
  if (Array.isArray(childAges) && childAges.length > 0) {
    for (const age of childAges) {
      if (age > childCutoffAge) {
        childSurchargePaise += extraAdultPricePaise * nights;
      } else {
        childSurchargePaise += configuredChildRatePaise * nights;
      }
    }
  } else if (children > 0) {
    childSurchargePaise = children * configuredChildRatePaise * nights;
  }

  const totalRoomChargePaise = calculatedRoomChargePaise + childSurchargePaise;

  // Coupon Application
  let discountPaise = 0;
  let appliedCouponId: string | null = null;
  if (couponCode) {
    const cCode = String(couponCode).trim().toUpperCase();
    const coupon: any = await c.env.DB.prepare(
      `SELECT * FROM coupons WHERE property_id = ? AND UPPER(code) = ? AND is_active = 1`
    )
      .bind(property.id, cCode)
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

  // Add-ons Calculation
  let addonsTotalPaise = 0;
  const selectedAddons: any[] = Array.isArray(body.selectedAddons) ? body.selectedAddons : [];
  for (const add of selectedAddons) {
    addonsTotalPaise += Math.max(0, Number(add.totalPricePaise) || 0);
  }

  const gstRateBasisPoints = nightlyRatePaise > 750000 ? 1800 : 1200;
  const totalTaxPaise = Math.round((totalRoomChargePaise * gstRateBasisPoints) / 10000);
  const totalAmountPaise = Math.max(0, totalRoomChargePaise + totalTaxPaise + addonsTotalPaise - discountPaise);

  const reservationId = `res_${crypto.randomUUID()}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const reservationNumber = `WEB-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;
  const guestId = `gst_${crypto.randomUUID()}`;
  const invoiceId = `inv_${crypto.randomUUID()}`;

  // FlexiLink Token and 7-Day Expiry Post Checkout
  const guestPortalToken = crypto.randomUUID();
  const guestPortalExpiresAt = Math.floor(new Date(`${checkOutDate}T23:59:59Z`).getTime() / 1000) + (7 * 86400);
  const guestPortalUrl = `https://hotelflexi.vercel.app/guest/${guestPortalToken}`;

  // Advance Payment Calculation based on Property Rules
  const advancePolicy = property.advance_payment_policy || 'full';
  let advanceAmountPaise = 0;

  if (advancePolicy === 'full') {
    advanceAmountPaise = totalAmountPaise;
  } else if (advancePolicy === 'partial_percent') {
    const pct = Math.min(100, Math.max(1, property.advance_payment_percent ?? 20));
    advanceAmountPaise = Math.round((totalAmountPaise * pct) / 100);
  } else if (advancePolicy === 'partial_fixed') {
    const fixed = property.advance_payment_fixed_paise ?? 100000;
    advanceAmountPaise = Math.min(totalAmountPaise, fixed);
  } else if (advancePolicy === 'pay_at_hotel') {
    advanceAmountPaise = 0;
  } else {
    advanceAmountPaise = totalAmountPaise;
  }

  const balanceAmountPaise = Math.max(0, totalAmountPaise - advanceAmountPaise);

  // Determine Razorpay Credentials: MUST be the hotelier's own Razorpay keys
  const hasOwnerRazorpay = Boolean(
    property.razorpay_enabled &&
    property.prop_key_id &&
    property.prop_secret &&
    String(property.prop_key_id).trim().startsWith('rzp_')
  );

  let razorpayOrderId: string | null = null;
  let razorpayKeyId: string | null = null;

  if (hasOwnerRazorpay && advanceAmountPaise > 0) {
    try {
      razorpayKeyId = String(property.prop_key_id).trim();
      const razorpaySecret = String(property.prop_secret).trim();
      const basicAuth = btoa(`${razorpayKeyId}:${razorpaySecret}`);
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: advanceAmountPaise,
          currency: 'INR',
          receipt: reservationNumber,
          notes: { reservationId, guestName, propertySlug: slug, guestPortalToken, advancePolicy },
        }),
      });
      if (rzpRes.ok) {
        const rzpData: any = await rzpRes.json();
        razorpayOrderId = rzpData.id;
      } else {
        const errJson = await rzpRes.json().catch(() => null);
        console.error('[Razorpay Order Error]', errJson);
      }
    } catch (e) {
      console.error('Razorpay order creation error:', e);
    }
  }

  const statements: any[] = [
    // Reservation with FlexiLink & Coupon details
    c.env.DB.prepare(
      `INSERT INTO reservations (
        id, property_id, tenant_id, reservation_number, source, status,
        room_id, room_type_id, check_in_date, check_out_date,
        adults, children, nightly_rate_paise, total_room_charge_paise,
        total_tax_paise, total_discount_paise, total_amount_paise, paid_amount_paise,
        balance_amount_paise, payment_status, special_requests,
        guest_portal_token, guest_portal_expires_at, self_checkin_completed,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'booking_engine', 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'pending', ?, ?, ?, 0, ?, ?)`
    ).bind(
      reservationId,
      property.id,
      property.tenant_id,
      reservationNumber,
      availableRoom.id,
      roomTypeId,
      checkInDate,
      checkOutDate,
      adults,
      children,
      nightlyRatePaise,
      totalRoomChargePaise,
      totalTaxPaise,
      discountPaise,
      totalAmountPaise,
      totalAmountPaise,
      specialRequests || null,
      guestPortalToken,
      guestPortalExpiresAt,
      now,
      now
    ),
    // Primary Guest record
    c.env.DB.prepare(
      `INSERT INTO reservation_guests (
        id, reservation_id, tenant_id, is_primary, full_name, email, phone, created_at, updated_at
      ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)`
    ).bind(guestId, reservationId, property.tenant_id, guestName, guestEmail || null, guestPhone, now, now),
    // Invoice
    c.env.DB.prepare(
      `INSERT INTO invoices (
        id, property_id, tenant_id, reservation_id, invoice_number, status,
        guest_name, guest_email, guest_phone, issue_date, subtotal_paise,
        total_tax_paise, discount_paise, total_amount_paise, paid_amount_paise, balance_amount_paise,
        tax_snapshot_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'issued', ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
    ).bind(
      invoiceId,
      property.id,
      property.tenant_id,
      reservationId,
      `INV-${randomSuffix}`,
      guestName,
      guestEmail || null,
      guestPhone,
      checkInDate,
      totalRoomChargePaise,
      totalTaxPaise,
      discountPaise,
      totalAmountPaise,
      totalAmountPaise,
      JSON.stringify({ gstRateBasisPoints }),
      now,
      now
    ),
  ];

  if (appliedCouponId) {
    statements.push(
      c.env.DB.prepare('UPDATE coupons SET times_used = times_used + 1, updated_at = ? WHERE id = ?').bind(now, appliedCouponId)
    );
  }

  await c.env.DB.batch(statements);

  // Persist selected add-ons if chosen
  if (selectedAddons.length > 0) {
    for (const add of selectedAddons) {
      try {
        const resAddonId = `resadd_${crypto.randomUUID()}`;
        await c.env.DB.prepare(
          `INSERT INTO reservation_addons (
             id, tenant_id, reservation_id, addon_id, addon_name,
             pricing_type, quantity, unit_price_paise, total_price_paise, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
          resAddonId,
          property.tenant_id,
          reservationId,
          add.id || add.addonId || 'custom',
          add.name || add.addonName || 'Add-on Activity',
          add.pricingType || add.pricing_type || 'per_person',
          add.quantity || 1,
          add.unitPricePaise || add.pricePaise || 0,
          add.totalPricePaise || 0
        ).run();
      } catch (addonErr) {
        console.error('[Addon Persist Error]:', addonErr);
      }
    }
  }

  const formatINR = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  // Check if tenant has FlexiLink enabled (Pro & Enterprise only, not Essential)
  const tenantRow: any = await c.env.DB.prepare(
    'SELECT current_plan_id FROM tenants WHERE id = ?'
  ).bind(property.tenant_id).first().catch(() => null);
  const isEssential = (tenantRow?.current_plan_id || 'essential') === 'essential';

  // Send confirmation emails to guest and property owner
  sendBookingEmails(c.env, {
    reservationNumber,
    guestName,
    guestEmail: guestEmail || undefined,
    guestPhone,
    propertyName: property.name,
    propertyAddress: [property.address_line1, property.city, property.state].filter(Boolean).join(', '),
    propertyPhone: property.phone,
    propertyEmail: property.email,
    ownerEmail: property.email,
    checkInDate,
    checkOutDate,
    roomTypeName: roomType?.name || 'Deluxe Room',
    roomNumber: availableRoom.room_number,
    adults,
    children,
    totalAmountRupees: formatINR(totalAmountPaise),
    paidAmountRupees: formatINR(0),
    balanceAmountRupees: formatINR(totalAmountPaise),
    guestPortalUrl,
    hasFlexiLink: !isEssential,
  }).catch((e) => console.error('[Resend Error]', e));

  return c.json({
    success: true,
    reservationId,
    reservationNumber,
    roomNumber: availableRoom.room_number,
    totalAmountPaise,
    advanceAmountPaise,
    balanceAmountPaise,
    advancePolicy,
    hasOwnerRazorpay,
    totalDiscountPaise: discountPaise,
    guestPortalToken,
    guestPortalUrl,
    razorpay: razorpayOrderId && razorpayKeyId
      ? {
          orderId: razorpayOrderId,
          keyId: razorpayKeyId,
          amount: advanceAmountPaise,
          currency: 'INR',
        }
      : null,
    message: 'Booking successfully confirmed!',
  });
});

// -----------------------------------------------------------------------------
// VERIFY DIRECT BOOKING ADVANCE PAYMENT
// -----------------------------------------------------------------------------
bookingEngineRoutes.post('/properties/:slug/verify-payment', async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json();
  const { reservationId, razorpayPaymentId, razorpayOrderId, amountPaise } = body;

  if (!reservationId || !razorpayPaymentId) {
    return c.json({ error: 'Missing reservationId or razorpayPaymentId' }, 400);
  }

  const reservation: any = await c.env.DB.prepare(
    `SELECT res.*, p.name as property_name, p.email as property_email, ps.razorpay_key_secret as prop_secret, ps.razorpay_enabled
     FROM reservations res
     JOIN properties p ON p.id = res.property_id
     LEFT JOIN property_settings ps ON ps.property_id = p.id
     WHERE res.id = ? AND p.slug = ?`
  )
    .bind(reservationId, slug)
    .first();

  if (!reservation) {
    return c.json({ error: 'Reservation not found' }, 404);
  }

  const now = Math.floor(Date.now() / 1000);
  const paidIncrement = amountPaise || (reservation.total_amount_paise - reservation.balance_amount_paise > 0 ? reservation.total_amount_paise - reservation.balance_amount_paise : reservation.total_amount_paise);
  const newPaidPaise = Math.min(reservation.total_amount_paise, (reservation.paid_amount_paise || 0) + paidIncrement);
  const newBalancePaise = Math.max(0, reservation.total_amount_paise - newPaidPaise);
  const newPaymentStatus = newBalancePaise === 0 ? 'paid' : (newPaidPaise > 0 ? 'partial' : 'pending');

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE reservations SET
         paid_amount_paise = ?,
         balance_amount_paise = ?,
         payment_status = ?,
         updated_at = ?
       WHERE id = ?`
    ).bind(newPaidPaise, newBalancePaise, newPaymentStatus, now, reservationId),
    c.env.DB.prepare(
      `INSERT INTO payments (
         id, tenant_id, property_id, reservation_id, amount_paise, payment_method,
         status, reference_id, transaction_id, notes, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 'razorpay', 'completed', ?, ?, 'Direct Booking Advance Payment', ?, ?)`
    ).bind(
      `pay_${crypto.randomUUID()}`,
      reservation.tenant_id,
      reservation.property_id,
      reservationId,
      paidIncrement,
      razorpayOrderId || null,
      razorpayPaymentId,
      now,
      now
    ),
    c.env.DB.prepare(
      `UPDATE invoices SET
         paid_amount_paise = ?,
         balance_amount_paise = ?,
         status = ?,
         updated_at = ?
       WHERE reservation_id = ?`
    ).bind(newPaidPaise, newBalancePaise, newBalancePaise === 0 ? 'paid' : 'issued', now, reservationId),
  ]);

  // Dispatch payment received notification email immediately to hotel admin
  const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;
  sendPaymentSuccessEmail(c.env, {
    ownerEmail: reservation.property_email || reservation.email || undefined,
    propertyName: reservation.property_name || slug,
    reservationNumber: reservation.reservation_number || reservationId,
    guestName: reservation.guest_name || 'Guest',
    amountRupees: formatRupees(paidIncrement),
    paymentMethod: 'razorpay',
    paymentId: razorpayPaymentId,
    checkInDate: reservation.check_in_date || '',
    checkOutDate: reservation.check_out_date || '',
    remainingBalanceRupees: formatRupees(newBalancePaise),
  }).catch((e) => console.error('[Payment Email Error]:', e));

  return c.json({
    success: true,
    paidAmountPaise: newPaidPaise,
    balanceAmountPaise: newBalancePaise,
    paymentStatus: newPaymentStatus,
    message: 'Payment verified and reservation updated successfully!',
  });
});

// -----------------------------------------------------------------------------
// GOOGLE HOTEL CENTER / FREE BOOKING LINKS (FBL) XML FEED
// -----------------------------------------------------------------------------
bookingEngineRoutes.get('/properties/:slug/google-hotel-feed.xml', async (c) => {
  const slug = c.req.param('slug');

  const property: any = await c.env.DB.prepare(
    `SELECT p.id, p.name, p.slug, p.currency, p.address_line1, p.city, p.state, p.country, p.postal_code, p.phone, p.email
     FROM properties p WHERE p.slug = ?`
  )
    .bind(slug)
    .first();

  if (!property) {
    return c.text('Property not found', 404);
  }

  const roomTypesQuery = await c.env.DB.prepare(
    `SELECT rt.* FROM room_types rt WHERE rt.property_id = ? AND rt.is_active = 1 ORDER BY rt.base_price_paise ASC`
  )
    .bind(property.id)
    .all();

  const roomTypes = (roomTypesQuery.results || []) as any[];
  const nowIso = new Date().toISOString();
  const validUntilIso = new Date(Date.now() + 86400000 * 30).toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Transaction timestamp="${nowIso}" id="hotelflexi-fbl-${property.slug}">
  <PropertyDataSet>
    <Property>${property.slug}</Property>
    <Name><![CDATA[${property.name}]]></Name>
    <Address>
      <StreetAddress><![CDATA[${property.address_line1 || ''}]]></StreetAddress>
      <City><![CDATA[${property.city || ''}]]></City>
      <State><![CDATA[${property.state || ''}]]></State>
      <PostalCode><![CDATA[${property.postal_code || ''}]]></PostalCode>
      <Country><![CDATA[${property.country || 'IN'}]]></Country>
    </Address>
    <Phone>${property.phone || ''}</Phone>
    <Email>${property.email || ''}</Email>
    <OfficialWebsiteURL>https://hotelflexi.com/book/${property.slug}?utm_source=google_hotel_official_site</OfficialWebsiteURL>
  </PropertyDataSet>
  <Result>`;

  for (const rt of roomTypes) {
    const basePaise = rt.base_price_paise || 200000;
    const baseINR = (basePaise / 100).toFixed(2);
    const taxINR = ((basePaise * 0.12) / 100).toFixed(2);
    const totalINR = (Number(baseINR) + Number(taxINR)).toFixed(2);

    xml += `
    <RoomData>
      <Property>${property.slug}</Property>
      <RoomID>${rt.code || rt.id}</RoomID>
      <RoomName><![CDATA[${rt.name}]]></RoomName>
      <RatePlanID>STANDARD_OFFICIAL</RatePlanID>
      <BaseRate currency="INR">${baseINR}</BaseRate>
      <Tax currency="INR">${taxINR}</Tax>
      <OtherFees currency="INR">0.00</OtherFees>
      <TotalRate currency="INR">${totalINR}</TotalRate>
      <Occupancy>${rt.base_occupancy || 2}</Occupancy>
      <MaxOccupancy>${rt.max_occupancy || 3}</MaxOccupancy>
      <BookingURL>https://hotelflexi.com/book/${property.slug}?room_type=${rt.id}&amp;utm_source=google_free_booking_links&amp;utm_medium=organic&amp;utm_campaign=official_site</BookingURL>
      <Expiration timestamp="${validUntilIso}"/>
    </RoomData>`;
  }

  xml += `
  </Result>
</Transaction>`;

  return c.text(xml, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
});
