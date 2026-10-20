'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Lock,
  Sparkles,
  ArrowRight,
  Calendar,
  DollarSign,
  Sliders,
  ShieldAlert,
  Check,
  X,
  ChevronRight,
  AlertTriangle,
  Plus,
  Play,
  Building,
  Filter,
  RotateCw,
  Ban,
  DoorOpen,
  ArrowUpRight,
  Info,
  Settings,
  Activity,
  History,
} from 'lucide-react';

// Channel Logos
function BookingComLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} bg-[#003580] rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm`}>
      <span className="font-sans font-black text-xs tracking-tight">B.</span>
    </div>
  );
}

function AgodaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center p-1 shrink-0 shadow-sm`}>
      <div className="flex gap-0.5 mb-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#47a23b]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#e12d2d]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb700]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#8e44ad]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#2980b9]"></span>
      </div>
      <span className="text-[8px] font-extrabold text-slate-800 tracking-tighter">agoda</span>
    </div>
  );
}

function MakeMyTripLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} bg-[#ea2330] rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden relative`}>
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[#003980]" />
      <span className="relative z-10 text-[9px] font-black tracking-tighter uppercase font-mono">MMT</span>
    </div>
  );
}

function AirbnbLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} bg-[#FF385C] rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm`}>
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C8.5 2 5.5 5 5.5 8.5c0 4.5 6.5 12.5 6.5 12.5s6.5-8 6.5-12.5C18.5 5 15.5 2 12 2zm0 11.5c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
      </svg>
    </div>
  );
}

function ExpediaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} bg-[#FFC423] rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
      <span className="font-black text-[9px] text-slate-900 tracking-tighter">EXP</span>
    </div>
  );
}

function TripAdvisorLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} bg-[#00AF87] rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white font-black text-[9px] tracking-tighter`}>
      TA
    </div>
  );
}

export default function ChannelManagerAppPage() {
  const { currentTenant } = useAuth();
  const [activeTab, setActiveTab] = useState<'channels' | 'matrix' | 'queue' | 'simulator'>('channels');
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [connections, setConnections] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [syncJobs, setSyncJobs] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Matrix state
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixData, setMatrixData] = useState<{ dates: string[]; roomTypes: any[]; matrix: any[] }>({
    dates: [],
    roomTypes: [],
    matrix: [],
  });
  const [matrixStartDate, setMatrixStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [matrixDaysCount, setMatrixDaysCount] = useState<number>(14);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('all');

  // Connect modal state
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [targetChannel, setTargetChannel] = useState<any>(null);
  const [connectForm, setConnectForm] = useState({
    hotelChannelId: '',
    environment: 'sandbox',
    apiKey: '',
    apiSecret: '',
  });
  const [connecting, setConnecting] = useState(false);

  // Bulk editor modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    roomTypeId: '',
    startDate: '',
    endDate: '',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    price: '',
    closed: 'unchanged', // 'open', 'closed', 'unchanged'
    closedToArrival: 'unchanged',
    closedToDeparture: 'unchanged',
    minStayArrival: '',
    maxStay: '',
    overrideInventory: '',
    note: '',
  });
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string | null>(null);

  // Simulation state
  const [simulating, setSimulating] = useState(false);
  const [simForm, setSimForm] = useState({
    connectionId: '',
    guestName: 'Ananya Sharma',
    roomTypeId: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    status: 'confirmed',
    totalAmountRupees: '7000',
  });
  const [simResult, setSimResult] = useState<any>(null);

  const channelCatalog = [
    { id: 'booking_com', name: 'Booking.com', component: BookingComLogo, category: 'Global OTA', desc: 'World’s largest travel marketplace' },
    { id: 'agoda', name: 'Agoda', component: AgodaLogo, category: 'Asia-Pacific OTA', desc: 'Leading hotel distribution across APAC' },
    { id: 'makemytrip', name: 'MakeMyTrip / Goibibo', component: MakeMyTripLogo, category: 'Domestic Indian OTA', desc: 'IngoMMT automated ARI sync' },
    { id: 'airbnb', name: 'Airbnb', component: AirbnbLogo, category: 'Vacation & Homestays', desc: 'Boutique rooms & direct guest bookings' },
    { id: 'expedia', name: 'Expedia Group', component: ExpediaLogo, category: 'Global Distribution', desc: 'Expedia QuickConnect & Hotels.com' },
    { id: 'tripadvisor', name: 'Tripadvisor', component: TripAdvisorLogo, category: 'Metasearch & Direct Connect', desc: 'Tripadvisor Instant Booking & Plus (Global Metasearch)', isComingSoon: true },
  ];

  // Load properties & initial data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setIsLocked(false);

    try {
      const propData = await apiClient('/properties');
      const propList = propData.properties || [];
      setProperties(propList);
      const activeProp = propList[0];

      if (activeProp) {
        setPropertyId(activeProp.id);

        const [cData, hData, jData, rtData] = await Promise.all([
          apiClient(`/channels/connections?property_id=${activeProp.id}`),
          apiClient(`/channels/history?property_id=${activeProp.id}`).catch(() => ({ history: [] })),
          apiClient(`/channels/jobs?property_id=${activeProp.id}`).catch(() => ({ jobs: [] })),
          apiClient(`/rooms/types?property_id=${activeProp.id}`).catch(() => ({ roomTypes: [] })),
        ]);

        setConnections(cData.connections || []);
        setHistory(hData.history || []);
        setSyncJobs(jData.jobs || []);
        const rTypes = rtData.roomTypes || [];
        setRoomTypes(rTypes);

        if (rTypes.length > 0) {
          setBulkForm((prev) => ({ ...prev, roomTypeId: rTypes[0].id }));
          setSimForm((prev) => ({ ...prev, roomTypeId: rTypes[0].id }));
        }
      }
    } catch (e: any) {
      if (e.message?.includes('Channel Manager') || e.message?.includes('upgrade') || e.message?.includes('Plan')) {
        setIsLocked(true);
      }
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    if (currentTenant) {
      loadInitialData();
    }
  }, [currentTenant, loadInitialData]);

  // Load Matrix Data
  const loadMatrix = useCallback(async () => {
    if (!propertyId) return;
    setMatrixLoading(true);
    try {
      const start = new Date(matrixStartDate);
      const end = new Date(start);
      end.setDate(end.getDate() + matrixDaysCount - 1);
      const endStr = end.toISOString().split('T')[0];

      let url = `/channels/inventory-matrix?property_id=${propertyId}&start_date=${matrixStartDate}&end_date=${endStr}`;
      if (selectedRoomTypeId !== 'all') {
        url += `&room_type_id=${selectedRoomTypeId}`;
      }

      const res = await apiClient(url);
      setMatrixData(res);
    } catch (err: any) {
      console.error('Failed to load matrix:', err);
    } finally {
      setMatrixLoading(false);
    }
  }, [propertyId, matrixStartDate, matrixDaysCount, selectedRoomTypeId]);

  useEffect(() => {
    if (activeTab === 'matrix' && propertyId) {
      loadMatrix();
    }
  }, [activeTab, propertyId, loadMatrix]);

  // Handle Sync Now
  const handleSync = async (connId: string) => {
    setSyncingId(connId);
    try {
      await apiClient(`/channels/sync/${connId}`, {
        method: 'POST',
        body: JSON.stringify({ jobType: 'full_sync' }),
      });
      // Refresh connections and jobs
      const [cData, jData, hData] = await Promise.all([
        apiClient(`/channels/connections?property_id=${propertyId}`),
        apiClient(`/channels/jobs?property_id=${propertyId}`),
        apiClient(`/channels/history?property_id=${propertyId}`),
      ]);
      setConnections(cData.connections || []);
      setSyncJobs(jData.jobs || []);
      setHistory(hData.history || []);
      alert('Live sync triggered successfully. Rate and inventory pushed to channel.');
    } catch (e: any) {
      alert(e.message || 'Sync failed.');
    } finally {
      setSyncingId(null);
    }
  };

  // Open Connect / Configure Modal
  const openConnectModal = (ch: any, existingConn?: any) => {
    setTargetChannel(ch);
    setConnectForm({
      hotelChannelId: existingConn?.hotel_channel_id || `${ch.id.toUpperCase()}_${Math.floor(100000 + Math.random() * 900000)}`,
      environment: existingConn?.environment || 'sandbox',
      apiKey: '',
      apiSecret: '',
    });
    setConnectModalOpen(true);
  };

  // Save Connection
  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetChannel) return;
    setConnecting(true);
    try {
      await apiClient('/channels/connections', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          channelName: targetChannel.id,
          hotelChannelId: connectForm.hotelChannelId,
          environment: connectForm.environment,
          apiKey: connectForm.apiKey,
          apiSecret: connectForm.apiSecret,
        }),
      });
      setConnectModalOpen(false);
      // Refresh connections
      const cData = await apiClient(`/channels/connections?property_id=${propertyId}`);
      setConnections(cData.connections || []);
      alert(`Successfully configured ${targetChannel.name} in ${connectForm.environment} mode!`);
    } catch (err: any) {
      alert(err.message || 'Failed to configure channel');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect Channel
  const handleDisconnect = async (connId: string, channelName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${channelName}? This will pause all live rate and inventory synchronization.`)) {
      return;
    }
    try {
      await apiClient(`/channels/connections/${connId}`, { method: 'DELETE' });
      const cData = await apiClient(`/channels/connections?property_id=${propertyId}`);
      setConnections(cData.connections || []);
    } catch (err: any) {
      alert(err.message || 'Failed to disconnect channel');
    }
  };

  // Retry Sync Job
  const handleRetryJob = async (jobId: string) => {
    try {
      const res = await apiClient(`/channels/jobs/${jobId}/retry`, { method: 'POST' });
      alert(`Job retry triggered. Status: ${res.status}`);
      const jData = await apiClient(`/channels/jobs?property_id=${propertyId}`);
      setSyncJobs(jData.jobs || []);
    } catch (err: any) {
      alert(err.message || 'Retry trigger failed');
    }
  };

  // Open Bulk Editor for specific cell
  const openBulkForDate = (rtId: string, date: string) => {
    setBulkForm({
      roomTypeId: rtId,
      startDate: date,
      endDate: date,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      price: '',
      closed: 'unchanged',
      closedToArrival: 'unchanged',
      closedToDeparture: 'unchanged',
      minStayArrival: '',
      maxStay: '',
      overrideInventory: '',
      note: 'Single date adjustment',
    });
    setBulkModalOpen(true);
  };

  // Submit Bulk Update
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkForm.roomTypeId || !bulkForm.startDate || !bulkForm.endDate) {
      alert('Room type, start date, and end date are required.');
      return;
    }
    setBulkSubmitting(true);
    setBulkSuccessMessage(null);

    try {
      const payload: any = {
        propertyId,
        roomTypeId: bulkForm.roomTypeId,
        startDate: bulkForm.startDate,
        endDate: bulkForm.endDate,
        daysOfWeek: bulkForm.daysOfWeek.length === 7 ? undefined : bulkForm.daysOfWeek,
        note: bulkForm.note || undefined,
      };

      if (bulkForm.price) {
        payload.pricePaise = Math.round(parseFloat(bulkForm.price) * 100);
      }
      if (bulkForm.closed === 'closed') payload.closed = true;
      if (bulkForm.closed === 'open') payload.closed = false;

      if (bulkForm.closedToArrival === 'closed') payload.closedToArrival = true;
      if (bulkForm.closedToArrival === 'open') payload.closedToArrival = false;

      if (bulkForm.closedToDeparture === 'closed') payload.closedToDeparture = true;
      if (bulkForm.closedToDeparture === 'open') payload.closedToDeparture = false;

      if (bulkForm.minStayArrival) {
        payload.minStayArrival = parseInt(bulkForm.minStayArrival, 10);
      }
      if (bulkForm.maxStay) {
        payload.maxStay = parseInt(bulkForm.maxStay, 10);
      }
      if (bulkForm.overrideInventory) {
        payload.overrideInventory = parseInt(bulkForm.overrideInventory, 10);
      }

      const res = await apiClient('/channels/bulk-update', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setBulkSuccessMessage(res.message);
      loadMatrix();
      setTimeout(() => {
        setBulkModalOpen(false);
        setBulkSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Bulk update failed');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Run Simulator Booking
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simForm.connectionId || !simForm.roomTypeId) {
      alert('Please select a channel connection and room type.');
      return;
    }
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await apiClient('/channels/simulate-booking', {
        method: 'POST',
        body: JSON.stringify({
          connectionId: simForm.connectionId,
          roomTypeId: simForm.roomTypeId,
          guestName: simForm.guestName,
          checkInDate: simForm.checkInDate,
          checkOutDate: simForm.checkOutDate,
          status: simForm.status,
          totalAmountPaise: Math.round(parseFloat(simForm.totalAmountRupees) * 100),
        }),
      });
      setSimResult(res);
      loadMatrix();
    } catch (err: any) {
      setSimResult({ success: false, message: err.message || 'Simulation call failed' });
    } finally {
      setSimulating(false);
    }
  };

  // Quick Days Selectors
  const toggleDayOfWeek = (day: number) => {
    setBulkForm((prev) => {
      const exists = prev.daysOfWeek.includes(day);
      const next = exists ? prev.daysOfWeek.filter((d) => d !== day) : [...prev.daysOfWeek, day];
      return { ...prev, daysOfWeek: next.sort() };
    });
  };

  const selectAllDays = () => setBulkForm((prev) => ({ ...prev, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }));
  const selectWeekdaysOnly = () => setBulkForm((prev) => ({ ...prev, daysOfWeek: [1, 2, 3, 4, 5] }));
  const selectWeekendsOnly = () => setBulkForm((prev) => ({ ...prev, daysOfWeek: [0, 6] }));

  // Helper to parse matrix cell for roomType + date
  const getMatrixCell = (rtId: string, dateStr: string) => {
    return matrixData.matrix.find((m) => m.roomTypeId === rtId && m.date === dateStr);
  };

  const connectedCount = connections.filter((c) => c.status === 'connected').length;
  const failingCount = connections.filter((c) => c.consecutive_failures > 0).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-light">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-content-primary-light tracking-tight">
              OTA Channel Distribution &amp; Live Sync
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              2-Way Live Sync Active
            </span>
          </div>
          <p className="text-xs text-content-secondary-light mt-0.5">
            Single source of truth for date-wise room availability, dynamic rates, restrictions, and 2-way OTA synchronization
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (roomTypes.length > 0) {
                setBulkForm((prev) => ({
                  ...prev,
                  roomTypeId: roomTypes[0].id,
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
                }));
              }
              setBulkModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Sliders className="w-4 h-4" />
            Bulk Rate & Restrictions
          </button>
        </div>
      </div>

      {/* Live 2-Way Sync Engine Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900">2-Way OTA Channel Synchronization Engine</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                100% Operational
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Instant 2-way rate and availability synchronization active with MakeMyTrip, Agoda, Booking.com, Airbnb &amp; Expedia. Changes update in &lt;3 seconds across all OTA channels.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/pricing"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition whitespace-nowrap"
          >
            OTA Setup Package (₹4,999) &rarr;
          </Link>
        </div>
      </div>

      {/* Google Hotel Center & Free Booking Links (GMB) Integration Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600/5 via-emerald-600/5 to-transparent border border-blue-200 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                🌐 Google Hotel Center &amp; Google Business Profile (Official Site)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                Free Booking Links
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Show your hotel as the verified <strong>"Official Site"</strong> in Google Search and Google Maps next to Booking.com and Agoda with 0% commission. Add your link in Google Business Profile &gt; Hotel details &gt; Booking links.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">GMB Official Website Booking URL</span>
              <button
                type="button"
                onClick={() => {
                  const slug = properties.find((p) => p.id === propertyId)?.slug || '';
                  const url = `https://hotelflexi.com/book/${slug}?utm_source=google_hotel_fbl&utm_medium=organic&utm_campaign=official_site`;
                  navigator.clipboard.writeText(url);
                  alert('Copied GMB Official Site link to clipboard!');
                }}
                className="text-[10px] font-bold text-brand-blue hover:underline"
              >
                Copy Link
              </button>
            </div>
            <div className="font-mono text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100 truncate text-slate-600">
              https://hotelflexi.com/book/{properties.find((p) => p.id === propertyId)?.slug || 'your-hotel'}?utm_source=google_hotel_official_site
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Google Hotel Center XML Feed URL</span>
              <button
                type="button"
                onClick={() => {
                  const slug = properties.find((p) => p.id === propertyId)?.slug || '';
                  const url = `https://hotelflexi.divyansh-shukla.workers.dev/api/v1/public/properties/${slug}/google-hotel-feed.xml`;
                  navigator.clipboard.writeText(url);
                  alert('Copied Google Hotel XML feed URL to clipboard!');
                }}
                className="text-[10px] font-bold text-brand-blue hover:underline"
              >
                Copy Feed URL
              </button>
            </div>
            <div className="font-mono text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100 truncate text-slate-600">
              https://hotelflexi.divyansh-shukla.workers.dev/api/v1/public/properties/{properties.find((p) => p.id === propertyId)?.slug || 'your-hotel'}/google-hotel-feed.xml
            </div>
          </div>
        </div>
      </div>

      {/* Plan Lock Banner */}
      {isLocked && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                Channel Manager is Locked on Starter / Free Trial
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                  Paid Plan Feature
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                Your current tier includes your <strong>Direct Booking Engine, PMS Front Desk, and Guest Ledger</strong>. To enable 2-way live rate and inventory synchronization with Booking.com, Agoda, MakeMyTrip, Airbnb, and Expedia, upgrade to an active Essential or Growth plan.
              </p>
            </div>
          </div>
          <Link
            href="/app/subscription"
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Upgrade Subscription <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
          <span className="text-[11px] font-semibold text-content-secondary-light uppercase tracking-wider block">
            Connected Channels
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-content-primary-light">{connectedCount}</span>
            <span className="text-xs text-content-secondary-light">/ 6 OTAs</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
          <span className="text-[11px] font-semibold text-content-secondary-light uppercase tracking-wider block">
            Channel Health
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            {failingCount > 0 ? (
              <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {failingCount} channel(s) warning
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Operational
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
          <span className="text-[11px] font-semibold text-content-secondary-light uppercase tracking-wider block">
            Active Room Types
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-content-primary-light">{roomTypes.length}</span>
            <span className="text-xs text-content-secondary-light">configured</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
          <span className="text-[11px] font-semibold text-content-secondary-light uppercase tracking-wider block">
            Sync Queue
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-content-primary-light">{syncJobs.length}</span>
            <span className="text-xs text-content-secondary-light">jobs logged</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border-light gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'channels'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-content-secondary-light hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Connected OTA Channels
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'matrix'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-content-secondary-light hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Inventory & Rate Matrix Calendar
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'queue'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-content-secondary-light hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          Sync Queue & Error Logs ({syncJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'simulator'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-content-secondary-light hover:bg-slate-100'
          }`}
        >
          <Play className="w-4 h-4 text-emerald-400" />
          OTA Webhook & Concurrency Simulator
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <>
          {/* TAB 1: CONNECTED CHANNELS */}
          {activeTab === 'channels' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channelCatalog.map((ch) => {
                  const conn = connections.find((c) => c.channel_name === ch.id);
                  const isConnected = conn?.status === 'connected';
                  const isFailing = (conn?.consecutive_failures || 0) > 0;
                  const LogoComp = ch.component;
                  const isSandbox = conn?.environment === 'sandbox' || !conn?.environment;

                  return (
                    <div
                      key={ch.id}
                      className="p-6 rounded-2xl bg-white border border-border-light shadow-sm flex flex-col justify-between space-y-4 hover:border-brand-blue/30 transition relative overflow-hidden"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <LogoComp />
                            <div>
                              <h3 className="font-bold text-sm text-content-primary-light">{ch.name}</h3>
                              <span className="text-[10px] text-content-secondary-light">{ch.category}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                (ch as any).isComingSoon
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : isConnected
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {(ch as any).isComingSoon ? 'Coming Soon' : isConnected ? 'Active' : 'Unlinked'}
                            </span>
                            {isConnected && (
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  isSandbox
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {isSandbox ? 'Sandbox' : 'Production'}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-content-secondary-light mt-2.5 leading-relaxed">
                          {ch.desc}
                        </p>

                        <div className="mt-4 text-xs text-content-secondary-light space-y-1.5 bg-surface-light p-3 rounded-xl border border-border-light">
                          <div className="flex justify-between">
                            <span>Hotel Channel ID:</span>
                            <span className="font-mono text-content-primary-light font-semibold">
                              {conn?.hotel_channel_id || 'Not configured'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Synced:</span>
                            <span className="font-medium text-content-primary-light">
                              {conn?.last_sync_at
                                ? new Date(conn.last_sync_at * 1000).toLocaleTimeString()
                                : 'Pending first sync'}
                            </span>
                          </div>
                          {conn?.last_successful_sync_at && (
                            <div className="flex justify-between text-[11px] text-emerald-700">
                              <span>Last Successful:</span>
                              <span>{new Date(conn.last_successful_sync_at * 1000).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Error Alert if consecutive failures */}
                        {isFailing && (
                          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                            <div>
                              <span className="font-bold">Sync Failure Warning:</span> {conn.error_message || 'Remote gateway error'}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex flex-col gap-2">
                        {isConnected ? (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleSync(conn.id)}
                                disabled={syncingId === conn.id}
                                className="py-2.5 rounded-xl bg-blue-50 text-brand-blue font-semibold text-xs hover:bg-blue-100 transition flex items-center justify-center gap-1.5 border border-blue-200"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${syncingId === conn.id ? 'animate-spin' : ''}`} />
                                {syncingId === conn.id ? 'Syncing...' : 'Sync Rates & Inv'}
                              </button>
                              <button
                                onClick={() => openConnectModal(ch, conn)}
                                className="py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition flex items-center justify-center gap-1.5 border border-slate-200"
                              >
                                <Settings className="w-3.5 h-3.5" />
                                Configure
                              </button>
                            </div>
                            <button
                              onClick={() => handleDisconnect(conn.id, ch.name)}
                              className="text-[11px] text-rose-600 hover:text-rose-700 text-center font-medium pt-1"
                            >
                              Disconnect Channel
                            </button>
                          </>
                        ) : (ch as any).isComingSoon ? (
                          <button
                            disabled
                            className="w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-90 shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            Integration In Development — Coming Soon
                          </button>
                        ) : isLocked ? (
                          <Link
                            href="/app/subscription"
                            className="w-full py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" /> Locked on Starter (Upgrade)
                          </Link>
                        ) : (
                          <button
                            onClick={() => openConnectModal(ch)}
                            className="w-full py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover transition shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Connect Channel Adapter
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY & RATE MATRIX CALENDAR */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              {/* Matrix Control Bar */}
              <div className="p-4 bg-white rounded-2xl border border-border-light shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-content-primary-light">Start Date:</span>
                    <input
                      type="date"
                      value={matrixStartDate}
                      onChange={(e) => setMatrixStartDate(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-xl border border-border-light bg-surface-light font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-surface-light p-1 rounded-xl border border-border-light text-xs font-bold">
                    {[7, 14, 30].map((d) => (
                      <button
                        key={d}
                        onClick={() => setMatrixDaysCount(d)}
                        className={`px-3 py-1 rounded-lg transition ${
                          matrixDaysCount === d
                            ? 'bg-brand-blue text-white shadow-sm'
                            : 'text-content-secondary-light hover:text-content-primary-light'
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-content-secondary-light" />
                    <select
                      value={selectedRoomTypeId}
                      onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-xl border border-border-light bg-surface-light font-medium"
                    >
                      <option value="all">All Room Types</option>
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name} ({rt.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadMatrix}
                    disabled={matrixLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${matrixLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 px-2 text-[11px] text-content-secondary-light">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available (&gt; 2 units)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Low Availability (1-2)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Sold Out / Closed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-bold text-[9px]">STOP</span> Stop-Sell
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-bold text-[9px]">CTA</span> Closed Arrival
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 bg-orange-100 text-orange-800 rounded font-bold text-[9px]">CTD</span> Closed Departure
                </span>
              </div>

              {/* Matrix Table */}
              <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
                {matrixLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
                    <span className="text-xs text-content-secondary-light">Calculating date-wise availability & rates...</span>
                  </div>
                ) : matrixData.roomTypes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-content-secondary-light">
                    No active room types found for this property. Add room types in the Room Types tab first.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-light border-b border-border-light text-[11px] font-bold text-content-primary-light">
                          <th className="py-3 px-4 min-w-[200px] sticky left-0 bg-surface-light z-10 border-r border-border-light">
                            Room Category / Row
                          </th>
                          {matrixData.dates.map((dStr) => {
                            const d = new Date(dStr);
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                            const dayNum = d.getDate();
                            const month = d.toLocaleDateString('en-US', { month: 'short' });

                            return (
                              <th
                                key={dStr}
                                className={`py-2 px-3 min-w-[90px] text-center border-r border-border-light ${
                                  isWeekend ? 'bg-amber-50/60 font-black' : ''
                                }`}
                              >
                                <div className="text-[10px] text-content-secondary-light uppercase">{dayName}</div>
                                <div className="text-xs text-content-primary-light">
                                  {dayNum} {month}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light text-xs">
                        {matrixData.roomTypes.map((rt) => (
                          <React.Fragment key={rt.id}>
                            {/* Section Header Row */}
                            <tr className="bg-slate-50/80 font-bold text-xs text-slate-800">
                              <td
                                colSpan={matrixData.dates.length + 1}
                                className="py-2 px-4 bg-slate-100/70 border-y border-border-light"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-content-primary-light">{rt.name}</span>
                                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-border-light text-brand-blue">
                                      {rt.code}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setBulkForm((prev) => ({
                                        ...prev,
                                        roomTypeId: rt.id,
                                        startDate: matrixStartDate,
                                        endDate: matrixData.dates[matrixData.dates.length - 1] || matrixStartDate,
                                      }));
                                      setBulkModalOpen(true);
                                    }}
                                    className="text-[11px] text-brand-blue hover:underline font-semibold flex items-center gap-1"
                                  >
                                    <Sliders className="w-3 h-3" /> Edit {rt.name} Rates
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Row 1: Sellable Available */}
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 font-semibold text-content-secondary-light sticky left-0 bg-white z-10 border-r border-border-light">
                                <div className="text-xs text-content-primary-light">Available Rooms</div>
                                <div className="text-[10px] text-content-secondary-light">Sellable / Total Physical</div>
                              </td>
                              {matrixData.dates.map((dStr) => {
                                const cell = getMatrixCell(rt.id, dStr);
                                const avail = cell?.sellableInventory ?? 0;
                                const total = cell?.totalRooms ?? 0;
                                const isClosed = cell?.closed;

                                return (
                                  <td
                                    key={dStr}
                                    onClick={() => openBulkForDate(rt.id, dStr)}
                                    className="py-2 px-2 text-center border-r border-border-light cursor-pointer hover:bg-blue-50/50 transition"
                                  >
                                    <div
                                      className={`inline-flex items-center justify-center font-bold rounded-lg px-2 py-1 text-xs ${
                                        isClosed
                                          ? 'bg-rose-100 text-rose-800'
                                          : avail > 2
                                          ? 'bg-emerald-50 text-emerald-800'
                                          : avail > 0
                                          ? 'bg-amber-50 text-amber-800'
                                          : 'bg-rose-50 text-rose-800'
                                      }`}
                                    >
                                      {avail} / {total}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Row 2: Price */}
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 font-semibold text-content-secondary-light sticky left-0 bg-white z-10 border-r border-border-light">
                                <div className="text-xs text-content-primary-light">Daily Rate</div>
                                <div className="text-[10px] text-content-secondary-light">Base Tariff (INR)</div>
                              </td>
                              {matrixData.dates.map((dStr) => {
                                const cell = getMatrixCell(rt.id, dStr);
                                const price = cell?.pricePaise ?? 0;
                                const isCustom = cell?.isCustomPrice;

                                return (
                                  <td
                                    key={dStr}
                                    onClick={() => openBulkForDate(rt.id, dStr)}
                                    className="py-2 px-2 text-center border-r border-border-light cursor-pointer hover:bg-blue-50/50 transition"
                                  >
                                    <div className="font-bold text-xs text-content-primary-light">
                                      {formatINR(price)}
                                    </div>
                                    {isCustom && (
                                      <span className="text-[9px] font-bold text-brand-blue bg-blue-50 px-1 rounded">
                                        Custom
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Row 3: Active Restrictions */}
                            <tr className="hover:bg-slate-50/50 border-b border-border-light">
                              <td className="py-2 px-4 font-semibold text-content-secondary-light sticky left-0 bg-white z-10 border-r border-border-light">
                                <div className="text-xs text-content-primary-light">Restrictions</div>
                                <div className="text-[10px] text-content-secondary-light">Stop, CTA, Min Stay</div>
                              </td>
                              {matrixData.dates.map((dStr) => {
                                const cell = getMatrixCell(rt.id, dStr);
                                const isClosed = cell?.closed;
                                const cta = cell?.closedToArrival;
                                const ctd = cell?.closedToDeparture;
                                const minStay = cell?.minStayArrival;

                                return (
                                  <td
                                    key={dStr}
                                    onClick={() => openBulkForDate(rt.id, dStr)}
                                    className="py-1.5 px-1 text-center border-r border-border-light cursor-pointer hover:bg-blue-50/50 transition"
                                  >
                                    <div className="flex flex-wrap gap-1 justify-center items-center min-h-[22px]">
                                      {isClosed && (
                                        <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-extrabold">
                                          STOP
                                        </span>
                                      )}
                                      {cta && (
                                        <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-extrabold">
                                          CTA
                                        </span>
                                      )}
                                      {ctd && (
                                        <span className="px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 text-[9px] font-extrabold">
                                          CTD
                                        </span>
                                      )}
                                      {minStay && minStay > 1 && (
                                        <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                                          Min {minStay}d
                                        </span>
                                      )}
                                      {!isClosed && !cta && !ctd && (!minStay || minStay === 1) && (
                                        <span className="text-[10px] text-slate-300">—</span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SYNC QUEUE & ERROR LOGS */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              {/* Sync Jobs Queue */}
              <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-light font-bold text-sm text-content-primary-light flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-blue" />
                    OTA Synchronization Queue (Pending, Processing & Retries)
                  </div>
                  <button
                    onClick={async () => {
                      const jData = await apiClient(`/channels/jobs?property_id=${propertyId}`);
                      setSyncJobs(jData.jobs || []);
                    }}
                    className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-light border-b border-border-light text-[10px] uppercase font-bold text-content-primary-light">
                      <tr>
                        <th className="py-3 px-4">Channel</th>
                        <th className="py-3 px-4">Job Type</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Retries</th>
                        <th className="py-3 px-4">HTTP / Info</th>
                        <th className="py-3 px-4">Created Time</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                      {syncJobs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-content-secondary-light">
                            No active sync jobs currently queued. All connected channels are fully up to date.
                          </td>
                        </tr>
                      ) : (
                        syncJobs.map((j) => (
                          <tr key={j.id} className="hover:bg-surface-light">
                            <td className="py-3 px-4 font-semibold text-content-primary-light capitalize">
                              {j.channel_name ? j.channel_name.replace('_', '.') : 'OTA'}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-content-secondary-light">
                              {j.job_type}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  j.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : j.status === 'processing'
                                    ? 'bg-blue-100 text-blue-800 animate-pulse'
                                    : j.status === 'retry'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {j.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                                {j.status === 'processing' && <RotateCw className="w-3 h-3 animate-spin" />}
                                {j.status === 'retry' && <Clock className="w-3 h-3" />}
                                {j.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                                {j.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-content-secondary-light">
                              {j.retry_count} / {j.max_retries || 3}
                            </td>
                            <td className="py-3 px-4 text-content-secondary-light max-w-xs truncate">
                              {j.error_message || (j.http_status ? `HTTP ${j.http_status}` : 'OK')}
                            </td>
                            <td className="py-3 px-4 text-content-secondary-light">
                              {new Date(j.created_at * 1000).toLocaleTimeString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {(j.status === 'failed' || j.status === 'retry') && (
                                <button
                                  onClick={() => handleRetryJob(j.id)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] transition"
                                >
                                  Retry Now
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Event Ledger History */}
              <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-light font-bold text-sm text-content-primary-light flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-blue" />
                  Recent Channel Synchronization Ledger & Audit Trail
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-light border-b border-border-light text-[10px] uppercase font-bold text-content-primary-light">
                      <tr>
                        <th className="py-3 px-4">Channel</th>
                        <th className="py-3 px-4">Event Type</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Trigger Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-content-secondary-light">
                            No channel sync events recorded yet. Connect an adapter above to initiate 2-way sync.
                          </td>
                        </tr>
                      ) : (
                        history.map((h) => (
                          <tr key={h.id} className="hover:bg-surface-light">
                            <td className="py-3 px-4 font-semibold text-content-primary-light capitalize">
                              {h.channel_name ? h.channel_name.replace('_', '.') : 'OTA'}
                            </td>
                            <td className="py-3 px-4 text-content-secondary-light">{h.event_type || h.job_type}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                  h.status === 'success' || h.event_type === 'sync_succeeded'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {h.status || 'OK'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-content-secondary-light">
                              {new Date(h.created_at * 1000).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OTA WEBHOOK & CONCURRENCY SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-content-primary-light">
                      OTA Reservation Webhook & Concurrency Simulator
                    </h3>
                    <p className="text-xs text-content-secondary-light">
                      Simulate incoming bookings, modifications, or cancellations from OTAs to test inventory decrements and oversell prevention
                    </p>
                  </div>
                </div>

                <form onSubmit={handleRunSimulation} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-content-primary-light mb-1">
                      Target Channel Connection
                    </label>
                    <select
                      value={simForm.connectionId}
                      onChange={(e) => setSimForm({ ...simForm, connectionId: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                      required
                    >
                      <option value="">Select Channel...</option>
                      {connections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.channel_name.replace('_', '.')} ({c.hotel_channel_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-content-primary-light mb-1">
                      Room Category
                    </label>
                    <select
                      value={simForm.roomTypeId}
                      onChange={(e) => setSimForm({ ...simForm, roomTypeId: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                      required
                    >
                      <option value="">Select Room Type...</option>
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name} ({rt.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-content-primary-light mb-1">
                      Event Action
                    </label>
                    <select
                      value={simForm.status}
                      onChange={(e) => setSimForm({ ...simForm, status: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                    >
                      <option value="confirmed">New Booking (Confirmed)</option>
                      <option value="cancelled">Cancellation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-content-primary-light mb-1">
                      Guest Full Name
                    </label>
                    <input
                      type="text"
                      value={simForm.guestName}
                      onChange={(e) => setSimForm({ ...simForm, guestName: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-content-primary-light mb-1">
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      value={simForm.checkInDate}
                      onChange={(e) => setSimForm({ ...simForm, checkInDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-content-primary-light mb-1">
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      value={simForm.checkOutDate}
                      onChange={(e) => setSimForm({ ...simForm, checkOutDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                      required
                    />
                  </div>

                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={simulating}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                    >
                      {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      Dispatch Simulated Webhook
                    </button>
                  </div>
                </form>

                {simResult && (
                  <div
                    className={`mt-4 p-4 rounded-xl text-xs font-medium border ${
                      simResult.success
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {simResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                      {simResult.action ? `Action: ${simResult.action.toUpperCase()}` : 'Simulation Response'}
                    </div>
                    <div className="mt-1">{simResult.message}</div>
                    {simResult.reservationNumber && (
                      <div className="mt-1 font-mono text-[11px]">
                        Generated Reservation #: {simResult.reservationNumber}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* CONNECT / CONFIGURE CHANNEL MODAL */}
      {connectModalOpen && targetChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-border-light shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div className="flex items-center gap-3">
                <targetChannel.component className="w-10 h-10" />
                <div>
                  <h3 className="font-extrabold text-base text-content-primary-light">
                    Configure {targetChannel.name}
                  </h3>
                  <span className="text-xs text-content-secondary-light">{targetChannel.category}</span>
                </div>
              </div>
              <button
                onClick={() => setConnectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center text-content-secondary-light hover:text-content-primary-light"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  Hotel Channel ID / Property Code on {targetChannel.name}
                </label>
                <input
                  type="text"
                  value={connectForm.hotelChannelId}
                  onChange={(e) => setConnectForm({ ...connectForm, hotelChannelId: e.target.value })}
                  placeholder="e.g. 104928"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-mono font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  Environment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConnectForm({ ...connectForm, environment: 'sandbox' })}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      connectForm.environment === 'sandbox'
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-border-light text-content-secondary-light hover:bg-slate-50'
                    }`}
                  >
                    <span>Sandbox / Test Mode</span>
                    <span className="text-[10px] font-normal opacity-80">Safe simulated exchange</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectForm({ ...connectForm, environment: 'production' })}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      connectForm.environment === 'production'
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-border-light text-content-secondary-light hover:bg-slate-50'
                    }`}
                  >
                    <span>Production Mode</span>
                    <span className="text-[10px] font-normal opacity-80">Live remote OTA endpoints</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  OTA API Key / Client ID {connectForm.environment === 'sandbox' && '(Optional in Sandbox)'}
                </label>
                <input
                  type="password"
                  value={connectForm.apiKey}
                  onChange={(e) => setConnectForm({ ...connectForm, apiKey: e.target.value })}
                  placeholder={connectForm.environment === 'sandbox' ? 'Simulated Sandbox Key' : 'Enter live API Key'}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  OTA API Secret / Partner Key {connectForm.environment === 'sandbox' && '(Optional in Sandbox)'}
                </label>
                <input
                  type="password"
                  value={connectForm.apiSecret}
                  onChange={(e) => setConnectForm({ ...connectForm, apiSecret: e.target.value })}
                  placeholder="Optional secret or token"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-mono"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-brand-blue mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  In <strong>Sandbox Mode</strong>, live rates, inventory caps, and reservations are fully calculated through HotelFlexi’s concurrency engine with simulated partner responses.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  {connecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Channel Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK RATE & RESTRICTIONS EDITOR MODAL */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-border-light shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-content-primary-light">
                    Bulk Rate & Restriction Editor
                  </h3>
                  <p className="text-[11px] text-content-secondary-light">
                    Update rates, stop-sell, and stay rules across multiple dates and broadcast to OTAs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center text-content-secondary-light hover:text-content-primary-light"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              {/* Room Type */}
              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  Room Category
                </label>
                <select
                  value={bulkForm.roomTypeId}
                  onChange={(e) => setBulkForm({ ...bulkForm, roomTypeId: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                  required
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} ({rt.code}) — Base: {formatINR(rt.base_price_paise)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-content-primary-light mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={bulkForm.startDate}
                    onChange={(e) => setBulkForm({ ...bulkForm, startDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-content-primary-light mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={bulkForm.endDate}
                    onChange={(e) => setBulkForm({ ...bulkForm, endDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                    required
                  />
                </div>
              </div>

              {/* Days of Week Quick Select */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-content-primary-light">
                    Days of Week Filter
                  </label>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-brand-blue">
                    <button type="button" onClick={selectAllDays} className="hover:underline">All</button>
                    <span>•</span>
                    <button type="button" onClick={selectWeekdaysOnly} className="hover:underline">Mon-Fri</button>
                    <span>•</span>
                    <button type="button" onClick={selectWeekendsOnly} className="hover:underline">Sat-Sun</button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5 bg-surface-light p-2 rounded-xl border border-border-light">
                  {[
                    { d: 1, label: 'Mon' },
                    { d: 2, label: 'Tue' },
                    { d: 3, label: 'Wed' },
                    { d: 4, label: 'Thu' },
                    { d: 5, label: 'Fri' },
                    { d: 6, label: 'Sat' },
                    { d: 0, label: 'Sun' },
                  ].map(({ d, label }) => {
                    const active = bulkForm.daysOfWeek.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDayOfWeek(d)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                          active
                            ? 'bg-brand-blue text-white shadow-sm'
                            : 'bg-white text-content-secondary-light border border-border-light hover:bg-slate-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  New Base Tariff (₹ / Night)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Leave blank to keep existing prices"
                    value={bulkForm.price}
                    onChange={(e) => setBulkForm({ ...bulkForm, price: e.target.value })}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                  />
                </div>
              </div>

              {/* Restrictions Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-content-primary-light mb-1">
                    Stop-Sell
                  </label>
                  <select
                    value={bulkForm.closed}
                    onChange={(e) => setBulkForm({ ...bulkForm, closed: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-border-light bg-surface-light font-medium"
                  >
                    <option value="unchanged">No Change</option>
                    <option value="closed">Closed (Stop Sell)</option>
                    <option value="open">Open (Sellable)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-content-primary-light mb-1">
                    Closed to Arrival (CTA)
                  </label>
                  <select
                    value={bulkForm.closedToArrival}
                    onChange={(e) => setBulkForm({ ...bulkForm, closedToArrival: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-border-light bg-surface-light font-medium"
                  >
                    <option value="unchanged">No Change</option>
                    <option value="closed">Closed Arrival</option>
                    <option value="open">Open Arrival</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-content-primary-light mb-1">
                    Closed to Departure (CTD)
                  </label>
                  <select
                    value={bulkForm.closedToDeparture}
                    onChange={(e) => setBulkForm({ ...bulkForm, closedToDeparture: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-border-light bg-surface-light font-medium"
                  >
                    <option value="unchanged">No Change</option>
                    <option value="closed">Closed Departure</option>
                    <option value="open">Open Departure</option>
                  </select>
                </div>
              </div>

              {/* Stay rules */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-content-primary-light mb-1">
                    Min Stay (Arrival)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 2"
                    value={bulkForm.minStayArrival}
                    onChange={(e) => setBulkForm({ ...bulkForm, minStayArrival: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-border-light bg-surface-light font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-content-primary-light mb-1">
                    Max Stay (Nights)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 14"
                    value={bulkForm.maxStay}
                    onChange={(e) => setBulkForm({ ...bulkForm, maxStay: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-border-light bg-surface-light font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-content-primary-light mb-1">
                    Inventory Override Cap
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank"
                    value={bulkForm.overrideInventory}
                    onChange={(e) => setBulkForm({ ...bulkForm, overrideInventory: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-border-light bg-surface-light font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  Update Note / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Weekend Peak Surcharge"
                  value={bulkForm.note}
                  onChange={(e) => setBulkForm({ ...bulkForm, note: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                />
              </div>

              {bulkSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {bulkSuccessMessage}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  {bulkSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Apply & Broadcast to Connected OTAs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
