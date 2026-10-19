import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';

export const diningRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// -----------------------------------------------------------------------------
// PUBLIC DINE-OUT ENDPOINTS (For outside resort guests & public diners)
// -----------------------------------------------------------------------------

// Fetch restaurant details & menu by 5-digit hotel code or property slug
diningRoutes.get('/public/:codeOrSlug', async (c) => {
  const codeOrSlug = c.req.param('codeOrSlug');

  // Find property by hotel_code or slug
  const property: any = await c.env.DB.prepare(
    `SELECT id, tenant_id, name, slug, hotel_code, address_line1, city, state, phone, email
     FROM properties
     WHERE hotel_code = ? OR slug = ?`
  )
    .bind(codeOrSlug, codeOrSlug)
    .first();

  if (!property) {
    return c.json({ error: 'Property not found' }, 404);
  }

  // Find restaurant
  let restaurant: any = await c.env.DB.prepare(
    `SELECT * FROM property_restaurants WHERE property_id = ? AND is_active = 1`
  )
    .bind(property.id)
    .first();

  if (!restaurant) {
    // Default virtual restaurant for the resort
    restaurant = {
      id: `rest_${property.id}`,
      property_id: property.id,
      tenant_id: property.tenant_id,
      name: `${property.name} Dining & Restaurant`,
      description: `Experience gourmet dining, authentic regional flavors, and exquisite ambiance at ${property.name}. Open for outside guests and resident guests alike.`,
      cuisine_type: 'Multi-Cuisine, North Indian, Tandoor & Continental',
      is_pure_veg: 0,
      open_time: '07:00',
      close_time: '23:00',
      meal_slots: JSON.stringify([
        { label: 'Breakfast', time: '07:30 - 10:30' },
        { label: 'Lunch', time: '12:30 - 15:30' },
        { label: 'High Tea', time: '16:30 - 18:30' },
        { label: 'Dinner', time: '19:30 - 23:00' },
      ]),
      seating_capacity: 50,
      allow_outside_guests: 1,
      is_active: 1,
    };
  }

  // Fetch menu items
  const menuRows = await c.env.DB.prepare(
    `SELECT * FROM restaurant_menu_items WHERE restaurant_id = ? AND is_available = 1 ORDER BY category, name ASC`
  )
    .bind(restaurant.id)
    .all();

  const menu = menuRows.results || [];

  // Check if ALL menu items are vegetarian -> automatic Pure Veg indicator
  const hasDishes = menu.length > 0;
  const allDishesVeg = hasDishes && menu.every((item: any) => item.is_veg === 1);
  const isPureVeg = restaurant.is_pure_veg === 1 || allDishesVeg;

  return c.json({
    property: {
      id: property.id,
      name: property.name,
      slug: property.slug,
      hotel_code: property.hotel_code || '10001',
      city: property.city,
      state: property.state,
      address: property.address_line1,
    },
    restaurant: {
      ...restaurant,
      is_pure_veg: isPureVeg ? 1 : 0,
      meal_slots: typeof restaurant.meal_slots === 'string' ? JSON.parse(restaurant.meal_slots) : restaurant.meal_slots,
    },
    menu,
  });
});

// Book Dine-Out table / meal
diningRoutes.post('/public/:codeOrSlug/book', async (c) => {
  const codeOrSlug = c.req.param('codeOrSlug');
  const body = await c.req.json().catch(() => ({}));

  const property: any = await c.env.DB.prepare(
    `SELECT id, tenant_id, name, hotel_code FROM properties WHERE hotel_code = ? OR slug = ?`
  )
    .bind(codeOrSlug, codeOrSlug)
    .first();

  if (!property) {
    return c.json({ error: 'Property not found' }, 404);
  }

  let restaurant: any = await c.env.DB.prepare(
    `SELECT id FROM property_restaurants WHERE property_id = ? AND is_active = 1`
  )
    .bind(property.id)
    .first();

  const restaurantId = restaurant?.id || `rest_${property.id}`;
  const now = Math.floor(Date.now() / 1000);
  const bookingId = `dine_${crypto.randomUUID()}`;
  const random5 = Math.floor(10000 + Math.random() * 90000);
  const bookingNumber = `DINE-${random5}`;

  const guestName = (body.guest_name || body.name || '').trim();
  const guestEmail = (body.guest_email || body.email || '').trim();
  const guestPhone = (body.guest_phone || body.phone || '').trim();
  const bookingDate = body.booking_date || new Date().toISOString().split('T')[0];
  const bookingTime = body.booking_time || '19:30';
  const guestsCount = Number(body.guests_count || 2);
  const residingHotelName = (body.residing_hotel_name || body.other_resort || '').trim();
  const isInhouse = body.is_inhouse_guest ? 1 : 0;
  const specialRequests = body.special_requests || '';
  const preorderedItems = Array.isArray(body.preordered_items) ? JSON.stringify(body.preordered_items) : '[]';
  const totalPaise = Number(body.total_paise || 0);
  const paymentMethod = body.payment_method === 'pay_online' ? 'pay_online' : 'pay_at_restaurant';
  const paymentStatus = paymentMethod === 'pay_online' ? 'paid' : 'pending';

  if (!guestName || !guestPhone) {
    return c.json({ error: 'Guest name and phone number are required' }, 400);
  }

  // Insert dine-out booking
  await c.env.DB.prepare(
    `INSERT INTO dine_out_bookings (
      id, booking_number, property_id, restaurant_id, tenant_id,
      guest_name, guest_email, guest_phone, is_inhouse_guest,
      residing_hotel_name, booking_date, booking_time, guests_count,
      special_requests, preordered_items_json, total_paise,
      payment_method, payment_status, booking_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`
  )
    .bind(
      bookingId,
      bookingNumber,
      property.id,
      restaurantId,
      property.tenant_id,
      guestName,
      guestEmail,
      guestPhone,
      isInhouse,
      residingHotelName || null,
      bookingDate,
      bookingTime,
      guestsCount,
      specialRequests,
      preorderedItems,
      totalPaise,
      paymentMethod,
      paymentStatus,
      now,
      now
    )
    .run();

  // Send real-time notification to staff and property owner
  const notificationId = `notif_${crypto.randomUUID()}`;
  const originDesc = isInhouse ? 'In-House Guest' : residingHotelName ? `Guest staying at ${residingHotelName}` : 'Outside Dine-Out Guest';
  const notifMsg = `🍽️ Table booked for ${guestsCount} guests on ${bookingDate} at ${bookingTime} by ${guestName} (${guestPhone}). Origin: ${originDesc}. Payment: ${paymentMethod === 'pay_online' ? 'Paid Online' : 'Pay at Counter'}.`;

  await c.env.DB.prepare(
    `INSERT INTO notifications (id, tenant_id, title, message, category, link_url, is_read, created_at)
     VALUES (?, ?, ?, ?, 'dining', '/app/dining', 0, ?)`
  )
    .bind(notificationId, property.tenant_id, `New Dine-Out Booking: ${bookingNumber}`, notifMsg, now)
    .run();

  return c.json({
    success: true,
    booking_number: bookingNumber,
    booking: {
      id: bookingId,
      booking_number: bookingNumber,
      guest_name: guestName,
      booking_date: bookingDate,
      booking_time: bookingTime,
      guests_count: guestsCount,
      hotel_name: property.name,
      hotel_code: property.hotel_code,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
    },
  });
});

// -----------------------------------------------------------------------------
// PROTECTED RESTAURANT & MENU MANAGEMENT (For Property Admin / Staff)
// -----------------------------------------------------------------------------

// Require authentication and tenant context for private operational routes
const protectedRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();
protectedRoutes.use('*', authMiddleware, tenantMiddleware);

// Get current restaurant profile
protectedRoutes.get('/restaurant', async (c) => {
  const propertyId = c.get('propertyId');
  const tenantId = c.get('tenantId')!;

  const restaurant: any = await c.env.DB.prepare(
    `SELECT * FROM property_restaurants WHERE (property_id = ? OR tenant_id = ?) AND is_active = 1`
  )
    .bind(propertyId || '', tenantId)
    .first();

  if (!restaurant) {
    return c.json({ restaurant: null });
  }

  return c.json({
    restaurant: {
      ...restaurant,
      meal_slots: typeof restaurant.meal_slots === 'string' ? JSON.parse(restaurant.meal_slots) : restaurant.meal_slots,
    },
  });
});

// Upsert restaurant profile
protectedRoutes.post('/restaurant', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.get('propertyId') || c.req.header('x-property-id');
  const body = await c.req.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);

  if (!propertyId) {
    return c.json({ error: 'Property ID required' }, 400);
  }

  const existing: any = await c.env.DB.prepare(
    `SELECT id FROM property_restaurants WHERE property_id = ?`
  )
    .bind(propertyId)
    .first();

  const slotsStr = Array.isArray(body.meal_slots) ? JSON.stringify(body.meal_slots) : body.meal_slots || null;

  if (existing) {
    await c.env.DB.prepare(
      `UPDATE property_restaurants SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         cuisine_type = COALESCE(?, cuisine_type),
         is_pure_veg = COALESCE(?, is_pure_veg),
         open_time = COALESCE(?, open_time),
         close_time = COALESCE(?, close_time),
         meal_slots = COALESCE(?, meal_slots),
         seating_capacity = COALESCE(?, seating_capacity),
         allow_outside_guests = COALESCE(?, allow_outside_guests),
         updated_at = ?
       WHERE id = ?`
    )
      .bind(
        body.name || null,
        body.description || null,
        body.cuisine_type || null,
        body.is_pure_veg !== undefined ? (body.is_pure_veg ? 1 : 0) : null,
        body.open_time || null,
        body.close_time || null,
        slotsStr,
        body.seating_capacity ?? null,
        body.allow_outside_guests !== undefined ? (body.allow_outside_guests ? 1 : 0) : null,
        now,
        existing.id
      )
      .run();

    return c.json({ success: true, id: existing.id, updated: true });
  } else {
    const newId = `rest_${crypto.randomUUID()}`;
    await c.env.DB.prepare(
      `INSERT INTO property_restaurants (
        id, property_id, tenant_id, name, description, cuisine_type,
        is_pure_veg, open_time, close_time, meal_slots, seating_capacity,
        allow_outside_guests, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    )
      .bind(
        newId,
        propertyId,
        tenantId,
        body.name || 'Resort Fine Dining',
        body.description || '',
        body.cuisine_type || 'Multi-Cuisine',
        body.is_pure_veg ? 1 : 0,
        body.open_time || '07:00',
        body.close_time || '23:00',
        slotsStr,
        body.seating_capacity || 40,
        body.allow_outside_guests !== undefined ? (body.allow_outside_guests ? 1 : 0) : 1,
        now,
        now
      )
      .run();

    return c.json({ success: true, id: newId, created: true });
  }
});

// List menu items
protectedRoutes.get('/menu', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.get('propertyId');

  const restaurant: any = await c.env.DB.prepare(
    `SELECT id, is_pure_veg FROM property_restaurants WHERE (property_id = ? OR tenant_id = ?) AND is_active = 1`
  )
    .bind(propertyId || '', tenantId)
    .first();

  if (!restaurant) {
    return c.json({ menu: [], is_pure_veg: 0 });
  }

  const rows = await c.env.DB.prepare(
    `SELECT * FROM restaurant_menu_items WHERE restaurant_id = ? ORDER BY category, name ASC`
  )
    .bind(restaurant.id)
    .all();

  const items = rows.results || [];
  const allVeg = items.length > 0 && items.every((i: any) => i.is_veg === 1);

  return c.json({
    menu: items,
    is_pure_veg: restaurant.is_pure_veg === 1 || allVeg ? 1 : 0,
  });
});

// Add menu item
protectedRoutes.post('/menu', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.get('propertyId');
  const body = await c.req.json().catch(() => ({}));

  let restaurant: any = await c.env.DB.prepare(
    `SELECT id FROM property_restaurants WHERE (property_id = ? OR tenant_id = ?) AND is_active = 1`
  )
    .bind(propertyId || '', tenantId)
    .first();

  if (!restaurant) {
    // Auto-create restaurant shell if not existing
    const newRestId = `rest_${crypto.randomUUID()}`;
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.prepare(
      `INSERT INTO property_restaurants (
        id, property_id, tenant_id, name, cuisine_type, is_pure_veg, open_time, close_time, seating_capacity, allow_outside_guests, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, 'Resort Restaurant', 'Multi-Cuisine', 0, '07:00', '23:00', 40, 1, 1, ?, ?)`
    )
      .bind(newRestId, propertyId || tenantId, tenantId, now, now)
      .run();
    restaurant = { id: newRestId };
  }

  const itemId = `menu_${crypto.randomUUID()}`;
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `INSERT INTO restaurant_menu_items (
      id, restaurant_id, tenant_id, name, category, price_paise, is_veg, is_available, description, image_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      itemId,
      restaurant.id,
      tenantId,
      body.name,
      body.category || 'Main Course',
      Number(body.price_paise || 25000),
      body.is_veg !== undefined ? (body.is_veg ? 1 : 0) : 1,
      body.is_available !== undefined ? (body.is_available ? 1 : 0) : 1,
      body.description || null,
      body.image_url || null,
      now
    )
    .run();

  return c.json({ success: true, id: itemId });
});

// Delete menu item
protectedRoutes.delete('/menu/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');

  await c.env.DB.prepare(
    `DELETE FROM restaurant_menu_items WHERE id = ? AND tenant_id = ?`
  )
    .bind(id, tenantId)
    .run();

  return c.json({ success: true });
});

// List Dine-Out bookings
protectedRoutes.get('/bookings', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.get('propertyId');

  const rows = await c.env.DB.prepare(
    `SELECT d.*, p.name as hotel_name, p.hotel_code
     FROM dine_out_bookings d
     JOIN properties p ON p.id = d.property_id
     WHERE (d.property_id = ? OR d.tenant_id = ?)
     ORDER BY d.booking_date DESC, d.booking_time DESC`
  )
    .bind(propertyId || '', tenantId)
    .all();

  return c.json({ bookings: rows.results || [] });
});

// Update booking status
protectedRoutes.patch('/bookings/:id/status', async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const status = body.status; // 'confirmed', 'seated', 'completed', 'cancelled'
  const paymentStatus = body.payment_status;
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `UPDATE dine_out_bookings SET
       booking_status = COALESCE(?, booking_status),
       payment_status = COALESCE(?, payment_status),
       updated_at = ?
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(status || null, paymentStatus || null, now, id, tenantId)
    .run();

  return c.json({ success: true });
});

diningRoutes.route('/', protectedRoutes);
