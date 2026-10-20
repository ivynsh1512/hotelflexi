'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { UrgencySirenAlert } from '@/components/UrgencySirenAlert';
import {
  ClipboardList,
  PlusCircle,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  User,
  UserCheck,
  X,
} from 'lucide-react';

export default function HousekeepingPage() {
  const { currentTenant, user } = useAuth();
  const userRole = (currentTenant?.role || 'owner').toLowerCase();
  const isOperatingStaff =
    userRole === 'housekeeping' ||
    userRole === 'receptionist' ||
    userRole === 'manager' ||
    userRole === 'staff';

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');

  // New task modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [taskType, setTaskType] = useState('cleaning');
  const [priority, setPriority] = useState('urgent');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (activeProp) {
        setPropertyId(activeProp.id);
        const [tData, rData, teamData] = await Promise.all([
          apiClient(`/operations/housekeeping?property_id=${activeProp.id}`),
          apiClient(`/rooms?property_id=${activeProp.id}`),
          apiClient('/team/members').catch(() => ({ members: [] })),
        ]);
        setTasks(tData.tasks || []);
        setRooms(rData.rooms || []);
        setStaffList(teamData.members || []);
        if (rData.rooms?.length > 0 && !selectedRoomId) {
          setSelectedRoomId(rData.rooms[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load housekeeping tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant) fetchTasks();
  }, [currentTenant]);

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await apiClient(`/operations/housekeeping/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await fetchTasks();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:housekeeping-updated'));
      }
    } catch (e: any) {
      alert(e.message || 'Status update failed.');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      alert('Please select a room.');
      return;
    }
    try {
      setSubmitting(true);
      await apiClient('/operations/housekeeping', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          roomId: selectedRoomId,
          taskType,
          priority,
          notes,
          assignedToUserId: assignedToUserId || undefined,
        }),
      });
      setModalOpen(false);
      setNotes('');
      setAssignedToUserId('');
      await fetchTasks();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:housekeeping-updated'));
      }
    } catch (e: any) {
      alert(e.message || 'Task creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Housekeeping Tasks
          </h1>
          <p className="text-xs text-content-secondary-light">
            Assign room cleaning, deep sanitation, and inspect room readiness with assigned staff
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          Assign Housekeeping Task
        </button>
      </div>

      {propertyId && (
        <UrgencySirenAlert propertyId={propertyId} onRefreshNeeded={fetchTasks} />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-3">
          <ClipboardList className="w-10 h-10 text-content-secondary-light mx-auto" />
          <h3 className="text-base font-bold text-content-primary-light">No Pending Tasks</h3>
          <p className="text-xs text-content-secondary-light">
            All rooms are inspected and clean. New checkout cleanings will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Room</th>
                  <th className="p-3.5">Task Type</th>
                  <th className="p-3.5">Assigned To</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Scheduled</th>
                  <th className="p-3.5">Notes</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-surface-light/40 transition">
                    <td className="p-3.5 font-bold text-sm text-content-primary-light">
                      Room {task.room_number}
                    </td>
                    <td className="p-3.5 capitalize font-medium">{task.task_type?.replace('_', ' ')}</td>
                    <td className="p-3.5">
                      {task.assigned_to_name ? (
                        <div className="flex items-center gap-1.5 font-semibold text-content-primary-light">
                          <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-bold">
                            {task.assigned_to_name[0]}
                          </div>
                          <span>{task.assigned_to_name}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-content-secondary-light italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          task.priority === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-brand-blue'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-3.5 text-content-secondary-light">{task.scheduled_date}</td>
                    <td className="p-3.5 text-content-secondary-light max-w-xs truncate">{task.notes || '—'}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          task.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'in_progress'
                            ? 'bg-blue-100 text-brand-blue'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {task.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {task.status === 'pending' && isOperatingStaff && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                          className="px-2.5 py-1 rounded bg-brand-blue text-white font-semibold text-[11px] hover:bg-brand-blue-hover transition shadow-sm"
                        >
                          Pick / Start
                        </button>
                      )}
                      {task.status === 'pending' && !isOperatingStaff && (
                        <span className="text-[11px] text-amber-700 font-medium">Awaiting Staff</span>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'completed')}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 transition shadow-sm"
                        >
                          Mark Completed
                        </button>
                      )}
                      {task.status === 'completed' && (
                        <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Cleaned
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <h3 className="text-sm font-bold text-content-primary-light">Assign Housekeeping Task</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Room *</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                >
                  <option value="" disabled>Choose a room...</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} ({r.room_type_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Assign To (Staff Member / Housekeeper)</label>
                <select
                  value={assignedToUserId}
                  onChange={(e) => setAssignedToUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">-- Unassigned / Any Available Staff --</option>
                  {staffList.map((st) => (
                    <option key={st.user_id} value={st.user_id}>
                      {st.full_name || st.email} ({st.role})
                    </option>
                  ))}
                </select>
                {staffList.length === 0 && (
                  <p className="text-[10px] text-content-secondary-light mt-1">
                    No staff members registered yet. Add staff under Settings &gt; Staff &amp; Team.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Task Type</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="cleaning">Checkout Cleaning</option>
                    <option value="deep_cleaning">Deep Sanitization</option>
                    <option value="linen_change">Linen &amp; Towel Change</option>
                    <option value="inspection">Supervisor Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="medium">Medium</option>
                    <option value="high">High (Arrival soon)</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Extra clean bathroom, restock tea kit..."
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
                  disabled={submitting}
                  className="flex-1 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-hover disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
