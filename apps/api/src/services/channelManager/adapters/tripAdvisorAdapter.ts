/**
 * HotelFlexi Channel Manager — Tripadvisor Official Adapter
 * Tripadvisor Instant Booking & Plus Metasearch Connectivity.
 */

import {
  ChannelAdapter,
  ChannelCapability,
  ChannelConnectionContext,
  AvailabilityUpdate,
  RateUpdate,
  RestrictionUpdate,
  ChannelOperationResult,
  NormalizedReservationEvent,
  VerifiedWebhookRequest,
} from '../adapterContract';

export class TripAdvisorAdapter implements ChannelAdapter {
  readonly providerCode = 'tripadvisor';
  readonly displayName = 'Tripadvisor';

  async getCapabilities(_context: ChannelConnectionContext): Promise<ChannelCapability[]> {
    return [
      'property_mapping',
      'room_mapping',
      'rate_plan_mapping',
      'availability_push',
      'rates_push',
    ];
  }

  async validateConfiguration(
    context: ChannelConnectionContext
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (!context.externalPropertyId) {
      errors.push('Tripadvisor Location ID is required.');
    }
    if (!context.credentials?.partnerKey) {
      errors.push('Tripadvisor Plus / Connect Partner Key is missing.');
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async testConnection(
    context: ChannelConnectionContext
  ): Promise<{ success: boolean; providerStatus?: string; correlationId: string; errors: string[] }> {
    const correlationId = `ta_diag_${crypto.randomUUID().slice(0, 8)}`;
    return {
      success: false,
      providerStatus: 'pending_approval',
      correlationId,
      errors: ['Tripadvisor Plus Direct Connect partner certification is currently in development.'],
    };
  }

  async pushAvailability(
    context: ChannelConnectionContext,
    request: AvailabilityUpdate
  ): Promise<ChannelOperationResult> {
    const correlationId = `ta_avail_${crypto.randomUUID().slice(0, 8)}`;
    return {
      accepted: false,
      confirmed: false,
      correlationId,
      retryable: false,
      httpStatus: 403,
      errors: [{ code: 'METASEARCH_NOT_ACTIVE', message: 'Tripadvisor direct connect requires partner certification.' }],
    };
  }

  async pushRates(
    context: ChannelConnectionContext,
    request: RateUpdate
  ): Promise<ChannelOperationResult> {
    const correlationId = `ta_rate_${crypto.randomUUID().slice(0, 8)}`;
    return {
      accepted: false,
      confirmed: false,
      correlationId,
      retryable: false,
      httpStatus: 403,
      errors: [{ code: 'METASEARCH_NOT_ACTIVE', message: 'Tripadvisor direct connect requires partner certification.' }],
    };
  }

  async pushRestrictions(
    context: ChannelConnectionContext,
    request: RestrictionUpdate
  ): Promise<ChannelOperationResult> {
    return {
      accepted: false,
      confirmed: false,
      correlationId: `ta_rest_${Date.now()}`,
      retryable: false,
      errors: [{ code: 'UNSUPPORTED', message: 'Restrictions push is not supported on Tripadvisor metasearch feed.' }],
    };
  }

  async parseReservationWebhook(
    _context: ChannelConnectionContext,
    _request: VerifiedWebhookRequest
  ): Promise<NormalizedReservationEvent | null> {
    return null;
  }
}
