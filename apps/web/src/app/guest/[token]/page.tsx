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
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://hotelflexi.divyansh-shukla.workers.dev/api/v1';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function GuestPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

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
    fetchPortalData();
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
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-500 block">Room Category</span>
              <span className="font-bold text-slate-900 truncate block">{room.roomTypeName}</span>
              <span className="text-[10px] text-brand-blue font-semibold block">Room: {room.roomNumber}</span>
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
            <div className="flex justify-between text-slate-600">
              <span>Total Tariff (incl. GST):</span>
              <span className="font-semibold text-slate-900">{formatINR(reservation.totalAmountPaise)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Advance Paid:</span>
              <span className="font-semibold text-emerald-700">{formatINR(reservation.paidAmountPaise)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-extrabold">
              <span>Outstanding Due:</span>
              <span className={reservation.balanceAmountPaise > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                {formatINR(reservation.balanceAmountPaise)}
              </span>
            </div>
          </div>

          {reservation.balanceAmountPaise > 0 && (
            <div className="pt-2">
              <button
                onClick={handlePayBalance}
                disabled={paying}
                className="w-full py-3 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <CreditCard className="w-4 h-4" />
                {paying ? 'Connecting Gateway...' : `Pay ${formatINR(reservation.balanceAmountPaise)} via UPI / Cards`}
              </button>
              {property.upiId && (
                <p className="text-[10px] text-center text-slate-500 mt-2">
                  Direct Hotel UPI ID: <strong className="text-slate-700">{property.upiId}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Express Self Check-In Card */}
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

          {checkinSuccess ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-sm text-emerald-900">Digital Pass Activated!</h4>
              <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                Your identity verification is complete. On arrival at {property.name}, simply show this pass at the front desk to collect your key.
              </p>
              {reservation.selfCheckinAt && (
                <span className="text-[10px] text-emerald-600 block">
                  Verified on {new Date(reservation.selfCheckinAt * 1000).toLocaleString()}
                </span>
              )}
            </div>
          ) : (
            <form onSubmit={handleSelfCheckin} className="space-y-4 text-xs">
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
                    />
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
