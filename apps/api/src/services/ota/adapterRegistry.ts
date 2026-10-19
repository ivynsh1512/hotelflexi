import { IChannelAdapter } from './types';
import { SimulatedChannelAdapter } from './simulatedAdapter';
import { MakeMyTripChannelAdapter } from './makeMyTripAdapter';
import { AgodaChannelAdapter } from './agodaAdapter';
import { BookingComChannelAdapter } from './bookingComAdapter';
import { ExpediaChannelAdapter } from './expediaAdapter';

const adapters: Record<string, IChannelAdapter> = {
  makemytrip: new MakeMyTripChannelAdapter(),
  agoda: new AgodaChannelAdapter(),
  booking_com: new BookingComChannelAdapter(),
  expedia: new ExpediaChannelAdapter(),
  airbnb: new SimulatedChannelAdapter('airbnb'),
};

export function getOtaAdapter(channelName: string): IChannelAdapter {
  const normalized = String(channelName || '').toLowerCase().trim();
  if (adapters[normalized]) {
    return adapters[normalized];
  }
  return new SimulatedChannelAdapter(normalized || 'generic');
}
