'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { ClipboardList, PlusCircle, CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';

export default function HousekeepingPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');

  // New task modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [taskType, setTaskType] = useState('cleaning');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (activeProp) {
        setPropertyId(activeProp.id);
        const [tData, rData] = await Promise.all([
          apiClient(`/operations/housekeeping?property_id=${activeProp.id}`),
          apiClient(`/rooms?property_id=${activeProp.id}`),
        ]);
        setTasks(tData.tasks || []);
        setRooms(rData.rooms || []);
        if (rData.rooms?.length > 0) setSelectedRoomId(rData.rooms[0].id);
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
    } catch (e: any) {
      alert(e.message || 'Status update failed.');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/operations/housekeeping', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          roomId: selectedRoomId,
          taskType,
          priority,
          notes,
        }),
      });
      setModalOpen(false);
      setNotes('');
      await fetchTasks();
    } catch (e: any) {
      alert(e.message || 'Task creation failed.');
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
            Assign room cleaning, deep sanitation, and inspect room readiness
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        task.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-brand-blue'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-3.5 text-content-secondary-light">{task.scheduled_date}</td>
                    <td className="p-3.5 text-content-secondary-light max-w-xs truncate">{task.notes || '—'}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        task.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 text-brand-blue'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                          className="px-2.5 py-1 rounded bg-blue-50 text-brand-blue font-semibold text-[11px] hover:bg-blue-100 transition"
                        >
                          Start
                        </button>
                      )}
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'completed')}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 transition"
                        >
                          Complete Clean
                        </button>
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light">
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <h3 className="text-sm font-bold text-content-primary-light">Assign Housekeeping Task</h3>
              <button onClick={() => setModalOpen(false)} className="text-xs text-content-secondary-light">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Room *</label>
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
                    <option value="linen_change">Linen & Towel Change</option>
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
                  className="flex-1 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-hover"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
