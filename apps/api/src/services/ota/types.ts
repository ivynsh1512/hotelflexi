export interface OtaRateUpdate {
  roomTypeId: string;
  ratePlanId?: string;
  channelRoomTypeId?: string;
  channelRatePlanId?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  pricePaise: number;
  currency: string;
}

export interface OtaInventoryUpdate {
  roomTypeId: string;
  channelRoomTypeId?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  availableCount: number;
  isClosed?: boolean;
}

export interface OtaRestrictionUpdate {
  roomTypeId: string;
  channelRoomTypeId?: string;
  ratePlanId?: string;
  channelRatePlanId?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  closed?: boolean;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
  minStay?: number;
  maxStay?: number;
}

export interface OtaReservationPayload {
  channelBookingRef: string;
  channelName: string;
  status: 'confirmed' | 'modified' | 'cancelled';
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  roomTypeId: string;
  adults: number;
  children: number;
  nightlyRatePaise: number;
  totalAmountPaise: number;
  currency: string;
  specialRequests?: string;
  rawPayload?: any;
}

export interface OtaAdapterResponse {
  success: boolean;
  providerJobId?: string;
  httpStatus: number;
  message: string;
  errors?: string[];
  retryable: boolean;
  isSimulated: boolean;
  rawResponse?: any;
}

export interface IChannelAdapter {
  readonly channelName: string;
  readonly isLiveCapable: boolean;

  pushRates(connection: any, updates: OtaRateUpdate[]): Promise<OtaAdapterResponse>;
  pushInventory(connection: any, updates: OtaInventoryUpdate[]): Promise<OtaAdapterResponse>;
  pushRestrictions(connection: any, updates: OtaRestrictionUpdate[]): Promise<OtaAdapterResponse>;
  fetchReservations(connection: any, sinceTimestamp?: number): Promise<{
    success: boolean;
    reservations: OtaReservationPayload[];
    message: string;
    isSimulated: boolean;
  }>;
  processNotification(connection: any, payload: any): Promise<{
    success: boolean;
    action: 'create' | 'modify' | 'cancel' | 'ignored';
    reservation?: OtaReservationPayload;
    message: string;
  }>;
}
