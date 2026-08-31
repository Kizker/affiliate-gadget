'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  Users,
  Package,
  Download,
  Calendar,
  Loader2,
  AlertTriangle,
  DollarSign,
  Wrench,
  ShieldCheck,
  TrendingUp,
  Store,
  ChevronRight,
  Clock,
  Sparkles,
  Smartphone,
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface ReportData {
  revenue: {
    total: number
    byCategory: {
      JASA: number
      SPAREPART: number
      SEWA: number
    }
  }
  orders: {
    total: number
    byStatus: {
      PENDING_PAYMENT: number
      PAID: number
      IN_PROGRESS: number
      COMPLETED: number
      CANCELLED: number
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
    createdAt: Date
    user: {
      name: string | null
      email: string
    }
  }>
}

export default function ReportsPage() {
  const router = useRouter()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('thisMonth')
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate = new Date()

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
      setExporting(type)
      const { startDate, endDate } = getDateRange()
      const params = new URLSearchParams({ type, format, startDate, endDate })

      const res = await fetch(`/api/admin/reports/export?${params}`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${type}_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Gagal export data')
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-900 dark:text-white" />
      </div>
    )
  }

  if (!data) return null

  // Check if there's any revenue data
  const hasRevenueData =
    data.revenue.byCategory.JASA > 0 ||
    data.revenue.byCategory.SPAREPART > 0 ||
    data.revenue.byCategory.SEWA > 0

  // Chart data configurations (Modern Slate / Indigo Palette)
  const revenueByCategoryData = {
    labels: ['Smartphone & Gadget', 'Sparepart LCD', 'Aksesoris & Paket 3-in-1'],
    datasets: [
      {
        data: [
          data.revenue.byCategory.JASA || 65,
          data.revenue.byCategory.SPAREPART || 25,
          data.revenue.byCategory.SEWA || 10,
        ],
        backgroundColor: ['#0f172a', '#2563eb', '#f97316'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  const ordersByStatusData = {
    labels: ['Menunggu Bayar', 'Dibayar', 'Diproses Toko', 'Selesai', 'Batal'],
    datasets: [
      {
        label: 'Pesanan',
        data: [
          data.orders.byStatus.PENDING_PAYMENT,
          data.orders.byStatus.PAID,
          data.orders.byStatus.IN_PROGRESS,
          data.orders.byStatus.COMPLETED,
          data.orders.byStatus.CANCELLED,
        ],
        backgroundColor: '#0f172a',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 pt-1" suppressHydrationWarning>
      {/* Top Filter Bar (Zero title noise, compact period filter) */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Periode:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-900 outline-none dark:text-white cursor-pointer"
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
      {/* 2. TOP METRIC CARDS (Bento KPI Grid)                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Omzet */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Omzet Jaringan
            </span>
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Rp</span>
              <p className="text-lg sm:text-xl font-bold font-sans tabular-nums tracking-tight text-slate-950 dark:text-white">
                {(data.revenue.total / 1000000).toFixed(1)} Jt
              </p>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Seluruh Cabang
              </span>
              <span className="text-slate-400 dark:text-slate-500">· 5 Toko Aktif</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Pesanan */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Pesanan
            </span>
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <ShoppingCart className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg sm:text-xl font-bold font-sans tabular-nums tracking-tight text-slate-950 dark:text-white">
              {data.orders.total} <span className="text-xs font-semibold text-slate-400">Transaksi</span>
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="font-semibold text-blue-600 dark:text-blue-400">Terproteksi</span>
              <span className="text-slate-400 dark:text-slate-500">· Asuransi kurir 100%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pelanggan Aktif */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Pelanggan Aktif
            </span>
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg sm:text-xl font-bold font-sans tabular-nums tracking-tight text-slate-950 dark:text-white">
              {data.customers.total} <span className="text-xs font-semibold text-slate-400">Member</span>
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{data.customers.activeRate}%</span>
              <span className="text-slate-400 dark:text-slate-500">· Repeat order</span>
            </div>
          </div>
        </div>

        {/* Card 4: Stok Unit Menipis */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Stok Menipis
            </span>
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg sm:text-xl font-bold font-sans tabular-nums tracking-tight text-slate-950 dark:text-white">
              {data.products.lowStockCount} <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">Unit</span>
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="font-semibold text-amber-600 dark:text-amber-400">Perlu Restock</span>
              <span className="text-slate-400 dark:text-slate-500">· Inventori fisik</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CHARTS ROW (Bento Dual Analytics)                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left Chart: Komposisi Penjualan */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Komposisi Penjualan
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Pangsa omzet berdasarkan kategori produk & paket
              </p>
            </div>
            <button
              onClick={() => handleExport('revenue', 'xlsx')}
              disabled={exporting === 'revenue'}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition disabled:opacity-50"
            >
              {exporting === 'revenue' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span>Export XLSX</span>
            </button>
          </div>

          <div className="relative h-60 pt-4 flex items-center justify-center">
            <Doughnut
              data={revenueByCategoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 10,
                      boxHeight: 10,
                      usePointStyle: true,
                      font: { size: 11 },
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        ` Rp ${context.parsed.toLocaleString('id-ID')}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Right Chart: Distribusi Status Order */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Distribusi Status Order
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Penyelesaian pengiriman kurir dan proses toko
              </p>
            </div>
            <button
              onClick={() => handleExport('orders', 'xlsx')}
              disabled={exporting === 'orders'}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition disabled:opacity-50"
            >
              {exporting === 'orders' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span>Export XLSX</span>
            </button>
          </div>

          <div className="relative h-60 pt-4">
            <Bar
              data={ordersByStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { font: { size: 10 } },
                    grid: { color: 'rgba(226, 232, 240, 0.4)' },
                  },
                  x: {
                    ticks: { font: { size: 10 } },
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PRODUCTS & TOKO PERFORMANCE INSIGHTS                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Produk Terlaris */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
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
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition disabled:opacity-50"
            >
              {exporting === 'products' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span>Export</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pt-1">
            {!data.products.topSelling || data.products.topSelling.length === 0 ? (
              <div className="py-8 text-center text-xs font-semibold text-slate-400">
                Belum ada data penjualan pada periode ini
              </div>
            ) : (
              data.products.topSelling.slice(0, 4).map((product, index) => (
                <div
                  key={product.id}
                  className="py-3 flex items-center justify-between gap-3 group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {product.totalSold} terjual · Stok: {product.stock}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-950 dark:text-white whitespace-nowrap">
                    Rp {(product.revenue / 1000).toFixed(0)}k
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Statistik Jaringan Toko */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Statistik Jaringan Toko
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Status operasional dan performa cabang
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {data.mitras.approved} Aktif
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 pb-3">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-center">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {data.mitras.total}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Total Toko</p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-center">
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {data.mitras.approved}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Terverifikasi</p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-center">
              <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                {data.mitras.pending}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Review</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Toko Rating Tertinggi
            </span>
            {data.mitras.topRated.slice(0, 2).map((mitra) => (
              <div
                key={mitra.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/30 p-2.5"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {mitra.businessName}
                  </p>
                  <p className="text-[11px] text-slate-400">{mitra.city}</p>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                  ⭐ {mitra.rating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. GARANSI & SERVIS LCD SUMMARY                                           */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Garansi & Layanan Servis Kilat LCD
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Statistik klaim garansi 30 hari tukar unit dan resolusi tiket
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {data.warranties.claimRate}% Rasio Klaim
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-center">
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {data.warranties.active}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Garansi Aktif</p>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-center">
            <p className="text-base font-bold text-amber-600 dark:text-amber-400">
              {data.warranties.claims}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Klaim Diajukan</p>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-center">
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {data.tickets.byStatus.RESOLVED}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Terselesaikan</p>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-center">
            <p className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {data.tickets.avgResolutionTime} Jam
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Rata-rata Resolusi</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. EXPORT TOOLBAR (Quick Actions)                                         */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Export Seluruh Laporan
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Download data pembukuan komprehensif dalam format XLSX atau CSV
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleExport('orders', 'xlsx')}
            disabled={exporting === 'orders'}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-slate-950 shadow-xs hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition disabled:opacity-50"
          >
            {exporting === 'orders' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Pesanan (Excel)</span>
          </button>

          <button
            onClick={() => handleExport('revenue', 'csv')}
            disabled={exporting === 'revenue'}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition disabled:opacity-50"
          >
            {exporting === 'revenue' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Omzet (CSV)</span>
          </button>

          <button
            onClick={() => handleExport('customers', 'xlsx')}
            disabled={exporting === 'customers'}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition disabled:opacity-50"
          >
            {exporting === 'customers' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Pelanggan (Excel)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
