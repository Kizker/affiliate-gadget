'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Store,
  CreditCard,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePageGuard } from '@/hooks/use-page-guard'

interface ReturnItem {
  id: string
  orderId: string
  userId: string
  type: 'REFUND' | 'REPLACEMENT'
  reason: string
  reasonLabel?: string | null
  description: string
  images: string[]
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountName?: string | null
  refundAmount?: number | null
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  storeResponse?: string | null
  createdAt: string
  order: {
    orderNumber: string
    total: number
    store?: {
      name: string
      city: string
    } | null
  }
  user: {
    name: string | null
    email: string
    phone: string | null
  }
}

export default function AfterSalesReturnsPage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/after-sales'
  )

  const [returns, setReturns] = useState<ReturnItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  >('ALL')
  const [activeImage, setActiveImage] = useState<string | null>(null)

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/returns')
      const json = await res.json()
      if (res.ok && json.success) {
        setReturns(json.data || [])
      } else {
        toast.error(json.error || 'Gagal memuat daftar retur')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAllowed) {
      fetchReturns()
    }
  }, [isAllowed, fetchReturns])

  const filteredReturns = useMemo(() => {
    return returns.filter((item) => {
      const q = searchQuery.toLowerCase()
      const matchQuery =
        item.order.orderNumber.toLowerCase().includes(q) ||
        item.user.name?.toLowerCase().includes(q) ||
        item.user.email.toLowerCase().includes(q) ||
        item.order.store?.name.toLowerCase().includes(q)

      if (!matchQuery) return false

      if (statusFilter === 'ALL') return true
      if (statusFilter === 'PENDING')
        return item.status === 'PENDING' || item.status === 'IN_REVIEW'
      if (statusFilter === 'APPROVED')
        return item.status === 'APPROVED' || item.status === 'COMPLETED'
      if (statusFilter === 'REJECTED') return item.status === 'REJECTED'
      return true
    })
  }, [returns, searchQuery, statusFilter])

  const counts = useMemo(() => {
    return {
      all: returns.length,
      pending: returns.filter(
        (r) => r.status === 'PENDING' || r.status === 'IN_REVIEW'
      ).length,
      approved: returns.filter(
        (r) => r.status === 'APPROVED' || r.status === 'COMPLETED'
      ).length,
      rejected: returns.filter((r) => r.status === 'REJECTED').length,
    }
  }, [returns])

  if (guardLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          <RotateCcw className="h-6 w-6 text-orange-600" />
          Pengajuan Retur &amp; Komplain Cabang
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Daftar pengajuan retur dari cabang binaan. Seluruh keputusan akhir
          (Approve / Reject) berada di tangan Superadmin.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`rounded-2xl border p-4 text-left transition ${
            statusFilter === 'ALL'
              ? 'border-orange-500 bg-orange-50/50 dark:border-orange-500 dark:bg-orange-950/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500">
            Semua Pengajuan
          </span>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {counts.all}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`rounded-2xl border p-4 text-left transition ${
            statusFilter === 'PENDING'
              ? 'border-amber-500 bg-amber-50/50 dark:border-amber-500 dark:bg-amber-950/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-xs font-semibold text-amber-600">
            Menunggu Superadmin
          </span>
          <p className="mt-1 text-2xl font-black text-amber-600">
            {counts.pending}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`rounded-2xl border p-4 text-left transition ${
            statusFilter === 'APPROVED'
              ? 'border-emerald-500 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-xs font-semibold text-emerald-600">
            Disetujui Superadmin
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-600">
            {counts.approved}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`rounded-2xl border p-4 text-left transition ${
            statusFilter === 'REJECTED'
              ? 'border-rose-500 bg-rose-50/50 dark:border-rose-500 dark:bg-rose-950/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-xs font-semibold text-rose-600">
            Ditolak Superadmin
          </span>
          <p className="mt-1 text-2xl font-black text-rose-600">
            {counts.rejected}
          </p>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nomor pesanan, nama pembeli, atau toko cabang..."
          className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* List */}
      {filteredReturns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <RotateCcw className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak ada pengajuan retur
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {searchQuery
              ? 'Tidak ditemukan data sesuai kata kunci pencarian.'
              : 'Belum ada pengajuan retur dari cabang binaan.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                    #{item.order.orderNumber}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Store className="h-3.5 w-3.5 text-orange-600" />
                    {item.order.store?.name} ({item.order.store?.city})
                  </span>
                </div>

                <div>
                  {(item.status === 'PENDING' ||
                    item.status === 'IN_REVIEW') && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      <Clock className="h-3.5 w-3.5" /> Menunggu Superadmin
                    </span>
                  )}
                  {(item.status === 'APPROVED' ||
                    item.status === 'COMPLETED') && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Disetujui
                    </span>
                  )}
                  {item.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      <XCircle className="h-3.5 w-3.5" /> Ditolak
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Pembeli
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.user.name || 'Pembeli'}
                  </p>
                  <p className="text-xs text-slate-500">{item.user.email}</p>
                  <p className="text-xs text-slate-500">
                    {item.user.phone || '-'}
                  </p>

                  <div className="pt-2">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${
                        item.type === 'REFUND'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}
                    >
                      {item.type === 'REFUND'
                        ? 'Pengembalian Dana'
                        : 'Tukar Unit'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Alasan &amp; Deskripsi
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.reasonLabel || item.reason}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>

                  {item.type === 'REFUND' && item.bankName && (
                    <div className="mt-2 rounded-xl bg-orange-50/60 p-2.5 text-xs text-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                      <span className="font-semibold text-orange-800 dark:text-orange-300">
                        Rekening Tujuan:
                      </span>{' '}
                      {item.bankName} - {item.bankAccountNumber} (a.n.{' '}
                      {item.bankAccountName})
                    </div>
                  )}

                  {item.images && item.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 pt-1">
                      {item.images.map((imgUrl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveImage(imgUrl)}
                          className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 hover:opacity-80 dark:border-slate-700"
                        >
                          <img
                            src={imgUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {item.storeResponse && (
                    <div className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        Keputusan Superadmin:
                      </span>{' '}
                      {item.storeResponse}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Lightbox */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="backdrop-blur-xs fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/80 p-4"
        >
          <div className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl">
            <img
              src={activeImage}
              alt="Bukti Kendala"
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
