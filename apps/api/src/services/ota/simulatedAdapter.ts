import {
  IChannelAdapter,
  OtaRateUpdate,
  OtaInventoryUpdate,
  OtaRestrictionUpdate,
  OtaReservationPayload,
  OtaAdapterResponse,
} from './types';

export class SimulatedChannelAdapter implements IChannelAdapter {
  readonly channelName: string;
  readonly isLiveCapable = false;

  constructor(channelName: string = 'simulated') {
    this.channelName = channelName;
  }

  async pushRates(connection: any, updates: OtaRateUpdate[]): Promise<OtaAdapterResponse> {
    // Validate updates
    for (const u of updates) {
      if (!u.startDate || !u.endDate || u.startDate > u.endDate) {
        return {
          success: false,
          httpStatus: 400,
          message: `Invalid date range: ${u.startDate} to ${u.endDate}`,
          retryable: false,
          isSimulated: true,
        };
      }
      if (u.pricePaise < 0) {
        return {
          success: false,
          httpStatus: 400,
          message: `Invalid rate: ${u.pricePaise} paise must be >= 0`,
          retryable: false,
          isSimulated: true,
        };
      }
    }

    // Check if test simulates failure
    if (connection?.hotel_channel_id === 'SIM_FAIL_RETRY') {
      return {
        success: false,
        providerJobId: `sim_fail_${crypto.randomUUID().slice(0, 8)}`,
        httpStatus: 503,
        message: 'Simulated 503 Service Unavailable: Remote OTA gateway timeout',
        retryable: true,
        isSimulated: true,
      };
    }

    if (connection?.hotel_channel_id === 'SIM_FAIL_TERMINAL') {
      return {
        success: false,
        providerJobId: `sim_err_${crypto.randomUUID().slice(0, 8)}`,
        httpStatus: 401,
        message: 'Simulated 401 Unauthorized: Invalid OTA property credentials',
        retryable: false,
        isSimulated: true,
      };
    }

    return {
      success: true,
      providerJobId: `sim_job_${crypto.randomUUID().slice(0, 8)}`,
      httpStatus: 200,
      message: `[Simulated] Successfully pushed ${updates.length} rate updates to ${this.channelName}`,
      retryable: false,
      isSimulated: true,
      rawResponse: {
        channel: this.channelName,
        hotelId: connection.hotel_channel_id,
        itemsProcessed: updates.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async pushInventory(connection: any, updates: OtaInventoryUpdate[]): Promise<OtaAdapterResponse> {
    for (const u of updates) {
      if (!u.startDate || !u.endDate || u.startDate > u.endDate) {
        return {
          success: false,
          httpStatus: 400,
          message: `Invalid date range: ${u.startDate} to ${u.endDate}`,
          retryable: false,
          isSimulated: true,
        };
      }
      if (u.availableCount < 0) {
        return {
          success: false,
          httpStatus: 400,
          message: `Invalid inventory: ${u.availableCount} must be >= 0`,
          retryable: false,
          isSimulated: true,
        };
      }
    }

    if (connection?.hotel_channel_id === 'SIM_FAIL_RETRY') {
      return {
        success: false,
        httpStatus: 504,
        message: 'Simulated 504 Gateway Timeout: OTA ARI endpoint unresponsive',
        retryable: true,
        isSimulated: true,
      };
    }

    return {
      success: true,
      providerJobId: `sim_inv_${crypto.randomUUID().slice(0, 8)}`,
      httpStatus: 200,
      message: `[Simulated] Successfully synchronized ${updates.length} inventory dates with ${this.channelName}`,
      retryable: false,
      isSimulated: true,
    };
  }

  async pushRestrictions(connection: any, updates: OtaRestrictionUpdate[]): Promise<OtaAdapterResponse> {
    for (const u of updates) {
      if (u.minStay && u.minStay < 1) {
        return {
          success: false,
          httpStatus: 400,
          message: `Minimum stay must be at least 1 night`,
          retryable: false,
          isSimulated: true,
        };
      }
      if (u.maxStay && u.minStay && u.maxStay < u.minStay) {
        return {
          success: false,
          httpStatus: 400,
          message: `Maximum stay (${u.maxStay}) cannot be less than minimum stay (${u.minStay})`,
          retryable: false,
          isSimulated: true,
        };
      }
    }

    return {
      success: true,
      providerJobId: `sim_rst_${crypto.randomUUID().slice(0, 8)}`,
      httpStatus: 200,
      message: `[Simulated] Successfully pushed restrictions (stop-sell, CTA/CTD, min/max stay) to ${this.channelName}`,
      retryable: false,
      isSimulated: true,
    };
  }

  async fetchReservations(
    connection: any,
    sinceTimestamp?: number
  ): Promise<{
    success: boolean;
    reservations: OtaReservationPayload[];
    message: string;
    isSimulated: boolean;
  }> {
    return {
      success: true,
      reservations: [],
      message: `[Simulated] Checked ${this.channelName} for new bookings. No pending bookings found.`,
      isSimulated: true,
    };
  }

  async processNotification(
    connection: any,
    payload: any
  ): Promise<{
    success: boolean;
    action: 'create' | 'modify' | 'cancel' | 'ignored';
    reservation?: OtaReservationPayload;
    message: string;
  }> {
    if (!payload?.bookingRef) {
      return {
        success: false,
        action: 'ignored',
        message: 'Notification missing booking reference',
      };
    }

    const action = payload.status === 'cancelled' ? 'cancel' : payload.status === 'modified' ? 'modify' : 'create';

    return {
      success: true,
      action,
      reservation: {
        channelBookingRef: payload.bookingRef,
        channelName: this.channelName,
        status: action === 'cancel' ? 'cancelled' : action === 'modify' ? 'modified' : 'confirmed',
        guestName: payload.guestName || 'OTA Guest',
        guestEmail: payload.guestEmail,
        guestPhone: payload.guestPhone,
        checkInDate: payload.checkInDate || new Date().toISOString().split('T')[0],
        checkOutDate: payload.checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        roomTypeId: payload.roomTypeId || '',
        adults: payload.adults || 2,
        children: payload.children || 0,
        nightlyRatePaise: payload.nightlyRatePaise || 300000,
        totalAmountPaise: payload.totalAmountPaise || 300000,
        currency: payload.currency || 'INR',
        specialRequests: payload.specialRequests,
        rawPayload: payload,
      },
      message: `[Simulated] Processed ${action} event for ${payload.bookingRef}`,
    };
  }
}
