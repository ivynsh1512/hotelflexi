'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { Layers, RefreshCw, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';

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
    <div className={`${className} bg-[#00005b] rounded-xl flex items-center justify-center text-[#fcb913] shrink-0 shadow-sm`}>
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    </div>
  );
}

export default function ChannelManagerAppPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const channels = [
    { id: 'booking_com', name: 'Booking.com', component: BookingComLogo, category: 'Global OTA' },
    { id: 'agoda', name: 'Agoda', component: AgodaLogo, category: 'Asia-Pacific OTA' },
    { id: 'makemytrip', name: 'MakeMyTrip / Goibibo', component: MakeMyTripLogo, category: 'Domestic Indian OTA' },
    { id: 'airbnb', name: 'Airbnb', component: AirbnbLogo, category: 'Vacation & Homestays' },
    { id: 'expedia', name: 'Expedia Partner Solutions', component: ExpediaLogo, category: 'Global Distribution' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (activeProp) {
        setPropertyId(activeProp.id);
        const [cData, hData] = await Promise.all([
          apiClient(`/channels/connections?property_id=${activeProp.id}`),
          apiClient(`/channels/history?property_id=${activeProp.id}`),
        ]);
        setConnections(cData.connections || []);
        setHistory(hData.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant) fetchData();
  }, [currentTenant]);

  const handleConnect = async (channelName: string) => {
    try {
      await apiClient('/channels/connections', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          channelName,
          hotelChannelId: `OTA_${Math.floor(100000 + Math.random() * 900000)}`,
        }),
      });
      await fetchData();
    } catch (e: any) {
      alert(e.message || 'Connection failed.');
    }
  };

  const handleSync = async (connId: string) => {
    setSyncingId(connId);
    try {
      await apiClient(`/channels/sync/${connId}`, {
        method: 'POST',
        body: JSON.stringify({ jobType: 'rates_and_inventory_push' }),
      });
      await fetchData();
    } catch (e: any) {
      alert(e.message || 'Sync failed.');
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          OTA Channel Distribution & Live Sync
        </h1>
        <p className="text-xs text-content-secondary-light">
          Synchronize 2-way room inventory, rates, and bookings across verified Online Travel Agencies
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <>
          {/* Channel Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((ch) => {
              const conn = connections.find((c) => c.channel_name === ch.id);
              const isConnected = conn?.status === 'connected';
              const LogoComp = ch.component;

              return (
                <div key={ch.id} className="p-6 rounded-2xl bg-white border border-border-light shadow-sm flex flex-col justify-between space-y-4 hover:border-brand-blue/30 transition">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <LogoComp />
                        <div>
                          <h3 className="font-bold text-sm text-content-primary-light">{ch.name}</h3>
                          <span className="text-[10px] text-content-secondary-light">{ch.category}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isConnected ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isConnected ? 'Active' : 'Unlinked'}
                      </span>
                    </div>

                    <div className="mt-4 text-xs text-content-secondary-light space-y-1.5 bg-surface-light p-3 rounded-xl border border-border-light">
                      <div className="flex justify-between">
                        <span>Hotel Channel ID:</span>
                        <span className="font-mono text-content-primary-light font-semibold">{conn?.hotel_channel_id || 'Not configured'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Synced:</span>
                        <span className="font-medium text-content-primary-light">
                          {conn?.last_sync_at
                            ? new Date(conn.last_sync_at * 1000).toLocaleTimeString()
                            : 'Pending first sync'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    {isConnected ? (
                      <button
                        onClick={() => handleSync(conn.id)}
                        disabled={syncingId === conn.id}
                        className="w-full py-2.5 rounded-xl bg-blue-50 text-brand-blue font-semibold text-xs hover:bg-blue-100 transition flex items-center justify-center gap-1.5 border border-blue-200"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingId === conn.id ? 'animate-spin' : ''}`} />
                        {syncingId === conn.id ? 'Syncing Rates & Inv...' : 'Sync Rates & Inventory'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(ch.id)}
                        className="w-full py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover transition shadow-sm"
                      >
                        Connect Channel Adapter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sync History Table */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border-light font-bold text-sm text-content-primary-light flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-blue" />
              Recent Channel Synchronization Ledger
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-light border-b border-border-light text-[10px] uppercase font-bold text-content-primary-light">
                  <tr>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Job Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Trigger Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-content-secondary-light">
                        No channel sync transactions yet. Connect an adapter above to initiate 2-way sync.
                      </td>
                    </tr>
                  ) : (
                    history.map((h) => (
                      <tr key={h.id} className="hover:bg-surface-light">
                        <td className="py-3 px-4 font-semibold text-content-primary-light capitalize">
                          {h.channel_name.replace('_', '.')}
                        </td>
                        <td className="py-3 px-4 text-content-secondary-light">{h.job_type}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            h.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {h.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {h.status}
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
        </>
      )}
    </div>
  );
}
