'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  checkActionCode,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import {
  CheckCircle2,
  AlertCircle,
  Lock,
  MailCheck,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

function AuthActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  // General Status State
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [targetEmail, setTargetEmail] = useState('');

  // Password Reset Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  useEffect(() => {
    if (!mode || !oobCode) {
      setLoading(false);
      setStatus('error');
      setErrorMessage('Invalid authentication link. Missing verification code or action parameter.');
      return;
    }

    const handleAction = async () => {
      setLoading(true);
      setStatus('idle');
      setErrorMessage('');

      try {
        switch (mode) {
          case 'verifyEmail':
          case 'verifyAndChangeEmail': {
            // Apply email verification code
            await applyActionCode(auth, oobCode);
            if (auth.currentUser) {
              await auth.currentUser.reload();
              await refreshUser();
            }
            setStatus('success');
            break;
          }

          case 'resetPassword': {
            // Verify code first to get the associated email
            const email = await verifyPasswordResetCode(auth, oobCode);
            setTargetEmail(email);
            setStatus('idle'); // Wait for user to input new password
            break;
          }

          case 'recoverEmail': {
            // Revert unauthorized email change
            const actionInfo = await checkActionCode(auth, oobCode);
            const restoredEmail = actionInfo.data.email || '';
            await applyActionCode(auth, oobCode);
            setTargetEmail(restoredEmail);
            setStatus('success');
            break;
          }

          default:
            setStatus('error');
            setErrorMessage(`Unrecognized authentication mode: ${mode}`);
            break;
        }
      } catch (err: any) {
        console.error('Firebase Auth Action error:', err);
        setStatus('error');
        if (err.code === 'auth/expired-action-code') {
          setErrorMessage('This security link has expired. For your protection, verification and password reset links are time-limited. Please request a fresh link.');
        } else if (err.code === 'auth/invalid-action-code') {
          setErrorMessage('This security link has already been used or is invalid. If you already verified your account or reset your password, you can proceed to sign in.');
        } else if (err.code === 'auth/user-disabled') {
          setErrorMessage('This user account has been disabled. Please contact HotelFlexi security support at info@novaxai.in.');
        } else {
          setErrorMessage(err.message || 'An error occurred while processing this security action.');
        }
      } finally {
        setLoading(false);
      }
    };

    handleAction();
  }, [mode, oobCode, refreshUser]);

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmittingPassword(true);
    setErrorMessage('');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setPasswordResetSuccess(true);
      setStatus('success');
    } catch (err: any) {
      console.error('Confirm password reset error:', err);
      if (err.code === 'auth/expired-action-code') {
        setErrorMessage('This password reset link has expired. Please request a new one.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('The chosen password is too weak. Please use a stronger combination of letters, numbers, and symbols.');
      } else {
        setErrorMessage(err.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Password strength helper
  const passwordStrength = {
    length: newPassword.length >= 8,
    hasNumber: /\d/.test(newPassword),
    hasLetter: /[a-zA-Z]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
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
        <h2 className="mt-5 text-2xl font-extrabold text-slate-900 tracking-tight">
          HotelFlexi Security Gateway
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Protected &amp; Encrypted Account Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200/80 rounded-3xl sm:px-10">
          {/* 1. LOADING STATE */}
          {loading && (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto animate-pulse">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Verifying Security Token...
              </h3>
              <p className="text-xs text-slate-500">
                Please wait while we validate your credentials and apply account updates.
              </p>
            </div>
          )}

          {/* 2. ERROR STATE */}
          {!loading && status === 'error' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Action Verification Failed</h3>
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200/70 leading-relaxed text-left">
                {errorMessage}
              </p>
              <div className="pt-2 space-y-2">
                {mode === 'verifyEmail' && (
                  <Link
                    href="/verify-email"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Request New Verification Email
                  </Link>
                )}
                {mode === 'resetPassword' && (
                  <Link
                    href="/forgot-password"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow-sm"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Request New Password Reset Link
                  </Link>
                )}
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* 3. EMAIL VERIFICATION SUCCESS */}
          {!loading && (mode === 'verifyEmail' || mode === 'verifyAndChangeEmail') && status === 'success' && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <MailCheck className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Identity Confirmed
                </span>
                <h3 className="text-xl font-black text-slate-900">Email Address Verified!</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your registered email is verified and encrypted. All hotel management privileges, housekeeping sirens, and automated OTA channel synchronization are now fully active.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium text-slate-500">Security Status:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Protected
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium text-slate-500">Account Recovery:</span>
                  <span className="font-bold text-slate-900">Enabled</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/app"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow-md"
                >
                  Launch HotelFlexi PMS
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* 4. EMAIL RESTORED (recoverEmail) */}
          {!loading && mode === 'recoverEmail' && status === 'success' && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Email Address Restored</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your account email has been reverted back to <strong className="text-slate-900">{targetEmail || 'your original address'}</strong>.
                </p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800 space-y-1">
                <strong>Important Security Notice:</strong>
                <p>If you did not initiate an email change, someone may have compromised your credentials. We strongly advise you to reset your password immediately.</p>
              </div>
              <div className="pt-2 space-y-2">
                <Link
                  href="/forgot-password"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow-md"
                >
                  Reset My Password Now
                </Link>
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center py-2 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* 5. PASSWORD RESET FORM */}
          {!loading && mode === 'resetPassword' && (
            <div>
              {passwordResetSuccess ? (
                <div className="text-center py-4 space-y-5">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Password Updated!</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Your HotelFlexi password has been securely reset. You can now log into your hotel dashboard with your new credentials.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow-md"
                    >
                      Sign In to HotelFlexi
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                  <div className="text-center pb-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto mb-2">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Set New Password</h3>
                    {targetEmail && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        For account: <span className="font-semibold text-slate-900">{targetEmail}</span>
                      </p>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters..."
                        className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-medium"
                    />
                  </div>

                  {/* Password Strength Checklist */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1 text-slate-600">
                    <div className={`flex items-center gap-1.5 ${passwordStrength.length ? 'text-emerald-600 font-semibold' : ''}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${passwordStrength.length ? 'text-emerald-500' : 'text-slate-300'}`} />
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordStrength.hasNumber && passwordStrength.hasLetter ? 'text-emerald-600 font-semibold' : ''}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${passwordStrength.hasNumber && passwordStrength.hasLetter ? 'text-emerald-500' : 'text-slate-300'}`} />
                      <span>Contains letters and numbers</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordStrength.matches ? 'text-emerald-600 font-semibold' : ''}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${passwordStrength.matches ? 'text-emerald-500' : 'text-slate-300'}`} />
                      <span>Passwords match</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPassword}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Password...
                      </>
                    ) : (
                      'Save New Password & Sign In'
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      }
    >
      <AuthActionContent />
    </Suspense>
  );
}
