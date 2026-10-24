/**
 * HotelFlexi Food Stock, Rasan & Procurement Forecasting API
 * Manages kitchen pantry inventory, recipe/consumption standards per guest,
 * forward-looking demand forecasting based on confirmed covers, and purchase orders.
 */

import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const foodProcurementRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

foodProcurementRoutes.use('*', authMiddleware, tenantMiddleware);

// -----------------------------------------------------------------------------
// 1. INVENTORY ITEMS (Stock on hand, safety stock, lead times)
// -----------------------------------------------------------------------------
foodProcurementRoutes.get('/items', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let sql = `SELECT * FROM food_inventory_items WHERE tenant_id = ?`;
  const params: any[] = [tenantId];
  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }
  sql += ` ORDER BY category ASC, item_name ASC`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ items: rows.results || [] });
});

foodProcurementRoutes.post('/items', requireRole(['owner', 'manager', 'receptionist']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  if (!body.propertyName && !body.propertyId) {
    return c.json({ error: 'propertyId is required' }, 400);
  }
  if (!body.itemName) {
    return c.json({ error: 'itemName is required' }, 400);
  }

  const id = `food_${crypto.randomUUID().slice(0, 8)}`;
  await c.env.DB.prepare(
    `INSERT INTO food_inventory_items (
      id, property_id, tenant_id, item_name, category, current_usable_stock,
      unit, safety_stock, minimum_order_quantity, supplier_lead_days,
      cost_per_unit_paise, shelf_life_days, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.propertyId,
      tenantId,
      body.itemName.trim(),
      body.category || 'staples',
      Number(body.currentUsableStock || 0),
      body.unit || 'kg',
      Number(body.safetyStock || 10),
      Number(body.minimumOrderQuantity || 5),
      Number(body.supplierLeadDays || 2),
      Math.round(Number(body.costPerUnitPaise || 0)),
      body.shelfLifeDays ? Number(body.shelfLifeDays) : null,
      now,
      now
    )
    .run();

  await recordAuditLog(c, {
    action: 'food_inventory.item_created',
    resourceType: 'food_inventory',
    resourceId: id,
    newValues: body,
  });

  return c.json({ success: true, id });
});

foodProcurementRoutes.patch('/items/:id', requireRole(['owner', 'manager', 'receptionist']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `UPDATE food_inventory_items SET
       current_usable_stock = COALESCE(?, current_usable_stock),
       safety_stock = COALESCE(?, safety_stock),
       minimum_order_quantity = COALESCE(?, minimum_order_quantity),
       supplier_lead_days = COALESCE(?, supplier_lead_days),
       cost_per_unit_paise = COALESCE(?, cost_per_unit_paise),
       updated_at = ?
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(
      body.currentUsableStock !== undefined ? Number(body.currentUsableStock) : null,
      body.safetyStock !== undefined ? Number(body.safetyStock) : null,
      body.minimumOrderQuantity !== undefined ? Number(body.minimumOrderQuantity) : null,
      body.supplierLeadDays !== undefined ? Number(body.supplierLeadDays) : null,
      body.costPerUnitPaise !== undefined ? Math.round(Number(body.costPerUnitPaise)) : null,
      now,
      id,
      tenantId
    )
    .run();

  return c.json({ success: true });
});

// -----------------------------------------------------------------------------
// 2. RECIPE & GUEST CONSUMPTION ASSUMPTIONS
// -----------------------------------------------------------------------------
foodProcurementRoutes.get('/recipes', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let sql = `
    SELECT r.*, i.item_name, i.unit, i.current_usable_stock, i.safety_stock
    FROM food_recipes_assumptions r
    JOIN food_inventory_items i ON i.id = r.item_id
    WHERE r.tenant_id = ?
  `;
  const params: any[] = [tenantId];
  if (propertyId) {
    sql += ` AND r.property_id = ?`;
    params.push(propertyId);
  }
  sql += ` ORDER BY r.standard_name ASC`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ recipes: rows.results || [] });
});

foodProcurementRoutes.post('/recipes', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  if (!body.propertyId || !body.itemId || !body.gramsPerGuest) {
    return c.json({ error: 'propertyId, itemId, and gramsPerGuest are required' }, 400);
  }

  const id = `rec_${crypto.randomUUID().slice(0, 8)}`;
  await c.env.DB.prepare(
    `INSERT INTO food_recipes_assumptions (
      id, property_id, tenant_id, item_id, standard_name, grams_per_guest, meal_type, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.propertyId,
      tenantId,
      body.itemId,
      body.standardName || 'Standard Guest Consumption',
      Number(body.gramsPerGuest),
      body.mealType || 'all',
      now,
      now
    )
    .run();

  return c.json({ success: true, id });
});

// -----------------------------------------------------------------------------
// 3. PROCUREMENT DEMAND FORECASTING (Confirmed Covers * Grams - Stock - OnOrder)
// -----------------------------------------------------------------------------
foodProcurementRoutes.get('/forecast', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const daysAhead = Math.min(30, Math.max(1, Number(c.req.query('days_ahead') || 7)));

  if (!propertyId) {
    return c.json({ error: 'property_id is required for forecast' }, 400);
  }

  const nowIso = new Date().toISOString().slice(0, 10);
  const endIso = new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);

  // 1. Calculate projected covers from confirmed bookings
  const guestRow: any = await c.env.DB.prepare(
    `SELECT SUM(adults + children) as total_guests, COUNT(*) as bookings_count
     FROM reservations
     WHERE tenant_id = ? AND property_id = ?
       AND status IN ('confirmed', 'checked_in')
       AND check_in_date < ? AND check_out_date > ?`
  )
    .bind(tenantId, propertyId, endIso, nowIso)
    .first()
    .catch(() => ({ total_guests: 0, bookings_count: 0 }));

  const estimatedGuests = Math.max(1, Number(guestRow?.total_guests || 20));
  const totalCovers = estimatedGuests * daysAhead;

  // 2. Fetch inventory items and recipe standards
  const [itemsRows, recRows, poRows]: any = await Promise.all([
    c.env.DB.prepare(
      `SELECT id, item_name, category, current_usable_stock, unit, safety_stock, minimum_order_quantity, supplier_lead_days, cost_per_unit_paise
       FROM food_inventory_items WHERE tenant_id = ? AND property_id = ?`
    ).bind(tenantId, propertyId).all().catch(() => ({ results: [] })),

    c.env.DB.prepare(
      `SELECT item_id, grams_per_guest, standard_name
       FROM food_recipes_assumptions WHERE tenant_id = ? AND property_id = ?`
    ).bind(tenantId, propertyId).all().catch(() => ({ results: [] })),

    c.env.DB.prepare(
      `SELECT items_json FROM food_purchase_orders
       WHERE tenant_id = ? AND property_id = ? AND status IN ('approved', 'ordered')`
    ).bind(tenantId, propertyId).all().catch(() => ({ results: [] })),
  ]);

  const items = (itemsRows.results || []) as any[];
  const recipes = (recRows.results || []) as any[];

  const recipeMap = new Map<string, number>();
  for (const r of recipes) {
    recipeMap.set(r.item_id, Number(r.grams_per_guest || 0));
  }

  // Parse on-order quantities from active POs
  const onOrderMap = new Map<string, number>();
  for (const po of (poRows.results || []) as any[]) {
    try {
      const parsedItems = JSON.parse(po.items_json || '[]');
      for (const pItem of parsedItems) {
        if (pItem.itemId) {
          onOrderMap.set(pItem.itemId, (onOrderMap.get(pItem.itemId) || 0) + Number(pItem.quantity || 0));
        }
      }
    } catch {}
  }

  const forecast = items.map((item) => {
    // If explicit recipe standard exists, use it; else fallback to conservative 500g default
    const gramsPerGuest = recipeMap.get(item.id) || 450;
    const requiredTotalKg = Math.round(((gramsPerGuest * totalCovers) / 1000) * 10) / 10;
    const currentStock = Number(item.current_usable_stock || 0);
    const onOrder = onOrderMap.get(item.id) || 0;
    const effectiveAvailable = currentStock + onOrder;
    const shortageKg = Math.max(0, Math.round((requiredTotalKg - effectiveAvailable) * 10) / 10);
    const belowSafetyStock = currentStock < item.safety_stock;
    const needsReorder = shortageKg > 0 || belowSafetyStock;

    // Recommended order quantity (considering minimum order quantity)
    const suggestedOrderQuantity = needsReorder
      ? Math.max(item.minimum_order_quantity, Math.ceil(shortageKg + item.safety_stock))
      : 0;

    const estimatedCostPaise = suggestedOrderQuantity * (item.cost_per_unit_paise || 0);
    const leadDays = item.supplier_lead_days || 2;
    const suggestedReorderDate = needsReorder
      ? new Date(Date.now() + Math.max(0, leadDays - 1) * 86400000).toISOString().slice(0, 10)
      : 'Stock Adequate';

    return {
      itemId: item.id,
      itemName: item.item_name,
      category: item.category,
      unit: item.unit,
      currentUsableStock: currentStock,
      onOrderQuantity: onOrder,
      safetyStock: item.safety_stock,
      gramsPerGuestAssumption: gramsPerGuest,
      forecastRequirement: requiredTotalKg,
      shortage: shortageKg,
      needsReorder,
      suggestedOrderQuantity,
      estimatedCostPaise,
      suggestedReorderDate,
    };
  });

  return c.json({
    propertyId,
    daysAhead,
    estimatedGuests,
    totalCovers,
    shortagesCount: forecast.filter((f) => f.needsReorder).length,
    forecast,
  });
});

// -----------------------------------------------------------------------------
// 4. PURCHASE ORDERS & RECEPTION
// -----------------------------------------------------------------------------
foodProcurementRoutes.get('/purchase-orders', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let sql = `SELECT * FROM food_purchase_orders WHERE tenant_id = ?`;
  const params: any[] = [tenantId];
  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }
  sql += ` ORDER BY created_at DESC LIMIT 50`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ purchaseOrders: rows.results || [] });
});

foodProcurementRoutes.post('/purchase-orders', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  if (!body.propertyId || !body.supplierName || !body.items || body.items.length === 0) {
    return c.json({ error: 'propertyId, supplierName, and items array are required' }, 400);
  }

  const poId = `po_${crypto.randomUUID().slice(0, 8)}`;
  const poNumber = `PO-${Date.now().toString().slice(-6)}`;
  const totalPaise = (body.items as any[]).reduce((sum, it) => sum + Math.round(Number(it.totalPaise || 0)), 0);

  await c.env.DB.prepare(
    `INSERT INTO food_purchase_orders (
      id, property_id, tenant_id, po_number, supplier_name, status,
      items_json, total_amount_paise, expected_delivery_date, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      poId,
      body.propertyId,
      tenantId,
      poNumber,
      body.supplierName.trim(),
      JSON.stringify(body.items),
      totalPaise,
      body.expectedDeliveryDate || null,
      user?.name || user?.email || 'Manager',
      now,
      now
    )
    .run();

  return c.json({ success: true, poId, poNumber });
});

foodProcurementRoutes.patch('/purchase-orders/:id/status', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const id = c.req.param('id');
  const body = await c.req.json();
  const newStatus = body.status; // 'approved', 'ordered', 'received', 'cancelled'
  const now = Math.floor(Date.now() / 1000);

  const po: any = await c.env.DB.prepare(
    `SELECT * FROM food_purchase_orders WHERE id = ? AND tenant_id = ?`
  )
    .bind(id, tenantId)
    .first();

  if (!po) {
    return c.json({ error: 'Purchase order not found' }, 404);
  }

  await c.env.DB.prepare(
    `UPDATE food_purchase_orders SET status = ?, approved_by = COALESCE(?, approved_by), updated_at = ?
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(newStatus, newStatus === 'approved' ? (user?.name || user?.email) : null, now, id, tenantId)
    .run();

  // If status is received, automatically increment usable inventory!
  if (newStatus === 'received' && po.status !== 'received') {
    try {
      const items = JSON.parse(po.items_json || '[]');
      for (const it of items) {
        if (it.itemId && it.quantity) {
          await c.env.DB.prepare(
            `UPDATE food_inventory_items SET current_usable_stock = current_usable_stock + ?, updated_at = ?
             WHERE id = ? AND tenant_id = ?`
          )
            .bind(Number(it.quantity), now, it.itemId, tenantId)
            .run();
        }
      }
    } catch (parseErr) {
      console.warn('Error incrementing stock from received PO:', parseErr);
    }
  }

  return c.json({ success: true, status: newStatus });
});
