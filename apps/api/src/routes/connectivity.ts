/**
 * HotelFlexi Secure External Connectivity API
 * Standardized, versioned REST/JSON integration gateway for OTA connectivity providers (Channellyx, etc.)
 */

import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { connectivityAuthMiddleware } from '../services/connectivity/auth';
import { enqueueConnectivityEvent } from '../services/connectivity/outbox';
import { seedSandboxEnvironment, resetSandboxEnvironment } from '../services/connectivity/sandbox';
import { recordAuditLog } from '../services/audit';

export const connectivityRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// All routes require partner authentication & access control
connectivityRoutes.use('*', connectivityAuthMiddleware);

// -----------------------------------------------------------------------------
// 1. PARTNER METADATA & HEALTH CHECK
// -----------------------------------------------------------------------------
connectivityRoutes.get('/me', async (c) => {
  const partner = c.get('connectivityPartner')!;

  const authorizedProps = await c.env.DB.prepare(
    `SELECT p.id, p.name, p.code, p.city, p.country, p.currency
     FROM properties p
     JOIN connectivity_partner_properties cpp ON p.id = cpp.property_id
     WHERE cpp.partner_id = ? AND p.is_active = 1`
  )
    .bind(partner.id)
    .all();

  return c.json({
    status: 'connected',
    partner: {
      id: partner.id,
      name: partner.partnerName,
      code: partner.partnerCode,
      mode: partner.mode,
      rateLimitPerMinute: partner.rateLimitPerMinute,
    },
    authorizedPropertiesCount: (authorizedProps.results || []).length,
    properties: authorizedProps.results || [],
    timestamp: new Date().toISOString(),
  });
});

// -----------------------------------------------------------------------------
// 2. SANDBOX TEST ENVIRONMENT (SEED & RESET)
// -----------------------------------------------------------------------------
connectivityRoutes.post('/sandbox/seed', async (c) => {
  const partner = c.get('connectivityPartner')!;

  if (partner.mode !== 'sandbox') {
    return c.json(
      {
        error: 'Forbidden',
        message: 'Sandbox seeding is only available for credentials configured in sandbox mode.',
        code: 'SANDBOX_MODE_REQUIRED',
      },
      403
    );
  }

  try {
    const seedResult = await seedSandboxEnvironment(c.env.DB, partner.id, partner.tenantId);
    await recordAuditLog(c, {
      tenantId: partner.tenantId,
      actorType: 'system',
      action: 'connectivity.sandbox_seeded',
      resourceType: 'sandbox',
      resourceId: seedResult.propertyId,
    });

    return c.json({
      success: true,
      message: 'Synthetic sandbox environment successfully initialized.',
      data: seedResult,
    });
  } catch (err: any) {
    return c.json({ error: 'Sandbox Seed Failed', message: err.message }, 500);
  }
});

connectivityRoutes.post('/sandbox/reset', async (c) => {
  const partner = c.get('connectivityPartner')!;

  if (partner.mode !== 'sandbox') {
    return c.json(
      {
        error: 'Forbidden',
        message: 'Sandbox reset is only available for credentials configured in sandbox mode.',
        code: 'SANDBOX_MODE_REQUIRED',
      },
      403
    );
  }

  try {
    const result = await resetSandboxEnvironment(c.env.DB, partner.id, partner.tenantId);
    await recordAuditLog(c, {
      tenantId: partner.tenantId,
      actorType: 'system',
      action: 'connectivity.sandbox_reset',
      resourceType: 'sandbox',
      resourceId: result.propertyId,
    });

    return c.json({
      success: true,
      message: 'Synthetic sandbox environment reset to initial empty state.',
    });
  } catch (err: any) {
    return c.json({ error: 'Sandbox Reset Failed', message: err.message }, 500);
  }
});

// -----------------------------------------------------------------------------
// 3. PROPERTY & ROOM MAPPING ENDPOINTS
// -----------------------------------------------------------------------------
connectivityRoutes.get('/properties', async (c) => {
  const partner = c.get('connectivityPartner')!;

  const rows = await c.env.DB.prepare(
    `SELECT p.id, p.name, p.code, p.property_type, p.address_line1, p.city, p.state,
            p.postal_code, p.country, p.phone, p.email, p.currency, p.time_zone,
            p.check_in_time, p.check_out_time
     FROM properties p
     JOIN connectivity_partner_properties cpp ON p.id = cpp.property_id
     WHERE cpp.partner_id = ? AND p.is_active = 1`
  )
    .bind(partner.id)
    .all();

  return c.json({
    properties: rows.results || [],
  });
});

connectivityRoutes.get('/properties/:propertyId', async (c) => {
  const propertyId = c.req.param('propertyId');
  const partner = c.get('connectivityPartner')!;

  const prop: any = await c.env.DB.prepare(
    `SELECT p.* FROM properties p
     JOIN connectivity_partner_properties cpp ON p.id = cpp.property_id
     WHERE cpp.partner_id = ? AND p.id = ? AND p.is_active = 1`
  )
    .bind(partner.id, propertyId)
    .first();

  if (!prop) {
    return c.json({ error: 'Not Found', message: 'Property not found or unauthorized' }, 404);
  }

  return c.json({ property: prop });
});

connectivityRoutes.get('/properties/:propertyId/room-types', async (c) => {
  const propertyId = c.req.param('propertyId');
  const partner = c.get('connectivityPartner')!;

  const rows = await c.env.DB.prepare(
    `SELECT rt.id, rt.name, rt.code, rt.base_occupancy, rt.max_occupancy,
            rt.base_price_paise, rt.weekend_price_paise, rt.extra_adult_price_paise,
            rt.extra_child_price_paise, rt.description,
            (SELECT COUNT(*) FROM rooms r WHERE r.room_type_id = rt.id AND r.is_active = 1) as physical_rooms_count
     FROM room_types rt
     WHERE rt.property_id = ? AND rt.tenant_id = ? AND rt.is_active = 1`
  )
    .bind(propertyId, partner.tenantId)
    .all();

  return c.json({
    propertyId,
    roomTypes: rows.results || [],
  });
});

connectivityRoutes.get('/properties/:propertyId/rate-plans', async (c) => {
  const propertyId = c.req.param('propertyId');
  const partner = c.get('connectivityPartner')!;

  const rows = await c.env.DB.prepare(
    `SELECT rp.id, rp.room_type_id, rp.name, rp.code, rp.meal_plan,
            rp.price_multiplier, rp.surcharge_paise, rp.is_non_refundable,
            rt.name as room_type_name
     FROM rate_plans rp
     LEFT JOIN room_types rt ON rp.room_type_id = rt.id
     WHERE rp.property_id = ? AND rp.tenant_id = ? AND rp.is_active = 1`
  )
    .bind(propertyId, partner.tenantId)
    .all();

  return c.json({
    propertyId,
    ratePlans: rows.results || [],
  });
});

connectivityRoutes.get('/properties/:propertyId/inventory-summary', async (c) => {
  const propertyId = c.req.param('propertyId');
  const partner = c.get('connectivityPartner')!;
  const startDate = c.req.query('start_date') || new Date().toISOString().split('T')[0];
  const endDate = c.req.query('end_date') || new Date(Date.now() + 86400 * 7000).toISOString().split('T')[0];

  // Fetch room types
  const roomTypes = await c.env.DB.prepare(
    `SELECT id, name, code,
            (SELECT COUNT(*) FROM rooms WHERE room_type_id = room_types.id AND is_active = 1) as total_units
     FROM room_types
     WHERE property_id = ? AND tenant_id = ? AND is_active = 1`
  )
    .bind(propertyId, partner.tenantId)
    .all();

  // Fetch reservations in range
  const reservations = await c.env.DB.prepare(
    `SELECT room_type_id, check_in_date, check_out_date
     FROM reservations
     WHERE property_id = ? AND tenant_id = ?
       AND status NOT IN ('cancelled', 'no_show')
       AND check_in_date < ? AND check_out_date > ?`
  )
    .bind(propertyId, partner.tenantId, endDate, startDate)
    .all();

  // Fetch daily restrictions
  const restrictions = await c.env.DB.prepare(
    `SELECT room_type_id, date, closed, override_inventory, closed_to_arrival, closed_to_departure, min_stay_arrival
     FROM daily_restrictions
     WHERE property_id = ? AND tenant_id = ? AND date >= ? AND date <= ?`
  )
    .bind(propertyId, partner.tenantId, startDate, endDate)
    .all();

  return c.json({
    propertyId,
    startDate,
    endDate,
    roomTypes: roomTypes.results || [],
    activeBookingsCount: (reservations.results || []).length,
    restrictions: restrictions.results || [],
  });
});

// -----------------------------------------------------------------------------
// 4. RATE PUSH (PRICING & RESTRICTIONS)
// -----------------------------------------------------------------------------
connectivityRoutes.post('/properties/:propertyId/rates', async (c) => {
  const propertyId = c.req.param('propertyId');
  const partner = c.get('connectivityPartner')!;
  const body = await c.req.json().catch(() => ({}));

  const rates: any[] = Array.isArray(body.rates) ? body.rates : body ? [body] : [];
  if (rates.length === 0) {
    return c.json({ error: 'Bad Request', message: 'Payload must contain a "rates" array or a rate object.' }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  let processedCount = 0;
  const errors: any[] = [];

  for (let i = 0; i < rates.length; i++) {
    const item = rates[i];
    const {
      room_type_id,
      rate_plan_id,
      start_date,
      end_date,
      date,
      price_paise,
      price,
      min_stay_arrival,
      min_stay_through,
      max_stay,
      closed_to_arrival,
      closed_to_departure,
      stop_sell,
    } = item;

    // Validate identifiers
    if (!room_type_id || (!rate_plan_id && rate_plan_id !== 'ALL')) {
      errors.push({ index: i, error: 'room_type_id and rate_plan_id are required' });
      continue;
    }

    const priceValue = price_paise !== undefined ? price_paise : price !== undefined ? Math.round(price * 100) : null;
    if (priceValue !== null && priceValue < 0) {
      errors.push({ index: i, error: 'Price cannot be negative' });
      continue;
    }

    const sDate = start_date || date;
    const eDate = end_date || date;
    if (!sDate || !/^\d{4}-\d{2}-\d{2}$/.test(sDate)) {
      errors.push({ index: i, error: 'Valid date (YYYY-MM-DD) is required' });
      continue;
    }

    // Expand date range into single dates
    const curr = new Date(sDate);
    const last = new Date(eDate);

    while (curr <= last) {
      const dStr = curr.toISOString().split('T')[0];

      try {
        // 1. Update/Insert Daily Rate Plan Price if provided
        if (priceValue !== null && rate_plan_id !== 'ALL') {
          const priceId = `drpp_${crypto.randomUUID()}`;
          await c.env.DB.prepare(
            `INSERT INTO daily_rate_plan_prices (
              id, property_id, tenant_id, rate_plan_id, date, price_paise, note, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'Channel Push', ?, ?)
            ON CONFLICT(rate_plan_id, date) DO UPDATE SET
              price_paise = excluded.price_paise,
              updated_at = excluded.updated_at`
          )
            .bind(priceId, propertyId, partner.tenantId, rate_plan_id, dStr, priceValue, now, now)
            .run();
        }

        // 2. Update/Insert Daily Restrictions (Stop-sell, CTA, CTD, Min/Max stay)
        const restrId = `drestr_${crypto.randomUUID()}`;
        const closedFlag = stop_sell === true ? 1 : stop_sell === false ? 0 : 0;
        const ctaFlag = closed_to_arrival === true ? 1 : closed_to_arrival === false ? 0 : 0;
        const ctdFlag = closed_to_departure === true ? 1 : closed_to_departure === false ? 0 : 0;

        await c.env.DB.prepare(
          `INSERT INTO daily_restrictions (
            id, property_id, tenant_id, room_type_id, rate_plan_id, date,
            closed, closed_to_arrival, closed_to_departure,
            min_stay_arrival, min_stay_through, max_stay, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(room_type_id, rate_plan_id, date) DO UPDATE SET
            closed = excluded.closed,
            closed_to_arrival = excluded.closed_to_arrival,
            closed_to_departure = excluded.closed_to_departure,
            min_stay_arrival = COALESCE(excluded.min_stay_arrival, daily_restrictions.min_stay_arrival),
            min_stay_through = COALESCE(excluded.min_stay_through, daily_restrictions.min_stay_through),
            max_stay = COALESCE(excluded.max_stay, daily_restrictions.max_stay),
            updated_at = excluded.updated_at`
        )
          .bind(
            restrId,
            propertyId,
            partner.tenantId,
            room_type_id,
            rate_plan_id || 'ALL',
            dStr,
            closedFlag,
            ctaFlag,
            ctdFlag,
            min_stay_arrival || 1,
            min_stay_through || 1,
            max_stay || null,
            now,
            now
          )
          .run();

        processedCount++;
      } catch (err: any) {
        errors.push({ index: i, date: dStr, error: err.message });
      }

      curr.setDate(curr.getDate() + 1);
    }
  }

  // Queue Outbound Sync Event
  await enqueueConnectivityEvent(c.env.DB, {
    partnerId: partner.id,
    tenantId: partner.tenantId,
    propertyId,
    eventType: 'rates.updated',
    payload: { processedCount, timestamp: now },
  });

  return c.json({
    success: errors.length === 0,
    processedCount,
    errorsCount: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
});

// -----------------------------------------------------------------------------
// 5. AVAILABILITY PUSH (INVENTORY OVERRIDES & STOP-SELL)
// -----------------------------------------------------------------------------
connectivityRoutes.post('/properties/:propertyId/availability', async (c) => {
  const propertyId = c.req.param('propertyId');
  const partner = c.get('connectivityPartner')!;
  const body = await c.req.json().catch(() => ({}));

  const items: any[] = Array.isArray(body.availability) ? body.availability : body ? [body] : [];
  if (items.length === 0) {
    return c.json({ error: 'Bad Request', message: 'Payload must contain an "availability" array.' }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  let processedCount = 0;
  const errors: any[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { room_type_id, start_date, end_date, date, available_rooms, stop_sell } = item;

    if (!room_type_id) {
      errors.push({ index: i, error: 'room_type_id is required' });
      continue;
    }

    if (available_rooms !== undefined && available_rooms < 0) {
      errors.push({ index: i, error: 'available_rooms cannot be negative' });
      continue;
    }

    const sDate = start_date || date;
    const eDate = end_date || date;
    if (!sDate || !/^\d{4}-\d{2}-\d{2}$/.test(sDate)) {
      errors.push({ index: i, error: 'Valid date (YYYY-MM-DD) is required' });
      continue;
    }

    const curr = new Date(sDate);
    const last = new Date(eDate);

    while (curr <= last) {
      const dStr = curr.toISOString().split('T')[0];

      try {
        const restrId = `drestr_${crypto.randomUUID()}`;
        const closedFlag = stop_sell === true ? 1 : stop_sell === false ? 0 : 0;

        await c.env.DB.prepare(
          `INSERT INTO daily_restrictions (
            id, property_id, tenant_id, room_type_id, rate_plan_id, date,
            closed, override_inventory, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'ALL', ?, ?, ?, ?, ?)
          ON CONFLICT(room_type_id, rate_plan_id, date) DO UPDATE SET
            closed = excluded.closed,
            override_inventory = excluded.override_inventory,
            updated_at = excluded.updated_at`
        )
          .bind(
            restrId,
            propertyId,
            partner.tenantId,
            room_type_id,
            dStr,
            closedFlag,
            available_rooms !== undefined ? available_rooms : null,
            now,
            now
          )
          .run();

        processedCount++;
      } catch (err: any) {
        errors.push({ index: i, date: dStr, error: err.message });
      }

      curr.setDate(curr.getDate() + 1);
    }
  }

  // Queue Outbound Sync Event
  await enqueueConnectivityEvent(c.env.DB, {
    partnerId: partner.id,
    tenantId: partner.tenantId,
    propertyId,
    eventType: 'availability.updated',
    payload: { processedCount, timestamp: now },
  });

  return c.json({
    success: errors.length === 0,
    processedCount,
    errorsCount: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
});

// -----------------------------------------------------------------------------
// 6. INBOUND RESERVATIONS (RECEIVE BOOKING)
// -----------------------------------------------------------------------------
connectivityRoutes.post('/properties/:propertyId/reservations', async (c) => {
  const propertyId = c.req.param('propertyId');
  const partner = c.get('connectivityPartner')!;
  const body = await c.req.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);

  const {
    external_reservation_id,
    channel_code,
    room_type_id,
    rate_plan_id,
    check_in_date,
    check_out_date,
    adults = 1,
    children = 0,
    total_amount_minor,
    total_amount,
    currency = 'INR',
    guest,
    special_requests,
    payment_mode = 'pay_at_hotel',
  } = body;

  // Basic Validation
  if (!external_reservation_id || !room_type_id || !check_in_date || !check_out_date || !guest?.full_name) {
    return c.json(
      {
        error: 'Bad Request',
        message: 'Missing required reservation fields (external_reservation_id, room_type_id, check_in_date, check_out_date, guest.full_name).',
        code: 'VALIDATION_ERROR',
      },
      400
    );
  }

  if (check_in_date >= check_out_date) {
    return c.json(
      {
        error: 'Bad Request',
        message: 'check_out_date must be strictly after check_in_date.',
        code: 'INVALID_DATES',
      },
      400
    );
  }

  // Idempotency: Check if external reservation already exists
  const existing: any = await c.env.DB.prepare(
    `SELECT id, reservation_number, status, room_id, total_amount_paise
     FROM reservations
     WHERE property_id = ? AND tenant_id = ? AND external_reference_id = ?`
  )
    .bind(propertyId, partner.tenantId, external_reservation_id)
    .first();

  if (existing) {
    return c.json({
      success: true,
      idempotent: true,
      message: 'Reservation already exists and was previously confirmed.',
      reservation: {
        id: existing.id,
        reservationNumber: existing.reservation_number,
        status: existing.status,
        totalAmountPaise: existing.total_amount_paise,
      },
    });
  }

  // Calculate Nights and Tariff
  const nights = Math.max(
    1,
    Math.round(
      (new Date(check_out_date).getTime() - new Date(check_in_date).getTime()) / (1000 * 86400)
    )
  );
  const totalPaise = total_amount_minor !== undefined ? total_amount_minor : total_amount ? Math.round(total_amount * 100) : 350000;
  const nightlyPaise = Math.round(totalPaise / nights);
  const taxPaise = Math.round(totalPaise * 0.12);

  // Atomic Physical Room Allocation
  const availableRoom: any = await c.env.DB.prepare(
    `SELECT id, room_number FROM rooms
     WHERE room_type_id = ? AND property_id = ? AND tenant_id = ? AND is_active = 1
       AND status = 'available'
       AND id NOT IN (
         SELECT room_id FROM reservations
         WHERE status NOT IN ('cancelled', 'no_show')
           AND check_in_date < ? AND check_out_date > ?
           AND room_id IS NOT NULL
       )
     LIMIT 1`
  )
    .bind(room_type_id, propertyId, partner.tenantId, check_out_date, check_in_date)
    .first();

  const assignedRoomId = availableRoom?.id || null;
  const isOverbooked = !assignedRoomId;

  const reservationId = `res_${crypto.randomUUID()}`;
  const resNumber = `OTA-${Math.floor(100000 + Math.random() * 900000)}`;

  // Insert Reservation
  await c.env.DB.prepare(
    `INSERT INTO reservations (
      id, property_id, tenant_id, reservation_number, room_id, room_type_id, rate_plan_id,
      check_in_date, check_out_date, adults, children, nightly_rate_paise,
      total_room_charge_paise, total_tax_paise, total_discount_paise, total_amount_paise,
      paid_amount_paise, balance_amount_paise, status, source, external_reference_id,
      special_requests, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, 'confirmed', ?, ?, ?, ?, ?)`
  )
    .bind(
      reservationId,
      propertyId,
      partner.tenantId,
      resNumber,
      assignedRoomId,
      room_type_id,
      rate_plan_id || null,
      check_in_date,
      check_out_date,
      adults,
      children,
      nightlyPaise,
      totalPaise - taxPaise,
      taxPaise,
      totalPaise,
      payment_mode === 'ota_vcc' || payment_mode === 'paid' ? totalPaise : 0,
      channel_code || partner.partnerCode,
      external_reservation_id,
      special_requests || null,
      now,
      now
    )
    .run();

  // Insert Guest
  await c.env.DB.prepare(
    `INSERT INTO reservation_guests (
      id, reservation_id, tenant_id, full_name, email, phone, is_primary, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
  )
    .bind(
      `rg_${crypto.randomUUID()}`,
      reservationId,
      partner.tenantId,
      guest.full_name,
      guest.email || null,
      guest.phone || null,
      now,
      now
    )
    .run();

  // Audit Log
  await recordAuditLog(c, {
    tenantId: partner.tenantId,
    actorType: 'system',
    action: 'connectivity.reservation_created',
    resourceType: 'reservation',
    resourceId: reservationId,
    newValues: {
      externalReservationId: external_reservation_id,
      assignedRoomNumber: availableRoom?.room_number,
      isOverbooked,
    },
  });

  // Enqueue Outbox Notification
  await enqueueConnectivityEvent(c.env.DB, {
    partnerId: partner.id,
    tenantId: partner.tenantId,
    propertyId,
    eventType: 'reservation.created',
    payload: {
      externalReservationId: external_reservation_id,
      reservationId,
      reservationNumber: resNumber,
      status: 'confirmed',
      assignedRoom: availableRoom?.room_number || 'unassigned_overbooking',
    },
  });

  return c.json(
    {
      success: true,
      reservation: {
        id: reservationId,
        reservationNumber: resNumber,
        externalReservationId: external_reservation_id,
        status: 'confirmed',
        assignedRoom: availableRoom?.room_number || null,
        overbookingWarning: isOverbooked ? 'Physical capacity full: room assignment escalated to front desk' : undefined,
      },
    },
    201
  );
});

// -----------------------------------------------------------------------------
// 7. RESERVATION MODIFICATION
// -----------------------------------------------------------------------------
connectivityRoutes.put('/properties/:propertyId/reservations/:externalReservationId', async (c) => {
  const propertyId = c.req.param('propertyId');
  const externalReservationId = c.req.param('externalReservationId');
  const partner = c.get('connectivityPartner')!;
  const body = await c.req.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);

  const res: any = await c.env.DB.prepare(
    `SELECT * FROM reservations
     WHERE property_id = ? AND tenant_id = ? AND external_reference_id = ?`
  )
    .bind(propertyId, partner.tenantId, externalReservationId)
    .first();

  if (!res) {
    return c.json({ error: 'Not Found', message: `Reservation with external ID '${externalReservationId}' not found.` }, 404);
  }

  if (res.status === 'cancelled') {
    return c.json({ error: 'Conflict', message: 'Cannot modify a cancelled reservation.' }, 409);
  }

  const checkIn = body.check_in_date || res.check_in_date;
  const checkOut = body.check_out_date || res.check_out_date;
  const adults = body.adults !== undefined ? body.adults : res.adults;
  const children = body.children !== undefined ? body.children : res.children;

  const nights = Math.max(
    1,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 86400))
  );

  const totalPaise = body.total_amount_minor !== undefined
    ? body.total_amount_minor
    : body.total_amount
    ? Math.round(body.total_amount * 100)
    : res.total_amount_paise;
  const nightlyPaise = Math.round(totalPaise / nights);

  await c.env.DB.prepare(
    `UPDATE reservations SET
      check_in_date = ?, check_out_date = ?, adults = ?, children = ?,
      nightly_rate_paise = ?, total_amount_paise = ?, special_requests = COALESCE(?, special_requests),
      updated_at = ?
     WHERE id = ?`
  )
    .bind(checkIn, checkOut, adults, children, nightlyPaise, totalPaise, body.special_requests || null, now, res.id)
    .run();

  if (body.guest?.full_name) {
    await c.env.DB.prepare(
      `UPDATE reservation_guests SET
        full_name = ?, email = COALESCE(?, email), phone = COALESCE(?, phone), updated_at = ?
       WHERE reservation_id = ? AND is_primary = 1`
    )
      .bind(body.guest.full_name, body.guest.email || null, body.guest.phone || null, now, res.id)
      .run();
  }

  // Queue Outbox Notification
  await enqueueConnectivityEvent(c.env.DB, {
    partnerId: partner.id,
    tenantId: partner.tenantId,
    propertyId,
    eventType: 'reservation.modified',
    payload: {
      externalReservationId,
      reservationId: res.id,
      reservationNumber: res.reservation_number,
      checkInDate: checkIn,
      checkOutDate: checkOut,
    },
  });

  return c.json({
    success: true,
    message: 'Reservation modified successfully.',
    reservation: {
      id: res.id,
      reservationNumber: res.reservation_number,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalAmountPaise: totalPaise,
    },
  });
});

// -----------------------------------------------------------------------------
// 8. RESERVATION CANCELLATION
// -----------------------------------------------------------------------------
connectivityRoutes.post('/properties/:propertyId/reservations/:externalReservationId/cancel', async (c) => {
  const propertyId = c.req.param('propertyId');
  const externalReservationId = c.req.param('externalReservationId');
  const partner = c.get('connectivityPartner')!;
  const body = await c.req.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);

  const res: any = await c.env.DB.prepare(
    `SELECT * FROM reservations
     WHERE property_id = ? AND tenant_id = ? AND external_reference_id = ?`
  )
    .bind(propertyId, partner.tenantId, externalReservationId)
    .first();

  if (!res) {
    return c.json({ error: 'Not Found', message: `Reservation with external ID '${externalReservationId}' not found.` }, 404);
  }

  // Idempotency: If already cancelled, return 200 with idempotent flag
  if (res.status === 'cancelled') {
    return c.json({
      success: true,
      idempotent: true,
      message: 'Reservation was already cancelled.',
      reservation: {
        id: res.id,
        reservationNumber: res.reservation_number,
        status: 'cancelled',
      },
    });
  }

  const reason = body.reason || 'Cancelled via OTA Connectivity Integration';

  // Mark cancelled and release physical room
  await c.env.DB.prepare(
    `UPDATE reservations SET
      status = 'cancelled', cancellation_reason = ?, cancelled_at = ?, room_id = NULL, updated_at = ?
     WHERE id = ?`
  )
    .bind(reason, now, now, res.id)
    .run();

  // Audit Log
  await recordAuditLog(c, {
    tenantId: partner.tenantId,
    actorType: 'system',
    action: 'connectivity.reservation_cancelled',
    resourceType: 'reservation',
    resourceId: res.id,
    newValues: { reason },
  });

  // Queue Outbox Notification
  await enqueueConnectivityEvent(c.env.DB, {
    partnerId: partner.id,
    tenantId: partner.tenantId,
    propertyId,
    eventType: 'reservation.cancelled',
    payload: {
      externalReservationId,
      reservationId: res.id,
      reservationNumber: res.reservation_number,
      status: 'cancelled',
      reason,
    },
  });

  return c.json({
    success: true,
    message: 'Reservation successfully cancelled and room inventory restored.',
    reservation: {
      id: res.id,
      reservationNumber: res.reservation_number,
      status: 'cancelled',
    },
  });
});

// -----------------------------------------------------------------------------
// 9. NO-SHOW STATUS TRANSITION
// -----------------------------------------------------------------------------
connectivityRoutes.post('/properties/:propertyId/reservations/:externalReservationId/no-show', async (c) => {
  const propertyId = c.req.param('propertyId');
  const externalReservationId = c.req.param('externalReservationId');
  const partner = c.get('connectivityPartner')!;
  const body = await c.req.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);
  const todayStr = new Date().toISOString().split('T')[0];

  const res: any = await c.env.DB.prepare(
    `SELECT * FROM reservations
     WHERE property_id = ? AND tenant_id = ? AND external_reference_id = ?`
  )
    .bind(propertyId, partner.tenantId, externalReservationId)
    .first();

  if (!res) {
    return c.json({ error: 'Not Found', message: `Reservation with external ID '${externalReservationId}' not found.` }, 404);
  }

  // Idempotency: If already marked no_show, return 200
  if (res.status === 'no_show') {
    return c.json({
      success: true,
      idempotent: true,
      message: 'Reservation was already marked as no-show.',
      reservation: {
        id: res.id,
        reservationNumber: res.reservation_number,
        status: 'no_show',
      },
    });
  }

  // Protection: Can only transition to no-show from 'confirmed'
  if (res.status !== 'confirmed') {
    return c.json(
      {
        error: 'Conflict',
        message: `Invalid status transition: cannot mark a '${res.status}' reservation as no-show. Only 'confirmed' bookings are eligible.`,
        code: 'INVALID_STATUS_TRANSITION',
      },
      409
    );
  }

  // Date Check: Cannot mark future bookings as no-show before check-in date
  if (todayStr < res.check_in_date) {
    return c.json(
      {
        error: 'Bad Request',
        message: `Cannot declare no-show before check-in date (${res.check_in_date}). Current date is ${todayStr}.`,
        code: 'PREMATURE_NO_SHOW',
      },
      400
    );
  }

  const notes = body.notes || 'Guest failed to arrive on scheduled check-in date';

  // Update status to 'no_show', release assigned room
  await c.env.DB.prepare(
    `UPDATE reservations SET
      status = 'no_show', no_show_at = ?, no_show_by = ?, no_show_notes = ?, room_id = NULL, updated_at = ?
     WHERE id = ?`
  )
    .bind(now, `partner:${partner.partnerCode}`, notes, now, res.id)
    .run();

  // Audit Log
  await recordAuditLog(c, {
    tenantId: partner.tenantId,
    actorType: 'system',
    action: 'connectivity.reservation_no_show',
    resourceType: 'reservation',
    resourceId: res.id,
    newValues: { notes },
  });

  // Queue Outbox Notification
  await enqueueConnectivityEvent(c.env.DB, {
    partnerId: partner.id,
    tenantId: partner.tenantId,
    propertyId,
    eventType: 'reservation.no_show',
    payload: {
      externalReservationId,
      reservationId: res.id,
      reservationNumber: res.reservation_number,
      status: 'no_show',
      notes,
    },
  });

  return c.json({
    success: true,
    message: 'Reservation marked as no-show and room inventory restored.',
    reservation: {
      id: res.id,
      reservationNumber: res.reservation_number,
      status: 'no_show',
      noShowAt: now,
    },
  });
});

// -----------------------------------------------------------------------------
// 10. TWO-WAY OUTBOX (POLL & ACKNOWLEDGE)
// -----------------------------------------------------------------------------
connectivityRoutes.get('/outbox', async (c) => {
  const partner = c.get('connectivityPartner')!;
  const limit = Math.min(50, parseInt(c.req.query('limit') || '20', 10));

  const rows = await c.env.DB.prepare(
    `SELECT id, property_id, event_type, payload_json, correlation_id, created_at
     FROM connectivity_outbox
     WHERE partner_id = ? AND status IN ('pending', 'failed')
     ORDER BY created_at ASC
     LIMIT ?`
  )
    .bind(partner.id, limit)
    .all();

  const events = ((rows.results || []) as any[]).map((r) => ({
    id: r.id,
    propertyId: r.property_id,
    eventType: r.event_type,
    payload: JSON.parse(r.payload_json || '{}'),
    correlationId: r.correlation_id,
    createdAt: r.created_at,
  }));

  return c.json({ events });
});

connectivityRoutes.post('/outbox/:eventId/ack', async (c) => {
  const partner = c.get('connectivityPartner')!;
  const eventId = c.req.param('eventId');
  const now = Math.floor(Date.now() / 1000);

  const res = await c.env.DB.prepare(
    `UPDATE connectivity_outbox
     SET status = 'delivered', updated_at = ?
     WHERE id = ? AND partner_id = ?`
  )
    .bind(now, eventId, partner.id)
    .run();

  return c.json({
    success: (res.meta?.changes ?? 0) > 0,
    acknowledgedEventId: eventId,
  });
});

// -----------------------------------------------------------------------------
// 11. WEBHOOK CONFIGURATION
// -----------------------------------------------------------------------------
connectivityRoutes.put('/webhook-config', async (c) => {
  const partner = c.get('connectivityPartner')!;
  const body = await c.req.json().catch(() => ({}));
  const { webhook_url, webhook_secret } = body;
  const now = Math.floor(Date.now() / 1000);

  if (webhook_url && !/^https?:\/\/.+/.test(webhook_url)) {
    return c.json({ error: 'Bad Request', message: 'Valid HTTP/HTTPS webhook_url required' }, 400);
  }

  await c.env.DB.prepare(
    `UPDATE connectivity_partners
     SET webhook_url = ?, webhook_secret = COALESCE(?, webhook_secret), updated_at = ?
     WHERE id = ?`
  )
    .bind(webhook_url || null, webhook_secret || null, now, partner.id)
    .run();

  return c.json({
    success: true,
    message: 'Webhook configuration updated successfully.',
    webhookUrl: webhook_url || null,
  });
});
