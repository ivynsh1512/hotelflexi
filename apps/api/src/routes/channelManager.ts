import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';
import {
  calculateDateInventory,
  getInventoryMatrix,
  bulkUpdateRatesAndRestrictions,
  checkOversellSafety,
} from '../services/inventoryEngine';
import {
  enqueueSyncJob,
  executeSyncJob,
  retrySyncJob,
  broadcastInventoryChange,
} from '../services/syncEngine';
import { processOtaReservationEvent } from '../services/channelReservationService';

export const channelManagerRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

channelManagerRoutes.use('*', authMiddleware, tenantMiddleware);

// -----------------------------------------------------------------------------
// 1. GET ALL OTA CONNECTIONS FOR PROPERTY
// -----------------------------------------------------------------------------
channelManagerRoutes.get('/connections', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let sql = `SELECT id, property_id, tenant_id, channel_name, status, hotel_channel_id,
                    sync_rate_enabled, sync_inventory_enabled, sync_bookings_enabled,
                    environment, last_sync_at, last_successful_sync_at, consecutive_failures,
                    error_message, created_at, updated_at
             FROM ota_connections WHERE tenant_id = ?`;
  const params: any[] = [tenantId];
  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }
  sql += ` ORDER BY created_at ASC`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();

  // Supported standard channels metadata
  const standardChannels = [
    { name: 'booking_com', title: 'Booking.com', category: 'Global OTA', isLiveCapable: true },
    { name: 'agoda', title: 'Agoda', category: 'Asia-Pacific OTA', isLiveCapable: true },
    { name: 'makemytrip', title: 'MakeMyTrip / Goibibo', category: 'Domestic Indian OTA', isLiveCapable: true },
    { name: 'airbnb', title: 'Airbnb', category: 'Vacation & Homestays', isLiveCapable: true },
    { name: 'expedia', title: 'Expedia Group', category: 'Global Distribution', isLiveCapable: true },
  ];

  return c.json({
    connections: rows.results || [],
    standardChannels,
  });
});

// -----------------------------------------------------------------------------
// 2. CONNECT OR UPDATE OTA CONNECTION
// -----------------------------------------------------------------------------
channelManagerRoutes.post('/connections', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const {
    propertyId,
    channelName,
    hotelChannelId,
    environment = 'sandbox',
    apiKey,
    apiSecret,
  } = body;

  if (!propertyId || !channelName) {
    return c.json({ error: 'Property ID and Channel Name are required' }, 400);
  }

  // Verify property ownership
  const propCheck: any = await c.env.DB.prepare(
    `SELECT id, name FROM properties WHERE id = ? AND tenant_id = ?`
  )
    .bind(propertyId, tenantId)
    .first();

  if (!propCheck) {
    return c.json({ error: 'Property not found or unauthorized' }, 404);
  }

  // Free / Starter plan restriction check
  const entitlements: any = await c.env.DB.prepare(
    'SELECT has_channel_manager, max_channel_connections FROM feature_entitlements WHERE tenant_id = ?'
  )
    .bind(tenantId)
    .first();

  if (!entitlements || !entitlements.has_channel_manager || entitlements.max_channel_connections <= 0) {
    return c.json(
      {
        error: 'OTA Channel Manager is not included in the free Starter plan. Upgrade to Essential, Growth, or Pro to sync OTAs.',
        requiresUpgrade: true,
      },
      403
    );
  }

  // Store credentials securely in credentials_json
  let credsJson: string | null = null;
  if (apiKey || apiSecret) {
    credsJson = JSON.stringify({
      apiKey: apiKey || '',
      apiSecret: apiSecret || '',
      configuredAt: now,
    });
  }

  const id = `conn_${crypto.randomUUID()}`;

  await c.env.DB.prepare(
    `INSERT INTO ota_connections (
      id, property_id, tenant_id, channel_name, status, hotel_channel_id,
      sync_rate_enabled, sync_inventory_enabled, sync_bookings_enabled,
      environment, credentials_json, consecutive_failures,
      last_sync_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'connected', ?, 1, 1, 1, ?, ?, 0, ?, ?, ?)
    ON CONFLICT(property_id, channel_name) DO UPDATE SET
      status = 'connected',
      hotel_channel_id = excluded.hotel_channel_id,
      environment = excluded.environment,
      credentials_json = COALESCE(excluded.credentials_json, credentials_json),
      consecutive_failures = 0,
      updated_at = excluded.updated_at`
  )
    .bind(
      id,
      propertyId,
      tenantId,
      channelName,
      hotelChannelId || `${channelName.toUpperCase()}_HOTEL`,
      environment,
      credsJson,
      now,
      now,
      now
    )
    .run();

  await recordAuditLog(c, {
    action: 'ota.connected',
    resourceType: 'ota_connection',
    resourceId: id,
    newValues: { channelName, hotelChannelId, environment },
  });

  return c.json({
    success: true,
    message: `Connected to ${channelName} in ${environment} mode.`,
  });
});

// -----------------------------------------------------------------------------
// 3. DISCONNECT OTA CONNECTION
// -----------------------------------------------------------------------------
channelManagerRoutes.delete('/connections/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);

  const res = await c.env.DB.prepare(
    `UPDATE ota_connections SET status = 'disconnected', updated_at = ? WHERE id = ? AND tenant_id = ?`
  )
    .bind(now, id, tenantId)
    .run();

  if (res.meta.changes === 0) {
    return c.json({ error: 'Connection not found or unauthorized' }, 404);
  }

  return c.json({ success: true, message: 'Channel connection disconnected.' });
});

// -----------------------------------------------------------------------------
// 4. INVENTORY & RESTRICTIONS MATRIX (Single Source of Truth)
// -----------------------------------------------------------------------------
channelManagerRoutes.get('/inventory-matrix', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const roomTypeId = c.req.query('room_type_id');
  const startDate = c.req.query('start_date') || new Date().toISOString().split('T')[0];

  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 14);
  const endDate = c.req.query('end_date') || defaultEnd.toISOString().split('T')[0];

  if (!propertyId) {
    return c.json({ error: 'property_id is required' }, 400);
  }

  try {
    const data = await getInventoryMatrix(
      c.env.DB,
      propertyId,
      tenantId,
      startDate,
      endDate,
      roomTypeId
    );
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to calculate inventory matrix' }, 400);
  }
});

// -----------------------------------------------------------------------------
// 5. BULK UPDATE RATES, RESTRICTIONS & INVENTORY
// -----------------------------------------------------------------------------
channelManagerRoutes.post('/bulk-update', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();

  try {
    const result = await bulkUpdateRatesAndRestrictions(c.env.DB, tenantId, body);

    // Broadcast update across all connected OTA channels
    const broadcastResult = await broadcastInventoryChange(
      c.env.DB,
      body.propertyId,
      tenantId,
      body.roomTypeId,
      body.startDate,
      body.endDate
    );

    return c.json({
      success: true,
      message: `Updated rates and restrictions across ${result.updatedDatesCount} date(s). Enqueued ${broadcastResult.enqueuedCount} OTA sync jobs.`,
      updatedDatesCount: result.updatedDatesCount,
      enqueuedSyncJobs: broadcastResult.enqueuedCount,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Bulk update failed' }, 400);
  }
});

// -----------------------------------------------------------------------------
// 6. TRIGGER ON-DEMAND SYNC JOB
// -----------------------------------------------------------------------------
channelManagerRoutes.post('/sync/:connectionId', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const connectionId = c.req.param('connectionId');
  const body = await c.req.json().catch(() => ({}));

  const connection: any = await c.env.DB.prepare(
    `SELECT * FROM ota_connections WHERE id = ? AND tenant_id = ?`
  )
    .bind(connectionId, tenantId)
    .first();

  if (!connection) {
    return c.json({ error: 'Channel connection not found' }, 404);
  }

  const jobType = body.jobType || 'full_sync';

  // Enqueue job with idempotency protection
  const enq = await enqueueSyncJob(c.env.DB, {
    connectionId,
    propertyId: connection.property_id,
    tenantId,
    jobType,
    channelName: connection.channel_name,
    payload: body,
  });

  // Execute synchronously
  const execResult = await executeSyncJob(c.env.DB, enq.jobId);

  return c.json({
    success: execResult.status === 'completed',
    jobId: enq.jobId,
    status: execResult.status,
    message: execResult.message,
    isSimulated: execResult.isSimulated,
    retryCount: execResult.retryCount,
  });
});

// -----------------------------------------------------------------------------
// 7. SYNC QUEUE & JOBS MONITOR
// -----------------------------------------------------------------------------
channelManagerRoutes.get('/jobs', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const status = c.req.query('status');

  let sql = `
    SELECT sj.*, oc.channel_name
    FROM sync_jobs sj
    JOIN ota_connections oc ON oc.id = sj.connection_id
    WHERE sj.tenant_id = ?
  `;
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ` AND sj.property_id = ?`;
    params.push(propertyId);
  }
  if (status) {
    sql += ` AND sj.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY sj.created_at DESC LIMIT 50`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ jobs: rows.results || [] });
});

// -----------------------------------------------------------------------------
// 8. RETRY FAILED OR STALLED SYNC JOB
// -----------------------------------------------------------------------------
channelManagerRoutes.post('/jobs/:id/retry', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const jobId = c.req.param('id');

  try {
    const execResult = await retrySyncJob(c.env.DB, jobId, tenantId);
    return c.json({
      success: execResult.status === 'completed',
      jobId,
      status: execResult.status,
      message: execResult.message,
      isSimulated: execResult.isSimulated,
      retryCount: execResult.retryCount,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Retry failed' }, 400);
  }
});

// -----------------------------------------------------------------------------
// 9. SYNC HISTORY & RECENT AUDIT LEDGER
// -----------------------------------------------------------------------------
channelManagerRoutes.get('/history', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let sql = `
    SELECT se.*, oc.channel_name, sj.job_type, sj.status as job_status
    FROM sync_events se
    JOIN ota_connections oc ON oc.id = se.connection_id
    LEFT JOIN sync_jobs sj ON sj.id = se.job_id
    WHERE se.tenant_id = ?
  `;
  const params: any[] = [tenantId];
  if (propertyId) {
    sql += ` AND se.property_id = ?`;
    params.push(propertyId);
  }
  sql += ` ORDER BY se.created_at DESC LIMIT 50`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ history: rows.results || [] });
});

// -----------------------------------------------------------------------------
// 10. SIMULATE INCOMING OTA RESERVATION (For Testing & Concurrency Verification)
// -----------------------------------------------------------------------------
channelManagerRoutes.post('/simulate-booking', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();

  const {
    connectionId,
    bookingRef = `OTA-REF-${Math.floor(100000 + Math.random() * 900000)}`,
    guestName = 'Test OTA Guest',
    roomTypeId,
    checkInDate,
    checkOutDate,
    status = 'confirmed',
    totalAmountPaise = 350000,
  } = body;

  if (!connectionId || !roomTypeId || !checkInDate || !checkOutDate) {
    return c.json({ error: 'connectionId, roomTypeId, checkInDate, and checkOutDate are required' }, 400);
  }

  const result = await processOtaReservationEvent(c.env.DB, tenantId, connectionId, {
    channelBookingRef: bookingRef,
    channelName: body.channelName || 'simulated',
    status,
    guestName,
    checkInDate,
    checkOutDate,
    roomTypeId,
    adults: body.adults || 2,
    children: body.children || 0,
    nightlyRatePaise: Math.round(totalAmountPaise / 1),
    totalAmountPaise,
    currency: 'INR',
  });

  return c.json(result);
});
