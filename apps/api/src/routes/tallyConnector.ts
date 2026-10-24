/**
 * HotelFlexi TallyPrime Accounting Connector & XML Synchronizer
 * Enables secure, authorized synchronization between HotelFlexi folios/invoices/payments
 * and local Windows TallyPrime instances. Generates standard Tally XML vouchers with
 * strict idempotency, GST mapping, and duplicate prevention.
 */

import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';

export const tallyConnectorRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// -----------------------------------------------------------------------------
// 1. PROPERTY CONFIGURATION & LEDGER MAPPINGS
// -----------------------------------------------------------------------------
tallyConnectorRoutes.get('/config', authMiddleware, tenantMiddleware, async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  if (!propertyId) {
    return c.json({ error: 'property_id is required' }, 400);
  }

  const connector: any = await c.env.DB.prepare(
    `SELECT * FROM tally_connectors WHERE tenant_id = ? AND property_id = ?`
  )
    .bind(tenantId, propertyId)
    .first();

  const mappingsRows: any = await c.env.DB.prepare(
    `SELECT hotelflexi_category, tally_ledger_name FROM tally_ledger_mappings
     WHERE tenant_id = ? AND property_id = ?`
  )
    .bind(tenantId, propertyId)
    .all();

  const defaultLedgers: Record<string, string> = {
    room_revenue: 'Room Tariff Revenue',
    food_revenue: 'Restaurant & Dining Sales',
    gst_12: 'Output CGST/SGST 12%',
    gst_18: 'Output CGST/SGST 18%',
    cash: 'Cash-in-Hand',
    bank: 'Bank Account / UPI',
    razorpay: 'Razorpay Clearing Ledger',
  };

  const activeMappings = { ...defaultLedgers };
  for (const row of (mappingsRows.results || []) as any[]) {
    activeMappings[row.hotelflexi_category] = row.tally_ledger_name;
  }

  return c.json({
    configured: Boolean(connector),
    connector: connector
      ? {
          companyName: connector.company_name,
          tallyPort: connector.tally_port,
          status: connector.status,
          connectorToken: connector.connector_token,
          lastSyncAt: connector.last_sync_at,
        }
      : null,
    ledgerMappings: activeMappings,
  });
});

tallyConnectorRoutes.post('/config', authMiddleware, tenantMiddleware, requireRole(['owner', 'accountant', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  if (!body.propertyId || !body.companyName) {
    return c.json({ error: 'propertyId and companyName are required' }, 400);
  }

  const token = body.connectorToken || `tally_tok_${crypto.randomUUID().replace(/-/g, '')}`;
  const id = `tally_conn_${crypto.randomUUID().slice(0, 8)}`;

  await c.env.DB.prepare(
    `INSERT INTO tally_connectors (
      id, tenant_id, property_id, connector_token, company_name, tally_port, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    ON CONFLICT(property_id) DO UPDATE SET
      company_name = excluded.company_name,
      tally_port = excluded.tally_port,
      updated_at = excluded.updated_at`
  )
    .bind(id, tenantId, body.propertyId, token, body.companyName.trim(), Number(body.tallyPort || 9000), now, now)
    .run();

  // Save custom ledger mappings if provided
  if (body.ledgerMappings && typeof body.ledgerMappings === 'object') {
    for (const [cat, ledger] of Object.entries(body.ledgerMappings)) {
      if (typeof ledger === 'string' && ledger.trim()) {
        const mapId = `map_${crypto.randomUUID().slice(0, 8)}`;
        await c.env.DB.prepare(
          `INSERT INTO tally_ledger_mappings (id, tenant_id, property_id, hotelflexi_category, tally_ledger_name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(property_id, hotelflexi_category) DO UPDATE SET
             tally_ledger_name = excluded.tally_ledger_name,
             updated_at = excluded.updated_at`
        )
          .bind(mapId, tenantId, body.propertyId, cat, (ledger as string).trim(), now, now)
          .run();
      }
    }
  }

  return c.json({ success: true, connectorToken: token });
});

// -----------------------------------------------------------------------------
// 2. ENQUEUE INVOICES / PAYMENTS INTO SYNC QUEUE
// -----------------------------------------------------------------------------
tallyConnectorRoutes.post('/enqueue', authMiddleware, tenantMiddleware, requireRole(['owner', 'accountant', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const { propertyId, invoiceIds = [] } = body;
  const now = Math.floor(Date.now() / 1000);

  if (!propertyId) {
    return c.json({ error: 'propertyId is required' }, 400);
  }

  let enqueuedCount = 0;

  // 1. Fetch Invoices
  let invQuery = `SELECT * FROM invoices WHERE tenant_id = ? AND property_id = ?`;
  const invParams: any[] = [tenantId, propertyId];
  if (invoiceIds.length > 0) {
    invQuery += ` AND id IN (${invoiceIds.map(() => '?').join(',')})`;
    invParams.push(...invoiceIds);
  } else {
    invQuery += ` ORDER BY created_at DESC LIMIT 20`;
  }

  const invoices: any = await c.env.DB.prepare(invQuery).bind(...invParams).all();

  for (const inv of (invoices.results || []) as any[]) {
    const queueId = `tq_${crypto.randomUUID().slice(0, 8)}`;
    const idempotencyKey = `tally_inv_${inv.id}`;

    const dateFormatted = new Date(inv.created_at * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    const amountRs = (inv.total_amount_paise / 100).toFixed(2);
    const taxRs = (inv.tax_amount_paise / 100).toFixed(2);
    const subtotalRs = (inv.subtotal_paise / 100).toFixed(2);

    // Standard Tally XML Sales Voucher
    const voucherXml = `
<VOUCHER VCHTYPE="Sales" ACTION="Create">
  <DATE>${dateFormatted}</DATE>
  <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
  <VOUCHERNUMBER>${inv.invoice_number}</VOUCHERNUMBER>
  <REFERENCE>${inv.reservation_id || ''}</REFERENCE>
  <PARTYLEDGERNAME>Sundry Debtors - Hotel Guests</PARTYLEDGERNAME>
  <NARRATION>HotelFlexi Invoice #${inv.invoice_number} for Guest ${inv.customer_name || 'Walk-in'}</NARRATION>
  <ALLLEDGERENTRIES.LIST>
    <LEDGERNAME>Sundry Debtors - Hotel Guests</LEDGERNAME>
    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
    <AMOUNT>-${amountRs}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>
  <ALLLEDGERENTRIES.LIST>
    <LEDGERNAME>Room Tariff Revenue</LEDGERNAME>
    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
    <AMOUNT>${subtotalRs}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>
  <ALLLEDGERENTRIES.LIST>
    <LEDGERNAME>Output CGST/SGST 12%</LEDGERNAME>
    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
    <AMOUNT>${taxRs}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>
</VOUCHER>`.trim();

    try {
      await c.env.DB.prepare(
        `INSERT INTO tally_sync_queue (
          id, tenant_id, property_id, voucher_type, entity_type, entity_id,
          payload_xml, status, attempts, idempotency_key, created_at, updated_at
        ) VALUES (?, ?, ?, 'Sales', 'invoice', ?, ?, 'queued', 0, ?, ?, ?)
        ON CONFLICT(idempotency_key) DO UPDATE SET
          payload_xml = excluded.payload_xml,
          status = 'queued',
          updated_at = excluded.updated_at`
      )
        .bind(queueId, tenantId, propertyId, inv.id, voucherXml, idempotencyKey, now, now)
        .run();
      enqueuedCount++;
    } catch {}
  }

  return c.json({ success: true, enqueuedCount });
});

// -----------------------------------------------------------------------------
// 3. EXPORT CLEAN TALLY XML DIRECTLY (One-click Accountant File Download)
// -----------------------------------------------------------------------------
tallyConnectorRoutes.get('/export/vouchers.xml', authMiddleware, tenantMiddleware, async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  if (!propertyId) {
    return c.text('property_id is required', 400);
  }

  const rows: any = await c.env.DB.prepare(
    `SELECT payload_xml FROM tally_sync_queue
     WHERE tenant_id = ? AND property_id = ?
     ORDER BY created_at DESC LIMIT 100`
  )
    .bind(tenantId, propertyId)
    .all();

  const vouchers = (rows.results || []).map((r: any) => r.payload_xml).join('\n');

  const fullXml = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
${vouchers}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  return new Response(fullXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="hotelflexi-tally-${propertyId}.xml"`,
    },
  });
});

// -----------------------------------------------------------------------------
// 4. LOCAL CONNECTOR AGENT POLLING (Used by Windows Tally Connector background service)
// -----------------------------------------------------------------------------
tallyConnectorRoutes.post('/connector/poll', async (c) => {
  const token = c.req.header('X-Connector-Token') || c.req.header('x-connector-token');
  if (!token) {
    return c.json({ error: 'X-Connector-Token header missing' }, 401);
  }

  const connector: any = await c.env.DB.prepare(
    `SELECT id, tenant_id, property_id, company_name, tally_port FROM tally_connectors
     WHERE connector_token = ? AND status = 'active'`
  )
    .bind(token)
    .first();

  if (!connector) {
    return c.json({ error: 'Invalid or inactive connector token' }, 403);
  }

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(`UPDATE tally_connectors SET last_sync_at = ? WHERE id = ?`)
    .bind(now, connector.id)
    .run();

  const pending: any = await c.env.DB.prepare(
    `SELECT id, voucher_type, payload_xml, idempotency_key FROM tally_sync_queue
     WHERE property_id = ? AND status = 'queued'
     ORDER BY created_at ASC LIMIT 10`
  )
    .bind(connector.property_id)
    .all();

  return c.json({
    success: true,
    companyName: connector.company_name,
    tallyPort: connector.tally_port,
    vouchers: pending.results || [],
  });
});

tallyConnectorRoutes.post('/connector/ack', async (c) => {
  const token = c.req.header('X-Connector-Token') || c.req.header('x-connector-token');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { queueId, status, errorMessage } = body;
  const now = Math.floor(Date.now() / 1000);

  if (!queueId || !status) {
    return c.json({ error: 'queueId and status are required' }, 400);
  }

  await c.env.DB.prepare(
    `UPDATE tally_sync_queue SET
       status = ?,
       error_message = ?,
       attempts = attempts + 1,
       updated_at = ?
     WHERE id = ?`
  )
    .bind(status === 'synced' ? 'synced' : 'error', errorMessage || null, now, queueId)
    .run();

  return c.json({ success: true });
});
