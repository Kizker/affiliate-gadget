'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Loader2,
  ChevronDown,
  Receipt,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { PeriodSelect } from '@/components/dashboard/period-select'
import { StoreSelect } from '@/components/dashboard/store-select'

interface TransactionMutation {
  id: string
  refNumber: string
  title: string
  subtitle: string
  type: 'INCOME' | 'EXPENSE' | 'ESCROW' | 'PAYOUT'
  category: 'SALE' | 'COMMISSION' | 'WITHDRAWAL' | 'ESCROW' | 'PPH23'
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
  totalVatOutput?: number
  totalPph23Withheld?: number
  totalVatOnCommission?: number
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
    | 'ALL'
    | 'SALE'
    | 'COMMISSION'
    | 'WITHDRAWAL'
    | 'ESCROW'
    | 'PPH23'
    | 'GATEWAY'
    | 'MAINTENANCE'
  >('ALL')
  const [isDeadlineBannerDismissed, setIsDeadlineBannerDismissed] =
    useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingOrders, setIsExportingOrders] = useState(false)
  const [dateRange, setDateRange] = useState('thisMonth')

  // Pagination & Mobile Lazy Loading State
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10)
  const [isLoadingMoreMobile, setIsLoadingMoreMobile] = useState(false)
  const mobileSentinelRef = useRef<HTMLDivElement | null>(null)



  // Date Range Helper (Identik dengan Superadmin Reports, safe non-mutating)
  const getDateRange = (range: string) => {
    const now = new Date()
    let startDate: Date
    const endDate = new Date()

    switch (range) {
      case 'today': {
        const d = new Date(now.getTime())
        d.setHours(0, 0, 0, 0)
        startDate = d
        break
      }
      case 'thisWeek': {
        const d = new Date(now.getTime())
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        d.setDate(diff)
        d.setHours(0, 0, 0, 0)
        startDate = d
        break
      }
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'january':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate.setTime(
          new Date(now.getFullYear(), 1, 0, 23, 59, 59, 999).getTime()
        )
        break
      case 'february':
        startDate = new Date(now.getFullYear(), 1, 1)
        endDate.setTime(
          new Date(now.getFullYear(), 2, 0, 23, 59, 59, 999).getTime()
        )
        break
      case 'march':
        startDate = new Date(now.getFullYear(), 2, 1)
        endDate.setTime(
          new Date(now.getFullYear(), 3, 0, 23, 59, 59, 999).getTime()
        )
        break
      case 'april':
        startDate = new Date(now.getFullYear(), 3, 1)
        endDate.setTime(
          new Date(now.getFullYear(), 4, 0, 23, 59, 59, 999).getTime()
        )
        break
      case 'may':
        startDate = new Date(now.getFullYear(), 4, 1)
        endDate.setTime(
          new Date(now.getFullYear(), 5, 0, 23, 59, 59, 999).getTime()
        )
        break
      case 'june':
        startDate = new Date(now.getFullYear(), 5, 1)
        endDate.setTime(
          new Date(now.getFullYear(), 6, 0, 23, 59, 59, 999).getTime()
        )
        break
      case 'july':
        startDate = new Date(now.getFullYear(), 6, 1)
        endDate.setTime(
          new Date(now.getFullYear(), 7, 0, 23, 59, 59, 999).getTime()
        )
        break
      case 'august':
        startDate = new Date(now.getFullYear(), 7, 1)
        endDate.setTime(
          new Date(now.getFullYear(), 8, 0, 23, 59, 59, 999).getTime()
        )
        break
      case 'september':
        startDate = new Date(now.getFullYear(), 8, 1)
        endDate.setTime(
          new Date(now.getFullYear(), 9, 0, 23, 59, 59, 999).getTime()
        )
        break
      case 'october':
        startDate = new Date(now.getFullYear(), 9, 1)
        endDate.setTime(
          new Date(now.getFullYear(), 10, 0, 23, 59, 59, 999).getTime()
        )
        break
      case 'november':
        startDate = new Date(now.getFullYear(), 10, 1)
        endDate.setTime(
          new Date(now.getFullYear(), 11, 0, 23, 59, 59, 999).getTime()
        )
        break
      case 'december':
        startDate = new Date(now.getFullYear(), 11, 1)
        endDate.setTime(
          new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).getTime()
        )
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  }

  // Real-time API States
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [allStores, setAllStores] = useState<StoreOption[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')

  // Reset pagination when filter criteria change
  useEffect(() => {
    setCurrentPage(1)
    setMobileVisibleCount(itemsPerPage)
  }, [activeTab, searchQuery, dateRange, selectedStoreId, itemsPerPage])
  const [transactions, setTransactions] = useState<TransactionMutation[]>([])
  const [stats, setStats] = useState<FinanceStats>({
    availableBalance: 0,
    grossRevenue: 0,
    platformCommission: 0,
    escrowBalance: 0,
    totalUnitsSold: 0,
    totalWithdrawn: 0,
    completedNetRevenue: 0,
    totalVatOutput: 0,
    totalPph23Withheld: 0,
    totalVatOnCommission: 0,
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

        const { startDate, endDate } = getDateRange(dateRange)
        const params = new URLSearchParams({
          startDate,
          endDate,
        })
        if (selectedStoreId && selectedStoreId !== 'ALL') {
          params.append('storeId', selectedStoreId)
        }

        const res = await fetch(`/api/admin/finance?${params.toString()}`)
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
    [selectedStoreId, dateRange]
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

  // Mobile lazy loading calculations
  const mobileHasMore = mobileVisibleCount < filteredTransactions.length
  const displayedMobileTransactions = filteredTransactions.slice(
    0,
    mobileVisibleCount
  )

  const loadMoreMobile = useCallback(() => {
    if (isLoadingMoreMobile || !mobileHasMore) return
    setIsLoadingMoreMobile(true)
    setTimeout(() => {
      setMobileVisibleCount((prev) =>
        Math.min(prev + 8, filteredTransactions.length)
      )
      setIsLoadingMoreMobile(false)
    }, 250)
  }, [isLoadingMoreMobile, mobileHasMore, filteredTransactions.length])

  useEffect(() => {
    if (!mobileHasMore || isLoading) return
    const el = mobileSentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreMobile()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [mobileHasMore, isLoading, loadMoreMobile])

  const handlePageChange = (p: number) => {
    if (p < 1 || p > totalPages) return
    setCurrentPage(p)
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

  const renderTransactionItem = (tx: TransactionMutation) => (
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
                    : tx.category === 'PPH23'
                      ? 'border-rose-200/60 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
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
          {tx.type === 'EXPENSE' || tx.type === 'PAYOUT' ? '-' : ''}
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
  )

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
      const { startDate, endDate } = getDateRange(dateRange)
      const params = new URLSearchParams({
        type: 'financials',
        format: 'xlsx',
        startDate,
        endDate,
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
      a.download = `laporan_keuangan_${companyClean}_${dateRange}_${new Date().toISOString().split('T')[0]}.xlsx`
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

  // Handle Export Pesanan (Excel)
  const handleExportOrdersExcel = async () => {
    try {
      setIsExportingOrders(true)
      const { startDate, endDate } = getDateRange(dateRange)
      const params = new URLSearchParams({
        type: 'orders',
        format: 'xlsx',
        startDate,
        endDate,
      })
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId)
      } else if (store?.id) {
        params.append('storeId', store.id)
      }

      const res = await fetch(`/api/admin/reports/export?${params}`)
      if (!res.ok) {
        throw new Error('Gagal mengekspor laporan pesanan')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const companyClean = (store?.companyName || 'toko')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase()
      a.download = `laporan_pesanan_${companyClean}_${dateRange}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Laporan Pesanan berhasil diunduh!')
    } catch (err: any) {
      console.error('Error exporting orders report:', err)
      toast.error(err.message || 'Gagal mengekspor laporan pesanan toko')
    } finally {
      setIsExportingOrders(false)
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
      `buku-kas-${companyClean}-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`
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
  const todayDate = new Date().getDate()
  const isApproachingDeadline = todayDate >= 7 && todayDate <= 10
  const currentMonthName = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
  }).format(new Date())

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              Keuangan & Penarikan Dana
            </h1>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-extrabold text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              {store?.name || store?.companyName || 'Multi-PT Holding'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola saldo siap cair, mutasi kas per cabang PT, bagi hasil platform, pajak PPh 23, dan penarikan dana (withdraw) ke rekening resmi.
          </p>
        </div>
      </div>
      {/* Peringatan Deadline e-Billing DJP PPh 23 (Tgl 7-10) */}
      {!isDeadlineBannerDismissed &&
        (stats.totalPph23Withheld || 0) > 0 &&
        isApproachingDeadline && (
          <div className="shadow-2xs flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 p-3.5 text-amber-900 dark:border-amber-800/80 dark:from-amber-950/40 dark:to-orange-950/30 dark:text-amber-200 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-base">
                ⚠️
              </span>
              <p className="text-xs font-semibold leading-relaxed">
                <strong className="font-bold">Perhatian Perpajakan:</strong>{' '}
                Batas waktu setor PPh 23 via e-Billing DJP adalah{' '}
                <span className="font-bold underline decoration-amber-500">
                  Tgl 10 {currentMonthName}
                </span>
                . Nominal wajib setor:{' '}
                <span className="font-mono font-bold text-amber-950 dark:text-white">
                  Rp {(stats.totalPph23Withheld || 0).toLocaleString('id-ID')}
                </span>
                .
              </p>
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <a
                href="https://ebilling.pajak.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="shadow-2xs inline-flex items-center gap-1 whitespace-nowrap rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700 active:scale-95"
              >
                <span>Buat e-Billing DJP →</span>
              </a>
              <button
                type="button"
                onClick={() => setIsDeadlineBannerDismissed(true)}
                className="rounded-lg p-1 text-amber-700 transition hover:bg-amber-200/50 dark:text-amber-300 dark:hover:bg-amber-900/40"
                title="Tutup pemberitahuan"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

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
            { key: 'GATEWAY', label: 'Biaya Gateway' },
            { key: 'MAINTENANCE', label: 'Pemeliharaan' },
            { key: 'WITHDRAWAL', label: 'Pencairan' },
            { key: 'ESCROW', label: 'Dana Tertahan' },
            { key: 'PPH23', label: 'PPh 23' },
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
              {tab.key === 'PPH23' &&
                transactions.filter((t) => t.category === 'PPH23').length >
                  0 && (
                  <span className="py-0.2 ml-1.5 inline-flex items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
                    {transactions.filter((t) => t.category === 'PPH23').length}
                  </span>
                )}
            </button>
          ))}
        </div>

        {/* Search, Store Filter, Periode Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          {/* Multi-Store Selector (if Superadmin) */}
          {allStores.length > 0 && (
            <StoreSelect
              value={selectedStoreId || 'ALL'}
              onChange={(val) => setSelectedStoreId(val === 'ALL' ? '' : val)}
              stores={allStores}
            />
          )}

          {/* Periode Filter (Hari ini, Minggu ini, Bulan ini, Tahun ini, Per Bulan) */}
          <PeriodSelect
            value={dateRange}
            onChange={(val) => setDateRange(val)}
          />

          {/* Export Laporan Keuangan Button */}
          <button
            type="button"
            onClick={handleExportFinancialExcel}
            disabled={isExportingExcel}
            title="Download Laporan Keuangan Toko (Excel) sesuai filter periode"
            className="shadow-xs inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
          >
            {isExportingExcel ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Export Keuangan</span>
          </button>

          {/* Export Pesanan Button */}
          <button
            type="button"
            onClick={handleExportOrdersExcel}
            disabled={isExportingOrders}
            title="Download Rekap Pesanan Toko (Excel) sesuai filter periode"
            className="shadow-xs inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-950 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
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

            {/* Search Bar for Mutations */}
            <div className="mt-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari no. pesanan, resi, atau judul mutasi..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Reset ({filteredTransactions.length} hasil)
                </button>
              )}
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
                {/* 1. Desktop View (Paginated Table) */}
                <div className="hidden md:block">
                  <div className="divide-y divide-slate-100 pt-2 dark:divide-slate-800/60">
                    {paginatedDesktopTransactions.map(renderTransactionItem)}
                  </div>

                  {/* Desktop Pagination Bar */}
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

                        {/* Per-page selector pills */}
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
                                  ? 'bg-slate-900 text-white shadow-2xs dark:bg-white dark:text-slate-900'
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

                {/* 2. Mobile View (Lazy Loaded) */}
                <div className="block md:hidden">
                  <div className="divide-y divide-slate-100 pt-2 dark:divide-slate-800/60">
                    {displayedMobileTransactions.map(renderTransactionItem)}
                  </div>

                  {mobileHasMore ? (
                    <div
                      ref={mobileSentinelRef}
                      className="flex flex-col items-center justify-center py-5 text-center"
                    >
                      {isLoadingMoreMobile ? (
                        <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/80 px-4 py-1.5 text-xs font-semibold text-orange-600 shadow-2xs dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                          <span>Memuat mutasi berikutnya...</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={loadMoreMobile}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
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

          {/* Panel Kewajiban Setoran PPh 23 */}
          {(stats.totalPph23Withheld || 0) > 0 && (
            <div className="shadow-xs rounded-3xl border border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-white p-6 dark:border-amber-900/60 dark:from-amber-950/20 dark:to-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Kewajiban Setoran PPh 23
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      e-Billing DJP (Kode Akun 411124)
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  Wajib Setor
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                  <span className="text-slate-400">
                    Total PPh 23 Periode Ini
                  </span>
                  <span className="font-mono text-[12px] font-bold text-amber-700 dark:text-amber-400">
                    Rp {(stats.totalPph23Withheld || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                  <span className="text-slate-400">Batas Waktu Setor</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                    Tgl 10 Bulan Berikutnya
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400">Keterangan</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    2% atas Jasa Platform
                  </span>
                </div>
              </div>

              <a
                href="https://ebilling.pajak.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="shadow-2xs mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-amber-600 py-2.5 text-xs font-bold text-white transition hover:bg-amber-700 active:scale-95"
              >
                <span>Buka e-Billing DJP →</span>
              </a>
            </div>
          )}
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
