'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { Hotel, MapPin, Phone, BedDouble, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [propertyName, setPropertyName] = useState('');
  const [ownerName, setOwnerName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [address, setAddress] = useState('');
  const [totalRooms, setTotalRooms] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient('/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          propertyName,
          ownerName,
          phone,
          city,
          state,
          address,
          totalRooms,
        }),
      });

      // Refresh auth context so newly created tenant becomes active
      await refreshUser();
      router.push('/app');
    } catch (err: any) {
      console.error('Onboarding failed:', err);
      setError(err.message || 'Failed to complete hotel onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-blue flex items-center justify-center text-white mx-auto shadow-md mb-3">
          <Hotel className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary-light tracking-tight">
          Welcome! Let's set up your property
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-content-secondary-light">
          HotelFlexi will configure your room inventory, rate plans, and booking engine automatically.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border-light shadow-sm">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-status-danger text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
              Hotel / Property Name *
            </label>
            <input
              type="text"
              required
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="The Grand Heritage Resort"
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                Owner / GM Name *
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Vikram Singh"
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                Contact Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Jaipur"
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                State *
              </label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Rajasthan"
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Plot 12, Civil Lines, Near Railway Station"
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
              Initial Room Count (Can be edited anytime)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={2}
                max={50}
                value={totalRooms}
                onChange={(e) => setTotalRooms(parseInt(e.target.value, 10) || 6)}
                className="w-24 px-3 py-2 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold"
              />
              <span className="text-xs text-content-secondary-light">
                Generates Deluxe Rooms & Executive Suites with numbers 101, 102, 201...
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-light border border-border-light text-xs space-y-1.5 text-content-secondary-light">
            <div className="font-semibold text-content-primary-light mb-1">Default Configuration Included:</div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue" />
              <span>Standard Room Tariffs: ₹2,500 (Deluxe) & ₹4,500 (Suite)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue" />
              <span>Indian GST Rules (12% / 18%) & Invoice Prefix: 'HF-1001'</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue" />
              <span>14-Day Free Trial Activated (Starter Plan Features)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Initializing Hotel Database...
              </>
            ) : (
              <>
                Launch HotelFlexi Dashboard
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
