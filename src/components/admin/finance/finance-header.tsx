'use client'

import React from 'react'
import { Wallet, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PeriodSelect } from '@/components/dashboard/period-select'
import { StoreSelect } from '@/components/dashboard/store-select'
import { MainFinanceView, StoreInfo, StoreOption } from './types'

interface FinanceHeaderProps {
  store: StoreInfo | null
  mainView: MainFinanceView
  setMainView: (view: MainFinanceView) => void
  onOpenWithdrawModal: () => void
  onExportFinancialExcel: () => void
  onExportOrdersExcel?: () => void
  isExportingExcel: boolean
  isExportingOrders?: boolean
  allStores: StoreOption[]
  selectedStoreId: string
  setSelectedStoreId: (id: string) => void
  dateRange: string
  setDateRange: (range: string) => void
  lastUpdated?: string
  isRefreshing?: boolean
  onRefresh?: () => void
  transactionsCount: number
  totalEscrowOrders?: number
}

export function FinanceHeader({
  store,
  mainView,
  setMainView,
  onOpenWithdrawModal,
  onExportFinancialExcel,
  isExportingExcel,
  allStores,
  selectedStoreId,
  setSelectedStoreId,
  dateRange,
  setDateRange,
  transactionsCount,
}: FinanceHeaderProps) {
  return (
    <>
      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            Keuangan & Laporan Finansial
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {store?.name || store?.companyName || 'Affiliate Gadget'} •
            Ringkasan performa finansial dan arus kas toko
          </p>
        </div>

        {/* Quick Top Actions: Withdraw, Export Laporan */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tarik Saldo Quick Trigger Button */}
          <button
            type="button"
            onClick={() => {
              if (store?.cooldownStatus?.isLocked) {
                toast.error(
                  `Penarikan saldo dikunci cooling-down (${store.cooldownStatus.remainingHours} jam lagi)`
                )
                return
              }
              onOpenWithdrawModal()
            }}
            disabled={store?.cooldownStatus?.isLocked}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            title="Tarik Saldo ke Rekening Mandiri PT"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Tarik Saldo</span>
          </button>

          {/* Export Laporan Keuangan */}
          <button
            type="button"
            onClick={onExportFinancialExcel}
            disabled={isExportingExcel}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            title="Download Laporan Keuangan"
          >
            {isExportingExcel ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Export Laporan</span>
          </button>
        </div>
      </div>

      {/* Control Filter Bar (Segmented Tabs & Period Select) */}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {/* Segmented View Mode Tabs */}
        <div className="shadow-2xs flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setMainView('REPORTS')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
              mainView === 'REPORTS'
                ? 'shadow-2xs bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>Laporan Laba Rugi & Analitik</span>
          </button>

          <button
            type="button"
            onClick={() => setMainView('MUTATIONS')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
              mainView === 'MUTATIONS'
                ? 'shadow-2xs bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>Buku Kas & Mutasi Transaksi</span>
            {transactionsCount > 0 && (
              <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {transactionsCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Controls (Store, Period) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Superadmin Store Selector */}
          {allStores && allStores.length > 0 && (
            <StoreSelect
              value={selectedStoreId || 'ALL'}
              onChange={(val) => setSelectedStoreId(val === 'ALL' ? '' : val)}
              stores={allStores}
            />
          )}

          {/* Period Filter */}
          <PeriodSelect
            value={dateRange}
            onChange={(val) => setDateRange(val)}
          />
        </div>
      </div>
    </>
  )
}
