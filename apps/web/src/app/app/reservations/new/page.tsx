'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  BookOpen,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function NewReservationPage() {
  const router = useRouter();
  const { currentTenant } = useAuth();

  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('');
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // Form states
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [idType, setIdType] = useState('aadhar');
  const [idNumber, setIdNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [roomTypeId, setRoomTypeId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [customNightlyRate, setCustomNightlyRate] = useState<string>('');
  const [discountPaise, setDiscountPaise] = useState(0);
  const [advancePaid, setAdvancePaid] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [specialRequests, setSpecialRequests] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!currentTenant) return;
      try {
        const propData = await apiClient('/properties');
        const activeProp = propData.properties?.[0];
        if (activeProp) {
          setPropertyId(activeProp.id);
          const [rtData, rData] = await Promise.all([
            apiClient(`/rooms/types?property_id=${activeProp.id}`),
            apiClient(`/rooms?property_id=${activeProp.id}`),
          ]);
          setRoomTypes(rtData.roomTypes || []);
          setRooms(rData.rooms || []);
          if (rtData.roomTypes?.length > 0) {
            setRoomTypeId(rtData.roomTypes[0].id);
            setCustomNightlyRate(String(rtData.roomTypes[0].base_price_paise / 100));
          }
        }
      } catch (err: any) {
        setError('Failed to load room inventory data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentTenant]);

  // When room type changes, update custom nightly rate
  const handleRoomTypeChange = (id: string) => {
    setRoomTypeId(id);
    const rt = roomTypes.find((r) => r.id === id);
    if (rt) {
      setCustomNightlyRate(String(rt.base_price_paise / 100));
    }
    setRoomId('');
  };

  // Filter available rooms of selected type
  const availableRoomsOfType = rooms.filter(
    (r) => r.room_type_id === roomTypeId && r.status === 'available'
  );

  // Financial calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const d1 = new Date(checkInDate);
  const d2 = new Date(checkOutDate);
  const nights = Math.max(1, Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
  const currentRatePaise = customNightlyRate !== '' ? Math.round((parseFloat(customNightlyRate) || 0) * 100) : 250000;

  const selectedRoomType = roomTypes.find((r) => r.id === roomTypeId);
  const baseOccupancy = selectedRoomType?.base_occupancy || 2;
  const extraAdultsCount = Math.max(0, adults - baseOccupancy);
  const extraAdultRatePaise = selectedRoomType?.extra_adult_price_paise !== undefined && selectedRoomType?.extra_adult_price_paise !== null
    ? selectedRoomType.extra_adult_price_paise
    : Math.round((selectedRoomType?.base_price_paise || currentRatePaise) * 0.3);
  const extraAdultTotalChargePaise = extraAdultsCount * extraAdultRatePaise * nights;

  const extraChildRatePaise = selectedRoomType?.extra_child_price_paise || 0;
  const extraChildTotalChargePaise = children * extraChildRatePaise * nights;

  const baseRoomChargePaise = currentRatePaise * nights;
  const totalRoomChargePaise = baseRoomChargePaise + extraAdultTotalChargePaise + extraChildTotalChargePaise;
  const effectiveNightlyRatePaise = Math.round(totalRoomChargePaise / nights);

  const gstRateBasisPoints = effectiveNightlyRatePaise > 750000 ? 1800 : 1200;
  const totalTaxPaise = Math.round((totalRoomChargePaise * gstRateBasisPoints) / 10000);
  const grossAmountPaise = Math.max(0, totalRoomChargePaise + totalTaxPaise - discountPaise);
  const advancePaidPaise = Math.round((parseFloat(advancePaid) || 0) * 100);
  const balancePaise = Math.max(0, grossAmountPaise - advancePaidPaise);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiClient('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          roomTypeId,
          roomId: roomId || undefined,
          checkInDate,
          checkOutDate,
          guestName,
          guestPhone,
          guestEmail,
          idType,
          idNumber,
          adults,
          children,
          nightlyRatePaise: currentRatePaise,
          extraAdultChargePaise: extraAdultTotalChargePaise,
          discountPaise,
          advancePaidPaise,
          paymentMethod,
          specialRequests,
          source: 'walk_in',
        }),
      });

      router.push('/app/reservations');
    } catch (err: any) {
      setError(err.message || 'Failed to create reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Create New Reservation / Walk-In
        </h1>
        <p className="text-xs text-content-secondary-light">
          Reserve rooms with automated GST computation and instant invoice generation
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-status-danger text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {roomTypes.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="font-bold">No Room Categories Created</div>
            <p className="text-[11px] text-amber-800">
              You must configure at least one room category (e.g. Deluxe Room, Executive Suite) and add room units before recording reservations.
            </p>
            <div className="pt-1">
              <a
                href="/app/room-types"
                className="inline-flex items-center gap-1 text-brand-blue font-semibold hover:underline"
              >
                Configure Room Categories →
              </a>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Guest Information */}
        <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-content-primary-light flex items-center gap-2 border-b border-border-light pb-2">
            <User className="w-4 h-4 text-brand-blue" />
            Guest Profile & Identification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Guest Full Name *
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Rohit Verma"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="rohit@gmail.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Government ID Type
              </label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="aadhar">Aadhaar Card</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="voter_id">Voter ID</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                ID Number (Masked)
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Last 4 digits or ID number"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Dates & Room Assignment */}
        <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-content-primary-light flex items-center gap-2 border-b border-border-light pb-2">
            <Calendar className="w-4 h-4 text-brand-blue" />
            Stay Details & Room Assignment
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Check-in Date *
              </label>
              <input
                type="date"
                required
                min={todayStr}
                value={checkInDate}
                onChange={(e) => {
                  setCheckInDate(e.target.value);
                  if (checkOutDate <= e.target.value) {
                    const n = new Date(e.target.value);
                    n.setDate(n.getDate() + 1);
                    setCheckOutDate(n.toISOString().split('T')[0]);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Check-out Date *
              </label>
              <input
                type="date"
                required
                min={checkInDate || todayStr}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Adults
              </label>
              <select
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {Array.from({ length: Math.max(16, selectedRoomType?.max_occupancy || 6) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} Adult{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Children
              </label>
              <select
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n} Child{n > 1 ? 'ren' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Room Category *
              </label>
              <select
                required
                value={roomTypeId}
                onChange={(e) => handleRoomTypeChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} ({formatINR(rt.base_price_paise)}/night)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Assign Specific Room
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Auto-assign / Assign at Check-in</option>
                {availableRoomsOfType.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number} ({r.floor || 'Floor 1'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Billing, Taxes & Advance Payment */}
        <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-content-primary-light flex items-center gap-2 border-b border-border-light pb-2">
            <CreditCard className="w-4 h-4 text-brand-blue" />
            Billing, GST Folio & Advance Payment
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Nightly Tariff (₹)
              </label>
              <input
                type="number"
                value={customNightlyRate}
                onChange={(e) => setCustomNightlyRate(e.target.value)}
                placeholder="2500"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Advance Paid Today (₹)
              </label>
              <input
                type="number"
                min={0}
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary-light mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI / QR Code</option>
                <option value="card">Card (POS)</option>
                <option value="bank_transfer">Bank Transfer / NEFT</option>
              </select>
            </div>
          </div>

          {/* Real-time Tax Folio Breakdown */}
          <div className="p-4 rounded-xl bg-surface-light border border-border-light text-xs space-y-1.5">
            <div className="flex justify-between text-content-secondary-light">
              <span>Base Room Charges ({nights} Night{nights > 1 ? 's' : ''} @ {formatINR(currentRatePaise)})</span>
              <span className="font-semibold text-content-primary-light">{formatINR(baseRoomChargePaise)}</span>
            </div>

            {extraAdultsCount > 0 && (
              <div className="flex justify-between text-indigo-700 bg-indigo-50/70 px-2.5 py-1 rounded-lg border border-indigo-100">
                <span>
                  Extra Adult Surcharge ({extraAdultsCount} Extra Adult{extraAdultsCount > 1 ? 's' : ''} &gt; {baseOccupancy} Base &times; {formatINR(extraAdultRatePaise)} &times; {nights}N)
                </span>
                <span className="font-bold">+{formatINR(extraAdultTotalChargePaise)}</span>
              </div>
            )}

            {children > 0 && extraChildTotalChargePaise > 0 && (
              <div className="flex justify-between text-amber-800 bg-amber-50/70 px-2.5 py-1 rounded-lg border border-amber-100">
                <span>
                  Child Surcharge ({children} Child{children > 1 ? 'ren' : ''} &times; {formatINR(extraChildRatePaise)} &times; {nights}N)
                </span>
                <span className="font-bold">+{formatINR(extraChildTotalChargePaise)}</span>
              </div>
            )}

            <div className="flex justify-between text-content-secondary-light">
              <span>GST Applied ({gstRateBasisPoints / 100}% {gstRateBasisPoints === 1800 ? 'Luxury (Tariff > ₹7,500)' : 'Standard'} Slab)</span>
              <span className="font-semibold text-content-primary-light">{formatINR(totalTaxPaise)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-content-primary-light pt-2 border-t border-border-light">
              <span>Total Invoice Folio</span>
              <span className="text-brand-blue">{formatINR(grossAmountPaise)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-amber-700 pt-1">
              <span>Pending Balance on Checkout:</span>
              <span>{formatINR(balancePaise)}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-lg bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue-hover transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Confirming Reservation...
            </>
          ) : (
            <>
              Confirm Reservation & Generate Folio
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
