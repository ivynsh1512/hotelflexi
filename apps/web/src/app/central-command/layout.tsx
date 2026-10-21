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
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  // Super-Admin is strictly for Desktop / Web browser only, not the mobile app
  if (isStandaloneApp) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-brand-blue flex items-center justify-center mx-auto">
            <Monitor className="w-8 h-8 text-brand-blue" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Super-Admin is Web Portal Only</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Platform infrastructure, complaints, finances, and push broadcasts are managed exclusively via the desktop web portal to maintain security and operational oversight.
          </p>
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-mono">
            Open https://hotelflexi.com/central-command on your laptop or desktop browser.
          </div>
          <Link
            href="/app"
            className="inline-block w-full py-2.5 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow-sm"
          >
            Return to Hotel PMS
          </Link>
        </div>
      </div>
    );
  }

  // Security protection: To unauthorized users and scanners, /admin is completely disguised as a 404 Not Found
  if (!user || !isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl font-extrabold text-slate-300">404</div>
          <h1 className="text-xl font-bold text-slate-800">Page Not Found</h1>
          <p className="text-xs text-slate-500">
            The page you are looking for does not exist, has been removed, or is temporarily unavailable.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow-sm"
            >
              Back to HotelFlexi Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Platform Overview', href: '/central-command', icon: LayoutDashboard },
    { label: 'Tenants & Properties', href: '/central-command/tenants', icon: Users },
    { label: 'SaaS Plans & Pricing', href: '/central-command/subscriptions', icon: DollarSign },
    { label: 'Platform Finance', href: '/central-command/finance', icon: PieChart },
    { label: 'Platform Expenses', href: '/central-command/finance/expenses', icon: DollarSign },
    { label: 'Hotelier Complaints & Bugs', href: '/central-command/complaints', icon: AlertTriangle },
    { label: 'Push Broadcast Center', href: '/central-command/broadcast', icon: Bell },
    { label: 'Administrative Audit Log', href: '/central-command/audit-log', icon: FileText },
    { label: 'Admin Settings', href: '/central-command/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-blue flex items-center justify-center text-white font-bold shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-xs text-slate-900 truncate">HotelFlexi Super-Admin</div>
            <div className="text-[9px] uppercase font-bold text-brand-blue tracking-wider">Control Center</div>
          </div>
        </div>

        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
          aria-label="Toggle navigation menu"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Super Admin Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-0 w-72 md:w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col h-screen overflow-y-auto transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center text-white font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">HotelFlexi</div>
              <div className="text-[10px] uppercase font-bold text-brand-blue tracking-wider">Super-Admin Panel</div>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-slate-700"
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
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 bg-white">
          <Link
            href="/app"
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Hotel PMS
          </Link>
          <div className="mt-2 text-center text-[10px] text-slate-500 truncate">
            Admin: {user.email}
          </div>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0 bg-slate-50">
        {children}
      </main>
    </div>
  );
}
