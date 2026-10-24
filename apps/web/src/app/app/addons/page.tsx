'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Compass,
  Tag,
  DollarSign,
  Layers,
  ArrowRight,
  X,
  Upload,
} from 'lucide-react';

interface BookingAddon {
  id: string;
  property_id: string;
  name: string;
  description: string;
  category: 'activity' | 'service' | 'rental' | 'meal' | 'experience';
  pricing_type: 'per_person' | 'per_unit' | 'per_hour' | 'flat' | 'free';
  price_paise: number;
  min_qty: number;
  max_qty: number;
  image_url: string | null;
  display_order: number;
  is_active: number;
}

const PRESET_IDEAS = [
  {
    name: 'River Rafting Adventure',
    category: 'activity' as const,
    pricingType: 'per_person' as const,
    priceRupees: 1200,
    minQty: 1,
    maxQty: 10,
    description: 'Thrilling white-water rafting expedition with certified guides, helmets, and life jackets included.',
    imageUrl: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Bungee Jumping Experience',
    category: 'activity' as const,
    pricingType: 'per_person' as const,
    priceRupees: 3500,
    minQty: 1,
    maxQty: 6,
    description: 'Adrenaline-packed bungee jump from India’s highest fixed platform with international safety standards.',
    imageUrl: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Private Bonfire & Acoustic Night',
    category: 'experience' as const,
    pricingType: 'flat' as const,
    priceRupees: 1500,
    minQty: 1,
    maxQty: 1,
    description: 'Cozy evening wood campfire under starry skies with seating, marshmallows, and warm hospitality.',
    imageUrl: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Airport / Railway Pickup & Drop',
    category: 'service' as const,
    pricingType: 'flat' as const,
    priceRupees: 900,
    minQty: 1,
    maxQty: 2,
    description: 'Chauffeured sedan or SUV transfer directly to hotel porch with luggage assistance.',
    imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Mountain Bicycle Rental',
    category: 'rental' as const,
    pricingType: 'per_hour' as const,
    priceRupees: 150,
    minQty: 1,
    maxQty: 8,
    description: 'Geared all-terrain mountain bikes with helmet and route map for scenic village & valley trails.',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Candlelight Lawn Dinner Setup',
    category: 'experience' as const,
    pricingType: 'flat' as const,
    priceRupees: 2500,
    minQty: 1,
    maxQty: 1,
    description: 'Romantic floral canopy, fairy lights, private butler, and 4-course bespoke dinner by the lawn.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
];

export default function AddonsPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [addons, setAddons] = useState<BookingAddon[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'activity' | 'service' | 'rental' | 'meal' | 'experience'>('activity');
  const [pricingType, setPricingType] = useState<'per_person' | 'per_unit' | 'per_hour' | 'flat' | 'free'>('per_person');
  const [priceRupees, setPriceRupees] = useState('1200');
  const [minQty, setMinQty] = useState('1');
  const [maxQty, setMaxQty] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchAddons = async () => {
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (activeProp) {
        setPropertyId(activeProp.id);
        const data = await apiClient(`/addons?property_id=${activeProp.id}`);
        setAddons(data.addons || []);
      }
    } catch (e) {
      console.error('Failed to fetch add-ons', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant) {
      fetchAddons();
    }
  }, [currentTenant]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setCategory('activity');
    setPricingType('per_person');
    setPriceRupees('1200');
    setMinQty('1');
    setMaxQty('10');
    setImageUrl('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (addon: BookingAddon) => {
    setEditingId(addon.id);
    setName(addon.name);
    setDescription(addon.description || '');
    setCategory(addon.category);
    setPricingType(addon.pricing_type);
    setPriceRupees(addon.pricing_type === 'free' ? '0' : String(addon.price_paise / 100));
    setMinQty(String(addon.min_qty || 1));
    setMaxQty(String(addon.max_qty || 10));
    setImageUrl(addon.image_url || '');
    setIsActive(Boolean(addon.is_active));
    setModalOpen(true);
  };

  const applyPreset = (preset: typeof PRESET_IDEAS[0]) => {
    setEditingId(null);
    setName(preset.name);
    setDescription(preset.description);
    setCategory(preset.category);
    setPricingType(preset.pricingType);
    setPriceRupees(String(preset.priceRupees));
    setMinQty(String(preset.minQty));
    setMaxQty(String(preset.maxQty));
    setImageUrl(preset.imageUrl);
    setIsActive(true);
    setModalOpen(true);
  };

  const handleToggleActive = async (addon: BookingAddon) => {
    try {
      await apiClient(`/addons/${addon.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !addon.is_active }),
      });
      setAddons((prev) =>
        prev.map((a) => (a.id === addon.id ? { ...a, is_active: a.is_active ? 0 : 1 } : a))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this add-on activity?')) return;
    try {
      await apiClient(`/addons/${id}`, { method: 'DELETE' });
      setAddons((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an add-on title.');
      return;
    }

    setSaving(true);
    try {
      const pricePaise = pricingType === 'free' ? 0 : Math.round((parseFloat(priceRupees) || 0) * 100);

      if (editingId) {
        await apiClient(`/addons/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            category,
            pricingType,
            pricePaise,
            minQty: parseInt(minQty, 10) || 1,
            maxQty: parseInt(maxQty, 10) || 10,
            imageUrl: imageUrl.trim() || null,
            isActive: isActive ? 1 : 0,
          }),
        });
      } else {
        await apiClient('/addons', {
          method: 'POST',
          body: JSON.stringify({
            propertyId,
            name: name.trim(),
            description: description.trim(),
            category,
            pricingType,
            pricePaise,
            minQty: parseInt(minQty, 10) || 1,
            maxQty: parseInt(maxQty, 10) || 10,
            imageUrl: imageUrl.trim() || null,
            isActive: isActive ? 1 : 0,
          }),
        });
      }

      setModalOpen(false);
      await fetchAddons();
    } catch (err: any) {
      alert(err.message || 'Failed to save add-on');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const filtered = filterCategory === 'all'
    ? addons
    : addons.filter((a) => a.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-content-primary-light flex items-center gap-2">
            <Compass className="w-6 h-6 text-brand-blue" />
            Add-on Services &amp; Local Activities
          </h1>
          <p className="text-xs text-content-secondary-light mt-1">
            Configure river rafting, bungee jumping, bonfire, transfers, and rentals. Guests can add these during direct booking.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Add-on Service
        </button>
      </div>

      {/* Quick Add Presets Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-blue" />
          <h3 className="font-extrabold text-xs text-blue-900 uppercase tracking-wider">
            Popular Activity &amp; Experience Templates (1-Click Add)
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {PRESET_IDEAS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(item)}
              className="p-2.5 bg-white hover:bg-blue-500 hover:text-white rounded-xl border border-blue-200 text-left transition shadow-xs group"
            >
              <div className="font-bold text-[11px] truncate group-hover:text-white text-slate-800">
                {item.name}
              </div>
              <div className="text-[10px] text-blue-700 group-hover:text-blue-100 font-semibold mt-0.5">
                ₹{item.priceRupees} / {item.pricingType.replace('per_', '')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {['all', 'activity', 'service', 'rental', 'experience', 'meal'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl capitalize transition shrink-0 ${
              filterCategory === cat
                ? 'bg-brand-blue text-white shadow-xs'
                : 'bg-white border border-border-light text-content-secondary-light hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? 'All Services' : cat}
          </button>
        ))}
      </div>

      {/* Add-ons List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-3">
          <Compass className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-content-primary-light">No Add-on Services Configured</h3>
          <p className="text-xs text-content-secondary-light max-w-md mx-auto">
            Offer your guests river rafting, desert safaris, bicycle rentals, or airport pickups. Click &ldquo;Create Add-on Service&rdquo; or use the templates above.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add First Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((addon) => {
            const isFree = addon.pricing_type === 'free';
            return (
              <div
                key={addon.id}
                className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  {/* Photo Banner */}
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    {addon.image_url ? (
                      <img
                        src={addon.image_url}
                        alt={addon.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                      {addon.category}
                    </span>
                    <span
                      className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        addon.is_active
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-500 text-white'
                      }`}
                    >
                      {addon.is_active ? 'Active on Engine' : 'Paused'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-content-primary-light leading-snug">
                        {addon.name}
                      </h3>
                      <div className="text-right shrink-0">
                        {isFree ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                            FREE
                          </span>
                        ) : (
                          <div className="font-extrabold text-sm text-brand-blue">
                            {formatINR(addon.price_paise)}
                            <span className="text-[10px] text-content-secondary-light font-normal block">
                              /{addon.pricing_type.replace('per_', '')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-content-secondary-light line-clamp-2 leading-relaxed">
                      {addon.description || 'No description provided.'}
                    </p>

                    <div className="pt-2 border-t border-border-light flex items-center justify-between text-[11px] text-content-secondary-light">
                      <span>Limits: {addon.min_qty} - {addon.max_qty} units</span>
                      <span className="capitalize text-slate-700 font-medium">Pricing: {addon.pricing_type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-slate-50 border-t border-border-light flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(addon.is_active)}
                      onChange={() => handleToggleActive(addon)}
                      className="rounded text-brand-blue focus:ring-brand-blue w-3.5 h-3.5"
                    />
                    <span>{addon.is_active ? 'Available' : 'Disabled'}</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(addon)}
                      className="p-1.5 rounded-lg bg-white border border-border-light text-slate-700 hover:text-brand-blue hover:bg-blue-50 transition"
                      title="Edit Service"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(addon.id)}
                      className="p-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition"
                      title="Delete Service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="addon-modal-title"
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border-light max-h-[90vh] overflow-y-auto space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <h3 id="addon-modal-title" className="text-base font-extrabold text-content-primary-light flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-blue" />
                {editingId ? 'Edit Add-on Service' : 'Create New Add-on Service'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Add-on Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. River Rafting, Bungee Jump, Evening Bonfire"
                  className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                  >
                    <option value="activity">Adventure / Activity</option>
                    <option value="service">Transport / Service</option>
                    <option value="experience">Luxury Experience</option>
                    <option value="rental">Gear / Vehicle Rental</option>
                    <option value="meal">Dining / Special Meal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pricing Structure</label>
                  <select
                    value={pricingType}
                    onChange={(e: any) => setPricingType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                  >
                    <option value="per_person">Per Person</option>
                    <option value="per_unit">Per Quantity / Item</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="flat">Flat Fixed Fee</option>
                    <option value="free">Complimentary / Free</option>
                  </select>
                </div>
              </div>

              {pricingType !== 'free' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Price in INR (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    placeholder="1200"
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-bold"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={maxQty}
                    onChange={(e) => setMaxQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail what is included, schedule, safety gear, guidelines..."
                  className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Photo Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... (Image URL)"
                    className="flex-1 px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                  />
                  <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold border border-border-light transition shrink-0 flex items-center gap-1 text-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                {imageUrl && (
                  <div className="mt-2 w-full h-24 rounded-xl overflow-hidden border border-border-light bg-slate-50">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-border-light flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Publish on Public Booking Engine</div>
                  <div className="text-[11px] text-slate-500">Allow guests to view and select this service when booking</div>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-brand-blue focus:ring-brand-blue w-4 h-4"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border-light font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {editingId ? 'Save Changes' : 'Create Add-on'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}