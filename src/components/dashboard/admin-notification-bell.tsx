'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Bell,
  ShoppingCart,
  MessageSquare,
  Wallet,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Radio,
  Store,
  RefreshCw,
  CheckCircle2,
  X,
} from 'lucide-react'
import { useAdminNotifications } from '@/context/admin-notifications-context'

export function AdminNotificationBell() {
  const { counts, loading, refresh, markAsRead, markAllAsRead } =
    useAdminNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [bellDismissed, setBellDismissed] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Items configuration with counts
  const currentActiveItems = useMemo(() => {
    return [
      {
        id: 'orders',
        title: 'Pesanan Perlu Diproses',
        count: counts.orders,
        description: `${counts.ordersNeedProcessing} dibayar, ${counts.ordersPendingPayment} menunggu bayar`,
        href: '/dashboard/admin/orders',
        icon: ShoppingCart,
        color:
          'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
      },
      {
        id: 'chat',
        title: 'Pesan Pelanggan',
        count: counts.chat,
        description: 'Pesan chat baru belum dibaca',
        href: '/dashboard/admin/chat',
        icon: MessageSquare,
        color:
          'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      },
      {
        id: 'finance',
        title: 'Penarikan Saldo Toko',
        count: counts.finance,
        description: 'Pengajuan penarikan dana pending',
        href: '/dashboard/admin/finance',
        icon: Wallet,
        color:
          'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
      },
      {
        id: 'complaints',
        title: 'Klaim Garansi 30 Hari',
        count: counts.complaints,
        description: 'Keluhan pelanggan butuh penanganan',
        href: '/dashboard/admin/complaints',
        icon: ShieldCheck,
        color:
          'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
      },
      {
        id: 'returns',
        title: 'Pengembalian Unit / Dana',
        count: counts.returns,
        description: 'Permohonan retur butuh verifikasi',
        href: '/dashboard/admin/returns',
        icon: RotateCcw,
        color:
          'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400',
      },
      {
        id: 'ads',
        title: 'Pengajuan Slot Iklan',
        count: counts.ads,
        description: 'Iklan promosi butuh peninjauan',
        href: '/dashboard/admin/ads',
        icon: Sparkles,
        color:
          'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
      },
      {
        id: 'live',
        title: 'Siaran Langsung',
        count: counts.live,
        description: 'Siaran langsung penjualan aktif',
        href: '/dashboard/admin/live',
        icon: Radio,
        color:
          'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      },
      {
        id: 'mitras',
        title: 'Pendaftaran Toko Cabang',
        count: counts.mitras,
        description: 'Mitra baru menunggu verifikasi',
        href: '/dashboard/admin/mitras',
        icon: Store,
        color:
          'bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400',
      },
    ].filter((item) => item.count > 0)
  }, [counts])

  // Items currently displayed in dropdown
  const [displayedItems, setDisplayedItems] = useState<
    typeof currentActiveItems
  >([])

  // Reset bellDismissed when new unread notifications arrive while closed
  useEffect(() => {
    if (counts.total > 0 && !isOpen) {
      setBellDismissed(false)
    }
  }, [counts.total, isOpen])

  // Click handler when notification bell is pressed once
  const handleToggleBell = () => {
    if (!isOpen) {
      // 1. Snapshot items before clearing so user can read them in dropdown
      setDisplayedItems(currentActiveItems)
      // 2. Mark bell alert dismissed immediately (red badge on bell vanishes instantly)
      setBellDismissed(true)
      // 3. Mark all categories as read so sidebar badges also disappear instantly
      markAllAsRead()
      // 4. Open dropdown panel
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  // Dismiss individual notification item
  const handleDismissItem = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDisplayedItems((prev) => prev.filter((i) => i.id !== itemId))
    markAsRead(itemId)
  }

  // Clear all items from dropdown
  const handleClearAll = () => {
    markAllAsRead()
    setDisplayedItems([])
  }

  // Show badge on bell only if unread count > 0 and bell hasn't been clicked
  const showBellBadge = !bellDismissed && counts.total > 0

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggleBell}
        aria-label="Pemberitahuan Admin"
        title="Pemberitahuan & Proses Baru"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <Bell className="h-4 w-4" />

        {/* Pulsing Alert Indicator - vanishes on single click */}
        {showBellBadge && (
          <span className="shadow-xs absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
            <span className="relative">
              {counts.total > 99 ? '99+' : counts.total}
            </span>
          </span>
        )}
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay */}
          <div
            className="backdrop-blur-2xs fixed inset-0 z-40 bg-black/20 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed left-3 right-3 top-16 z-50 mx-auto max-w-sm rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-2xl transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mx-0 sm:mt-2 sm:w-96 sm:max-w-none">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 whitespace-nowrap text-xs font-bold text-slate-900 dark:text-white">
                  Notifikasi
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {displayedItems.length > 0
                    ? `${displayedItems.length} proses`
                    : 'Telah Dilihat'}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {displayedItems.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    Tandai Dibaca
                  </button>
                )}
                <button
                  onClick={() => refresh()}
                  disabled={loading}
                  title="Perbarui notifikasi"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* List of Active Notifications */}
            <div className="max-h-[380px] divide-y divide-slate-100/70 overflow-y-auto py-1 dark:divide-slate-800/70">
              {displayedItems.length > 0 ? (
                displayedItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between gap-2 rounded-xl p-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <Link
                        href={item.href}
                        onClick={() => {
                          markAsRead(item.id)
                          setDisplayedItems((prev) =>
                            prev.filter((i) => i.id !== item.id)
                          )
                          setIsOpen(false)
                        }}
                        className="flex min-w-0 flex-1 items-start gap-3"
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.color}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate whitespace-nowrap text-xs font-bold text-slate-900 transition group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
                              {item.title}
                            </span>
                            <span className="shrink-0 whitespace-nowrap rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                              {item.count}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">
                            {item.description}
                          </p>
                        </div>
                      </Link>

                      {/* Single-Click Dismiss Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDismissItem(e, item.id)}
                        title="Tutup notifikasi ini"
                        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })
              ) : (
                <div className="py-7 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="whitespace-nowrap text-xs font-bold text-slate-800 dark:text-slate-200">
                    Semua Proses Terkelola
                  </p>
                  <p className="mt-0.5 truncate whitespace-nowrap px-4 text-[11px] text-slate-400">
                    Tidak ada pesanan, komplain, atau aksi mendesak saat ini.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Quick Links */}
            <div className="border-t border-slate-100 p-2 dark:border-slate-800">
              <Link
                href="/dashboard/admin/orders"
                onClick={() => {
                  markAsRead('orders')
                  setIsOpen(false)
                }}
                className="flex w-full items-center justify-center whitespace-nowrap rounded-xl bg-slate-900 py-2 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
              >
                Lihat Semua Pesanan
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
