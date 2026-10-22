'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { StaffSirenAlert } from '@/components/ui/StaffSirenAlert';
import {
  Hotel,
  LayoutDashboard,
  Calendar,
  BookOpen,
  BedDouble,
  Tag,
  DollarSign,
  Users,
  Globe,
  Layers,
  Sparkles,
  ClipboardList,
  Wrench,
  AlertTriangle,
  Receipt,
  CreditCard,
  PieChart,
  BarChart3,
  Bell,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  Menu,
  X,
  PlusCircle,
  FileText,
  Lock,
  Percent,
  TrendingUp,
  UtensilsCrossed,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  MailCheck,
  Package,
  Compass,
} from 'lucide-react';
import { isRouteAllowedForRole } from '@/lib/permissions';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, tenantsLoaded, isPlatformAdmin, tenants, currentTenant, setCurrentTenant, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [apiLockedReason, setApiLockedReason] = useState<string | null>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleResendVerification = async () => {
    if (!user) return;
    setResendingEmail(true);
    setResendStatus(null);
    try {
      await sendEmailVerification(user);
      setResendStatus('Verification link dispatched! Please check your inbox & spam folder.');
      setTimeout(() => setResendStatus(null), 6000);
    } catch (e: any) {
      setResendStatus(e.message || 'Failed to resend email');
      setTimeout(() => setResendStatus(null), 6000);
    } finally {
      setResendingEmail(false);
    }
  };

  const checkUnreadNotifs = useCallback(async () => {
    if (!currentTenant?.tenant_id) return;
    try {
      const data = await apiClient('/operations/notifications?view=active');
      setUnreadNotifCount(data.notifications?.length || 0);
    } catch {}
  }, [currentTenant?.tenant_id]);

  useEffect(() => {
    checkUnreadNotifs();
    const handleRead = () => checkUnreadNotifs();
    window.addEventListener('hotelflexi:notification-read', handleRead);
    window.addEventListener('hotelflexi:housekeeping-updated', handleRead);
    const timer = setInterval(checkUnreadNotifs, 10000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('hotelflexi:notification-read', handleRead);
      window.removeEventListener('hotelflexi:housekeeping-updated', handleRead);
    };
  }, [checkUnreadNotifs]);

  const userRole = (currentTenant?.role || 'owner').toLowerCase();
  const isAllowedForRole = isRouteAllowedForRole(userRole, pathname);

  useEffect(() => {
    // Listen for unbypassable 402 server payment lock
    const onPaymentLocked = (e: any) => {
      const reason = e.detail?.reason || 'Payment required: Please clear your outstanding software dues to unlock access.';
      setApiLockedReason(reason);
    };
    window.addEventListener('hotelflexi:payment-locked', onPaymentLocked);
    return () => window.removeEventListener('hotelflexi:payment-locked', onPaymentLocked);
  }, []);

  const isGoogleUser = user?.providerData?.some((p) => p.providerId === 'google.com');
  const isEmailVerified = Boolean(user?.emailVerified || isGoogleUser);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && tenantsLoaded && user && tenants.length === 0 && pathname !== '/app/onboarding') {
      router.push('/app/onboarding');
    } else if (!loading && user && currentTenant) {
      if (userRole === 'housekeeping' && pathname === '/app') {
        router.replace('/app/housekeeping');
      }
    }
  }, [user, loading, tenantsLoaded, tenants, pathname, router, userRole, currentTenant]);

  if (loading || (!tenantsLoaded && user)) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 rounded-xl bg-brand-blue flex items-center justify-center text-white mx-auto animate-bounce">
            <Hotel className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs font-semibold text-content-secondary-light">Loading HotelFlexi Workspace...</p>
        </div>
      </div>
    );
  }

  // Strict Email Verification Gate for non-Google accounts
  if (user && !isEmailVerified) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-border-light shadow-xl p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto shadow-sm">
            <MailCheck className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-content-primary-light">Verify Your Email Address</h2>
            <p className="text-xs text-content-secondary-light mt-1.5 leading-relaxed">
              We've dispatched a verification link to <span className="font-semibold text-content-primary-light">{user.email}</span>. Please verify your email before accessing your hotel workspace and database.
            </p>
          </div>

          {resendStatus && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs text-left">
              {resendStatus}
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            <button
              onClick={async () => {
                await user.reload();
                if (user.emailVerified) {
                  window.location.reload();
                } else {
                  setResendStatus('Email not verified yet. Please check your inbox and click the verification link.');
                }
              }}
              className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              I Have Verified My Email - Refresh
            </button>

            <button
              onClick={handleResendVerification}
              disabled={resendingEmail}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              {resendingEmail ? 'Sending Link...' : 'Resend Verification Email'}
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

  // Navigation Items
  const navSections = [
    {
      title: 'Front Desk & Assistant',
      items: [
        { label: 'Overview', href: '/app', icon: LayoutDashboard },
        { label: 'AI Business Agent', href: '/app/ai-agent', icon: Sparkles, badge: 'Live AI' },
        { label: 'Calendar Grid', href: '/app/calendar', icon: Calendar },
        { label: 'Reservations', href: '/app/reservations', icon: BookOpen },
        { label: 'New Booking', href: '/app/reservations/new', icon: PlusCircle },
        { label: 'Guest Ledger', href: '/app/guests', icon: Users },
      ],
    },
    {
      title: 'Rooms & Pricing',
      items: [
        { label: 'Room List', href: '/app/rooms', icon: BedDouble },
        { label: 'Room Types', href: '/app/room-types', icon: Tag },
        { label: 'Rate Plans', href: '/app/rates', icon: DollarSign },
        { label: 'Date Rate Overrides', href: '/app/rates/daily', icon: TrendingUp },
        { label: 'Coupons & Promos', href: '/app/coupons', icon: Percent },
      ],
    },
    {
      title: 'Distribution & Channels',
      items: [
        { label: 'Channel Manager', href: '/app/channels', icon: Layers },
        { label: 'Booking Engine', href: '/app/booking-engine', icon: Globe },
        { label: 'Add-ons & Activities', href: '/app/addons', icon: Compass, badge: 'New' },
        { label: 'Dine-Out & Restaurant', href: '/app/dining', icon: UtensilsCrossed, badge: 'New' },
        { label: 'Wedding & Events', href: '/app/wedding', icon: Sparkles, badge: 'Premium' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Housekeeping', href: '/app/housekeeping', icon: ClipboardList },
        { label: 'Linen & Laundry', href: '/app/laundry', icon: Package },
        { label: 'Maintenance', href: '/app/maintenance', icon: Wrench },
        { label: 'Complaints', href: '/app/complaints', icon: AlertTriangle },
      ],
    },
    {
      title: 'Billing & Accounting',
      items: [
        { label: 'Invoices (GST)', href: '/app/billing', icon: Receipt },
        { label: 'Payments', href: '/app/payments', icon: CreditCard },
        { label: 'Expenses', href: '/app/expenses', icon: PieChart },
        { label: 'Accounting P&L', href: '/app/accounting', icon: FileText },
        { label: 'Reports', href: '/app/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Settings & Administration',
      items: [
        { label: 'Staff & Team', href: '/app/team', icon: Users },
        { label: 'Subscription Plan', href: '/app/subscription', icon: Shield },
        { label: 'Hotel Settings', href: '/app/settings', icon: Settings },
        { label: 'Support & Raise Bug', href: '/app/support', icon: HelpCircle },
        { label: 'Audit Log', href: '/app/audit-log', icon: FileText },
      ],
    },
  ];

  const filteredNavSections = navSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => isRouteAllowedForRole(userRole, item.href)),
    }))
    .filter((sec) => sec.items.length > 0);

  const hotelCode =
    (currentTenant as any)?.hotel_code ||
    (currentTenant?.tenant_id
      ? (
          Math.abs(
            currentTenant.tenant_id
              .split('')
              .reduce((acc: number, char: string) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
          ) % 90000 +
          10000
        ).toString()
      : '58291');

  const now = Math.floor(Date.now() / 1000);
  const isTrialExpired = Boolean(
    (currentTenant?.subscription_status === 'trial' || currentTenant?.subscription_status === 'trialing') &&
    currentTenant?.trial_ends_at &&
    currentTenant.trial_ends_at < now
  );
  const isSubscriptionExpired = Boolean(
    currentTenant?.subscription_status !== 'trial' &&
    currentTenant?.subscription_status !== 'trialing' &&
    currentTenant?.current_plan_id !== 'starter' &&
    currentTenant?.current_period_ends_at &&
    currentTenant.current_period_ends_at < now
  );

  const isPaymentIssue = Boolean(
    apiLockedReason ||
    currentTenant?.subscription_status === 'payment_issue' ||
    (currentTenant?.suspension_reason && currentTenant.suspension_reason.toLowerCase().includes('due')) ||
    currentTenant?.account_access_status === 'suspended'
  );

  const isAccountRestricted =
    Boolean(apiLockedReason) ||
    currentTenant?.account_access_status === 'suspended' ||
    currentTenant?.account_access_status === 'locked' ||
    currentTenant?.subscription_status === 'payment_issue' ||
    currentTenant?.subscription_status === 'expired' ||
    currentTenant?.subscription_status === 'past_due' ||
    isTrialExpired ||
    isSubscriptionExpired;

  const isAllowedWhenLocked = pathname === '/app/subscription' || pathname === '/app/support';

  return (
    <div className="min-h-screen bg-surface-light flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border-light shrink-0 h-screen sticky top-0 overflow-y-auto">
        {/* Brand header */}
        <div className="p-4 border-b border-border-light flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <img
              src="/light-logo.png"
              alt="HotelFlexi by NovaX AI"
              className="h-9 w-auto max-w-[170px] object-contain"
            />
          </Link>
        </div>

        {/* Tenant selector */}
        {tenants.length > 0 && (
          <div className="p-3 border-b border-border-light bg-surface-light">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-content-secondary-light mb-1">
              Active Property
            </label>
            <select
              value={currentTenant?.tenant_id || ''}
              onChange={(e) => {
                const selected = tenants.find((t) => t.tenant_id === e.target.value);
                if (selected) setCurrentTenant(selected);
              }}
              className="w-full text-xs font-semibold bg-white border border-border-light rounded-md py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-brand-blue text-content-primary-light truncate"
            >
              {tenants.map((t) => (
                <option key={t.tenant_id} value={t.tenant_id}>
                  {t.tenant_name} ({t.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nav list */}
        <nav className="flex-1 px-3 py-4 space-y-6">
          {filteredNavSections.map((sec) => (
            <div key={sec.title}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-content-secondary-light px-2 mb-1.5">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        active
                          ? 'bg-brand-blue-surface text-brand-blue font-semibold'
                          : 'text-content-secondary-light hover:bg-surface-light hover:text-content-primary-light'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${active ? 'text-brand-blue' : 'text-content-secondary-light'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-brand-blue">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Trial Countdown Banner */}
        {currentTenant?.subscription_status === 'trial' && currentTenant?.trial_ends_at && (() => {
          const nowSec = Math.floor(Date.now() / 1000);
          const daysLeft = Math.max(0, Math.ceil((currentTenant.trial_ends_at - nowSec) / 86400));
          return (
            <div className="mx-3 mb-2">
              <Link
                href="/app/subscription"
                className={`block p-3 rounded-xl border text-xs font-semibold transition ${
                  daysLeft <= 3
                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                    : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>⏳ Trial: {daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide">Upgrade →</span>
                </div>
                <div className="text-[10px] font-normal mt-0.5 opacity-75">Essential Plan — Tap to upgrade</div>
              </Link>
            </div>
          );
        })()}

        {/* Trial Countdown Banner */}
        {(currentTenant?.subscription_status === 'trial' || currentTenant?.subscription_status === 'trialing') && currentTenant?.trial_ends_at && (() => {
          const nowSec = Math.floor(Date.now() / 1000);
          const daysLeft = Math.max(0, Math.ceil((currentTenant.trial_ends_at - nowSec) / 86400));
          return (
            <div className="mx-3 mb-2">
              <Link
                href="/app/subscription"
                className={`block p-3 rounded-xl border text-xs font-semibold transition ${
                  daysLeft <= 3
                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                    : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>⏳ Trial: {daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide">Upgrade →</span>
                </div>
                <div className="text-[10px] font-normal mt-0.5 opacity-75">Essential Plan — Tap to upgrade</div>
              </Link>
            </div>
          );
        })()}

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border-light bg-surface-light">
          <div className="flex items-center justify-between pt-1">
            <div className="truncate pr-2">
              <div className="text-xs font-semibold text-content-primary-light truncate">
                {user?.displayName || user?.email?.split('@')[0]}
              </div>
              <div className="text-[10px] text-content-secondary-light truncate">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded text-content-secondary-light hover:text-status-danger hover:bg-white"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Real-time Siren Alert on Staff Devices */}
        <StaffSirenAlert />

        {/* Top Header */}
        <header className="bg-white border-b border-border-light h-14 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-1.5 rounded text-content-secondary-light hover:text-content-primary-light"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 truncate">
              <span className="text-sm font-bold text-content-primary-light truncate">
                {currentTenant?.tenant_name || 'Hotel Workspace'}
              </span>
              <span
                title="Your unique 5-Digit Property Code (Assigned to prevent miscommunication in staff & guest operations)"
                className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-[10px] tracking-wide shrink-0 shadow-sm"
              >
                Code: #{hotelCode}
              </span>
              <span
                title={`Logged in as ${userRole}`}
                className={`hidden sm:inline-flex px-2 py-0.5 rounded-md font-bold text-[10px] tracking-wide shrink-0 capitalize ${
                  userRole === 'owner'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : userRole === 'housekeeping'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                {userRole.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Support / Raise Complaint Link */}
            <Link
              href="/app/support"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition"
              title="Raise technical bug or payment issue with 5-digit hotel code"
            >
              <HelpCircle className="w-3.5 h-3.5 text-red-600" />
              Raise Bug / Help
            </Link>

            {/* Quick AI Trigger */}
            <Link
              href="/app/ai-agent"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue-surface text-brand-blue border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Assistant
            </Link>

            {/* Notifications link */}
            <Link
              href="/app/notifications"
              className="p-2 rounded-lg text-content-secondary-light hover:text-content-primary-light hover:bg-surface-light relative"
              title={unreadNotifCount > 0 ? `${unreadNotifCount} active notification(s)` : 'Notifications'}
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-brand-blue absolute top-1.5 right-1.5" />
              )}
            </Link>

            {/* Booking Engine Preview Link */}
            {currentTenant && (
              <Link
                href={`/book/${currentTenant.tenant_slug}`}
                target="_blank"
                className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-md border border-border-light text-xs font-semibold text-content-primary-light hover:bg-surface-light"
              >
                <Globe className="w-3.5 h-3.5 text-brand-blue" />
                Live Booking Engine
              </Link>
            )}
          </div>
        </header>

        {/* Unverified Email Security Banner */}
        {user && user.email && !user.emailVerified && !emailBannerDismissed && (
          <div className="bg-amber-400 text-slate-950 px-4 py-2.5 border-b border-amber-500 flex flex-wrap items-center justify-between text-xs gap-2 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-900/10 text-slate-950 shrink-0">
                <ShieldAlert className="w-4 h-4 text-amber-950" />
              </span>
              <span>
                <strong>Account Security Notice:</strong> Your registered email (<strong>{user.email}</strong>) is not verified. Please verify your email to ensure password recovery, prevent account takeover, and activate high-priority operational siren alerts.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {resendStatus ? (
                <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-100 font-bold text-[11px] animate-pulse">
                  {resendStatus}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="px-2.5 py-1 bg-white hover:bg-amber-50 text-slate-900 font-bold rounded-lg border border-amber-600/40 transition text-[11px] shadow-sm disabled:opacity-50"
                >
                  {resendingEmail ? 'Sending...' : 'Resend Verification'}
                </button>
              )}
              <Link
                href="/verify-email"
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold rounded-lg transition text-[11px] shadow-sm flex items-center gap-1"
              >
                <MailCheck className="w-3.5 h-3.5" />
                Verify Now
              </Link>
              <button
                type="button"
                onClick={() => setEmailBannerDismissed(true)}
                title="Dismiss for this session"
                className="p-1 text-slate-800 hover:text-slate-950 rounded hover:bg-amber-300 transition ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tenant Lock / Suspension Alert Banner */}
        {isAccountRestricted && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between text-xs text-status-danger">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                <strong>Account Access Restricted:</strong> This property has been marked as{' '}
                <span className="uppercase font-bold">{currentTenant?.account_access_status}</span>. Protected operations
                are currently disabled. Please contact support at info@novaxai.in.
              </span>
            </div>
          </div>
        )}

        {/* Child Pages Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {isAccountRestricted && !isAllowedWhenLocked ? (
            <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-red-200 shadow-xl p-8 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 mx-auto shadow-inner">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {isPaymentIssue
                    ? 'Payment Issue: Software Dues Pending'
                    : isTrialExpired
                    ? '14-Day Free Trial Expired'
                    : isSubscriptionExpired
                    ? 'Subscription Period Expired'
                    : 'Property Profile Locked'}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-content-primary-light tracking-tight">
                  {isPaymentIssue
                    ? 'Account Suspended: Outstanding Dues Pending'
                    : isTrialExpired
                    ? 'Your 14-Day Free Trial Has Ended'
                    : isSubscriptionExpired
                    ? 'Your Subscription Has Expired'
                    : 'Hotel Workspace Access Locked'}
                </h2>
                <p className="text-sm text-content-secondary-light max-w-lg mx-auto leading-relaxed">
                  {apiLockedReason ||
                    currentTenant?.suspension_reason ||
                    (isPaymentIssue
                      ? 'Your property operations have been paused due to an unpaid subscription invoice. Please clear your dues or pay your bill to immediately restore full access to your bookings, rooms, and front desk.'
                      : isTrialExpired
                      ? 'Your trial period has concluded. To reactivate your live Channel Manager, Housekeeping Urgency Siren, and Front Desk operations, please upgrade to a paid plan or switch to the Free Starter tier.'
                      : 'Your billing period has ended. Please renew your subscription to restore full access to your property workspace.')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-light border border-border-light text-left text-xs space-y-2">
                <div className="font-bold text-content-primary-light flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Your hotel data is 100% safe and cryptographically preserved
                </div>
                <p className="text-content-secondary-light">
                  All room inventories, rate plans, guest records, and past folios are safely stored.
                  Backend APIs are locked until dues are settled. Workspace unlocks instantly once your payment invoice is cleared.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/app/subscription"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-blue text-white font-extrabold text-xs sm:text-sm hover:bg-blue-700 shadow-md transition text-center"
                >
                  {isPaymentIssue ? 'Clear Dues & Pay Online →' : 'Choose Plan & Unlock Workspace →'}
                </Link>
                <Link
                  href="/app/support"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-border-light bg-surface-light text-content-primary-light font-bold text-xs sm:text-sm hover:bg-white transition text-center"
                >
                  Submit Ticket to Support Team
                </Link>
              </div>
            </div>
          ) : !isAllowedForRole ? (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-border-light shadow-xl text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-content-primary-light">
                Access Restricted: {userRole === 'housekeeping' ? 'Housekeeping Staff' : `${userRole.toUpperCase()} Role`}
              </h2>
              <p className="text-sm text-content-secondary-light leading-relaxed">
                Your staff account is assigned to <strong>{userRole.replace('_', ' ')}</strong> operations.
                Access to bookings, room rates, channel settings, billing, and owner configuration is restricted by your hotel management.
              </p>
              <div className="pt-2">
                <Link
                  href={userRole === 'housekeeping' ? '/app/housekeeping' : '/app'}
                  className="px-6 py-2.5 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-blue-700 shadow transition inline-flex items-center gap-2"
                >
                  <span>Go to {userRole === 'housekeeping' ? 'Housekeeping Workspace' : 'Permitted Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Mobile Sidebar Drawer with Backdrop Auto-Close */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm flex transition-opacity"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 bg-white h-full flex flex-col p-4 space-y-4 shadow-2xl animate-in slide-in-from-left duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <Link href="/app" onClick={() => setMobileSidebarOpen(false)} className="inline-block">
                <img
                  src="/light-logo.png"
                  alt="HotelFlexi"
                  className="h-8 w-auto max-w-[150px] object-contain"
                />
              </Link>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-content-secondary-light hover:bg-surface-light"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {filteredNavSections.map((sec) => (
                <div key={sec.title}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-content-secondary-light mb-1">
                    {sec.title}
                  </div>
                  <div className="space-y-1">
                    {sec.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-lg text-xs ${
                          pathname === item.href ? 'bg-brand-blue text-white font-bold' : 'text-content-secondary-light'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={logout}
              className="w-full py-2 rounded-lg bg-surface-light text-status-danger text-xs font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
