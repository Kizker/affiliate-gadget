'use client'

import React from 'react'
import Link from 'next/link'
import { Search, X, Plus, MapPin } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { Stats, ServiceStats } from './types'

interface MitraToolbarProps {
  mainTab: 'STORES' | 'SERVICES'
  // Store Filters
  approvalFilter: 'ALL' | 'APPROVED' | 'PENDING'
  setApprovalFilter: (val: 'ALL' | 'APPROVED' | 'PENDING') => void
  stats: Stats
  cities: string[]
  cityFilter: string
  setCityFilter: (val: string) => void
  searchQuery: string
  setSearchQuery: (val: string) => void
  // Service Mitra Filters
  serviceStatusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE'
  setServiceStatusFilter: (val: 'ALL' | 'ACTIVE' | 'INACTIVE') => void
  serviceStats: ServiceStats
  serviceSearchQuery: string
  setServiceSearchQuery: (val: string) => void
  onOpenCreateMitraModal: () => void
}

export function MitraToolbar({
  mainTab,
  approvalFilter,
  setApprovalFilter,
  stats,
  cities,
  cityFilter,
  setCityFilter,
  searchQuery,
  setSearchQuery,
  serviceStatusFilter,
  setServiceStatusFilter,
  serviceStats,
  serviceSearchQuery,
  setServiceSearchQuery,
  onOpenCreateMitraModal,
}: MitraToolbarProps) {
  if (mainTab === 'STORES') {
    return (
      <div className="shadow-2xs flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:p-3 md:flex-row md:items-center">
        {/* Status Filter Tabs */}
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
          <button
            onClick={() => setApprovalFilter('ALL')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              approvalFilter === 'ALL'
                ? 'shadow-2xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Semua Toko ({stats.total})
          </button>
          <button
            onClick={() => setApprovalFilter('APPROVED')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              approvalFilter === 'APPROVED'
                ? 'shadow-2xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Terverifikasi ({stats.approved})
          </button>
          <button
            onClick={() => setApprovalFilter('PENDING')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              approvalFilter === 'PENDING'
                ? 'shadow-2xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Menunggu Review ({stats.pending})
          </button>
        </div>

        {/* Search, City Filter & Add Store Button */}
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-nowrap md:flex-initial">
          {cities.length > 0 && (
            <CustomSelect
              value={cityFilter}
              onChange={(val) => setCityFilter(val)}
              size="sm"
              icon={<MapPin className="h-3.5 w-3.5" />}
              options={[
                { value: '', label: 'Semua Kota' },
                ...cities.map((city) => ({ value: city, label: city })),
              ]}
            />
          )}

          {/* Search Box with Action Orange focus */}
          <div className="relative w-full sm:w-56 md:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama toko, PT, kota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dark:focus:bg-slate-850 w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2 pl-8 pr-7 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-orange-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Primary Action Button (+ Tambah Toko with Action Orange) */}
          <Link
            href="/dashboard/admin/mitras/create"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Tambah Toko</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="shadow-2xs flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:p-3 md:flex-row md:items-center">
      {/* Status Filter for Service Mitras */}
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
        <button
          onClick={() => setServiceStatusFilter('ALL')}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            serviceStatusFilter === 'ALL'
              ? 'shadow-2xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Semua Mitra ({serviceStats.total})
        </button>
        <button
          onClick={() => setServiceStatusFilter('ACTIVE')}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            serviceStatusFilter === 'ACTIVE'
              ? 'shadow-2xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Aktif ({serviceStats.active})
        </button>
        <button
          onClick={() => setServiceStatusFilter('INACTIVE')}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            serviceStatusFilter === 'INACTIVE'
              ? 'shadow-2xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Nonaktif ({serviceStats.inactive})
        </button>
      </div>

      {/* Search Box & + Tambah Mitra Button */}
      <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-nowrap md:flex-initial">
        <div className="relative w-full sm:w-64 md:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama mitra, email, kota..."
            value={serviceSearchQuery}
            onChange={(e) => setServiceSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2 pl-8 pr-7 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {serviceSearchQuery && (
            <button
              onClick={() => setServiceSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* BUTTON TAMBAH MITRA (Creates Role MITRA) */}
        <button
          type="button"
          onClick={onOpenCreateMitraModal}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Tambah Mitra</span>
        </button>
      </div>
    </div>
  )
}
