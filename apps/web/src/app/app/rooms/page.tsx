'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

export default function RoomsManagementPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Add Room Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [floor, setFloor] = useState('Floor 1');
  const [modalLoading, setModalLoading] = useState(false);

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
        if (rtData.roomTypes?.length > 0) {
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
    setModalLoading(true);
    setError(null);
    try {
      await apiClient('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          roomTypeId,
          roomNumber,
          floor,
        }),
      });
      setAddModalOpen(false);
      setRoomNumber('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to add room.');
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
          Add New Room
        </button>
      </div>

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
      ) : (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Room #</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Floor</th>
                  <th className="p-3.5">Occupancy State</th>
                  <th className="p-3.5">Housekeeping</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {rooms.map((room) => {
                  const isDirty = room.housekeeping_status === 'dirty';
                  const isOccupied = room.status === 'occupied';
                  const isMaint = room.status === 'maintenance';

                  return (
                    <tr key={room.id} className="hover:bg-surface-light/40 transition">
                      <td className="p-3.5 font-extrabold text-sm text-content-primary-light">
                        Room {room.room_number}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-content-primary-light">{room.room_type_name}</div>
                        <div className="text-[10px] text-content-secondary-light">{formatINR(room.base_price_paise)}/night</div>
                      </td>
                      <td className="p-3.5 text-content-secondary-light font-medium">
                        {room.floor || 'Floor 1'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isMaint
                            ? 'bg-red-100 text-red-700'
                            : isOccupied
                            ? 'bg-blue-100 text-brand-blue'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {room.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isDirty ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {room.housekeeping_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {isDirty ? (
                          <button
                            onClick={() => handleUpdateStatus(room.id, room.status, 'clean')}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 transition"
                          >
                            Mark Clean
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(room.id, room.status, 'dirty')}
                            className="px-2.5 py-1 rounded border border-border-light text-amber-700 font-semibold text-[11px] hover:bg-amber-50 transition"
                          >
                            Mark Dirty
                          </button>
                        )}
                        {!isOccupied && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(room.id, isMaint ? 'available' : 'maintenance')
                            }
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                              isMaint
                                ? 'bg-blue-600 text-white'
                                : 'border border-border-light text-content-secondary-light hover:bg-red-50 hover:text-status-danger'
                            }`}
                          >
                            {isMaint ? 'End Maintenance' : 'Maintenance'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-border-light">
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <h3 className="text-sm font-bold text-content-primary-light">Add New Room Unit</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-xs text-content-secondary-light">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="205"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Room Category *</label>
                <select
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Floor Level</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="Floor 2"
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
                  disabled={modalLoading}
                  className="flex-1 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-hover disabled:opacity-50"
                >
                  {modalLoading ? 'Adding...' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
