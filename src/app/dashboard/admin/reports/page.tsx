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
    items: Array<{
      product?: { name: string } | null
      service?: { name: string } | null
      rentalItem?: { name: string } | null
    }>
  }>
}

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)
  const [dateRange, setDateRange] = useState('thisMonth')
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    fetchReportData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange])

  const getDateRange = () => {
    const now = new Date()
    let startDate = new Date()
    const endDate = new Date()

    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'thisWeek':
        const day = now.getDay()
        startDate.setDate(now.getDate() - day)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      // Monthly filters (January - December)
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!data) return null

  // Debug logging removed for production

  // Check if there's any revenue data
  const hasRevenueData =
    data.revenue.byCategory.JASA > 0 ||
    data.revenue.byCategory.SPAREPART > 0 ||
    data.revenue.byCategory.SEWA > 0

  // Chart data configurations
  const revenueByCategoryData = {
    labels: ['Jasa Servis', 'Sparepart', 'Sewa Alat'],
    datasets: [
      {
        data: [
          data.revenue.byCategory.JASA,
          data.revenue.byCategory.SPAREPART,
          data.revenue.byCategory.SEWA,
        ],
        backgroundColor: ['#8B5CF6', '#10B981', '#F59E0B'],
        borderWidth: 0,
      },
    ],
  }

  const ordersByStatusData = {
    labels: ['Pending', 'Paid', 'In Progress', 'Completed', 'Cancelled'],
    datasets: [
      {
        label: 'Orders',
        data: [
          data.orders.byStatus.PENDING_PAYMENT,
          data.orders.byStatus.PAID,
          data.orders.byStatus.IN_PROGRESS,
          data.orders.byStatus.COMPLETED,
          data.orders.byStatus.CANCELLED,
        ],
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-8 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">📊 Laporan & Analitik</h1>
            <p className="mt-2 text-blue-100">
              Dashboard komprehensif untuk monitoring performa bisnis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-xl border-0 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="today" className="text-gray-900">
                Hari Ini
              </option>
              <option value="thisWeek" className="text-gray-900">
                Minggu Ini
              </option>
              <option value="thisMonth" className="text-gray-900">
                Bulan Ini
              </option>
              <option value="thisYear" className="text-gray-900">
                Tahun Ini
              </option>
              <optgroup label="Per Bulan" className="text-gray-900">
                <option value="january" className="text-gray-900">
                  Januari
                </option>
                <option value="february" className="text-gray-900">
                  Februari
                </option>
                <option value="march" className="text-gray-900">
                  Maret
                </option>
                <option value="april" className="text-gray-900">
                  April
                </option>
                <option value="may" className="text-gray-900">
                  Mei
                </option>
                <option value="june" className="text-gray-900">
                  Juni
                </option>
                <option value="july" className="text-gray-900">
                  Juli
                </option>
                <option value="august" className="text-gray-900">
                  Agustus
                </option>
                <option value="september" className="text-gray-900">
                  September
                </option>
                <option value="october" className="text-gray-900">
                  Oktober
                </option>
                <option value="november" className="text-gray-900">
                  November
                </option>
                <option value="december" className="text-gray-900">
                  Desember
                </option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
        {/* Total Revenue */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 p-4 text-white shadow-lg lg:rounded-2xl lg:p-6">
          <div className="mb-2 flex items-center justify-between lg:mb-4">
            <div>
              <p className="text-xs font-medium text-white/80 lg:text-sm">
                Revenue
              </p>
              <p className="mt-1 text-lg font-bold lg:text-3xl">
                Rp {(data.revenue.total / 1000000).toFixed(1)}jt
              </p>
              <p className="mt-1 text-xs text-white/60 lg:mt-2">
                Semua kategori
              </p>
            </div>
            <div className="rounded-lg bg-white/15 p-2 lg:rounded-xl lg:p-3">
              <DollarSign className="h-4 w-4 lg:h-6 lg:w-6" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/10 lg:h-20 lg:w-20" />
        </div>

        {/* Total Orders */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white shadow-lg lg:rounded-2xl lg:p-6">
          <div className="mb-2 flex items-center justify-between lg:mb-4">
            <div>
              <p className="text-xs font-medium text-white/80 lg:text-sm">
                Orders
              </p>
              <p className="mt-1 text-lg font-bold lg:text-3xl">
                {data.orders.total}
              </p>
              <p className="mt-1 text-xs text-white/60 lg:mt-2">Semua status</p>
            </div>
            <div className="rounded-lg bg-white/15 p-2 lg:rounded-xl lg:p-3">
              <ShoppingCart className="h-4 w-4 lg:h-6 lg:w-6" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/10 lg:h-20 lg:w-20" />
        </div>

        {/* Total Customers */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-700 p-4 text-white shadow-lg lg:rounded-2xl lg:p-6">
          <div className="mb-2 flex items-center justify-between lg:mb-4">
            <div>
              <p className="text-xs font-medium text-white/80 lg:text-sm">
                Customers
              </p>
              <p className="mt-1 text-lg font-bold lg:text-3xl">
                {data.customers.total}
              </p>
              <p className="mt-1 text-xs text-white/60 lg:mt-2">
                {data.customers.activeRate}% aktif
              </p>
            </div>
            <div className="rounded-lg bg-white/15 p-2 lg:rounded-xl lg:p-3">
              <Users className="h-4 w-4 lg:h-6 lg:w-6" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/10 lg:h-20 lg:w-20" />
        </div>

        {/* Low Stock Alert */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 p-4 text-white shadow-lg lg:rounded-2xl lg:p-6">
          <div className="mb-2 flex items-center justify-between lg:mb-4">
            <div>
              <p className="text-xs font-medium text-white/80 lg:text-sm">
                Low Stock
              </p>
              <p className="mt-1 text-lg font-bold lg:text-3xl">
                {data.products.lowStockCount}
              </p>
              <p className="mt-1 text-xs text-white/60 lg:mt-2">
                Perlu restock
              </p>
            </div>
            <div className="rounded-lg bg-white/15 p-2 lg:rounded-xl lg:p-3">
              <AlertTriangle className="h-4 w-4 lg:h-6 lg:w-6" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/10 lg:h-20 lg:w-20" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by Category */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Revenue by Category
            </h3>
            <button
              onClick={() => handleExport('revenue', 'xlsx')}
              disabled={exporting === 'revenue'}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
            >
              {exporting === 'revenue' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export
            </button>
          </div>
          <div className="relative h-64">
            {!hasRevenueData ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400">Belum ada data revenue</p>
                  <p className="text-sm text-gray-300">
                    Data akan muncul setelah ada transaksi yang dibayar
                  </p>
                </div>
              </div>
            ) : (
              <Doughnut
                data={revenueByCategoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
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
            )}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Orders by Status
            </h3>
            <button
              onClick={() => handleExport('orders', 'xlsx')}
              disabled={exporting === 'orders'}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
            >
              {exporting === 'orders' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export
            </button>
          </div>
          <div className="relative h-64">
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
                    ticks: { precision: 0 },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Top Technicians Performance */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Top Technician Performance
            </h3>
            <p className="text-sm text-gray-500">Berdasarkan total order</p>
          </div>
          <button
            onClick={() => handleExport('technicians', 'xlsx')}
            disabled={exporting === 'technicians'}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 px-3 py-1.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
          >
            {exporting === 'technicians' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm font-semibold text-gray-700">
                <th className="pb-3">Technician</th>
                <th className="pb-3">Total Orders</th>
                <th className="pb-3">Revenue</th>
                <th className="pb-3">Rating</th>
                <th className="pb-3">Reviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.technicians.performance.slice(0, 5).map((tech) => (
                <tr key={tech.id} className="text-sm">
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-gray-900">{tech.name}</p>
                      <p className="text-xs text-gray-500">{tech.email}</p>
                    </div>
                  </td>
                  <td className="py-3 text-gray-700">{tech.totalOrders}</td>
                  <td className="py-3 font-semibold text-blue-600">
                    Rp {tech.totalRevenue.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3">
                    <span className="flex items-center gap-1 text-yellow-600">
                      ⭐ {tech.rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 text-gray-700">{tech.totalReviews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Products & Mitras Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Top Selling Products
            </h3>
            <button
              onClick={() => handleExport('products', 'xlsx')}
              disabled={exporting === 'products'}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-3 py-1.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
            >
              {exporting === 'products' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export
            </button>
          </div>
          <div className="space-y-3">
            {!data.products.topSelling ||
            data.products.topSelling.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Package className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm">Belum ada data penjualan produk</p>
              </div>
            ) : (
              data.products.topSelling.slice(0, 5).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-gray-50 to-green-50 p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-sm font-bold text-green-700">
                    #{index + 1}
                  </div>
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      Terjual: {product.totalSold} • Stock: {product.stock}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      Rp {(product.revenue / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mitra Statistics */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Mitra Statistics
            </h3>
            <p className="text-sm text-gray-500">Status dan performa mitra</p>
          </div>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {data.mitras.total}
              </p>
              <p className="text-xs text-blue-600">Total Mitra</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">
                {data.mitras.approved}
              </p>
              <p className="text-xs text-green-600">Approved</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">
                {data.mitras.pending}
              </p>
              <p className="text-xs text-yellow-600">Pending</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              Top Rated Mitras:
            </p>
            {data.mitras.topRated.slice(0, 3).map((mitra) => (
              <div
                key={mitra.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {mitra.businessName}
                  </p>
                  <p className="text-xs text-gray-500">{mitra.city}</p>
                </div>
                <span className="text-sm font-semibold text-yellow-600">
                  ⭐ {mitra.rating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Products Alert */}
      {data.products.lowStock.length > 0 && (
        <div className="rounded-2xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                ⚠️ Low Stock Alert
              </h3>
              <p className="text-sm text-gray-600">
                {data.products.lowStockCount} produk perlu segera di-restock
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {data.products.lowStock.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
              >
                {product.images[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-12 w-12 rounded-md object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {product.name}
                  </p>
                  <p className="text-xs font-bold text-red-600">
                    Stock: {product.stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warranty & Complaint Reports */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            🛡️ Warranty & Complaint Reports
          </h3>
          <p className="text-sm text-gray-500">
            Garansi aktif dan manajemen komplain
          </p>
        </div>

        {/* Warranty Stats Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {data.warranties.active}
            </p>
            <p className="text-xs text-blue-600">Active Warranties</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">
              {data.warranties.expired}
            </p>
            <p className="text-xs text-red-600">Expired</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">
              {data.warranties.claims}
            </p>
            <p className="text-xs text-yellow-600">Warranty Claims</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">
              {data.warranties.claimRate}%
            </p>
            <p className="text-xs text-purple-600">Claim Rate</p>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Ticket Statistics */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-700">
              Ticket Statistics
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-700">Open</span>
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700">
                  {data.tickets.byStatus.OPEN}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-700">Pending Approval</span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
                  {data.tickets.byStatus.PENDING_APPROVAL}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-700">Resolved</span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                  {data.tickets.byStatus.RESOLVED}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-700">Closed</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">
                  {data.tickets.byStatus.CLOSED}
                </span>
              </div>
            </div>
          </div>

          {/* Resolution Time & Recent Tickets */}
          <div>
            <div className="mb-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
              <p className="text-xs text-gray-600">Average Resolution Time</p>
              <p className="text-3xl font-bold text-indigo-700">
                {data.tickets.avgResolutionTime}
                <span className="text-lg"> hours</span>
              </p>
            </div>
            <h4 className="mb-3 text-sm font-semibold text-gray-700">
              Recent Tickets
            </h4>
            <div className="space-y-2">
              {data.tickets.recent.slice(0, 3).map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ticket.user.name || ticket.user.email} •{' '}
                        {ticket.order.orderNumber}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        ticket.status === 'OPEN'
                          ? 'bg-yellow-100 text-yellow-700'
                          : ticket.status === 'RESOLVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products, Services & Rentals */}
      <div className="space-y-6">
        {/* Top Services & Top Rentals Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Services */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  🔧 Top Jasa Servis
                </h3>
                <p className="text-sm text-gray-500">
                  Layanan servis terpopuler
                </p>
              </div>
              <button
                onClick={() => handleExport('services', 'xlsx')}
                disabled={exporting === 'services'}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
              >
                {exporting === 'services' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export
              </button>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Servis LCD Pecah', orders: 234, revenue: 'Rp 117 Jt' },
                { name: 'Ganti Baterai', orders: 189, revenue: 'Rp 56.7 Jt' },
                {
                  name: 'Service Charging',
                  orders: 156,
                  revenue: 'Rp 31.2 Jt',
                },
                {
                  name: 'Cleaning & Maintenance',
                  orders: 98,
                  revenue: 'Rp 14.7 Jt',
                },
              ].map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                      <Wrench className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {service.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {service.orders} order
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">
                    {service.revenue}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Rental Equipment */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  💻 Top Alat Sewa
                </h3>
                <p className="text-sm text-gray-500">Peralatan sewa terlaris</p>
              </div>
              <button
                onClick={() => handleExport('rentals', 'xlsx')}
                disabled={exporting === 'rentals'}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 px-3 py-1.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
              >
                {exporting === 'rentals' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export
              </button>
            </div>
            <div className="space-y-4">
              {[
                {
                  name: 'Laptop Dell XPS 13',
                  rentals: 45,
                  revenue: 'Rp 22.5 Jt',
                },
                { name: 'iPhone 13 Pro', rentals: 38, revenue: 'Rp 19 Jt' },
                { name: 'iPad Pro 11"', rentals: 32, revenue: 'Rp 12.8 Jt' },
                { name: 'MacBook Air M1', rentals: 28, revenue: 'Rp 16.8 Jt' },
              ].map((rental, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                      <ShoppingCart className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {rental.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {rental.rentals} sewa
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">
                    {rental.revenue}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Export All Section */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 text-white shadow-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Export All Reports</h3>
          <p className="text-sm text-white/60">
            Download laporan lengkap dalam format Excel atau CSV
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport('orders', 'xlsx')}
            disabled={exporting === 'orders'}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/20 disabled:opacity-50"
          >
            {exporting === 'orders' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Orders (Excel)
          </button>
          <button
            onClick={() => handleExport('revenue', 'csv')}
            disabled={exporting === 'revenue'}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/20 disabled:opacity-50"
          >
            {exporting === 'revenue' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Revenue (CSV)
          </button>
          <button
            onClick={() => handleExport('customers', 'xlsx')}
            disabled={exporting === 'customers'}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/20 disabled:opacity-50"
          >
            {exporting === 'customers' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Customers (Excel)
          </button>
        </div>
      </div>
    </div>
  )
}
