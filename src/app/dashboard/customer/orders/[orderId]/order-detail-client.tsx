'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Navbar,
  Footer,
  MobileTopNav,
  MobileBottomNav,
} from '@/components/layouts'
import Link from 'next/link'
import { ArrowLeft, Building2, Check, RotateCcw } from 'lucide-react'
import { RatingModal } from '@/components/modals/rating-modal'
import { CustomPaymentModal } from '@/components/payment/custom-payment-modal'
import { ComplaintModal } from '@/components/customer/complaint-modal'
import { ReturnModal } from '@/components/customer/return-modal'
import { toast } from 'sonner'
import { ThermalShippingLabel } from '@/components/shipping/thermal-shipping-label'
import { CheckResiModal } from '@/components/shipping/check-resi-modal'
import {
  MediaLightboxModal,
  MediaItem,
} from '@/components/gadget/media-lightbox-modal'
import {
  getOrderContextualTimestamp,
  buildOrderAuditTimeline,
} from '@/lib/order-date-utils'
import {
  isWarrantyExpired,
  splitOrderItemsForDisplay,
  getWarrantyRemainingDays,
  getWarrantyRemainingBadgeText,
  getRemainingReturnableQuantityForItem,
} from '@/lib/order-return-utils'
import {
  OrderDetailProps,
  OrderDetailItem,
  statusConfig,
  OrderCancelModal,
  OrderConfirmReceivedModal,
  OrderCompleteModal,
  OrderDesktopHeroHeader,
  OrderDesktopReturnCard,
  OrderDesktopWarrantyCard,
  OrderDesktopItemsCard,
  OrderDesktopShippingCard,
  OrderDesktopPaymentCard,
  OrderDesktopAuditTimelineCard,
  OrderMobileView,
} from '@/components/customer/order-detail'

export default function OrderDetailClient({ order }: OrderDetailProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromStatus =
    searchParams?.get('fromStatus') || searchParams?.get('status')
  const contextualTime = useMemo(
    () => getOrderContextualTimestamp(order),
    [order]
  )
  const auditTimeline = useMemo(() => buildOrderAuditTimeline(order), [order])
  const [copied, setCopied] = useState(false)
  const [complaintModalOpen, setComplaintModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [selectedReturnItem, setSelectedReturnItem] =
    useState<OrderDetailItem | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState(
    'Ingin mengubah alamat pengiriman / varian'
  )
  const [isCancelling, setIsCancelling] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmReceivedModalOpen, setConfirmReceivedModalOpen] =
    useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
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

  const handleViewReturnThermalLabel = async () => {
    const awb = latestReturnRequest?.returnTrackingNumber
    if (!awb) return
    try {
      setViewingLabel(true)
      const res = await fetch(
        `/api/shipping/tracking/awb-lookup?awb=${encodeURIComponent(awb)}`
      )
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          setActiveThermalLabel(json.data)
          return
        }
      }
      toast.info('Menyiapkan label pengiriman retur...')
    } catch {
      toast.error('Gagal memuat label pengiriman retur')
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

  const reviewMediaList = useMemo<MediaItem[]>(() => {
    if (!currentReview) return []
    const list: MediaItem[] = []
    currentReview.images?.forEach((url) => {
      list.push({
        url,
        type: 'image',
        authorName: 'Ulasan Anda',
        rating: currentReview.rating,
      })
    })
    currentReview.videos?.forEach((url) => {
      list.push({
        url,
        type: 'video',
        authorName: 'Ulasan Anda',
        rating: currentReview.rating,
      })
    })
    return list
  }, [currentReview])

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const handleOpenMedia = (index: number) => {
    setLightboxIndex(index)
  }

  // Rating Modal state
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean
    orderId: string
    orderNumber: string
    existingRating?: number
    existingComment?: string | null
    existingImages?: string[]
    existingVideos?: string[]
  }>({
    isOpen: false,
    orderId: '',
    orderNumber: '',
  })

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber)
    setCopied(true)
    toast.success(`Nomor pesanan #${order.orderNumber} berhasil disalin`)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenRating = (_item?: OrderDetailItem) => {
    setRatingModal({
      isOpen: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      existingRating: currentReview?.rating,
      existingComment: currentReview?.comment,
      existingImages: currentReview?.images,
      existingVideos: currentReview?.videos,
    })
  }

  // Konfirmasi Pesanan Diterima
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

  // Batalkan Pesanan (hanya jika PENDING_PAYMENT atau belum dikirim)
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

  // Evaluasi pembagian unit retur vs tidak diretur
  const displayItems = useMemo(
    () => splitOrderItemsForDisplay(order.items, order.returnRequests),
    [order.items, order.returnRequests]
  )

  const returnedDisplayItems = useMemo(
    () => displayItems.filter((d) => d.isReturnedUnit),
    [displayItems]
  )
  const unreturnedDisplayItems = useMemo(
    () => displayItems.filter((d) => !d.isReturnedUnit),
    [displayItems]
  )
  const isPartialReturnOrder =
    returnedDisplayItems.length > 0 && unreturnedDisplayItems.length > 0

  const viewParam = searchParams?.get('view')
  const itemIdParam = searchParams?.get('itemId')

  const initialUnitTab = useMemo<'all' | 'unreturned' | 'returned'>(() => {
    if (!isPartialReturnOrder) return 'all'
    if (viewParam === 'unreturned') return 'unreturned'
    if (viewParam === 'returned') return 'returned'
    if (itemIdParam) {
      const matchUnreturned = unreturnedDisplayItems.some(
        (it) => it.item.id === itemIdParam || it.id.includes(itemIdParam)
      )
      if (matchUnreturned) return 'unreturned'
      const matchReturned = returnedDisplayItems.some(
        (it) => it.item.id === itemIdParam || it.id.includes(itemIdParam)
      )
      if (matchReturned) return 'returned'
    }
    if (fromStatus === 'RETURNED') return 'returned'
    if (fromStatus === 'COMPLETED') return 'unreturned'
    return 'all'
  }, [
    isPartialReturnOrder,
    viewParam,
    itemIdParam,
    unreturnedDisplayItems,
    returnedDisplayItems,
    fromStatus,
  ])

  const [selectedUnitTab, setSelectedUnitTab] = useState<
    'all' | 'unreturned' | 'returned'
  >(initialUnitTab)

  useEffect(() => {
    setSelectedUnitTab(initialUnitTab)
  }, [initialUnitTab])

  const isViewingUnreturned =
    isPartialReturnOrder && selectedUnitTab === 'unreturned'

  const effectiveLatestReturnRequest = isViewingUnreturned
    ? null
    : latestReturnRequest

  const remainingDays = getWarrantyRemainingDays(order)

  const [returnCourier, setReturnCourier] = useState(
    latestReturnRequest?.returnCourier || 'JNE'
  )
  const [returnTrackingNumber, setReturnTrackingNumber] = useState(
    latestReturnRequest?.returnTrackingNumber || ''
  )
  const [isSavingReturnTracking, setIsSavingReturnTracking] = useState(false)

  // Check Resi Tracking Modal for initial / replacement / repaired shipment
  const [resiModalOpen, setResiModalOpen] = useState(false)
  const [resiModalWaybill, setResiModalWaybill] = useState('')
  const [, setResiModalCourier] = useState('JNE')

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

  const getNormalStatus = () => {
    if (order.status === 'RETURNED') {
      return statusConfig.RETURNED
    }
    const isWOver = isWarrantyExpired(order)
    const isUnder30Days =
      order.warrantyExpiryDate &&
      Date.now() < new Date(order.warrantyExpiryDate).getTime()
    if (order.customerConfirmedAt && !order.completedAt && isUnder30Days) {
      const label =
        remainingDays !== null && remainingDays > 0
          ? `Diterima (Garansi Tersisa ${remainingDays} Hari)`
          : 'Diterima (Garansi 30 Hari Aktif)'
      return {
        label,
        badgeBg:
          'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dotColor: 'bg-emerald-500',
        icon: Building2,
      }
    }
    if (order.status === 'COMPLETED' || order.customerConfirmedAt) {
      return (
        statusConfig.COMPLETED || {
          label: 'Selesai',
          badgeBg:
            'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          dotColor: 'bg-emerald-500',
          icon: Building2,
        }
      )
    }
    return statusConfig[order.status] || statusConfig.PROCESSING
  }

  const getDetailStatus = () => {
    if (latestReturnRequest) {
      if (latestReturnRequest.status === 'PENDING') {
        return statusConfig.RETURN_PENDING
      }
      if (latestReturnRequest.status === 'APPROVED') {
        return statusConfig.RETURN_APPROVED
      }
      if (latestReturnRequest.status === 'IN_REVIEW') {
        const isArrived = Boolean(
          latestReturnRequest.packageReceivedAt ||
          latestReturnRequest.storeResponse?.includes(
            '[Paket Fisik Tiba di Cabang]'
          )
        )
        return isArrived
          ? statusConfig.RETURN_IN_QC
          : statusConfig.RETURN_IN_TRANSIT
      }
      if (latestReturnRequest.status === 'REJECTED') {
        return statusConfig.RETURN_REJECTED
      }
      if (latestReturnRequest.status === 'COMPLETED') {
        return statusConfig.RETURN_COMPLETED
      }
    }
    return getNormalStatus()
  }

  const currentStatus = isViewingUnreturned
    ? getNormalStatus()
    : getDetailStatus()

  const unreturnedSubtotal = useMemo(
    () =>
      unreturnedDisplayItems.reduce((acc, it) => acc + it.displaySubtotal, 0),
    [unreturnedDisplayItems]
  )
  const returnedSubtotal = useMemo(
    () => returnedDisplayItems.reduce((acc, it) => acc + it.displaySubtotal, 0),
    [returnedDisplayItems]
  )

  const effectiveOrderForDisplay = useMemo(() => {
    if (isViewingUnreturned) {
      return {
        ...order,
        items: unreturnedDisplayItems.map((d) => ({
          ...d.item,
          quantity: d.displayQuantity,
          subtotal: d.displaySubtotal,
        })),
        total: unreturnedSubtotal,
        subtotal: unreturnedSubtotal,
      }
    }
    if (isPartialReturnOrder && selectedUnitTab === 'returned') {
      return {
        ...order,
        items: returnedDisplayItems.map((d) => ({
          ...d.item,
          quantity: d.displayQuantity,
          subtotal: d.displaySubtotal,
        })),
        total: returnedSubtotal,
        subtotal: returnedSubtotal,
      }
    }
    return order
  }, [
    isViewingUnreturned,
    isPartialReturnOrder,
    selectedUnitTab,
    order,
    unreturnedDisplayItems,
    returnedDisplayItems,
    unreturnedSubtotal,
    returnedSubtotal,
  ])

  const canCancel =
    order.status === 'PENDING_PAYMENT' || order.status === 'PAID'
  const canConfirmReceived =
    (order.status === 'IN_PROGRESS' || order.status === 'SHIPPED') &&
    !order.customerConfirmedAt
  const isWarrantyOver = isWarrantyExpired(order)
  const isReceived = Boolean(
    order.customerConfirmedAt ||
    order.status === 'COMPLETED' ||
    Boolean(order.completedAt)
  )
  const isCompleted = Boolean(
    order.status === 'COMPLETED' ||
    Boolean(order.completedAt) ||
    (Boolean(order.customerConfirmedAt) && isWarrantyOver)
  )
  const canManuallyComplete = Boolean(
    order.customerConfirmedAt &&
    !order.completedAt &&
    !isWarrantyOver &&
    order.status !== 'COMPLETED' &&
    order.status !== 'CANCELLED' &&
    order.status !== 'RETURNED'
  )
  const returnEligibleItems = useMemo(() => {
    if (!order.items || order.items.length === 0) return []
    return order.items
      .map((it) => {
        const returnableQty = getRemainingReturnableQuantityForItem(
          it,
          order.returnRequests,
          order
        )
        return {
          ...it,
          quantity: returnableQty,
        }
      })
      .filter((it) => it.quantity > 0)
  }, [order.items, order.returnRequests, order])

  const hasReturnableItems =
    order.items && order.items.length > 0
      ? returnEligibleItems.length > 0
      : Boolean(
          !latestReturnRequest ||
          (latestReturnRequest.status === 'COMPLETED' &&
            latestReturnRequest.type === 'REPLACEMENT')
        )

  const hasActiveClaim =
    latestReturnRequest &&
    (latestReturnRequest.status === 'PENDING' ||
      latestReturnRequest.status === 'IN_REVIEW' ||
      latestReturnRequest.status === 'APPROVED')

  // Jika retur sudah ditolak, tidak ada opsi untuk retur lagi (kecuali barang pengganti diterima dan rusak lagi)
  const isWholeOrderReturnRejected = Boolean(
    order.items &&
    order.items.length <= 1 &&
    latestReturnRequest &&
    latestReturnRequest.status === 'REJECTED'
  )

  const canRequestReturnOrComplaint =
    isReceived &&
    !isCompleted &&
    !hasActiveClaim &&
    !isWarrantyOver &&
    hasReturnableItems &&
    !isWholeOrderReturnRejected

  // Construct chat parameters for all chat entry points
  const firstItem = order.items?.[0]
  const firstProduct = firstItem?.product
  const chatParams = new URLSearchParams()
  chatParams.set('orderId', order.id)
  if (order.store?.id) chatParams.set('storeId', order.store.id)
  if (order.orderNumber) chatParams.set('orderNumber', order.orderNumber)
  if (
    latestReturnRequest &&
    latestReturnRequest.status !== 'COMPLETED' &&
    latestReturnRequest.status !== 'REJECTED'
  ) {
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
  const effectiveItemPrice = order.total || firstItem?.price
  if (effectiveItemPrice)
    chatParams.set('productPrice', String(effectiveItemPrice))

  const isAfterSalesOrder =
    Boolean(latestReturnRequest) ||
    order.status === 'COMPLETED' ||
    order.status === 'RETURNED'
  if (isAfterSalesOrder) {
    chatParams.set('type', 'after_sales')
  }

  // Resolusi rute kembali yang akurat: mempertahankan tab status yang dikunjungi customer sebelumnya
  const backHref = useMemo(() => {
    if (fromStatus) {
      if (fromStatus === 'ALL') {
        return '/dashboard/customer/orders'
      }
      return `/dashboard/customer/orders?status=${fromStatus}`
    }

    // Fallback cerdas berbasis status aktual pesanan jika diakses langsung tanpa query
    const isReturn =
      order.status === 'RETURNED' ||
      Boolean(order.returnRequests && order.returnRequests.length > 0)
    if (isReturn) return '/dashboard/customer/orders?status=RETURNED'
    if (order.status === 'SHIPPED' || order.status === 'IN_PROGRESS') {
      return '/dashboard/customer/orders?status=SHIPPED'
    }
    if (order.status === 'PROCESSING' || order.status === 'PAID') {
      return '/dashboard/customer/orders?status=PROCESSING'
    }
    if (order.status === 'PENDING_PAYMENT') {
      return '/dashboard/customer/orders?status=PENDING_PAYMENT'
    }
    if (order.status === 'COMPLETED') {
      return '/dashboard/customer/orders?status=COMPLETED'
    }
    if (order.status === 'CANCELLED') {
      return '/dashboard/customer/orders?status=CANCELLED'
    }
    return '/dashboard/customer/orders'
  }, [fromStatus, order.status, order.returnRequests])

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
          router.push(backHref)
        }
      }, 250)
      return
    }
    router.push(backHref)
  }

  const handleOpenResiModal = (waybill: string, courier: string) => {
    setResiModalWaybill(waybill)
    setResiModalCourier(courier)
    setResiModalOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Top Navigation: Mobile Top Nav & Desktop Navbar */}
      <div className="block md:hidden">
        <MobileTopNav
          showBack={true}
          onBack={handleNavigateBack}
          backHref={backHref}
          title="Rincian Pesanan"
        />
      </div>
      <div className="hidden md:block">
        <Navbar variant="light" />
      </div>

      <main className="flex min-h-screen flex-col pb-24 pt-4 sm:pt-6 md:pb-24 md:pt-28 lg:pt-32">
        <div className="mx-auto my-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          {/* Top Breadcrumb & Store Origin Bar */}
          <div className="mb-6 hidden flex-wrap items-center justify-between gap-3 md:flex">
            <Link
              href={backHref}
              onClick={handleNavigateBack}
              className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-950 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">
                Toko:
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                {order.store?.name || 'PT Gadget Jaya Sentosa'}
              </span>
            </div>
          </div>

          {/* Unit Switcher Tabs jika pesanan memiliki Retur Parsial (ada unit retur dan unit normal) */}
          {isPartialReturnOrder && (
            <div className="shadow-2xs mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  Lihat Unit:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedUnitTab('unreturned')}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all sm:px-3.5 ${
                    selectedUnitTab === 'unreturned'
                      ? 'shadow-xs bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>
                    Unit Tidak Diretur (
                    {unreturnedDisplayItems.reduce(
                      (a, b) => a + b.displayQuantity,
                      0
                    )}{' '}
                    Unit)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUnitTab('returned')}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all sm:px-3.5 ${
                    selectedUnitTab === 'returned'
                      ? 'shadow-xs bg-purple-600 text-white'
                      : 'text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950/40'
                  }`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>
                    Unit Diretur (
                    {returnedDisplayItems.reduce(
                      (a, b) => a + b.displayQuantity,
                      0
                    )}{' '}
                    Unit)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUnitTab('all')}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all sm:px-3.5 ${
                    selectedUnitTab === 'all'
                      ? 'shadow-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Semua Unit</span>
                </button>
              </div>

              {selectedUnitTab === 'unreturned' && (
                <span className="px-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Menampilkan rincian pembayaran pada unit ini saja karena tidak
                  di-retur
                </span>
              )}
            </div>
          )}

          {/* Mobile Unified Layout: 1 Bagian Saja */}
          <OrderMobileView
            order={effectiveOrderForDisplay}
            copied={copied}
            copyOrderNumber={copyOrderNumber}
            currentStatus={currentStatus}
            contextualTime={contextualTime}
            latestReturnRequest={effectiveLatestReturnRequest}
            latestComplaint={latestComplaint}
            returnTrackingNumber={returnTrackingNumber}
            setReturnTrackingNumber={setReturnTrackingNumber}
            returnCourier={returnCourier}
            setReturnCourier={setReturnCourier}
            handleSaveReturnTracking={handleSaveReturnTracking}
            isSavingReturnTracking={isSavingReturnTracking}
            onOpenResiModal={handleOpenResiModal}
            handleViewThermalLabel={handleViewThermalLabel}
            handleViewReturnThermalLabel={handleViewReturnThermalLabel}
            viewingLabel={viewingLabel}
            auditTimeline={auditTimeline}
            chatParams={chatParams}
            canCancel={isViewingUnreturned ? false : canCancel}
            canConfirmReceived={canConfirmReceived}
            canManuallyComplete={canManuallyComplete}
            isCompleted={isCompleted}
            hasActiveClaim={
              isViewingUnreturned ? false : Boolean(hasActiveClaim)
            }
            canRequestReturnOrComplaint={
              isViewingUnreturned
                ? isReceived &&
                  !isCompleted &&
                  !isWarrantyOver &&
                  hasReturnableItems
                : canRequestReturnOrComplaint
            }
            isConfirming={isConfirming}
            currentReview={currentReview}
            customTotal={
              isViewingUnreturned
                ? unreturnedSubtotal
                : selectedUnitTab === 'returned'
                  ? returnedSubtotal
                  : undefined
            }
            customSubtotal={
              isViewingUnreturned
                ? unreturnedSubtotal
                : selectedUnitTab === 'returned'
                  ? returnedSubtotal
                  : undefined
            }
            customItems={effectiveOrderForDisplay.items}
            customNote={
              isViewingUnreturned
                ? 'Rincian pembayaran khusus pada unit ini saja karena unit ini tidak di-retur.'
                : selectedUnitTab === 'returned'
                  ? 'Rincian pembayaran khusus pada unit yang diajukan retur / refund.'
                  : undefined
            }
            hideShippingAndInsurance={
              isViewingUnreturned || selectedUnitTab === 'returned'
            }
            paymentTitle={
              isViewingUnreturned
                ? 'Rincian Pembayaran Unit (Tidak Diretur)'
                : selectedUnitTab === 'returned'
                  ? 'Rincian Pembayaran Unit (Diretur)'
                  : undefined
            }
            onOpenMedia={handleOpenMedia}
            onPayNow={() => setPaymentModalOpen(true)}
            onConfirmReceived={handleConfirmReceived}
            onOpenCompleteModal={() => setCompleteModalOpen(true)}
            onOpenReturn={() => {
              setSelectedReturnItem(effectiveOrderForDisplay.items[0] || null)
              setReturnModalOpen(true)
            }}
            onOpenReturnForItem={(item) => {
              setSelectedReturnItem(item)
              setReturnModalOpen(true)
            }}
            onOpenComplaint={() => setComplaintModalOpen(true)}
            onOpenRating={handleOpenRating}
            onOpenRatingForItem={(item) => handleOpenRating(item)}
            onOpenCancel={() => setCancelModalOpen(true)}
          />

          {/* Desktop Bento Layout (Hidden on Mobile) */}
          <div className="hidden md:block">
            {/* Hero Order Header Bento Card */}
            <OrderDesktopHeroHeader
              order={effectiveOrderForDisplay}
              copied={copied}
              copyOrderNumber={copyOrderNumber}
              contextualTime={contextualTime}
              currentStatus={currentStatus}
            />

            {/* Return & Refund Live Card */}
            {effectiveLatestReturnRequest && (
              <OrderDesktopReturnCard
                order={order}
                latestReturnRequest={effectiveLatestReturnRequest}
                returnTrackingNumber={returnTrackingNumber}
                setReturnTrackingNumber={setReturnTrackingNumber}
                returnCourier={returnCourier}
                setReturnCourier={setReturnCourier}
                handleSaveReturnTracking={handleSaveReturnTracking}
                isSavingReturnTracking={isSavingReturnTracking}
                onOpenResiModal={handleOpenResiModal}
                onViewThermalLabel={handleViewReturnThermalLabel}
                viewingThermalLabel={viewingLabel}
              />
            )}

            {/* Warranty Claim Live Card */}
            {latestComplaint && (
              <OrderDesktopWarrantyCard latestComplaint={latestComplaint} />
            )}

            {/* 2-Column Bento Layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Col (2 Cols): Products, Bonus Package & Logistics */}
              <div className="space-y-6 lg:col-span-2">
                <OrderDesktopItemsCard
                  order={effectiveOrderForDisplay}
                  canRequestReturnOrComplaint={canRequestReturnOrComplaint}
                  hasActiveClaim={
                    isViewingUnreturned ? false : Boolean(hasActiveClaim)
                  }
                  isCompleted={isCompleted}
                  latestReturnRequest={effectiveLatestReturnRequest}
                  onOpenReturnForItem={(item) => {
                    setSelectedReturnItem(item)
                    setReturnModalOpen(true)
                  }}
                  onOpenRatingForItem={(item) => {
                    handleOpenRating(item)
                  }}
                />
                <OrderDesktopShippingCard
                  order={order}
                  backHref={backHref}
                  handleViewThermalLabel={handleViewThermalLabel}
                  viewingLabel={viewingLabel}
                />
              </div>

              {/* Right Col (1 Col): Payment & Totals Bento */}
              <div className="space-y-6">
                <OrderDesktopPaymentCard
                  order={effectiveOrderForDisplay}
                  chatParams={chatParams}
                  canCancel={isViewingUnreturned ? false : canCancel}
                  canConfirmReceived={canConfirmReceived}
                  canManuallyComplete={canManuallyComplete}
                  isCompleted={isCompleted}
                  hasActiveClaim={
                    isViewingUnreturned ? false : Boolean(hasActiveClaim)
                  }
                  canRequestReturnOrComplaint={
                    isViewingUnreturned
                      ? isReceived &&
                        !isCompleted &&
                        !isWarrantyOver &&
                        hasReturnableItems
                      : canRequestReturnOrComplaint
                  }
                  isConfirming={isConfirming}
                  latestReturnRequest={effectiveLatestReturnRequest}
                  currentReview={currentReview}
                  customTotal={
                    isViewingUnreturned
                      ? unreturnedSubtotal
                      : selectedUnitTab === 'returned'
                        ? returnedSubtotal
                        : undefined
                  }
                  customSubtotal={
                    isViewingUnreturned
                      ? unreturnedSubtotal
                      : selectedUnitTab === 'returned'
                        ? returnedSubtotal
                        : undefined
                  }
                  customItems={effectiveOrderForDisplay.items}
                  customNote={
                    isViewingUnreturned
                      ? 'Rincian pembayaran khusus pada unit ini saja karena unit ini tidak di-retur.'
                      : selectedUnitTab === 'returned'
                        ? 'Rincian pembayaran khusus pada unit yang diajukan retur / refund.'
                        : undefined
                  }
                  hideShippingAndInsurance={
                    isViewingUnreturned || selectedUnitTab === 'returned'
                  }
                  paymentTitle={
                    isViewingUnreturned
                      ? 'Rincian Pembayaran Unit (Tidak Diretur)'
                      : selectedUnitTab === 'returned'
                        ? 'Rincian Pembayaran Unit (Diretur)'
                        : undefined
                  }
                  onOpenMedia={handleOpenMedia}
                  onPayNow={() => setPaymentModalOpen(true)}
                  onConfirmReceived={handleConfirmReceived}
                  onOpenCompleteModal={() => setCompleteModalOpen(true)}
                  onOpenReturn={() => {
                    setSelectedReturnItem(
                      effectiveOrderForDisplay.items[0] || null
                    )
                    setReturnModalOpen(true)
                  }}
                  onOpenComplaint={() => setComplaintModalOpen(true)}
                  onOpenRating={handleOpenRating}
                  onOpenCancel={() => setCancelModalOpen(true)}
                />

                <OrderDesktopAuditTimelineCard
                  contextualTime={contextualTime}
                  auditTimeline={auditTimeline}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Manual Complete Order Modal */}
      <OrderCompleteModal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        orderId={order.id}
        orderNumber={order.orderNumber}
        onSuccess={() => router.refresh()}
      />

      {/* Cancel Order Modal */}
      <OrderCancelModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        orderNumber={order.orderNumber}
        cancelReason={cancelReason}
        onReasonChange={setCancelReason}
        onConfirmCancel={handleCancelOrder}
        isCancelling={isCancelling}
      />

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
        onClose={() => {
          setReturnModalOpen(false)
          setSelectedReturnItem(null)
        }}
        orderId={order.id}
        orderNumber={order.orderNumber}
        totalAmount={order.total}
        subtotal={order.subtotal}
        shippingCost={order.shippingCost}
        tax={order.tax}
        insuranceFee={order.insuranceFee}
        items={
          returnEligibleItems.length > 0 ? returnEligibleItems : order.items
        }
        initialSelectedItemId={selectedReturnItem?.id || null}
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
        existingImages={currentReview?.images ?? ratingModal.existingImages}
        existingVideos={currentReview?.videos ?? ratingModal.existingVideos}
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

      {/* Review Media Lightbox Modal */}
      {lightboxIndex !== null && reviewMediaList.length > 0 && (
        <MediaLightboxModal
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          mediaList={reviewMediaList}
          initialIndex={lightboxIndex}
        />
      )}

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
        orderCreatedAt={order.createdAt}
        onPaymentSuccess={() => {
          router.refresh()
        }}
        onPaymentExpired={() => {
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
      <OrderConfirmReceivedModal
        isOpen={confirmReceivedModalOpen}
        onClose={() => setConfirmReceivedModalOpen(false)}
        onConfirm={executeConfirmReceived}
        isConfirming={isConfirming}
      />

      {/* Bottom Navigation */}
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

      {/* Check Resi Live Tracking Modal */}
      <CheckResiModal
        isOpen={resiModalOpen}
        onClose={() => setResiModalOpen(false)}
        initialQuery={resiModalWaybill}
      />
    </div>
  )
}
