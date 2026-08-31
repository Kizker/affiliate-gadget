'use client'

import { useState, useEffect } from 'react'
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
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
  Plus,
  Settings,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState('ALL')

  useEffect(() => {
    setMounted(true)
  }, [])

  const userRole = session?.user?.role || 'STORE_ADMIN'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isAdminPlatform = userRole === 'ADMIN'
  const isStoreAdmin = userRole === 'STORE_ADMIN'

  const stats = {
    totalOmzet: 458900000,
    totalOrders: 284,
    totalStores: 5,
    totalCommission: 11472500,
    growthRate: '+18.5%',
    claimResolvedRate: '100%',
  }

  const branchPerformance = [
    {
      id: 'roxy',
      name: 'Roxy Mas Pusat',
      city: 'Jakarta Pusat',
      omzet: 'Rp 245.800.000',
      sales: 152,
      share: 53.5,
      growth: '+18.2%',
    },
    {
      id: 'surabaya',
      name: 'WTC Surabaya',
      city: 'Surabaya',
      omzet: 'Rp 128.600.000',
      sales: 80,
      share: 28.0,
      growth: '+12.4%',
    },
    {
      id: 'bandung',
      name: 'BEC Bandung',
      city: 'Bandung',
      omzet: 'Rp 84.500.000',
      sales: 52,
      share: 18.5,
      growth: '+9.1%',
    },
  ]

  const storeInventory = [
    {
      id: 'inv-1',
      name: 'iPhone 15 Pro 128GB Titanium',
      tag: 'Apple',
      stock: 8,
      price: 'Rp 18.999.000',
      status: 'Ready Stock',
    },
    {
      id: 'inv-2',
      name: 'Samsung Galaxy S24 Ultra 512GB',
      tag: 'Samsung',
      stock: 5,
      price: 'Rp 21.999.000',
      status: 'Ready Stock',
    },
    {
      id: 'inv-3',
      name: 'Xiaomi 14 Leica 256GB Black',
      tag: 'Xiaomi',
      stock: 12,
      price: 'Rp 11.999.000',
      status: 'Ready Stock',
    },
    {
      id: 'inv-4',
      name: 'Samsung Galaxy Z Fold 6 256GB',
      tag: 'Samsung',
      stock: 3,
      price: 'Rp 26.499.000',
      status: 'Stok Terbatas',
    },
  ]

  const storePendingOrders = [
    {
      id: 'ORD-20260825-01',
      customer: 'Budi Santoso',
      product: 'iPhone 15 Pro 128GB Titanium',
      courier: 'JNE YES · Asuransi 100%',
      total: 'Rp 19.029.000',
      status: 'Perlu Dikirim',
      statusType: 'danger',
      time: '15 mnt lalu',
    },
    {
      id: 'ORD-20260825-04',
      customer: 'Siti Aminah',
      product: 'Samsung Galaxy Z Fold 6 256GB',
      courier: 'Gojek Instant · Asuransi 100%',
      total: 'Rp 26.499.000',
      status: 'Siap Pickup',
      statusType: 'warning',
      time: '45 mnt lalu',
    },
  ]

  const recentTransactions = [
    {
      id: 'ORD-20260825-01',
      customer: 'Budi Santoso',
      product: 'iPhone 15 Pro 128GB Titanium',
      store: 'Roxy Mas (Jakarta)',
      total: 19029000,
      commission: 190290,
      courier: 'JNE YES (Asuransi 100%)',
      status: 'PAID',
      time: '12 mnt lalu',
    },
    {
      id: 'ORD-20260825-02',
      customer: 'Maya Kartika',
      product: 'Samsung S24 Ultra 512GB',
      store: 'WTC Surabaya',
      total: 21999000,
      commission: 439980,
      courier: 'Gojek Instant (Asuransi 100%)',
      status: 'IN_PROGRESS',
      time: '45 mnt lalu',
    },
    {
      id: 'ORD-20260825-03',
      customer: 'Reza Fahlevi',
      product: 'Xiaomi 14 Leica 256GB Black',
      store: 'BEC Bandung',
      total: 11999000,
      commission: 239980,
      courier: 'JNE Reguler (Asuransi 100%)',
      status: 'COMPLETED',
      time: '2 jam lalu',
    },
    {
      id: 'ORD-20260825-04',
      customer: 'Siti Aminah',
      product: 'Samsung Galaxy Z Fold 6 256GB',
      store: 'Roxy Mas (Jakarta)',
      total: 26499000,
      commission: 529980,
      courier: 'JNE YES (Asuransi 100%)',
      status: 'PAID',
      time: '3 jam lalu',
    },
  ]

  if (!mounted || status === 'loading') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-pulse" suppressHydrationWarning>
        {/* 4 Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-6.5 w-6.5 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-5.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Table & Chart Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs h-80 dark:border-slate-800 dark:bg-slate-900" />
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs h-80 dark:border-slate-800 dark:bg-slate-900" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 pt-1" suppressHydrationWarning>
      {/* ========================================================================= */}
      {/* 1. TOP KPI CARDS (Bento Metric Grid with Action Orange Highlights)         */}
      {/* ========================================================================= */}

      {/* STORE ADMIN METRICS */}
      {isStoreAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Ready Stock */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-orange-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Inventori Cabang
              </span>
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                28 Unit Fisik
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-orange-600 dark:text-orange-400">4 Model</span>
                <span className="text-slate-400 dark:text-slate-500">· Ready stock</span>
              </div>
            </div>
          </div>

          {/* 2. Pesanan Masuk */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-orange-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pesanan Masuk
              </span>
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                <PackageCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                2 Pesanan
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  Perlu Diproses
                </span>
                <span className="text-slate-400 dark:text-slate-500">· JNE & Gojek</span>
              </div>
            </div>
          </div>

          {/* 3. Proteksi Garansi */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Proteksi Garansi
              </span>
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                100% Terlindungi
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Garansi 30 Hari</span>
                <span className="text-slate-400 dark:text-slate-500">· Tukar unit second</span>
              </div>
            </div>
          </div>

          {/* 4. Jam Operasional */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Operasional Toko
              </span>
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <Store className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Buka Operasional
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  10:00 – 21:00 WIB
                </span>
                <span className="text-slate-400 dark:text-slate-500">· Pickup</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN METRICS */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Total Omzet (Action Orange Highlight) */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-orange-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total Omzet Jaringan
              </span>
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                <span className="text-xs font-semibold text-orange-500 mr-1">Rp</span>
                {stats.totalOmzet.toLocaleString('id-ID')}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                  {stats.growthRate}
                </span>
                <span className="text-slate-400 dark:text-slate-500">· {stats.totalOrders} pesanan</span>
              </div>
            </div>
          </div>

          {/* 2. Komisi Platform (Action Orange Highlight) */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-orange-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Komisi Platform
              </span>
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                <Percent className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                <span className="text-xs font-semibold text-orange-500 mr-1">Rp</span>
                {stats.totalCommission.toLocaleString('id-ID')}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-orange-600 dark:text-orange-400">2.5% Rate</span>
                <span className="text-slate-400 dark:text-slate-500">· Bagi hasil</span>
              </div>
            </div>
          </div>

          {/* 3. Jaringan Toko */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Jaringan Toko
              </span>
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <Store className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.totalStores} Toko Aktif
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  100% Beroperasi
                </span>
                <span className="text-slate-400 dark:text-slate-500">· 5 Kota</span>
              </div>
            </div>
          </div>

          {/* 4. Proteksi Garansi */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Proteksi Garansi
              </span>
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.claimResolvedRate} Aman
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Garansi 30 Hari</span>
                <span className="text-slate-400 dark:text-slate-500">· 0 antrean</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PLATFORM METRICS (Simple & Clean Naming) */}
      {isAdminPlatform && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Katalog Gadget */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-orange-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Katalog Gadget</span>
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">12 Model</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-orange-600 dark:text-orange-400">Aktif</span>
                <span className="text-slate-400 dark:text-slate-500">· Katalog publik</span>
              </div>
            </div>
          </div>

          {/* 2. Daftar Toko */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Daftar Toko</span>
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <Store className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">{stats.totalStores} Cabang</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Terverifikasi
                </span>
                <span className="text-slate-400 dark:text-slate-500">· 5 Kota</span>
              </div>
            </div>
          </div>

          {/* 3. Pengguna */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pengguna</span>
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">1.280 Akun</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Customer</span>
                <span className="text-slate-400 dark:text-slate-500">· Terdaftar</span>
              </div>
            </div>
          </div>

          {/* 4. Klaim Garansi */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Klaim Garansi</span>
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">100% Aman</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Garansi 30 Hari</span>
                <span className="text-slate-400 dark:text-slate-500">· 0 antrean</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 2-COLUMN BALANCED BENTO SECTION                                        */}
      {/* ========================================================================= */}

      {/* STORE ADMIN VIEW */}
      {isStoreAdmin && (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          {/* Left Bento: Inventori Ready Stock */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-950 dark:text-white">
                    Inventori Ready Stock Toko
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Unit fisik tersedia di cabang Anda
                  </p>
                </div>
                <Link
                  href="/dashboard/admin/products"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition"
                >
                  <span>Kelola Stok</span>
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pt-2">
                {storeInventory.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.stock} Unit Ready
                        </span>
                        <span className="text-[11px] text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-[11px] text-slate-400">{item.tag}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-xs sm:text-sm font-bold text-slate-950 dark:text-white tabular-nums">
                        {item.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Bento: Pesanan Masuk Cabang Toko */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-950 dark:text-white">
                    Pesanan Masuk Cabang Toko
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Alokasi pesanan pembeli yang siap diproses
                  </p>
                </div>
                <Link
                  href="/dashboard/admin/orders"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition"
                >
                  <span>Proses Pesanan</span>
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pt-2">
                {storePendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="py-3.5 flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {order.id}
                        </span>
                        <span className="text-[11px] text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {order.customer}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {order.product}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {order.courier} · {order.time}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-xs sm:text-sm font-bold text-slate-950 dark:text-white tabular-nums">
                        {order.total}
                      </p>
                      <span
                        className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          order.statusType === 'danger'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        ● {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN VIEW */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          {/* Distribusi Omzet Toko */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-950 dark:text-white">
                    Distribusi Omzet Toko
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Performa penjualan per cabang toko
                  </p>
                </div>
                <Link
                  href="/dashboard/admin/mitras"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition"
                >
                  <span>Kelola Toko</span>
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pt-2">
                {branchPerformance.map((branch, idx) => (
                  <div
                    key={branch.id}
                    className="py-3.5 first:pt-2 last:pb-0 group transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold ${
                            idx === 0
                              ? 'bg-orange-100/90 text-orange-700 border border-orange-200/60 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800/40 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          0{idx + 1}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {branch.name}
                          </p>
                          <p className="text-[11px] text-slate-400">{branch.city}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-xs sm:text-sm font-bold text-slate-950 dark:text-white tabular-nums">
                          {branch.omzet}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {branch.growth}
                          </span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {branch.share}% share
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clean Proportional Progress Bar with Action Orange on Top Branch */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 mt-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0
                            ? 'bg-orange-500 shadow-2xs shadow-orange-500/20'
                            : idx === 1
                            ? 'bg-slate-600 dark:bg-slate-300'
                            : 'bg-slate-400 dark:bg-slate-500'
                        }`}
                        style={{ width: `${branch.share}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transaksi Terakhir Seluruh Toko */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-950 dark:text-white">
                    Aktivitas Transaksi Jaringan
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Pesanan & komisi real-time seluruh cabang
                  </p>
                </div>
                <Link
                  href="/dashboard/admin/orders"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition"
                >
                  <span>Semua Pesanan</span>
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pt-2">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3.5 first:pt-2 last:pb-0 flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {tx.customer}
                        </span>
                        <span className="text-[11px] text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                          {tx.product}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono">{tx.id}</span> · {tx.time} · <span className="text-slate-500 dark:text-slate-400 font-medium">{tx.store}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end">
                      <p className="font-mono text-xs sm:text-sm font-bold text-slate-950 dark:text-white tabular-nums">
                        Rp {tx.total.toLocaleString('id-ID')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 font-mono">
                          +Rp {tx.commission.toLocaleString('id-ID')}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            tx.status === 'PAID' || tx.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60'
                          }`}
                        >
                          {tx.status === 'PAID' ? 'Dibayar' : tx.status === 'COMPLETED' ? 'Selesai' : 'Proses'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PLATFORM VIEW (Redesigned: Clean, Minimal, Action Orange Brand, Linear Aesthetic) */}
      {isAdminPlatform && (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          {/* Left Bento: Daftar Toko */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-950 dark:text-white">
                    Daftar Toko
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">5 cabang resmi beroperasi</p>
                </div>
                <Link
                  href="/dashboard/admin/mitras"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition"
                >
                  <span>Kelola Toko</span>
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pt-2">
                {[
                  { name: 'PT Gadget Jaya Sentosa', branch: 'Roxy Mas Pusat', city: 'Jakarta Pusat', status: 'Terverifikasi' },
                  { name: 'PT Sinar Gadget Nusantara', branch: 'WTC Surabaya', city: 'Surabaya', status: 'Terverifikasi' },
                  { name: 'PT Digital Niaga Prima', branch: 'BEC Bandung', city: 'Bandung', status: 'Terverifikasi' },
                  { name: 'PT Surya Makmur Gadget', branch: 'Plaza Medan Fair', city: 'Medan', status: 'Terverifikasi' },
                  { name: 'PT Mega Ponsel Nusantara', branch: 'Jogjatronik Mall', city: 'Yogyakarta', status: 'Terverifikasi' },
                ].map((store, i) => {
                  const initial = store.branch.charAt(0).toUpperCase()
                  return (
                    <div
                      key={i}
                      className="py-3.5 first:pt-2 last:pb-0 flex items-center justify-between gap-3 group transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100/80 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-bold text-xs border border-orange-200/60 dark:border-orange-800/40 shadow-2xs">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {store.branch}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            {store.name} · {store.city}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {store.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Bento: Aksi Cepat */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-950 dark:text-white">
                    Aksi Cepat
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Pintasan operasional platform</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
                <Link
                  href="/dashboard/admin/products"
                  className="group p-4 rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800/50 hover:border-orange-300 dark:hover:border-orange-700/80 hover:shadow-xs transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                      Katalog Gadget
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Kelola & tambah model gadget
                    </p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/admin/mitras"
                  className="group p-4 rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800/50 hover:border-orange-300 dark:hover:border-orange-700/80 hover:shadow-xs transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Store className="h-4 w-4" />
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                      Daftar Toko
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Verifikasi cabang fisik & PT
                    </p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/admin/complaints"
                  className="group p-4 rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800/50 hover:border-orange-300 dark:hover:border-orange-700/80 hover:shadow-xs transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                      Klaim Garansi
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Pusat komplain & garansi 30 hari
                    </p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/admin/settings"
                  className="group p-4 rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-800/50 hover:border-orange-300 dark:hover:border-orange-700/80 hover:shadow-xs transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Settings className="h-4 w-4" />
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                      Pengaturan
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Konfigurasi umum platform
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
