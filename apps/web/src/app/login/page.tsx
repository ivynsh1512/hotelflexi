'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase';
import { Hotel, Mail, Lock, AlertCircle, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [savedGuestToken, setSavedGuestToken] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const qToken = searchParams.get('token') || searchParams.get('guestToken');
      if (qToken) {
        router.replace(`/guest/${qToken}`);
        return;
      }
      try {
        const stored = localStorage.getItem('hotelflexi_guest_token');
        if (stored) setSavedGuestToken(stored);
      } catch {}
    }
  }, [searchParams, router]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push(redirectUrl);
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push(redirectUrl);
    } catch (err: any) {
      console.error('Login error:', err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please reset your password or try again in a few minutes.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network connectivity error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-sm border border-border-light rounded-2xl sm:px-10">
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-status-danger text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-status-danger" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Guest Portal Bypass: Direct Access without Login */}
      {savedGuestToken && (
        <div className="mb-6 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-blue-900 block">Are you an in-house guest?</span>
            <span className="text-[11px] text-blue-700">Open your direct room folio without login</span>
          </div>
          <Link
            href={`/guest/${savedGuestToken}`}
            className="px-3.5 py-1.5 bg-brand-blue text-white rounded-lg font-bold text-xs hover:bg-brand-blue-hover shadow-sm transition"
          >
            Open Portal &rarr;
          </Link>
        </div>
      )}

      {/* Google Sign-in */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-border-light bg-white hover:bg-slate-50 text-content-primary-light font-semibold text-sm transition shadow-sm disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-light" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-content-secondary-light font-medium tracking-wider">
            Or sign in with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-content-primary-light uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-content-secondary-light" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@hotel.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm transition"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-content-primary-light uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-brand-blue hover:text-brand-blue-hover font-semibold transition"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-content-secondary-light" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-content-secondary-light hover:text-content-primary-light p-0.5 rounded transition"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-blue text-white font-bold text-sm hover:bg-brand-blue-hover transition disabled:opacity-50 shadow-sm pt-3 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-border-light text-center space-y-3">
        <p className="text-xs text-content-secondary-light">
          Don't have an account yet?{' '}
          <Link href="/signup" className="text-brand-blue font-bold hover:underline">
            Start 14-day free trial
          </Link>
        </p>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-content-secondary-light">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-bit SSL encrypted • Commercial grade security</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center justify-center">
          <img
            src="/light-logo.png"
            alt="HotelFlexi by NovaX AI"
            className="h-12 sm:h-14 w-auto max-w-[220px] object-contain"
          />
        </Link>
        <h2 className="mt-6 text-2xl font-extrabold text-content-primary-light">
          Sign in to HotelFlexi
        </h2>
        <p className="mt-2 text-xs text-content-secondary-light">
          Access your PMS, AI Assistant, Front Desk & Multi-property Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense
          fallback={
            <div className="p-12 text-center bg-white rounded-2xl border border-border-light shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-brand-blue mx-auto" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
