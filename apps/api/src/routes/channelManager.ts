import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const channelManagerRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

channelManagerRoutes.use('*', authMiddleware, tenantMiddleware);

// Get all OTA connections for property
channelManagerRoutes.get('/connections', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let sql = `SELECT * FROM ota_connections WHERE tenant_id = ?`;
  const params: any[] = [tenantId];
  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }

  const rows = await c.env.DB.prepare(sql).bind(...params).all();

  // Standard channels supported
  const standardChannels = [
    { name: 'booking_com', title: 'Booking.com', icon: '🏨', isLive: false },
    { name: 'agoda', title: 'Agoda', icon: '🌏', isLive: false },
    { name: 'makemytrip', title: 'MakeMyTrip / Goibibo', icon: '🇮🇳', isLive: false },
    { name: 'airbnb', title: 'Airbnb', icon: '🏡', isLive: false },
    { name: 'expedia', title: 'Expedia Partner Solutions', icon: '✈️', isLive: false },
  ];

  return c.json({
    connections: rows.results || [],
    standardChannels,
  });
});

// Connect or update channel
channelManagerRoutes.post('/connections', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const { propertyId, channelName, hotelChannelId } = body;

  if (!propertyId || !channelName) {
    return c.json({ error: 'Property ID and Channel Name are required' }, 400);
  }

  // Free / Starter plan restriction: Channel manager is locked
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

  const id = `conn_${crypto.randomUUID()}`;

  await c.env.DB.prepare(
    `INSERT INTO ota_connections (
      id, property_id, tenant_id, channel_name, status, hotel_channel_id,
      sync_rate_enabled, sync_inventory_enabled, sync_bookings_enabled,
      last_sync_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'connected', ?, 1, 1, 1, ?, ?, ?)
    ON CONFLICT(property_id, channel_name) DO UPDATE SET
      status = 'connected',
      hotel_channel_id = excluded.hotel_channel_id,
      last_sync_at = excluded.last_sync_at,
      updated_at = excluded.updated_at`
  )
    .bind(id, propertyId, tenantId, channelName, hotelChannelId || 'TEST_HOTEL_ID', now, now, now)
    .run();

  await recordAuditLog(c, {
    action: 'ota.connected',
    resourceType: 'ota_connection',
    resourceId: id,
    newValues: { channelName, hotelChannelId },
  });

  return c.json({ success: true, message: `Connected to ${channelName} (Adapter in simulation/test mode)` });
});

// Trigger sync job (Rates & Inventory Push)
channelManagerRoutes.post('/sync/:connectionId', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const connectionId = c.req.param('connectionId');
  const body = await c.req.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);

  const connection: any = await c.env.DB.prepare(
    'SELECT * FROM ota_connections WHERE id = ? AND tenant_id = ?'
  )
    .bind(connectionId, tenantId)
    .first();

  if (!connection) {
    return c.json({ error: 'Channel connection not found' }, 404);
  }

  const jobId = `sync_${crypto.randomUUID()}`;
  const eventId = `evt_${crypto.randomUUID()}`;
  const jobType = body.jobType || 'rates_and_inventory_push';

  // Record sync job and sync event
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO sync_jobs (
        id, connection_id, property_id, tenant_id, job_type, status,
        payload, retry_count, started_at, finished_at, created_at
      ) VALUES (?, ?, ?, ?, ?, 'completed', ?, 0, ?, ?, ?)`
    ).bind(
      jobId,
      connectionId,
      connection.property_id,
      tenantId,
      jobType,
      JSON.stringify({ note: 'Simulated OTA sync executed cleanly', channel: connection.channel_name }),
      now,
      now,
      now
    ),
    c.env.DB.prepare(
      `INSERT INTO sync_events (
        id, job_id, connection_id, property_id, tenant_id, event_type, payload, created_at
      ) VALUES (?, ?, ?, ?, ?, 'inventory_updated', ?, ?)`
    ).bind(
      eventId,
      jobId,
      connectionId,
      connection.property_id,
      tenantId,
      JSON.stringify({ status: 'success', syncedAt: new Date().toISOString() }),
      now
    ),
    c.env.DB.prepare(
      `UPDATE ota_connections SET last_sync_at = ?, updated_at = ? WHERE id = ?`
    ).bind(now, now, connectionId),
  ]);

  return c.json({
    success: true,
    jobId,
    status: 'completed',
    channel: connection.channel_name,
    message: `Successfully synchronized rates and availability with ${connection.channel_name} (Adapter test mode).`,
  });
});

// Sync history & logs
channelManagerRoutes.get('/history', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

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
  sql += ` ORDER BY sj.created_at DESC LIMIT 50`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ history: rows.results || [] });
});
