'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  ChevronLeft,
  Image as ImageIcon,
  Phone,
  MessageCircle,
  Compass,
  BedDouble,
  Wifi,
  Utensils,
  X,
  Award,
  Star,
  ArrowRight,
  Check,
} from 'lucide-react';

export default function DirectBookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  // Search parameters
  const [checkInDate, setCheckInDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('check_in')) return sp.get('check_in')!;
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [checkOutDate, setCheckOutDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('check_out')) return sp.get('check_out')!;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [adults, setAdults] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('adults')) return parseInt(sp.get('adults')!, 10) || 2;
    }
    return 2;
  });

  const [children, setChildren] = useState(0);

  // Active photo indexes for room cards
  const [roomPhotoIdx, setRoomPhotoIdx] = useState<Record<string, number>>({});

  // Property Gallery Lightbox
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  // Add-ons & Activities
  const [publicAddons, setPublicAddons] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});

  const handleAddonQtyChange = (addonId: string, delta: number, min = 1, max = 10) => {
    setSelectedAddons((prev) => {
      const current = prev[addonId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[addonId];
        return copy;
      }
      return { ...prev, [addonId]: Math.min(max, Math.max(min, next)) };
    });
  };

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper: Format date for display (e.g., "Fri, 23 Oct")
  const formatDateReadable = (str: string) => {
    if (!str) return '';
    try {
      const [y, m, d] = str.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      });
    } catch {
      return str;
    }
  };

  // Helper: Calculate night count
  const calculateNights = (cIn: string, cOut: string) => {
    try {
      const d1 = new Date(`${cIn}T12:00:00Z`);
      const d2 = new Date(`${cOut}T12:00:00Z`);
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, diff);
    } catch {
      return 1;
    }
  };

  const nightsCount = calculateNights(checkInDate, checkOutDate);

  // Quick preset shortcuts
  const selectQuickTonight = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    setCheckInDate(today.toISOString().split('T')[0]);
    setCheckOutDate(tomorrow.toISOString().split('T')[0]);
  };

  const selectQuickWeekend = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 1 = Mon ... 5 = Fri, 6 = Sat
    const daysUntilFri = (5 - day + 7) % 7;
    const fri = new Date(now);
    const addDays = daysUntilFri === 0 && now.getHours() >= 15 ? 7 : day === 6 ? 6 : daysUntilFri;
    fri.setDate(now.getDate() + addDays);
    const sun = new Date(fri);
    sun.setDate(fri.getDate() + 2);
    setCheckInDate(fri.toISOString().split('T')[0]);
    setCheckOutDate(sun.toISOString().split('T')[0]);
  };

  const selectNextWeekend = () => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilFri = (5 - day + 7) % 7;
    const fri = new Date(now);
    fri.setDate(now.getDate() + daysUntilFri + 7);
    const sun = new Date(fri);
    sun.setDate(fri.getDate() + 2);
    setCheckInDate(fri.toISOString().split('T')[0]);
    setCheckOutDate(sun.toISOString().split('T')[0]);
  };

  // Fetch availability from backend
  const fetchAvailability = useCallback(
    async (cIn = checkInDate, cOut = checkOutDate, numAdults = adults, numChildren = children) => {
      if (!slug) return;
      setSearching(true);
      setError(null);
      try {
        const data = await apiClient(
          `/public/properties/${slug}/availability?check_in=${cIn}&check_out=${cOut}&guests=${numAdults}&children=${numChildren}`
        );
        setRoomTypes(data.roomTypes || []);
      } catch (e: any) {
        console.error('Availability fetch error:', e);
        setError(e.message || 'Failed to check room availability.');
      } finally {
        setSearching(false);
        setLoading(false);
      }
    },
    [slug, checkInDate, checkOutDate, adults, children]
  );

  // Dynamic Razorpay script load
  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function loadProperty() {
      try {
        const [propData, addonsData] = await Promise.all([
          apiClient(`/public/properties/${slug}`),
          apiClient(`/public/addons/slug/${slug}`).catch(() => ({ addons: [] })),
        ]);
        setProperty(propData.property);
        setPublicAddons(addonsData.addons || []);
        await fetchAvailability(checkInDate, checkOutDate, adults, children);
      } catch (e: any) {
        setError('Hotel property not found or booking engine disabled.');
        setLoading(false);
      }
    }
    if (slug) {
      loadProperty();
    }
  }, [slug]);

  // Auto re-fetch when dates or guests change
  const isInitial = useRef(true);
  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchAvailability(checkInDate, checkOutDate, adults, children);
    }, 200);
    return () => clearTimeout(timer);
  }, [checkInDate, checkOutDate, adults, children, fetchAvailability]);

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
      const addonsPayload = Object.entries(selectedAddons)
        .filter(([_, qty]) => qty > 0)
        .map(([addonId, qty]) => {
          const addon = publicAddons.find((a) => a.id === addonId);
          const isPerson = addon?.pricing_type === 'per_person';
          const unitPrice = addon?.pricing_type === 'free' ? 0 : addon?.price_paise || 0;
          const total = isPerson ? unitPrice * qty * adults : unitPrice * qty;
          return {
            id: addonId,
            name: addon?.name || 'Add-on Activity',
            pricingType: addon?.pricing_type || 'flat',
            quantity: qty,
            unitPricePaise: unitPrice,
            totalPricePaise: total,
          };
        });

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
        selectedAddons: addonsPayload,
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
              } catch {
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
        } catch {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Connecting Hotel Direct Engine...</h3>
            <p className="text-xs text-slate-500 mt-0.5">Fetching live room rates &amp; availability</p>
          </div>
        </div>
      </div>
    );
  }

  const childCutoffAge = property?.childCutoffAge ?? property?.child_cutoff_age ?? 10;
  const childRatePaise = property?.childRatePaise ?? property?.child_rate_paise ?? 0;
  const galleryImages: string[] = Array.isArray(property?.photos)
    ? property.photos
    : typeof property?.photos === 'string'
    ? JSON.parse(property.photos || '[]')
    : Array.isArray(property?.galleryImages)
    ? property.galleryImages
    : typeof property?.gallery_images === 'string'
    ? JSON.parse(property.gallery_images || '[]')
    : Array.isArray(property?.gallery_images)
    ? property.gallery_images
    : [];

  const propertyAmenities: string[] = Array.isArray(property?.amenities)
    ? property.amenities
    : typeof property?.amenities === 'string'
    ? JSON.parse(property.amenities || '[]')
    : [];

  // Google Schema.org structured data JSON-LD
  const jsonLd = property
    ? {
        '@context': 'https://schema.org',
        '@type': ['Hotel', 'LodgingBusiness'],
        name: property.name,
        description:
          property.description ||
          `${property.name} Official Direct Booking Engine with best rate guarantee and instant confirmation.`,
        url: `https://hotelflexi.com/book/${slug}`,
        telephone: property.phone || '',
        email: property.email || '',
        image: galleryImages.length > 0 ? galleryImages : property.logo_url ? [property.logo_url] : [],
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
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-brand-blue selection:text-white">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Top Direct Booking Value Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white text-[11px] font-semibold py-2 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white tracking-wide">
              Official Direct Booking Engine &bull; {property?.name || 'Hotel Property'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-300 text-[10px] sm:text-[11px]">
            <span className="text-emerald-400 font-bold">✓ Best Rate Guaranteed (0% Commission)</span>
            <span className="hidden md:inline">&bull;</span>
            <span className="hidden md:inline">✓ Instant Digital Confirmation</span>
            <span className="hidden md:inline">&bull;</span>
            <span>✓ Pay Online or at Check-in</span>
          </div>
        </div>
      </div>

      {/* Modern Hotel Header Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {property?.logo_url || property?.logoUrl ? (
              <img
                src={property.logo_url || property.logoUrl}
                alt={property.name}
                className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-blue to-indigo-700 flex items-center justify-center text-white shadow-xs font-black text-lg shrink-0">
                {property?.name?.charAt(0) || 'H'}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                  {property?.name || 'HotelFlexi Resort'}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <ShieldCheck className="w-3 h-3" /> Verified Official
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                <MapPin className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                <span className="truncate">
                  {[property?.address_line1, property?.city, property?.state]
                    .filter(Boolean)
                    .join(', ') || 'India'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Contact & WhatsApp Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {property?.phone && (
              <a
                href={`tel:${property.phone}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition hover:bg-slate-50 shadow-xs"
                title="Call Front Desk Directly"
              >
                <Phone className="w-3.5 h-3.5 text-brand-blue" />
                <span>Call Hotel</span>
              </a>
            )}
            {property?.phone && (
              <a
                href={`https://wa.me/${property.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Namaste, I am looking to book rooms at ${property.name} for ${formatDateReadable(checkInDate)} to ${formatDateReadable(checkOutDate)}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                title="Chat with Hotel Front Desk on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp Front Desk</span>
                <span className="sm:hidden">WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error Alert if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Hero Gallery Showcase */}
        {galleryImages.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 rounded-3xl overflow-hidden border border-slate-200/80 bg-white p-2 shadow-sm">
              {/* Primary Large Image */}
              <div
                onClick={() => {
                  setLightboxIndex(0);
                  setGalleryModalOpen(true);
                }}
                className="sm:col-span-2 aspect-video sm:aspect-auto sm:h-72 relative rounded-2xl overflow-hidden cursor-pointer group bg-slate-100"
              >
                <img
                  src={galleryImages[0]}
                  alt="Hotel Main View"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <div className="text-white">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-bold tracking-wider uppercase">
                      Property Overview
                    </span>
                    <h2 className="text-lg font-black mt-1 drop-shadow-sm">{property?.name}</h2>
                  </div>
                </div>
              </div>

              {/* Side Images */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-2 h-72">
                {galleryImages.slice(1, 5).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setLightboxIndex(idx + 1);
                      setGalleryModalOpen(true);
                    }}
                    className="relative rounded-2xl overflow-hidden cursor-pointer group bg-slate-100 h-full"
                  >
                    <img
                      src={img}
                      alt={`Photo ${idx + 2}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {idx === 3 && galleryImages.length > 5 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white font-bold text-xs">
                        +{galleryImages.length - 4} More Photos
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-[11px] text-slate-500">
                📸 {galleryImages.length} verified property &amp; room photos
              </span>
              <button
                type="button"
                onClick={() => {
                  setLightboxIndex(0);
                  setGalleryModalOpen(true);
                }}
                className="text-xs font-bold text-brand-blue hover:text-blue-700 flex items-center gap-1"
              >
                <span>View Full Photo Gallery</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Property Highlights & Amenities Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-brand-blue">
                DIRECT GUEST ADVANTAGE
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 mt-0.5">
                Why Book Directly with {property?.name}?
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Guaranteed Lowest Price
              </span>
              <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
                FlexiLink Digital Guest Pass Included
              </span>
              <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-bold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-600" />
                Priority Room Allocation
              </span>
            </div>
          </div>

          {/* Amenities Pills */}
          {propertyAmenities.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
              {propertyAmenities.map((am, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  {am}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ELEVATED SEARCH & DATE PICKER BAR */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-blue" />
                <span>Select Your Stay Dates &amp; Occupancy</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live tariffs update instantly as you select dates. Weekend premiums (Fri-Sun) apply automatically.
              </p>
            </div>

            {/* Quick Weekend Shortcut Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
              <button
                type="button"
                onClick={selectQuickTonight}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
              >
                Tonight
              </button>
              <button
                type="button"
                onClick={selectQuickWeekend}
                className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-extrabold transition flex items-center gap-1 shadow-xs"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>This Weekend (Fri - Sun)</span>
              </button>
              <button
                type="button"
                onClick={selectNextWeekend}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
              >
                Next Weekend
              </button>
            </div>
          </div>

          {/* Date & Guest Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* Check-in Date */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Check-in Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkInDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newCheckIn = e.target.value;
                    setCheckInDate(newCheckIn);
                    if (checkOutDate <= newCheckIn) {
                      const next = new Date(`${newCheckIn}T12:00:00Z`);
                      next.setUTCDate(next.getUTCDate() + 1);
                      setCheckOutDate(next.toISOString().split('T')[0]);
                    }
                  }}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <span className="block text-[11px] font-bold text-brand-blue mt-1">
                📅 {formatDateReadable(checkInDate)}
              </span>
            </div>

            {/* Check-out Date */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Check-out Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkOutDate}
                  min={checkInDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <span className="block text-[11px] font-bold text-brand-blue mt-1">
                📅 {formatDateReadable(checkOutDate)}
              </span>
            </div>

            {/* Duration Pill */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Stay Length
              </label>
              <div className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-800 text-center flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-blue" />
                <span>
                  {nightsCount} Night{nightsCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Adults */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Adults
              </label>
              <select
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <option key={num} value={num}>
                    {num} Adult{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Children */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Children
              </label>
              <select
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {[0, 1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    {num === 0 ? '0 Children' : `${num} Child${num > 1 ? 'ren' : ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Status & Child Policy Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {searching ? (
                <span className="flex items-center gap-1 text-brand-blue font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating live room rates...
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Showing live rates for {formatDateReadable(checkInDate)} &rarr; {formatDateReadable(checkOutDate)} ({nightsCount}N)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-slate-600">
              <Baby className="w-3.5 h-3.5 text-brand-blue shrink-0" />
              <span>
                Children up to {childCutoffAge} yrs stay{' '}
                {childRatePaise > 0 ? `(₹${(childRatePaise / 100).toLocaleString('en-IN')}/N)` : 'complimentary'}.
              </span>
            </div>
          </div>
        </div>

        {/* AVAILABLE ROOMS SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Available Rooms &amp; Suites ({roomTypes.length})
              </h2>
              <p className="text-xs text-slate-500">
                Best direct tariffs with no booking fees &bull; Instant WhatsApp &amp; Email confirmation
              </p>
            </div>
            {searching && (
              <span className="px-3 py-1 rounded-full bg-blue-50 text-brand-blue font-bold text-xs flex items-center gap-1.5 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recalculating...
              </span>
            )}
          </div>

          {roomTypes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">No Rooms Available for These Dates</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                All room categories are fully booked for {formatDateReadable(checkInDate)} to {formatDateReadable(checkOutDate)}. Please adjust your dates or choose the upcoming weekend.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={selectQuickWeekend}
                  className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover transition shadow-xs"
                >
                  Try This Weekend (Fri - Sun) &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                const currentPhotoIndex = roomPhotoIdx[rt.id] || 0;
                const activeImg = rtImages[currentPhotoIndex] || rtImages[0] || null;

                const isWeekendActive = Boolean(rt.isWeekendPricingActive);
                const hasWeekendPremium = Boolean(rt.weekendPricePaise && rt.weekendPricePaise > rt.basePricePaise);

                return (
                  <div
                    key={rt.id}
                    className="rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between overflow-hidden hover:border-brand-blue/60 hover:shadow-md transition-all duration-300 group"
                  >
                    <div>
                      {/* Photo Carousel Header */}
                      <div className="aspect-video w-full relative bg-slate-100 overflow-hidden border-b border-slate-100">
                        {activeImg ? (
                          <img
                            src={activeImg}
                            alt={rt.name}
                            className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                            <BedDouble className="w-12 h-12 text-slate-300" />
                          </div>
                        )}

                        {/* Photo Count & Navigation */}
                        {rtImages.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoomPhotoIdx((prev) => ({
                                  ...prev,
                                  [rt.id]: (currentPhotoIndex - 1 + rtImages.length) % rtImages.length,
                                }));
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition backdrop-blur-xs"
                              aria-label="Previous Photo"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoomPhotoIdx((prev) => ({
                                  ...prev,
                                  [rt.id]: (currentPhotoIndex + 1) % rtImages.length,
                                }));
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition backdrop-blur-xs"
                              aria-label="Next Photo"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                              {currentPhotoIndex + 1} / {rtImages.length}
                            </span>
                          </>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                          {isWeekendActive && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow-sm flex items-center gap-1 uppercase tracking-wider">
                              <Sparkles className="w-3 h-3 text-slate-950" />
                              Weekend Rate Active
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] shadow-sm">
                            {rt.availableCount} Rooms Available
                          </span>
                        </div>
                      </div>

                      {/* Room Card Body */}
                      <div className="p-5 space-y-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-brand-blue transition">
                              {rt.name}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                              {rt.description || 'Spacious, well-appointed guest room with contemporary comforts and daily housekeeping.'}
                            </p>
                          </div>
                        </div>

                        {/* Occupancy and Capacity Spec */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                            <Users className="w-3.5 h-3.5 text-brand-blue" />
                            Max {rt.maxOccupancy} Guests (Base: {rt.baseOccupancy})
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                            <BedDouble className="w-3.5 h-3.5 text-brand-blue" />
                            {rt.name.toLowerCase().includes('cottage') ? 'Private Cottage' : 'Deluxe Room'}
                          </span>
                        </div>

                        {/* Amenities Chips */}
                        {rtAmenities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {rtAmenities.slice(0, 6).map((am: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-blue-50/70 text-blue-900 text-[10px] font-semibold border border-blue-100/80"
                              >
                                {am}
                              </span>
                            ))}
                            {rtAmenities.length > 6 && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                +{rtAmenities.length - 6} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Multi-room Notice if Guests > Max */}
                        {rt.roomsNeeded > 1 && (
                          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-brand-blue text-xs font-bold flex items-center gap-2">
                            <Hotel className="w-4 h-4 shrink-0" />
                            <span>
                              {rt.roomsNeeded} Rooms automatically assigned to accommodate {adults} guests
                            </span>
                          </div>
                        )}

                        {/* Extra Adult Surcharge Note */}
                        {rt.extraAdultsCount > 0 && (
                          <div className="text-[11px] text-emerald-700 font-bold">
                            +{formatINR(rt.totalExtraAdultChargePaise)} for {rt.extraAdultsCount} extra adult guest{rt.extraAdultsCount > 1 ? 's' : ''} ({formatINR(rt.extraAdultPricePaise)}/N)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing & CTA Footer */}
                    <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                      <div>
                        {/* Nightly Price with Weekend Strike-through */}
                        <div className="flex items-baseline gap-1.5">
                          {isWeekendActive && hasWeekendPremium ? (
                            <>
                              <span className="text-xs text-slate-400 line-through">
                                {formatINR(rt.basePricePaise)}
                              </span>
                              <span className="text-xl font-black text-brand-blue">
                                {formatINR(rt.nightlyPricePaise)}
                              </span>
                              <span className="text-[11px] text-slate-500 font-normal">/ night</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xl font-black text-brand-blue">
                                {formatINR(rt.nightlyPricePaise)}
                              </span>
                              <span className="text-[11px] text-slate-500 font-normal">/ night</span>
                            </>
                          )}
                        </div>

                        {/* Price Breakdown Summary */}
                        <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                          Total {formatINR(rt.totalPaise)} for {nightsCount}N (incl. GST)
                        </div>

                        {/* Weekend Tariff Indicator */}
                        {isWeekendActive ? (
                          <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md mt-1">
                            ✨ Weekend Rate: {rt.weekendNightsCount} weekend night{rt.weekendNightsCount > 1 ? 's' : ''} applied
                          </span>
                        ) : hasWeekendPremium ? (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Standard rate &bull; Weekend: {formatINR(rt.weekendPricePaise)}/N
                          </span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoom(rt);
                          setAppliedCoupon(null);
                          setCouponCode('');
                        }}
                        className="px-5 py-3 rounded-2xl bg-brand-blue hover:bg-brand-blue-hover text-white font-extrabold text-xs transition shadow-md flex items-center gap-1.5 shrink-0 group-hover:scale-102"
                      >
                        <span>Reserve</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* PROPERTY PHOTO LIGHTBOX MODAL */}
      {galleryModalOpen && galleryImages.length > 0 && (
        <div
          onClick={() => setGalleryModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
          >
            <button
              onClick={() => setGalleryModalOpen(false)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300 font-bold text-sm flex items-center gap-1"
            >
              <X className="w-5 h-5" /> Close Gallery
            </button>

            <div className="w-full aspect-video max-h-[75vh] relative rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={galleryImages[lightboxIndex]}
                alt={`Photo ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />

              <button
                type="button"
                onClick={() => setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                className="absolute left-3 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxIndex((prev) => (prev + 1) % galleryImages.length)}
                className="absolute right-3 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="text-white text-xs font-semibold mt-3 text-center">
              Photo {lightboxIndex + 1} of {galleryImages.length} &bull; {property?.name}
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 my-8">
            {bookingConfirmed ? (
              /* Booking Success & FlexiLink Presentation */
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Reservation Confirmed!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Booking Reference:{' '}
                    <span className="font-mono font-extrabold text-brand-blue text-sm">
                      {bookingConfirmed.reservationNumber}
                    </span>
                  </p>
                </div>

                <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-left space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-brand-blue flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Digital FlexiLink Guest Pass
                    </div>
                    {bookingConfirmed.roomNumber && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono font-bold text-[11px] border border-blue-300">
                        Room {bookingConfirmed.roomNumber}
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-white/90 border border-blue-200 text-[11px] text-slate-800 space-y-1.5">
                    {bookingConfirmed.advancePaid || bookingConfirmed.paymentStatus === 'paid_advance' ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Advance Paid:{' '}
                          {formatINR(bookingConfirmed.advanceAmountPaise || bookingConfirmed.totalAmountPaise)} (Razorpay Direct)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                        <Hotel className="w-3.5 h-3.5 text-brand-blue" />
                        <span>Payment Mode: Pay at Property upon check-in</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600 text-[10px] pt-1 border-t border-slate-100">
                      <span>Total Stay Tariff: {formatINR(bookingConfirmed.totalAmountPaise)}</span>
                      <span>Balance Due at Front Desk: {formatINR(bookingConfirmed.balanceAmountPaise || 0)}</span>
                    </div>
                  </div>

                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    Use your personal FlexiLink portal for <strong>express contactless check-in</strong>, Aadhaar ID upload, and digital billing. A confirmation has also been dispatched to <strong>{guestEmail || 'your email'}</strong>.
                  </p>

                  <div className="space-y-2 pt-1">
                    <Link
                      href={`/guest/${bookingConfirmed.guestPortalToken}`}
                      target="_blank"
                      className="w-full py-3 rounded-xl bg-brand-blue text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-brand-blue-hover transition"
                    >
                      <span>Open Express Guest Portal (No Login Required)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <a
                      href="https://play.google.com/store/apps/details?id=in.novaxai.hotelflexi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <span>📱 Download HotelFlexi Android App on Google Play</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoom(null);
                    setBookingConfirmed(null);
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 text-slate-700"
                >
                  Done &amp; Return to Hotel Page
                </button>
              </div>
            ) : (
              /* Reservation Input Form */
              <form onSubmit={handleBookNow} className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue">
                      RESERVATION CONFIRMATION
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedRoom.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDateReadable(checkInDate)} &rarr; {formatDateReadable(checkOutDate)} ({nightsCount} Night{nightsCount > 1 ? 's' : ''}) &bull; {adults} Adult(s) {children > 0 ? `• ${children} Child(ren)` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRoom(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Primary Guest Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Primary Guest Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Vikram Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="guest@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Promotional Coupon Box */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-brand-blue" />
                    Have a Hotel Promotional Code?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. STAYDIRECT"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold uppercase text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shrink-0 disabled:opacity-50"
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
                    <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {couponError}
                    </p>
                  )}
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Early check-in request, quiet room, high floor, anniversary setup..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-medium"
                  />
                </div>

                {/* Add-ons & Activities Selector */}
                {publicAddons.length > 0 && (
                  <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
                        Enhance Your Stay with Add-ons
                      </label>
                      <span className="text-[10px] text-blue-700 font-semibold">Optional</span>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {publicAddons.map((addon) => {
                        const qty = selectedAddons[addon.id] || 0;
                        const isPerson = addon.pricing_type === 'per_person';
                        const isFree = addon.pricing_type === 'free';
                        const unitRupees = isFree ? 0 : addon.price_paise / 100;

                        return (
                          <div
                            key={addon.id}
                            className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                              qty > 0 ? 'bg-white border-brand-blue shadow-xs' : 'bg-white/80 border-slate-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate">{addon.name}</div>
                              <div className="text-[10px] text-brand-blue font-semibold">
                                {isFree ? 'FREE' : `₹${unitRupees} / ${addon.pricing_type.replace('per_', '')}`}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={qty <= 0}
                                onClick={() => handleAddonQtyChange(addon.id, -1, addon.min_qty || 1, addon.max_qty || 10)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center disabled:opacity-30"
                              >
                                -
                              </button>
                              <span className="w-5 text-center font-bold text-xs text-slate-900">{qty}</span>
                              <button
                                type="button"
                                onClick={() => handleAddonQtyChange(addon.id, 1, addon.min_qty || 1, addon.max_qty || 10)}
                                className="w-6 h-6 rounded-lg bg-brand-blue text-white font-bold flex items-center justify-center hover:bg-brand-blue-hover"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ITEMISED PRICING CALCULATION */}
                {(() => {
                  let addonsTotalPaise = 0;
                  const selectedAddonDetails: Array<{ name: string; qty: number; totalPaise: number }> = [];

                  for (const [addonId, qty] of Object.entries(selectedAddons)) {
                    if (qty > 0) {
                      const addon = publicAddons.find((a) => a.id === addonId);
                      if (addon) {
                        const isPerson = addon.pricing_type === 'per_person';
                        const unit = addon.pricing_type === 'free' ? 0 : addon.price_paise;
                        const subtotal = isPerson ? unit * qty * adults : unit * qty;
                        addonsTotalPaise += subtotal;
                        selectedAddonDetails.push({
                          name: addon.name + (isPerson && adults > 1 ? ` (${qty} × ${adults} guests)` : ` (Qty: ${qty})`),
                          qty,
                          totalPaise: subtotal,
                        });
                      }
                    }
                  }

                  const finalTotalPaise = Math.max(
                    0,
                    selectedRoom.totalPaise + addonsTotalPaise - (appliedCoupon?.discountPaise || 0)
                  );
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
                      {/* Detailed Price Breakdown Box */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <div className="font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                          <span>
                            Stay Tariff Breakdown ({nightsCount} Night{nightsCount > 1 ? 's' : ''})
                          </span>
                          <span className="text-brand-blue">{selectedRoom.name}</span>
                        </div>

                        {/* Weekday / Weekend Rate Itemisation */}
                        <div className="space-y-1.5 py-1">
                          {selectedRoom.weekdayNightsCount > 0 && (
                            <div className="flex justify-between text-slate-600">
                              <span>
                                Weekday Tariff ({selectedRoom.weekdayNightsCount} &times; {formatINR(selectedRoom.basePricePaise)})
                              </span>
                              <span className="font-semibold">
                                {formatINR(
                                  selectedRoom.weekdayNightsCount * selectedRoom.basePricePaise * (selectedRoom.roomsNeeded || 1)
                                )}
                              </span>
                            </div>
                          )}
                          {selectedRoom.weekendNightsCount > 0 && (
                            <div className="flex justify-between text-amber-900 bg-amber-50/90 border border-amber-200/60 px-2 py-1 rounded-lg">
                              <span className="flex items-center gap-1 font-bold">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                Weekend Tariff ({selectedRoom.weekendNightsCount} &times; {formatINR(selectedRoom.weekendPricePaise)})
                              </span>
                              <span className="font-extrabold">
                                {formatINR(
                                  selectedRoom.weekendNightsCount * selectedRoom.weekendPricePaise * (selectedRoom.roomsNeeded || 1)
                                )}
                              </span>
                            </div>
                          )}
                          {selectedRoom.roomsNeeded > 1 && (
                            <div className="flex justify-between text-indigo-900 bg-indigo-50/80 px-2 py-0.5 rounded font-semibold">
                              <span>Assigned Rooms:</span>
                              <span>{selectedRoom.roomsNeeded} Rooms</span>
                            </div>
                          )}
                          {selectedRoom.extraAdultsCount > 0 && (
                            <div className="flex justify-between text-indigo-900 bg-indigo-50/80 px-2 py-0.5 rounded font-semibold">
                              <span>Extra Guest Surcharge:</span>
                              <span>+{formatINR(selectedRoom.totalExtraAdultChargePaise)}</span>
                            </div>
                          )}
                          {selectedAddonDetails.map((ad, idx) => (
                            <div key={idx} className="flex justify-between text-blue-900 bg-blue-50/80 px-2 py-0.5 rounded">
                              <span>+ {ad.name}</span>
                              <span className="font-bold">
                                {ad.totalPaise === 0 ? 'FREE' : formatINR(ad.totalPaise)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between text-slate-500 pt-1">
                            <span>Applicable GST (SAC 9963)</span>
                            <span className="font-semibold">{formatINR(selectedRoom.taxPaise)}</span>
                          </div>
                          {appliedCoupon && (
                            <div className="flex justify-between text-emerald-700 font-bold">
                              <span>Promo Code Discount ({appliedCoupon.code})</span>
                              <span>-{formatINR(appliedCoupon.discountPaise)}</span>
                            </div>
                          )}
                        </div>

                        {/* Grand Total */}
                        <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                          <span>Total Stay Tariff</span>
                          <span className="text-base text-brand-blue">{formatINR(finalTotalPaise)}</span>
                        </div>

                        {/* Deposit Breakdown */}
                        {advancePolicy !== 'full' && (
                          <div className="pt-2 border-t border-dashed border-slate-200 space-y-1">
                            <div className="flex justify-between items-center text-xs font-bold text-brand-blue">
                              <span>
                                Advance Payable Now (
                                {advancePolicy === 'partial_percent'
                                  ? `${property?.advancePaymentPercent}% Deposit`
                                  : advancePolicy === 'partial_fixed'
                                  ? 'Fixed Deposit'
                                  : 'Pay at Property'}
                                )
                              </span>
                              <span>{formatINR(advancePaise)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-slate-500">
                              <span>Remaining Due at Front Desk</span>
                              <span className="font-bold">{formatINR(balancePaise)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pay at Hotel Notice when Razorpay is not configured or advance is 0 */}
                      {!isOnlinePaymentAvailable && (
                        <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl text-xs text-blue-950 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-blue-900 block">
                              Pay at Property upon Check-in
                            </span>
                            <p className="text-[11px] text-blue-800 leading-relaxed">
                              Online advance payment is not required. Your booking will be guaranteed immediately, and you can settle the stay balance comfortably upon arrival at the hotel front desk via Cash, UPI, or Card.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="w-full py-4 rounded-2xl bg-brand-blue text-white font-black text-xs sm:text-sm hover:bg-brand-blue-hover transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {bookingLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Securing Your Booking...
                          </>
                        ) : isOnlinePaymentAvailable ? (
                          <>
                            <CreditCard className="w-4 h-4" /> Pay Advance ({formatINR(advancePaise)}) via Razorpay &amp; Confirm
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            Confirm Booking &bull; Pay at Property ({formatINR(finalTotalPaise)})
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
