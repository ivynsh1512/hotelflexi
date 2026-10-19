import { Hono } from 'hono';
import { Env, AppVariables } from '../types';

export const webhookRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// Helper: Verify HMAC-SHA256 signature using Web Crypto API
async function verifyHmacSha256(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Signature in hex
    const sigBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    return await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload));
  } catch (e) {
    console.error('HMAC verification error:', e);
    return false;
  }
}

webhookRoutes.post('/razorpay', async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header('x-razorpay-signature');
  const secret = c.env.RAZORPAY_WEBHOOK_SECRET;

  if (secret && signature) {
    const isValid = await verifyHmacSha256(rawBody, signature, secret);
    if (!isValid) {
      return c.json({ error: 'Invalid webhook signature' }, 400);
    }
  }

  let eventData: any;
  try {
    eventData = JSON.parse(rawBody);
  } catch {
    return c.json({ error: 'Malformed JSON payload' }, 400);
  }

  const eventId = eventData.event_id || eventData.id || `evt_${crypto.randomUUID()}`;
  const eventName = eventData.event || 'payment.captured';
  const now = Math.floor(Date.now() / 1000);

  // Idempotency check in webhook_events
  const existing = await c.env.DB.prepare(
    'SELECT id FROM webhook_events WHERE source = ? AND event_id = ?'
  )
    .bind('razorpay', eventId)
    .first();

  if (existing) {
    // Already processed, return 200 OK idempotently
    return c.json({ success: true, message: 'Event already processed' });
  }

  // Record event
  const webhookRecordId = `wh_${crypto.randomUUID()}`;
  await c.env.DB.prepare(
    `INSERT INTO webhook_events (id, source, event_id, event_name, payload, status, processed_at, created_at)
     VALUES (?, 'razorpay', ?, ?, ?, 'processed', ?, ?)`
  )
    .bind(webhookRecordId, eventId, eventName, rawBody, now, now)
    .run();

  // Handle payment.captured
  if (eventName === 'payment.captured' || eventName === 'order.paid') {
    const paymentEntity = eventData.payload?.payment?.entity;
    if (paymentEntity) {
      const orderId = paymentEntity.order_id;
      const amountPaise = paymentEntity.amount;
      const paymentId = paymentEntity.id;
      const notes = paymentEntity.notes || {};

      if (notes.reservationId) {
        // Update reservation to paid
        await c.env.DB.prepare(
          `UPDATE reservations SET
             paid_amount_paise = paid_amount_paise + ?,
             balance_amount_paise = MAX(0, total_amount_paise - (paid_amount_paise + ?)),
             payment_status = CASE WHEN (paid_amount_paise + ?) >= total_amount_paise THEN 'paid' ELSE 'partially_paid' END,
             updated_at = ?
           WHERE id = ?`
        )
          .bind(amountPaise, amountPaise, amountPaise, now, notes.reservationId)
          .run();
      }
    }
  }

  return c.json({ success: true, event: eventName });
});
