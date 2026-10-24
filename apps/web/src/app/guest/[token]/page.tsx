'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Hotel,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  UserCheck,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Loader2,
  FileText,
  Baby,
  UtensilsCrossed,
  BellRing,
  AlertTriangle,
  Smartphone,
  Plus,
  Minus,
  Sparkles,
  Download,
  Info,
  Star,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://hotelflexi.divyansh-shukla.workers.dev/api/v1';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// In-Stay Dining Menu
const ROOM_SERVICE_MENU = [
  { id: 'm1', name: 'Veg Club Sandwich & Salted Crisps', pricePaise: 18000, category: 'Snacks' },
  { id: 'm2', name: 'Paneer Butter Masala with 2 Butter Naan', pricePaise: 29000, category: 'Main Course' },
  { id: 'm3', name: 'Dal Makhani & Jeera Rice Combo', pricePaise: 24000, category: 'Main Course' },
  { id: 'm4', name: 'Hyderabadi Veg Dum Biryani & Raita', pricePaise: 26000, category: 'Main Course' },
  { id: 'm5', name: 'Continental Breakfast Platter', pricePaise: 22000, category: 'Breakfast' },
  { id: 'm6', name: 'Kadak Masala Chai (Serves 2)', pricePaise: 6000, category: 'Beverages' },
  { id: 'm7', name: 'Cold Coffee with Ice Cream', pricePaise: 12000, category: 'Beverages' },
  { id: 'm8', name: 'Packaged Drinking Water (1 Litre)', pricePaise: 3000, category: 'Beverages' },
];

export default function GuestPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Active Tab: 'overview' | 'checkin' | 'dining' | 'assistance' | 'feedback'
  const [activeTab, setActiveTab] = useState<'overview' | 'checkin' | 'dining' | 'assistance' | 'feedback'>('overview');

  // Neutral Guest Review states (No preselected stars per Google Policy)
  const [overallRating, setOverallRating] = useState<number>(0);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(0);
  const [staffRating, setStaffRating] = useState<number>(0);
  const [foodRating, setFoodRating] = useState<number>(0);
  const [comfortRating, setComfortRating] = useState<number>(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [aiPolishedDraft, setAiPolishedDraft] = useState('');
  const [polishingReview, setPolishingReview] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [copiedReview, setCopiedReview] = useState(false);

  // Self check-in form states
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [primaryIdUrl, setPrimaryIdUrl] = useState('');
  const [childIdUrl, setChildIdUrl] = useState('');
  const [submittingCheckin, setSubmittingCheckin] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  // Payment states
  const [paying, setPaying] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Food Ordering states
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [foodPaymentMethod, setFoodPaymentMethod] = useState<'cash_on_delivery' | 'online'>('cash_on_delivery');
  const [cookingNotes, setCookingNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');

  // In-Stay Guest Complaints & Room Assistance
  const [selectedIssueCategory, setSelectedIssueCategory] = useState('dirty_bedsheet');
  const [issueDescription, setIssueDescription] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  const fetchPortalData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/public/guest-portal/${token}`);
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 410 || json.expired) {
          setIsExpired(true);
        }
        setError(json.message || json.error || 'Failed to load guest folio.');
        setData(json);
      } else {
        setData(json);
        if (json.reservation?.selfCheckinCompleted) {
          setCheckinSuccess(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to HotelFlexi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('hotelflexi_guest_token', token);
        } catch {}
      }
      fetchPortalData();
    }
  }, [token]);

  // Load Razorpay script dynamically
  useEffect(() => {
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Helper for image upload to base64 preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelfCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryIdUrl) {
      alert('Please upload a photo of your Government ID proof.');
      return;
    }

    setSubmittingCheckin(true);
    try {
      const res = await fetch(`${API_BASE}/public/guest-portal/${token}/self-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idType,
          idNumber,
          guestIdProofUrl: primaryIdUrl,
          childrenIdProofUrl: childIdUrl || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Self check-in failed.');
      }

      setCheckinSuccess(true);
      await fetchPortalData();
    } catch (err: any) {
      alert(err.message || 'Error completing self check-in');
    } finally {
      setSubmittingCheckin(false);
    }
  };

  const handlePayBalance = async () => {
    if (!data?.reservation?.balanceAmountPaise || data.reservation.balanceAmountPaise <= 0) return;
    setPaying(true);

    try {
      const res = await fetch(`${API_BASE}/public/guest-portal/${token}/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const orderData = await res.json();

      if (!res.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      if (!window.Razorpay) {
        alert('Payment gateway is loading. Please try again in a few seconds.');
        setPaying(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: data.property?.name || 'HotelFlexi Stay',
        description: `Settlement for Ref #${data.reservation.reservationNumber}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/public/guest-portal/${token}/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                amountPaise: orderData.amount,
              }),
            });
            const vData = await verifyRes.json();
            if (verifyRes.ok) {
              setPaymentSuccessMsg('Payment received successfully! Your folio has been updated.');
              await fetchPortalData();
            } else {
              alert(vData.error || 'Payment verification failed');
            }
          } catch (e) {
            console.error(e);
          }
        },
        prefill: {
          name: data.guest?.fullName,
          email: data.guest?.email,
          contact: data.guest?.phone,
        },
        theme: {
          color: '#1e40af',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Payment initiation failed.');
    } finally {
      setPaying(false);
    }
  };

  // Cart Management
  const updateCart = (id: string, delta: number) => {
    const cur = cart[id] || 0;
    const next = Math.max(0, cur + delta);
    if (next === 0) {
      const copy = { ...cart };
      delete copy[id];
      setCart(copy);
    } else {
      setCart({ ...cart, [id]: next });
    }
  };

  const cartTotalPaise = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = ROOM_SERVICE_MENU.find((m) => m.id === id);
    return sum + (item ? item.pricePaise * qty : 0);
  }, 0);

  const handlePlaceFoodOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(cart).length === 0) {
      alert('Please select at least one dish or beverage.');
      return;
    }

    setSubmittingOrder(true);
    setOrderSuccessMsg('');

    try {
      const items = Object.entries(cart).map(([id, qty]) => {
        const item = ROOM_SERVICE_MENU.find((m) => m.id === id);
        return {
          id,
          name: item?.name || 'Dish',
          quantity: qty,
          pricePaise: item?.pricePaise || 0,
        };
      });

      const res = await fetch(`${API_BASE}/public/guest-portal/${token}/food-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          paymentMethod: foodPaymentMethod,
          notes: cookingNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to place dining order.');
      }

      setOrderSuccessMsg(
        `Order confirmed! ${json.orderSummary} will be served to Room ${data?.room?.roomNumber}. ${
          foodPaymentMethod === 'cash_on_delivery'
            ? 'Added to your Room Folio bill (Pay at Hotel / Checkout)'
            : 'Paid Online'
        }`
      );
      setCart({});
      setCookingNotes('');
      // Automatically refresh Stay Folio & billing totals immediately
      await fetchPortalData();
    } catch (err: any) {
      alert(err.message || 'Could not place food order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingComplaint(true);

    try {
      const issueTitles: { [k: string]: string } = {
        dirty_bedsheet: 'Dirty / Fresh Bedsheet Required Immediately',
        washroom_leak: 'Washroom / Plumbing Water Leakage',
        ac_electrical: 'AC / Power / Geyser Electrical Issue',
        urgent_clean: 'Urgent Room Cleaning & Sanitation',
        noise_disturbance: 'Excessive Noise Disturbance in Floor',
        other_emergency: 'Immediate Staff Assistance Required',
      };

      const finalDesc = issueDescription.trim()
        ? `${issueTitles[selectedIssueCategory] || 'Urgent Room Request'} — ${issueDescription.trim()}`
        : issueTitles[selectedIssueCategory] || 'Urgent guest assistance required in room';

      const res = await fetch(`${API_BASE}/public/guest-portal/${token}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedIssueCategory,
          description: finalDesc,
          isUrgent: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to dispatch staff alert.');
      }

      setComplaintSubmitted(true);
      setIssueDescription('');
    } catch (err: any) {
      alert(err.message || 'Could not submit complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handlePolishReview = async () => {
    if (!reviewNotes.trim() && overallRating === 0) {
      alert('Please rate your stay or write a short note first.');
      return;
    }
    setPolishingReview(true);
    try {
      const res = await fetch(`${API_BASE}/reviews/public/polish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestNotes: reviewNotes,
          ratings: {
            overall: overallRating,
            cleanliness: cleanlinessRating,
            staff: staffRating,
            food: foodRating,
            comfort: comfortRating,
          },
          hotelName: property?.name || 'the hotel',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to polish review');
      setAiPolishedDraft(json.polishedDraft);
    } catch (err: any) {
      alert(err.message || 'Could not polish review');
    } finally {
      setPolishingReview(false);
    }
  };

  const handleCopyDraft = async () => {
    const textToCopy = aiPolishedDraft || reviewNotes;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedReview(true);
      setTimeout(() => setCopiedReview(false), 2500);
    } catch (e) {
      alert('Review text copied!');
    }
  };

  const handleOpenGoogleReview = async () => {
    if (property?.id) {
      fetch(`${API_BASE}/reviews/public/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          reservationId: reservation.id,
          guestName: guest.fullName,
          overallRating: overallRating || 5,
          cleanlinessRating: cleanlinessRating || null,
          staffRating: staffRating || null,
          foodRating: foodRating || null,
          comfortRating: comfortRating || null,
          feedbackText: reviewNotes,
          aiPolishedDraft,
          isPrivateFeedback: false,
          googleReviewClicked: true,
        }),
      }).catch(() => {});
    }

    const googleUrl = (property as any)?.googleReviewUrl ||
      `https://www.google.com/search?q=${encodeURIComponent(`${property?.name || 'hotel'} ${property?.address || ''} review`)}`;
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitPrivateFeedback = async () => {
    if (overallRating === 0 && !reviewNotes.trim()) {
      alert('Please provide a rating or brief feedback for the management.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE}/reviews/public/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property?.id,
          reservationId: reservation.id,
          guestName: guest.fullName,
          overallRating: overallRating || 5,
          cleanlinessRating: cleanlinessRating || null,
          staffRating: staffRating || null,
          foodRating: foodRating || null,
          comfortRating: comfortRating || null,
          feedbackText: reviewNotes,
          aiPolishedDraft,
          isPrivateFeedback: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit feedback');
      setReviewSuccessMsg(json.message || 'Thank you! Your feedback has been sent directly to hotel management.');
    } catch (err: any) {
      alert(err.message || 'Could not submit feedback');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-blue flex items-center justify-center text-white mb-4 animate-bounce">
          <Hotel className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Accessing FlexiLink Guest Folio...</p>
      </div>
    );
  }

  // Expired State (7 days after checkout)
  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">FlexiLink Expired</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || 'This digital guest portal link has expired (strictly valid up to 7 days after scheduled checkout).'}
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 text-left space-y-1">
            <div className="font-semibold text-slate-900 mb-1">Need your stay invoice or records?</div>
            <div>Please contact the hotel reception directly:</div>
            {data?.propertyPhone && <div>Phone: <strong>{data.propertyPhone}</strong></div>}
            {data?.propertyEmail && <div>Email: <strong>{data.propertyEmail}</strong></div>}
          </div>
          <p className="text-[10px] text-slate-400">Powered by HotelFlexi Security &bull; Privacy Shield</p>
        </div>
      </div>
    );
  }

  if (error && !data?.reservation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Link Not Found</h2>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const { reservation, property, room, guest } = data;
  const formatINR = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  // Security Passcode generated for mobile app
  const appGuestCode = `GUEST-${reservation.reservationNumber}`;
  const appGuestPin = reservation.reservationNumber?.slice(-4) || '1512';

  // Compute whether today is arrival day or later (for self check-in gating)
  const isArrivalDay: boolean = reservation.canSelfCheckin ?? (() => {
    if (!reservation.checkInDate) return true;
    const today = new Date().toISOString().split('T')[0];
    return today >= reservation.checkInDate;
  })();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Brand Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {property?.logoUrl ? (
              <img src={property.logoUrl} alt={property.name} className="w-8 h-8 rounded-lg object-contain border border-slate-100" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center font-bold text-sm">
                {property?.name?.charAt(0) || 'H'}
              </div>
            )}
            <div>
              <h1 className="font-bold text-sm text-slate-900 leading-tight">{property?.name}</h1>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-brand-blue" />
                {property?.address || 'India'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {reservation.reservationNumber}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {paymentSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {paymentSuccessMsg}
          </div>
        )}

        {/* Google Play Store HotelFlexi Guest App Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    HotelFlexi Guest Mobile App
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    Google Play
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Download our official Android app for one-tap door pass, in-stay dining orders, express checkout, and emergency room requests.
                </p>
              </div>
            </div>

            <a
              href="https://play.google.com/store/apps/details?id=in.novaxai.hotelflexi"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-white text-slate-900 font-extrabold text-xs hover:bg-slate-100 transition shadow flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              Get on Google Play
            </a>
          </div>

          {/* Guest Direct Access & Passcode */}
          <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-emerald-300 font-semibold text-[11px]">✨ Direct Guest Access:</span>
              <span className="text-white text-[11px]">All logins skipped via your personal link</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-300">App Passcode:</span>
              <span className="font-mono font-bold text-white bg-blue-500/30 px-2 py-0.5 rounded border border-blue-400/40">
                {appGuestCode}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-300">PIN:</span>
              <span className="font-mono font-bold text-white bg-blue-500/30 px-2 py-0.5 rounded border border-blue-400/40">
                {appGuestPin}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 italic">
              (Access expires 7 days after checkout)
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-slate-200/70 rounded-2xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hotel className="w-3.5 h-3.5 text-brand-blue" />
            Stay &amp; Folio
          </button>

          <button
            onClick={() => setActiveTab('checkin')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'checkin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-brand-blue" />
            Self Check-In
          </button>

          <button
            onClick={() => setActiveTab('dining')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'dining'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-brand-blue" />
            Room Dining
          </button>

          <button
            onClick={() => setActiveTab('assistance')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'assistance'
                ? 'bg-white text-brand-blue shadow-sm'
                : 'text-slate-600 hover:text-brand-blue'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-brand-blue" />
            Assistance
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'feedback'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-600 hover:text-amber-600'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500" />
            Feedback
          </button>
        </div>

        {/* TAB 1: OVERVIEW & FOLIO */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stay Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Welcome Guest</span>
                  <h2 className="text-base font-extrabold text-slate-900">{guest.fullName}</h2>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                  reservation.status === 'checked_in'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {reservation.status === 'checked_in' ? 'Checked In' : 'Confirmed Booking'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Check-In</span>
                  <span className="font-bold text-slate-900">{reservation.checkInDate}</span>
                  <span className="text-[10px] text-slate-500 block">From {property.checkInTime}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Check-Out</span>
                  <span className="font-bold text-slate-900">{reservation.checkOutDate}</span>
                  <span className="text-[10px] text-slate-500 block">Until {property.checkOutTime}</span>
                </div>
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <span className="text-[10px] text-brand-blue uppercase font-bold block">Allocated Room Code</span>
                  <span className="font-extrabold text-brand-blue text-sm truncate block font-mono">
                    {room.roomNumber && room.roomNumber !== 'To be assigned on arrival' ? `Room ${room.roomNumber}` : 'Allocated On Arrival'}
                  </span>
                  <span className="text-[10px] text-slate-600 block truncate">
                    {room.roomTypeName && room.roomTypeName !== 'undefined' ? room.roomTypeName : 'Deluxe Room'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Guests</span>
                  <span className="font-bold text-slate-900">
                    {reservation.adults} Adult{reservation.adults > 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {reservation.children > 0 ? `${reservation.children} Child(ren)` : 'No Children'}
                  </span>
                </div>
              </div>
            </div>

            {/* Digital Billing & Settlement Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-blue" />
                  <h3 className="font-bold text-sm text-slate-900">Stay Folio & Settlement</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  reservation.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {reservation.paymentStatus === 'paid' ? 'Paid in Full' : 'Balance Pending'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {Array.isArray(data?.foodOrders) && data.foodOrders.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 mb-2">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">In-Stay Room Service &amp; Food Orders</span>
                    {data.foodOrders.map((ord: any) => (
                      <div key={ord.id} className="flex justify-between text-[11px] text-slate-700">
                        <span className="truncate pr-2">{ord.description}</span>
                        <span className="shrink-0 font-semibold capitalize text-brand-blue">({ord.status})</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Total Stay &amp; Dining Folio (incl. GST):</span>
                  <span className="font-bold text-slate-900">{formatINR(reservation.totalAmountPaise)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Advance / Payments Received:</span>
                  <span className="font-semibold text-emerald-700">{formatINR(reservation.paidAmountPaise)}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-extrabold">
                  <span>Outstanding Balance Due:</span>
                  <span className={reservation.balanceAmountPaise > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                    {formatINR(reservation.balanceAmountPaise)}
                  </span>
                </div>
              </div>

              {reservation.balanceAmountPaise > 0 && (
                <div className="pt-2 space-y-2">
                  <button
                    onClick={handlePayBalance}
                    disabled={paying}
                    className="w-full py-3 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <CreditCard className="w-4 h-4" />
                    {paying ? 'Connecting Gateway...' : `Pay ${formatINR(reservation.balanceAmountPaise)} via UPI / Cards`}
                  </button>
                  <div className="text-center">
                    <span className="text-[11px] text-slate-500">
                      Or pay directly in <strong>Cash to hotel staff</strong> upon arrival / checkout.
                    </span>
                  </div>
                  {property.upiId && (
                    <p className="text-[10px] text-center text-slate-500 pt-1">
                      Direct Hotel UPI ID: <strong className="text-slate-700">{property.upiId}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EXPRESS SELF CHECK-IN */}
        {activeTab === 'checkin' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-brand-blue" />
                <div>
                    <h3 className="font-bold text-sm text-slate-900">Express Self Check-In</h3>
                    <p className="text-[10px] text-slate-500">Skip the front desk queue with instant digital ID verification</p>
                  </div>
                </div>
                {checkinSuccess && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>

              {!isArrivalDay ? (
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <h4 className="font-extrabold text-sm text-amber-900">
                    Self Check-In Opens on Arrival Date ({reservation.checkInDate})
                  </h4>
                  <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                    Digital self check-in and room key allocation become active on the date of your arrival once you arrive at the property.
                  </p>
                  {reservation.balanceAmountPaise > 0 && (
                    <div className="pt-2 max-w-sm mx-auto space-y-2">
                      <p className="text-[11px] text-slate-600">You can comfortably settle your pending balance ahead of arrival:</p>
                      <button
                        onClick={handlePayBalance}
                        disabled={paying}
                        className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay Balance ({formatINR(reservation.balanceAmountPaise)}) via UPI / Cards
                      </button>
                    </div>
                  )}
                </div>
              ) : checkinSuccess ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-900">Digital Pass Activated!</h4>
                  <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                    Your identity verification is complete. On arrival at {property.name}, simply show your mobile pass at the desk to collect your key.
                  </p>
                  {reservation.selfCheckinAt && (
                    <span className="text-[10px] text-emerald-600 block">
                      Verified on {new Date(reservation.selfCheckinAt * 1000).toLocaleString()}
                    </span>
                  )}
                  {reservation.balanceAmountPaise > 0 && (
                    <div className="pt-2 max-w-sm mx-auto">
                      <button
                        onClick={handlePayBalance}
                        disabled={paying}
                        className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Settle Balance of {formatINR(reservation.balanceAmountPaise)}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSelfCheckin} className="space-y-4 text-xs">
                  {/* Balance Notice before Checkin */}
                  {reservation.balanceAmountPaise > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-2">
                      <div className="text-[11px] text-blue-900">
                        Pending Stay Balance: <strong>{formatINR(reservation.balanceAmountPaise)}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={handlePayBalance}
                        disabled={paying}
                        className="px-3 py-1 rounded-lg bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover shrink-0"
                      >
                        Pay Balance
                      </button>
                    </div>
                  )}

                  {/* Primary Guest ID proof (Required) */}
                <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-blue" />
                      Primary Guest ID Proof (Required)
                    </label>
                    <span className="text-[10px] text-slate-500">1 Guest ID Required</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-0.5 block">Document Type</label>
                      <select
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue text-xs"
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Voter ID">Voter ID</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 mb-0.5 block">ID / Document Number</label>
                      <input
                        type="text"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="e.g. 1234 5678 9012"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue text-xs"
                      >
                      </input>
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="text-[10px] text-slate-500 mb-1 block">Upload Photo or Scan of ID</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs">
                        <Upload className="w-3.5 h-3.5 text-brand-blue" />
                        Select ID Image
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, setPrimaryIdUrl)}
                          className="hidden"
                        />
                      </label>
                      {primaryIdUrl && (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ID Uploaded
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Child Birth / ID Proof Upload (ONLY SHOWN IF RESERVATION HAS CHILDREN) */}
                {reservation.children > 0 && (
                  <div className="space-y-2 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Baby className="w-3.5 h-3.5 text-amber-700" />
                        Child Verification / Birth Proof ({reservation.children} Child{reservation.children > 1 ? 'ren' : ''} in Booking)
                      </label>
                      <span className="text-[10px] text-amber-700 font-semibold">Child Proof</span>
                    </div>
                    <p className="text-[11px] text-amber-800/90 leading-tight">
                      Government regulations require birth certificates or school IDs for accompanying minors.
                    </p>
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/50 font-semibold text-xs">
                        <Upload className="w-3.5 h-3.5 text-amber-700" />
                        Upload Child Proof
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, setChildIdUrl)}
                          className="hidden"
                        />
                      </label>
                      {childIdUrl && (
                        <span className="ml-3 text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Child Proof Uploaded
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingCheckin}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                >
                  {submittingCheckin ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying Identity...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Complete Express Self Check-In
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: IN-STAY DINING & ROOM SERVICE */}
        {activeTab === 'dining' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-brand-blue" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Room Dining & Food Service</h3>
                  <p className="text-[10px] text-slate-500">Delivered directly to {room.roomNumber ? `Room ${room.roomNumber}` : 'your room'}</p>
                </div>
              </div>
            </div>

            {orderSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {orderSuccessMsg}
              </div>
            )}

            <div className="space-y-3">
              {ROOM_SERVICE_MENU.map((item) => {
                const qty = cart[item.id] || 0;
                return (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide block">{item.category}</span>
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <span className="text-brand-blue font-bold text-xs">{formatINR(item.pricePaise)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
                          <button
                            type="button"
                            onClick={() => updateCart(item.id, -1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-xs px-1 text-slate-900">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateCart(item.id, 1)}
                            className="w-6 h-6 rounded bg-brand-blue text-white hover:bg-brand-blue-hover flex items-center justify-center font-bold text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateCart(item.id, 1)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-brand-blue font-bold text-xs text-brand-blue transition shadow-sm"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart & Checkout */}
            {Object.keys(cart).length > 0 && (
              <form onSubmit={handlePlaceFoodOrder} className="pt-4 border-t border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center font-extrabold text-sm text-slate-900">
                  <span>Order Total:</span>
                  <span className="text-brand-blue text-base">{formatINR(cartTotalPaise)}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Special Cooking / Delivery Notes
                  </label>
                  <input
                    type="text"
                    value={cookingNotes}
                    onChange={(e) => setCookingNotes(e.target.value)}
                    placeholder="Less spicy, extra napkins, deliver at 8:30 PM..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-2 ${
                      foodPaymentMethod === 'cash_on_delivery'
                        ? 'bg-blue-50 border-brand-blue text-brand-blue'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="foodPay"
                        checked={foodPaymentMethod === 'cash_on_delivery'}
                        onChange={() => setFoodPaymentMethod('cash_on_delivery')}
                        className="text-brand-blue"
                      />
                      Pay Cash to Staff
                    </label>

                    <label className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-2 ${
                      foodPaymentMethod === 'online'
                        ? 'bg-blue-50 border-brand-blue text-brand-blue'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="foodPay"
                        checked={foodPaymentMethod === 'online'}
                        onChange={() => setFoodPaymentMethod('online')}
                        className="text-brand-blue"
                      />
                      Add to Stay Folio
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-3 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  {submittingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Dispatching to Kitchen...
                    </>
                  ) : (
                    `Place Dining Order (${formatINR(cartTotalPaise)})`
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 4: ROOM ASSISTANCE & COMPLAINTS */}
        {activeTab === 'assistance' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Raise a Complaint / Room Assistance</h3>
                <p className="text-[10px] text-slate-500">Report an issue directly to hotel management &amp; floor staff</p>
              </div>
            </div>

            {complaintSubmitted && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Complaint Dispatched &amp; Assigned to On-Duty Staff!</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Your request has been logged with highest priority for <strong>Room {room.roomNumber}</strong>. On-duty floor staff has been notified and is attending to your room immediately.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} className="space-y-4 text-xs">
              <label className="block font-semibold text-slate-800">
                Select Issue Category:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'dirty_bedsheet', label: '🛏️ Dirty / Stained Bedsheets', sub: 'Instant clean linen replacement' },
                  { id: 'washroom_leak', label: '🚿 Washroom / Tap Leakage', sub: 'Plumbing or hot water issue' },
                  { id: 'ac_electrical', label: '⚡ AC / Power / Electrical', sub: 'Cooling, lighting or electricity' },
                  { id: 'urgent_clean', label: '🧹 Room Cleaning & Dusting', sub: 'Spill or housekeeping required' },
                  { id: 'noise_disturbance', label: '🔊 Noise Disturbance', sub: 'Corridor or neighboring room noise' },
                  { id: 'other_emergency', label: '❓ Other Guest Assistance', sub: 'Immediate staff presence required' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIssueCategory(item.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedIssueCategory === item.id
                        ? 'bg-blue-50 border-brand-blue shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900">{item.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{item.sub}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="e.g. Please send fresh towels and extra pillows..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <button
                type="submit"
                disabled={submittingComplaint}
                className="w-full py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                {submittingComplaint ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Dispatching Request...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Submit Complaint &amp; Request Staff
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: GUEST REVIEWS & FEEDBACK */}
        {activeTab === 'feedback' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">Your Stay Experience &amp; Review</h3>
                <p className="text-[11px] text-slate-500">
                  Direct, authentic reviews help us improve. Google Review is always accessible to all guests.
                </p>
              </div>
            </div>

            {reviewSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Feedback Received!</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  {reviewSuccessMsg}
                </p>
              </div>
            )}

            {/* Star Ratings Grid (Zero preselected stars) */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-bold text-slate-800">
                    Overall Experience <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-amber-600">
                    {overallRating === 5 && '🌟 Excellent'}
                    {overallRating === 4 && '👍 Very Good'}
                    {overallRating === 3 && '👌 Good / Average'}
                    {overallRating === 2 && '👎 Needs Improvement'}
                    {overallRating === 1 && '⚠️ Poor'}
                    {overallRating === 0 && 'Tap to rate'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallRating(star)}
                      className="p-1 text-2xl transition hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= overallRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Cleanliness & Linen Hygiene', val: cleanlinessRating, set: setCleanlinessRating },
                  { label: 'Staff Hospitality & Promptness', val: staffRating, set: setStaffRating },
                  { label: 'Food Quality & Taste', val: foodRating, set: setFoodRating },
                  { label: 'Room Comfort & AC', val: comfortRating, set: setComfortRating },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => item.set(star)}
                          className="p-0.5 hover:scale-110 transition"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= item.val
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Written Remarks */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Your Comments &amp; Highlights (In your own words)
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="What did you like the most? Any suggestion for room service, breakfast, or check-in?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePolishReview}
                  disabled={polishingReview || (!reviewNotes.trim() && overallRating === 0)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  {polishingReview ? 'Polishing your draft...' : 'Polish My Words with AI'}
                </button>
              </div>
            </div>

            {/* AI Polished Draft Container */}
            {aiPolishedDraft && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>AI Polished Review (Ready to copy)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyDraft}
                    className="px-2.5 py-1 rounded-md bg-white border border-indigo-200 text-indigo-700 text-[11px] font-bold flex items-center gap-1 hover:bg-indigo-50 transition"
                  >
                    {copiedReview ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Text
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={aiPolishedDraft}
                  onChange={(e) => setAiPolishedDraft(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-lg border border-indigo-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <p className="text-[10px] text-indigo-700">
                  💡 You can edit any sentence above before copying or submitting.
                </p>
              </div>
            )}

            {/* Direct External Review & Private Feedback Actions */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <button
                type="button"
                onClick={handleOpenGoogleReview}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow transition"
              >
                <ExternalLink className="w-4 h-4" />
                Post Review on Google (Always Open to All Guests)
              </button>

              <button
                type="button"
                onClick={handleSubmitPrivateFeedback}
                disabled={submittingReview}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Send as Confidential Feedback to Hotel General Manager'
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400">
                🔒 Google Review Policy Compliant: No review gating, no incentives, no forced ratings.
              </p>
            </div>
          </div>
        )}

        {/* Hotel Support & Contact */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="font-bold text-slate-900">Front Desk Assistance</span>
            <p className="text-[11px] text-slate-500">Contact property reception for luggage storage, early check-in or queries.</p>
          </div>
          <div className="flex gap-2">
            {property.phone && (
              <a
                href={`tel:${property.phone}`}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold flex items-center gap-1 text-[11px]"
              >
                <Phone className="w-3 h-3 text-brand-blue" />
                Call Desk
              </a>
            )}
            {property.email && (
              <a
                href={`mailto:${property.email}`}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold flex items-center gap-1 text-[11px]"
              >
                <Mail className="w-3 h-3 text-brand-blue" />
                Email Desk
              </a>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center text-[10px] text-slate-400 pt-6">
        Powered by HotelFlexi &bull; Your Hotel. One Intelligent System.
      </footer>
    </div>
  );
}
