'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  sendEmailVerification,
  updatePassword,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import AddressAutocomplete, { SelectedLocation } from '@/components/ui/AddressAutocomplete';
import {
  Settings,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  CreditCard,
  Code2,
  ShieldCheck,
  Headphones,
  Sparkles,
  Image as ImageIcon,
  Plus,
  Trash2,
  Wifi,
  Baby,
  Upload,
  FileText,
  Percent,
  Lock,
  MailCheck,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Star,
  ExternalLink,
  AlertTriangle,
  X,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const COMMON_AMENITIES = [
  'Free High-Speed Wi-Fi',
  'Swimming Pool',
  'Multi-Cuisine Restaurant',
  '24/7 Power Backup',
  'Free Parking',
  'Air Conditioning',
  '24/7 Front Desk',
  'CCTV Security',
  'Room Service',
  'Elevator / Lift',
  'Banquet & Conference Hall',
  'Spa & Wellness',
  'Fitness Center / Gym',
  'EV Charging Station',
  'Pet Friendly',
  'Doctor on Call',
];

export default function HotelSettingsPage() {
  const { currentTenant, setCurrentTenant, refreshUser, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gstNumber, setGstNumber] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('HF-');
  const [upiId, setUpiId] = useState('');

  // Booking Engine Rules & Advance Payment Policy
  const [advancePaymentPolicy, setAdvancePaymentPolicy] = useState<'full' | 'partial_percent' | 'partial_fixed' | 'pay_at_hotel'>('full');
  const [advancePaymentPercent, setAdvancePaymentPercent] = useState('100');
  const [advancePaymentFixed, setAdvancePaymentFixed] = useState('1000');
  const [bookingEngineTerms, setBookingEngineTerms] = useState('');

  // Branding, Amenities & Child Policy
  const [logoUrl, setLogoUrl] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [childCutoffAge, setChildCutoffAge] = useState('10');
  const [childRate, setChildRate] = useState('0');

  // Room Turnover on Checkout
  const [autoReleaseOnCheckout, setAutoReleaseOnCheckout] = useState(true);

  // Owner Razorpay Credentials
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');

  // Developer setup states
  const [devSetupLoading, setDevSetupLoading] = useState(false);
  const [devSetupRequest, setDevSetupRequest] = useState<any>(null);
  const [devSuccessMsg, setDevSuccessMsg] = useState('');

  // Account Security states
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailAddress, setNewEmailAddress] = useState('');
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Danger Zone - Account & Data Deletion
  const [deletionStatus, setDeletionStatus] = useState<any>(null);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionConfirmText, setDeletionConfirmText] = useState('');
  const [deletionSubmitting, setDeletionSubmitting] = useState(false);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setInterval(() => setEmailCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [emailCooldown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPasswordModal) setShowPasswordModal(false);
        if (showEmailModal) setShowEmailModal(false);
        if (showDeletionModal) setShowDeletionModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPasswordModal, showEmailModal, showDeletionModal]);

  const handleSendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    setSecurityLoading(true);
    setSecurityMessage(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setSecurityMessage({
        type: 'success',
        text: 'Verification link dispatched to your registered email! Please click the link to confirm.',
      });
      setEmailCooldown(60);
    } catch (err: any) {
      setSecurityMessage({
        type: 'error',
        text: err.message || 'Failed to send verification email.',
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !auth.currentUser.email) return;

    if (newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSecurityLoading(true);
    setSecurityMessage(null);

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      setSecurityMessage({
        type: 'success',
        text: 'Password updated successfully! Your account credentials have been changed.',
      });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setSecurityMessage({ type: 'error', text: 'Current password is incorrect.' });
      } else if (err.code === 'auth/weak-password') {
        setSecurityMessage({ type: 'error', text: 'New password is too weak.' });
      } else {
        setSecurityMessage({ type: 'error', text: err.message || 'Failed to update password.' });
      }
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleInitiateEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newEmailAddress.trim()) return;

    setSecurityLoading(true);
    setSecurityMessage(null);

    try {
      await verifyBeforeUpdateEmail(auth.currentUser, newEmailAddress.trim());
      setSecurityMessage({
        type: 'success',
        text: `Verification email sent to ${newEmailAddress.trim()}! Please click the link in that email to finalize the email change.`,
      });
      setShowEmailModal(false);
      setNewEmailAddress('');
    } catch (err: any) {
      console.error('Email change error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setSecurityMessage({ type: 'error', text: 'This email is already associated with another account.' });
      } else if (err.code === 'auth/requires-recent-login') {
        setSecurityMessage({ type: 'error', text: 'Security check: Please log out and sign in again before changing your primary email.' });
      } else {
        setSecurityMessage({ type: 'error', text: err.message || 'Failed to initiate email change.' });
      }
    } finally {
      setSecurityLoading(false);
    }
  };

  useEffect(() => {
    // Load Razorpay script dynamically
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    async function loadSettings() {
      if (!currentTenant) return;
      try {
        const propData = await apiClient('/properties');
        const activeProp = propData.properties?.[0];
        if (activeProp) {
          setProperty(activeProp);
          setName(activeProp.name || '');
          setDescription(activeProp.description || '');
          setPhone(activeProp.phone || '');
          setEmail(activeProp.email || '');
          setAddress(activeProp.address_line1 || '');
          setCity(activeProp.city || '');
          setState(activeProp.state || '');
          setPostalCode(activeProp.postal_code || '');
          setCountry(activeProp.country || 'India');
          setLatitude(activeProp.latitude ?? null);
          setLongitude(activeProp.longitude ?? null);
          setGstNumber(activeProp.gst_number || '');
          setInvoicePrefix(activeProp.invoice_prefix || 'HF-');
          setUpiId(activeProp.upi_id || '');
          setLogoUrl(activeProp.logo_url || '');
          setRazorpayKeyId(activeProp.razorpay_key_id || '');
          setRazorpayEnabled(Boolean(activeProp.razorpay_enabled));
          setGoogleReviewUrl(activeProp.google_review_url || '');
          setAdvancePaymentPolicy(activeProp.advance_payment_policy || 'full');
          setAdvancePaymentPercent(String(activeProp.advance_payment_percent ?? 100));
          setAdvancePaymentFixed(String(activeProp.advance_payment_fixed_paise ? activeProp.advance_payment_fixed_paise / 100 : 1000));
          setBookingEngineTerms(activeProp.booking_engine_terms || '');
          setChildCutoffAge(String(activeProp.child_cutoff_age ?? 10));
          setChildRate(activeProp.child_rate_paise ? String(activeProp.child_rate_paise / 100) : '0');
          setAutoReleaseOnCheckout(activeProp.auto_release_on_checkout !== 0);

          // Parse amenities
          let amList: string[] = [];
          if (Array.isArray(activeProp.amenities)) {
            amList = activeProp.amenities;
          } else if (typeof activeProp.amenities === 'string') {
            try {
              amList = JSON.parse(activeProp.amenities);
            } catch {
              amList = [];
            }
          }
          setAmenities(amList);

          // Parse gallery images
          let imgList: string[] = [];
          if (Array.isArray(activeProp.gallery_images)) {
            imgList = activeProp.gallery_images;
          } else if (typeof activeProp.gallery_images === 'string') {
            try {
              imgList = JSON.parse(activeProp.gallery_images);
            } catch {
              imgList = [];
            }
          }
          setGalleryImages(imgList);

          // Load developer setup status
          const devData = await apiClient(`/developer-setup/status?property_id=${activeProp.id}`);
          setDevSetupRequest(devData.request);

          // Load account deletion status
          try {
            const delData = await apiClient('/account/deletion-status');
            setDeletionStatus(delData);
          } catch {
            // non-blocking
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [currentTenant]);

  const handleLocationSelect = (loc: SelectedLocation) => {
    if (loc.city) setCity(loc.city);
    if (loc.state) setState(loc.state);
    if (loc.postalCode) setPostalCode(loc.postalCode);
    if (loc.country) setCountry(loc.country);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
  };

  const toggleAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter((a) => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities([...amenities, trimmed]);
      setCustomAmenity('');
    }
  };

  const handleAddGalleryImage = () => {
    const trimmed = newImageUrl.trim();
    if (trimmed && !galleryImages.includes(trimmed)) {
      setGalleryImages([...galleryImages, trimmed]);
      setNewImageUrl('');
    }
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== idx));
  };

  const handleMoveGalleryImage = (idx: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= galleryImages.length) return;
    const updated = [...galleryImages];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setGalleryImages(updated);
  };

  const handleSetPrimaryGalleryImage = (idx: number) => {
    if (idx <= 0 || idx >= galleryImages.length) return;
    const updated = [...galleryImages];
    const [selected] = updated.splice(idx, 1);
    updated.unshift(selected);
    setGalleryImages(updated);
  };

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deletionConfirmText !== 'DELETE') {
      alert('Please type "DELETE" exactly to confirm.');
      return;
    }
    setDeletionSubmitting(true);
    try {
      const res = await apiClient('/account/request-deletion', {
        method: 'POST',
        body: JSON.stringify({
          reason: deletionReason.trim() || 'Hotelier requested account closure and data deletion',
          confirmText: 'DELETE',
        }),
      });
      alert(res.message || 'Deletion request submitted to Super Admin.');
      setShowDeletionModal(false);
      setDeletionReason('');
      setDeletionConfirmText('');
      const statusRes = await apiClient('/account/deletion-status');
      setDeletionStatus(statusRes);
    } catch (err: any) {
      alert(err.message || 'Failed to submit deletion request.');
    } finally {
      setDeletionSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is larger than 5MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setGalleryImages((prev) => [...prev, dataUrl]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Logo file size should be less than 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLogoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setSaving(true);
    setSaved(false);

    try {
      await apiClient(`/properties/${property.id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description,
          phone,
          email,
          address_line1: address,
          city,
          state,
          postal_code: postalCode,
          country,
          latitude,
          longitude,
          gst_number: gstNumber,
          invoice_prefix: invoicePrefix,
          upi_id: upiId,
          logo_url: logoUrl || null,
          gallery_images: galleryImages,
          amenities: amenities,
          advance_payment_policy: advancePaymentPolicy,
          advance_payment_percent: parseInt(advancePaymentPercent, 10) || 100,
          advance_payment_fixed_paise: Math.round((parseFloat(advancePaymentFixed) || 0) * 100),
          booking_engine_terms: bookingEngineTerms || null,
          child_cutoff_age: parseInt(childCutoffAge, 10) || 10,
          child_rate_paise: Math.round((parseFloat(childRate) || 0) * 100),
          auto_release_on_checkout: autoReleaseOnCheckout ? 1 : 0,
          razorpay_key_id: razorpayKeyId || null,
          razorpay_key_secret: razorpayKeySecret || undefined,
          razorpay_enabled: razorpayEnabled,
          google_review_url: googleReviewUrl || null,
        }),
      });

      // Synchronize property name immediately in AuthContext so header updates without refresh
      if (currentTenant) {
        setCurrentTenant({
          ...currentTenant,
          tenant_name: name,
        });
      }
      await refreshUser();

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleHireDeveloper = async () => {
    if (!property) return;
    setDevSetupLoading(true);
    setDevSuccessMsg('');

    try {
      const order = await apiClient('/developer-setup/initiate', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: property.id,
          contactPhone: phone || user?.phoneNumber || '',
          contactEmail: email || user?.email || '',
          notes: 'Full property PMS, OTA channels, and UPI gateway setup assistance',
        }),
      });

      if (!window.Razorpay) {
        alert('Payment gateway is loading. Please try again in 5 seconds.');
        setDevSetupLoading(false);
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'HotelFlexi Implementation',
        description: 'Complete Property Setup Service (₹499)',
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await apiClient('/developer-setup/verify', {
              method: 'POST',
              body: JSON.stringify({
                requestId: order.requestId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
              }),
            });
            setDevSuccessMsg('Payment confirmed! A dedicated HotelFlexi setup engineer has been assigned.');
            setDevSetupRequest({ status: 'paid', payment_id: response.razorpay_payment_id });
          } catch (e: any) {
            alert(e.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: name || user?.displayName || 'Hotel Owner',
          email: email || user?.email,
          contact: phone,
        },
        theme: {
          color: '#1e40af',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Could not initiate developer setup order');
    } finally {
      setDevSetupLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-3 border-b border-border-light flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Property & Gateway Settings
          </h1>
          <p className="text-xs text-content-secondary-light">
            Configure contact details, address, billing preferences, and your Razorpay payment gateway
          </p>
        </div>

        {saved && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settings Saved!
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Property Identity & Contact */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border-light pb-2">
              <h3 className="font-bold text-sm text-content-primary-light">
                Property Identity &amp; Contact
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-content-secondary-light">Assigned 5-Digit Hotel Code:</span>
                <span
                  title="Your permanent 5-digit hotel code. Use when communicating with NovaX support and staff."
                  className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-amber-400 font-mono font-black text-xs shadow-sm"
                >
                  #{property?.hotel_code || '58291'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">Property Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">Official Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@hotel.com"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            {/* Address Autocomplete with Photon */}
            <div>
              <label className="block font-semibold mb-1 text-content-primary-light">Hotel Street Address / Location *</label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onSelectLocation={handleLocationSelect}
                placeholder="Search or enter Indian hotel address (e.g. Plot No. 42, Civil Lines, Near MG Road, Jaipur)..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Jaipur"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Rajasthan"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">PIN Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="302001"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-content-primary-light">
                Property Overview &amp; Description (Displayed on Direct Booking Engine &amp; Guest Vouchers)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nestled in the heart of the city, our luxury boutique resort features opulent heritage rooms, scenic valley views, lush lawns, multi-cuisine dining, and 24/7 guest hospitality..."
                className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue leading-relaxed"
              />
            </div>
          </div>

          {/* Billing & Tax Settings */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-content-primary-light border-b border-border-light pb-2">
              GST Invoicing & Direct UPI
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">GSTIN Number</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="07AAAAA0000A1Z5"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">Invoice Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="HF-"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">UPI ID for Guest QR</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="hotelname@upi"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono"
                />
              </div>
            </div>
          </div>

          {/* Hotel Branding & Photo Gallery */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-border-light pb-2">
              <ImageIcon className="w-4 h-4 text-brand-blue" />
              <h3 className="font-bold text-sm text-content-primary-light">
                Property Branding &amp; Photo Gallery
              </h3>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-content-primary-light">Hotel Logo</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Paste Logo URL or upload directly..."
                  className="flex-1 px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-mono"
                />
                <label className="cursor-pointer px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold border border-border-light transition shrink-0 flex items-center justify-center gap-1.5 text-xs">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Logo File
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {logoUrl && (
                  <div className="w-10 h-10 rounded-lg border border-border-light bg-surface-light p-1 shrink-0 overflow-hidden flex items-center justify-center">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border-light">
              <label className="block font-semibold text-content-primary-light">Property Gallery Photos (Shown on Direct Booking Engine &amp; Guest Folios)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... (Image URL)"
                  className="flex-1 px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryImage}
                  className="px-3.5 py-2 bg-brand-blue text-white rounded-lg font-bold hover:bg-brand-blue-hover transition shrink-0 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add URL
                </button>
                <label className="cursor-pointer px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition shrink-0 flex items-center justify-center gap-1.5 text-xs">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Photo File
                  <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {galleryImages.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{galleryImages.length} photo{galleryImages.length > 1 ? 's' : ''} uploaded &bull; First photo is used as primary cover</span>
                    <span className="text-[10px] text-slate-400">Use arrows to re-order photos</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {galleryImages.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-border-light bg-surface-light shadow-sm">
                        <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        
                        {/* Primary Badge */}
                        {idx === 0 ? (
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white font-bold text-[9px] flex items-center gap-1 shadow">
                            <Star className="w-2.5 h-2.5 fill-white" /> Cover Photo
                          </div>
                        ) : (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white font-bold text-[9px]">
                            #{idx + 1}
                          </span>
                        )}

                        {/* Top action buttons */}
                        <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryGalleryImage(idx)}
                              title="Set as Cover Photo"
                              className="p-1 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition shadow"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition shadow"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Bottom reorder bar */}
                        <div className="absolute bottom-1 inset-x-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition bg-black/60 backdrop-blur-sm rounded-lg px-1 py-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveGalleryImage(idx, 'left')}
                            className="p-1 text-white hover:text-blue-300 disabled:opacity-20 transition"
                            title="Move left"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[9px] text-slate-200 font-medium">Reorder</span>
                          <button
                            type="button"
                            disabled={idx === galleryImages.length - 1}
                            onClick={() => handleMoveGalleryImage(idx, 'right')}
                            className="p-1 text-white hover:text-blue-300 disabled:opacity-20 transition"
                            title="Move right"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Property Amenities & Highlights */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-border-light pb-2">
              <Wifi className="w-4 h-4 text-brand-blue" />
              <h3 className="font-bold text-sm text-content-primary-light">
                Property Amenities & Facilities
              </h3>
            </div>
            <p className="text-content-secondary-light">
              Select all amenities available at your property. These will be highlighted on your direct booking engine and guest invoices.
            </p>

            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map((am) => {
                const active = amenities.includes(am);
                return (
                  <button
                    key={am}
                    type="button"
                    onClick={() => toggleAmenity(am)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition border flex items-center gap-1.5 ${
                      active
                        ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                        : 'bg-surface-light text-content-primary-light border-border-light hover:border-brand-blue/50'
                    }`}
                  >
                    {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {am}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t border-border-light">
              <input
                type="text"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                placeholder="Add custom amenity (e.g. Lawn, Bonfire, Helipad)..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition shrink-0"
              >
                Add Custom
              </button>
            </div>
          </div>

          {/* Child Policy & Tariff Settings */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-border-light pb-2">
              <Baby className="w-4 h-4 text-brand-blue" />
              <h3 className="font-bold text-sm text-content-primary-light">
                Child Policy & Tariffs
              </h3>
            </div>
            <p className="text-content-secondary-light">
              Define the age cutoff below which children qualify for the child rate. Children older than this cutoff will automatically be billed as extra adults.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">
                  Child Cutoff Age (Years)
                </label>
                <input
                  type="number"
                  min={1}
                  max={17}
                  value={childCutoffAge}
                  onChange={(e) => setChildCutoffAge(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <span className="text-[10px] text-content-secondary-light mt-1 block">
                  Children up to {childCutoffAge || 10} years qualify for child rates; above {childCutoffAge || 10} are counted as adults.
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">
                  Child Extra Tariff per Night (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={childRate}
                  onChange={(e) => setChildRate(e.target.value)}
                  placeholder="0 for complimentary"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold text-brand-blue"
                />
                <span className="text-[10px] text-content-secondary-light mt-1 block">
                  Enter 0 if stay for children under {childCutoffAge} is complimentary.
                </span>
              </div>
            </div>
          </div>

          {/* Room Turnover & Instant Checkout Turnaround */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border-light pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-content-primary-light">
                  Room Turnover &amp; Same-Day Availability Policy
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Turnaround Rule
              </span>
            </div>

            <p className="text-content-secondary-light leading-relaxed">
              Decide whether rooms are immediately released as Clean &amp; Ready when a guest checks out, or held in a dirty/maintenance state until staff inspects.
            </p>

            <label className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
              autoReleaseOnCheckout
                ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                : 'border-border-light bg-surface-light hover:bg-slate-50'
            }`}>
              <input
                type="checkbox"
                checked={autoReleaseOnCheckout}
                onChange={(e) => setAutoReleaseOnCheckout(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
              />
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block text-xs">
                  Instant Room Turnaround on Checkout (Recommended)
                </span>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Immediately mark the room as <strong>Clean &amp; Available</strong> for today&apos;s date as soon as the guest checks out. Don&apos;t hold or block the room for housekeeping so incoming guests and direct bookers can instantly reserve and check in.
                </p>
                {!autoReleaseOnCheckout && (
                  <p className="text-[10px] text-amber-700 font-semibold pt-1">
                    ⚠️ Disabled: Rooms will be marked &quot;Dirty&quot; on checkout and held until housekeeping staff manually inspects and marks them clean.
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Booking Engine Rules & Advance Payment Policy */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-border-light pb-2">
              <CreditCard className="w-4 h-4 text-brand-blue" />
              <h3 className="font-bold text-sm text-content-primary-light">
                Booking Engine Rules &amp; Advance Payment Policy
              </h3>
            </div>
            <p className="text-content-secondary-light leading-relaxed">
              Decide how guests are charged when reserving rooms through your direct booking engine. Choose between full advance payment, a percentage or fixed advance deposit, or zero advance (pay at hotel).
            </p>

            <div className="space-y-3">
              <label className="block font-semibold text-content-primary-light">
                Advance Payment Requirement
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition ${advancePaymentPolicy === 'full' ? 'border-brand-blue bg-blue-50/50 shadow-sm' : 'border-border-light bg-surface-light hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="advance_policy"
                    value="full"
                    checked={advancePaymentPolicy === 'full'}
                    onChange={() => setAdvancePaymentPolicy('full')}
                    className="mt-0.5 text-brand-blue focus:ring-brand-blue"
                  />
                  <div>
                    <span className="font-bold text-content-primary-light block">100% Full Advance Payment</span>
                    <span className="text-[11px] text-content-secondary-light">Guest pays the entire room tariff + GST online upon reserving.</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition ${advancePaymentPolicy === 'partial_percent' ? 'border-brand-blue bg-blue-50/50 shadow-sm' : 'border-border-light bg-surface-light hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="advance_policy"
                    value="partial_percent"
                    checked={advancePaymentPolicy === 'partial_percent'}
                    onChange={() => setAdvancePaymentPolicy('partial_percent')}
                    className="mt-0.5 text-brand-blue focus:ring-brand-blue"
                  />
                  <div>
                    <span className="font-bold text-content-primary-light block">Partial Percentage Advance</span>
                    <span className="text-[11px] text-content-secondary-light">Guest pays a custom % advance deposit; balance is collected during check-in.</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition ${advancePaymentPolicy === 'partial_fixed' ? 'border-brand-blue bg-blue-50/50 shadow-sm' : 'border-border-light bg-surface-light hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="advance_policy"
                    value="partial_fixed"
                    checked={advancePaymentPolicy === 'partial_fixed'}
                    onChange={() => setAdvancePaymentPolicy('partial_fixed')}
                    className="mt-0.5 text-brand-blue focus:ring-brand-blue"
                  />
                  <div>
                    <span className="font-bold text-content-primary-light block">Fixed Token Amount Advance</span>
                    <span className="text-[11px] text-content-secondary-light">Guest pays a fixed token (e.g. ₹1,000) online; balance due at check-in.</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition ${advancePaymentPolicy === 'pay_at_hotel' ? 'border-brand-blue bg-blue-50/50 shadow-sm' : 'border-border-light bg-surface-light hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="advance_policy"
                    value="pay_at_hotel"
                    checked={advancePaymentPolicy === 'pay_at_hotel'}
                    onChange={() => setAdvancePaymentPolicy('pay_at_hotel')}
                    className="mt-0.5 text-brand-blue focus:ring-brand-blue"
                  />
                  <div>
                    <span className="font-bold text-content-primary-light block">Pay at Hotel (0% Advance)</span>
                    <span className="text-[11px] text-content-secondary-light">Instant reservation confirmed without online advance; full payment collected at check-in.</span>
                  </div>
                </label>
              </div>

              {advancePaymentPolicy === 'partial_percent' && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                  <label className="block font-bold text-slate-800">Advance Deposit Percentage (%)</label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="number"
                      min={5}
                      max={95}
                      value={advancePaymentPercent}
                      onChange={(e) => setAdvancePaymentPercent(e.target.value)}
                      className="w-28 px-3 py-1.5 rounded-lg border border-border-light bg-white font-bold text-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                    <span className="text-xs text-slate-600">% Advance required (Remaining {100 - (parseInt(advancePaymentPercent, 10) || 0)}% at check-in)</span>
                  </div>
                </div>
              )}

              {advancePaymentPolicy === 'partial_fixed' && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                  <label className="block font-bold text-slate-800">Fixed Token Advance Amount (₹)</label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <span className="font-bold text-slate-700">₹</span>
                    <input
                      type="number"
                      min={100}
                      value={advancePaymentFixed}
                      onChange={(e) => setAdvancePaymentFixed(e.target.value)}
                      className="w-32 px-3 py-1.5 rounded-lg border border-border-light bg-white font-bold text-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                    <span className="text-xs text-slate-600">per reservation</span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-border-light">
                <label className="block font-semibold mb-1 text-content-primary-light">
                  Booking Engine Terms, House Rules &amp; Cancellation Policy
                </label>
                <textarea
                  rows={2}
                  value={bookingEngineTerms}
                  onChange={(e) => setBookingEngineTerms(e.target.value)}
                  placeholder="Free cancellation up to 48 hours before check-in. Valid Government ID required at front desk. Standard check-in 14:00, check-out 11:00..."
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border-light pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-blue" />
                <h3 className="font-bold text-sm text-content-primary-light">
                  Your Razorpay Live Payment Gateway
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-content-primary-light">
                <input
                  type="checkbox"
                  checked={razorpayEnabled}
                  onChange={(e) => setRazorpayEnabled(e.target.checked)}
                  className="rounded text-brand-blue focus:ring-brand-blue w-4 h-4"
                />
                Enable Direct Guest Collections
              </label>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Direct Settlement Notice:</strong> When you enter your Razorpay Key ID &amp; Key Secret and enable Direct Guest Collections, all booking engine advance deposits and guest portal balance payments will transfer directly into your own bank account via Razorpay. If left disabled, guests can reserve using <strong>Pay at Hotel</strong>.
              </div>
            </div>

            <p className="text-content-secondary-light leading-relaxed">
              Accept credit cards, debit cards, net banking, and UPI directly into your hotel's bank account without intermediary delays.
              Obtain your live credentials from your{' '}
              <a href="https://dashboard.razorpay.com/" target="_blank" rel="noreferrer" className="text-brand-blue underline font-semibold">
                Razorpay Dashboard &rarr; Settings &rarr; API Keys
              </a>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">Razorpay Key ID</label>
                <input
                  type="text"
                  value={razorpayKeyId}
                  onChange={(e) => setRazorpayKeyId(e.target.value)}
                  placeholder="rzp_live_xxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">Razorpay Key Secret</label>
                <input
                  type="password"
                  value={razorpayKeySecret}
                  onChange={(e) => setRazorpayKeySecret(e.target.value)}
                  placeholder="Enter or leave unchanged"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono"
                />
              </div>
            </div>
          </div>

          {/* Google Business Profile Review Link */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border-light pb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="font-bold text-sm text-content-primary-light">
                  Google Business Profile Review Link
                </h3>
              </div>
              {googleReviewUrl && googleReviewUrl.trim().length > 5 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle className="w-3 h-3 text-amber-600" /> Not Configured
                </span>
              )}
            </div>

            <p className="text-content-secondary-light leading-relaxed">
              Route happy guests directly to your official Google Maps listing to leave 5-star reviews upon checkout. When a guest leaves high ratings on their digital checkout folios, HotelFlexi prompts them to post their review directly on Google Maps.
            </p>

            <div className="space-y-2">
              <label className="block font-semibold text-content-primary-light">
                Google Review URL (e.g. Google Maps Place Link or Short Review Link)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://g.page/r/your-hotel/review or https://maps.app.goo.gl/..."
                  className="flex-1 px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono text-xs"
                />
                {googleReviewUrl && googleReviewUrl.trim().length > 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const url = new URL(googleReviewUrl.trim());
                        window.open(url.href, '_blank', 'noopener,noreferrer');
                      } catch {
                        alert('Please enter a valid URL starting with https://');
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    Test Link <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-content-secondary-light">
                Tip: In your Google Business Profile manager, click <strong>Ask for reviews</strong> and copy your short URL to paste here.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow-sm flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Hotel Settings
              </>
            )}
          </button>
        </form>
      )}

      {/* Account & Email Security Card */}
      <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-5 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-content-primary-light">
                Account Security &amp; Email Verification
              </h3>
              <p className="text-[11px] text-content-secondary-light">
                Manage your credentials, verified email recovery, and multi-factor protection
              </p>
            </div>
          </div>
          {user?.emailVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Email Verified &amp; Protected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Action Required: Unverified Email
            </span>
          )}
        </div>

        {securityMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              securityMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {securityMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{securityMessage.text}</span>
          </div>
        )}

        {/* Security Items Grid */}
        <div className="space-y-3">
          {/* Email Verification Row */}
          <div className="p-4 rounded-xl border border-border-light bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-content-primary-light">Primary Account Email:</span>
                <span className="font-mono font-semibold text-slate-800">{user?.email || 'Not configured'}</span>
              </div>
              <p className="text-[11px] text-content-secondary-light">
                {user?.emailVerified
                  ? 'Your email is verified. Password reset tokens and security breach notices are sent here.'
                  : 'Unverified email! If you forget your password, account recovery will be disabled until verified.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!user?.emailVerified && (
                <>
                  <button
                    type="button"
                    onClick={handleSendVerificationEmail}
                    disabled={securityLoading || emailCooldown > 0}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition text-xs shadow-sm disabled:opacity-50 flex items-center gap-1"
                  >
                    <MailCheck className="w-3.5 h-3.5" />
                    {emailCooldown > 0 ? `Sent (${emailCooldown}s)` : 'Send Verification'}
                  </button>
                  <Link
                    href="/verify-email"
                    className="px-3 py-1.5 rounded-lg border border-border-light bg-white hover:bg-slate-100 text-content-primary-light font-semibold text-xs"
                  >
                    Verify Screen
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowEmailModal(true);
                  setNewEmailAddress(user?.email || '');
                }}
                className="px-3 py-1.5 rounded-lg border border-border-light bg-white hover:bg-slate-100 text-content-primary-light font-semibold text-xs"
              >
                Change Email
              </button>
            </div>
          </div>

          {/* Password Protection Row */}
          <div className="p-4 rounded-xl border border-border-light bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-content-primary-light">Account Password:</span>
                <span className="font-mono text-slate-400">••••••••••••••••</span>
              </div>
              <p className="text-[11px] text-content-secondary-light">
                Regularly changing your password protects against staff credential sharing and unauthorized logins.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(true);
                setSecurityMessage(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm shrink-0 self-start sm:self-auto"
            >
              Update Password
            </button>
          </div>

          {/* Multi-Factor Authentication (MFA / 2FA) Guidance Row */}
          <div className="p-4 rounded-xl border border-blue-200/60 bg-blue-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-blue" />
                <span className="font-bold text-brand-blue">Multi-Factor Authentication (MFA / 2FA)</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Enterprise Security
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Secondary authentication step via SMS or Authenticator app for privileged operations (payouts, employee deletion, and API key reveal).
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 self-start sm:self-auto">
              ✓ Active on Platform
            </span>
          </div>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div
            onClick={() => setShowPasswordModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="change-password-title"
              className="bg-white rounded-3xl border border-border-light shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border-light pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-brand-blue" />
                  <h4 id="change-password-title" className="font-bold text-sm text-content-primary-light">Change Account Password</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  aria-label="Close dialog"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Current Password *</label>
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700">New Password (Min 6 chars) *</label>
                  <div className="relative">
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute right-3 top-2.5 text-slate-400"
                    >
                      {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Confirm New Password *</label>
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-2 rounded-lg border border-border-light font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={securityLoading}
                    className="flex-1 py-2 rounded-lg bg-brand-blue text-white font-bold hover:bg-brand-blue-hover transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {securityLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Email Modal */}
        {showEmailModal && (
          <div
            onClick={() => setShowEmailModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="change-email-title"
              className="bg-white rounded-3xl border border-border-light shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border-light pb-3">
                <div className="flex items-center gap-2">
                  <MailCheck className="w-5 h-5 text-brand-blue" />
                  <h4 id="change-email-title" className="font-bold text-sm text-content-primary-light">Change Primary Email</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  aria-label="Close dialog"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                For security, a verification email will be dispatched to the new address. The email change only takes effect once you click the confirmation link.
              </p>

              <form onSubmit={handleInitiateEmailChange} className="space-y-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">New Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEmailAddress}
                    onChange={(e) => setNewEmailAddress(e.target.value)}
                    placeholder="newowner@hotel.com"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 py-2 rounded-lg border border-border-light font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={securityLoading}
                    className="flex-1 py-2 rounded-lg bg-brand-blue text-white font-bold hover:bg-brand-blue-hover transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {securityLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Hire a Developer Setup Service Card (₹499) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                Hire a HotelFlexi Developer for Full Setup
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  ₹499 One-Time
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                End-to-end professional onboarding, room categories, OTA channel mapping, and payment gateway configuration.
              </p>
            </div>
          </div>

          <div>
            {devSetupRequest?.status === 'paid' ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Engineer Assigned
              </span>
            ) : (
              <button
                onClick={handleHireDeveloper}
                disabled={devSetupLoading}
                className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs hover:bg-slate-100 transition shadow-md flex items-center gap-2"
              >
                {devSetupLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Opening Checkout...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Get Full Setup (₹499)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {devSuccessMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {devSuccessMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>Complete Room Inventory & Rate Plans configured according to your property</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>Razorpay Live Payment Gateway & UPI QR integration verified</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>OTA Channel Sync (Booking.com, Agoda, MakeMyTrip) setup & test push</span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Account & Data Purge */}
      <div className="p-6 rounded-2xl bg-red-50/60 border border-red-200 shadow-sm space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-red-900">Danger Zone: Account &amp; Data Purge</h3>
              <p className="text-red-700 text-xs">
                Request permanent deletion of your property data, reservations, folios, guest profiles, and staff accounts.
              </p>
            </div>
          </div>

          <div>
            {deletionStatus?.hasPendingRequest ? (
              <div className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 font-bold border border-amber-300 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                Pending Super Admin Approval
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeletionModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Request Account Deletion
              </button>
            )}
          </div>
        </div>

        {deletionStatus?.hasPendingRequest ? (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Account &amp; Data Deletion Request is Under Review
            </div>
            <p className="text-amber-800">
              Requested on: <span className="font-mono">{deletionStatus.deletionRequestedAt ? new Date(deletionStatus.deletionRequestedAt).toLocaleString('en-IN') : 'Recently'}</span>
            </p>
            {deletionStatus.deletionReason && (
              <p className="text-amber-700 italic">
                &ldquo;{deletionStatus.deletionReason}&rdquo;
              </p>
            )}
            <p className="text-[11px] text-amber-600 pt-1">
              Your property records and services will remain available until the Super Admin verifies and executes the purge in Central Command.
            </p>
          </div>
        ) : (
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Once submitted, our Super Admin team will verify your ownership and securely purge all operational database records within 24–48 hours. If you wish to cancel or have questions, contact <a href="mailto:info@novaxai.in" className="text-brand-blue underline font-semibold">info@novaxai.in</a>.
          </p>
        )}
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeletionModal && (
        <div
          onClick={() => setShowDeletionModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="deletion-modal-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2 bg-red-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 id="deletion-modal-title" className="font-extrabold text-base text-slate-900">Request Data Purge &amp; Deletion</h3>
                  <p className="text-xs text-red-600 font-semibold">Irreversible action upon approval</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeletionModal(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 space-y-1.5 leading-relaxed">
              <p className="font-bold">By submitting this request, you agree to purge:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>All rooms, live inventory, and pricing configurations</li>
                <li>All reservations, guest profiles, folios, and GST invoices</li>
                <li>All connected OTA channel mappings and credentials</li>
                <li>All staff logins, roles, and hotel access</li>
              </ul>
            </div>

            <form onSubmit={handleRequestDeletion} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for account closure <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="e.g. Property sold, switching software, closing business..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Type <span className="font-mono text-red-600 font-extrabold">DELETE</span> to confirm *
                </label>
                <input
                  type="text"
                  required
                  value={deletionConfirmText}
                  onChange={(e) => setDeletionConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-xl border border-red-300 font-mono font-bold text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeletionModal(false);
                    setDeletionConfirmText('');
                    setDeletionReason('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletionSubmitting || deletionConfirmText !== 'DELETE'}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  {deletionSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
