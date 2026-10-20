'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Heart,
  Calendar,
  Users,
  UtensilsCrossed,
  Sparkles,
  Download,
  Phone,
  Mail,
  CheckCircle2,
  Building,
  BedDouble,
  ChevronRight,
  Printer,
  FileText,
  Loader2,
  Clock,
  Shield,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://hotelflexi.divyansh-shukla.workers.dev/api/v1';

export default function PublicWeddingEnginePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // MCQ Calculator States
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  });
  const [numberOfDays, setNumberOfDays] = useState(2);
  const [guestCount, setGuestCount] = useState(250);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['haldi', 'sangeet', 'wedding']);
  const [eventVenues, setEventVenues] = useState<Record<string, string>>({
    haldi: 'poolside',
    sangeet: 'banquet',
    wedding: 'lawn',
    reception: 'banquet',
    mehendi: 'garden',
    ring: 'banquet',
  });
  const [djEntertainment, setDjEntertainment] = useState('dj_pro');
  const [mandapStyle, setMandapStyle] = useState('royal_floral');
  const [mealPreference, setMealPreference] = useState<'veg' | 'non_veg' | 'multi_cuisine'>('veg');
  const [selectedDecorId, setSelectedDecorId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [roomsNeeded, setRoomsNeeded] = useState(15);

  // Inquiry Form
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState<any>(null);

  const fetchWeddingData = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/public/wedding/${slug}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load wedding portal');
      }
      setData(json);
      if (json.decorThemes?.[0]?.id) {
        setSelectedDecorId(json.decorThemes[0].id);
      }
      if (json.packages?.[0]?.id) {
        setSelectedPackageId(json.packages[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Wedding engine is not active for this property');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeddingData();
  }, [slug]);

  const property = data?.property;
  const settings = data?.settings;
  const packages = data?.packages || [];
  const decorThemes = data?.decorThemes || [];

  // Live Cost Estimation Breakdown (CATERING IS STRICTLY CALCULATED PER DAY, NOT PER EVENT!)
  const estimation = useMemo(() => {
    if (!settings) return null;

    // 1. Catering calculated per DAY of hospitality across all guests
    const platePricePaise =
      mealPreference === 'multi_cuisine'
        ? (settings.base_multicuisine_plate_price_paise || 200000)
        : mealPreference === 'non_veg'
        ? (settings.base_nonveg_plate_price_paise || 160000)
        : (settings.base_veg_plate_price_paise || 120000);

    // Explicit Rule: guestCount * platePrice * numberOfDays
    const cateringPaise = guestCount * platePricePaise * numberOfDays;

    // 2. Venue & Staging Fee per Selected Event Function
    const venuePerEvent = settings.base_function_venue_charge_paise || 5000000;
    const eventCount = Math.max(1, selectedEvents.length);
    const venueStagingPaise = venuePerEvent * eventCount;

    // 3. Mandap & Decor Theme
    const chosenDecor = decorThemes.find((d: any) => d.id === selectedDecorId);
    const decorPaise = chosenDecor?.base_price_paise || 15000000;

    // 4. Rooms Accommodation (Rooms * Nightly Rate * Number of Days)
    const roomRatePaise = 350000;
    const accommodationPaise = roomsNeeded * roomRatePaise * numberOfDays;

    const subtotalPaise = cateringPaise + venueStagingPaise + decorPaise + accommodationPaise;
    const gstPaise = Math.round((subtotalPaise * 1800) / 10000); // 18% GST on events/banquet
    const grandTotalPaise = subtotalPaise + gstPaise;

    return {
      platePricePaise,
      cateringPaise,
      eventCount,
      venueStagingPaise,
      decorPaise,
      chosenDecor,
      accommodationPaise,
      subtotalPaise,
      gstPaise,
      grandTotalPaise,
    };
  }, [settings, decorThemes, guestCount, numberOfDays, selectedEvents, mealPreference, selectedDecorId, roomsNeeded]);

  const formatINR = (paise: number) => `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone) {
      alert('Please enter your name and phone number');
      return;
    }
    setSubmittingInquiry(true);
    try {
      const res = await fetch(`${API_BASE}/public/wedding/${slug}/inquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName,
          guestPhone,
          guestEmail,
          eventDates: eventDate,
          guestCount,
          functionsCount: selectedEvents.length,
          mealPreference,
          selectedDecorId,
          selectedPackageId,
          roomsNeeded,
          estimatedTotalPaise: estimation?.grandTotalPaise || 0,
          specialNotes: `[Duration: ${numberOfDays} Days | Functions: ${selectedEvents.join(', ')}] ${specialNotes || ''}`.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit inquiry');
      setInquirySuccess(json);
    } catch (err: any) {
      alert(err.message || 'Could not submit inquiry');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handlePrintQuotation = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-3xl bg-rose-600 text-white flex items-center justify-center mx-auto animate-bounce shadow-lg">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <span className="text-xs font-bold text-slate-600 block">Loading Destination Wedding Experience...</span>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Destination Wedding Engine Inactive</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || 'This hotel has not yet published their destination wedding package.'}
          </p>
          <a
            href={`/book/${slug}`}
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Go to Room Booking Engine &rarr;
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-rose-100 selection:text-rose-900 print:bg-white">
      {/* Top Property Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {property.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={property.logoUrl} alt={property.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-sm">
                <Heart className="w-4 h-4 fill-current" />
              </div>
            )}
            <div>
              <span className="font-extrabold text-sm text-slate-900 block leading-tight">{property.name}</span>
              <span className="text-[10px] text-slate-500 font-medium">{property.address}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {settings.contact_phone && (
              <a
                href={`tel:${settings.contact_phone}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
              >
                <Phone className="w-3.5 h-3.5 text-rose-600" />
                <span>{settings.contact_phone}</span>
              </a>
            )}
            <a
              href="#calculator"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get Instant Quotation</span>
            </a>
          </div>
        </div>
      </header>

      {/* PRINT-ONLY FORMAL QUOTATION HEADER */}
      <div className="hidden print:block p-8 border-b-2 border-slate-900 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{property.name}</h1>
            <p className="text-xs text-slate-600">{property.address}</p>
            <p className="text-xs text-slate-600">Phone: {settings.contact_phone} &bull; Email: {settings.contact_email}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Official Wedding Quotation</span>
            <span className="text-sm font-mono font-bold text-slate-900">REF: WED-{Date.now().toString().slice(-6)}</span>
            <span className="text-[10px] text-slate-500 block">Generated on: {new Date().toLocaleDateString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-rose-50/70 via-slate-50 to-white pt-10 pb-16 border-b border-slate-200 print:hidden overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>Destination Wedding &amp; Grand Celebrations</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              {settings.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {settings.tagline || settings.description}
            </p>
          </div>

          {/* Hero Cover Image */}
          {settings.cover_image_url && (
            <div className="aspect-[21/9] max-h-[440px] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.cover_image_url}
                alt={settings.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6 sm:p-8">
                <div className="text-white space-y-1">
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-widest">Royal Destination Venue</span>
                  <h3 className="text-xl sm:text-2xl font-black">{property.name}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Venue Capacities Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Grand Wedding Lawn</span>
              <div className="text-2xl font-black text-slate-900">{settings.lawn_capacity || 500} <span className="text-xs font-semibold text-slate-500">Guests</span></div>
              <span className="text-[11px] text-emerald-600 font-semibold block">Open-Air Natural Staging</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Air-Conditioned Banquet</span>
              <div className="text-2xl font-black text-slate-900">{settings.banquet_capacity || 300} <span className="text-xs font-semibold text-slate-500">Guests</span></div>
              <span className="text-[11px] text-blue-600 font-semibold block">Acoustic &amp; Modern Lighting</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Wedding Party Rooms</span>
              <div className="text-2xl font-black text-slate-900">{settings.rooms_available_for_wedding || 30} <span className="text-xs font-semibold text-slate-500">Rooms</span></div>
              <span className="text-[11px] text-purple-600 font-semibold block">Bridal Suite with 24/7 Butler</span>
            </div>
          </div>
        </div>
      </section>

      {/* CURATED WEDDING PACKAGES */}
      {packages.length > 0 && (
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 print:hidden">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Curated All-Inclusive Plans
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Featured Wedding Packages
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Choose an all-inclusive pre-curated package or build your custom estimate below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg: any) => (
              <div
                key={pkg.id}
                className={`bg-white rounded-3xl border overflow-hidden shadow-sm flex flex-col justify-between transition hover:shadow-lg ${
                  selectedPackageId === pkg.id ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
                }`}
              >
                {pkg.cover_image_url && (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pkg.cover_image_url} alt={pkg.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">{pkg.name}</h3>
                      <span className="font-black text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg shrink-0">
                        {pkg.price_range}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{pkg.description}</p>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inclusions:</span>
                    <ul className="space-y-1.5">
                      {pkg.inclusions?.map((inc: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPackageId(pkg.id);
                      document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      selectedPackageId === pkg.id
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    <span>{selectedPackageId === pkg.id ? '✓ Selected in Calculator' : 'Select Package in Calculator'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MANDAP & DECORATION THEMES GALLERY */}
      {decorThemes.length > 0 && (
        <section className="py-14 bg-white border-y border-slate-200 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                Staging &amp; Aesthetics
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Mandap &amp; Stage Decoration Concepts
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                Select your favorite decor concept to calculate your customized event quotation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decorThemes.map((decor: any) => (
                <div
                  key={decor.id}
                  onClick={() => setSelectedDecorId(decor.id)}
                  className={`bg-slate-50 rounded-3xl border overflow-hidden cursor-pointer transition shadow-sm hover:shadow-md ${
                    selectedDecorId === decor.id ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30' : 'border-slate-200'
                  }`}
                >
                  {decor.photos?.[0] && (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-slate-200 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={decor.photos[0]} alt={decor.name} className="w-full h-full object-cover" />
                      {selectedDecorId === decor.id && (
                        <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                          ✓ Selected Theme
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-5 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-sm text-slate-900">{decor.name}</h4>
                      <span className="font-bold text-xs text-rose-600">{decor.price_range}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{decor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* INTERACTIVE MCQ QUOTATION BUILDER & FORM */}
      <section id="calculator" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2 print:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Smart MCQ Quotation Estimator
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Build Your Customized Wedding Estimate
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Answer a few simple questions below to generate an instant itemized budget breakdown, download your official quotation, and coordinate with our events team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* MCQ CONTROLS (8 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8 print:hidden">
            {/* Step 1: Event Date */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">1</span>
                <span>Select Tentative Event Date(s)</span>
              </div>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
              />
            </div>

            {/* Step 2: Guest Count (MCQ) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">2</span>
                  <span>Estimated Guest Count</span>
                </div>
                <span className="font-extrabold text-sm text-rose-600">{guestCount} Guests</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[100, 250, 500, 800].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setGuestCount(count)}
                    className={`py-3 px-3 rounded-2xl text-xs font-extrabold border transition ${
                      guestCount === count
                        ? 'bg-rose-600 text-white border-rose-600 shadow'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    {count} Guests
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Event Duration (Days) & Specific Events Selection */}
            <div className="space-y-6 p-5 rounded-2xl bg-gradient-to-br from-rose-50/50 to-amber-50/30 border border-rose-100">
              {/* Part A: Number of Days */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                    <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">3A</span>
                    <span>Total Celebration Duration (Days)</span>
                  </div>
                  <span className="font-black text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                    {numberOfDays} {numberOfDays === 1 ? 'Day' : 'Days'} Hospitality
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { days: 1, label: '1 Day Celebration' },
                    { days: 2, label: '2 Days (Most Popular)' },
                    { days: 3, label: '3 Days Destination' },
                    { days: 4, label: '4 Days Royal Extravaganza' },
                  ].map((d) => (
                    <button
                      key={d.days}
                      type="button"
                      onClick={() => setNumberOfDays(d.days)}
                      className={`p-3 rounded-xl text-left border transition ${
                        numberOfDays === d.days
                          ? 'bg-rose-600 text-white border-rose-600 shadow'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="font-extrabold text-xs">{d.days} {d.days === 1 ? 'Day' : 'Days'}</div>
                      <div className={`text-[10px] mt-0.5 ${numberOfDays === d.days ? 'text-rose-100' : 'text-slate-500'}`}>
                        {d.label}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  💡 Catering is calculated per day ({numberOfDays} days) to ensure all meals, high-tea &amp; dinners are seamlessly covered.
                </p>
              </div>

              {/* Part B: Select Specific Events */}
              <div className="space-y-3 pt-3 border-t border-rose-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                    <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">3B</span>
                    <span>Select Specific Functions &amp; Ceremonies</span>
                  </div>
                  <span className="font-extrabold text-xs text-rose-600">
                    {selectedEvents.length} Events across {numberOfDays} Days
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'haldi', name: '🟡 Haldi & Pithi Ceremony', time: 'Morning / Sunlit Session' },
                    { id: 'mehendi', name: '🌿 Mehendi & Henna Celebration', time: 'Afternoon / Garden High-Tea' },
                    { id: 'sangeet', name: '💃 Sangeet & Cocktail Night', time: 'Evening / DJ, Dance & Drinks' },
                    { id: 'ring', name: '💍 Engagement & Ring Ceremony', time: 'Evening / Stage Felicitations' },
                    { id: 'wedding', name: '🪔 Main Wedding & Pheras', time: 'Mahurat / Sacred Mandap Stage' },
                    { id: 'reception', name: '🥂 Grand Gala Reception', time: 'Night / Royal Banquet Feast' },
                  ].map((evt) => {
                    const isSelected = selectedEvents.includes(evt.id);
                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedEvents.length > 1) {
                              setSelectedEvents(selectedEvents.filter((e) => e !== evt.id));
                            }
                          } else {
                            setSelectedEvents([...selectedEvents, evt.id]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-400 text-slate-900'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900">{evt.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{evt.time}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-rose-600 text-white' : 'border border-slate-300'
                        }`}>
                          {isSelected ? '✓' : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Part C: Dynamic Sub-Questions for Selected Events */}
              <div className="space-y-4 pt-3 border-t border-rose-200/60">
                <span className="text-[11px] font-black uppercase text-rose-800 tracking-wider block">
                  Event Specific Customizations
                </span>

                {/* Sangeet Sub-Question */}
                {selectedEvents.includes('sangeet') && (
                  <div className="p-3.5 rounded-xl bg-white border border-rose-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      🎶 Sangeet Entertainment &amp; Audio-Visuals:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'dj_pro', label: 'Pro DJ + LED Moving Heads & Truss' },
                        { id: 'live_band', label: 'Live Folk/Sufi Band + Acoustic Setup' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDjEntertainment(opt.id)}
                          className={`p-2.5 rounded-lg border text-left font-medium ${
                            djEntertainment === opt.id ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Wedding Mandap Sub-Question */}
                {selectedEvents.includes('wedding') && (
                  <div className="p-3.5 rounded-xl bg-white border border-rose-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      🏛️ Phera Mandap Ambience:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'royal_floral', label: 'Royal Floral Dome Mandap (Fresh Flowers)' },
                        { id: 'heritage_glass', label: 'Glass-Reflective Waterbody Mandap' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setMandapStyle(opt.id)}
                          className={`p-2.5 rounded-lg border text-left font-medium ${
                            mandapStyle === opt.id ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Meal & Catering Preference (MCQ) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">4</span>
                <span>Catering &amp; Cuisine Style</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'veg', label: '🥗 Pure Vegetarian Feast', rate: formatINR(settings.base_veg_plate_price_paise || 120000), sub: 'Traditional Indian delicacies, sweets & live chaat' },
                  { id: 'non_veg', label: '🍗 Veg + Non-Veg Spread', rate: formatINR(settings.base_nonveg_plate_price_paise || 160000), sub: 'Rich Mughlai, Tandoor & multi-cuisine curries' },
                  { id: 'multi_cuisine', label: '👑 Royal Gourmet Multi-Cuisine', rate: formatINR(settings.base_multicuisine_plate_price_paise || 200000), sub: 'Pan-Asian, Continental, Indian & live dessert bar' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMealPreference(m.id as any)}
                    className={`p-4 rounded-2xl text-left border transition flex flex-col justify-between ${
                      mealPreference === m.id
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{m.label}</div>
                      <div className="text-xs font-black text-rose-600 mt-1">{m.rate} <span className="text-[10px] font-normal text-slate-500">/ plate</span></div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 block">{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 5: Mandap & Staging Theme (MCQ) */}
            {decorThemes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">5</span>
                  <span>Mandap &amp; Stage Decor Theme</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {decorThemes.map((d: any) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDecorId(d.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                        selectedDecorId === d.id
                          ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d.photos?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.photos[0]} alt={d.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-xs text-slate-900 truncate">{d.name}</div>
                        <div className="text-[11px] font-extrabold text-rose-600">{d.price_range}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Accommodation Rooms (MCQ) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">6</span>
                  <span>Guest Rooms for Wedding Party</span>
                </div>
                <span className="font-extrabold text-sm text-rose-600">{roomsNeeded} Rooms</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[0, 10, 20, 30].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoomsNeeded(r)}
                    className={`py-3 px-3 rounded-2xl text-xs font-extrabold border transition ${
                      roomsNeeded === r
                        ? 'bg-rose-600 text-white border-rose-600 shadow'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    {r === 0 ? 'No Rooms' : `${r} Rooms`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DYNAMIC ESTIMATION & DOWNLOAD QUOTATION CARD (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border-2 border-slate-900 p-6 sm:p-7 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Official Estimation</span>
                  <h3 className="text-base font-black text-slate-900">Quotation Summary</h3>
                </div>
                <button
                  type="button"
                  onClick={handlePrintQuotation}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition print:hidden"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download / Print</span>
                </button>
              </div>

              {/* Itemized Cost Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-start text-slate-700">
                  <div>
                    <span className="font-bold block text-slate-900">🍽️ Guest Catering Hospitality</span>
                    <span className="text-[10px] text-slate-500">
                      {formatINR(estimation?.platePricePaise || 0)}/day &times; {guestCount} Guests &times; {numberOfDays} {numberOfDays === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                  <strong className="text-slate-900 font-extrabold text-sm">{formatINR(estimation?.cateringPaise || 0)}</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-start text-slate-700">
                  <div>
                    <span className="font-bold block text-slate-900">🎪 Event Staging &amp; Venue</span>
                    <span className="text-[10px] text-slate-500">
                      {selectedEvents.length} Functions ({selectedEvents.join(', ')})
                    </span>
                  </div>
                  <strong className="text-slate-900 font-extrabold text-sm">{formatINR(estimation?.venueStagingPaise || 0)}</strong>
                </div>

                <div className="flex justify-between items-center text-slate-600 px-1">
                  <span>💐 Mandap &amp; Floral Decor Theme:</span>
                  <strong className="text-slate-900">{formatINR(estimation?.decorPaise || 0)}</strong>
                </div>

                {roomsNeeded > 0 && (
                  <div className="flex justify-between items-center text-slate-600 px-1">
                    <span>🛏️ Guest Rooms ({roomsNeeded} Rooms &times; {numberOfDays} Nights):</span>
                    <strong className="text-slate-900">{formatINR(estimation?.accommodationPaise || 0)}</strong>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-100">
                  <span>Subtotal:</span>
                  <strong className="text-slate-900">{formatINR(estimation?.subtotalPaise || 0)}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Applicable Indian GST (18% Banquet):</span>
                  <strong className="text-slate-900">{formatINR(estimation?.gstPaise || 0)}</strong>
                </div>

                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex justify-between items-center text-slate-900">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-700 block tracking-wider">Estimated Grand Total</span>
                    <span className="text-xl sm:text-2xl font-black text-rose-950">
                      {formatINR(estimation?.grandTotalPaise || 0)}
                    </span>
                  </div>
                  <span className="text-[10px] text-rose-800 font-semibold bg-rose-200/80 px-2 py-1 rounded-md">
                    All-Inclusive
                  </span>
                </div>
              </div>

              {/* Inquiry & Request Coordination Form */}
              <div className="pt-4 border-t border-slate-100 space-y-4 print:hidden">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-xs text-slate-900">Lock This Estimate &amp; Request Coordination</h4>
                  <p className="text-[10px] text-slate-500">Our events coordinator will connect with you via WhatsApp to discuss customizations.</p>
                </div>

                {inquirySuccess ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Quotation Request Confirmed!</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Reference Number: <strong className="font-mono">{inquirySuccess.leadNumber}</strong>. Our events manager will contact you at <strong>{guestPhone}</strong> shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitInquiry} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Ananya Sharma &amp; Rohit Verma"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mobile / WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="wedding@gmail.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Custom Requirements / Notes</label>
                      <textarea
                        rows={2}
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                        placeholder="e.g. Need Jain catering for 50 guests, fireworks permission..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingInquiry}
                      className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-2"
                    >
                      {submittingInquiry ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Submitting Quotation...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          <span>Submit Quotation &amp; Coordinate with Hotel</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* HotelFlexi Branding Footer */}
              <div className="text-center pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-medium">
                  Verified Destination Venue &bull; Powered by <strong>HotelFlexi</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRINT-ONLY FORMAL QUOTATION FOOTER & TERMS */}
      <div className="hidden print:block p-8 border-t-2 border-slate-900 text-xs text-slate-700 space-y-4">
        <h4 className="font-bold text-slate-900 uppercase">Terms &amp; Booking Guidelines:</h4>
        <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
          <li>This estimate is valid for 15 days from the date of issue and is subject to date availability upon booking confirmation.</li>
          <li>A 25% advance deposit is required to confirm and lock destination wedding dates on the hotel calendar.</li>
          <li>Menu tasting, floral customisation, and exact room allocations will be coordinated directly with the designated banquet manager.</li>
          <li>Outside liquor &amp; sound permissions require standard state excise and local licensing compliances.</li>
        </ul>
        <div className="pt-6 flex justify-between items-center text-[10px] text-slate-500">
          <span>{property.name} &bull; Official Event Quotation</span>
          <span>Powered by HotelFlexi Hospitality OS</span>
        </div>
      </div>
    </div>
  );
}
