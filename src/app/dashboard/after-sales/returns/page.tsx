'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Store,
  Loader2,
  Send,
  X,
  AlertCircle,
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
    'ALL' | 'PENDING' | 'IN_REVIEW' | 'DECIDED'
  >('ALL')
  const [activeImage, setActiveImage] = useState<string | null>(null)

  // Action modals state
  const [forwardModalTarget, setForwardModalTarget] =
    useState<ReturnItem | null>(null)
  const [forwardNotes, setForwardNotes] = useState('')
  const [rejectModalTarget, setRejectModalTarget] = useState<ReturnItem | null>(
    null
  )
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      if (statusFilter === 'PENDING') return item.status === 'PENDING'
      if (statusFilter === 'IN_REVIEW') return item.status === 'IN_REVIEW'
      if (statusFilter === 'DECIDED')
        return (
          item.status === 'APPROVED' ||
          item.status === 'REJECTED' ||
          item.status === 'COMPLETED'
        )
      return true
    })
  }, [returns, searchQuery, statusFilter])

  const counts = useMemo(() => {
    return {
      all: returns.length,
      pending: returns.filter((r) => r.status === 'PENDING').length,
      inReview: returns.filter((r) => r.status === 'IN_REVIEW').length,
      decided: returns.filter(
        (r) =>
          r.status === 'APPROVED' ||
          r.status === 'REJECTED' ||
          r.status === 'COMPLETED'
      ).length,
    }
  }, [returns])

  // Handle Forward to Superadmin
  const handleForwardToSuperadmin = async () => {
    if (!forwardModalTarget) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/returns/${forwardModalTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'FORWARD_TO_SUPERADMIN',
          notes:
            forwardNotes.trim() ||
            'Unit telah diverifikasi After Sales memenuhi syarat garansi. Diteruskan ke Superadmin.',
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(
          'Pengajuan berhasil divalidasi dan diteruskan ke Superadmin'
        )
        setForwardModalTarget(null)
        setForwardNotes('')
        fetchReturns()
      } else {
        toast.error(json.error || 'Gagal meneruskan ke Superadmin')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Reject by After Sales
  const handleRejectByAfterSales = async () => {
    if (!rejectModalTarget) return
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan wajib diisi')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/returns/${rejectModalTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: rejectReason.trim(),
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Pengajuan retur berhasil ditolak')
        setRejectModalTarget(null)
        setRejectReason('')
        fetchReturns()
      } else {
        toast.error(json.error || 'Gagal menolak pengajuan')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (guardLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header (Strictly Slate + Orange) */}
      <div>
        <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          <RotateCcw className="h-6 w-6 text-orange-600" />
          Pengajuan Retur &amp; Komplain Cabang
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Validasi kendala unit dan teruskan rekomendasi ke Superadmin untuk
          persetujuan akhir.
        </p>
      </div>

      {/* 4 Metric Tabs (Unified Palette: Slate + Orange) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`rounded-2xl border p-4 text-left transition ${
            statusFilter === 'ALL'
              ? 'border-orange-500 bg-orange-50/70 dark:border-orange-500 dark:bg-orange-950/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
              ? 'border-orange-500 bg-orange-50/70 dark:border-orange-500 dark:bg-orange-950/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Perlu Tindakan
          </span>
          <p className="mt-1 text-2xl font-black text-orange-600">
            {counts.pending}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter('IN_REVIEW')}
          className={`rounded-2xl border p-4 text-left transition ${
            statusFilter === 'IN_REVIEW'
              ? 'border-orange-500 bg-orange-50/70 dark:border-orange-500 dark:bg-orange-950/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Menunggu Superadmin
          </span>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {counts.inReview}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter('DECIDED')}
          className={`rounded-2xl border p-4 text-left transition ${
            statusFilter === 'DECIDED'
              ? 'border-orange-500 bg-orange-50/70 dark:border-orange-500 dark:bg-orange-950/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Selesai / Diputuskan
          </span>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {counts.decided}
          </p>
        </button>
      </div>

      {/* Search Bar (Slate) */}
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
              {/* Card Header */}
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
                  {item.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-300">
                      <Clock className="h-3.5 w-3.5 text-orange-600" /> Perlu
                      Tindakan
                    </span>
                  )}
                  {item.status === 'IN_REVIEW' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-slate-500" /> Menunggu
                      Superadmin
                    </span>
                  )}
                  {(item.status === 'APPROVED' ||
                    item.status === 'COMPLETED') && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-900 bg-slate-900 px-2.5 py-1 text-xs font-bold text-white dark:border-white dark:bg-white dark:text-slate-950">
                      <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" />{' '}
                      Disetujui Superadmin
                    </span>
                  )}
                  {item.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-800">
                      <XCircle className="h-3.5 w-3.5 text-slate-400" /> Ditolak
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
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
                    <span className="inline-block rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {item.type === 'REFUND'
                        ? 'Pengembalian Dana'
                        : 'Tukar Unit Baru'}
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
                    <div className="mt-2 rounded-xl border border-slate-200/70 bg-slate-50 p-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-white">
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
                    <div className="mt-2 rounded-xl border border-slate-200/70 bg-slate-50 p-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Catatan Respon:
                      </span>{' '}
                      {item.storeResponse}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for After Sales on PENDING items */}
              {item.status === 'PENDING' && (
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectModalTarget(item)
                      setRejectReason('')
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Tolak Pengajuan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForwardModalTarget(item)
                      setForwardNotes(
                        item.type === 'REFUND'
                          ? 'Unit telah divalidasi After Sales dan memenuhi syarat garansi 30 hari. Direkomendasikan untuk persetujuan refund dana.'
                          : 'Unit telah divalidasi After Sales dan memenuhi syarat garansi 30 hari. Direkomendasikan untuk persetujuan tukar unit baru.'
                      )
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-orange-700"
                  >
                    <Send className="h-3 w-3" />
                    Validasi &amp; Teruskan ke Superadmin
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Forward to Superadmin (Strictly Slate + Orange) */}
      {forwardModalTarget && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Validasi &amp; Teruskan ke Superadmin
              </h2>
              <button
                type="button"
                onClick={() => setForwardModalTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white">
                  Pesanan #{forwardModalTarget.order.orderNumber}
                </p>
                <p className="mt-0.5 text-slate-500">
                  Pembeli: {forwardModalTarget.user.name} (
                  {forwardModalTarget.user.email})
                </p>
                <p className="mt-0.5 text-slate-500">
                  Jenis:{' '}
                  {forwardModalTarget.type === 'REFUND'
                    ? 'Pengembalian Dana'
                    : 'Tukar Unit Baru'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan Rekomendasi untuk Superadmin
                </label>
                <textarea
                  rows={3}
                  value={forwardNotes}
                  onChange={(e) => setForwardNotes(e.target.value)}
                  placeholder="Tuliskan hasil pengecekan bukti kendala unit..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white p-3 text-xs text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setForwardModalTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleForwardToSuperadmin}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Kirim ke Superadmin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Reject by After Sales (Strictly Slate + Orange) */}
      {rejectModalTarget && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Tolak Pengajuan Retur
              </h2>
              <button
                type="button"
                onClick={() => setRejectModalTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white">
                  Pesanan #{rejectModalTarget.order.orderNumber}
                </p>
                <p className="mt-0.5 text-slate-500">
                  Alasan pembeli:{' '}
                  {rejectModalTarget.reasonLabel || rejectModalTarget.reason}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Alasan Penolakan <span className="text-orange-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Kerusakan fisik akibat benturan / terkena air tidak termasuk dalam cakupan garansi 30 hari..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white p-3 text-xs text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setRejectModalTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRejectByAfterSales}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Konfirmasi Tolak'
                )}
              </button>
            </div>
          </div>
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
