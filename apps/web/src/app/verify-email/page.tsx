'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendEmailVerification, applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import {
  MailCheck,
  AlertCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();

  const oobCode = searchParams.get('oobCode');
  const [autoVerifying, setAutoVerifying] = useState(Boolean(oobCode));
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // If oobCode is passed directly in the query parameters, verify immediately
  useEffect(() => {
    if (oobCode) {
      setAutoVerifying(true);
      applyActionCode(auth, oobCode)
        .then(async () => {
          if (auth.currentUser) {
            await auth.currentUser.reload();
            await refreshUser();
          }
          setVerifiedSuccess(true);
          setTimeout(() => {
            router.push('/app');
          }, 2000);
        })
        .catch((err: any) => {
          console.error('Failed to auto-verify oobCode:', err);
          setError(
            err.code === 'auth/expired-action-code'
              ? 'This verification link has expired. Please request a new one below.'
              : err.code === 'auth/invalid-action-code'
              ? 'This link has already been used or is invalid. Please sign in or request a new verification link.'
              : err.message || 'Verification link failed.'
          );
        })
        .finally(() => {
          setAutoVerifying(false);
        });
    }
  }, [oobCode, refreshUser, router]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Real-time automatic background polling to check if user verified in another tab/device
  useEffect(() => {
    if (!user || user.emailVerified || verifiedSuccess) return;

    const interval = setInterval(async () => {
      try {
        await user.reload();
        if (user.emailVerified) {
          setVerifiedSuccess(true);
          await refreshUser();
          setTimeout(() => {
            router.push('/app');
          }, 1500);
        }
      } catch (err) {
        // Silent fail on background poll
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [user, refreshUser, router, verifiedSuccess]);

  const handleResend = async () => {
    if (!user || cooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(user);
      setSent(true);
      setCooldown(60); // 60s cooldown
    } catch (err: any) {
      console.error('Resend verification error:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many verification requests. Please wait a few minutes before trying again.');
      } else {
        setError(err.message || 'Failed to resend verification email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    setLoading(true);
    setError(null);
    try {
      await user?.reload();
      await refreshUser();
      if (user?.emailVerified) {
        setVerifiedSuccess(true);
        setTimeout(() => {
          router.push('/app');
        }, 1200);
      } else {
        setError('Email is not verified yet. Please click the link in your inbox or spam folder.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check verification status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center justify-center">
          <img
            src="/light-logo.png"
            alt="HotelFlexi by NovaX AI"
            className="h-12 sm:h-14 w-auto max-w-[220px] object-contain"
          />
        </Link>
        <h2 className="mt-6 text-2xl font-extrabold text-slate-900 tracking-tight">
          Verify your email address
        </h2>
        <p className="mt-2 text-xs text-slate-500 font-medium">
          Securing your HotelFlexi workspace &amp; operational credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200/80 rounded-3xl sm:px-10 text-center space-y-5">
          {autoVerifying ? (
            <div className="py-8 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-brand-blue mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                Confirming Security Token...
              </h3>
              <p className="text-xs text-slate-500">
                Verifying your email and activating operational permissions.
              </p>
            </div>
          ) : verifiedSuccess ? (
            <div className="py-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Email Verified!</h3>
              <p className="text-xs text-slate-600">
                Your email is confirmed and your hotel workspace is secured. Redirecting you to the HotelFlexi Dashboard...
              </p>
              <div className="pt-2">
                <Link
                  href="/app"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow-sm"
                >
                  Continue to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-brand-blue border border-blue-200/60 flex items-center justify-center mx-auto shadow-sm">
                <MailCheck className="w-8 h-8" />
              </div>

              <div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We sent a confirmation link to:
                </p>
                <div className="mt-1 font-mono font-bold text-sm text-slate-900 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200 break-all inline-block">
                  {user?.email || 'your registered email'}
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-2xl text-left text-[11px] text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" />
                  <span>Why verify?</span>
                </div>
                <p className="text-blue-800 leading-relaxed">
                  Verifying your email protects your hotel against account takeover, allows one-click password resets, and activates instant emergency staff sirens.
                </p>
              </div>

              {sent && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>A fresh verification link has been dispatched to your inbox.</span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCheckVerified}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Checking...
                    </>
                  ) : (
                    <>
                      I Have Clicked the Verification Link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || cooldown > 0}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {cooldown > 0 ? `Resend Link in ${cooldown}s` : 'Resend Verification Link'}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <Link href="/login" className="hover:text-slate-900 transition underline">
                  Switch Account
                </Link>
                <Link href="/app" className="hover:text-slate-900 transition">
                  Skip for now &rarr;
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
