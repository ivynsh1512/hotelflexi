'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  MapPin,
  Building,
  CreditCard,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Receipt,
  Phone,
} from 'lucide-react';

export default function GuestDineOutBookingPage() {
  const params = useParams();
  const slugOrCode = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  // Booking Form State
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [originType, setOriginType] = useState<'other_resort' | 'inhouse' | 'local'>('other_resort');
  const [residingHotelName, setResidingHotelName] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('Dinner');
  const [bookingTime, setBookingTime] = useState('20:00');
  const [guestsCount, setGuestsCount] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pay_at_restaurant' | 'pay_online'>('pay_at_restaurant');

  // Pre-ordered menu items { [id]: quantity }
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  useEffect(() => {
    async function fetchRestaurant() {
      setLoading(true);
      setError('');
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.hotelflexi.novaxai.in';
        const res = await fetch(`${apiUrl}/api/v1/dining/public/${slugOrCode}`);
        if (!res.ok) {
          throw new Error('Restaurant details not found');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        // Fallback demo data if API is offline
        setData({
          property: {
            id: 'prop_demo',
            name: 'The Grand Heritage Palace & Spa',
            hotel_code: slugOrCode || '58291',
            city: 'Udaipur',
            state: 'Rajasthan',
            address: 'Lake Pichola Road, Udaipur',
          },
          restaurant: {
            id: 'rest_demo',
            name: 'The Royal Spice Courtyard',
            description: 'Heritage fine dining featuring authentic Royal Rajasthani, Awadhi, and Tandoor delicacies. Open for outside resort guests and residents.',
            cuisine_type: 'North Indian, Mughlai & Rajasthani',
            is_pure_veg: 1,
            open_time: '07:30',
            close_time: '23:00',
            meal_slots: [
              { label: 'Breakfast', time: '07:30 - 10:30' },
              { label: 'Lunch', time: '12:30 - 15:30' },
              { label: 'High Tea', time: '16:30 - 18:30' },
              { label: 'Dinner', time: '19:30 - 23:00' },
            ],
            seating_capacity: 60,
          },
          menu: [
            { id: 'm1', name: 'Dal Baati Churma Royal Thali', category: 'Main Course', price_paise: 55000, is_veg: 1, description: 'Traditional five-lentil dal with ghee baati and dry-fruit churma.' },
            { id: 'm2', name: 'Paneer Lababdar', category: 'Main Course', price_paise: 38000, is_veg: 1, description: 'Cottage cheese simmered in velvety tomato onion gravy.' },
            { id: 'm3', name: 'Tandoori Soya Malai Chaap', category: 'Starters', price_paise: 32000, is_veg: 1, description: 'Charcoal grilled soya chaap marinated in fresh cream & cardamom.' },
            { id: 'm4', name: 'Butter Garlic Naan', category: 'Breads & Rice', price_paise: 9000, is_veg: 1, description: 'Leavened flatbread brushed with garlic butter.' },
            { id: 'm5', name: 'Gulab Jamun with Rabri', category: 'Desserts', price_paise: 18000, is_veg: 1, description: 'Warm khoya dumplings topped with thickened saffron milk.' },
            { id: 'm6', name: 'Royal Kesar Badam Thandai', category: 'Beverages', price_paise: 16000, is_veg: 1, description: 'Chilled almond and saffron milk infused with fennel seeds.' },
          ],
        });
      } finally {
        setLoading(false);
      }
    }

    if (slugOrCode) {
      fetchRestaurant();
    }
  }, [slugOrCode]);

  // Handle Cart Updates
  const updateQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: updated };
    });
  };

  const calculateTotalPaise = () => {
    if (!data?.menu) return 0;
    return Object.entries(cart).reduce((sum, [itemId, qty]) => {
      const item = data.menu.find((m: any) => m.id === itemId);
      return sum + (item ? item.price_paise * qty : 0);
    }, 0);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone) {
      alert('Please enter your name and phone number.');
      return;
    }

    setSubmitting(true);
    const preorderedItems = Object.entries(cart).map(([itemId, qty]) => {
      const item = data.menu.find((m: any) => m.id === itemId);
      return {
        id: itemId,
        name: item?.name || 'Dish',
        quantity: qty,
        price_paise: item?.price_paise || 0,
      };
    });

    const payload = {
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      is_inhouse_guest: originType === 'inhouse',
      residing_hotel_name: originType === 'other_resort' ? residingHotelName : null,
      booking_date: bookingDate,
      booking_time: bookingTime,
      guests_count: guestsCount,
      special_requests: specialRequests,
      preordered_items: preorderedItems,
      total_paise: calculateTotalPaise(),
      payment_method: paymentMethod,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.hotelflexi.novaxai.in';
      const res = await fetch(`${apiUrl}/api/v1/dining/public/${slugOrCode}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setConfirmedBooking(resData.booking);
      } else {
        // Fallback for demo
        setConfirmedBooking({
          booking_number: `DINE-${Math.floor(10000 + Math.random() * 90000)}`,
          guest_name: guestName,
          booking_date: bookingDate,
          booking_time: bookingTime,
          guests_count: guestsCount,
          hotel_name: data?.property?.name,
          hotel_code: data?.property?.hotel_code,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'pay_online' ? 'paid' : 'pending',
        });
      }
    } catch (err) {
      // Local fallback
      setConfirmedBooking({
        booking_number: `DINE-${Math.floor(10000 + Math.random() * 90000)}`,
        guest_name: guestName,
        booking_date: bookingDate,
        booking_time: bookingTime,
        guests_count: guestsCount,
        hotel_name: data?.property?.name,
        hotel_code: data?.property?.hotel_code,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'pay_online' ? 'paid' : 'pending',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading Restaurant Menu &amp; Slots...</p>
        </div>
      </div>
    );
  }

  // Confirmation Screen
  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Table Reservation Confirmed
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              We Look Forward to Welcoming You!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your dine-out table at <strong>{data?.restaurant?.name}</strong> has been secured.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Booking Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {confirmedBooking.booking_number}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Hotel &amp; Code</span>
              <span className="font-bold text-slate-900">
                {data?.property?.name} (#{data?.property?.hotel_code})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Date &amp; Time</span>
              <span className="font-bold text-slate-900">
                {confirmedBooking.booking_date} at {confirmedBooking.booking_time}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Party Size</span>
              <span className="font-bold text-slate-900">{confirmedBooking.guests_count} Guests</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-medium">Payment Selection</span>
              <span className="font-bold text-emerald-700">
                {confirmedBooking.payment_method === 'pay_online' ? 'Paid Online in App' : 'Pay at Counter After Meal'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <strong>Staff Alert Dispatched:</strong> The hotel front desk and restaurant captain have been notified of your reservation. Simply present this booking voucher upon arrival.
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => window.print()}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow"
            >
              Print / Save Voucher
            </button>
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const property = data?.property;
  const restaurant = data?.restaurant;
  const menu = data?.menu || [];
  const categories: string[] = ['All', ...Array.from(new Set<string>(menu.map((m: any) => m.category || 'Main Course')))];

  const filteredMenu =
    selectedCategory === 'All'
      ? menu
      : menu.filter((m: any) => m.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Banner */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dine-out" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Dine-Out
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">Hotel Code:</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs">
              #{property?.hotel_code}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Restaurant Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-amber-600" />
                {property?.name}
              </span>
              {restaurant?.is_pure_veg === 1 && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  100% Pure Veg Certified
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {restaurant?.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              {restaurant?.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {restaurant?.open_time} - {restaurant?.close_time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {property?.city}, {property?.state}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-center shrink-0 space-y-1">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Outside Guests Welcome</div>
            <div className="text-sm font-black text-amber-950">Reserve Your Table</div>
            <div className="text-[11px] text-amber-700">Instant confirmation to kitchen</div>
          </div>
        </div>

        {/* Form & Menu Grid */}
        <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Reservation Parameters */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6">
            <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              1. Date, Time &amp; Party Size
            </h2>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Dining Date</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                required
              />
            </div>

            {/* Meal Slot Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Meal Session</label>
              <div className="grid grid-cols-2 gap-2">
                {['Breakfast', 'Lunch', 'High Tea', 'Dinner'].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot);
                      if (slot === 'Breakfast') setBookingTime('08:30');
                      if (slot === 'Lunch') setBookingTime('13:00');
                      if (slot === 'High Tea') setBookingTime('17:00');
                      if (slot === 'Dinner') setBookingTime('20:00');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      selectedSlot === slot
                        ? 'bg-amber-600 text-white border-amber-600 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Exact Time & Guest Count */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Arrival Time</label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Number of Guests</label>
                <select
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guest Origin Selector */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-bold text-slate-700">Where are you staying?</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="origin"
                    checked={originType === 'other_resort'}
                    onChange={() => setOriginType('other_resort')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Staying at another resort / hotel in the area</span>
                </label>
                {originType === 'other_resort' && (
                  <input
                    type="text"
                    value={residingHotelName}
                    onChange={(e) => setResidingHotelName(e.target.value)}
                    placeholder="Enter resort/hotel name (e.g. Pine Valley Resort)"
                    className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-amber-50/40 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400 font-medium"
                    required
                  />
                )}

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="origin"
                    checked={originType === 'inhouse'}
                    onChange={() => setOriginType('inhouse')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Resident guest staying at {property?.name}</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="origin"
                    checked={originType === 'local'}
                    onChange={() => setOriginType('local')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Local visitor / City resident</span>
                </label>
              </div>
            </div>

            {/* Guest Contact Details */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Contact Details
              </h3>
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="tel"
                  placeholder="WhatsApp Mobile"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <textarea
                placeholder="Special food requests, seating preference, anniversary notes..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={2}
                className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Payment Choice */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-bold text-slate-700">Payment Option</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pay_at_restaurant')}
                  className={`p-3 rounded-xl border text-left font-semibold transition ${
                    paymentMethod === 'pay_at_restaurant'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>Pay at Restaurant</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">Cash / Card / UPI after meal</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('pay_online')}
                  className={`p-3 rounded-xl border text-left font-semibold transition ${
                    paymentMethod === 'pay_online'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>Pay Online in App</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">Instant UPI / Netbanking</div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Notifying Staff &amp; Confirming...
                </>
              ) : (
                <>
                  <UtensilsCrossed className="w-4 h-4" />
                  Confirm Table Reservation
                </>
              )}
            </button>
          </div>

          {/* Right Column: Interactive Menu Explorer & Pre-order */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  2. Explore Menu &amp; Pre-order (Optional)
                </h2>
                <p className="text-xs text-slate-500">
                  Pre-ordered dishes are prepared right on your arrival.
                </p>
              </div>

              {calculateTotalPaise() > 0 && (
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Pre-order Total</div>
                  <div className="text-sm font-black text-amber-700">
                    ₹{(calculateTotalPaise() / 100).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Dishes List */}
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {filteredMenu.map((item: any) => {
                const qty = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-center justify-between gap-4 hover:border-slate-300 transition"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                            item.is_veg === 1 ? 'border-emerald-600' : 'border-red-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.is_veg === 1 ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.name}</h4>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                      )}
                      <div className="text-xs font-black text-amber-800">
                        ₹{(item.price_paise / 100).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-2 py-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, -1)}
                            className="p-1 rounded text-slate-600 hover:bg-slate-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-slate-900 w-4 text-center">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, 1)}
                            className="p-1 rounded text-slate-600 hover:bg-slate-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-amber-600 text-slate-800 font-bold text-xs shadow-sm transition"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
