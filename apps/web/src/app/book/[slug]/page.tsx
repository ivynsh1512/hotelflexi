'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
  Tag,
  Percent,
  Baby,
  ExternalLink,
  ChevronRight,
  Image as ImageIcon,
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
  const [children, setChildren] = useState(0);

  // Booking Modal State
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch property and initial availability
  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient(
        `/public/properties/${slug}/availability?check_in=${checkInDate}&check_out=${checkOutDate}&guests=${adults}`
      );
      setRoomTypes(data.roomTypes || []);
    } catch (e: any) {
      console.error('Availability fetch error:', e);
      setError(e.message || 'Failed to check room availability.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Dynamically load Razorpay checkout script if needed
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !property?.id || !selectedRoom) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await apiClient('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: property.id,
          code: couponCode.trim().toUpperCase(),
          totalAmountPaise: selectedRoom.totalPaise,
          checkInDate,
        }),
      });

      if (res.valid) {
        setAppliedCoupon(res);
      } else {
        setCouponError(res.error || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      setCouponError(err.message || 'Coupon validation failed');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

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
        children,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        specialRequests,
      };

      const result = await apiClient(`/public/properties/${slug}/book`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (result?.razorpay && (window as any).Razorpay) {
        try {
          const rzp = new (window as any).Razorpay({
            key: result.razorpay.keyId,
            amount: result.razorpay.amount,
            currency: result.razorpay.currency || 'INR',
            name: property?.name || 'HotelFlexi',
            description: `Advance Deposit - ${result.reservationNumber}`,
            order_id: result.razorpay.orderId,
            prefill: {
              name: guestName,
              email: guestEmail,
              contact: guestPhone,
            },
            theme: {
              color: '#1e40af',
            },
            handler: async (response: any) => {
              try {
                await apiClient(`/public/properties/${slug}/verify-payment`, {
                  method: 'POST',
                  body: JSON.stringify({
                    reservationId: result.reservationId,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    amountPaise: result.razorpay.amount,
                  }),
                });
                setBookingConfirmed({
                  ...result,
                  advancePaid: true,
                  paymentStatus: 'paid_advance',
                });
              } catch (err) {
                setBookingConfirmed(result);
              }
            },
            modal: {
              ondismiss: () => {
                setBookingConfirmed(result);
              },
            },
          });
          rzp.open();
        } catch (err) {
          setBookingConfirmed(result);
        }
      } else {
        setBookingConfirmed(result);
      }
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

  const childCutoffAge = property?.childCutoffAge ?? property?.child_cutoff_age ?? 10;
  const childRatePaise = property?.childRatePaise ?? property?.child_rate_paise ?? 0;
  const galleryImages: string[] = Array.isArray(property?.galleryImages)
    ? property.galleryImages
    : typeof property?.gallery_images === 'string'
    ? JSON.parse(property.gallery_images || '[]')
    : [];

  const propertyAmenities: string[] = Array.isArray(property?.amenities)
    ? property.amenities
    : typeof property?.amenities === 'string'
    ? JSON.parse(property.amenities || '[]')
    : [];

  // Google Hotel Center / Schema.org structured data JSON-LD for Google Free Booking Links
  const jsonLd = property ? {
    '@context': 'https://schema.org',
    '@type': ['Hotel', 'LodgingBusiness'],
    name: property.name,
    description: property.description || `${property.name} Official Direct Booking Engine with best rate guarantee and instant confirmation.`,
    url: `https://hotelflexi.novaxai.in/book/${slug}`,
    telephone: property.phone || '',
    email: property.email || '',
    image: galleryImages.length > 0 ? galleryImages : (property.logo_url ? [property.logo_url] : []),
    priceRange: roomTypes.length > 0 ? `₹${Math.round(roomTypes[0].base_price_paise / 100)} - ₹${Math.round(roomTypes[roomTypes.length - 1].base_price_paise / 100)}` : '₹1,500 - ₹5,000',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Credit Card, Debit Card, Net Banking',
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address_line1 || '',
      addressLocality: property.city || '',
      addressRegion: property.state || '',
      postalCode: property.postal_code || '',
      addressCountry: property.country || 'IN',
    },
    checkinTime: property.check_in_time || '12:00',
    checkoutTime: property.check_out_time || '11:00',
    amenityFeature: propertyAmenities.map((a: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
      value: true,
    })),
    makesOffer: roomTypes.map((rt: any) => ({
      '@type': 'Offer',
      name: rt.name,
      description: rt.description || `${rt.name} at ${property.name}`,
      price: (rt.base_price_paise / 100).toFixed(2),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
      url: `https://hotelflexi.novaxai.in/book/${slug}?room_type=${rt.id}`,
    })),
  } : null;

  return (
    <div className="min-h-screen bg-surface-light text-content-primary-light">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Official Website & Google Best Rate Guarantee Ribbon */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-[11px] font-bold py-2 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></span>
            <span>⭐ Official Hotel Website &bull; Direct Reservation Portal</span>
          </div>
          <div className="flex items-center gap-4 text-emerald-100 font-semibold text-[10px]">
            <span>✓ Best Rate Guaranteed (0% Middleman Fees)</span>
            <span>✓ Instant Direct Confirmation</span>
            <span>✓ Pay at Property Available</span>
          </div>
        </div>
      </div>
      {/* Property Header */}
      <header className="bg-white border-b border-border-light shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {property?.logo_url || property?.logoUrl ? (
              <img
                src={property.logo_url || property.logoUrl}
                alt={property.name}
                className="w-10 h-10 rounded-xl object-contain border border-border-light bg-surface-light p-1"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-sm font-bold">
                {property?.name?.charAt(0) || 'H'}
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-content-primary-light">
                {property?.name || 'HotelFlexi Property'}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-content-secondary-light">
                <MapPin className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                <span>{[property?.city, property?.state, property?.country].filter(Boolean).join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-content-secondary-light">
            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4" /> Direct Best Rate Guaranteed
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Photo Gallery Banner if present */}
        {galleryImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl overflow-hidden border border-border-light bg-white p-2">
            {galleryImages.slice(0, 4).map((img, i) => (
              <div key={i} className="aspect-video relative rounded-xl overflow-hidden bg-surface-light">
                <img src={img} alt="Property" className="w-full h-full object-cover hover:scale-105 transition duration-300" />
              </div>
            ))}
          </div>
        )}

        {/* Property Overview / Description if available */}
        {property?.description && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-border-light shadow-sm space-y-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-content-primary-light flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
              About {property?.name}
            </h2>
            <p className="text-xs text-content-secondary-light leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>
        )}

        {/* Property Amenities & Highlights */}
        {propertyAmenities.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-border-light shadow-sm space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-blue" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-primary-light">
                Property Amenities & Facilities
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {propertyAmenities.map((am, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-surface-light border border-border-light text-xs font-medium text-content-primary-light flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {am}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Date & Guest Filter Bar */}
        <div className="p-5 rounded-2xl bg-white border border-border-light shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-content-primary-light uppercase tracking-wider mb-1">
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
              <label className="block text-[11px] font-semibold text-content-primary-light uppercase tracking-wider mb-1">
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
              <label className="block text-[11px] font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                Adults
              </label>
              <select
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} Adult{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                Children
              </label>
              <select
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
              >
                {[0, 1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    {num === 0 ? 'No Children' : `${num} Child${num > 1 ? 'ren' : ''}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchAvailability}
              className="w-full py-2.5 rounded-lg bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover transition shadow-sm flex items-center justify-center gap-1.5"
            >
              Update Search
            </button>
          </div>

          {/* Child policy banner */}
          <div className="mt-3 pt-3 border-t border-border-light flex items-center gap-2 text-[11px] text-content-secondary-light">
            <Baby className="w-3.5 h-3.5 text-brand-blue" />
            <span>
              <strong>Child Policy:</strong> Children up to {childCutoffAge} years qualify for child tariff{' '}
              {childRatePaise > 0 ? `(₹${(childRatePaise / 100).toLocaleString('en-IN')}/night)` : '(complimentary)'}.
              Children above {childCutoffAge} years are counted as extra adults.
            </span>
          </div>
        </div>

        {/* Room Types Listing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-content-primary-light">
              Available Room Categories ({roomTypes.length})
            </h2>
            <span className="text-xs text-content-secondary-light">
              {checkInDate} to {checkOutDate}
            </span>
          </div>

          {roomTypes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="font-bold text-sm text-content-primary-light">No Rooms Available</h3>
              <p className="text-xs text-content-secondary-light">
                All rooms are reserved for the selected dates. Try adjusting your dates or guest count.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roomTypes.map((rt) => {
                const rtImages: string[] = Array.isArray(rt.images)
                  ? rt.images
                  : typeof rt.images === 'string'
                  ? JSON.parse(rt.images || '[]')
                  : [];

                const rtAmenities: string[] = Array.isArray(rt.amenities)
                  ? rt.amenities
                  : typeof rt.amenities === 'string'
                  ? JSON.parse(rt.amenities || '[]')
                  : [];

                return (
                  <div key={rt.id} className="rounded-2xl bg-white border border-border-light shadow-sm flex flex-col justify-between overflow-hidden hover:border-brand-blue/50 transition">
                    {/* Room Category Photo */}
                    {rtImages.length > 0 && (
                      <div className="aspect-video w-full relative bg-surface-light overflow-hidden border-b border-border-light">
                        <img src={rtImages[0]} alt={rt.name} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                        {rtImages.length > 1 && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                            +{rtImages.length - 1} photos
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-sm text-content-primary-light">{rt.name}</h3>
                            <p className="text-xs text-content-secondary-light line-clamp-2 mt-0.5">
                              {rt.description || 'Spacious, well-appointed room with modern amenities.'}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            {rt.availableCount} Available
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <span className="px-2 py-0.5 rounded bg-surface-light text-[10px] font-semibold text-content-secondary-light border border-border-light">
                            Max {rt.maxOccupancy} Guests / Room
                          </span>
                          {rtAmenities.map((am: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-blue-50/60 text-blue-900 border border-blue-100 text-[10px]">
                              {am}
                            </span>
                          ))}
                        </div>

                        {rt.roomsNeeded > 1 && (
                          <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-brand-blue text-[11px] font-bold">
                            🏨 {rt.roomsNeeded} Rooms allocated for {adults} guests (Max {rt.maxOccupancy} guests per room)
                          </div>
                        )}

                        {rt.extraAdultsCount > 0 && (
                          <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
                            +{formatINR(rt.totalExtraAdultChargePaise)} for {rt.extraAdultsCount} extra guest{rt.extraAdultsCount > 1 ? 's' : ''} ({formatINR(rt.extraAdultPricePaise)}/night)
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-border-light flex items-center justify-between">
                        <div>
                          <div className="text-base font-extrabold text-brand-blue">
                            {formatINR(rt.nightlyPricePaise)}
                            <span className="text-[10px] text-content-secondary-light font-normal"> / night</span>
                          </div>
                          <div className="text-[10px] text-content-secondary-light">
                            Total {formatINR(rt.totalPaise)} (incl. GST)
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedRoom(rt);
                            setAppliedCoupon(null);
                            setCouponCode('');
                          }}
                          className="px-4 py-2 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow-sm"
                        >
                          Book Room &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-border-light shadow-2xl p-6 space-y-4 my-8">
            {bookingConfirmed ? (
              /* Booking Success & FlexiLink Presentation */
              <div className="text-center space-y-4 py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-content-primary-light">Reservation Confirmed!</h3>
                  <p className="text-xs text-content-secondary-light mt-1">
                    Booking Reference: <span className="font-mono font-bold text-brand-blue">{bookingConfirmed.reservationNumber}</span>
                  </p>
                </div>

                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-left space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-brand-blue flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Your Digital FlexiLink Guest Pass
                    </div>
                    {bookingConfirmed.roomNumber && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono font-bold text-[11px] border border-blue-300">
                        Room {bookingConfirmed.roomNumber}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/80 border border-blue-200 text-[11px] text-slate-800 space-y-1">
                    {bookingConfirmed.advancePaid || bookingConfirmed.paymentStatus === 'paid_advance' ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Advance Paid: {formatINR(bookingConfirmed.advanceAmountPaise || bookingConfirmed.totalAmountPaise)} (Razorpay Direct)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                        <Hotel className="w-3.5 h-3.5 text-brand-blue" />
                        <span>Payment Mode: Kindly proceed and pay at the property upon check-in</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>Total Stay Tariff: {formatINR(bookingConfirmed.totalAmountPaise)}</span>
                      <span>Balance Due at Check-in: {formatINR(bookingConfirmed.balanceAmountPaise || 0)}</span>
                    </div>
                  </div>

                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    Use your personal FlexiLink portal for <strong>express self check-in</strong>, digital folio, and contactless payments.
                    We have also emailed this confirmation and link to <strong>{guestEmail || 'your email address'}</strong>.
                  </p>

                  <div className="space-y-2 pt-1">
                    <Link
                      href={`/guest/${bookingConfirmed.guestPortalToken}`}
                      target="_blank"
                      className="w-full py-2.5 rounded-lg bg-brand-blue text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-brand-blue-hover transition"
                    >
                      Open Guest Portal (Direct Access &bull; No Login) <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <a
                      href="https://play.google.com/store/apps/details?id=in.novaxai.hotelflexiso"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <span>📱 Download Guest Android App on Google Play</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-tight pt-1">
                    🔒 All login screens are skipped for guests using their link. Digital portal and room services access automatically expire 7 days after checkout.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedRoom(null);
                    setBookingConfirmed(null);
                  }}
                  className="w-full py-2.5 rounded-lg border border-border-light text-xs font-semibold hover:bg-surface-light text-content-secondary-light"
                >
                  Done & Close
                </button>
              </div>
            ) : (
              /* Reservation Input Form */
              <form onSubmit={handleBookNow} className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border-light">
                  <div>
                    <h3 className="text-base font-bold text-content-primary-light">Reserve {selectedRoom.name}</h3>
                    <p className="text-xs text-content-secondary-light">
                      {checkInDate} &rarr; {checkOutDate} • {adults} Adult(s) {children > 0 ? `• ${children} Child(ren)` : ''}
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
                  <label className="block text-[11px] font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                    Primary Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                      Email (For FlexiLink) *
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="guest@mail.com"
                      className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue text-xs"
                    />
                  </div>
                </div>

                {/* Promo Coupon Box */}
                <div className="p-3 bg-surface-light rounded-xl border border-border-light space-y-2">
                  <label className="text-[11px] font-semibold text-content-primary-light flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-brand-blue" />
                    Have a Promotional Coupon Code?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. MONSOON20"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-border-light bg-white font-mono font-bold uppercase text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shrink-0"
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {appliedCoupon.message} (-{formatINR(appliedCoupon.discountPaise)})
                    </p>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {couponError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                    Special Requests
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Late arrival, high floor, quiet room..."
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue text-xs"
                  />
                </div>

                {/* Dynamic Pricing & Advance Calculation */}
                {(() => {
                  const finalTotalPaise = Math.max(0, selectedRoom.totalPaise - (appliedCoupon?.discountPaise || 0));
                  const advancePolicy = property?.advancePaymentPolicy || 'full';
                  let advancePaise = finalTotalPaise;
                  if (advancePolicy === 'partial_percent') {
                    const pct = Math.min(100, Math.max(1, property?.advancePaymentPercent || 20));
                    advancePaise = Math.round((finalTotalPaise * pct) / 100);
                  } else if (advancePolicy === 'partial_fixed') {
                    const fixed = property?.advancePaymentFixedPaise || 100000;
                    advancePaise = Math.min(finalTotalPaise, fixed);
                  } else if (advancePolicy === 'pay_at_hotel') {
                    advancePaise = 0;
                  }
                  const balancePaise = Math.max(0, finalTotalPaise - advancePaise);
                  const isOnlinePaymentAvailable = Boolean(property?.razorpayReady && advancePaise > 0);

                  return (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-surface-light border border-border-light space-y-1.5 text-xs">
                        <div className="flex justify-between text-content-secondary-light">
                          <span>Room Tariff</span>
                          <span>{formatINR(selectedRoom.totalRoomChargePaise)}</span>
                        </div>
                        <div className="flex justify-between text-content-secondary-light">
                          <span>Applicable GST</span>
                          <span>{formatINR(selectedRoom.taxPaise)}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Promo Discount ({appliedCoupon.code})</span>
                            <span>-{formatINR(appliedCoupon.discountPaise)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-extrabold text-content-primary-light text-sm pt-1.5 border-t border-border-light">
                          <span>Total Stay Tariff</span>
                          <span className="text-slate-900">{formatINR(finalTotalPaise)}</span>
                        </div>

                        {advancePolicy !== 'full' && (
                          <div className="pt-2 border-t border-dashed border-border-light space-y-1">
                            <div className="flex justify-between items-center text-xs font-bold text-brand-blue">
                              <span>Advance Payable Now ({advancePolicy === 'partial_percent' ? `${property?.advancePaymentPercent}% Deposit` : advancePolicy === 'partial_fixed' ? 'Fixed Deposit' : 'Pay at Hotel'})</span>
                              <span>{formatINR(advancePaise)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-content-secondary-light">
                              <span>Remaining Balance (Due at Check-in)</span>
                              <span>{formatINR(balancePaise)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isOnlinePaymentAvailable && (
                        <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-blue-900 block">Kindly proceed and pay at the property.</span>
                            <p className="text-[11px] text-blue-800 leading-relaxed">
                              Online advance payment is not required for this booking. You can complete your reservation instantly and comfortably settle the stay amount upon check-in at the hotel front desk via Cash, UPI, or Card.
                            </p>
                          </div>
                        </div>
                      )}

                      {property?.bookingEngineTerms && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600">
                          <strong>House Rules &amp; Cancellation:</strong> {property.bookingEngineTerms}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="w-full py-3.5 rounded-xl bg-brand-blue text-white font-extrabold text-xs hover:bg-brand-blue-hover transition shadow-md flex items-center justify-center gap-2"
                      >
                        {bookingLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Securing Reservation...
                          </>
                        ) : isOnlinePaymentAvailable ? (
                          <>
                            <CreditCard className="w-4 h-4" /> Pay Advance ({formatINR(advancePaise)}) via Razorpay &amp; Confirm
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            Kindly Proceed and Pay at the Property
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
