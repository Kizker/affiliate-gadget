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
  Lock,
  Upload,
  ImageIcon,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePageGuard } from '@/hooks/use-page-guard'
import { CheckResiModal } from '@/components/shipping/check-resi-modal'
import { processMediaUploadFile } from '@/lib/media-upload-client'

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
  packageReceivedAt?: string | null
  qcStatus?: string | null
  qcNotes?: string | null
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  storeResponse?: string | null
  createdAt: string
  updatedAt?: string
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

const extractQcImages = (storeResponse?: string | null): string[] => {
  if (!storeResponse) return []
  const match = storeResponse.match(/\[Foto QC:\s*([^\]]+)\]/)
  if (!match) return []
  return match[1]
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
}

const cleanRecommendationNote = (storeResponse?: string | null): string => {
  if (!storeResponse) return ''
  return storeResponse
    .replace(/\[Rekomendasi After Sales: (DISETUJUI|DITOLAK)\]\s*/g, '')
    .replace(/\[Foto QC:\s*[^\]]+\]/g, '')
    .trim()
}

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

  // Keputusan After Sales (Hanya 2 Opsi: Setujui atau Tolak Permintaan)
  const [decisionModalTarget, setDecisionModalTarget] =
    useState<ReturnItem | null>(null)
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT'>(
    'APPROVE'
  )
  const [decisionNotes, setDecisionNotes] = useState('')
  const [decisionImages, setDecisionImages] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const [resiModalOpen, setResiModalOpen] = useState(false)
  const [activeTrackingQuery, setActiveTrackingQuery] = useState('')

  // Konfirmasi Barang Retur Tiba di Cabang & Mulai QC Fisik
  const [receivingPackageTarget, setReceivingPackageTarget] =
    useState<ReturnItem | null>(null)
  const [packageReceivedNotes, setPackageReceivedNotes] = useState('')
  const [isReceivingPackage, setIsReceivingPackage] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirmPackageReceived = async () => {
    if (!receivingPackageTarget) return
    setIsReceivingPackage(true)
    try {
      const res = await fetch(`/api/returns/${receivingPackageTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_PACKAGE_RECEIVED',
          qcNotes:
            packageReceivedNotes.trim() ||
            'Unit fisik barang retur telah tiba di cabang toko dan masuk tahap pemeriksaan teknis (QC).',
          qcStatus: 'IN_QC',
        }),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(
          'Paket fisik berhasil dikonfirmasi tiba di cabang! Status beralih ke QC Fisik.'
        )
        const targetId = receivingPackageTarget.id
        const nowIso = new Date().toISOString()
        const qcNotesText =
          packageReceivedNotes.trim() ||
          'Unit fisik barang retur telah tiba di cabang toko dan masuk tahap pemeriksaan teknis (QC).'

        setReturns((prev) =>
          prev.map((item) =>
            item.id === targetId
              ? {
                  ...item,
                  packageReceivedAt: nowIso,
                  qcStatus: 'IN_QC',
                  qcNotes: qcNotesText,
                  storeResponse: `${item.storeResponse || ''}\n\n[Paket Fisik Tiba di Cabang] Dikonfirmasi oleh After Sales. Catatan QC: ${qcNotesText}`,
                }
              : item
          )
        )

        setReceivingPackageTarget(null)
        setPackageReceivedNotes('')
        fetchReturns()
      } else {
        toast.error(json.error || 'Gagal mengonfirmasi penerimaan paket')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan saat konfirmasi penerimaan paket')
    } finally {
      setIsReceivingPackage(false)
    }
  }

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

  // Handle Upload Foto Bukti QC (Maksimal 5 Foto)
  const handleUploadQcImages = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = 5 - decisionImages.length
    if (remainingSlots <= 0) {
      toast.error('Maksimal 5 foto bukti QC.')
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    setIsUploadingImages(true)
    try {
      for (const file of filesToUpload) {
        let fileToUpload = file
        try {
          fileToUpload = await processMediaUploadFile(file)
        } catch (valErr: any) {
          toast.error(valErr.message || `File ${file.name} tidak valid`)
          continue
        }

        const formData = new FormData()
        formData.append('file', fileToUpload)
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          const errJson = await res.json()
          throw new Error(errJson.error || 'Upload gagal')
        }
        const data = await res.json()
        setDecisionImages((prev) => [...prev, data.url])
      }
      toast.success('Foto bukti QC berhasil dilampirkan.')
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah foto')
    } finally {
      setIsUploadingImages(false)
      e.target.value = ''
    }
  }

  const handleRemoveQcImage = (indexToRemove: number) => {
    setDecisionImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  // Handle Kirim Keputusan (Setujui atau Tolak) ke Superadmin
  const handleSubmitDecision = async () => {
    if (!decisionModalTarget) return
    const notesTrimmed = decisionNotes.trim()
    if (!notesTrimmed && decisionImages.length === 0) {
      toast.error(
        'Mohon sertakan deskripsi alasan atau lampirkan minimal 1 foto bukti QC.'
      )
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/returns/${decisionModalTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'AFTER_SALES_CONFIRM',
          decision: decisionType,
          notes: notesTrimmed,
          qcImages: decisionImages,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(
          decisionType === 'APPROVE'
            ? 'Keputusan persetujuan berhasil dikirim ke Superadmin untuk ACC Final!'
            : 'Keputusan penolakan berhasil dikirim ke Superadmin!'
        )
        setDecisionModalTarget(null)
        setDecisionNotes('')
        setDecisionImages([])
        fetchReturns()
      } else {
        toast.error(json.error || 'Gagal mengirimkan keputusan ke Superadmin')
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

                  {/* Status Resi Pengiriman Balik dari Pembeli */}
                  {(item.returnTrackingNumber ||
                    item.packageReceivedAt ||
                    item.storeResponse?.includes(
                      '[Paket Fisik Tiba di Cabang]'
                    )) &&
                    (item.packageReceivedAt ||
                    item.storeResponse?.includes(
                      '[Paket Fisik Tiba di Cabang]'
                    ) ? (
                      <div className="mt-2.5 rounded-xl border border-indigo-200/90 bg-indigo-50/70 p-3 text-xs text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
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
                            <strong>Catatan QC Awal:</strong> &ldquo;
                            {item.qcNotes ||
                              item.storeResponse
                                ?.match(/Catatan QC:\s*([^\n]+)/)?.[1]
                                ?.trim()}
                            &rdquo;
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2.5 rounded-xl border border-blue-200/90 bg-blue-50/70 p-3 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
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
                          </div>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-blue-800/80 dark:text-blue-300/80">
                          Paket fisik sedang menuju{' '}
                          {item.order.store?.name || 'Toko Cabang'}. Silakan
                          lakukan verifikasi fisik (QC) setelah paket tiba di
                          toko sebelum memproses unit pengganti atau pencairan
                          refund.
                        </p>
                      </div>
                    ))}

                  {/* Banner jika tiket dikembalikan oleh Superadmin */}
                  {item.storeResponse?.includes(
                    '[Dikembalikan Superadmin ke After Sales]'
                  ) && (
                    <div className="mt-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span>
                          ⚠️ Dikembalikan oleh Superadmin untuk Ditinjau Ulang
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed">
                        <strong>Catatan Superadmin:</strong> &ldquo;
                        {item.storeResponse.replace(
                          /.*\[Dikembalikan Superadmin ke After Sales\]\s*/,
                          ''
                        )}
                        &rdquo;
                      </p>
                    </div>
                  )}

                  {/* Foto Bukti QC yang telah dilampirkan */}
                  {(() => {
                    const qcImages = extractQcImages(item.storeResponse)
                    if (qcImages.length === 0) return null
                    return (
                      <div className="mt-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          📸 Foto Bukti Pemeriksaan QC ({qcImages.length} Foto):
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {qcImages.map((imgUrl, qIdx) => (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() => setActiveImage(imgUrl)}
                              className="shadow-2xs group relative h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:scale-105 hover:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                            >
                              <img
                                src={imgUrl}
                                alt={`Bukti QC ${qIdx + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Action Buttons: Dual Decision (Setuju / Tolak) + Live Chat */}
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

                {/* Tombol Keputusan After Sales */}
                {item.status === 'COMPLETED' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Tiket Garansi Selesai
                  </span>
                ) : item.status === 'REJECTED' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    Klaim Ditolak
                  </span>
                ) : (
                  (() => {
                    const isArrived = Boolean(
                      item.packageReceivedAt ||
                      item.storeResponse?.includes(
                        '[Paket Fisik Tiba di Cabang]'
                      )
                    )
                    const isWaitingSuperadmin =
                      item.status === 'IN_REVIEW' &&
                      item.storeResponse?.includes(
                        '[Rekomendasi After Sales'
                      ) &&
                      !item.storeResponse?.includes(
                        '[Dikembalikan Superadmin ke After Sales]'
                      )

                    if (isWaitingSuperadmin) {
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                          <Clock className="h-3.5 w-3.5 animate-pulse text-indigo-600" />
                          Rekomendasi Terkirim &bull; Menunggu ACC Final
                          Superadmin
                        </span>
                      )
                    }

                    // 1. Jika barang belum dikonfirmasi tiba di cabang toko: Tombol penerimaan barang
                    if (!isArrived) {
                      return (
                        <button
                          type="button"
                          disabled={
                            isReceivingPackage &&
                            receivingPackageTarget?.id === item.id
                          }
                          onClick={() => {
                            setReceivingPackageTarget(item)
                            setPackageReceivedNotes(
                              `Paket fisik retur pesanan #${item.order.orderNumber} telah diterima oleh staf cabang. Kondisi kardus utuh, memulai pengujian teknis (QC).`
                            )
                          }}
                          className="shadow-xs flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                        >
                          <Package className="h-3.5 w-3.5" />
                          <span>Barang Diterima &amp; Mulai QC</span>
                        </button>
                      )
                    }

                    // 2. Jika barang sudah tiba di cabang: HANYA ADA 2 PILIHAN (SETUJUI ATAU TOLAK)
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDecisionModalTarget(item)
                            setDecisionType('APPROVE')
                            setDecisionNotes(
                              item.type === 'REFUND'
                                ? 'Pemeriksaan fisik (QC) selesai: Barang retur lengkap dan memenuhi syarat garansi. Direkomendasikan untuk disetujui (ACC Final Refund).'
                                : 'Pemeriksaan fisik (QC) selesai: Cacat fisik / fungsi terbukti dan memenuhi syarat garansi. Direkomendasikan untuk disetujui (ACC Final Replacement).'
                            )
                            setDecisionImages([])
                          }}
                          className="shadow-xs flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Setujui Permintaan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDecisionModalTarget(item)
                            setDecisionType('REJECT')
                            setDecisionNotes('')
                            setDecisionImages([])
                          }}
                          className="shadow-xs flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-95"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Tolak Permintaan</span>
                        </button>
                      </div>
                    )
                  })()
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Keputusan After Sales (Setujui atau Tolak Permintaan) */}
      {decisionModalTarget && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {decisionType === 'APPROVE' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-600" />
                )}
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {decisionType === 'APPROVE'
                    ? 'Setujui Permintaan Retur (Kirim ke Superadmin)'
                    : 'Tolak Permintaan Retur (Kirim ke Superadmin)'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDecisionModalTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              {/* Info Pesanan */}
              <div
                className={`rounded-xl border p-3 ${
                  decisionType === 'APPROVE'
                    ? 'border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                    : 'border-rose-100 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20'
                }`}
              >
                <p className="font-bold text-slate-900 dark:text-white">
                  Pesanan #{decisionModalTarget.order.orderNumber} &bull;{' '}
                  {decisionModalTarget.user.name || 'Pembeli'}
                </p>
                {decisionModalTarget.order.items?.[0] && (
                  <p className="mt-0.5 text-slate-700 dark:text-slate-200">
                    Unit:{' '}
                    <strong>
                      {decisionModalTarget.order.items[0].product?.name ||
                        'Unit Gadget'}
                    </strong>
                    {decisionModalTarget.order.items[0].variantName
                      ? ` (${decisionModalTarget.order.items[0].variantName})`
                      : ''}
                  </p>
                )}
                <p
                  className={`mt-1 font-semibold ${
                    decisionType === 'APPROVE'
                      ? 'text-emerald-800 dark:text-emerald-300'
                      : 'text-rose-800 dark:text-rose-300'
                  }`}
                >
                  Bentuk Komplain:{' '}
                  {decisionModalTarget.type === 'REFUND'
                    ? 'Pengembalian Dana (Refund)'
                    : 'Tukar Unit Baru (Replacement)'}
                </p>
              </div>

              {/* Input Deskripsi / Alasan */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {decisionType === 'APPROVE'
                    ? 'Deskripsi / Alasan Persetujuan (Opsional)'
                    : 'Deskripsi / Alasan Penolakan (Opsional)'}
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder={
                    decisionType === 'APPROVE'
                      ? 'Contoh: Pemeriksaan fisik telah selesai. Cacat pabrik terverifikasi, segel utuh dan memenuhi syarat garansi...'
                      : 'Contoh: Pemeriksaan fisik membuktikan kerusakan disebabkan benturan keras / kemasukan cairan di luar garansi pabrik...'
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white p-3 text-xs font-medium text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Upload Foto Bukti QC (Maksimal 5) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Foto Bukti Pemeriksaan QC (Maksimal 5)
                  </label>
                  <span className="font-mono text-[10.5px] font-bold text-slate-500">
                    {decisionImages.length}/5 Foto
                  </span>
                </div>

                {/* Grid Preview Foto QC */}
                {decisionImages.length > 0 && (
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {decisionImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <img
                          src={imgUrl}
                          alt={`Bukti QC ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveQcImage(idx)}
                          className="absolute right-1 top-1 rounded-full bg-rose-600 p-1 text-white opacity-85 transition hover:scale-105 hover:opacity-100"
                          title="Hapus foto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tombol Input File Upload */}
                {decisionImages.length < 5 && (
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 text-center transition hover:border-indigo-500 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-800/40">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleUploadQcImages}
                      disabled={isUploadingImages}
                      className="hidden"
                    />
                    {isUploadingImages ? (
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    ) : (
                      <Upload className="h-4 w-4 text-indigo-600" />
                    )}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isUploadingImages
                        ? 'Mengunggah & Mengompres Foto...'
                        : '+ Tambah Foto Bukti QC'}
                    </span>
                  </label>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDecisionModalTarget(null)}
                  disabled={isSubmitting || isUploadingImages}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || isUploadingImages}
                  onClick={handleSubmitDecision}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 font-bold text-white transition disabled:opacity-50 ${
                    decisionType === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>
                    {decisionType === 'APPROVE'
                      ? 'Kirim Persetujuan ke Superadmin'
                      : 'Kirim Penolakan ke Superadmin'}
                  </span>
                </button>
              </div>
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

      {/* Modal Konfirmasi Paket Retur Tiba di Cabang & Mulai QC */}
      {receivingPackageTarget && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Konfirmasi Paket Retur Tiba di Toko Cabang
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setReceivingPackageTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {/* Ringkasan Simpel: Barang Dipesan, Nama Pemesan, dan Deskripsi Komplain */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                <p className="font-bold text-slate-900 dark:text-white">
                  {receivingPackageTarget.order.items?.[0]?.product?.name ||
                    receivingPackageTarget.order.items?.[0]?.rentalItem?.name ||
                    receivingPackageTarget.order.items?.[0]?.service?.name ||
                    'Unit Gadget'}
                  {receivingPackageTarget.order.items?.[0]?.variantName
                    ? ` (${receivingPackageTarget.order.items[0].variantName})`
                    : ''}
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Pemesan:{' '}
                  <strong>
                    {receivingPackageTarget.user.name || 'Pembeli'}
                  </strong>
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Kendala: &ldquo;
                  {receivingPackageTarget.description ||
                    receivingPackageTarget.reasonLabel ||
                    receivingPackageTarget.reason}
                  &rdquo;
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Catatan Kondisi Fisik Paket Saat Tiba (QC Awal)
                </label>
                <textarea
                  value={packageReceivedNotes}
                  onChange={(e) => setPackageReceivedNotes(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Paket diterima staf toko, kardus utuh, segel toko masih menempel. Memulai pengujian touchscreen dan baterai."
                  className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white p-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReceivingPackageTarget(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isReceivingPackage}
                  onClick={handleConfirmPackageReceived}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isReceivingPackage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Konfirmasi Tiba &amp; Mulai QC</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Biteship Tracking Modal */}
      <CheckResiModal
        isOpen={resiModalOpen}
        onClose={() => setResiModalOpen(false)}
        initialQuery={activeTrackingQuery}
      />

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
