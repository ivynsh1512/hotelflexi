'use client';

import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';

export default function NotificationsPage() {
  const notices = [
    { title: '14-Day Free Trial Activated', time: 'Just now', desc: 'Welcome to HotelFlexi! All Starter modules are active.' },
    { title: 'Room Inventory Initialized', time: 'Today', desc: 'Rooms 101, 102, 201 generated with standard amenities.' },
    { title: 'Indian GST Rules Applied', time: 'Today', desc: 'Automatic 12% and 18% slab rules configured for invoices.' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Notifications Center
        </h1>
        <p className="text-xs text-content-secondary-light">
          Operational alerts, reservation updates, and system messages
        </p>
      </div>

      <div className="space-y-3">
        {notices.map((n) => (
          <div key={n.title} className="p-4 rounded-xl bg-white border border-border-light shadow-sm flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-content-primary-light">{n.title}</h3>
                <span className="text-[10px] text-content-secondary-light">{n.time}</span>
              </div>
              <p className="text-xs text-content-secondary-light mt-1">{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
