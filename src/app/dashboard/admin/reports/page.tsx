'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'

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
      packingCost: number
      voucherDiscount: number
      shipping: number
      insurance: number
      total: number
    }
    netProfit: number
    netMarginPct: number
  }
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

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchReportData()
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16 pt-1">
      {/* Top Filter Bar (Zero title noise, compact period filter & quick export) */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
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

        <div className="shadow-2xs flex items-center gap-2 self-end rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 dark:border-slate-800 dark:bg-slate-900 sm:self-auto">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Periode:
          </span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="cursor-pointer bg-transparent text-xs font-bold text-slate-900 outline-none dark:text-white"
          >
            <option value="today">Hari Ini</option>
            <option value="thisWeek">Minggu Ini</option>
            <option value="thisMonth">Bulan Ini</option>
            <option value="thisYear">Tahun Ini</option>
            <optgroup label="Per Bulan">
              <option value="january">Januari</option>
              <option value="february">Februari</option>
              <option value="march">Maret</option>
              <option value="april">April</option>
              <option value="may">Mei</option>
              <option value="june">Juni</option>
              <option value="july">Juli</option>
              <option value="august">Agustus</option>
              <option value="september">September</option>
              <option value="october">Oktober</option>
              <option value="november">November</option>
              <option value="december">Desember</option>
            </optgroup>
          </select>
        </div>
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
              data.products.topSelling.slice(0, 4).map((product, index) => (
                <div
                  key={product.id}
                  className="group flex items-center justify-between gap-3 py-3 transition-colors"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {product.totalSold} terjual · Stok: {product.stock}
                      </p>
                    </div>
                  </div>
                  <p className="whitespace-nowrap font-mono text-xs font-bold text-slate-950 dark:text-white">
                    Rp {(product.revenue / 1000).toFixed(0)}k
                  </p>
                </div>
              ))
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
                data.recentActivity.map((order) => {
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
