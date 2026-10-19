'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { Users, Phone, Mail, MapPin, Search, Loader2 } from 'lucide-react';

export default function GuestsDirectoryPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [query, setQuery] = useState('');

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
    const text = (r.guest_name + ' ' + (r.guest_phone || '') + ' ' + (r.guest_email || '')).toLowerCase();
    return text.includes(query.toLowerCase());
  });

  return (
    <div className="space-y-5">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Guest Profiles & Directory
        </h1>
        <p className="text-xs text-content-secondary-light">
          Guest contact information, ID verification records, and past stay history
        </p>
      </div>

      <div className="p-4 rounded-xl bg-white border border-border-light shadow-sm max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-content-secondary-light absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, or email..."
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
          No guest records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((res) => (
            <div key={res.id} className="p-5 rounded-xl bg-white border border-border-light shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-content-primary-light">{res.guest_name || 'Guest'}</span>
                <span className="text-[10px] font-mono text-brand-blue font-bold">{res.reservation_number}</span>
              </div>
              <div className="text-xs text-content-secondary-light space-y-1">
                {res.guest_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-brand-blue" />
                    <span>{res.guest_phone}</span>
                  </div>
                )}
                {res.guest_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-brand-blue" />
                    <span className="truncate">{res.guest_email}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border-light flex justify-between text-[11px]">
                  <span>Last Stay: {res.check_in_date}</span>
                  <span className="font-semibold text-content-primary-light">Room {res.room_number || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
