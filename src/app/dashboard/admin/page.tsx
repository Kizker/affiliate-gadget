'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import {
  DollarSign,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Store,
  Percent,
  Smartphone,
  Users,
  PackageCheck,
  Loader2,
  Package,
  Settings,
  Clock,
  RotateCcw,
  Truck,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface DashboardOrder {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  courierCode: string | null
  courierService: string | null
  user: { name: string | null; email: string; phone?: string | null }
  store: { name: string; city: string } | null
  items: {
    product?: { name: string; images?: string[] } | null
    rentalItem?: { name: string } | null
    service?: { name: string } | null
  }[]
}

interface DashboardProduct {
  id: string
  name: string
  brand: string | null
  stock: number
  price: number
  isActive: boolean
}

interface DashboardReturn {
  id: string
  orderId: string
  reason: string
  reasonLabel?: string | null
  description?: string
  type: string
  status: string
  refundAmount?: number | null
  createdAt: string
  order?: {
    id: string
    orderNumber: string
    total: number
    createdAt: string
  } | null
  user?: {
    id?: string
    name: string | null
    email: string
    phone?: string | null
  } | null
}

interface DashboardCancelledOrder {
  id: string
  orderNumber: string
  total: number
  updatedAt: string
  createdAt: string
  user: {
    name: string | null
    email: string
  }
  items: {
    product?: {
      name: string
    } | null
  }[]
}

interface OrderStatusCounts {
  pendingPayment: number
  paid: number
  inProgress: number
  shipped: number
  completed: number
  cancelled: number
  returned: number
}

interface StoreAdminStats {
  todayRevenue: number
  todayOrdersCount: number
  totalProducts: number
  totalStock: number
  lowStockCount: number
  outOfStockCount: number
  pendingOrders: number
  totalOrders: number
  pendingReturns: number
  totalReturns: number
  orderStatusCounts: OrderStatusCounts
}

interface SuperAdminStats {
  totalOrders: number
  totalRevenue: number
  totalPlatformCommission: number
  totalStores: number
  totalUsers: number
  totalProducts?: number
  activeComplaints: number
  storesList: {
    id: string
    name: string
    companyName: string
    city: string
    phone: string
    rating: number
    totalSales: number
  }[]
}

// ============================================================
// HELPERS
// ============================================================

function getOrderStatusLabel(status: string): {
  label: string
  type: 'danger' | 'warning' | 'success' | 'info'
} {
  switch (status) {
    case 'PENDING_PAYMENT':
      return { label: 'Menunggu Bayar', type: 'warning' }
    case 'PAID':
      return { label: 'Perlu Diproses', type: 'danger' }
    case 'IN_PROGRESS':
    case 'PROCESSING':
      return { label: 'Sedang Diproses', type: 'info' }
    case 'SHIPPED':
      return { label: 'Dikirim', type: 'info' }
    case 'DELIVERED':
      return { label: 'Terkirim', type: 'success' }
    case 'COMPLETED':
      return { label: 'Selesai', type: 'success' }
    case 'CANCELLED':
      return { label: 'Dibatalkan', type: 'danger' }
    case 'RETURNED':
      return { label: 'Retur Selesai', type: 'warning' }
    case 'COMPLAINED':
      return { label: 'Komplain/Retur', type: 'warning' }
    default:
      return { label: status, type: 'info' }
  }
}

function getReturnStatusBadge(status: string): {
  label: string
  badgeClass: string
} {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Menunggu Review',
        badgeClass:
          'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/80',
      }
    case 'IN_REVIEW':
      return {
        label: 'Sedang Ditinjau',
        badgeClass:
          'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/80',
      }
    case 'APPROVED':
      return {
        label: 'Disetujui',
        badgeClass:
          'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/80',
      }
    case 'REJECTED':
      return {
        label: 'Ditolak',
        badgeClass:
          'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/80',
      }
    case 'COMPLETED':
      return {
        label: 'Selesai',
        badgeClass:
          'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      }
    default:
      return {
        label: status,
        badgeClass:
          'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400',
      }
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} mnt lalu`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} jam lalu`
  return `${Math.floor(hrs / 24)} hari lalu`
}

function getFirstItemName(order: DashboardOrder): string {
  const item = order.items[0]
  if (!item) return '—'
  return (
    item.product?.name || item.rentalItem?.name || item.service?.name || '—'
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  // Real data state
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([])
  const [inventory, setInventory] = useState<DashboardProduct[]>([])
  const [recentReturns, setRecentReturns] = useState<DashboardReturn[]>([])
  const [recentCancellations, setRecentCancellations] = useState<
    DashboardCancelledOrder[]
  >([])
  const [storeStats, setStoreStats] = useState<StoreAdminStats | null>(null)
  const [superStats, setSuperStats] = useState<SuperAdminStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [returnTab, setReturnTab] = useState<'RETURNS' | 'CANCELLATIONS'>(
    'RETURNS'
  )
  const [orderFilter, setOrderFilter] = useState<
    'ALL' | 'PAID' | 'IN_PROGRESS' | 'SHIPPED' | 'COMPLETED'
  >('ALL')

  const filteredOrders = useMemo(() => {
    return recentOrders.filter((order) => {
      if (orderFilter === 'ALL') return true
      if (orderFilter === 'PAID') return order.status === 'PAID'
      if (orderFilter === 'IN_PROGRESS') {
        return ['IN_PROGRESS', 'PROCESSING'].includes(order.status)
      }
      if (orderFilter === 'SHIPPED') return order.status === 'SHIPPED'
      if (orderFilter === 'COMPLETED') {
        return ['COMPLETED', 'DELIVERED'].includes(order.status)
      }
      return true
    })
  }, [recentOrders, orderFilter])

  const userRole = session?.user?.role || 'STORE_ADMIN'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isAdminPlatform = userRole === 'ADMIN'
  const isStoreAdmin = userRole === 'STORE_ADMIN'

  // ── Fetch dashboard data ──────────────────────────────────
  const fetchDashboardData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoadingData(true)
      try {
        const cacheBuster = `_t=${Date.now()}`
        const fetchOptions: RequestInit = {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }

        if (isStoreAdmin) {
          const [ordersRes, productsRes, dashRes] = await Promise.all([
            fetch(
              `/api/admin/orders?limit=100&page=1&${cacheBuster}`,
              fetchOptions
            ),
            fetch(
              `/api/admin/products?limit=20&isActive=true&${cacheBuster}`,
              fetchOptions
            ),
            fetch(`/api/admin/dashboard?${cacheBuster}`, fetchOptions),
          ])

          let ordersData: DashboardOrder[] = []
          if (ordersRes.ok) {
            const data = await ordersRes.json()
            ordersData = data.orders || []
            setRecentOrders(ordersData)
          }

          let productsData: DashboardProduct[] = []
          let totalProducts = 0
          let totalStock = 0
          if (productsRes.ok) {
            const data = await productsRes.json()
            productsData = data.products || []
            setInventory(productsData)
            totalProducts = data.pagination?.total ?? productsData.length
            totalStock = productsData.reduce(
              (s: number, p: DashboardProduct) => s + (p.stock || 0),
              0
            )
          }

          if (dashRes.ok) {
            const dash = await dashRes.json()
            const stats = dash.stats || {}
            setRecentReturns(dash.recentReturns || [])
            setRecentCancellations(dash.recentCancellations || [])
            setStoreStats({
              todayRevenue: stats.todayRevenue ?? 0,
              todayOrdersCount: stats.todayOrdersCount ?? 0,
              totalOrders: stats.totalOrders ?? ordersData.length,
              pendingOrders:
                (stats.orderStatusCounts?.paid ?? 0) +
                (stats.orderStatusCounts?.inProgress ?? 0),
              totalProducts: stats.totalProducts ?? totalProducts,
              totalStock: stats.totalStock ?? totalStock,
              lowStockCount: stats.lowStockCount ?? 0,
              outOfStockCount: stats.outOfStockCount ?? 0,
              pendingReturns: stats.returnStats?.pendingReturns ?? 0,
              totalReturns: stats.returnStats?.totalReturns ?? 0,
              orderStatusCounts: stats.orderStatusCounts || {
                pendingPayment: 0,
                paid: 0,
                inProgress: 0,
                shipped: 0,
                completed: 0,
                cancelled: 0,
                returned: 0,
              },
            })
          } else {
            // Fallback if dash endpoint unavailable
            setStoreStats({
              todayRevenue: 0,
              todayOrdersCount: 0,
              totalOrders: ordersData.length,
              pendingOrders: ordersData.filter((o) =>
                [
                  'PENDING_PAYMENT',
                  'PAID',
                  'PROCESSING',
                  'IN_PROGRESS',
                ].includes(o.status)
              ).length,
              totalProducts,
              totalStock,
              lowStockCount: productsData.filter(
                (p) => p.stock > 0 && p.stock <= 2
              ).length,
              outOfStockCount: productsData.filter((p) => p.stock <= 0).length,
              pendingReturns: 0,
              totalReturns: 0,
              orderStatusCounts: {
                pendingPayment: ordersData.filter(
                  (o) => o.status === 'PENDING_PAYMENT'
                ).length,
                paid: ordersData.filter((o) => o.status === 'PAID').length,
                inProgress: ordersData.filter((o) =>
                  ['IN_PROGRESS', 'PROCESSING'].includes(o.status)
                ).length,
                shipped: ordersData.filter((o) => o.status === 'SHIPPED')
                  .length,
                completed: ordersData.filter((o) =>
                  ['COMPLETED', 'DELIVERED'].includes(o.status)
                ).length,
                cancelled: ordersData.filter((o) => o.status === 'CANCELLED')
                  .length,
                returned: ordersData.filter((o) =>
                  ['RETURNED', 'COMPLAINED'].includes(o.status)
                ).length,
              },
            })
          }
        } else if (isSuperAdmin || isAdminPlatform) {
          const [ordersRes, dashRes] = await Promise.all([
            fetch(
              `/api/admin/orders?limit=10&page=1&${cacheBuster}`,
              fetchOptions
            ),
            fetch(`/api/admin/dashboard?${cacheBuster}`, fetchOptions),
          ])

          if (ordersRes.ok) {
            const data = await ordersRes.json()
            setRecentOrders(data.orders || [])
          }

          if (dashRes.ok) {
            const data = await dashRes.json()
            setSuperStats({
              totalOrders: data.stats?.totalOrders ?? 0,
              totalRevenue: data.stats?.totalRevenue ?? 0,
              totalPlatformCommission: data.stats?.totalPlatformCommission ?? 0,
              totalStores: data.stats?.totalStores ?? 0,
              totalUsers: data.stats?.totalUsers ?? 0,
              totalProducts: data.stats?.totalProducts ?? 0,
              activeComplaints: data.stats?.activeComplaints ?? 0,
              storesList: data.stats?.storesList ?? [],
            })
          }
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        if (!isSilent) setLoadingData(false)
      }
    },
    [isStoreAdmin, isSuperAdmin, isAdminPlatform]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && status === 'authenticated') {
      fetchDashboardData()

      // ── Real-time background update polling (3 detik) ───────
      const intervalId = setInterval(() => {
        fetchDashboardData(true)
      }, 3000)

      // ── Auto refresh seketika saat window tab aktif / kembali fokus ─
      const handleFocus = () => {
        fetchDashboardData(true)
      }
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchDashboardData(true)
        }
      }

      window.addEventListener('focus', handleFocus)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('admin-notifications-refresh', handleFocus)
      window.addEventListener('orders-updated', handleFocus)
      window.addEventListener('storage', handleFocus)

      return () => {
        clearInterval(intervalId)
        window.removeEventListener('focus', handleFocus)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('admin-notifications-refresh', handleFocus)
        window.removeEventListener('orders-updated', handleFocus)
        window.removeEventListener('storage', handleFocus)
      }
    }
  }, [mounted, status, fetchDashboardData])

  // ── Loading skeleton ──────────────────────────────────────
  if (!mounted || status === 'loading') {
    return (
      <div
        className="mx-auto max-w-6xl animate-pulse space-y-6 pb-12"
        suppressHydrationWarning
      >
        <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shadow-2xs flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-6 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-20 rounded-md bg-slate-100 dark:bg-slate-800/60" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          <div className="shadow-2xs h-80 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" />
          <div className="shadow-2xs h-80 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="mx-auto max-w-6xl space-y-6 pb-12 pt-1"
      suppressHydrationWarning
    >
      {/* ================================================================= */}
      {/* 1. KPI CARDS                                                        */}
      {/* ================================================================= */}

      {/* STORE ADMIN METRICS */}
      {isStoreAdmin && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {/* 1. Omset Toko Hari Ini */}
            <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Omset Toko Hari Ini
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                {loadingData ? (
                  <div className="h-6 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                ) : (
                  <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
                    <span className="mr-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Rp
                    </span>
                    {(storeStats?.todayRevenue ?? 0).toLocaleString('id-ID')}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    ● Hari Ini
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    · {storeStats?.todayOrdersCount ?? 0} pesanan masuk
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Pesanan Butuh Proses Cepat (Prioritas Utama) */}
            <Link
              href="/dashboard/admin/orders?status=PAID"
              className="shadow-2xs hover:shadow-xs group relative flex flex-col justify-between rounded-2xl border border-orange-200/90 bg-orange-50/40 p-4 transition-all duration-200 hover:border-orange-400 hover:bg-orange-50/70 dark:border-orange-900/50 dark:bg-orange-950/20 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                    Perlu Proses Cepat
                  </span>
                  {(storeStats?.orderStatusCounts?.paid ?? 0) > 0 && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                    </span>
                  )}
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                  <PackageCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                {loadingData ? (
                  <div className="h-6 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                ) : (
                  <p className="text-lg font-black tabular-nums tracking-tight text-orange-950 dark:text-orange-200 sm:text-xl">
                    {storeStats?.orderStatusCounts?.paid ?? 0} Pesanan
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                  <span className="font-semibold text-orange-700 dark:text-orange-300">
                    Siap Packing &amp; Kirim
                  </span>
                  <span className="text-orange-600/70 dark:text-orange-400/70">
                    · JNE &amp; Gojek
                  </span>
                </div>
              </div>
            </Link>

            {/* 3. Alert Stok Cabang */}
            <Link
              href="/dashboard/admin/products"
              className={`shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 sm:p-5 ${
                (storeStats?.lowStockCount ?? 0) +
                  (storeStats?.outOfStockCount ?? 0) >
                0
                  ? 'border-amber-200/90 bg-amber-50/30 hover:border-amber-400 hover:bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Alert Stok Cabang
                </span>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    (storeStats?.lowStockCount ?? 0) +
                      (storeStats?.outOfStockCount ?? 0) >
                    0
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                {loadingData ? (
                  <div className="h-6 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                ) : (
                  <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                    {(storeStats?.lowStockCount ?? 0) +
                      (storeStats?.outOfStockCount ?? 0) >
                    0 ? (
                      <span className="text-amber-900 dark:text-amber-200">
                        {(storeStats?.lowStockCount ?? 0) +
                          (storeStats?.outOfStockCount ?? 0)}{' '}
                        Unit Kritis
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Stok Aman
                      </span>
                    )}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {storeStats?.outOfStockCount ?? 0} Habis ·{' '}
                    {storeStats?.lowStockCount ?? 0} Menipis (≤2)
                  </span>
                </div>
              </div>
            </Link>

            {/* 4. Retur & Pembatalan */}
            <Link
              href={
                (storeStats?.pendingReturns ?? 0) > 0
                  ? '/dashboard/admin/returns'
                  : '/dashboard/admin/orders?status=CANCELLED'
              }
              className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-rose-200 dark:border-slate-800 dark:bg-slate-900 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Retur &amp; Pembatalan
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  <RotateCcw className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                {loadingData ? (
                  <div className="h-6 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                ) : (
                  <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                    {(storeStats?.pendingReturns ?? 0) +
                      (storeStats?.orderStatusCounts?.cancelled ?? 0)}{' '}
                    Kasus Perhatian
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    {storeStats?.pendingReturns ?? 0} Pengajuan Retur
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    · {storeStats?.orderStatusCounts?.cancelled ?? 0} Batal
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* STATUS PESANAN DI DASHBOARD */}
          <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Status Pesanan di Dashboard
              </h3>
              <Link
                href="/dashboard/admin/orders"
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 transition hover:text-orange-700 dark:text-orange-400"
              >
                <span>Kelola Semua Pesanan</span>
                <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {/* 1. Perlu Diproses (PAID) - Prioritas Utama */}
              <Link
                href="/dashboard/admin/orders?status=PAID"
                className="hover:shadow-xs group relative flex flex-col justify-between rounded-xl border border-orange-200/90 bg-orange-50/60 p-3 transition-all hover:border-orange-400 hover:bg-orange-50/80 dark:border-orange-900/50 dark:bg-orange-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                    Perlu Diproses
                  </span>
                  {(storeStats?.orderStatusCounts?.paid ?? 0) > 0 && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xl font-black tabular-nums text-orange-950 dark:text-orange-200">
                  {storeStats?.orderStatusCounts?.paid ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-orange-700/80 dark:text-orange-400">
                  Siap packing &amp; kirim
                </p>
              </Link>

              {/* 2. Sedang Diproses (IN_PROGRESS) */}
              <Link
                href="/dashboard/admin/orders?status=IN_PROGRESS"
                className="hover:shadow-xs group flex flex-col justify-between rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 transition-all hover:border-indigo-300 hover:bg-indigo-50/70 dark:border-indigo-900/40 dark:bg-indigo-950/20"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Sedang Diproses
                </span>
                <p className="mt-2 text-xl font-black tabular-nums text-indigo-950 dark:text-indigo-200">
                  {storeStats?.orderStatusCounts?.inProgress ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] text-indigo-500 dark:text-indigo-400">
                  Menunggu pickup kurir
                </p>
              </Link>

              {/* 3. Sedang Dikirim (SHIPPED) */}
              <Link
                href="/dashboard/admin/orders?status=SHIPPED"
                className="hover:shadow-xs group flex flex-col justify-between rounded-xl border border-blue-100 bg-blue-50/40 p-3 transition-all hover:border-blue-300 hover:bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/20"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Sedang Dikirim
                </span>
                <p className="mt-2 text-xl font-black tabular-nums text-blue-950 dark:text-blue-200">
                  {storeStats?.orderStatusCounts?.shipped ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] text-blue-500 dark:text-blue-400">
                  JNE / Gojek asuransi
                </p>
              </Link>

              {/* 4. Selesai (COMPLETED) */}
              <Link
                href="/dashboard/admin/orders?status=COMPLETED"
                className="hover:shadow-xs group flex flex-col justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 transition-all hover:border-emerald-300 hover:bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Selesai
                </span>
                <p className="mt-2 text-xl font-black tabular-nums text-emerald-950 dark:text-emerald-200">
                  {storeStats?.orderStatusCounts?.completed ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                  Pesanan sukses
                </p>
              </Link>

              {/* 5. Menunggu Bayar (PENDING_PAYMENT) */}
              <Link
                href="/dashboard/admin/orders?status=PENDING_PAYMENT"
                className="hover:shadow-xs group flex flex-col justify-between rounded-xl border border-amber-100 bg-amber-50/40 p-3 transition-all hover:border-amber-300 hover:bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Menunggu Bayar
                </span>
                <p className="mt-2 text-xl font-black tabular-nums text-amber-950 dark:text-amber-200">
                  {storeStats?.orderStatusCounts?.pendingPayment ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                  Belum transfer
                </p>
              </Link>

              {/* 6. Retur & Batal (RETURNS & CANCELLED) */}
              <Link
                href={
                  (storeStats?.pendingReturns ?? 0) > 0
                    ? '/dashboard/admin/returns'
                    : '/dashboard/admin/orders?status=CANCELLED'
                }
                className="hover:shadow-xs group flex flex-col justify-between rounded-xl border border-rose-100 bg-rose-50/40 p-3 transition-all hover:border-rose-300 hover:bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    Retur &amp; Batal
                  </span>
                  {((storeStats?.pendingReturns ?? 0) > 0 ||
                    (storeStats?.orderStatusCounts?.cancelled ?? 0) > 0) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  )}
                </div>
                <p className="mt-2 text-xl font-black tabular-nums text-rose-950 dark:text-rose-200">
                  {(storeStats?.pendingReturns ?? 0) +
                    (storeStats?.orderStatusCounts?.cancelled ?? 0)}
                </p>
                <p className="mt-0.5 text-[10px] text-rose-600 dark:text-rose-400">
                  {storeStats?.pendingReturns ?? 0} retur ·{' '}
                  {storeStats?.orderStatusCounts?.cancelled ?? 0} batal
                </p>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN METRICS */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-orange-200 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total Omzet Jaringan
              </span>
              <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              {loadingData ? (
                <div className="h-5 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              ) : (
                <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  <span className="mr-1 text-xs font-semibold text-orange-500">
                    Rp
                  </span>
                  {(superStats?.totalRevenue ?? 0).toLocaleString('id-ID')}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                  Real-time
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · {superStats?.totalOrders ?? '—'} pesanan
                </span>
              </div>
            </div>
          </div>

          <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-orange-200 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Komisi Platform
              </span>
              <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <Percent className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              {loadingData ? (
                <div className="h-5 w-28 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              ) : (
                <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  <span className="mr-1 text-xs font-semibold text-orange-500">
                    Rp
                  </span>
                  {(superStats?.totalPlatformCommission ?? 0).toLocaleString(
                    'id-ID'
                  )}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  2.0% - 2.5% Rate
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · Bagi hasil
                </span>
              </div>
            </div>
          </div>

          <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Jaringan Toko
              </span>
              <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Store className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              {loadingData ? (
                <div className="h-5 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              ) : (
                <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  {superStats?.totalStores ?? 0} Toko Aktif
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  100% Beroperasi
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · Seluruh Jaringan PT
                </span>
              </div>
            </div>
          </div>

          <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Proteksi Garansi
              </span>
              <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                {(superStats?.activeComplaints ?? 0) > 0
                  ? `${superStats?.activeComplaints} Kasus Aktif`
                  : '100% Aman'}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Garansi 30 Hari
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · {superStats?.activeComplaints ?? 0} antrean komplain
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PLATFORM METRICS */}
      {isAdminPlatform && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-orange-200 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Katalog Gadget
              </span>
              <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              {loadingData ? (
                <div className="h-5 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              ) : (
                <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  {superStats?.totalProducts ?? 0} Gadget
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  Aktif
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · Katalog publik
                </span>
              </div>
            </div>
          </div>

          <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Daftar Toko
              </span>
              <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Store className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              {loadingData ? (
                <div className="h-5 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              ) : (
                <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  {superStats?.totalStores ?? 0} Cabang
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Terverifikasi
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · Multi-PT
                </span>
              </div>
            </div>
          </div>

          <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pengguna
              </span>
              <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                {loadingData ? '—' : (superStats?.totalUsers ?? '—')} Akun
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Customer
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · Terdaftar
                </span>
              </div>
            </div>
          </div>

          <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Klaim Garansi
              </span>
              <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                {(superStats?.activeComplaints ?? 0) > 0
                  ? `${superStats?.activeComplaints} Kasus Aktif`
                  : '100% Aman'}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Garansi 30 Hari
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · {superStats?.activeComplaints ?? 0} antrean
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. 2-COLUMN BENTO SECTION                                          */}
      {/* ================================================================= */}

      {/* STORE ADMIN: Pesanan Masuk + Informasi Pengembalian & Pembatalan */}
      {isStoreAdmin && (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-12">
          {/* Left / Main: Pesanan Masuk Cabang Toko (PESANAN PENTING) */}
          <div
            id="pesanan-masuk-toko"
            className="shadow-2xs flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:col-span-7"
          >
            <div className="mb-2 flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight text-slate-950 dark:text-white sm:text-base">
                    Pesanan Masuk Cabang Toko
                  </h2>
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                    Prioritas Operasional
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  Alokasi pesanan pembeli yang siap diproses dan dikirim
                </p>
              </div>
              <Link
                href="/dashboard/admin/orders"
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 transition hover:text-orange-700 dark:text-orange-400"
              >
                <span>Kelola Semua Pesanan</span>
                <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </Link>
            </div>

            {/* Quick Filter Status Tabs */}
            <div className="mb-2 flex flex-wrap items-center gap-1.5 pb-2">
              <button
                type="button"
                onClick={() => setOrderFilter('ALL')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  orderFilter === 'ALL'
                    ? 'shadow-2xs bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Semua ({storeStats?.totalOrders ?? recentOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter('PAID')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  orderFilter === 'PAID'
                    ? 'shadow-2xs bg-orange-500 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-400'
                }`}
              >
                <span>Perlu Diproses</span>
                {(storeStats?.orderStatusCounts?.paid ?? 0) > 0 ? (
                  <span
                    className={`py-0.2 rounded-full px-1.5 text-[10px] font-black ${
                      orderFilter === 'PAID'
                        ? 'bg-white text-orange-600'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    {storeStats?.orderStatusCounts?.paid}
                  </span>
                ) : (
                  <span
                    className={`py-0.2 rounded-full px-1.5 text-[10px] font-bold ${
                      orderFilter === 'PAID'
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-200/70 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300'
                    }`}
                  >
                    0
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter('IN_PROGRESS')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  orderFilter === 'IN_PROGRESS'
                    ? 'shadow-2xs bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Diproses ({storeStats?.orderStatusCounts?.inProgress ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter('SHIPPED')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  orderFilter === 'SHIPPED'
                    ? 'shadow-2xs bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Dikirim ({storeStats?.orderStatusCounts?.shipped ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter('COMPLETED')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  orderFilter === 'COMPLETED'
                    ? 'shadow-2xs bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Selesai ({storeStats?.orderStatusCounts?.completed ?? 0})
              </button>
            </div>

            {loadingData ? (
              <div className="space-y-4 pt-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-48 rounded bg-slate-100 dark:bg-slate-800" />
                      <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PackageCheck className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {orderFilter === 'PAID'
                    ? 'Tidak ada pesanan yang perlu diproses'
                    : orderFilter === 'IN_PROGRESS'
                      ? 'Tidak ada pesanan yang sedang diproses'
                      : orderFilter === 'SHIPPED'
                        ? 'Tidak ada pesanan yang sedang dikirim'
                        : orderFilter === 'COMPLETED'
                          ? 'Belum ada pesanan yang selesai'
                          : 'Belum ada pesanan masuk untuk toko ini'}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {orderFilter === 'PAID'
                    ? 'Semua pesanan baru yang lunas telah diproses toko'
                    : orderFilter === 'IN_PROGRESS'
                      ? 'Pesanan yang telah dipacking dan menunggu pickup kurir akan muncul di sini'
                      : orderFilter === 'SHIPPED'
                        ? 'Pesanan yang sedang dalam perjalanan kurir akan muncul di sini'
                        : orderFilter === 'COMPLETED'
                          ? 'Pesanan yang telah sukses diterima pembeli akan tercatat di sini'
                          : 'Pesanan customer akan muncul di sini secara otomatis'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 pt-2 dark:divide-slate-800/60">
                {filteredOrders.map((order) => {
                  const { label, type } = getOrderStatusLabel(order.status)
                  return (
                    <div
                      key={order.id}
                      className="group flex flex-col justify-between gap-3 py-3.5 transition-colors sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                            #{order.orderNumber.slice(0, 18)}
                          </span>
                          <span className="text-[11px] text-slate-300 dark:text-slate-600">
                            ·
                          </span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {order.user.name ?? order.user.email}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                          {getFirstItemName(order)}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(order.createdAt)}
                          </span>
                          <span>·</span>
                          <span className="font-medium text-slate-500 dark:text-slate-400">
                            Kurir: {order.courierCode ?? 'JNE'} (
                            {order.courierService ?? 'REG'})
                          </span>
                          <span>·</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Asuransi 100%
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:text-right">
                        <p className="font-mono text-xs font-bold tabular-nums text-slate-950 dark:text-white sm:text-sm">
                          Rp {order.total.toLocaleString('id-ID')}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              type === 'danger'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                : type === 'warning'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                  : type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            }`}
                          >
                            ● {label}
                          </span>
                          <Link
                            href={`/dashboard/admin/orders?search=${encodeURIComponent(order.orderNumber)}`}
                            className="rounded-lg border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:border-orange-500 hover:text-orange-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-orange-400"
                          >
                            Rincian
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Informasi Pengembalian & Pembatalan */}
          <div className="lg:col-span-5">
            {/* Informasi Pengembalian atau Pembatalan */}
            <div
              id="pengembalian-pembatalan"
              className="shadow-2xs flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7"
            >
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold tracking-tight text-slate-950 dark:text-white sm:text-base">
                      Pengembalian &amp; Pembatalan
                    </h2>
                    {((storeStats?.pendingReturns ?? 0) > 0 ||
                      (storeStats?.orderStatusCounts?.cancelled ?? 0) > 0) && (
                      <span className="flex h-2 w-2 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    Retur unit garansi 30 hari &amp; pembatalan
                  </p>
                </div>
                <Link
                  href={
                    returnTab === 'RETURNS'
                      ? '/dashboard/admin/returns'
                      : '/dashboard/admin/orders?status=CANCELLED'
                  }
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 transition hover:text-orange-700 dark:text-orange-400"
                >
                  <span>
                    {returnTab === 'RETURNS' ? 'Menu Retur' : 'Dibatalkan'}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              </div>

              {/* Sub-tabs: Pengajuan Retur vs Dibatalkan */}
              <div className="mb-3 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setReturnTab('RETURNS')}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition ${
                    returnTab === 'RETURNS'
                      ? 'shadow-2xs bg-white text-slate-900 dark:bg-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Pengajuan Retur ({recentReturns.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReturnTab('CANCELLATIONS')}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition ${
                    returnTab === 'CANCELLATIONS'
                      ? 'shadow-2xs bg-white text-slate-900 dark:bg-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Dibatalkan ({recentCancellations.length})
                </button>
              </div>

              {/* Content tab: RETURNS */}
              {returnTab === 'RETURNS' && (
                <div>
                  {recentReturns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <RotateCcw className="mb-2.5 h-8 w-8 text-slate-200 dark:text-slate-700" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Tidak ada pengajuan retur aktif
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Semua transaksi pelanggan saat ini aman dan terlindungi
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {recentReturns.slice(0, 5).map((ret) => {
                          const { label, badgeClass } = getReturnStatusBadge(
                            ret.status
                          )
                          return (
                            <div
                              key={ret.id}
                              className="py-3 first:pt-0 last:pb-0"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                                  #
                                  {ret.order?.orderNumber?.slice(0, 16) ??
                                    'Pesanan'}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}
                                >
                                  {label}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                {ret.user?.name ??
                                  ret.user?.email ??
                                  'Customer'}{' '}
                                ·{' '}
                                <span className="font-semibold text-orange-600 dark:text-orange-400">
                                  {ret.type === 'REFUND'
                                    ? 'Pengembalian Dana'
                                    : 'Ganti Unit Baru'}
                                </span>
                              </p>
                              <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
                                Alasan: {ret.reasonLabel || ret.reason}
                              </p>
                              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                                <span>{timeAgo(ret.createdAt)}</span>
                                <Link
                                  href="/dashboard/admin/returns"
                                  className="font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400"
                                >
                                  Tinjau Retur →
                                </Link>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Link jika total pengajuan retur > 5 */}
                      {((storeStats?.pendingReturns ?? 0) > 5 ||
                        (storeStats?.totalReturns ?? 0) > 5 ||
                        recentReturns.length > 5) && (
                        <Link
                          href="/dashboard/admin/returns"
                          className="mt-3 block text-center text-[11px] font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400"
                        >
                          Lihat Semua Pengajuan Retur (
                          {storeStats?.totalReturns ||
                            storeStats?.pendingReturns ||
                            recentReturns.length}
                          ) →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Content tab: CANCELLATIONS */}
              {returnTab === 'CANCELLATIONS' && (
                <div>
                  {recentCancellations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <XCircle className="mb-2.5 h-8 w-8 text-slate-200 dark:text-slate-700" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Tidak ada pesanan yang dibatalkan
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Tidak ada riwayat pembatalan transaksi di cabang ini
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {recentCancellations.slice(0, 5).map((canc) => (
                          <div
                            key={canc.id}
                            className="py-3 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                                #{canc.orderNumber.slice(0, 16)}
                              </span>
                              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                                Dibatalkan
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">
                              {canc.user?.name ??
                                canc.user?.email ??
                                'Customer'}{' '}
                              ·{' '}
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                Rp {canc.total.toLocaleString('id-ID')}
                              </span>
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-400">
                              {canc.items?.[0]?.product?.name ?? 'Item pesanan'}
                            </p>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                              <span>
                                {timeAgo(canc.updatedAt || canc.createdAt)}
                              </span>
                              <Link
                                href="/dashboard/admin/orders?status=CANCELLED"
                                className="font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                              >
                                Lihat Rincian →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Link jika total pesanan dibatalkan > 5 */}
                      {((storeStats?.orderStatusCounts?.cancelled ?? 0) > 5 ||
                        recentCancellations.length > 5) && (
                        <Link
                          href="/dashboard/admin/orders?status=CANCELLED"
                          className="mt-3 block text-center text-[11px] font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400"
                        >
                          Lihat Semua Pesanan Dibatalkan (
                          {storeStats?.orderStatusCounts?.cancelled ||
                            recentCancellations.length}
                          ) →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN: Aktivitas Transaksi Jaringan (REAL) */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          {/* Left: Pesanan Terbaru */}
          <div className="shadow-2xs flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800/80">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-950 dark:text-white sm:text-base">
                  Aktivitas Transaksi Jaringan
                </h2>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  Pesanan real-time seluruh cabang
                </p>
              </div>
              <Link
                href="/dashboard/admin/orders"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
              >
                <span>Semua Pesanan</span>
                <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </Link>
            </div>

            {loadingData ? (
              <div className="space-y-4 pt-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-40 rounded bg-slate-100 dark:bg-slate-800" />
                      <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
                <p className="text-xs font-semibold text-slate-500">
                  Belum ada transaksi
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 pt-2 dark:divide-slate-800/60">
                {recentOrders.map((order) => {
                  const { label, type } = getOrderStatusLabel(order.status)
                  const commission = Math.round(order.total * 0.025)
                  return (
                    <div
                      key={order.id}
                      className="group flex items-center justify-between gap-3 py-3.5 transition-colors first:pt-2 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 sm:text-sm">
                            {order.user.name ?? order.user.email.split('@')[0]}
                          </span>
                          <span className="text-[11px] text-slate-300 dark:text-slate-600">
                            ·
                          </span>
                          <span className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                            {getFirstItemName(order)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          <span className="font-mono">
                            {order.orderNumber.slice(0, 16)}
                          </span>{' '}
                          · {timeAgo(order.createdAt)} ·{' '}
                          <span className="font-medium text-slate-500 dark:text-slate-400">
                            {order.store?.name ?? '—'}
                          </span>
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end text-right">
                        <p className="font-mono text-xs font-bold tabular-nums text-slate-950 dark:text-white sm:text-sm">
                          Rp {order.total.toLocaleString('id-ID')}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-orange-600 dark:text-orange-400">
                            +Rp {commission.toLocaleString('id-ID')}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              type === 'success'
                                ? 'border border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'border border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Quick Actions */}
          <div className="shadow-2xs flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800/80">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-950 dark:text-white sm:text-base">
                  Aksi Cepat
                </h2>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  Pintasan operasional superadmin
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              {[
                {
                  href: '/dashboard/admin/products',
                  icon: Smartphone,
                  label: 'Katalog Gadget',
                  sub: 'Master produk platform',
                },
                {
                  href: '/dashboard/admin/orders',
                  icon: Package,
                  label: 'Semua Pesanan',
                  sub: 'Monitor seluruh toko',
                },
                {
                  href: '/dashboard/admin/users',
                  icon: Users,
                  label: 'Pengguna',
                  sub: 'Kelola akun customer',
                },
                {
                  href: '/dashboard/admin/settings',
                  icon: Settings,
                  label: 'Pengaturan',
                  sub: 'Konfigurasi platform',
                },
              ].map(({ href, icon: Icon, label, sub }) => (
                <Link
                  key={href}
                  href={href}
                  className="hover:shadow-xs shadow-2xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-orange-300 dark:bg-slate-800/50 dark:hover:border-orange-700/80"
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-orange-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 transition group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
                      {label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                      {sub}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PLATFORM VIEW */}
      {isAdminPlatform && (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          {/* Daftar Toko */}
          <div className="shadow-2xs flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800/80">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-950 dark:text-white sm:text-base">
                  Daftar Toko
                </h2>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  5 cabang resmi beroperasi
                </p>
              </div>
              <Link
                href="/dashboard/admin/mitras"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
              >
                <span>Kelola Toko</span>
                <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 pt-2 dark:divide-slate-800/60">
              {(superStats?.storesList && superStats.storesList.length > 0
                ? superStats.storesList
                : []
              ).map((store) => (
                <div
                  key={store.id}
                  className="group flex items-center justify-between gap-3 py-3.5 transition-colors first:pt-2 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shadow-2xs flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-200/60 bg-orange-100/80 text-xs font-bold text-orange-700 dark:border-orange-800/40 dark:bg-orange-950/60 dark:text-orange-300">
                      {store.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 sm:text-sm">
                        {store.name}
                      </p>
                      <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                        {store.companyName} · {store.city}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Terverifikasi
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Aksi Cepat */}
          <div className="shadow-2xs flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800/80">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-950 dark:text-white sm:text-base">
                  Aksi Cepat
                </h2>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  Pintasan operasional platform
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3.5 pt-2 sm:grid-cols-2">
              {[
                {
                  href: '/dashboard/admin/products',
                  icon: Smartphone,
                  label: 'Katalog Gadget',
                  sub: 'Kelola & tambah model gadget',
                },
                {
                  href: '/dashboard/admin/mitras',
                  icon: Store,
                  label: 'Daftar Toko',
                  sub: 'Verifikasi cabang fisik & PT',
                },
                {
                  href: '/dashboard/admin/returns',
                  icon: RotateCcw,
                  label: 'Pengembalian & Klaim Garansi',
                  sub: 'Retur unit, garansi 30 hari & refund',
                },
                {
                  href: '/dashboard/admin/settings',
                  icon: Settings,
                  label: 'Pengaturan',
                  sub: 'Konfigurasi umum platform',
                },
              ].map(({ href, icon: Icon, label, sub }) => (
                <Link
                  key={href}
                  href={href}
                  className="hover:shadow-xs shadow-2xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-orange-300 dark:bg-slate-800/50 dark:hover:border-orange-700/80"
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-orange-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 transition group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
                      {label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                      {sub}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
