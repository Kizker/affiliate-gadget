'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Store,
  Copy,
  Check,
  Printer,
  Zap,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  Banknote,
  RotateCcw,
  CheckCircle2,
  Clock,
  X,
  Truck,
  Loader2,
  Gift,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { AdminOrderPaymentCard } from './admin-order-payment-card'
import { ThermalShippingLabel } from '@/components/shipping/thermal-shipping-label'
import { LiveCourierTracker } from '@/components/shipping/live-courier-tracker'
import { CheckResiModal } from '@/components/shipping/check-resi-modal'
import TaxInvoiceModal from '@/components/modals/tax-invoice-modal'

export interface OrderDetailModalData {
  id: string
  orderNumber: string
  total: number
  subtotal?: number
  voucherCode?: string | null
  discountAmount?: number
  shippingCost?: number
  insuranceRate?: number
  insuranceFee?: number
  isInsuranceMandatory?: boolean
  commissionAmount?: number
  commissionRate?: number
  courierCode?: string | null
  courierService?: string | null
  trackingNumber?: string | null
  bonusChargerIncluded?: boolean
  bonusProtectorIncluded?: boolean
  bonusCaseIncluded?: boolean
  status: string
  createdAt: string
  notes?: string | null
  userId?: string
  user?: {
    id?: string
    name: string | null
    email: string
    phone?: string | null
    address?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
    addresses?: Array<{
      recipientName?: string | null
      phone?: string | null
      fullAddress?: string | null
      city?: string | null
      province?: string | null
      district?: string | null
      village?: string | null
      postalCode?: string | null
    }>
  } | null
  store?: {
    id: string
    name: string
    companyName?: string
    city?: string
  } | null
  payment?: {
    status?: string
    paymentMethod?: string | null
    provider?: string | null
  } | null
  items?: Array<{
    id: string
    quantity: number
    price: number
    subtotal?: number
    variantName?: string | null
    notes?: string | null
    productId?: string | null
    rentalItemId?: string | null
    serviceId?: string | null
    product?: {
      id?: string
      name: string
      brand?: string | null
      images?: string[]
      sku?: string | null
    } | null
    service?: {
      name: string
      category?: string | null
    } | null
    rentalItem?: {
      name: string
      images?: string[]
    } | null
  }>
  returnRequests?: Array<{
    id: string
    status: string
    type: string
    reason?: string | null
    reasonLabel?: string | null
    returnTrackingNumber?: string | null
    returnCourier?: string | null
    storeResponse?: string | null
    bankName?: string | null
    bankAccountNumber?: string | null
    bankAccountName?: string | null
    refundAmount?: number | null
    resolvedAt?: string | null
    createdAt: string
  }>
}

interface AdminOrderDetailModalProps {
  order: OrderDetailModalData | null
  isOpen: boolean
  onClose: () => void
  onStatusUpdated?: () => void
}

const statusConfig: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  PENDING_PAYMENT: {
    label: 'Belum Dibayar',
    badgeClass:
      'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80',
    dotClass: 'bg-amber-500',
  },
  PAID: {
    label: 'Perlu Diproses',
    badgeClass:
      'bg-blue-50 text-blue-800 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80',
    dotClass: 'bg-blue-500',
  },
  IN_PROGRESS: {
    label: 'Sedang Diproses',
    badgeClass:
      'bg-indigo-50 text-indigo-800 border border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/80',
    dotClass: 'bg-indigo-500',
  },
  SHIPPED: {
    label: 'Sedang Dikirim',
    badgeClass:
      'bg-orange-50 text-orange-800 border border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/80',
    dotClass: 'bg-orange-500',
  },
  COMPLETED: {
    label: 'Selesai',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
    dotClass: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    badgeClass:
      'bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/80',
    dotClass: 'bg-rose-500',
  },
  COMPLAINED: {
    label: 'Komplain Garansi',
    badgeClass:
      'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80',
    dotClass: 'bg-amber-500',
  },
  RETURNED: {
    label: 'Retur Disetujui',
    badgeClass:
      'bg-purple-50 text-purple-800 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/80',
    dotClass: 'bg-purple-500',
  },
}

export function AdminOrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusUpdated,
}: AdminOrderDetailModalProps) {
  const router = useRouter()
  const [copiedId, setCopiedId] = useState(false)
  const [copiedAWB, setCopiedAWB] = useState(false)
  const [isConnectingChat, setIsConnectingChat] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [requestingPickupId, setRequestingPickupId] = useState<string | null>(
    null
  )
  const [syncingStatusId, setSyncingStatusId] = useState<string | null>(null)
  const [showLiveTracker, setShowLiveTracker] = useState(false)
  const [activeThermalLabel, setActiveThermalLabel] = useState<any | null>(null)
  const [showCheckResiModal, setShowCheckResiModal] = useState(false)
  const [checkResiQuery, setCheckResiQuery] = useState('')
  const [taxInvoiceOrder, setTaxInvoiceOrder] = useState<any | null>(null)

  if (!order) return null

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber)
    setCopiedId(true)
    toast.success('Nomor order berhasil disalin!')
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleCopyAWB = (awb: string) => {
    navigator.clipboard.writeText(awb)
    setCopiedAWB(true)
    toast.success('Nomor resi / AWB berhasil disalin!')
    setTimeout(() => setCopiedAWB(false), 2000)
  }

  const handleChatCustomer = async () => {
    try {
      setIsConnectingChat(true)
      const customerId = order.user?.id || (order as any).userId

      const res = await fetch('/api/admin/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          customerId,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.room?.id) {
        throw new Error(data.error || 'Gagal membuka ruang chat')
      }

      onClose()
      router.push(
        `/dashboard/admin/chat?roomId=${data.room.id}&orderId=${order.id}`
      )
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal menghubungkan ke chat'
      toast.error(msg)
    } finally {
      setIsConnectingChat(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdatingId(order.id)
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || 'Gagal mengubah status pesanan')
      toast.success(data.message || `Status pesanan diubah ke ${newStatus}`)
      onStatusUpdated?.()
      onClose()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal mengubah status pesanan'
      toast.error(msg)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRequestPickup = async () => {
    try {
      setRequestingPickupId(order.id)
      const res = await fetch('/api/shipping/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || 'Gagal memproses Request Pick Up')
      toast.success(data.message || 'Kurir logistik berhasil dipesan!')
      onStatusUpdated?.()
      onClose()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal memproses Request Pick Up'
      toast.error(msg)
    } finally {
      setRequestingPickupId(null)
    }
  }

  const handleOpenThermalLabel = (ord: OrderDetailModalData) => {
    const fallbackRecord: any = {
      orderId: ord.id,
      waybillId: ord.trackingNumber || `AWB-${ord.orderNumber}`,
      trackingNumber: ord.trackingNumber || `AWB-${ord.orderNumber}`,
      courierCompany: ord.courierCode || 'JNE',
      courierType: ord.courierService || 'REG',
      status: 'ALLOCATED',
      orderNumber: ord.orderNumber,
      orderDate: ord.createdAt,
      origin: {
        companyName:
          ord.store?.companyName || ord.store?.name || 'Toko Cabang Resmi',
        address: `${ord.store?.name || 'Cabang'}, Kota ${ord.store?.city || 'Jakarta'}`,
        postalCode: '10150',
        phone: '081288991122',
      },
      destination: {
        recipientName: ord.user?.name || 'Pelanggan',
        address: ord.user?.address || 'Alamat Penerima',
        city: ord.user?.city || 'Jakarta',
        province: ord.user?.province || 'DKI Jakarta',
        postalCode: ord.user?.postalCode || '10110',
        phone: ord.user?.phone || '081234567890',
      },
      items:
        ord.items?.map((i) => ({
          name: i.product?.name || i.service?.name || 'Gadget Smartphone',
          quantity: i.quantity,
          price: i.price,
        })) || [],
      checkpoints: [
        {
          id: 'cp-0',
          status: 'ALLOCATED',
          description: 'Pesanan siap dicetak label dan dijemput kurir logistik',
          location: ord.store?.city || 'Jakarta',
          timestamp: new Date().toISOString(),
        },
      ],
    }
    setActiveThermalLabel(fallbackRecord)
  }

  // Parse recipient address helper
  const recipientName =
    order.user?.addresses?.[0]?.recipientName || order.user?.name || 'Customer'
  const recipientPhone =
    order.user?.addresses?.[0]?.phone || order.user?.phone || '-'
  const deliveryAddress =
    order.user?.addresses?.[0]?.fullAddress ||
    order.user?.address ||
    'Alamat pengiriman belum diisi'
  const courierDisplay = order.courierCode
    ? `${order.courierCode} ${order.courierService || ''}`
    : 'Kurir Terproteksi'

  const currentStatus = statusConfig[order.status] || {
    label: order.status,
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    dotClass: 'bg-slate-500',
  }

  const returnReq = order.returnRequests?.[0]
  const isReplacement = returnReq?.type === 'REPLACEMENT'

  return (
    <>
      <Dialog
        modal={!taxInvoiceOrder}
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
      >
        <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:w-full lg:max-w-4xl">
          <div className="flex max-h-[90vh] flex-1 flex-col overflow-hidden">
            {/* 1. Header Dialog Sticky Top Bar */}
            <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-800/50 sm:px-7 sm:py-5">
              <DialogHeader className="space-y-0 text-left">
                <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="break-words text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {order.store?.name || 'Pesanan Toko Cabang'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <DialogTitle className="break-all font-mono text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">
                        #{order.orderNumber}
                      </DialogTitle>
                      <button
                        onClick={handleCopyOrderNumber}
                        title="Salin Nomor Order"
                        className="shadow-2xs inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {copiedId ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/dashboard/admin/orders?search=${encodeURIComponent(order.orderNumber)}`}
                        onClick={onClose}
                        className="shadow-2xs inline-flex shrink-0 items-center gap-1 rounded-lg border border-orange-200/90 bg-orange-50/60 px-2.5 py-0.5 text-[10.5px] font-bold text-orange-700 transition hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300"
                        title="Buka halaman manajemen pesanan"
                      >
                        <span>Halaman Pesanan</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                    <DialogDescription className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Waktu Transaksi:{' '}
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                    </DialogDescription>
                  </div>

                  {/* Status Pill in Header */}
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${currentStatus.badgeClass}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${currentStatus.dotClass}`}
                    />
                    <span>{currentStatus.label}</span>
                  </div>
                </div>
              </DialogHeader>
            </div>

            {/* 2. Scrollable Body: Susun Ke Bawah (Tidak Sampingan) */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-7">
              <div className="w-full space-y-4 text-xs">
                {/* 1. Retur / Penukaran Unit Info Banner (Jika ada) */}
                {returnReq && (
                  <div className="space-y-3 rounded-2xl border border-blue-200/90 bg-blue-50/70 p-4 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-2.5 dark:border-blue-900/60">
                      <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-100">
                        <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-bold">
                          {isReplacement
                            ? 'Klaim Garansi: Penukaran Unit Baru'
                            : 'Klaim Garansi: Retur & Refund Dana'}
                        </span>
                      </div>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900/80 dark:text-blue-200">
                        {returnReq.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Kendala:{' '}
                      <strong>
                        {returnReq.reasonLabel ||
                          returnReq.reason ||
                          'Klaim Garansi'}
                      </strong>
                    </p>

                    {returnReq.returnTrackingNumber && (
                      <div className="flex items-center justify-between rounded-xl bg-white/80 p-2.5 dark:bg-slate-900/60">
                        <span className="font-mono text-xs">
                          Resi Kirim Balik: {returnReq.returnCourier || 'JNE'} —{' '}
                          {returnReq.returnTrackingNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCheckResiQuery(
                              returnReq.returnTrackingNumber || ''
                            )
                            setShowCheckResiModal(true)
                          }}
                          className="rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
                        >
                          Lacak Resi
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Bonus 3-in-1 Callout */}
                <div className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  <Gift className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Bonus 3-in-1 Gratis: Charger, Tempered Glass &amp; Softcase
                  </span>
                </div>

                {/* 3. Informasi Pembayaran Terpadu — Rincian Produk, Komponen Potongan & Estimasi Penghasilan */}
                <AdminOrderPaymentCard order={order as any} />

                {/* 4. Penerima & Pengiriman */}
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Penerima &amp; Pengiriman
                  </span>

                  <div className="space-y-2.5 rounded-xl border border-slate-200/80 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {recipientName}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {recipientPhone}
                        </p>
                      </div>
                      {recipientPhone !== '-' && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(recipientPhone)
                            toast.success('Nomor penerima disalin!')
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Salin</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                      <p className="text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                        {deliveryAddress}
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-slate-400">
                        {[
                          order.user?.city,
                          order.user?.province,
                          order.user?.postalCode,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                          Ekspedisi
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {courierDisplay}
                        </span>
                      </div>
                      {order.trackingNumber ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {order.trackingNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyAWB(order.trackingNumber!)}
                            className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            title="Salin Resi"
                          >
                            {copiedAWB ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            title="Cetak Label Thermal"
                            onClick={() => handleOpenThermalLabel(order)}
                            className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          >
                            <Printer className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Menunggu Pick Up
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Customer Account & Chat */}
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/30">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900 dark:text-white">
                      {order.user?.name || 'Customer'}
                    </p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {order.user?.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isConnectingChat}
                    onClick={handleChatCustomer}
                    className="shadow-2xs inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {isConnectingChat ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span>Hubungi via Chat</span>
                  </button>
                </div>
              </div>

              {/* Live Tracking Card (if toggled) */}
              {showLiveTracker && (
                <div className="mt-4 space-y-2 rounded-3xl border border-blue-100 bg-blue-50/20 p-3.5 dark:border-blue-950 dark:bg-blue-950/10 sm:p-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        Pelacakan Kurir Real-Time
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLiveTracker(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Tutup Lacak
                    </button>
                  </div>
                  <LiveCourierTracker orderId={order.id} />
                </div>
              )}
            </div>

            {/* 3. Footer Dialog Sticky Bottom Action Bar */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800/40 sm:px-7">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="shadow-2xs rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Tutup
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {order.status === 'PENDING_PAYMENT' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('PAID')}
                    disabled={updatingId === order.id}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    {updatingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>Konfirmasi Pembayaran Lunas</span>
                  </button>
                )}

                {order.status === 'PAID' && (
                  <button
                    type="button"
                    onClick={handleRequestPickup}
                    disabled={requestingPickupId === order.id}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    {requestingPickupId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    <span>
                      Request Pick Up (
                      {order.courierCode === 'GOJEK' ? 'Gojek Instant' : 'JNE'})
                    </span>
                  </button>
                )}

                {order.status === 'IN_PROGRESS' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('SHIPPED')}
                    disabled={updatingId === order.id}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    {updatingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4" />
                    )}
                    <span>Tandai Telah Diserahkan ke Kurir</span>
                  </button>
                )}

                {order.status === 'SHIPPED' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    disabled={updatingId === order.id}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    {updatingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>Tandai Selesai &amp; Diterima</span>
                  </button>
                )}

                {order.status === 'COMPLETED' && (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Pesanan Telah Selesai</span>
                  </div>
                )}

                {order.status === 'CANCELLED' && (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                    <X className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    <span>Pesanan Dibatalkan</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Printable Thermal Shipping Label Modal */}
      {activeThermalLabel && (
        <ThermalShippingLabel
          data={activeThermalLabel}
          onClose={() => setActiveThermalLabel(null)}
        />
      )}

      {/* Live Biteship AWB Tracking Modal */}
      {showCheckResiModal && (
        <CheckResiModal
          isOpen={showCheckResiModal}
          onClose={() => setShowCheckResiModal(false)}
          initialQuery={checkResiQuery}
        />
      )}
    </>
  )
}
