import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { sendPaymentSuccessEmail } from '../services/email';

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

        // Send instant payment confirmation email to hotel admin
        try {
          const resRow: any = await c.env.DB.prepare(
            `SELECT res.*, p.name as property_name, p.email as property_email
             FROM reservations res
             JOIN properties p ON p.id = res.property_id
             WHERE res.id = ?`
          ).bind(notes.reservationId).first();

          if (resRow) {
            const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;
            sendPaymentSuccessEmail(c.env, {
              ownerEmail: resRow.property_email || resRow.email || undefined,
              propertyName: resRow.property_name || 'HotelFlexi',
              reservationNumber: resRow.reservation_number || notes.reservationId,
              guestName: resRow.guest_name || 'Guest',
              amountRupees: formatRupees(amountPaise),
              paymentMethod: 'razorpay_webhook',
              paymentId: paymentId || orderId || 'N/A',
              checkInDate: resRow.check_in_date || '',
              checkOutDate: resRow.check_out_date || '',
              remainingBalanceRupees: formatRupees(resRow.balance_amount_paise || 0),
            }).catch((err) => console.error('[Webhook Payment Email Error]:', err));
          }
        } catch (emailErr) {
          console.error('[Webhook Email Lookup Error]:', emailErr);
        }
      }

      // Handle SaaS Subscription Payment
      if (notes.tenantId && notes.planId) {
        const plan: any = await c.env.DB.prepare(
          'SELECT * FROM subscription_plans WHERE id = ?'
        ).bind(notes.planId).first();

        if (plan) {
          const nextPeriod = now + 30 * 86400;
          await c.env.DB.prepare(
            `UPDATE tenants
             SET current_plan_id = ?,
                 subscription_status = 'active',
                 account_access_status = 'active',
                 suspension_reason = NULL,
                 current_period_ends_at = ?,
                 updated_at = ?
             WHERE id = ?`
          ).bind(notes.planId, nextPeriod, now, notes.tenantId).run();

          await c.env.DB.prepare(
            `UPDATE feature_entitlements
             SET max_properties = ?, max_rooms = ?, max_users = ?, has_pms = ?,
                 has_booking_engine = ?, has_channel_manager = ?, max_channel_connections = ?,
                 has_ai_agent = ?, ai_monthly_limit = ?, has_advanced_reports = ?,
                 has_accounting = ?, has_multi_property = ?, updated_at = ?
             WHERE tenant_id = ?`
          ).bind(
            plan.max_properties || 1,
            plan.max_rooms || 10,
            plan.max_users || 2,
            plan.has_pms || 1,
            plan.has_booking_engine || 1,
            plan.has_channel_manager || 0,
            plan.max_channel_connections || 0,
            plan.has_ai_agent || 1,
            plan.ai_monthly_limit || 100,
            plan.has_advanced_reports || 0,
            plan.has_accounting || 0,
            plan.has_multi_property || 0,
            now,
            notes.tenantId
          ).run();
        }
      }
    }
  }

  return c.json({ success: true, event: eventName });
});
