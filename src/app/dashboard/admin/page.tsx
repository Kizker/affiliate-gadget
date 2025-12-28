'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  ShoppingCart,
  Wrench,
  Package,
  FileText,
  Settings,
  TrendingUp,
  Clock,
  UserCheck,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface DashboardStats {
  totalUsers: number
  totalTechnicians: number
  totalMitras: number
  totalProducts: number
  totalOrders: number
  pendingMitras: number
  byRole: Record<string, number>
}

interface RecentUser {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  technician?: { id: string } | null
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  iconBg = 'bg-blue-500',
  loading = false,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  iconBg?: string
  loading?: boolean
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          {loading ? (
            <div className="mt-1 h-9 w-20 animate-pulse rounded bg-gray-200" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div className={`rounded-xl ${iconBg} p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

// Helper functions for role display
function getRoleLabel(user: RecentUser) {
  if (user.technician) return 'TEKNISI'
  return user.role
}

function getRoleBadgeColor(user: RecentUser) {
  if (user.technician) return 'bg-orange-100 text-orange-700'

  switch (user.role) {
    case 'SUPER_ADMIN':
      return 'bg-purple-100 text-purple-700'
    case 'ADMIN':
      return 'bg-blue-100 text-blue-700'
    case 'MITRA':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

// Quick Action Card
function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  iconBg = 'bg-blue-100',
  iconColor = 'text-blue-600',
}: {
  icon: React.ElementType
  title: string
  description: string
  href: string
  iconBg?: string
  iconColor?: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className={`mb-4 inline-flex rounded-xl ${iconBg} p-3`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </Link>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) throw new Error('Failed to fetch dashboard data')

      const data = await res.json()
      setStats(data.stats)
      setRecentUsers(data.recentUsers || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      {/* Header Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="mt-2 text-blue-100">
              Kelola seluruh sistem HaloTekno dari satu tempat
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm md:flex">
            <Clock className="h-5 w-5" />
            <span className="text-sm">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10"></div>
          <div className="relative">
            <div className="mb-4 inline-flex rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Users className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-purple-100">Total Users</p>
            {loading ? (
              <div className="mt-2 h-8 w-20 animate-pulse rounded bg-white/20" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-white">
                {stats?.totalUsers || 0}
              </p>
            )}
          </div>
        </div>

        {/* Total Teknisi Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10"></div>
          <div className="relative">
            <div className="mb-4 inline-flex rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-orange-100">Total Teknisi</p>
            {loading ? (
              <div className="mt-2 h-8 w-20 animate-pulse rounded bg-white/20" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-white">
                {stats?.totalTechnicians || 0}
              </p>
            )}
          </div>
        </div>

        {/* Total Produk Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-700 p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10"></div>
          <div className="relative">
            <div className="mb-4 inline-flex rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Package className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-green-100">Total Produk</p>
            {loading ? (
              <div className="mt-2 h-8 w-20 animate-pulse rounded bg-white/20" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-white">
                {stats?.totalProducts || 0}
              </p>
            )}
          </div>
        </div>

        {/* Pending Mitra Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-700 p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10"></div>
          <div className="relative">
            <div className="mb-4 inline-flex rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-yellow-100">Pending Mitra</p>
            {loading ? (
              <div className="mt-2 h-8 w-20 animate-pulse rounded bg-white/20" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-white">
                {stats?.pendingMitras || 0}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="space-y-6">
        {/* Row 1: Website Visitors (Large) + Revenue (Medium) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Website Visitors Chart - 2 columns */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-gray-900">
                Pengunjung Website
              </h3>
              <div className="h-80">
                <Line
                  data={{
                    labels: [
                      'Jan',
                      'Feb',
                      'Mar',
                      'Apr',
                      'Mei',
                      'Jun',
                      'Jul',
                      'Agu',
                      'Sep',
                      'Okt',
                      'Nov',
                      'Des',
                    ],
                    datasets: [
                      {
                        label: 'Pengunjung',
                        data: [
                          1200, 1900, 1500, 2100, 1800, 2400, 2200, 2600, 2300,
                          2800, 2500, 3000,
                        ],
                        borderColor: '#8B5CF6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Monthly Revenue - 1 column */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-gray-900">
                Revenue Bulanan
              </h3>
              <div className="h-80">
                <Bar
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
                    datasets: [
                      {
                        label: 'Revenue (Juta)',
                        data: [45, 52, 48, 65, 58, 72],
                        backgroundColor: '#10B981',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 2: Order Trends (Medium) + Top Products (Small) + Top Services (Small) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Order Trends - 1 column */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-gray-900">
                Perkembangan Order
              </h3>
              <div className="flex-1">
                <Line
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
                    datasets: [
                      {
                        label: 'Orders',
                        data: [85, 92, 88, 105, 98, 112],
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Top Products - 2 columns */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-gray-900">
                Top Produk Terjual
              </h3>
              <div className="flex-1 space-y-4">
                {[
                  { name: 'LCD iPhone 12', sold: 145, revenue: 'Rp 72.5 Jt' },
                  {
                    name: 'Baterai Samsung A52',
                    sold: 98,
                    revenue: 'Rp 29.4 Jt',
                  },
                  { name: 'Charger Type-C', sold: 87, revenue: 'Rp 13.05 Jt' },
                  { name: 'Tempered Glass', sold: 76, revenue: 'Rp 7.6 Jt' },
                  { name: 'Casing iPhone', sold: 65, revenue: 'Rp 9.75 Jt' },
                ].map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {product.sold} terjual
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">
                      {product.revenue}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 3: Top Services + Top Rental Equipment */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-gray-900">
                Top Jasa Servis
              </h3>
              <div className="space-y-4">
                {[
                  {
                    name: 'Servis LCD Pecah',
                    orders: 234,
                    revenue: 'Rp 117 Jt',
                  },
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
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
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
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Top Rental Equipment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-gray-900">
                Top Alat Sewa
              </h3>
              <div className="space-y-4">
                {[
                  {
                    name: 'Laptop Dell XPS 13',
                    rentals: 45,
                    revenue: 'Rp 22.5 Jt',
                  },
                  { name: 'iPhone 13 Pro', rentals: 38, revenue: 'Rp 19 Jt' },
                  { name: 'iPad Pro 11"', rentals: 32, revenue: 'Rp 12.8 Jt' },
                  {
                    name: 'MacBook Air M1',
                    rentals: 28,
                    revenue: 'Rp 16.8 Jt',
                  },
                ].map((rental, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
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
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
