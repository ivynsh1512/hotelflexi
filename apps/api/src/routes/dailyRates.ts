import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';

export const dailyRatesRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

dailyRatesRoutes.use('*', authMiddleware, tenantMiddleware);

// -----------------------------------------------------------------------------
// LIST DAILY RATE OVERRIDES
// -----------------------------------------------------------------------------
dailyRatesRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const roomTypeId = c.req.query('room_type_id');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');

  let sql = `
    SELECT dr.*, rt.name as room_type_name, rt.code as room_type_code, rt.base_price_paise as standard_base_price
    FROM daily_rates dr
    JOIN room_types rt ON rt.id = dr.room_type_id
    WHERE dr.tenant_id = ?
  `;
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ' AND dr.property_id = ?';
    params.push(propertyId);
  }
  if (roomTypeId) {
    sql += ' AND dr.room_type_id = ?';
    params.push(roomTypeId);
  }
  if (startDate) {
    sql += ' AND dr.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND dr.date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY dr.date ASC LIMIT 365';

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ dailyRates: rows.results || [] });
});

// -----------------------------------------------------------------------------
// SET OR OVERRIDE DAILY RATES (Single Date or Date Range)
// -----------------------------------------------------------------------------
dailyRatesRoutes.post('/', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const {
    propertyId,
    roomTypeId,
    pricePaise,
    startDate,
    endDate,
    dates, // optional explicit array of { date: string, pricePaise: number }
    note = 'Custom date pricing',
  } = body;

  if (!propertyId || !roomTypeId) {
    return c.json({ error: 'Property ID and Room Type ID are required' }, 400);
  }

  const statements: any[] = [];
  const entriesToInsert: Array<{ date: string; price: number }> = [];

  if (Array.isArray(dates) && dates.length > 0) {
    for (const d of dates) {
      if (d.date && d.pricePaise > 0) {
        entriesToInsert.push({ date: d.date, price: Math.round(d.pricePaise) });
      }
    }
  } else if (startDate && pricePaise > 0) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(startDate);
    
    // Iterate from start to end (inclusive)
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      entriesToInsert.push({ date: dateStr, price: Math.round(pricePaise) });
      current.setDate(current.getDate() + 1);
    }
  } else {
    return c.json({ error: 'Either (startDate and pricePaise) or a dates array is required' }, 400);
  }

  for (const entry of entriesToInsert) {
    const id = `drt_${crypto.randomUUID()}`;
    statements.push(
      c.env.DB.prepare(
        `INSERT INTO daily_rates (id, property_id, tenant_id, room_type_id, date, price_paise, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(room_type_id, date) DO UPDATE SET
           price_paise = excluded.price_paise,
           note = excluded.note,
           updated_at = excluded.updated_at`
      ).bind(id, propertyId, tenantId, roomTypeId, entry.date, entry.price, note, now, now)
    );
  }

  // Execute in batches of up to 50
  const chunkSize = 50;
  for (let i = 0; i < statements.length; i += chunkSize) {
    await c.env.DB.batch(statements.slice(i, i + chunkSize));
  }

  return c.json({
    success: true,
    count: entriesToInsert.length,
    message: `Successfully updated rates for ${entriesToInsert.length} date(s).`,
  });
});

// -----------------------------------------------------------------------------
// DELETE DAILY RATE OVERRIDE
// -----------------------------------------------------------------------------
dailyRatesRoutes.delete('/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM daily_rates WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .run();

  return c.json({ success: true, message: 'Custom rate override removed' });
});
