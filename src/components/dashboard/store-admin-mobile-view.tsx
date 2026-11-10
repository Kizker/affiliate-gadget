'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'

interface StoreAdminMobileViewProps {
  storeStats: any
  recentOrders: any[]
  filteredOrders: any[]
  orderFilter: 'ALL' | 'PAID' | 'IN_PROGRESS' | 'SHIPPED' | 'COMPLETED'
  setOrderFilter: (
    val: 'ALL' | 'PAID' | 'IN_PROGRESS' | 'SHIPPED' | 'COMPLETED'
  ) => void
  mobileOrderSearch: string
  setMobileOrderSearch: (val: string) => void
  recentReturnsList: any[]
  recentCancellationsList: any[]
  mobileReturnTab: 'RETUR' | 'BATAL'
  setMobileReturnTab: (val: 'RETUR' | 'BATAL') => void
  getFirstItemName: (order: any) => string
  timeAgo: (dateStr: string) => string
  onSelectOrder?: (order: any) => void
}

export function StoreAdminMobileView({
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
  onSelectOrder,
}: StoreAdminMobileViewProps) {
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

  const pendingReturnsOnly = storeStats?.pendingReturns ?? 0

  // 3 Item Pesanan Masuk Teratas untuk Tampilan Mobile Bersih
  const displayOrders = filteredOrders.slice(0, 3)

  return (
    <div className="space-y-4 px-1 py-1 font-sans sm:hidden">
      {/* 1. KARTU OMSET HARI INI */}
      <div className="shadow-xs rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider text-slate-800 dark:text-slate-200">
            OMSET HARI INI
          </span>
          <Link
            href="/dashboard/admin/finance"
            className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            Laporan &rsaquo;
          </Link>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-slate-400">Rp</span>
          <span className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {(storeStats?.todayRevenue ?? 0).toLocaleString('id-ID')}
          </span>
        </div>

        <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
          {storeStats?.todayOrdersCount ?? 0} pesanan masuk hari ini
        </p>
      </div>

      {/* 2. BARIS 3 KARTU METRIK: PERLU PROSES, STOK KRITIS, RETUR / BATAL */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Perlu Proses */}
        <Link
          href="/dashboard/admin/orders?status=PAID"
          className="shadow-xs flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-3 text-center transition active:scale-95 dark:border-slate-800 dark:bg-slate-900"
        >
          <span className="text-[11px] font-bold text-orange-700 dark:text-orange-400">
            Perlu Proses
          </span>
          <span className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
            {paidCount}
          </span>
        </Link>

        {/* Stok Kritis */}
        <Link
          href="/dashboard/admin/products"
          className="shadow-xs flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-3 text-center transition active:scale-95 dark:border-slate-800 dark:bg-slate-900"
        >
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Stok Kritis
          </span>
          <span className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
            {(storeStats?.lowStockCount ?? 0) +
              (storeStats?.outOfStockCount ?? 0)}
          </span>
        </Link>

        {/* Retur / Batal */}
        <Link
          href="/dashboard/admin/returns"
          className="shadow-xs flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-3 text-center transition active:scale-95 dark:border-slate-800 dark:bg-slate-900"
        >
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
            Retur / Batal
          </span>
          <span className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
            {returBatalTotal}
          </span>
        </Link>
      </div>

      {/* 3. KARTU STATUS PESANAN (GRID 2x2) */}
      <div className="shadow-xs rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs font-bold">
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
            Kelola Semua &rsaquo;
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {/* Perlu Proses */}
          <Link
            href="/dashboard/admin/orders?status=PAID"
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition active:scale-95 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Perlu Proses
              </span>
              <span className="h-2 w-2 rounded-full bg-amber-400" />
            </div>
            <span className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              {paidCount}
            </span>
          </Link>

          {/* Diproses */}
          <Link
            href="/dashboard/admin/orders?status=IN_PROGRESS"
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition active:scale-95 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Diproses
              </span>
              <span className="h-2 w-2 rounded-full bg-blue-500" />
            </div>
            <span className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              {inProgressCount}
            </span>
          </Link>

          {/* Dikirim */}
          <Link
            href="/dashboard/admin/orders?status=SHIPPED"
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition active:scale-95 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Dikirim
              </span>
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
            </div>
            <span className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              {shippedCount}
            </span>
          </Link>

          {/* Selesai */}
          <Link
            href="/dashboard/admin/orders?status=COMPLETED"
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition active:scale-95 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Selesai
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <span className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              {completedCount}
            </span>
          </Link>
        </div>

        {/* Footer Sub-Info */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <Link
            href="/dashboard/admin/orders?status=PENDING_PAYMENT"
            className="text-slate-400 transition hover:text-slate-600"
          >
            Menunggu:{' '}
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

      {/* 4. KARTU PESANAN MASUK DENGAN SEARCH & TABS */}
      <div className="shadow-xs rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs font-bold">
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
            Semua &rsaquo;
          </Link>
        </div>

        {/* Search Bar Input */}
        <div className="relative mt-3.5">
          <input
            type="text"
            value={mobileOrderSearch}
            onChange={(e) => setMobileOrderSearch(e.target.value)}
            placeholder="Cari ID pesanan atau pembeli..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
          />
        </div>

        {/* Status Filter Tabs (Semua, Perlu Diproses, Diproses) */}
        <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setOrderFilter('ALL')}
            className={`shrink-0 rounded-full px-4 py-1.5 font-bold transition ${
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
            className={`shrink-0 rounded-full px-4 py-1.5 font-bold transition ${
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
            className={`shrink-0 rounded-full px-4 py-1.5 font-bold transition ${
              orderFilter === 'IN_PROGRESS'
                ? 'shadow-xs bg-slate-950 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Diproses ({inProgressCount})
          </button>
        </div>

        {/* Daftar Kartu Pesanan Individual */}
        <div className="mt-3.5 space-y-2.5">
          {displayOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
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
              const shortBuyer =
                buyerName.length > 12
                  ? `${buyerName.slice(0, 10)}...`
                  : buyerName

              return (
                <div
                  key={order.id}
                  className="shadow-2xs rounded-2xl border border-slate-100 bg-white p-3.5 dark:border-slate-800/80 dark:bg-slate-800/50"
                >
                  {/* Header Item: Order Number + Buyer + Badge */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono font-bold text-slate-950 dark:text-white">
                        #{order.orderNumber.slice(0, 18)}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="truncate text-slate-500">
                        {shortBuyer}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {/* Body Item: Nama Produk */}
                  <p className="mt-2 line-clamp-1 text-xs font-bold text-slate-900 dark:text-white">
                    {getFirstItemName(order)}
                  </p>

                  {/* Footer Item: Total Tagihan + Tombol Rincian */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2 dark:border-slate-800/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-bold text-slate-400">
                        Rp
                      </span>
                      <span className="text-sm font-black tracking-tight text-slate-950 dark:text-white">
                        {order.total.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button
                      type="button"
                      data-href={`/dashboard/admin/orders?search=${encodeURIComponent(order.orderNumber)}`}
                      onClick={() => onSelectOrder?.(order)}
                      className="shadow-2xs cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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

      {/* 5. KARTU PENGEMBALIAN & RETUR */}
      <div className="shadow-xs rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1.5 rounded-full bg-rose-500" />
            <span className="font-bold uppercase tracking-wider text-slate-950 dark:text-white">
              PENGEMBALIAN &amp; RETUR
            </span>
          </div>
          <Link
            href="/dashboard/admin/returns"
            className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            Semua &rsaquo;
          </Link>
        </div>

        {/* Tab Switcher: Pengajuan Retur vs Dibatalkan */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMobileReturnTab('RETUR')}
            className={`rounded-xl py-2 transition ${
              mobileReturnTab === 'RETUR'
                ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Pengajuan Retur ({pendingReturnsOnly})
          </button>
          <button
            type="button"
            onClick={() => setMobileReturnTab('BATAL')}
            className={`rounded-xl py-2 transition ${
              mobileReturnTab === 'BATAL'
                ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Dibatalkan ({cancelledCount})
          </button>
        </div>

        {/* Daftar Retur / Batal */}
        <div className="mt-3.5 space-y-2.5">
          {mobileReturnTab === 'RETUR' ? (
            recentReturnsList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
                Tidak ada pengajuan retur aktif saat ini.
              </div>
            ) : (
              recentReturnsList.slice(0, 2).map((ret: any) => {
                const isPending = ret.status === 'PENDING'
                const statusBadge = isPending ? 'Menunggu Review' : 'Selesai'
                const statusColor = isPending
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-600'
                const solutionType =
                  ret.type === 'REPLACEMENT'
                    ? 'Ganti Unit Baru'
                    : 'Pengembalian Dana'

                return (
                  <div
                    key={ret.id}
                    className="shadow-2xs rounded-2xl border border-slate-100 bg-white p-3.5 dark:border-slate-800/80 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-950 dark:text-white">
                        #
                        {ret.order?.orderNumber?.slice(0, 18) ||
                          ret.id.slice(0, 12)}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${statusColor}`}
                      >
                        {statusBadge}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {solutionType}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {ret.reasonLabel || ret.reason || 'Kendala Produk'}
                      </span>
                    </div>

                    <div className="mt-2.5 border-t border-slate-50 pt-2 text-right dark:border-slate-800/60">
                      <Link
                        href={`/dashboard/admin/returns?search=${encodeURIComponent(ret.order?.orderNumber || '')}`}
                        className="text-xs font-bold text-orange-600 hover:underline dark:text-orange-400"
                      >
                        Tinjau Permintaan &rsaquo;
                      </Link>
                    </div>
                  </div>
                )
              })
            )
          ) : recentCancellationsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
              Tidak ada pesanan yang dibatalkan.
            </div>
          ) : (
            recentCancellationsList.slice(0, 2).map((ord: any) => (
              <div
                key={ord.id}
                className="shadow-2xs rounded-2xl border border-slate-100 bg-white p-3.5 dark:border-slate-800/80 dark:bg-slate-800/50"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-950 dark:text-white">
                    #{ord.orderNumber?.slice(0, 18)}
                  </span>
                  <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                    Dibatalkan
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {ord.items?.[0]?.product?.name || 'Pesanan Dibatalkan'}
                </p>
                <div className="mt-2.5 border-t border-slate-50 pt-2 text-right dark:border-slate-800/60">
                  <Link
                    href={`/dashboard/admin/orders?search=${encodeURIComponent(ord.orderNumber)}`}
                    className="text-xs font-bold text-orange-600 hover:underline dark:text-orange-400"
                  >
                    Lihat Rincian &rsaquo;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
