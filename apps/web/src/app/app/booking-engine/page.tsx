'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { Globe, Copy, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';

export default function BookingEngineAppPage() {
  const { currentTenant } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      if (!currentTenant) return;
      try {
        const propData = await apiClient('/properties');
        setProperty(propData.properties?.[0]);
      } catch (e) {
        console.error(e);
      }
    }
    loadProperty();
  }, [currentTenant]);

  const bookingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/book/${currentTenant?.tenant_slug}`
    : `https://hotelflexi.app/book/${currentTenant?.tenant_slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Direct Booking Engine Settings
        </h1>
        <p className="text-xs text-content-secondary-light">
          Share your direct booking link with guests or embed the widget on your hotel website
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-content-primary-light uppercase tracking-wider mb-2">
            Your Dedicated Guest Booking URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={bookingUrl}
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-border-light bg-surface-light text-xs font-mono text-content-primary-light"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-lg bg-surface-light border border-border-light text-xs font-semibold hover:bg-white transition flex items-center gap-1.5"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <Link
              href={`/book/${currentTenant?.tenant_slug}`}
              target="_blank"
              className="px-4 py-2.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover transition flex items-center gap-1.5"
            >
              Open <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-light border border-border-light text-xs text-content-secondary-light space-y-2">
          <div className="font-bold text-content-primary-light">Website Embed Code (iframe)</div>
          <p>Paste this HTML snippet on your property website to accept commission-free bookings:</p>
          <pre className="p-3 rounded-lg bg-surface-dark-bg text-content-primary-dark font-mono text-[11px] overflow-x-auto">
{`<iframe
  src="${bookingUrl}"
  width="100%"
  height="700px"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);"
></iframe>`}
          </pre>
        </div>
      </div>
    </div>
  );
}
