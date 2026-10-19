'use client';

import React, { useEffect, useState } from 'react';
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

  // Branding, Amenities & Child Policy
  const [logoUrl, setLogoUrl] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [childCutoffAge, setChildCutoffAge] = useState(10);
  const [childRate, setChildRate] = useState(0);

  // Owner Razorpay Credentials
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);

  // Developer setup states
  const [devSetupLoading, setDevSetupLoading] = useState(false);
  const [devSetupRequest, setDevSetupRequest] = useState<any>(null);
  const [devSuccessMsg, setDevSuccessMsg] = useState('');

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
          setChildCutoffAge(activeProp.child_cutoff_age ?? 10);
          setChildRate(activeProp.child_rate_paise ? activeProp.child_rate_paise / 100 : 0);

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
          child_cutoff_age: childCutoffAge,
          child_rate_paise: Math.round(childRate * 100),
          razorpay_key_id: razorpayKeyId || null,
          razorpay_key_secret: razorpayKeySecret || undefined,
          razorpay_enabled: razorpayEnabled,
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
              <label className="block font-semibold mb-1 text-content-primary-light">Address (Search Autocomplete)</label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onSelectLocation={handleLocationSelect}
                placeholder="Search hotel location / landmark..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-content-primary-light">PIN Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="PIN"
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
                Property Branding & Photo Gallery
              </h3>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-content-primary-light">Hotel Logo Image URL</label>
              <div className="flex gap-3 items-center">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/hotel-logo.png"
                  className="flex-1 px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                {logoUrl && (
                  <div className="w-10 h-10 rounded-lg border border-border-light bg-surface-light p-1 shrink-0 overflow-hidden flex items-center justify-center">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border-light">
              <label className="block font-semibold text-content-primary-light">Property Gallery Photos (Shown on Booking Engine)</label>
              <div className="flex gap-2">
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
                  className="px-3.5 py-2 bg-brand-blue text-white rounded-lg font-bold hover:bg-brand-blue-hover transition shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Photo
                </button>
              </div>

              {galleryImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {galleryImages.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-border-light bg-surface-light">
                      <img src={url} alt="Gallery" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition shadow"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
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
              Select all amenities available at your property. These will be highlighted on your public booking engine and OTA channel feeds.
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
                  onChange={(e) => setChildCutoffAge(parseInt(e.target.value, 10) || 10)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <span className="text-[10px] text-content-secondary-light mt-1 block">
                  Children up to {childCutoffAge} years qualify for child rates; above {childCutoffAge} are counted as adults.
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
                  onChange={(e) => setChildRate(parseFloat(e.target.value) || 0)}
                  placeholder="0 for complimentary"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold text-brand-blue"
                />
                <span className="text-[10px] text-content-secondary-light mt-1 block">
                  Enter 0 if stay for children under {childCutoffAge} is complimentary.
                </span>
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
    </div>
  );
}
