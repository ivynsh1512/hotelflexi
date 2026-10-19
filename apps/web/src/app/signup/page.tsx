'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Hotel, Mail, Lock, User, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow">
            <Hotel className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-content-primary-light">
            Hotel<span className="text-brand-blue">Flexi</span>
          </span>
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
