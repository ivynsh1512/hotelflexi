'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ExternalLink,
  CreditCard,
  Building,
  BedDouble,
  DollarSign,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
} from 'lucide-react';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  actionUrl: string;
  actionLabel: string;
  isExternal?: boolean;
  secondaryActionUrl?: string;
  secondaryActionLabel?: string;
  category: string;
}

interface ChecklistData {
  propertyId: string;
  propertyName: string;
  items: ChecklistItem[];
  pendingItems: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
  isFullyOnboarded: boolean;
}

interface OnboardingChecklistProps {
  propertyId?: string;
  variant?: 'banner' | 'card' | 'compact';
  onDismiss?: () => void;
}

export function OnboardingChecklist({ propertyId, variant = 'card', onDismiss }: OnboardingChecklistProps) {
  const [data, setData] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [activePropertyId, setActivePropertyId] = useState(propertyId || '');

  const loadChecklist = useCallback(async () => {
    try {
      let targetPropId = activePropertyId;
      if (!targetPropId) {
        const propRes = await apiClient('/properties');
        const active = propRes.properties?.[0];
        if (active) {
          targetPropId = active.id;
          setActivePropertyId(active.id);
        }
      }

      if (!targetPropId) {
        setLoading(false);
        return;
      }

      const res = await apiClient(`/onboarding/checklist?property_id=${targetPropId}`);
      setData(res);
    } catch (e) {
      console.warn('Failed to fetch onboarding checklist:', e);
    } finally {
      setLoading(false);
    }
  }, [activePropertyId]);

  useEffect(() => {
    loadChecklist();

    const handleUpdate = () => loadChecklist();
    window.addEventListener('hotelflexi:onboarding-updated', handleUpdate);
    return () => window.removeEventListener('hotelflexi:onboarding-updated', handleUpdate);
  }, [loadChecklist]);

  if (loading || !data || data.isFullyOnboarded) {
    return null;
  }

  // 1. COMPACT PILL FOR TOP HEADER
  if (variant === 'compact') {
    return (
      <div className="relative">
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand-blue text-xs font-bold hover:bg-blue-100 transition shadow-xs"
          title="Authoritative setup progress based on real database records"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Setup: {data.completedCount}/{data.totalCount} ({data.completionPercentage}%)</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {expanded && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-900">Dynamic Setup Checklist</span>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-blue h-full transition-all duration-500 rounded-full"
                style={{ width: `${data.completionPercentage}%` }}
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto space-y-1">
              {data.items.map((it) => (
                <div key={it.id} className="py-2.5 flex items-start gap-2.5">
                  {it.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold block ${it.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {it.title}
                    </span>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{it.description}</p>
                  </div>
                  {!it.isCompleted && (
                    it.isExternal ? (
                      <a
                        href={it.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold shrink-0 hover:bg-blue-700 transition flex items-center gap-1"
                      >
                        {it.actionLabel}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <Link
                        href={it.actionUrl}
                        onClick={() => setExpanded(false)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold shrink-0 transition"
                      >
                        {it.actionLabel}
                      </Link>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. MAIN CARD VIEW FOR DASHBOARD
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/50 border border-blue-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-blue text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Complete Your Hotel Setup ({data.completedCount}/{data.totalCount} Tasks Done)
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Real backend-driven checklist. Tasks automatically complete when verified in your database.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-black text-brand-blue bg-white px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
            {data.completionPercentage}% Live
          </span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-brand-blue h-full transition-all duration-700 rounded-full"
          style={{ width: `${data.completionPercentage}%` }}
        />
      </div>

      {/* Pending Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {data.items.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-3 ${
              item.isCompleted
                ? 'bg-slate-50/60 border-slate-200 opacity-75'
                : 'bg-white border-blue-200/80 shadow-xs hover:border-brand-blue'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  {item.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span className={item.isCompleted ? 'line-through text-slate-400' : ''}>
                    {item.title}
                  </span>
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  item.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.isCompleted ? 'Verified' : 'Pending'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {item.description}
              </p>
            </div>

            {!item.isCompleted && (
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                {item.isExternal ? (
                  <a
                    href={item.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <span>{item.actionLabel}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link
                    href={item.actionUrl}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {item.secondaryActionUrl && (
                  <Link
                    href={item.secondaryActionUrl}
                    className="text-[10px] text-center text-slate-500 hover:text-brand-blue font-semibold py-0.5"
                  >
                    {item.secondaryActionLabel}
                  </Link>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
