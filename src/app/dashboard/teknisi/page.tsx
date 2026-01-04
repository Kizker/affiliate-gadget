'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star,
  Package,
  TrendingUp,
  Settings,
  Plus,
  Briefcase,
  XCircle,
  Wallet,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Zap,
  Search,
  ChevronLeft,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'

// --- Types ---

interface DashboardData {
  profile: {
    id: string
    bio: string | null
    experience: number
    specialties: string[]
    rating: number
    totalReview: number
    isAvailable: boolean
    user: {
      name: string | null
      email: string | null
      image: string | null
      phone: string | null
    }
  }
  services: Array<{
    id: string
    name: string
    category: string
    price: number
    estimatedDuration: number
  }>
  orders: Array<{
    id: string
    orderNumber: string
    status: string
    total: number
    createdAt: string
    user: {
      name: string | null
      image: string | null
    }
    items: Array<{
      service: {
        name: string
        category: string
      }
    }>
  }>
  stats: {
    totalOrders: number
    activeOrders: number
    completedOrders: number
    totalRevenue: number
    averageRating: number
    totalReviews: number
    unreadMessages: number
    ordersByStatus: {
      pending: number
      inProgress: number
      completed: number
      cancelled: number
    }
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// --- Animation Variants ---

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 12 },
  },
}

// --- Components ---

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: 'indigo' | 'emerald' | 'amber' | 'rose'
  trend?: string
}) => {
  const gradients = {
    indigo:
      'from-indigo-500/10 to-blue-500/5 border-indigo-200/50 text-indigo-600',
    emerald:
      'from-emerald-500/10 to-teal-500/5 border-emerald-200/50 text-emerald-600',
    amber:
      'from-amber-500/10 to-orange-500/5 border-amber-200/50 text-amber-600',
    rose: 'from-rose-500/10 to-pink-500/5 border-rose-200/50 text-rose-600',
  }

  const iconBg = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  }

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
      className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 backdrop-blur-sm transition-all ${gradients[color]}`}
    >
      <div className="flex items-start justify-between">
        <div className="relative z-10">
          <p className="text-sm font-semibold text-gray-500/90">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">
              {value}
            </h3>
          </div>
          {subtitle && (
            <p className="mt-1 text-sm font-medium text-gray-500/80">
              {subtitle}
            </p>
          )}
          {trend && (
            <div
              className={`mt-3 flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
            >
              <TrendingUp className="h-3 w-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div
          className={`relative z-10 rounded-2xl p-3.5 shadow-sm transition-transform duration-300 group-hover:scale-110 ${iconBg[color]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {/* Decorative blurred circles */}
      <div
        className={`absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-20 blur-3xl ${color === 'indigo' ? 'bg-indigo-400' : color === 'emerald' ? 'bg-emerald-400' : color === 'amber' ? 'bg-amber-400' : 'bg-rose-400'}`}
      />
    </motion.div>
  )
}

const OrderStatusBadge = ({ status }: { status: string }) => {
  const styles = {
    PENDING_PAYMENT: 'bg-amber-100 text-amber-700 ring-amber-500/20',
    PAID: 'bg-blue-100 text-blue-700 ring-blue-500/20',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-700 ring-indigo-500/20',
    COMPLETED: 'bg-emerald-100 text-emerald-700 ring-emerald-500/20',
    CANCELLED: 'bg-rose-100 text-rose-700 ring-rose-500/20',
    DEFAULT: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  }

  const style = styles[status as keyof typeof styles] || styles.DEFAULT
  const label = status.replace(/_/g, ' ')

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ring-1 ring-inset ${style}`}
    >
      {label.toLowerCase()}
    </span>
  )
}

const SkeletonLoader = () => (
  <div className="container mx-auto max-w-7xl space-y-8 p-6">
    <div className="flex animate-pulse gap-6">
      <div className="h-24 w-24 rounded-full bg-gray-200"></div>
      <div className="w-full space-y-4 pt-4">
        <div className="h-8 w-1/3 rounded-lg bg-gray-200"></div>
        <div className="h-4 w-1/4 rounded bg-gray-200"></div>
      </div>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-3xl bg-gray-200"
        ></div>
      ))}
    </div>
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="h-96 animate-pulse rounded-3xl bg-gray-200 lg:col-span-2"></div>
      <div className="h-96 animate-pulse rounded-3xl bg-gray-200"></div>
    </div>
  </div>
)

const Header = ({
  user,
  profile,
}: {
  user: { name: string | null; email: string | null; image: string | null }
  profile: { isAvailable: boolean }
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 11) return 'Selamat Pagi'
    if (hour < 15) return 'Selamat Siang'
    if (hour < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  return (
    <motion.div
      variants={itemVariants}
      className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"
    >
      <div className="flex items-center gap-6">
        <div className="group relative">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-[3px] border-white shadow-xl transition-transform hover:scale-105">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || 'Technician'}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold text-white">
                {user.name?.charAt(0) || 'T'}
              </div>
            )}
          </div>
          <div
            className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-white shadow-md ${
              profile.isAvailable ? 'bg-emerald-500' : 'bg-gray-400'
            }`}
          >
            <span
              className={`absolute -inset-1 animate-ping rounded-full opacity-75 ${
                profile.isAvailable ? 'bg-emerald-400' : 'hidden'
              }`}
            ></span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-full bg-white/60 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 backdrop-blur-md">
              Technician Dashboard
            </span>
          </div>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
            {getGreeting()},{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {user.name?.split(' ')[0]}
            </span>
            !
          </h1>
          <p className="flex items-center gap-2 text-lg text-gray-600">
            Semoga harimu produktif dan menyenangkan.{' '}
            <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/dashboard/teknisi/settings">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/80 px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white hover:shadow-md"
          >
            <Settings className="h-4 w-4" />
            Pengaturan
          </motion.button>
        </Link>
        <Link href="/dashboard/teknisi/services">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800 hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            Layanan Baru
          </motion.button>
        </Link>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 px-5 py-3 text-sm font-semibold text-rose-600 shadow-sm backdrop-blur-sm transition-all hover:border-rose-300 hover:bg-rose-100 hover:shadow-md"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </motion.button>
      </div>
    </motion.div>
  )
}

// --- Main Page Component ---

export default function TechnicianDashboard() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  // Toggle Availability Status
  const toggleAvailability = async () => {
    if (!data) return

    setIsTogglingStatus(true)
    try {
      const res = await fetch('/api/technicians/me/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !data.profile.isAvailable }),
      })

      const result = await res.json()

      if (res.ok) {
        // Update local state
        setData({
          ...data,
          profile: {
            ...data.profile,
            isAvailable: result.isAvailable,
          },
        })

        toast({
          title: result.isAvailable ? '🟢 Status Online' : '⚪ Status Offline',
          description: result.message,
        })
      } else {
        throw new Error(result.error || 'Gagal mengubah status')
      }
    } catch (error) {
      console.error('Error toggling availability:', error)
      toast({
        title: 'Gagal mengubah status',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      })
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const fetchDashboardData = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams()
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter)
      if (searchQuery) queryParams.append('q', searchQuery)
      queryParams.append('page', page.toString())
      queryParams.append('limit', '5')

      const res = await fetch(
        `/api/technicians/me/dashboard?${queryParams.toString()}`
      )

      if (!res.ok) throw new Error('Failed to fetch dashboard data')

      const dashboardData = await res.json()
      setData(dashboardData)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Gagal memuat data',
        description: 'Terjadi kesalahan saat mengambil data dashboard.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [statusFilter, searchQuery, page, toast])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      // Small debounce for search
      const timer = setTimeout(
        () => {
          if (searchQuery) setIsSearching(true)
          fetchDashboardData()
        },
        searchQuery ? 500 : 0
      )

      return () => clearTimeout(timer)
    }
  }, [status, router, fetchDashboardData, searchQuery, page])

  if (status === 'loading' || loading) {
    return <SkeletonLoader />
  }

  if (!data) return null

  const { profile, stats, orders, services, pagination } = data
  const user = profile.user

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Abstract Background Mesh */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[100px]" />
        <div className="absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full bg-violet-400/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-indigo-300/20 blur-[100px]" />
      </div>

      <Navbar variant="light" />

      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8"
      >
        <Header user={user} profile={profile} />

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            title="Total Pendapatan"
            value={new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              maximumFractionDigits: 0,
            }).format(stats.totalRevenue)}
            icon={Wallet}
            color="emerald"
            trend="+12%"
          />
          <StatCard
            title="Pesanan Aktif"
            value={stats.activeOrders}
            subtitle={`${stats.ordersByStatus.pending} menunggu konfirmasi`}
            icon={Briefcase}
            color="indigo"
          />
          <StatCard
            title="Total Pesanan"
            value={stats.totalOrders}
            subtitle={`${stats.completedOrders} selesai`}
            icon={Package}
            color="amber"
          />
          <StatCard
            title="Rating Saya"
            value={stats.averageRating.toFixed(1)}
            subtitle={`Dari ${stats.totalReviews} ulasan`}
            icon={Star}
            color="rose"
          />
        </motion.div>

        {/* Bento Grid Content */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Column: Order Management (8 cols) */}
          <motion.div
            variants={itemVariants}
            className="space-y-8 lg:col-span-8"
          >
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 shadow-xl shadow-indigo-100/20 backdrop-blur-xl">
              <div className="border-b border-indigo-50/50 p-8 pb-6">
                <div className="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Pesanan Masuk
                    </h2>
                    <p className="text-sm text-gray-500">
                      Kelola dan pantau pesanan pelanggan Anda.
                    </p>
                  </div>
                  <div className="flex gap-1 rounded-2xl bg-gray-100/80 p-1.5 backdrop-blur-sm">
                    {['ALL', 'IN_PROGRESS', 'COMPLETED'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setStatusFilter(filter)
                          setPage(1)
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 ${
                          statusFilter === filter
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-900'
                        }`}
                      >
                        {filter === 'ALL' ? 'Semua' : filter.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Search
                      className={`h-5 w-5 transition-colors duration-300 ${isSearching || searchQuery ? 'text-indigo-500' : 'text-gray-400 group-focus-within:text-indigo-500'}`}
                    />
                  </div>
                  <input
                    type="text"
                    className="block w-full rounded-2xl border-0 bg-gray-50/50 py-4 pl-12 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                    placeholder="Cari nomor pesanan (ORD...) atau nama pelanggan..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setPage(1)
                    }}
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-4 flex items-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order List Content */}
              <div className="space-y-4 p-8 pt-6">
                <AnimatePresence mode="wait">
                  {orders.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-16 text-center"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                        <Package className="h-8 w-8 text-indigo-400" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-gray-900">
                        Belum ada pesanan
                      </h3>
                      <p className="mx-auto mt-2 max-w-xs text-gray-500">
                        Pesanan yang masuk akan muncul otomatis di sini.
                        Pastikan status Anda aktif.
                      </p>
                    </motion.div>
                  ) : (
                    orders.map((order, i) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group relative flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-5 transition-all hover:border-indigo-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-5">
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                            <Briefcase className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-indigo-600">
                                #{order.orderNumber}
                              </h3>
                              <OrderStatusBadge status={order.status} />
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-600">
                              <span>
                                {order.items[0]?.service.name || 'Jasa Service'}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                              <span>{order.user.name}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-xs font-medium text-gray-400">
                              <span className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(
                                  new Date(order.createdAt),
                                  'dd MMMM yyyy, HH:mm',
                                  { locale: id }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-6 border-t border-gray-50 pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                maximumFractionDigits: 0,
                              }).format(order.total)}
                            </p>
                          </div>
                          <Link href={`/dashboard/teknisi/orders/${order.id}`}>
                            <button className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:gap-2 hover:bg-gray-700 active:scale-95">
                              Detail <ChevronRight className="h-4 w-4" />
                            </button>
                          </Link>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-indigo-50/50 p-6 px-8">
                  <div className="text-sm text-gray-500">
                    Menampilkan{' '}
                    <span className="font-bold text-gray-900">
                      {(pagination.page - 1) * pagination.limit + 1}-
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}
                    </span>{' '}
                    dari{' '}
                    <span className="font-bold text-gray-900">
                      {pagination.total}
                    </span>{' '}
                    pesanan
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition-all hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-gray-50 disabled:hover:text-gray-600"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-1 rounded-xl bg-gray-50 px-3 font-semibold text-gray-900">
                      {pagination.page} / {pagination.totalPages}
                    </div>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(pagination.totalPages, p + 1))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition-all hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-gray-50 disabled:hover:text-gray-600"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column: Sidebar (4 cols) */}
          <motion.div
            variants={itemVariants}
            className="space-y-8 lg:col-span-4"
          >
            {/* Availability Card with Glass Effect */}
            <div
              className={`hover:shadow-3xl relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-2xl transition-all ${
                profile.isAvailable
                  ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800'
                  : 'bg-gradient-to-br from-gray-700 to-gray-900'
              }`}
            >
              {/* Animated glow */}
              <div className="absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-white/20 blur-3xl" />

              <div className="relative z-10 mb-6 flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-widest opacity-80">
                  Status Keaktifan
                </span>
                <div
                  className={`rounded-full p-2 backdrop-blur-md ${profile.isAvailable ? 'bg-emerald-400/30 text-emerald-100' : 'bg-rose-400/20 text-rose-100'}`}
                >
                  {profile.isAvailable ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <XCircle className="h-6 w-6" />
                  )}
                </div>
              </div>

              <div className="relative z-10 space-y-1">
                <h3 className="text-3xl font-extrabold tracking-tight">
                  {profile.isAvailable ? 'Sedang Online' : 'Sedang Offline'}
                </h3>
                <p className="font-medium leading-relaxed text-indigo-100/80">
                  {profile.isAvailable
                    ? 'Anda dapat menerima pesanan baru dari pelanggan.'
                    : 'Anda tidak akan muncul di pencarian pelanggan.'}
                </p>
              </div>

              <button
                onClick={toggleAvailability}
                disabled={isTogglingStatus}
                className="mt-8 w-full rounded-2xl bg-white py-4 font-bold text-gray-900 shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
              >
                {isTogglingStatus ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent"></div>
                    Mengubah...
                  </span>
                ) : profile.isAvailable ? (
                  'Matikan Status'
                ) : (
                  'Aktifkan Status'
                )}
              </button>
            </div>

            {/* Quick Services List */}
            <div className="flex flex-col rounded-[2.5rem] border border-white/60 bg-white/60 p-8 shadow-xl shadow-indigo-100/10 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  Katalog Layanan
                </h3>
                <Link
                  href="/dashboard/teknisi/services"
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Lihat Semua <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex-1 space-y-4">
                {services.slice(0, 4).map((service) => (
                  <div
                    key={service.id}
                    className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-indigo-100 hover:shadow-md"
                  >
                    <div>
                      <p className="font-bold text-gray-900 transition-colors group-hover:text-indigo-600">
                        {service.name}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {service.category}
                      </p>
                    </div>
                    <p className="rounded-lg bg-gray-50 px-2 py-1 font-bold text-gray-900">
                      {new Intl.NumberFormat('id-ID', {
                        notation: 'compact',
                        compactDisplay: 'short',
                        style: 'currency',
                        currency: 'IDR',
                      }).format(service.price)}
                    </p>
                  </div>
                ))}
                {services.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
                    <p className="text-sm font-medium text-gray-500">
                      Belum ada layanan
                    </p>
                  </div>
                )}
              </div>
              <Link href="/dashboard/teknisi/services">
                <button className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-3 text-sm font-bold text-gray-500 transition-all hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600">
                  <Plus className="h-4 w-4 transition-transform group-hover:rotate-180" />{' '}
                  Tambah Layanan Baru
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.main>

      <Footer variant="light" />
    </div>
  )
}
