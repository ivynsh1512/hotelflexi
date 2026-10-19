import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';

export const couponRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// -----------------------------------------------------------------------------
// PUBLIC COUPON VALIDATION (Used by Booking Engine & Walk-in forms)
// -----------------------------------------------------------------------------
couponRoutes.post('/validate', async (c) => {
  const body = await c.req.json();
  const { propertyId, code, totalAmountPaise = 0, checkInDate } = body;

  if (!propertyId || !code) {
    return c.json({ valid: false, error: 'Property ID and Coupon Code are required' }, 400);
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const today = checkInDate || new Date().toISOString().split('T')[0];

  const coupon: any = await c.env.DB.prepare(
    `SELECT * FROM coupons
     WHERE property_id = ? AND UPPER(code) = ? AND is_active = 1`
  )
    .bind(propertyId, normalizedCode)
    .first();

  if (!coupon) {
    return c.json({ valid: false, error: `Coupon code '${normalizedCode}' is invalid or expired.` }, 404);
  }

  if (coupon.valid_from && coupon.valid_from > today) {
    return c.json({ valid: false, error: `Coupon is valid from ${coupon.valid_from}.` }, 400);
  }

  if (coupon.valid_to && coupon.valid_to < today) {
    return c.json({ valid: false, error: `Coupon expired on ${coupon.valid_to}.` }, 400);
  }

  if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
    return c.json({ valid: false, error: 'Coupon usage limit has been reached.' }, 400);
  }

  if (coupon.min_booking_amount_paise && totalAmountPaise < coupon.min_booking_amount_paise) {
    const minRupees = coupon.min_booking_amount_paise / 100;
    return c.json({
      valid: false,
      error: `Minimum booking total of ₹${minRupees.toLocaleString('en-IN')} required for this coupon.`
    }, 400);
  }

  let discountPaise = 0;
  if (coupon.discount_type === 'percentage') {
    discountPaise = Math.round((totalAmountPaise * coupon.discount_value) / 100);
    if (coupon.max_discount_paise && discountPaise > coupon.max_discount_paise) {
      discountPaise = coupon.max_discount_paise;
    }
  } else {
    discountPaise = Math.min(totalAmountPaise, coupon.discount_value);
  }

  return c.json({
    valid: true,
    code: coupon.code,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    discountPaise,
    message: `Promo applied: Save ₹${(discountPaise / 100).toLocaleString('en-IN')}!`,
  });
});

// -----------------------------------------------------------------------------
// AUTHENTICATED MANAGEMENT ROUTES (Property Admins & Managers)
// -----------------------------------------------------------------------------
const authCoupons = new Hono<{ Bindings: Env; Variables: AppVariables }>();
authCoupons.use('*', authMiddleware, tenantMiddleware);

// LIST COUPONS
authCoupons.get('/', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let sql = 'SELECT * FROM coupons WHERE tenant_id = ?';
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ' AND property_id = ?';
    params.push(propertyId);
  }

  sql += ' ORDER BY created_at DESC';

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ coupons: rows.results || [] });
});

// CREATE COUPON
authCoupons.post('/', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const {
    propertyId,
    code,
    discountType = 'percentage', // 'percentage' | 'flat'
    discountValue,
    minBookingAmountPaise = 0,
    maxDiscountPaise = null,
    validFrom = null,
    validTo = null,
    usageLimit = null,
  } = body;

  if (!propertyId || !code || !discountValue) {
    return c.json({ error: 'Property ID, Code, and Discount Value are required' }, 400);
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const id = `cpn_${crypto.randomUUID()}`;

  // Check duplicate
  const existing: any = await c.env.DB.prepare(
    'SELECT id FROM coupons WHERE property_id = ? AND UPPER(code) = ?'
  )
    .bind(propertyId, normalizedCode)
    .first();

  if (existing) {
    return c.json({ error: `Coupon code '${normalizedCode}' already exists for this property.` }, 409);
  }

  await c.env.DB.prepare(
    `INSERT INTO coupons (
      id, property_id, tenant_id, code, discount_type, discount_value,
      min_booking_amount_paise, max_discount_paise, valid_from, valid_to,
      usage_limit, times_used, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?)`
  )
    .bind(
      id,
      propertyId,
      tenantId,
      normalizedCode,
      discountType,
      Math.round(discountValue),
      Math.round(minBookingAmountPaise || 0),
      maxDiscountPaise ? Math.round(maxDiscountPaise) : null,
      validFrom,
      validTo,
      usageLimit ? parseInt(String(usageLimit), 10) : null,
      now,
      now
    )
    .run();

  return c.json({
    success: true,
    coupon: {
      id,
      propertyId,
      code: normalizedCode,
      discountType,
      discountValue,
      isActive: 1,
    },
  });
});

// TOGGLE STATUS
authCoupons.patch('/:id/status', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);

  const coupon: any = await c.env.DB.prepare('SELECT id, is_active FROM coupons WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first();

  if (!coupon) {
    return c.json({ error: 'Coupon not found' }, 404);
  }

  const newStatus = coupon.is_active ? 0 : 1;
  await c.env.DB.prepare('UPDATE coupons SET is_active = ?, updated_at = ? WHERE id = ?')
    .bind(newStatus, now, id)
    .run();

  return c.json({ success: true, isActive: newStatus });
});

// DELETE COUPON
authCoupons.delete('/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM coupons WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .run();

  return c.json({ success: true, message: 'Coupon deleted successfully' });
});

couponRoutes.route('/', authCoupons);
