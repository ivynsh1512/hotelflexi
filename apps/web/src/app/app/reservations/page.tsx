'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  BookOpen,
  Search,
  PlusCircle,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  XCircle,
  Loader2,
  AlertCircle,
  Receipt,
  Share2,
  Copy,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';

export default function ReservationsListPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Linen modal state
  const [linenModalOpen, setLinenModalOpen] = useState(false);
  const [linenResId, setLinenResId] = useState<string>('');
  const [linenResInfo, setLinenResInfo] = useState<{ guestName: string; roomNumber: string } | null>(null);
  const [linenAction, setLinenAction] = useState<'laundry' | 'reuse' | 'skip'>('laundry');
  const [linenCounts, setLinenCounts] = useState({ bedsheets: 1, pillowCovers: 2, bathTowels: 1, handTowels: 1 });
  const [linenSubmitting, setLinenSubmitting] = useState(false);

  const copyFlexiLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hotelflexi.vercel.app';
    navigator.clipboard.writeText(`${origin}/guest/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = `/reservations?`;
      if (statusFilter) endpoint += `status=${statusFilter}&`;
      if (searchQuery) endpoint += `q=${encodeURIComponent(searchQuery)}&`;

      const data = await apiClient(endpoint);
      setReservations(data.reservations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant) {
      fetchReservations();
    }
  }, [currentTenant, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReservations();
  };

  const handleCheckIn = async (resId: string) => {
    try {
      await apiClient(`/reservations/${resId}/check-in`, { method: 'PATCH' });
      await fetchReservations();
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    }
  };

  const handleCheckOut = (resId: string, guestName?: string, roomNumber?: string) => {
    setLinenResId(resId);
    setLinenResInfo({ guestName: guestName || 'Guest', roomNumber: roomNumber || '' });
    setLinenAction('laundry');
    setLinenCounts({ bedsheets: 1, pillowCovers: 2, bathTowels: 1, handTowels: 1 });
    setLinenModalOpen(true);
  };

  const confirmCheckOut = async () => {
    if (!linenResId) return;
    setLinenSubmitting(true);
    try {
      const body: Record<string, unknown> = {};
      if (linenAction !== 'skip') {
        body.linenAction = linenAction;
        body.linenCounts = {
          'Bedsheet': linenCounts.bedsheets,
          'Pillow Cover': linenCounts.pillowCovers,
          'Bath Towel': linenCounts.bathTowels,
          'Hand Towel': linenCounts.handTowels,
        };
      }
      await apiClient(`/reservations/${linenResId}/check-out`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setLinenModalOpen(false);
      alert('Guest checked out successfully');
      fetchReservations();
    } catch (err: any) {
      alert(err.message || 'Failed to check out');
    } finally {
      setLinenSubmitting(false);
    }
  };

  const handleCancel = async (resId: string) => {
    const reason = prompt('Please enter cancellation reason:', 'Guest cancelled');
    if (!reason) return;
    try {
      await apiClient(`/reservations/${resId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      await fetchReservations();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  return (
    <>
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Guest Reservations
          </h1>
          <p className="text-xs text-content-secondary-light">
            Manage incoming arrivals, in-house guests, check-ins, and invoices
          </p>
        </div>

        <Link
          href="/app/reservations/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Booking
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-border-light shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-content-secondary-light absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Guest Name, Phone, or RES #..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-lg border border-border-light bg-white text-content-primary-light"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In (In-House)</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
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
      ) : reservations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-3">
          <BookOpen className="w-10 h-10 text-content-secondary-light mx-auto" />
          <h3 className="text-base font-bold text-content-primary-light">No Reservations Found</h3>
          <p className="text-xs text-content-secondary-light">
            There are no bookings recorded yet. Walk-in bookings and online direct bookings will show up here.
          </p>
          <div className="pt-2">
            <Link
              href="/app/reservations/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Walk-in Booking
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Booking Ref</th>
                  <th className="p-3.5">Guest Name & Contact</th>
                  <th className="p-3.5">Room & Type</th>
                  <th className="p-3.5">Stay Dates</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Self Check-In & FlexiLink</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {reservations.map((res) => {
                  const isCheckedIn = res.status === 'checked_in';
                  const isConfirmed = res.status === 'confirmed';
                  const isCheckedOut = res.status === 'checked_out';
                  const isCancelled = res.status === 'cancelled';

                  return (
                    <tr key={res.id} className="hover:bg-surface-light/40 transition">
                      <td className="p-3.5 font-mono font-bold text-brand-blue">
                        {res.reservation_number}
                        <div className="text-[10px] text-content-secondary-light font-sans font-normal uppercase">
                          Source: {res.source}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-content-primary-light">{res.guest_name || 'Guest'}</div>
                        <div className="text-[11px] text-content-secondary-light">{res.guest_phone || 'No phone'}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-content-primary-light">
                          {res.room_number ? `Room ${res.room_number}` : 'Unassigned'}
                        </div>
                        <div className="text-[10px] text-content-secondary-light">{res.room_type_name}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-content-primary-light">
                          {res.check_in_date} → {res.check_out_date}
                        </div>
                        <div className="text-[10px] text-content-secondary-light">
                          {res.adults} Adult{res.adults > 1 ? 's' : ''} {res.children > 0 ? `• ${res.children} Child` : ''}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-content-primary-light">{formatINR(res.total_amount_paise)}</div>
                        <div className={`text-[10px] font-semibold ${
                          res.balance_amount_paise > 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {res.balance_amount_paise > 0 ? `Pending: ${formatINR(res.balance_amount_paise)}` : 'Fully Paid'}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1.5">
                          <div>
                            {res.self_checkin_completed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Check-in Done
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Pending ID
                              </span>
                            )}
                          </div>

                          {res.guest_portal_token && (
                            <div className="flex items-center gap-1">
                              {currentTenant?.current_plan_id !== 'essential' ? (
                                <>
                                  <button
                                    onClick={() => copyFlexiLink(res.guest_portal_token)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-brand-blue font-semibold text-[10px] border border-blue-200 transition"
                                    title="Copy Guest FlexiLink"
                                  >
                                    {copiedToken === res.guest_portal_token ? (
                                      <span className="text-emerald-700 font-bold">Copied!</span>
                                    ) : (
                                      <>
                                        <Copy className="w-2.5 h-2.5" /> FlexiLink
                                      </>
                                    )}
                                  </button>

                                  {res.guest_phone && (
                                      <a
                                        href={`https://wa.me/${res.guest_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                          `Namaste ${res.guest_name || 'Guest'}, here is your FlexiLink for reservation #${res.reservation_number}${res.room_number ? ` (Room ${res.room_number})` : ''}: https://hotelflexi.com/guest/${res.guest_portal_token} to open your direct guest portal without any login. Download our Android App on Google Play: https://play.google.com/store/apps/details?id=in.novaxai.hotelflexi (Access valid during stay and up to 7 days after checkout).`
                                        )}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                                        title="Share FlexiLink via WhatsApp"
                                      >
                                      <MessageCircle className="w-3 h-3" />
                                    </a>
                                  )}
                                </>
                              ) : (
                                <Link href="/app/subscription" className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition" title="FlexiLink available on Pro & Enterprise plans">
                                  <Lock className="w-3 h-3" /> FlexiLink — Upgrade to Pro
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCheckedIn
                            ? 'bg-blue-100 text-brand-blue'
                            : isConfirmed
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCheckedOut
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {isCheckedIn ? 'In-House' : res.status}
                        </span>
                        {isCancelled && (
                          <div className="text-[9px] text-red-500 font-semibold mt-1">
                            Auto-deleted in 30 days
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {isConfirmed && (
                          <button
                            onClick={() => handleCheckIn(res.id)}
                            className="px-2.5 py-1 rounded bg-brand-blue text-white font-semibold text-[11px] hover:bg-brand-blue-hover transition"
                          >
                            Check In
                          </button>
                        )}
                        {isCheckedIn && (
                          <button
                            onClick={() => handleCheckOut(res.id, res.guest_name, res.room_number)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 transition"
                          >
                            Check Out
                          </button>
                        )}
                        {!isCheckedOut && !isCancelled && (
                          <button
                            onClick={() => handleCancel(res.id)}
                            className="px-2.5 py-1 rounded border border-border-light text-status-danger font-semibold text-[11px] hover:bg-red-50 transition"
                          >
                            Cancel
                          </button>
                        )}
                        <Link
                          href={`/app/billing`}
                          className="px-2.5 py-1 rounded border border-border-light text-content-secondary-light font-semibold text-[11px] hover:bg-surface-light inline-block"
                        >
                          Invoice
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

      {/* Linen Action Modal */}
      {linenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-content-primary-light">🧺 Room Linen — Post Checkout</h2>
              <p className="text-xs text-content-secondary-light mt-0.5">
                {linenResInfo?.guestName} · {linenResInfo?.roomNumber ? `Room ${linenResInfo.roomNumber}` : 'Unassigned Room'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-content-primary-light">What should happen with the room linen?</p>
              {(['laundry', 'reuse', 'skip'] as const).map((option) => (
                <label key={option} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${linenAction === option ? 'border-brand-blue bg-blue-50' : 'border-border-light hover:bg-surface-light'}`}>
                  <input
                    type="radio"
                    name="linenAction"
                    value={option}
                    checked={linenAction === option}
                    onChange={() => setLinenAction(option)}
                    className="accent-brand-blue"
                  />
                  <div>
                    <div className="text-xs font-semibold text-content-primary-light">
                      {option === 'laundry' ? '🧺 Send to Laundry' : option === 'reuse' ? '♻️ Mark for Reuse' : '⏭️ Skip / Decide Later'}
                    </div>
                    <div className="text-[10px] text-content-secondary-light">
                      {option === 'laundry' ? 'Record items sent for washing' : option === 'reuse' ? 'Linen is clean, can be reused' : 'No linen action recorded now'}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {linenAction === 'laundry' && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-content-primary-light">Item Counts</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'bedsheets', label: 'Bedsheets' },
                    { key: 'pillowCovers', label: 'Pillow Covers' },
                    { key: 'bathTowels', label: 'Bath Towels' },
                    { key: 'handTowels', label: 'Hand Towels' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-content-secondary-light">{label}</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={linenCounts[key as keyof typeof linenCounts]}
                        onChange={e => setLinenCounts(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                        className="px-2 py-1.5 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setLinenModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border-light text-xs font-bold text-content-primary-light hover:bg-surface-light transition"
                disabled={linenSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckOut}
                disabled={linenSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover transition disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {linenSubmitting ? <><Loader2 className="w-3 h-3 animate-spin" /> Processing...</> : 'Confirm Check-Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
