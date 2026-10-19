'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { Layers, RefreshCw, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';

export default function ChannelManagerAppPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const channels = [
    { id: 'booking_com', name: 'Booking.com', icon: '🏨' },
    { id: 'agoda', name: 'Agoda', icon: '🌏' },
    { id: 'makemytrip', name: 'MakeMyTrip / Goibibo', icon: '🇮🇳' },
    { id: 'airbnb', name: 'Airbnb', icon: '🏡' },
    { id: 'expedia', name: 'Expedia Partner Solutions', icon: '✈️' },
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
          OTA Channel Distribution & Mapping
        </h1>
        <p className="text-xs text-content-secondary-light">
          Synchronize room inventory and rates across online travel agencies
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

              return (
                <div key={ch.id} className="p-6 rounded-2xl bg-white border border-border-light shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{ch.icon}</span>
                        <h3 className="font-bold text-sm text-content-primary-light">{ch.name}</h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-content-secondary-light space-y-1">
                      <div>Channel ID: <span className="font-mono text-content-primary-light font-semibold">{conn?.hotel_channel_id || 'Not linked'}</span></div>
                      <div>
                        Last Sync:{' '}
                        {conn?.last_sync_at
                          ? new Date(conn.last_sync_at * 1000).toLocaleTimeString()
                          : 'Never'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border-light flex gap-2">
                    {isConnected ? (
                      <button
                        onClick={() => handleSync(conn.id)}
                        disabled={syncingId === conn.id}
                        className="w-full py-2 rounded-lg bg-blue-50 text-brand-blue font-semibold text-xs hover:bg-blue-100 transition flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingId === conn.id ? 'animate-spin' : ''}`} />
                        {syncingId === conn.id ? 'Syncing...' : 'Sync Rates & Inventory'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(ch.id)}
                        className="w-full py-2 rounded-lg bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover transition"
                      >
                        Connect Adapter (Test Mode)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sync History Table */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border-light font-bold text-sm text-content-primary-light">
              Recent Channel Synchronization History
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-light border-b border-border-light text-[10px] uppercase font-bold text-content-primary-light">
                  <tr>
                    <th className="p-3">Job ID</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Operation</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-content-secondary-light">
                        No synchronization jobs executed yet. Click 'Sync Rates & Inventory' above to simulate.
                      </td>
                    </tr>
                  ) : (
                    history.map((j) => (
                      <tr key={j.id} className="hover:bg-surface-light/40">
                        <td className="p-3 font-mono font-bold text-brand-blue">{j.id.slice(-8)}</td>
                        <td className="p-3 font-semibold capitalize">{j.channel_name?.replace('_', '.')}</td>
                        <td className="p-3 text-content-secondary-light">{j.job_type}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {j.status}
                          </span>
                        </td>
                        <td className="p-3 text-content-secondary-light">
                          {new Date(j.created_at * 1000).toLocaleString()}
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
