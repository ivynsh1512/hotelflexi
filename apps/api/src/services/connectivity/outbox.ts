/**
 * HotelFlexi Connectivity API — Durable Two-Way Outbox Engine
 * Handles guaranteed delivery, exponential backoff, and signed webhooks.
 */

import { generateHmacSignature } from './crypto';

export interface ConnectivityEventPayload {
  partnerId: string;
  tenantId: string;
  propertyId: string;
  eventType: string;
  payload: Record<string, any>;
  correlationId?: string;
  idempotencyKey?: string;
}

export async function enqueueConnectivityEvent(
  db: D1Database,
  event: ConnectivityEventPayload
): Promise<string> {
  const id = `cout_${crypto.randomUUID()}`;
  const now = Math.floor(Date.now() / 1000);
  const idempotencyKey = event.idempotencyKey || `idem_${crypto.randomUUID()}`;

  await db.prepare(
    `INSERT INTO connectivity_outbox (
      id, partner_id, tenant_id, property_id, event_type,
      payload_json, status, attempts, max_attempts, next_retry_at,
      idempotency_key, correlation_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, 5, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      event.partnerId,
      event.tenantId,
      event.propertyId,
      event.eventType,
      JSON.stringify(event.payload),
      now,
      idempotencyKey,
      event.correlationId || id,
      now,
      now
    )
    .run();

  return id;
}

export async function processOutboxBatch(
  db: D1Database,
  batchLimit = 10
): Promise<{ processed: number; successful: number; failed: number }> {
  const now = Math.floor(Date.now() / 1000);

  // Fetch pending events ready for dispatch
  const pendingRows = await db.prepare(
    `SELECT co.*, cp.webhook_url, cp.webhook_secret, cp.partner_name
     FROM connectivity_outbox co
     JOIN connectivity_partners cp ON co.partner_id = cp.id
     WHERE co.status IN ('pending', 'failed')
       AND co.attempts < co.max_attempts
       AND (co.next_retry_at IS NULL OR co.next_retry_at <= ?)
       AND cp.is_active = 1
       AND cp.webhook_url IS NOT NULL
     ORDER BY co.created_at ASC
     LIMIT ?`
  )
    .bind(now, batchLimit)
    .all();

  const events = (pendingRows.results || []) as any[];
  let successful = 0;
  let failed = 0;

  for (const ev of events) {
    const attempt = ev.attempts + 1;
    let deliverySuccess = false;
    let errorMessage: string | null = null;

    try {
      const payloadString = ev.payload_json;
      const signature = await generateHmacSignature(
        ev.webhook_secret || 'default_secret',
        now,
        payloadString
      );

      const response = await fetch(ev.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-HotelFlexi-Event': ev.event_type,
          'X-HotelFlexi-Delivery': ev.id,
          'X-HotelFlexi-Signature': `t=${now},v1=${signature}`,
          'X-HotelFlexi-Correlation-ID': ev.correlation_id || ev.id,
        },
        body: payloadString,
      });

      if (response.ok) {
        deliverySuccess = true;
      } else {
        errorMessage = `HTTP ${response.status}: ${await response.text().then((t) => t.slice(0, 200)).catch(() => '')}`;
      }
    } catch (err: any) {
      errorMessage = err.message || 'Network delivery error';
    }

    if (deliverySuccess) {
      successful++;
      await db.prepare(
        `UPDATE connectivity_outbox
         SET status = 'delivered', attempts = ?, last_attempt_at = ?, updated_at = ?
         WHERE id = ?`
      )
        .bind(attempt, now, now, ev.id)
        .run();
    } else {
      failed++;
      const nextDelaySeconds = Math.min(3600, Math.pow(2, attempt) * 30); // 30s, 60s, 120s, 240s...
      const finalStatus = attempt >= ev.max_attempts ? 'dead_letter' : 'failed';

      await db.prepare(
        `UPDATE connectivity_outbox
         SET status = ?, attempts = ?, last_attempt_at = ?, next_retry_at = ?, last_error = ?, updated_at = ?
         WHERE id = ?`
      )
        .bind(finalStatus, attempt, now, now + nextDelaySeconds, errorMessage, now, ev.id)
        .run();
    }
  }

  return { processed: events.length, successful, failed };
}
