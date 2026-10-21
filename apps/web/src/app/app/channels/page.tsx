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
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Trash2,
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

const LOGO_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  booking_com: BookingComLogo,
  agoda: AgodaLogo,
  makemytrip: MakeMyTripLogo,
  airbnb: AirbnbLogo,
  expedia: ExpediaLogo,
  tripadvisor: TripAdvisorLogo,
};

export default function ChannelManagerAppPage() {
  const { currentTenant } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'channels' | 'room_mapping' | 'rate_mapping' | 'matrix' | 'queue' | 'reservations' | 'reconciliation' | 'simulator'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // V2 Data States
  const [overview, setOverview] = useState<any>(null);
  const [v2Connections, setV2Connections] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [ratePlans, setRatePlans] = useState<any[]>([]);

  // Room & Rate Mapping States
  const [selectedConnId, setSelectedConnId] = useState<string>('');
  const [roomMappings, setRoomMappings] = useState<any[]>([]);
  const [rateMappings, setRateMappings] = useState<any[]>([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);

  // Outbox Jobs State
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsFilter, setJobsFilter] = useState<string>('all');
  const [jobsLoading, setJobsLoading] = useState(false);

  // Channel Bookings State
  const [channelBookings, setChannelBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Reconciliation State
  const [reconciliationRecords, setReconciliationRecords] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  // Diagnostics Modal State
  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResult, setDiagResult] = useState<any>(null);
  const [diagTargetConn, setDiagTargetConn] = useState<any>(null);

  // Connect Modal State
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [targetProvider, setTargetProvider] = useState<any>(null);
  const [connectForm, setConnectForm] = useState({
    externalPropertyId: '',
    environment: 'sandbox',
    apiKey: '',
    apiSecret: '',
    username: '',
    password: '',
  });
  const [connecting, setConnecting] = useState(false);

  // Add Room Mapping Modal State
  const [roomMapModalOpen, setRoomMapModalOpen] = useState(false);
  const [roomMapForm, setRoomMapForm] = useState({
    localRoomTypeId: '',
    externalRoomTypeId: '',
    channelRoomName: '',
  });

  // Add Rate Mapping Modal State
  const [rateMapModalOpen, setRateMapModalOpen] = useState(false);
  const [rateMapForm, setRateMapForm] = useState({
    localRatePlanId: '',
    externalRatePlanId: '',
    channelRateName: '',
    boardBasis: 'RO',
    taxHandling: 'exclusive',
  });

  // Matrix Calendar States
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixData, setMatrixData] = useState<{ dates: string[]; roomTypes: any[]; matrix: any[] }>({
    dates: [],
    roomTypes: [],
    matrix: [],
  });
  const [matrixStartDate, setMatrixStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [matrixDaysCount, setMatrixDaysCount] = useState<number>(14);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('all');

  // Bulk editor modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    roomTypeId: '',
    startDate: '',
    endDate: '',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    price: '',
    closed: 'unchanged',
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

  // ---------------------------------------------------------------------------
  // 1. Initial Load
  // ---------------------------------------------------------------------------
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

        const [ovData, connsData, provData, rtData, rpData] = await Promise.all([
          apiClient(`/channels/v2/overview?property_id=${activeProp.id}`).catch(() => null),
          apiClient(`/channels/v2/connections?property_id=${activeProp.id}`).catch(() => ({ connections: [] })),
          apiClient(`/channels/v2/providers`).catch(() => ({ providers: [] })),
          apiClient(`/rooms/types?property_id=${activeProp.id}`).catch(() => ({ roomTypes: [] })),
          apiClient(`/rooms/rate-plans?property_id=${activeProp.id}`).catch(() => ({ ratePlans: [] })),
        ]);

        if (ovData?.metrics) setOverview(ovData);
        const conns = connsData?.connections || [];
        setV2Connections(conns);
        setProviders(provData?.providers || []);
        const rTypes = rtData?.roomTypes || [];
        setRoomTypes(rTypes);
        const rPlans = rpData?.ratePlans || [];
        setRatePlans(rPlans);

        if (conns.length > 0 && !selectedConnId) {
          setSelectedConnId(conns[0].id);
        }
        if (rTypes.length > 0) {
          setRoomMapForm((prev) => ({ ...prev, localRoomTypeId: rTypes[0].id }));
          setBulkForm((prev) => ({ ...prev, roomTypeId: rTypes[0].id }));
          setSimForm((prev) => ({ ...prev, roomTypeId: rTypes[0].id }));
        }
        if (rPlans.length > 0) {
          setRateMapForm((prev) => ({ ...prev, localRatePlanId: rPlans[0].id }));
        }
      }
    } catch (e: any) {
      if (e.message?.includes('Channel Manager') || e.message?.includes('upgrade') || e.message?.includes('Plan')) {
        setIsLocked(true);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedConnId]);

  useEffect(() => {
    if (currentTenant) {
      loadInitialData();
    }
  }, [currentTenant, loadInitialData]);

  // ---------------------------------------------------------------------------
  // 2. Mappings Load
  // ---------------------------------------------------------------------------
  const loadMappings = useCallback(async (connId: string) => {
    if (!connId) return;
    setMappingsLoading(true);
    try {
      const [rMapData, rtMapData] = await Promise.all([
        apiClient(`/channels/v2/connections/${connId}/mappings/rooms`),
        apiClient(`/channels/v2/connections/${connId}/mappings/rates`).catch(() => ({ mappings: [] })),
      ]);
      setRoomMappings(rMapData?.mappings || []);
      setRateMappings(rtMapData?.mappings || []);
    } catch (err) {
      console.error('Failed to load mappings:', err);
    } finally {
      setMappingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if ((activeTab === 'room_mapping' || activeTab === 'rate_mapping') && selectedConnId) {
      loadMappings(selectedConnId);
    }
  }, [activeTab, selectedConnId, loadMappings]);

  // ---------------------------------------------------------------------------
  // 3. Outbox Jobs Load
  // ---------------------------------------------------------------------------
  const loadJobs = useCallback(async () => {
    if (!propertyId) return;
    setJobsLoading(true);
    try {
      const url = `/channels/v2/jobs?property_id=${propertyId}${jobsFilter !== 'all' ? `&status=${jobsFilter}` : ''}`;
      const data = await apiClient(url);
      setJobs(data?.jobs || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  }, [propertyId, jobsFilter]);

  useEffect(() => {
    if (activeTab === 'queue' && propertyId) {
      loadJobs();
      const interval = setInterval(loadJobs, 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab, propertyId, loadJobs]);

  // ---------------------------------------------------------------------------
  // 4. Reservations Load
  // ---------------------------------------------------------------------------
  const loadBookings = useCallback(async () => {
    if (!propertyId) return;
    setBookingsLoading(true);
    try {
      const data = await apiClient(`/channels/v2/reservations?property_id=${propertyId}`);
      setChannelBookings(data?.reservations || []);
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setBookingsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (activeTab === 'reservations' && propertyId) {
      loadBookings();
    }
  }, [activeTab, propertyId, loadBookings]);

  // ---------------------------------------------------------------------------
  // 5. Reconciliation Load
  // ---------------------------------------------------------------------------
  const loadReconciliation = useCallback(async () => {
    if (!propertyId) return;
    try {
      const data = await apiClient(`/channels/v2/reconciliation?property_id=${propertyId}`);
      setReconciliationRecords(data?.records || []);
    } catch (err) {
      console.error('Failed to load reconciliation:', err);
    }
  }, [propertyId]);

  useEffect(() => {
    if (activeTab === 'reconciliation' && propertyId) {
      loadReconciliation();
    }
  }, [activeTab, propertyId, loadReconciliation]);

  // ---------------------------------------------------------------------------
  // 6. Matrix Load
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Actions: Diagnostics, Sync, Connect, Mappings
  // ---------------------------------------------------------------------------
  const handleTestConnection = async (conn: any) => {
    setDiagTargetConn(conn);
    setDiagRunning(true);
    setDiagResult(null);
    setDiagModalOpen(true);

    try {
      const res = await apiClient(`/channels/v2/connections/${conn.id}/test`, { method: 'POST' });
      setDiagResult(res);
      // Refresh connections to show updated status
      const cData = await apiClient(`/channels/v2/connections?property_id=${propertyId}`);
      setV2Connections(cData?.connections || []);
    } catch (err: any) {
      setDiagResult({
        success: false,
        errors: [err.message || 'Diagnostic request failed'],
        correlationId: `diag_err_${Date.now()}`,
      });
    } finally {
      setDiagRunning(false);
    }
  };

  const handleSyncBroadcast = async (connId: string) => {
    try {
      const res = await apiClient(`/channels/v2/connections/${connId}/sync/broadcast`, { method: 'POST' });
      alert(res.message || 'Live synchronization jobs enqueued.');
      if (activeTab === 'queue') loadJobs();
    } catch (err: any) {
      alert(err.message || 'Sync broadcast failed.');
    }
  };

  const handleBroadcastAll = async () => {
    try {
      const res = await apiClient(`/channels/v2/sync/broadcast-all?property_id=${propertyId}`, { method: 'POST' });
      alert(res.message || 'Full broadcast synchronization triggered across all active channels.');
    } catch (err: any) {
      alert(err.message || 'Broadcast all failed.');
    }
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProvider) return;
    setConnecting(true);

    try {
      const creds: any = {};
      if (connectForm.apiKey) creds.apiKey = connectForm.apiKey;
      if (connectForm.apiSecret) creds.apiSecret = connectForm.apiSecret;
      if (connectForm.username) creds.username = connectForm.username;
      if (connectForm.password) creds.password = connectForm.password;

      await apiClient('/channels/v2/connections', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          providerCode: targetProvider.code,
          externalPropertyId: connectForm.externalPropertyId,
          environment: connectForm.environment,
          credentials: creds,
        }),
      });

      setConnectModalOpen(false);
      const cData = await apiClient(`/channels/v2/connections?property_id=${propertyId}`);
      setV2Connections(cData?.connections || []);
      alert(`Successfully added ${targetProvider.display_name}! Connection configured in ${connectForm.environment} mode.`);
    } catch (err: any) {
      alert(err.message || 'Failed to create channel connection');
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveRoomMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnId || !roomMapForm.localRoomTypeId || !roomMapForm.externalRoomTypeId) return;

    try {
      await apiClient(`/channels/v2/connections/${selectedConnId}/mappings/rooms`, {
        method: 'POST',
        body: JSON.stringify(roomMapForm),
      });
      setRoomMapModalOpen(false);
      loadMappings(selectedConnId);
      setRoomMapForm({ localRoomTypeId: roomTypes[0]?.id || '', externalRoomTypeId: '', channelRoomName: '' });
      alert('Room category mapping saved.');
    } catch (err: any) {
      alert(err.message || 'Failed to save room mapping');
    }
  };

  const handleDeleteRoomMapping = async (mappingId: string) => {
    if (!confirm('Are you sure you want to remove this room mapping?')) return;
    try {
      await apiClient(`/channels/v2/connections/${selectedConnId}/mappings/rooms/${mappingId}`, {
        method: 'DELETE',
      });
      loadMappings(selectedConnId);
    } catch (err: any) {
      alert(err.message || 'Failed to delete room mapping');
    }
  };

  const handleSaveRateMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnId || !rateMapForm.localRatePlanId || !rateMapForm.externalRatePlanId) {
      alert('Local Rate Plan and External Rate ID are required.');
      return;
    }
    try {
      await apiClient(`/channels/v2/connections/${selectedConnId}/mappings/rates`, {
        method: 'POST',
        body: JSON.stringify(rateMapForm),
      });
      setRateMapModalOpen(false);
      loadMappings(selectedConnId);
      setRateMapForm({
        localRatePlanId: ratePlans[0]?.id || '',
        externalRatePlanId: '',
        channelRateName: '',
        boardBasis: 'RO',
        taxHandling: 'exclusive',
      });
      alert('Rate plan mapping saved.');
    } catch (err: any) {
      alert(err.message || 'Failed to save rate plan mapping');
    }
  };

  const handleDeleteRateMapping = async (mappingId: string) => {
    if (!confirm('Are you sure you want to remove this rate plan mapping?')) return;
    try {
      await apiClient(`/channels/v2/connections/${selectedConnId}/mappings/rates/${mappingId}`, {
        method: 'DELETE',
      });
      loadMappings(selectedConnId);
    } catch (err: any) {
      alert(err.message || 'Failed to delete rate plan mapping');
    }
  };

  const handleRunReconciliationScan = async () => {
    if (!selectedConnId) return;
    setScanning(true);
    try {
      const res = await apiClient(`/channels/v2/reconciliation/${selectedConnId}/scan`, { method: 'POST' });
      alert(`Scan complete: ${res.report?.discrepanciesFound || 0} discrepancy records identified.`);
      loadReconciliation();
    } catch (err: any) {
      alert(err.message || 'Reconciliation scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleResolveDiscrepancy = async (recId: string) => {
    try {
      const res = await apiClient(`/channels/v2/reconciliation/${recId}/resolve`, { method: 'POST' });
      alert(res.message || 'Central state successfully pushed to channel outbox.');
      loadReconciliation();
    } catch (err: any) {
      alert(err.message || 'Resolution failed');
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await apiClient(`/channels/v2/jobs/${jobId}/retry`, { method: 'POST' });
      alert('Job re-queued successfully.');
      loadJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to retry job');
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);

    const targetConnId = simForm.connectionId || v2Connections[0]?.id;
    if (!targetConnId) {
      setSimResult({
        success: false,
        message: 'No channel connection available to simulate. Please connect an OTA channel first.',
      });
      setSimulating(false);
      return;
    }

    try {
      // Call Channel Manager V2 simulation endpoint with automatic fallback
      let res;
      try {
        res = await apiClient('/channels/v2/simulate-booking', {
          method: 'POST',
          body: JSON.stringify({
            propertyId,
            connectionId: targetConnId,
            guestName: simForm.guestName,
            roomTypeId: simForm.roomTypeId,
            checkInDate: simForm.checkInDate,
            checkOutDate: simForm.checkOutDate,
            status: simForm.status,
            totalAmountPaise: Math.round(parseFloat(simForm.totalAmountRupees) * 100),
          }),
        });
      } catch {
        res = await apiClient('/channels/simulate-booking', {
          method: 'POST',
          body: JSON.stringify({
            propertyId,
            connectionId: targetConnId,
            guestName: simForm.guestName,
            roomTypeId: simForm.roomTypeId,
            checkInDate: simForm.checkInDate,
            checkOutDate: simForm.checkOutDate,
            status: simForm.status,
            totalAmountPaise: Math.round(parseFloat(simForm.totalAmountRupees) * 100),
          }),
        });
      }
      setSimResult(res);
      if (res.success) {
        if (activeTab === 'reservations') loadBookings();
      }
    } catch (err: any) {
      setSimResult({
        success: false,
        message: err.message || 'Simulation encountered an unexpected gateway exception.',
      });
    } finally {
      setSimulating(false);
    }
  };

  // Matrix helpers
  const getMatrixCell = (rtId: string, date: string) => {
    return matrixData.matrix.find((m) => m.roomTypeId === rtId && m.date === date);
  };

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

      if (bulkForm.minStayArrival) payload.minStayArrival = parseInt(bulkForm.minStayArrival, 10);
      if (bulkForm.maxStay) payload.maxStay = parseInt(bulkForm.maxStay, 10);
      if (bulkForm.overrideInventory) payload.overrideInventory = parseInt(bulkForm.overrideInventory, 10);

      const res = await apiClient('/channels/bulk-update', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setBulkSuccessMessage(res.message || 'Rates & restrictions updated.');
      setTimeout(() => {
        setBulkModalOpen(false);
        setBulkSuccessMessage(null);
        loadMatrix();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Bulk update failed');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setBulkForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            Active 2-Way Sync
          </span>
        );
      case 'sandbox':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
            Sandbox Ready
          </span>
        );
      case 'pending_approval':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
            Pending Partner Approval
          </span>
        );
      case 'pending_credentials':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
            Pending Credentials
          </span>
        );
      case 'error':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
            Sync Gateway Error
          </span>
        );
      case 'paused':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
            Paused
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600">
            {status || 'Not Configured'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-light">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-content-primary-light tracking-tight">
              Distribution Channel Manager (Production ARI)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Canonical Central Authority
            </span>
          </div>
          <p className="text-xs text-content-secondary-light mt-0.5">
            Real-time multi-tenant distribution connecting PMS inventory, rates, and reservations across Booking.com, Agoda, MakeMyTrip, Expedia & TripAdvisor.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleBroadcastAll}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            Sync All Channels
          </button>

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
            Bulk Rates & Restrictions
          </button>
        </div>
      </div>

      {/* Honest Provider Certification Alert */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-transparent border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                Official Partner Certification & Security Standards
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300">
                Audited Handshake
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Channels operate under strict, independent authorization contracts. Uncertified production channels honestly remain in <strong>Pending Credentials</strong> or <strong>Partner Approval</strong> until live keys are verified.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            AES-256-GCM Tenant Isolated
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border-light gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-content-secondary-light hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'channels'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-content-secondary-light hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          OTA Connections ({v2Connections.length})
        </button>

        <button
          onClick={() => setActiveTab('room_mapping')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'room_mapping'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-content-secondary-light hover:bg-slate-100'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          Room Mapping
        </button>

        <button
          onClick={() => setActiveTab('rate_mapping')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'rate_mapping'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-content-secondary-light hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Rate Plan Mapping
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
          Inventory Matrix Calendar
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
          Sync Outbox & Jobs
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'reservations'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-content-secondary-light hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          Channel Bookings
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'reconciliation'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-content-secondary-light hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          Reconciliation Center
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
          Simulator
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <>
          {/* ================================================================= */}
          {/* TAB 1: OVERVIEW DASHBOARD METRICS */}
          {/* ================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
                  <span className="text-[11px] font-semibold text-content-secondary-light uppercase tracking-wider block">
                    Total Channels
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-content-primary-light">
                      {overview?.metrics?.totalConnections ?? v2Connections.length}
                    </span>
                    <span className="text-xs text-content-secondary-light">configured</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
                  <span className="text-[11px] font-semibold text-content-secondary-light uppercase tracking-wider block">
                    Active Live Sync
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-600">
                      {overview?.metrics?.activeConnections ?? 0}
                    </span>
                    <span className="text-xs text-emerald-700 font-bold">2-way</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
                  <span className="text-[11px] font-semibold text-content-secondary-light uppercase tracking-wider block">
                    Pending Setup
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-600">
                      {overview?.metrics?.pendingSetup ?? v2Connections.length}
                    </span>
                    <span className="text-xs text-amber-700">partner auth</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
                  <span className="text-[11px] font-semibold text-content-secondary-light uppercase tracking-wider block">
                    Pending Jobs
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-blue-600">
                      {overview?.metrics?.pendingJobs ?? 0}
                    </span>
                    <span className="text-xs text-content-secondary-light">outbox</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
                  <span className="text-[11px] font-semibold text-content-secondary-light uppercase tracking-wider block">
                    OTA Bookings (30d)
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-content-primary-light">
                      {overview?.metrics?.channelBookings30d ?? 0}
                    </span>
                    <span className="text-xs text-content-secondary-light">ingested</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
                  <span className="text-[11px] font-semibold text-content-secondary-light uppercase tracking-wider block">
                    Discrepancies
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-rose-600">
                      {overview?.metrics?.unresolvedDiscrepancies ?? 0}
                    </span>
                    <span className="text-xs text-rose-700 font-bold">unresolved</span>
                  </div>
                </div>
              </div>

              {/* Supported Providers Catalog Status */}
              <div className="bg-white rounded-2xl border border-border-light shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-light">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Supported Official Distribution Partners
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live status across global OTAs, APAC aggregators, and Metasearch engines.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('channels')}
                    className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
                  >
                    Manage Connections &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providers.map((p) => {
                    const Logo = LOGO_MAP[p.code] || BookingComLogo;
                    const existingConn = v2Connections.find((c) => c.provider_code === p.code);

                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl border border-border-light bg-surface-light flex items-start justify-between gap-3 hover:border-brand-blue/30 transition"
                      >
                        <div className="flex items-center gap-3">
                          <Logo className="w-9 h-9" />
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">{p.display_name}</span>
                            <span className="text-[10px] text-slate-500 capitalize">{p.provider_type}</span>
                          </div>
                        </div>

                        <div>
                          {existingConn ? (
                            renderStatusBadge(existingConn.connection_status)
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                              Unconfigured
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Channel Sync Events */}
              {overview?.recentEvents && overview.recentEvents.length > 0 && (
                <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border-light font-bold text-xs text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-blue" />
                    Recent Channel Synchronization Events
                  </div>
                  <div className="divide-y divide-border-light text-xs">
                    {overview.recentEvents.map((ev: any) => (
                      <div key={ev.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">{ev.channel_name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-brand-blue font-mono font-medium">
                            {ev.event_type}
                          </span>
                          <span className="text-slate-600 text-[11px]">{ev.payload_summary}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(ev.created_at * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: OTA CONNECTIONS (HONEST STATUSES & TEST) */}
          {/* ================================================================= */}
          {activeTab === 'channels' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((p) => {
                  const conn = v2Connections.find((c) => c.provider_code === p.code);
                  const isConnected = Boolean(conn);
                  const LogoComp = LOGO_MAP[p.code] || BookingComLogo;

                  return (
                    <div
                      key={p.id}
                      className="p-6 rounded-2xl bg-white border border-border-light shadow-sm flex flex-col justify-between space-y-4 hover:border-brand-blue/30 transition relative overflow-hidden"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <LogoComp />
                            <div>
                              <h3 className="font-bold text-sm text-content-primary-light">{p.display_name}</h3>
                              <span className="text-[10px] text-content-secondary-light capitalize">
                                {p.provider_type}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {conn ? (
                              renderStatusBadge(conn.connection_status)
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                                Unlinked
                              </span>
                            )}
                            {conn && (
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  conn.environment === 'sandbox'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {conn.environment === 'sandbox' ? 'Sandbox' : 'Production'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 text-xs text-content-secondary-light space-y-1.5 bg-surface-light p-3 rounded-xl border border-border-light">
                          <div className="flex justify-between">
                            <span>External Hotel ID:</span>
                            <span className="font-mono text-content-primary-light font-semibold">
                              {conn?.external_property_id || 'Not configured'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Handshake / Sync:</span>
                            <span className="font-medium text-content-primary-light">
                              {conn?.last_sync_at
                                ? new Date(conn.last_sync_at * 1000).toLocaleTimeString()
                                : 'Pending verification'}
                            </span>
                          </div>
                          {conn?.last_error_message && (
                            <div className="text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200 mt-2">
                              <strong>Last Error:</strong> {conn.last_error_message}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col gap-2">
                        {isConnected ? (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleTestConnection(conn)}
                                className="py-2.5 rounded-xl bg-blue-50 text-brand-blue font-semibold text-xs hover:bg-blue-100 transition flex items-center justify-center gap-1.5 border border-blue-200"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                Test Diagnostics
                              </button>
                              <button
                                onClick={() => handleSyncBroadcast(conn.id)}
                                className="py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition flex items-center justify-center gap-1.5 border border-slate-200"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Push Central ARI
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedConnId(conn.id);
                                setActiveTab('room_mapping');
                              }}
                              className="text-[11px] text-brand-blue hover:underline font-bold text-center"
                            >
                              Configure Room & Rate Mappings &rarr;
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setTargetProvider(p);
                              setConnectForm({
                                externalPropertyId: '',
                                environment: 'sandbox',
                                apiKey: '',
                                apiSecret: '',
                                username: '',
                                password: '',
                              });
                              setConnectModalOpen(true);
                            }}
                            className="w-full py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover transition shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Connect Channel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: ROOM MAPPING */}
          {/* ================================================================= */}
          {activeTab === 'room_mapping' && (
            <div className="space-y-6">
              <div className="p-4 bg-white rounded-2xl border border-border-light shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Select OTA Channel:</span>
                  <select
                    value={selectedConnId}
                    onChange={(e) => setSelectedConnId(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-border-light bg-surface-light font-bold"
                  >
                    {v2Connections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.provider_name} ({c.external_property_id || 'ID pending'})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setRoomMapModalOpen(true)}
                  disabled={!selectedConnId}
                  className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Room Mapping
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-light font-bold text-xs text-slate-800">
                  Room Category Mappings for Connected Channel
                </div>

                {mappingsLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                  </div>
                ) : roomMappings.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No room mappings configured for this channel yet. Click "Add Room Mapping" above.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-light border-b border-border-light text-[10px] uppercase font-bold text-slate-600">
                        <tr>
                          <th className="py-3 px-4">Local Room Category</th>
                          <th className="py-3 px-4">Local Code</th>
                          <th className="py-3 px-4">Base Tariff</th>
                          <th className="py-3 px-4">External OTA Room ID</th>
                          <th className="py-3 px-4">Channel Room Name</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {roomMappings.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">{m.local_room_type_name}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{m.local_room_type_code}</td>
                            <td className="py-3 px-4 font-semibold text-slate-700">
                              {formatINR(m.base_price_paise)}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-brand-blue">
                              {m.external_room_type_id}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{m.channel_room_name || '—'}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteRoomMapping(m.id)}
                                className="p-1 rounded text-rose-500 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: RATE PLAN MAPPING */}
          {/* ================================================================= */}
          {activeTab === 'rate_mapping' && (
            <div className="space-y-6">
              <div className="p-4 bg-white rounded-2xl border border-border-light shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Select OTA Channel:</span>
                  <select
                    value={selectedConnId}
                    onChange={(e) => setSelectedConnId(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-border-light bg-surface-light font-bold"
                  >
                    {v2Connections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.provider_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-light flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Rate Plan &amp; Meal Plan Mappings</span>
                  <button
                    onClick={() => setRateMapModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                  >
                    <Plus className="w-3 h-3" /> Add Mapping
                  </button>
                </div>

                {mappingsLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                  </div>
                ) : rateMappings.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No custom rate plan mappings active. Standard European Plan (EP) is mapped by default.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-light border-b border-border-light text-[10px] uppercase font-bold text-slate-600">
                        <tr>
                          <th className="py-3 px-4">Local Rate Plan</th>
                          <th className="py-3 px-4">Meal Plan</th>
                          <th className="py-3 px-4">External Rate ID</th>
                          <th className="py-3 px-4">Board Basis</th>
                          <th className="py-3 px-4">Tax Handling</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {rateMappings.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">{m.local_rate_plan_name}</td>
                            <td className="py-3 px-4 text-slate-600">{m.local_meal_plan || 'EP'}</td>
                            <td className="py-3 px-4 font-mono font-bold text-brand-blue">
                              {m.external_rate_plan_id}
                            </td>
                            <td className="py-3 px-4">{m.board_basis}</td>
                            <td className="py-3 px-4 capitalize">{m.tax_handling}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteRateMapping(m.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Remove Mapping"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: INVENTORY & RATE MATRIX CALENDAR */}
          {/* ================================================================= */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
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
                    Refresh Matrix
                  </button>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
                {matrixLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
                    <span className="text-xs text-content-secondary-light">
                      Computing single authority availability &amp; rates...
                    </span>
                  </div>
                ) : matrixData.roomTypes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-content-secondary-light">
                    No active room types found for this property.
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
                                </div>
                              </td>
                            </tr>

                            {/* Row 1: Available */}
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 font-semibold text-content-secondary-light sticky left-0 bg-white z-10 border-r border-border-light">
                                <div className="text-xs text-content-primary-light">Available Rooms</div>
                                <div className="text-[10px] text-content-secondary-light">Sellable / Total</div>
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

                                return (
                                  <td
                                    key={dStr}
                                    onClick={() => openBulkForDate(rt.id, dStr)}
                                    className="py-2 px-2 text-center border-r border-border-light cursor-pointer hover:bg-blue-50/50 transition"
                                  >
                                    <div className="font-bold text-xs text-content-primary-light">
                                      {formatINR(price)}
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

          {/* ================================================================= */}
          {/* TAB 6: SYNC OUTBOX & JOBS MONITOR */}
          {/* ================================================================= */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              <div className="p-4 bg-white rounded-2xl border border-border-light shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Filter Status:</span>
                  <select
                    value={jobsFilter}
                    onChange={(e) => setJobsFilter(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-border-light bg-surface-light font-bold"
                  >
                    <option value="all">All Jobs</option>
                    <option value="queued">Queued</option>
                    <option value="processing">Processing</option>
                    <option value="succeeded">Succeeded</option>
                    <option value="failed">Failed</option>
                    <option value="retry_scheduled">Retry Scheduled</option>
                  </select>
                </div>

                <button
                  onClick={loadJobs}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${jobsLoading ? 'animate-spin' : ''}`} />
                  Refresh Jobs
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-light font-bold text-xs text-slate-800">
                  Durable Channel Sync Outbox Queue
                </div>

                {jobsLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No sync jobs recorded.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-light border-b border-border-light text-[10px] uppercase font-bold text-slate-600">
                        <tr>
                          <th className="py-3 px-4">Job ID</th>
                          <th className="py-3 px-4">Channel</th>
                          <th className="py-3 px-4">Job Type</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Attempts</th>
                          <th className="py-3 px-4">Created</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {jobs.map((j) => (
                          <tr key={j.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                              {j.id.slice(0, 14)}...
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">{j.channel_name}</td>
                            <td className="py-3 px-4 font-mono font-medium text-brand-blue">{j.job_type}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  j.status === 'succeeded'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : j.status === 'failed'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {j.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {j.attempt_count} / {j.max_attempts}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(j.created_at * 1000).toLocaleTimeString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {j.status === 'failed' && (
                                <button
                                  onClick={() => handleRetryJob(j.id)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px]"
                                >
                                  Retry
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 7: CHANNEL BOOKINGS LOG */}
          {/* ================================================================= */}
          {activeTab === 'reservations' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-light font-bold text-xs text-slate-800 flex items-center justify-between">
                  <span>Inbound OTA Reservations Ledger</span>
                  <button
                    onClick={loadBookings}
                    className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>

                {bookingsLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                  </div>
                ) : channelBookings.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No channel bookings ingested yet. Webhook callbacks will automatically appear here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-light border-b border-border-light text-[10px] uppercase font-bold text-slate-600">
                        <tr>
                          <th className="py-3 px-4">External OTA ID</th>
                          <th className="py-3 px-4">Channel</th>
                          <th className="py-3 px-4">Local PMS Booking #</th>
                          <th className="py-3 px-4">Guest Name</th>
                          <th className="py-3 px-4">Dates</th>
                          <th className="py-3 px-4">Tariff</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {channelBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-bold text-brand-blue">
                              {b.external_reservation_id}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">{b.channel_name}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {b.reservation_number || 'Auto Assigned'}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800">{b.guest_name || 'OTA Guest'}</td>
                            <td className="py-3 px-4 text-slate-600">
                              {b.check_in_date} &rarr; {b.check_out_date}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {formatINR(b.total_amount_paise || 0)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                {b.reservation_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 8: RECONCILIATION CENTER */}
          {/* ================================================================= */}
          {activeTab === 'reconciliation' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-border-light shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Channel Reconciliation &amp; Overbooking Defense
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Scans live local room availability vs. channel state to detect missing stop-sells and resolve inventory discrepancies.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedConnId}
                    onChange={(e) => setSelectedConnId(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-border-light bg-surface-light font-bold"
                  >
                    {v2Connections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.provider_name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleRunReconciliationScan}
                    disabled={scanning || !selectedConnId}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                    Run 14-Day Reconciliation Scan
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-light font-bold text-xs text-slate-800">
                  Detected Discrepancies &amp; Remediation Queue
                </div>

                {reconciliationRecords.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No active discrepancies detected. PMS is in 100% agreement with channel outbox.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-light border-b border-border-light text-[10px] uppercase font-bold text-slate-600">
                        <tr>
                          <th className="py-3 px-4">Channel</th>
                          <th className="py-3 px-4">Discrepancy Type</th>
                          <th className="py-3 px-4">Stay Date</th>
                          <th className="py-3 px-4">Room Category</th>
                          <th className="py-3 px-4">PMS Value</th>
                          <th className="py-3 px-4">Channel Value</th>
                          <th className="py-3 px-4">Severity</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {reconciliationRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">{r.channel_name}</td>
                            <td className="py-3 px-4 font-mono text-slate-700">{r.discrepancy_type}</td>
                            <td className="py-3 px-4 text-slate-600">{r.stay_date || '—'}</td>
                            <td className="py-3 px-4 text-slate-800 font-medium">{r.room_type_name || 'All'}</td>
                            <td className="py-3 px-4 text-rose-700 font-bold">{r.local_value}</td>
                            <td className="py-3 px-4 text-amber-700 font-bold">{r.channel_value}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                                {r.severity}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.resolution_status === 'auto_reconciled'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {r.resolution_status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {r.resolution_status === 'unresolved' && (
                                <button
                                  onClick={() => handleResolveDiscrepancy(r.id)}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-sm transition"
                                >
                                  Force Push Central State
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 9: OTA WEBHOOK & CONCURRENCY SIMULATOR */}
          {/* ================================================================= */}
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
                    >
                      {v2Connections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.provider_name} ({c.environment})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-content-primary-light mb-1">
                      Simulated Guest Name
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
                      Room Category
                    </label>
                    <select
                      value={simForm.roomTypeId}
                      onChange={(e) => setSimForm({ ...simForm, roomTypeId: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                    >
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name} ({rt.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-content-primary-light mb-1">
                      Check-In Date
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
                      Check-Out Date
                    </label>
                    <input
                      type="date"
                      value={simForm.checkOutDate}
                      onChange={(e) => setSimForm({ ...simForm, checkOutDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-content-primary-light mb-1">
                      Total Booking Value (₹)
                    </label>
                    <input
                      type="number"
                      value={simForm.totalAmountRupees}
                      onChange={(e) => setSimForm({ ...simForm, totalAmountRupees: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                      required
                    />
                  </div>

                  <div className="md:col-span-3 pt-2">
                    <button
                      type="submit"
                      disabled={simulating}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center gap-2"
                    >
                      {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                      Dispatch Simulated Webhook Event
                    </button>
                  </div>
                </form>

                {simResult && (
                  <div
                    className={`mt-4 p-4 rounded-xl border text-xs ${
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

      {/* ================================================================= */}
      {/* MODAL 1: TEST DIAGNOSTICS MODAL (WITH TOP-RIGHT ✕ CLOSE BUTTON) */}
      {/* ================================================================= */}
      {diagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-border-light shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Integration Diagnostics: {diagTargetConn?.provider_name}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Target: {diagTargetConn?.external_property_id || 'ID Pending'} ({diagTargetConn?.environment})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDiagModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {diagRunning ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs text-slate-500">
                <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
                <span>Executing live partner handshake and credential handshake...</span>
              </div>
            ) : diagResult ? (
              <div className="space-y-3 text-xs">
                <div
                  className={`p-3.5 rounded-xl border font-bold flex items-center gap-2 ${
                    diagResult.success
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-rose-50 text-rose-900 border-rose-300'
                  }`}
                >
                  {diagResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {diagResult.success
                      ? 'Diagnostic Handshake Succeeded'
                      : 'Connection Verification Failed'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">Provider Status: </span>
                    <strong className="text-slate-800">{diagResult.providerStatus || 'Unknown'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Correlation ID: </span>
                    <span className="text-slate-800">{diagResult.correlationId}</span>
                  </div>
                </div>

                {diagResult.errors && diagResult.errors.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                    <span className="font-bold block">Diagnostics Log / Blockers:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      {diagResult.errors.map((e: string, i: number) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDiagModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: CONNECT CHANNEL MODAL (WITH TOP-RIGHT ✕ CLOSE BUTTON) */}
      {/* ================================================================= */}
      {connectModalOpen && targetProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-border-light shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div className="flex items-center gap-3">
                {React.createElement(LOGO_MAP[targetProvider.code] || BookingComLogo, { className: 'w-10 h-10' })}
                <div>
                  <h3 className="font-extrabold text-base text-content-primary-light">
                    Connect {targetProvider.display_name}
                  </h3>
                  <span className="text-xs text-content-secondary-light capitalize">
                    {targetProvider.provider_type}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center text-content-secondary-light hover:text-content-primary-light transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  External OTA Hotel / Property ID
                </label>
                <input
                  type="text"
                  value={connectForm.externalPropertyId}
                  onChange={(e) => setConnectForm({ ...connectForm, externalPropertyId: e.target.value })}
                  placeholder="e.g. 7654321"
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
                    <span>Sandbox Mode</span>
                    <span className="text-[10px] font-normal opacity-80">Development testing</span>
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
                    <span className="text-[10px] font-normal opacity-80">Requires official OTA approval</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  API Key / Channel Client Token
                </label>
                <input
                  type="password"
                  value={connectForm.apiKey}
                  onChange={(e) => setConnectForm({ ...connectForm, apiKey: e.target.value })}
                  placeholder="Encrypted with AES-256-GCM on save"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  API Secret / Basic Auth Password (Optional)
                </label>
                <input
                  type="password"
                  value={connectForm.apiSecret}
                  onChange={(e) => setConnectForm({ ...connectForm, apiSecret: e.target.value })}
                  placeholder="Optional partner secret"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-mono"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-brand-blue mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Credentials are never stored in plaintext and never returned to the frontend. Only the encrypted reference is retained.
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
                  Save Channel Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: ADD ROOM MAPPING MODAL (WITH TOP-RIGHT ✕ CLOSE BUTTON) */}
      {/* ================================================================= */}
      {roomMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-border-light shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-brand-blue" />
                <h3 className="font-extrabold text-base text-slate-900">Map Local Room Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setRoomMapModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoomMapping} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Local PMS Room Category
                </label>
                <select
                  value={roomMapForm.localRoomTypeId}
                  onChange={(e) => setRoomMapForm({ ...roomMapForm, localRoomTypeId: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-bold"
                  required
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} ({rt.code}) — {formatINR(rt.base_price_paise)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  External OTA Room Type ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. DLX_COTTAGE_01"
                  value={roomMapForm.externalRoomTypeId}
                  onChange={(e) => setRoomMapForm({ ...roomMapForm, externalRoomTypeId: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Channel Room Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deluxe Cottage with Garden View"
                  value={roomMapForm.channelRoomName}
                  onChange={(e) => setRoomMapForm({ ...roomMapForm, channelRoomName: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRoomMapModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3.5: ADD RATE PLAN MAPPING MODAL (WITH TOP-RIGHT ✕) */}
      {/* ================================================================= */}
      {rateMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-border-light shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-blue" />
                <h3 className="font-extrabold text-base text-slate-900">Add Rate Plan Mapping</h3>
              </div>
              <button
                type="button"
                onClick={() => setRateMapModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRateMapping} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Local Rate Plan
                </label>
                {ratePlans.length > 0 ? (
                  <select
                    value={rateMapForm.localRatePlanId}
                    onChange={(e) => setRateMapForm({ ...rateMapForm, localRatePlanId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-bold"
                    required
                  >
                    {ratePlans.map((rp) => (
                      <option key={rp.id} value={rp.id}>
                        {rp.name} ({rp.meal_plan || 'EP'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Standard EP or RP_DEFAULT"
                    value={rateMapForm.localRatePlanId}
                    onChange={(e) => setRateMapForm({ ...rateMapForm, localRatePlanId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-bold"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  External Rate Plan ID (OTA ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. RATE_PLAN_BAR or 123456"
                  value={rateMapForm.externalRatePlanId}
                  onChange={(e) => setRateMapForm({ ...rateMapForm, externalRatePlanId: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Channel Rate Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Best Available Rate with Breakfast"
                  value={rateMapForm.channelRateName}
                  onChange={(e) => setRateMapForm({ ...rateMapForm, channelRateName: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Board Basis (Meal)
                  </label>
                  <select
                    value={rateMapForm.boardBasis}
                    onChange={(e) => setRateMapForm({ ...rateMapForm, boardBasis: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-bold"
                  >
                    <option value="RO">RO (Room Only)</option>
                    <option value="EP">EP (European Plan)</option>
                    <option value="CP">CP (Continental / Breakfast)</option>
                    <option value="MAP">MAP (Half Board)</option>
                    <option value="AP">AP (Full Board)</option>
                    <option value="AI">AI (All Inclusive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tax Handling
                  </label>
                  <select
                    value={rateMapForm.taxHandling}
                    onChange={(e) => setRateMapForm({ ...rateMapForm, taxHandling: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-bold"
                  >
                    <option value="exclusive">Exclusive (Add Tax)</option>
                    <option value="inclusive">Inclusive (Tax in Price)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setRateMapModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs"
                >
                  Save Rate Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 4: BULK RATE & RESTRICTIONS EDITOR (WITH TOP-RIGHT ✕) */}
      {/* ================================================================= */}
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
                    Bulk Rate &amp; Restriction Editor
                  </h3>
                  <p className="text-[11px] text-content-secondary-light">
                    Update rates, stop-sell, and stay rules across multiple dates and broadcast to OTAs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center text-content-secondary-light hover:text-content-primary-light transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
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

              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  Days of Week Filter
                </label>
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
                    placeholder="Leave blank to keep existing prices"
                    value={bulkForm.price}
                    onChange={(e) => setBulkForm({ ...bulkForm, price: e.target.value })}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
                  />
                </div>
              </div>

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
                  Apply &amp; Broadcast to Connected OTAs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
