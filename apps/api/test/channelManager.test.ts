import { describe, it, expect } from 'vitest';
import { getOtaAdapter } from '../src/services/ota/adapterRegistry';
import { SimulatedChannelAdapter } from '../src/services/ota/simulatedAdapter';
import { MakeMyTripChannelAdapter } from '../src/services/ota/makeMyTripAdapter';
import { AgodaChannelAdapter } from '../src/services/ota/agodaAdapter';
import { BookingComChannelAdapter } from '../src/services/ota/bookingComAdapter';
import { ExpediaChannelAdapter } from '../src/services/ota/expediaAdapter';
import {
  calculateDateInventory,
  checkOversellSafety,
  bulkUpdateRatesAndRestrictions,
} from '../src/services/inventoryEngine';
import { enqueueSyncJob, executeSyncJob } from '../src/services/syncEngine';
import { processOtaReservationEvent } from '../src/services/channelReservationService';

// Helper to create an in-memory mock D1Database for unit testing service logic
function createMockD1Database(mockData: {
  roomType?: any;
  totalRooms?: number;
  blockedRooms?: number;
  bookedRooms?: number;
  restriction?: any;
  dailyRate?: any;
  property?: any;
  job?: any;
  connection?: any;
  existingBooking?: any;
  reservation?: any;
}) {
  const executedStatements: Array<{ query: string; params: any[] }> = [];

  const mockPreparedStatement = (query: string, params: any[] = []): any => ({
    bind(...newParams: any[]) {
      return mockPreparedStatement(query, newParams);
    },
    async first(colName?: string) {
      executedStatements.push({ query, params });
      const norm = query.replace(/\s+/g, ' ').trim();

      // Match query patterns
      if (norm.includes('FROM room_types')) {
        return mockData.roomType || null;
      }
      if (norm.includes('FROM room_blocks')) {
        return { count: mockData.blockedRooms ?? 0 };
      }
      if (norm.includes('FROM reservations') && norm.includes('COUNT(*)')) {
        return { count: mockData.bookedRooms ?? 0 };
      }
      if (norm.includes('FROM rooms') && norm.includes('COUNT(*)')) {
        return { count: mockData.totalRooms ?? 10 };
      }
      if (norm.includes('FROM daily_restrictions')) {
        return mockData.restriction || null;
      }
      if (norm.includes('FROM daily_rates')) {
        return mockData.dailyRate || null;
      }
      if (norm.includes('FROM properties')) {
        return mockData.property || { id: 'prop_123', name: 'Hotel Grand' };
      }
      if (norm.includes('FROM sync_jobs') && norm.includes('idempotency_key')) {
        return mockData.job ? { id: mockData.job.id, status: mockData.job.status } : null;
      }
      if (norm.includes('FROM sync_jobs sj') || norm.includes('FROM sync_jobs')) {
        return mockData.job || null;
      }
      if (norm.includes('FROM ota_connections')) {
        return (
          mockData.connection || {
            id: 'conn_mmt_1',
            property_id: 'prop_123',
            channel_name: 'makemytrip',
            hotel_channel_id: 'MMT_H_101',
            environment: 'sandbox',
            status: 'connected',
            credentials_json: null,
          }
        );
      }
      if (norm.includes('FROM channel_bookings')) {
        return mockData.existingBooking || null;
      }
      if (norm.includes('FROM reservations WHERE id = ?')) {
        return mockData.reservation || null;
      }

      return null;
    },
    async all() {
      executedStatements.push({ query, params });
      const norm = query.replace(/\s+/g, ' ').trim();
      if (norm.includes('FROM room_types')) {
        return {
          results: mockData.roomType ? [mockData.roomType] : [],
          success: true,
          meta: {} as any,
        };
      }
      return { results: [], success: true, meta: {} as any };
    },
    async run() {
      executedStatements.push({ query, params });
      return { success: true, meta: { changes: 1 } as any };
    },
  });

  const db: any = {
    executedStatements,
    prepare(query: string) {
      return mockPreparedStatement(query);
    },
    async batch(statements: any[]) {
      for (const stmt of statements) {
        await stmt.run();
      }
      return statements.map(() => ({ success: true, meta: { changes: 1 } }));
    },
  };

  return db;
}

describe('HotelFlexi Channel Manager Core — Architecture & Unit Tests', () => {
  // ---------------------------------------------------------------------------
  // 1. Adapter Registry & Concrete Providers
  // ---------------------------------------------------------------------------
  describe('1. OTA Adapter Registry & Concrete Providers', () => {
    it('should resolve the correct adapter instance for each provider', () => {
      expect(getOtaAdapter('makemytrip')).toBeInstanceOf(MakeMyTripChannelAdapter);
      expect(getOtaAdapter('agoda')).toBeInstanceOf(AgodaChannelAdapter);
      expect(getOtaAdapter('booking_com')).toBeInstanceOf(BookingComChannelAdapter);
      expect(getOtaAdapter('expedia')).toBeInstanceOf(ExpediaChannelAdapter);
      expect(getOtaAdapter('unknown_channel')).toBeInstanceOf(SimulatedChannelAdapter);
    });

    it('should flag simulated responses explicitly when live credentials are not present', async () => {
      const adapter = getOtaAdapter('makemytrip');
      const conn = {
        id: 'conn_1',
        channel_name: 'makemytrip',
        hotel_channel_id: 'MMT_HOTEL_99',
        environment: 'sandbox',
      };

      const rateResp = await adapter.pushRates(conn, [
        {
          roomTypeId: 'rt_deluxe',
          startDate: '2026-10-25',
          endDate: '2026-10-27',
          pricePaise: 450000,
          currency: 'INR',
        },
      ]);

      expect(rateResp.success).toBe(true);
      expect(rateResp.isSimulated).toBe(true);
      expect(rateResp.httpStatus).toBe(200);

      const invResp = await adapter.pushInventory(conn, [
        {
          roomTypeId: 'rt_deluxe',
          startDate: '2026-10-25',
          endDate: '2026-10-27',
          availableCount: 4,
        },
      ]);
      expect(invResp.success).toBe(true);
      expect(invResp.isSimulated).toBe(true);
    });

    it('should handle simulated failure triggers for retryable and terminal errors', async () => {
      const adapter = getOtaAdapter('simulated');

      // Retryable failure simulation
      const retryResp = await adapter.pushRates(
        { id: 'conn_sim', channel_name: 'simulated', hotel_channel_id: 'SIM_FAIL_RETRY' },
        [
          {
            roomTypeId: 'rt_1',
            startDate: '2026-10-25',
            endDate: '2026-10-26',
            pricePaise: 300000,
            currency: 'INR',
          },
        ]
      );
      expect(retryResp.success).toBe(false);
      expect(retryResp.retryable).toBe(true);
      expect(retryResp.httpStatus).toBe(503);

      // Terminal failure simulation
      const termResp = await adapter.pushRates(
        { id: 'conn_sim', channel_name: 'simulated', hotel_channel_id: 'SIM_FAIL_TERMINAL' },
        [
          {
            roomTypeId: 'rt_1',
            startDate: '2026-10-25',
            endDate: '2026-10-26',
            pricePaise: 300000,
            currency: 'INR',
          },
        ]
      );
      expect(termResp.success).toBe(false);
      expect(termResp.retryable).toBe(false);
      expect(termResp.httpStatus).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Inventory Engine Calculations & Restrictions
  // ---------------------------------------------------------------------------
  describe('2. Inventory Engine & Restrictions Calculation', () => {
    it('should accurately calculate available inventory: total - blocked - booked', async () => {
      const db = createMockD1Database({
        roomType: {
          id: 'rt_1',
          name: 'Deluxe Suite',
          code: 'DLX',
          base_price_paise: 500000,
          weekend_price_paise: 600000,
        },
        totalRooms: 10,
        blockedRooms: 2,
        bookedRooms: 3,
        restriction: null,
      });

      const inv = await calculateDateInventory(db, 'prop_1', 'tenant_1', 'rt_1', '2026-10-25');
      expect(inv.totalRooms).toBe(10);
      expect(inv.blockedRooms).toBe(2);
      expect(inv.bookedRooms).toBe(3);
      expect(inv.availableRooms).toBe(5);
      expect(inv.sellableInventory).toBe(5);
      expect(inv.closed).toBe(false);
    });

    it('should enforce stop-sell restriction by zeroing sellable inventory', async () => {
      const db = createMockD1Database({
        roomType: {
          id: 'rt_1',
          name: 'Deluxe Suite',
          code: 'DLX',
          base_price_paise: 500000,
        },
        totalRooms: 10,
        blockedRooms: 1,
        bookedRooms: 1,
        restriction: {
          closed: 1,
          closed_to_arrival: 1,
          min_stay_arrival: 2,
        },
      });

      const inv = await calculateDateInventory(db, 'prop_1', 'tenant_1', 'rt_1', '2026-10-25');
      expect(inv.availableRooms).toBe(8); // Physical still 8
      expect(inv.sellableInventory).toBe(0); // Zeroed due to stop-sell!
      expect(inv.closed).toBe(true);
      expect(inv.closedToArrival).toBe(true);
      expect(inv.minStayArrival).toBe(2);
    });

    it('should cap override inventory to physical available rooms', async () => {
      const db = createMockD1Database({
        roomType: {
          id: 'rt_1',
          name: 'Deluxe Suite',
          code: 'DLX',
          base_price_paise: 500000,
        },
        totalRooms: 5,
        blockedRooms: 0,
        bookedRooms: 1, // Available = 4
        restriction: {
          closed: 0,
          override_inventory: 10, // Attempting to sell 10 when only 4 physically exist
        },
      });

      const inv = await calculateDateInventory(db, 'prop_1', 'tenant_1', 'rt_1', '2026-10-25');
      expect(inv.availableRooms).toBe(4);
      expect(inv.sellableInventory).toBe(4); // Strictly capped at physical availability (4)
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Oversell Safety Guard
  // ---------------------------------------------------------------------------
  describe('3. Concurrency & Oversell Protection Guard', () => {
    it('should permit booking when all dates have positive availability', async () => {
      const db = createMockD1Database({
        totalRooms: 5,
        blockedRooms: 1,
        bookedRooms: 2, // Available = 2
        restriction: { closed: 0 },
      });

      const check = await checkOversellSafety(
        db,
        'prop_1',
        'tenant_1',
        'rt_1',
        '2026-10-25',
        '2026-10-28'
      );
      expect(check.allowed).toBe(true);
    });

    it('should deny booking if any night in range has zero available rooms', async () => {
      const db = createMockD1Database({
        totalRooms: 3,
        blockedRooms: 1,
        bookedRooms: 2, // Available = 0
        restriction: { closed: 0 },
      });

      const check = await checkOversellSafety(
        db,
        'prop_1',
        'tenant_1',
        'rt_1',
        '2026-10-25',
        '2026-10-28'
      );
      expect(check.allowed).toBe(false);
      expect(check.availableCount).toBe(0);
      expect(check.conflictingDate).toBe('2026-10-25');
    });

    it('should deny booking if any night in range has closed stop-sell active', async () => {
      const db = createMockD1Database({
        totalRooms: 10,
        blockedRooms: 0,
        bookedRooms: 0,
        restriction: { closed: 1 }, // Stop-sell active
      });

      const check = await checkOversellSafety(
        db,
        'prop_1',
        'tenant_1',
        'rt_1',
        '2026-10-25',
        '2026-10-28'
      );
      expect(check.allowed).toBe(false);
      expect(check.conflictingDate).toBe('2026-10-25');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Bulk Update Validations & Day Filtering
  // ---------------------------------------------------------------------------
  describe('4. Bulk Update Validations & Stay Restrictions', () => {
    it('should reject invalid date range where start date > end date', async () => {
      const db = createMockD1Database({});
      await expect(
        bulkUpdateRatesAndRestrictions(db, 'tenant_1', {
          propertyId: 'prop_123',
          roomTypeId: 'rt_1',
          startDate: '2026-10-30',
          endDate: '2026-10-20',
        })
      ).rejects.toThrow('Start date cannot be after end date');
    });

    it('should reject negative room price', async () => {
      const db = createMockD1Database({});
      await expect(
        bulkUpdateRatesAndRestrictions(db, 'tenant_1', {
          propertyId: 'prop_123',
          roomTypeId: 'rt_1',
          startDate: '2026-10-20',
          endDate: '2026-10-25',
          pricePaise: -500,
        })
      ).rejects.toThrow('Price cannot be negative');
    });

    it('should reject maximum stay less than minimum stay', async () => {
      const db = createMockD1Database({});
      await expect(
        bulkUpdateRatesAndRestrictions(db, 'tenant_1', {
          propertyId: 'prop_123',
          roomTypeId: 'rt_1',
          startDate: '2026-10-20',
          endDate: '2026-10-25',
          minStayArrival: 5,
          maxStay: 2,
        })
      ).rejects.toThrow('Maximum stay cannot be less than minimum stay');
    });

    it('should filter dates by selected days of the week', async () => {
      const db = createMockD1Database({});
      // Range: 2026-10-18 (Sun) to 2026-10-24 (Sat) -> 7 days total
      // Select only Friday (5) and Saturday (6)
      const res = await bulkUpdateRatesAndRestrictions(db, 'tenant_1', {
        propertyId: 'prop_123',
        roomTypeId: 'rt_1',
        startDate: '2026-10-18',
        endDate: '2026-10-24',
        daysOfWeek: [5, 6],
        pricePaise: 400000,
      });

      expect(res.success).toBe(true);
      expect(res.updatedDatesCount).toBe(2);
      expect(res.affectedDates).toEqual(['2026-10-23', '2026-10-24']);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Exponential Backoff & Sync Engine Idempotency
  // ---------------------------------------------------------------------------
  describe('5. Synchronization Engine & Exponential Backoff', () => {
    it('should deduplicate jobs matching identical idempotency key', async () => {
      const db = createMockD1Database({
        job: { id: 'sync_existing_123', status: 'pending' },
      });

      const res = await enqueueSyncJob(db, {
        connectionId: 'conn_1',
        propertyId: 'prop_123',
        tenantId: 'tenant_1',
        jobType: 'rates_push',
        channelName: 'makemytrip',
        startDate: '2026-10-25',
        endDate: '2026-10-28',
      });

      expect(res.deduplicated).toBe(true);
      expect(res.jobId).toBe('sync_existing_123');
    });

    it('should compute correct exponential backoff delays', () => {
      const calcDelay = (retryCount: number) =>
        Math.min(3600, 30 * Math.pow(2, retryCount));

      expect(calcDelay(0)).toBe(30);   // 30 seconds
      expect(calcDelay(1)).toBe(60);   // 1 minute
      expect(calcDelay(2)).toBe(120);  // 2 minutes
      expect(calcDelay(3)).toBe(240);  // 4 minutes
      expect(calcDelay(7)).toBe(3600); // 3840s capped at 1 hour (3600s)
      expect(calcDelay(10)).toBe(3600);// Capped at 1 hour
    });

    it('should transition to retry status on transient failure within max retries', async () => {
      const db = createMockD1Database({
        job: {
          id: 'sync_fail_1',
          connection_id: 'conn_1',
          property_id: 'prop_123',
          tenant_id: 'tenant_1',
          channel_name: 'simulated',
          conn_channel: 'simulated',
          hotel_channel_id: 'SIM_FAIL_RETRY', // Triggers simulated 503 retryable
          job_type: 'rates_push',
          room_type_id: 'rt_1',
          payload: null,
          retry_count: 1,
          max_retries: 3,
        },
      });

      const execResult = await executeSyncJob(db, 'sync_fail_1');
      expect(execResult.status).toBe('retry');
      expect(execResult.retryCount).toBe(2);
      expect(execResult.httpStatus).toBe(503);
      expect(execResult.nextRetryAt).toBeDefined();
    });

    it('should transition to terminal failed status when max retries exceeded', async () => {
      const db = createMockD1Database({
        job: {
          id: 'sync_fail_max',
          connection_id: 'conn_1',
          property_id: 'prop_123',
          tenant_id: 'tenant_1',
          channel_name: 'simulated',
          conn_channel: 'simulated',
          hotel_channel_id: 'SIM_FAIL_RETRY',
          job_type: 'rates_push',
          room_type_id: 'rt_1',
          payload: null,
          retry_count: 3, // Already reached max retries (3)
          max_retries: 3,
        },
      });

      const execResult = await executeSyncJob(db, 'sync_fail_max');
      expect(execResult.status).toBe('failed');
      expect(execResult.retryCount).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Reservation Concurrency & Duplicate Prevention
  // ---------------------------------------------------------------------------
  describe('6. Channel Reservation Deduplication & Concurrency', () => {
    it('should ignore duplicate reservation events with identical status', async () => {
      const db = createMockD1Database({
        connection: {
          id: 'conn_1',
          property_id: 'prop_123',
          channel_name: 'booking_com',
        },
        property: { id: 'prop_123', name: 'Hotel Grand' },
        existingBooking: {
          id: 'cb_123',
          reservation_id: 'res_existing_456',
          channel_booking_ref: 'OTA-REF-1001',
          channel_status: 'confirmed',
        },
      });

      const result = await processOtaReservationEvent(db, 'tenant_1', 'conn_1', {
        channelBookingRef: 'OTA-REF-1001',
        channelName: 'booking_com',
        status: 'confirmed',
        guestName: 'John Doe',
        checkInDate: '2026-10-25',
        checkOutDate: '2026-10-28',
        roomTypeId: 'rt_deluxe',
        adults: 2,
        children: 0,
        nightlyRatePaise: 400000,
        totalAmountPaise: 1200000,
        currency: 'INR',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('duplicate_ignored');
      expect(result.reservationId).toBe('res_existing_456');
    });

    it('should cancel active reservation and reopen inventory on cancellation event', async () => {
      const db = createMockD1Database({
        connection: {
          id: 'conn_1',
          property_id: 'prop_123',
          channel_name: 'booking_com',
        },
        property: { id: 'prop_123', name: 'Hotel Grand' },
        existingBooking: {
          id: 'cb_123',
          reservation_id: 'res_active_789',
          channel_booking_ref: 'OTA-REF-2002',
          channel_status: 'confirmed',
        },
        reservation: {
          id: 'res_active_789',
          reservation_number: 'RES-789',
          room_type_id: 'rt_deluxe',
          check_in_date: '2026-10-25',
          check_out_date: '2026-10-28',
          status: 'confirmed',
        },
      });

      const result = await processOtaReservationEvent(db, 'tenant_1', 'conn_1', {
        channelBookingRef: 'OTA-REF-2002',
        channelName: 'booking_com',
        status: 'cancelled',
        guestName: 'Jane Smith',
        checkInDate: '2026-10-25',
        checkOutDate: '2026-10-28',
        roomTypeId: 'rt_deluxe',
        adults: 1,
        children: 0,
        nightlyRatePaise: 400000,
        totalAmountPaise: 1200000,
        currency: 'INR',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('cancelled');
      expect(result.reservationId).toBe('res_active_789');
      expect(result.reservationNumber).toBe('RES-789');
    });
  });
});
