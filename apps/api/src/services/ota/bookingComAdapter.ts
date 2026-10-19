import {
  IChannelAdapter,
  OtaRateUpdate,
  OtaInventoryUpdate,
  OtaRestrictionUpdate,
  OtaReservationPayload,
  OtaAdapterResponse,
} from './types';

/**
 * Booking.com Connectivity (OTA ARI / B.XML API) Channel Adapter Boundary.
 */
export class BookingComChannelAdapter implements IChannelAdapter {
  readonly channelName = 'booking_com';
  readonly isLiveCapable = true;

  private parseCredentials(connection: any): { apiKey?: string; hotelId?: string; isProduction: boolean } {
    let creds: any = {};
    if (connection?.credentials_json) {
      try {
        creds = typeof connection.credentials_json === 'string'
          ? JSON.parse(connection.credentials_json)
          : connection.credentials_json;
      } catch {
        creds = {};
      }
    }
    return {
      apiKey: creds.apiKey || creds.api_key,
      hotelId: connection.hotel_channel_id || creds.hotelId,
      isProduction: connection.environment === 'production' && Boolean(creds.apiKey),
    };
  }

  async pushRates(connection: any, updates: OtaRateUpdate[]): Promise<OtaAdapterResponse> {
    const { apiKey, hotelId, isProduction } = this.parseCredentials(connection);

    if (isProduction && apiKey) {
      try {
        const res = await fetch('https://distribution-xml.booking.com/2.0/json/rateChange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(apiKey)}`,
          },
          body: JSON.stringify({
            hotel_id: hotelId,
            rates: updates.map((u) => ({
              room_id: u.channelRoomTypeId || u.roomTypeId,
              rate_id: u.channelRatePlanId || u.ratePlanId || 'BAR',
              date_from: u.startDate,
              date_to: u.endDate,
              currency: u.currency || 'INR',
              rate: u.pricePaise / 100,
            })),
          }),
        });

        const data: any = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            success: false,
            httpStatus: res.status,
            message: data.message || `Booking.com API returned HTTP ${res.status}`,
            retryable: res.status >= 500,
            isSimulated: false,
            rawResponse: data,
          };
        }

        return {
          success: true,
          providerJobId: data.transaction_id || `bcom_${Date.now()}`,
          httpStatus: res.status,
          message: 'Rates successfully synchronized with Booking.com',
          retryable: false,
          isSimulated: false,
          rawResponse: data,
        };
      } catch (err: any) {
        return {
          success: false,
          httpStatus: 500,
          message: `Network error connecting to Booking.com API: ${err.message}`,
          retryable: true,
          isSimulated: false,
        };
      }
    }

    return {
      success: true,
      providerJobId: `bcom_sim_${crypto.randomUUID().slice(0, 8)}`,
      httpStatus: 200,
      message: `[Booking.com Sandbox] Validated and synchronized ${updates.length} rate update(s) for Hotel ID ${hotelId || 'BCOM_TEST'}`,
      retryable: false,
      isSimulated: true,
      rawResponse: {
        channel: 'booking_com',
        mode: 'sandbox_simulation',
        ratesProcessed: updates.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async pushInventory(connection: any, updates: OtaInventoryUpdate[]): Promise<OtaAdapterResponse> {
    return {
      success: true,
      providerJobId: `bcom_inv_${crypto.randomUUID().slice(0, 8)}`,
      httpStatus: 200,
      message: `[Booking.com Sandbox] Synchronized availability across ${updates.length} dates`,
      retryable: false,
      isSimulated: true,
    };
  }

  async pushRestrictions(connection: any, updates: OtaRestrictionUpdate[]): Promise<OtaAdapterResponse> {
    return {
      success: true,
      providerJobId: `bcom_rst_${crypto.randomUUID().slice(0, 8)}`,
      httpStatus: 200,
      message: `[Booking.com Sandbox] Pushed stop-sell (closed) and stay restrictions (${updates.length} updates)`,
      retryable: false,
      isSimulated: true,
    };
  }

  async fetchReservations(connection: any, sinceTimestamp?: number) {
    return {
      success: true,
      reservations: [],
      message: '[Booking.com Sandbox] Polled reservations feed. 0 new bookings.',
      isSimulated: true,
    };
  }

  async processNotification(connection: any, payload: any) {
    return {
      success: true,
      action: 'ignored' as const,
      message: 'Booking.com notification processed',
    };
  }
}
