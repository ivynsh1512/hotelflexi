/**
 * HotelFlexi Channel Manager — Central Availability & Rate Engine (Single Authority)
 * Computes live physical room availability, active blocks, daily restrictions,
 * and canonical ARI payloads for distribution.
 */

import { AvailabilityUpdate, RateUpdate, RestrictionUpdate } from './adapterContract';

export interface DateAvailabilitySnapshot {
  date: string; // YYYY-MM-DD
  roomTypeId: string;
  roomTypeName: string;
  totalPhysicalRooms: number;
  reservedRooms: number;
  blockedRooms: number;
  availableRooms: number;
  baseRatePaise: number;
  weekendRatePaise?: number;
  effectiveRatePaise: number;
  stopSell: boolean;
  closedToArrival: boolean;
  closedToDeparture: boolean;
  minStay: number;
  maxStay?: number;
  sourceVersion: number;
}

export async function calculateCanonicalAvailability(
  db: D1Database,
  propertyId: string,
  tenantId: string,
  roomTypeId: string,
  startDate: string,
  endDateExclusive: string
): Promise<DateAvailabilitySnapshot[]> {
  // 1. Fetch Room Type details
  const rt: any = await db.prepare(
    `SELECT id, name, code, base_price_paise, weekend_price_paise FROM room_types
     WHERE id = ? AND property_id = ? AND tenant_id = ?`
  )
    .bind(roomTypeId, propertyId, tenantId)
    .first();

  if (!rt) {
    throw new Error(`Room category ${roomTypeId} not found for property ${propertyId}`);
  }

  // 2. Count active physical rooms
  const roomCountRow: any = await db.prepare(
    `SELECT COUNT(*) as count FROM rooms
     WHERE room_type_id = ? AND property_id = ? AND tenant_id = ? AND is_active = 1`
  )
    .bind(roomTypeId, propertyId, tenantId)
    .first();
  const totalPhysicalRooms = roomCountRow?.count || 0;

  // 3. Fetch overlapping reservations
  const resRows = await db.prepare(
    `SELECT check_in_date, check_out_date, room_id
     FROM reservations
     WHERE room_type_id = ? AND property_id = ? AND tenant_id = ?
       AND status NOT IN ('cancelled', 'no_show')
       AND check_in_date < ? AND check_out_date > ?`
  )
    .bind(roomTypeId, propertyId, tenantId, endDateExclusive, startDate)
    .all();
  const reservations = resRows.results || [];

  // 4. Fetch overlapping room blocks
  const blockRows = await db.prepare(
    `SELECT rb.start_date, rb.end_date, rb.room_id
     FROM room_blocks rb
     JOIN rooms r ON r.id = rb.room_id
     WHERE r.room_type_id = ? AND rb.property_id = ? AND rb.tenant_id = ?
       AND rb.is_active = 1
       AND rb.start_date < ? AND rb.end_date > ?`
  )
    .bind(roomTypeId, propertyId, tenantId, endDateExclusive, startDate)
    .all();
  const blocks = blockRows.results || [];

  // 5. Fetch daily restrictions
  const restrRows = await db.prepare(
    `SELECT date, closed, closed_to_arrival, closed_to_departure, min_stay_arrival, max_stay, override_inventory
     FROM daily_restrictions
     WHERE room_type_id = ? AND property_id = ? AND tenant_id = ?
       AND date >= ? AND date < ?`
  )
    .bind(roomTypeId, propertyId, tenantId, startDate, endDateExclusive)
    .all();
  const restrictionsByDate = new Map<string, any>();
  for (const r of (restrRows.results || []) as any[]) {
    restrictionsByDate.set(r.date, r);
  }

  // 6. Fetch daily price overrides
  const priceRows = await db.prepare(
    `SELECT date, price_paise
     FROM daily_rates
     WHERE room_type_id = ? AND property_id = ? AND tenant_id = ?
       AND date >= ? AND date < ?`
  )
    .bind(roomTypeId, propertyId, tenantId, startDate, endDateExclusive)
    .all();
  const priceByDate = new Map<string, number>();
  for (const p of (priceRows.results || []) as any[]) {
    priceByDate.set(p.date, p.price_paise);
  }

  const results: DateAvailabilitySnapshot[] = [];
  const cur = new Date(startDate);
  const end = new Date(endDateExclusive);

  while (cur < end) {
    const dStr = cur.toISOString().split('T')[0];
    const day = cur.getUTCDay();
    const isWeekend = day === 0 || day === 5 || day === 6; // Fri, Sat, Sun

    // Count reserved rooms on this date
    const reservedCount = reservations.filter(
      (r: any) => r.check_in_date <= dStr && r.check_out_date > dStr
    ).length;

    // Count blocked rooms on this date
    const blockedCount = blocks.filter(
      (b: any) => b.start_date <= dStr && b.end_date > dStr
    ).length;

    const rest = restrictionsByDate.get(dStr);
    const calculatedAvailable = Math.max(0, totalPhysicalRooms - reservedCount - blockedCount);
    const availableRooms = rest?.override_inventory !== null && rest?.override_inventory !== undefined
      ? Math.min(calculatedAvailable, rest.override_inventory)
      : calculatedAvailable;

    const overridePrice = priceByDate.get(dStr);
    const effectiveRatePaise = overridePrice !== undefined
      ? overridePrice
      : (isWeekend && rt.weekend_price_paise ? rt.weekend_price_paise : rt.base_price_paise);

    results.push({
      date: dStr,
      roomTypeId,
      roomTypeName: rt.name,
      totalPhysicalRooms,
      reservedRooms: reservedCount,
      blockedRooms: blockedCount,
      availableRooms,
      baseRatePaise: rt.base_price_paise,
      weekendRatePaise: rt.weekend_price_paise,
      effectiveRatePaise,
      stopSell: Boolean(rest?.closed) || availableRooms <= 0,
      closedToArrival: Boolean(rest?.closed_to_arrival),
      closedToDeparture: Boolean(rest?.closed_to_departure),
      minStay: rest?.min_stay_arrival || 1,
      maxStay: rest?.max_stay,
      sourceVersion: Math.floor(Date.now() / 1000),
    });

    cur.setDate(cur.getDate() + 1);
  }

  return results;
}

/**
 * Generates canonical Outbox payload definitions for all mapped OTA connections.
 */
export async function buildCanonicalSyncPayloads(
  db: D1Database,
  propertyId: string,
  tenantId: string,
  roomTypeId: string,
  startDate: string,
  endDateExclusive: string
): Promise<{
  availability: AvailabilityUpdate;
  rates: RateUpdate;
  restrictions: RestrictionUpdate;
}> {
  const snapshots = await calculateCanonicalAvailability(
    db,
    propertyId,
    tenantId,
    roomTypeId,
    startDate,
    endDateExclusive
  );

  const minAvailable = snapshots.reduce((min, s) => Math.min(min, s.availableRooms), Infinity);
  const sourceVersion = Math.floor(Date.now() / 1000);

  const availability: AvailabilityUpdate = {
    propertyId,
    roomTypeId,
    startDate,
    endDateExclusive,
    availableRooms: minAvailable === Infinity ? 0 : minAvailable,
    currency: 'INR',
    sourceVersion,
  };

  const rates: RateUpdate = {
    propertyId,
    roomTypeId,
    ratePlanId: 'DEFAULT_EP',
    startDate,
    endDateExclusive,
    nightlyPrices: snapshots.map((s) => ({
      date: s.date,
      amountMinor: s.effectiveRatePaise,
      currency: 'INR',
    })),
  };

  const restrictions: RestrictionUpdate = {
    propertyId,
    roomTypeId,
    startDate,
    endDateExclusive,
    stopSell: snapshots.some((s) => s.stopSell),
    closedToArrival: snapshots.some((s) => s.closedToArrival),
    closedToDeparture: snapshots.some((s) => s.closedToDeparture),
    minimumStay: Math.max(1, ...snapshots.map((s) => s.minStay)),
  };

  return { availability, rates, restrictions };
}
