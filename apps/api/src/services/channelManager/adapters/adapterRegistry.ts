/**
 * HotelFlexi Channel Manager — Official Adapter Registry
 */

import { ChannelAdapter } from '../adapterContract';
import { BookingComAdapter } from './bookingComAdapter';
import { AgodaAdapter } from './agodaAdapter';
import { ExpediaAdapter } from './expediaAdapter';
import { MakeMyTripAdapter } from './makeMyTripAdapter';
import { TripAdvisorAdapter } from './tripAdvisorAdapter';

const adapters: Record<string, ChannelAdapter> = {
  booking_com: new BookingComAdapter(),
  agoda: new AgodaAdapter(),
  expedia: new ExpediaAdapter(),
  makemytrip: new MakeMyTripAdapter(),
  tripadvisor: new TripAdvisorAdapter(),
};

export function getChannelAdapter(providerCode: string): ChannelAdapter {
  const normalized = String(providerCode || '').toLowerCase().trim();
  const adapter = adapters[normalized];
  if (!adapter) {
    throw new Error(`Unsupported distribution channel provider: ${providerCode}`);
  }
  return adapter;
}

export function listSupportedProviders(): Array<{ code: string; displayName: string }> {
  return Object.values(adapters).map((a) => ({
    code: a.providerCode,
    displayName: a.displayName,
  }));
}
