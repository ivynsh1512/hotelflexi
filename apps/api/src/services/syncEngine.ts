import { D1Database } from '@cloudflare/workers-types';
import { getOtaAdapter } from './ota/adapterRegistry';
import { calculateDateInventory } from './inventoryEngine';

export interface EnqueueSyncOptions {
  connectionId: string;
  propertyId: string;
  tenantId: string;
  jobType: 'rates_push' | 'inventory_push' | 'restrictions_push' | 'full_sync';
  payload?: any;
  idempotencyKey?: string;
  channelName: string;
  roomTypeId?: string;
  ratePlanId?: string;
  startDate?: string;
  endDate?: string;
  maxRetries?: number;
}

export interface SyncJobExecutionResult {
  jobId: string;
  status: 'completed' | 'retry' | 'failed';
  httpStatus: number;
  message: string;
  isSimulated: boolean;
  providerJobId?: string;
  retryCount: number;
  nextRetryAt?: number;
}

/**
 * Enqueues a synchronization job with duplicate-prevention and idempotency key checking.
 */
export async function enqueueSyncJob(
  db: D1Database,
  opts: EnqueueSyncOptions
): Promise<{ jobId: string; deduplicated: boolean }> {
  const now = Math.floor(Date.now() / 1000);

  // Generate deterministic idempotency key if not provided
  const idempotencyKey =
    opts.idempotencyKey ||
    `${opts.connectionId}_${opts.jobType}_${opts.roomTypeId || 'all'}_${opts.startDate || 'na'}_${opts.endDate || 'na'}`;

  // Check if an existing job with this idempotency key is already pending or processing
  const existingJob: any = await db.prepare(
    `SELECT id, status FROM sync_jobs
     WHERE idempotency_key = ? AND status IN ('pending', 'processing', 'retry')`
  )
    .bind(idempotencyKey)
    .first();

  if (existingJob) {
    return { jobId: existingJob.id, deduplicated: true };
  }

  const jobId = `sync_${crypto.randomUUID()}`;

  await db.prepare(
    `INSERT INTO sync_jobs (
       id, connection_id, property_id, tenant_id, job_type, status,
       payload, retry_count, max_retries, idempotency_key, channel_name,
       room_type_id, rate_plan_id, start_date, end_date, created_at
     ) VALUES (?, ?, ?, ?, ?, 'pending', ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      jobId,
      opts.connectionId,
      opts.propertyId,
      opts.tenantId,
      opts.jobType,
      opts.payload ? JSON.stringify(opts.payload) : null,
      opts.maxRetries || 3,
      idempotencyKey,
      opts.channelName,
      opts.roomTypeId || null,
      opts.ratePlanId || null,
      opts.startDate || null,
      opts.endDate || null,
      now
    )
    .run();

  return { jobId, deduplicated: false };
}

/**
 * Executes a sync job, invoking the appropriate OTA adapter and handling exponential backoff.
 */
export async function executeSyncJob(
  db: D1Database,
  jobId: string
): Promise<SyncJobExecutionResult> {
  const now = Math.floor(Date.now() / 1000);

  // 1. Fetch Job and Connection details
  const job: any = await db.prepare(
    `SELECT sj.*, oc.channel_name as conn_channel, oc.hotel_channel_id,
            oc.credentials_json, oc.environment as conn_env, oc.status as conn_status
     FROM sync_jobs sj
     JOIN ota_connections oc ON oc.id = sj.connection_id
     WHERE sj.id = ?`
  )
    .bind(jobId)
    .first();

  if (!job) {
    throw new Error(`Sync job #${jobId} not found`);
  }

  // Mark job as processing
  await db.prepare(
    `UPDATE sync_jobs SET status = 'processing', started_at = ? WHERE id = ?`
  )
    .bind(now, jobId)
    .run();

  const channelName = job.channel_name || job.conn_channel;
  const adapter = getOtaAdapter(channelName);

  let adapterResponse: any;

  try {
    const parsedPayload = job.payload ? JSON.parse(job.payload) : {};
    const startDate = job.start_date || new Date().toISOString().split('T')[0];
    const endDate = job.end_date || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];

    const connectionContext = {
      id: job.connection_id,
      channel_name: channelName,
      hotel_channel_id: job.hotel_channel_id,
      credentials_json: job.credentials_json,
      environment: job.conn_env || 'sandbox',
    };

    if (job.job_type === 'rates_push') {
      const updates = parsedPayload.rates || [
        {
          roomTypeId: job.room_type_id || 'DEFAULT',
          ratePlanId: job.rate_plan_id || 'STANDARD',
          startDate,
          endDate,
          pricePaise: parsedPayload.pricePaise || 350000,
          currency: 'INR',
        },
      ];
      adapterResponse = await adapter.pushRates(connectionContext, updates);
    } else if (job.job_type === 'inventory_push') {
      let availableCount = parsedPayload.availableCount;
      if (availableCount === undefined && job.room_type_id) {
        // Compute live availability from central inventory engine
        const inv = await calculateDateInventory(db, job.property_id, job.tenant_id, job.room_type_id, startDate);
        availableCount = inv.sellableInventory;
      }
      const updates = parsedPayload.inventory || [
        {
          roomTypeId: job.room_type_id || 'DEFAULT',
          startDate,
          endDate,
          availableCount: availableCount ?? 5,
        },
      ];
      adapterResponse = await adapter.pushInventory(connectionContext, updates);
    } else if (job.job_type === 'restrictions_push') {
      const updates = parsedPayload.restrictions || [
        {
          roomTypeId: job.room_type_id || 'DEFAULT',
          startDate,
          endDate,
          closed: parsedPayload.closed || false,
          minStay: parsedPayload.minStay || 1,
        },
      ];
      adapterResponse = await adapter.pushRestrictions(connectionContext, updates);
    } else {
      // full_sync: Push rates, inventory, and restrictions sequentially
      const rResp = await adapter.pushRates(connectionContext, [{
        roomTypeId: job.room_type_id || 'DEFAULT',
        startDate,
        endDate,
        pricePaise: 350000,
        currency: 'INR',
      }]);
      const iResp = await adapter.pushInventory(connectionContext, [{
        roomTypeId: job.room_type_id || 'DEFAULT',
        startDate,
        endDate,
        availableCount: 5,
      }]);
      adapterResponse = rResp.success && iResp.success
        ? { success: true, httpStatus: 200, message: 'Full sync executed cleanly', isSimulated: rResp.isSimulated }
        : { success: false, httpStatus: 502, message: 'Partial failure in full sync', retryable: true, isSimulated: rResp.isSimulated };
    }
  } catch (err: any) {
    adapterResponse = {
      success: false,
      httpStatus: 500,
      message: `Adapter exception: ${err.message}`,
      retryable: true,
      isSimulated: false,
    };
  }

  // Handle Response
  if (adapterResponse.success) {
    // 1. Success transition
    await db.batch([
      db.prepare(
        `UPDATE sync_jobs SET
           status = 'completed',
           http_status = ?,
           provider_response = ?,
           finished_at = ?
         WHERE id = ?`
      ).bind(adapterResponse.httpStatus || 200, JSON.stringify(adapterResponse), now, jobId),
      db.prepare(
        `UPDATE ota_connections SET
           last_sync_at = ?,
           last_successful_sync_at = ?,
           consecutive_failures = 0,
           error_message = NULL,
           updated_at = ?
         WHERE id = ?`
      ).bind(now, now, now, job.connection_id),
      db.prepare(
        `INSERT INTO sync_events (
           id, job_id, connection_id, property_id, tenant_id, event_type, payload, created_at
         ) VALUES (?, ?, ?, ?, ?, 'sync_succeeded', ?, ?)`
      ).bind(
        `evt_${crypto.randomUUID()}`,
        jobId,
        job.connection_id,
        job.property_id,
        job.tenant_id,
        JSON.stringify(adapterResponse),
        now
      ),
    ]);

    return {
      jobId,
      status: 'completed',
      httpStatus: adapterResponse.httpStatus || 200,
      message: adapterResponse.message,
      isSimulated: adapterResponse.isSimulated,
      providerJobId: adapterResponse.providerJobId,
      retryCount: job.retry_count,
    };
  }

  // 2. Failure Handling: check if retryable & within max retries
  const currentRetries = job.retry_count || 0;
  const maxRetries = job.max_retries || 3;
  const isRetryable = adapterResponse.retryable && currentRetries < maxRetries;

  if (isRetryable) {
    // Exponential backoff: base 30s * 2^(retry_count) -> 30s, 60s, 120s... max 1 hour
    const delaySeconds = Math.min(3600, 30 * Math.pow(2, currentRetries));
    const nextRetryAt = now + delaySeconds;
    const nextRetryCount = currentRetries + 1;

    await db.prepare(
      `UPDATE sync_jobs SET
         status = 'retry',
         retry_count = ?,
         next_retry_at = ?,
         http_status = ?,
         error_message = ?,
         provider_response = ?,
         finished_at = ?
       WHERE id = ?`
    )
      .bind(
        nextRetryCount,
        nextRetryAt,
        adapterResponse.httpStatus || 500,
        adapterResponse.message,
        JSON.stringify(adapterResponse),
        now,
        jobId
      )
      .run();

    return {
      jobId,
      status: 'retry',
      httpStatus: adapterResponse.httpStatus || 500,
      message: `Sync failed (retry scheduled in ${delaySeconds}s): ${adapterResponse.message}`,
      isSimulated: adapterResponse.isSimulated,
      retryCount: nextRetryCount,
      nextRetryAt,
    };
  }

  // 3. Terminal Failure (Max retries reached or non-retryable error)
  await db.batch([
    db.prepare(
      `UPDATE sync_jobs SET
         status = 'failed',
         http_status = ?,
         error_message = ?,
         provider_response = ?,
         finished_at = ?
       WHERE id = ?`
    ).bind(
      adapterResponse.httpStatus || 500,
      adapterResponse.message,
      JSON.stringify(adapterResponse),
      now,
      jobId
    ),
    db.prepare(
      `UPDATE ota_connections SET
         consecutive_failures = consecutive_failures + 1,
         error_message = ?,
         updated_at = ?
       WHERE id = ?`
    ).bind(adapterResponse.message, now, job.connection_id),
    db.prepare(
      `INSERT INTO sync_events (
         id, job_id, connection_id, property_id, tenant_id, event_type, payload, created_at
       ) VALUES (?, ?, ?, ?, ?, 'sync_failed_terminal', ?, ?)`
    ).bind(
      `evt_${crypto.randomUUID()}`,
      jobId,
      job.connection_id,
      job.property_id,
      job.tenant_id,
      JSON.stringify(adapterResponse),
      now
    ),
  ]);

  return {
    jobId,
    status: 'failed',
    httpStatus: adapterResponse.httpStatus || 500,
    message: `Terminal sync failure: ${adapterResponse.message}`,
    isSimulated: adapterResponse.isSimulated,
    retryCount: currentRetries,
  };
}

/**
 * Manually retries a failed or stalled sync job from the UI dashboard.
 */
export async function retrySyncJob(
  db: D1Database,
  jobId: string,
  tenantId: string
): Promise<SyncJobExecutionResult> {
  const now = Math.floor(Date.now() / 1000);

  const job: any = await db.prepare(
    `SELECT id, tenant_id FROM sync_jobs WHERE id = ? AND tenant_id = ?`
  )
    .bind(jobId, tenantId)
    .first();

  if (!job) {
    throw new Error('Sync job not found or unauthorized');
  }

  // Reset job to pending
  await db.prepare(
    `UPDATE sync_jobs SET status = 'pending', next_retry_at = ?, error_message = NULL WHERE id = ?`
  )
    .bind(now, jobId)
    .run();

  return executeSyncJob(db, jobId);
}

/**
 * Broadcasts an inventory or rate update event across ALL active connected OTA channels for a property.
 * Called whenever a reservation is confirmed, cancelled, modified, or bulk rates change.
 */
export async function broadcastInventoryChange(
  db: D1Database,
  propertyId: string,
  tenantId: string,
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<{ enqueuedCount: number }> {
  // Fetch active connected channels for property
  const connections = await db.prepare(
    `SELECT id, channel_name, hotel_channel_id FROM ota_connections
     WHERE property_id = ? AND tenant_id = ? AND status = 'connected'`
  )
    .bind(propertyId, tenantId)
    .all();

  const conns = (connections.results || []) as any[];
  let enqueuedCount = 0;

  for (const conn of conns) {
    const res = await enqueueSyncJob(db, {
      connectionId: conn.id,
      propertyId,
      tenantId,
      jobType: 'inventory_push',
      channelName: conn.channel_name,
      roomTypeId,
      startDate,
      endDate,
    });
    if (!res.deduplicated) {
      enqueuedCount++;
    }
  }

  return { enqueuedCount };
}
