'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '@/lib/AuthContext';
import { Hotel, MailCheck, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, refreshUser } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(user);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    await user?.reload();
    await refreshUser();
    if (user?.emailVerified) {
      window.location.href = '/app';
    } else {
      setError('Email is not verified yet. Please check your inbox and click the verification link.');
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
          Verify your email address
        </h2>
        <p className="mt-2 text-sm text-content-secondary-light">
          We sent a verification link to <span className="font-semibold text-content-primary-light">{user?.email || 'your email'}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-border-light rounded-2xl sm:px-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center mx-auto">
            <MailCheck className="w-7 h-7" />
          </div>

          <p className="text-xs text-content-secondary-light leading-relaxed">
            Please click the link inside your confirmation email to activate all operational and super-admin privileges on your account.
          </p>

          {sent && (
            <div className="p-3 rounded-lg bg-emerald-50 text-status-success text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>A new verification link has been sent to your inbox.</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-status-danger text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={handleCheckVerified}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover transition"
            >
              I have verified my email
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg border border-border-light text-content-primary-light font-medium text-xs hover:bg-surface-light transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Resend Verification Link'}
            </button>
          </div>

          <div className="pt-4 border-t border-border-light">
            <Link href="/login" className="text-xs text-content-secondary-light hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
