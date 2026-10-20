'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import { ImageUploader } from '@/components/ImageUploader';
import {
  Sparkles,
  Heart,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle2,
  Lock,
  Loader2,
  DollarSign,
  Users,
  Building,
  Phone,
  Mail,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  MessageSquare,
  Clock,
  Shield,
  UtensilsCrossed,
} from 'lucide-react';

export default function WeddingManagementPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'packages' | 'decor' | 'leads'>('settings');

  // Property ID state
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  // Settings form state
  const [isEnabled, setIsEnabled] = useState(true);
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [lawnCapacity, setLawnCapacity] = useState(500);
  const [banquetCapacity, setBanquetCapacity] = useState(300);
  const [roomsAvailable, setRoomsAvailable] = useState(30);
  const [baseVegPlateRupees, setBaseVegPlateRupees] = useState(1200);
  const [baseNonvegPlateRupees, setBaseNonvegPlateRupees] = useState(1600);
  const [baseMulticuisinePlateRupees, setBaseMulticuisinePlateRupees] = useState(2000);
  const [baseFunctionVenueRupees, setBaseFunctionVenueRupees] = useState(50000);
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Modals state
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [pkgForm, setPkgForm] = useState({
    id: '',
    name: '',
    description: '',
    priceRange: '₹5,00,000 - ₹12,00,000',
    coverImageUrl: '',
    maxGuests: 500,
    inclusions: 'Grand Lawn Venue for 2 Days\nBridal Suite with 24/7 Butler\nCustomized Floral Mandap Setup\nRoyal Buffet Catering (2 Dinners, 1 Lunch)\nDJ, Sound License & Genset Backup',
  });

  const [decorModalOpen, setDecorModalOpen] = useState(false);
  const [decorForm, setDecorForm] = useState({
    id: '',
    name: '',
    description: '',
    priceRange: '₹1,50,000 - ₹3,50,000',
    basePriceRupees: 150000,
    photoUrl: '',
  });

  const loadWeddingData = useCallback(async (propId?: string) => {
    try {
      setLoading(true);
      setIsLocked(false);

      const pRes = await apiClient('/properties');
      const propList = pRes.properties || [];
      setProperties(propList);

      const activePropId = propId || selectedPropertyId || propList[0]?.id;
      if (!activePropId) {
        setLoading(false);
        return;
      }
      setSelectedPropertyId(activePropId);

      const wRes = await apiClient(`/wedding/settings?property_id=${activePropId}`);
      setData(wRes);

      const s = wRes.settings;
      if (s) {
        setIsEnabled(Boolean(s.is_enabled));
        setTitle(s.title || 'Royal Destination Wedding & Celebrations');
        setTagline(s.tagline || 'Experience unforgettable hospitality');
        setDescription(s.description || '');
        setCoverImageUrl(s.cover_image_url || '');
        setLawnCapacity(s.lawn_capacity || 500);
        setBanquetCapacity(s.banquet_capacity || 300);
        setRoomsAvailable(s.rooms_available_for_wedding || 30);
        setBaseVegPlateRupees((s.base_veg_plate_price_paise || 120000) / 100);
        setBaseNonvegPlateRupees((s.base_nonveg_plate_price_paise || 160000) / 100);
        setBaseMulticuisinePlateRupees((s.base_multicuisine_plate_price_paise || 200000) / 100);
        setBaseFunctionVenueRupees((s.base_function_venue_charge_paise || 5000000) / 100);
        setContactPhone(s.contact_phone || '');
        setContactEmail(s.contact_email || '');
      }
    } catch (err: any) {
      if (err.message?.includes('locked') || err.message?.includes('tier') || err.message?.includes('Starter')) {
        setIsLocked(true);
      } else {
        console.error('Failed to load wedding data', err);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    if (currentTenant) {
      loadWeddingData();
    }
  }, [currentTenant, loadWeddingData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient('/wedding/settings', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          isEnabled,
          title,
          tagline,
          description,
          coverImageUrl,
          lawnCapacity,
          banquetCapacity,
          roomsAvailable,
          baseVegPlatePaise: Math.round(baseVegPlateRupees * 100),
          baseNonvegPlatePaise: Math.round(baseNonvegPlateRupees * 100),
          baseMulticuisinePlatePaise: Math.round(baseMulticuisinePlateRupees * 100),
          baseFunctionVenueChargePaise: Math.round(baseFunctionVenueRupees * 100),
          contactPhone,
          contactEmail,
        }),
      });
      alert('Wedding & Destination settings saved successfully!');
      await loadWeddingData(selectedPropertyId);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const inclusionsArray = pkgForm.inclusions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await apiClient('/wedding/packages', {
        method: 'POST',
        body: JSON.stringify({
          id: pkgForm.id || undefined,
          propertyId: selectedPropertyId,
          name: pkgForm.name,
          description: pkgForm.description,
          priceRange: pkgForm.priceRange,
          coverImageUrl: pkgForm.coverImageUrl,
          maxGuests: Number(pkgForm.maxGuests),
          inclusions: inclusionsArray,
          isActive: 1,
        }),
      });

      setPackageModalOpen(false);
      setPkgForm({
        id: '',
        name: '',
        description: '',
        priceRange: '₹5,00,000 - ₹12,00,000',
        coverImageUrl: '',
        maxGuests: 500,
        inclusions: '',
      });
      await loadWeddingData(selectedPropertyId);
    } catch (err: any) {
      alert(err.message || 'Failed to save package');
    }
  };

  const handleDeletePackage = async (pkgId: string) => {
    if (!confirm('Are you sure you want to delete this wedding package?')) return;
    try {
      await apiClient(`/wedding/packages/${pkgId}`, { method: 'DELETE' });
      await loadWeddingData(selectedPropertyId);
    } catch (err: any) {
      alert(err.message || 'Failed to delete package');
    }
  };

  const handleSaveDecor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/wedding/decor-themes', {
        method: 'POST',
        body: JSON.stringify({
          id: decorForm.id || undefined,
          propertyId: selectedPropertyId,
          name: decorForm.name,
          description: decorForm.description,
          priceRange: decorForm.priceRange,
          basePricePaise: Math.round(decorForm.basePriceRupees * 100),
          photos: decorForm.photoUrl ? [decorForm.photoUrl] : [],
          isActive: 1,
        }),
      });

      setDecorModalOpen(false);
      setDecorForm({
        id: '',
        name: '',
        description: '',
        priceRange: '₹1,50,000 - ₹3,50,000',
        basePriceRupees: 150000,
        photoUrl: '',
      });
      await loadWeddingData(selectedPropertyId);
    } catch (err: any) {
      alert(err.message || 'Failed to save decoration theme');
    }
  };

  const handleDeleteDecor = async (decorId: string) => {
    if (!confirm('Are you sure you want to delete this decor theme?')) return;
    try {
      await apiClient(`/wedding/decor-themes/${decorId}`, { method: 'DELETE' });
      await loadWeddingData(selectedPropertyId);
    } catch (err: any) {
      alert(err.message || 'Failed to delete theme');
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: string) => {
    try {
      await apiClient(`/wedding/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadWeddingData(selectedPropertyId);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
        <span className="text-xs font-semibold">Loading Wedding &amp; Destination Engine...</span>
      </div>
    );
  }

  // Plan Lock Gate Screen
  if (isLocked) {
    return (
      <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <Heart className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-xl mx-auto">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            Premium Destination Feature
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Wedding &amp; Destination Engine is Locked
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Your current Free Starter plan includes basic PMS operations. The <strong>Wedding Engine</strong> lets you showcase destination packages, mandap decoration themes, per-plate catering estimators, and interactive MCQ quotation downloads for high-ticket events.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-lg mx-auto text-left text-xs space-y-2 text-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Interactive MCQ quotation calculator with HotelFlexi PDF export</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Decoration themes gallery with photo carousels &amp; price slabs</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Direct WhatsApp &amp; phone lead coordination dashboard</span>
          </div>
        </div>

        <Link
          href="/app/subscription"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-extrabold text-xs shadow-lg transition"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Upgrade Subscription to Unlock &rarr;</span>
        </Link>
      </div>
    );
  }

  const selectedPropObj = properties.find((p) => p.id === selectedPropertyId);
  const publicWeddingSlug = selectedPropObj?.slug;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-light">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-content-primary-light tracking-tight">
              Wedding &amp; Destination Engine
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {isEnabled ? '● Live on Website' : '○ Disabled'}
            </span>
          </div>
          <p className="text-xs text-content-secondary-light mt-0.5">
            Configure destination wedding packages, decoration themes, per-plate catering rules, and track guest inquiries
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {publicWeddingSlug && (
            <Link
              href={`/wedding/${publicWeddingSlug}`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Eye className="w-3.5 h-3.5 text-brand-blue" />
              <span>View Public Portal &rarr;</span>
            </Link>
          )}

          {properties.length > 1 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => loadWeddingData(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'settings' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Venue &amp; Catering Pricing
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'packages' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Packages</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {data?.packages?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('decor')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'decor' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Mandap &amp; Decor Themes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {data?.decorThemes?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'leads' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Quotation Leads &amp; Inquiries</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
            {data?.leads?.length || 0}
          </span>
        </button>
      </div>

      {/* TAB 1: VENUE & CATERING PRICING */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Destination Wedding Configuration</h3>
              <p className="text-[11px] text-slate-500">Configure public wedding engine availability, base catering, and venue capacities</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-brand-blue"
              />
              <span>Enable Wedding Engine</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Headline / Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Royal Destination Wedding & Banquets"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Experience royal celebrations amidst scenic vistas"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-800 mb-1">Venue &amp; Hospitality Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Highlight lawns, banquet capacity, bridal rooms, valet parking..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          {/* Photo Uploader */}
          <ImageUploader
            currentUrl={coverImageUrl}
            onUploadSuccess={(url) => setCoverImageUrl(url)}
            label="Wedding Venue Cover Photo"
            sublabel="Upload grand photo of your lawn, banquet, or exterior"
            aspectRatio="wide"
          />

          {/* Capacities */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 mb-3">Venue Guest &amp; Room Capacities</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">Grand Lawn Capacity (Guests)</label>
                <input
                  type="number"
                  value={lawnCapacity}
                  onChange={(e) => setLawnCapacity(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">Banquet Hall Capacity (Guests)</label>
                <input
                  type="number"
                  value={banquetCapacity}
                  onChange={(e) => setBanquetCapacity(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">Rooms Available for Wedding</label>
                <input
                  type="number"
                  value={roomsAvailable}
                  onChange={(e) => setRoomsAvailable(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Base Catering & Function Pricing */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 mb-3">Interactive Calculator Pricing Rules (INR)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">Pure Veg Plate (₹)</label>
                <input
                  type="number"
                  value={baseVegPlateRupees}
                  onChange={(e) => setBaseVegPlateRupees(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">Veg + Non-Veg Plate (₹)</label>
                <input
                  type="number"
                  value={baseNonvegPlateRupees}
                  onChange={(e) => setBaseNonvegPlateRupees(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">Royal Multi-Cuisine (₹)</label>
                <input
                  type="number"
                  value={baseMulticuisinePlateRupees}
                  onChange={(e) => setBaseMulticuisinePlateRupees(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">Per-Function Staging Fee (₹)</label>
                <input
                  type="number"
                  value={baseFunctionVenueRupees}
                  onChange={(e) => setBaseFunctionVenueRupees(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Coordination Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Wedding Coordinator Phone / WhatsApp</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Wedding Coordination Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="events@property.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs shadow transition flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save Wedding Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Destination Wedding Packages</h3>
              <p className="text-[11px] text-slate-500">Showcase curated all-inclusive plans for couples and families</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPkgForm({
                  id: '',
                  name: '',
                  description: '',
                  priceRange: '₹5,00,000 - ₹12,00,000',
                  coverImageUrl: '',
                  maxGuests: 500,
                  inclusions: 'Grand Lawn Venue for 2 Days\nBridal Suite with 24/7 Butler\nCustomized Floral Mandap Setup\nRoyal Buffet Catering (2 Dinners, 1 Lunch)\nDJ, Sound License & Genset Backup',
                });
                setPackageModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-brand-blue text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Package</span>
            </button>
          </div>

          {(!data?.packages || data.packages.length === 0) ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No wedding packages added yet. Click &quot;Add Package&quot; to showcase curated wedding plans.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.packages.map((pkg: any) => (
                <div key={pkg.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                  {pkg.cover_image_url && (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={pkg.cover_image_url} alt={pkg.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-sm text-slate-900">{pkg.name}</h4>
                        <span className="font-black text-xs text-brand-blue bg-blue-50 px-2 py-0.5 rounded-md">
                          {pkg.price_range}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{pkg.description}</p>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Package Inclusions:</span>
                      <ul className="space-y-1 text-[11px]">
                        {pkg.inclusions?.slice(0, 4).map((inc: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DECOR THEMES */}
      {activeTab === 'decor' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Mandap &amp; Stage Decoration Themes</h3>
              <p className="text-[11px] text-slate-500">Add customizable decoration concepts with visual photos and price indicators</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDecorForm({
                  id: '',
                  name: '',
                  description: '',
                  priceRange: '₹1,50,000 - ₹3,50,000',
                  basePriceRupees: 150000,
                  photoUrl: '',
                });
                setDecorModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-brand-blue text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Decor Theme</span>
            </button>
          </div>

          {(!data?.decorThemes || data.decorThemes.length === 0) ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No decoration themes added yet. Add themes like Royal Rajasthani Mandap, Bohemian Lights, or Floral Arch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.decorThemes.map((dec: any) => (
                <div key={dec.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                  {dec.photos?.[0] && (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={dec.photos[0]} alt={dec.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-sm text-slate-900">{dec.name}</h4>
                        <span className="font-black text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                          {dec.price_range}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{dec.description}</p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">Calculator Base:</span>
                      <strong className="text-slate-900">{formatINR(dec.base_price_paise)}</strong>
                      <button
                        type="button"
                        onClick={() => handleDeleteDecor(dec.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LEADS & INQUIRIES */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Wedding Quotation Leads &amp; Coordination</h3>
              <p className="text-[11px] text-slate-500">Inquiries submitted by prospective couples via the interactive quotation builder</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {data?.leads?.length || 0} Inquiries
            </span>
          </div>

          {(!data?.leads || data.leads.length === 0) ? (
            <div className="p-10 text-center text-xs text-slate-400 space-y-1">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No wedding inquiries received yet. When visitors generate a quotation on your public portal, leads will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.leads.map((lead: any) => (
                <div key={lead.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{lead.guest_name}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">({lead.lead_number})</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
                      <span>📞 {lead.guest_phone}</span>
                      {lead.guest_email && <span>✉️ {lead.guest_email}</span>}
                      <span>📅 Dates: {lead.event_dates || 'Tentative'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] pt-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                        👥 {lead.guest_count} Guests
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                        🎉 {lead.functions_count} Functions
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold capitalize">
                        🍽️ {lead.meal_preference?.replace('_', ' ')}
                      </span>
                      {lead.rooms_needed > 0 && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold">
                          🛏️ {lead.rooms_needed} Rooms
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Estimated Quotation:</span>
                      <span className="font-extrabold text-sm text-emerald-700">
                        {formatINR(lead.estimated_total_paise || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${lead.guest_phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(lead.guest_name)}%2C%20greetings%20from%20${encodeURIComponent(selectedPropObj?.name || 'HotelFlexi')}!%20We%20received%20your%20wedding%20quotation%20inquiry.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700 transition"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>

                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="quoted">Quoted</option>
                        <option value="booked">Booked 🎉</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Package Creation Modal */}
      {packageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSavePackage} className="bg-white rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-slate-900 pb-2 border-b border-slate-100">
              Add Destination Wedding Package
            </h3>
            <div>
              <label className="block font-bold mb-1">Package Name</label>
              <input
                type="text"
                required
                value={pkgForm.name}
                onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                placeholder="Royal Rajasthani Destination Wedding (2 Days)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Price Range Display</label>
                <input
                  type="text"
                  value={pkgForm.priceRange}
                  onChange={(e) => setPkgForm({ ...pkgForm, priceRange: e.target.value })}
                  placeholder="₹6,00,000 - ₹12,00,000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Max Guests Included</label>
                <input
                  type="number"
                  value={pkgForm.maxGuests}
                  onChange={(e) => setPkgForm({ ...pkgForm, maxGuests: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold mb-1">Short Description</label>
              <textarea
                rows={2}
                value={pkgForm.description}
                onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                placeholder="Complete heritage lawn and palace decor package with catering..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <ImageUploader
              currentUrl={pkgForm.coverImageUrl}
              onUploadSuccess={(url) => setPkgForm({ ...pkgForm, coverImageUrl: url })}
              label="Package Cover Photo"
            />
            <div>
              <label className="block font-bold mb-1">Inclusions (One item per line)</label>
              <textarea
                rows={4}
                value={pkgForm.inclusions}
                onChange={(e) => setPkgForm({ ...pkgForm, inclusions: e.target.value })}
                placeholder="Lawn Venue for 2 Days&#10;Catering for 500 Guests&#10;Bridal Suite Included"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPackageModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-blue text-white font-bold shadow"
              >
                Save Package
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Decor Theme Creation Modal */}
      {decorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveDecor} className="bg-white rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-slate-900 pb-2 border-b border-slate-100">
              Add Mandap &amp; Stage Decor Theme
            </h3>
            <div>
              <label className="block font-bold mb-1">Theme Name</label>
              <input
                type="text"
                required
                value={decorForm.name}
                onChange={(e) => setDecorForm({ ...decorForm, name: e.target.value })}
                placeholder="Fairytale Fairy-Lights &amp; Floral Canopy Mandap"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Price Range</label>
                <input
                  type="text"
                  value={decorForm.priceRange}
                  onChange={(e) => setDecorForm({ ...decorForm, priceRange: e.target.value })}
                  placeholder="₹1,50,000 - ₹3,00,000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Base Price for Calculator (₹)</label>
                <input
                  type="number"
                  value={decorForm.basePriceRupees}
                  onChange={(e) => setDecorForm({ ...decorForm, basePriceRupees: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold mb-1">Theme Description</label>
              <textarea
                rows={2}
                value={decorForm.description}
                onChange={(e) => setDecorForm({ ...decorForm, description: e.target.value })}
                placeholder="Exquisite imported carnations, warm lighting pillars, and royal seating..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <ImageUploader
              currentUrl={decorForm.photoUrl}
              onUploadSuccess={(url) => setDecorForm({ ...decorForm, photoUrl: url })}
              label="Mandap / Decor Photo"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDecorModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-blue text-white font-bold shadow"
              >
                Save Theme
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
