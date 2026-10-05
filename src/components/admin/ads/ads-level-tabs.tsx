'use client'

import React from 'react'
import { Video, LayoutGrid, AlertTriangle, Sparkles } from 'lucide-react'
import { Level1SlotInfo } from './types'

interface AdsLevelTabsProps {
  levelFilter: 'LEVEL_1' | 'LEVEL_2'
  onSelectLevel: (level: 'LEVEL_1' | 'LEVEL_2') => void
  allLevel1Count: number
  allLevel2Count: number
  pendingLevel1Count: number
  urgentLevel2Count: number
  activeLevel2Count: number
  level1Slot: Level1SlotInfo
}

export function AdsLevelTabs({
  levelFilter,
  onSelectLevel,
  allLevel1Count,
  allLevel2Count,
  pendingLevel1Count,
  urgentLevel2Count,
  activeLevel2Count,
  level1Slot,
}: AdsLevelTabsProps) {
  return (
    <>
      {/* 2.2 TAB SWITCHER UTAMA: Level 1 (Hero Carousel) vs Level 2 (In-Feed Grid) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Tab 1: Level 1 (Hero Carousel) */}
        <button
          type="button"
          onClick={() => onSelectLevel('LEVEL_1')}
          className={`flex cursor-pointer items-start gap-3.5 rounded-3xl border-2 p-4 text-left transition-all duration-200 ${
            levelFilter === 'LEVEL_1'
              ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10 dark:border-blue-500 dark:bg-blue-950/20'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
          }`}
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              levelFilter === 'LEVEL_1'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <Video className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="min-w-0 text-sm font-black text-slate-950 dark:text-white sm:text-base">
                Tab Level 1: Hero Carousel
              </h3>
              <span
                className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-extrabold sm:px-2.5 sm:text-[11px] ${
                  levelFilter === 'LEVEL_1'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {allLevel1Count} Iklan
              </span>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
              Slot eksklusif teratas • Maksimal 1 iklan saja di seluruh platform
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {level1Slot.isOccupied ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                  1 Video Sedang Tayang
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Slot Tersedia
                </span>
              )}
              {pendingLevel1Count > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                  {pendingLevel1Count} Menunggu Antrean
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Tab 2: Level 2 (In-Feed Grid) */}
        <button
          type="button"
          onClick={() => onSelectLevel('LEVEL_2')}
          className={`flex cursor-pointer items-start gap-3.5 rounded-3xl border-2 p-4 text-left transition-all duration-200 ${
            levelFilter === 'LEVEL_2'
              ? 'border-orange-500 bg-orange-50/50 shadow-md shadow-orange-500/10 dark:border-orange-500 dark:bg-orange-950/20'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
          }`}
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              levelFilter === 'LEVEL_2'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="min-w-0 text-sm font-black text-slate-950 dark:text-white sm:text-base">
                Tab Level 2: In-Feed Grid Produk
              </h3>
              <span
                className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-extrabold sm:px-2.5 sm:text-[11px] ${
                  levelFilter === 'LEVEL_2'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {allLevel2Count} Iklan
              </span>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
              Diselipkan di antara katalog • Boleh ada banyak iklan dari seluruh
              toko cabang
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {urgentLevel2Count > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertTriangle className="h-3 w-3" />
                  {urgentLevel2Count} Segera Berakhir (&lt; 3 Hari)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {activeLevel2Count} Iklan Aktif
                </span>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* 2.5 Real-Time Exclusive Level 1 Slot Banner OR Level 2 Overview Banner */}
      {levelFilter === 'LEVEL_1' ? (
        level1Slot.isOccupied && level1Slot.activeAd ? (
          <div className="shadow-2xs rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white p-4 dark:border-blue-900/60 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
                      Slot Eksklusif Level 1 (Hero Carousel)
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
                      Sedang Terisi (Maksimal 1 Toko)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Iklan Aktif:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      &ldquo;{level1Slot.activeAd.title}&rdquo;
                    </strong>
                    {level1Slot.activeAd.store?.name && (
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {' '}
                        • {level1Slot.activeAd.store.name}
                      </span>
                    )}{' '}
                    • Sisa Masa Tayang:{' '}
                    <span className="font-bold text-blue-700 dark:text-blue-400">
                      {level1Slot.activeAd.remainingText}
                    </span>
                    {level1Slot.activeAd.endDate && (
                      <span>
                        {' '}
                        (Berakhir{' '}
                        {new Date(
                          level1Slot.activeAd.endDate
                        ).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        )
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="shrink-0 sm:max-w-xs sm:text-right">
                <span className="shadow-2xs inline-block rounded-xl border border-blue-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-blue-700 dark:border-blue-900 dark:bg-slate-800 dark:text-blue-300">
                  ⏳ Iklan toko lain masuk antrean &amp; tayang setelah slot ini
                  expired
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="shadow-2xs rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white p-4 dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Slot Eksklusif Level 1 (Hero Carousel)
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Tersedia / Kosong
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                    Belum ada iklan Level 1 yang aktif. Pengajuan baru dapat
                    langsung tayang eksklusif setelah disetujui.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="shadow-2xs rounded-2xl border border-orange-200/90 bg-gradient-to-r from-orange-50/90 via-amber-50/40 to-white p-4 dark:border-orange-900/60 dark:from-orange-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-900 dark:text-orange-300">
                    Monitoring Masa Tayang Level 2 (In-Feed Grid Produk)
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-extrabold text-orange-700 dark:bg-orange-900/60 dark:text-orange-300">
                    Diurutkan Sisa Masa Tayang Terdekat
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Iklan yang masa penayangannya sebentar lagi habis ditampilkan
                  di posisi paling atas untuk memudahkan perpanjangan kuota
                  promosi toko cabang.
                </p>
              </div>
            </div>
            {urgentLevel2Count > 0 && (
              <div className="shrink-0 sm:text-right">
                <span className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                  {urgentLevel2Count} Iklan Segera Berakhir (&lt; 3 Hari)
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
