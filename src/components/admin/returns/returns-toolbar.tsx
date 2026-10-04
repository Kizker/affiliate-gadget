'use client'

import React from 'react'
import { Search, X, RefreshCw } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { ReturnMetrics } from './types'

interface ReturnsToolbarProps {
  activeTab:
    | 'ALL'
    | 'PENDING'
    | 'IN_REVIEW'
    | 'APPROVED'
    | 'COMPLETED'
    | 'REJECTED'
  setActiveTab: (
    tab: 'ALL' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  ) => void
  metrics: ReturnMetrics
  typeFilter: 'ALL' | 'REFUND' | 'REPLACEMENT'
  setTypeFilter: (type: 'ALL' | 'REFUND' | 'REPLACEMENT') => void
  selectedStore: string
  setSelectedStore: (store: string) => void
  storeOptions: Array<{ id: string; name: string }>
  isSuperAdmin: boolean
  isAdminPlatform: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  loading: boolean
  onRefresh: () => void
}

export function ReturnsToolbar({
  activeTab,
  setActiveTab,
  metrics,
  typeFilter,
  setTypeFilter,
  selectedStore,
  setSelectedStore,
  storeOptions,
  isSuperAdmin,
  isAdminPlatform,
  searchQuery,
  setSearchQuery,
  loading,
  onRefresh,
}: ReturnsToolbarProps) {
  return (
    <div className="shadow-2xs flex flex-col items-stretch justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:p-3 xl:flex-row xl:items-center">
      {/* Left: Status Filter Pills */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
        {[
          { id: 'ALL', label: 'Semua Status', count: metrics.total },
          {
            id: 'PENDING',
            label: 'Perlu Verifikasi',
            count: metrics.pending,
          },
          {
            id: 'IN_REVIEW',
            label: 'Sedang Diperiksa',
            count: metrics.inReview,
          },
          { id: 'APPROVED', label: 'Disetujui', count: metrics.approved },
          { id: 'COMPLETED', label: 'Selesai', count: metrics.completed },
          { id: 'REJECTED', label: 'Ditolak', count: metrics.rejected },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`cursor-pointer whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
              activeTab === tab.id
                ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`py-0.2 ml-1.5 rounded-full px-1.5 font-mono text-[10px] ${
                  activeTab === tab.id
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Right: Solution Filter, Store Selector, Search, & Refresh */}
      <div className="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap xl:w-auto">
        {/* Solution Selector Dropdown */}
        <CustomSelect
          value={typeFilter}
          onChange={(val) => setTypeFilter(val as any)}
          size="sm"
          options={[
            { value: 'ALL', label: 'Semua Solusi' },
            { value: 'REFUND', label: 'Refund Dana' },
            { value: 'REPLACEMENT', label: 'Tukar Unit' },
          ]}
        />

        {/* Store Filter (for Superadmin & Admin Platform) */}
        {(isSuperAdmin || isAdminPlatform) && storeOptions.length > 0 && (
          <CustomSelect
            value={selectedStore}
            onChange={(val) => setSelectedStore(val)}
            size="sm"
            options={[
              { value: 'ALL', label: 'Semua Toko' },
              ...storeOptions.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        )}

        {/* Search Bar */}
        <div className="relative flex-1 xl:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor pesanan, nama pembeli..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          title="Refresh Data"
          disabled={loading}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>
    </div>
  )
}
