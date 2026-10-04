'use client'

import React from 'react'
import {
  Wallet,
  Download,
  Loader2,
  BarChart3,
  FileText,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
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
  onExportOrdersExcel: () => void
  isExportingExcel: boolean
  isExportingOrders: boolean
  allStores: StoreOption[]
  selectedStoreId: string
  setSelectedStoreId: (id: string) => void
  dateRange: string
  setDateRange: (range: string) => void
  lastUpdated: string
  isRefreshing: boolean
  onRefresh: () => void
  transactionsCount: number
  totalEscrowOrders: number
}

export function FinanceHeader({
  store,
  mainView,
  setMainView,
  onOpenWithdrawModal,
  onExportFinancialExcel,
  onExportOrdersExcel,
  isExportingExcel,
  isExportingOrders,
  allStores,
  selectedStoreId,
  setSelectedStoreId,
  dateRange,
  setDateRange,
  lastUpdated,
  isRefreshing,
  onRefresh,
  transactionsCount,
  totalEscrowOrders,
}: FinanceHeaderProps) {
  return (
    <>
      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              Keuangan & Laporan Finansial
            </h1>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-extrabold text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              {store?.name || store?.companyName || 'Multi-PT Holding'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pusat terpadu kelola saldo siap cair, mutasi kas per cabang PT,
            penarikan dana (withdraw), serta laporan laba rugi & analitik.
          </p>
        </div>

        {/* Quick Top Actions: Withdraw, Export Laporan, Export Pesanan */}
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
            className="shadow-xs inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            title="Tarik Saldo ke Rekening Mandiri PT"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Tarik Saldo (Withdraw)</span>
          </button>

          {/* Export Laporan Keuangan (Excel) */}
          <button
            type="button"
            onClick={onExportFinancialExcel}
            disabled={isExportingExcel}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
            title="Download Laporan Keuangan (Excel)"
          >
            {isExportingExcel ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Export Laporan</span>
          </button>

          {/* Export Pesanan (Excel) */}
          <button
            type="button"
            onClick={onExportOrdersExcel}
            disabled={isExportingOrders}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Download Rekap Pesanan (Excel)"
          >
            {isExportingOrders ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Export Pesanan</span>
          </button>
        </div>
      </div>

      {/* Control Filter Bar (Store Select, Period Select, Live Status) */}
      <div className="shadow-2xs flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:p-3 md:flex-row md:items-center">
        {/* Segmented View Mode Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setMainView('REPORTS')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
              mainView === 'REPORTS'
                ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Laporan Laba Rugi & Analitik</span>
          </button>

          <button
            type="button"
            onClick={() => setMainView('MUTATIONS')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
              mainView === 'MUTATIONS'
                ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            <span>Buku Kas & Mutasi Transaksi</span>
            {transactionsCount > 0 && (
              <span className="py-0.2 ml-1 rounded-full bg-slate-200 px-1.5 text-[10px] font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {transactionsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainView('ESCROW')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
              mainView === 'ESCROW'
                ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Proteksi Saldo Escrow & Kurir</span>
            {totalEscrowOrders > 0 && (
              <span className="py-0.2 ml-1 rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white">
                {totalEscrowOrders}
              </span>
            )}
          </button>
        </div>

        {/* Filter Controls (Store, Period, Refresh) */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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

          {/* Live Indicator & Manual Refresh */}
          <div className="shadow-2xs flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            {lastUpdated && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live: {lastUpdated}
              </span>
            )}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 active:scale-90 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              title="Segarkan Data Real-Time"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
