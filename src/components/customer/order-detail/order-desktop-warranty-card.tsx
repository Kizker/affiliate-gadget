'use client'

import React from 'react'
import { CheckCircle2, XCircle, ShieldCheck, Clock } from 'lucide-react'
import { OrderComplaint } from './order-detail-types'

interface OrderDesktopWarrantyCardProps {
  latestComplaint: OrderComplaint
}

export function OrderDesktopWarrantyCard({
  latestComplaint,
}: OrderDesktopWarrantyCardProps) {
  return (
    <div className="shadow-2xs mb-6 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      {/* Header Row: Title & Semantic Status */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              latestComplaint.status === 'RESOLVED'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                : latestComplaint.status === 'REJECTED'
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
            }`}
          >
            {latestComplaint.status === 'RESOLVED' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : latestComplaint.status === 'REJECTED' ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-950 dark:text-white sm:text-base">
              Status Klaim Garansi 30 Hari
            </h3>
            <p className="text-xs text-slate-400">
              Diajukan pada{' '}
              {new Date(latestComplaint.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${
              latestComplaint.status === 'RESOLVED'
                ? 'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                : latestComplaint.status === 'REJECTED'
                  ? 'border border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                latestComplaint.status === 'RESOLVED'
                  ? 'bg-emerald-500'
                  : latestComplaint.status === 'REJECTED'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
              }`}
            />
            {latestComplaint.status === 'RESOLVED'
              ? 'Klaim Disetujui & Tukar Unit Pengganti'
              : latestComplaint.status === 'REJECTED'
                ? 'Klaim Ditolak'
                : 'Sedang Diverifikasi Teknisi'}
          </span>
        </div>
      </div>

      {/* Bento Content Flow: Kendala vs Solusi */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        {/* Kolom Kiri: Rincian Pengajuan Kendala */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Kendala yang Dilaporkan
          </span>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <h4 className="mb-1 text-xs font-bold text-slate-900 dark:text-white sm:text-[13px]">
              {latestComplaint.subject}
            </h4>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {latestComplaint.description}
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Hasil Tindakan & Solusi Toko */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Hasil Resolusi & Tindakan Toko
          </span>
          {latestComplaint.resolution ? (
            <div className="rounded-2xl border border-emerald-100/90 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>Unit Pengganti Teruji Disetujui</span>
              </div>
              <p className="text-xs leading-relaxed text-emerald-950/80 dark:text-emerald-200/90">
                {latestComplaint.resolution}
              </p>
            </div>
          ) : latestComplaint.rejectionNote ? (
            <div className="rounded-2xl border border-rose-100/90 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                <span>Catatan Penolakan Klaim</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-950/80 dark:text-rose-200/90">
                {latestComplaint.rejectionNote}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-100/80 bg-amber-50/40 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>Dalam Antrean Pemeriksaan</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                Teknisi toko sedang memeriksa unit dan memverifikasi kondisi
                fungsional untuk penggantian unit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
