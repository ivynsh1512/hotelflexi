/**
 * HotelFlexi Connectivity API — Deterministic Sandbox Environment Engine
 * Provides realistic, isolated synthetic testing facilities for integration partners.
 */

export interface SandboxSeedResult {
  propertyId: string;
  propertyName: string;
  roomTypes: Array<{ id: string; name: string; code: string; physicalRoomsCount: number }>;
  ratePlans: Array<{ id: string; name: string; code: string; mealPlan: string }>;
  sampleReservation: {
    externalReservationId: string;
    reservationId: string;
    guestName: string;
    checkInDate: string;
    checkOutDate: string;
    roomTypeName: string;
    totalAmountPaise: number;
  };
}

export async function seedSandboxEnvironment(
  db: D1Database,
  partnerId: string,
  tenantId: string
): Promise<SandboxSeedResult> {
  const now = Math.floor(Date.now() / 1000);
  const propertyId = `prop_sandbox_${partnerId.replace(/[^a-zA-Z0-9]/g, '').slice(-12)}`;

  // 1. Clean existing sandbox records if present
  await resetSandboxEnvironment(db, partnerId, tenantId);

  // 2. Create Synthetic Property
  await db.prepare(
    `INSERT INTO properties (
      id, tenant_id, name, code, property_type, address_line1, city, state, postal_code, country,
      phone, email, currency, time_zone, check_in_time, check_out_time, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, 'SBOX', 'hotel', '100 Sandbox Boulevard', 'Goa', 'Goa', '403001', 'India',
              '+91 88888 00000', 'sandbox@hotelflexi.test', 'INR', 'Asia/Kolkata', '14:00', '11:00', 1, ?, ?)`
  )
    .bind(propertyId, tenantId, 'HotelFlexi Sandbox Luxury Resort', now, now)
    .run();

  // 3. Authorize Partner for this Sandbox Property
  await db.prepare(
    `INSERT INTO connectivity_partner_properties (id, partner_id, tenant_id, property_id, created_at)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(`cpp_${crypto.randomUUID()}`, partnerId, tenantId, propertyId, now)
    .run();

  // 4. Create Room Types
  const rtDeluxeId = `rt_sbox_deluxe_${partnerId.slice(-6)}`;
  const rtSuiteId = `rt_sbox_suite_${partnerId.slice(-6)}`;
  const rtStandardId = `rt_sbox_std_${partnerId.slice(-6)}`;

  const roomTypeDefs = [
    { id: rtDeluxeId, name: 'Deluxe Ocean View King', code: 'DOK', basePrice: 450000, maxOcc: 3, baseOcc: 2 },
    { id: rtSuiteId, name: 'Executive Presidential Suite', code: 'EPS', basePrice: 850000, maxOcc: 4, baseOcc: 2 },
    { id: rtStandardId, name: 'Standard Twin Room', code: 'STR', basePrice: 300000, maxOcc: 2, baseOcc: 2 },
  ];

  for (const rt of roomTypeDefs) {
    await db.prepare(
      `INSERT INTO room_types (
        id, property_id, tenant_id, name, code, base_occupancy, max_occupancy,
        base_price_paise, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    )
      .bind(rt.id, propertyId, tenantId, rt.name, rt.code, rt.baseOcc, rt.maxOcc, rt.basePrice, now, now)
      .run();
  }

  // 5. Create Physical Rooms (Total 6 units)
  const roomDefs = [
    { id: `r_sbox_101_${partnerId.slice(-4)}`, num: '101', rtId: rtDeluxeId, floor: '1' },
    { id: `r_sbox_102_${partnerId.slice(-4)}`, num: '102', rtId: rtDeluxeId, floor: '1' },
    { id: `r_sbox_201_${partnerId.slice(-4)}`, num: '201', rtId: rtSuiteId, floor: '2' },
    { id: `r_sbox_202_${partnerId.slice(-4)}`, num: '202', rtId: rtSuiteId, floor: '2' },
    { id: `r_sbox_301_${partnerId.slice(-4)}`, num: '301', rtId: rtStandardId, floor: '3' },
    { id: `r_sbox_302_${partnerId.slice(-4)}`, num: '302', rtId: rtStandardId, floor: '3' },
  ];

  for (const r of roomDefs) {
    await db.prepare(
      `INSERT INTO rooms (
        id, property_id, tenant_id, room_type_id, room_number, floor, status, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'available', 1, ?, ?)`
    )
      .bind(r.id, propertyId, tenantId, r.rtId, r.num, r.floor, now, now)
      .run();
  }

  // 6. Create Rate Plans
  const rpEpId = `rp_sbox_ep_${partnerId.slice(-6)}`;
  const rpCpId = `rp_sbox_cp_${partnerId.slice(-6)}`;
  const rpMapId = `rp_sbox_map_${partnerId.slice(-6)}`;

  const ratePlanDefs = [
    { id: rpEpId, name: 'European Plan (Room Only)', code: 'EP', meal: 'EP', multiplier: 100 },
    { id: rpCpId, name: 'Continental Plan (Bed & Breakfast)', code: 'CP', meal: 'CP', multiplier: 115 },
    { id: rpMapId, name: 'Modified American Plan (Half Board)', code: 'MAP', meal: 'MAP', multiplier: 130 },
  ];

  for (const rp of ratePlanDefs) {
    await db.prepare(
      `INSERT INTO rate_plans (
        id, property_id, tenant_id, room_type_id, name, code, meal_plan,
        price_multiplier, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 1, ?, ?)`
    )
      .bind(rp.id, propertyId, tenantId, rp.name, rp.code, rp.meal, rp.multiplier, now, now)
      .run();
  }

  // 7. Seed Sample Confirmed Reservation for Lifecycle Testing
  const sampleResId = `res_sbox_${partnerId.slice(-8)}`;
  const sampleExtId = `CHX-SANDBOX-${Math.floor(1000 + Math.random() * 9000)}`;

  // Default stay: starting tomorrow for 2 nights
  const tomorrow = new Date(Date.now() + 86400 * 1000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 86400 * 3000).toISOString().split('T')[0];

  await db.prepare(
    `INSERT INTO reservations (
      id, property_id, tenant_id, reservation_number, room_id, room_type_id, rate_plan_id,
      check_in_date, check_out_date, adults, children, nightly_rate_paise, total_room_charge_paise,
      total_tax_paise, total_discount_paise, total_amount_paise, paid_amount_paise, balance_amount_paise,
      status, source, external_reference_id, created_at, updated_at
    ) VALUES (?, ?, ?, 'SBOX-RES-001', ?, ?, ?, ?, ?, 2, 0, 450000, 900000, 108000, 0, 1008000, 1008000, 0,
              'confirmed', 'channellyx', ?, ?, ?)`
  )
    .bind(
      sampleResId,
      propertyId,
      tenantId,
      roomDefs[0].id,
      rtDeluxeId,
      rpEpId,
      tomorrow,
      dayAfter,
      sampleExtId,
      now,
      now
    )
    .run();

  await db.prepare(
    `INSERT INTO reservation_guests (
      id, reservation_id, tenant_id, full_name, email, phone, is_primary, created_at, updated_at
    ) VALUES (?, ?, ?, 'Dev Sandbox Guest', 'tester@channellyx.test', '+919999900000', 1, ?, ?)`
  )
    .bind(`rg_${crypto.randomUUID()}`, sampleResId, tenantId, now, now)
    .run();

  return {
    propertyId,
    propertyName: 'HotelFlexi Sandbox Luxury Resort',
    roomTypes: [
      { id: rtDeluxeId, name: 'Deluxe Ocean View King', code: 'DOK', physicalRoomsCount: 2 },
      { id: rtSuiteId, name: 'Executive Presidential Suite', code: 'EPS', physicalRoomsCount: 2 },
      { id: rtStandardId, name: 'Standard Twin Room', code: 'STR', physicalRoomsCount: 2 },
    ],
    ratePlans: [
      { id: rpEpId, name: 'European Plan (Room Only)', code: 'EP', mealPlan: 'EP' },
      { id: rpCpId, name: 'Continental Plan (Bed & Breakfast)', code: 'CP', mealPlan: 'CP' },
      { id: rpMapId, name: 'Modified American Plan (Half Board)', code: 'MAP', mealPlan: 'MAP' },
    ],
    sampleReservation: {
      externalReservationId: sampleExtId,
      reservationId: sampleResId,
      guestName: 'Dev Sandbox Guest',
      checkInDate: tomorrow,
      checkOutDate: dayAfter,
      roomTypeName: 'Deluxe Ocean View King',
      totalAmountPaise: 1008000,
    },
  };
}

export async function resetSandboxEnvironment(
  db: D1Database,
  partnerId: string,
  tenantId: string
): Promise<{ success: boolean; propertyId: string }> {
  const propertyId = `prop_sandbox_${partnerId.replace(/[^a-zA-Z0-9]/g, '').slice(-12)}`;

  // Delete all reservations, rooms, rate plans, room types belonging to this synthetic property
  await db.prepare(`DELETE FROM reservation_guests WHERE tenant_id = ? AND reservation_id IN (SELECT id FROM reservations WHERE property_id = ?)`).bind(tenantId, propertyId).run();
  await db.prepare(`DELETE FROM reservations WHERE property_id = ? AND tenant_id = ?`).bind(propertyId, tenantId).run();
  await db.prepare(`DELETE FROM daily_restrictions WHERE property_id = ? AND tenant_id = ?`).bind(propertyId, tenantId).run();
  await db.prepare(`DELETE FROM daily_rate_plan_prices WHERE property_id = ? AND tenant_id = ?`).bind(propertyId, tenantId).run();
  await db.prepare(`DELETE FROM rooms WHERE property_id = ? AND tenant_id = ?`).bind(propertyId, tenantId).run();
  await db.prepare(`DELETE FROM rate_plans WHERE property_id = ? AND tenant_id = ?`).bind(propertyId, tenantId).run();
  await db.prepare(`DELETE FROM room_types WHERE property_id = ? AND tenant_id = ?`).bind(propertyId, tenantId).run();
  await db.prepare(`DELETE FROM connectivity_partner_properties WHERE partner_id = ? AND property_id = ?`).bind(partnerId, propertyId).run();
  await db.prepare(`DELETE FROM properties WHERE id = ? AND tenant_id = ?`).bind(propertyId, tenantId).run();

  return { success: true, propertyId };
}
