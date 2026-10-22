/**
 * HotelFlexi Channel Manager — Official Provider Independent Adapter Interface
 * Implements architectural contracts matching Phase 3 specifications.
 */

export type ChannelCapability =
  | 'property_mapping'
  | 'room_mapping'
  | 'rate_plan_mapping'
  | 'availability_push'
  | 'rates_push'
  | 'restrictions_push'
  | 'reservation_pull'
  | 'reservation_webhook'
  | 'reservation_cancel'
  | 'inventory_pull'
  | 'rate_pull';

export interface ChannelConnectionContext {
  tenantId: string;
  propertyId: string;
  connectionId: string;
  environment: 'sandbox' | 'production';
  /** Optional provider code hint (e.g. 'agoda', 'expedia') for logging/diagnostics. */
  providerCode?: string;
  externalPropertyId?: string;
  credentials?: Record<string, any>;
}

export interface AvailabilityUpdate {
  propertyId: string;
  roomTypeId: string;
  channelRoomTypeId?: string;
  startDate: string; // YYYY-MM-DD
  endDateExclusive: string; // YYYY-MM-DD
  availableRooms: number;
  currency: string;
  sourceVersion: number;
}

export interface RateUpdate {
  propertyId: string;
  roomTypeId: string;
  channelRoomTypeId?: string;
  ratePlanId: string;
  channelRatePlanId?: string;
  startDate: string; // YYYY-MM-DD
  endDateExclusive: string; // YYYY-MM-DD
  nightlyPrices: Array<{
    date: string; // YYYY-MM-DD
    amountMinor: number; // in paise
    currency: string;
  }>;
}

export interface RestrictionUpdate {
  propertyId: string;
  roomTypeId: string;
  channelRoomTypeId?: string;
  ratePlanId?: string;
  channelRatePlanId?: string;
  startDate: string; // YYYY-MM-DD
  endDateExclusive: string; // YYYY-MM-DD
  stopSell?: boolean;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
  minimumStay?: number;
  maximumStay?: number;
}

export interface ChannelOperationResult {
  accepted: boolean;
  confirmed: boolean;
  externalReference?: string;
  correlationId: string;
  retryable: boolean;
  httpStatus?: number;
  providerStatus?: string;
  errorCategory?: 'AUTH_FAILURE' | 'MAPPING_ERROR' | 'NETWORK_TIMEOUT' | 'RATE_LIMIT_EXCEEDED' | 'PROVIDER_OUTAGE' | 'VALIDATION_ERROR';
  errors: Array<{
    code: string;
    message: string;
  }>;
  rawResponse?: any;
}

export interface VirtualCreditCardMetadata {
  tokenizedCardId?: string;
  cardType?: string; // 'VI', 'MC', 'AX'
  cardHolderName?: string;
  maskedPan?: string; // e.g. '************4242'
  expirationMonth?: number;
  expirationYear?: number;
  effectiveDate?: string;
  amountMinor?: number;
  currency?: string;
  cvvProvided?: boolean; // flag only, NEVER store CVV value (PCI DSS Req 3.2.2)
}

export interface OAuthTokenResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresInSeconds?: number;
  error?: string;
}

export interface NormalizedReservationEvent {
  externalReservationId: string;
  externalVersion?: number;
  channelCode: string;
  action: 'create' | 'modify' | 'cancel';
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  externalRoomTypeId: string;
  externalRatePlanId?: string;
  adults: number;
  children: number;
  totalAmountMinor: number;
  currency: string;
  specialRequests?: string;
  virtualCard?: VirtualCreditCardMetadata;
  rawPayload: any;
  payloadHash: string;
}

export interface ReservationBatch {
  success: boolean;
  reservations: NormalizedReservationEvent[];
  cursor?: string;
  errors: string[];
}

export interface VerifiedWebhookRequest {
  headers: Record<string, string>;
  rawBody: string;
  parsedBody: any;
}

export interface ChannelAdapter {
  readonly providerCode: string;
  readonly displayName: string;

  getCapabilities(
    context: ChannelConnectionContext
  ): Promise<ChannelCapability[]>;

  validateConfiguration(
    context: ChannelConnectionContext
  ): Promise<{
    valid: boolean;
    errors: string[];
  }>;

  testConnection(
    context: ChannelConnectionContext
  ): Promise<{
    success: boolean;
    providerStatus?: string;
    correlationId: string;
    errors: string[];
  }>;

  pushAvailability?(
    context: ChannelConnectionContext,
    request: AvailabilityUpdate
  ): Promise<ChannelOperationResult>;

  pushRates?(
    context: ChannelConnectionContext,
    request: RateUpdate
  ): Promise<ChannelOperationResult>;

  pushRestrictions?(
    context: ChannelConnectionContext,
    request: RestrictionUpdate
  ): Promise<ChannelOperationResult>;

  fetchReservations?(
    context: ChannelConnectionContext,
    cursor?: string
  ): Promise<ReservationBatch>;

  parseReservationWebhook?(
    context: ChannelConnectionContext,
    request: VerifiedWebhookRequest
  ): Promise<NormalizedReservationEvent | null>;

  refreshOAuthToken?(
    context: ChannelConnectionContext
  ): Promise<OAuthTokenResult>;

  acknowledgeReservation?(
    context: ChannelConnectionContext,
    externalReservationId: string,
    success: boolean
  ): Promise<{ acknowledged: boolean; externalReference?: string; error?: string }>;
}
