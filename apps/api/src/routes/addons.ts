import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';

export const addonsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// -----------------------------------------------------------------------------
// PUBLIC ADD-ONS (For Public Booking Engine)
// -----------------------------------------------------------------------------
export const publicAddonsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

publicAddonsRoutes.get('/property/:propertyId', async (c) => {
  const propertyId = c.req.param('propertyId');

  const rows = await c.env.DB.prepare(
    `SELECT * FROM booking_addons
     WHERE property_id = ? AND is_active = 1
     ORDER BY display_order ASC, created_at ASC`
  )
    .bind(propertyId)
    .all();

  return c.json({ addons: rows.results || [] });
});

publicAddonsRoutes.get('/slug/:slug', async (c) => {
  const slug = c.req.param('slug');

  const prop: any = await c.env.DB.prepare('SELECT id FROM properties WHERE slug = ?').bind(slug).first();
  if (!prop) {
    return c.json({ addons: [] });
  }

  const rows = await c.env.DB.prepare(
    `SELECT * FROM booking_addons
     WHERE property_id = ? AND is_active = 1
     ORDER BY display_order ASC, created_at ASC`
  )
    .bind(prop.id)
    .all();

  return c.json({ addons: rows.results || [] });
});

// -----------------------------------------------------------------------------
// AUTHENTICATED ADD-ONS MANAGEMENT (Hotel Admin)
// -----------------------------------------------------------------------------
addonsRoutes.use('*', authMiddleware, tenantMiddleware);

// GET / - List all addons for tenant
addonsRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let sql = `SELECT * FROM booking_addons WHERE tenant_id = ?`;
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }

  sql += ` ORDER BY display_order ASC, created_at DESC`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ addons: rows.results || [] });
});

// POST / - Create a new add-on
addonsRoutes.post('/', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const {
    propertyId,
    name,
    description = '',
    category = 'activity',
    pricingType = 'per_person',
    pricePaise = 0,
    minQty = 1,
    maxQty = 20,
    imageUrl = null,
    displayOrder = 0,
    isActive = 1,
  } = body;

  if (!propertyId || !name) {
    return c.json({ error: 'Property ID and name are required' }, 400);
  }

  const id = `addon_${crypto.randomUUID()}`;

  await c.env.DB.prepare(
    `INSERT INTO booking_addons (
       id, tenant_id, property_id, name, description, category,
       pricing_type, price_paise, min_qty, max_qty, image_url,
       display_order, is_active, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  )
    .bind(
      id,
      tenantId,
      propertyId,
      name,
      description,
      category,
      pricingType,
      pricePaise,
      minQty,
      maxQty,
      imageUrl,
      displayOrder,
      isActive ? 1 : 0
    )
    .run();

  return c.json({ success: true, id, message: 'Add-on created successfully' });
});

// PATCH /:id - Update an add-on
addonsRoutes.patch('/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json();

  const existing: any = await c.env.DB.prepare(
    'SELECT id FROM booking_addons WHERE id = ? AND tenant_id = ?'
  )
    .bind(id, tenantId)
    .first();

  if (!existing) {
    return c.json({ error: 'Add-on not found' }, 404);
  }

  const fields: string[] = [];
  const params: any[] = [];

  const mapping: Record<string, string> = {
    name: 'name',
    description: 'description',
    category: 'category',
    pricingType: 'pricing_type',
    pricePaise: 'price_paise',
    minQty: 'min_qty',
    maxQty: 'max_qty',
    imageUrl: 'image_url',
    displayOrder: 'display_order',
    isActive: 'is_active',
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (body[key] !== undefined) {
      fields.push(`${col} = ?`);
      params.push(key === 'isActive' ? (body[key] ? 1 : 0) : body[key]);
    }
  }

  if (fields.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  fields.push(`updated_at = datetime('now')`);
  params.push(id, tenantId);

  await c.env.DB.prepare(
    `UPDATE booking_addons SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`
  )
    .bind(...params)
    .run();

  return c.json({ success: true, message: 'Add-on updated successfully' });
});

// DELETE /:id - Remove an add-on
addonsRoutes.delete('/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM booking_addons WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .run();

  return c.json({ success: true, message: 'Add-on deleted successfully' });
});
