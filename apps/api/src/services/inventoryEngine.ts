import { D1Database } from '@cloudflare/workers-types';

export interface DateInventoryInfo {
  date: string;
  roomTypeId: string;
  roomTypeName: string;
  roomTypeCode: string;
  totalRooms: number;
  blockedRooms: number;
  bookedRooms: number;
  availableRooms: number;
  sellableInventory: number;
  pricePaise: number;
  isCustomPrice: boolean;
  closed: boolean;
  closedToArrival: boolean;
  closedToDeparture: boolean;
  minStayArrival: number;
  minStayThrough: number;
  maxStay: number | null;
  overrideInventory: number | null;
}

export interface BulkUpdateRequest {
  propertyId: string;
  roomTypeId: string;
  ratePlanId?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  daysOfWeek?: number[]; // [0=Sun, 1=Mon, ..., 6=Sat]
  pricePaise?: number;
  closed?: boolean;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
  minStayArrival?: number;
  minStayThrough?: number;
  maxStay?: number;
  overrideInventory?: number | null;
  note?: string;
}

/**
 * Calculates date-wise room inventory, reservations, blocks and restrictions.
 */
export async function calculateDateInventory(
  db: D1Database,
  propertyId: string,
  tenantId: string,
  roomTypeId: string,
  date: string
): Promise<DateInventoryInfo> {
  // 1. Fetch Room Type info
  const roomType: any = await db.prepare(
    `SELECT id, name, code, base_price_paise, weekend_price_paise
     FROM room_types WHERE id = ? AND property_id = ? AND tenant_id = ? AND is_active = 1`
  )
    .bind(roomTypeId, propertyId, tenantId)
    .first();

  if (!roomType) {
    throw new Error('Room type not found or inactive');
  }

  // 2. Count total active physical rooms for this type
  const totalRoomsRow: any = await db.prepare(
    `SELECT COUNT(*) as count FROM rooms
     WHERE property_id = ? AND tenant_id = ? AND room_type_id = ? AND is_active = 1`
  )
    .bind(propertyId, tenantId, roomTypeId)
    .first();
  const totalRooms = totalRoomsRow?.count || 0;

  // 3. Count blocked rooms on this date
  const blockedRow: any = await db.prepare(
    `SELECT COUNT(DISTINCT rb.room_id) as count
     FROM room_blocks rb
     JOIN rooms r ON r.id = rb.room_id
     WHERE rb.property_id = ? AND rb.tenant_id = ? AND r.room_type_id = ? AND rb.is_active = 1
       AND rb.start_date <= ? AND rb.end_date > ?`
  )
    .bind(propertyId, tenantId, roomTypeId, date, date)
    .first();
  const blockedRooms = blockedRow?.count || 0;

  // 4. Count active reservations on this date (includes room-assigned and unassigned bookings)
  const bookedRow: any = await db.prepare(
    `SELECT COUNT(*) as count
     FROM reservations
     WHERE property_id = ? AND tenant_id = ? AND room_type_id = ?
       AND status NOT IN ('cancelled', 'checked_out')
       AND check_in_date <= ? AND check_out_date > ?`
  )
    .bind(propertyId, tenantId, roomTypeId, date, date)
    .first();
  const bookedRooms = bookedRow?.count || 0;

  const physicalAvailable = Math.max(0, totalRooms - blockedRooms - bookedRooms);

  // 5. Fetch Daily Restrictions
  const restriction: any = await db.prepare(
    `SELECT * FROM daily_restrictions
     WHERE property_id = ? AND tenant_id = ? AND room_type_id = ? AND date = ?`
  )
    .bind(propertyId, tenantId, roomTypeId, date)
    .first();

  const closed = Boolean(restriction?.closed);
  const closedToArrival = Boolean(restriction?.closed_to_arrival);
  const closedToDeparture = Boolean(restriction?.closed_to_departure);
  const minStayArrival = restriction?.min_stay_arrival ?? 1;
  const minStayThrough = restriction?.min_stay_through ?? 1;
  const maxStay = restriction?.max_stay ?? null;
  const overrideInventory = restriction?.override_inventory ?? null;

  // Sellable inventory
  let sellableInventory = physicalAvailable;
  if (closed) {
    sellableInventory = 0;
  } else if (overrideInventory !== null && overrideInventory !== undefined) {
    sellableInventory = Math.min(physicalAvailable, Math.max(0, overrideInventory));
  }

  // 6. Fetch Daily Custom Rate
  const dailyRateRow: any = await db.prepare(
    `SELECT price_paise FROM daily_rates
     WHERE property_id = ? AND tenant_id = ? AND room_type_id = ? AND date = ?`
  )
    .bind(propertyId, tenantId, roomTypeId, date)
    .first();

  let pricePaise = roomType.base_price_paise;
  let isCustomPrice = false;

  if (dailyRateRow) {
    pricePaise = dailyRateRow.price_paise;
    isCustomPrice = true;
  } else {
    const curDate = new Date(date);
    const isWeekend = curDate.getDay() === 0 || curDate.getDay() === 6;
    if (isWeekend && roomType.weekend_price_paise) {
      pricePaise = roomType.weekend_price_paise;
    }
  }

  return {
    date,
    roomTypeId,
    roomTypeName: roomType.name,
    roomTypeCode: roomType.code,
    totalRooms,
    blockedRooms,
    bookedRooms,
    availableRooms: physicalAvailable,
    sellableInventory,
    pricePaise,
    isCustomPrice,
    closed,
    closedToArrival,
    closedToDeparture,
    minStayArrival,
    minStayThrough,
    maxStay,
    overrideInventory,
  };
}

/**
 * Generates date-range inventory and rate matrix for all or selected room types.
 */
export async function getInventoryMatrix(
  db: D1Database,
  propertyId: string,
  tenantId: string,
  startDate: string,
  endDate: string,
  roomTypeId?: string
): Promise<{
  dates: string[];
  roomTypes: Array<{ id: string; name: string; code: string }>;
  matrix: DateInventoryInfo[];
}> {
  // Fetch room types
  let rtQuery = `SELECT id, name, code, base_price_paise, weekend_price_paise
                 FROM room_types WHERE property_id = ? AND tenant_id = ? AND is_active = 1`;
  const rtParams: any[] = [propertyId, tenantId];

  if (roomTypeId) {
    rtQuery += ` AND id = ?`;
    rtParams.push(roomTypeId);
  }
  rtQuery += ` ORDER BY base_price_paise ASC`;

  const rtRows = await db.prepare(rtQuery).bind(...rtParams).all();
  const roomTypes = (rtRows.results || []) as any[];

  // Generate date list
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateList: string[] = [];

  const cur = new Date(start);
  while (cur <= end) {
    dateList.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }

  const matrix: DateInventoryInfo[] = [];

  for (const rt of roomTypes) {
    for (const d of dateList) {
      const info = await calculateDateInventory(db, propertyId, tenantId, rt.id, d);
      matrix.push(info);
    }
  }

  return {
    dates: dateList,
    roomTypes: roomTypes.map((rt) => ({ id: rt.id, name: rt.name, code: rt.code })),
    matrix,
  };
}

/**
 * Validates and executes bulk update for rates, inventory caps, stop-sell, and stay restrictions.
 */
export async function bulkUpdateRatesAndRestrictions(
  db: D1Database,
  tenantId: string,
  req: BulkUpdateRequest
): Promise<{ success: boolean; updatedDatesCount: number; affectedDates: string[] }> {
  // Server-side security check: Verify property belongs to tenant
  const propCheck: any = await db.prepare(
    `SELECT id FROM properties WHERE id = ? AND tenant_id = ?`
  )
    .bind(req.propertyId, tenantId)
    .first();

  if (!propCheck) {
    throw new Error('Unauthorized property access');
  }

  // Server-side validations
  if (!req.startDate || !req.endDate) {
    throw new Error('Start date and end date are required');
  }
  if (req.startDate > req.endDate) {
    throw new Error('Start date cannot be after end date');
  }
  if (req.pricePaise !== undefined && req.pricePaise < 0) {
    throw new Error('Price cannot be negative');
  }
  if (req.minStayArrival !== undefined && req.minStayArrival < 1) {
    throw new Error('Minimum stay must be at least 1 night');
  }
  if (
    req.maxStay !== undefined &&
    req.maxStay !== null &&
    req.minStayArrival !== undefined &&
    req.maxStay < req.minStayArrival
  ) {
    throw new Error('Maximum stay cannot be less than minimum stay');
  }

  const now = Math.floor(Date.now() / 1000);
  const start = new Date(req.startDate);
  const end = new Date(req.endDate);

  const affectedDates: string[] = [];
  const cur = new Date(start);

  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0 = Sun, 1 = Mon ...
    if (!req.daysOfWeek || req.daysOfWeek.includes(dayOfWeek)) {
      affectedDates.push(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() + 1);
  }

  const statements: any[] = [];

  for (const date of affectedDates) {
    // 1. Update daily price if provided
    if (req.pricePaise !== undefined && req.pricePaise > 0) {
      const drId = `dr_${crypto.randomUUID()}`;
      statements.push(
        db.prepare(
          `INSERT INTO daily_rates (
             id, property_id, tenant_id, room_type_id, date, price_paise, note, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(room_type_id, date) DO UPDATE SET
             price_paise = excluded.price_paise,
             note = excluded.note,
             updated_at = excluded.updated_at`
        ).bind(
          drId,
          req.propertyId,
          tenantId,
          req.roomTypeId,
          date,
          Math.round(req.pricePaise),
          req.note || 'Bulk update',
          now,
          now
        )
      );
    }

    // 2. Update restrictions (Stop-sell, CTA, CTD, Min/Max Stay, Override Inventory)
    const hasRestrictionUpdate =
      req.closed !== undefined ||
      req.closedToArrival !== undefined ||
      req.closedToDeparture !== undefined ||
      req.minStayArrival !== undefined ||
      req.minStayThrough !== undefined ||
      req.maxStay !== undefined ||
      req.overrideInventory !== undefined;

    if (hasRestrictionUpdate) {
      const rstId = `rst_${crypto.randomUUID()}`;
      const ratePlanId = req.ratePlanId || 'ALL';

      statements.push(
        db.prepare(
          `INSERT INTO daily_restrictions (
             id, property_id, tenant_id, room_type_id, rate_plan_id, date,
             closed, closed_to_arrival, closed_to_departure,
             min_stay_arrival, min_stay_through, max_stay, override_inventory,
             created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?,
             COALESCE(?, 0), COALESCE(?, 0), COALESCE(?, 0),
             COALESCE(?, 1), COALESCE(?, 1), ?, ?, ?, ?)
           ON CONFLICT(room_type_id, rate_plan_id, date) DO UPDATE SET
             closed = CASE WHEN ? IS NOT NULL THEN ? ELSE closed END,
             closed_to_arrival = CASE WHEN ? IS NOT NULL THEN ? ELSE closed_to_arrival END,
             closed_to_departure = CASE WHEN ? IS NOT NULL THEN ? ELSE closed_to_departure END,
             min_stay_arrival = CASE WHEN ? IS NOT NULL THEN ? ELSE min_stay_arrival END,
             min_stay_through = CASE WHEN ? IS NOT NULL THEN ? ELSE min_stay_through END,
             max_stay = CASE WHEN ? IS NOT NULL THEN ? ELSE max_stay END,
             override_inventory = CASE WHEN ? IS NOT NULL THEN ? ELSE override_inventory END,
             updated_at = ?`
        ).bind(
          rstId,
          req.propertyId,
          tenantId,
          req.roomTypeId,
          ratePlanId,
          date,
          req.closed !== undefined ? (req.closed ? 1 : 0) : null,
          req.closedToArrival !== undefined ? (req.closedToArrival ? 1 : 0) : null,
          req.closedToDeparture !== undefined ? (req.closedToDeparture ? 1 : 0) : null,
          req.minStayArrival ?? null,
          req.minStayThrough ?? null,
          req.maxStay ?? null,
          req.overrideInventory ?? null,
          now,
          now,
          // ON CONFLICT params:
          req.closed !== undefined ? (req.closed ? 1 : 0) : null,
          req.closed !== undefined ? (req.closed ? 1 : 0) : null,
          req.closedToArrival !== undefined ? (req.closedToArrival ? 1 : 0) : null,
          req.closedToArrival !== undefined ? (req.closedToArrival ? 1 : 0) : null,
          req.closedToDeparture !== undefined ? (req.closedToDeparture ? 1 : 0) : null,
          req.closedToDeparture !== undefined ? (req.closedToDeparture ? 1 : 0) : null,
          req.minStayArrival ?? null,
          req.minStayArrival ?? null,
          req.minStayThrough ?? null,
          req.minStayThrough ?? null,
          req.maxStay ?? null,
          req.maxStay ?? null,
          req.overrideInventory !== undefined ? req.overrideInventory : null,
          req.overrideInventory !== undefined ? req.overrideInventory : null,
          now
        )
      );
    }
  }

  // Execute in batches
  const batchSize = 50;
  for (let i = 0; i < statements.length; i += batchSize) {
    await db.batch(statements.slice(i, i + batchSize));
  }

  return {
    success: true,
    updatedDatesCount: affectedDates.length,
    affectedDates,
  };
}

/**
 * Concurrency & Oversell Protection Guard:
 * Strictly checks that room type has at least 1 sellable unit on every single night of the stay.
 */
export async function checkOversellSafety(
  db: D1Database,
  propertyId: string,
  tenantId: string,
  roomTypeId: string,
  checkInDate: string,
  checkOutDate: string,
  excludeReservationId?: string
): Promise<{ allowed: boolean; conflictingDate?: string; availableCount: number }> {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);

  const cur = new Date(start);
  while (cur < end) {
    const dStr = cur.toISOString().split('T')[0];

    // Count physical rooms
    const totRow: any = await db.prepare(
      `SELECT COUNT(*) as count FROM rooms
       WHERE property_id = ? AND tenant_id = ? AND room_type_id = ? AND is_active = 1`
    )
      .bind(propertyId, tenantId, roomTypeId)
      .first();
    const totalRooms = totRow?.count || 0;

    // Count blocked rooms on date
    const blkRow: any = await db.prepare(
      `SELECT COUNT(DISTINCT rb.room_id) as count
       FROM room_blocks rb
       JOIN rooms r ON r.id = rb.room_id
       WHERE rb.property_id = ? AND rb.tenant_id = ? AND r.room_type_id = ? AND rb.is_active = 1
         AND rb.start_date <= ? AND rb.end_date > ?`
    )
      .bind(propertyId, tenantId, roomTypeId, dStr, dStr)
      .first();
    const blockedRooms = blkRow?.count || 0;

    // Count active reservations on date (excluding current reservation if modifying)
    let resQuery = `
      SELECT COUNT(*) as count
      FROM reservations
      WHERE property_id = ? AND tenant_id = ? AND room_type_id = ?
        AND status NOT IN ('cancelled', 'checked_out')
        AND check_in_date <= ? AND check_out_date > ?
    `;
    const resParams: any[] = [propertyId, tenantId, roomTypeId, dStr, dStr];

    if (excludeReservationId) {
      resQuery += ` AND id != ?`;
      resParams.push(excludeReservationId);
    }

    const resRow: any = await db.prepare(resQuery).bind(...resParams).first();
    const bookedRooms = resRow?.count || 0;

    const available = totalRooms - blockedRooms - bookedRooms;

    if (available <= 0) {
      return {
        allowed: false,
        conflictingDate: dStr,
        availableCount: 0,
      };
    }

    // Check stop-sell
    const rstRow: any = await db.prepare(
      `SELECT closed FROM daily_restrictions
       WHERE property_id = ? AND tenant_id = ? AND room_type_id = ? AND date = ?`
    )
      .bind(propertyId, tenantId, roomTypeId, dStr)
      .first();

    if (rstRow && rstRow.closed === 1) {
      return {
        allowed: false,
        conflictingDate: dStr,
        availableCount: 0,
      };
    }

    cur.setDate(cur.getDate() + 1);
  }

  return { allowed: true, availableCount: 1 };
}
