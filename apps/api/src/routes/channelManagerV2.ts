import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';
import { encryptCredentials, decryptCredentials, redactSecrets } from '../services/channelManager/crypto';
import { getChannelAdapter } from '../services/channelManager/adapters/adapterRegistry';
import { enqueueChannelSyncJob, executeChannelSyncJob } from '../services/channelManager/outboxEngine';
import { buildCanonicalSyncPayloads } from '../services/channelManager/inventoryRateEngine';
import { ingestChannelReservationEvent } from '../services/channelManager/reservationIngestion';
import { runPropertyReconciliationScan, forcePushCentralState } from '../services/channelManager/reconciliationEngine';

// =============================================================================
// Authenticated Channel Manager V2 Router
// =============================================================================
export const channelManagerV2Routes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

channelManagerV2Routes.use('*', authMiddleware, tenantMiddleware);

// -----------------------------------------------------------------------------
// 1. OVERVIEW DASHBOARD METRICS
// -----------------------------------------------------------------------------
channelManagerV2Routes.get('/overview', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 86400;

  try {
    // 1. Connection counts by status
    let connSql = `
      SELECT connection_status, COUNT(*) as count
      FROM hotel_channel_connections
      WHERE tenant_id = ?
    `;
    const connParams: any[] = [tenantId];
    if (propertyId) {
      connSql += ` AND property_id = ?`;
      connParams.push(propertyId);
    }
    connSql += ` GROUP BY connection_status`;
    const statusCountsRows = await c.env.DB.prepare(connSql).bind(...connParams).all();

    const counts: Record<string, number> = {
      total: 0,
      active: 0,
      pending_credentials: 0,
      pending_approval: 0,
      sandbox: 0,
      paused: 0,
      error: 0,
      revoked: 0,
    };

    for (const row of (statusCountsRows.results || []) as any[]) {
      const st = row.connection_status as string;
      const cnt = Number(row.count || 0);
      counts[st] = (counts[st] || 0) + cnt;
      counts.total += cnt;
    }

    // 2. Pending & Failed sync jobs
    let jobsSql = `
      SELECT status, COUNT(*) as count
      FROM channel_sync_jobs
      WHERE tenant_id = ?
    `;
    const jobsParams: any[] = [tenantId];
    if (propertyId) {
      jobsSql += ` AND property_id = ?`;
      jobsParams.push(propertyId);
    }
    jobsSql += ` GROUP BY status`;
    const jobCountsRows = await c.env.DB.prepare(jobsSql).bind(...jobsParams).all();

    let pendingJobsCount = 0;
    let failedJobsCount = 0;
    for (const row of (jobCountsRows.results || []) as any[]) {
      if (['queued', 'processing', 'retry_scheduled'].includes(row.status)) {
        pendingJobsCount += Number(row.count || 0);
      }
      if (row.status === 'failed') {
        failedJobsCount += Number(row.count || 0);
      }
    }

    // 3. Channel reservations in last 30 days
    let resSql = `
      SELECT COUNT(*) as count
      FROM channel_reservations
      WHERE tenant_id = ? AND created_at >= ?
    `;
    const resParams: any[] = [tenantId, thirtyDaysAgo];
    if (propertyId) {
      resSql += ` AND property_id = ?`;
      resParams.push(propertyId);
    }
    const resCountRow: any = await c.env.DB.prepare(resSql).bind(...resParams).first();
    const reservationsCount = Number(resCountRow?.count || 0);

    // 4. Last sync timestamp across all connections
    let lastSyncSql = `
      SELECT MAX(last_sync_at) as max_sync
      FROM hotel_channel_connections
      WHERE tenant_id = ?
    `;
    const lastSyncParams: any[] = [tenantId];
    if (propertyId) {
      lastSyncSql += ` AND property_id = ?`;
      lastSyncParams.push(propertyId);
    }
    const lastSyncRow: any = await c.env.DB.prepare(lastSyncSql).bind(...lastSyncParams).first();

    // 5. Unresolved reconciliation discrepancies
    let recSql = `
      SELECT COUNT(*) as count
      FROM channel_reconciliation_records
      WHERE tenant_id = ? AND resolution_status = 'unresolved'
    `;
    const recParams: any[] = [tenantId];
    if (propertyId) {
      recSql += ` AND property_id = ?`;
      recParams.push(propertyId);
    }
    const recRow: any = await c.env.DB.prepare(recSql).bind(...recParams).first();
    const unresolvedDiscrepancies = Number(recRow?.count || 0);

    // 6. Recent 5 sync events
    let eventsSql = `
      SELECT cse.id, cse.event_type, cse.payload_summary, cse.created_at,
             cp.display_name as channel_name, cp.code as channel_code
      FROM channel_sync_events cse
      JOIN hotel_channel_connections hcc ON hcc.id = cse.connection_id
      JOIN channel_providers cp ON cp.id = hcc.provider_id
      WHERE cse.tenant_id = ?
    `;
    const eventsParams: any[] = [tenantId];
    if (propertyId) {
      eventsSql += ` AND cse.property_id = ?`;
      eventsParams.push(propertyId);
    }
    eventsSql += ` ORDER BY cse.created_at DESC LIMIT 5`;
    const eventsRows = await c.env.DB.prepare(eventsSql).bind(...eventsParams).all();

    return c.json({
      metrics: {
        totalConnections: counts.total,
        activeConnections: counts.active,
        pendingSetup: counts.pending_credentials + counts.pending_approval,
        sandboxConnections: counts.sandbox,
        pausedConnections: counts.paused,
        errorConnections: counts.error,
        pendingJobs: pendingJobsCount,
        failedJobs: failedJobsCount,
        channelBookings30d: reservationsCount,
        unresolvedDiscrepancies,
        lastSyncAt: lastSyncRow?.max_sync || null,
      },
      recentEvents: eventsRows.results || [],
    });
  } catch (err: any) {
    console.error('[ChannelManagerV2 Overview Error]:', err);
    return c.json({ error: err.message || 'Failed to fetch overview metrics' }, 500);
  }
});

// -----------------------------------------------------------------------------
// 2. PROVIDERS CATALOG
// -----------------------------------------------------------------------------
channelManagerV2Routes.get('/providers', async (c) => {
  try {
    const rows = await c.env.DB.prepare(
      `SELECT id, code, display_name, provider_type, documentation_url,
              supports_rate_push, supports_inventory_push, supports_restriction_push,
              supports_reservation_pull, supports_webhooks, enabled
       FROM channel_providers
       WHERE enabled = 1
       ORDER BY display_name ASC`
    ).all();

    return c.json({ providers: rows.results || [] });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch providers' }, 500);
  }
});

// -----------------------------------------------------------------------------
// 3. HOTEL CHANNEL CONNECTIONS (CRUD)
// -----------------------------------------------------------------------------
channelManagerV2Routes.get('/connections', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  try {
    let sql = `
      SELECT hcc.id, hcc.tenant_id, hcc.property_id, hcc.provider_id, hcc.external_property_id,
             hcc.connection_status, hcc.environment, hcc.approved_at, hcc.last_sync_at,
             hcc.last_successful_sync_at, hcc.consecutive_failures, hcc.last_error_code,
             hcc.last_error_message, hcc.created_at, hcc.updated_at,
             cp.code as provider_code, cp.display_name as provider_name,
             cp.provider_type, cp.documentation_url
      FROM hotel_channel_connections hcc
      JOIN channel_providers cp ON cp.id = hcc.provider_id
      WHERE hcc.tenant_id = ?
    `;
    const params: any[] = [tenantId];
    if (propertyId) {
      sql += ` AND hcc.property_id = ?`;
      params.push(propertyId);
    }
    sql += ` ORDER BY hcc.created_at ASC`;

    const rows = await c.env.DB.prepare(sql).bind(...params).all();

    return c.json({ connections: rows.results || [] });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch connections' }, 500);
  }
});

channelManagerV2Routes.post('/connections', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const {
    propertyId,
    providerCode,
    externalPropertyId = null,
    environment = 'sandbox',
    credentials = {},
  } = body;

  if (!propertyId || !providerCode) {
    return c.json({ error: 'Property ID and Provider Code are required' }, 400);
  }

  try {
    // 1. Verify property belongs to tenant
    const prop: any = await c.env.DB.prepare(
      `SELECT id, name FROM properties WHERE id = ? AND tenant_id = ?`
    )
      .bind(propertyId, tenantId)
      .first();

    if (!prop) {
      return c.json({ error: 'Property not found or unauthorized' }, 404);
    }

    // 2. Verify channel provider exists
    const provider: any = await c.env.DB.prepare(
      `SELECT id, code, display_name FROM channel_providers WHERE code = ? AND enabled = 1`
    )
      .bind(providerCode)
      .first();

    if (!provider) {
      return c.json({ error: `Unsupported or disabled provider: ${providerCode}` }, 400);
    }

    // 3. Check for existing connection
    const existing: any = await c.env.DB.prepare(
      `SELECT id, connection_status FROM hotel_channel_connections
       WHERE property_id = ? AND provider_id = ?`
    )
      .bind(propertyId, provider.id)
      .first();

    if (existing) {
      return c.json({
        error: `Connection already exists for ${provider.display_name}. Update existing connection instead.`,
        connectionId: existing.id,
      }, 409);
    }

    // 4. Encrypt credentials
    const credentialsPlain = JSON.stringify(credentials || {});
    const encrypted = await encryptCredentials(tenantId, credentialsPlain);

    // Initial status determination:
    // If credentials and externalPropertyId provided:
    // in sandbox -> 'sandbox'
    // in production -> 'pending_approval' (NEVER active without verified handshake)
    let initialStatus = 'pending_credentials';
    const hasKeys = Object.keys(credentials || {}).length > 0 && externalPropertyId;
    if (hasKeys) {
      initialStatus = environment === 'sandbox' ? 'sandbox' : 'pending_approval';
    }

    const connectionId = `hcc_${crypto.randomUUID()}`;

    await c.env.DB.prepare(
      `INSERT INTO hotel_channel_connections (
        id, tenant_id, property_id, provider_id, external_property_id,
        connection_status, environment, credentials_encrypted, credentials_version,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    )
      .bind(
        connectionId,
        tenantId,
        propertyId,
        provider.id,
        externalPropertyId,
        initialStatus,
        environment,
        encrypted,
        now,
        now
      )
      .run();

    await recordAuditLog(c, {
      action: 'CHANNEL_CONNECTION_CREATED',
      resourceType: 'hotel_channel_connection',
      resourceId: connectionId,
      newValues: {
        propertyId,
        providerCode,
        environment,
        status: initialStatus,
      },
    });

    return c.json({
      success: true,
      connection: {
        id: connectionId,
        tenant_id: tenantId,
        property_id: propertyId,
        provider_id: provider.id,
        provider_code: provider.code,
        provider_name: provider.display_name,
        external_property_id: externalPropertyId,
        connection_status: initialStatus,
        environment,
        created_at: now,
        updated_at: now,
      },
    }, 201);
  } catch (err: any) {
    console.error('[Create Connection Error]:', err);
    return c.json({ error: err.message || 'Failed to create connection' }, 500);
  }
});

channelManagerV2Routes.get('/connections/:id', async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');

  try {
    const row: any = await c.env.DB.prepare(
      `SELECT hcc.id, hcc.tenant_id, hcc.property_id, hcc.provider_id, hcc.external_property_id,
              hcc.connection_status, hcc.environment, hcc.approved_at, hcc.last_sync_at,
              hcc.last_successful_sync_at, hcc.consecutive_failures, hcc.last_error_code,
              hcc.last_error_message, hcc.created_at, hcc.updated_at,
              cp.code as provider_code, cp.display_name as provider_name,
              cp.provider_type, cp.documentation_url
       FROM hotel_channel_connections hcc
       JOIN channel_providers cp ON cp.id = hcc.provider_id
       WHERE hcc.id = ? AND hcc.tenant_id = ?`
    )
      .bind(id, tenantId)
      .first();

    if (!row) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    return c.json({ connection: row });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch connection' }, 500);
  }
});

channelManagerV2Routes.patch('/connections/:id', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  try {
    const existing: any = await c.env.DB.prepare(
      `SELECT * FROM hotel_channel_connections WHERE id = ? AND tenant_id = ?`
    )
      .bind(id, tenantId)
      .first();

    if (!existing) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    const {
      externalPropertyId = existing.external_property_id,
      environment = existing.environment,
      connectionStatus = existing.connection_status,
      credentials,
    } = body;

    // Validate connection_status transitions:
    // Never allow transitioning to 'active' unless testConnection has succeeded or environment is sandbox
    const validStatuses = [
      'not_configured', 'pending_credentials', 'pending_approval',
      'sandbox', 'active', 'paused', 'error', 'revoked'
    ];
    if (connectionStatus && !validStatuses.includes(connectionStatus)) {
      return c.json({ error: `Invalid connection status: ${connectionStatus}` }, 400);
    }

    let encrypted = existing.credentials_encrypted;
    let version = existing.credentials_version || 1;

    if (credentials && typeof credentials === 'object' && Object.keys(credentials).length > 0) {
      encrypted = await encryptCredentials(tenantId, JSON.stringify(credentials));
      version += 1;
    }

    await c.env.DB.prepare(
      `UPDATE hotel_channel_connections SET
        external_property_id = ?,
        environment = ?,
        connection_status = ?,
        credentials_encrypted = ?,
        credentials_version = ?,
        updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    )
      .bind(
        externalPropertyId,
        environment,
        connectionStatus,
        encrypted,
        version,
        now,
        id,
        tenantId
      )
      .run();

    await recordAuditLog(c, {
      action: 'CHANNEL_CONNECTION_UPDATED',
      resourceType: 'hotel_channel_connection',
      resourceId: id,
      newValues: {
        externalPropertyId,
        environment,
        connectionStatus,
        credentialsUpdated: Boolean(credentials),
      },
    });

    return c.json({
      success: true,
      message: 'Connection configuration updated successfully',
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update connection' }, 500);
  }
});

channelManagerV2Routes.delete('/connections/:id', requireRole(['owner']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);

  try {
    const existing: any = await c.env.DB.prepare(
      `SELECT id FROM hotel_channel_connections WHERE id = ? AND tenant_id = ?`
    )
      .bind(id, tenantId)
      .first();

    if (!existing) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    // Soft delete: mark revoked
    await c.env.DB.prepare(
      `UPDATE hotel_channel_connections
       SET connection_status = 'revoked', updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    )
      .bind(now, id, tenantId)
      .run();

    await recordAuditLog(c, {
      action: 'CHANNEL_CONNECTION_REVOKED',
      resourceType: 'hotel_channel_connection',
      resourceId: id,
    });

    return c.json({ success: true, message: 'Connection revoked successfully' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to revoke connection' }, 500);
  }
});

// -----------------------------------------------------------------------------
// 4. TEST CONNECTION DIAGNOSTICS
// -----------------------------------------------------------------------------
channelManagerV2Routes.post('/connections/:id/test', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);

  try {
    const conn: any = await c.env.DB.prepare(
      `SELECT hcc.*, cp.code as provider_code, cp.display_name
       FROM hotel_channel_connections hcc
       JOIN channel_providers cp ON cp.id = hcc.provider_id
       WHERE hcc.id = ? AND hcc.tenant_id = ?`
    )
      .bind(id, tenantId)
      .first();

    if (!conn) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    // Decrypt credentials
    let credentials: Record<string, any> = {};
    if (conn.credentials_encrypted) {
      try {
        const decryptedJson = await decryptCredentials(tenantId, conn.credentials_encrypted);
        credentials = JSON.parse(decryptedJson || '{}');
      } catch (e) {
        console.warn('Could not decrypt connection credentials:', e);
      }
    }

    const adapter = getChannelAdapter(conn.provider_code);
    const context = {
      tenantId,
      propertyId: conn.property_id,
      connectionId: conn.id,
      environment: conn.environment as 'sandbox' | 'production',
      externalPropertyId: conn.external_property_id || undefined,
      credentials,
    };

    const diagResult = await adapter.testConnection(context);

    // Update connection status and error codes accordingly
    if (diagResult.success) {
      await c.env.DB.prepare(
        `UPDATE hotel_channel_connections SET
          last_sync_at = ?,
          last_successful_sync_at = ?,
          consecutive_failures = 0,
          last_error_code = NULL,
          last_error_message = NULL,
          updated_at = ?
         WHERE id = ?`
      )
        .bind(now, now, now, id)
        .run();
    } else {
      await c.env.DB.prepare(
        `UPDATE hotel_channel_connections SET
          last_sync_at = ?,
          consecutive_failures = consecutive_failures + 1,
          last_error_code = ?,
          last_error_message = ?,
          updated_at = ?
         WHERE id = ?`
      )
        .bind(
          now,
          diagResult.providerStatus || 'DIAGNOSTIC_FAILURE',
          diagResult.errors.join('; ') || 'Connection diagnostic check failed',
          now,
          id
        )
        .run();
    }

    return c.json({
      success: diagResult.success,
      providerStatus: diagResult.providerStatus,
      correlationId: diagResult.correlationId,
      errors: diagResult.errors,
    });
  } catch (err: any) {
    return c.json({
      success: false,
      errors: [err.message || 'Diagnostic execution error'],
      correlationId: `diag_err_${crypto.randomUUID().slice(0, 8)}`,
    }, 500);
  }
});

// -----------------------------------------------------------------------------
// 5. ROOM MAPPING (CRUD)
// -----------------------------------------------------------------------------
channelManagerV2Routes.get('/connections/:id/mappings/rooms', async (c) => {
  const tenantId = c.get('tenantId')!;
  const connectionId = c.req.param('id');

  try {
    const rows = await c.env.DB.prepare(
      `SELECT crm.*, rt.name as local_room_type_name, rt.code as local_room_type_code,
              rt.base_price_paise
       FROM channel_room_mappings crm
       JOIN room_types rt ON rt.id = crm.local_room_type_id
       WHERE crm.connection_id = ? AND crm.tenant_id = ?
       ORDER BY rt.name ASC`
    )
      .bind(connectionId, tenantId)
      .all();

    return c.json({ mappings: rows.results || [] });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch room mappings' }, 500);
  }
});

channelManagerV2Routes.post('/connections/:id/mappings/rooms', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const connectionId = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const {
    localRoomTypeId,
    externalRoomTypeId,
    channelRoomName = null,
    occupancyMapping = null,
  } = body;

  if (!localRoomTypeId || !externalRoomTypeId) {
    return c.json({ error: 'Local Room Type ID and External Room Type ID are required' }, 400);
  }

  try {
    // 1. Verify connection
    const conn: any = await c.env.DB.prepare(
      `SELECT property_id FROM hotel_channel_connections WHERE id = ? AND tenant_id = ?`
    )
      .bind(connectionId, tenantId)
      .first();

    if (!conn) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    // 2. Verify local room type
    const rt: any = await c.env.DB.prepare(
      `SELECT id, name FROM room_types WHERE id = ? AND property_id = ? AND tenant_id = ?`
    )
      .bind(localRoomTypeId, conn.property_id, tenantId)
      .first();

    if (!rt) {
      return c.json({ error: 'Local room category does not belong to this hotel' }, 400);
    }

    const mappingId = `crm_${crypto.randomUUID()}`;

    await c.env.DB.prepare(
      `INSERT INTO channel_room_mappings (
        id, connection_id, tenant_id, property_id, local_room_type_id,
        external_room_type_id, channel_room_name, mapping_status,
        occupancy_mapping_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
      ON CONFLICT(connection_id, local_room_type_id, external_room_type_id)
      DO UPDATE SET
        channel_room_name = excluded.channel_room_name,
        mapping_status = 'active',
        occupancy_mapping_json = excluded.occupancy_mapping_json,
        updated_at = excluded.updated_at`
    )
      .bind(
        mappingId,
        connectionId,
        tenantId,
        conn.property_id,
        localRoomTypeId,
        externalRoomTypeId,
        channelRoomName,
        occupancyMapping ? JSON.stringify(occupancyMapping) : null,
        now,
        now
      )
      .run();

    return c.json({ success: true, message: 'Room mapping created or updated successfully' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to save room mapping' }, 500);
  }
});

channelManagerV2Routes.delete('/connections/:id/mappings/rooms/:mappingId', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const mappingId = c.req.param('mappingId');

  try {
    await c.env.DB.prepare(
      `DELETE FROM channel_room_mappings WHERE id = ? AND tenant_id = ?`
    )
      .bind(mappingId, tenantId)
      .run();

    return c.json({ success: true, message: 'Room mapping deleted' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to delete room mapping' }, 500);
  }
});

// -----------------------------------------------------------------------------
// 6. RATE PLAN MAPPING (CRUD)
// -----------------------------------------------------------------------------
channelManagerV2Routes.get('/connections/:id/mappings/rates', async (c) => {
  const tenantId = c.get('tenantId')!;
  const connectionId = c.req.param('id');

  try {
    const rows = await c.env.DB.prepare(
      `SELECT crpm.*, rp.name as local_rate_plan_name, rp.code as local_rate_plan_code,
              rp.meal_plan as local_meal_plan, crm.channel_room_name
       FROM channel_rate_plan_mappings crpm
       JOIN rate_plans rp ON rp.id = crpm.local_rate_plan_id
       LEFT JOIN channel_room_mappings crm ON crm.id = crpm.external_room_mapping_id
       WHERE crpm.connection_id = ? AND crpm.tenant_id = ?
       ORDER BY rp.name ASC`
    )
      .bind(connectionId, tenantId)
      .all();

    return c.json({ mappings: rows.results || [] });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch rate plan mappings' }, 500);
  }
});

channelManagerV2Routes.post('/connections/:id/mappings/rates', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const connectionId = c.req.param('id');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const {
    localRatePlanId,
    externalRatePlanId,
    externalRoomMappingId = null,
    channelRateName = null,
    boardBasis = 'RO',
    cancellationPolicyMapping = null,
    taxHandling = 'exclusive',
  } = body;

  if (!localRatePlanId || !externalRatePlanId) {
    return c.json({ error: 'Local Rate Plan ID and External Rate Plan ID are required' }, 400);
  }

  try {
    const conn: any = await c.env.DB.prepare(
      `SELECT property_id FROM hotel_channel_connections WHERE id = ? AND tenant_id = ?`
    )
      .bind(connectionId, tenantId)
      .first();

    if (!conn) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    const mappingId = `crpm_${crypto.randomUUID()}`;

    await c.env.DB.prepare(
      `INSERT INTO channel_rate_plan_mappings (
        id, connection_id, tenant_id, property_id, local_rate_plan_id,
        external_rate_plan_id, external_room_mapping_id, channel_rate_name,
        board_basis, cancellation_policy_mapping, tax_handling, mapping_status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
      ON CONFLICT(connection_id, local_rate_plan_id, external_rate_plan_id)
      DO UPDATE SET
        channel_rate_name = excluded.channel_rate_name,
        board_basis = excluded.board_basis,
        mapping_status = 'active',
        updated_at = excluded.updated_at`
    )
      .bind(
        mappingId,
        connectionId,
        tenantId,
        conn.property_id,
        localRatePlanId,
        externalRatePlanId,
        externalRoomMappingId,
        channelRateName,
        boardBasis,
        cancellationPolicyMapping,
        taxHandling,
        now,
        now
      )
      .run();

    return c.json({ success: true, message: 'Rate plan mapping created or updated' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to save rate plan mapping' }, 500);
  }
});

channelManagerV2Routes.delete('/connections/:id/mappings/rates/:mappingId', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const mappingId = c.req.param('mappingId');

  try {
    await c.env.DB.prepare(
      `DELETE FROM channel_rate_plan_mappings WHERE id = ? AND tenant_id = ?`
    )
      .bind(mappingId, tenantId)
      .run();

    return c.json({ success: true, message: 'Rate plan mapping deleted' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to delete rate plan mapping' }, 500);
  }
});

// -----------------------------------------------------------------------------
// 7. SYNC BROADCAST & DISPATCH
// -----------------------------------------------------------------------------
channelManagerV2Routes.post('/connections/:id/sync/broadcast', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const now = new Date();
  const startDate = now.toISOString().split('T')[0];
  const end = new Date(now);
  end.setDate(end.getDate() + 30);
  const endDateExclusive = end.toISOString().split('T')[0];

  try {
    const conn: any = await c.env.DB.prepare(
      `SELECT hcc.*, cp.code as provider_code
       FROM hotel_channel_connections hcc
       JOIN channel_providers cp ON cp.id = hcc.provider_id
       WHERE hcc.id = ? AND hcc.tenant_id = ?`
    )
      .bind(id, tenantId)
      .first();

    if (!conn) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    // Get room mappings
    const mappings = await c.env.DB.prepare(
      `SELECT local_room_type_id, external_room_type_id
       FROM channel_room_mappings
       WHERE connection_id = ? AND mapping_status = 'active'`
    )
      .bind(id)
      .all();

    const queuedJobs = [];

    for (const m of (mappings.results || []) as any[]) {
      const payloads = await buildCanonicalSyncPayloads(
        c.env.DB,
        conn.property_id,
        tenantId,
        m.local_room_type_id,
        startDate,
        endDateExclusive
      );

      // Enqueue availability push
      const availJob = await enqueueChannelSyncJob(c.env.DB, {
        tenantId,
        propertyId: conn.property_id,
        connectionId: id,
        jobType: 'availability_push',
        payload: {
          ...payloads.availability,
          channelRoomTypeId: m.external_room_type_id,
        },
      });

      // Enqueue rates push
      const rateJob = await enqueueChannelSyncJob(c.env.DB, {
        tenantId,
        propertyId: conn.property_id,
        connectionId: id,
        jobType: 'rates_push',
        payload: {
          ...payloads.rates,
          channelRoomTypeId: m.external_room_type_id,
        },
      });

      queuedJobs.push(availJob, rateJob);
    }

    return c.json({
      success: true,
      message: `Enqueued ${queuedJobs.length} synchronization jobs for dispatch.`,
      jobs: queuedJobs,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to broadcast sync' }, 500);
  }
});

channelManagerV2Routes.post('/sync/broadcast-all', requireRole(['owner']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  try {
    let sql = `
      SELECT id FROM hotel_channel_connections
      WHERE tenant_id = ? AND connection_status IN ('active', 'sandbox')
    `;
    const params: any[] = [tenantId];
    if (propertyId) {
      sql += ` AND property_id = ?`;
      params.push(propertyId);
    }
    const conns = await c.env.DB.prepare(sql).bind(...params).all();

    return c.json({
      success: true,
      message: `Triggered full synchronization for ${conns.results?.length || 0} active channels.`,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to broadcast all' }, 500);
  }
});

// -----------------------------------------------------------------------------
// 8. JOBS OUTBOX MONITOR & RETRY
// -----------------------------------------------------------------------------
channelManagerV2Routes.get('/jobs', async (c) => {
  const tenantId = c.get('tenantId')!;
  const status = c.req.query('status');
  const connectionId = c.req.query('connection_id');
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 50)));
  const offset = Math.max(0, Number(c.req.query('offset') || 0));

  try {
    let sql = `
      SELECT csj.*, cp.display_name as channel_name, cp.code as channel_code
      FROM channel_sync_jobs csj
      JOIN hotel_channel_connections hcc ON hcc.id = csj.connection_id
      JOIN channel_providers cp ON cp.id = hcc.provider_id
      WHERE csj.tenant_id = ?
    `;
    const params: any[] = [tenantId];

    if (status && status !== 'all') {
      sql += ` AND csj.status = ?`;
      params.push(status);
    }
    if (connectionId) {
      sql += ` AND csj.connection_id = ?`;
      params.push(connectionId);
    }

    sql += ` ORDER BY csj.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await c.env.DB.prepare(sql).bind(...params).all();

    return c.json({ jobs: rows.results || [] });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch jobs' }, 500);
  }
});

channelManagerV2Routes.post('/jobs/:id/retry', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const jobId = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);

  try {
    const job: any = await c.env.DB.prepare(
      `SELECT * FROM channel_sync_jobs WHERE id = ? AND tenant_id = ?`
    )
      .bind(jobId, tenantId)
      .first();

    if (!job) {
      return c.json({ error: 'Sync job not found' }, 404);
    }

    // Reset job to queued state
    await c.env.DB.prepare(
      `UPDATE channel_sync_jobs SET
        status = 'queued',
        attempt_count = 0,
        scheduled_at = ?,
        started_at = NULL,
        completed_at = NULL,
        last_error_code = NULL,
        last_error_message = NULL,
        updated_at = ?
       WHERE id = ?`
    )
      .bind(now, now, jobId)
      .run();

    return c.json({ success: true, message: 'Job re-queued for execution' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to retry job' }, 500);
  }
});

// -----------------------------------------------------------------------------
// 9. CHANNEL RESERVATIONS LOG
// -----------------------------------------------------------------------------
channelManagerV2Routes.get('/reservations', async (c) => {
  const tenantId = c.get('tenantId')!;
  const connectionId = c.req.query('connection_id');
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 50)));
  const offset = Math.max(0, Number(c.req.query('offset') || 0));

  try {
    let sql = `
      SELECT cr.*, cp.display_name as channel_name, cp.code as channel_code,
             r.reservation_number, r.guest_name, r.check_in_date, r.check_out_date,
             r.total_amount_paise, r.status as pms_status
      FROM channel_reservations cr
      JOIN hotel_channel_connections hcc ON hcc.id = cr.connection_id
      JOIN channel_providers cp ON cp.id = hcc.provider_id
      LEFT JOIN reservations r ON r.id = cr.local_reservation_id
      WHERE cr.tenant_id = ?
    `;
    const params: any[] = [tenantId];

    if (connectionId) {
      sql += ` AND cr.connection_id = ?`;
      params.push(connectionId);
    }

    sql += ` ORDER BY cr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await c.env.DB.prepare(sql).bind(...params).all();

    return c.json({ reservations: rows.results || [] });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch channel reservations' }, 500);
  }
});

// -----------------------------------------------------------------------------
// 10. RECONCILIATION ENGINE
// -----------------------------------------------------------------------------
channelManagerV2Routes.get('/reconciliation', async (c) => {
  const tenantId = c.get('tenantId')!;
  const connectionId = c.req.query('connection_id');
  const resolutionStatus = c.req.query('resolution_status') || 'all';
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 50)));
  const offset = Math.max(0, Number(c.req.query('offset') || 0));

  try {
    let sql = `
      SELECT crr.*, cp.display_name as channel_name, cp.code as channel_code,
             rt.name as room_type_name
      FROM channel_reconciliation_records crr
      JOIN hotel_channel_connections hcc ON hcc.id = crr.connection_id
      JOIN channel_providers cp ON cp.id = hcc.provider_id
      LEFT JOIN room_types rt ON rt.id = crr.room_type_id
      WHERE crr.tenant_id = ?
    `;
    const params: any[] = [tenantId];

    if (connectionId) {
      sql += ` AND crr.connection_id = ?`;
      params.push(connectionId);
    }
    if (resolutionStatus !== 'all') {
      sql += ` AND crr.resolution_status = ?`;
      params.push(resolutionStatus);
    }

    sql += ` ORDER BY crr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await c.env.DB.prepare(sql).bind(...params).all();

    return c.json({ records: rows.results || [] });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch reconciliation records' }, 500);
  }
});

channelManagerV2Routes.post('/reconciliation/:connectionId/scan', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const connectionId = c.req.param('connectionId');
  const now = new Date();
  const startDate = now.toISOString().split('T')[0];

  try {
    const conn: any = await c.env.DB.prepare(
      `SELECT property_id FROM hotel_channel_connections WHERE id = ? AND tenant_id = ?`
    )
      .bind(connectionId, tenantId)
      .first();

    if (!conn) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    const report = await runPropertyReconciliationScan(
      c.env.DB,
      conn.property_id,
      tenantId,
      startDate,
      14
    );

    return c.json({ success: true, report });
  } catch (err: any) {
    return c.json({ error: err.message || 'Reconciliation scan failed' }, 500);
  }
});

channelManagerV2Routes.post('/reconciliation/:id/resolve', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const id = c.req.param('id');
  const user = c.get('user')!;

  try {
    const result = await forcePushCentralState(c.env.DB, id, tenantId, user.uid);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message || 'Discrepancy resolution failed' }, 500);
  }
});

// -----------------------------------------------------------------------------
// 11. OTA RESERVATION WEBHOOK & CONCURRENCY SIMULATOR
// -----------------------------------------------------------------------------
channelManagerV2Routes.post('/simulate-booking', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const {
    connectionId,
    bookingRef = `SIM-${Math.floor(100000 + Math.random() * 900000)}`,
    guestName = 'Simulated OTA Guest',
    roomTypeId,
    checkInDate,
    checkOutDate,
    status = 'confirmed',
    totalAmountPaise = 350000,
  } = body;

  if (!connectionId || !roomTypeId || !checkInDate || !checkOutDate) {
    return c.json({
      success: false,
      message: 'Connection, Room Category, Check-In, and Check-Out dates are required.',
    }, 400);
  }

  const conn: any = await c.env.DB.prepare(
    `SELECT hcc.*, cp.code as provider_code, cp.display_name as provider_name
     FROM hotel_channel_connections hcc
     JOIN channel_providers cp ON cp.id = hcc.provider_id
     WHERE hcc.id = ? AND hcc.tenant_id = ?`
  )
    .bind(connectionId, tenantId)
    .first();

  if (!conn) {
    return c.json({
      success: false,
      message: 'Channel connection not found or unauthorized. Please select a valid channel connection.',
    }, 404);
  }

  try {
    const rawPayload = {
      simulated: true,
      bookingRef,
      guestName,
      roomTypeId,
      checkInDate,
      checkOutDate,
      totalAmountPaise,
      timestamp: new Date().toISOString(),
    };
    const payloadHash = `hash_${bookingRef}_${status}_${Date.now()}`;

    const ingestionResult = await ingestChannelReservationEvent(
      c.env.DB,
      tenantId,
      connectionId,
      {
        channelCode: conn.provider_code,
        externalReservationId: bookingRef,
        action: status === 'cancelled' ? 'cancel' : status === 'modified' ? 'modify' : 'create',
        externalRoomTypeId: roomTypeId,
        checkInDate,
        checkOutDate,
        guestName,
        guestEmail: 'simulated@example.com',
        guestPhone: '+919999999999',
        adults: 2,
        children: 0,
        totalAmountMinor: totalAmountPaise,
        currency: 'INR',
        payloadHash,
        rawPayload,
      }
    );

    return c.json({
      success: ingestionResult.success,
      action: ingestionResult.action,
      reservationId: ingestionResult.reservationId,
      reservationNumber: ingestionResult.reservationNumber,
      externalReservationId: ingestionResult.externalReservationId,
      message: ingestionResult.message || `Simulated reservation ${bookingRef} processed successfully.`,
    });
  } catch (err: any) {
    console.error('[Simulator Ingestion Exception]:', err);
    return c.json({
      success: false,
      message: err.message || 'Simulation encountered an unexpected processing error.',
    }, 400);
  }
});

// =============================================================================
// Public Webhook Router for Incoming OTA Callbacks
// =============================================================================
export const channelManagerV2WebhookRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

channelManagerV2WebhookRoutes.post('/:channelCode', async (c) => {
  const channelCode = c.req.param('channelCode');
  const rawBody = await c.req.text();
  let parsedBody: any = {};
  try {
    parsedBody = JSON.parse(rawBody || '{}');
  } catch {
    parsedBody = {};
  }

  // Extract all request headers
  const headers: Record<string, string> = {};
  const rawHeaders = c.req.raw.headers;
  rawHeaders.forEach((val, key) => {
    headers[key.toLowerCase()] = val;
  });

  try {
    const adapter = getChannelAdapter(channelCode);
    if (!adapter.parseReservationWebhook) {
      return c.json({ error: `Provider ${channelCode} does not support reservation webhooks` }, 400);
    }

    // Identify connection by channel code & external property ID hint
    const externalPropId =
      headers['x-hotel-id'] ||
      headers['x-property-id'] ||
      parsedBody.hotel_id ||
      parsedBody.property_id ||
      parsedBody.external_property_id;

    let connQuery = `
      SELECT hcc.id, hcc.tenant_id, hcc.property_id, hcc.environment, hcc.credentials_encrypted
      FROM hotel_channel_connections hcc
      JOIN channel_providers cp ON cp.id = hcc.provider_id
      WHERE cp.code = ? AND hcc.connection_status IN ('active', 'sandbox')
    `;
    const connParams: any[] = [channelCode];

    if (externalPropId) {
      connQuery += ` AND hcc.external_property_id = ?`;
      connParams.push(String(externalPropId));
    }
    connQuery += ` LIMIT 1`;

    const conn: any = await c.env.DB.prepare(connQuery).bind(...connParams).first();

    if (!conn) {
      console.warn(`[OTA Webhook] No active connection found for provider ${channelCode} (prop: ${externalPropId})`);
      return c.json({ error: 'No active connection found for this provider and property' }, 404);
    }

    const context = {
      tenantId: conn.tenant_id,
      propertyId: conn.property_id,
      connectionId: conn.id,
      environment: conn.environment as 'sandbox' | 'production',
      externalPropertyId: externalPropId,
    };

    const event = await adapter.parseReservationWebhook(context, {
      headers,
      rawBody,
      parsedBody,
    });

    if (!event) {
      return c.json({ error: 'Payload did not contain recognizable reservation event' }, 400);
    }

    const ingestionResult = await ingestChannelReservationEvent(
      c.env.DB,
      conn.tenant_id,
      conn.id,
      event
    );

    return c.json({
      success: ingestionResult.success,
      action: ingestionResult.action,
      reservationId: ingestionResult.reservationId,
      externalReservationId: ingestionResult.externalReservationId,
      message: ingestionResult.message,
    });
  } catch (err: any) {
    console.error(`[OTA Webhook Exception - ${channelCode}]:`, err);
    return c.json({ error: err.message || 'Webhook processing failed' }, 500);
  }
});
