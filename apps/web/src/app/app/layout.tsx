'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
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
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isPlatformAdmin, tenants, currentTenant, setCurrentTenant, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && tenants.length === 0 && pathname !== '/app/onboarding') {
      router.push('/app/onboarding');
    }
  }, [user, loading, tenants, pathname, router]);

  if (loading) {
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
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Housekeeping', href: '/app/housekeeping', icon: ClipboardList },
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
        { label: 'Audit Log', href: '/app/audit-log', icon: FileText },
      ],
    },
  ];

  const isAccountRestricted =
    currentTenant?.account_access_status === 'suspended' ||
    currentTenant?.account_access_status === 'locked';

  return (
    <div className="min-h-screen bg-surface-light flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border-light shrink-0 h-screen sticky top-0 overflow-y-auto">
        {/* Brand header */}
        <div className="p-4 border-b border-border-light flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center text-white">
              <Hotel className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-content-primary-light leading-none">
                Hotel<span className="text-brand-blue">Flexi</span>
              </div>
              <div className="text-[9px] uppercase tracking-wider text-content-secondary-light font-semibold mt-0.5">
                NovaX AI System
              </div>
            </div>
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
          {navSections.map((sec) => (
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

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border-light bg-surface-light">
          {isPlatformAdmin && (
            <Link
              href="/admin"
              className="w-full mb-2 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition"
            >
              <Shield className="w-3.5 h-3.5" />
              Platform Super-Admin
            </Link>
          )}

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
        {/* Top Header */}
        <header className="bg-white border-b border-border-light h-14 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-1.5 rounded text-content-secondary-light hover:text-content-primary-light"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-bold text-content-primary-light truncate">
              {currentTenant?.tenant_name || 'Hotel Workspace'}
            </div>
          </div>

          <div className="flex items-center gap-3">
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
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-brand-blue absolute top-1.5 right-1.5" />
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
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/50 flex">
          <div className="w-64 bg-white h-full flex flex-col p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div className="font-extrabold text-base text-content-primary-light">
                Hotel<span className="text-brand-blue">Flexi</span>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-content-secondary-light">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {navSections.map((sec) => (
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
