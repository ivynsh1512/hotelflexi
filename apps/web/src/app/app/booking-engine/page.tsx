'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Globe,
  Copy,
  CheckCircle2,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Save,
  Loader2,
  Plus,
  Trash2,
  Baby,
  Building,
  ChevronLeft,
  ChevronRight,
  Star,
  FileText,
  Sparkles,
} from 'lucide-react';

const HOTEL_AMENITIES = [
  'Free High-Speed WiFi',
  'Swimming Pool',
  'Air Conditioning',
  'Restaurant & In-Room Dining',
  'Free On-Site Parking',
  '24/7 Front Desk Reception',
  'Power Backup / Genset',
  'Scenic Mountain / River View',
  'Electric Kettle & Tea Maker',
  'Daily Housekeeping',
  'Airport / Railway Station Transfers',
  'Doctor on Call',
];

export default function BookingEngineAppPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Branding states
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Child pricing policy states
  const [childCutoffAge, setChildCutoffAge] = useState<number>(10);
  const [childRateRupees, setChildRateRupees] = useState<string>('500');

  useEffect(() => {
    async function loadProperty() {
      if (!currentTenant) return;
      try {
        const propData = await apiClient('/properties');
        const activeProp = propData.properties?.[0];
        if (activeProp) {
          setProperty(activeProp);
          setLogoUrl(activeProp.logo_url || '');
          setDescription(activeProp.description || '');

          let imgs: string[] = [];
          if (Array.isArray(activeProp.photos)) {
            imgs = activeProp.photos;
          } else if (Array.isArray(activeProp.gallery_images)) {
            imgs = activeProp.gallery_images;
          } else if (typeof activeProp.gallery_images === 'string') {
            try { imgs = JSON.parse(activeProp.gallery_images); } catch {}
          }
          setGalleryImages(imgs || []);

          let amList: string[] = [];
          if (Array.isArray(activeProp.amenities)) {
            amList = activeProp.amenities;
          } else if (typeof activeProp.amenities === 'string') {
            try { amList = JSON.parse(activeProp.amenities); } catch {}
          }
          setAmenities(amList);

          setChildCutoffAge(activeProp.child_cutoff_age ?? 10);
          setChildRateRupees(String((activeProp.child_rate_paise ?? 50000) / 100));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
  }, [currentTenant]);

  const bookingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/book/${currentTenant?.tenant_slug}`
    : `https://hotelflexi.vercel.app/book/${currentTenant?.tenant_slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const galleryFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is larger than 5MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setGalleryImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleMoveGalleryImage = (index: number, direction: 'left' | 'right') => {
    setGalleryImages((prev) => {
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const handleSetPrimaryGalleryImage = (index: number) => {
    setGalleryImages((prev) => {
      if (index === 0) return prev;
      const copy = [...prev];
      const [promoted] = copy.splice(index, 1);
      return [promoted, ...copy];
    });
  };

  const toggleAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter((a) => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  const handleAddCustomAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customAmenity.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities([...amenities, trimmed]);
      setCustomAmenity('');
    }
  };

  const handleAddGalleryImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newImageUrl.trim()) {
      setGalleryImages([...galleryImages, newImageUrl.trim()]);
      setNewImageUrl('');
    } else {
      galleryFileInputRef.current?.click();
    }
  };

  const handleRemoveImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setSaving(true);
    setSaved(false);

    try {
      const childRatePaise = Math.round(parseFloat(childRateRupees || '0') * 100);

      await apiClient(`/properties/${property.id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          description,
          amenities,
          logo_url: logoUrl,
          gallery_images: galleryImages,
          photos: galleryImages,
          child_cutoff_age: childCutoffAge,
          child_rate_paise: childRatePaise,
        }),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-3 border-b border-border-light flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Direct Booking Engine Customization
          </h1>
          <p className="text-xs text-content-secondary-light">
            Upload property logo, photos gallery, child pricing rules, and manage direct guest booking URL
          </p>
        </div>

        {saved && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
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
          {/* Guest Booking URL Card */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4">
            <label className="block text-xs font-bold text-content-primary-light uppercase tracking-wider">
              Your Public Booking Engine Link
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={bookingUrl}
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-border-light bg-surface-light text-xs font-mono text-content-primary-light"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2.5 rounded-lg bg-surface-light border border-border-light text-xs font-semibold hover:bg-white transition flex items-center gap-1.5"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
                <Link
                  href={`/book/${currentTenant?.tenant_slug}`}
                  target="_blank"
                  className="px-4 py-2.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover transition flex items-center gap-1.5"
                >
                  Visit <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Hotel Logo & Branding */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-content-primary-light border-b border-border-light pb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-blue" />
              Hotel Logo & Brand Identity
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border-light flex items-center justify-center bg-surface-light overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Hotel Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building className="w-8 h-8 text-content-secondary-light" />
                )}
              </div>

              <div className="space-y-2 flex-1 w-full">
                <label className="text-[11px] font-semibold text-content-primary-light block">
                  Upload Logo File or Enter Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                  <label className="cursor-pointer px-3 py-2 rounded-lg bg-surface-light border border-border-light hover:bg-white font-semibold flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5 text-brand-blue" />
                    Browse
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
                <p className="text-[10px] text-content-secondary-light">
                  Recommended size: 400x400 px, PNG or SVG format. This logo appears on your direct booking engine and guest invoices.
                </p>
              </div>
            </div>
          </div>

          {/* Multi-Image Gallery */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-content-primary-light border-b border-border-light pb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-blue" />
              Property Photo Gallery
            </h3>

            <input
              ref={galleryFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageFileUpload}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste high-res photo URL or click 'Upload Photos'..."
                className="flex-1 px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <button
                type="button"
                onClick={handleAddGalleryImage}
                className="px-4 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-hover transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{newImageUrl.trim() ? 'Add URL' : 'Add Photo'}</span>
              </button>
              <button
                type="button"
                onClick={() => galleryFileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photos</span>
              </button>
            </div>

            {galleryImages.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border-light rounded-xl text-content-secondary-light">
                No gallery photos added yet. Add photos of your hotel lobby, exterior, amenities, or pool to increase direct bookings.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="group relative rounded-xl overflow-hidden border border-border-light aspect-video bg-surface-light shadow-xs">
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold flex items-center gap-0.5 shadow-sm">
                        <Star className="w-2.5 h-2.5 fill-current" /> Cover
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 p-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveGalleryImage(idx, 'left')}
                          className="p-1 rounded bg-white/80 hover:bg-white text-slate-800 transition"
                          title="Move Left"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryGalleryImage(idx)}
                          className="p-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 transition"
                          title="Set as Cover Photo"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < galleryImages.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveGalleryImage(idx, 'right')}
                          className="p-1 rounded bg-white/80 hover:bg-white text-slate-800 transition"
                          title="Move Right"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 rounded bg-red-600 hover:bg-red-700 text-white transition ml-1"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* About Hotel / Description */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-content-primary-light border-b border-border-light pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-blue" />
              About Hotel / Property Overview
            </h3>

            <p className="text-content-secondary-light leading-relaxed">
              Introduce your property to guests booking direct online. Highlight scenic views, proximity to attractions, and hospitality features.
            </p>

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Nestled in the heart of the valley, Hotel Grand offers luxurious mountain-facing rooms, fine dining, and warm Himalayan hospitality..."
              className="w-full px-3 py-2 rounded-xl border border-border-light bg-surface-light focus:outline-none focus:ring-1 focus:ring-brand-blue text-xs leading-relaxed"
            />
          </div>

          {/* Amenities & Guest Facilities */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <div className="border-b border-border-light pb-2">
              <h3 className="font-bold text-sm text-content-primary-light flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-blue" />
                Hotel Amenities &amp; Guest Facilities
              </h3>
              <p className="text-[11px] text-content-secondary-light mt-0.5">
                Check all amenities available at your property to display badges on the direct booking engine.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              {HOTEL_AMENITIES.map((am) => {
                const checked = amenities.includes(am);
                return (
                  <label
                    key={am}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      checked
                        ? 'bg-blue-50 border-brand-blue text-brand-blue font-bold shadow-xs'
                        : 'bg-white border-border-light text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAmenity(am)}
                      className="rounded text-brand-blue"
                    />
                    <span className="truncate">{am}</span>
                  </label>
                );
              })}
            </div>

            {/* Custom Amenities Add */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                placeholder="Add custom amenity (e.g. Bonfire, EV Charging Station, Jacuzzi)..."
                className="flex-1 px-3 py-2 rounded-xl border border-border-light bg-surface-light focus:outline-none focus:ring-1 focus:ring-brand-blue text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-1.5 shrink-0 text-xs shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Amenity</span>
              </button>
            </div>
          </div>

          {/* Child Pricing & Age Policy Rules */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-content-primary-light border-b border-border-light pb-2 flex items-center gap-2">
              <Baby className="w-4 h-4 text-brand-blue" />
              Child Age Cutoff & Surcharge Policy
            </h3>

            <p className="text-content-secondary-light leading-relaxed">
              Configure how child occupancy is calculated during reservation creation and online booking engine checkout.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                  Child Cutoff Age (Years) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={childCutoffAge}
                  onChange={(e) => setChildCutoffAge(parseInt(e.target.value, 10) || 10)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue font-bold text-sm"
                />
                <p className="text-[10px] text-content-secondary-light mt-1">
                  Children age {childCutoffAge} and under receive the child rate. Children above {childCutoffAge} years are automatically counted as extra adults.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                  Child Surcharge Tariff per Night (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={childRateRupees}
                  onChange={(e) => setChildRateRupees(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue font-bold text-sm text-brand-blue"
                />
                <p className="text-[10px] text-content-secondary-light mt-1">
                  Flat tariff added per accompanying child (per night) across all room categories.
                </p>
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
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Engine Configuration...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Booking Engine Configuration
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
