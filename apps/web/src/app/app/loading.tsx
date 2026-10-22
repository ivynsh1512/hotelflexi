'use client';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const MESSAGES = [
  'Loading your data...',
  'Fetching property information...',
  'Almost ready...',
  'Preparing your workspace...',
  'Syncing latest updates...',
  'Getting things ready for you...',
];

export default function Loading() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMsgIndex(i => (i + 1) % MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      <p className="text-sm text-content-secondary-light font-medium animate-pulse">{MESSAGES[msgIndex]}</p>
    </div>
  );
}
