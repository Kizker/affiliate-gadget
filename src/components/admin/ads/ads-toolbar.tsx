'use client'

import React from 'react'
import { Search } from 'lucide-react'

interface AdsToolbarProps {
  activeTab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  onTabChange: (tab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') => void
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  searchQuery: string
  onSearchChange: (query: string) => void
  levelFilter: 'LEVEL_1' | 'LEVEL_2'
}

export function AdsToolbar({
  activeTab,
  onTabChange,
  stats,
  searchQuery,
  onSearchChange,
  levelFilter,
}: AdsToolbarProps) {
  const tabs = [
    {
      key: 'ALL',
      label: 'Semua Iklan',
      count: stats.total,
    },
    {
      key: 'PENDING',
      label: 'Menunggu',
      count: stats.pending,
    },
    {
      key: 'APPROVED',
      label: 'Disetujui',
      count: stats.approved,
    },
    {
      key: 'REJECTED',
      label: 'Ditolak',
      count: stats.rejected,
    },
  ] as const

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === t.key
                ? 'shadow-xs bg-slate-900 text-white dark:bg-white dark:text-black'
                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`py-0.2 rounded-full px-1.5 text-[10px] ${
                activeTab === t.key
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              levelFilter === 'LEVEL_1'
                ? 'Cari iklan carousel / nama toko...'
                : 'Cari iklan in-feed / nama toko...'
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  )
}
