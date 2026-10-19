'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient, formatINR } from '@/lib/api';
import {
  Hotel,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function DirectBookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  // Search parameters
  const [checkInDate, setCheckInDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [adults, setAdults] = useState(2);

  // Booking Modal State
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch property and initial availability
  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient(`/public/properties/${slug}/availability?check_in=${checkInDate}&check_out=${checkOutDate}&guests=${adults}`);
      setRoomTypes(data.roomTypes || []);
    } catch (e: any) {
      console.error('Availability fetch error:', e);
      setError(e.message || 'Failed to check room availability.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadProperty() {
      try {
        const propData = await apiClient(`/public/properties/${slug}`);
        setProperty(propData.property);
        await fetchAvailability();
      } catch (e: any) {
        setError('Hotel property not found or booking engine disabled.');
        setLoading(false);
      }
    }
    if (slug) {
      loadProperty();
    }
  }, [slug]);

  const handleBookNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    setBookingLoading(true);
    setError(null);

    try {
      const payload = {
        roomTypeId: selectedRoom.id,
        checkInDate,
        checkOutDate,
        guestName,
        guestEmail,
        guestPhone,
        adults,
        specialRequests,
      };

      const result = await apiClient(`/public/properties/${slug}/book`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setBookingConfirmed(result);
    } catch (e: any) {
      console.error('Booking failed:', e);
      setError(e.message || 'Booking submission failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading && !property) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          <p className="text-sm text-content-secondary-light">Loading hotel booking engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light text-content-primary-light">
      {/* Property Header */}
      <header className="bg-white border-b border-border-light shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-sm">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-content-primary-light">
                {property?.name || 'HotelFlexi Property'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-content-secondary-light">
                <MapPin className="w-3.5 h-3.5 text-brand-blue" />
                <span>{property?.city || 'India'}, {property?.state || ''}</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-content-secondary-light">
            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4" /> Verified Direct Booking
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Date & Guest Filter Bar */}
        <div className="p-4 rounded-xl bg-white border border-border-light shadow-sm mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1.5">
                Check-in Date
              </label>
              <input
                type="date"
                value={checkInDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1.5">
                Check-out Date
              </label>
              <input
                type="date"
                value={checkOutDate}
                min={checkInDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1.5">
                Guests (Adults)
              </label>
              <select
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} Adult{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={fetchAvailability}
                className="w-full py-2.5 px-4 rounded-lg bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover transition shadow-sm"
              >
                Search Available Rooms
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-200 text-status-danger text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Room Types Listing */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-content-primary-light">
              Available Room Categories
            </h2>
            <span className="text-xs text-content-secondary-light">
              {roomTypes.length} room type(s) ready for instant booking
            </span>
          </div>

          {roomTypes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-3">
              <Calendar className="w-10 h-10 text-content-secondary-light mx-auto" />
              <h3 className="text-base font-bold text-content-primary-light">No rooms available for selected dates</h3>
              <p className="text-xs text-content-secondary-light max-w-md mx-auto">
                All rooms are currently reserved or blocked for these dates. Please try selecting different check-in/out dates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roomTypes.map((rt) => (
                <div
                  key={rt.id}
                  className="p-6 rounded-2xl bg-white border border-border-light shadow-sm flex flex-col justify-between hover:border-brand-blue transition"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-content-primary-light">{rt.name}</h3>
                        <div className="text-xs text-content-secondary-light mt-0.5">
                          Up to {rt.maxOccupancy} Guests • Base: {rt.baseOccupancy} Guests
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {rt.availableUnits} Available
                      </span>
                    </div>

                    <p className="text-xs text-content-secondary-light mb-4 line-clamp-2">
                      {rt.description || 'Comfortable room with attached private bath, high-speed Wi-Fi, and air conditioning.'}
                    </p>

                    {rt.amenities && rt.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {rt.amenities.slice(0, 4).map((a: string) => (
                          <span
                            key={a}
                            className="px-2 py-0.5 rounded bg-surface-light text-[11px] text-content-secondary-light border border-border-light"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border-light flex items-center justify-between">
                    <div>
                      <div className="text-xs text-content-secondary-light">
                        {rt.nights} Night{rt.nights > 1 ? 's' : ''} total
                      </div>
                      <div className="text-xl font-extrabold text-content-primary-light">
                        {formatINR(rt.totalAmountPaise)}
                      </div>
                      <div className="text-[10px] text-content-secondary-light">
                        Includes {formatINR(rt.totalTaxPaise)} GST ({rt.gstRateBasisPoints / 100}%)
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedRoom(rt)}
                      className="px-5 py-2.5 rounded-lg bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover transition shadow-sm"
                    >
                      Book Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Booking Checkout Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border-light max-h-[90vh] overflow-y-auto">
            {bookingConfirmed ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-status-success flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-content-primary-light">Booking Confirmed!</h3>
                <p className="text-xs text-content-secondary-light max-w-sm mx-auto">
                  Your reservation reference is{' '}
                  <span className="font-mono font-bold text-content-primary-light">
                    {bookingConfirmed.reservationNumber}
                  </span>
                  . Room {bookingConfirmed.roomNumber} has been reserved.
                </p>

                <div className="p-4 rounded-xl bg-surface-light border border-border-light text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-content-secondary-light">Dates:</span>
                    <span className="font-semibold">{checkInDate} to {checkOutDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary-light">Guest:</span>
                    <span className="font-semibold">{guestName} ({guestPhone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary-light">Total Folio:</span>
                    <span className="font-bold text-brand-blue">{formatINR(bookingConfirmed.totalAmountPaise)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary-light">Payment:</span>
                    <span className="font-semibold text-amber-600">Pay at Hotel Front Desk / Check-in</span>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 rounded-lg border border-border-light text-content-primary-light font-semibold text-xs hover:bg-surface-light transition"
                  >
                    Print Confirmation
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRoom(null);
                      setBookingConfirmed(null);
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookNow} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-light">
                  <div>
                    <h3 className="text-base font-bold text-content-primary-light">Confirm Your Reservation</h3>
                    <p className="text-xs text-content-secondary-light">
                      {selectedRoom.name} • {checkInDate} to {checkOutDate} ({selectedRoom.nights} Night{selectedRoom.nights > 1 ? 's' : ''})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRoom(null)}
                    className="text-xs text-content-secondary-light hover:text-content-primary-light"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                    Primary Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ananya Roy"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="guest@mail.com"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Late arrival, extra pillows, quiet room..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-surface-light border border-border-light text-xs space-y-1.5">
                  <div className="flex justify-between text-content-secondary-light">
                    <span>Room Charges ({selectedRoom.nights} Nights)</span>
                    <span>{formatINR(selectedRoom.totalRoomChargePaise)}</span>
                  </div>
                  <div className="flex justify-between text-content-secondary-light">
                    <span>Applicable GST ({selectedRoom.gstRateBasisPoints / 100}%)</span>
                    <span>{formatINR(selectedRoom.totalTaxPaise)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-content-primary-light text-sm pt-1 border-t border-border-light">
                    <span>Total Amount Payable</span>
                    <span className="text-brand-blue">{formatINR(selectedRoom.totalAmountPaise)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-3 rounded-lg bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Securing Room...
                    </>
                  ) : (
                    'Confirm Direct Booking'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
