'use client';

import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ShieldCheck, Terminal, CheckCircle2, Lock } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-3 border-b border-border-dark">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">
          Platform Security & Admin Allowlist Configuration
        </h1>
        <p className="text-xs text-content-secondary-dark">
          Verification of server-side ADMIN_EMAILS secret enforcement
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-surface-dark-surface border border-border-dark space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Allowlist Authorization Active</h2>
            <p className="text-xs text-content-secondary-dark">
              Authenticated Admin Email: <span className="text-white font-mono">{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs space-y-2">
          <div className="font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            Configuring or updating authorized administrator emails in Cloudflare:
          </div>
          <p className="text-content-secondary-dark">
            From the project folder, run the following Wrangler command to update the allowlist:
          </p>
          <pre className="p-3 rounded-lg bg-black text-purple-300 font-mono text-xs overflow-x-auto">
npx wrangler secret put ADMIN_EMAILS
# When prompted, enter: divyansh.shukla1512@gmail.com, info@novaxai.in
          </pre>
          <p className="text-content-secondary-dark text-[11px] pt-1">
            • Emails must be verified in Firebase Authentication.<br />
            • The Cloudflare Worker normalizes all emails (lowercase, trimmed) and verifies tokens cryptographically against Google's public JWKS before granting super-admin access.<br />
            • No passwords or admin secrets are ever stored in the database or frontend code.
          </p>
        </div>
      </div>
    </div>
  );
}
