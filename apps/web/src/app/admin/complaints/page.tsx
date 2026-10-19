'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Building,
  Loader2,
  Search,
  MessageSquare,
  ShieldAlert,
  Send,
  ExternalLink,
} from 'lucide-react';

export default function AdminComplaintsPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Resolution modal state
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await apiClient('/admin/support/tickets');
      setTickets(data.tickets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    setUpdating(true);
    try {
      await apiClient(`/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          resolution_notes: resolutionNotes || undefined,
        }),
      });
      setSelectedTicket(null);
      setResolutionNotes('');
      fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      (t.hotel_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.hotel_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.requester_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.ticket_number || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === 'all' || t.category === filterCategory;

    const matchesStatus =
      filterStatus === 'all' || t.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-dark gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Hotelier Complaints &amp; Technical Bug Center
          </h1>
          <p className="text-xs text-content-secondary-dark mt-1">
            Review incoming technical bugs and payment issues submitted by hoteliers. All records display their unique 5-digit property code.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow flex items-center gap-2 self-start sm:self-auto"
        >
          Refresh Complaints ({tickets.length})
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-content-secondary-dark absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by 5-Digit Code (e.g. 58291), hotel name, ticket number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-surface-dark-surface border border-border-dark text-white rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs bg-surface-dark-surface border border-border-dark text-white rounded-xl px-3 py-2.5 focus:outline-none w-full sm:w-auto"
        >
          <option value="all">All Categories</option>
          <option value="technical_bug">Technical Bug</option>
          <option value="payment_issue">Payment Issue</option>
          <option value="channel_sync">Channel Sync</option>
          <option value="dine_out_bug">Dine-Out Bug</option>
          <option value="feature_request">Feature Request</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs bg-surface-dark-surface border border-border-dark text-white rounded-xl px-3 py-2.5 focus:outline-none w-full sm:w-auto"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="py-20 text-center bg-surface-dark-surface rounded-3xl border border-border-dark">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-12 text-center bg-surface-dark-surface rounded-3xl border border-border-dark space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Complaints Found</h3>
          <p className="text-xs text-content-secondary-dark">
            Zero pending complaints matching your search filters.
          </p>
        </div>
      ) : (
        <div className="bg-surface-dark-surface rounded-3xl border border-border-dark overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-dark-elevated border-b border-border-dark text-[10px] font-bold text-content-secondary-dark uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">5-Digit Code</th>
                  <th className="py-3.5 px-4">Hotel / Property</th>
                  <th className="py-3.5 px-4">Category &amp; Priority</th>
                  <th className="py-3.5 px-4">Subject &amp; Issue</th>
                  <th className="py-3.5 px-4">Requester Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-dark-elevated/40 transition">
                    {/* 5-Digit Hotel Code */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-black text-xs">
                        #{t.hotel_code || '10001'}
                      </div>
                      <div className="text-[10px] text-content-secondary-dark font-mono mt-0.5">
                        {t.ticket_number}
                      </div>
                    </td>

                    {/* Hotel Name */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      {t.hotel_name}
                    </td>

                    {/* Category & Priority */}
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="text-[11px] font-bold text-purple-300">
                        {t.category.replace('_', ' ').toUpperCase()}
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          t.priority === 'urgent'
                            ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                            : t.priority === 'high'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    {/* Subject & Description */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-white line-clamp-1">{t.subject}</div>
                      <p className="text-[11px] text-content-secondary-dark line-clamp-2 mt-0.5">
                        {t.description}
                      </p>
                    </td>

                    {/* Requester Contact */}
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="font-medium text-white">{t.requester_name}</div>
                      <div className="text-[11px] text-content-secondary-dark flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3" />
                        {t.requester_email}
                      </div>
                      {t.requester_phone && (
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3" />
                          <a
                            href={`https://wa.me/${t.requester_phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {t.requester_phone} (WhatsApp)
                          </a>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'resolved'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : t.status === 'in_progress'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTicket(t);
                          setResolutionNotes(t.resolution_notes || '');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-dark-surface border border-border-dark rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-border-dark">
              <div>
                <h3 className="text-base font-black text-white">
                  Resolve Ticket: {selectedTicket.ticket_number}
                </h3>
                <span className="text-xs text-amber-400 font-mono">
                  Property Code: #{selectedTicket.hotel_code} • {selectedTicket.hotel_name}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-content-secondary-dark hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-white">{selectedTicket.subject}</div>
              <p className="p-3 rounded-xl bg-surface-dark-elevated text-content-secondary-dark text-[11px] leading-relaxed">
                {selectedTicket.description}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-secondary-dark mb-1.5">
                Resolution Notes (Visible to Hotelier)
              </label>
              <textarea
                placeholder="Explain the bug fix, database correction, or payout resolution..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 rounded-xl bg-surface-dark-elevated border border-border-dark text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-content-secondary-dark hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition"
              >
                Mark In Progress
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow"
              >
                {updating ? 'Saving...' : 'Resolve Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
