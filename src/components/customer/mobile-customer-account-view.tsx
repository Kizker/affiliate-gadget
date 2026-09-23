'use client'

import React, { useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  CreditCard,
  Package,
  Truck,
  CheckCircle2,
  RotateCcw,
  User,
  MapPin,
  Lock,
  ChevronRight,
  Camera,
  ShieldCheck,
  Edit3,
  MessageSquare,
  LogOut,
  ArrowLeft,
  Check,
  Loader2,
  Plus,
} from 'lucide-react'
import { MobileTopNav } from '@/components/layouts/mobile-top-nav'
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav'

export interface MobileCustomerAccountViewProps {
  user: {
    name: string
    username: string
    email: string
    phone: string
    avatarPreview: string | null
  }
  orderStats: {
    pending: number
    processing: number
    inProgress: number
    completed: number
    returned?: number
    total: number
  }
  addressesCount: number
  activeSubView: 'overview' | 'profile' | 'address' | 'security'
  setActiveSubView: (
    view: 'overview' | 'profile' | 'address' | 'security'
  ) => void
  onAvatarClick: () => void
  onSignOut: () => void
  onSaveProfile?: () => void
  onSavePassword?: () => void
  onAddAddress?: () => void
  saving?: boolean
  children?: React.ReactNode
}

export function MobileCustomerAccountView({
  user,
  orderStats,
  addressesCount,
  activeSubView,
  setActiveSubView,
  onAvatarClick,
  onSignOut,
  onSaveProfile,
  onSavePassword,
  onAddAddress,
  saving = false,
  children,
}: MobileCustomerAccountViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeSubView])

  // Automatically scroll focused input to center when virtual keyboard pops up
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    const handleViewportResize = () => {
      if (
        document.activeElement &&
        document.activeElement instanceof HTMLElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.tagName === 'SELECT')
      ) {
        setTimeout(() => {
          document.activeElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }, 150)
      }
    }
    vv.addEventListener('resize', handleViewportResize)
    return () => vv.removeEventListener('resize', handleViewportResize)
  }, [])

  if (activeSubView !== 'overview') {
    const titles = {
      profile: 'Profil & Biodata Diri',
      address: 'Daftar Alamat Pengiriman',
      security: 'Kata Sandi & Keamanan',
    }

    return (
      <div className="flex h-dvh max-h-screen min-h-screen w-full flex-col overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {/* Sticky Sub-View Header with Back Button & Quick Save Action */}
        <header className="z-40 flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3.5 py-2.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
          <button
            type="button"
            onClick={() => setActiveSubView('overview')}
            className="flex items-center gap-1 text-xs font-bold text-slate-700 transition hover:text-orange-500 active:scale-95 dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </button>
          <h1 className="max-w-[170px] truncate text-center text-xs font-bold text-slate-950 dark:text-white sm:max-w-none">
            {titles[activeSubView]}
          </h1>
          <div className="flex min-w-[70px] items-center justify-end">
            {activeSubView === 'profile' && onSaveProfile && (
              <button
                type="button"
                onClick={onSaveProfile}
                disabled={saving}
                className="shadow-xs flex items-center gap-1.5 rounded-full bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Simpan</span>
              </button>
            )}
            {activeSubView === 'security' && onSavePassword && (
              <button
                type="button"
                onClick={onSavePassword}
                disabled={saving}
                className="shadow-xs flex items-center gap-1.5 rounded-full bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Simpan</span>
              </button>
            )}
            {activeSubView === 'address' && onAddAddress && (
              <button
                type="button"
                onClick={onAddAddress}
                className="shadow-xs flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content Body with Auto-Scroll on Keyboard Open */}
        <div
          ref={scrollContainerRef}
          onFocusCapture={(e) => {
            const target = e.target as HTMLElement
            if (
              target &&
              (target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT')
            ) {
              setTimeout(() => {
                target.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                })
              }, 250)
            }
          }}
          className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
        >
          <main className="p-3 pb-80">
            <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Default Overview Mode: Shopee/Tokopedia Style Account Hub
  return (
    <div className="flex h-dvh max-h-screen min-h-screen w-full flex-col overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Mobile Top Navigation */}
      <div className="shrink-0">
        <MobileTopNav title="Akun Saya" showBack={false} />
      </div>

      {/* 2. Scrollable Body */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
      >
        <main className="space-y-3 p-3 pb-36">
          {/* 2. User Profile Summary Card */}
          <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="shadow-xs relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-orange-200 bg-slate-900 text-white">
                  {user.avatarPreview ? (
                    <img
                      src={user.avatarPreview}
                      alt={user.name || 'Avatar'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-black">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onAvatarClick}
                  className="shadow-xs absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white transition hover:bg-orange-600 active:scale-95"
                  title="Ganti Foto Profil"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate text-base font-bold text-slate-950 dark:text-white">
                    {user.name || 'Pelanggan'}
                  </h2>
                  <span className="py-0.2 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Aktif
                  </span>
                </div>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.username
                    ? `@${user.username}`
                    : user.email || user.phone || 'Pengguna Terverifikasi'}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                  <span>Pembeli Resmi Affiliate Gadget</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubView('profile')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-orange-300 hover:text-orange-500 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                title="Ubah Profil"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 3. Section: Pesanan Saya (Shopee / Tokopedia Style) */}
          <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-bold text-slate-950 dark:text-white">
                  Pesanan Saya
                </span>
              </div>
              <Link
                href="/dashboard/customer/orders"
                className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 hover:text-orange-600 dark:text-slate-400"
              >
                <span>Lihat Riwayat Pesanan</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* 5 Status Action Grid */}
            <div className="grid grid-cols-5 gap-1 pt-3 text-center">
              {/* Belum Bayar */}
              <Link
                href="/dashboard/customer/orders?status=PENDING_PAYMENT"
                className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl py-1.5 transition active:scale-95"
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                  <CreditCard className="h-4 w-4" />
                  {orderStats.pending > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900">
                      {orderStats.pending}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-tight text-slate-600 dark:text-slate-300">
                  Belum Bayar
                </span>
              </Link>

              {/* Diproses */}
              <Link
                href="/dashboard/customer/orders?status=PROCESSING"
                className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl py-1.5 transition active:scale-95"
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <Package className="h-4 w-4" />
                  {orderStats.processing > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900">
                      {orderStats.processing}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-tight text-slate-600 dark:text-slate-300">
                  Diproses
                </span>
              </Link>

              {/* Dikirim */}
              <Link
                href="/dashboard/customer/orders?status=SHIPPED"
                className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl py-1.5 transition active:scale-95"
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <Truck className="h-4 w-4" />
                  {orderStats.inProgress > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900">
                      {orderStats.inProgress}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-tight text-slate-600 dark:text-slate-300">
                  Dikirim
                </span>
              </Link>

              {/* Selesai */}
              <Link
                href="/dashboard/customer/orders?status=COMPLETED"
                className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl py-1.5 transition active:scale-95"
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {orderStats.completed > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900">
                      {orderStats.completed}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-tight text-slate-600 dark:text-slate-300">
                  Selesai
                </span>
              </Link>

              {/* Retur */}
              <Link
                href="/dashboard/customer/orders?status=RETURNED"
                className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl py-1.5 transition active:scale-95"
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  <RotateCcw className="h-4 w-4" />
                  {(orderStats.returned ?? 0) > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900">
                      {orderStats.returned}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-tight text-slate-600 dark:text-slate-300">
                  Retur
                </span>
              </Link>
            </div>
          </div>

          {/* 4. Section: Pengaturan Akun & Layanan Menu */}
          <div className="shadow-2xs divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setActiveSubView('profile')}
              className="flex w-full items-center justify-between p-3.5 text-left transition active:bg-slate-50 dark:active:bg-slate-800/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-950 dark:text-white">
                    Profil & Biodata Diri
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Ubah nama, email, WhatsApp, tanggal lahir
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('address')}
              className="flex w-full items-center justify-between p-3.5 text-left transition active:bg-slate-50 dark:active:bg-slate-800/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-950 dark:text-white">
                    Daftar Alamat Pengiriman
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Kelola alamat rumah dan kantor ({addressesCount} alamat)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {addressesCount}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('security')}
              className="flex w-full items-center justify-between p-3.5 text-left transition active:bg-slate-50 dark:active:bg-slate-800/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-950 dark:text-white">
                    Kata Sandi & Keamanan
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Ubah kata sandi dan manajemen sesi aktif
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>

            <Link
              href="/dashboard/customer/chat"
              className="flex w-full items-center justify-between p-3.5 text-left transition active:bg-slate-50 dark:active:bg-slate-800/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-950 dark:text-white">
                    Chat Bantuan Toko
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Konsultasi unit & kendala transaksi langsung ke toko
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>

            <Link
              href="/garansi"
              className="flex w-full items-center justify-between p-3.5 text-left transition active:bg-slate-50 dark:active:bg-slate-800/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-950 dark:text-white">
                    Pusat Garansi 30 Hari
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Syarat klaim unit baru & cek garansi resmi
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>

          {/* 5. Tombol Keluar (Logout) */}
          <button
            type="button"
            onClick={onSignOut}
            className="shadow-2xs flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white py-3 text-xs font-bold text-rose-600 transition active:scale-[0.99] dark:border-rose-900/60 dark:bg-slate-900 dark:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar dari Akun</span>
          </button>
        </main>
      </div>

      {/* 6. Standard Universal Mobile Bottom Navigation */}
      <MobileBottomNav activeTab="akun" />
    </div>
  )
}
