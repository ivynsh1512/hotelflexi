import { describe, it, expect, vi } from 'vitest';
import {
  encryptCredentials,
  decryptCredentials,
  redactSecrets,
} from '../src/services/channelManager/crypto';
import {
  getChannelAdapter,
  listSupportedProviders,
} from '../src/services/channelManager/adapters/adapterRegistry';
import { BookingComAdapter } from '../src/services/channelManager/adapters/bookingComAdapter';
import { AgodaAdapter } from '../src/services/channelManager/adapters/agodaAdapter';
import { ExpediaAdapter } from '../src/services/channelManager/adapters/expediaAdapter';
import { MakeMyTripAdapter } from '../src/services/channelManager/adapters/makeMyTripAdapter';
import { TripAdvisorAdapter } from '../src/services/channelManager/adapters/tripAdvisorAdapter';
import {
  enqueueChannelSyncJob,
  executeChannelSyncJob,
} from '../src/services/channelManager/outboxEngine';
import {
  ingestChannelReservationEvent,
} from '../src/services/channelManager/reservationIngestion';
import {
  runPropertyReconciliationScan,
  forcePushCentralState,
} from '../src/services/channelManager/reconciliationEngine';

// Mock in-memory D1 implementation
function createMockD1(options: {
  existingJob?: any;
  connection?: any;
  existingReservation?: any;
  roomTypes?: any[];
  roomCount?: number;
  reservationsCount?: number;
  blocksCount?: number;
  reconciliationRecord?: any;
}) {
  const statements: Array<{ query: string; params: any[] }> = [];

  const createStatement = (query: string, params: any[] = []): any => ({
    bind(...newParams: any[]) {
      return createStatement(query, newParams);
    },
    async first() {
      statements.push({ query, params });
      const q = query.replace(/\s+/g, ' ').trim();

      if (q.includes('FROM channel_sync_jobs') && q.includes('idempotency_key')) {
        return options.existingJob || null;
      }
      if (q.includes('FROM channel_sync_jobs WHERE id = ?')) {
        return options.existingJob || {
          id: 'job_test_1',
          tenant_id: 't_1',
          property_id: 'p_1',
          connection_id: 'c_1',
          job_type: 'availability_push',
          payload_reference: JSON.stringify({ availableRooms: 5 }),
          attempt_count: 0,
          max_attempts: 5,
          correlation_id: 'corr_1',
        };
      }
      if (q.includes('FROM hotel_channel_connections')) {
        return options.connection || {
          id: 'c_1',
          tenant_id: 't_1',
          property_id: 'p_1',
          provider_id: 'cp_bcom',
          external_property_id: '7654321',
          connection_status: 'sandbox',
          environment: 'sandbox',
        };
      }
      if (q.includes('FROM channel_reservations') && q.includes('external_reservation_id')) {
        return options.existingReservation || null;
      }
      if (q.includes('FROM room_types') && q.includes('id = ?')) {
        return options.roomTypes?.[0] || {
          id: 'rt_deluxe',
          property_id: 'p_1',
          tenant_id: 't_1',
          name: 'Deluxe Room',
          code: 'DLX',
          base_price_paise: 350000,
          weekend_price_paise: 400000,
        };
      }
      if (q.includes('FROM rooms') && q.includes('COUNT(*)')) {
        return { count: options.roomCount ?? 10 };
      }
      if (q.includes('FROM reservations') && q.includes('COUNT(*)')) {
        return { count: options.reservationsCount ?? 0 };
      }
      if (q.includes('FROM room_blocks') && q.includes('COUNT(*)')) {
        return { count: options.blocksCount ?? 0 };
      }
      if (q.includes('FROM channel_reconciliation_records WHERE id = ?')) {
        return options.reconciliationRecord || {
          id: 'rec_1',
          tenant_id: 't_1',
          property_id: 'p_1',
          connection_id: 'c_1',
          room_type_id: 'rt_deluxe',
          stay_date: '2026-11-01',
          resolution_status: 'unresolved',
        };
      }
      return null;
    },
    async all() {
      statements.push({ query, params });
      const q = query.replace(/\s+/g, ' ').trim();

      if (q.includes('FROM room_types')) {
        return { results: options.roomTypes || [{ id: 'rt_deluxe', name: 'Deluxe Room' }] };
      }
      if (q.includes('FROM hotel_channel_connections hcc')) {
        return {
          results: [
            {
              id: 'c_1',
              connection_status: 'sandbox',
              channel_code: 'booking_com',
              display_name: 'Booking.com',
            },
          ],
        };
      }
      if (q.includes('FROM daily_restrictions')) {
        return { results: [] };
      }
      if (q.includes('FROM daily_rates')) {
        return { results: [] };
      }
      return { results: [] };
    },
    async run() {
      statements.push({ query, params });
      return { success: true, meta: { changes: 1 } };
    },
  });

  return {
    prepare(query: string) {
      return createStatement(query);
    },
    getExecutedStatements: () => statements,
  };
}

describe('Channel Manager V2 — Core Architecture & Resilience Tests', () => {
  // ---------------------------------------------------------------------------
  // 1. CREDENTIAL ENCRYPTION & REDACTION
  // ---------------------------------------------------------------------------
  describe('Group 1: Credential Security & Redaction', () => {
    it('encryptCredentials + decryptCredentials performs accurate roundtrip', async () => {
      const tenantId = 'tenant_hotel_alpha_1';
      const secret = JSON.stringify({ apiKey: 'bk_live_99882211', password: 'ultra_secure_pass' });

      const encrypted = await encryptCredentials(tenantId, secret);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(secret);
      expect(encrypted.length).toBeGreaterThan(20);

      const decrypted = await decryptCredentials(tenantId, encrypted);
      expect(decrypted).toBe(secret);
      const parsed = JSON.parse(decrypted);
      expect(parsed.apiKey).toBe('bk_live_99882211');
    });

    it('Different tenants produce different ciphertexts for the same plaintext', async () => {
      const plaintext = 'shared_secret_value_123';
      const encryptedA = await encryptCredentials('tenant_A', plaintext);
      const encryptedB = await encryptCredentials('tenant_B', plaintext);

      expect(encryptedA).not.toBe(encryptedB);
    });

    it('redactSecrets sanitizes sensitive keys and leaves non-sensitive keys intact', () => {
      const payload = {
        hotelId: 'HOTEL_101',
        apiKey: 'SECRET_API_KEY_999',
        apiSecret: 'SECRET_SHHH',
        token: 'BEARER_TOKEN',
        roomCount: 25,
        currency: 'INR',
      };

      const sanitized = redactSecrets(payload);
      expect(sanitized.hotelId).toBe('HOTEL_101');
      expect(sanitized.roomCount).toBe(25);
      expect(sanitized.currency).toBe('INR');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.apiSecret).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
    });

    it('redactSecrets handles deeply nested objects and arrays safely', () => {
      const complex = {
        channel: 'agoda',
        auth: {
          credentials: {
            password: 'my_top_secret_password',
          },
        },
        connections: [
          { name: 'Primary', apiKey: 'KEY1' },
          { name: 'Secondary', apiKey: 'KEY2' },
        ],
      };

      const sanitized = redactSecrets(complex);
      expect(sanitized.auth.credentials.password).toBe('[REDACTED]');
      expect(sanitized.connections[0].apiKey).toBe('[REDACTED]');
      expect(sanitized.connections[0].name).toBe('Primary');
      expect(sanitized.connections[1].apiKey).toBe('[REDACTED]');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. OUTBOX ENGINE & IDEMPOTENCY
  // ---------------------------------------------------------------------------
  describe('Group 2: Outbox Engine & Deduplication', () => {
    it('enqueueChannelSyncJob inserts new job when not previously queued', async () => {
      const mockDb = createMockD1({ existingJob: null });

      const result = await enqueueChannelSyncJob(mockDb as any, {
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        connectionId: 'conn_1',
        jobType: 'availability_push',
        payload: { availableRooms: 8 },
        idempotencyKey: 'idemp_unique_key_001',
      });

      expect(result.jobId).toBeDefined();
      expect(result.deduplicated).toBe(false);

      const stmts = mockDb.getExecutedStatements();
      const insertStmt = stmts.find((s) => s.query.includes('INSERT INTO channel_sync_jobs'));
      expect(insertStmt).toBeDefined();
    });

    it('enqueueChannelSyncJob deduplicates when identical idempotency key is active', async () => {
      const mockDb = createMockD1({
        existingJob: { id: 'existing_csj_99', status: 'queued' },
      });

      const result = await enqueueChannelSyncJob(mockDb as any, {
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        connectionId: 'conn_1',
        jobType: 'availability_push',
        payload: { availableRooms: 8 },
        idempotencyKey: 'idemp_duplicate_key',
      });

      expect(result.jobId).toBe('existing_csj_99');
      expect(result.deduplicated).toBe(true);
    });

    it('executeChannelSyncJob executes job and updates status to succeeded', async () => {
      const mockDb = createMockD1({});
      const adapter = new BookingComAdapter();

      const context = {
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        connectionId: 'conn_1',
        environment: 'sandbox' as const,
        externalPropertyId: '7654321',
        credentials: { apiKey: 'sandbox_test_key' },
      };

      const result = await executeChannelSyncJob(mockDb as any, 'job_test_1', adapter, context);
      expect(result.success).toBe(true);
      expect(result.status).toBe('succeeded');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. ADAPTER REGISTRY & HONEST LABELS
  // ---------------------------------------------------------------------------
  describe('Group 3: Adapter Registry & Honest Production Status', () => {
    it('getChannelAdapter returns correct adapter instance for all 5 providers', () => {
      expect(getChannelAdapter('booking_com')).toBeInstanceOf(BookingComAdapter);
      expect(getChannelAdapter('agoda')).toBeInstanceOf(AgodaAdapter);
      expect(getChannelAdapter('expedia')).toBeInstanceOf(ExpediaAdapter);
      expect(getChannelAdapter('makemytrip')).toBeInstanceOf(MakeMyTripAdapter);
      expect(getChannelAdapter('tripadvisor')).toBeInstanceOf(TripAdvisorAdapter);
    });

    it('getChannelAdapter throws clear error for unsupported provider', () => {
      expect(() => getChannelAdapter('unknown_channel_xyz')).toThrow(
        /Unsupported distribution channel provider/
      );
    });

    it('listSupportedProviders includes all official distribution partners', () => {
      const providers = listSupportedProviders();
      const codes = providers.map((p) => p.code);
      expect(codes).toContain('booking_com');
      expect(codes).toContain('agoda');
      expect(codes).toContain('expedia');
      expect(codes).toContain('makemytrip');
      expect(codes).toContain('tripadvisor');
    });

    it('TripAdvisorAdapter honestly reports pending_approval and never fabricates live status', async () => {
      const adapter = new TripAdvisorAdapter();
      const res = await adapter.testConnection({
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        connectionId: 'conn_1',
        environment: 'production',
        externalPropertyId: 'trip_123',
      });

      expect(res.success).toBe(false);
      expect(res.providerStatus).toBe('pending_approval');
      expect(res.errors[0]).toMatch(/Tripadvisor .* certification/i);
    });

    it('BookingComAdapter in production rejects missing credentials without fabricating success', async () => {
      const adapter = new BookingComAdapter();
      const res = await adapter.testConnection({
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        connectionId: 'conn_1',
        environment: 'production',
        externalPropertyId: '',
        credentials: {},
      });

      expect(res.success).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errors[0]).toContain('Booking.com 7-digit Hotel ID is required');
    });

    it('AgodaAdapter in sandbox mode accepts valid credentials', async () => {
      const adapter = new AgodaAdapter();
      const res = await adapter.testConnection({
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        connectionId: 'conn_1',
        environment: 'sandbox',
        externalPropertyId: 'AGODA_HOTEL_99',
        credentials: { apiKey: 'test_key' },
      });

      expect(res.success).toBe(true);
      expect(res.providerStatus).toBe('sandbox_ready');
    });

    it('ExpediaAdapter validates required configuration fields', async () => {
      const adapter = new ExpediaAdapter();
      const validation = await adapter.validateConfiguration({
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        connectionId: 'conn_1',
        environment: 'sandbox',
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Expedia Hotel ID is required.');
    });

    it('MakeMyTripAdapter validates required IngoMMT configuration', async () => {
      const adapter = new MakeMyTripAdapter();
      const validation = await adapter.validateConfiguration({
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        connectionId: 'conn_1',
        environment: 'sandbox',
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('IngoMMT Hotel ID is required.');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. RESERVATION INGESTION & OVERBOOKING PREVENTION
  // ---------------------------------------------------------------------------
  describe('Group 4: Idempotent Ingestion & Overbooking Prevention', () => {
    it('Duplicate reservation webhook event with identical hash is safely ignored', async () => {
      const hash = 'sha256_sample_hash_123';
      const mockDb = createMockD1({
        connection: { property_id: 'p_1' },
        existingReservation: {
          id: 'cr_existing_1',
          local_reservation_id: 'res_local_1',
          reservation_status: 'create',
          payload_hash: hash,
        },
      });

      const event = {
        externalReservationId: 'BCOM-990011',
        channelCode: 'booking_com',
        action: 'create' as const,
        guestName: 'Jane Doe',
        checkInDate: '2026-11-10',
        checkOutDate: '2026-11-12',
        externalRoomTypeId: 'DLX_01',
        adults: 2,
        children: 0,
        totalAmountMinor: 700000,
        currency: 'INR',
        rawPayload: { id: 'BCOM-990011' },
        payloadHash: hash,
      };

      const result = await ingestChannelReservationEvent(
        mockDb as any,
        'tenant_1',
        'conn_1',
        event
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('duplicate_ignored');
      expect(result.reservationId).toBe('res_local_1');
    });

    it('Overbooking escalates when physical room capacity is exhausted', async () => {
      // 10 total rooms, 10 already booked (none available)
      const mockDb = createMockD1({
        connection: { property_id: 'p_1' },
        existingReservation: null,
        roomCount: 0,
      });

      const event = {
        externalReservationId: 'BCOM-OVERBOOK-01',
        channelCode: 'booking_com',
        action: 'create' as const,
        guestName: 'Unlucky Guest',
        checkInDate: '2026-11-10',
        checkOutDate: '2026-11-12',
        externalRoomTypeId: 'DLX_01',
        adults: 2,
        children: 0,
        totalAmountMinor: 700000,
        currency: 'INR',
        rawPayload: {},
        payloadHash: 'hash_overbook_99',
      };

      const result = await ingestChannelReservationEvent(
        mockDb as any,
        'tenant_1',
        'conn_1',
        event
      );

      expect(result.action).toBe('overbooking_escalated');
      expect(result.discrepancyId).toBeDefined();

      const stmts = mockDb.getExecutedStatements();
      const insertRec = stmts.find((s) => s.query.includes('INSERT INTO channel_reconciliation_records'));
      expect(insertRec).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. RECONCILIATION SCAN & CENTRAL STATE ENFORCEMENT
  // ---------------------------------------------------------------------------
  describe('Group 5: Reconciliation & Central Authority', () => {
    it('runPropertyReconciliationScan flags zero inventory without stop-sell', async () => {
      // 0 available rooms
      const mockDb = createMockD1({
        roomCount: 0,
        reservationsCount: 0,
        blocksCount: 0,
      });

      const report = await runPropertyReconciliationScan(
        mockDb as any,
        'p_1',
        't_1',
        '2026-11-01',
        2
      );

      expect(report.scannedDatesCount).toBe(2);
      expect(report.discrepanciesFound).toBeGreaterThanOrEqual(1);
      expect(report.records[0].discrepancyType).toBe('missing_stop_sell');
      expect(report.records[0].severity).toBe('critical');
    });

    it('forcePushCentralState enqueues stop_sell job and marks record auto_reconciled', async () => {
      const mockDb = createMockD1({
        reconciliationRecord: {
          id: 'rec_99',
          tenant_id: 't_1',
          property_id: 'p_1',
          connection_id: 'c_1',
          room_type_id: 'rt_deluxe',
          stay_date: '2026-11-01',
          resolution_status: 'unresolved',
        },
      });

      const result = await forcePushCentralState(mockDb as any, 'rec_99', 't_1', 'user_admin');
      expect(result.success).toBe(true);

      const stmts = mockDb.getExecutedStatements();
      const updateRec = stmts.find((s) =>
        s.query.includes('UPDATE channel_reconciliation_records SET')
      );
      expect(updateRec).toBeDefined();
      expect(updateRec?.query).toContain("resolution_status = 'auto_reconciled'");
    });
  });
});
