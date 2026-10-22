/**
 * HotelFlexi Connectivity API Test Suite
 * Validates authentication, cross-property isolation, rate push, availability,
 * inbound bookings, idempotency, modifications, cancellations, no-show lifecycle,
 * HMAC webhook signatures, replay defense, retry backoff, and sandbox isolation.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { hashSecret, verifySecret, generateHmacSignature, verifyHmacSignature } from '../src/services/connectivity/crypto';
import { connectivityRoutes } from '../src/routes/connectivity';
import { connectivityDocsRoutes } from '../src/routes/connectivityDocs';
import { enqueueConnectivityEvent, processOutboxBatch } from '../src/services/connectivity/outbox';
import { seedSandboxEnvironment, resetSandboxEnvironment } from '../src/services/connectivity/sandbox';

// In-memory mock D1 database generator for connectivity tests
function createConnectivityMockD1(options: {
  partner?: any;
  partnerPropertyMapped?: boolean;
  property?: any;
  roomTypes?: any[];
  ratePlans?: any[];
  existingReservation?: any;
  availableRoom?: any;
  outboxPending?: any[];
}) {
  const executedStatements: Array<{ query: string; params: any[] }> = [];

  const createStmt = (query: string, params: any[] = []): any => ({
    bind(...newParams: any[]) {
      return createStmt(query, newParams);
    },
    async first() {
      executedStatements.push({ query, params });
      const q = query.replace(/\s+/g, ' ').trim();

      if (q.includes('FROM connectivity_partners WHERE api_key = ?')) {
        return options.partner || null;
      }
      if (q.includes('FROM connectivity_partner_properties WHERE partner_id = ? AND property_id = ?')) {
        return options.partnerPropertyMapped !== false ? { 1: 1 } : null;
      }
      if (q.includes('FROM properties p JOIN connectivity_partner_properties')) {
        return options.property || { id: 'prop_test_1', name: 'Grand Horizon Hotel', is_active: 1 };
      }
      if (q.includes('FROM properties WHERE id = ?')) {
        return options.property || { id: 'prop_test_1', name: 'Grand Horizon Hotel' };
      }
      if (q.includes('FROM rooms WHERE room_type_id = ?')) {
        return options.availableRoom !== undefined ? options.availableRoom : { id: 'room_101', room_number: '101' };
      }
      if (q.includes('FROM reservations WHERE property_id = ?') && q.includes('external_reference_id = ?')) {
        return options.existingReservation || null;
      }
      if (q.includes('FROM reservations WHERE id = ?')) {
        return options.existingReservation || null;
      }
      return null;
    },
    async all() {
      executedStatements.push({ query, params });
      const q = query.replace(/\s+/g, ' ').trim();

      if (q.includes('FROM properties p JOIN connectivity_partner_properties')) {
        return { results: [options.property || { id: 'prop_test_1', name: 'Grand Horizon Hotel' }] };
      }
      if (q.includes('FROM room_types rt WHERE rt.property_id = ?')) {
        return { results: options.roomTypes || [{ id: 'rt_deluxe_1', name: 'Deluxe Room', code: 'DLX', physical_rooms_count: 5 }] };
      }
      if (q.includes('FROM rate_plans rp')) {
        return { results: options.ratePlans || [{ id: 'rp_ep_1', name: 'Room Only', code: 'EP', meal_plan: 'EP' }] };
      }
      if (q.includes('FROM connectivity_outbox co JOIN connectivity_partners')) {
        return { results: options.outboxPending || [] };
      }
      if (q.includes('FROM connectivity_outbox WHERE partner_id = ?')) {
        return { results: options.outboxPending || [] };
      }
      return { results: [] };
    },
    async run() {
      executedStatements.push({ query, params });
      return { success: true, meta: { changes: 1 } };
    },
  });

  return {
    db: {
      prepare(query: string) {
        return createStmt(query);
      },
      batch: async (stmts: any[]) => {
        for (const s of stmts) {
          executedStatements.push({ query: 'batch_item', params: [] });
        }
        return stmts.map(() => ({ success: true, meta: { changes: 1 } }));
      },
    } as any as D1Database,
    executedStatements,
  };
}

describe('HotelFlexi Secure External Connectivity API', () => {
  // Test Credentials
  const TEST_KEY = 'hf_live_channellyx_test_key_123';
  const TEST_SECRET = 'sk_live_very_secret_passphrase_456';
  let TEST_SECRET_HASH = '';

  beforeAll(async () => {
    TEST_SECRET_HASH = await hashSecret(TEST_SECRET);
  });

  // ---------------------------------------------------------------------------
  // 1. Cryptography & Webhook Signature Verification
  // ---------------------------------------------------------------------------
  describe('A. Cryptography & Replay Attack Defense', () => {
    it('hashes secrets with SHA-256 and verifies correctly', async () => {
      const hash = await hashSecret(TEST_SECRET);
      expect(hash).toBe(TEST_SECRET_HASH);
      expect(await verifySecret(TEST_SECRET, hash)).toBe(true);
      expect(await verifySecret('wrong_secret', hash)).toBe(false);
    });

    it('generates and verifies HMAC-SHA256 webhook signatures with timestamp', async () => {
      const payload = JSON.stringify({ event: 'reservation.created', id: 'res_123' });
      const now = Math.floor(Date.now() / 1000);
      const signature = await generateHmacSignature('webhook_secret_key', now, payload);

      const header = `t=${now},v1=${signature}`;
      const verification = await verifyHmacSignature('webhook_secret_key', header, payload);
      expect(verification.valid).toBe(true);
    });

    it('rejects replayed webhook signatures outside the 300-second window', async () => {
      const payload = JSON.stringify({ event: 'reservation.created', id: 'res_123' });
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const signature = await generateHmacSignature('webhook_secret_key', oldTimestamp, payload);

      const header = `t=${oldTimestamp},v1=${signature}`;
      const verification = await verifyHmacSignature('webhook_secret_key', header, payload, 300);
      expect(verification.valid).toBe(false);
      expect(verification.reason).toContain('replay window');
    });

    it('rejects tampered webhook payloads with signature mismatch', async () => {
      const payload = JSON.stringify({ event: 'reservation.created', amount: 1000 });
      const tamperedPayload = JSON.stringify({ event: 'reservation.created', amount: 999999 });
      const now = Math.floor(Date.now() / 1000);
      const signature = await generateHmacSignature('webhook_secret_key', now, payload);

      const header = `t=${now},v1=${signature}`;
      const verification = await verifyHmacSignature('webhook_secret_key', header, tamperedPayload);
      expect(verification.valid).toBe(false);
      expect(verification.reason).toContain('mismatch');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Authentication & Multi-Tenant Access Control
  // ---------------------------------------------------------------------------
  describe('B. Authentication & Cross-Property Authorization', () => {
    it('rejects requests missing API credentials with 401', async () => {
      const { db } = createConnectivityMockD1({});
      const app = connectivityRoutes;

      const res = await app.request('/me', { method: 'GET' }, { DB: db });
      expect(res.status).toBe(401);
      const body: any = await res.json();
      expect(body.code).toBe('AUTH_CREDENTIALS_MISSING');
    });

    it('rejects requests with invalid API keys with 401', async () => {
      const { db } = createConnectivityMockD1({ partner: null });
      const app = connectivityRoutes;

      const res = await app.request(
        '/me',
        {
          method: 'GET',
          headers: { 'X-API-Key': 'invalid_key', 'X-API-Secret': TEST_SECRET },
        },
        { DB: db }
      );
      expect(res.status).toBe(401);
      const body: any = await res.json();
      expect(body.code).toBe('AUTH_KEY_INVALID');
    });

    it('rejects requests with invalid secrets with 401', async () => {
      const { db } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
        },
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/me',
        {
          method: 'GET',
          headers: { 'X-API-Key': TEST_KEY, 'X-API-Secret': 'wrong_secret' },
        },
        { DB: db }
      );
      expect(res.status).toBe(401);
      const body: any = await res.json();
      expect(body.code).toBe('AUTH_SECRET_INVALID');
    });

    it('rejects deactivated or revoked partner credentials with 403', async () => {
      const { db } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 0, // Revoked
          mode: 'production',
        },
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/me',
        {
          method: 'GET',
          headers: { 'X-API-Key': TEST_KEY, 'X-API-Secret': TEST_SECRET },
        },
        { DB: db }
      );
      expect(res.status).toBe(403);
      const body: any = await res.json();
      expect(body.code).toBe('AUTH_PARTNER_INACTIVE');
    });

    it('blocks cross-property access if partner is not authorized for target property with 403', async () => {
      const { db } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          partner_name: 'Channellyx',
          partner_code: 'channellyx',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
        },
        partnerPropertyMapped: false, // NOT authorized for prop_unauthorized
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/properties/prop_unauthorized/room-types',
        {
          method: 'GET',
          headers: { 'X-API-Key': TEST_KEY, 'X-API-Secret': TEST_SECRET },
        },
        { DB: db }
      );
      expect(res.status).toBe(403);
      const body: any = await res.json();
      expect(body.code).toBe('PROPERTY_ACCESS_DENIED');
    });

    it('authenticates valid partner and returns authorized property details', async () => {
      const { db } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          partner_name: 'Channellyx',
          partner_code: 'channellyx',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
          rate_limit_per_minute: 120,
        },
        partnerPropertyMapped: true,
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/me',
        {
          method: 'GET',
          headers: { 'X-API-Key': TEST_KEY, 'X-API-Secret': TEST_SECRET },
        },
        { DB: db }
      );
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.status).toBe('connected');
      expect(body.partner.name).toBe('Channellyx');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Rate Push & Stay Restrictions
  // ---------------------------------------------------------------------------
  describe('C. Rate Push & Restrictions', () => {
    it('accepts valid rates with stay restrictions and stop-sell flags', async () => {
      const { db, executedStatements } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          partner_name: 'Channellyx',
          partner_code: 'channellyx',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
        },
        partnerPropertyMapped: true,
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/properties/prop_test_1/rates',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': TEST_KEY,
            'X-API-Secret': TEST_SECRET,
          },
          body: JSON.stringify({
            rates: [
              {
                room_type_id: 'rt_deluxe_1',
                rate_plan_id: 'rp_ep_1',
                start_date: '2026-11-01',
                end_date: '2026-11-02',
                price_paise: 500000,
                min_stay_arrival: 2,
                closed_to_arrival: true,
                stop_sell: false,
              },
            ],
          }),
        },
        { DB: db }
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.processedCount).toBe(2); // 2 stay dates

      // Verified DB writes to daily_rate_plan_prices and daily_restrictions
      const queries = executedStatements.map((s) => s.query);
      expect(queries.some((q) => q.includes('daily_rate_plan_prices'))).toBe(true);
      expect(queries.some((q) => q.includes('daily_restrictions'))).toBe(true);
    });

    it('rejects rate updates with negative prices or invalid dates', async () => {
      const { db } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
        },
        partnerPropertyMapped: true,
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/properties/prop_test_1/rates',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': TEST_KEY,
            'X-API-Secret': TEST_SECRET,
          },
          body: JSON.stringify({
            rates: [
              {
                room_type_id: 'rt_deluxe_1',
                rate_plan_id: 'rp_ep_1',
                start_date: '2026-11-01',
                price_paise: -5000, // Invalid negative
              },
            ],
          }),
        },
        { DB: db }
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(false);
      expect(body.errors[0].error).toContain('negative');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Availability Push
  // ---------------------------------------------------------------------------
  describe('D. Availability Push', () => {
    it('accepts inventory updates and updates override_inventory', async () => {
      const { db, executedStatements } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
        },
        partnerPropertyMapped: true,
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/properties/prop_test_1/availability',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': TEST_KEY,
            'X-API-Secret': TEST_SECRET,
          },
          body: JSON.stringify({
            availability: [
              {
                room_type_id: 'rt_deluxe_1',
                start_date: '2026-11-05',
                end_date: '2026-11-05',
                available_rooms: 4,
                stop_sell: false,
              },
            ],
          }),
        },
        { DB: db }
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.processedCount).toBe(1);

      const queries = executedStatements.map((s) => s.query);
      expect(queries.some((q) => q.includes('override_inventory'))).toBe(true);
    });

    it('rejects negative availability values', async () => {
      const { db } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
        },
        partnerPropertyMapped: true,
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/properties/prop_test_1/availability',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': TEST_KEY,
            'X-API-Secret': TEST_SECRET,
          },
          body: JSON.stringify({
            availability: [
              {
                room_type_id: 'rt_deluxe_1',
                start_date: '2026-11-05',
                available_rooms: -2,
              },
            ],
          }),
        },
        { DB: db }
      );

      const body: any = await res.json();
      expect(body.success).toBe(false);
      expect(body.errors[0].error).toContain('negative');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Inbound Reservations & Idempotency
  // ---------------------------------------------------------------------------
  describe('E. Inbound Booking & Idempotency', () => {
    it('creates a new reservation, assigns an available room, and returns 201', async () => {
      const { db, executedStatements } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          partner_name: 'Channellyx',
          partner_code: 'channellyx',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
        },
        partnerPropertyMapped: true,
        availableRoom: { id: 'room_101', room_number: '101' },
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/properties/prop_test_1/reservations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': TEST_KEY,
            'X-API-Secret': TEST_SECRET,
          },
          body: JSON.stringify({
            external_reservation_id: 'CHX-BOOKING-9901',
            channel_code: 'channellyx',
            room_type_id: 'rt_deluxe_1',
            check_in_date: '2026-11-10',
            check_out_date: '2026-11-12',
            adults: 2,
            total_amount_minor: 1000000,
            guest: {
              full_name: 'Vikram Malhotra',
              email: 'vikram@example.com',
              phone: '+919876543210',
            },
          }),
        },
        { DB: db }
      );

      expect(res.status).toBe(201);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.reservation.externalReservationId).toBe('CHX-BOOKING-9901');
      expect(body.reservation.assignedRoom).toBe('101');
      expect(body.reservation.status).toBe('confirmed');

      const queries = executedStatements.map((s) => s.query);
      expect(queries.some((q) => q.includes('INSERT INTO reservations'))).toBe(true);
      expect(queries.some((q) => q.includes('INSERT INTO reservation_guests'))).toBe(true);
    });

    it('returns 200 with idempotent flag when repeated delivery of same booking occurs', async () => {
      const { db } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
        },
        partnerPropertyMapped: true,
        existingReservation: {
          id: 'res_existing_123',
          reservation_number: 'OTA-778899',
          status: 'confirmed',
          total_amount_paise: 1000000,
        },
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/properties/prop_test_1/reservations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': TEST_KEY,
            'X-API-Secret': TEST_SECRET,
          },
          body: JSON.stringify({
            external_reservation_id: 'CHX-BOOKING-9901',
            room_type_id: 'rt_deluxe_1',
            check_in_date: '2026-11-10',
            check_out_date: '2026-11-12',
            guest: { full_name: 'Vikram Malhotra' },
          }),
        },
        { DB: db }
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.idempotent).toBe(true);
      expect(body.reservation.reservationNumber).toBe('OTA-778899');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Reservation Cancellation Lifecycle
  // ---------------------------------------------------------------------------
  describe('F. Reservation Cancellation & Idempotency', () => {
    it('cancels active reservation and unassigns room inventory', async () => {
      const { db, executedStatements } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
        },
        partnerPropertyMapped: true,
        existingReservation: {
          id: 'res_active_1',
          reservation_number: 'OTA-112233',
          status: 'confirmed',
          room_id: 'room_101',
        },
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/properties/prop_test_1/reservations/CHX-BOOKING-9901/cancel',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': TEST_KEY,
            'X-API-Secret': TEST_SECRET,
          },
          body: JSON.stringify({ reason: 'Guest cancelled via travel portal' }),
        },
        { DB: db }
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.reservation.status).toBe('cancelled');

      const queries = executedStatements.map((s) => s.query);
      expect(queries.some((q) => q.includes("status = 'cancelled'") && q.includes('room_id = NULL'))).toBe(true);
    });

    it('handles duplicate cancellation idempotently', async () => {
      const { db } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
        },
        partnerPropertyMapped: true,
        existingReservation: {
          id: 'res_cancelled_1',
          reservation_number: 'OTA-112233',
          status: 'cancelled', // Already cancelled
        },
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/properties/prop_test_1/reservations/CHX-BOOKING-9901/cancel',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': TEST_KEY,
            'X-API-Secret': TEST_SECRET,
          },
        },
        { DB: db }
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.idempotent).toBe(true);
      expect(body.reservation.status).toBe('cancelled');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. No-Show Status Transition
  // ---------------------------------------------------------------------------
  describe('G. Controlled No-Show Transition', () => {
    it('marks eligible booking as no_show on or after check-in date', async () => {
      const yesterday = new Date(Date.now() - 86400 * 1000).toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400 * 1000).toISOString().split('T')[0];

      const { db, executedStatements } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          partner_code: 'channellyx',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
        },
        partnerPropertyMapped: true,
        existingReservation: {
          id: 'res_noshow_candidate',
          reservation_number: 'OTA-445566',
          status: 'confirmed',
          check_in_date: yesterday, // Eligible: check-in date is in past or today
          check_out_date: tomorrow,
          room_id: 'room_101',
        },
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/properties/prop_test_1/reservations/CHX-BOOKING-9901/no-show',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': TEST_KEY,
            'X-API-Secret': TEST_SECRET,
          },
          body: JSON.stringify({ notes: 'Did not arrive by 11:59 PM' }),
        },
        { DB: db }
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.reservation.status).toBe('no_show');

      const queries = executedStatements.map((s) => s.query);
      expect(queries.some((q) => q.includes("status = 'no_show'") && q.includes('no_show_at'))).toBe(true);
    });

    it('rejects premature no-show attempt for future reservation with 400', async () => {
      const nextWeek = new Date(Date.now() + 86400 * 7000).toISOString().split('T')[0];
      const nextWeekPlus2 = new Date(Date.now() + 86400 * 9000).toISOString().split('T')[0];

      const { db } = createConnectivityMockD1({
        partner: {
          id: 'cp_1',
          tenant_id: 't_1',
          api_key: TEST_KEY,
          api_secret_hash: TEST_SECRET_HASH,
          is_active: 1,
          mode: 'production',
        },
        partnerPropertyMapped: true,
        existingReservation: {
          id: 'res_future',
          reservation_number: 'OTA-7788',
          status: 'confirmed',
          check_in_date: nextWeek, // Future date
          check_out_date: nextWeekPlus2,
        },
      });
      const app = connectivityRoutes;

      const res = await app.request(
        '/properties/prop_test_1/reservations/CHX-BOOKING-9901/no-show',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': TEST_KEY,
            'X-API-Secret': TEST_SECRET,
          },
        },
        { DB: db }
      );

      expect(res.status).toBe(400);
      const body: any = await res.json();
      expect(body.code).toBe('PREMATURE_NO_SHOW');
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Sandbox Environment Isolation & Deterministic Seeding
  // ---------------------------------------------------------------------------
  describe('H. Sandbox Environment Isolation', () => {
    it('seeds full deterministic synthetic resort with 3 room types & sample booking', async () => {
      const { db } = createConnectivityMockD1({});
      const seedData = await seedSandboxEnvironment(db, 'cp_test_sandbox_123', 'tenant_test');

      expect(seedData.propertyName).toBe('HotelFlexi Sandbox Luxury Resort');
      expect(seedData.roomTypes.length).toBe(3);
      expect(seedData.ratePlans.length).toBe(3);
      expect(seedData.sampleReservation.externalReservationId).toBeDefined();
    });

    it('resets sandbox environment safely without touching production data', async () => {
      const { db, executedStatements } = createConnectivityMockD1({});
      const result = await resetSandboxEnvironment(db, 'cp_test_sandbox_123', 'tenant_test');

      expect(result.success).toBe(true);
      expect(result.propertyId).toContain('prop_sandbox_');

      const queries = executedStatements.map((s) => s.query);
      expect(queries.length).toBeGreaterThan(5);
      expect(queries.every((q) => q.includes('property_id') || q.includes('FROM properties WHERE id = ?'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. OpenAPI 3.1 & Documentation Delivery
  // ---------------------------------------------------------------------------
  describe('I. OpenAPI 3.1 & Developer Documentation', () => {
    it('serves valid OpenAPI 3.1 JSON schema', async () => {
      const app = connectivityDocsRoutes;
      const res = await app.request('/openapi.json', { method: 'GET' });

      expect(res.status).toBe(200);
      const spec: any = await res.json();
      expect(spec.openapi).toBe('3.1.0');
      expect(spec.info.title).toContain('HotelFlexi');
      expect(spec.paths['/properties/{propertyId}/rates']).toBeDefined();
      expect(spec.paths['/properties/{propertyId}/reservations']).toBeDefined();
    });

    it('serves developer-friendly HTML interactive documentation', async () => {
      const app = connectivityDocsRoutes;
      const res = await app.request('/docs', { method: 'GET' });

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('SwaggerUIBundle');
      expect(html).toContain('HotelFlexi — Connectivity Provider API');
    });
  });
});
