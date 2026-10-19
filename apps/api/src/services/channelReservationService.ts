import { D1Database } from '@cloudflare/workers-types';
import { OtaReservationPayload } from './ota/types';
import { checkOversellSafety } from './inventoryEngine';
import { broadcastInventoryChange } from './syncEngine';

export interface OtaProcessResult {
  success: boolean;
  action: 'created' | 'modified' | 'cancelled' | 'duplicate_ignored';
  reservationId?: string;
  reservationNumber?: string;
  message: string;
  code?: string;
}

/**
 * Processes incoming channel reservations, modifications, and cancellations with
 * strict transactional concurrency checks and duplicate event deduplication.
 */
export async function processOtaReservationEvent(
  db: D1Database,
  tenantId: string,
  connectionId: string,
  payload: OtaReservationPayload
): Promise<OtaProcessResult> {
  const now = Math.floor(Date.now() / 1000);

  // 1. Verify Connection and Property Ownership
  const connection: any = await db.prepare(
    `SELECT oc.*, p.id as prop_id, p.name as prop_name
     FROM ota_connections oc
     JOIN properties p ON p.id = oc.property_id
     WHERE oc.id = ? AND oc.tenant_id = ?`
  )
    .bind(connectionId, tenantId)
    .first();

  if (!connection) {
    throw new Error('OTA Connection not found or unauthorized');
  }

  const propertyId = connection.property_id;

  // 2. Duplicate Detection via channel_bookings table
  const existingBooking: any = await db.prepare(
    `SELECT * FROM channel_bookings
     WHERE connection_id = ? AND channel_booking_ref = ?`
  )
    .bind(connectionId, payload.channelBookingRef)
    .first();

  // If already processed with identical status, handle idempotently
  if (existingBooking && existingBooking.channel_status === payload.status) {
    return {
      success: true,
      action: 'duplicate_ignored',
      reservationId: existingBooking.reservation_id,
      message: `Duplicate OTA event acknowledged. Booking ref #${payload.channelBookingRef} already processed.`,
    };
  }

  // 3. Handle Cancellation
  if (payload.status === 'cancelled') {
    if (!existingBooking?.reservation_id) {
      return {
        success: true,
        action: 'duplicate_ignored',
        message: 'Cancellation received for non-existent or previously cancelled reservation.',
      };
    }

    const resId = existingBooking.reservation_id;

    // Fetch existing reservation to get room type and dates
    const res: any = await db.prepare(
      `SELECT * FROM reservations WHERE id = ? AND tenant_id = ?`
    )
      .bind(resId, tenantId)
      .first();

    if (res) {
      await db.batch([
        db.prepare(
          `UPDATE reservations SET
             status = 'cancelled',
             cancellation_reason = ?,
             cancelled_at = ?,
             updated_at = ?
           WHERE id = ?`
        ).bind(`Cancelled via ${connection.channel_name}`, now, now, resId),
        db.prepare(
          `UPDATE channel_bookings SET
             channel_status = 'cancelled',
             raw_payload = ?
           WHERE id = ?`
        ).bind(JSON.stringify(payload), existingBooking.id),
      ]);

      // Reopen inventory across all other connected channels
      await broadcastInventoryChange(
        db,
        propertyId,
        tenantId,
        res.room_type_id,
        res.check_in_date,
        res.check_out_date
      );

      return {
        success: true,
        action: 'cancelled',
        reservationId: resId,
        reservationNumber: res.reservation_number,
        message: `Reservation #${res.reservation_number} cancelled and inventory reopened.`,
      };
    }
  }

  // 4. Handle Modification
  if (payload.status === 'modified' && existingBooking?.reservation_id) {
    const resId = existingBooking.reservation_id;

    // Check oversell safety excluding this reservation
    const safety = await checkOversellSafety(
      db,
      propertyId,
      tenantId,
      payload.roomTypeId,
      payload.checkInDate,
      payload.checkOutDate,
      resId
    );

    if (!safety.allowed) {
      return {
        success: false,
        action: 'modified',
        code: 'OVERSELL_PREVENTED',
        message: `Cannot modify booking: No sellable inventory on ${safety.conflictingDate}`,
      };
    }

    await db.batch([
      db.prepare(
        `UPDATE reservations SET
           check_in_date = ?,
           check_out_date = ?,
           adults = ?,
           children = ?,
           nightly_rate_paise = ?,
           total_amount_paise = ?,
           balance_amount_paise = ?,
           special_requests = ?,
           updated_at = ?
         WHERE id = ?`
      ).bind(
        payload.checkInDate,
        payload.checkOutDate,
        payload.adults,
        payload.children,
        payload.nightlyRatePaise,
        payload.totalAmountPaise,
        payload.totalAmountPaise,
        payload.specialRequests || null,
        now,
        resId
      ),
      db.prepare(
        `UPDATE channel_bookings SET
           channel_status = 'modified',
           raw_payload = ?
         WHERE id = ?`
      ).bind(JSON.stringify(payload), existingBooking.id),
    ]);

    await broadcastInventoryChange(
      db,
      propertyId,
      tenantId,
      payload.roomTypeId,
      payload.checkInDate,
      payload.checkOutDate
    );

    return {
      success: true,
      action: 'modified',
      reservationId: resId,
      message: `Reservation modified successfully.`,
    };
  }

  // 5. Handle New Reservation Creation
  // Prevent Overselling: Check available room units on every night of requested stay
  const safety = await checkOversellSafety(
    db,
    propertyId,
    tenantId,
    payload.roomTypeId,
    payload.checkInDate,
    payload.checkOutDate
  );

  if (!safety.allowed) {
    return {
      success: false,
      action: 'created',
      code: 'OVERSELL_PREVENTED',
      message: `Oversell Prevented: Room category is fully committed on ${safety.conflictingDate}. Channel booking ref #${payload.channelBookingRef} rejected.`,
    };
  }

  // Calculate nights and taxes
  const d1 = new Date(payload.checkInDate);
  const d2 = new Date(payload.checkOutDate);
  const nights = Math.max(1, Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

  const nightlyRatePaise = payload.nightlyRatePaise || Math.round(payload.totalAmountPaise / nights);
  const gstRate = nightlyRatePaise > 750000 ? 1800 : 1200;
  const taxPaise = Math.round((payload.totalAmountPaise * gstRate) / 10000);

  const reservationId = `res_${crypto.randomUUID()}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const reservationNumber = `RES-OTA-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;
  const channelBookingId = `cb_${crypto.randomUUID()}`;
  const guestPortalToken = crypto.randomUUID();
  const guestPortalExpiresAt = Math.floor(new Date(`${payload.checkOutDate}T23:59:59Z`).getTime() / 1000) + (7 * 86400);

  // Auto-allocate an available room number if possible
  const assignedRoomRow: any = await db.prepare(
    `SELECT r.id FROM rooms r
     WHERE r.property_id = ? AND r.tenant_id = ? AND r.room_type_id = ? AND r.is_active = 1
       AND r.id NOT IN (
         SELECT DISTINCT res.room_id FROM reservations res
         WHERE res.property_id = ? AND res.status NOT IN ('cancelled', 'checked_out')
           AND res.check_in_date < ? AND res.check_out_date > ? AND res.room_id IS NOT NULL
       )
       AND r.id NOT IN (
         SELECT DISTINCT rb.room_id FROM room_blocks rb
         WHERE rb.property_id = ? AND rb.is_active = 1
           AND rb.start_date < ? AND rb.end_date > ?
       )
     LIMIT 1`
  )
    .bind(
      propertyId, tenantId, payload.roomTypeId,
      propertyId, payload.checkOutDate, payload.checkInDate,
      propertyId, payload.checkOutDate, payload.checkInDate
    )
    .first();

  const assignedRoomId = assignedRoomRow?.id || null;

  await db.batch([
    // Insert Reservation
    db.prepare(
      `INSERT INTO reservations (
         id, property_id, tenant_id, reservation_number, source, ota_reservation_id,
         status, room_id, room_type_id, check_in_date, check_out_date,
         adults, children, nightly_rate_paise, total_room_charge_paise,
         total_tax_paise, total_discount_paise, total_amount_paise,
         paid_amount_paise, balance_amount_paise, payment_status,
         special_requests, guest_portal_token, guest_portal_expires_at,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, 'pending', ?, ?, ?, ?, ?)`
    ).bind(
      reservationId,
      propertyId,
      tenantId,
      reservationNumber,
      payload.channelName || connection.channel_name,
      payload.channelBookingRef,
      assignedRoomId,
      payload.roomTypeId,
      payload.checkInDate,
      payload.checkOutDate,
      payload.adults || 2,
      payload.children || 0,
      nightlyRatePaise,
      payload.totalAmountPaise,
      taxPaise,
      payload.totalAmountPaise,
      payload.totalAmountPaise,
      payload.specialRequests || null,
      guestPortalToken,
      guestPortalExpiresAt,
      now,
      now
    ),

    // Insert Primary Guest
    db.prepare(
      `INSERT INTO reservation_guests (
         id, reservation_id, tenant_id, full_name, email, phone, is_primary, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
    ).bind(
      `gst_${crypto.randomUUID()}`,
      reservationId,
      tenantId,
      payload.guestName || 'OTA Guest',
      payload.guestEmail || null,
      payload.guestPhone || null,
      now
    ),

    // Insert Channel Booking Record for Deduplication
    db.prepare(
      `INSERT INTO channel_bookings (
         id, connection_id, property_id, tenant_id, reservation_id,
         channel_booking_ref, channel_status, raw_payload, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`
    ).bind(
      channelBookingId,
      connectionId,
      propertyId,
      tenantId,
      reservationId,
      payload.channelBookingRef,
      JSON.stringify(payload),
      now
    ),
  ]);

  // Broadcast inventory decrease across all OTHER channels
  await broadcastInventoryChange(
    db,
    propertyId,
    tenantId,
    payload.roomTypeId,
    payload.checkInDate,
    payload.checkOutDate
  );

  return {
    success: true,
    action: 'created',
    reservationId,
    reservationNumber,
    message: `Reservation confirmed from ${connection.channel_name} (Ref #${payload.channelBookingRef}). Central inventory updated.`,
  };
}
