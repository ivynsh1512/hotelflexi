'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import { Tag, PlusCircle, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RoomTypesPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [basePrice, setBasePrice] = useState(2500);
  const [weekendPrice, setWeekendPrice] = useState(2800);
  const [baseOccupancy, setBaseOccupancy] = useState(2);
  const [maxOccupancy, setMaxOccupancy] = useState(3);
  const [description, setDescription] = useState('');
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

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
        }),
      });
      setModalOpen(false);
      setName('');
      await fetchRoomTypes();
    } catch (err: any) {
      alert(err.message || 'Failed to create room type');
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
            Configure room types, standard tariffs, weekend premiums, and occupancy limits
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((rt) => (
            <div key={rt.id} className="p-6 rounded-2xl bg-white border border-border-light shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-content-primary-light">{rt.name}</h3>
                  <span className="font-mono text-xs font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                    {rt.code}
                  </span>
                </div>
                <p className="text-xs text-content-secondary-light mb-4 line-clamp-2">
                  {rt.description || 'Standard room category with premium amenities.'}
                </p>

                <div className="space-y-2 text-xs border-t border-border-light pt-3">
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
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light">
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <h3 className="text-sm font-bold text-content-primary-light">Create Room Category</h3>
              <button onClick={() => setModalOpen(false)} className="text-xs text-content-secondary-light">✕</button>
            </div>

            <form onSubmit={handleCreateType} className="space-y-4 text-xs">
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

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-border-light font-semibold hover:bg-surface-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-hover"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
