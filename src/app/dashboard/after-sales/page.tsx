'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Headphones,
  MessageSquare,
  RotateCcw,
  CheckCircle2,
  Clock,
  Store,
  ArrowRight,
  Loader2,
  AlertCircle,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePageGuard } from '@/hooks/use-page-guard'

interface AfterSalesData {
  group: {
    id: string
    name: string
    description?: string | null
    stores: Array<{ id: string; name: string; city: string; slug: string }>
  } | null
  stats: {
    activeChats: number
    pendingReturns: number
    approvedReturns: number
    totalStoresInGroup: number
  }
  recentChats: Array<{
    id: string
    orderId?: string | null
    orderNumber?: string
    productName?: string | null
    storeName?: string
    customerName: string
    lastMessage: string
    lastMessageAt: string
  }>
  recentReturns: Array<{
    id: string
    type: string
    reason: string
    reasonLabel?: string | null
    status: string
    createdAt: string
    order: {
      orderNumber: string
      store?: { name: string; city: string } | null
    }
    user: {
      name: string | null
      email: string
    }
  }>
}

function formatChatMessagePreview(
  rawContent: string,
  productName?: string | null
): string {
  if (!rawContent) return 'Mengirim media/foto'
  const trimmed = rawContent.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed)
      if (data.type === 'order_reference' || data.orderNumber) {
        return `📋 Rincian Pesanan: ${productName || data.productName || '#' + data.orderNumber}`
      }
      if (data.type === 'product_reference' || data.productName || data.name) {
        return `📦 Produk: ${data.productName || data.name}`
      }
      if (data.type === 'return_reference' || data.returnReason) {
        return `🔄 Pengajuan Retur: ${data.reasonLabel || data.returnReason || 'Komplain Unit'}`
      }
    } catch {}
  }
  return rawContent
}

export default function AfterSalesDashboardPage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/after-sales'
  )

  const [data, setData] = useState<AfterSalesData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/after-sales/dashboard?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setData(json)
      } else {
        toast.error(json.error || 'Gagal memuat data purna jual')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAllowed) {
      fetchData()
    }
  }, [isAllowed, fetchData])

  if (guardLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  const group = data?.group
  const stats = data?.stats

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
              Pusat Layanan Purna Jual
            </span>
          </div>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            <Headphones className="h-6 w-6 text-orange-600" />
            {group?.name || 'Layanan Purna Jual & Garansi'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Pintu tunggal penanganan pesan purna jual dan validasi retur barang
            setelah pesanan selesai.
          </p>
        </div>

        {/* Group Badges */}
        {group && group.stores.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-bold text-slate-400">
              Menaungi Cabang:
            </span>
            {group.stores.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <Store className="h-3 w-3 text-orange-600" />
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/dashboard/after-sales/chat"
          className="hover:shadow-xs group rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Live Chat Pesanan Selesai</span>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {stats?.activeChats ?? 0}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600">
            Buka Inbox Chat Selesai{' '}
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </p>
        </Link>

        <Link
          href="/dashboard/after-sales/returns"
          className="hover:shadow-xs group rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Retur &amp; Komplain Aktif</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats?.pendingReturns ?? 0}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
            Tinjau Pengajuan Retur{' '}
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </p>
        </Link>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pengembalian Disetujui</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats?.approvedReturns ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Disetujui oleh Superadmin
          </p>
        </div>
      </div>

      {/* Bento Grid: Recent Chats & Recent Returns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Chat Purna Jual Masuk */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Percakapan Pesanan Selesai Terbaru
              </h2>
            </div>
            <Link
              href="/dashboard/after-sales/chat"
              className="text-xs font-semibold text-orange-600 hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {!data?.recentChats || data.recentChats.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                Belum ada percakapan masuk untuk pesanan yang telah selesai.
              </p>
            ) : (
              data.recentChats.slice(0, 5).map((chat) => (
                <Link
                  key={chat.id}
                  href={`/dashboard/after-sales/chat?room=${chat.id}`}
                  className="flex items-center justify-between py-3 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {chat.customerName}
                      </span>
                      {chat.orderNumber && (
                        <span className="font-mono text-[11px] text-slate-400">
                          #{chat.orderNumber}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {formatChatMessagePreview(
                        chat.lastMessage,
                        chat.productName
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-400">
                    {new Date(chat.lastMessageAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right: Retur & Komplain Terbaru */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-orange-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Pengajuan Retur &amp; Komplain
              </h2>
            </div>
            <Link
              href="/dashboard/after-sales/returns"
              className="text-xs font-semibold text-orange-600 hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {!data?.recentReturns || data.recentReturns.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                Tidak ada pengajuan retur aktif di cabang toko binaan.
              </p>
            ) : (
              data.recentReturns.slice(0, 5).map((ret) => (
                <div
                  key={ret.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        #{ret.order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({ret.user.name || ret.user.email})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {ret.reasonLabel || ret.reason}
                    </p>
                  </div>

                  <div>
                    {ret.status === 'PENDING' && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        Menunggu Superadmin
                      </span>
                    )}
                    {ret.status === 'APPROVED' && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Disetujui
                      </span>
                    )}
                    {ret.status === 'REJECTED' && (
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        Ditolak
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
