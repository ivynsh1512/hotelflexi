import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';

export const hrExpensesRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

hrExpensesRoutes.use('*', authMiddleware, tenantMiddleware);

// =============================================================================
// 1. STAFF DIRECTORY & SALARIES
// =============================================================================

// GET /staff - List staff members
hrExpensesRoutes.get('/staff', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let sql = `SELECT * FROM staff_salaries WHERE tenant_id = ?`;
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }

  sql += ` ORDER BY is_active DESC, staff_name ASC`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ staff: rows.results || [] });
});

// POST /staff - Add new staff member
hrExpensesRoutes.post('/staff', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const {
    propertyId,
    staffName,
    designation,
    department = 'general',
    monthlySalaryPaise,
    joiningDate,
    phone,
    email,
    notes,
  } = body;

  if (!propertyId || !staffName || monthlySalaryPaise === undefined) {
    return c.json({ error: 'propertyId, staffName, and monthlySalaryPaise are required' }, 400);
  }

  const id = `stf_${crypto.randomUUID()}`;

  await c.env.DB.prepare(
    `INSERT INTO staff_salaries (
       id, tenant_id, property_id, staff_name, designation, department,
       monthly_salary_paise, joining_date, phone, email, is_active, notes,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))`
  )
    .bind(
      id,
      tenantId,
      propertyId,
      staffName,
      designation || 'Staff',
      department,
      monthlySalaryPaise,
      joiningDate || new Date().toISOString().split('T')[0],
      phone || null,
      email || null,
      notes || null
    )
    .run();

  return c.json({ success: true, id, message: 'Staff member added successfully' });
});

// PATCH /staff/:id - Update staff details
hrExpensesRoutes.patch('/staff/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json();

  const existing: any = await c.env.DB.prepare(
    'SELECT id FROM staff_salaries WHERE id = ? AND tenant_id = ?'
  )
    .bind(id, tenantId)
    .first();

  if (!existing) {
    return c.json({ error: 'Staff member not found' }, 404);
  }

  const fields: string[] = [];
  const params: any[] = [];

  const mapping: Record<string, string> = {
    staffName: 'staff_name',
    designation: 'designation',
    department: 'department',
    monthlySalaryPaise: 'monthly_salary_paise',
    joiningDate: 'joining_date',
    phone: 'phone',
    email: 'email',
    isActive: 'is_active',
    notes: 'notes',
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
    `UPDATE staff_salaries SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`
  )
    .bind(...params)
    .run();

  return c.json({ success: true, message: 'Staff updated successfully' });
});

// DELETE /staff/:id - Soft-delete / deactivate staff
hrExpensesRoutes.delete('/staff/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');

  await c.env.DB.prepare(
    `UPDATE staff_salaries SET is_active = 0, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`
  )
    .bind(id, tenantId)
    .run();

  return c.json({ success: true, message: 'Staff member deactivated' });
});

// =============================================================================
// 2. SALARY DISBURSEMENTS & PAYMENTS
// =============================================================================

// GET /salary-payments - List salary payment records
hrExpensesRoutes.get('/salary-payments', async (c) => {
  const tenantId = c.get('tenantId')!;
  const month = c.req.query('month'); // 'YYYY-MM'

  let sql = `
    SELECT sp.*, ss.designation, ss.department
    FROM salary_payments sp
    LEFT JOIN staff_salaries ss ON ss.id = sp.staff_salary_id
    WHERE sp.tenant_id = ?
  `;
  const params: any[] = [tenantId];

  if (month) {
    sql += ` AND sp.payment_month = ?`;
    params.push(month);
  }

  sql += ` ORDER BY sp.payment_date DESC, sp.created_at DESC`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ payments: rows.results || [] });
});

// POST /salary-payments - Record salary payout
hrExpensesRoutes.post('/salary-payments', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const {
    staffSalaryId,
    staffName,
    paymentMonth,
    amountPaise,
    bonusPaise = 0,
    deductionPaise = 0,
    netPaise,
    paymentDate,
    paymentMode = 'bank_transfer',
    notes = '',
  } = body;

  if (!staffSalaryId || !staffName || !paymentMonth || amountPaise === undefined) {
    return c.json({ error: 'staffSalaryId, staffName, paymentMonth, and amountPaise are required' }, 400);
  }

  const calculatedNet = netPaise ?? Math.max(0, amountPaise + bonusPaise - deductionPaise);
  const id = `spay_${crypto.randomUUID()}`;

  await c.env.DB.prepare(
    `INSERT INTO salary_payments (
       id, tenant_id, staff_salary_id, staff_name, payment_month,
       amount_paise, bonus_paise, deduction_paise, net_paise,
       payment_date, payment_mode, notes, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  )
    .bind(
      id,
      tenantId,
      staffSalaryId,
      staffName,
      paymentMonth,
      amountPaise,
      bonusPaise,
      deductionPaise,
      calculatedNet,
      paymentDate || new Date().toISOString().split('T')[0],
      paymentMode,
      notes
    )
    .run();

  return c.json({ success: true, id, message: 'Salary disbursement recorded successfully' });
});

// =============================================================================
// 3. HOTEL EXPENSES (ONE-TIME & RECURRING MONTHLY)
// =============================================================================

const listExpensesHandler = async (c: any) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const category = c.req.query('category');
  const expenseType = c.req.query('expense_type');
  const fromDate = c.req.query('from');
  const toDate = c.req.query('to');

  let sql = `SELECT * FROM property_expenses WHERE tenant_id = ?`;
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }
  if (category && category !== 'all') {
    sql += ` AND category = ?`;
    params.push(category);
  }
  if (expenseType && expenseType !== 'all') {
    sql += ` AND expense_type = ?`;
    params.push(expenseType);
  }
  if (fromDate) {
    sql += ` AND expense_date >= ?`;
    params.push(fromDate);
  }
  if (toDate) {
    sql += ` AND expense_date <= ?`;
    params.push(toDate);
  }

  sql += ` ORDER BY expense_date DESC, created_at DESC LIMIT 200`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ expenses: rows.results || [] });
};

// GET /expenses & GET / - List expenses
hrExpensesRoutes.get('/expenses', listExpensesHandler);
hrExpensesRoutes.get('/', listExpensesHandler);

const createExpenseHandler = async (c: any) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const {
    propertyId,
    category,
    title,
    description = '',
    amountPaise,
    expenseType = 'one_time',
    expenseDate,
    vendorName = '',
    receiptUrl = null,
    paymentMode = 'cash',
  } = body;

  if (!propertyId || !category || !title || amountPaise === undefined) {
    return c.json({ error: 'propertyId, category, title, and amountPaise are required' }, 400);
  }

  const id = `exp_${crypto.randomUUID()}`;

  await c.env.DB.prepare(
    `INSERT INTO property_expenses (
       id, tenant_id, property_id, category, title, description,
       amount_paise, expense_type, expense_date, vendor_name,
       receipt_url, payment_mode, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  )
    .bind(
      id,
      tenantId,
      propertyId,
      category,
      title,
      description,
      amountPaise,
      expenseType,
      expenseDate || new Date().toISOString().split('T')[0],
      vendorName,
      receiptUrl,
      paymentMode
    )
    .run();

  return c.json({ success: true, id, message: 'Expense logged successfully' });
};

// POST /expenses & POST / - Add new expense
hrExpensesRoutes.post('/expenses', requireRole(['owner', 'manager']), createExpenseHandler);
hrExpensesRoutes.post('/', requireRole(['owner', 'manager']), createExpenseHandler);

const deleteExpenseHandler = async (c: any) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM property_expenses WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .run();

  return c.json({ success: true, message: 'Expense deleted' });
};

// DELETE /expenses/:id & DELETE /:id - Delete an expense
hrExpensesRoutes.delete('/expenses/:id', requireRole(['owner', 'manager']), deleteExpenseHandler);
hrExpensesRoutes.delete('/:id', requireRole(['owner', 'manager']), deleteExpenseHandler);

// GET /pnl-summary - Aggregated P&L report
hrExpensesRoutes.get('/pnl-summary', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  // Revenue from invoices/reservations for last 6 months
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);

  let expenseSql = `
    SELECT strftime('%Y-%m', expense_date) as month, SUM(amount_paise) as total_expenses_paise
    FROM property_expenses
    WHERE tenant_id = ?
  `;
  const expenseParams: any[] = [tenantId];
  if (propertyId) {
    expenseSql += ` AND property_id = ?`;
    expenseParams.push(propertyId);
  }
  expenseSql += ` GROUP BY strftime('%Y-%m', expense_date) ORDER BY month DESC LIMIT 6`;

  const expenseRows = await c.env.DB.prepare(expenseSql).bind(...expenseParams).all();

  // Salary disbursements
  const salarySql = `
    SELECT payment_month as month, SUM(net_paise) as total_salaries_paise
    FROM salary_payments
    WHERE tenant_id = ?
    GROUP BY payment_month ORDER BY month DESC LIMIT 6
  `;
  const salaryRows = await c.env.DB.prepare(salarySql).bind(tenantId).all();

  // Reservation Revenue
  let resSql = `
    SELECT strftime('%Y-%m', check_in_date) as month, SUM(total_amount_paise) as total_revenue_paise
    FROM reservations
    WHERE tenant_id = ? AND status NOT IN ('cancelled', 'no_show')
  `;
  const resParams: any[] = [tenantId];
  if (propertyId) {
    resSql += ` AND property_id = ?`;
    resParams.push(propertyId);
  }
  resSql += ` GROUP BY strftime('%Y-%m', check_in_date) ORDER BY month DESC LIMIT 6`;

  const resRows = await c.env.DB.prepare(resSql).bind(...resParams).all();

  return c.json({
    currentMonth,
    expensesByMonth: expenseRows.results || [],
    salariesByMonth: salaryRows.results || [],
    revenueByMonth: resRows.results || [],
  });
});
