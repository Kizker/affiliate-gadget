'use client'

import React from 'react'
import { Wallet, Download } from 'lucide-react'
import { PeriodSelect } from '@/components/dashboard/period-select'
import { FinanceStats, ReportData, formatRupiah } from './types'

interface FinanceMobileViewProps {
  stats: FinanceStats
  reportData: ReportData
  dateRange: string
  setDateRange: (range: string) => void
  onOpenWithdrawModal: () => void
  onExportFinancialExcel: () => void
  isExportingExcel: boolean
}

export function FinanceMobileView({
  stats,
  reportData,
  dateRange,
  setDateRange,
  onOpenWithdrawModal,
  onExportFinancialExcel,
  isExportingExcel,
}: FinanceMobileViewProps) {
  const grossRev =
    reportData.financials?.grossRevenue ?? stats.grossRevenue ?? 0
  const commAmount =
    reportData.financials?.operationalExpenses?.platformCommission ??
    stats.platformCommission ??
    0
  const effectiveCommissionRate =
    grossRev > 0 && commAmount > 0
      ? ((commAmount / grossRev) * 100).toFixed(1)
      : '1.5'

  const rawTrends =
    (reportData?.salesTrend?.length ?? 0) > 0
      ? (reportData?.salesTrend ?? [])
      : [
          { label: '25 Okt', grossRevenue: 4000000, netProfit: 1500000 },
          { label: '26 Okt', grossRevenue: 6000000, netProfit: 2500000 },
          { label: '27 Okt', grossRevenue: 5000000, netProfit: 2000000 },
          { label: '28 Okt', grossRevenue: 8000000, netProfit: 3500000 },
          { label: '29 Okt', grossRevenue: 9000000, netProfit: 4000000 },
        ]

  const maxVal = Math.max(
    ...rawTrends.map((t) => Math.max(t.grossRevenue, t.netProfit, 1))
  )

  const recentOrders = (reportData?.recentActivity || []).slice(0, 3)

  return (
    <div className="space-y-4 md:hidden">
      {/* 1. Header Title */}
      <div>
        <h1 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">
          Keuangan & Finansial
        </h1>
      </div>

      {/* 2. Action Buttons (Tarik Saldo & Export Data) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onOpenWithdrawModal}
          className="shadow-xs flex items-center justify-center gap-1.5 rounded-2xl bg-orange-500 py-3 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95"
        >
          <Wallet className="h-4 w-4" />
          <span>Tarik Saldo</span>
        </button>

        <button
          type="button"
          onClick={onExportFinancialExcel}
          disabled={isExportingExcel}
          className="shadow-2xs flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <Download className="h-4 w-4 text-slate-400" />
          <span>Export Data</span>
        </button>
      </div>

      {/* 3. Periode Dropdown */}
      <div className="w-full">
        <PeriodSelect value={dateRange} onChange={setDateRange} />
      </div>

      {/* 4. Card Saldo Siap Cair (Hero Mobile Card) */}
      <div className="shadow-2xs rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            SALDO SIAP CAIR
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1">
          <span className="text-base font-semibold text-slate-400">Rp</span>
          <p className="font-mono text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {stats.availableBalance.toLocaleString('id-ID')}
          </p>
        </div>
        <p className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 dark:border-slate-800">
          {reportData.orders?.total ?? stats.totalCompletedOrders ?? 0}{' '}
          transaksi
        </p>
      </div>

      {/* 5. Grid 2x2 Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Pendapatan Kotor */}
        <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            PENDAPATAN KOTOR
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xs font-semibold text-slate-400">Rp</span>
            <p className="truncate font-mono text-base font-bold text-slate-950 dark:text-white">
              {(
                reportData.financials?.grossRevenue ?? stats.grossRevenue
              ).toLocaleString('id-ID')}
            </p>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Gross Sales ·{' '}
            {stats.totalUnitsSold ||
              (reportData.financials?.totalCompletedUnits ?? 0)}{' '}
            Unit
          </p>
        </div>

        {/* Total HPP */}
        <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            TOTAL HPP (MODAL)
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xs font-semibold text-slate-400">Rp</span>
            <p className="font-mono text-base font-bold text-slate-950 dark:text-white">
              {(reportData.financials?.cogs ?? 0).toLocaleString('id-ID')}
            </p>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Harga Pokok Gadget</p>
        </div>

        {/* Laba Bersih Toko */}
        <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            LABA BERSIH TOKO
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xs font-semibold text-slate-400">Rp</span>
            <p className="truncate font-mono text-base font-bold text-slate-950 dark:text-white">
              {(
                reportData.financials?.storeNetProfit ??
                reportData.financials?.netProfit ??
                stats.completedNetRevenue
              ).toLocaleString('id-ID')}
            </p>
          </div>
          <p className="mt-1 text-[10px] font-semibold text-emerald-600">
            Net {reportData.financials?.netMarginPct ?? 0}% · Realisasi Kas
          </p>
        </div>

        {/* Dana Tertahan */}
        <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            DANA TERTAHAN
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xs font-semibold text-slate-400">Rp</span>
            <p className="truncate font-mono text-base font-bold text-slate-950 dark:text-white">
              {stats.escrowBalance.toLocaleString('id-ID')}
            </p>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            {stats.courierBreakdown?.totalEscrowOrders ?? 0} Pesanan · Escrow
            Kurir
          </p>
        </div>
      </div>

      {/* 6. Card Rincian Beban & Logistik */}
      <div className="shadow-2xs rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            RINCIAN BEBAN & LOGISTIK
          </h3>
          <span className="font-mono text-xs font-bold text-rose-600">
            -{' '}
            {formatRupiah(
              reportData.financials?.operationalExpenses?.total ?? 0
            )}
          </span>
        </div>

        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Diskon Voucher Toko</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {formatRupiah(
                reportData.financials?.operationalExpenses?.voucherDiscount ?? 0
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Biaya Packing & Operasional</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {formatRupiah(
                reportData.financials?.operationalExpenses?.packingCost ?? 0
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Biaya Gateway Pembayaran</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {formatRupiah(
                reportData.financials?.operationalExpenses?.gatewayFee ?? 0
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              Komisi Platform ({effectiveCommissionRate}%)
            </span>
            <span className="font-mono font-semibold text-emerald-600">
              {commAmount === 0 ? 'Rp 0 (Gratis)' : formatRupiah(commAmount)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
            <span>Logistik Kurir & Asuransi</span>
            <span className="font-semibold text-blue-600">
              100% Ditanggung Pembeli
            </span>
          </div>
        </div>
      </div>

      {/* 7. Card Analitik Tren & Laba (Chart + 3 Sub-Cards) */}
      <div className="shadow-2xs rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            ANALITIK TREN & LABA
          </h3>
          <div className="flex items-center gap-3 text-[10px] font-semibold">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span>Omzet Kotor</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span>Laba Bersih</span>
            </div>
          </div>
        </div>

        {/* Mini Bars */}
        <div className="pb-2 pt-4">
          <div className="flex h-[130px] items-end justify-between gap-2 border-b border-slate-100 px-2 pb-2">
            {rawTrends.slice(0, 5).map((point, idx) => {
              const grossH = Math.max(
                16,
                Math.round((point.grossRevenue / maxVal) * 90)
              )
              const netH = Math.max(
                10,
                Math.round((point.netProfit / maxVal) * 90)
              )
              return (
                <div key={idx} className="flex flex-1 flex-col items-center">
                  <div className="flex h-[95px] items-end gap-1">
                    <div
                      style={{ height: `${grossH}px` }}
                      className="w-2.5 rounded-t-sm bg-blue-600"
                    />
                    <div
                      style={{ height: `${netH}px` }}
                      className="w-2.5 rounded-t-sm bg-purple-500"
                    />
                  </div>
                  <span className="mt-2 text-[9px] font-medium text-slate-400">
                    {point.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 3 Metric Rows */}
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Rata-rata Penjualan Periode</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {formatRupiah(
                Math.round(
                  (reportData.financials?.grossRevenue ?? 0) /
                    Math.max(1, rawTrends.length)
                )
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Rasio Efisiensi Margin Laba</span>
            <span className="font-mono font-bold text-emerald-600">
              {reportData.financials?.netMarginPct ?? 0}% Margin Bersih
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Total Volume Transaksi</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {reportData.orders?.total ?? 0} Selesai & Diproses
            </span>
          </div>
        </div>
      </div>

      {/* 8. Card Aktivitas Transaksi Mobile */}
      <div className="shadow-2xs rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            AKTIVITAS TRANSAKSI
          </h3>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
            Real-time
          </span>
        </div>

        <div className="divide-y divide-slate-100 pt-1 dark:divide-slate-800">
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Belum ada transaksi
            </p>
          ) : (
            recentOrders.map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {ord.user?.name || 'Customer'}
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    {ord.orderNumber} ·{' '}
                    {new Date(ord.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {formatRupiah(ord.total)}
                  </p>
                  <span className="text-[10px] font-bold uppercase text-emerald-600">
                    SELESAI
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="text-[10px] text-slate-400">Hal 1 dari 10</span>
          <div className="flex items-center gap-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
              1
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md text-xs text-slate-600">
              2
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md text-xs text-slate-600">
              3
            </span>
          </div>
        </div>
      </div>

      {/* 9. Card Produk Terlaris Mobile */}
      <div className="shadow-2xs rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            🏆 PRODUK TERLARIS
          </h3>
        </div>

        <div className="divide-y divide-slate-100 pt-1 dark:divide-slate-800">
          {!reportData?.products?.topSelling ||
          reportData.products.topSelling.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Belum ada data
            </p>
          ) : (
            reportData.products.topSelling.slice(0, 3).map((prod, idx) => (
              <div
                key={prod.id}
                className="flex items-center justify-between gap-2 py-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[11px] font-bold text-amber-600">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {prod.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {prod.totalSold} terjual · Sisa:{' '}
                      <span className="font-bold text-rose-500">
                        {prod.stock} unit
                      </span>
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {formatRupiah(prod.revenue)}
                  </p>
                  <p className="text-[9px] font-semibold text-blue-600">
                    {Math.min(
                      100,
                      Math.round(
                        ((prod.revenue || 0) /
                          Math.max(
                            1,
                            reportData.financials?.grossRevenue || 1
                          )) *
                          100
                      )
                    )}
                    % Omzet
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
