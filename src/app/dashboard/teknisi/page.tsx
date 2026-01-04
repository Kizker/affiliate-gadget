'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star,
  Package,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  Settings,
  Plus,
  Briefcase,
  XCircle,
  Wallet,
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

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
  icon: any
  color: 'blue' | 'green' | 'purple' | 'orange' | 'cyan'
  trend?: string
}) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-violet-50 text-violet-600',
    orange: 'bg-amber-50 text-amber-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </h3>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div
          className={`rounded-xl p-3 transition-transform group-hover:scale-110 ${colorStyles[color]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

const OrderStatusBadge = ({ status }: { status: string }) => {
  const styles = {
    PENDING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-100',
    PAID: 'bg-blue-50 text-blue-700 border-blue-100',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100',
    DEFAULT: 'bg-gray-50 text-gray-700 border-gray-100',
  }

  const style = styles[status as keyof typeof styles] || styles.DEFAULT
  const label = status.replace(/_/g, ' ')

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${style}`}
    >
      {label.toLowerCase()}
    </span>
  )
}

const SkeletonLoader = () => (
  <div className="container mx-auto max-w-7xl animate-pulse space-y-8 p-6">
    <div className="h-48 w-full rounded-3xl bg-gray-200"></div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 rounded-2xl bg-gray-200"></div>
      ))}
    </div>
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="h-96 rounded-2xl bg-gray-200 lg:col-span-2"></div>
      <div className="h-96 rounded-2xl bg-gray-200"></div>
    </div>
  </div>
)

// --- Main Page Component ---

export default function TechnicianDashboard() {
  const { status, data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchDashboardData = useCallback(async () => {
    try {
      const query = statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''
      const res = await fetch(`/api/technicians/me/dashboard${query}`)

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
      // Small delay for smooth transition feeling
      setTimeout(() => setLoading(false), 300)
    }
  }, [statusFilter, toast])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status, router, fetchDashboardData])

  if (status === 'loading' || loading) {
    return <SkeletonLoader />
  }

  if (!data) return null

  const { profile, stats, orders, services } = data
  const user = profile.user

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Decorative Background */}
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-indigo-50/50 to-transparent" />

      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-white shadow-lg">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'Technician'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white">
                  {user.name?.charAt(0) || 'T'}
                </div>
              )}
              <div
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                  profile.isAvailable ? 'bg-emerald-500' : 'bg-gray-400'
                }`}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Halo, {user.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-500">
                Selamat datang kembali di dashboard teknisi Anda.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.specialties.map((spec, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-inset ring-gray-200"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard/teknisi/settings">
              <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md">
                <Settings className="h-4 w-4" />
                Pengaturan
              </button>
            </Link>
            <Link href="/dashboard/teknisi/services">
              {/* Assuming this route exists or uses settings, adding for design completeness */}
              <button className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/20 active:scale-95">
                <Plus className="h-4 w-4" />
                Layanan Baru
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Pendapatan"
            value={new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              maximumFractionDigits: 0,
            }).format(stats.totalRevenue)}
            icon={Wallet}
            color="green"
            trend="+12% bulan ini"
          />
          <StatCard
            title="Pesanan Aktif"
            value={stats.activeOrders}
            subtitle={`${stats.ordersByStatus.pending} menunggu konfirmasi`}
            icon={Briefcase}
            color="blue"
          />
          <StatCard
            title="Total Pesanan"
            value={stats.totalOrders}
            subtitle={`${stats.completedOrders} selesai`}
            icon={Package}
            color="purple"
          />
          <StatCard
            title="Rating"
            value={stats.averageRating.toFixed(1)}
            subtitle={`Dari ${stats.totalReviews} ulasan`}
            icon={Star}
            color="orange"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Orders */}
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Pesanan Terbaru
              </h2>
              <div className="flex rounded-lg bg-gray-100 p-1">
                {['ALL', 'IN_PROGRESS', 'COMPLETED'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      statusFilter === filter
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {filter === 'ALL' ? 'Semua' : filter.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-gray-900">
                    Belum ada pesanan
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Pesanan yang masuk akan muncul di sini.
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="group relative flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-indigo-100 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600">
                        {/* Placeholder icon based on category logic could go here */}
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            #{order.orderNumber}
                          </h3>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {order.items[0]?.service.name || 'Jasa Service'} •{' '}
                          {order.user.name}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(
                              new Date(order.createdAt),
                              'dd MMM yyyy, HH:mm',
                              { locale: id }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-gray-50 pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            maximumFractionDigits: 0,
                          }).format(order.total)}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/teknisi/orders/${order.id}`} // Assuming detailed view route
                        className="flex items-center gap-1 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                      >
                        Detail <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            {orders.length > 0 && (
              <div className="text-center">
                <Link
                  href="/dashboard/teknisi/orders"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Lihat semua pesanan history
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-8">
            {/* Availability Card */}
            <div
              className={`rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg ${
                profile.isAvailable
                  ? 'from-indigo-500 to-purple-600'
                  : 'from-gray-700 to-gray-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Status Teknisi</h3>
                <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                  {profile.isAvailable ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </div>
              </div>
              <p className="mt-2 text-indigo-100 opacity-90">
                {profile.isAvailable
                  ? 'Anda sedang online dan dapat menerima pesanan baru.'
                  : 'Anda sedang offline. Aktifkan status untuk menerima pesanan.'}
              </p>
              <button
                onClick={() => router.push('/dashboard/teknisi/settings')}
                className="mt-6 w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Ubah Status
              </button>
            </div>

            {/* Quick Services List */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Layanan Anda</h3>
                <Link
                  href="/dashboard/teknisi/settings"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Kelola
                </Link>
              </div>
              <div className="space-y-4">
                {services.slice(0, 5).map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {service.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {service.category}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        maximumFractionDigits: 0,
                      }).format(service.price)}
                    </p>
                  </div>
                ))}
                {services.length === 0 && (
                  <p className="py-4 text-center text-sm text-gray-500">
                    Belum ada layanan
                  </p>
                )}
              </div>
              <Link href="/dashboard/teknisi/settings">
                <button className="mt-4 w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900">
                  + Tambah Layanan
                </button>
              </Link>
            </div>

            {/* Support / Help */}
            <div className="rounded-2xl bg-indigo-50 p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-indigo-900">Butuh Bantuan?</h4>
              <p className="mt-1 text-sm text-indigo-700/80">
                Hubungi admin support jika Anda mengalami kendala dengan
                pesanan.
              </p>
              <button className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-800">
                Hubungi Admin &rarr;
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
