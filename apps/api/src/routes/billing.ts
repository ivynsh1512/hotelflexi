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

  let itemResults = items.results || [];

  // If no explicit invoice items were stored, synthesize a clear room line item
  if (itemResults.length === 0 && invoice.subtotal_paise > 0) {
    const taxPaise = invoice.total_tax_paise || (invoice.cgst_paise + invoice.sgst_paise) || 0;
    itemResults = [
      {
        id: `synth_${invoice.id}`,
        invoice_id: invoice.id,
        tenant_id: invoice.tenant_id,
        description: `Room Accommodation - ${invoice.issue_date || 'Standard Stay'}`,
        quantity: 1,
        unit_price_paise: invoice.subtotal_paise,
        amount_paise: invoice.subtotal_paise,
        hsn_code: '996311',
        tax_rate_basis_points: 1200,
        tax_amount_paise: taxPaise,
        created_at: invoice.created_at,
      },
    ];
  }

  const payments = await c.env.DB.prepare(
    'SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at ASC'
  )
    .bind(id)
    .all();

  return c.json({
    invoice,
    items: itemResults,
    payments: payments.results || [],
  });
});

// -----------------------------------------------------------------------------
// RESEND INVOICE EMAIL TO GUEST
// -----------------------------------------------------------------------------
billingRoutes.post('/invoices/:id/send-email', requireRole(['owner', 'manager', 'receptionist', 'accountant']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const user = c.get('user')!;

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

  const targetEmail = invoice.guest_email;
  if (!targetEmail || !targetEmail.includes('@')) {
    return c.json({ error: 'Guest does not have a valid email address on this invoice.' }, 400);
  }

  const subtotalINR = (invoice.subtotal_paise / 100).toLocaleString('en-IN');
  const taxINR = (invoice.total_tax_paise / 100).toLocaleString('en-IN');
  const totalINR = (invoice.total_amount_paise / 100).toLocaleString('en-IN');
  const paidINR = ((invoice.paid_amount_paise || 0) / 100).toLocaleString('en-IN');
  const balanceINR = ((invoice.balance_amount_paise || 0) / 100).toLocaleString('en-IN');
  const discountINR = invoice.discount_paise ? (invoice.discount_paise / 100).toLocaleString('en-IN') : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
      .header { background: #1e40af; color: #ffffff; padding: 28px 24px; text-align: center; }
      .content { padding: 24px; font-size: 14px; line-height: 1.6; }
      .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 16px 0; }
      .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
      .total-row { border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 16px; font-weight: bold; color: #1e40af; }
      .footer { padding: 16px; text-align: center; font-size: 12px; color: #64748b; background: #f1f5f9; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;font-size:22px;">Tax Invoice #${invoice.invoice_number}</h2>
          <p style="margin:4px 0 0 0;opacity:0.9;font-size:13px;">${invoice.property_name}</p>
        </div>
        <div class="content">
          <p>Dear <strong>${invoice.guest_name}</strong>,</p>
          <p>Please find below your official tax invoice details from <strong>${invoice.property_name}</strong>:</p>
          <div class="card">
            <div class="row"><span>Invoice Number:</span><strong>#${invoice.invoice_number}</strong></div>
            <div class="row"><span>Issue Date:</span><span>${invoice.issue_date}</span></div>
            <div class="row"><span>Status:</span><strong style="color:${invoice.status === 'paid' ? '#16a34a' : '#d97706'};text-transform:uppercase;">${invoice.status}</strong></div>
            ${invoice.gst_number ? `<div class="row"><span>GSTIN:</span><span>${invoice.gst_number}</span></div>` : ''}
            <div style="border-top:1px dashed #cbd5e1;margin:10px 0;"></div>
            <div class="row"><span>Room Subtotal:</span><span>₹${subtotalINR}</span></div>
            ${discountINR ? `<div class="row" style="color:#b45309;"><span>Discount Applied:</span><span>-₹${discountINR}</span></div>` : ''}
            <div class="row"><span>GST Tax (SAC 9963):</span><span>₹${taxINR}</span></div>
            <div class="row total-row"><span>Total Payable:</span><span>₹${totalINR}</span></div>
            ${invoice.paid_amount_paise > 0 ? `<div class="row" style="color:#16a34a;margin-top:6px;"><span>Amount Paid:</span><span>₹${paidINR}</span></div>` : ''}
            ${invoice.balance_amount_paise > 0 ? `<div class="row" style="color:#b45309;font-weight:bold;"><span>Balance Due:</span><span>₹${balanceINR}</span></div>` : ''}
          </div>
          <p style="font-size:12px;color:#64748b;">
            For any queries regarding this folio, contact front desk at ${invoice.property_phone || invoice.property_email || 'the hotel'}.
          </p>
        </div>
        <div class="footer">
          Powered by HotelFlexi &bull; https://hotelflexi.com
        </div>
      </div>
    </body>
    </html>
  `;

  const { sendEmail } = await import('../services/email');
  const sendResult = await sendEmail(c.env, {
    to: targetEmail,
    subject: `Tax Invoice #${invoice.invoice_number} - ${invoice.property_name}`,
    html,
  });

  const now = Math.floor(Date.now() / 1000);
  await recordAuditLog(c, {
    action: 'invoice.email_sent',
    resourceType: 'invoice',
    resourceId: id,
    newValues: { recipient: targetEmail, sentBy: user.uid, success: sendResult.success },
  });

  return c.json({
    success: true,
    message: `Invoice email successfully sent to ${targetEmail}`,
    delivery: sendResult,
  });
});

// -----------------------------------------------------------------------------
// SAFE INVOICE VOIDING
// -----------------------------------------------------------------------------
billingRoutes.post('/invoices/:id/void', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const user = c.get('user')!;
  const now = Math.floor(Date.now() / 1000);

  const existing: any = await c.env.DB.prepare(
    'SELECT * FROM invoices WHERE id = ? AND tenant_id = ?'
  ).bind(id, tenantId).first();

  if (!existing) {
    return c.json({ error: 'Invoice not found' }, 404);
  }

  if (existing.status === 'cancelled') {
    return c.json({ error: 'Invoice is already voided/cancelled' }, 400);
  }

  await c.env.DB.prepare(
    `UPDATE invoices
     SET status = 'cancelled',
         balance_amount_paise = 0,
         updated_at = ?
     WHERE id = ? AND tenant_id = ?`
  ).bind(now, id, tenantId).run();

  await recordAuditLog(c, {
    action: 'invoice.voided',
    resourceType: 'invoice',
    resourceId: id,
    newValues: { voidedBy: user.uid, previousStatus: existing.status },
  });

  return c.json({ success: true, message: 'Invoice successfully voided and marked as cancelled' });
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
