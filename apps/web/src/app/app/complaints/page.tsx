'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { UrgencySirenAlert } from '@/components/UrgencySirenAlert';
import { AlertTriangle, PlusCircle, CheckCircle2, Loader2, X } from 'lucide-react';

export default function ComplaintsPage() {
  const { currentTenant, user } = useAuth();
  const userRole = (currentTenant?.role || 'owner').toLowerCase();
  const isOperatingStaff =
    userRole === 'housekeeping' ||
    userRole === 'receptionist' ||
    userRole === 'manager' ||
    userRole === 'staff';

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [category, setCategory] = useState('service');
  const [description, setDescription] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (activeProp) {
        setPropertyId(activeProp.id);
        const data = await apiClient(`/operations/complaints?property_id=${activeProp.id}`);
        setComplaints(data.complaints || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant) fetchComplaints();
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

  const handleAcknowledge = async (id: string) => {
    try {
      await apiClient(`/operations/complaints/${id}/acknowledge`, { method: 'PATCH' });
      await fetchComplaints();
    } catch (e: any) {
      alert(e.message || 'Acknowledge failed');
    }
  };

  const handleResolve = async (id: string) => {
    const notes = prompt('Enter resolution notes:', 'Resolved to guest satisfaction.');
    if (!notes) return;
    try {
      await apiClient(`/operations/complaints/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes: notes }),
      });
      await fetchComplaints();
    } catch (e: any) {
      alert(e.message || 'Resolve failed');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/operations/complaints', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          guestName,
          roomNumber,
          category,
          description,
        }),
      });
      setModalOpen(false);
      setGuestName('');
      setDescription('');
      await fetchComplaints();
    } catch (e: any) {
      alert(e.message || 'Creation failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Guest Complaints & Feedback
          </h1>
          <p className="text-xs text-content-secondary-light">
            Log, investigate, and resolve guest grievances for quality assurance
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          Log Complaint
        </button>
      </div>

      {propertyId && (
        <UrgencySirenAlert propertyId={propertyId} onRefreshNeeded={fetchComplaints} />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-3">
          <CheckCircle2 className="w-10 h-10 text-status-success mx-auto" />
          <h3 className="text-base font-bold text-content-primary-light">Zero Unresolved Grievances</h3>
          <p className="text-xs text-content-secondary-light">
            All guest complaints have been resolved or none are open currently.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Guest & Room</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Complaint Description</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {complaints.map((c) => {
                  const isUrgent = c.priority === 'urgent';
                  const isOpenUrgent = isUrgent && c.status === 'open';

                  return (
                    <tr
                      key={c.id}
                      className={`transition ${
                        isOpenUrgent
                          ? 'bg-red-50/70 border-l-4 border-l-red-600'
                          : 'hover:bg-surface-light/40'
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          {isUrgent && <span className="text-sm animate-bounce">🚨</span>}
                          <div>
                            <div className="font-bold text-content-primary-light flex items-center gap-1.5">
                              {c.guest_name}
                              {isUrgent && (
                                <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-extrabold uppercase">
                                  Urgent Siren
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-content-secondary-light">
                              {c.room_number ? `Room ${c.room_number}` : 'No room'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 capitalize font-medium">{c.category?.replace('_', ' ')}</td>
                      <td className="p-3.5 text-content-secondary-light max-w-sm truncate">{c.description}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            c.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'investigating'
                              ? 'bg-blue-100 text-blue-800'
                              : isOpenUrgent
                              ? 'bg-red-600 text-white animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status === 'investigating' ? 'Picked / In Progress' : c.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {c.status === 'open' && isOperatingStaff && (
                          <button
                            onClick={() => handleAcknowledge(c.id)}
                            className="px-2.5 py-1 rounded bg-brand-blue text-white font-bold text-[11px] hover:bg-brand-blue-hover transition shadow-sm"
                          >
                            Pick Request
                          </button>
                        )}
                        {c.status === 'open' && !isOperatingStaff && (
                          <span className="text-[11px] text-amber-700 font-medium">Awaiting Staff</span>
                        )}
                        {c.status === 'investigating' && (
                          <button
                            onClick={() => handleResolve(c.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 transition shadow-sm"
                          >
                            Mark as Closed
                          </button>
                        )}
                        {c.status === 'resolved' && (
                          <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                          </span>
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

      {/* Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="complaint-modal-title"
            className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <h3 id="complaint-modal-title" className="text-sm font-bold text-content-primary-light">Log Guest Complaint</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Guest Name *</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Siddharth Mehta"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Room Number</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="201"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="service">Room Service / Hospitality</option>
                  <option value="cleanliness">Cleanliness</option>
                  <option value="noise">Noise Disturbance</option>
                  <option value="amenities">Amenities / Wi-Fi / TV</option>
                  <option value="billing">Billing Dispute</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Issue Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Guest stated that Wi-Fi was dropping and room AC took time to cool..."
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
                  Save Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
