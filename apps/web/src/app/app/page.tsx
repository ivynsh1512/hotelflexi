'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  BedDouble,
  DollarSign,
  UserCheck,
  UserX,
  PlusCircle,
  Sparkles,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  Lock,
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
        const propData = await apiClient('/properties');
        const activeProp = propData.properties?.[0];
        setProperty(activeProp);

        if (activeProp) {
          // Fetch rooms
          const roomData = await apiClient(`/rooms?property_id=${activeProp.id}`);
          setRooms(roomData.rooms || []);

          // Fetch reservations today
          const resData = await apiClient(`/reservations?property_id=${activeProp.id}&status=confirmed`);
          setArrivals(resData.reservations?.slice(0, 5) || []);

          // Fetch daily collections
          const colData = await apiClient(`/reports/daily-collections?property_id=${activeProp.id}&date=${today}`);
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

  const totalRooms = rooms.length || 1;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const dirtyRooms = rooms.filter((r) => r.housekeeping_status === 'dirty').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance').length;
  const availableRooms = rooms.filter((r) => r.status === 'available').length;
  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

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

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Occupancy */}
        <div className="p-4 rounded-xl bg-white border border-border-light shadow-sm">
          <div className="flex items-center justify-between text-content-secondary-light text-xs font-medium">
            <span>Occupancy Rate</span>
            <BedDouble className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-content-primary-light">{occupancyRate}%</div>
          <div className="text-[11px] text-content-secondary-light mt-0.5">
            {occupiedRooms} of {totalRooms} rooms occupied
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
            {dirtyRooms === 0 ? 'All rooms inspected & clean' : 'Rooms requiring cleaning'}
          </div>
        </div>
      </div>

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
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span>Dirty / Cleaning ({dirtyRooms})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500" />
              <span>Maintenance ({maintenanceRooms})</span>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {rooms.map((room) => {
              const isOccupied = room.status === 'occupied';
              const isDirty = room.housekeeping_status === 'dirty';
              const isMaint = room.status === 'maintenance';

              return (
                <div
                  key={room.id}
                  className={`p-3 rounded-xl border text-center transition ${
                    isMaint
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : isOccupied
                      ? 'bg-blue-50 border-blue-200 text-brand-blue'
                      : isDirty
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <div className="font-extrabold text-sm">{room.room_number}</div>
                  <div className="text-[10px] font-medium opacity-80 truncate">{room.room_type_name || 'Room'}</div>
                  <div className="text-[9px] uppercase font-bold mt-1">
                    {isMaint ? 'Maint' : isOccupied ? 'Occupied' : isDirty ? 'Dirty' : 'Clean'}
                  </div>
                </div>
              );
            })}
          </div>
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
            <div className="text-center py-8 text-xs text-content-secondary-light">
              No pending arrivals for today.
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
