'use client'

import React from 'react'
import { Sparkles, Plus, Loader2 } from 'lucide-react'
import { InternalAdItem, CurrentStoreInfo, Level1SlotInfo } from './types'
import { AdCard } from './ad-card'

interface AdListProps {
  loading: boolean
  currentTabAds: InternalAdItem[]
  levelFilter: 'LEVEL_1' | 'LEVEL_2'
  isSuperAdmin: boolean
  currentStore: CurrentStoreInfo | null
  level1Slot: Level1SlotInfo
  waitingLevel1Ads: InternalAdItem[]
  actionLoading: string | null
  onOpenCreateModal: () => void
  onOpenChangeImage: (ad: InternalAdItem) => void
  onApprove: (ad: InternalAdItem) => void
  onReject: (ad: InternalAdItem) => void
  onCancel: (ad: InternalAdItem) => void
  onToggleActive: (ad: InternalAdItem) => void
  onDelete: (ad: InternalAdItem) => void
}

export function AdList({
  loading,
  currentTabAds,
  levelFilter,
  isSuperAdmin,
  currentStore,
  level1Slot,
  waitingLevel1Ads,
  actionLoading,
  onOpenCreateModal,
  onOpenChangeImage,
  onApprove,
  onReject,
  onCancel,
  onToggleActive,
  onDelete,
}: AdListProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-xs">Memuat daftar iklan...</span>
        </div>
      </div>
    )
  }

  if (currentTabAds.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-950/40">
        <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-700" />
        <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
          Belum Ada Iklan di{' '}
          {levelFilter === 'LEVEL_1'
            ? 'Level 1 (Carousel)'
            : 'Level 2 (In-Feed Grid)'}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          {isSuperAdmin
            ? `Belum ada iklan ${levelFilter === 'LEVEL_1' ? 'Hero Carousel' : 'In-Feed Grid'} pada filter status ini.`
            : `Ajukan banner promosi ${levelFilter === 'LEVEL_1' ? 'Hero Carousel' : 'In-Feed Grid'} sekarang untuk cabang toko Anda.`}
        </p>
        <button
          onClick={onOpenCreateModal}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>
            Ajukan Iklan {levelFilter === 'LEVEL_1' ? 'Level 1' : 'Level 2'}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {currentTabAds.map((ad) => (
        <AdCard
          key={ad.id}
          ad={ad}
          isSuperAdmin={isSuperAdmin}
          currentStore={currentStore}
          levelFilter={levelFilter}
          level1Slot={level1Slot}
          waitingLevel1Ads={waitingLevel1Ads}
          actionLoading={actionLoading}
          onOpenChangeImage={onOpenChangeImage}
          onApprove={onApprove}
          onReject={onReject}
          onCancel={onCancel}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
