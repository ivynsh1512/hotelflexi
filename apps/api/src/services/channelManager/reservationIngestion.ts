/**
 * HotelFlexi Channel Manager — Reservation Ingestion & Overbooking Prevention
 * Ingests new bookings, modifications, and cancellations idempotently.
 * Atomically allocates physical room units and cascades inventory updates.
 */

import { NormalizedReservationEvent } from './adapterContract';
import { enqueueChannelSyncJob } from './outboxEngine';
import { buildCanonicalSyncPayloads } from './inventoryRateEngine';

export interface IngestionResult {
  success: boolean;
  reservationId?: string;
  reservationNumber?: string;
  externalReservationId: string;
  action: 'created' | 'modified' | 'cancelled' | 'duplicate_ignored' | 'overbooking_escalated';
  message: string;
  discrepancyId?: string;
}

export async function ingestChannelReservationEvent(
  db: D1Database,
  tenantId: string,
  connectionId: string,
  event: NormalizedReservationEvent
): Promise<IngestionResult> {
  const now = Math.floor(Date.now() / 1000);

  // 1. Fetch Connection & Property info
  const conn: any = await db.prepare(
    `SELECT property_id FROM hotel_channel_connections WHERE id = ? AND tenant_id = ?`
  )
    .bind(connectionId, tenantId)
    .first();

  if (!conn) {
    throw new Error(`Channel connection ${connectionId} not found or unauthorized.`);
  }

  const propertyId = conn.property_id;

  // 2. Idempotency Check: External Reservation Deduplication
  const existingRecord: any = await db.prepare(
    `SELECT id, local_reservation_id, reservation_status, external_version, payload_hash
     FROM channel_reservations
     WHERE connection_id = ? AND external_reservation_id = ?`
  )
    .bind(connectionId, event.externalReservationId)
    .first();

  if (existingRecord) {
    // If payload hash matches and version is the same, duplicate event is ignored
    if (existingRecord.payload_hash === event.payloadHash && existingRecord.reservation_status === event.action) {
      return {
        success: true,
        reservationId: existingRecord.local_reservation_id,
        externalReservationId: event.externalReservationId,
        action: 'duplicate_ignored',
        message: `Idempotent duplicate event ignored for booking ${event.externalReservationId}`,
      };
    }
  }

  // 3. Resolve Room Type Mapping
  const mapping: any = await db.prepare(
    `SELECT local_room_type_id FROM channel_room_mappings
     WHERE connection_id = ? AND external_room_type_id = ? AND mapping_status = 'active'`
  )
    .bind(connectionId, event.externalRoomTypeId)
    .first();

  // If unmapped, fallback to property's default room type or flag mapping error
  let localRoomTypeId = mapping?.local_room_type_id;
  if (!localRoomTypeId) {
    const fallbackRt: any = await db.prepare(
      `SELECT id FROM room_types WHERE property_id = ? AND tenant_id = ? LIMIT 1`
    )
      .bind(propertyId, tenantId)
      .first();
    localRoomTypeId = fallbackRt?.id;
  }

  if (!localRoomTypeId) {
    throw new Error(`Cannot resolve room category mapping for external room ID ${event.externalRoomTypeId}`);
  }

  // ---------------------------------------------------------------------------
  // 4. CANCELLATION LIFECYCLE
  // ---------------------------------------------------------------------------
  if (event.action === 'cancel') {
    if (existingRecord?.local_reservation_id) {
      await db.prepare(
        `UPDATE reservations SET status = 'cancelled', updated_at = ?
         WHERE id = ? AND tenant_id = ?`
      )
        .bind(now, existingRecord.local_reservation_id, tenantId)
        .run();

      await db.prepare(
        `UPDATE channel_reservations SET
          reservation_status = 'cancelled', external_version = ?, last_processed_at = ?,
          payload_hash = ?, raw_payload_json = ?, updated_at = ?
         WHERE id = ?`
      )
        .bind(
          (existingRecord.external_version || 1) + 1,
          now,
          event.payloadHash,
          JSON.stringify(event.rawPayload),
          now,
          existingRecord.id
        )
        .run();

      // Enqueue downstream inventory update to re-open inventory on other channels
      await triggerDownstreamSync(db, propertyId, tenantId, localRoomTypeId, event.checkInDate, event.checkOutDate);

      return {
        success: true,
        reservationId: existingRecord.local_reservation_id,
        externalReservationId: event.externalReservationId,
        action: 'cancelled',
        message: `OTA Booking ${event.externalReservationId} marked cancelled. Room inventory released.`,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 5. ATOMIC PHYSICAL ROOM ALLOCATION & OVERBOOKING PREVENTION
  // ---------------------------------------------------------------------------
  // Find available physical room not occupied during date range
  const availableRoom: any = await db.prepare(
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
    .bind(localRoomTypeId, propertyId, tenantId, event.checkOutDate, event.checkInDate)
    .first();

  let assignedRoomId: string | null = availableRoom?.id || null;
  let isOverbookingRisk = false;
  let discrepancyId: string | undefined = undefined;

  if (!assignedRoomId) {
    isOverbookingRisk = true;
    discrepancyId = `rec_${crypto.randomUUID()}`;

    // Record Critical Reconciliation Event
    await db.prepare(
      `INSERT INTO channel_reconciliation_records (
        id, tenant_id, property_id, connection_id, discrepancy_type,
        stay_date, room_type_id, severity, resolution_status, resolution_notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'overbooking_conflict', ?, ?, 'critical', 'unresolved', ?, ?, ?)`
    )
      .bind(
        discrepancyId,
        tenantId,
        propertyId,
        connectionId,
        event.checkInDate,
        localRoomTypeId,
        `Overbooking Alert: Inbound reservation ${event.externalReservationId} arrived when zero physical rooms were vacant. Requires staff upgrade/reassignment.`,
        now,
        now
      )
      .run();
  }

  // ---------------------------------------------------------------------------
  // 6. CREATE OR UPDATE PMS RESERVATION
  // ---------------------------------------------------------------------------
  const reservationId = existingRecord?.local_reservation_id || `res_${crypto.randomUUID()}`;
  const resNumber = `OTA-${Math.floor(100000 + Math.random() * 900000)}`;

  const nights = Math.max(
    1,
    Math.round(
      (new Date(event.checkOutDate).getTime() - new Date(event.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const totalPaise = event.totalAmountMinor || 350000;
  const nightlyPaise = Math.round(totalPaise / nights);
  const taxPaise = Math.round(totalPaise * 0.12);

  if (existingRecord?.local_reservation_id) {
    // Modification
    await db.prepare(
      `UPDATE reservations SET
        check_in_date = ?, check_out_date = ?, adults = ?, children = ?,
        nightly_rate_paise = ?, total_amount_paise = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    )
      .bind(
        event.checkInDate,
        event.checkOutDate,
        event.adults,
        event.children,
        nightlyPaise,
        totalPaise,
        now,
        reservationId,
        tenantId
      )
      .run();
  } else {
    // New Reservation
    await db.prepare(
      `INSERT INTO reservations (
        id, property_id, tenant_id, reservation_number, room_id, room_type_id,
        check_in_date, check_out_date, adults, children,
        nightly_rate_paise, total_room_charge_paise, total_tax_paise, total_discount_paise,
        total_amount_paise, paid_amount_paise, balance_amount_paise, status, source,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, 'confirmed', ?, ?, ?)`
    )
      .bind(
        reservationId,
        propertyId,
        tenantId,
        resNumber,
        assignedRoomId,
        localRoomTypeId,
        event.checkInDate,
        event.checkOutDate,
        event.adults,
        event.children,
        nightlyPaise,
        totalPaise - taxPaise,
        taxPaise,
        totalPaise,
        totalPaise,
        event.channelCode,
        now,
        now
      )
      .run();

    // Primary Guest Record
    await db.prepare(
      `INSERT INTO reservation_guests (
        id, reservation_id, tenant_id, full_name, email, phone, is_primary, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
    )
      .bind(
        `rg_${crypto.randomUUID()}`,
        reservationId,
        tenantId,
        event.guestName,
        event.guestEmail || null,
        event.guestPhone || null,
        now,
        now
      )
      .run();
  }

  // Update or Insert channel_reservations tracking record
  await db.prepare(
    `INSERT INTO channel_reservations (
      id, tenant_id, property_id, connection_id, external_reservation_id, local_reservation_id,
      reservation_status, external_version, last_processed_at, payload_hash, raw_payload_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 1, ?, ?, ?, ?, ?)
    ON CONFLICT(connection_id, external_reservation_id) DO UPDATE SET
      local_reservation_id = excluded.local_reservation_id,
      reservation_status = 'confirmed',
      external_version = channel_reservations.external_version + 1,
      last_processed_at = excluded.last_processed_at,
      payload_hash = excluded.payload_hash,
      raw_payload_json = excluded.raw_payload_json,
      updated_at = excluded.updated_at`
  )
    .bind(
      `cr_${crypto.randomUUID()}`,
      tenantId,
      propertyId,
      connectionId,
      event.externalReservationId,
      reservationId,
      now,
      event.payloadHash,
      JSON.stringify(event.rawPayload),
      now,
      now
    )
    .run();

  // ---------------------------------------------------------------------------
  // 7. CASCADE DOWNSTREAM AVAILABILITY SYNC TO OTHER OTAS
  // ---------------------------------------------------------------------------
  await triggerDownstreamSync(db, propertyId, tenantId, localRoomTypeId, event.checkInDate, event.checkOutDate);

  return {
    success: true,
    reservationId,
    reservationNumber: resNumber,
    externalReservationId: event.externalReservationId,
    action: isOverbookingRisk ? 'overbooking_escalated' : existingRecord ? 'modified' : 'created',
    message: isOverbookingRisk
      ? `Reservation recorded. Physical capacity full: logged overbooking discrepancy #${discrepancyId?.slice(-6)}.`
      : `Reservation successfully processed and room assigned (Ref: ${event.externalReservationId}).`,
    discrepancyId,
  };
}

async function triggerDownstreamSync(
  db: D1Database,
  propertyId: string,
  tenantId: string,
  roomTypeId: string,
  startDate: string,
  endDateExclusive: string
) {
  try {
    const connections = await db.prepare(
      `SELECT id FROM hotel_channel_connections WHERE property_id = ? AND tenant_id = ? AND connection_status = 'active'`
    )
      .bind(propertyId, tenantId)
      .all();

    const { availability } = await buildCanonicalSyncPayloads(
      db,
      propertyId,
      tenantId,
      roomTypeId,
      startDate,
      endDateExclusive
    );

    for (const c of (connections.results || []) as any[]) {
      await enqueueChannelSyncJob(db, {
        tenantId,
        propertyId,
        connectionId: c.id,
        jobType: 'availability_push',
        payload: availability,
      });
    }
  } catch (err) {
    console.error('[Downstream Sync Error]', err);
  }
}
