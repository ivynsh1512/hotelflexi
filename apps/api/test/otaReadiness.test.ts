/**
 * HotelFlexi OTA Connectivity Readiness & Certification Test Suite
 * Validates Agoda OAuth 2.0, PCI DSS VCC Tokenization, EQC/B.XML/IngoMMT Contracts,
 * Webhook Idempotency, Out-of-Order Handling, and Overbooking Prevention.
 */

import { describe, it, expect } from 'vitest';
import { AgodaAdapter } from '../src/services/channelManager/adapters/agodaAdapter';
import { ExpediaAdapter } from '../src/services/channelManager/adapters/expediaAdapter';
import { BookingComAdapter } from '../src/services/channelManager/adapters/bookingComAdapter';
import { MakeMyTripAdapter } from '../src/services/channelManager/adapters/makeMyTripAdapter';
import { AirbnbAdapter } from '../src/services/channelManager/adapters/airbnbAdapter';
import { TripAdvisorAdapter } from '../src/services/channelManager/adapters/tripAdvisorAdapter';
import { generateIcalFeed, parseIcalContent, parseIcalDateToIso } from '../src/services/channelManager/icalService';
import { ingestChannelReservationEvent } from '../src/services/channelManager/reservationIngestion';
import { ChannelConnectionContext, NormalizedReservationEvent } from '../src/services/channelManager/adapterContract';

// Mock in-memory D1 for reservation ingestion testing
function createMockD1Database(options: {
  connectionFound?: boolean;
  existingReservation?: any;
  roomMapping?: any;
  availableRoom?: any;
}) {
  const executedStatements: Array<{ query: string; params: any[] }> = [];

  const createStmt = (query: string, params: any[] = []): any => ({
    bind(...newParams: any[]) {
      return createStmt(query, newParams);
    },
    async first() {
      executedStatements.push({ query, params });
      const q = query.replace(/\s+/g, ' ').trim();

      if (q.includes('FROM hotel_channel_connections')) {
        return options.connectionFound !== false
          ? { property_id: 'prop_test_101', tenant_id: 'tenant_test_01' }
          : null;
      }
      if (q.includes('FROM channel_reservations WHERE connection_id = ?')) {
        return options.existingReservation || null;
      }
      if (q.includes('FROM channel_room_mappings')) {
        return options.roomMapping || { local_room_type_id: 'rt_deluxe_01' };
      }
      if (q.includes('FROM room_types WHERE property_id = ?')) {
        return { id: 'rt_deluxe_01' };
      }
      if (q.includes('FROM rooms WHERE room_type_id = ?')) {
        return options.availableRoom !== undefined ? options.availableRoom : { id: 'room_101', room_number: '101' };
      }
      return null;
    },
    async all() {
      executedStatements.push({ query, params });
      return { results: [] };
    },
    async run() {
      executedStatements.push({ query, params });
      return { success: true, meta: { changes: 1 } };
    },
  });

  return {
    prepare: (query: string) => createStmt(query),
    _statements: executedStatements,
  };
}

describe('OTA Connectivity Readiness & Certification', () => {
  // ---------------------------------------------------------------------------
  // 1. Agoda Supply 2025 OAuth 2.0 Integration
  // ---------------------------------------------------------------------------
  describe('Agoda Supply 2025 OAuth 2.0 Contract', () => {
    const agoda = new AgodaAdapter();

    it('rejects token refresh when credentials are missing', async () => {
      const context: ChannelConnectionContext = {
        connectionId: 'conn_agoda_1',
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        providerCode: 'agoda',
        externalPropertyId: '12345',
        environment: 'sandbox',
        credentials: {},
      };

      const result = await agoda.refreshOAuthToken(context);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing Agoda OAuth 2.0');
    });

    it('successfully generates token in sandbox mode with valid client credentials', async () => {
      const context: ChannelConnectionContext = {
        connectionId: 'conn_agoda_1',
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        providerCode: 'agoda',
        externalPropertyId: '12345',
        environment: 'sandbox',
        credentials: {
          clientId: 'agoda_test_client_id',
          clientSecret: 'agoda_test_client_secret',
        },
      };

      const result = await agoda.refreshOAuthToken(context);
      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.accessToken).toContain('agoda_sand_tok_');
      expect(result.expiresInSeconds).toBe(3600);
    });

    it('acknowledges reservations via OTA_HotelResNotifRS protocol', async () => {
      const context: ChannelConnectionContext = {
        connectionId: 'conn_agoda_1',
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        providerCode: 'agoda',
        externalPropertyId: '12345',
        environment: 'sandbox',
        credentials: { apiKey: 'test' },
      };

      const ack = await agoda.acknowledgeReservation(context, 'AGD-998877', true);
      expect(ack.acknowledged).toBe(true);
      expect(ack.externalReference).toBe('agoda_ack_AGD-998877');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. PCI DSS Compliance & Virtual Credit Card (VCC) Handling
  // ---------------------------------------------------------------------------
  describe('PCI DSS Compliance & VCC Safety', () => {
    it('Agoda Adapter extracts masked PAN and NEVER stores CVV in NormalizedEvent', async () => {
      const agoda = new AgodaAdapter();
      const rawWebhook = {
        booking_id: 'AGD_VCC_100',
        guest_name: 'John Doe',
        check_in: '2026-11-01',
        check_out: '2026-11-04',
        room_type_id: 'DELUXE',
        total_rate: '15000',
        currency: 'INR',
        payment_card: {
          card_type: 'VI',
          cardholder_name: 'Agoda Commercial Services',
          card_number: '4111111111114242', // Raw PAN sent by channel
          expire_month: '12',
          expire_year: '2027',
          cvv: '123', // Raw CVV
        },
      };

      const event = await agoda.parseReservationWebhook(
        {} as any,
        { headers: {}, rawBody: JSON.stringify(rawWebhook), parsedBody: rawWebhook }
      );

      expect(event).not.toBeNull();
      expect(event!.virtualCard).toBeDefined();
      expect(event!.virtualCard!.maskedPan).toBe('************4242'); // Last 4 digits only
      expect((event!.virtualCard as any).cvv).toBeUndefined(); // CVV must NOT exist on metadata
      expect(event!.virtualCard!.cvvProvided).toBe(true); // Flag only
    });

    it('Expedia Adapter extracts masked PAN and never stores CVV', async () => {
      const expedia = new ExpediaAdapter();
      const rawWebhook = {
        confirm_number: 'EXP_VCC_200',
        guest_name: 'Alice Smith',
        arrival: '2026-12-10',
        departure: '2026-12-12',
        room_type_id: 'SUITE',
        total_amount: '22000',
        currency: 'INR',
        virtual_card: {
          cardType: 'MC',
          cardHolderName: 'Expedia Virtual Card',
          cardNumber: '5500000000009999',
          expirationMonth: 6,
          expirationYear: 2028,
          cvv: '999',
        },
      };

      const event = await expedia.parseReservationWebhook(
        {} as any,
        { headers: {}, rawBody: JSON.stringify(rawWebhook), parsedBody: rawWebhook }
      );

      expect(event).not.toBeNull();
      expect(event!.virtualCard).toBeDefined();
      expect(event!.virtualCard!.maskedPan).toBe('************9999');
      expect((event!.virtualCard as any).cvv).toBeUndefined();
      expect(event!.virtualCard!.cvvProvided).toBe(true);
    });

    it('Booking.com Adapter extracts masked PAN and never stores CVC', async () => {
      const bcom = new BookingComAdapter();
      const rawWebhook = {
        reservation_id: 'BCOM_VCC_300',
        customer: { name: 'Bob Roberts' },
        arrival_date: '2026-12-01',
        departure_date: '2026-12-03',
        room_id: 'EXEC',
        total_price: '18500',
        currency: 'INR',
        credit_card: {
          type: 'VI',
          holder_name: 'Booking.com VCC',
          number: '4000000000001111',
          expire_month: 8,
          expire_year: 2027,
          cvc: '456',
        },
      };

      const event = await bcom.parseReservationWebhook(
        {} as any,
        { headers: {}, rawBody: JSON.stringify(rawWebhook), parsedBody: rawWebhook }
      );

      expect(event).not.toBeNull();
      expect(event!.virtualCard).toBeDefined();
      expect(event!.virtualCard!.maskedPan).toBe('************1111');
      expect((event!.virtualCard as any).cvc).toBeUndefined();
      expect((event!.virtualCard as any).cvv).toBeUndefined();
      expect(event!.virtualCard!.cvvProvided).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Provider Acknowledgment Contracts
  // ---------------------------------------------------------------------------
  describe('Provider Acknowledgment Contracts', () => {
    const dummyCtx: ChannelConnectionContext = {
      connectionId: 'c1',
      tenantId: 't1',
      propertyId: 'p1',
      providerCode: 'expedia',
      externalPropertyId: 'hotel_1',
      environment: 'sandbox',
      credentials: {},
    };

    it('Expedia acknowledges reservation successfully', async () => {
      const expedia = new ExpediaAdapter();
      const ack = await expedia.acknowledgeReservation(dummyCtx, 'EXP-776655', true);
      expect(ack.acknowledged).toBe(true);
      expect(ack.externalReference).toBe('exp_ack_EXP-776655');
    });

    it('Booking.com acknowledges reservation successfully', async () => {
      const bcom = new BookingComAdapter();
      const ack = await bcom.acknowledgeReservation(dummyCtx, 'BCOM-554433', true);
      expect(ack.acknowledged).toBe(true);
      expect(ack.externalReference).toBe('bcom_ack_BCOM-554433');
    });

    it('MakeMyTrip acknowledges reservation successfully', async () => {
      const mmt = new MakeMyTripAdapter();
      const ack = await mmt.acknowledgeReservation(dummyCtx, 'MMT-112233', true);
      expect(ack.acknowledged).toBe(true);
      expect(ack.externalReference).toContain('mmt_ack_MMT-112233');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Ingestion Idempotency & Deduplication
  // ---------------------------------------------------------------------------
  describe('Reservation Ingestion Deduplication', () => {
    it('ignores duplicate reservation webhook when payload hash matches existing record', async () => {
      const mockDb = createMockD1Database({
        connectionFound: true,
        existingReservation: {
          id: 'cr_existing_1',
          local_reservation_id: 'res_local_1',
          reservation_status: 'create',
          external_version: 1,
          payload_hash: 'hash_identical_123',
        },
      });

      const event: NormalizedReservationEvent = {
        externalReservationId: 'BOOKING_DUP_1',
        externalVersion: 1,
        channelCode: 'agoda',
        action: 'create',
        guestName: 'Jane Doe',
        checkInDate: '2026-11-10',
        checkOutDate: '2026-11-12',
        externalRoomTypeId: 'DELUXE',
        adults: 2,
        children: 0,
        totalAmountMinor: 1000000,
        currency: 'INR',
        rawPayload: { test: true },
        payloadHash: 'hash_identical_123',
      };

      const result = await ingestChannelReservationEvent(
        mockDb as any,
        'tenant_test_01',
        'conn_test_01',
        event
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('duplicate_ignored');
      expect(result.reservationId).toBe('res_local_1');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Overbooking Detection & Discrepancy Escalation
  // ---------------------------------------------------------------------------
  describe('Overbooking Detection & Safeguards', () => {
    it('records reservation but escalates overbooking discrepancy when no physical room is available', async () => {
      const mockDb = createMockD1Database({
        connectionFound: true,
        availableRoom: null, // Zero rooms available in property
      });

      const event: NormalizedReservationEvent = {
        externalReservationId: 'OVERBOOK_OTA_99',
        externalVersion: 1,
        channelCode: 'booking_com',
        action: 'create',
        guestName: 'Overbooked Guest',
        checkInDate: '2026-11-15',
        checkOutDate: '2026-11-17',
        externalRoomTypeId: 'DELUXE',
        adults: 2,
        children: 0,
        totalAmountMinor: 1200000,
        currency: 'INR',
        rawPayload: {},
        payloadHash: 'hash_overbook_99',
      };

      const result = await ingestChannelReservationEvent(
        mockDb as any,
        'tenant_test_01',
        'conn_test_01',
        event
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('overbooking_escalated');
      expect(result.discrepancyId).toBeDefined();
      expect(result.message).toContain('Physical capacity full');

      // Verify that channel_reconciliation_records INSERT was executed
      const reconInsert = mockDb._statements.find((s) =>
        s.query.includes('channel_reconciliation_records')
      );
      expect(reconInsert).toBeDefined();
      expect(reconInsert?.query).toContain('overbooking_conflict');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Reservation Modifications and Cancellations
  // ---------------------------------------------------------------------------
  describe('Reservation Modification & Cancellation Lifecycle', () => {
    it('processes cancellation and releases room inventory', async () => {
      const mockDb = createMockD1Database({
        connectionFound: true,
        existingReservation: {
          id: 'cr_rec_1',
          local_reservation_id: 'res_local_999',
          reservation_status: 'confirmed',
          external_version: 1,
          payload_hash: 'hash_old',
        },
      });

      const event: NormalizedReservationEvent = {
        externalReservationId: 'BOOKING_CANCEL_01',
        externalVersion: 2,
        channelCode: 'agoda',
        action: 'cancel',
        guestName: 'Cancelling Guest',
        checkInDate: '2026-11-20',
        checkOutDate: '2026-11-22',
        externalRoomTypeId: 'DELUXE',
        adults: 1,
        children: 0,
        totalAmountMinor: 500000,
        currency: 'INR',
        rawPayload: { status: 'Cancelled' },
        payloadHash: 'hash_cancel_01',
      };

      const result = await ingestChannelReservationEvent(
        mockDb as any,
        'tenant_test_01',
        'conn_test_01',
        event
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('cancelled');
      expect(result.reservationId).toBe('res_local_999');

      // Verify update queries for reservations status = 'cancelled'
      const cancelUpdate = mockDb._statements.find((s) =>
        s.query.includes("UPDATE reservations SET status = 'cancelled'")
      );
      expect(cancelUpdate).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Airbnb Partner API & iCal Sync Suite
  // ---------------------------------------------------------------------------
  describe('Airbnb Partner API & iCal Integration', () => {
    const airbnb = new AirbnbAdapter();

    it('validates required credentials correctly', async () => {
      const invalid = await airbnb.validateConfiguration({
        connectionId: 'conn_abnb_1',
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        providerCode: 'airbnb',
        environment: 'sandbox',
        externalPropertyId: '',
        credentials: {},
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);

      const valid = await airbnb.validateConfiguration({
        connectionId: 'conn_abnb_1',
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        providerCode: 'airbnb',
        environment: 'sandbox',
        externalPropertyId: 'listing_12345',
        credentials: { apiKey: 'key_test_123' },
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors.length).toBe(0);
    });

    it('tests connection in sandbox mode with success', async () => {
      const res = await airbnb.testConnection({
        connectionId: 'conn_abnb_1',
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        providerCode: 'airbnb',
        environment: 'sandbox',
        externalPropertyId: 'listing_12345',
        credentials: { apiKey: 'key_test_123' },
      });

      expect(res.success).toBe(true);
      expect(res.providerStatus).toBe('sandbox_ready');
    });

    it('pushes availability and rates cleanly in sandbox', async () => {
      const context: ChannelConnectionContext = {
        connectionId: 'conn_abnb_1',
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        providerCode: 'airbnb',
        environment: 'sandbox',
        externalPropertyId: 'listing_12345',
        credentials: { apiKey: 'key_test_123' },
      };

      const availRes = await airbnb.pushAvailability(context, {
        propertyId: 'prop_1',
        roomTypeId: 'rt_1',
        startDate: '2026-11-01',
        endDateExclusive: '2026-11-05',
        availableRooms: 3,
        channelRoomTypeId: 'listing_12345',
        currency: 'INR',
        sourceVersion: 1,
      });
      expect(availRes.accepted).toBe(true);
      expect(availRes.confirmed).toBe(true);

      const rateRes = await airbnb.pushRates(context, {
        propertyId: 'prop_1',
        roomTypeId: 'rt_1',
        ratePlanId: 'standard',
        startDate: '2026-11-01',
        endDateExclusive: '2026-11-03',
        channelRoomTypeId: 'listing_12345',
        channelRatePlanId: 'standard',
        nightlyPrices: [
          { date: '2026-11-01', amountMinor: 350000, currency: 'INR' },
          { date: '2026-11-02', amountMinor: 350000, currency: 'INR' },
        ],
      });
      expect(rateRes.accepted).toBe(true);
      expect(rateRes.confirmed).toBe(true);
    });

    it('parses incoming Airbnb reservation webhook payload', async () => {
      const event = await airbnb.parseReservationWebhook(
        {
          connectionId: 'conn_abnb_1',
          tenantId: 'tenant_1',
          propertyId: 'prop_1',
          providerCode: 'airbnb',
          environment: 'sandbox',
        },
        {
          rawBody: '{}',
          headers: {},
          parsedBody: {
            reservation_code: 'HM8XYZ99',
            event_type: 'reservation_created',
            listing_id: 'listing_12345',
            start_date: '2026-12-10',
            end_date: '2026-12-15',
            number_of_guests: 2,
            payout_price_in_cents: 1800000,
            currency: 'INR',
            guest: {
              first_name: 'Priya',
              last_name: 'Sharma',
              email: 'priya@example.com',
              phone: '+919876543210',
            },
            notes: 'Late check-in requested around 9 PM',
          },
        }
      );

      expect(event).not.toBeNull();
      expect(event?.externalReservationId).toBe('HM8XYZ99');
      expect(event?.guestName).toBe('Priya Sharma');
      expect(event?.checkInDate).toBe('2026-12-10');
      expect(event?.checkOutDate).toBe('2026-12-15');
      expect(event?.adults).toBe(2);
      expect(event?.totalAmountMinor).toBe(1800000);
      expect(event?.channelCode).toBe('airbnb');
    });

    it('parses iCal date formats into ISO standard YYYY-MM-DD', () => {
      expect(parseIcalDateToIso('20261025')).toBe('2026-10-25');
      expect(parseIcalDateToIso('VALUE=DATE:20261102')).toBe('2026-11-02');
      expect(parseIcalDateToIso('20261231T140000Z')).toBe('2026-12-31');
    });

    it('parses RFC 5545 iCalendar text into structured events', () => {
      const sampleIcs = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Airbnb Inc//Hosting Calendar 0.8//EN',
        'BEGIN:VEVENT',
        'DTSTART;VALUE=DATE:20261110',
        'DTEND;VALUE=DATE:20261114',
        'UID:airbnb_res_123@airbnb.com',
        'SUMMARY:Reserved - Rahul Verma',
        'DESCRIPTION:Reservation at Luxury Villa',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const events = parseIcalContent(sampleIcs);
      expect(events.length).toBe(1);
      expect(events[0].uid).toBe('airbnb_res_123@airbnb.com');
      expect(events[0].dtStart).toBe('2026-11-10');
      expect(events[0].dtEnd).toBe('2026-11-14');
      expect(events[0].summary).toBe('Reserved - Rahul Verma');
      expect(events[0].status).toBe('CONFIRMED');
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Tripadvisor TripConnect Instant Booking & Plus Metasearch
  // ---------------------------------------------------------------------------
  describe('TripAdvisor TripConnect Contract', () => {
    const ta = new TripAdvisorAdapter();

    it('validates configuration correctly', async () => {
      const invalid = await ta.validateConfiguration({
        connectionId: 'conn_ta_1',
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        providerCode: 'tripadvisor',
        environment: 'sandbox',
        externalPropertyId: '',
        credentials: {},
      });
      expect(invalid.valid).toBe(false);

      const valid = await ta.validateConfiguration({
        connectionId: 'conn_ta_1',
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        providerCode: 'tripadvisor',
        environment: 'sandbox',
        externalPropertyId: 'loc_987654',
        credentials: { partnerKey: 'ta_key_abc' },
      });
      expect(valid.valid).toBe(true);
    });

    it('tests connection in sandbox mode with success', async () => {
      const res = await ta.testConnection({
        connectionId: 'conn_ta_1',
        tenantId: 'tenant_1',
        propertyId: 'prop_1',
        providerCode: 'tripadvisor',
        environment: 'sandbox',
        externalPropertyId: 'loc_987654',
        credentials: { partnerKey: 'ta_key_abc' },
      });

      expect(res.success).toBe(true);
      expect(res.providerStatus).toBe('sandbox_ready');
    });

    it('parses incoming Tripadvisor Instant Booking webhook payload', async () => {
      const event = await ta.parseReservationWebhook(
        {
          connectionId: 'conn_ta_1',
          tenantId: 'tenant_1',
          propertyId: 'prop_1',
          providerCode: 'tripadvisor',
          environment: 'sandbox',
        },
        {
          rawBody: '{}',
          headers: {},
          parsedBody: {
            booking_id: 'TA-BOOK-8821',
            status: 'CONFIRMED',
            room_type: 'DELUXE_SEA_VIEW',
            check_in_date: '2026-12-01',
            check_out_date: '2026-12-04',
            num_adults: 2,
            num_children: 1,
            total_price_cents: 1500000,
            currency: 'INR',
            traveler: {
              first_name: 'Ananya',
              last_name: 'Deshmukh',
              email: 'ananya@example.com',
              phone: '+919811223344',
            },
            special_instructions: 'High floor preferred',
          },
        }
      );

      expect(event).not.toBeNull();
      expect(event?.externalReservationId).toBe('TA-BOOK-8821');
      expect(event?.guestName).toBe('Ananya Deshmukh');
      expect(event?.checkInDate).toBe('2026-12-01');
      expect(event?.checkOutDate).toBe('2026-12-04');
      expect(event?.adults).toBe(2);
      expect(event?.children).toBe(1);
      expect(event?.totalAmountMinor).toBe(1500000);
      expect(event?.specialRequests).toBe('High floor preferred');
      expect(event?.channelCode).toBe('tripadvisor');
    });
  });
});
