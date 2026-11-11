'use client'

import React from 'react'
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
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            SALDO SIAP CAIR
          </span>
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-slate-400">Rp</span>
            <p className="truncate text-xl font-black tabular-nums tracking-tight text-slate-950 dark:text-white">
              {stats.availableBalance.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
            <span className="text-[11px] text-slate-400">
              {reportData.orders?.total ?? stats.totalCompletedOrders ?? 0}{' '}
              transaksi
            </span>
            <button
              type="button"
              onClick={onOpenWithdrawModal}
              className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              Tarik &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Pendapatan Kotor / GMV */}
      <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isConsolidated ? 'TOTAL OMZET (GMV)' : 'PENDAPATAN KOTOR'}
          </span>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-slate-400">Rp</span>
            <p className="truncate text-xl font-black tabular-nums tracking-tight text-slate-950 dark:text-white">
              {(
                reportData.financials?.grossRevenue ?? stats.grossRevenue
              ).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 dark:border-slate-800">
            {stats.totalUnitsSold ||
              (reportData.financials?.totalCompletedUnits ?? 0)}{' '}
            unit terjual
          </div>
        </div>
      </div>

      {/* Card 3: Total HPP (Modal) */}
      <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            TOTAL HPP (MODAL)
          </span>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-slate-400">Rp</span>
            <p className="truncate text-xl font-black tabular-nums tracking-tight text-slate-950 dark:text-white">
              {(reportData.financials?.cogs ?? 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 dark:border-slate-800">
            Bebas Modal
          </div>
        </div>
      </div>

      {/* Card 4: Laba Bersih Toko */}
      <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isConsolidated ? 'LABA KOMISI PLATFORM' : 'LABA BERSIH TOKO'}
          </span>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-slate-400">Rp</span>
            <p className="truncate text-xl font-black tabular-nums tracking-tight text-slate-950 dark:text-white">
              {(isConsolidated
                ? stats.platformCommission
                : (reportData.financials?.storeNetProfit ??
                  reportData.financials?.netProfit ??
                  stats.completedNetRevenue)
              ).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] font-semibold text-emerald-600 dark:border-slate-800">
            Margin {reportData.financials?.netMarginPct ?? 0}%
          </div>
        </div>
      </div>

      {/* Card 5: Dana Tertahan (Escrow) */}
      {/* Card 5: Dana Escrow (Tertahan) */}
      <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            DANA ESCROW (TERT...
          </span>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-slate-400">Rp</span>
            <p className="truncate text-xl font-black tabular-nums tracking-tight text-slate-950 dark:text-white">
              {stats.escrowBalance.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 dark:border-slate-800">
            {courierBreakdown.totalEscrowOrders} pesanan dalam proses
          </div>
        </div>
      </div>
    </div>
  )
}
