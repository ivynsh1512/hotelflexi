/**
 * HotelFlexi AI Context Builder
 * Safely extracts authorized, real-time property context for Groq AI analysis.
 * Never exposes passwords, raw payment tokens, or other tenants' data.
 */

import { Env } from '../types';

export interface PropertyLiveContext {
  propertyId: string;
  propertyName: string;
  propertyCode: string;
  city: string;
  todayDateIso: string;
  yesterdayDateIso: string;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  dirtyRooms: number;
  cleaningRooms: number;
  inspectedRooms: number;
  readyRooms: number;
  outOfOrderRooms: number;
  occupancyPercent: number;
  todayArrivals: number;
  todayDepartures: number;
  inHouseGuests: number;
  todayCollectionPaise: number;
  yesterdayCollectionPaise: number;
  monthCollectionPaise: number;
  openComplaints: number;
  urgentComplaints: number;
  pendingHousekeepingTasks: number;
  linenBelowParCount: number;
  foodShortageCount: number;
  roomTypesSummary: Array<{ name: string; basePricePaise: number; availableCount: number }>;
}

export async function buildPropertyLiveContext(
  db: D1Database,
  tenantId: string,
  propertyId?: string
): Promise<PropertyLiveContext | null> {
  // 1. Fetch Property
  let propSql = `SELECT id, name, property_code, city FROM properties WHERE tenant_id = ?`;
  const propParams: any[] = [tenantId];
  if (propertyId) {
    propSql += ` AND id = ?`;
    propParams.push(propertyId);
  }
  propSql += ` LIMIT 1`;

  const prop: any = await db.prepare(propSql).bind(...propParams).first().catch(() => null);
  if (!prop) return null;

  const targetPropertyId = prop.id;

  // Dates
  const now = new Date();
  const todayDateIso = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayDateIso = yesterday.toISOString().slice(0, 10);
  const startOfMonth = Math.floor(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).getTime() / 1000);
  const startOfToday = Math.floor(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime() / 1000);
  const startOfYesterday = startOfToday - 86400;

  // 2. Rooms by Status
  const roomsRows: any = await db.prepare(
    `SELECT status, readiness_status, COUNT(*) as count
     FROM rooms
     WHERE property_id = ? AND is_active = 1
     GROUP BY status, readiness_status`
  )
    .bind(targetPropertyId)
    .all()
    .catch(() => ({ results: [] }));

  let totalRooms = 0;
  let occupiedRooms = 0;
  let vacantRooms = 0;
  let dirtyRooms = 0;
  let cleaningRooms = 0;
  let inspectedRooms = 0;
  let readyRooms = 0;
  let outOfOrderRooms = 0;

  for (const r of (roomsRows.results || []) as any[]) {
    const c = Number(r.count || 0);
    totalRooms += c;
    if (r.status === 'occupied') occupiedRooms += c;
    else if (r.status === 'maintenance' || r.status === 'out_of_order') outOfOrderRooms += c;
    else vacantRooms += c;

    const rd = r.readiness_status || 'ready';
    if (rd === 'dirty') dirtyRooms += c;
    else if (rd === 'cleaning') cleaningRooms += c;
    else if (rd === 'inspected') inspectedRooms += c;
    else if (rd === 'ready') readyRooms += c;
  }

  const occupancyPercent = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // 3. Arrivals, Departures & In-House
  const [arrRow, depRow, inHouseRow]: any = await Promise.all([
    db.prepare(
      `SELECT COUNT(*) as count FROM reservations
       WHERE property_id = ? AND check_in_date = ? AND status IN ('confirmed', 'guaranteed')`
    ).bind(targetPropertyId, todayDateIso).first().catch(() => ({ count: 0 })),

    db.prepare(
      `SELECT COUNT(*) as count FROM reservations
       WHERE property_id = ? AND check_out_date = ? AND status = 'checked_in'`
    ).bind(targetPropertyId, todayDateIso).first().catch(() => ({ count: 0 })),

    db.prepare(
      `SELECT COUNT(*) as count, SUM(adults + children) as total_guests FROM reservations
       WHERE property_id = ? AND status = 'checked_in'`
    ).bind(targetPropertyId).first().catch(() => ({ count: 0, total_guests: 0 })),
  ]);

  const todayArrivals = Number(arrRow?.count || 0);
  const todayDepartures = Number(depRow?.count || 0);
  const inHouseGuests = Number(inHouseRow?.total_guests || inHouseRow?.count || 0);

  // 4. Financial Collections
  const [todayPayRow, yestPayRow, monthPayRow]: any = await Promise.all([
    db.prepare(
      `SELECT SUM(amount_paise) as sum FROM payments
       WHERE property_id = ? AND status = 'successful' AND created_at >= ?`
    ).bind(targetPropertyId, startOfToday).first().catch(() => ({ sum: 0 })),

    db.prepare(
      `SELECT SUM(amount_paise) as sum FROM payments
       WHERE property_id = ? AND status = 'successful' AND created_at >= ? AND created_at < ?`
    ).bind(targetPropertyId, startOfYesterday, startOfToday).first().catch(() => ({ sum: 0 })),

    db.prepare(
      `SELECT SUM(amount_paise) as sum FROM payments
       WHERE property_id = ? AND status = 'successful' AND created_at >= ?`
    ).bind(targetPropertyId, startOfMonth).first().catch(() => ({ sum: 0 })),
  ]);

  const todayCollectionPaise = Number(todayPayRow?.sum || 0);
  const yesterdayCollectionPaise = Number(yestPayRow?.sum || 0);
  const monthCollectionPaise = Number(monthPayRow?.sum || 0);

  // 5. Complaints & Housekeeping
  const [compRows, hkRow]: any = await Promise.all([
    db.prepare(
      `SELECT priority, status, COUNT(*) as count FROM complaints
       WHERE property_id = ? AND status != 'resolved' GROUP BY priority, status`
    ).bind(targetPropertyId).all().catch(() => ({ results: [] })),

    db.prepare(
      `SELECT COUNT(*) as count FROM housekeeping_tasks
       WHERE property_id = ? AND status IN ('pending', 'in_progress')`
    ).bind(targetPropertyId).first().catch(() => ({ count: 0 })),
  ]);

  let openComplaints = 0;
  let urgentComplaints = 0;
  for (const row of (compRows.results || []) as any[]) {
    const count = Number(row.count || 0);
    openComplaints += count;
    if (row.priority === 'urgent' || row.priority === 'high') {
      urgentComplaints += count;
    }
  }
  const pendingHousekeepingTasks = Number(hkRow?.count || 0);

  // 6. Linen health (below par level)
  const linenRow: any = await db.prepare(
    `SELECT COUNT(*) as count FROM linen_inventory
     WHERE property_id = ? AND in_stock_clean < par_level`
  ).bind(targetPropertyId).first().catch(() => ({ count: 0 }));
  const linenBelowParCount = Number(linenRow?.count || 0);

  // 7. Food shortages (usable stock < safety stock)
  const foodRow: any = await db.prepare(
    `SELECT COUNT(*) as count FROM food_inventory_items
     WHERE property_id = ? AND current_usable_stock < safety_stock`
  ).bind(targetPropertyId).first().catch(() => ({ count: 0 }));
  const foodShortageCount = Number(foodRow?.count || 0);

  // 8. Room Types Summary
  const roomTypesRows: any = await db.prepare(
    `SELECT name, base_price_paise FROM room_types
     WHERE property_id = ? AND is_active = 1`
  ).bind(targetPropertyId).all().catch(() => ({ results: [] }));

  const roomTypesSummary = (roomTypesRows.results || []).map((rt: any) => ({
    name: rt.name,
    basePricePaise: Number(rt.base_price_paise || 0),
    availableCount: vacantRooms,
  }));

  return {
    propertyId: targetPropertyId,
    propertyName: prop.name,
    propertyCode: prop.property_code,
    city: prop.city || 'India',
    todayDateIso,
    yesterdayDateIso,
    totalRooms,
    occupiedRooms,
    vacantRooms,
    dirtyRooms,
    cleaningRooms,
    inspectedRooms,
    readyRooms,
    outOfOrderRooms,
    occupancyPercent,
    todayArrivals,
    todayDepartures,
    inHouseGuests,
    todayCollectionPaise,
    yesterdayCollectionPaise,
    monthCollectionPaise,
    openComplaints,
    urgentComplaints,
    pendingHousekeepingTasks,
    linenBelowParCount,
    foodShortageCount,
    roomTypesSummary,
  };
}

/**
 * Generate a strict, authoritative system prompt incorporating factual property context.
 */
export function buildGroqSystemPrompt(context: PropertyLiveContext | null): string {
  if (!context) {
    return `You are HotelFlexi AI, an intelligent hotel operations and financial business assistant developed by NovaX AI for Indian hotels and resorts.
Operate with strict honesty. If information is not in your verified database, say so. Never invent room availability, rates, or financial actuals.`;
  }

  const yesterdayRs = (context.yesterdayCollectionPaise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const todayRs = (context.todayCollectionPaise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const monthRs = (context.monthCollectionPaise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return `You are HotelFlexi AI, the central business intelligence assistant developed by NovaX AI for ${context.propertyName} (${context.propertyCode}, ${context.city}).

CRITICAL VERIFIED PROPERTY METRICS AS OF TODAY (${context.todayDateIso}):
- Total Inventory: ${context.totalRooms} rooms (${context.occupiedRooms} occupied [${context.occupancyPercent}% occupancy], ${context.vacantRooms} vacant)
- Room Readiness: ${context.readyRooms} ready, ${context.inspectedRooms} inspected, ${context.cleaningRooms} cleaning, ${context.dirtyRooms} dirty, ${context.outOfOrderRooms} maintenance
- Front Desk Movements Today: ${context.todayArrivals} arrivals expected, ${context.todayDepartures} departures pending, ${context.inHouseGuests} in-house guests
- Verified Payment Collections:
  * Yesterday (${context.yesterdayDateIso}): ₹${yesterdayRs}
  * Today (${context.todayDateIso}): ₹${todayRs}
  * Month-to-date: ₹${monthRs}
- Active Operational Issues:
  * Open guest complaints: ${context.openComplaints} (${context.urgentComplaints} high priority)
  * Pending housekeeping tasks: ${context.pendingHousekeepingTasks}
  * Linen items below safety par: ${context.linenBelowParCount}
  * Food inventory items in shortage: ${context.foodShortageCount}

BEHAVIORAL RULES:
1. Always base your numbers on the verified metrics above or via server tools.
2. Clearly distinguish ACTUALS from FORECASTS or RECOMMENDATIONS.
3. Support Hindi, English, and natural Indian hospitality phrasing (Hinglish).
4. For actions (e.g. blocking rooms, updating rates, creating staff tasks), suggest or execute verified server tools with confirmation.
5. If data is not recorded or unavailable, honestly state that it is not available rather than hallucinating figures.`;
}
