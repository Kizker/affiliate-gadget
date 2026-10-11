'use client'

import React from 'react'
import { Clock, Check } from 'lucide-react'

export interface AuditTimelineStep {
  key: string
  title: string
  isPassed: boolean
  isCurrent?: boolean
  dateFormatted?: string | null
  description?: string | null
}

interface OrderDesktopAuditTimelineCardProps {
  contextualTime: {
    label: string
    fullDateTime: string
  }
  auditTimeline: AuditTimelineStep[]
}

export function OrderDesktopAuditTimelineCard({
  contextualTime,
  auditTimeline,
}: OrderDesktopAuditTimelineCardProps) {
  return (
    <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      {/* Riwayat Waktu Transaksi (Audit Trail Bento) */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
        <h3 className="flex min-w-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <Clock className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="truncate">Riwayat Waktu Transaksi</span>
        </h3>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
          <span>{contextualTime.label}</span>
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {auditTimeline.map((step, idx) => (
          <div key={step.key} className="relative flex items-start gap-3">
            {idx !== auditTimeline.length - 1 && (
              <div
                className={`absolute bottom-0 left-[11px] top-6 w-0.5 ${
                  step.isPassed
                    ? 'bg-emerald-200 dark:bg-emerald-900/60'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            )}

            <div
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step.isCurrent
                  ? 'shadow-xs bg-orange-500 text-white shadow-orange-500/30 ring-4 ring-orange-100 dark:ring-orange-950/60'
                  : step.isPassed
                    ? 'bg-emerald-500 text-white'
                    : 'border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
              }`}
            >
              {step.isPassed ? (
                <Check className="h-3 w-3 stroke-[2.5]" />
              ) : (
                <span className="text-[10px]">{idx + 1}</span>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span
                  className={`text-xs font-bold leading-tight ${
                    step.isPassed || step.isCurrent
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.title}
                </span>
                {step.dateFormatted && (
                  <span className="font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {step.dateFormatted}
                  </span>
                )}
              </div>
              {step.description && (
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
