import {
  IChannelAdapter,
  OtaRateUpdate,
  OtaInventoryUpdate,
  OtaRestrictionUpdate,
  OtaReservationPayload,
  OtaAdapterResponse,
} from './types';

/**
 * Expedia Group (Expedia QuickConnect / Partner Central) Channel Adapter Boundary.
 */
export class ExpediaChannelAdapter implements IChannelAdapter {
  readonly channelName = 'expedia';
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
    const { hotelId } = this.parseCredentials(connection);
    return {
      success: true,
      providerJobId: `exp_sim_${crypto.randomUUID().slice(0, 8)}`,
      httpStatus: 200,
      message: `[Expedia Group Sandbox] Synchronized ${updates.length} rate updates for Hotel ID ${hotelId || 'EXP_TEST'}`,
      retryable: false,
      isSimulated: true,
      rawResponse: {
        channel: 'expedia',
        mode: 'sandbox_simulation',
        ratesProcessed: updates.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async pushInventory(connection: any, updates: OtaInventoryUpdate[]): Promise<OtaAdapterResponse> {
    return {
      success: true,
      providerJobId: `exp_inv_${crypto.randomUUID().slice(0, 8)}`,
      httpStatus: 200,
      message: `[Expedia Group Sandbox] Synchronized availability across ${updates.length} dates`,
      retryable: false,
      isSimulated: true,
    };
  }

  async pushRestrictions(connection: any, updates: OtaRestrictionUpdate[]): Promise<OtaAdapterResponse> {
    return {
      success: true,
      providerJobId: `exp_rst_${crypto.randomUUID().slice(0, 8)}`,
      httpStatus: 200,
      message: `[Expedia Group Sandbox] Pushed restrictions (${updates.length} updates)`,
      retryable: false,
      isSimulated: true,
    };
  }

  async fetchReservations(connection: any, sinceTimestamp?: number) {
    return {
      success: true,
      reservations: [],
      message: '[Expedia Group Sandbox] Polled QuickConnect reservation feed. 0 new bookings.',
      isSimulated: true,
    };
  }

  async processNotification(connection: any, payload: any) {
    return {
      success: true,
      action: 'ignored' as const,
      message: 'Expedia notification processed',
    };
  }
}
