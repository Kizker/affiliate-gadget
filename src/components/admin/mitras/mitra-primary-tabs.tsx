'use client'

import React from 'react'
import { Store, Wrench } from 'lucide-react'
import { Stats, ServiceStats } from './types'

interface MitraPrimaryTabsProps {
  mainTab: 'STORES' | 'SERVICES'
  setMainTab: (tab: 'STORES' | 'SERVICES') => void
  stats: Stats
  serviceStats: ServiceStats
}

export function MitraPrimaryTabs({
  mainTab,
  setMainTab,
  stats,
  serviceStats,
}: MitraPrimaryTabsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/90 p-1 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setMainTab('STORES')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            mainTab === 'STORES'
              ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-800 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Store
            className={`h-3.5 w-3.5 ${mainTab === 'STORES' ? 'text-orange-500' : 'text-slate-400'}`}
          />
          <span>Toko Cabang ({stats.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('SERVICES')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            mainTab === 'SERVICES'
              ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-800 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Wrench
            className={`h-3.5 w-3.5 ${mainTab === 'SERVICES' ? 'text-blue-500' : 'text-slate-400'}`}
          />
          <span>Mitra Servis ({serviceStats.total})</span>
        </button>
      </div>
    </div>
  )
}
