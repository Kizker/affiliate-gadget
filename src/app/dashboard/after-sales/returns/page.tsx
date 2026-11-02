'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  MessageSquare,
  CreditCard,
  Truck,
  Play,
  Video,
  ShieldCheck,
  ChevronDown,
  Check,
  Package,
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
  videoUrl?: string | null
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountName?: string | null
  refundAmount?: number | null
  returnCourier?: string | null
  returnTrackingNumber?: string | null
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  storeResponse?: string | null
  createdAt: string
  order: {
    orderNumber: string
    total: number
    store?: {
      name: string
      city: string
      address?: string
    } | null
    items?: Array<{
      id: string
      quantity?: number
      price?: number
      variantName?: string | null
      product?: {
        id: string
        name: string
        brand?: string | null
        images?: string[]
        stock?: number
      } | null
      rentalItem?: {
        id: string
        name: string
        images?: string[]
      } | null
      service?: {
        id: string
        name: string
      } | null
    }>
  }
  user: {
    name: string | null
    email: string
    phone: string | null
  }
}

const COURIER_OPTIONS = [
  { id: 'JNE REG', name: 'JNE - Reguler (1-3 hari)' },
  { id: 'JNE YES', name: 'JNE - YES (Yakin Esok Sampai)' },
  { id: 'GOJEK INSTANT', name: 'Gojek - Instant Courier (Kilat 2-3 Jam)' },
  { id: 'GOJEK SAMEDAY', name: 'Gojek - Same Day' },
]

export default function AfterSalesReturnsPage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/after-sales'
  )
  const router = useRouter()
  const [connectingChatId, setConnectingChatId] = useState<string | null>(null)

  const [returns, setReturns] = useState<ReturnItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING' | 'DECIDED'
  >('ALL')

  // Lightbox & Video State
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)

  // Resolution Action Modals State
  const [refundModalTarget, setRefundModalTarget] = useState<ReturnItem | null>(
    null
  )
  const [refundNotes, setRefundNotes] = useState('')

  const [replacementModalTarget, setReplacementModalTarget] =
    useState<ReturnItem | null>(null)
  const [replacementCourier, setReplacementCourier] = useState('JNE REG')
  const [replacementTracking, setReplacementTracking] = useState('')
  const [replacementNotes, setReplacementNotes] = useState('')
  const [courierDropdownOpen, setCourierDropdownOpen] = useState(false)

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
        item.order.store?.name.toLowerCase().includes(q) ||
        item.order.items?.some((i) =>
          (i.product?.name || i.rentalItem?.name || i.service?.name || '')
            .toLowerCase()
            .includes(q)
        )

      if (!matchQuery) return false

      if (statusFilter === 'ALL') return true
      if (statusFilter === 'PENDING')
        return item.status === 'PENDING' || item.status === 'IN_REVIEW'
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
      pending: returns.filter(
        (r) =>
          r.status === 'PENDING' ||
          r.status === 'APPROVED' ||
          r.status === 'IN_REVIEW'
      ).length,
      decided: returns.filter(
        (r) => r.status === 'REJECTED' || r.status === 'COMPLETED'
      ).length,
    }
  }, [returns])

  const [approvingId, setApprovingId] = useState<string | null>(null)

  // Handle Approve for Return (Tahap 1: Persetujuan awal After Sales agar pembeli mengirim unit fisik)
  const handleApproveForReturn = async (item: ReturnItem) => {
    setApprovingId(item.id)
    try {
      const res = await fetch(`/api/returns/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          adminNotes: `Pengajuan retur untuk pesanan #${item.order.orderNumber} telah disetujui After Sales. Silakan kemas unit gadget dengan aman dan kirimkan ke alamat toko cabang pengirim (${item.order.store?.name || 'Toko Cabang'}).`,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(
          'Pengajuan retur berhasil disetujui! Alamat toko cabang telah dikirim ke pembeli.'
        )
        fetchReturns()
      } else {
        toast.error(json.error || 'Gagal menyetujui pengajuan')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setApprovingId(null)
    }
  }

  // Execute REFUND Resolution
  const handleExecuteRefund = async () => {
    if (!refundModalTarget) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/returns/${refundModalTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionAction: 'REFUND',
          storeResponse:
            refundNotes.trim() ||
            `Pengembalian dana sebesar Rp ${Math.round(
              refundModalTarget.refundAmount || refundModalTarget.order.total
            ).toLocaleString(
              'id-ID'
            )} telah diverifikasi dan disetujui pencairannya oleh Admin After Sales.`,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(
          'Pencairan dana refund berhasil dieksekusi oleh After Sales!'
        )
        setRefundModalTarget(null)
        setRefundNotes('')
        fetchReturns()
      } else {
        toast.error(json.error || 'Gagal memproses refund')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Execute REPLACEMENT Resolution
  const handleExecuteReplacement = async () => {
    if (!replacementModalTarget) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/returns/${replacementModalTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionAction: 'REPLACEMENT',
          replacementCourier,
          replacementTrackingNumber: replacementTracking.trim() || 'AUTO',
          storeResponse:
            replacementNotes.trim() ||
            `Unit baru pengganti telah disiapkan dan dikirimkan oleh Admin After Sales via ${replacementCourier} (Resi: ${
              replacementTracking.trim() || 'AUTO'
            }).`,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Resi unit baru berhasil diterbitkan oleh After Sales!')
        setReplacementModalTarget(null)
        setReplacementTracking('')
        setReplacementNotes('')
        fetchReturns()
      } else {
        toast.error(json.error || 'Gagal menerbitkan resi pengganti')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle REJECT Action
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
        toast.success('Pengajuan klaim garansi berhasil ditolak')
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

  // Open / Connect chat to customer with Return Reference bubble
  const handleOpenCustomerChat = async (item: ReturnItem) => {
    try {
      setConnectingChatId(item.id)
      const res = await fetch('/api/admin/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: item.orderId,
          customerId: item.userId,
          returnId: item.id,
          returnReason: item.reasonLabel || item.reason,
          returnStatus: item.status,
          returnType: item.type,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.room?.id) {
        throw new Error(data.error || 'Gagal menghubungkan chat pembeli')
      }
      router.push(
        `/dashboard/after-sales/chat?orderId=${item.orderId}&roomId=${data.room.id}&returnId=${item.id}`
      )
    } catch (err: any) {
      console.error('Error connecting to customer chat:', err)
      toast.error(err.message || 'Gagal membuka chat customer')
    } finally {
      setConnectingChatId(null)
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
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-orange-600" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Meja Kerja Admin After Sales &bull; Manajemen Retur &amp; Garansi
          </h1>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Eksekutor tunggal validasi bukti cacat produk, persetujuan pencairan
          dana refund, dan penerbitan resi penggantian unit baru.
        </p>
      </div>

      {/* Metric Tabs */}
      <div className="grid grid-cols-3 gap-3">
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
            Perlu Tindakan Eksekusi
          </span>
          <p className="mt-1 text-2xl font-black text-orange-600">
            {counts.pending}
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
            Selesai Dieksekusi / Diputuskan
          </span>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {counts.decided}
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

      {/* Returns List */}
      {filteredReturns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <RotateCcw className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak ada pengajuan klaim garansi
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {searchQuery
              ? 'Tidak ditemukan data sesuai kata kunci pencarian.'
              : 'Belum ada pengajuan garansi atau retur dari cabang binaan.'}
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                    #{item.order.orderNumber}
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Store className="h-3.5 w-3.5 text-orange-600" />
                    {item.order.store?.name} ({item.order.store?.city})
                  </span>
                  {item.order.items?.[0] && (
                    <>
                      <span className="hidden text-slate-300 sm:inline">
                        &bull;
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-100/90 px-2.5 py-0.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Package className="h-3.5 w-3.5 text-orange-600" />
                        <span>
                          {item.order.items[0].product?.name ||
                            item.order.items[0].rentalItem?.name ||
                            item.order.items[0].service?.name ||
                            'Unit Gadget'}
                          {item.order.items[0].variantName
                            ? ` (${item.order.items[0].variantName})`
                            : ''}
                          {item.order.items.length > 1
                            ? ` +${item.order.items.length - 1} lainnya`
                            : ''}
                        </span>
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Resolution Type Badge */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.type === 'REFUND'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300'
                    }`}
                  >
                    {item.type === 'REFUND' ? (
                      <>
                        <CreditCard className="h-3 w-3" />
                        Pengembalian Dana (Refund)
                      </>
                    ) : (
                      <>
                        <Truck className="h-3 w-3" />
                        Tukar Unit Baru (Replacement)
                      </>
                    )}
                  </span>

                  {/* Status Badge */}
                  {item.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-300">
                      <Clock className="h-3.5 w-3.5 text-orange-600" /> Perlu
                      Tindakan
                    </span>
                  )}
                  {item.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
                      <Clock className="h-3.5 w-3.5 text-blue-600" /> Disetujui
                      (Menunggu Kirim Fisik)
                    </span>
                  )}
                  {item.status === 'IN_REVIEW' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
                      <Truck className="h-3.5 w-3.5 text-amber-600" />{' '}
                      {item.returnTrackingNumber
                        ? 'Paket Dikirim Pembeli (QC)'
                        : 'Dalam Peninjauan'}
                    </span>
                  )}
                  {item.status === 'COMPLETED' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{' '}
                      Selesai Dieksekusi
                    </span>
                  )}
                  {item.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
                      <XCircle className="h-3.5 w-3.5 text-rose-600" /> Ditolak
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Buyer & Gadget Column */}
                <div className="space-y-3">
                  <div>
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
                  </div>

                  {/* Unit Gadget / Barang yang Diretur */}
                  <div className="border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Unit Gadget / Barang
                    </p>
                    {item.order.items && item.order.items.length > 0 ? (
                      <div className="mt-1.5 space-y-2">
                        {item.order.items.map((orderItem, idx) => {
                          const prod = orderItem.product
                          const prodName =
                            prod?.name ||
                            orderItem.rentalItem?.name ||
                            orderItem.service?.name ||
                            'Gadget Smartphone'
                          const prodImg =
                            prod?.images?.[0] ||
                            orderItem.rentalItem?.images?.[0] ||
                            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&q=80'

                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-800/40"
                            >
                              <img
                                src={prodImg}
                                alt={prodName}
                                className="h-10 w-10 shrink-0 rounded-lg border border-slate-200/80 object-cover dark:border-slate-700"
                              />
                              <div className="min-w-0 flex-1">
                                {prod?.brand && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-500">
                                    {prod.brand}
                                  </span>
                                )}
                                <p
                                  className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 dark:text-white"
                                  title={prodName}
                                >
                                  {prodName}
                                </p>
                                {orderItem.variantName && (
                                  <p className="mt-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                                    Varian:{' '}
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {orderItem.variantName}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs italic text-slate-400">
                        Unit gadget pesanan
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Nominal Transaksi
                    </p>
                    <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      Rp {Math.round(item.order.total).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Issue Details & Proof Column */}
                <div className="space-y-2 sm:col-span-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Alasan &amp; Bukti Cacat Produk
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.reasonLabel || item.reason}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      &ldquo;{item.description}&rdquo;
                    </p>
                  </div>

                  {/* Bukti Foto & Video Cacat Produk */}
                  <div className="pt-1">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Bukti Unboxing / Kerusakan:
                    </p>
                    {(!item.images || item.images.length === 0) &&
                    !item.videoUrl ? (
                      <p className="text-[11px] italic text-slate-400">
                        Tidak ada lampiran foto/video bukti
                      </p>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {/* Photos */}
                        {item.images?.map((imgUrl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveImage(imgUrl)}
                            className="group relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 hover:opacity-85 dark:border-slate-700"
                          >
                            <img
                              src={imgUrl}
                              alt={`Bukti ${i + 1}`}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          </button>
                        ))}

                        {/* Video */}
                        {item.videoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveVideo(item.videoUrl || null)
                            }
                            className="flex h-14 w-20 cursor-pointer items-center justify-center gap-1 rounded-xl border border-orange-300 bg-slate-900 text-white transition hover:bg-slate-800"
                          >
                            <Play className="h-4 w-4 fill-orange-400 text-orange-400" />
                            <span className="text-[10px] font-bold">Video</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rekening Refund Info */}
                  {item.type === 'REFUND' && item.bankName && (
                    <div className="mt-2 rounded-xl border border-slate-200/70 bg-slate-50 p-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Rekening Tujuan Refund:
                      </span>{' '}
                      {item.bankName} - {item.bankAccountNumber} (a.n.{' '}
                      {item.bankAccountName}) &bull; Estimasi:{' '}
                      <strong className="text-orange-600">
                        Rp{' '}
                        {Math.round(
                          item.refundAmount || item.order.total
                        ).toLocaleString('id-ID')}
                      </strong>
                    </div>
                  )}

                  {/* Respon Catatan After Sales Sebelumnya */}
                  {item.storeResponse && (
                    <div className="mt-2 rounded-xl border border-slate-200/70 bg-slate-50 p-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Catatan Respon After Sales:
                      </span>{' '}
                      {item.storeResponse}
                    </div>
                  )}

                  {/* Status Resi Pengiriman Balik dari Pembeli */}
                  {item.returnTrackingNumber && (
                    <div className="mt-2.5 rounded-xl border border-blue-200/90 bg-blue-50/70 p-3 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-100">
                          <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span>
                            Unit Retur Sedang Dikirim Balik oleh Pembeli
                          </span>
                        </div>
                        <span className="rounded-md border border-blue-200 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-blue-900 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-200">
                          {item.returnCourier || 'Ekspedisi'} —{' '}
                          {item.returnTrackingNumber}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-blue-800/80 dark:text-blue-300/80">
                        Paket fisik sedang menuju{' '}
                        {item.order.store?.name || 'Toko Cabang'}. Silakan
                        lakukan verifikasi fisik (QC) setelah paket tiba di toko
                        sebelum memproses unit pengganti atau pencairan refund.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Unified Executor Actions + Live Chat */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                {/* Live Chat Purna Jual Button */}
                <button
                  type="button"
                  disabled={connectingChatId === item.id}
                  onClick={() => handleOpenCustomerChat(item)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {connectingChatId === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-600" />
                  ) : (
                    <MessageSquare className="h-3.5 w-3.5 text-orange-600" />
                  )}
                  <span>Chat Pembeli (Purna Jual)</span>
                </button>

                {/* Operational Execution Actions on Active items (PENDING, APPROVED, IN_REVIEW) */}
                {(item.status === 'PENDING' ||
                  item.status === 'APPROVED' ||
                  item.status === 'IN_REVIEW') && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectModalTarget(item)
                        setRejectReason('')
                      }}
                      className="rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/40 dark:bg-slate-900 dark:text-rose-400"
                    >
                      Tolak Pengajuan
                    </button>

                    {/* Step 1 for PENDING: Approve for Physical Return */}
                    {item.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={approvingId === item.id}
                        onClick={() => handleApproveForReturn(item)}
                        className="flex items-center gap-1.5 rounded-xl border border-blue-600 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                      >
                        {approvingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Setujui Retur &amp; Minta Kirim Barang
                      </button>
                    )}

                    {/* Direct or QC-verified resolution */}
                    {item.type === 'REFUND' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRefundModalTarget(item)
                          setRefundNotes(
                            `Pengembalian dana klaim garansi sebesar Rp ${Math.round(
                              item.refundAmount || item.order.total
                            ).toLocaleString(
                              'id-ID'
                            )} telah disetujui dan dicairkan oleh Admin After Sales.`
                          )
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        {item.status === 'IN_REVIEW' &&
                        item.returnTrackingNumber
                          ? 'Konfirmasi QC & Cairkan Dana'
                          : 'Setujui & Cairkan Dana'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setReplacementModalTarget(item)
                          setReplacementTracking('')
                          setReplacementNotes(
                            `Unit baru pengganti pesanan #${item.order.orderNumber} telah disiapkan dan dikirimkan oleh Admin After Sales.`
                          )
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-orange-700"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        {item.status === 'IN_REVIEW' &&
                        item.returnTrackingNumber
                          ? 'Konfirmasi QC & Kirim Unit Pengganti'
                          : 'Setujui & Terbitkan Resi Unit Baru'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Konfirmasi Pencairan Dana (REFUND) */}
      {refundModalTarget && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Eksekusi Pencairan Dana Refund (After Sales)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {/* Info Pesanan & Rekening */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <p className="font-bold text-slate-900 dark:text-white">
                  Pesanan #{refundModalTarget.order.orderNumber}
                </p>
                {refundModalTarget.order.items?.[0] && (
                  <p className="mt-0.5 text-slate-700 dark:text-slate-200">
                    Unit:{' '}
                    <strong>
                      {refundModalTarget.order.items[0].product?.name ||
                        refundModalTarget.order.items[0].rentalItem?.name ||
                        refundModalTarget.order.items[0].service?.name ||
                        'Unit Gadget'}
                    </strong>
                    {refundModalTarget.order.items[0].variantName
                      ? ` (${refundModalTarget.order.items[0].variantName})`
                      : ''}
                  </p>
                )}
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Pembeli: <strong>{refundModalTarget.user.name}</strong> (
                  {refundModalTarget.user.email})
                </p>
                <div className="mt-2 border-t border-emerald-200/60 pt-2 text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Rekening Tujuan:
                  </p>
                  <p className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {refundModalTarget.bankName} -{' '}
                    {refundModalTarget.bankAccountNumber}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    a.n. {refundModalTarget.bankAccountName}
                  </p>
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t border-emerald-200/60 pt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Total Dana Dicairkan:
                  </span>
                  <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                    Rp{' '}
                    {Math.round(
                      refundModalTarget.refundAmount ||
                        refundModalTarget.order.total
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan Konfirmasi Pencairan Dana
                </label>
                <textarea
                  rows={2}
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white p-3 text-xs text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setRefundModalTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteRefund}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Konfirmasi Pencairan Dana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Penerbitan Resi Unit Baru (REPLACEMENT) */}
      {replacementModalTarget && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Terbitkan Resi Pengiriman Unit Baru (Replacement)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setReplacementModalTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 dark:border-orange-900/40 dark:bg-orange-950/20">
                <p className="font-bold text-slate-900 dark:text-white">
                  Pesanan #{replacementModalTarget.order.orderNumber}
                </p>
                {replacementModalTarget.order.items?.[0] && (
                  <p className="mt-0.5 text-slate-700 dark:text-slate-200">
                    Unit Pengganti:{' '}
                    <strong>
                      {replacementModalTarget.order.items[0].product?.name ||
                        replacementModalTarget.order.items[0].rentalItem
                          ?.name ||
                        replacementModalTarget.order.items[0].service?.name ||
                        'Unit Gadget'}
                    </strong>
                    {replacementModalTarget.order.items[0].variantName
                      ? ` (${replacementModalTarget.order.items[0].variantName})`
                      : ''}
                  </p>
                )}
                <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                  Penerima: <strong>{replacementModalTarget.user.name}</strong>{' '}
                  ({replacementModalTarget.user.phone})
                </p>
                <p className="mt-0.5 text-slate-500">
                  Toko Pengirim: {replacementModalTarget.order.store?.name}
                </p>
                {replacementModalTarget.returnTrackingNumber && (
                  <p className="mt-1 font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    📦 Unit Retur Diterima:{' '}
                    {replacementModalTarget.returnCourier || 'Ekspedisi'} —{' '}
                    {replacementModalTarget.returnTrackingNumber} (Lolos QC)
                  </p>
                )}
              </div>

              {/* Kurir Selector */}
              <div className="relative">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ekspedisi Pengiriman Unit Pengganti
                </label>
                <button
                  type="button"
                  onClick={() => setCourierDropdownOpen((prev) => !prev)}
                  className="mt-1.5 flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <span>
                    {COURIER_OPTIONS.find((c) => c.id === replacementCourier)
                      ?.name || replacementCourier}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                      courierDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {courierDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {COURIER_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setReplacementCourier(c.id)
                          setCourierDropdownOpen(false)
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                          replacementCourier === c.id
                            ? 'bg-orange-50 font-bold text-orange-600 dark:bg-orange-950/50 dark:text-orange-400'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{c.name}</span>
                        {replacementCourier === c.id && (
                          <Check className="h-3.5 w-3.5 text-orange-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nomor Resi */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nomor Resi / AWB Pengiriman Unit Baru
                </label>
                <input
                  type="text"
                  value={replacementTracking}
                  onChange={(e) => setReplacementTracking(e.target.value)}
                  placeholder="Ketik nomor resi atau ketik 'AUTO' untuk booking otomatis Biteship"
                  className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 font-mono text-xs text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan untuk Pembeli
                </label>
                <textarea
                  rows={2}
                  value={replacementNotes}
                  onChange={(e) => setReplacementNotes(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white p-3 text-xs text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setReplacementModalTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteReplacement}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Truck className="h-3.5 w-3.5" />
                )}
                Kirim Unit Pengganti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Tolak Pengajuan (REJECT) */}
      {rejectModalTarget && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Tolak Pengajuan Klaim Garansi
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
                {rejectModalTarget.order.items?.[0] && (
                  <p className="mt-0.5 text-slate-700 dark:text-slate-200">
                    Unit:{' '}
                    <strong>
                      {rejectModalTarget.order.items[0].product?.name ||
                        rejectModalTarget.order.items[0].rentalItem?.name ||
                        rejectModalTarget.order.items[0].service?.name ||
                        'Unit Gadget'}
                    </strong>
                    {rejectModalTarget.order.items[0].variantName
                      ? ` (${rejectModalTarget.order.items[0].variantName})`
                      : ''}
                  </p>
                )}
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
                  placeholder="Contoh: Kerusakan fisik akibat kelalaian pemakaian (terbentur/kemasukan air) tidak termasuk cakupan garansi unit baru..."
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
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950"
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

      {/* Image Lightbox */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="backdrop-blur-xs fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/80 p-4"
        >
          <div className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl">
            <img
              src={activeImage}
              alt="Bukti Cacat Produk"
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* Video Lightbox Modal */}
      {activeVideo && (
        <div
          onClick={() => setActiveVideo(null)}
          className="backdrop-blur-xs fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/85 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-black shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 p-3 text-white">
              <span className="text-xs font-bold">
                Video Bukti Unboxing / Kerusakan
              </span>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="rounded-full bg-white/10 p-1 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <video
              src={activeVideo}
              controls
              autoPlay
              playsInline
              className="max-h-[75vh] w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
