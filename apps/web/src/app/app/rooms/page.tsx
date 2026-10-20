'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  BedDouble,
  PlusCircle,
  Sparkles,
  ClipboardList,
  Wrench,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Hash,
} from 'lucide-react';

export default function RoomsManagementPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Add Room Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<'single' | 'bulk'>('bulk');
  const [bulkMode, setBulkMode] = useState<'range' | 'quantity'>('range');
  const [roomNumber, setRoomNumber] = useState('');
  const [startNumber, setStartNumber] = useState('101');
  const [endNumber, setEndNumber] = useState('110');
  const [quantity, setQuantity] = useState('10');
  const [prefix, setPrefix] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [floor, setFloor] = useState('Floor 1');
  const [modalLoading, setModalLoading] = useState(false);

  const generatedRoomNumbers = useMemo(() => {
    if (creationMode === 'single') {
      return roomNumber.trim() ? [roomNumber.trim()] : [];
    }
    const start = parseInt(startNumber, 10);
    if (isNaN(start)) return [];

    let count = 0;
    if (bulkMode === 'range') {
      const end = parseInt(endNumber, 10);
      if (isNaN(end) || end < start) return [];
      count = end - start + 1;
    } else {
      count = parseInt(quantity, 10) || 0;
    }

    if (count <= 0 || count > 100) return [];

    const p = prefix.trim();
    const result: string[] = [];
    const maxVal = start + count - 1;
    const padLen = String(maxVal).length;

    for (let i = 0; i < count; i++) {
      const current = start + i;
      const numStr = String(current).padStart(padLen > 2 ? padLen : 2, '0');
      result.push(`${p}${numStr}`);
    }
    return result;
  }, [creationMode, roomNumber, bulkMode, startNumber, endNumber, quantity, prefix]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (activeProp) {
        setPropertyId(activeProp.id);
        const [rData, rtData] = await Promise.all([
          apiClient(`/rooms?property_id=${activeProp.id}`),
          apiClient(`/rooms/types?property_id=${activeProp.id}`),
        ]);
        setRooms(rData.rooms || []);
        setRoomTypes(rtData.roomTypes || []);
        if (rtData.roomTypes?.length > 0 && !roomTypeId) {
          setRoomTypeId(rtData.roomTypes[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant) fetchData();
  }, [currentTenant]);

  const handleUpdateStatus = async (roomId: string, status: string, housekeepingStatus?: string) => {
    try {
      await apiClient(`/rooms/${roomId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, housekeepingStatus }),
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generatedRoomNumbers.length === 0) {
      alert('Please specify valid room number(s)');
      return;
    }
    setModalLoading(true);
    setError(null);
    try {
      const payload: any = {
        propertyId,
        roomTypeId,
        floor,
      };

      if (creationMode === 'single') {
        payload.roomNumber = roomNumber.trim();
      } else {
        payload.roomNumbers = generatedRoomNumbers;
      }

      const res = await apiClient('/rooms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setStatusMessage(res.message || `Successfully created ${generatedRoomNumbers.length} room(s)`);
      setTimeout(() => setStatusMessage(null), 5000);
      setAddModalOpen(false);
      setRoomNumber('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add room(s).');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Rooms & Housekeeping Inventory
          </h1>
          <p className="text-xs text-content-secondary-light">
            Inspect room clean/dirty states, manage physical room inventory and floors
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          Add Rooms
        </button>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-status-success text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-status-success" />
          <span>{statusMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-status-danger text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-4">
          <BedDouble className="w-12 h-12 text-content-secondary-light mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-content-primary-light">No Rooms Created Yet</h3>
            <p className="text-xs text-content-secondary-light max-w-md mx-auto">
              Your property has no room inventory. Start by configuring your room categories (e.g. Deluxe Room, Suite), then generate your room units.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {roomTypes.length === 0 ? (
              <a
                href="/app/room-types"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                Step 1: Configure Room Categories
              </a>
            ) : (
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                Add Your First Room Unit
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-light bg-surface-light text-content-secondary-light uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Room Number</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Floor</th>
                  <th className="py-3 px-4 font-semibold">Base Price</th>
                  <th className="py-3 px-4 font-semibold">Occupancy Status</th>
                  <th className="py-3 px-4 font-semibold">Housekeeping Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {rooms.map((room) => {
                  const isOccupied = room.status === 'occupied';
                  const isClean = room.housekeeping_status === 'clean';
                  const isDirty = room.housekeeping_status === 'dirty';

                  return (
                    <tr key={room.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-bold text-content-primary-light">
                        <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded border border-border-light">
                          {room.room_number}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-content-primary-light">
                          {room.room_type_name || 'Standard'}
                        </span>
                        {room.room_type_code && (
                          <span className="ml-1.5 text-[10px] text-content-secondary-light font-mono">
                            ({room.room_type_code})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-content-secondary-light">{room.floor || 'Floor 1'}</td>
                      <td className="py-3 px-4 font-medium text-content-primary-light">
                        {formatINR(room.base_price_paise)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOccupied
                              ? 'bg-rose-50 text-status-danger border border-rose-200'
                              : 'bg-emerald-50 text-status-success border border-emerald-200'
                          }`}
                        >
                          {isOccupied ? 'Occupied' : 'Available'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isClean
                              ? 'bg-emerald-50 text-status-success border border-emerald-200'
                              : isDirty
                              ? 'bg-amber-50 text-status-warning border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isClean ? 'Clean / Ready' : isDirty ? 'Dirty / Needs Cleaning' : room.housekeeping_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isClean ? (
                            <button
                              onClick={() => handleUpdateStatus(room.id, room.status, 'dirty')}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition"
                              title="Mark Dirty"
                            >
                              Mark Dirty
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(room.id, room.status, 'clean')}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-status-success text-[10px] font-bold border border-emerald-200 transition"
                              title="Mark Clean"
                            >
                              Mark Clean
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Room Modal (Single & Bulk Range Generator) */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <div>
                <h3 className="text-base font-bold text-content-primary-light">Add Room Units</h3>
                <p className="text-[11px] text-content-secondary-light">
                  Add a single room or batch generate a room number range
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-xs font-semibold text-content-secondary-light hover:text-content-primary-light"
              >
                ✕
              </button>
            </div>

            {roomTypes.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  No Room Categories Configured
                </div>
                <p className="text-[11px] text-amber-700">
                  You need to create at least one room category (e.g. Deluxe Room, Suite) before adding room units.
                </p>
                <div className="pt-2">
                  <a
                    href="/app/room-types"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover"
                  >
                    Configure Room Categories →
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddRoom} className="space-y-4 text-xs">
                {/* Mode Selector Tabs */}
                <div className="flex p-1 bg-surface-light rounded-xl border border-border-light">
                  <button
                    type="button"
                    onClick={() => setCreationMode('bulk')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                      creationMode === 'bulk'
                        ? 'bg-white text-brand-blue shadow-sm'
                        : 'text-content-secondary-light hover:text-content-primary-light'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Bulk Range Generator
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('single')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                      creationMode === 'single'
                        ? 'bg-white text-brand-blue shadow-sm'
                        : 'text-content-secondary-light hover:text-content-primary-light'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5" /> Single Room
                  </button>
                </div>

                {/* Room Category Selection */}
                <div>
                  <label className="block font-semibold mb-1">Room Category *</label>
                  <select
                    value={roomTypeId}
                    onChange={(e) => setRoomTypeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                  >
                    {roomTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name} ({rt.code})
                      </option>
                    ))}
                  </select>
                </div>

                {creationMode === 'single' ? (
                  <div>
                    <label className="block font-semibold mb-1">Room Number *</label>
                    <input
                      type="text"
                      required
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. 101"
                      className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono font-bold"
                    />
                  </div>
                ) : (
                  <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-content-primary-light cursor-pointer">
                        <input
                          type="radio"
                          name="bulk_mode"
                          checked={bulkMode === 'range'}
                          onChange={() => setBulkMode('range')}
                          className="text-brand-blue"
                        />
                        Number Range (From - To)
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-content-primary-light cursor-pointer">
                        <input
                          type="radio"
                          name="bulk_mode"
                          checked={bulkMode === 'quantity'}
                          onChange={() => setBulkMode('quantity')}
                          className="text-brand-blue"
                        />
                        Quantity Count (From + Qty)
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1">
                          {bulkMode === 'range' ? 'Start Room No. *' : 'Starting From *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={startNumber}
                          onChange={(e) => setStartNumber(e.target.value)}
                          placeholder="101"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1">
                          {bulkMode === 'range' ? 'End Room No. *' : 'Quantity (Units) *'}
                        </label>
                        {bulkMode === 'range' ? (
                          <input
                            type="text"
                            required
                            value={endNumber}
                            onChange={(e) => setEndNumber(e.target.value)}
                            placeholder="115"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue font-mono font-bold"
                          />
                        ) : (
                          <input
                            type="number"
                            min={1}
                            max={100}
                            required
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="15"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue font-bold"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Prefix (Optional)</label>
                      <input
                        type="text"
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder="e.g. DLX- or Villa-"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue font-mono"
                      />
                    </div>

                    {generatedRoomNumbers.length > 0 ? (
                      <div className="p-2.5 bg-white rounded-lg border border-blue-200 text-[11px] text-brand-blue font-medium">
                        Will generate <span className="font-bold">{generatedRoomNumbers.length}</span> rooms:{' '}
                        <span className="font-mono">{generatedRoomNumbers.slice(0, 8).join(', ')}</span>
                        {generatedRoomNumbers.length > 8 ? ` ... ${generatedRoomNumbers[generatedRoomNumbers.length - 1]}` : ''}
                      </div>
                    ) : (
                      <p className="text-[11px] text-status-danger">
                        Enter valid room numbers (e.g. 101 to 120, max 100 per batch)
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-1">Floor Level</label>
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="Floor 1"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="flex-1 py-2 rounded-lg border border-border-light font-semibold hover:bg-surface-light"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading || generatedRoomNumbers.length === 0}
                    className="flex-1 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-hover disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {modalLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
                      </>
                    ) : creationMode === 'bulk' && generatedRoomNumbers.length > 1 ? (
                      `Generate & Add ${generatedRoomNumbers.length} Rooms`
                    ) : (
                      'Add Room'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
