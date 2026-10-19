'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  LayoutDashboard,
  Users,
  DollarSign,
  PieChart,
  FileText,
  Settings,
  ArrowLeft,
  Lock,
  Loader2,
  AlertTriangle,
  Bell,
  Monitor,
  Menu,
  X,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, isPlatformAdmin, refreshUser } = useAuth();
  const [rechecking, setRechecking] = React.useState(false);
  const [isStandaloneApp, setIsStandaloneApp] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandaloneApp(isStandalone);
    }
  }, []);

  const handleRecheck = async () => {
    setRechecking(true);
    try {
      await refreshUser();
    } finally {
      setRechecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dark-bg text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Super-Admin is strictly for Desktop / Web browser only, not the mobile app
  if (isStandaloneApp) {
    return (
      <div className="min-h-screen bg-surface-dark-bg text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-surface-dark-surface border border-purple-900/50 space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-700/60 text-purple-400 flex items-center justify-center mx-auto">
            <Monitor className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-xl font-black text-white">Super-Admin is Web Portal Only</h2>
          <p className="text-xs text-content-secondary-dark leading-relaxed">
            Platform infrastructure, complaints, finances, and push broadcasts are managed exclusively via the desktop web portal to maintain security and operational oversight.
          </p>
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-300 font-mono">
            Open https://hotelflexi.novaxai.in/admin on your laptop or desktop browser.
          </div>
          <Link
            href="/app"
            className="inline-block w-full py-2.5 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition"
          >
            Return to Hotel PMS
          </Link>
        </div>
      </div>
    );
  }

  // Server-side allowlist security guard
  if (!user || !isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-surface-dark-bg text-content-primary-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-surface-dark-surface border border-border-dark text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800 text-status-danger flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-extrabold text-white">403 Forbidden: Super-Admin Access Required</h1>
          <p className="text-xs text-content-secondary-dark leading-relaxed">
            Your current account (<span className="text-white font-mono">{user?.email || 'Anonymous'}</span>) is not authorized on the NovaX AI super-admin allowlist (<span className="text-purple-400 font-mono">ADMIN_EMAILS</span>).
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <button
              onClick={handleRecheck}
              disabled={rechecking}
              className="py-2.5 px-4 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {rechecking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Checking Authorization...
                </>
              ) : (
                'Re-verify Admin Status'
              )}
            </button>
            <Link
              href="/app"
              className="py-2.5 px-4 rounded-lg bg-surface-dark-elevated border border-border-dark text-xs font-semibold hover:bg-border-dark transition text-white"
            >
              Return to Hotel PMS Dashboard
            </Link>
            <Link
              href="/login"
              className="py-2.5 px-4 rounded-lg border border-border-dark text-content-secondary-dark text-xs font-semibold hover:bg-surface-dark-elevated transition"
            >
              Sign In with Different Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Platform Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Tenants & Properties', href: '/admin/tenants', icon: Users },
    { label: 'SaaS Plans & Pricing', href: '/admin/subscriptions', icon: DollarSign },
    { label: 'Platform Finance', href: '/admin/finance', icon: PieChart },
    { label: 'Platform Expenses', href: '/admin/finance/expenses', icon: DollarSign },
    { label: 'Hotelier Complaints & Bugs', href: '/admin/complaints', icon: AlertTriangle },
    { label: 'Push Broadcast Center', href: '/admin/broadcast', icon: Bell },
    { label: 'Administrative Audit Log', href: '/admin/audit-log', icon: FileText },
    { label: 'Admin Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface-dark-bg text-content-primary-dark flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-surface-dark-surface border-b border-border-dark px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-xs text-white truncate">HotelFlexi Super-Admin</div>
            <div className="text-[9px] uppercase font-bold text-purple-400 tracking-wider">Control Center</div>
          </div>
        </div>

        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 rounded-lg bg-surface-dark-elevated text-content-secondary-dark hover:text-white border border-border-dark"
          aria-label="Toggle navigation menu"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Super Admin Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-0 w-72 md:w-64 bg-surface-dark-surface border-r border-border-dark shrink-0 flex flex-col h-screen overflow-y-auto transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white">HotelFlexi</div>
              <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Super-Admin Panel</div>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1 text-content-secondary-dark hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  active
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-content-secondary-dark hover:bg-surface-dark-elevated hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border-dark bg-surface-dark-surface">
          <Link
            href="/app"
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface-dark-elevated border border-border-dark text-xs font-semibold text-content-secondary-dark hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Hotel PMS
          </Link>
          <div className="mt-2 text-center text-[10px] text-content-secondary-dark truncate">
            Admin: {user.email}
          </div>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
