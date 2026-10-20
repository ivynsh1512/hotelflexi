'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function SuperAdminPortalPage() {
  const router = useRouter();
  const { user, isPlatformAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && isPlatformAdmin) {
        router.replace('/central-command');
      } else if (!user) {
        router.replace('/login?redirect=/central-command');
      }
    }
  }, [user, isPlatformAdmin, loading, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-sm w-full p-6 rounded-3xl bg-slate-900 border border-purple-900/50 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30">
          <ShieldCheck className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white">Super Admin Gateway</h2>
          <p className="text-xs text-slate-400 mt-1">Verifying cryptographic administrator privileges...</p>
        </div>
        <div className="flex justify-center pt-2">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      </div>
    </div>
  );
}
