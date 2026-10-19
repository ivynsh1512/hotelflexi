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
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, isPlatformAdmin, refreshUser } = useAuth();
  const [rechecking, setRechecking] = React.useState(false);

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
      {/* Super Admin Sidebar */}
      <aside className="w-full md:w-64 bg-surface-dark-surface border-r border-border-dark shrink-0 flex flex-col h-auto md:h-screen sticky top-0 overflow-y-auto">
        <div className="p-4 border-b border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white">HotelFlexi</div>
              <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Super-Admin Panel</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
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
