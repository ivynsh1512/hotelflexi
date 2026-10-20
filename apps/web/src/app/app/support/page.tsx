'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  HelpCircle,
  AlertTriangle,
  CreditCard,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  Phone,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react';

export default function AppSupportPage() {
  const { currentTenant, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);

  // Form State
  const [category, setCategory] = useState('technical_bug');
  const [priority, setPriority] = useState('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const hotelCode =
    (currentTenant as any)?.hotel_code ||
    (currentTenant?.tenant_id
      ? (
          Math.abs(
            currentTenant.tenant_id
              .split('')
              .reduce((acc: number, char: string) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
          ) % 90000 +
          10000
        ).toString()
      : '58291');

  const fetchTickets = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const data = await apiClient('/support/tickets');
      setTickets(data.tickets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [currentTenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    setSubmitting(true);
    setSuccessMsg('');
    try {
      await apiClient('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          category,
          priority,
          subject,
          description,
          phone,
        }),
      });
      setSuccessMsg(`Ticket submitted successfully! Tagged under Property Code #${hotelCode}. Our engineering team is investigating.`);
      setSubject('');
      setDescription('');
      fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-content-primary-light">
              Support &amp; Technical Help Desk
            </h1>
          </div>
          <p className="text-xs text-content-secondary-light mt-1">
            Directly raise technical bugs, payment/payout inquiries, or channel manager issues to NovaX AI engineering.
          </p>
        </div>

        {/* 5-Digit Hotel Code Badge */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white shrink-0 text-center sm:text-right shadow-md space-y-1">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Your 5-Digit Property Code
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 tracking-wider">
            #{hotelCode}
          </div>
          <div className="text-[10px] text-slate-400">
            {currentTenant?.tenant_name || 'Active Property'}
          </div>
        </div>
      </div>

      {/* Ticket Submission Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm space-y-6">
        <h2 className="text-base font-black text-slate-900 pb-3 border-b border-border-light flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Raise a Technical Complaint or Bug
        </h2>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Complaint / Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-semibold p-3 rounded-xl border border-border-light bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="technical_bug">🐞 Technical Bug (PMS, Calendar, Rooms)</option>
                <option value="payment_issue">💳 Payment / Payout Issue (Razorpay, UPI, Folios)</option>
                <option value="channel_sync">🌐 Channel Manager Sync Issue (OTAs, Rates)</option>
                <option value="dine_out_bug">🍽️ Dine-Out / Restaurant Table Issue</option>
                <option value="feature_request">💡 Feature Request / Setup Assistance</option>
                <option value="other">❓ General Query</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Urgency Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs font-semibold p-3 rounded-xl border border-border-light bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="low">Low (General question)</option>
                <option value="medium">Medium (Feature behaving unexpectedly)</option>
                <option value="high">High (Affecting daily check-ins or guest checkouts)</option>
                <option value="urgent">Urgent (Payment / Channel sync failure)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject / Headline</label>
            <input
              type="text"
              placeholder="e.g. Payment receipt not generating or MakeMyTrip inventory discrepancy"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs font-medium p-3 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Detailed Description</label>
            <textarea
              placeholder="Describe what happened, what room or transaction was affected, and any error message displayed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full text-xs font-medium p-3 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Contact WhatsApp / Mobile for Quick Engineering Call
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs font-medium p-3 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue max-w-sm"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Auto-tagged with Property Code: <strong>#{hotelCode}</strong>
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Submitting to Support Team...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit to Support Team
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Ticket History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-900 pb-2 border-b border-border-light flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          Previous Support Tickets ({tickets.length})
        </h2>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-blue mx-auto" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No support tickets raised yet. Everything running smoothly!
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {t.ticket_number}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-[10px]">
                      Code: #{t.hotel_code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] uppercase">
                      {t.category.replace('_', ' ')}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto ${
                      t.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="font-bold text-slate-900">{t.subject}</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{t.description}</p>

                {t.resolution_notes && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                    <strong>Resolution Note from Engineering:</strong> {t.resolution_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
