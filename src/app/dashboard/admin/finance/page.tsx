'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePageGuard } from '@/hooks/use-page-guard'
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  RefreshCw,
  DollarSign,
  Package,
  PackageCheck,
  Sparkles,
  BarChart3,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { PeriodSelect } from '@/components/dashboard/period-select'
import { StoreSelect } from '@/components/dashboard/store-select'
import { cn, maskEmail } from '@/lib/utils'

function maskPhone(phone: string): string {
  if (!phone) return '0812****1122'
  const clean = phone.replace(/[^0-9]/g, '')
  if (clean.length < 8) return phone
  return clean.replace(/(\d{4})\d+(\d{3})/, '$1****$2')
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

interface TransactionMutation {
  id: string
  refNumber: string
  title: string
  subtitle: string
  type: 'INCOME' | 'EXPENSE' | 'ESCROW' | 'PAYOUT'
  category: 'SALE' | 'COMMISSION' | 'WITHDRAWAL' | 'ESCROW' | 'GATEWAY'
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
  storeGMV?: number
  platformCommission: number
  escrowBalance: number
  totalUnitsSold: number
  totalWithdrawn: number
  completedNetRevenue: number
  totalVatOutput?: number
  totalVatOnCommission?: number
  totalGatewayFees?: number
  gatewayFeePerTransaction?: number
  totalCompletedOrders?: number
  platformCommissionRate?: number
  courierBreakdown: CourierBreakdown
}

interface StoreInfo {
  id: string
  name: string
  companyName: string
  taxId: string
  city: string
  phone?: string
  whatsapp?: string
  bankAccount: {
    bankName: string
    accountNumber: string
    accountName: string
  }
  bankAccountUpdatedAt?: string | null
  cooldownStatus?: {
    isLocked: boolean
    remainingHours: number
    remainingMinutes: number
    remainingSeconds: number
    lockedUntil: string | null
  }
}

interface StoreOption {
  id: string
  name: string
  companyName: string
  city: string
}

interface ReportData {
  isSuperAdmin?: boolean
  userRole?: string
  selectedStoreId?: string
  allStores?: StoreOption[]
  financials?: {
    grossRevenue: number
    cogs: number
    grossProfit: number
    grossMarginPct: number
    totalCompletedUnits?: number
    storeNetProfit?: number
    platformCommission?: number
    operationalExpenses: {
      platformCommission: number
      gatewayFee?: number
      packingCost: number
      voucherDiscount: number
      shipping: number
      insurance: number
      total: number
    }
    netProfit: number
    netMarginPct: number
    totalPph23Withheld?: number
    totalVatOutput?: number
  }
  salesTrend?: Array<{
    date: string
    label: string
    grossRevenue: number
    netProfit: number
    ordersCount: number
  }>
  revenue: {
    total: number
    grossRevenue?: number
    cogs?: number
    grossProfit?: number
    grossMarginPct?: number
    netProfit?: number
    netMarginPct?: number
    byCategory: {
      JASA: number
      SPAREPART: number
      SEWA: number
    }
    storeCount?: number
  }
  orders: {
    total: number
    byStatus: Record<string, number>
  }
  recentActivity?: Array<{
    id: string
    orderNumber: string
    createdAt: string
    total: number
    status: string
    user?: {
      name: string | null
      email: string | null
    }
    financials?: {
      grossRevenue: number
      cogs: number
      grossProfit: number
      grossMarginPct: number
      platformCommission: number
      packingCost: number
      voucherDiscount: number
      gatewayFee?: number
      netProfit: number
      netMarginPct: number
    }
  }>
  customers: {
    total: number
    new: number
    withOrders: number
    activeRate: string
  }
  products: {
    topSelling: Array<{
      id: string
      name: string
      totalSold: number
      revenue: number
      stock: number
      image: string | null
    }>
    lowStock: Array<{
      id: string
      name: string
      stock: number
      images: string[]
    }>
    total: number
    lowStockCount: number
    outOfStockCount: number
  }
  stores?: {
    total: number
    active: number
    topRated: Array<{
      id: string
      name: string
      companyName?: string
      city: string
      rating: number
      totalReview: number
      totalSales: number
      commissionRate?: number
      isOwnerStore?: boolean
    }>
  }
  mitras: {
    total: number
    approved: number
    pending: number
    topRated: Array<{
      id: string
      businessName: string
      city: string
      rating: number
      totalSales?: number
    }>
  }
}

export default function UnifiedFinanceAndReportsPage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/finance'
  )
  const { data: session } = useSession()

  // Main unified tab navigation
  const [mainView, setMainView] = useState<'REPORTS' | 'MUTATIONS' | 'ESCROW'>(
    'REPORTS'
  )

  // Sub-filter tabs for mutations ledger
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'SALE' | 'COMMISSION' | 'WITHDRAWAL' | 'ESCROW' | 'GATEWAY'
  >('ALL')

  const [searchQuery, setSearchQuery] = useState('')

  // 2-Step Withdrawal Modal & Security Gate States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawStep, setWithdrawStep] = useState<
    'STEP_1_INPUT' | 'STEP_2_OTP' | 'SUCCESS'
  >('STEP_1_INPUT')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawOtpCode, setWithdrawOtpCode] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false)
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300)
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0)
  const [withdrawalSuccessData, setWithdrawalSuccessData] = useState<{
    refNumber: string
    amount: number
    bankName: string
    accountNumber: string
    accountName: string
    requestedBy: string
    date: string
  } | null>(null)
  const [withdrawalError, setWithdrawalError] = useState<{
    code?: string
    message: string
  } | null>(null)

  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingOrders, setIsExportingOrders] = useState(false)
  const [dateRange, setDateRange] = useState('thisMonth')

  // Timer countdown untuk kedaluwarsa OTP & cooldown kirim ulang
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isWithdrawModalOpen && withdrawStep === 'STEP_2_OTP') {
      timer = setInterval(() => {
        setOtpExpirySeconds((prev) => Math.max(0, prev - 1))
        setOtpCooldownSeconds((prev) => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isWithdrawModalOpen, withdrawStep])

  // Pagination for mutations
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10)
  const [isLoadingMoreMobile, setIsLoadingMoreMobile] = useState(false)
  const mobileSentinelRef = useRef<HTMLDivElement | null>(null)

  // Pagination for order activity in reports view
  const [orderCurrentPage, setOrderCurrentPage] = useState(1)
  const orderItemsPerPage = 10

  // Date Range Helper (Identik dan aman non-mutating)
  const getDateRange = (range: string) => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    )

    switch (range) {
      case 'today': {
        const d = new Date(now.getTime())
        d.setHours(0, 0, 0, 0)
        startDate = d
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        )
        break
      }
      case 'thisWeek': {
        const d = new Date(now.getTime())
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        d.setDate(diff)
        d.setHours(0, 0, 0, 0)
        startDate = d
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        )
        break
      }
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        )
        break
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
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
          new Date(now.getFullYear(), 12, 0, 23, 59, 59, 999).getTime()
        )
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        )
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  }

  // Multi-Store Selector (Superadmin)
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [allStores, setAllStores] = useState<StoreOption[]>([])

  // Finance API State
  const [stats, setStats] = useState<FinanceStats>({
    availableBalance: 0,
    grossRevenue: 0,
    storeGMV: 0,
    platformCommission: 0,
    escrowBalance: 0,
    totalUnitsSold: 0,
    totalWithdrawn: 0,
    completedNetRevenue: 0,
    totalGatewayFees: 0,
    gatewayFeePerTransaction: 4000,
    totalCompletedOrders: 0,
    platformCommissionRate: 0.02,
    courierBreakdown: {
      paidCount: 0,
      inProgressCount: 0,
      shippedCount: 0,
      complainedCount: 0,
      totalEscrowOrders: 0,
    },
  })
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [transactions, setTransactions] = useState<TransactionMutation[]>([])

  // Reports API State (Safe initial defaults)
  const [reportData, setReportData] = useState<ReportData>({
    revenue: {
      total: 0,
      byCategory: { JASA: 0, SPAREPART: 0, SEWA: 0 },
    },
    orders: {
      total: 0,
      byStatus: {},
    },
    customers: { total: 0, new: 0, withOrders: 0, activeRate: '0.0' },
    products: {
      topSelling: [],
      lowStock: [],
      total: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    },
    mitras: { total: 0, approved: 0, pending: 0, topRated: [] },
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Fetch data dari Finance API & Reports API secara paralel
  const fetchUnifiedData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setIsLoading(true)
        setIsRefreshing(true)

        const { startDate, endDate } = getDateRange(dateRange)
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        if (selectedStoreId && selectedStoreId !== 'ALL') {
          params.append('storeId', selectedStoreId)
        }

        const [financeRes, reportsRes] = await Promise.all([
          fetch(`/api/admin/finance?${params.toString()}`),
          fetch(`/api/admin/reports?${params.toString()}`),
        ])

        if (!financeRes.ok) {
          throw new Error('Gagal mengambil data keuangan')
        }

        const financeJson = await financeRes.json()
        if (financeJson.success) {
          setStats(financeJson.stats)
          setStore(financeJson.store)
          setTransactions(financeJson.transactions || [])
          if (financeJson.allStores) {
            setAllStores(financeJson.allStores)
          }
        }

        if (reportsRes.ok) {
          const reportsJson = await reportsRes.json()
          const payload = reportsJson?.data || reportsJson
          if (payload) {
            setReportData({
              financials: payload.financials,
              salesTrend: payload.salesTrend,
              recentActivity: payload.recentActivity || [],
              revenue: payload.revenue || {
                total: 0,
                byCategory: { JASA: 0, SPAREPART: 0, SEWA: 0 },
              },
              orders: payload.orders || { total: 0, byStatus: {} },
              customers: payload.customers || {
                total: 0,
                new: 0,
                withOrders: 0,
                activeRate: '0.0',
              },
              products: payload.products || {
                topSelling: [],
                lowStock: [],
                total: 0,
                lowStockCount: 0,
                outOfStockCount: 0,
              },
              stores: payload.stores,
              mitras: payload.mitras || {
                total: 0,
                approved: 0,
                pending: 0,
                topRated: [],
              },
            })
          }
        }

        const nowStr = new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(new Date())
        setLastUpdated(nowStr)
      } catch (err: any) {
        console.error('Error loading unified finance data:', err)
        toast.error(
          err.message || 'Gagal menyinkronkan data keuangan & laporan'
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [selectedStoreId, dateRange]
  )

  useEffect(() => {
    fetchUnifiedData(true)

    // Auto sync berkala setiap 30 detik
    const interval = setInterval(() => {
      fetchUnifiedData(false)
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchUnifiedData])

  // Filter Transactions untuk Tab Mutasi
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
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
  }, [transactions, activeTab, searchQuery])

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
    const sentinel = mobileSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreMobile()
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [mobileHasMore, isLoading, loadMoreMobile])

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

  // Pagination for recent activity orders in reports tab
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

  // 2-Step Withdrawal Handlers
  const withdrawalTargetPhone = useMemo(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      return (
        (session?.user as any)?.phone ||
        store?.whatsapp ||
        store?.phone ||
        '081289001122'
      )
    }
    return store?.whatsapp || store?.phone || '081289001122'
  }, [session, store])

  const handleProceedToOtpStep = async () => {
    const numericAmount = Number(withdrawAmount.replace(/[^0-9]/g, ''))
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Masukkan nominal penarikan yang valid')
      return
    }
    if (numericAmount < 50000) {
      toast.error('Batas minimum penarikan adalah Rp 50.000')
      return
    }
    if (numericAmount > stats.availableBalance) {
      toast.error(
        `Saldo siap cair tidak mencukupi (Maks Rp ${stats.availableBalance.toLocaleString('id-ID')})`
      )
      return
    }
    if (store?.cooldownStatus?.isLocked) {
      toast.error(
        `Penarikan terkunci cooling-down 24 jam. Sisa waktu: ${store.cooldownStatus.remainingHours} jam ${store.cooldownStatus.remainingMinutes} menit.`
      )
      return
    }

    try {
      setIsSendingOtp(true)
      setWithdrawalError(null)

      const res = await fetch('/api/admin/finance/withdraw/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          storeId: store?.id,
          identifier: withdrawalTargetPhone,
        }),
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch {
        throw new Error(`Respon server tidak valid (HTTP ${res.status})`)
      }

      if (!res.ok) {
        setWithdrawalError({
          code: data.code,
          message: data.error || 'Gagal mengirim kode verifikasi OTP',
        })
        throw new Error(data.error || 'Gagal mengirim OTP')
      }

      toast.success(
        `Kode OTP 6-digit berhasil dikirim via WhatsApp ke ${maskPhone(withdrawalTargetPhone)}`
      )
      setWithdrawStep('STEP_2_OTP')
      setOtpExpirySeconds(300)
      setOtpCooldownSeconds(60)
    } catch (err: any) {
      console.error('Error sending withdraw OTP:', err)
      toast.error(err.message || 'Gagal mengirim kode verifikasi OTP')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleResendWithdrawOtp = async () => {
    if (otpCooldownSeconds > 0) return
    const numericAmount = Number(withdrawAmount.replace(/[^0-9]/g, ''))
    if (!numericAmount) return

    try {
      setIsSendingOtp(true)
      setWithdrawalError(null)

      const res = await fetch('/api/admin/finance/withdraw/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          storeId: store?.id,
          identifier: withdrawalTargetPhone,
        }),
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch {
        throw new Error(`Respon server tidak valid (HTTP ${res.status})`)
      }

      if (!res.ok) {
        setWithdrawalError({
          code: data.code,
          message: data.error || 'Gagal mengirim ulang OTP',
        })
        throw new Error(data.error || 'Gagal mengirim ulang OTP')
      }

      toast.success('Kode OTP baru telah dikirimkan ke WhatsApp resmi PT')
      setOtpExpirySeconds(300)
      setOtpCooldownSeconds(60)
    } catch (err: any) {
      console.error('Error resending OTP:', err)
      toast.error(err.message || 'Gagal mengirim ulang kode OTP')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleSubmitWithdrawVerification = async () => {
    const numericAmount = Number(withdrawAmount.replace(/[^0-9]/g, ''))
    if (!numericAmount || numericAmount <= 0) {
      toast.error('Nominal penarikan tidak valid')
      return
    }
    if (!withdrawOtpCode || withdrawOtpCode.trim().length !== 6) {
      toast.error('Masukkan 6 digit kode OTP verifikasi')
      return
    }

    try {
      setIsSubmittingWithdraw(true)
      setWithdrawalError(null)

      const res = await fetch('/api/admin/finance/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          storeId: store?.id,
          otpCode: withdrawOtpCode.trim(),
          identifier: withdrawalTargetPhone,
        }),
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch {
        throw new Error(`Respon server tidak valid (HTTP ${res.status})`)
      }

      if (!res.ok) {
        setWithdrawalError({
          code: data.code,
          message: data.error || 'Gagal memproses penarikan saldo',
        })

        if (data.code === 'COOLING_DOWN') {
          await fetchUnifiedData(false)
        }
        throw new Error(data.error || 'Gagal memproses penarikan saldo')
      }

      toast.success(
        data.message || 'Pencairan saldo PT berhasil diverifikasi dan diproses!'
      )
      setWithdrawalSuccessData({
        refNumber: data.data.refNumber,
        amount: data.data.amount,
        bankName: data.data.bankName,
        accountNumber: data.data.accountNumber,
        accountName: data.data.accountName,
        requestedBy: data.data.requestedBy,
        date: new Date().toLocaleString('id-ID'),
      })
      setWithdrawStep('SUCCESS')

      // Refresh saldo langsung
      await fetchUnifiedData(false)
    } catch (err: any) {
      console.error('Error withdrawing:', err)
      toast.error(err.message || 'Gagal memproses penarikan dana')
    } finally {
      setIsSubmittingWithdraw(false)
    }
  }

  const handleCloseWithdrawModal = () => {
    setIsWithdrawModalOpen(false)
    setWithdrawStep('STEP_1_INPUT')
    setWithdrawAmount('')
    setWithdrawOtpCode('')
    setWithdrawalError(null)
    setWithdrawalSuccessData(null)
  }

  // Handle Export Laporan Keuangan (Excel)
  const handleExportFinancialExcel = async () => {
    try {
      setIsExportingExcel(true)
      const { startDate, endDate } = getDateRange(dateRange)
      const params = new URLSearchParams({
        type: 'financials',
        format: 'xlsx',
      })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId)
      }

      const res = await fetch(`/api/admin/reports/export?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Gagal mengekspor laporan keuangan')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().slice(0, 10)
      const prefix = store?.companyName
        ? store.companyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
        : 'laporan'
      a.download = `laporan-keuangan-${prefix}-${dateRange}-${dateStr}.xlsx`
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

  // Handle Export Pesanan Toko (Excel)
  const handleExportOrdersExcel = async () => {
    try {
      setIsExportingOrders(true)
      const { startDate, endDate } = getDateRange(dateRange)
      const params = new URLSearchParams({
        type: 'orders',
        format: 'xlsx',
      })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId)
      }

      const res = await fetch(`/api/admin/reports/export?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Gagal mengekspor rekap pesanan')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().slice(0, 10)
      const prefix = store?.companyName
        ? store.companyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
        : 'pesanan'
      a.download = `rekap-pesanan-${prefix}-${dateRange}-${dateStr}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Rekap Pesanan berhasil diunduh!')
    } catch (err: any) {
      console.error('Error exporting orders report:', err)
      toast.error(err.message || 'Gagal mengekspor rekap pesanan')
    } finally {
      setIsExportingOrders(false)
    }
  }

  // Export Mutasi Kas (CSV)
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data mutasi untuk diekspor')
      return
    }

    const headers = [
      'No. Referensi',
      'Tanggal',
      'Kategori',
      'Deskripsi',
      'Keterangan',
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
  if (isLoading && !lastUpdated) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-6 pb-16">
        <div className="h-14 rounded-3xl bg-slate-200/80 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-32 rounded-3xl bg-slate-200/70 dark:bg-slate-800"
            />
          ))}
        </div>
        <div className="h-96 rounded-3xl bg-slate-200/70 dark:bg-slate-800" />
      </div>
    )
  }

  const courierBreakdown = stats?.courierBreakdown ?? {
    shippedCount: 0,
    inProgressCount: 0,
    paidCount: 0,
    complainedCount: 0,
    totalEscrowOrders: 0,
  }
  const isConsolidated =
    session?.user?.role === 'SUPER_ADMIN' &&
    (!selectedStoreId || selectedStoreId === 'ALL')

  // Render Individual Mutation Transaction Row
  const renderTransactionItem = (tx: TransactionMutation) => {
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

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & UNIFIED CONTROL BAR                                       */}
      {/* ========================================================================= */}
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
              setWithdrawStep('STEP_1_INPUT')
              setIsWithdrawModalOpen(true)
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
            onClick={handleExportFinancialExcel}
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
            onClick={handleExportOrdersExcel}
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
            {transactions.length > 0 && (
              <span className="py-0.2 ml-1 rounded-full bg-slate-200 px-1.5 text-[10px] font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {transactions.length}
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
            {courierBreakdown.totalEscrowOrders > 0 && (
              <span className="py-0.2 ml-1 rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white">
                {courierBreakdown.totalEscrowOrders}
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
              onClick={() => fetchUnifiedData(false)}
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

      {/* ========================================================================= */}
      {/* 2. TOP 5 UNIFIED FINANCIAL BENTO METRIC CARDS                             */}
      {/* ========================================================================= */}
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
                onClick={() => {
                  setWithdrawStep('STEP_1_INPUT')
                  setIsWithdrawModalOpen(true)
                }}
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

      {/* ========================================================================= */}
      {/* 3. MAIN TAB CONTENT: 1) LAPORAN LABA RUGI & ANALITIK                      */}
      {/* ========================================================================= */}
      {mainView === 'REPORTS' && (
        <div className="space-y-5 duration-200 animate-in fade-in">
          {/* Panel Rincian Beban Transaksi & Logistik Terproteksi */}
          {(() => {
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
                            reportData.financials?.operationalExpenses
                              ?.packingCost ?? 0
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">
                          Diskon Voucher Toko
                        </span>
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
                            reportData.financials?.operationalExpenses
                              ?.gatewayFee ?? 0
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
                            reportData.financials?.operationalExpenses
                              ?.shipping ?? 0
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">
                          Asuransi Wajib Pengiriman (0.2%)
                        </span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {formatRupiah(
                            reportData.financials?.operationalExpenses
                              ?.insurance ?? 0
                          )}
                        </span>
                      </div>
                      <p className="pt-1 text-[11px] leading-relaxed text-blue-700/80 dark:text-blue-300/80">
                        🛡️ Transparan: Biaya logistik dan asuransi penuh
                        dipungut dari customer dan diteruskan ke ekspedisi
                        Biteship. Tidak memotong omzet maupun laba bersih toko.
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
                      Pelanggan ({reportData.customers?.activeRate ?? '0.0'}%
                      Repeat)
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
            )
          })()}

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
                          (reportData.financials?.grossRevenue || 1000000) *
                          0.2,
                        netProfit:
                          (reportData.financials?.netProfit || 200000) * 0.2,
                        ordersCount: 1,
                      },
                      {
                        date: '2',
                        label: 'Minggu 2',
                        grossRevenue:
                          (reportData.financials?.grossRevenue || 1000000) *
                          0.35,
                        netProfit:
                          (reportData.financials?.netProfit || 200000) * 0.35,
                        ordersCount: 2,
                      },
                      {
                        date: '3',
                        label: 'Minggu 3',
                        grossRevenue:
                          (reportData.financials?.grossRevenue || 1000000) *
                          0.25,
                        netProfit:
                          (reportData.financials?.netProfit || 200000) * 0.25,
                        ordersCount: 1,
                      },
                      {
                        date: '4',
                        label: 'Minggu 4',
                        grossRevenue:
                          (reportData.financials?.grossRevenue || 1000000) *
                          0.2,
                        netProfit:
                          (reportData.financials?.netProfit || 200000) * 0.2,
                        ordersCount: 1,
                      },
                    ]

              const maxVal = Math.max(
                ...rawTrends.map((t) =>
                  Math.max(t.grossRevenue, t.netProfit, 1)
                )
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
                          Math.round(
                            (safeNetProfit / maxVal) * chartMaxHeightPx
                          )
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
                                Laba: {formatRupiah(point.netProfit)} (
                                {marginPct}%)
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
                        {reportData.financials?.netMarginPct ?? 0}% Margin
                        Bersih
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-800/30">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Total Volume Transaksi
                      </span>
                      <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {reportData.orders?.total ?? 0} Transaksi Selesai &
                        Diproses
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
                  Rincian kalkulasi omzet kotor, modal HPP, beban operasional,
                  dan laba bersih per transaksi
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
                        order.status === 'CANCELLED' ||
                        order.status === 'RETURNED'
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
                            Number(
                              ((grossProfit / grossRevenue) * 100).toFixed(1)
                            ))
                          : 0
                      const comm = isCancelled
                        ? 0
                        : (fin?.platformCommission ?? 0)
                      const pack = isCancelled ? 0 : (fin?.packingCost ?? 5000)
                      const disc = isCancelled ? 0 : (fin?.voucherDiscount ?? 0)
                      const totalExpense = isCancelled ? 0 : comm + pack + disc
                      const netProfit = isCancelled
                        ? 0
                        : (fin?.netProfit ?? grossProfit - totalExpense)
                      const netMargin =
                        !isCancelled && grossRevenue > 0
                          ? (fin?.netMarginPct ??
                            Number(
                              ((netProfit / grossRevenue) * 100).toFixed(1)
                            ))
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
                    {reportData.stores?.active ??
                      reportData.mitras?.approved ??
                      0}
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
      )}

      {/* ========================================================================= */}
      {/* 4. MAIN TAB CONTENT: 2) BUKU KAS & MUTASI TRANSAKSI                       */}
      {/* ========================================================================= */}
      {mainView === 'MUTATIONS' && (
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
                      {paginatedDesktopTransactions.map(renderTransactionItem)}
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
                            onClick={() =>
                              handlePageChange(safeCurrentPage - 1)
                            }
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
                            onClick={() =>
                              handlePageChange(safeCurrentPage + 1)
                            }
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
                      {displayedMobileTransactions.map(renderTransactionItem)}
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
                              ({mobileVisibleCount} /{' '}
                              {filteredTransactions.length})
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
                        Perubahan rekening bank terdeteksi. Demi keamanan dana
                        PT, penarikan saldo dikunci sementara hingga{' '}
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
                  setWithdrawStep('STEP_1_INPUT')
                  setIsWithdrawModalOpen(true)
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
      )}

      {/* ========================================================================= */}
      {/* 5. MAIN TAB CONTENT: 3) PROTEKSI SALDO ESCROW & KURIR                     */}
      {/* ========================================================================= */}
      {mainView === 'ESCROW' && (
        <div className="space-y-5 duration-200 animate-in fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  Dalam Pengiriman Kurir
                </span>
                <span className="rounded-full bg-blue-200 px-2 py-0.5 text-[10px] font-black text-blue-800">
                  SHIPPED
                </span>
              </div>
              <p className="mt-3 font-mono text-2xl font-bold text-blue-950 dark:text-blue-200">
                {courierBreakdown.shippedCount}
              </p>
              <p className="mt-1 text-[11px] text-blue-700 dark:text-blue-300">
                Kurir JNE / Gojek sedang menuju alamat pembeli
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Sedang Dipacking Toko
                </span>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-800">
                  IN_PROGRESS
                </span>
              </div>
              <p className="mt-3 font-mono text-2xl font-bold text-amber-950 dark:text-amber-200">
                {courierBreakdown.inProgressCount}
              </p>
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                Menunggu kurir Biteship melakukan pickup
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Pembayaran Terverifikasi
                </span>
                <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                  PAID
                </span>
              </div>
              <p className="mt-3 font-mono text-2xl font-bold text-emerald-950 dark:text-emerald-200">
                {courierBreakdown.paidCount}
              </p>
              <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                Dana aman tersimpan di Rekening Escrow Midtrans
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-5 dark:border-rose-900/40 dark:bg-rose-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
                  Ditahan Komplain Retur
                </span>
                <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-black text-rose-800">
                  COMPLAINED
                </span>
              </div>
              <p className="mt-3 font-mono text-2xl font-bold text-rose-950 dark:text-rose-200">
                {courierBreakdown.complainedCount}
              </p>
              <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-300">
                Dana ditahan hingga investigasi retur garansi selesai
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Prinsip Keamanan Rekening Escrow Midtrans & Perlindungan Saldo
            </h3>
            <div className="mt-3 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <p className="leading-relaxed">
                1. <strong>Pelepasan Otomatis:</strong> Dana penjualan ditahan
                secara aman di Rekening Escrow resmi Midtrans dan otomatis
                dilepaskan ke <strong>Saldo Siap Cair</strong> saat pesanan
                berstatus{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  COMPLETED
                </span>{' '}
                (pembeli mengonfirmasi pesanan diterima atau 3 hari pasca tiba
                kurir).
              </p>
              <p className="leading-relaxed">
                2. <strong>Perlindungan Beban Pengembalian:</strong> Jika
                terjadi klaim garansi 30 hari atau retur ganti unit baru, saldo
                escrow pesanan tersebut diproteksi hingga toko menyelesaikan
                servis/pengiriman unit pengganti kurir Biteship.
              </p>
              <p className="leading-relaxed">
                3. <strong>Pencairan Mandiri:</strong> Saldo yang telah selesai
                dapat langsung dicairkan kapan saja ke Rekening Bank Mandiri PT
                resmi cabang toko menggunakan verifikasi OTP 2FA WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL DIALOG: PENARIKAN DANA (2-STEP SECURITY GATE)                     */}
      {/* ========================================================================= */}
      {isWithdrawModalOpen && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl duration-200 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {withdrawStep === 'SUCCESS'
                      ? 'Pencairan Berhasil'
                      : withdrawStep === 'STEP_2_OTP'
                        ? 'Verifikasi Keamanan OTP (2FA)'
                        : 'Tarik Saldo ke Rekening PT'}
                  </h3>
                  {withdrawStep !== 'SUCCESS' && (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {withdrawStep === 'STEP_1_INPUT'
                        ? 'Tahap 1/2'
                        : 'Tahap 2/2'}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {withdrawStep === 'SUCCESS'
                    ? 'Bukti pencairan resmi telah diterbitkan'
                    : withdrawStep === 'STEP_2_OTP'
                      ? 'Verifikasi WhatsApp resmi nomor terdaftar'
                      : 'Pencairan ke rekening bank resmi cabang'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseWithdrawModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {withdrawalError && (
              <div className="mt-3.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-bold">
                      {withdrawalError.code === 'COOLING_DOWN'
                        ? 'Penarikan Terkunci (Cooling-down)'
                        : withdrawalError.code === 'ACCOUNT_NAME_MISMATCH'
                          ? 'Kesesuaian Nama Rekening Ditolak'
                          : withdrawalError.code === 'OTP_BLOCKED'
                            ? 'Kode OTP Diblokir'
                            : 'Gagal Memproses Permintaan'}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      {withdrawalError.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Form Nominal & Rekening */}
            {withdrawStep === 'STEP_1_INPUT' && (
              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                    Rekening Tujuan Pencairan
                  </label>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
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
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-slate-400">
                      Nominal Penarikan
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400">
                        Maks:{' '}
                        <strong className="font-semibold text-slate-700 dark:text-slate-200">
                          Rp {stats.availableBalance.toLocaleString('id-ID')}
                        </strong>
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">
                        ·
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (stats.availableBalance > 0) {
                            setWithdrawAmount(stats.availableBalance.toString())
                          } else {
                            toast.error('Saldo siap cair saat ini Rp 0')
                          }
                        }}
                        className="cursor-pointer font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700 dark:text-white dark:hover:text-slate-200"
                      >
                        Tarik Semua
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={
                        withdrawAmount
                          ? Number(
                              withdrawAmount.replace(/[^0-9]/g, '')
                            ).toLocaleString('id-ID')
                          : ''
                      }
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9]/g, '')
                        setWithdrawAmount(clean)
                      }}
                      placeholder="500.000"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 font-mono text-sm font-bold text-slate-900 placeholder-slate-300 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Batas minimal penarikan Rp 50.000 (Bebas biaya transfer
                    bank)
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Verifikasi 2FA OTP akan dikirimkan ke nomor WhatsApp:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {maskPhone(withdrawalTargetPhone)}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseWithdrawModal}
                    className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToOtpStep}
                    disabled={
                      isSendingOtp ||
                      !withdrawAmount ||
                      Number(withdrawAmount) <= 0
                    }
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                  >
                    {isSendingOtp ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="h-3.5 w-3.5" />
                    )}
                    <span>Kirim OTP & Lanjutkan</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Input OTP */}
            {withdrawStep === 'STEP_2_OTP' && (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                  <p className="font-semibold">
                    Kode OTP 6-Digit Terkirim via WhatsApp
                  </p>
                  <p className="mt-0.5 text-[11px] text-blue-800/80 dark:text-blue-300/80">
                    Masukkan kode keamanan yang diterima di{' '}
                    <strong>{maskPhone(withdrawalTargetPhone)}</strong> untuk
                    mencairkan nominal{' '}
                    <strong>
                      Rp {Number(withdrawAmount).toLocaleString('id-ID')}
                    </strong>
                  </p>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-slate-400">
                      Kode Verifikasi (OTP)
                    </label>
                    <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {Math.floor(otpExpirySeconds / 60)}:
                      {(otpExpirySeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={withdrawOtpCode}
                    onChange={(e) =>
                      setWithdrawOtpCode(
                        e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                      )
                    }
                    placeholder="123456"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center font-mono text-xl font-black tracking-widest text-slate-900 placeholder-slate-300 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Tidak menerima kode?</span>
                  <button
                    type="button"
                    onClick={handleResendWithdrawOtp}
                    disabled={isSendingOtp || otpCooldownSeconds > 0}
                    className="font-bold text-slate-800 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 dark:text-slate-200"
                  >
                    {otpCooldownSeconds > 0
                      ? `Kirim Ulang (${otpCooldownSeconds}d)`
                      : 'Kirim Ulang OTP'}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setWithdrawStep('STEP_1_INPUT')}
                    className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitWithdrawVerification}
                    disabled={
                      isSubmittingWithdraw || withdrawOtpCode.length !== 6
                    }
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingWithdraw ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>Verifikasi & Cairkan Dana</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Sukses */}
            {withdrawStep === 'SUCCESS' && withdrawalSuccessData && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-col items-center justify-center py-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                    Penarikan Saldo Berhasil Diproses!
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Dana telah diteruskan ke sistem kliring Bank Mandiri
                  </p>
                </div>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-400">No. Referensi:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {withdrawalSuccessData.refNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-400">Nominal Penarikan:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Rp {withdrawalSuccessData.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-400">Rekening Tujuan:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {withdrawalSuccessData.bankName}{' '}
                      {withdrawalSuccessData.accountNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-400">Pemilik Rekening:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {withdrawalSuccessData.accountName}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseWithdrawModal}
                  className="w-full cursor-pointer rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  Selesai & Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
