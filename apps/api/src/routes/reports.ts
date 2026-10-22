import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware } from '../auth/middleware';

export const reportRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

reportRoutes.use('*', authMiddleware, tenantMiddleware);

// Daily collections report
reportRoutes.get('/daily-collections', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];

  const startOfDay = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000);
  const endOfDay = Math.floor(new Date(`${date}T23:59:59Z`).getTime() / 1000);

  let sql = `
    SELECT payment_method,
           COUNT(*) as transaction_count,
           SUM(amount_paise) as total_paise
    FROM payments
    WHERE tenant_id = ? AND created_at >= ? AND created_at <= ? AND status = 'captured'
  `;
  const params: any[] = [tenantId, startOfDay, endOfDay];

  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }
  sql += ` GROUP BY payment_method`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();

  const totalPaise = (rows.results || []).reduce((acc: number, curr: any) => acc + (curr.total_paise || 0), 0);

  return c.json({
    date,
    totalPaise,
    totalRupees: totalPaise / 100,
    breakdown: rows.results || [],
  });
});

// Occupancy & Monthly Performance
reportRoutes.get('/monthly-summary', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  // Total rooms
  let roomCountSql = 'SELECT COUNT(*) as count FROM rooms WHERE tenant_id = ? AND is_active = 1';
  const roomParams: any[] = [tenantId];
  if (propertyId) {
    roomCountSql += ' AND property_id = ?';
    roomParams.push(propertyId);
  }
  const roomsResult: any = await c.env.DB.prepare(roomCountSql).bind(...roomParams).first();
  const totalRooms = roomsResult?.count || 1;

  // Total reservations in last 30 days
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;
  let resSql = `
    SELECT COUNT(*) as total_reservations,
           COALESCE(SUM(total_amount_paise), 0) as total_revenue_paise,
           COALESCE(SUM(paid_amount_paise), 0) as total_paid_paise,
           COALESCE(SUM(balance_amount_paise), 0) as total_outstanding_paise
    FROM reservations
    WHERE tenant_id = ? AND created_at >= ? AND status NOT IN ('cancelled')
  `;
  const resParams: any[] = [tenantId, thirtyDaysAgo];
  if (propertyId) {
    resSql += ' AND property_id = ?';
    resParams.push(propertyId);
  }
  const summary: any = await c.env.DB.prepare(resSql).bind(...resParams).first();

  // Occupancy estimate
  const activeOccupied: any = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM rooms WHERE tenant_id = ? AND status = 'occupied'`
  )
    .bind(tenantId)
    .first();

  const currentOccupancyRate = Math.min(100, Math.round(((activeOccupied?.count || 0) / totalRooms) * 100));
  const adrPaise = summary?.total_reservations > 0 ? Math.round(summary.total_revenue_paise / summary.total_reservations) : 0;

  return c.json({
    period: 'Last 30 Days',
    totalRooms,
    occupiedRooms: activeOccupied?.count || 0,
    occupancyRate: currentOccupancyRate,
    totalReservations: summary?.total_reservations || 0,
    totalRevenuePaise: summary?.total_revenue_paise || 0,
    totalRevenueRupees: (summary?.total_revenue_paise || 0) / 100,
    adrPaise,
    adrRupees: adrPaise / 100,
    totalOutstandingPaise: summary?.total_outstanding_paise || 0,
    totalOutstandingRupees: (summary?.total_outstanding_paise || 0) / 100,
  });
});

// Endpoint A: Revenue by date (daily series)
reportRoutes.get('/revenue-by-date', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  const toDateStr = c.req.query('to_date') || new Date().toISOString().split('T')[0];
  const fromDateDefault = new Date();
  fromDateDefault.setDate(fromDateDefault.getDate() - 30);
  const fromDateStr = c.req.query('from_date') || fromDateDefault.toISOString().split('T')[0];

  const fromTs = Math.floor(new Date(`${fromDateStr}T00:00:00Z`).getTime() / 1000);
  const toTs = Math.floor(new Date(`${toDateStr}T23:59:59Z`).getTime() / 1000);

  let sql = `
    SELECT DATE(datetime(created_at, 'unixepoch')) as date,
           SUM(amount_paise) as total_paise
    FROM payments
    WHERE tenant_id = ? AND status = 'captured'
      AND created_at >= ? AND created_at <= ?
  `;
  const params: any[] = [tenantId, fromTs, toTs];

  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }
  sql += ` GROUP BY DATE(datetime(created_at, 'unixepoch')) ORDER BY date ASC`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  const series = (rows.results || []).map((r: any) => ({
    date: r.date,
    totalPaise: r.total_paise || 0,
  }));
  const totalPaise = series.reduce((acc: number, s: any) => acc + s.totalPaise, 0);

  return c.json({
    fromDate: fromDateStr,
    toDate: toDateStr,
    series,
    totalPaise,
  });
});

// Endpoint B: Payment method breakdown
reportRoutes.get('/payment-breakdown', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  const toDateStr = c.req.query('to_date') || new Date().toISOString().split('T')[0];
  const fromDateDefault = new Date();
  fromDateDefault.setDate(fromDateDefault.getDate() - 30);
  const fromDateStr = c.req.query('from_date') || fromDateDefault.toISOString().split('T')[0];

  const fromTs = Math.floor(new Date(`${fromDateStr}T00:00:00Z`).getTime() / 1000);
  const toTs = Math.floor(new Date(`${toDateStr}T23:59:59Z`).getTime() / 1000);

  let sql = `
    SELECT payment_method as method,
           COUNT(*) as count,
           SUM(amount_paise) as total_paise
    FROM payments
    WHERE tenant_id = ? AND status = 'captured'
      AND created_at >= ? AND created_at <= ?
  `;
  const params: any[] = [tenantId, fromTs, toTs];

  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }
  sql += ` GROUP BY payment_method ORDER BY total_paise DESC`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  const breakdown = (rows.results || []).map((r: any) => ({
    method: r.method,
    count: r.count || 0,
    totalPaise: r.total_paise || 0,
  }));
  const totalPaise = breakdown.reduce((acc: number, b: any) => acc + b.totalPaise, 0);

  return c.json({ breakdown, totalPaise });
});

// Endpoint C: Reservation statistics
reportRoutes.get('/reservation-stats', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  const toDateStr = c.req.query('to_date') || new Date().toISOString().split('T')[0];
  const fromDateDefault = new Date();
  fromDateDefault.setDate(fromDateDefault.getDate() - 30);
  const fromDateStr = c.req.query('from_date') || fromDateDefault.toISOString().split('T')[0];

  const fromTs = Math.floor(new Date(`${fromDateStr}T00:00:00Z`).getTime() / 1000);
  const toTs = Math.floor(new Date(`${toDateStr}T23:59:59Z`).getTime() / 1000);

  let sql = `
    SELECT
      COUNT(*) as total_reservations,
      SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) as checked_in,
      SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) as checked_out,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      AVG((checkout_date - checkin_date) / 86400.0) as avg_los,
      SUM(CASE WHEN source IS NULL OR source = 'direct' THEN 1 ELSE 0 END) as direct_bookings,
      SUM(CASE WHEN source IS NOT NULL AND source NOT IN ('direct') THEN 1 ELSE 0 END) as ota_bookings,
      COALESCE(SUM(total_amount_paise), 0) as total_revenue_paise
    FROM reservations
    WHERE tenant_id = ? AND created_at >= ? AND created_at <= ?
  `;
  const params: any[] = [tenantId, fromTs, toTs];

  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }

  const row: any = await c.env.DB.prepare(sql).bind(...params).first();

  return c.json({
    totalReservations: row?.total_reservations || 0,
    checkedIn: row?.checked_in || 0,
    checkedOut: row?.checked_out || 0,
    cancelled: row?.cancelled || 0,
    avgLengthOfStay: row?.avg_los ? Math.round((row.avg_los) * 10) / 10 : 0,
    directBookings: row?.direct_bookings || 0,
    otaBookings: row?.ota_bookings || 0,
    totalRevenuePaise: row?.total_revenue_paise || 0,
  });
});
