'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export const DineOutSearchBar: React.FC = () => {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim();
    if (clean) {
      router.push(`/dine/${clean}`);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="p-2 rounded-2xl bg-white border-2 border-slate-200 focus-within:border-amber-500 shadow-xl flex items-center gap-2"
    >
      <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter 5-Digit Hotel Code (e.g. 58291) or property slug..."
        className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
        required
      />
      <button
        type="submit"
        className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition shrink-0 shadow"
      >
        Find Table
      </button>
    </form>
  );
};
