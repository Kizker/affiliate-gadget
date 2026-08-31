'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Package,
  Star,
  Copy,
  Check,
  Truck,
  ShieldCheck,
  Receipt,
  MessageCircle,
  Building2,
  Gift,
  Zap,
  Ban,
  CreditCard,
  ShoppingBag,
  RotateCcw,
  RefreshCw,
  Play,
  ArrowRight,
} from 'lucide-react'
import { RatingModal } from '@/components/modals/rating-modal'
import { ComplaintModal } from '@/components/customer/complaint-modal'
import { ReturnModal } from '@/components/customer/return-modal'
import { toast } from 'sonner'

const DEFAULT_GADGET_IMAGE = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'

interface OrderDetailProps {
  order: {
    id: string
    orderNumber: string
    status: string
    total: number
    subtotal?: number
    shippingCost?: number
    insuranceFee?: number
    courierCode?: string | null
    courierService?: string | null
    trackingNumber?: string | null
    bonusChargerIncluded?: boolean
    bonusProtectorIncluded?: boolean
    bonusCaseIncluded?: boolean
    warrantyExpiryDate?: string | null
    customerConfirmedAt?: string | null
    completedAt?: string | null
    createdAt: string
    updatedAt: string
    notes?: string | null
    paymentStatus?: string
    store?: {
      id: string
      name: string
      ptName?: string
      city: string
      address?: string
      phone?: string | null
    } | null
    items: Array<{
      id: string
      type: string
      quantity: number
      price: number
      subtotal: number
      notes?: string
      service?: { id: string; name: string; category: string }
      product?: {
        id: string
        name: string
        brand?: string | null
        slug: string
        images?: string[]
      }
      rentalItem?: {
        id: string
        name: string
        slug: string
        images?: string[]
      }
    }>
    complaints?: Array<{
      id: string
      status: string
      subject: string
      description: string
      images: string[]
      resolution: string | null
      rejectionNote: string | null
      createdAt: string
      resolvedAt: string | null
      assignedTo: { name: string; email: string } | null
    }>
    returnRequests?: Array<{
      id: string
      type: string
      reason: string
      reasonLabel?: string | null
      description: string
      images: string[]
      videoUrl?: string | null
      bankName?: string | null
      bankAccountNumber?: string | null
      bankAccountName?: string | null
      refundAmount?: number | null
      status: string
      storeResponse?: string | null
      returnCourier?: string | null
      returnTrackingNumber?: string | null
      createdAt: string
      resolvedAt?: string | null
    }>
    review?: { rating: number; comment: string | null } | null
  }
}

const statusConfig: Record<
  string,
  {
    label: string
    badgeBg: string
    dotColor: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    badgeBg: 'bg-amber-50/90 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300',
    dotColor: 'bg-amber-500',
    icon: Clock,
  },
  PAID: {
    label: 'Pembayaran Diterima',
    badgeBg: 'bg-blue-50/90 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300',
    dotColor: 'bg-blue-500',
    icon: CheckCircle,
  },
  PROCESSING: {
    label: 'Diproses Toko',
    badgeBg: 'bg-indigo-50/90 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
    icon: Package,
  },
  IN_PROGRESS: {
    label: 'Sedang Dikirim',
    badgeBg: 'bg-orange-50/90 text-orange-700 border-orange-200/80 dark:bg-orange-950/40 dark:border-orange-900/60 dark:text-orange-300',
    dotColor: 'bg-orange-500',
    icon: Truck,
  },
  COMPLETED: {
    label: 'Pesanan Selesai',
    badgeBg: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    badgeBg: 'bg-rose-50/90 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300',
    dotColor: 'bg-rose-500',
    icon: XCircle,
  },
}

export default function OrderDetailClient({ order }: OrderDetailProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [complaintModalOpen, setComplaintModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('Ingin mengubah alamat pengiriman / varian')
  const [isCancelling, setIsCancelling] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  // Rating Modal state
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean
    orderId: string
    orderNumber: string
    existingRating?: number
    existingComment?: string | null
  }>({
    isOpen: false,
    orderId: '',
    orderNumber: '',
  })

  const formatPrice = (price: number | undefined) => {
    if (typeof price !== 'number' || isNaN(price)) return 'Rp 0'
    return `Rp ${price.toLocaleString('id-ID')}`
  }

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber)
    setCopied(true)
    toast.success(`Nomor pesanan #${order.orderNumber} berhasil disalin`)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenRating = () => {
    setRatingModal({
      isOpen: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      existingRating: order.review?.rating,
      existingComment: order.review?.comment,
    })
  }

  // 2.5.2.1. Konfirmasi Pesanan Diterima
  const handleConfirmReceived = async () => {
    if (!confirm('Pastikan Anda telah menerima paket gadget dan memeriksa kondisi fisik unit. Lanjutkan konfirmasi penerimaan?')) {
      return
    }

    setIsConfirming(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/confirm`, {
        method: 'POST',
      })
      const result = await res.json()

      if (res.ok && result.success) {
        toast.success('Pesanan berhasil dikonfirmasi diterima! Garansi 30 hari ganti baru aktif.')
        router.refresh()
      } else {
        toast.error(result.error || 'Gagal mengonfirmasi penerimaan pesanan')
      }
    } catch (error) {
      console.error('Error confirming order:', error)
      toast.error('Terjadi kesalahan sistem saat konfirmasi pesanan')
    } finally {
      setIsConfirming(false)
    }
  }

  // 2.5.2.3. Batalkan Pesanan (hanya jika PENDING_PAYMENT atau belum dikirim)
  const handleCancelOrder = async () => {
    setIsCancelling(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      })
      const result = await res.json()

      if (res.ok && result.success) {
        toast.success('Pesanan berhasil dibatalkan.')
        setCancelModalOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Gagal membatalkan pesanan')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Terjadi kesalahan saat membatalkan pesanan')
    } finally {
      setIsCancelling(false)
    }
  }

  const currentStatus = statusConfig[order.status] || statusConfig.PROCESSING
  const StatusIcon = currentStatus.icon

  const canCancel = order.status === 'PENDING_PAYMENT' || order.status === 'PAID'
  const canConfirmReceived = order.status === 'IN_PROGRESS'
  const isCompleted = order.status === 'COMPLETED'
  const latestComplaint = order.complaints && order.complaints.length > 0 ? order.complaints[0] : null
  const latestReturnRequest = order.returnRequests && order.returnRequests.length > 0 ? order.returnRequests[0] : null

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60 dark:bg-slate-950 font-sans">
      <Navbar variant="light" />

      <main className="flex-1 pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Top Breadcrumb & Store Origin Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard/customer/orders"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Pesanan Saya
            </Link>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Toko:</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                {order.store?.name || 'PT Gadget Jaya Sentosa'}
              </span>
            </div>
          </div>

          {/* Hero Order Header Bento Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              {/* Order Identity & Date */}
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
                  <h1 className="font-mono text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                    #{order.orderNumber}
                  </h1>
                  <button
                    onClick={copyOrderNumber}
                    className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                    title="Salin Nomor Pesanan"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })} WIB
                  </span>
                  <span>•</span>
                  <span>{order.store?.ptName || 'PT Resmi Terverifikasi'}</span>
                </div>
              </div>

              {/* Status Badge & Tracking Code */}
              <div className="flex flex-col sm:items-end gap-1.5">
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold border ${currentStatus.badgeBg}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dotColor}`} />
                  <span>{currentStatus.label}</span>
                </div>
                {order.trackingNumber && (
                  <p className="text-[11px] font-mono text-slate-500">
                    Resi: <span className="font-bold text-slate-900 dark:text-white">{order.trackingNumber}</span> ({order.courierCode || 'JNE'} {order.courierService || 'REG'})
                  </p>
                )}
              </div>

            </div>

            {/* Harmonious Action Hub (Contextual & Clean Hierarchy) */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              
              {/* Left Actions: Contact Store Channels */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/customer/chat?orderId=${order.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition active:scale-95"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Chat Toko</span>
                </Link>
              </div>

              {/* Right Actions: Workflow CTA Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                
                {/* Batalkan Pesanan */}
                {canCancel && (
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 px-2 py-1 transition cursor-pointer"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span>Batalkan Pesanan</span>
                  </button>
                )}

                {/* Bayar Sekarang */}
                {order.status === 'PENDING_PAYMENT' && (
                  <Link
                    href={`/checkout/payment?orderId=${order.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 text-xs font-bold shadow-xs transition active:scale-95"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Bayar Sekarang</span>
                  </Link>
                )}

                {/* Konfirmasi Pesanan Diterima */}
                {canConfirmReceived && (
                  <button
                    onClick={handleConfirmReceived}
                    disabled={isConfirming}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{isConfirming ? 'Mengonfirmasi...' : 'Konfirmasi Pesanan Diterima'}</span>
                  </button>
                )}

                {/* Ajukan Pengembalian */}
                {isCompleted && (!order.returnRequests || order.returnRequests.length === 0 || latestReturnRequest?.status === 'REJECTED') && (
                  <button
                    onClick={() => setReturnModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-5 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Ajukan Pengembalian</span>
                  </button>
                )}

                {/* Klaim Garansi 30 Hari */}
                {isCompleted && (
                  <button
                    onClick={() => setComplaintModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 hover:bg-slate-800 dark:bg-white dark:text-slate-950 text-white px-5 py-2 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
                    <span>Klaim Garansi 30 Hari</span>
                  </button>
                )}

                {/* Rating & Review Button */}
                {isCompleted && (
                  <button
                    onClick={handleOpenRating}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition cursor-pointer"
                  >
                    <Star className={`h-3.5 w-3.5 ${order.review ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                    <span>{order.review ? 'Lihat Ulasan' : 'Beri Ulasan'}</span>
                  </button>
                )}

              </div>

            </div>
          </div>

          {/* Return & Refund Live Card (Senior UI/UX Bento) */}
          {latestReturnRequest && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs mb-6 dark:border-slate-800 dark:bg-slate-900">
              {/* Header Row: Title & Semantic Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    latestReturnRequest.status === 'APPROVED' || latestReturnRequest.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : latestReturnRequest.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                      : 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400'
                  }`}>
                    {latestReturnRequest.type === 'REFUND' ? (
                      <CreditCard className="h-5 w-5" />
                    ) : (
                      <RotateCcw className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white">
                      Pengajuan {latestReturnRequest.type === 'REFUND' ? 'Pengembalian Dana (Refund 100%)' : 'Penggantian Unit (Replacement)'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Diajukan pada {new Date(latestReturnRequest.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Status Pill Badge */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold border ${
                    latestReturnRequest.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300'
                      : latestReturnRequest.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300'
                      : latestReturnRequest.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300'
                      : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      latestReturnRequest.status === 'APPROVED' || latestReturnRequest.status === 'COMPLETED'
                        ? 'bg-emerald-500'
                        : latestReturnRequest.status === 'REJECTED'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`} />
                    {latestReturnRequest.status === 'APPROVED'
                      ? 'Pengajuan Disetujui'
                      : latestReturnRequest.status === 'COMPLETED'
                      ? 'Pengembalian Selesai'
                      : latestReturnRequest.status === 'REJECTED'
                      ? 'Pengajuan Ditolak'
                      : 'Menunggu Verifikasi Toko'}
                  </span>
                </div>
              </div>

              {/* Bento Content Flow: Kendala vs Detail Rekening & Tanggapan Toko */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                
                {/* Kolom Kiri: Rincian Kendala & Bukti Unboxing */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Kendala & Alasan Pengembalian
                    </span>
                    <div className="rounded-2xl bg-slate-50/90 border border-slate-100 p-4 dark:bg-slate-800/40 dark:border-slate-800">
                      <div className="inline-block rounded-md bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        {latestReturnRequest.reasonLabel || latestReturnRequest.reason}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {latestReturnRequest.description}
                      </p>
                    </div>
                  </div>

                  {/* Lampiran Foto/Video Bukti */}
                  {latestReturnRequest.images && latestReturnRequest.images.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Bukti Foto / Video Unboxing ({latestReturnRequest.images.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {latestReturnRequest.images.map((img, i) => {
                          const isVideo = /\.(mp4|webm|mov)$/i.test(img)
                          return (
                            <a
                              key={i}
                              href={img}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center group"
                            >
                              {isVideo ? (
                                <Play className="h-5 w-5 text-orange-500 group-hover:scale-110 transition" />
                              ) : (
                                <img src={img} alt="Bukti" className="h-full w-full object-cover group-hover:scale-105 transition" />
                              )}
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Kolom Kanan: Solusi, Info Rekening Refund, & Tanggapan Toko */}
                <div className="space-y-3">
                  {latestReturnRequest.type === 'REFUND' && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Rekening Pengembalian Dana
                      </span>
                      <div className="rounded-2xl bg-orange-50/40 border border-orange-100 p-4 dark:bg-orange-950/20 dark:border-orange-900/40 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Bank:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{latestReturnRequest.bankName}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Nomor Rekening:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{latestReturnRequest.bankAccountNumber}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Atas Nama:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{latestReturnRequest.bankAccountName}</span>
                        </div>
                        {latestReturnRequest.refundAmount && (
                          <div className="pt-2 flex items-center justify-between text-xs border-t border-orange-200/60 dark:border-orange-900/60">
                            <span className="font-bold text-orange-950 dark:text-orange-300">Total Nilai Refund:</span>
                            <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">
                              {formatPrice(latestReturnRequest.refundAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tanggapan Toko */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Tanggapan & Tindakan Toko
                    </span>
                    {latestReturnRequest.storeResponse ? (
                      <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100/90 p-4 dark:bg-emerald-950/20 dark:border-emerald-900/40">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Instruksi Toko</span>
                        </div>
                        <p className="text-xs text-emerald-950/80 dark:text-emerald-200/90 leading-relaxed">
                          {latestReturnRequest.storeResponse}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-amber-50/40 border border-amber-100/80 p-4 dark:bg-amber-950/20 dark:border-amber-900/30">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                          <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>Dalam Antrean Verifikasi</span>
                        </div>
                        <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                          Tim toko cabang sedang memeriksa kelengkapan pengajuan pengembalian Anda. Anda akan menerima instruksi pengiriman balik atau proses transfer refund segera.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* Warranty Claim Live Card (Senior UI/UX Bento) */}
          {latestComplaint && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs mb-6 dark:border-slate-800 dark:bg-slate-900">
              {/* Header Row: Title & Semantic Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    latestComplaint.status === 'RESOLVED'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : latestComplaint.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                  }`}>
                    {latestComplaint.status === 'RESOLVED' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : latestComplaint.status === 'REJECTED' ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white">
                      Status Klaim Garansi 30 Hari
                    </h3>
                    <p className="text-xs text-slate-400">
                      Diajukan pada {new Date(latestComplaint.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Status Pill Badge */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${
                    latestComplaint.status === 'RESOLVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300'
                      : latestComplaint.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      latestComplaint.status === 'RESOLVED'
                        ? 'bg-emerald-500'
                        : latestComplaint.status === 'REJECTED'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`} />
                    {latestComplaint.status === 'RESOLVED'
                      ? 'Klaim Disetujui & Tukar Unit Pengganti'
                      : latestComplaint.status === 'REJECTED'
                      ? 'Klaim Ditolak'
                      : 'Sedang Diverifikasi Teknisi'}
                  </span>
                </div>
              </div>

              {/* Bento Content Flow: Kendala vs Solusi */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                
                {/* Kolom Kiri: Rincian Pengajuan Kendala */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Kendala yang Dilaporkan
                  </span>
                  <div className="rounded-2xl bg-slate-50/90 border border-slate-100 p-4 dark:bg-slate-800/40 dark:border-slate-800">
                    <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white mb-1">
                      {latestComplaint.subject}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {latestComplaint.description}
                    </p>
                  </div>
                </div>

                {/* Kolom Kanan: Hasil Tindakan & Solusi Toko */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Hasil Resolusi & Tindakan Toko
                  </span>
                  {latestComplaint.resolution ? (
                    <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100/90 p-4 dark:bg-emerald-950/20 dark:border-emerald-900/40">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Unit Pengganti Teruji Disetujui</span>
                      </div>
                      <p className="text-xs text-emerald-950/80 dark:text-emerald-200/90 leading-relaxed">
                        {latestComplaint.resolution}
                      </p>
                    </div>
                  ) : latestComplaint.rejectionNote ? (
                    <div className="rounded-2xl bg-rose-50/50 border border-rose-100/90 p-4 dark:bg-rose-950/20 dark:border-rose-900/40">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300 mb-1">
                        <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <span>Catatan Penolakan Klaim</span>
                      </div>
                      <p className="text-xs text-rose-950/80 dark:text-rose-200/90 leading-relaxed">
                        {latestComplaint.rejectionNote}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-amber-50/40 border border-amber-100/80 p-4 dark:bg-amber-950/20 dark:border-amber-900/30">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                        <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Dalam Antrean Pemeriksaan</span>
                      </div>
                      <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                        Teknisi toko sedang memeriksa unit dan memverifikasi kondisi fungsional untuk penggantian unit.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* 2-Column Bento Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col (2 Cols): Products, Bonus Package & Logistics */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Product List Card */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs sm:p-7 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-orange-500" />
                    Rincian Unit Gadget
                  </h3>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    {order.items.reduce((acc, it) => acc + it.quantity, 0)} Unit
                  </span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item) => {
                    const itemImage =
                      item.product?.images?.[0] ||
                      item.rentalItem?.images?.[0] ||
                      DEFAULT_GADGET_IMAGE
                    const itemLink = item.product
                      ? `/gadget/${item.product.slug}`
                      : '#'

                    return (
                      <div key={item.id} className="py-4 sm:py-5 first:pt-0 last:pb-0 flex items-start gap-4">
                        <div className="relative h-20 w-20 sm:h-22 sm:w-22 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/60 p-2 flex items-center justify-center">
                          <img
                            src={itemImage}
                            alt={item.product?.name || 'Gadget'}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_GADGET_IMAGE
                            }}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
                            <div className="min-w-0">
                              {item.product?.brand && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                  {item.product.brand}
                                </span>
                              )}
                              <Link
                                href={itemLink}
                                className="block font-bold text-slate-900 hover:text-blue-600 dark:text-white transition line-clamp-1 text-sm sm:text-base"
                              >
                                {item.product?.name || item.service?.name || 'Unit Gadget Original'}
                              </Link>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {item.quantity} unit × {formatPrice(item.price)}
                              </p>
                            </div>
                            <span className="font-mono text-base sm:text-lg font-black text-slate-950 dark:text-white shrink-0 whitespace-nowrap">
                              {formatPrice(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 3-in-1 Bonus Package Bundle Strip */}
                {(order.bonusChargerIncluded || order.bonusProtectorIncluded || order.bonusCaseIncluded) && (
                  <div className="mt-6 rounded-2xl border border-emerald-100/90 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-emerald-600 shrink-0" />
                        <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-300">
                          Paket Bonus 3-in-1 Gratis (Rp 0)
                        </h4>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                        Termasuk
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Fast Charger Set</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Antigores Terpasang</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Premium Softcase</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unified Integrated Logistics Strip */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Toko: <strong className="text-slate-900 dark:text-white">{order.store?.name || 'Roxy Mas Jakarta'}</strong> ({order.store?.city || 'Jakarta'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-orange-500 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Kurir: <strong className="text-slate-900 dark:text-white">{order.courierCode || 'JNE'} {order.courierService || 'Layanan Cepat'}</strong> • <span className="text-emerald-600 font-semibold">100% Asuransi</span>
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Col (1 Col): Payment & Totals Bento */}
            <div className="space-y-6">
              
              {/* Payment Summary Box (Senior UI/UX Bento) */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs sm:p-7 dark:border-slate-800 dark:bg-slate-900">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    Ringkasan Pembayaran
                  </h3>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    order.paymentStatus === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${order.paymentStatus === 'PENDING' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    {order.paymentStatus === 'PENDING' ? 'Menunggu Bayar' : 'Lunas'}
                  </span>
                </div>

                {/* Line Item Breakdown */}
                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal Produk</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {formatPrice(order.subtotal || order.total)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Ongkos Kirim Kurir</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {order.shippingCost && order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Gratis'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      Asuransi Pengiriman
                      <ShieldCheck className="h-3 w-3 text-blue-500" />
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {order.insuranceFee && order.insuranceFee > 0 ? formatPrice(order.insuranceFee) : 'Rp 0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-emerald-600 font-semibold">
                    <span>Paket Bonus 3-in-1</span>
                    <span>Gratis (Rp 0)</span>
                  </div>

                  {/* Total Tagihan Bar */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                      Total Tagihan
                    </span>
                    <span className="font-mono text-xl font-black text-slate-950 dark:text-white whitespace-nowrap tracking-tight">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {/* Official Store Guarantee Strip */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mt-0.5">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Garansi 30 Hari Resmi Toko
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Klaim tukar unit pengganti langsung di toko jika terjadi kendala fungsional non-kelalaian.
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer variant="light" />

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50">
                  <Ban className="h-4 w-4" />
                </div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">
                  Batalkan Pesanan
                </h3>
              </div>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Apakah Anda yakin ingin membatalkan pesanan <span className="font-mono font-bold text-slate-950 dark:text-white">#{order.orderNumber}</span>? Pembatalan hanya dapat dilakukan sebelum barang diserahkan ke kurir pengiriman.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Alasan Pembatalan:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Ingin mengubah alamat pengiriman / varian">Ingin mengubah alamat pengiriman / varian</option>
                <option value="Ingin mengganti metode pembayaran">Ingin mengganti metode pembayaran</option>
                <option value="Menemukan harga lebih hemat di toko lain">Menemukan promo di toko lain</option>
                <option value="Lainnya / berubah pikiran">Lainnya / berubah pikiran</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
              >
                {isCancelling ? 'Membatalkan...' : 'Ya, Batalkan Pesanan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integrated 30-Day Warranty Claim Modal */}
      <ComplaintModal
        isOpen={complaintModalOpen}
        onClose={() => setComplaintModalOpen(false)}
        orderId={order.id}
        orderNumber={order.orderNumber}
        onSuccess={() => {
          toast.success('Pengajuan klaim garansi 30 hari berhasil dikirim ke teknisi toko!')
          router.refresh()
        }}
      />

      {/* Return & Refund Request Modal */}
      <ReturnModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        orderId={order.id}
        orderNumber={order.orderNumber}
        totalAmount={order.total}
        onSuccess={() => {
          toast.success('Pengajuan pengembalian berhasil dikirim ke pihak toko!')
          router.refresh()
        }}
      />

      {/* Rating & Review Modal */}
      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal((prev) => ({ ...prev, isOpen: false }))}
        orderId={ratingModal.orderId}
        orderNumber={ratingModal.orderNumber}
        existingRating={ratingModal.existingRating}
        existingComment={ratingModal.existingComment ?? undefined}
        onSuccess={() => {
          toast.success('Ulasan Anda berhasil disimpan!')
          router.refresh()
        }}
      />
    </div>
  )
}
