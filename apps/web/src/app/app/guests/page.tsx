'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Search,
  Loader2,
  ShieldCheck,
  Clock,
  FileText,
  ExternalLink,
  Baby,
} from 'lucide-react';

export default function GuestsDirectoryPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [previewIdUrl, setPreviewIdUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadGuests() {
      if (!currentTenant) return;
      try {
        const data = await apiClient('/reservations');
        setReservations(data.reservations || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadGuests();
  }, [currentTenant]);

  const filtered = reservations.filter((r) => {
    const text = (
      (r.guest_name || '') +
      ' ' +
      (r.guest_phone || '') +
      ' ' +
      (r.guest_email || '') +
      ' ' +
      (r.reservation_number || '')
    ).toLowerCase();
    return text.includes(query.toLowerCase());
  });

  return (
    <div className="space-y-5">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Guest Profiles & Identity Ledger
        </h1>
        <p className="text-xs text-content-secondary-light">
          Verified guest directory, Government ID documentation, past stay records, and contact ledger
        </p>
      </div>

      <div className="p-4 rounded-xl bg-white border border-border-light shadow-sm max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-content-secondary-light absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, email, or RES #..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light text-xs text-content-secondary-light">
          No guest records found in this property's ledger.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((res) => (
            <div key={res.id} className="p-5 rounded-2xl bg-white border border-border-light shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-sm text-content-primary-light block">
                      {res.guest_name || 'Guest'}
                    </span>
                    <span className="text-[10px] font-mono text-brand-blue font-bold">
                      {res.reservation_number}
                    </span>
                  </div>

                  {res.self_checkin_completed ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      ID Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200 shrink-0">
                      ID Pending
                    </span>
                  )}
                </div>

                <div className="text-xs text-content-secondary-light space-y-1.5 pt-1">
                  {res.guest_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                      <a href={`tel:${res.guest_phone}`} className="hover:underline text-content-primary-light">
                        {res.guest_phone}
                      </a>
                    </div>
                  )}
                  {res.guest_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                      <a href={`mailto:${res.guest_email}`} className="truncate hover:underline text-content-primary-light">
                        {res.guest_email}
                      </a>
                    </div>
                  )}
                  {res.children > 0 && (
                    <div className="flex items-center gap-2 text-amber-800">
                      <Baby className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{res.children} Accompanying Child{res.children > 1 ? 'ren' : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border-light space-y-2 text-[11px]">
                <div className="flex justify-between text-content-secondary-light">
                  <span>Stay: {res.check_in_date} &rarr; {res.check_out_date}</span>
                  <span className="font-semibold text-content-primary-light">
                    {res.room_number ? `Room ${res.room_number}` : res.room_type_name}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-content-primary-light">
                    Tariff: {formatINR(res.total_amount_paise)}
                  </span>

                  {res.guest_id_proof_url ? (
                    <button
                      onClick={() => setPreviewIdUrl(res.guest_id_proof_url)}
                      className="px-2.5 py-1 rounded bg-blue-50 text-brand-blue font-semibold hover:bg-blue-100 transition flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" /> View ID
                    </button>
                  ) : (
                    <span className="text-[10px] text-content-secondary-light italic">No document</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ID Document Preview Modal */}
      {previewIdUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-border-light p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-border-light">
              <span className="font-bold text-xs text-content-primary-light flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Guest Identity Document
              </span>
              <button
                onClick={() => setPreviewIdUrl(null)}
                className="text-xs text-content-secondary-light hover:text-content-primary-light font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-xl border border-border-light bg-surface-light flex items-center justify-center p-2">
              <img src={previewIdUrl} alt="Guest ID Proof" className="max-w-full h-auto object-contain rounded-lg" />
            </div>

            <button
              onClick={() => setPreviewIdUrl(null)}
              className="w-full py-2 rounded-lg bg-surface-light text-content-secondary-light font-semibold text-xs hover:bg-border-light"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
