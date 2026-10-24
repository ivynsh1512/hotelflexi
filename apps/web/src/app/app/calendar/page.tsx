'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Lock,
  PlusCircle,
  TrendingUp,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function CalendarPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState<string>('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState(14);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);

  // Block Modal
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockMode, setBlockMode] = useState<'single' | 'bulk'>('single');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('maintenance');
  const [blockNotes, setBlockNotes] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bulk Rate Update Modal
  const [bulkRateModalOpen, setBulkRateModalOpen] = useState(false);
  const [bulkRateRoomTypeId, setBulkRateRoomTypeId] = useState<string>('all');
  const [bulkRateStart, setBulkRateStart] = useState(() => new Date().toISOString().split('T')[0]);
  const [bulkRateEnd, setBulkRateEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [bulkRatePrice, setBulkRatePrice] = useState('3500');
  const [bulkRateSubmitting, setBulkRateSubmitting] = useState(false);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchGrid = async (propId: string, start: string, numDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient(`/calendar/grid?property_id=${propId}&start_date=${start}&days=${numDays}`);
      setRooms(data.rooms || []);
      setReservations(data.reservations || []);
      setBlocks(data.blocks || []);
    } catch (err: any) {
      console.error('Failed to fetch calendar:', err);
      setError(err.message || 'Error loading calendar grid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      if (!currentTenant) return;
      try {
        const propData = await apiClient('/properties');
        const activeProp = propData.properties?.[0];
        if (activeProp) {
          setPropertyId(activeProp.id);
          await fetchGrid(activeProp.id, startDate, days);
          try {
            const rtData = await apiClient(`/rooms/types?property_id=${activeProp.id}`);
            setRoomTypes(rtData.roomTypes || []);
          } catch (rte) {
            console.warn('Failed to load room types for bulk rate modal:', rte);
          }
        }
      } catch (e: any) {
        setError('Failed to fetch properties.');
        setLoading(false);
      }
    }
    init();
  }, [currentTenant]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (blockModalOpen) setBlockModalOpen(false);
        if (bulkRateModalOpen) setBulkRateModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blockModalOpen, bulkRateModalOpen]);

  // Generate array of day dates
  const dateList: string[] = [];
  const startObj = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const cur = new Date(startObj);
    cur.setDate(cur.getDate() + i);
    dateList.push(cur.toISOString().split('T')[0]);
  }

  const shiftDates = (delta: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + delta);
    const newStart = d.toISOString().split('T')[0];
    setStartDate(newStart);
    if (propertyId) fetchGrid(propertyId, newStart, days);
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const selectAllRooms = () => {
    setSelectedRoomIds(rooms.map((r) => r.id));
  };

  const deselectAllRooms = () => {
    setSelectedRoomIds([]);
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (blockStart < todayStr) {
      alert('Please enter present or future dates. Cannot block rooms for past dates.');
      return;
    }

    if (blockMode === 'bulk' && selectedRoomIds.length === 0) {
      alert('Please select at least one room to block.');
      return;
    }

    setModalLoading(true);
    setError(null);

    try {
      const payload: any = {
        propertyId,
        startDate: blockStart,
        endDate: blockEnd,
        reason: blockReason,
        notes: blockNotes,
      };

      if (blockMode === 'bulk') {
        payload.roomIds = selectedRoomIds;
      } else {
        payload.roomId = selectedRoomId;
      }

      const res = await apiClient('/calendar/blocks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert(res.message || 'Room(s) blocked successfully.');
      setBlockModalOpen(false);
      setSelectedRoomIds([]);
      await fetchGrid(propertyId, startDate, days);
    } catch (err: any) {
      setError(err.message || 'Failed to create room block.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleReleaseBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to release this room block?')) return;
    try {
      await apiClient(`/calendar/blocks/${blockId}`, { method: 'DELETE' });
      if (propertyId) await fetchGrid(propertyId, startDate, days);
    } catch (err: any) {
      alert(err.message || 'Failed to release block');
    }
  };

  const handleBulkRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(bulkRatePrice);
    if (!priceNum || priceNum <= 0) {
      alert('Please enter a valid nightly rate in ₹.');
      return;
    }
    if (!bulkRateStart || !bulkRateEnd) {
      alert('Please select both start and end dates.');
      return;
    }
    if (bulkRateEnd < bulkRateStart) {
      alert('End date must be on or after start date.');
      return;
    }

    setBulkRateSubmitting(true);
    try {
      const pricePaise = Math.round(priceNum * 100);
      const targets =
        bulkRateRoomTypeId === 'all'
          ? roomTypes.map((rt) => rt.id)
          : [bulkRateRoomTypeId];

      if (targets.length === 0) {
        alert('No room types available to update rates.');
        setBulkRateSubmitting(false);
        return;
      }

      for (const rtId of targets) {
        await apiClient('/daily-rates', {
          method: 'POST',
          body: JSON.stringify({
            propertyId,
            roomTypeId: rtId,
            pricePaise,
            startDate: bulkRateStart,
            endDate: bulkRateEnd,
            note: 'Bulk Rate Update via Calendar Grid',
          }),
        });
      }

      alert(`Successfully updated rate to ₹${priceNum.toLocaleString('en-IN')}/night for ${targets.length} room category(ies)!`);
      setBulkRateModalOpen(false);
      if (propertyId) await fetchGrid(propertyId, startDate, days);
    } catch (err: any) {
      alert(err.message || 'Failed to apply bulk rates.');
    } finally {
      setBulkRateSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Room Calendar & Availability Grid
          </h1>
          <p className="text-xs text-content-secondary-light">
            Room-wise booking matrix with real-time occupancy and block management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border-light bg-white p-1">
            <button
              onClick={() => shiftDates(-7)}
              className="p-1 rounded hover:bg-surface-light text-content-secondary-light"
              title="Previous 7 Days"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-content-primary-light font-mono">
              {startDate}
            </span>
            <button
              onClick={() => shiftDates(7)}
              className="p-1 rounded hover:bg-surface-light text-content-secondary-light"
              title="Next 7 Days"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <select
            value={days}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setDays(val);
              if (propertyId) fetchGrid(propertyId, startDate, val);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-light bg-white text-content-primary-light"
          >
            <option value={7}>7 Days View</option>
            <option value={14}>14 Days View</option>
            <option value={30}>30 Days View</option>
          </select>

          <button
            onClick={() => {
              if (rooms.length > 0) setSelectedRoomId(rooms[0].id);
              setBlockStart(startDate);
              const d = new Date(startDate);
              d.setDate(d.getDate() + 2);
              setBlockEnd(d.toISOString().split('T')[0]);
              setBlockModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-light border border-border-light text-xs font-semibold text-content-primary-light hover:bg-white"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            Block Room
          </button>

          <button
            onClick={() => setBulkRateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Bulk Rate Update
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-status-danger text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-4">
          <CalendarIcon className="w-12 h-12 text-content-secondary-light mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-content-primary-light">No Rooms Available for Calendar</h3>
            <p className="text-xs text-content-secondary-light max-w-md mx-auto">
              The front desk calendar shows live room occupancy and reservation spans. Add your rooms to start seeing bookings here.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="/app/rooms"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Configure Rooms Now
            </a>
          </div>
        </div>
      ) : (
        /* Calendar Grid Table */
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-surface-light border-b border-border-light">
                  <th className="p-3 font-bold text-content-primary-light w-44 sticky left-0 bg-surface-light z-10 border-r border-border-light">
                    Room Details
                  </th>
                  {dateList.map((d) => {
                    const dateObj = new Date(d);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = dateObj.getDate();
                    const isToday = d === new Date().toISOString().split('T')[0];
                    return (
                      <th
                        key={d}
                        className={`p-2 text-center border-r border-border-light min-w-[70px] ${
                          isToday ? 'bg-blue-50 text-brand-blue font-bold' : 'text-content-secondary-light font-medium'
                        }`}
                      >
                        <div className="text-[10px] uppercase">{dayName}</div>
                        <div className="text-xs font-bold">{dayNum}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-surface-light/40 transition">
                    {/* Room Header Col */}
                    <td className="p-3 sticky left-0 bg-white z-10 border-r border-border-light">
                      <div className="font-extrabold text-content-primary-light text-sm flex items-center gap-1.5">
                        <span>Room {room.room_number}</span>
                        {room.housekeeping_status === 'dirty' && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title="Dirty" />
                        )}
                      </div>
                      <div className="text-[10px] text-content-secondary-light truncate">
                        {room.room_type_name} • {formatINR(room.base_price_paise)}
                      </div>
                    </td>

                    {/* Day Cells */}
                    {dateList.map((dateStr) => {
                      // Check active reservation
                      const res = reservations.find(
                        (r) => r.room_id === room.id && r.check_in_date <= dateStr && r.check_out_date > dateStr
                      );

                      // Check active room block
                      const blk = blocks.find(
                        (b) => b.room_id === room.id && b.start_date <= dateStr && b.end_date > dateStr
                      );

                      if (res) {
                        return (
                          <td
                            key={dateStr}
                            className="p-1 border-r border-border-light text-center bg-blue-100/70 border-b-2 border-b-brand-blue"
                            title={`Reservation #${res.reservation_number} (${res.guest_name})`}
                          >
                            <div className="truncate text-[10px] font-bold text-brand-blue">
                              {res.guest_name?.split(' ')[0] || 'Booked'}
                            </div>
                            <div className="text-[8px] font-mono text-content-secondary-light">
                              {res.status === 'checked_in' ? 'In-House' : 'Confirmed'}
                            </div>
                          </td>
                        );
                      }

                      if (blk) {
                        return (
                          <td
                            key={dateStr}
                            onClick={() => handleReleaseBlock(blk.id)}
                            className="p-1 border-r border-border-light text-center bg-amber-100/80 border-b-2 border-b-amber-500 cursor-pointer hover:bg-amber-200 transition shadow-inner"
                            title={`Blocked for ${blk.reason}. Click to release.`}
                          >
                            <div className="flex items-center justify-center gap-0.5 text-[9px] font-bold text-amber-900 uppercase truncate">
                              <Lock className="w-2.5 h-2.5 shrink-0 text-amber-700" />
                              <span>{blk.reason}</span>
                            </div>
                            <div className="text-[8px] font-semibold text-amber-700">Blocked</div>
                          </td>
                        );
                      }

                      // Free / Available
                      return (
                        <td
                          key={dateStr}
                          onClick={() => {
                            setSelectedRoomId(room.id);
                            setBlockStart(dateStr);
                            const next = new Date(dateStr);
                            next.setDate(next.getDate() + 1);
                            setBlockEnd(next.toISOString().split('T')[0]);
                            setBlockModalOpen(true);
                          }}
                          className="p-1 border-r border-border-light text-center hover:bg-emerald-50/50 cursor-pointer"
                          title="Available. Click to block room."
                        >
                          <div className="text-[10px] text-emerald-600/50 font-bold">•</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Block Room Modal */}
      {blockModalOpen && (
        <div
          onClick={() => setBlockModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-room-modal-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <h3 id="block-room-modal-title" className="text-base font-bold text-content-primary-light flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                Block Room for Maintenance / Owner
              </h3>
              <button
                type="button"
                onClick={() => setBlockModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-4 text-xs">
              {/* Mode Toggle: Single vs Bulk */}
              <div className="flex p-1 bg-surface-light rounded-xl border border-border-light">
                <button
                  type="button"
                  onClick={() => setBlockMode('single')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                    blockMode === 'single'
                      ? 'bg-white text-amber-700 shadow-sm'
                      : 'text-content-secondary-light hover:text-content-primary-light'
                  }`}
                >
                  Single Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBlockMode('bulk');
                    if (selectedRoomIds.length === 0 && rooms.length > 0) {
                      setSelectedRoomIds([rooms[0].id]);
                    }
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                    blockMode === 'bulk'
                      ? 'bg-white text-amber-700 shadow-sm'
                      : 'text-content-secondary-light hover:text-content-primary-light'
                  }`}
                >
                  Bulk Rooms (Multi-Select)
                </button>
              </div>

              {blockMode === 'single' ? (
                <div>
                  <label className="block font-semibold text-content-primary-light mb-1">Select Room *</label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} ({r.room_type_name})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-900">
                      Select Rooms to Block ({selectedRoomIds.length} of {rooms.length})
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllRooms}
                        className="text-[10px] text-amber-800 font-bold hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-amber-400">|</span>
                      <button
                        type="button"
                        onClick={deselectAllRooms}
                        className="text-[10px] text-amber-800 font-bold hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-1.5 p-1 bg-white rounded-lg border border-amber-200">
                    {rooms.map((r) => {
                      const isSelected = selectedRoomIds.includes(r.id);
                      return (
                        <label
                          key={r.id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded border text-[11px] cursor-pointer transition ${
                            isSelected
                              ? 'bg-amber-100/70 border-amber-400 font-bold text-amber-900'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRoomSelection(r.id)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span className="font-mono">#{r.room_number}</span>
                          <span className="truncate text-[10px] text-slate-500">({r.room_type_name})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-content-primary-light mb-1">From (Inclusive) *</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-content-primary-light mb-1">To (Exclusive) *</label>
                  <input
                    type="date"
                    required
                    min={blockStart || todayStr}
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-content-primary-light mb-1">Reason *</label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="maintenance">Maintenance / Repair</option>
                  <option value="owner_use">Owner Use</option>
                  <option value="deep_cleaning">Deep Cleaning</option>
                  <option value="renovation">Renovation</option>
                  <option value="event">Private Event</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-content-primary-light mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  placeholder="AC compressor repair, painting..."
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setBlockModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-border-light font-semibold hover:bg-surface-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || (blockMode === 'bulk' && selectedRoomIds.length === 0)}
                  className="flex-1 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-50"
                >
                  {modalLoading
                    ? 'Blocking...'
                    : blockMode === 'bulk'
                    ? `Block ${selectedRoomIds.length} Rooms`
                    : 'Block Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Rate Update Modal */}
      {bulkRateModalOpen && (
        <div
          onClick={() => setBulkRateModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-rate-modal-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <h3 id="bulk-rate-modal-title" className="text-base font-bold text-content-primary-light flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Bulk Rate & Price Matrix Update
              </h3>
              <button
                type="button"
                onClick={() => setBulkRateModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkRateSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                Update room rates in bulk across custom date windows. These override base prices and immediately sync to the booking engine and OTA channel manager.
              </div>

              <div>
                <label className="block font-semibold text-content-primary-light mb-1">
                  Target Room Category *
                </label>
                <select
                  value={bulkRateRoomTypeId}
                  onChange={(e) => setBulkRateRoomTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="all">All Room Types ({roomTypes.length} Categories)</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} ({rt.code}) — Current Base: {formatINR(rt.base_price_paise)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-content-primary-light mb-1">
                    Start Date (Inclusive) *
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={bulkRateStart}
                    onChange={(e) => setBulkRateStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-content-primary-light mb-1">
                    End Date (Inclusive) *
                  </label>
                  <input
                    type="date"
                    required
                    min={bulkRateStart || todayStr}
                    value={bulkRateEnd}
                    onChange={(e) => setBulkRateEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-content-primary-light mb-1">
                  New Nightly Rate (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    required
                    value={bulkRatePrice}
                    onChange={(e) => setBulkRatePrice(e.target.value)}
                    placeholder="3500"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
                <p className="text-[10px] text-content-secondary-light mt-1">
                  Sets the standard per-night rate. Tax and extra adult charges will be calculated on top.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setBulkRateModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-border-light font-semibold hover:bg-surface-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkRateSubmitting}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {bulkRateSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Apply Bulk Rates'
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
