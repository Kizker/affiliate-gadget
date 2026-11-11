'use client'

import React from 'react'
import Link from 'next/link'

interface StoreAdminDesktopSimpleViewProps {
  storeStats: {
    todayRevenue?: number
    todayOrdersCount?: number
    lowStockCount?: number
    outOfStockCount?: number
    totalOrders?: number
    pendingReturns?: number
    totalReturns?: number
    orderStatusCounts?: {
      paid?: number
      inProgress?: number
      shipped?: number
      completed?: number
      pendingPayment?: number
      cancelled?: number
    }
  }
  recentOrders: Array<{ id: string; orderNumber: string }>
  filteredOrders: Array<{
    id: string
    orderNumber: string
    total: number
    status: string
    createdAt: string
    user?: { name?: string | null; email?: string | null }
  }>
  orderFilter: 'ALL' | 'PAID' | 'IN_PROGRESS' | 'SHIPPED' | 'COMPLETED'
  setOrderFilter: (
    val: 'ALL' | 'PAID' | 'IN_PROGRESS' | 'SHIPPED' | 'COMPLETED'
  ) => void
  mobileOrderSearch: string
  setMobileOrderSearch: (val: string) => void
  recentReturnsList: Array<{
    id: string
    status: string
    reason?: string | null
    order?: { orderNumber?: string }
  }>
  recentCancellationsList: Array<{
    id: string
    orderNumber: string
  }>
  mobileReturnTab: 'RETUR' | 'BATAL'
  setMobileReturnTab: (val: 'RETUR' | 'BATAL') => void
  getFirstItemName: (order: unknown) => string
  timeAgo: (dateStr: string) => string
  onSelectOrder?: (order: unknown) => void
}

export function StoreAdminDesktopSimpleView({
  storeStats,
  filteredOrders,
  orderFilter,
  setOrderFilter,
  mobileOrderSearch,
  setMobileOrderSearch,
  recentReturnsList,
  recentCancellationsList,
  mobileReturnTab,
  setMobileReturnTab,
  getFirstItemName,
  timeAgo,
  onSelectOrder,
}: StoreAdminDesktopSimpleViewProps) {
  const counts = storeStats?.orderStatusCounts || {}
  const paidCount = counts.paid ?? 0
  const inProgressCount = counts.inProgress ?? 0
  const shippedCount = counts.shipped ?? 0
  const completedCount = counts.completed ?? 0
  const pendingPaymentCount = counts.pendingPayment ?? 0
  const cancelledCount = counts.cancelled ?? 0
  const totalReturnsCount =
    (storeStats?.pendingReturns ?? 0) + (storeStats?.totalReturns ?? 0)
  const returBatalTotal = cancelledCount + totalReturnsCount

  // Display orders up to 5 on desktop simple view
  const displayOrders = filteredOrders.slice(0, 5)

  return (
    <div className="hidden space-y-6 sm:block">
      {/* 1. ROW ATAS: 4 KARTU KPI UTAMA BERSATU DENGAN TEMA MOBILE */}
      <div className="grid grid-cols-4 gap-4">
        {/* Card 1: Omset Hari Ini */}
        <div className="shadow-2xs rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              OMSET HARI INI
            </span>
            <Link
              href="/dashboard/admin/finance"
              className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              Laporan &rsaquo;
            </Link>
          </div>

          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-sm font-bold text-slate-400">Rp</span>
            <span className="truncate font-mono text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {(storeStats?.todayRevenue ?? 0).toLocaleString('id-ID')}
            </span>
          </div>

          <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            {storeStats?.todayOrdersCount ?? 0} pesanan masuk hari ini
          </p>
        </div>

        {/* Card 2: Perlu Proses Cepat */}
        <Link
          href="/dashboard/admin/orders?status=PAID"
          className="shadow-2xs rounded-3xl border border-slate-200/90 bg-white p-5 transition hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              PERLU PROSES
            </span>
            {paidCount > 0 && (
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-orange-500" />
            )}
          </div>

          <div className="mt-3 font-mono text-2xl font-black text-slate-950 dark:text-white">
            {paidCount}
          </div>

          <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            Siap packing &amp; kirim kurir
          </p>
        </Link>

        {/* Card 3: Stok Kritis */}
        <Link
          href="/dashboard/admin/products"
          className="shadow-2xs rounded-3xl border border-slate-200/90 bg-white p-5 transition hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              STOK KRITIS
            </span>
            {(storeStats?.lowStockCount ?? 0) +
              (storeStats?.outOfStockCount ?? 0) >
              0 && (
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            )}
          </div>

          <div className="mt-3 font-mono text-2xl font-black text-slate-950 dark:text-white">
            {(storeStats?.lowStockCount ?? 0) +
              (storeStats?.outOfStockCount ?? 0)}
          </div>

          <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            {storeStats?.outOfStockCount ?? 0} Habis ·{' '}
            {storeStats?.lowStockCount ?? 0} Menipis (&le;2)
          </p>
        </Link>

        {/* Card 4: Retur / Batal */}
        <Link
          href="/dashboard/admin/returns"
          className="shadow-2xs rounded-3xl border border-slate-200/90 bg-white p-5 transition hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              RETUR / BATAL
            </span>
            {returBatalTotal > 0 && (
              <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
            )}
          </div>

          <div className="mt-3 font-mono text-2xl font-black text-slate-950 dark:text-white">
            {returBatalTotal}
          </div>

          <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            {totalReturnsCount} Retur · {cancelledCount} Dibatalkan
          </p>
        </Link>
      </div>

      {/* 2. KARTU STATUS PESANAN (BARIS 4 KOTAK ALA MOBILE) */}
      <div className="shadow-2xs rounded-3xl border border-slate-200/90 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-xs font-bold dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1.5 rounded-full bg-orange-500" />
            <span className="font-bold uppercase tracking-wider text-slate-950 dark:text-white">
              STATUS PESANAN
            </span>
          </div>
          <Link
            href="/dashboard/admin/orders"
            className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            Kelola Semua Pesanan &rsaquo;
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3.5">
          {/* Perlu Proses */}
          <Link
            href="/dashboard/admin/orders?status=PAID"
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-orange-200 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Perlu Proses
              </span>
              <span className="h-2 w-2 rounded-full bg-amber-400" />
            </div>
            <span className="mt-3 font-mono text-2xl font-black text-slate-950 dark:text-white">
              {paidCount}
            </span>
          </Link>

          {/* Diproses */}
          <Link
            href="/dashboard/admin/orders?status=IN_PROGRESS"
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-blue-200 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Diproses
              </span>
              <span className="h-2 w-2 rounded-full bg-blue-500" />
            </div>
            <span className="mt-3 font-mono text-2xl font-black text-slate-950 dark:text-white">
              {inProgressCount}
            </span>
          </Link>

          {/* Dikirim */}
          <Link
            href="/dashboard/admin/orders?status=SHIPPED"
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Dikirim
              </span>
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
            </div>
            <span className="mt-3 font-mono text-2xl font-black text-slate-950 dark:text-white">
              {shippedCount}
            </span>
          </Link>

          {/* Selesai */}
          <Link
            href="/dashboard/admin/orders?status=COMPLETED"
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Selesai
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <span className="mt-3 font-mono text-2xl font-black text-slate-950 dark:text-white">
              {completedCount}
            </span>
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <Link
            href="/dashboard/admin/orders?status=PENDING_PAYMENT"
            className="text-slate-400 transition hover:text-slate-600"
          >
            Menunggu Bayar:{' '}
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {pendingPaymentCount}
            </span>
          </Link>
          <Link
            href="/dashboard/admin/returns"
            className="text-slate-400 transition hover:text-slate-600"
          >
            Retur / Batal:{' '}
            <span className="font-bold text-rose-500">{returBatalTotal}</span>
          </Link>
        </div>
      </div>

      {/* 3. ROW BAWAH: 2 KOLOM (PESANAN MASUK + PENGEMBALIAN & BATAL) */}
      <div className="grid grid-cols-12 items-start gap-5">
        {/* Kolom Kiri: Pesanan Masuk (7 Kolom) */}
        <div className="shadow-2xs col-span-7 rounded-3xl border border-slate-200/90 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-xs font-bold dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1.5 rounded-full bg-orange-500" />
              <span className="font-bold uppercase tracking-wider text-slate-950 dark:text-white">
                PESANAN MASUK
              </span>
            </div>
            <Link
              href="/dashboard/admin/orders"
              className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              Semua Pesanan &rsaquo;
            </Link>
          </div>

          {/* Search Input */}
          <div className="mt-3.5">
            <input
              type="text"
              value={mobileOrderSearch}
              onChange={(e) => setMobileOrderSearch(e.target.value)}
              placeholder="Cari ID pesanan atau pembeli..."
              className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
            />
          </div>

          {/* Filter Status Tabs */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setOrderFilter('ALL')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                orderFilter === 'ALL'
                  ? 'shadow-xs bg-slate-950 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Semua ({storeStats?.totalOrders ?? filteredOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setOrderFilter('PAID')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                orderFilter === 'PAID'
                  ? 'shadow-xs bg-slate-950 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Perlu Diproses ({paidCount})
            </button>
            <button
              type="button"
              onClick={() => setOrderFilter('IN_PROGRESS')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                orderFilter === 'IN_PROGRESS'
                  ? 'shadow-xs bg-slate-950 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Diproses ({inProgressCount})
            </button>
          </div>

          {/* List Pesanan Individual */}
          <div className="mt-4 space-y-3">
            {displayOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400 dark:border-slate-800">
                Tidak ada pesanan yang sesuai filter.
              </div>
            ) : (
              displayOrders.map((order) => {
                const isCancelled = order.status === 'CANCELLED'
                const isCompleted =
                  order.status === 'COMPLETED' || order.status === 'DELIVERED'
                const isPaid = order.status === 'PAID'
                const statusLabel = isCancelled
                  ? 'Dibatalkan'
                  : isCompleted
                    ? 'Selesai'
                    : isPaid
                      ? 'Perlu Diproses'
                      : order.status === 'SHIPPED'
                        ? 'Dikirim'
                        : 'Diproses'

                const statusColor = isCancelled
                  ? 'bg-rose-50 text-rose-600'
                  : isCompleted
                    ? 'bg-emerald-50 text-emerald-600'
                    : isPaid
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-blue-50 text-blue-600'

                const buyerName =
                  order.user?.name || order.user?.email || 'Pembeli'

                return (
                  <div
                    key={order.id}
                    className="shadow-2xs rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-950 dark:text-white">
                          #{order.orderNumber}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {buyerName}
                        </span>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {getFirstItemName(order)}
                      </p>
                      <span className="ml-2 shrink-0 text-[11px] text-slate-400">
                        {timeAgo(order.createdAt)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
                      <span className="font-mono font-bold text-slate-950 dark:text-white">
                        Rp {order.total.toLocaleString('id-ID')}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectOrder?.(order)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        Rincian
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Kolom Kanan: Pengembalian & Batal (5 Kolom) */}
        <div className="shadow-2xs col-span-5 rounded-3xl border border-slate-200/90 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-xs font-bold dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1.5 rounded-full bg-rose-500" />
              <span className="font-bold uppercase tracking-wider text-slate-950 dark:text-white">
                PENGEMBALIAN &amp; RETUR
              </span>
            </div>
            <Link
              href="/dashboard/admin/returns"
              className="font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
            >
              Lihat Retur &rsaquo;
            </Link>
          </div>

          {/* Sub Switcher Tab (Retur vs Batal) */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMobileReturnTab('RETUR')}
              className={`rounded-xl py-2 text-center font-bold transition ${
                mobileReturnTab === 'RETUR'
                  ? 'shadow-2xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Pengajuan Retur ({recentReturnsList.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileReturnTab('BATAL')}
              className={`rounded-xl py-2 text-center font-bold transition ${
                mobileReturnTab === 'BATAL'
                  ? 'shadow-2xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Dibatalkan ({recentCancellationsList.length})
            </button>
          </div>

          {/* Content list */}
          <div className="mt-4 space-y-3">
            {mobileReturnTab === 'RETUR' ? (
              recentReturnsList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400 dark:border-slate-800">
                  Tidak ada pengajuan retur aktif.
                </div>
              ) : (
                recentReturnsList.slice(0, 4).map((ret) => (
                  <div
                    key={ret.id}
                    className="shadow-2xs rounded-2xl border border-slate-100 bg-white p-3.5 dark:border-slate-800/80 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-950 dark:text-white">
                        #{ret.order?.orderNumber || 'RETUR'}
                      </span>
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {ret.status}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-xs text-slate-600 dark:text-slate-400">
                      {ret.reason || 'Kendala unit'}
                    </p>
                  </div>
                ))
              )
            ) : recentCancellationsList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400 dark:border-slate-800">
                Tidak ada pesanan yang dibatalkan.
              </div>
            ) : (
              recentCancellationsList.slice(0, 4).map((ord) => (
                <div
                  key={ord.id}
                  className="shadow-2xs rounded-2xl border border-slate-100 bg-white p-3.5 dark:border-slate-800/80 dark:bg-slate-800/50"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-950 dark:text-white">
                      #{ord.orderNumber}
                    </span>
                    <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                      Dibatalkan
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-xs text-slate-600 dark:text-slate-400">
                    {getFirstItemName(ord)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
