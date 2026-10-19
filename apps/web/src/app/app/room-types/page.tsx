'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  Tag,
  PlusCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Image as ImageIcon,
  Plus,
  Trash2,
  BedDouble,
  Users,
} from 'lucide-react';

const COMMON_ROOM_AMENITIES = [
  'King Bed',
  'Queen Bed',
  'Twin Beds',
  'Air Conditioning',
  'Geyser / 24hr Hot Water',
  'Smart TV (Netflix/OTT)',
  'Free High-Speed Wi-Fi',
  'Electric Kettle & Tea Kit',
  'Mini Fridge',
  'Work Desk & Chair',
  'Private Balcony',
  'Mountain View',
  'Garden View',
  'Bathrobes & Slippers',
  'In-Room Electronic Safe',
  'Hair Dryer',
];

export default function RoomTypesPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [basePrice, setBasePrice] = useState(2500);
  const [weekendPrice, setWeekendPrice] = useState(2800);
  const [baseOccupancy, setBaseOccupancy] = useState(2);
  const [maxOccupancy, setMaxOccupancy] = useState(3);
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoomTypes = async () => {
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (activeProp) {
        setPropertyId(activeProp.id);
        const data = await apiClient(`/rooms/types?property_id=${activeProp.id}`);
        setRoomTypes(data.roomTypes || []);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load room types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant) fetchRoomTypes();
  }, [currentTenant]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setBasePrice(2500);
    setWeekendPrice(2800);
    setBaseOccupancy(2);
    setMaxOccupancy(3);
    setDescription('');
    setAmenities(['King Bed', 'Air Conditioning', 'Free High-Speed Wi-Fi', 'Geyser / 24hr Hot Water']);
    setImages([]);
    setNewImageUrl('');
    setCustomAmenity('');
    setModalOpen(true);
  };

  const handleOpenEdit = (rt: any) => {
    setEditingId(rt.id);
    setName(rt.name || '');
    setCode(rt.code || '');
    setBasePrice(rt.base_price_paise ? rt.base_price_paise / 100 : 2500);
    setWeekendPrice(rt.weekend_price_paise ? rt.weekend_price_paise / 100 : 2800);
    setBaseOccupancy(rt.base_occupancy || 2);
    setMaxOccupancy(rt.max_occupancy || 3);
    setDescription(rt.description || '');

    let amList: string[] = [];
    if (Array.isArray(rt.amenities)) {
      amList = rt.amenities;
    } else if (typeof rt.amenities === 'string') {
      try {
        amList = JSON.parse(rt.amenities);
      } catch {
        amList = [];
      }
    }
    setAmenities(amList);

    let imgList: string[] = [];
    if (Array.isArray(rt.images)) {
      imgList = rt.images;
    } else if (typeof rt.images === 'string') {
      try {
        imgList = JSON.parse(rt.images);
      } catch {
        imgList = [];
      }
    }
    setImages(imgList);
    setNewImageUrl('');
    setCustomAmenity('');
    setModalOpen(true);
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

  const handleAddImage = () => {
    const trimmed = newImageUrl.trim();
    if (trimmed && !images.includes(trimmed)) {
      setImages([...images, trimmed]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        // Update existing room type
        await apiClient(`/rooms/types/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            basePricePaise: Math.round(basePrice * 100),
            weekendPricePaise: weekendPrice ? Math.round(weekendPrice * 100) : null,
            baseOccupancy,
            maxOccupancy,
            description,
            amenities,
            images,
          }),
        });
      } else {
        // Create new room type
        await apiClient('/rooms/types', {
          method: 'POST',
          body: JSON.stringify({
            propertyId,
            name,
            code: code || name.slice(0, 3).toUpperCase(),
            basePricePaise: Math.round(basePrice * 100),
            weekendPricePaise: weekendPrice ? Math.round(weekendPrice * 100) : null,
            baseOccupancy,
            maxOccupancy,
            description,
            amenities,
            images,
          }),
        });
      }
      setModalOpen(false);
      await fetchRoomTypes();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Room Categories & Pricing
          </h1>
          <p className="text-xs text-content-secondary-light">
            Configure room types, standard tariffs, weekend premiums, amenities, and room photos
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          Create Room Type
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : roomTypes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-4">
          <Tag className="w-12 h-12 text-content-secondary-light mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-content-primary-light">No Room Categories Created Yet</h3>
            <p className="text-xs text-content-secondary-light max-w-md mx-auto">
              Configure your room categories (e.g. Deluxe Room, Executive Suite, Family Cottage) to define base tariffs, weekend rates, amenities, and occupancy limits.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Create Your First Room Category
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div key={rt.id} className="rounded-2xl bg-white border border-border-light shadow-sm flex flex-col justify-between overflow-hidden">
                {/* Photo Thumbnail */}
                {rtImages.length > 0 ? (
                  <div className="aspect-video w-full relative bg-slate-100 overflow-hidden border-b border-border-light">
                    <img src={rtImages[0]} alt={rt.name} className="w-full h-full object-cover" />
                    {rtImages.length > 1 && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                        +{rtImages.length - 1} photos
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-28 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center border-b border-border-light">
                    <BedDouble className="w-8 h-8 text-blue-300" />
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-base font-bold text-content-primary-light">{rt.name}</h3>
                      <span className="font-mono text-xs font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                        {rt.code}
                      </span>
                    </div>

                    <p className="text-xs text-content-secondary-light mb-3 line-clamp-2">
                      {rt.description || 'Standard room category with premium amenities.'}
                    </p>

                    {/* Amenities tags */}
                    {rtAmenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {rtAmenities.slice(0, 4).map((am, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-surface-light text-[10px] text-content-secondary-light border border-border-light">
                            {am}
                          </span>
                        ))}
                        {rtAmenities.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-light text-[10px] text-content-secondary-light">
                            +{rtAmenities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5 text-xs border-t border-border-light pt-3">
                      <div className="flex justify-between">
                        <span className="text-content-secondary-light">Base Tariff:</span>
                        <span className="font-bold text-content-primary-light">{formatINR(rt.base_price_paise)}/night</span>
                      </div>
                      {rt.weekend_price_paise && (
                        <div className="flex justify-between">
                          <span className="text-content-secondary-light">Weekend Tariff:</span>
                          <span className="font-semibold text-brand-blue">{formatINR(rt.weekend_price_paise)}/night</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-content-secondary-light">Max Occupancy:</span>
                        <span className="font-medium text-content-primary-light">{rt.max_occupancy} Guests</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-content-secondary-light">Total Units in Hotel:</span>
                        <span className="font-bold text-emerald-700">{rt.total_units || 0} Units</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleOpenEdit(rt)}
                      className="w-full py-2 rounded-xl border border-border-light text-xs font-semibold text-content-primary-light hover:bg-surface-light flex items-center justify-center gap-1.5 transition"
                    >
                      <Pencil className="w-3.5 h-3.5 text-brand-blue" /> Edit Category & Photos
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border-light my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <h3 className="text-sm font-bold text-content-primary-light">
                {editingId ? 'Edit Room Category' : 'Create Room Category'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-xs text-content-secondary-light">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Premium Deluxe Room"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Category Code</label>
                  <input
                    type="text"
                    value={code}
                    disabled={Boolean(editingId)}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="DEL"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Weekend Price (₹)</label>
                  <input
                    type="number"
                    value={weekendPrice}
                    onChange={(e) => setWeekendPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold text-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Base Occupancy</label>
                  <input
                    type="number"
                    min={1}
                    value={baseOccupancy}
                    onChange={(e) => setBaseOccupancy(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Occupancy</label>
                  <input
                    type="number"
                    min={1}
                    value={maxOccupancy}
                    onChange={(e) => setMaxOccupancy(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comfortable king-bed room with valley view..."
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              {/* Room Amenities Selector */}
              <div className="space-y-2 pt-2 border-t border-border-light">
                <label className="block font-semibold text-content-primary-light">
                  Room Amenities & Highlights
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-surface-light rounded-xl border border-border-light">
                  {COMMON_ROOM_AMENITIES.map((am) => {
                    const active = amenities.includes(am);
                    return (
                      <button
                        key={am}
                        type="button"
                        onClick={() => toggleAmenity(am)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
                          active
                            ? 'bg-brand-blue text-white shadow-sm'
                            : 'bg-white text-content-primary-light border border-border-light hover:border-brand-blue/50'
                        }`}
                      >
                        {active && <CheckCircle2 className="w-3 h-3" />}
                        {am}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    placeholder="Add custom room amenity..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Room Photos Manager */}
              <div className="space-y-2 pt-2 border-t border-border-light">
                <label className="block font-semibold text-content-primary-light">
                  Room Photos (Image URLs)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... (Image URL)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-3.5 py-1.5 bg-brand-blue text-white rounded-lg font-bold hover:bg-brand-blue-hover transition shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {images.map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden aspect-video border border-border-light bg-surface-light">
                        <img src={url} alt="Room" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
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

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border-light font-semibold hover:bg-surface-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-brand-blue text-white font-bold hover:bg-brand-blue-hover transition flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : editingId ? (
                    'Save Changes'
                  ) : (
                    'Create Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
