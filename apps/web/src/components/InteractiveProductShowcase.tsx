'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Globe,
  Layers,
  Sparkles,
  Volume2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Smartphone,
  CreditCard,
  Building,
  UserCheck,
  AlertTriangle,
  Play,
  Check,
} from 'lucide-react';
import { testSiren } from '@/lib/sound';

export function InteractiveProductShowcase() {
  const [activeTab, setActiveTab] = useState<'pms' | 'channels' | 'engine' | 'siren' | 'ai'>('pms');
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [sirenPicked, setSirenPicked] = useState(false);
  const [blockedRooms, setBlockedRooms] = useState<string[]>(['104']);
  const [advancePolicy, setAdvancePolicy] = useState<'full' | 'partial' | 'hotel'>('partial');

  const handleTestSiren = async () => {
    setSirenPlaying(true);
    setSirenPicked(false);
    try {
      await testSiren();
    } finally {
      setSirenPlaying(false);
    }
  };

  const toggleBlockRoom = (num: string) => {
    if (blockedRooms.includes(num)) {
      setBlockedRooms(blockedRooms.filter((r) => r !== num));
    } else {
      setBlockedRooms([...blockedRooms, num]);
    }
  };

  return (
    <div className="bg-slate-950 text-white rounded-3xl p-4 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Interactive Tabs */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 border-b border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('pms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'pms'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Front Desk PMS &amp; Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'channels'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2-Way OTA Channels</span>
        </button>

        <button
          onClick={() => setActiveTab('engine')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'engine'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Direct Engine &amp; FlexiLink</span>
        </button>

        <button
          onClick={() => setActiveTab('siren')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'siren'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Hardware Urgency Siren</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'ai'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bilingual AI Assistant</span>
        </button>
      </div>

      {/* Main Interactive Screen Content */}
      <div className="pt-6">
        {/* 1. FRONT DESK PMS & CALENDAR */}
        {activeTab === 'pms' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                  Live Interactive Front Desk Grid
                </span>
                <h3 className="text-base font-bold text-white">Shivadri Heritage Resort • 32 Rooms</h3>
                <p className="text-xs text-slate-400">
                  Tap any room to toggle instant blockage. Conflict checking protects against overlapping bookings.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-bold">
                  84% Occupied Today
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800 font-bold">
                  ₹4,850 ADR
                </span>
              </div>
            </div>

            {/* Room Matrix Simulation */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              {[
                { num: '101', type: 'Deluxe Suite', guest: 'Rahul Verma (OTA)', status: 'occupied', price: '₹4,200' },
                { num: '102', type: 'Deluxe Suite', guest: 'Priya Mehta (Direct)', status: 'occupied', price: '₹3,900' },
                { num: '103', type: 'Luxury Pool Villa', guest: 'Available for Walk-in', status: 'available', price: '₹7,500' },
                { num: '104', type: 'Luxury Pool Villa', guest: 'Maintenance Block', status: 'blocked', price: '₹7,500' },
                { num: '105', type: 'Standard Room', guest: 'Aman Singhania', status: 'occupied', price: '₹2,800' },
              ].map((r) => {
                const isBlocked = blockedRooms.includes(r.num);
                return (
                  <div
                    key={r.num}
                    onClick={() => toggleBlockRoom(r.num)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer select-none space-y-1.5 ${
                      isBlocked
                        ? 'bg-amber-950/40 border-amber-600 text-amber-200'
                        : r.status === 'occupied'
                        ? 'bg-blue-950/30 border-blue-800/80 text-white'
                        : 'bg-emerald-950/20 border-emerald-700/80 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm font-mono">Room {r.num}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isBlocked
                            ? 'bg-amber-500 text-slate-950'
                            : r.status === 'occupied'
                            ? 'bg-blue-600 text-white'
                            : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {isBlocked ? 'BLOCKED' : r.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium truncate text-slate-300">
                      {isBlocked ? 'Owner / Renovation Block' : r.guest}
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-white/10">
                      <span>{r.type}</span>
                      <span className="font-bold text-white">{r.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Weekend Surcharge Active:</strong> +20% automatically applied for Friday–Sunday check-ins.
                </span>
              </span>
              <span className="text-slate-400">Tap room to toggle room block simulation</span>
            </div>
          </div>
        )}

        {/* 2. 2-WAY OTA CHANNELS */}
        {activeTab === 'channels' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  Automated Two-Way ARI Synchronization
                </span>
                <h3 className="text-base font-bold text-white">Live Channel Distribution Hub</h3>
                <p className="text-xs text-slate-400">
                  Rate parity and inventory sync across 100+ channels. Automatic stop-sell prevents double bookings.
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Channels Synced (0.8s)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'MakeMyTrip & Goibibo', region: 'India Domestic', markup: '+15% Markup', status: 'Live 2-Way', color: 'text-red-400' },
                { name: 'Booking.com', region: 'Global Distribution', markup: '+18% Markup', status: 'Live 2-Way', color: 'text-blue-400' },
                { name: 'Agoda & Priceline', region: 'Southeast Asia', markup: '+15% Markup', status: 'Live 2-Way', color: 'text-emerald-400' },
                { name: 'Airbnb', region: 'Villas & Homestays', markup: '0% Parity', status: 'Live 2-Way', color: 'text-rose-400' },
                { name: 'Expedia Group', region: 'Americas & Europe', markup: '+15% Markup', status: 'Live 2-Way', color: 'text-amber-400' },
                { name: 'Google Hotel Ads', region: 'Free Direct Links', markup: 'Direct Parity', status: 'Live Feed', color: 'text-purple-400' },
              ].map((ch) => (
                <div key={ch.name} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-xs ${ch.color}`}>{ch.name}</span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      {ch.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">{ch.region}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                    <span className="text-slate-400">OTA Multiplier:</span>
                    <span className="font-mono font-bold text-white">{ch.markup}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-blue-950/40 rounded-xl border border-blue-900/60 text-xs text-blue-200 flex items-center justify-between">
              <span>
                <strong>Smart Margin Protection:</strong> Channel markups automatically cover 15%–18% OTA commission fees so your net direct profit is never compromised.
              </span>
            </div>
          </div>
        )}

        {/* 3. DIRECT ENGINE & FLEXILINK */}
        {activeTab === 'engine' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                  Zero Commission Engine • Custom Advance Rules
                </span>
                <h3 className="text-base font-bold text-white">Direct Booking Engine &amp; Contactless FlexiLink</h3>
                <p className="text-xs text-slate-400">
                  Payments go directly into the hotel&apos;s Razorpay account. Guests receive an encrypted self-service portal link.
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-[11px]">
                <button
                  onClick={() => setAdvancePolicy('full')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    advancePolicy === 'full' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  100% Advance
                </button>
                <button
                  onClick={() => setAdvancePolicy('partial')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    advancePolicy === 'partial' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  20% Advance
                </button>
                <button
                  onClick={() => setAdvancePolicy('hotel')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    advancePolicy === 'hotel' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Pay at Hotel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Booking Engine View */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="font-bold text-white">Direct Guest Checkout (/book/shivadri)</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded">
                    0% Commission
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold text-white">
                    <span>Deluxe Mountain View Suite</span>
                    <span>₹4,200/night</span>
                  </div>
                  <div className="text-[11px] text-slate-400">2 Nights (2 Adults) + 12% GST</div>
                  <div className="pt-2 flex justify-between font-bold text-white border-t border-slate-800">
                    <span>Total Tariff:</span>
                    <span>₹9,408</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-blue-400 text-xs">
                    <span>
                      {advancePolicy === 'full'
                        ? 'Payable Now (100% Advance):'
                        : advancePolicy === 'partial'
                        ? 'Payable Now (20% Advance):'
                        : 'Payable at Check-In:'}
                    </span>
                    <span>
                      {advancePolicy === 'full'
                        ? '₹9,408'
                        : advancePolicy === 'partial'
                        ? '₹1,882'
                        : '₹9,408 (Zero Prepayment)'}
                    </span>
                  </div>
                </div>
                <button className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md">
                  Pay via UPI / Card (Razorpay Direct)
                </button>
              </div>

              {/* Right: Guest Portal FlexiLink View */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="font-bold text-white">Guest Mobile FlexiLink (/guest/token)</span>
                  <span className="text-[10px] text-blue-400 font-bold bg-blue-950 px-2 py-0.5 rounded">
                    Auto-Expires in 7 Days
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span>🆔 Contactless Aadhaar / Passport Upload</span>
                    <span className="text-emerald-400 font-bold">Verified ✓</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span>🔑 Assigned Key: <strong>Room 204</strong></span>
                    <span className="text-blue-400 font-bold">Clean &amp; Ready</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span>🍽️ In-Stay Food Order (Dino POS)</span>
                    <span className="text-amber-400 font-bold">Room Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. HARDWARE URGENCY SIREN */}
        {activeTab === 'siren' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-950/40 p-4 rounded-2xl border border-red-800/80">
              <div>
                <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">
                  Patented 7-Minute Urgency Dispatch
                </span>
                <h3 className="text-base font-bold text-white">Emergency Dual-Tone Siren &amp; Vibration Alert</h3>
                <p className="text-xs text-red-200">
                  When a guest raises an urgent complaint or bedsheet sanitation request, floor staff phones ring loudly with hardware vibrations.
                </p>
              </div>
              <button
                onClick={handleTestSiren}
                disabled={sirenPlaying}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2 self-start sm:self-auto shrink-0"
              >
                <Volume2 className={`w-4 h-4 ${sirenPlaying ? 'animate-bounce' : ''}`} />
                <span>{sirenPlaying ? 'Playing Loud Siren...' : '🔊 Test Live Siren Sound'}</span>
              </button>
            </div>

            {/* Interactive Alert Banner Simulation */}
            <div className="bg-red-600 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-red-600 flex items-center justify-center font-black text-xl animate-bounce">
                  🚨
                </div>
                <div>
                  <div className="font-extrabold text-sm uppercase">
                    Urgent Room 204: Dirty Bedding Replacement
                  </div>
                  <div className="text-xs text-red-100">
                    Guest reported 2 mins ago • Sounding on all floor staff smartphones
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {sirenPicked ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Taken by Suresh (Housekeeping)
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setSirenPicked(true);
                      setSirenPlaying(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-xs shadow transition flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Pick &amp; Silence Siren</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="block text-white mb-1">Dual-Tone Hi-Lo Audio</strong>
                880Hz / 660Hz filtered frequency audible through loud resort environments.
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="block text-white mb-1">Hardware Vibration Pulse</strong>
                Continuous [600ms, 250ms] rhythmic vibration on staff Android phones.
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="block text-white mb-1">Owner &amp; Admin Serenity</strong>
                Alarms sound on operating staff devices; admin monitors silent dispatch status.
              </div>
            </div>
          </div>
        )}

        {/* 5. BILINGUAL AI ASSISTANT */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-950/40 p-4 rounded-2xl border border-purple-800/80">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">
                  India-First Hospitality AI
                </span>
                <h3 className="text-base font-bold text-white">Bilingual AI Hotel Business Agent</h3>
                <p className="text-xs text-purple-200">
                  Speak or type in English, Hindi, or Hinglish. Autonomous actions execute directly on the database.
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">
                Hindi &bull; English &bull; Hinglish
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-400 flex items-center justify-center font-bold shrink-0">
                  👤
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-bold">Hotelier Voice Command</div>
                  <div className="text-sm font-semibold text-white">
                    &quot;Kal Room 101 block kar do aur aaj kitni cash payment aayi wo batao&quot;
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-purple-950/30 rounded-2xl border border-purple-900/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                  🤖
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-[11px] text-purple-400 font-bold">HotelFlexi Autonomous Action</div>
                  <p className="text-slate-200 leading-relaxed">
                    1. <strong>Room 101 Blocked:</strong> Tomorrow&apos;s date successfully locked in the PMS. All OTA channels have been notified with stop-sell.
                    <br />
                    2. <strong>Today&apos;s Cash Collection:</strong> ₹14,800 received across 3 folios (Total revenue today: ₹42,500).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
