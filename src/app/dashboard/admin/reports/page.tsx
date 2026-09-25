'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import {
  Package,
  Download,
  Calendar,
  Loader2,
  DollarSign,
  TrendingUp,
  Sparkles,
  Receipt,
  Percent,
  FileText,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { PeriodSelect } from '@/components/dashboard/period-select'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

interface ReportData {
  financials?: {
    grossRevenue: number
    cogs: number
    grossProfit: number
    grossMarginPct: number
    operationalExpenses: {
      platformCommission: number
      gatewayFee?: number
      maintenanceFee?: number
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
    byStatus: {
      PENDING_PAYMENT: number
      PAID: number
      IN_PROGRESS: number
      SHIPPED?: number
      COMPLETED: number
      CANCELLED: number
      RETURNED?: number
      COMPLAINED?: number
    }
  }
  technicians: {
    performance: Array<{
      id: string
      name: string
      email: string
      totalOrders: number
      totalRevenue: number
      rating: number
      totalReviews: number
    }>
  }
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
      totalReview: number
      totalViews: number
    }>
  }
  warranties: {
    active: number
    expired: number
    total: number
    claims: number
    claimRate: string
  }
  complaints?: {
    total: number
    byStatus: {
      OPEN: number
      IN_PROGRESS: number
      RESOLVED: number
      REJECTED: number
    }
    avgResolutionTime: string
    recent: Array<{
      id: string
      subject: string
      status: string
      createdAt: string
      user: {
        name: string | null
        email: string
      }
      order: {
        orderNumber: string
      }
    }>
  }
  returns?: {
    total: number
    byStatus: {
      PENDING: number
      IN_REVIEW: number
      APPROVED: number
      REJECTED: number
      COMPLETED: number
    }
  }
  tickets: {
    total: number
    byStatus: {
      OPEN: number
      PENDING_APPROVAL: number
      APPROVED: number
      REJECTED: number
      RESOLVED: number
      CLOSED: number
    }
    avgResolutionTime: string
    recent: Array<{
      id: string
      subject: string
      status: string
      createdAt: string
      user: {
        name: string | null
        email: string
      }
      order: {
        orderNumber: string
      }
    }>
  }
  recentActivity: Array<{
    id: string
    orderNumber: string
    status: string
    total: number
    createdAt: Date | string
    user: {
      name: string | null
      email: string
    }
    financials?: {
      grossRevenue: number
      cogs: number
      grossProfit: number
      grossMarginPct: number
      platformCommission: number
      packingCost: number
      voucherDiscount: number
      shippingCost: number
      insuranceFee: number
      netProfit: number
      netMarginPct: number
    }
  }>
}

export default function ReportsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('thisMonth')
  const [exporting, setExporting] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchReportData()
    setCurrentPage(1)
  }, [dateRange])

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    const endDate = new Date()

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'thisWeek':
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        startDate = new Date(now.setDate(diff))
        startDate.setHours(0, 0, 0, 0)
        break
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

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const { startDate, endDate } = getDateRange()
      const params = new URLSearchParams({ startDate, endDate })

      const res = await fetch(`/api/admin/reports?${params}`)

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) throw new Error('Failed to fetch report data')

      const result = await res.json()
      setData(result.data)
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: string, format: 'xlsx' | 'csv') => {
    try {
      setExporting(`${type}_${format}`)
      const { startDate, endDate } = getDateRange()
      const params = new URLSearchParams({ type, format, startDate, endDate })

      const res = await fetch(`/api/admin/reports/export?${params}`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const fileLabel =
        type === 'financials' || type === 'pnl'
          ? 'laporan_keuangan'
          : 'laporan_pesanan'
      a.download = `${fileLabel}_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting:', error)
      toast({
        title: 'Gagal export data',
        description: 'Coba lagi beberapa saat.',
        variant: 'destructive',
      })
    } finally {
      setExporting(null)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-900 dark:text-white" />
      </div>
    )
  }

  if (!data) return null

  const recentOrders = data.recentActivity || []
  const totalOrderPages = Math.max(
    1,
    Math.ceil(recentOrders.length / ITEMS_PER_PAGE)
  )
  const orderStartIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const orderEndIndex = Math.min(
    orderStartIndex + ITEMS_PER_PAGE,
    recentOrders.length
  )
  const paginatedOrders = recentOrders.slice(orderStartIndex, orderEndIndex)

  const handleOrderPageChange = (p: number) => {
    if (p < 1 || p > totalOrderPages) return
    setCurrentPage(p)
  }

  const getOrderPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalOrderPages <= 5) {
      for (let i = 1; i <= totalOrderPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalOrderPages)
      } else if (currentPage >= totalOrderPages - 2) {
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
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalOrderPages
        )
      }
    }
    return pages
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16 pt-1">
      {/* Top Filter Bar (Zero title noise, compact period filter & quick export) */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/admin/finance"
            className="shadow-xs inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Buka halaman Keuangan & Tarik Saldo (Withdraw)"
          >
            <Wallet className="h-3.5 w-3.5 text-orange-500" />
            <span>Keuangan & Tarik Saldo (Withdraw)</span>
          </Link>

          <button
            onClick={() => handleExport('financials', 'xlsx')}
            disabled={exporting === 'financials_xlsx'}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
            title="Download Laporan Keuangan"
          >
            {exporting === 'financials_xlsx' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Export Laporan Keuangan</span>
          </button>
        </div>

        <PeriodSelect
          value={dateRange}
          onChange={(val) => setDateRange(val)}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP FINANCIAL METRIC CARDS (Kalkulasi Laporan Keuangan E-Commerce)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {/* Card 1: Pendapatan Kotor (Gross Revenue) */}
        <div className="shadow-2xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Pendapatan Kotor
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="font-sans text-lg font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {formatRupiah(
                data.financials?.grossRevenue ?? data.revenue.total
              )}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                Gross Sales
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Sebelum potongan beban
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total HPP (Modal Unit) */}
        <div className="shadow-2xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total HPP (Modal)
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="font-sans text-lg font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {formatRupiah(data.financials?.cogs ?? 0)}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Harga Pokok
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Modal dasar inventori
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Laba Kotor (Gross Profit) */}
        <div className="shadow-2xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Laba Kotor
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="font-sans text-lg font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {formatRupiah(data.financials?.grossProfit ?? 0)}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                Margin {data.financials?.grossMarginPct ?? 0}%
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Omzet - HPP
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Laba Bersih Toko (Net Profit) */}
        <div className="shadow-2xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Laba Bersih Toko
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="font-sans text-lg font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {formatRupiah(data.financials?.netProfit ?? 0)}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                Net {data.financials?.netMarginPct ?? 0}%
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Setelah potongan beban
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row Kartu Perpajakan (PPN & PPh) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {/* Card PPN Keluaran */}
        <div className="shadow-2xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              PPN Keluaran Terkumpul
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <FileText className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="font-sans text-lg font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {formatRupiah(data.financials?.totalVatOutput ?? 0)}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                SPT Masa PPN
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · PPN Terutang Konsolidasi
              </span>
            </div>
          </div>
        </div>

        {/* Card PPh 23 Wajib Setor */}
        {(data.financials?.totalPph23Withheld ?? 0) > 0 && (
          <div className="shadow-2xs group flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-amber-50/20 p-4 transition-all duration-200 hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-950/10 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                PPh 23 Wajib Setor
              </span>
              <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                <Receipt className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="font-sans text-lg font-bold tabular-nums tracking-tight text-amber-900 dark:text-amber-100 sm:text-xl">
                {formatRupiah(data.financials?.totalPph23Withheld ?? 0)}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  e-Billing DJP
                </span>
                <span className="text-amber-600/80 dark:text-amber-500">
                  · 2% komisi platform · Batas Tgl 10
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2.5 PANEL RINCIAN BEBAN TRANSAKSI & LOGISTIK TERPROTEKSI                 */}
      {/* ========================================================================= */}
      <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Rincian Beban Transaksi & Logistik Terproteksi
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Biaya operasional penjualan handphone dan status asuransi
              pengiriman
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Total Beban Toko:{' '}
            <strong className="font-mono text-slate-900 dark:text-white">
              {formatRupiah(data.financials?.operationalExpenses.total ?? 0)}
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
                {formatRupiah(data.financials?.operationalExpenses.total ?? 0)}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Komisi Platform (2%)</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(
                    data.financials?.operationalExpenses.platformCommission ?? 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Biaya Packing (Rp 5.000 / Pesanan)
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(
                    data.financials?.operationalExpenses.packingCost ?? 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Diskon Voucher Toko</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(
                    data.financials?.operationalExpenses.voucherDiscount ?? 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Biaya Payment Gateway (QRIS/VA/CC)
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(
                    data.financials?.operationalExpenses.gatewayFee ?? 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Biaya Pemeliharaan Sistem E-Commerce
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(
                    data.financials?.operationalExpenses.maintenanceFee ?? 0
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
                    data.financials?.operationalExpenses.shipping ?? 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Asuransi Wajib Pengiriman (0.2%)
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(
                    data.financials?.operationalExpenses.insurance ?? 0
                  )}
                </span>
              </div>
              <p className="pt-1 text-[11px] leading-relaxed text-blue-700/80 dark:text-blue-300/80">
                🛡️ Transparan: Biaya logistik dan asuransi penuh dipungut dari
                customer dan diteruskan ke ekspedisi. Tidak memotong omzet
                maupun laba bersih toko.
              </p>
            </div>
          </div>
        </div>

        {/* Operational Strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800/80 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="font-mono text-base font-bold text-slate-900 dark:text-white">
              {data.orders.total}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Total Transaksi
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="font-mono text-base font-bold text-slate-900 dark:text-white">
              {data.customers.total}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Pelanggan ({data.customers.activeRate}% Repeat)
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="font-mono text-base font-bold text-orange-600 dark:text-orange-400">
              {data.products.lowStockCount}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Stok Menipis
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
              {data.revenue.storeCount ??
                data.stores?.active ??
                data.mitras.approved ??
                0}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Toko Jaringan Aktif
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2.8 ANALITIK TREN PENJUALAN & PERFORMA FINANSIAL                         */}
      {/* ========================================================================= */}
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
            data.salesTrend && data.salesTrend.length > 0
              ? data.salesTrend
              : [
                  {
                    date: '1',
                    label: 'Minggu 1',
                    grossRevenue:
                      (data.financials?.grossRevenue || 1000000) * 0.2,
                    netProfit: (data.financials?.netProfit || 200000) * 0.2,
                    ordersCount: 1,
                  },
                  {
                    date: '2',
                    label: 'Minggu 2',
                    grossRevenue:
                      (data.financials?.grossRevenue || 1000000) * 0.35,
                    netProfit: (data.financials?.netProfit || 200000) * 0.35,
                    ordersCount: 2,
                  },
                  {
                    date: '3',
                    label: 'Minggu 3',
                    grossRevenue:
                      (data.financials?.grossRevenue || 1000000) * 0.25,
                    netProfit: (data.financials?.netProfit || 200000) * 0.25,
                    ordersCount: 1,
                  },
                  {
                    date: '4',
                    label: 'Minggu 4',
                    grossRevenue:
                      (data.financials?.grossRevenue || 1000000) * 0.2,
                    netProfit: (data.financials?.netProfit || 200000) * 0.2,
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
              {/* Chart Container with Y-Axis Guidelines & Baseline */}
              <div className="relative border-b border-slate-100 dark:border-slate-800 pb-2">
                {/* Background Guidelines */}
                <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[150px] flex-col justify-between">
                  <div className="border-b border-dashed border-slate-100 dark:border-slate-800/60" />
                  <div className="border-b border-dashed border-slate-100 dark:border-slate-800/60" />
                  <div className="border-b border-dashed border-slate-100 dark:border-slate-800/60" />
                </div>

                {/* Bars Row */}
                <div className="relative flex h-[190px] items-end gap-3 sm:gap-6 overflow-x-auto px-2">
                  {rawTrends.map((point, idx) => {
                    const grossHeightPx = Math.max(
                      12,
                      Math.round((point.grossRevenue / maxVal) * chartMaxHeightPx)
                    )
                    const safeNetProfit = Math.max(0, point.netProfit)
                    const netHeightPx = Math.max(
                      8,
                      Math.round((safeNetProfit / maxVal) * chartMaxHeightPx)
                    )
                    const marginPct =
                      point.grossRevenue > 0
                        ? ((point.netProfit / point.grossRevenue) * 100).toFixed(1)
                        : '0.0'

                    return (
                      <div
                        key={idx}
                        className="group relative flex h-full min-w-[56px] sm:min-w-[72px] flex-1 flex-col items-center justify-end"
                      >
                        {/* Hover Tooltip Popup */}
                        <div className="pointer-events-none absolute top-2 z-30 hidden -translate-x-1/2 flex-col items-center rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-[10px] text-white shadow-2xl backdrop-blur-xs group-hover:flex">
                          <span className="font-bold text-slate-300">
                            {point.label} ({point.ordersCount || 1} Order)
                          </span>
                          <span className="whitespace-nowrap font-mono font-bold text-blue-400">
                            Omzet: {formatRupiah(point.grossRevenue)}
                          </span>
                          <span className="whitespace-nowrap font-mono font-bold text-purple-400">
                            Laba: {formatRupiah(point.netProfit)} ({marginPct}%)
                          </span>
                        </div>

                        {/* Bars Container with Fixed Height Baseline */}
                        <div className="flex h-[150px] w-full items-end justify-center gap-1.5 sm:gap-2">
                          {/* Omzet Bar */}
                          <div
                            style={{ height: `${grossHeightPx}px` }}
                            className="w-3.5 sm:w-5 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 shadow-xs transition-all duration-300 group-hover:from-blue-500 group-hover:to-blue-300"
                            title={`Omzet: ${formatRupiah(point.grossRevenue)}`}
                          />
                          {/* Laba Bersih Bar */}
                          <div
                            style={{ height: `${netHeightPx}px` }}
                            className="w-3.5 sm:w-5 rounded-t-md bg-gradient-to-t from-purple-600 to-purple-400 shadow-xs transition-all duration-300 group-hover:from-purple-500 group-hover:to-purple-300"
                            title={`Laba: ${formatRupiah(point.netProfit)}`}
                          />
                        </div>

                        {/* X-axis Date Label */}
                        <div className="mt-2 text-center">
                          <span className="block truncate text-[10px] sm:text-[11px] font-semibold text-slate-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400 transition-colors">
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
                        (data.financials?.grossRevenue ?? data.revenue.total) /
                          Math.max(1, rawTrends.length)
                      )
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Rasio Efisiensi Margin Laba
                  </span>
                  <p className="mt-1 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {data.financials?.netMarginPct ?? 0}% Margin Bersih
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Volume Transaksi
                  </span>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {data.orders.total} Transaksi Selesai & Diproses
                  </p>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ========================================================================= */}
      {/* 3. PRODUCTS & TOKO PERFORMANCE INSIGHTS                                  */}
      {/* ========================================================================= */}
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
            <button
              onClick={() => handleExport('products', 'xlsx')}
              disabled={exporting === 'products'}
              className="dark:hover:bg-slate-750 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {exporting === 'products' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span>Export</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 pt-1 dark:divide-slate-800/60">
            {!data.products.topSelling ||
            data.products.topSelling.length === 0 ? (
              <div className="py-8 text-center text-xs font-semibold text-slate-400">
                Belum ada data penjualan pada periode ini
              </div>
            ) : (
              data.products.topSelling.slice(0, 4).map((product, index) => {
                const totalRev =
                  data.financials?.grossRevenue ?? data.revenue.total ?? 1
                const sharePct = Math.min(
                  100,
                  Math.round(((product.revenue || 0) / Math.max(1, totalRev)) * 100)
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
                    {/* Progress Bar Kontribusi Penjualan */}
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
              {data.stores?.active ?? data.mitras.approved} Aktif
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pb-3 pt-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center dark:border-slate-800/80 dark:bg-slate-800/40">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {data.stores?.total ?? data.mitras.total}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Total Toko
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center dark:border-slate-800/80 dark:bg-slate-800/40">
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {data.stores?.active ?? data.mitras.approved}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Toko Aktif
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center dark:border-slate-800/80 dark:bg-slate-800/40">
              <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                {data.stores?.topRated?.reduce(
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
            {(data.stores?.topRated && data.stores.topRated.length > 0
              ? data.stores.topRated
              : data.mitras.topRated
            )
              .slice(0, 2)
              .map(
                (store: {
                  id: string
                  name?: string
                  businessName?: string
                  city: string
                  totalSales?: number
                  rating: number
                }) => (
                  <div
                    key={store.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/40 p-2.5 dark:border-slate-800/80 dark:bg-slate-800/30"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {store.name || store.businessName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {store.city}{' '}
                        {store.totalSales !== undefined
                          ? `· ${store.totalSales} penjualan`
                          : ''}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      ⭐ {store.rating.toFixed(1)}
                    </span>
                  </div>
                )
              )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. AKTIVITAS TRANSAKSI FINANSIAL TERBARU                                 */}
      {/* ========================================================================= */}
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
            {data.recentActivity?.length || 0} Transaksi Terkini
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
              {!data.recentActivity || data.recentActivity.length === 0 ? (
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
                  const fin = order.financials
                  const grossRevenue = fin?.grossRevenue ?? order.total
                  const cogs = fin?.cogs ?? 0
                  const grossProfit = fin?.grossProfit ?? grossRevenue - cogs
                  const grossMargin =
                    fin?.grossMarginPct ??
                    (grossRevenue > 0
                      ? Number(((grossProfit / grossRevenue) * 100).toFixed(1))
                      : 0)
                  const comm = fin?.platformCommission ?? 0
                  const pack = fin?.packingCost ?? 5000
                  const disc = fin?.voucherDiscount ?? 0
                  const totalExpense = comm + pack + disc
                  const netProfit = fin?.netProfit ?? grossProfit - totalExpense
                  const netMargin =
                    fin?.netMarginPct ??
                    (grossRevenue > 0
                      ? Number(((netProfit / grossRevenue) * 100).toFixed(1))
                      : 0)

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
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {formatRupiah(grossRevenue)}
                      </td>
                      <td className="py-3 pr-3 text-right font-mono text-slate-500">
                        {formatRupiah(cogs)}
                      </td>
                      <td className="py-3 pr-3 text-right font-mono">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatRupiah(grossProfit)}
                        </span>
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {grossMargin}%
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-right font-mono text-slate-500">
                        <div>{formatRupiah(totalExpense)}</div>
                        <div className="text-[10px] text-slate-400">
                          P:{formatRupiah(pack)}
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(netProfit)}
                        </span>
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
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

        {/* Pagination Controls for Recent Orders */}
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
                onClick={() => handleOrderPageChange(currentPage - 1)}
                disabled={currentPage === 1}
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
                      currentPage === p
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
                onClick={() => handleOrderPageChange(currentPage + 1)}
                disabled={currentPage === totalOrderPages}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. EXPORT TOOLBAR (Quick Actions)                                         */}
      {/* ========================================================================= */}
      <div className="shadow-2xs flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Export Laporan
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Download data pembukuan keuangan komprehensif dan operasional
            pesanan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('financials', 'xlsx')}
            disabled={exporting === 'financials_xlsx'}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
          >
            {exporting === 'financials_xlsx' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Laporan Keuangan</span>
          </button>

          <button
            onClick={() => handleExport('orders', 'xlsx')}
            disabled={exporting === 'orders_xlsx'}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            {exporting === 'orders_xlsx' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Pesanan</span>
          </button>
        </div>
      </div>
    </div>
  )
}
