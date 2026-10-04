'use client'

import React from 'react'
import { Wallet, TrendingUp, Package, Sparkles, Clock } from 'lucide-react'
import { FinanceStats, ReportData } from './types'

interface FinanceKpiCardsProps {
  stats: FinanceStats
  reportData: ReportData
  isConsolidated: boolean
  onOpenWithdrawModal: () => void
}

export function FinanceKpiCards({
  stats,
  reportData,
  isConsolidated,
  onOpenWithdrawModal,
}: FinanceKpiCardsProps) {
  const courierBreakdown = stats?.courierBreakdown ?? {
    shippedCount: 0,
    inProgressCount: 0,
    paidCount: 0,
    complainedCount: 0,
    totalEscrowOrders: 0,
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Card 1: Saldo Siap Ditarik */}
      <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Saldo Siap Cair
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-100/60 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Wallet className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-semibold text-slate-400">Rp</span>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {stats.availableBalance.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              ● Siap Transfer
            </span>
            <button
              type="button"
              onClick={onOpenWithdrawModal}
              className="font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              Tarik ↗
            </button>
          </div>
          {!isConsolidated && (stats.totalCompletedOrders ?? 0) > 0 ? (
            <div className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <span>
                Bersih potongan komisi 2% & gateway (
                {stats.totalCompletedOrders} trx × Rp 4.000)
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Card 2: Pendapatan Kotor / GMV */}
      <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {isConsolidated ? 'Total Omzet (GMV)' : 'Pendapatan Kotor'}
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-100/60 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-semibold text-slate-400">Rp</span>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {(
                reportData.financials?.grossRevenue ?? stats.grossRevenue
              ).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              Gross Sales
            </span>
            <span className="text-slate-400">
              ·{' '}
              {stats.totalUnitsSold ||
                (reportData.financials?.totalCompletedUnits ?? 0)}{' '}
              Unit
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Total HPP (Modal) */}
      <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total HPP (Modal)
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-100/60 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400">
            <Package className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-semibold text-slate-400">Rp</span>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {(reportData.financials?.cogs ?? 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Harga Pokok
            </span>
            <span className="text-slate-400">· Modal Gadget</span>
          </div>
        </div>
      </div>

      {/* Card 4: Laba Bersih Toko */}
      <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {isConsolidated ? 'Laba Komisi Platform' : 'Laba Bersih Toko'}
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-100/60 bg-purple-50 text-purple-600 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-400">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-semibold text-slate-400">Rp</span>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {(isConsolidated
                ? stats.platformCommission
                : (reportData.financials?.storeNetProfit ??
                  reportData.financials?.netProfit ??
                  stats.completedNetRevenue)
              ).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {isConsolidated
                ? 'Bagi Hasil 2%'
                : `Net ${reportData.financials?.netMarginPct ?? 0}%`}
            </span>
            <span className="text-slate-400">· Realisasi Kas</span>
          </div>
        </div>
      </div>

      {/* Card 5: Dana Tertahan (Escrow) */}
      <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Dana Tertahan (Escrow)
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-orange-100/60 bg-orange-50 text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400">
            <Clock className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-semibold text-slate-400">Rp</span>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {stats.escrowBalance.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-orange-600 dark:text-orange-400">
              {courierBreakdown.totalEscrowOrders} Pesanan
            </span>
            <span className="text-slate-400">· Kurir Biteship</span>
          </div>
        </div>
      </div>
    </div>
  )
}
