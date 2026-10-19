import { Hono } from 'hono';
import { Env, AppVariables } from '../types';

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
            p.country, p.phone, p.email, p.timezone, p.currency, p.check_in_time,
            p.check_out_time, p.cancellation_policy, p.description, p.amenities
     FROM properties p
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
            weekend_price_paise, extra_adult_price_paise, description, amenities, images
     FROM room_types
     WHERE property_id = ? AND is_active = 1
     ORDER BY base_price_paise ASC`
  )
    .bind(property.id)
    .all();

  return c.json({
    property: {
      ...property,
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
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

    const unavailableRooms = (resConflictResult?.count || 0) + (blockConflictResult?.count || 0);
    const availableCount = Math.max(0, totalRooms - unavailableRooms);

    if (availableCount > 0) {
      const nightlyRatePaise = rt.base_price_paise;
      const totalRoomChargePaise = nightlyRatePaise * nights;
      const gstRateBasisPoints = nightlyRatePaise > 750000 ? 1800 : 1200;
      const totalTaxPaise = Math.round((totalRoomChargePaise * gstRateBasisPoints) / 10000);
      const totalAmountPaise = totalRoomChargePaise + totalTaxPaise;

      availableRoomTypes.push({
        id: rt.id,
        name: rt.name,
        code: rt.code,
        description: rt.description,
        amenities: rt.amenities ? JSON.parse(rt.amenities) : [],
        baseOccupancy: rt.base_occupancy,
        maxOccupancy: rt.max_occupancy,
        availableUnits: availableCount,
        nights,
        nightlyRatePaise,
        totalRoomChargePaise,
        gstRateBasisPoints,
        totalTaxPaise,
        totalAmountPaise,
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

  const { roomTypeId, checkInDate, checkOutDate, guestName, guestEmail, guestPhone, adults = 1, children = 0, specialRequests } = body;

  if (!roomTypeId || !checkInDate || !checkOutDate || !guestName || !guestPhone) {
    return c.json({ error: 'Missing required booking details (dates, guest name, phone, room type)' }, 400);
  }

  const property: any = await c.env.DB.prepare('SELECT id, tenant_id FROM properties WHERE slug = ?')
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

  // Get Room Type Pricing
  const roomType: any = await c.env.DB.prepare('SELECT base_price_paise FROM room_types WHERE id = ?')
    .bind(roomTypeId)
    .first();

  const nights = getNights(checkInDate, checkOutDate);
  const nightlyRatePaise = roomType?.base_price_paise || 250000;
  const totalRoomChargePaise = nightlyRatePaise * nights;
  const gstRateBasisPoints = nightlyRatePaise > 750000 ? 1800 : 1200;
  const totalTaxPaise = Math.round((totalRoomChargePaise * gstRateBasisPoints) / 10000);
  const totalAmountPaise = totalRoomChargePaise + totalTaxPaise;

  const reservationId = `res_${crypto.randomUUID()}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const reservationNumber = `WEB-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;
  const guestId = `gst_${crypto.randomUUID()}`;
  const invoiceId = `inv_${crypto.randomUUID()}`;

  // Check Razorpay config
  const razorpayKeyId = c.env.RAZORPAY_KEY_ID;
  const razorpaySecret = c.env.RAZORPAY_KEY_SECRET;

  let razorpayOrderId: string | null = null;
  if (razorpayKeyId && razorpaySecret && razorpayKeyId !== 'rzp_test_placeholder_key_id') {
    // Generate order via Razorpay API
    try {
      const basicAuth = btoa(`${razorpayKeyId}:${razorpaySecret}`);
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmountPaise,
          currency: 'INR',
          receipt: reservationNumber,
          notes: { reservationId, guestName, propertySlug: slug },
        }),
      });
      if (rzpRes.ok) {
        const rzpData: any = await rzpRes.json();
        razorpayOrderId = rzpData.id;
      }
    } catch (e) {
      console.error('Razorpay order creation error:', e);
    }
  }

  const statements: any[] = [
    // Reservation
    c.env.DB.prepare(
      `INSERT INTO reservations (
        id, property_id, tenant_id, reservation_number, source, status,
        room_id, room_type_id, check_in_date, check_out_date,
        adults, children, nightly_rate_paise, total_room_charge_paise,
        total_tax_paise, total_discount_paise, total_amount_paise, paid_amount_paise,
        balance_amount_paise, payment_status, special_requests, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'booking_engine', 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, 'pending', ?, ?, ?)`
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
      totalAmountPaise,
      totalAmountPaise,
      specialRequests || null,
      now,
      now
    ),
    // Guest
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
        total_tax_paise, total_amount_paise, paid_amount_paise, balance_amount_paise,
        tax_snapshot_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'issued', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
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
      totalAmountPaise,
      totalAmountPaise,
      JSON.stringify({ gstRateBasisPoints }),
      now,
      now
    ),
  ];

  await c.env.DB.batch(statements);

  return c.json({
    success: true,
    reservationId,
    reservationNumber,
    roomNumber: availableRoom.room_number,
    totalAmountPaise,
    razorpay: razorpayOrderId
      ? {
          orderId: razorpayOrderId,
          keyId: razorpayKeyId,
          amount: totalAmountPaise,
          currency: 'INR',
        }
      : null,
    message: 'Booking successfully confirmed!',
  });
});
