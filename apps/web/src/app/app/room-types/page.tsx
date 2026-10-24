'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Upload,
  X,
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

// Helper to compress uploaded images to data URLs
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressed);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

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
  // Numeric inputs as string so backspacing "0" works cleanly
  const [basePrice, setBasePrice] = useState('2500');
  const [weekendPrice, setWeekendPrice] = useState('2800');
  const [baseOccupancy, setBaseOccupancy] = useState('2');
  const [maxOccupancy, setMaxOccupancy] = useState('3');
  const [extraAdultCharge, setExtraAdultCharge] = useState('');
  const [extraChildCharge, setExtraChildCharge] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick room generation state (for new categories)
  const [quickCreateRooms, setQuickCreateRooms] = useState(false);
  const [quickStartNumber, setQuickStartNumber] = useState('101');
  const [quickEndNumber, setQuickEndNumber] = useState('110');
  const [quickFloor, setQuickFloor] = useState('Floor 1');
  const [quickPrefix, setQuickPrefix] = useState('');

  const quickRoomPreview = useMemo(() => {
    if (!quickCreateRooms) return [];
    const start = parseInt(quickStartNumber, 10);
    const end = parseInt(quickEndNumber, 10);
    if (isNaN(start) || isNaN(end) || start > end || end - start > 100) return [];
    const list: string[] = [];
    const padLen = String(end).length;
    for (let i = start; i <= end; i++) {
      const numStr = String(i).padStart(padLen > 2 ? padLen : 2, '0');
      list.push(`${quickPrefix.trim()}${numStr}`);
    }
    return list;
  }, [quickCreateRooms, quickStartNumber, quickEndNumber, quickPrefix]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setBasePrice('2500');
    setWeekendPrice('2800');
    setBaseOccupancy('2');
    setMaxOccupancy('3');
    setExtraAdultCharge('500');
    setExtraChildCharge('250');
    setDescription('');
    setAmenities(['King Bed', 'Air Conditioning', 'Free High-Speed Wi-Fi', 'Geyser / 24hr Hot Water']);
    setImages([]);
    setNewImageUrl('');
    setCustomAmenity('');
    setQuickCreateRooms(false);
    setQuickStartNumber('101');
    setQuickEndNumber('110');
    setQuickFloor('Floor 1');
    setQuickPrefix('');
    setModalOpen(true);
  };

  const handleOpenEdit = (rt: any) => {
    setEditingId(rt.id);
    setName(rt.name || '');
    setCode(rt.code || '');
    setBasePrice(rt.base_price_paise ? String(rt.base_price_paise / 100) : '2500');
    setWeekendPrice(rt.weekend_price_paise ? String(rt.weekend_price_paise / 100) : '');
    setBaseOccupancy(String(rt.base_occupancy || 2));
    setMaxOccupancy(String(rt.max_occupancy || 3));
    setExtraAdultCharge(rt.extra_adult_price_paise ? String(rt.extra_adult_price_paise / 100) : '0');
    setExtraChildCharge(rt.extra_child_price_paise ? String(rt.extra_child_price_paise / 100) : '0');
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
    setQuickCreateRooms(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await compressImageFile(file);
        compressedList.push(dataUrl);
      }
      setImages((prev) => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('Failed to upload image. Please check file format.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
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
      const parsedBasePrice = parseFloat(basePrice) || 0;
      const parsedWeekendPrice = weekendPrice.trim() ? parseFloat(weekendPrice) || 0 : null;
      const parsedBaseOcc = parseInt(baseOccupancy, 10) || 1;
      const parsedMaxOcc = parseInt(maxOccupancy, 10) || 1;
      const parsedExtraAdultPrice = extraAdultCharge.trim() ? Math.round(parseFloat(extraAdultCharge) * 100) : 0;
      const parsedExtraChildPrice = extraChildCharge.trim() ? Math.round(parseFloat(extraChildCharge) * 100) : 0;

      if (editingId) {
        // Update existing room type
        await apiClient(`/rooms/types/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            basePricePaise: Math.round(parsedBasePrice * 100),
            weekendPricePaise: parsedWeekendPrice !== null ? Math.round(parsedWeekendPrice * 100) : null,
            extraAdultPricePaise: parsedExtraAdultPrice,
            extraChildPricePaise: parsedExtraChildPrice,
            baseOccupancy: parsedBaseOcc,
            maxOccupancy: parsedMaxOcc,
            description,
            amenities,
            images,
          }),
        });
      } else {
        // Create new room type
        const res = await apiClient('/rooms/types', {
          method: 'POST',
          body: JSON.stringify({
            propertyId,
            name,
            code: code || name.slice(0, 3).toUpperCase(),
            basePricePaise: Math.round(parsedBasePrice * 100),
            weekendPricePaise: parsedWeekendPrice !== null ? Math.round(parsedWeekendPrice * 100) : null,
            extraAdultPricePaise: parsedExtraAdultPrice,
            extraChildPricePaise: parsedExtraChildPrice,
            baseOccupancy: parsedBaseOcc,
            maxOccupancy: parsedMaxOcc,
            description,
            amenities,
            images,
          }),
        });

        // If quick room generation is enabled
        if (quickCreateRooms && quickRoomPreview.length > 0 && res.id) {
          try {
            await apiClient('/rooms', {
              method: 'POST',
              body: JSON.stringify({
                propertyId,
                roomTypeId: res.id,
                roomNumbers: quickRoomPreview,
                floor: quickFloor || 'Floor 1',
              }),
            });
          } catch (rErr: any) {
            console.warn('Category created, but room generation warning:', rErr);
          }
        }
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

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-black text-content-primary-light">
                        {formatINR(rt.base_price_paise)}
                      </span>
                      <span className="text-[11px] text-content-secondary-light">/ night</span>

                      {rt.weekend_price_paise && (
                        <span className="ml-auto text-[11px] font-semibold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                          Weekend: {formatINR(rt.weekend_price_paise)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 text-xs text-content-secondary-light pb-3 border-b border-border-light">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-brand-blue" />
                          {rt.base_occupancy || 2} Base / {rt.max_occupancy || 3} Max Guests
                        </span>
                        {rt.total_units !== undefined && (
                          <span className="font-semibold text-slate-700">
                            {rt.total_units} unit{rt.total_units === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                      {rt.extra_adult_price_paise > 0 && (
                        <div className="text-[11px] text-emerald-700 font-medium">
                          + Extra guest: {formatINR(rt.extra_adult_price_paise)} / night
                        </div>
                      )}
                    </div>

                    {rtAmenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-3">
                        {rtAmenities.slice(0, 4).map((am: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-surface-light border border-border-light text-[10px] text-content-secondary-light font-medium"
                          >
                            {am}
                          </span>
                        ))}
                        {rtAmenities.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] text-brand-blue font-bold">
                            +{rtAmenities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border-light flex justify-end">
                    <button
                      onClick={() => handleOpenEdit(rt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-light hover:bg-surface-light text-xs font-semibold text-content-primary-light transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Details & Pricing
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
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-cat-modal-title"
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border-light max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <h3 id="room-cat-modal-title" className="text-base font-bold text-content-primary-light">
                {editingId ? 'Edit Room Category' : 'Create Room Category'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingId && !code) {
                        setCode(e.target.value.slice(0, 3).toUpperCase());
                      }
                    }}
                    placeholder="Deluxe King Room"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Code *</label>
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
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Weekend Price (₹)</label>
                  <input
                    type="number"
                    value={weekendPrice}
                    onChange={(e) => setWeekendPrice(e.target.value)}
                    placeholder="2800"
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
                    onChange={(e) => setBaseOccupancy(e.target.value)}
                    placeholder="2"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <span className="text-[10px] text-content-secondary-light">Included in base price</span>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Occupancy</label>
                  <input
                    type="number"
                    min={1}
                    value={maxOccupancy}
                    onChange={(e) => setMaxOccupancy(e.target.value)}
                    placeholder="3"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <span className="text-[10px] text-content-secondary-light">Max guests per room</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Extra Adult Charge (₹ / night)</label>
                  <input
                    type="number"
                    min={0}
                    value={extraAdultCharge}
                    onChange={(e) => setExtraAdultCharge(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <span className="text-[10px] text-content-secondary-light">Surcharge when guests exceed base occupancy</span>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Extra Child Charge (₹ / night)</label>
                  <input
                    type="number"
                    min={0}
                    value={extraChildCharge}
                    onChange={(e) => setExtraChildCharge(e.target.value)}
                    placeholder="250"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <span className="text-[10px] text-content-secondary-light">Optional surcharge per child</span>
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

              {/* Quick Room Units Generation (Only for new category) */}
              {!editingId && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/70 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={quickCreateRooms}
                      onChange={(e) => setQuickCreateRooms(e.target.checked)}
                      className="rounded text-brand-blue h-4 w-4"
                    />
                    <span className="font-bold text-content-primary-light text-xs">
                      ⚡ Quick Create Rooms for this Category (Optional)
                    </span>
                  </label>

                  {quickCreateRooms && (
                    <div className="space-y-2 pt-1 text-xs">
                      <p className="text-[11px] text-content-secondary-light">
                        Automatically generate room units so you don't have to add them one by one.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-content-primary-light mb-1">
                            Starting Room No. *
                          </label>
                          <input
                            type="text"
                            value={quickStartNumber}
                            onChange={(e) => setQuickStartNumber(e.target.value)}
                            placeholder="101"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border-light text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-content-primary-light mb-1">
                            Ending Room No. *
                          </label>
                          <input
                            type="text"
                            value={quickEndNumber}
                            onChange={(e) => setQuickEndNumber(e.target.value)}
                            placeholder="110"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border-light text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-content-primary-light mb-1">
                            Floor Level
                          </label>
                          <input
                            type="text"
                            value={quickFloor}
                            onChange={(e) => setQuickFloor(e.target.value)}
                            placeholder="Floor 1"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border-light text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-content-primary-light mb-1">
                            Prefix (Optional)
                          </label>
                          <input
                            type="text"
                            value={quickPrefix}
                            onChange={(e) => setQuickPrefix(e.target.value)}
                            placeholder="e.g. D-"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border-light text-xs font-mono"
                          />
                        </div>
                      </div>

                      {quickRoomPreview.length > 0 ? (
                        <div className="p-2 bg-white rounded-lg border border-blue-200 text-[11px] text-brand-blue font-medium">
                          Will generate <span className="font-bold">{quickRoomPreview.length}</span> rooms:{' '}
                          <span className="font-mono">{quickRoomPreview.slice(0, 6).join(', ')}</span>
                          {quickRoomPreview.length > 6 ? ` ... ${quickRoomPreview[quickRoomPreview.length - 1]}` : ''}
                        </div>
                      ) : (
                        <p className="text-[11px] text-status-danger">
                          Enter valid numbers (e.g. 101 to 110, max 100 rooms per batch)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

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

              {/* Room Photos Manager (Direct Upload + Preview) */}
              <div className="space-y-2 pt-2 border-t border-border-light">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-content-primary-light">
                    Room Photos
                  </label>
                  <span className="text-[11px] text-content-secondary-light">
                    {images.length} photo{images.length === 1 ? '' : 's'} added
                  </span>
                </div>

                {/* Direct File Upload Button */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="device-photo-upload"
                    className="cursor-pointer inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-brand-blue font-semibold border border-blue-200 transition text-xs flex-1 text-center"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading & Compressing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload Photos from Device (Camera / Gallery)</span>
                      </>
                    )}
                  </label>
                  <input
                    id="device-photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImage}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Optional Image URL Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Or paste external image URL..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-3 py-1.5 bg-surface-light border border-border-light text-content-primary-light rounded-lg font-semibold hover:bg-slate-100 transition shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add URL
                  </button>
                </div>

                {/* Thumbnails Gallery */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                    {images.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden aspect-video border border-border-light bg-surface-light shadow-sm"
                      >
                        <img src={url} alt={`Room ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full opacity-80 hover:opacity-100 transition shadow"
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
                  disabled={saving || uploadingImage}
                  className="flex-1 py-2.5 rounded-lg bg-brand-blue text-white font-bold hover:bg-brand-blue-hover transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : editingId ? (
                    'Save Changes'
                  ) : quickCreateRooms && quickRoomPreview.length > 0 ? (
                    `Create Category & ${quickRoomPreview.length} Rooms`
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
