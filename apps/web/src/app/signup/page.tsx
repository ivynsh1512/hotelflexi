'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase';
import { Hotel, Mail, Lock, User, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/app/onboarding');
    } catch (err: any) {
      console.error('Google Sign-up error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      setError(err.message || 'Google sign-up failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (fullName.trim()) {
        await updateProfile(userCredential.user, { displayName: fullName.trim() });
      }

      // Send Firebase verification email
      try {
        await sendEmailVerification(userCredential.user);
      } catch (e) {
        console.warn('Email verification send issue:', e);
      }

      router.push('/app/onboarding');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
        <h2 className="mt-6 text-2xl font-bold text-content-primary-light">
          Start your 14-day free trial
        </h2>
        <p className="mt-2 text-sm text-content-secondary-light">
          Set up your hotel PMS, inventory, and AI agent in minutes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-border-light rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-status-danger text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-border-light bg-white hover:bg-slate-50 text-content-primary-light font-semibold text-sm transition shadow-sm disabled:opacity-50"
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
            <span>Sign up with Google</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-content-secondary-light font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1.5">
                Full Name / Owner Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-3 text-content-secondary-light" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Vikram Singh"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1.5">
                Business Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-3 text-content-secondary-light" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikram@grandheritage.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-3 text-content-secondary-light" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm"
                />
              </div>
            </div>

            <div className="pt-2 text-xs text-content-secondary-light space-y-1">
              <div className="flex items-center gap-1.5 text-status-success">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Instant 14-day free access to all modules</span>
              </div>
              <p>
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-brand-blue underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-brand-blue underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue-hover transition disabled:opacity-50 shadow-sm mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Hotel Account...
                </>
              ) : (
                <>
                  Create Account & Setup Hotel
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border-light text-center">
            <p className="text-xs text-content-secondary-light">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-blue font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
