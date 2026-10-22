import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware } from '../auth/middleware';
import { requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const laundryRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

laundryRoutes.use('*', authMiddleware, tenantMiddleware);

const DEFAULT_LINEN_ITEMS = [
  { item_name: 'King Bedsheet', category: 'bedding', total_stock: 40, in_rooms: 20, in_stock_clean: 15, in_laundry: 5, par_level: 10 },
  { item_name: 'Single Bedsheet', category: 'bedding', total_stock: 30, in_rooms: 15, in_stock_clean: 10, in_laundry: 5, par_level: 8 },
  { item_name: 'Pillow Cover', category: 'bedding', total_stock: 80, in_rooms: 40, in_stock_clean: 30, in_laundry: 10, par_level: 20 },
  { item_name: 'Bath Towel', category: 'towel', total_stock: 50, in_rooms: 25, in_stock_clean: 20, in_laundry: 5, par_level: 15 },
  { item_name: 'Hand Towel', category: 'towel', total_stock: 40, in_rooms: 20, in_stock_clean: 15, in_laundry: 5, par_level: 10 },
  { item_name: 'Duvet Cover', category: 'bedding', total_stock: 25, in_rooms: 15, in_stock_clean: 8, in_laundry: 2, par_level: 6 },
];

// GET Linen Inventory
laundryRoutes.get('/inventory', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  if (!propertyId) {
    return c.json({ error: 'Property ID is required' }, 400);
  }

  let rows = await c.env.DB.prepare(
    `SELECT * FROM linen_inventory WHERE property_id = ? AND tenant_id = ? ORDER BY category ASC, item_name ASC`
  )
    .bind(propertyId, tenantId)
    .all();

  // Auto-seed defaults if brand new property
  if (!rows.results || rows.results.length === 0) {
    const now = Math.floor(Date.now() / 1000);
    const insertStmts = DEFAULT_LINEN_ITEMS.map((item) => {
      const id = `lin_${crypto.randomUUID()}`;
      return c.env.DB.prepare(
        `INSERT INTO linen_inventory (
          id, property_id, tenant_id, item_name, category,
          total_stock, in_rooms, in_stock_clean, in_laundry, discarded,
          par_level, unit, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'pcs', ?, ?)`
      ).bind(
        id,
        propertyId,
        tenantId,
        item.item_name,
        item.category,
        item.total_stock,
        item.in_rooms,
        item.in_stock_clean,
        item.in_laundry,
        item.par_level,
        now,
        now
      );
    });

    await c.env.DB.batch(insertStmts);

    rows = await c.env.DB.prepare(
      `SELECT * FROM linen_inventory WHERE property_id = ? AND tenant_id = ? ORDER BY category ASC, item_name ASC`
    )
      .bind(propertyId, tenantId)
      .all();
  }

  const items = rows.results || [];
  const totalStock = items.reduce((sum: number, it: any) => sum + (it.total_stock || 0), 0);
  const inRooms = items.reduce((sum: number, it: any) => sum + (it.in_rooms || 0), 0);
  const inCleanStock = items.reduce((sum: number, it: any) => sum + (it.in_stock_clean || 0), 0);
  const inLaundry = items.reduce((sum: number, it: any) => sum + (it.in_laundry || 0), 0);

  return c.json({
    items,
    summary: {
      totalStock,
      inRooms,
      inCleanStock,
      inLaundry,
    },
  });
});

// CREATE Linen Item
laundryRoutes.post('/inventory', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const {
    propertyId,
    itemName,
    category = 'bedding',
    totalStock = 0,
    inStockClean = 0,
    inRooms = 0,
    inLaundry = 0,
    parLevel = 5,
    unit = 'pcs',
  } = body;

  if (!propertyId || !itemName?.trim()) {
    return c.json({ error: 'Property ID and Item Name are required' }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const id = `lin_${crypto.randomUUID()}`;

  await c.env.DB.prepare(
    `INSERT INTO linen_inventory (
      id, property_id, tenant_id, item_name, category,
      total_stock, in_rooms, in_stock_clean, in_laundry, discarded,
      par_level, unit, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
  )
    .bind(
      id,
      propertyId,
      tenantId,
      itemName.trim(),
      category,
      Number(totalStock),
      Number(inRooms),
      Number(inStockClean),
      Number(inLaundry),
      Number(parLevel),
      unit,
      now,
      now
    )
    .run();

  return c.json({ success: true, id, message: `Linen item '${itemName}' added to inventory.` });
});

// UPDATE / ADJUST Linen Item
laundryRoutes.patch('/inventory/:id', requireRole(['owner', 'manager', 'receptionist']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const existing: any = await c.env.DB.prepare(
    `SELECT * FROM linen_inventory WHERE id = ? AND tenant_id = ?`
  ).bind(id, tenantId).first();

  if (!existing) {
    return c.json({ error: 'Item not found' }, 404);
  }

  const totalStock = body.totalStock !== undefined ? Number(body.totalStock) : existing.total_stock;
  const inRooms = body.inRooms !== undefined ? Number(body.inRooms) : existing.in_rooms;
  const inStockClean = body.inStockClean !== undefined ? Number(body.inStockClean) : existing.in_stock_clean;
  const inLaundry = body.inLaundry !== undefined ? Number(body.inLaundry) : existing.in_laundry;
  const discarded = body.discarded !== undefined ? Number(body.discarded) : existing.discarded;
  const parLevel = body.parLevel !== undefined ? Number(body.parLevel) : existing.par_level;

  await c.env.DB.prepare(
    `UPDATE linen_inventory
     SET total_stock = ?, in_rooms = ?, in_stock_clean = ?, in_laundry = ?, discarded = ?, par_level = ?, updated_at = ?
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(totalStock, inRooms, inStockClean, inLaundry, discarded, parLevel, now, id, tenantId)
    .run();

  if (body.reason) {
    const transId = `ltx_${crypto.randomUUID()}`;
    await c.env.DB.prepare(
      `INSERT INTO laundry_transactions (
        id, property_id, tenant_id, action_type, items_summary, total_items, notes, created_at
      ) VALUES (?, ?, ?, 'stock_adjust', ?, 0, ?, ?)`
    )
      .bind(
        transId,
        existing.property_id,
        tenantId,
        `${existing.item_name} adjusted`,
        body.reason,
        now
      )
      .run();
  }

  return c.json({ success: true, message: 'Linen inventory updated.' });
});

// DISPATCH BATCH TO LAUNDRY VENDOR
laundryRoutes.post('/send', requireRole(['owner', 'manager', 'receptionist', 'housekeeping']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const { propertyId, items, vendorName = 'In-House / External Vendor', notes = '' } = body;

  if (!propertyId || !Array.isArray(items) || items.length === 0) {
    return c.json({ error: 'Valid propertyId and items array required' }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const stmts: any[] = [];
  const summaries: string[] = [];
  let totalQty = 0;

  for (const item of items) {
    const qty = Number(item.quantity || 0);
    if (qty <= 0) continue;

    stmts.push(
      c.env.DB.prepare(
        `UPDATE linen_inventory
         SET in_laundry = in_laundry + ?,
             in_stock_clean = MAX(0, in_stock_clean - ?),
             updated_at = ?
         WHERE id = ? AND tenant_id = ?`
      ).bind(qty, qty, now, item.id, tenantId)
    );

    summaries.push(`${item.name || 'Item'} (${qty} pcs)`);
    totalQty += qty;
  }

  if (stmts.length === 0) {
    return c.json({ error: 'No quantities specified to send' }, 400);
  }

  const transId = `ltx_${crypto.randomUUID()}`;
  stmts.push(
    c.env.DB.prepare(
      `INSERT INTO laundry_transactions (
        id, property_id, tenant_id, action_type, items_summary, total_items, vendor_name, notes, created_at
      ) VALUES (?, ?, ?, 'vendor_sent', ?, ?, ?, ?, ?)`
    ).bind(
      transId,
      propertyId,
      tenantId,
      summaries.join(', '),
      totalQty,
      vendorName,
      notes,
      now
    )
  );

  await c.env.DB.batch(stmts);

  return c.json({
    success: true,
    message: `Dispatched ${totalQty} linen pieces to ${vendorName}.`,
    transactionId: transId,
  });
});

// RECEIVE CLEAN BATCH FROM LAUNDRY VENDOR
laundryRoutes.post('/receive', requireRole(['owner', 'manager', 'receptionist', 'housekeeping']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const { propertyId, items, vendorName = 'In-House / External Vendor', notes = '' } = body;

  if (!propertyId || !Array.isArray(items) || items.length === 0) {
    return c.json({ error: 'Valid propertyId and items array required' }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const stmts: any[] = [];
  const summaries: string[] = [];
  let totalQty = 0;

  for (const item of items) {
    const qty = Number(item.quantity || 0);
    if (qty <= 0) continue;

    stmts.push(
      c.env.DB.prepare(
        `UPDATE linen_inventory
         SET in_laundry = MAX(0, in_laundry - ?),
             in_stock_clean = in_stock_clean + ?,
             updated_at = ?
         WHERE id = ? AND tenant_id = ?`
      ).bind(qty, qty, now, item.id, tenantId)
    );

    summaries.push(`${item.name || 'Item'} (${qty} pcs)`);
    totalQty += qty;
  }

  if (stmts.length === 0) {
    return c.json({ error: 'No quantities specified to receive' }, 400);
  }

  const transId = `ltx_${crypto.randomUUID()}`;
  stmts.push(
    c.env.DB.prepare(
      `INSERT INTO laundry_transactions (
        id, property_id, tenant_id, action_type, items_summary, total_items, vendor_name, notes, created_at
      ) VALUES (?, ?, ?, 'vendor_received', ?, ?, ?, ?, ?)`
    ).bind(
      transId,
      propertyId,
      tenantId,
      summaries.join(', '),
      totalQty,
      vendorName,
      notes,
      now
    )
  );

  await c.env.DB.batch(stmts);

  return c.json({
    success: true,
    message: `Received ${totalQty} clean linen pieces back into stock.`,
    transactionId: transId,
  });
});

// GET LAUNDRY TRANSACTIONS / AUDIT LOG
laundryRoutes.get('/transactions', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  if (!propertyId) {
    return c.json({ error: 'Property ID is required' }, 400);
  }

  const rows = await c.env.DB.prepare(
    `SELECT * FROM laundry_transactions
     WHERE property_id = ? AND tenant_id = ?
     ORDER BY created_at DESC
     LIMIT 50`
  )
    .bind(propertyId, tenantId)
    .all();

  return c.json({ transactions: rows.results || [] });
});
