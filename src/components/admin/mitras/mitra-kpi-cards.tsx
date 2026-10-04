'use client'

import React from 'react'
import { Store, ShieldCheck, Clock, MapPin, Wrench, Layers } from 'lucide-react'
import { Stats, ServiceStats } from './types'

interface MitraKpiCardsProps {
  mainTab: 'STORES' | 'SERVICES'
  stats: Stats
  serviceStats: ServiceStats
}

export function MitraKpiCards({
  mainTab,
  stats,
  serviceStats,
}: MitraKpiCardsProps) {
  if (mainTab === 'STORES') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {/* 1. Total Toko */}
        <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-orange-200 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Jaringan
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Store className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {stats.total} Toko
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                Cabang & Pendaftar
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Terdata
              </span>
            </div>
          </div>
        </div>

        {/* 2. Terverifikasi */}
        <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Terverifikasi
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {stats.approved} Toko
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                100% Beroperasi
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Aktif
              </span>
            </div>
          </div>
        </div>

        {/* 3. Menunggu Review */}
        <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Menunggu Review
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {stats.pending} Antrean
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              {stats.pending > 0 ? (
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  Perlu Verifikasi
                </span>
              ) : (
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Antrean Bersih
                </span>
              )}
              <span className="text-slate-400 dark:text-slate-500">
                · Pendaftaran
              </span>
            </div>
          </div>
        </div>

        {/* 4. Kota Tercakup */}
        <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Kota Jangkauan
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {stats.cities || 5} Kota
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Indonesia
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Jangkauan kurir
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
      {/* 1. Total Mitra Servis */}
      <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-orange-200 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Mitra Servis
          </span>
          <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
            <Wrench className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
            {serviceStats.total} Akun
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Role MITRA
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              · Terdaftar
            </span>
          </div>
        </div>
      </div>

      {/* 2. Mitra Aktif */}
      <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Mitra Aktif
          </span>
          <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
            {serviceStats.active} Akun
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Siap Melayani Servis
            </span>
            <span className="text-slate-400 dark:text-slate-500">· Online</span>
          </div>
        </div>
      </div>

      {/* 3. Total Layanan Reparasi */}
      <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Layanan Terdaftar
          </span>
          <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Layers className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
            {serviceStats.totalServices} Layanan
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              LCD, Baterai & Mesin
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              · Terkatalog
            </span>
          </div>
        </div>
      </div>

      {/* 4. Kota Jangkauan Servis */}
      <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Kota Jangkauan
          </span>
          <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
            {serviceStats.cities || 1} Kota
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Pusat Workshop
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              · Di Indonesia
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
