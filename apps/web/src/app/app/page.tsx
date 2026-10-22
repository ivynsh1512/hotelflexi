'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  BedDouble,
  DollarSign,
  UserCheck,
  PlusCircle,
  Sparkles,
  AlertCircle,
  Loader2,
  ClipboardList,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [arrivals, setArrivals] = useState<any[]>([]);
  const [dailyCollections, setDailyCollections] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentTenant) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch properties
        const propData = await apiClient('/properties').catch(() => ({ properties: [] }));
        const activeProp = propData.properties?.[0];
        setProperty(activeProp);

        if (activeProp) {
          const [roomData, resData, colData] = await Promise.all([
            apiClient(`/rooms?property_id=${activeProp.id}`).catch(() => ({ rooms: [] })),
            apiClient(`/reservations?property_id=${activeProp.id}&status=confirmed`).catch(() => ({ reservations: [] })),
            apiClient(`/reports/daily-collections?property_id=${activeProp.id}&date=${today}`).catch(() => ({ totalPaise: 0 })),
          ]);

          setRooms(roomData.rooms || []);
          setArrivals(resData.reservations?.slice(0, 5) || []);
          setDailyCollections(colData.totalPaise || 0);
        }
      } catch (err: any) {
        console.error('Dashboard load failed:', err);
        setError(err.message || 'Failed to load property data.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [currentTenant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const dirtyRooms = rooms.filter((r) => r.housekeeping_status === 'dirty').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance').length;
  const blockedRooms = rooms.filter((r) => r.status === 'blocked' || r.is_blocked).length;
  const availableRooms = rooms.filter((r) => (r.status === 'available' || !r.status) && !r.is_blocked && r.status !== 'blocked').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Front Desk Operations
          </h1>
          <p className="text-xs text-content-secondary-light">
            Property: {property?.name || 'Default Property'} • Today: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/reservations/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            New Walk-in Booking
          </Link>
          <Link
            href="/app/ai-agent"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-border-light text-brand-blue text-xs font-semibold hover:bg-surface-light transition"
          >
            <Sparkles className="w-4 h-4" />
            AI Assistant
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-status-danger text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Getting Started Banner when 0 rooms */}
      {totalRooms === 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-blue font-bold text-sm">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Welcome to {property?.name || 'HotelFlexi'}! Complete Your Setup</span>
            </div>
            <p className="text-xs text-content-secondary-light max-w-xl">
              No rooms configured yet. Add your room categories (e.g. Deluxe, Suite) and your room units (e.g. 101, 102) to begin accepting bookings and managing housekeeping.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/app/room-types"
              className="px-3.5 py-2 rounded-lg bg-white border border-border-light text-brand-blue text-xs font-semibold hover:bg-surface-light shadow-sm transition"
            >
              1. Add Categories
            </Link>
            <Link
              href="/app/rooms"
              className="px-3.5 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
            >
              2. Add Rooms →
            </Link>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Occupancy */}
        <div className="p-4 rounded-xl bg-white border border-border-light shadow-sm">
          <div className="flex items-center justify-between text-content-secondary-light text-xs font-medium">
            <span>Occupancy Rate</span>
            <BedDouble className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-content-primary-light">
            {totalRooms > 0 ? `${occupancyRate}%` : '—'}
          </div>
          <div className="text-[11px] text-content-secondary-light mt-0.5">
            {totalRooms > 0 ? `${occupiedRooms} of ${totalRooms} rooms occupied` : '0 rooms configured'}
          </div>
        </div>

        {/* Daily Collections */}
        <div className="p-4 rounded-xl bg-white border border-border-light shadow-sm">
          <div className="flex items-center justify-between text-content-secondary-light text-xs font-medium">
            <span>Today's Collections</span>
            <DollarSign className="w-4 h-4 text-status-success" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-content-primary-light">
            {formatINR(dailyCollections)}
          </div>
          <div className="text-[11px] text-content-secondary-light mt-0.5">
            Captured across UPI, cash, cards
          </div>
        </div>

        {/* Arrivals */}
        <div className="p-4 rounded-xl bg-white border border-border-light shadow-sm">
          <div className="flex items-center justify-between text-content-secondary-light text-xs font-medium">
            <span>Expected Arrivals</span>
            <UserCheck className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-content-primary-light">
            {arrivals.length}
          </div>
          <div className="text-[11px] text-content-secondary-light mt-0.5">
            Scheduled for check-in today
          </div>
        </div>

        {/* Housekeeping Alert */}
        <div className="p-4 rounded-xl bg-white border border-border-light shadow-sm">
          <div className="flex items-center justify-between text-content-secondary-light text-xs font-medium">
            <span>Housekeeping</span>
            <ClipboardList className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-content-primary-light">
            {dirtyRooms}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">
            {totalRooms === 0 ? 'No rooms assigned' : dirtyRooms === 0 ? 'All rooms inspected & clean' : 'Rooms requiring cleaning'}
          </div>
        </div>
      </div>

      {/* Room Status Board */}
      {rooms.length > 0 && (
        <div className="bg-white rounded-2xl border border-border-light p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-extrabold text-content-primary-light">Room Status Board</h2>
              <p className="text-[10px] text-content-secondary-light">Live occupancy — click a room to manage</p>
            </div>
            <Link href="/app/rooms" className="text-[10px] font-bold text-brand-blue hover:underline">View All →</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {rooms.map((room: any) => {
              const statusColors: Record<string, string> = {
                available: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                occupied: 'bg-blue-50 border-blue-200 text-blue-700',
                dirty: 'bg-amber-50 border-amber-200 text-amber-700',
                maintenance: 'bg-red-50 border-red-200 text-red-700',
                blocked: 'bg-gray-100 border-gray-200 text-gray-500',
                checkout: 'bg-purple-50 border-purple-200 text-purple-700',
              };
              const cls = statusColors[room.status] || statusColors.available;
              return (
                <Link
                  key={room.id}
                  href="/app/rooms"
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border text-center transition hover:scale-105 ${cls}`}
                >
                  <span className="text-[11px] font-extrabold">{room.room_number}</span>
                  <span className="text-[8px] font-semibold capitalize mt-0.5">{room.status}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex gap-3 mt-3 flex-wrap">
            {[['available','bg-emerald-400'],['occupied','bg-blue-400'],['dirty','bg-amber-400'],['maintenance','bg-red-400'],['blocked','bg-gray-300']].map(([s, col]) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${col}`} />
                <span className="text-[9px] text-content-secondary-light capitalize">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Room Status Matrix & Today's Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Status Matrix */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-border-light shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-content-primary-light flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-brand-blue" />
              Live Room Inventory Matrix
            </h2>
            <Link href="/app/rooms" className="text-xs text-brand-blue hover:underline font-semibold">
              Manage Rooms & Housekeeping →
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-medium pb-2 border-b border-border-light">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span>Available ({availableRooms})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-brand-blue" />
              <span>Occupied ({occupiedRooms})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-600" />
              <span>Blocked ({blockedRooms})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span>Dirty / Cleaning ({dirtyRooms})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500" />
              <span>Maintenance ({maintenanceRooms})</span>
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-xl border border-dashed border-border-light bg-surface-light/40 space-y-3">
              <BedDouble className="w-10 h-10 text-content-secondary-light mx-auto" />
              <div className="font-bold text-sm text-content-primary-light">No Rooms Created Yet</div>
              <p className="text-xs text-content-secondary-light max-w-sm mx-auto">
                Add your actual room units (e.g. 101, 102, Villa 1) under Room Management to view your live room matrix.
              </p>
              <div className="pt-1">
                <Link
                  href="/app/rooms"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Your Rooms
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {rooms.map((room) => {
                const isOccupied = room.status === 'occupied';
                const isBlocked = room.status === 'blocked' || Boolean(room.is_blocked);
                const isMaint = room.status === 'maintenance';
                const isDirty = room.housekeeping_status === 'dirty';

                return (
                  <div
                    key={room.id}
                    title={isBlocked ? `Blocked${room.block_reason ? `: ${room.block_reason}` : ''}${room.blocked_until ? ` until ${room.blocked_until}` : ''}` : undefined}
                    className={`p-3 rounded-xl border text-center transition ${
                      isMaint
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : isOccupied
                        ? 'bg-blue-50 border-blue-200 text-brand-blue'
                        : isBlocked
                        ? 'bg-purple-50 border-purple-300 text-purple-900 ring-1 ring-purple-300'
                        : isDirty
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <div className="font-extrabold text-sm">{room.room_number}</div>
                    <div className="text-[10px] font-medium opacity-80 truncate">{room.room_type_name || 'Room'}</div>
                    <div className="text-[9px] uppercase font-bold mt-1">
                      {isMaint ? 'Maint' : isOccupied ? 'Occupied' : isBlocked ? 'Blocked' : isDirty ? 'Dirty' : 'Clean'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expected Arrivals Feed */}
        <div className="p-5 rounded-2xl bg-white border border-border-light shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-content-primary-light flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-blue" />
              Upcoming Arrivals
            </h2>
            <Link href="/app/reservations" className="text-xs text-brand-blue hover:underline font-semibold">
              All Bookings →
            </Link>
          </div>

          {arrivals.length === 0 ? (
            <div className="text-center py-8 text-xs text-content-secondary-light space-y-2">
              <div>No pending arrivals for today.</div>
              <Link
                href="/app/reservations/new"
                className="inline-flex items-center gap-1 text-brand-blue font-semibold hover:underline"
              >
                <PlusCircle className="w-3.5 h-3.5" /> New Walk-in Booking
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {arrivals.map((res) => (
                <div key={res.id} className="p-3 rounded-xl border border-border-light bg-surface-light text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-content-primary-light">{res.guest_name || 'Guest'}</span>
                    <span className="text-[10px] font-mono text-content-secondary-light">{res.reservation_number}</span>
                  </div>
                  <div className="text-content-secondary-light flex items-center justify-between">
                    <span>Room: {res.room_number || 'Unassigned'}</span>
                    <span className="font-semibold text-content-primary-light">{formatINR(res.total_amount_paise)}</span>
                  </div>
                  <div className="text-[11px] text-content-secondary-light">
                    {res.check_in_date} to {res.check_out_date}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
