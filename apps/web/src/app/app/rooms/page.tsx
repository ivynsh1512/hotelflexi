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
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

export default function RoomsManagementPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  // Edit Room Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editRoomTypeId, setEditRoomTypeId] = useState('');
  const [editFloor, setEditFloor] = useState('Floor 1');
  const [editStatus, setEditStatus] = useState('available');
  const [editHousekeepingStatus, setEditHousekeepingStatus] = useState('clean');
  const [editModalLoading, setEditModalLoading] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (addModalOpen) setAddModalOpen(false);
        if (editModalOpen) {
          setEditModalOpen(false);
          setEditingRoom(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addModalOpen, editModalOpen]);

  const handleUnblockRoom = async (room: any) => {
    if (!room.block_id && !room.is_blocked) {
      // Just reset status to available
      return handleUpdateStatus(room.id, 'available');
    }
    if (!confirm(`Unblock room ${room.room_number}? It will immediately become available for bookings and occupancy.`)) {
      return;
    }
    try {
      if (room.block_id) {
        await apiClient(`/calendar/blocks/${room.block_id}`, { method: 'DELETE' });
      } else {
        await apiClient(`/rooms/${room.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'available' }),
        });
      }
      setStatusMessage(`Room ${room.room_number} unblocked successfully!`);
      setTimeout(() => setStatusMessage(null), 4000);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to unblock room');
    }
  };

  const handleUpdateStatus = async (roomId: string, status: string, housekeepingStatus?: string) => {
    try {
      await apiClient(`/rooms/${roomId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, housekeepingStatus }),
      });
      await fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:housekeeping-updated'));
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    }
  };

  const openEditModal = (room: any) => {
    setEditingRoom(room);
    setEditRoomNumber(room.room_number || '');
    setEditRoomTypeId(room.room_type_id || '');
    setEditFloor(room.floor || 'Floor 1');
    setEditStatus(room.status || 'available');
    setEditHousekeepingStatus(room.housekeeping_status || 'clean');
    setEditModalOpen(true);
  };

  const handleSaveEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    if (!editRoomNumber.trim()) {
      alert('Room number is required');
      return;
    }
    setEditModalLoading(true);
    setError(null);
    try {
      await apiClient(`/rooms/${editingRoom.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          roomNumber: editRoomNumber.trim(),
          roomTypeId: editRoomTypeId,
          floor: editFloor.trim(),
          status: editStatus,
          housekeepingStatus: editHousekeepingStatus,
        }),
      });
      setStatusMessage(`Room ${editRoomNumber.trim()} updated successfully.`);
      setTimeout(() => setStatusMessage(null), 4000);
      setEditModalOpen(false);
      setEditingRoom(null);
      await fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:housekeeping-updated'));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update room.');
    } finally {
      setEditModalLoading(false);
    }
  };

  const handleDeleteRoom = async (room: any) => {
    if (!confirm(`Are you sure you want to delete Room ${room.room_number}? This will remove it from active inventory.`)) {
      return;
    }
    try {
      await apiClient(`/rooms/${room.id}`, { method: 'DELETE' });
      setStatusMessage(`Room ${room.room_number} deleted successfully.`);
      setTimeout(() => setStatusMessage(null), 4000);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete room.');
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

  const availableCount = rooms.filter((r) => (r.status === 'available' || !r.status) && !r.is_blocked && r.status !== 'blocked').length;
  const occupiedCount = rooms.filter((r) => r.status === 'occupied').length;
  const blockedCount = rooms.filter((r) => r.status === 'blocked' || r.is_blocked).length;
  const dirtyCount = rooms.filter((r) => r.housekeeping_status === 'dirty').length;
  const maintenanceCount = rooms.filter((r) => r.status === 'maintenance').length;

  const filteredRooms = rooms.filter((r) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'available') return (r.status === 'available' || !r.status) && !r.is_blocked && r.status !== 'blocked';
    if (filterStatus === 'occupied') return r.status === 'occupied';
    if (filterStatus === 'blocked') return r.status === 'blocked' || r.is_blocked;
    if (filterStatus === 'dirty') return r.housekeeping_status === 'dirty';
    if (filterStatus === 'maintenance') return r.status === 'maintenance';
    return true;
  });

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
        <div className="space-y-3">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Rooms', count: rooms.length },
              { id: 'available', label: 'Available', count: availableCount, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              { id: 'occupied', label: 'Occupied', count: occupiedCount, color: 'text-blue-700 bg-blue-50 border-blue-200' },
              { id: 'blocked', label: 'Blocked', count: blockedCount, color: 'text-purple-700 bg-purple-50 border-purple-200' },
              { id: 'dirty', label: 'Dirty', count: dirtyCount, color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { id: 'maintenance', label: 'Maintenance', count: maintenanceCount, color: 'text-red-700 bg-red-50 border-red-200' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  filterStatus === tab.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  filterStatus === tab.id ? 'bg-white/20 text-white' : tab.color || 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

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
                {filteredRooms.map((room) => {
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
                        {isOccupied ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-status-danger border border-rose-200">
                            Occupied
                          </span>
                        ) : room.status === 'blocked' || room.is_blocked ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 w-fit">
                              Blocked
                            </span>
                            {(room.block_reason || room.blocked_until) && (
                              <span className="text-[9px] text-purple-600 font-medium">
                                {room.block_reason || 'Blocked'} {room.blocked_until ? `until ${room.blocked_until}` : ''}
                              </span>
                            )}
                          </div>
                        ) : room.status === 'maintenance' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Maintenance
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-status-success border border-emerald-200">
                            Available
                          </span>
                        )}
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
                          {(room.status === 'blocked' || room.is_blocked) && (
                            <button
                              onClick={() => handleUnblockRoom(room)}
                              className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold transition"
                              title="Unblock Room"
                            >
                              Unblock
                            </button>
                          )}
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
                          <button
                            onClick={() => openEditModal(room)}
                            className="p-1 rounded hover:bg-blue-50 text-brand-blue border border-blue-200 transition"
                            title="Edit Room"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room)}
                            className="p-1 rounded hover:bg-red-50 text-status-danger border border-red-200 transition"
                            title="Delete Room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Add Room Modal (Single & Bulk Range Generator) */}
      {addModalOpen && (
        <div
          onClick={() => setAddModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-room-modal-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <div>
                <h3 id="add-room-modal-title" className="text-base font-bold text-content-primary-light">Add Room Units</h3>
                <p className="text-[11px] text-content-secondary-light">
                  Add a single room or batch generate a room number range
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
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

      {/* Edit Room Modal */}
      {editModalOpen && editingRoom && (
        <div
          onClick={() => {
            setEditModalOpen(false);
            setEditingRoom(null);
          }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-room-modal-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <div>
                <h3 id="edit-room-modal-title" className="text-base font-bold text-content-primary-light">
                  Edit Room {editingRoom.room_number}
                </h3>
                <p className="text-[11px] text-content-secondary-light">
                  Update room number, category, floor level, and status
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingRoom(null);
                }}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRoom} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  value={editRoomNumber}
                  onChange={(e) => setEditRoomNumber(e.target.value)}
                  placeholder="e.g. 101"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Room Category *</label>
                <select
                  value={editRoomTypeId}
                  onChange={(e) => setEditRoomTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} ({rt.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Floor Level</label>
                <input
                  type="text"
                  value={editFloor}
                  onChange={(e) => setEditFloor(e.target.value)}
                  placeholder="e.g. Floor 1, Ground Floor"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Occupancy Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="blocked">Blocked</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Housekeeping Status</label>
                  <select
                    value={editHousekeepingStatus}
                    onChange={(e) => setEditHousekeepingStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                  >
                    <option value="clean">Clean / Ready</option>
                    <option value="dirty">Dirty / Needs Cleaning</option>
                    <option value="inspecting">Inspecting</option>
                    <option value="out_of_order">Out of Order</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingRoom(null);
                  }}
                  className="flex-1 py-2 rounded-lg border border-border-light font-semibold hover:bg-surface-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editModalLoading}
                  className="flex-1 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-hover disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {editModalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Changes'
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
