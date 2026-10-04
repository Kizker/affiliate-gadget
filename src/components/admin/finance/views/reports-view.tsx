'use client'

import React from 'react'
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { FinanceStats, ReportData, formatRupiah } from '../types'

interface ReportsViewProps {
  reportData: ReportData
  stats: FinanceStats
  isConsolidated: boolean
  orderCurrentPage: number
  setOrderCurrentPage: (page: number) => void
  orderItemsPerPage?: number
}

export function ReportsView({
  reportData,
  stats,
  isConsolidated,
  orderCurrentPage,
  setOrderCurrentPage,
  orderItemsPerPage = 10,
}: ReportsViewProps) {
  // Pagination for recent activity orders in reports view
  const recentOrders = reportData?.recentActivity || []
  const totalOrderPages = Math.max(
    1,
    Math.ceil(recentOrders.length / orderItemsPerPage)
  )
  const safeOrderPage = Math.min(Math.max(1, orderCurrentPage), totalOrderPages)
  const orderStartIndex = (safeOrderPage - 1) * orderItemsPerPage
  const orderEndIndex = Math.min(
    orderStartIndex + orderItemsPerPage,
    recentOrders.length
  )
  const paginatedOrders = recentOrders.slice(orderStartIndex, orderEndIndex)

  const handleOrderPageChange = (page: number) => {
    setOrderCurrentPage(Math.max(1, Math.min(page, totalOrderPages)))
  }

  const getOrderPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalOrderPages <= 5) {
      for (let i = 1; i <= totalOrderPages; i++) pages.push(i)
    } else {
      if (safeOrderPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalOrderPages)
      } else if (safeOrderPage >= totalOrderPages - 2) {
        pages.push(
          1,
          '...',
          totalOrderPages - 3,
          totalOrderPages - 2,
          totalOrderPages - 1,
          totalOrderPages
        )
      } else {
        pages.push(
          1,
          '...',
          safeOrderPage - 1,
          safeOrderPage,
          safeOrderPage + 1,
          '...',
          totalOrderPages
        )
      }
    }
    return pages
  }

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

  return (
    <div className="space-y-5 duration-200 animate-in fade-in">
      {/* Panel Rincian Beban Transaksi & Logistik Terproteksi */}
      <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Rincian Beban Transaksi & Logistik Terproteksi
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {isConsolidated
                ? 'Transparansi pemotongan komisi platform, beban operasional toko fisik, dan asuransi pengiriman'
                : 'Biaya operasional penjualan handphone dan status asuransi pengiriman'}
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Total Beban Toko:{' '}
            <strong className="font-mono text-slate-900 dark:text-white">
              {formatRupiah(
                reportData.financials?.operationalExpenses?.total ?? 0
              )}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
          {/* Kolom Kiri: Beban Mengurangi Laba Toko */}
          <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-800/30">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
              <span>Beban Toko (Mengurangi Laba)</span>
              <span className="font-mono text-rose-600 dark:text-rose-400">
                -{' '}
                {formatRupiah(
                  reportData.financials?.operationalExpenses?.total ?? 0
                )}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Komisi Platform ({effectiveCommissionRate}%)
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(commAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Biaya Packing (Rp 5.000 / Pesanan)
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(
                    reportData.financials?.operationalExpenses?.packingCost ?? 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Diskon Voucher Toko</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(
                    reportData.financials?.operationalExpenses
                      ?.voucherDiscount ?? 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Biaya Payment Gateway (Midtrans VA/QRIS)
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(
                    reportData.financials?.operationalExpenses?.gatewayFee ?? 0
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Logistik Pass-Through (Tidak Mengurangi Laba Toko) */}
          <div className="space-y-3 rounded-xl border border-blue-100/60 bg-blue-50/30 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
              <span>Logistik Pass-Through (Kurir JNE / Gojek)</span>
              <span className="rounded-full bg-blue-100/80 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                100% Ditanggung Pembeli
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Ongkir Kurir (JNE / Gojek)
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(
                    reportData.financials?.operationalExpenses?.shipping ?? 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Asuransi Wajib Pengiriman (0.2%)
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(
                    reportData.financials?.operationalExpenses?.insurance ?? 0
                  )}
                </span>
              </div>
              <p className="pt-1 text-[11px] leading-relaxed text-blue-700/80 dark:text-blue-300/80">
                🛡️ Transparan: Biaya logistik dan asuransi penuh dipungut dari
                customer dan diteruskan ke ekspedisi Biteship. Tidak memotong
                omzet maupun laba bersih toko.
              </p>
            </div>
          </div>
        </div>

        {/* Operational Strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800/80 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="font-mono text-base font-bold text-slate-900 dark:text-white">
              {reportData.orders?.total ?? 0}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Total Transaksi
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="font-mono text-base font-bold text-slate-900 dark:text-white">
              {reportData.customers?.total ?? 0}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Pelanggan ({reportData.customers?.activeRate ?? '0.0'}% Repeat)
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="font-mono text-base font-bold text-orange-600 dark:text-orange-400">
              {reportData.products?.lowStockCount ?? 0}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Stok Menipis
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
              {reportData.revenue?.storeCount ??
                reportData.stores?.active ??
                reportData.mitras?.approved ??
                0}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Toko Jaringan Aktif
            </p>
          </div>
        </div>
      </div>

      {/* Analitik Tren Penjualan & Laba Finansial (Interactive Bar Chart) */}
      <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Analitik Tren Penjualan & Laba Finansial
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Visualisasi grafik performa finansial harian, mingguan, dan
              bulanan (Omzet Kotor vs Laba Bersih)
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              <span className="text-slate-600 dark:text-slate-300">
                Omzet Kotor
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-600 dark:bg-purple-400" />
              <span className="text-slate-600 dark:text-slate-300">
                Laba Bersih
              </span>
            </div>
          </div>
        </div>

        {/* Visual Chart Bars */}
        {(() => {
          const rawTrends =
            (reportData?.salesTrend?.length ?? 0) > 0
              ? (reportData?.salesTrend ?? [])
              : [
                  {
                    date: '1',
                    label: 'Minggu 1',
                    grossRevenue:
                      (reportData.financials?.grossRevenue || 1000000) * 0.2,
                    netProfit:
                      (reportData.financials?.netProfit || 200000) * 0.2,
                    ordersCount: 1,
                  },
                  {
                    date: '2',
                    label: 'Minggu 2',
                    grossRevenue:
                      (reportData.financials?.grossRevenue || 1000000) * 0.35,
                    netProfit:
                      (reportData.financials?.netProfit || 200000) * 0.35,
                    ordersCount: 2,
                  },
                  {
                    date: '3',
                    label: 'Minggu 3',
                    grossRevenue:
                      (reportData.financials?.grossRevenue || 1000000) * 0.25,
                    netProfit:
                      (reportData.financials?.netProfit || 200000) * 0.25,
                    ordersCount: 1,
                  },
                  {
                    date: '4',
                    label: 'Minggu 4',
                    grossRevenue:
                      (reportData.financials?.grossRevenue || 1000000) * 0.2,
                    netProfit:
                      (reportData.financials?.netProfit || 200000) * 0.2,
                    ordersCount: 1,
                  },
                ]

          const maxVal = Math.max(
            ...rawTrends.map((t) => Math.max(t.grossRevenue, t.netProfit, 1))
          )

          const chartMaxHeightPx = 150

          return (
            <div className="pt-6">
              {/* Chart Container with Y-Axis Guidelines */}
              <div className="relative border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[150px] flex-col justify-between">
                  <div className="border-b border-dashed border-slate-100 dark:border-slate-800/60" />
                  <div className="border-b border-dashed border-slate-100 dark:border-slate-800/60" />
                  <div className="border-b border-dashed border-slate-100 dark:border-slate-800/60" />
                </div>

                {/* Bars Row */}
                <div className="relative flex h-[190px] items-end gap-3 overflow-x-auto px-2 sm:gap-6">
                  {rawTrends.map((point, idx) => {
                    const grossHeightPx = Math.max(
                      12,
                      Math.round(
                        (point.grossRevenue / maxVal) * chartMaxHeightPx
                      )
                    )
                    const safeNetProfit = Math.max(0, point.netProfit)
                    const netHeightPx = Math.max(
                      8,
                      Math.round((safeNetProfit / maxVal) * chartMaxHeightPx)
                    )
                    const marginPct =
                      point.grossRevenue > 0
                        ? (
                            (point.netProfit / point.grossRevenue) *
                            100
                          ).toFixed(1)
                        : '0.0'

                    return (
                      <div
                        key={idx}
                        className="group relative flex h-full min-w-[56px] flex-1 flex-col items-center justify-end sm:min-w-[72px]"
                      >
                        {/* Hover Tooltip Popup */}
                        <div className="backdrop-blur-xs pointer-events-none absolute top-2 z-30 hidden -translate-x-1/2 flex-col items-center rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-[10px] text-white shadow-2xl group-hover:flex">
                          <span className="font-bold text-slate-300">
                            {point.label} ({point.ordersCount || 1} Order)
                          </span>
                          <span className="whitespace-nowrap font-mono font-bold text-blue-400">
                            Omzet: {formatRupiah(point.grossRevenue)}
                          </span>
                          <span className="whitespace-nowrap font-mono font-bold text-purple-400">
                            Laba: {formatRupiah(point.netProfit)} ({marginPct}
                            %)
                          </span>
                        </div>

                        {/* Bars Container */}
                        <div className="flex h-[150px] w-full items-end justify-center gap-1.5 sm:gap-2">
                          {/* Omzet Bar */}
                          <div
                            style={{ height: `${grossHeightPx}px` }}
                            className="shadow-xs w-3.5 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-300 group-hover:from-blue-500 group-hover:to-blue-300 sm:w-5"
                            title={`Omzet: ${formatRupiah(point.grossRevenue)}`}
                          />
                          {/* Laba Bersih Bar */}
                          <div
                            style={{ height: `${netHeightPx}px` }}
                            className="shadow-xs w-3.5 rounded-t-md bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-300 group-hover:from-purple-500 group-hover:to-purple-300 sm:w-5"
                            title={`Laba: ${formatRupiah(point.netProfit)}`}
                          />
                        </div>

                        {/* X-axis Date Label */}
                        <div className="mt-2 text-center">
                          <span className="block truncate text-[10px] font-semibold text-slate-500 transition-colors group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400 sm:text-[11px]">
                            {point.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Bottom Insight KPI Strip */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Rata-Rata Penjualan Periode
                  </span>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {formatRupiah(
                      Math.round(
                        (reportData.financials?.grossRevenue ??
                          reportData.revenue?.total ??
                          0) / Math.max(1, rawTrends.length)
                      )
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Rasio Efisiensi Margin Laba
                  </span>
                  <p className="mt-1 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {reportData.financials?.netMarginPct ?? 0}% Margin Bersih
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Volume Transaksi
                  </span>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {reportData.orders?.total ?? 0} Transaksi Selesai & Diproses
                  </p>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Aktivitas Transaksi Finansial Terbaru (Tabel Pesanan Terperinci) */}
      <div className="shadow-2xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Aktivitas Transaksi Finansial Terbaru
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Rincian kalkulasi omzet kotor, modal HPP, beban operasional, dan
              laba bersih per transaksi
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {recentOrders.length} Transaksi Terkini
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="py-2.5 pr-3">Pesanan</th>
                <th className="py-2.5 pr-3">Pelanggan</th>
                <th className="py-2.5 pr-3">Status</th>
                <th className="py-2.5 pr-3 text-right">Omzet Kotor</th>
                <th className="py-2.5 pr-3 text-right">HPP (Modal)</th>
                <th className="py-2.5 pr-3 text-right">Laba Kotor</th>
                <th className="py-2.5 pr-3 text-right">Beban Toko</th>
                <th className="py-2.5 text-right">Laba Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {!recentOrders || recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-6 text-center font-semibold text-slate-400"
                  >
                    Belum ada transaksi pada periode ini
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isCancelled =
                    order.status === 'CANCELLED' || order.status === 'RETURNED'
                  const fin = order.financials
                  const grossRevenue = isCancelled
                    ? 0
                    : (fin?.grossRevenue ?? order.total)
                  const cogs = isCancelled ? 0 : (fin?.cogs ?? 0)
                  const grossProfit = isCancelled
                    ? 0
                    : (fin?.grossProfit ?? grossRevenue - cogs)
                  const grossMargin =
                    !isCancelled && grossRevenue > 0
                      ? (fin?.grossMarginPct ??
                        Number(((grossProfit / grossRevenue) * 100).toFixed(1)))
                      : 0
                  const comm = isCancelled ? 0 : (fin?.platformCommission ?? 0)
                  const pack = isCancelled ? 0 : (fin?.packingCost ?? 5000)
                  const disc = isCancelled ? 0 : (fin?.voucherDiscount ?? 0)
                  const totalExpense = isCancelled ? 0 : comm + pack + disc
                  const netProfit = isCancelled
                    ? 0
                    : (fin?.netProfit ?? grossProfit - totalExpense)
                  const netMargin =
                    !isCancelled && grossRevenue > 0
                      ? (fin?.netMarginPct ??
                        Number(((netProfit / grossRevenue) * 100).toFixed(1)))
                      : 0

                  return (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-3 pr-3 font-mono font-bold text-slate-900 dark:text-white">
                        {order.orderNumber}
                        <div className="text-[10px] font-normal text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString(
                            'id-ID',
                            {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-slate-700 dark:text-slate-300">
                        <div className="max-w-[120px] truncate font-semibold">
                          {order.user?.name || 'Customer'}
                        </div>
                        <div className="max-w-[120px] truncate text-[10px] text-slate-400">
                          {order.user?.email}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            order.status === 'COMPLETED'
                              ? 'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : order.status === 'CANCELLED'
                                ? 'border border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                                : order.status === 'RETURNED'
                                  ? 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                                  : 'border border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td
                        className={`py-3 pr-3 text-right font-mono ${
                          isCancelled
                            ? 'font-normal text-slate-400 dark:text-slate-500'
                            : 'font-semibold text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatRupiah(grossRevenue)}
                      </td>
                      <td className="py-3 pr-3 text-right font-mono text-slate-400 dark:text-slate-500">
                        {formatRupiah(cogs)}
                      </td>
                      <td className="py-3 pr-3 text-right font-mono">
                        <span
                          className={
                            isCancelled
                              ? 'font-normal text-slate-400 dark:text-slate-500'
                              : 'font-bold text-slate-900 dark:text-white'
                          }
                        >
                          {formatRupiah(grossProfit)}
                        </span>
                        <div
                          className={`text-[10px] ${
                            isCancelled
                              ? 'font-normal text-slate-400 dark:text-slate-500'
                              : 'font-semibold text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {grossMargin}%
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-right font-mono text-slate-400 dark:text-slate-500">
                        <div>{formatRupiah(totalExpense)}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          P:{formatRupiah(pack)}
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono">
                        <span
                          className={`font-bold ${
                            isCancelled
                              ? 'font-normal text-slate-400 dark:text-slate-500'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {formatRupiah(netProfit)}
                        </span>
                        <div
                          className={`text-[10px] ${
                            isCancelled
                              ? 'font-normal text-slate-400 dark:text-slate-500'
                              : 'font-semibold text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {netMargin}%
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls for Orders */}
        {totalOrderPages > 1 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 sm:flex-row">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Menampilkan{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {orderStartIndex + 1}
              </span>{' '}
              -{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {orderEndIndex}
              </span>{' '}
              dari{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {recentOrders.length}
              </span>{' '}
              transaksi
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOrderPageChange(safeOrderPage - 1)}
                disabled={safeOrderPage === 1}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Sebelumnya</span>
              </button>

              {getOrderPageNumbers().map((p, idx) =>
                p === '...' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-xs font-bold text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${p}`}
                    type="button"
                    onClick={() => handleOrderPageChange(Number(p))}
                    className={`min-w-[32px] cursor-pointer rounded-xl px-2.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                      safeOrderPage === p
                        ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => handleOrderPageChange(safeOrderPage + 1)}
                disabled={safeOrderPage === totalOrderPages}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Produk Gadget Terlaris & Statistik Jaringan Toko */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Produk Terlaris */}
        <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Produk Gadget Terlaris
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Paling banyak terjual di seluruh cabang toko
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 pt-1 dark:divide-slate-800/60">
            {!reportData?.products?.topSelling ||
            (reportData?.products?.topSelling?.length ?? 0) === 0 ? (
              <div className="py-8 text-center text-xs font-semibold text-slate-400">
                Belum ada data penjualan pada periode ini
              </div>
            ) : (
              (reportData?.products?.topSelling ?? [])
                .slice(0, 4)
                .map((product, index) => {
                  const totalRev =
                    reportData.financials?.grossRevenue ??
                    reportData.revenue?.total ??
                    1
                  const sharePct = Math.min(
                    100,
                    Math.round(
                      ((product.revenue || 0) / Math.max(1, totalRev)) * 100
                    )
                  )

                  return (
                    <div
                      key={product.id}
                      className="group py-3 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {product.totalSold} unit terjual · Sisa stok:{' '}
                              <span
                                className={`font-semibold ${
                                  product.stock < 5
                                    ? 'text-rose-500'
                                    : 'text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {product.stock}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="whitespace-nowrap font-mono text-xs font-bold text-slate-950 dark:text-white">
                            {formatRupiah(product.revenue)}
                          </p>
                          <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            {sharePct}% Omzet
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          style={{ width: `${Math.max(5, sharePct)}%` }}
                          className="h-full rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-400"
                        />
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>

        {/* Statistik Jaringan Toko */}
        <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Statistik Jaringan Toko
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Status operasional dan performa cabang
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {reportData.stores?.active ??
                reportData.mitras?.approved ??
                0}{' '}
              Aktif
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pb-3 pt-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center dark:border-slate-800/80 dark:bg-slate-800/40">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {reportData.stores?.total ?? reportData.mitras?.total ?? 0}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Total Toko
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center dark:border-slate-800/80 dark:bg-slate-800/40">
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {reportData.stores?.active ?? reportData.mitras?.approved ?? 0}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Toko Aktif
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center dark:border-slate-800/80 dark:bg-slate-800/40">
              <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                {reportData.stores?.topRated?.reduce(
                  (sum, s) => sum + (s.totalSales || 0),
                  0
                ) ?? 0}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Unit Terjual
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Toko Rating Tertinggi
            </span>
            {((reportData?.stores?.topRated?.length ?? 0) > 0
              ? (reportData?.stores?.topRated ?? [])
              : (reportData?.mitras?.topRated ?? [])
            )
              .slice(0, 2)
              .map(
                (st: {
                  id: string
                  name?: string
                  businessName?: string
                  city: string
                  totalSales?: number
                  rating: number
                }) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/40 p-2.5 dark:border-slate-800/80 dark:bg-slate-800/30"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {st.name || st.businessName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {st.city}{' '}
                        {st.totalSales !== undefined
                          ? `· ${st.totalSales} penjualan`
                          : ''}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      ⭐ {st.rating.toFixed(1)}
                    </span>
                  </div>
                )
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
