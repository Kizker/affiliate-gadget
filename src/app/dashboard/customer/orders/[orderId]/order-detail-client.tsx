'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Navbar,
  Footer,
  MobileTopNav,
  MobileBottomNav,
} from '@/components/layouts'
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
  Tag,
  Search,
  X,
  Printer,
} from 'lucide-react'
import { RatingModal } from '@/components/modals/rating-modal'
import { CustomPaymentModal } from '@/components/payment/custom-payment-modal'
import { ComplaintModal } from '@/components/customer/complaint-modal'
import { ReturnModal } from '@/components/customer/return-modal'
import { CustomSelect } from '@/components/ui/custom-select'
import { toast } from 'sonner'
import { LiveCourierTracker } from '@/components/shipping/live-courier-tracker'
import { ThermalShippingLabel } from '@/components/shipping/thermal-shipping-label'

const DEFAULT_GADGET_IMAGE =
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'

interface OrderDetailProps {
  order: {
    id: string
    orderNumber: string
    status: string
    total: number
    subtotal?: number
    voucherCode?: string | null
    discountAmount?: number
    shippingCost?: number
    insuranceRate?: number
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
      variantId?: string
      variantName?: string
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
    review?: {
      id?: string
      rating: number
      comment: string | null
      images?: string[]
      videos?: string[]
    } | null
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
    badgeBg:
      'bg-amber-50/90 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300',
    dotColor: 'bg-amber-500',
    icon: Clock,
  },
  PAID: {
    label: 'Pembayaran Diterima',
    badgeBg:
      'bg-blue-50/90 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300',
    dotColor: 'bg-blue-500',
    icon: CheckCircle,
  },
  PROCESSING: {
    label: 'Diproses Toko',
    badgeBg:
      'bg-indigo-50/90 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
    icon: Package,
  },
  IN_PROGRESS: {
    label: 'Sedang Dikirim',
    badgeBg:
      'bg-orange-50/90 text-orange-700 border-orange-200/80 dark:bg-orange-950/40 dark:border-orange-900/60 dark:text-orange-300',
    dotColor: 'bg-orange-500',
    icon: Truck,
  },
  COMPLETED: {
    label: 'Pesanan Selesai',
    badgeBg:
      'bg-emerald-50/90 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    badgeBg:
      'bg-rose-50/90 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300',
    dotColor: 'bg-rose-500',
    icon: XCircle,
  },
  RETURNED: {
    label: 'Dikembalikan (Retur)',
    badgeBg:
      'bg-purple-50/90 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:border-purple-900/60 dark:text-purple-300',
    dotColor: 'bg-purple-500',
    icon: RotateCcw,
  },
}

export default function OrderDetailClient({ order }: OrderDetailProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [complaintModalOpen, setComplaintModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState(
    'Ingin mengubah alamat pengiriman / varian'
  )
  const [isCancelling, setIsCancelling] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmReceivedModalOpen, setConfirmReceivedModalOpen] =
    useState(false)
  const [activeThermalLabel, setActiveThermalLabel] = useState<any | null>(null)
  const [viewingLabel, setViewingLabel] = useState(false)

  const handleViewThermalLabel = async () => {
    try {
      setViewingLabel(true)
      const res = await fetch(`/api/shipping/tracking/${order.id}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          setActiveThermalLabel(json.data)
          return
        }
      }
      toast.info('Menyiapkan label pengiriman...')
    } catch {
      toast.error('Gagal memuat label pengiriman')
    } finally {
      setViewingLabel(false)
    }
  }

  // Review state
  const [currentReview, setCurrentReview] = useState(order.review ?? null)

  useEffect(() => {
    if (order.review) {
      setCurrentReview(order.review)
    }
  }, [order.review])

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
      existingRating: currentReview?.rating,
      existingComment: currentReview?.comment,
    })
  }

  // 2.5.2.1. Konfirmasi Pesanan Diterima (Buka Notifikasi Konfirmasi Bagian Atas)
  const handleConfirmReceived = () => {
    setConfirmReceivedModalOpen(true)
  }

  const executeConfirmReceived = async () => {
    setIsConfirming(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/confirm`, {
        method: 'POST',
      })
      const result = await res.json()

      if (res.ok && result.success) {
        setConfirmReceivedModalOpen(false)
        toast.success('Pesanan selesai & garansi 30 hari resmi aktif!')
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

  const latestComplaint =
    order.complaints && order.complaints.length > 0 ? order.complaints[0] : null
  const latestReturnRequest =
    order.returnRequests && order.returnRequests.length > 0
      ? order.returnRequests[0]
      : null

  const [returnCourier, setReturnCourier] = useState(
    latestReturnRequest?.returnCourier || 'JNE'
  )
  const [returnTrackingNumber, setReturnTrackingNumber] = useState(
    latestReturnRequest?.returnTrackingNumber || ''
  )
  const [isSavingReturnTracking, setIsSavingReturnTracking] = useState(false)

  const handleSaveReturnTracking = async () => {
    if (!latestReturnRequest?.id || !returnTrackingNumber.trim()) {
      toast.error('Masukkan nomor resi pengiriman balik')
      return
    }
    setIsSavingReturnTracking(true)
    try {
      const res = await fetch(`/api/returns/${latestReturnRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnCourier,
          returnTrackingNumber: returnTrackingNumber.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Nomor resi pengembalian berhasil disimpan')
        router.refresh()
      } else {
        toast.error(data.error || 'Gagal menyimpan nomor resi')
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan nomor resi')
    } finally {
      setIsSavingReturnTracking(false)
    }
  }

  const getDetailStatus = () => {
    if (order.status === 'RETURNED') {
      return statusConfig.RETURNED
    }
    if (latestReturnRequest) {
      if (latestReturnRequest.status === 'PENDING') {
        return {
          label: 'Retur Diajukan',
          badgeBg:
            'bg-amber-50/90 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300',
          dotColor: 'bg-amber-500',
          icon: Clock,
        }
      }
      if (latestReturnRequest.status === 'IN_REVIEW') {
        return {
          label: 'Retur Ditinjau',
          badgeBg:
            'bg-indigo-50/90 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300',
          dotColor: 'bg-indigo-500',
          icon: Search,
        }
      }
      if (latestReturnRequest.status === 'APPROVED') {
        return {
          label: 'Retur Disetujui',
          badgeBg:
            'bg-emerald-50/90 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300',
          dotColor: 'bg-emerald-500',
          icon: CheckCircle2,
        }
      }
      if (latestReturnRequest.status === 'REJECTED') {
        return {
          label: 'Retur Ditolak',
          badgeBg:
            'bg-rose-50/90 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300',
          dotColor: 'bg-rose-500',
          icon: XCircle,
        }
      }
      return statusConfig.RETURNED
    }
    return statusConfig[order.status] || statusConfig.PROCESSING
  }

  const currentStatus = getDetailStatus()
  const StatusIcon = currentStatus.icon

  const canCancel =
    order.status === 'PENDING_PAYMENT' || order.status === 'PAID'
  const canConfirmReceived =
    (order.status === 'IN_PROGRESS' || order.status === 'SHIPPED') &&
    !order.customerConfirmedAt
  const isCompleted =
    order.status === 'COMPLETED' || !!order.customerConfirmedAt
  const canRequestReturnOrComplaint =
    order.status === 'SHIPPED' || order.status === 'COMPLETED'

  // Construct chat parameters for all chat entry points
  const firstItem = order.items?.[0]
  const firstProduct = firstItem?.product
  const chatParams = new URLSearchParams()
  chatParams.set('orderId', order.id)
  if (order.store?.id) chatParams.set('storeId', order.store.id)
  if (order.orderNumber) chatParams.set('orderNumber', order.orderNumber)
  if (latestReturnRequest) {
    chatParams.set('returnId', latestReturnRequest.id)
    chatParams.set(
      'returnReason',
      latestReturnRequest.reasonLabel || latestReturnRequest.reason || ''
    )
    chatParams.set('returnStatus', latestReturnRequest.status)
    if (latestReturnRequest.type)
      chatParams.set('returnType', latestReturnRequest.type)
  }
  if (firstProduct?.name) chatParams.set('productName', firstProduct.name)
  if (firstProduct?.images?.[0])
    chatParams.set('productImage', firstProduct.images[0])
  if (firstItem?.price) chatParams.set('productPrice', String(firstItem.price))

  const handleNavigateBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      window.history.back()

      setTimeout(() => {
        if (
          typeof window !== 'undefined' &&
          window.location.pathname === currentPath
        ) {
          router.push('/dashboard/customer/orders')
        }
      }, 250)
      return
    }
    router.push('/dashboard/customer/orders')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Top Navigation: Mobile Top Nav & Desktop Navbar */}
      <div className="block md:hidden">
        <MobileTopNav
          showBack={true}
          onBack={handleNavigateBack}
          backHref="/dashboard/customer/orders"
          title={`Pesanan #${order.orderNumber}`}
        />
      </div>
      <div className="hidden md:block">
        <Navbar variant="light" />
      </div>

      <main className="flex min-h-screen flex-col pb-24 pt-4 sm:pt-6 md:pb-24 md:pt-28 lg:pt-32">
        <div className="mx-auto my-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          {/* Top Breadcrumb & Store Origin Bar (Desktop only, already covered by MobileTopNav on mobile) */}
          <div className="mb-6 hidden flex-wrap items-center justify-between gap-3 md:flex">
            <button
              type="button"
              onClick={handleNavigateBack}
              className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-950 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">
                Toko:
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                {order.store?.name || 'PT Gadget Jaya Sentosa'}
              </span>
            </div>
          </div>

          {/* Hero Order Header Bento Card */}
          <div className="shadow-2xs mb-6 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Order Identity & Date */}
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="break-all font-mono text-sm font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                    #{order.orderNumber}
                  </h1>
                  <button
                    onClick={copyOrderNumber}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
                    title="Salin Nomor Pesanan"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-400" />
                    )}
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
                    })}{' '}
                    WIB
                  </span>
                  <span>•</span>
                  <span>{order.store?.ptName || 'PT Resmi Terverifikasi'}</span>
                </div>
              </div>

              {/* Status Badge & Tracking Code */}
              <div className="flex flex-col gap-1.5 sm:items-end">
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold ${currentStatus.badgeBg}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${currentStatus.dotColor}`}
                  />
                  <span>{currentStatus.label}</span>
                </div>
                {order.trackingNumber && (
                  <p className="font-mono text-[11px] text-slate-500">
                    Resi:{' '}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {order.trackingNumber}
                    </span>{' '}
                    ({order.courierCode || 'JNE'}{' '}
                    {order.courierService || 'REG'})
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Return & Refund Live Card (Modern, Simple & Aesthetic Bento) */}
          {latestReturnRequest && (
            <div className="shadow-2xs mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
              {/* Header: Title, Date & Single Clean Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-800/30 sm:p-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      latestReturnRequest.status === 'APPROVED' ||
                      latestReturnRequest.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : latestReturnRequest.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                          : latestReturnRequest.status === 'IN_REVIEW'
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                            : 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400'
                    }`}
                  >
                    {latestReturnRequest.type === 'REFUND' ? (
                      <CreditCard className="h-5 w-5" />
                    ) : (
                      <RotateCcw className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white sm:text-base">
                      {latestReturnRequest.type === 'REFUND'
                        ? 'Pengembalian Dana (Refund 100%)'
                        : 'Penggantian Unit Baru'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Diajukan pada{' '}
                      {new Date(
                        latestReturnRequest.createdAt
                      ).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Status Pill Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                    latestReturnRequest.status === 'APPROVED'
                      ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : latestReturnRequest.status === 'COMPLETED'
                        ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : latestReturnRequest.status === 'REJECTED'
                          ? 'border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                          : latestReturnRequest.status === 'IN_REVIEW'
                            ? 'border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300'
                            : 'border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      latestReturnRequest.status === 'APPROVED' ||
                      latestReturnRequest.status === 'COMPLETED'
                        ? 'bg-emerald-500'
                        : latestReturnRequest.status === 'REJECTED'
                          ? 'bg-rose-500'
                          : latestReturnRequest.status === 'IN_REVIEW'
                            ? 'bg-indigo-500'
                            : 'bg-amber-500'
                    }`}
                  />
                  {latestReturnRequest.status === 'APPROVED'
                    ? 'Pengajuan Disetujui'
                    : latestReturnRequest.status === 'COMPLETED'
                      ? 'Pengembalian Selesai'
                      : latestReturnRequest.status === 'REJECTED'
                        ? 'Pengajuan Ditolak'
                        : latestReturnRequest.status === 'IN_REVIEW'
                          ? 'Sedang Ditinjau'
                          : 'Menunggu Verifikasi Toko'}
                </span>
              </div>

              {/* Body Content: Stepper & Flat Information Rows */}
              <div className="space-y-4 p-4 sm:p-6">
                {/* 3-Step Visual Progress Stepper */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-8 right-8 top-3 h-0.5 bg-slate-200 dark:bg-slate-700" />
                    <div
                      className="absolute left-8 top-3 h-0.5 bg-orange-500 transition-all duration-500"
                      style={{
                        width:
                          latestReturnRequest.status === 'COMPLETED'
                            ? 'calc(100% - 4rem)'
                            : latestReturnRequest.status === 'APPROVED'
                              ? '50%'
                              : '0%',
                      }}
                    />

                    {/* Step 1: Diajukan */}
                    <div className="relative z-10 flex flex-col items-center gap-1">
                      <div className="shadow-xs flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                        Diajukan
                      </span>
                    </div>

                    {/* Step 2: Verifikasi Toko */}
                    <div className="relative z-10 flex flex-col items-center gap-1">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                          latestReturnRequest.status === 'APPROVED' ||
                          latestReturnRequest.status === 'COMPLETED'
                            ? 'shadow-xs bg-orange-500 text-white'
                            : latestReturnRequest.status === 'REJECTED'
                              ? 'shadow-xs bg-rose-500 text-white'
                              : 'animate-pulse border-2 border-orange-500 bg-white text-orange-600 dark:bg-slate-900'
                        }`}
                      >
                        {latestReturnRequest.status === 'APPROVED' ||
                        latestReturnRequest.status === 'COMPLETED' ? (
                          <Check className="h-3 w-3 stroke-[3]" />
                        ) : latestReturnRequest.status === 'REJECTED' ? (
                          <X className="h-3 w-3 stroke-[3]" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                        {latestReturnRequest.status === 'REJECTED'
                          ? 'Ditolak'
                          : 'Verifikasi'}
                      </span>
                    </div>

                    {/* Step 3: Selesai */}
                    <div className="relative z-10 flex flex-col items-center gap-1">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                          latestReturnRequest.status === 'COMPLETED'
                            ? 'shadow-xs bg-emerald-500 text-white'
                            : 'border-2 border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900'
                        }`}
                      >
                        {latestReturnRequest.status === 'COMPLETED' ? (
                          <Check className="h-3 w-3 stroke-[3]" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {latestReturnRequest.type === 'REFUND'
                          ? 'Refund Cair'
                          : 'Unit Dikirim'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flat Information Breakdown (Clean & Simple) */}
                <div className="space-y-2.5 text-xs">
                  {/* Kendala */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                    <span className="shrink-0 text-slate-400">Kendala:</span>
                    <div className="text-right">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {latestReturnRequest.reasonLabel ||
                          latestReturnRequest.reason}
                      </span>
                      {latestReturnRequest.description && (
                        <p className="ml-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                          &ldquo;{latestReturnRequest.description}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rekening Refund (if REFUND) */}
                  {latestReturnRequest.type === 'REFUND' && (
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                      <span className="shrink-0 text-slate-400">
                        Rekening Refund:
                      </span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {latestReturnRequest.bankName} •{' '}
                          {latestReturnRequest.bankAccountNumber}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          a.n. {latestReturnRequest.bankAccountName}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Total Nilai Refund */}
                  {latestReturnRequest.refundAmount && (
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                      <span className="shrink-0 font-semibold text-slate-600 dark:text-slate-300">
                        Total Refund:
                      </span>
                      <span className="font-mono text-sm font-black text-orange-600 dark:text-orange-400">
                        {formatPrice(latestReturnRequest.refundAmount)}
                      </span>
                    </div>
                  )}

                  {/* Bukti Unboxing (Thumbnails) */}
                  {latestReturnRequest.images &&
                    latestReturnRequest.images.length > 0 && (
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                        <span className="shrink-0 text-slate-400">
                          Bukti ({latestReturnRequest.images.length}):
                        </span>
                        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                          {latestReturnRequest.images.map((img, i) => {
                            const isVideo = /\.(mp4|webm|mov)$/i.test(img)
                            return (
                              <a
                                key={i}
                                href={img}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition hover:border-orange-500 dark:border-slate-700 dark:bg-slate-800"
                              >
                                {isVideo ? (
                                  <Play className="h-4 w-4 text-orange-500" />
                                ) : (
                                  <img
                                    src={img}
                                    alt="Bukti"
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    )}
                </div>

                {/* Contextual Status Info Banner */}
                {latestReturnRequest.status === 'PENDING' && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-amber-200/60 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                    <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                    <p className="leading-snug">
                      Pengajuan sedang dalam antrean verifikasi toko cabang
                      (estimasi 1x24 jam kerja).
                    </p>
                  </div>
                )}

                {latestReturnRequest.status === 'IN_REVIEW' && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-indigo-200/60 bg-indigo-50/70 p-3 text-xs text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300">
                    <Search className="h-4 w-4 shrink-0 text-indigo-600" />
                    <p className="leading-snug">
                      Tim toko cabang sedang memeriksa foto/video unboxing dan
                      detail kendala Anda.
                    </p>
                  </div>
                )}

                {latestReturnRequest.status === 'APPROVED' && (
                  <div className="space-y-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                    <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Pengajuan Disetujui — Silakan Kirim Unit</span>
                    </div>
                    {latestReturnRequest.storeResponse && (
                      <p className="text-[11px] leading-relaxed text-emerald-950/80 dark:text-emerald-200/90">
                        {latestReturnRequest.storeResponse}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/60 pt-2 dark:border-emerald-900/60">
                      <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                        Resi Pengiriman Balik:
                      </span>
                      {latestReturnRequest.returnTrackingNumber ? (
                        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                          {latestReturnRequest.returnCourier || 'JNE'} —{' '}
                          {latestReturnRequest.returnTrackingNumber}
                        </span>
                      ) : (
                        <div className="flex w-full items-center gap-1.5 sm:w-auto">
                          <input
                            type="text"
                            placeholder="Nomor resi balik..."
                            value={returnTrackingNumber}
                            onChange={(e) =>
                              setReturnTrackingNumber(e.target.value)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                          <button
                            onClick={handleSaveReturnTracking}
                            disabled={isSavingReturnTracking}
                            className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
                          >
                            {isSavingReturnTracking ? '...' : 'Simpan'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {latestReturnRequest.status === 'REJECTED' && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-200/60 bg-rose-50/70 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div>
                      <span className="font-bold">Pengajuan Ditolak:</span>
                      <p className="mt-0.5 leading-snug">
                        {latestReturnRequest.storeResponse ||
                          'Pengajuan pengembalian belum memenuhi syarat verifikasi toko.'}
                      </p>
                    </div>
                  </div>
                )}

                {latestReturnRequest.status === 'COMPLETED' && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50/70 p-3 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="font-medium leading-snug">
                      Pengembalian selesai. Dana telah dikirimkan ke rekening
                      tujuan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warranty Claim Live Card (Senior UI/UX Bento) */}
          {latestComplaint && (
            <div className="shadow-2xs mb-6 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              {/* Header Row: Title & Semantic Status */}
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      latestComplaint.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : latestComplaint.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                    }`}
                  >
                    {latestComplaint.status === 'RESOLVED' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : latestComplaint.status === 'REJECTED' ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white sm:text-base">
                      Status Klaim Garansi 30 Hari
                    </h3>
                    <p className="text-xs text-slate-400">
                      Diajukan pada{' '}
                      {new Date(latestComplaint.createdAt).toLocaleDateString(
                        'id-ID',
                        { day: 'numeric', month: 'long', year: 'numeric' }
                      )}
                    </p>
                  </div>
                </div>

                {/* Status Pill Badge */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${
                      latestComplaint.status === 'RESOLVED'
                        ? 'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : latestComplaint.status === 'REJECTED'
                          ? 'border border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        latestComplaint.status === 'RESOLVED'
                          ? 'bg-emerald-500'
                          : latestComplaint.status === 'REJECTED'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                      }`}
                    />
                    {latestComplaint.status === 'RESOLVED'
                      ? 'Klaim Disetujui & Tukar Unit Pengganti'
                      : latestComplaint.status === 'REJECTED'
                        ? 'Klaim Ditolak'
                        : 'Sedang Diverifikasi Teknisi'}
                  </span>
                </div>
              </div>

              {/* Bento Content Flow: Kendala vs Solusi */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                {/* Kolom Kiri: Rincian Pengajuan Kendala */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Kendala yang Dilaporkan
                  </span>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <h4 className="mb-1 text-xs font-bold text-slate-900 dark:text-white sm:text-[13px]">
                      {latestComplaint.subject}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
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
                    <div className="rounded-2xl border border-emerald-100/90 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>Unit Pengganti Teruji Disetujui</span>
                      </div>
                      <p className="text-xs leading-relaxed text-emerald-950/80 dark:text-emerald-200/90">
                        {latestComplaint.resolution}
                      </p>
                    </div>
                  ) : latestComplaint.rejectionNote ? (
                    <div className="rounded-2xl border border-rose-100/90 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <span>Catatan Penolakan Klaim</span>
                      </div>
                      <p className="text-xs leading-relaxed text-rose-950/80 dark:text-rose-200/90">
                        {latestComplaint.rejectionNote}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-100/80 bg-amber-50/40 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>Dalam Antrean Pemeriksaan</span>
                      </div>
                      <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                        Teknisi toko sedang memeriksa unit dan memverifikasi
                        kondisi fungsional untuk penggantian unit.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2-Column Bento Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Col (2 Cols): Products, Bonus Package & Logistics */}
            <div className="space-y-6 lg:col-span-2">
              {/* Product List Card */}
              <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <ShoppingBag className="h-4 w-4 text-orange-500" />
                    Rincian Unit Gadget
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
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
                      <div
                        key={item.id}
                        className="flex items-start gap-4 py-4 first:pt-0 last:pb-0 sm:py-5"
                      >
                        <div className="sm:h-22 sm:w-22 relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-800/60">
                          <img
                            src={itemImage}
                            alt={item.product?.name || 'Gadget'}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_GADGET_IMAGE
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start sm:gap-4">
                            <div className="min-w-0">
                              {item.product?.brand && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                  {item.product.brand}
                                </span>
                              )}
                              <Link
                                href={itemLink}
                                className="line-clamp-1 block text-sm font-bold text-slate-900 transition hover:text-blue-600 dark:text-white sm:text-base"
                              >
                                {item.product?.name ||
                                  item.service?.name ||
                                  item.notes ||
                                  'Unit Gadget Original'}
                              </Link>
                              {item.variantName && (
                                <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  Varian: {item.variantName}
                                </span>
                              )}
                              {item.notes && !item.variantName && (
                                <p className="mt-0.5 text-xs italic text-slate-500">
                                  Catatan: {item.notes}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-slate-500">
                                {item.quantity} unit × {formatPrice(item.price)}
                              </p>
                            </div>
                            <span className="shrink-0 whitespace-nowrap font-mono text-base font-black text-slate-950 dark:text-white sm:text-lg">
                              {formatPrice(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 3-in-1 Bonus Package Bundle Strip */}
                {(order.bonusChargerIncluded ||
                  order.bonusProtectorIncluded ||
                  order.bonusCaseIncluded) && (
                  <div className="mt-6 rounded-2xl border border-emerald-100/90 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="mb-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 shrink-0 text-emerald-600" />
                        <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-300">
                          Paket Bonus 3-in-1 Gratis (Rp 0)
                        </h4>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                        Termasuk
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs text-emerald-800 dark:text-emerald-300 sm:grid-cols-3">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>Fast Charger Set</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>Antigores Terpasang</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>Premium Softcase</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unified Integrated Logistics Strip */}
                <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-5 text-xs dark:border-slate-800 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Toko:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {order.store?.name || 'Roxy Mas Jakarta'}
                      </strong>{' '}
                      ({order.store?.city || 'Jakarta'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 shrink-0 text-orange-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Kurir:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {order.courierCode || 'JNE'}{' '}
                        {order.courierService || 'Layanan Cepat'}
                      </strong>{' '}
                      •{' '}
                      <span className="font-semibold text-emerald-600">
                        100% Asuransi
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-Time Live Courier Tracking Card */}
              <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-orange-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Pelacakan Pengiriman & Kurir
                    </h3>
                  </div>
                  <button
                    onClick={handleViewThermalLabel}
                    disabled={viewingLabel}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    <span>
                      {viewingLabel ? 'Memuat...' : 'Lihat Label Resi'}
                    </span>
                  </button>
                </div>

                <LiveCourierTracker orderId={order.id} />
              </div>
            </div>

            {/* Right Col (1 Col): Payment & Totals Bento */}
            <div className="space-y-6">
              {/* Payment Summary Box (Senior UI/UX Bento) */}
              <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    Ringkasan Pembayaran
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      order.paymentStatus === 'PENDING'
                        ? 'border border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${order.paymentStatus === 'PENDING' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    />
                    {order.paymentStatus === 'PENDING'
                      ? 'Menunggu Bayar'
                      : 'Lunas'}
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
                      {order.shippingCost && order.shippingCost > 0
                        ? formatPrice(order.shippingCost)
                        : 'Gratis'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      Asuransi Pengiriman ({order.insuranceRate ?? 0.2}%)
                      <ShieldCheck className="h-3 w-3 text-blue-500" />
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {order.insuranceFee && order.insuranceFee > 0
                        ? formatPrice(order.insuranceFee)
                        : 'Rp 0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-emerald-600">
                    <span>Paket Bonus 3-in-1</span>
                    <span>Gratis (Rp 0)</span>
                  </div>

                  {order.discountAmount && order.discountAmount > 0 && (
                    <div className="flex items-center justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Diskon Voucher{' '}
                        {order.voucherCode ? `(${order.voucherCode})` : ''}
                      </span>
                      <span className="font-mono">
                        - {formatPrice(order.discountAmount)}
                      </span>
                    </div>
                  )}

                  {/* Total Tagihan Bar */}
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <span className="whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                      Total Tagihan
                    </span>
                    <span className="whitespace-nowrap font-mono text-xl font-black tracking-tight text-slate-950 dark:text-white">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {/* Official Store Guarantee Strip */}
                <div className="mt-5 flex items-start gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Garansi 30 Hari Resmi Toko
                    </h5>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Klaim tukar unit pengganti langsung di toko jika terjadi
                      kendala fungsional non-kelalaian.
                    </p>
                  </div>
                </div>

                {/* Persistent Action Panel on Right Rail */}
                <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Aksi Pesanan
                  </span>

                  {/* Bayar Sekarang (if pending payment) */}
                  {order.status === 'PENDING_PAYMENT' && (
                    <button
                      type="button"
                      onClick={() => setPaymentModalOpen(true)}
                      className="shadow-xs flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Bayar Sekarang</span>
                    </button>
                  )}

                  {canConfirmReceived && (
                    <button
                      onClick={handleConfirmReceived}
                      disabled={isConfirming}
                      className="shadow-xs flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        {isConfirming
                          ? 'Mengonfirmasi...'
                          : 'Konfirmasi Pesanan Diterima'}
                      </span>
                    </button>
                  )}

                  {canRequestReturnOrComplaint &&
                    (!latestReturnRequest ||
                      latestReturnRequest.status === 'REJECTED') && (
                      <button
                        onClick={() => setReturnModalOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50/70 py-2.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100 active:scale-95 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300"
                      >
                        <RotateCcw className="h-4 w-4 text-orange-600" />
                        <span>Ajukan Pengembalian (Retur)</span>
                      </button>
                    )}

                  {canRequestReturnOrComplaint && !latestReturnRequest && (
                    <button
                      onClick={() => setComplaintModalOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>
                        {isCompleted
                          ? 'Klaim Garansi 30 Hari'
                          : 'Laporkan Kendala / Komplain'}
                      </span>
                    </button>
                  )}

                  {isCompleted && !latestReturnRequest && (
                    <button
                      onClick={handleOpenRating}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Star
                        className={`h-4 w-4 ${currentReview ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`}
                      />
                      <span>
                        {currentReview
                          ? 'Ubah Ulasan Produk'
                          : 'Beri Ulasan Produk'}
                      </span>
                    </button>
                  )}


                  {/* Chat Toko Direct Action */}
                  <Link
                    href={`/dashboard/customer/chat?${chatParams.toString()}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200"
                  >
                    <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Chat Toko Cabang</span>
                  </Link>

                  {/* Batalkan Pesanan (if canCancel) */}
                  {canCancel && (
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 pt-1 text-xs font-bold text-rose-600 transition hover:text-rose-700 dark:text-rose-400"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>Batalkan Pesanan</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-150 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
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
                className="cursor-pointer rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Apakah Anda yakin ingin membatalkan pesanan{' '}
              <span className="font-mono font-bold text-slate-950 dark:text-white">
                #{order.orderNumber}
              </span>
              ? Pembatalan hanya dapat dilakukan sebelum barang diserahkan ke
              kurir pengiriman.
            </p>

            <div className="mb-5">
              <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Alasan Pembatalan:
              </label>
              <CustomSelect
                value={cancelReason}
                onChange={(val) => setCancelReason(val)}
                options={[
                  {
                    value: 'Ingin mengubah alamat pengiriman / varian',
                    label: 'Ingin mengubah alamat pengiriman / varian',
                  },
                  {
                    value: 'Ingin mengganti metode pembayaran',
                    label: 'Ingin mengganti metode pembayaran',
                  },
                  {
                    value: 'Menemukan harga lebih hemat di toko lain',
                    label: 'Menemukan promo di toko lain',
                  },
                  {
                    value: 'Lainnya / berubah pikiran',
                    label: 'Lainnya / berubah pikiran',
                  },
                ]}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="shadow-xs cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
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
          toast.success(
            'Pengajuan klaim garansi 30 hari berhasil dikirim ke teknisi toko!'
          )
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
          toast.success(
            'Pengajuan pengembalian berhasil dikirim ke pihak toko!'
          )
          router.refresh()
        }}
      />

      {/* Rating & Review Modal */}
      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal((prev) => ({ ...prev, isOpen: false }))}
        orderId={ratingModal.orderId}
        orderNumber={ratingModal.orderNumber}
        existingRating={currentReview?.rating ?? ratingModal.existingRating}
        existingComment={
          currentReview?.comment ?? ratingModal.existingComment ?? undefined
        }
        onSuccess={(updatedReview) => {
          if (updatedReview) {
            setCurrentReview((prev) => ({
              ...(prev ?? {}),
              ...updatedReview,
            }))
          }
          router.refresh()
        }}
      />

      {/* 100% Custom In-House Payment Modal */}
      <CustomPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false)
          router.refresh()
        }}
        orderId={order.id}
        orderNumber={order.orderNumber}
        totalAmount={order.total}
        onPaymentSuccess={() => {
          router.refresh()
        }}
      />

      {/* Printable Thermal Shipping Label Modal */}
      {activeThermalLabel && (
        <ThermalShippingLabel
          data={activeThermalLabel}
          onClose={() => setActiveThermalLabel(null)}
        />
      )}

      {/* Top Floating Notification Modal: Konfirmasi Penerimaan Pesanan */}
      {confirmReceivedModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 pt-4 sm:pt-6">
          {/* Subtle backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/25 backdrop-blur-[2px] transition-opacity duration-200 animate-in fade-in"
            onClick={() => !isConfirming && setConfirmReceivedModalOpen(false)}
          />

          {/* Sleek, small top notification card */}
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl shadow-slate-900/15 backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-4 dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Konfirmasi Pesanan Diterima?
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      !isConfirming && setConfirmReceivedModalOpen(false)
                    }
                    className="rounded p-0.5 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Tutup notifikasi"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                  Pastikan fisik gadget sesuai. Garansi 30 hari ganti baru akan
                  langsung aktif.
                </p>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReceivedModalOpen(false)}
                    disabled={isConfirming}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={executeConfirmReceived}
                    disabled={isConfirming}
                    className="shadow-xs inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  >
                    {isConfirming ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <span>Ya, Diterima</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Bottom Navigation: Mobile Bottom Nav & Desktop Footer */}
      <div className="block md:hidden">
        {!returnModalOpen &&
          !complaintModalOpen &&
          !paymentModalOpen &&
          !ratingModal.isOpen &&
          !activeThermalLabel && <MobileBottomNav activeTab="akun" />}
      </div>
      <div className="hidden md:block">
        <Footer variant="light" />
      </div>
    </div>
  )
}
