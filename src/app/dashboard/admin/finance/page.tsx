'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Wallet,
  TrendingUp,
  Percent,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Loader2,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'

interface TransactionMutation {
  id: string
  refNumber: string
  title: string
  subtitle: string
  type: 'INCOME' | 'EXPENSE' | 'ESCROW' | 'PAYOUT'
  category: 'SALE' | 'COMMISSION' | 'WITHDRAWAL' | 'ESCROW'
  categoryLabel: string
  amount: number
  date: string
  status: 'SETTLED' | 'PENDING' | 'SUCCESS'
  statusLabel: string
  orderStatus?: string
  courierInfo?: string
  trackingNumber?: string | null
}

interface CourierBreakdown {
  paidCount: number
  inProgressCount: number
  shippedCount: number
  complainedCount: number
  totalEscrowOrders: number
}

interface FinanceStats {
  availableBalance: number
  grossRevenue: number
  platformCommission: number
  escrowBalance: number
  totalUnitsSold: number
  totalWithdrawn: number
  completedNetRevenue: number
  courierBreakdown: CourierBreakdown
}

interface StoreInfo {
  id: string
  name: string
  companyName: string
  taxId: string
  city: string
  bankAccount: {
    bankName: string
    accountNumber: string
    accountName: string
  }
}

interface StoreOption {
  id: string
  name: string
  companyName: string
  city: string
}

export default function StoreAdminFinancePage() {
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'SALE' | 'COMMISSION' | 'WITHDRAWAL' | 'ESCROW'
  >('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  // Real-time API States
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [allStores, setAllStores] = useState<StoreOption[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [transactions, setTransactions] = useState<TransactionMutation[]>([])
  const [stats, setStats] = useState<FinanceStats>({
    availableBalance: 0,
    grossRevenue: 0,
    platformCommission: 0,
    escrowBalance: 0,
    totalUnitsSold: 0,
    totalWithdrawn: 0,
    completedNetRevenue: 0,
    courierBreakdown: {
      paidCount: 0,
      inProgressCount: 0,
      shippedCount: 0,
      complainedCount: 0,
      totalEscrowOrders: 0,
    },
  })

  // Fetch real-time finance data from API
  const fetchFinanceData = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) setIsLoading(true)
        else setIsRefreshing(true)

        const url = selectedStoreId
          ? `/api/admin/finance?storeId=${encodeURIComponent(selectedStoreId)}`
          : '/api/admin/finance'

        const res = await fetch(url)
        if (!res.ok) {
          throw new Error('Gagal mengambil data keuangan toko')
        }

        const data = await res.json()
        if (data.success) {
          setStats(data.stats)
          setStore(data.store)
          setTransactions(data.transactions || [])
          if (data.allStores) {
            setAllStores(data.allStores)
          }
          const nowStr = new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }).format(new Date())
          setLastUpdated(nowStr)
        }
      } catch (err: any) {
        console.error('Error loading finance data:', err)
        toast.error(err.message || 'Gagal menyinkronkan data keuangan')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [selectedStoreId]
  )

  useEffect(() => {
    fetchFinanceData(true)

    // Auto sync berkala setiap 30 detik untuk mendeteksi perubahan pengiriman kurir
    const interval = setInterval(() => {
      fetchFinanceData(false)
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchFinanceData])

  // Filter Transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesTab = activeTab === 'ALL' || tx.category === activeTab
    const matchesSearch =
      searchQuery.trim() === '' ||
      tx.refNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.trackingNumber &&
        tx.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesTab && matchesSearch
  })

  // Handle Withdrawal Submission to API
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseInt(withdrawAmount.replace(/[^0-9]/g, ''), 10)
    if (!numericAmount || numericAmount <= 0) {
      toast.error('Masukkan nominal penarikan yang valid')
      return
    }
    if (numericAmount > stats.availableBalance) {
      toast.error('Nominal melebihi saldo siap cair yang tersedia')
      return
    }

    try {
      setIsSubmittingWithdraw(true)
      const res = await fetch('/api/admin/finance/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          storeId: store?.id,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses penarikan saldo')
      }

      toast.success(
        data.message ||
          'Pengajuan penarikan dana berhasil diproses ke Bank Mandiri PT!'
      )
      setIsWithdrawModalOpen(false)
      setWithdrawAmount('')

      // Refresh saldo langsung
      await fetchFinanceData(false)
    } catch (err: any) {
      console.error('Error withdrawing:', err)
      toast.error(err.message || 'Gagal mengajukan penarikan dana')
    } finally {
      setIsSubmittingWithdraw(false)
    }
  }

  // Handle Export Laporan Keuangan (Excel)
  const handleExportFinancialExcel = async () => {
    try {
      setIsExportingExcel(true)
      const params = new URLSearchParams({
        type: 'financials',
        format: 'xlsx',
      })
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId)
      } else if (store?.id) {
        params.append('storeId', store.id)
      }

      const res = await fetch(`/api/admin/reports/export?${params}`)
      if (!res.ok) {
        throw new Error('Gagal mengekspor laporan keuangan')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const companyClean = (store?.companyName || 'toko')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase()
      a.download = `laporan_keuangan_${companyClean}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Laporan Keuangan berhasil diunduh!')
    } catch (err: any) {
      console.error('Error exporting financial report:', err)
      toast.error(err.message || 'Gagal mengekspor laporan keuangan toko')
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Handle Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada mutasi transaksi untuk diekspor')
      return
    }

    const headers = [
      'No. Referensi',
      'Tanggal',
      'Kategori',
      'Deskripsi',
      'Detail',
      'Tipe Arus',
      'Nominal (Rp)',
      'Status',
    ]

    const rows = filteredTransactions.map((tx) => [
      `"${tx.refNumber}"`,
      `"${tx.date}"`,
      `"${tx.categoryLabel}"`,
      `"${tx.title.replace(/"/g, '""')}"`,
      `"${tx.subtitle.replace(/"/g, '""')}"`,
      `"${tx.type}"`,
      tx.amount,
      `"${tx.statusLabel}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    const companyClean = (store?.companyName || 'Store')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
    link.setAttribute(
      'download',
      `buku-kas-${companyClean}-${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Rekap kas (CSV) berhasil diunduh!')
  }

  // Render Skeleton Loading
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-6 pb-16">
        <div className="h-14 rounded-3xl bg-slate-200/80 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-3xl bg-slate-200/70 dark:bg-slate-800"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="h-96 rounded-3xl bg-slate-200/70 dark:bg-slate-800 lg:col-span-8" />
          <div className="h-96 rounded-3xl bg-slate-200/70 dark:bg-slate-800 lg:col-span-4" />
        </div>
      </div>
    )
  }

  const { courierBreakdown } = stats

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      {/* ========================================================================= */}
      {/* 1. UNIFIED CONTROL BAR (Tabs, Search & Refresh)                           */}
      {/* ========================================================================= */}
      <div className="shadow-2xs flex flex-col items-stretch justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:p-3 md:flex-row md:items-center">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
          {[
            { key: 'ALL', label: 'Semua Arus' },
            { key: 'SALE', label: 'Penjualan' },
            { key: 'COMMISSION', label: 'Bagi Hasil' },
            { key: 'WITHDRAWAL', label: 'Pencairan' },
            { key: 'ESCROW', label: 'Dana Tertahan' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
              {tab.key === 'ESCROW' &&
                courierBreakdown.totalEscrowOrders > 0 && (
                  <span className="py-0.2 ml-1.5 inline-flex items-center rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white">
                    {courierBreakdown.totalEscrowOrders}
                  </span>
                )}
            </button>
          ))}
        </div>

        {/* Search, Store Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          {/* Multi-Store Selector (if Superadmin) */}
          {allStores.length > 0 && (
            <div className="relative">
              <select
                value={selectedStoreId || 'ALL'}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="appearance-none rounded-2xl border border-slate-200/80 bg-slate-50/80 py-2 pl-3 pr-8 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              >
                <option value="ALL">Semua Cabang (Konsolidasi Multi-PT)</option>
                {allStores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.companyName} ({st.city})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          )}

          {/* Search Box */}
          <div className="relative min-w-[160px] flex-1 md:w-56">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari resi, order, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:text-white dark:focus:border-slate-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchFinanceData(false)}
            disabled={isRefreshing}
            title={
              lastUpdated
                ? `Terakhir diperbarui: ${lastUpdated}. Klik untuk refresh real-time.`
                : 'Refresh data'
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/80 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-white"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
            />
          </button>

          {/* Export Laporan Keuangan Button */}
          <button
            type="button"
            onClick={handleExportFinancialExcel}
            disabled={isExportingExcel}
            title="Download Laporan Keuangan Toko"
            className="shadow-xs inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
          >
            {isExportingExcel ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Export Laporan Keuangan</span>
          </button>

          {/* Tarik Saldo Button */}
          <button
            type="button"
            onClick={() => setIsWithdrawModalOpen(true)}
            className="shadow-xs inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl bg-slate-950 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Tarik Saldo</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 4 FINANCIAL KPI CARDS (Bento Grid Real-Time)                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Saldo Siap Cair */}
        <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Saldo Siap Cair
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-100/60 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-slate-400">Rp</span>
              <p className="text-xl font-bold tabular-nums tracking-tight text-slate-950 dark:text-white">
                {stats.availableBalance.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                ● Siap Transfer
              </span>
              <span className="text-[11px] text-slate-400">ke Rekening PT</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pendapatan Kotor */}
        <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Pendapatan Kotor
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-100/60 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-slate-400">Rp</span>
              <p className="text-xl font-bold tabular-nums tracking-tight text-slate-950 dark:text-white">
                {stats.grossRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                Akumulasi
              </span>
              <span className="text-[11px] text-slate-400">
                · {stats.totalUnitsSold} Unit Terjual
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Bagi Hasil Platform */}
        <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Bagi Hasil Platform
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-orange-100/60 bg-orange-50 text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-slate-400">Rp</span>
              <p className="text-xl font-bold tabular-nums tracking-tight text-slate-950 dark:text-white">
                {stats.platformCommission.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                2.0% - 2.5% Rate
              </span>
              <span className="text-[11px] text-slate-400">
                · Terpotong otomatis
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Dana Tertahan (Escrow) */}
        <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Dana Tertahan (Escrow)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-100/60 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-slate-400">Rp</span>
              <p className="text-xl font-bold tabular-nums tracking-tight text-slate-950 dark:text-white">
                {stats.escrowBalance.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                {stats.courierBreakdown.totalEscrowOrders > 0
                  ? `${stats.courierBreakdown.totalEscrowOrders} Pesanan`
                  : '0 Pesanan'}
              </span>
              <span className="text-[11px] text-slate-400">
                · Menunggu Kurir Tiba
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 2-COLUMN BENTO GRID (Ledger Mutations & Corporate Bank Account)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT COLUMN: BUKU KAS & MUTASI ARUS TRANSAKSI (8 COLS) */}
        <div className="shadow-xs flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
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
                {lastUpdated && (
                  <span className="hidden text-[10px] text-slate-400 sm:inline-block">
                    Live: {lastUpdated}
                  </span>
                )}
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
              <div className="divide-y divide-slate-100 pt-2 dark:divide-slate-800/60">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="group flex items-center justify-between gap-3 py-3.5 transition-colors"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      {/* Icon based on mutation type */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                          tx.type === 'INCOME'
                            ? 'border-emerald-100/60 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : tx.type === 'EXPENSE'
                              ? 'border-orange-100/60 bg-orange-50 text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400'
                              : tx.type === 'PAYOUT'
                                ? 'border-blue-100/60 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400'
                                : 'border-amber-100/60 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        {tx.type === 'INCOME' && (
                          <ArrowDownLeft className="h-5 w-5 stroke-[2.5]" />
                        )}
                        {tx.type === 'EXPENSE' && (
                          <Percent className="h-5 w-5 stroke-[2.5]" />
                        )}
                        {tx.type === 'PAYOUT' && (
                          <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                        )}
                        {tx.type === 'ESCROW' && (
                          <Clock className="h-5 w-5 stroke-[2.5]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {tx.refNumber}
                          </span>
                          <span
                            className={`py-0.2 rounded-full border px-2 text-[9px] font-bold ${
                              tx.category === 'SALE'
                                ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : tx.category === 'COMMISSION'
                                  ? 'border-orange-200/60 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                                  : tx.category === 'WITHDRAWAL'
                                    ? 'border-blue-200/60 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                                    : 'border-amber-200/60 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}
                          >
                            {tx.categoryLabel}
                          </span>
                          {tx.trackingNumber && (
                            <span className="py-0.2 rounded-full bg-slate-100 px-2 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              Resi: {tx.trackingNumber}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {tx.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {tx.date} ·{' '}
                          <span className="text-slate-500 dark:text-slate-400">
                            {tx.subtitle}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-xs font-bold tabular-nums ${
                          tx.type === 'INCOME'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.type === 'EXPENSE' || tx.type === 'PAYOUT'
                              ? 'text-slate-900 dark:text-white'
                              : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {tx.type === 'INCOME' && '+'}
                        {tx.type === 'EXPENSE' || tx.type === 'PAYOUT'
                          ? '-'
                          : ''}
                        Rp {tx.amount.toLocaleString('id-ID')}
                      </p>
                      <span
                        className={`mt-1 inline-flex items-center text-[10px] font-semibold ${
                          tx.type === 'ESCROW'
                            ? 'font-bold text-amber-600 dark:text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {tx.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CORPORATE BANK ACCOUNT & TAX SUMMARY (4 COLS) */}
        <div className="space-y-5 lg:col-span-4">
          {/* Authentic Corporate Bank Card Visual */}
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

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 text-white shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  {store?.bankAccount?.bankName || 'BANK MANDIRI'}
                </span>
                <Building2 className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mb-4 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                  Nomor Rekening PT
                </p>
                <p className="font-mono text-base font-black tracking-widest text-white">
                  {store?.bankAccount?.accountNumber || '1180 0192 8374 1'}
                </p>
              </div>

              <div className="flex items-end justify-between border-t border-slate-800/80 pt-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">
                    Nama Pemilik Rekening
                  </p>
                  <p className="max-w-[190px] truncate text-xs font-bold text-slate-200">
                    {store?.bankAccount?.accountName ||
                      store?.companyName ||
                      'PT Gadget Jaya Sentosa'}
                  </p>
                </div>
                <span className="text-[9px] font-semibold text-slate-400">
                  {store?.city ? `Cab. ${store.city}` : 'Cab. Pusat'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWithdrawModalOpen(true)}
              className="shadow-xs mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Tarik Saldo ke Rekening PT</span>
            </button>
          </div>

          {/* Legalitas PT & NPWP Summary */}
          <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Pajak & Legalitas PT
                </h3>
                <p className="text-[10px] text-slate-400">
                  {store?.companyName || 'PT Gadget Jaya Sentosa'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                <span className="text-slate-400">NPWP Cabang PT</span>
                <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                  {store?.taxId || '01.428.910.4-015.000'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                <span className="text-slate-400">Faktur Pajak</span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Otomatis Terbit
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Periode Tutup Buku</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Akhir Bulan (Tgl 30/31)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Rekap Kas (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL DIALOG: PENARIKAN DANA (WITHDRAWAL)                               */}
      {/* ========================================================================= */}
      {isWithdrawModalOpen && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl duration-200 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                    Tarik Saldo ke Rekening PT
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pencairan langsung ke rekening resmi cabang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleWithdrawSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Rekening Tujuan Pencairan
                </label>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {store?.bankAccount?.bankName || 'Bank Mandiri'} ·{' '}
                      {store?.bankAccount?.accountName ||
                        store?.companyName ||
                        'PT Gadget Jaya Sentosa'}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {store?.bankAccount?.accountNumber || '1180 0192 8374 1'}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Nominal Penarikan
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Maks:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      Rp {stats.availableBalance.toLocaleString('id-ID')}
                    </strong>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    max={stats.availableBalance}
                    min={100000}
                    placeholder="misal: 50000000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none transition focus:border-slate-950 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                {stats.availableBalance > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[10000000, 50000000, stats.availableBalance]
                      .filter((val) => val <= stats.availableBalance)
                      .map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setWithdrawAmount(preset.toString())}
                          className="rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {preset === stats.availableBalance
                            ? 'Tarik Semua'
                            : `${preset / 1000000} Jt`}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 rounded-2xl border border-amber-200/60 bg-amber-50/80 p-3 text-[11px] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  Dana penarikan akan langsung diproses ke rekening{' '}
                  {store?.bankAccount?.bankName || 'Bank Mandiri'} PT cabang
                  dalam estimasi 1–5 menit tanpa biaya administrasi.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmittingWithdraw ||
                    !withdrawAmount ||
                    Number(withdrawAmount) > stats.availableBalance
                  }
                  className="shadow-xs inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  {isSubmittingWithdraw ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wallet className="h-3.5 w-3.5" />
                  )}
                  <span>Konfirmasi Penarikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
