'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
  user: { name: string | null; email: string }
  store: { name: string; city: string } | null
  items: {
    product?: { name: string } | null
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

interface StoreAdminStats {
  totalProducts: number
  totalStock: number
  pendingOrders: number
  totalOrders: number
}

interface SuperAdminStats {
  totalOrders: number
  totalRevenue: number
  totalStores: number
  totalUsers: number
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
      return { label: 'Perlu Dikirim', type: 'danger' }
    case 'PROCESSING':
      return { label: 'Diproses', type: 'info' }
    case 'SHIPPED':
      return { label: 'Dikirim', type: 'info' }
    case 'DELIVERED':
      return { label: 'Terkirim', type: 'success' }
    case 'COMPLETED':
      return { label: 'Selesai', type: 'success' }
    case 'CANCELLED':
      return { label: 'Dibatalkan', type: 'danger' }
    default:
      return { label: status, type: 'info' }
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
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  // Real data state
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([])
  const [inventory, setInventory] = useState<DashboardProduct[]>([])
  const [storeStats, setStoreStats] = useState<StoreAdminStats | null>(null)
  const [superStats, setSuperStats] = useState<SuperAdminStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  const userRole = session?.user?.role || 'STORE_ADMIN'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isAdminPlatform = userRole === 'ADMIN'
  const isStoreAdmin = userRole === 'STORE_ADMIN'

  // ── Fetch dashboard data ──────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setLoadingData(true)
    try {
      if (isStoreAdmin) {
        // Fetch recent orders (already scoped by storeId in API)
        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/admin/orders?limit=5&page=1'),
          fetch('/api/admin/products?limit=5&isActive=true'),
        ])

        if (ordersRes.ok) {
          const data = await ordersRes.json()
          const orders: DashboardOrder[] = data.orders || []
          setRecentOrders(orders)
          setStoreStats({
            totalOrders: data.pagination?.total ?? orders.length,
            pendingOrders: orders.filter((o: DashboardOrder) =>
              ['PENDING_PAYMENT', 'PAID', 'PROCESSING'].includes(o.status)
            ).length,
            totalProducts: 0, // filled below
            totalStock: 0,
          })
        }

        if (productsRes.ok) {
          const data = await productsRes.json()
          const products: DashboardProduct[] = data.products || []
          setInventory(products)
          setStoreStats((prev) =>
            prev
              ? {
                  ...prev,
                  totalProducts: data.pagination?.total ?? products.length,
                  totalStock: products.reduce(
                    (s: number, p: DashboardProduct) => s + p.stock,
                    0
                  ),
                }
              : {
                  totalOrders: 0,
                  pendingOrders: 0,
                  totalProducts: data.pagination?.total ?? products.length,
                  totalStock: products.reduce(
                    (s: number, p: DashboardProduct) => s + p.stock,
                    0
                  ),
                }
          )
        }
      } else if (isSuperAdmin || isAdminPlatform) {
        const [ordersRes, dashRes] = await Promise.all([
          fetch('/api/admin/orders?limit=5&page=1'),
          fetch('/api/admin/dashboard'),
        ])

        if (ordersRes.ok) {
          const data = await ordersRes.json()
          setRecentOrders(data.orders || [])
        }

        if (dashRes.ok) {
          const data = await dashRes.json()
          setSuperStats({
            totalOrders: data.stats?.totalOrders ?? 0,
            totalRevenue: 0, // calculate below from orders
            totalStores: 5,
            totalUsers: data.stats?.totalUsers ?? 0,
          })
        }
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoadingData(false)
    }
  }, [isStoreAdmin, isSuperAdmin, isAdminPlatform])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && status === 'authenticated') {
      fetchDashboardData()
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {/* Inventori */}
          <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-orange-200 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Inventori Cabang
              </span>
              <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              {loadingData ? (
                <div className="h-5 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              ) : (
                <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  {storeStats?.totalStock ?? 0} Unit Fisik
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {storeStats?.totalProducts ?? 0} Model
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · Ready stock
                </span>
              </div>
            </div>
          </div>

          {/* Pesanan Masuk */}
          <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-orange-200 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pesanan Masuk
              </span>
              <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <PackageCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              {loadingData ? (
                <div className="h-5 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              ) : (
                <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  {storeStats?.totalOrders ?? 0} Pesanan
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  {storeStats?.pendingOrders ?? 0} Perlu Diproses
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · JNE &amp; Gojek
                </span>
              </div>
            </div>
          </div>

          {/* Proteksi Garansi */}
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
                100% Terlindungi
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Garansi 30 Hari
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · Tukar unit second
                </span>
              </div>
            </div>
          </div>

          {/* Jam Operasional */}
          <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Operasional Toko
              </span>
              <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Store className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                Buka Operasional
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  10:00 – 21:00 WIB
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · Pickup
                </span>
              </div>
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
                  {recentOrders
                    .reduce((s, o) => s + o.total, 0)
                    .toLocaleString('id-ID')}
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
              <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
                <span className="mr-1 text-xs font-semibold text-orange-500">
                  Rp
                </span>
                {Math.round(
                  recentOrders.reduce((s, o) => s + o.total * 0.025, 0)
                ).toLocaleString('id-ID')}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  2.5% Rate
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
              <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                5 Toko Aktif
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  100% Beroperasi
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · 5 Kota
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
                100% Aman
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Garansi 30 Hari
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · 0 antrean
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
                  {superStats?.totalOrders ?? '—'} Pesanan
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
              <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                5 Cabang
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Terverifikasi
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · 5 Kota
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
                100% Aman
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Garansi 30 Hari
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  · 0 antrean
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. 2-COLUMN BENTO SECTION                                          */}
      {/* ================================================================= */}

      {/* STORE ADMIN: Inventory + Pesanan Masuk (REAL DATA) */}
      {isStoreAdmin && (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          {/* Left: Inventori Ready Stock */}
          <div className="shadow-2xs flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800/80">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-950 dark:text-white sm:text-base">
                  Inventori Ready Stock Toko
                </h2>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  Unit fisik tersedia di cabang Anda
                </p>
              </div>
              <Link
                href="/dashboard/admin/products"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
              >
                <span>Kelola Stok</span>
                <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </Link>
            </div>

            {loadingData ? (
              <div className="space-y-4 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-40 rounded bg-slate-100 dark:bg-slate-800" />
                      <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="h-4 w-20 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : inventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
                <p className="text-xs font-semibold text-slate-500">
                  Belum ada produk di toko ini
                </p>
                <Link
                  href="/dashboard/admin/products"
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-950 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  Tambah Produk
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 pt-2 dark:divide-slate-800/60">
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between gap-3 py-3.5 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 sm:text-sm">
                        {item.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-semibold ${item.stock <= 3 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                        >
                          {item.stock} Unit{' '}
                          {item.stock <= 3 ? '⚠ Terbatas' : 'Ready'}
                        </span>
                        <span className="text-[11px] text-slate-300 dark:text-slate-600">
                          ·
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.brand ?? '—'}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-xs font-bold tabular-nums text-slate-950 dark:text-white sm:text-sm">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Pesanan Masuk Cabang Toko (REAL DATA) */}
          <div className="shadow-2xs flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800/80">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-950 dark:text-white sm:text-base">
                  Pesanan Masuk Cabang Toko
                </h2>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  Alokasi pesanan pembeli yang siap diproses
                </p>
              </div>
              <Link
                href="/dashboard/admin/orders"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
              >
                <span>Proses Pesanan</span>
                <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </Link>
            </div>

            {loadingData ? (
              <div className="space-y-4 pt-2">
                {[1, 2].map((i) => (
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
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <PackageCheck className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Belum ada pesanan masuk untuk toko ini
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Pesanan dari customer akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 pt-2 dark:divide-slate-800/60">
                {recentOrders.map((order) => {
                  const { label, type } = getOrderStatusLabel(order.status)
                  return (
                    <div
                      key={order.id}
                      className="group flex items-center justify-between gap-3 py-3.5 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {order.orderNumber.slice(0, 18)}
                          </span>
                          <span className="text-[11px] text-slate-300 dark:text-slate-600">
                            ·
                          </span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {order.user.name ?? order.user.email}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {getFirstItemName(order)}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {order.courierCode ?? 'JNE'} · Asuransi 100% ·{' '}
                          {timeAgo(order.createdAt)}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-mono text-xs font-bold tabular-nums text-slate-950 dark:text-white sm:text-sm">
                          Rp {order.total.toLocaleString('id-ID')}
                        </p>
                        <span
                          className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
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
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
              {[
                {
                  name: 'PT Gadget Jaya Sentosa',
                  branch: 'Roxy Mas Pusat',
                  city: 'Jakarta Pusat',
                },
                {
                  name: 'PT Sinar Gadget Nusantara',
                  branch: 'WTC Surabaya',
                  city: 'Surabaya',
                },
                {
                  name: 'PT Digital Niaga Prima',
                  branch: 'BEC Bandung',
                  city: 'Bandung',
                },
                {
                  name: 'PT Surya Makmur Gadget',
                  branch: 'Plaza Medan Fair',
                  city: 'Medan',
                },
                {
                  name: 'PT Mega Ponsel Nusantara',
                  branch: 'Jogjatronik Mall',
                  city: 'Yogyakarta',
                },
              ].map((store, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between gap-3 py-3.5 transition-colors first:pt-2 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shadow-2xs flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-200/60 bg-orange-100/80 text-xs font-bold text-orange-700 dark:border-orange-800/40 dark:bg-orange-950/60 dark:text-orange-300">
                      {store.branch.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 sm:text-sm">
                        {store.branch}
                      </p>
                      <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                        {store.name} · {store.city}
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
                  href: '/dashboard/admin/complaints',
                  icon: ShieldCheck,
                  label: 'Klaim Garansi',
                  sub: 'Pusat komplain & garansi 30 hari',
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
