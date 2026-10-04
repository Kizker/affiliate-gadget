'use client'

import React from 'react'
import {
  Download,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Building2,
  ShieldAlert,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Percent,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  TransactionMutation,
  MutationCategoryTab,
  StoreInfo,
  formatRupiah,
} from '../types'

interface MutationsViewProps {
  filteredTransactions: TransactionMutation[]
  activeTab: MutationCategoryTab
  setActiveTab: (tab: MutationCategoryTab) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleExportCSV: () => void
  itemsPerPage: number
  setItemsPerPage: (items: number) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  mobileVisibleCount: number
  isLoadingMoreMobile: boolean
  mobileHasMore: boolean
  loadMoreMobile: () => void
  mobileSentinelRef: React.RefObject<HTMLDivElement | null>
  store: StoreInfo | null
  onOpenWithdrawModal: () => void
}

export function TransactionItemRow({ tx }: { tx: TransactionMutation }) {
  const isIncome = tx.type === 'INCOME'
  const isPayout = tx.type === 'PAYOUT'
  const isEscrow = tx.type === 'ESCROW'
  const isGateway = tx.category === 'GATEWAY'

  return (
    <div
      key={tx.id}
      className="group flex flex-col gap-3 py-3.5 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            isPayout
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
              : isEscrow
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                : isIncome
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : isGateway
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {isPayout ? (
            <ArrowDownLeft className="h-4 w-4" />
          ) : isEscrow ? (
            <Clock className="h-4 w-4" />
          ) : isGateway ? (
            <Percent className="h-4 w-4" />
          ) : (
            <ArrowUpRight className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
              {tx.refNumber}
            </span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                tx.category === 'SALE'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : tx.category === 'COMMISSION'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                    : tx.category === 'WITHDRAWAL'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : tx.category === 'GATEWAY'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {tx.categoryLabel}
            </span>
            {tx.orderStatus && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {tx.orderStatus}
              </span>
            )}
          </div>

          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
            {tx.title}
          </p>
          <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
            {tx.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center">
        <p
          className={`font-mono text-xs font-bold sm:text-sm ${
            isPayout
              ? 'text-rose-600 dark:text-rose-400'
              : isEscrow
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {isPayout ? '-' : '+'} {formatRupiah(tx.amount)}
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>{tx.date}</span>
          <span>·</span>
          <span
            className={`font-semibold ${
              tx.status === 'SUCCESS' || tx.status === 'SETTLED'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {tx.statusLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

export function MutationsView({
  filteredTransactions,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  handleExportCSV,
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  mobileVisibleCount,
  isLoadingMoreMobile,
  mobileHasMore,
  loadMoreMobile,
  mobileSentinelRef,
  store,
  onOpenWithdrawModal,
}: MutationsViewProps) {
  // Desktop pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / itemsPerPage)
  )
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    filteredTransactions.length
  )
  const paginatedDesktopTransactions = filteredTransactions.slice(
    startIndex,
    endIndex
  )

  // Mobile lazy loading slice
  const displayedMobileTransactions = filteredTransactions.slice(
    0,
    mobileVisibleCount
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (safeCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (safeCurrentPage >= totalPages - 2) {
        pages.push(
          1,
          '...',
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        )
      } else {
        pages.push(
          1,
          '...',
          safeCurrentPage - 1,
          safeCurrentPage,
          safeCurrentPage + 1,
          '...',
          totalPages
        )
      }
    }
    return pages
  }

  return (
    <div className="grid grid-cols-1 gap-5 duration-200 animate-in fade-in lg:grid-cols-12">
      {/* LEFT COLUMN: BUKU KAS & MUTASI ARUS TRANSAKSI (8 COLS) */}
      <div className="shadow-xs flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
        <div>
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-950 dark:text-white">
                Buku Kas & Mutasi Transaksi
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                Arus kas riil penjualan, pemotongan komisi platform, dan
                pencairan saldo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {filteredTransactions.length} Mutasi
              </span>
              <button
                type="button"
                onClick={handleExportCSV}
                title="Download Rekap Mutasi Kas (.csv)"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
              >
                <Download className="h-3 w-3" />
                <span>Rekap Kas (CSV)</span>
              </button>
            </div>
          </div>

          {/* Sub-Filter Pills & Search Bar */}
          <div className="mt-3.5 space-y-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { key: 'ALL', label: 'Semua Arus' },
                { key: 'SALE', label: 'Penjualan' },
                { key: 'COMMISSION', label: 'Bagi Hasil' },
                { key: 'GATEWAY', label: 'Biaya Gateway' },
                { key: 'WITHDRAWAL', label: 'Pencairan' },
                { key: 'ESCROW', label: 'Dana Tertahan' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    activeTab === tab.key
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari no. pesanan, resi, atau judul mutasi..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
              />
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tidak ada transaksi ditemukan
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Coba sesuaikan kata kunci pencarian atau tab filter
              </p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <div className="divide-y divide-slate-100 pt-2 dark:divide-slate-800/60">
                  {paginatedDesktopTransactions.map((tx) => (
                    <TransactionItemRow key={tx.id} tx={tx} />
                  ))}
                </div>

                {filteredTransactions.length > 0 && (
                  <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Menampilkan{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {startIndex + 1}
                        </span>{' '}
                        -{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {endIndex}
                        </span>{' '}
                        dari{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {filteredTransactions.length}
                        </span>{' '}
                        mutasi
                      </p>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <span className="hidden sm:inline">Per hal:</span>
                        {[10, 25, 50].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              setItemsPerPage(num)
                              setCurrentPage(1)
                            }}
                            className={`rounded-lg px-2 py-0.5 text-[11px] font-bold transition ${
                              itemsPerPage === num
                                ? 'shadow-2xs bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePageChange(safeCurrentPage - 1)}
                        disabled={safeCurrentPage <= 1}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Sebelumnya</span>
                      </button>

                      {getPageNumbers().map((p, idx) =>
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
                            onClick={() => handlePageChange(Number(p))}
                            className={`min-w-[32px] cursor-pointer rounded-xl px-2.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                              safeCurrentPage === p
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
                        onClick={() => handlePageChange(safeCurrentPage + 1)}
                        disabled={safeCurrentPage >= totalPages}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <span>Selanjutnya</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile View */}
              <div className="block md:hidden">
                <div className="divide-y divide-slate-100 pt-2 dark:divide-slate-800/60">
                  {displayedMobileTransactions.map((tx) => (
                    <TransactionItemRow key={tx.id} tx={tx} />
                  ))}
                </div>

                {mobileHasMore ? (
                  <div
                    ref={mobileSentinelRef}
                    className="flex flex-col items-center justify-center py-5 text-center"
                  >
                    {isLoadingMoreMobile ? (
                      <div className="shadow-2xs flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/80 px-4 py-1.5 text-xs font-semibold text-orange-600 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                        <span>Memuat mutasi berikutnya...</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={loadMoreMobile}
                        className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 transition active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      >
                        <span>Muat Lebih Banyak</span>
                        <span className="text-[10px] text-slate-400">
                          ({mobileVisibleCount} / {filteredTransactions.length})
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  filteredTransactions.length > itemsPerPage && (
                    <div className="py-5 text-center">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-slate-50 px-3.5 py-1 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>
                          Semua {filteredTransactions.length} mutasi telah
                          ditampilkan
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CORPORATE BANK ACCOUNT & WITHDRAWAL GATE (4 COLS) */}
      <div className="space-y-5 lg:col-span-4">
        <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Rekening Penampungan PT
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Terverifikasi
            </span>
          </div>

          <div className="shadow-2xs relative overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 transition-all dark:border-slate-800 dark:bg-slate-800/50">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                {store?.bankAccount?.bankName || 'BANK MANDIRI'}
              </span>
              <Building2 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>

            <div className="mb-4 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Nomor Rekening PT
              </p>
              <p className="font-mono text-base font-black tracking-widest text-slate-900 dark:text-white">
                {store?.bankAccount?.accountNumber || '1180 0192 8374 1'}
              </p>
            </div>

            <div className="flex items-end justify-between border-t border-slate-200/80 pt-3 dark:border-slate-700/80">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Nama Pemilik Rekening
                </p>
                <p className="max-w-[190px] truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                  {store?.bankAccount?.accountName ||
                    store?.companyName ||
                    'PT Gadget Jaya Sentosa'}
                </p>
              </div>
              <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                {store?.city ? `Cab. ${store.city}` : 'Cab. Pusat'}
              </span>
            </div>
          </div>

          {/* Cooling-down Alert Banner */}
          {store?.cooldownStatus?.isLocked && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                    Penarikan Terkunci (Cooling-down 24 Jam)
                  </p>
                  <p className="text-[10px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                    Perubahan rekening bank terdeteksi. Demi keamanan dana PT,
                    penarikan saldo dikunci sementara hingga{' '}
                    <strong>
                      {store.cooldownStatus.remainingHours} jam{' '}
                      {store.cooldownStatus.remainingMinutes} menit
                    </strong>{' '}
                    lagi.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={store?.cooldownStatus?.isLocked}
            onClick={() => {
              if (store?.cooldownStatus?.isLocked) {
                toast.error(
                  `Penarikan saldo dikunci sementara (Cooling-down). Sisa waktu: ${store.cooldownStatus.remainingHours} jam ${store.cooldownStatus.remainingMinutes} menit.`
                )
                return
              }
              onOpenWithdrawModal()
            }}
            className={cn(
              'shadow-xs mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold transition-all',
              store?.cooldownStatus?.isLocked
                ? 'cursor-not-allowed border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500'
            )}
          >
            {store?.cooldownStatus?.isLocked ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                <span>
                  Terkunci ({store.cooldownStatus.remainingHours}j{' '}
                  {store.cooldownStatus.remainingMinutes}m)
                </span>
              </>
            ) : (
              <>
                <Wallet className="h-3.5 w-3.5" />
                <span>Tarik Saldo ke Rekening PT</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
