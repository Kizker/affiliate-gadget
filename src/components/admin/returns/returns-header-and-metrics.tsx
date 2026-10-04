'use client'

import React from 'react'
import { RotateCcw, RefreshCw, CreditCard } from 'lucide-react'
import { ReturnMetrics, formatPrice } from './types'

interface ReturnsHeaderAndMetricsProps {
  metrics: ReturnMetrics
}

export function ReturnsHeaderAndMetrics({
  metrics,
}: ReturnsHeaderAndMetricsProps) {
  return (
    <>
      {/* 0. Header Title & Context */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              Pengembalian & Klaim Garansi
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200/80 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
              Garansi 30 Hari
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Pusat pengelolaan retur unit bermasalah, klaim garansi ganti unit
            baru, pengembalian dana (refund), dan perbaikan servis teknisi
          </p>
        </div>
      </div>

      {/* 1. Unified Luxury Bento Metric Grid (Neutral Harmony) */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {/* Card: Total Pengajuan & Klaim */}
        <div className="shadow-2xs flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Pengajuan & Klaim
            </span>
            <RotateCcw className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {metrics.total}
            </div>
            <span className="mt-0.5 block text-[11px] text-slate-400">
              Klaim terdaftar
            </span>
          </div>
        </div>

        {/* Card: Perlu Verifikasi */}
        <div className="shadow-2xs flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Perlu Verifikasi
            </span>
            <div className="flex h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2 font-mono text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              <span>{metrics.pending}</span>
              {metrics.pending > 0 && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-950/50">
                  Antrean Baru
                </span>
              )}
            </div>
            <span className="mt-0.5 block text-[11px] text-slate-400">
              Menunggu toko
            </span>
          </div>
        </div>

        {/* Card: Sedang Diperiksa */}
        <div className="shadow-2xs flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Sedang Diperiksa
            </span>
            <RefreshCw className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {metrics.inReview}
            </div>
            <span className="mt-0.5 block text-[11px] text-slate-400">
              Uji fisik teknisi
            </span>
          </div>
        </div>

        {/* Card: Total Refund Diselesaikan */}
        <div className="shadow-2xs flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Nilai Refund
            </span>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-3">
            <div className="truncate font-mono text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {formatPrice(metrics.totalRefundAmount)}
            </div>
            <span className="mt-0.5 block text-[11px] text-slate-400">
              {metrics.approved + metrics.completed} retur diselesaikan
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
