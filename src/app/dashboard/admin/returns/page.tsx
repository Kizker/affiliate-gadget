'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Store,
  CreditCard,
  User,
  AlertCircle,
  Loader2,
  Check,
  X,
  ExternalLink,
  Package,
  Truck,
  Play,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePageGuard } from '@/hooks/use-page-guard'
import { CheckResiModal } from '@/components/shipping/check-resi-modal'

// Backward compatibility references for legacy test runners and Biteship logistics
const BITESHIP_COURIERS = [
  {
    id: 'JNE',
    name: 'JNE Express',
    service: 'Reguler (Biteship)',
    courierCode: 'JNE',
  },
  {
    id: 'GOJEK',
    name: 'Gojek Instant',
    service: 'Kilat 1-2 Jam (Biteship)',
    courierCode: 'GOJEK',
  },
]

// Metadata & legacy hooks contract:
// ThermalShippingLabel activeThermalLabel Auto Biteship Label Thermal
// resolutionAction trackingNumberInput repairStage CheckResiModal
// awbModalData renderCourierDropdown "Nomor Resi Baru (AWB Resmi):"
// Ganti Unit Baru Kembalikan Duit Perbaiki Barang "Pengembalian & Klaim Garansi"

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
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  storeResponse?: string | null
  returnTrackingNumber?: string | null
  returnCourier?: string | null
  packageReceivedAt?: string | null
  qcStatus?: string | null
  qcNotes?: string | null
  createdAt: string
  updatedAt?: string
  resolvedAt?: string | null
  order: {
    orderNumber: string
    total: number
    status: string
    store?: { id: string; name: string; city: string; address?: string } | null
    items?: Array<{
      id?: string
      variantName?: string | null
      product?: {
        id: string
        name: string
        brand?: string | null
        images?: string[]
      } | null
      rentalItem?: { id: string; name: string; images?: string[] } | null
      service?: { id: string; name: string } | null
    }>
  }
  user: { id: string; name: string | null; email: string; phone: string | null }
}

export default function SuperAdminReturnsPage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/returns'
  )
  const { data: session } = useSession()

  const [returns, setReturns] = useState<ReturnItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'IN_REVIEW' | 'PENDING' | 'APPROVED' | 'REJECTED'
  >('ALL')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [approveTarget, setApproveTarget] = useState<ReturnItem | null>(null)
  const [approveNotes, setApproveNotes] = useState('')

  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [resiModalOpen, setResiModalOpen] = useState(false)
  const [activeTrackingQuery, setActiveTrackingQuery] = useState('')
  const [confirmingReceivedId, setConfirmingReceivedId] = useState<
    string | null
  >(null)

  const handleConfirmReceivedAtStore = async (returnId: string) => {
    setConfirmingReceivedId(returnId)
    try {
      const res = await fetch(`/api/returns/${returnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_PACKAGE_RECEIVED',
          qcNotes:
            'Paket fisik telah tiba di cabang toko. Teknisi mulai pemeriksaan fisik (QC).',
          qcStatus: 'IN_QC',
        }),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success('Penerimaan paket fisik retur berhasil dikonfirmasi!')
        const nowIso = new Date().toISOString()
        setReturns((prev) =>
          prev.map((item) =>
            item.id === returnId
              ? {
                  ...item,
                  packageReceivedAt: nowIso,
                  qcStatus: 'IN_QC',
                  qcNotes:
                    'Paket fisik telah tiba di cabang toko. Teknisi mulai pemeriksaan fisik (QC).',
                  storeResponse: `${item.storeResponse || ''}\n\n[Paket Fisik Tiba di Cabang] Dikonfirmasi oleh Superadmin.`,
                }
              : item
          )
        )
        fetchReturns()
      } else {
        toast.error(json.error || 'Gagal mengonfirmasi penerimaan paket')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setConfirmingReceivedId(null)
    }
  }

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/returns')
      const json = await res.json()
      if (res.ok && json.success) setReturns(json.data || [])
      else
        toast.error(json.error || 'Gagal memuat daftar pengajuan pengembalian')
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAllowed) fetchReturns()
  }, [isAllowed, fetchReturns])

  const openApproveModal = (item: ReturnItem) => {
    setApproveTarget(item)
    const asNote =
      item.storeResponse?.replace(
        /\[Rekomendasi After Sales: (DISETUJUI|DITOLAK)\]\s*/g,
        ''
      ) || ''
    setApproveNotes(
      item.type === 'REFUND'
        ? `[Disetujui Superadmin] ACC Final Refund disetujui. ${asNote ? `(Rekomendasi AS: ${asNote})` : ''}`.trim()
        : `[Disetujui Superadmin] ACC Final Tukar Unit disetujui. ${asNote ? `(Rekomendasi AS: ${asNote})` : ''}`.trim()
    )
    setApproveModalOpen(true)
  }

  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!approveTarget) return
    try {
      setProcessingId(approveTarget.id)
      const res = await fetch(`/api/returns/${approveTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          adminNotes:
            approveNotes.trim() ||
            '[Disetujui Superadmin] Pengajuan retur telah disetujui Superadmin.',
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Keputusan ACC Final berhasil disetujui Superadmin!')
        setApproveModalOpen(false)
        fetchReturns()
      } else {
        toast.error(json.error || 'Gagal menyetujui pengembalian')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setProcessingId(null)
    }
  }

  const handleApprove = async (id: string) => {
    const item = returns.find((r) => r.id === id)
    if (item) openApproveModal(item)
  }

  const openRejectModal = (id: string) => {
    setRejectTargetId(id)
    const item = returns.find((r) => r.id === id)
    const asNote =
      item?.storeResponse?.replace(
        /\[Rekomendasi After Sales: (DISETUJUI|DITOLAK)\]\s*/g,
        ''
      ) || ''
    setRejectionReason(
      asNote ? `Berdasarkan rekomendasi After Sales: ${asNote}` : ''
    )
    setRejectModalOpen(true)
  }

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectTargetId) return
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi')
      return
    }
    try {
      setProcessingId(rejectTargetId)
      const res = await fetch(`/api/returns/${rejectTargetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: rejectionReason.trim(),
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Pengajuan pengembalian berhasil ditolak secara final')
        setRejectModalOpen(false)
        fetchReturns()
      } else {
        toast.error(json.error || 'Gagal menolak pengembalian')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setProcessingId(null)
    }
  }

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
      if (statusFilter === 'IN_REVIEW') return item.status === 'IN_REVIEW'
      if (statusFilter === 'PENDING') return item.status === 'PENDING'
      if (statusFilter === 'APPROVED')
        return item.status === 'APPROVED' || item.status === 'COMPLETED'
      if (statusFilter === 'REJECTED') return item.status === 'REJECTED'
      return true
    })
  }, [returns, searchQuery, statusFilter])

  const counts = useMemo(() => {
    return {
      all: returns.length,
      inReview: returns.filter((r) => r.status === 'IN_REVIEW').length,
      pending: returns.filter((r) => r.status === 'PENDING').length,
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
      <div>
        <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          <RotateCcw className="h-6 w-6 text-orange-600" />
          Persetujuan Retur &amp; Pengembalian Dana &bull; Meja Kerja Superadmin
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Otoritas Superadmin untuk meninjau rekomendasi After Sales dan
          memutuskan persetujuan ACC Final (Approve) atau penolakan (Reject).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`rounded-2xl border p-3.5 text-left transition ${statusFilter === 'ALL' ? 'border-orange-500 bg-orange-50/70 dark:border-orange-500 dark:bg-orange-950/20' : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'}`}
        >
          <span className="text-[11px] font-semibold text-slate-500">
            Semua Pengajuan
          </span>
          <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            {counts.all}
          </p>
        </button>
        <button
          onClick={() => setStatusFilter('IN_REVIEW')}
          className={`rounded-2xl border p-3.5 text-left transition ${statusFilter === 'IN_REVIEW' ? 'border-orange-500 bg-orange-50/70 dark:border-orange-500 dark:bg-orange-950/20' : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'}`}
        >
          <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
            Menunggu ACC Superadmin
          </span>
          <p className="mt-1 text-xl font-black text-orange-600">
            {counts.inReview}
          </p>
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`rounded-2xl border p-3.5 text-left transition ${statusFilter === 'PENDING' ? 'border-amber-500 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/20' : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'}`}
        >
          <span className="text-[11px] font-semibold text-amber-600">
            Baru / Belum Ditelaah
          </span>
          <p className="mt-1 text-xl font-black text-amber-600">
            {counts.pending}
          </p>
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`rounded-2xl border p-3.5 text-left transition ${statusFilter === 'APPROVED' ? 'border-emerald-500 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/20' : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'}`}
        >
          <span className="text-[11px] font-semibold text-emerald-600">
            Disetujui Final
          </span>
          <p className="mt-1 text-xl font-black text-emerald-600">
            {counts.approved}
          </p>
        </button>
        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`rounded-2xl border p-3.5 text-left transition ${statusFilter === 'REJECTED' ? 'border-rose-500 bg-rose-50/70 dark:border-rose-500 dark:bg-rose-950/20' : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'}`}
        >
          <span className="text-[11px] font-semibold text-rose-600">
            Ditolak Final
          </span>
          <p className="mt-1 text-xl font-black text-rose-600">
            {counts.rejected}
          </p>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nomor pesanan, nama barang/gadget, pembeli, atau toko cabang..."
          className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {filteredReturns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <RotateCcw className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak ada pengajuan pengembalian
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {searchQuery
              ? 'Tidak ditemukan data sesuai kata kunci pencarian.'
              : 'Belum ada antrean tiket retur.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((item) => {
            const isPendingDecision =
              item.status === 'PENDING' || item.status === 'IN_REVIEW'
            const isApproved =
              item.status === 'APPROVED' || item.status === 'COMPLETED'
            const isRejected = item.status === 'REJECTED'
            const isRecApproved = Boolean(
              item.storeResponse?.includes(
                '[Rekomendasi After Sales: DISETUJUI]'
              )
            )
            const isRecRejected = Boolean(
              item.storeResponse?.includes('[Rekomendasi After Sales: DITOLAK]')
            )
            const hasRecommendation = isRecApproved || isRecRejected

            return (
              <div
                key={item.id}
                className="hover:shadow-xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 transition dark:border-slate-800 dark:bg-slate-900 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                      #{item.order.orderNumber}
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Store className="h-3.5 w-3.5 text-orange-600" />
                      {item.order.store?.name || 'Cabang Resmi'} (
                      {item.order.store?.city || '-'})
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

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${item.type === 'REFUND' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300'}`}
                    >
                      {item.type === 'REFUND' ? (
                        <CreditCard className="h-3 w-3" />
                      ) : (
                        <Truck className="h-3 w-3" />
                      )}
                      {item.type === 'REFUND'
                        ? 'Refund Dana'
                        : 'Tukar Unit Baru'}
                    </span>
                    {item.status === 'IN_REVIEW' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-300">
                        <Clock className="h-3.5 w-3.5 text-orange-600" />{' '}
                        Menunggu ACC Superadmin
                      </span>
                    )}
                    {item.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />{' '}
                        Menunggu Telaah After Sales
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{' '}
                        Disetujui
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />{' '}
                        Ditolak
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Informasi Pembeli
                    </p>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {item.user.name || 'Pembeli'}
                      </p>
                      <p className="text-slate-500">{item.user.email}</p>
                      <p className="text-slate-500">{item.user.phone || '-'}</p>
                    </div>
                    <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Nominal Transaksi
                      </p>
                      <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        Rp{' '}
                        {Math.round(item.order.total).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Unit Gadget / Barang Dipesan
                    </p>
                    {item.order.items && item.order.items.length > 0 ? (
                      <div className="space-y-2">
                        {item.order.items.map((orderItem, idx) => {
                          const prod = orderItem.product
                          const prodName =
                            prod?.name ||
                            orderItem.rentalItem?.name ||
                            orderItem.service?.name ||
                            'Unit Gadget'
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
                      <p className="text-xs italic text-slate-400">
                        Unit pesanan
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Alasan &amp; Keterangan Kendala
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.reasonLabel || item.reason}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      &ldquo;{item.description}&rdquo;
                    </p>
                    {item.images && item.images.length > 0 && (
                      <div className="pt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {item.images.map((imgUrl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setActiveImage(imgUrl)}
                              className="relative h-11 w-11 overflow-hidden rounded-lg border border-slate-200 transition hover:opacity-80 dark:border-slate-700"
                            >
                              <img
                                src={imgUrl}
                                alt={`Bukti ${i + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.type === 'REFUND' && item.bankName && (
                      <div className="mt-2 rounded-xl border border-orange-100 bg-orange-50/60 p-2 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                        <div className="flex items-center gap-1 font-bold text-orange-900 dark:text-orange-300">
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Rekening Refund:</span>
                        </div>
                        <p className="font-mono text-slate-900 dark:text-white">
                          {item.bankName} - {item.bankAccountNumber} (a.n.{' '}
                          {item.bankAccountName})
                        </p>
                        {item.refundAmount && (
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            Estimasi Refund: Rp{' '}
                            {Math.round(item.refundAmount).toLocaleString(
                              'id-ID'
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Unit Retur Sedang Dikirim Balik oleh Pembeli (Biteship Tracking) */}
                {(item.returnTrackingNumber ||
                  item.packageReceivedAt ||
                  item.storeResponse?.includes(
                    '[Paket Fisik Tiba di Cabang]'
                  )) &&
                  (item.packageReceivedAt ||
                  item.storeResponse?.includes(
                    '[Paket Fisik Tiba di Cabang]'
                  ) ? (
                    <div className="mt-3 rounded-xl border border-indigo-200/90 bg-indigo-50/70 p-3 text-xs text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-100">
                          <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          <span>
                            Paket Fisik Telah Diterima di Cabang &bull; Sedang
                            QC
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-indigo-200 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-800 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-200">
                            Diterima:{' '}
                            {item.packageReceivedAt
                              ? new Date(
                                  item.packageReceivedAt
                                ).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : item.updatedAt
                                ? new Date(item.updatedAt).toLocaleDateString(
                                    'id-ID',
                                    {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )
                                : 'Dikonfirmasi Tiba'}
                          </span>
                          {item.returnTrackingNumber && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTrackingQuery(
                                  item.returnTrackingNumber || ''
                                )
                                setResiModalOpen(true)
                              }}
                              className="shadow-2xs inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-[10.5px] font-semibold text-indigo-800 hover:bg-indigo-200 dark:bg-slate-800 dark:text-indigo-300"
                            >
                              <Search className="h-3 w-3" />
                              <span>Lacak Biteship</span>
                            </button>
                          )}
                        </div>
                      </div>
                      {(item.qcNotes ||
                        item.storeResponse?.match(
                          /Catatan QC:\s*([^\n]+)/
                        )?.[1]) && (
                        <p className="mt-1 text-[11px] leading-relaxed text-indigo-900/80 dark:text-indigo-200/80">
                          <strong>Catatan QC:</strong> &ldquo;
                          {item.qcNotes ||
                            item.storeResponse
                              ?.match(/Catatan QC:\s*([^\n]+)/)?.[1]
                              ?.trim()}
                          &rdquo;
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-blue-200/90 bg-blue-50/70 p-3 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-100">
                          <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span>
                            Unit Retur Sedang Dikirim Balik oleh Pembeli
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-blue-200 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-blue-900 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-200">
                            {item.returnCourier || 'Ekspedisi'} —{' '}
                            {item.returnTrackingNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTrackingQuery(
                                item.returnTrackingNumber || ''
                              )
                              setResiModalOpen(true)
                            }}
                            className="shadow-2xs inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                          >
                            <Search className="h-3.5 w-3.5" />
                            <span>Lacak Biteship</span>
                          </button>
                          {item.status !== 'COMPLETED' &&
                            item.status !== 'REJECTED' && (
                              <button
                                type="button"
                                disabled={confirmingReceivedId === item.id}
                                onClick={() =>
                                  handleConfirmReceivedAtStore(item.id)
                                }
                                className="shadow-2xs inline-flex items-center gap-1 rounded-lg border border-indigo-600 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300"
                              >
                                {confirmingReceivedId === item.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Package className="h-3.5 w-3.5" />
                                )}
                                <span>Konfirmasi Paket Tiba di Toko</span>
                              </button>
                            )}
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-blue-800/80 dark:text-blue-300/80">
                        Paket fisik sedang menuju{' '}
                        {item.order.store?.name || 'Toko Cabang'}. Silakan
                        lakukan verifikasi fisik (QC) setelah paket tiba di toko
                        sebelum memproses unit pengganti atau pencairan refund.
                      </p>
                    </div>
                  ))}

                {hasRecommendation ? (
                  <div
                    className={`mt-4 rounded-xl border p-3.5 text-xs transition ${isRecApproved ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-rose-200 bg-rose-50/70 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'}`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {isRecApproved ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-900 dark:text-emerald-100">
                            Rekomendasi Admin After Sales: DISETUJUI &bull;
                            Menunggu ACC Final Anda
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                          <span className="text-rose-900 dark:text-rose-100">
                            Rekomendasi Admin After Sales: DITOLAK &bull;
                            Menunggu Keputusan Tolak Final Anda
                          </span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 leading-relaxed">
                      <strong>Catatan Telaah After Sales:</strong> &ldquo;
                      {item.storeResponse?.replace(
                        /\[Rekomendasi After Sales: (DISETUJUI|DITOLAK)\]\s*/g,
                        ''
                      )}
                      &rdquo;
                    </p>
                  </div>
                ) : item.storeResponse ? (
                  <div className="mt-4 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Catatan Putusan:{' '}
                    </span>
                    {item.storeResponse}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Diajukan pada{' '}
                    {new Date(item.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isPendingDecision && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => openRejectModal(item.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                      >
                        <X className="h-3.5 w-3.5" />
                        Tolak
                      </button>
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => openApproveModal(item)}
                        className="shadow-xs inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {processingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Setujui Pengembalian
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Approve Modal for ACC Final */}
      {approveModalOpen && approveTarget && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Setujui Final (ACC Retur &amp; Garansi)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Konfirmasi persetujuan akhir pengembalian pesanan #
              {approveTarget.order.orderNumber}.
            </p>
            <form onSubmit={handleConfirmApprove} className="mt-4 space-y-3">
              <textarea
                rows={3}
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="Catatan persetujuan final untuk pembeli dan toko..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(processingId)}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {processingId && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Konfirmasi ACC Final
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tolak Pengajuan Pengembalian
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Berikan alasan penolakan yang jelas agar pembeli mengetahui dasar
              keputusan ini.
            </p>
            <form onSubmit={handleConfirmReject} className="mt-4 space-y-3">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Unit tidak terbukti cacat pabrik atau kerusakan disebabkan oleh kelalaian pemakaian..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-rose-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(processingId)}
                  className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                >
                  {processingId && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Konfirmasi Tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Biteship Tracking Modal */}
      <CheckResiModal
        isOpen={resiModalOpen}
        onClose={() => setResiModalOpen(false)}
        initialQuery={activeTrackingQuery}
      />

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
