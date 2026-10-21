import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const billingRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

billingRoutes.use('*', authMiddleware, tenantMiddleware);

// -----------------------------------------------------------------------------
// INVOICES
// -----------------------------------------------------------------------------
billingRoutes.get('/invoices', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const status = c.req.query('status');
  const search = c.req.query('search') || c.req.query('q');
  const fromDate = c.req.query('from');
  const toDate = c.req.query('to');

  let sql = `SELECT * FROM invoices WHERE tenant_id = ?`;
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }
  if (status && status !== 'all') {
    sql += ` AND status = ?`;
    params.push(status);
  }
  if (fromDate) {
    sql += ` AND issue_date >= ?`;
    params.push(fromDate);
  }
  if (toDate) {
    sql += ` AND issue_date <= ?`;
    params.push(toDate);
  }
  if (search && search.trim().length > 0) {
    const term = `%${search.trim().toUpperCase()}%`;
    sql += ` AND (UPPER(invoice_number) LIKE ? OR UPPER(guest_name) LIKE ? OR guest_phone LIKE ? OR UPPER(guest_email) LIKE ?)`;
    params.push(term, term, term, term);
  }

  sql += ` ORDER BY issue_date DESC, created_at DESC LIMIT 300`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ invoices: rows.results || [] });
});

billingRoutes.get('/invoices/:id', async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');

  const invoice: any = await c.env.DB.prepare(
    `SELECT inv.*, p.name as property_name, p.address_line1 as property_address,
            ps.gst_number, p.phone as property_phone, p.email as property_email
     FROM invoices inv
     JOIN properties p ON p.id = inv.property_id
     LEFT JOIN property_settings ps ON ps.property_id = p.id
     WHERE inv.id = ? AND inv.tenant_id = ?`
  )
    .bind(id, tenantId)
    .first();

  if (!invoice) {
    return c.json({ error: 'Invoice not found' }, 404);
  }

  const items = await c.env.DB.prepare(
    'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY created_at ASC'
  )
    .bind(id)
    .all();

  const payments = await c.env.DB.prepare(
    'SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at ASC'
  )
    .bind(id)
    .all();

  return c.json({
    invoice,
    items: items.results || [],
    payments: payments.results || [],
  });
});

// -----------------------------------------------------------------------------
// RECORD PAYMENT (Cash, UPI, Card, Bank Transfer, Razorpay)
// -----------------------------------------------------------------------------
billingRoutes.post('/payments', requireRole(['owner', 'manager', 'accountant', 'receptionist']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const { propertyId, invoiceId, reservationId, paymentMethod, amountPaise, referenceNumber, notes } = body;

  if (!propertyId || !amountPaise || amountPaise <= 0 || !paymentMethod) {
    return c.json({ error: 'Property ID, valid amount (paise), and payment method are required' }, 400);
  }

  const paymentId = `pay_${crypto.randomUUID()}`;
  const statements: any[] = [];

  // Insert payment
  statements.push(
    c.env.DB.prepare(
      `INSERT INTO payments (
        id, property_id, tenant_id, reservation_id, invoice_id,
        payment_method, amount_paise, currency, status, reference_number, notes,
        recorded_by_user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', 'captured', ?, ?, ?, ?, ?)`
    ).bind(
      paymentId,
      propertyId,
      tenantId,
      reservationId || null,
      invoiceId || null,
      paymentMethod,
      Math.round(amountPaise),
      referenceNumber || null,
      notes || null,
      user.uid,
      now,
      now
    )
  );

  // If linked to an invoice, update invoice paid amount and balance
  if (invoiceId) {
    statements.push(
      c.env.DB.prepare(
        `UPDATE invoices SET
           paid_amount_paise = paid_amount_paise + ?,
           balance_amount_paise = MAX(0, total_amount_paise - (paid_amount_paise + ?)),
           status = CASE WHEN (paid_amount_paise + ?) >= total_amount_paise THEN 'paid' ELSE 'partially_paid' END,
           updated_at = ?
         WHERE id = ? AND tenant_id = ?`
      ).bind(amountPaise, amountPaise, amountPaise, now, invoiceId, tenantId)
    );
  }

  // If linked to a reservation, update reservation paid amount and balance
  if (reservationId) {
    statements.push(
      c.env.DB.prepare(
        `UPDATE reservations SET
           paid_amount_paise = paid_amount_paise + ?,
           balance_amount_paise = MAX(0, total_amount_paise - (paid_amount_paise + ?)),
           payment_status = CASE WHEN (paid_amount_paise + ?) >= total_amount_paise THEN 'paid' ELSE 'partially_paid' END,
           updated_at = ?
         WHERE id = ? AND tenant_id = ?`
      ).bind(amountPaise, amountPaise, amountPaise, now, reservationId, tenantId)
    );

    const rpayId = `rpay_${crypto.randomUUID()}`;
    statements.push(
      c.env.DB.prepare(
        `INSERT INTO reservation_payments (id, reservation_id, payment_id, tenant_id, amount_paise, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(rpayId, reservationId, paymentId, tenantId, amountPaise, now)
    );
  }

  await c.env.DB.batch(statements);

  await recordAuditLog(c, {
    action: 'payment.recorded',
    resourceType: 'payment',
    resourceId: paymentId,
    newValues: { amountPaise, paymentMethod, invoiceId, reservationId },
  });

  return c.json({ success: true, paymentId, amountPaise });
});

// -----------------------------------------------------------------------------
// EXPENSES
// -----------------------------------------------------------------------------
billingRoutes.get('/expenses', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const categoryId = c.req.query('category_id');

  let sql = `
    SELECT e.*, ec.name as category_name
    FROM expenses e
    JOIN expense_categories ec ON ec.id = e.category_id
    WHERE e.tenant_id = ?
  `;
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ` AND e.property_id = ?`;
    params.push(propertyId);
  }
  if (categoryId) {
    sql += ` AND e.category_id = ?`;
    params.push(categoryId);
  }

  sql += ` ORDER BY e.expense_date DESC, e.created_at DESC LIMIT 100`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();

  // Categories list
  const categories = await c.env.DB.prepare(
    `SELECT * FROM expense_categories WHERE tenant_id = ? AND is_active = 1`
  )
    .bind(tenantId)
    .all();

  return c.json({
    expenses: rows.results || [],
    categories: categories.results || [],
  });
});

billingRoutes.post('/expenses', requireRole(['owner', 'manager', 'accountant']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const { propertyId, categoryId, vendorName, description, amountPaise, expenseDate, paymentMethod, receiptReference } = body;

  if (!propertyId || !categoryId || !description || !amountPaise) {
    return c.json({ error: 'Property ID, category, description, and amount are required' }, 400);
  }

  const id = `exp_${crypto.randomUUID()}`;

  await c.env.DB.prepare(
    `INSERT INTO expenses (
      id, property_id, tenant_id, category_id, vendor_name, description,
      amount_paise, expense_date, payment_method, receipt_reference,
      created_by_user_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      propertyId,
      tenantId,
      categoryId,
      vendorName || null,
      description,
      Math.round(amountPaise),
      expenseDate || new Date().toISOString().split('T')[0],
      paymentMethod || 'cash',
      receiptReference || null,
      user.uid,
      now,
      now
    )
    .run();

  await recordAuditLog(c, {
    action: 'expense.created',
    resourceType: 'expense',
    resourceId: id,
    newValues: { amountPaise, description, categoryId },
  });

  return c.json({ success: true, id });
});
