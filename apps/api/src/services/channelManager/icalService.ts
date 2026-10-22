/**
 * HotelFlexi Channel Manager — Two-Way iCal Calendar Sync
 * RFC 5545 iCalendar standard for Airbnb, VRBO, Booking.com, and vacation rental engines.
 * Supports automated feed export (.ics) and inbound sync ingestion.
 */

export interface IcalParsedEvent {
  uid: string;
  summary: string;
  dtStart: string; // YYYY-MM-DD
  dtEnd: string;   // YYYY-MM-DD
  description?: string;
  status?: string;
}

export interface IcalSyncResult {
  totalEvents: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Format ISO date string (YYYY-MM-DD) into iCal DATE format (YYYYMMDD)
 */
function toIcalDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.replace(/[^0-9]/g, '').slice(0, 8);
}

/**
 * Parse an iCal date string into YYYY-MM-DD format
 * Supports: 20261025, 20261025T140000Z, 2026-10-25
 */
export function parseIcalDateToIso(rawDate: string): string {
  if (!rawDate) return '';
  const clean = rawDate.trim().replace(/^VALUE=DATE:/i, '');
  if (clean.includes('-')) {
    return clean.slice(0, 10);
  }
  const digits = clean.replace(/[^0-9]/g, '');
  if (digits.length >= 8) {
    const year = digits.slice(0, 4);
    const month = digits.slice(4, 6);
    const day = digits.slice(6, 8);
    return `${year}-${month}-${day}`;
  }
  return clean;
}

/**
 * Generate standard RFC 5545 .ics calendar content for a room type
 */
export async function generateIcalFeed(
  db: D1Database,
  roomTypeId: string
): Promise<string> {
  const roomType: any = await db.prepare(
    `SELECT rt.id, rt.name as room_type_name, p.name as property_name, p.id as property_id
     FROM room_types rt
     JOIN properties p ON p.id = rt.property_id
     WHERE rt.id = ? AND rt.is_active = 1`
  )
    .bind(roomTypeId)
    .first();

  if (!roomType) {
    throw new Error('Room type not found or inactive');
  }

  // Fetch active reservations in range (from 30 days past onwards)
  const reservations: any = await db.prepare(
    `SELECT id, reservation_number, check_in_date, check_out_date, status, special_requests, created_at, updated_at
     FROM reservations
     WHERE room_type_id = ?
       AND status IN ('confirmed', 'checked_in')
       AND check_out_date >= date('now', '-30 days')
     ORDER BY check_in_date ASC`
  )
    .bind(roomTypeId)
    .all();

  const nowIso = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HotelFlexi//Channel Manager iCal 2.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:HotelFlexi - ${roomType.property_name} (${roomType.room_type_name})`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const res of (reservations.results || []) as any[]) {
    const start = toIcalDate(res.check_in_date);
    const end = toIcalDate(res.check_out_date);
    if (!start || !end) continue;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:hf_res_${res.id}@hotelflexi.com`);
    lines.push(`DTSTAMP:${nowIso}`);
    lines.push(`DTSTART;VALUE=DATE:${start}`);
    lines.push(`DTEND;VALUE=DATE:${end}`);
    lines.push(`SUMMARY:Reserved (HotelFlexi #${res.reservation_number})`);
    lines.push(`DESCRIPTION:HotelFlexi Reservation ${res.reservation_number}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:OPAQUE');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/**
 * Parse an incoming RFC 5545 .ics calendar string
 */
export function parseIcalContent(rawIcs: string): IcalParsedEvent[] {
  // Unfold multiline lines (RFC 5545: CRLF followed by a space or tab)
  const unfolded = rawIcs.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);

  const events: IcalParsedEvent[] = [];
  let inEvent = false;
  let currentEvent: Partial<IcalParsedEvent> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      if (inEvent && currentEvent.uid && currentEvent.dtStart && currentEvent.dtEnd) {
        events.push({
          uid: currentEvent.uid,
          summary: currentEvent.summary || 'Airbnb Booking',
          dtStart: currentEvent.dtStart,
          dtEnd: currentEvent.dtEnd,
          description: currentEvent.description,
          status: currentEvent.status || 'CONFIRMED',
        });
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }

    if (!inEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const propHeader = line.slice(0, colonIdx).toUpperCase();
    const propValue = line.slice(colonIdx + 1);

    if (propHeader === 'UID') {
      currentEvent.uid = propValue;
    } else if (propHeader.startsWith('DTSTART')) {
      currentEvent.dtStart = parseIcalDateToIso(propValue);
    } else if (propHeader.startsWith('DTEND')) {
      currentEvent.dtEnd = parseIcalDateToIso(propValue);
    } else if (propHeader === 'SUMMARY') {
      currentEvent.summary = propValue;
    } else if (propHeader === 'DESCRIPTION') {
      currentEvent.description = propValue;
    } else if (propHeader === 'STATUS') {
      currentEvent.status = propValue.toUpperCase();
    }
  }

  return events;
}

/**
 * Ingest inbound iCal events from Airbnb / VRBO URL
 */
export async function syncInboundIcalFeed(
  db: D1Database,
  tenantId: string,
  propertyId: string,
  roomTypeId: string,
  icalUrl: string,
  channelCode: string = 'airbnb'
): Promise<IcalSyncResult> {
  const result: IcalSyncResult = {
    totalEvents: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // 1. Fetch external iCal file
  let icsText = '';
  try {
    const resp = await fetch(icalUrl, {
      headers: {
        'User-Agent': 'HotelFlexi-ChannelManager-iCal/2.0 (+https://hotelflexi.com)',
        Accept: 'text/calendar, text/plain, */*',
      },
    });

    if (!resp.ok) {
      result.errors.push(`Failed to fetch iCal feed: HTTP ${resp.status}`);
      return result;
    }
    icsText = await resp.text();
  } catch (err: any) {
    result.errors.push(`Network error fetching iCal feed: ${err.message}`);
    return result;
  }

  // 2. Parse iCal text
  const events = parseIcalContent(icsText);
  result.totalEvents = events.length;

  const now = Math.floor(Date.now() / 1000);

  // 3. Process events
  for (const ev of events) {
    try {
      // Check for existing reservation matching external ID
      const existing: any = await db.prepare(
        `SELECT id, status, check_in_date, check_out_date FROM reservations
         WHERE property_id = ? AND external_reference_id = ?`
      )
        .bind(propertyId, ev.uid)
        .first();

      if (existing) {
        // If dates changed, update them
        if (existing.check_in_date !== ev.dtStart || existing.check_out_date !== ev.dtEnd) {
          await db.prepare(
            `UPDATE reservations SET check_in_date = ?, check_out_date = ?, updated_at = ?
             WHERE id = ?`
          )
            .bind(ev.dtStart, ev.dtEnd, now, existing.id)
            .run();
          result.updated++;
        } else {
          result.skipped++;
        }
        continue;
      }

      // Check if cancelled in iCal
      if (ev.status === 'CANCELLED') {
        result.skipped++;
        continue;
      }

      // Find available physical room
      const availableRoom: any = await db.prepare(
        `SELECT r.id, r.room_number FROM rooms r
         WHERE r.room_type_id = ?
           AND r.property_id = ?
           AND r.is_active = 1
           AND r.status != 'maintenance'
           AND r.id NOT IN (
             SELECT res.room_id FROM reservations res
             WHERE res.property_id = ?
               AND res.room_id IS NOT NULL
               AND res.status IN ('confirmed', 'checked_in')
               AND res.check_in_date < ?
               AND res.check_out_date > ?
           )
         LIMIT 1`
      )
        .bind(roomTypeId, propertyId, propertyId, ev.dtEnd, ev.dtStart)
        .first();

      const reservationId = crypto.randomUUID();
      const resNumber = `AIRBNB-${Date.now().toString().slice(-6)}`;
      const nights = Math.max(1, Math.round((new Date(ev.dtEnd).getTime() - new Date(ev.dtStart).getTime()) / 86400000));
      const estNightlyPaise = 300000; // Default ₹3,000 estimate
      const totalChargePaise = estNightlyPaise * nights;

      await db.prepare(
        `INSERT INTO reservations (
          id, property_id, tenant_id, reservation_number, source, status,
          room_id, room_type_id, check_in_date, check_out_date,
          adults, children, nightly_rate_paise, total_room_charge_paise,
          total_tax_paise, total_discount_paise, total_amount_paise, paid_amount_paise,
          balance_amount_paise, payment_status, special_requests, external_reference_id,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, 'confirmed',
          ?, ?, ?, ?,
          1, 0, ?, ?,
          0, 0, ?, ?,
          0, 'paid', ?, ?,
          ?, ?
        )`
      )
        .bind(
          reservationId,
          propertyId,
          tenantId,
          resNumber,
          channelCode,
          availableRoom ? availableRoom.id : null,
          roomTypeId,
          ev.dtStart,
          ev.dtEnd,
          estNightlyPaise,
          totalChargePaise,
          totalChargePaise,
          totalChargePaise,
          `iCal Sync: ${ev.summary || 'Airbnb Booking'}${availableRoom ? '' : ' [OVERBOOKING: Front desk assignment needed]'}`,
          ev.uid,
          now,
          now
        )
        .run();

      result.imported++;
    } catch (itemErr: any) {
      result.errors.push(`Error importing event ${ev.uid}: ${itemErr.message}`);
    }
  }

  return result;
}
