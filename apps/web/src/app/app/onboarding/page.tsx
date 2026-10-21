'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { auth } from '@/lib/firebase';
import AddressAutocomplete, { SelectedLocation } from '@/components/ui/AddressAutocomplete';
import { Hotel, MapPin, Phone, BedDouble, CheckCircle2, ArrowRight, Loader2, AlertCircle, Compass } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, tenants, loading: authLoading, tenantsLoaded, refreshUser, logout } = useAuth();

  const [propertyName, setPropertyName] = useState('');
  const [ownerName, setOwnerName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Jaipur');
  const [state, setState] = useState('Rajasthan');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('302001');
  const [country, setCountry] = useState('India');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if property already exists (Resolves onboarding loop on login!)
  React.useEffect(() => {
    if (!authLoading && tenantsLoaded && tenants.length > 0) {
      router.replace('/app');
    }
  }, [authLoading, tenantsLoaded, tenants, router]);

  const isGoogleUser = user?.providerData?.some((p) => p.providerId === 'google.com');
  const isEmailVerified = Boolean(user?.emailVerified || isGoogleUser);

  const handleLocationSelect = (loc: SelectedLocation) => {
    // Only update fields if Photon returned a non-empty value,
    // preserving any existing manual inputs if the specific field was not in the suggestion.
    if (loc.city) {
      setCity(loc.city);
    }
    if (loc.state) {
      setState(loc.state);
    }
    if (loc.postalCode) {
      setPostalCode(loc.postalCode);
    }
    if (loc.country) {
      setCountry(loc.country);
    }
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Force-reload user from Firebase & force-refresh the ID token so that
    // email_verified claim in the JWT is up-to-date even if the user just clicked
    // the verification link in another tab without logging out.
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        await auth.currentUser.getIdToken(true); // force fresh token with updated claims
        await refreshUser();
      }
    } catch (reloadErr) {
      console.warn('Token refresh before onboarding (non-fatal):', reloadErr);
    }

    // Re-evaluate after reload
    const currentUser = auth.currentUser;
    const isGoogleUser2 = currentUser?.providerData?.some((p) => p.providerId === 'google.com');
    const isVerifiedNow = Boolean(currentUser?.emailVerified || isGoogleUser2);

    if (!isVerifiedNow) {
      setError('Email verification is required before configuring your hotel property. Please check your inbox and click the link we sent you.');
      setLoading(false);
      return;
    }

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
          postalCode,
          country,
          latitude,
          longitude,
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

  if (user && !isEmailVerified) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border-light shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-content-primary-light">Verify Your Email Address First</h2>
            <p className="text-xs text-content-secondary-light mt-1.5 leading-relaxed">
              To prevent unauthorized property registrations, you must verify your email <span className="font-semibold text-content-primary-light">{user.email}</span> before setting up your hotel workspace.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={async () => {
                try {
                  await user.reload();
                  await user.getIdToken(true);
                  await refreshUser();
                  if (user.emailVerified) {
                    window.location.reload();
                  } else {
                    setError('Email not verified yet. Please check your inbox / spam folder.');
                  }
                } catch {
                  setError('Could not refresh verification status. Please try again.');
                }
              }}
              className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              I Have Verified My Email - Refresh
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-2 px-4 text-slate-500 hover:text-slate-800 text-xs font-medium transition"
            >
              Sign out / Use different account
            </button>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Address Autocomplete with Photon API */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider">
                Address / Location *
              </label>
              <span className="text-[10px] text-content-secondary-light">
                Autocomplete powered by Photon
              </span>
            </div>
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onSelectLocation={handleLocationSelect}
              hasCoordinates={latitude !== null && longitude !== null}
              placeholder="Search or enter Indian hotel address (e.g. Plot No. 42, Civil Lines, Near MG Road, Jaipur)..."
            />
            {latitude !== null && longitude !== null && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>GPS coordinates captured: {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E</span>
              </div>
            )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                PIN / Postal Code
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="e.g. 110001"
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-light border border-border-light text-xs space-y-2 text-content-secondary-light">
            <div className="font-semibold text-content-primary-light mb-1">Your Property Workspace Setup:</div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue" />
              <span>Dedicated Direct Booking Engine & Commission-Free Guest Portal</span>
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
