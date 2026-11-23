'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Check,
  RotateCcw,
  Clock,
  Star,
  Play,
  Ban,
  MessageCircle,
  ShieldCheck,
  Truck,
  MapPin,
  CheckCircle2,
  Search,
  XCircle,
  MessageSquare,
  Copy,
  Printer,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  OrderData,
  OrderDetailItem,
  OrderReturnRequest,
  OrderComplaint,
  OrderReview,
  StatusBadgeInfo,
  DEFAULT_GADGET_IMAGE,
  formatPrice,
} from './order-detail-types'
import { AuditTimelineStep } from './order-desktop-audit-timeline-card'
import { CustomerPaymentBreakdown } from './customer-payment-breakdown'

interface OrderMobileViewProps {
  order: OrderData
  copied: boolean
  copyOrderNumber: () => void
  currentStatus: StatusBadgeInfo
  contextualTime: {
    label: string
    fullDateTime: string
  }
  latestReturnRequest: OrderReturnRequest | null
  latestComplaint: OrderComplaint | null
  returnTrackingNumber: string
  setReturnTrackingNumber: (val: string) => void
  returnCourier?: string
  setReturnCourier?: (val: string) => void
  handleSaveReturnTracking: () => void
  isSavingReturnTracking: boolean
  onOpenResiModal: (waybill: string, courier: string) => void
  handleViewThermalLabel: () => void
  handleViewReturnThermalLabel?: () => void
  viewingLabel: boolean
  auditTimeline: AuditTimelineStep[]
  chatParams: URLSearchParams
  canCancel: boolean
  canConfirmReceived: boolean
  isCompleted: boolean
  hasActiveClaim: boolean
  canRequestReturnOrComplaint: boolean
  isConfirming: boolean
  currentReview: OrderReview | null
  onOpenMedia?: (index: number) => void
  onPayNow: () => void
  onConfirmReceived: () => void
  onOpenReturn: () => void
  onOpenReturnForItem?: (item: OrderDetailItem) => void
  onOpenComplaint: () => void
  onOpenRating: () => void
  onOpenRatingForItem?: (item: OrderDetailItem) => void
  onOpenCancel: () => void
}

export function OrderMobileView({
  order,
  copied,
  copyOrderNumber,
  currentStatus,
  contextualTime,
  latestReturnRequest,
  latestComplaint,
  returnTrackingNumber,
  setReturnTrackingNumber,
  returnCourier = 'JNE',
  setReturnCourier,
  handleSaveReturnTracking,
  isSavingReturnTracking,
  onOpenResiModal,
  handleViewThermalLabel,
  handleViewReturnThermalLabel,
  viewingLabel,
  auditTimeline,
  chatParams,
  canCancel,
  canConfirmReceived,
  isCompleted,
  hasActiveClaim,
  canRequestReturnOrComplaint,
  isConfirming,
  currentReview,
  onOpenMedia,
  onPayNow,
  onConfirmReceived,
  onOpenReturn,
  onOpenReturnForItem,
  onOpenComplaint,
  onOpenRating,
  onOpenRatingForItem,
  onOpenCancel,
}: OrderMobileViewProps) {
  const totalItemCount = order.items.reduce(
    (acc, it) => acc + (it.quantity || 1),
    0
  )
  const isReturnedOrder =
    order.status === 'RETURNED' || Boolean(latestReturnRequest)
  const showCompletedBadge = isCompleted && !isReturnedOrder
  const subtotalAmount =
    order.subtotal ||
    order.items.reduce(
      (sum, it) => sum + (it.subtotal || it.price * it.quantity),
      0
    )

  return (
    <div className="block space-y-3.5 pb-6 md:hidden">
      {/* ── CARD 1: IDENTITAS PESANAN ───────────────────────────── */}
      <div className="shadow-xs rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              No. Pesanan
            </span>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                #{order.orderNumber}
              </span>
              <button
                type="button"
                onClick={copyOrderNumber}
                className="cursor-pointer text-xs font-medium text-slate-400 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {copied ? 'Tersalin' : 'Salin'}
              </button>
            </div>
          </div>

          <div
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
              showCompletedBadge
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : currentStatus.badgeBg
            }`}
          >
            {showCompletedBadge ? 'Selesai' : currentStatus.label}
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400">
            Waktu Transaksi
          </span>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {contextualTime.fullDateTime}
          </span>
        </div>
      </div>

      {/* ── CARD 2: PRODUK DIPESAN ──────────────────────────────── */}
      <div className="shadow-xs rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            PRODUK DIPESAN
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {totalItemCount} Barang
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {order.items.map((item) => {
            const itemImage =
              item.product?.images?.[0] ||
              item.rentalItem?.images?.[0] ||
              DEFAULT_GADGET_IMAGE
            const itemLink = item.product ? `/gadget/${item.product.slug}` : '#'

            return (
              <div
                key={item.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800/80">
                  <img
                    src={itemImage}
                    alt={item.product?.name || 'Gadget'}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_GADGET_IMAGE
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={itemLink}
                    className="line-clamp-1 block text-sm font-bold text-slate-900 transition hover:text-orange-500 dark:text-white"
                  >
                    {item.product?.name ||
                      item.service?.name ||
                      item.notes ||
                      'Unit Gadget Original'}
                  </Link>
                  {item.variantName && (
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-400">
                      {item.variantName.replace(/,/g, ' •')}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-400">
                      {item.quantity}x
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatPrice(item.subtotal || item.price * item.quantity)}
                    </span>
                  </div>
                  {order.items.length > 1 && (
                    <div className="mt-2.5 flex flex-wrap items-center justify-end gap-1.5 border-t border-slate-100/80 pt-2 dark:border-slate-800/80">
                      {canRequestReturnOrComplaint &&
                        !hasActiveClaim &&
                        isCompleted && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenReturnForItem
                                ? onOpenReturnForItem(item)
                                : onOpenReturn()
                            }
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-orange-200/80 bg-orange-50/80 px-2.5 py-1 text-[11px] font-bold text-orange-600 transition hover:bg-orange-100 active:scale-95 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Ajukan Retur Unit Ini</span>
                          </button>
                        )}

                      {isCompleted && !latestReturnRequest && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenRatingForItem
                              ? onOpenRatingForItem(item)
                              : onOpenRating()
                          }
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>Ulasan</span>
                        </button>
                      )}

                      {(() => {
                        const prod =
                          item.product || item.rentalItem || item.service
                        const itemChatParams = new URLSearchParams()
                        itemChatParams.set('orderId', order.id)
                        if (order.store?.id)
                          itemChatParams.set('storeId', order.store.id)
                        if (order.orderNumber)
                          itemChatParams.set('orderNumber', order.orderNumber)
                        if (prod?.name)
                          itemChatParams.set('productName', prod.name)
                        const mobileProdImg = (prod as any)?.images?.[0]
                        if (mobileProdImg)
                          itemChatParams.set('productImage', mobileProdImg)
                        if (item.price)
                          itemChatParams.set('productPrice', String(item.price))
                        if (item.variantName)
                          itemChatParams.set('variantName', item.variantName)
                        if (isCompleted)
                          itemChatParams.set('type', 'after_sales')

                        return (
                          <Link
                            href={`/dashboard/customer/chat?${itemChatParams.toString()}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200"
                          >
                            <MessageCircle className="h-3 w-3 text-slate-500" />
                            <span>Chat</span>
                          </Link>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bonus Tambahan Row */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400">
            Bonus Tambahan
          </span>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            Paket Aksesoris 3-in-1 (Gratis)
          </span>
        </div>
      </div>

      {/* ── CARD 3: PENGIRIMAN ──────────────────────────────────── */}
      <div className="shadow-xs rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            PENGIRIMAN
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Toko Penjual
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {order.store?.name || 'Affiliate Gadget WTC Surabaya'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Kurir & Layanan
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {order.courierCode || 'JNE'} {order.courierService || 'YES'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">No. Resi</span>
            {order.trackingNumber ? (
              <button
                type="button"
                onClick={() =>
                  onOpenResiModal(
                    order.trackingNumber || '',
                    order.courierCode || 'JNE'
                  )
                }
                className="cursor-pointer font-mono font-bold text-slate-900 hover:text-orange-500 dark:text-white dark:hover:text-orange-400"
                title="Cek Lacak Resi"
              >
                {order.trackingNumber}
              </button>
            ) : (
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                -
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400">
              Status Pengiriman
            </span>
            <span className="shrink-0 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
              {showCompletedBadge ? 'Telah Diterima' : currentStatus.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD 4: RINCIAN PEMBAYARAN ──────────────────────────── */}
      <div className="shadow-xs rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <CustomerPaymentBreakdown
          order={order}
          title="RINCIAN PEMBAYARAN"
          showStatusBadge={false}
        />
        {/* Pos biaya transparan: Subtotal Produk, Ongkos Kirim Kurir, Asuransi Pengiriman 100%, Total Pembayaran */}
      </div>

      {/* ── CARD 5: RIWAYAT TRANSAKSI ───────────────────────────── */}
      <div className="shadow-xs rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              RIWAYAT TRANSAKSI
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap text-xs font-bold text-slate-700 dark:text-slate-300">
            {showCompletedBadge ? 'Diterima' : currentStatus.label}
          </span>
        </div>

        <div className="space-y-4">
          {auditTimeline.map((step, idx) => {
            const isLast = idx === auditTimeline.length - 1

            return (
              <div key={step.key} className="relative flex items-start gap-3">
                {/* Vertical connecting line */}
                {!isLast && (
                  <div
                    className={`absolute bottom-0 left-[9px] top-5 w-0.5 ${
                      step.isPassed
                        ? 'bg-emerald-200 dark:bg-emerald-900/60'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}

                {/* Indicator Icon */}
                <div
                  className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                    step.isCurrent
                      ? isCompleted
                        ? 'bg-orange-600'
                        : 'bg-orange-500 ring-2 ring-orange-200'
                      : step.isPassed
                        ? 'bg-emerald-500'
                        : 'border border-slate-200 bg-slate-100 text-slate-400'
                  }`}
                >
                  {step.isPassed || step.isCurrent ? (
                    <Check className="h-3 w-3 stroke-[3]" />
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Text Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </span>
                    {step.dateFormatted && (
                      <span className="text-[11px] font-normal text-slate-400">
                        {step.dateFormatted}
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ACTION BUTTONS ───────────────────────────────────────── */}
      <div className="space-y-2.5 pt-1">
        {/* Existing Review Card (if already reviewed) */}
        {currentReview && (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Ulasan Anda
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3 w-3 ${
                      s <= currentReview.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            {currentReview.comment && (
              <p className="line-clamp-3 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                &ldquo;{currentReview.comment}&rdquo;
              </p>
            )}
            {((currentReview.images && currentReview.images.length > 0) ||
              (currentReview.videos && currentReview.videos.length > 0)) && (
              <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
                {currentReview.images?.map((url, i) => (
                  <button
                    key={`rev-img-${i}`}
                    type="button"
                    onClick={() => onOpenMedia?.(i)}
                    className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 transition hover:opacity-90 dark:border-slate-800"
                  >
                    <Image
                      src={url}
                      alt="Foto ulasan"
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </button>
                ))}
                {currentReview.videos?.map((url, i) => {
                  const mediaIdx = (currentReview.images?.length || 0) + i
                  return (
                    <button
                      key={`rev-vid-${i}`}
                      type="button"
                      onClick={() => onOpenMedia?.(mediaIdx)}
                      className="relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-orange-300 bg-slate-950 dark:border-orange-800"
                    >
                      <video
                        src={url}
                        className="h-full w-full object-cover opacity-60"
                      />
                      <Play className="absolute h-3 w-3 fill-white text-white" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Status Pengajuan Retur / Komplain Aktif */}
        {latestReturnRequest && (
          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {latestReturnRequest.type === 'REFUND'
                    ? 'Pengajuan Refund: Pengembalian Dana'
                    : 'Pengajuan Retur: Tukar Unit'}
                </span>
              </div>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {latestReturnRequest.status === 'APPROVED'
                  ? 'Disetujui'
                  : latestReturnRequest.status === 'COMPLETED'
                    ? 'Selesai'
                    : latestReturnRequest.status === 'REJECTED'
                      ? 'Ditolak'
                      : latestReturnRequest.status === 'IN_REVIEW'
                        ? 'Ditinjau / Menunggu QC'
                        : 'Menunggu Verifikasi'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kendala:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {latestReturnRequest.reasonLabel || latestReturnRequest.reason}
              </strong>
            </p>

            {/* If APPROVED: Show Store Return Address & Resi Input */}
            {latestReturnRequest.status === 'APPROVED' && (
              <div className="space-y-2.5 border-t border-slate-200/70 pt-2.5 dark:border-slate-700">
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-3 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950 dark:text-blue-100">
                    <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Alamat Toko Cabang Tujuan Retur</span>
                  </div>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {order.store?.name || 'Toko Cabang Affiliate Gadget'}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {order.store?.address || 'Alamat fisik cabang pengirim'}
                    {order.store?.city ? `, ${order.store.city}` : ''}
                  </p>
                  {order.store?.phone && (
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                      Kontak: {order.store.phone}
                    </p>
                  )}
                </div>

                {latestReturnRequest.returnTrackingNumber ? (
                  <div className="shadow-2xs rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <Truck className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
                        <span>Resi Retur Resmi (Cashless)</span>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9.5px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Gratis / Escrow
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400">
                            No. Resi (AWB){' '}
                            {latestReturnRequest.returnCourier || 'JNE'}:
                          </span>
                          <div className="mt-0.5 font-mono text-sm font-black text-slate-900 dark:text-white">
                            {latestReturnRequest.returnTrackingNumber}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              latestReturnRequest.returnTrackingNumber!
                            )
                            toast.success('Nomor resi retur disalin!')
                          }}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Salin</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {handleViewReturnThermalLabel && (
                          <button
                            type="button"
                            onClick={handleViewReturnThermalLabel}
                            disabled={viewingLabel}
                            className="shadow-2xs flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          >
                            <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                            <span>
                              {viewingLabel
                                ? 'Menyiapkan...'
                                : 'Cetak Air Waybill'}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onOpenResiModal(
                              latestReturnRequest.returnTrackingNumber!,
                              latestReturnRequest.returnCourier || 'JNE'
                            )
                          }
                          className="shadow-2xs flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        >
                          <Search className="h-3.5 w-3.5" />
                          <span>Lacak Pengiriman Balik (Live)</span>
                        </button>
                      </div>

                      <div className="rounded-lg border border-slate-200/70 bg-slate-50/70 p-2 text-[10.5px] leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                        Tunjukkan no. resi ini ke gerai{' '}
                        <strong>
                          {latestReturnRequest.returnCourier || 'JNE'}
                        </strong>{' '}
                        terdekat atau cetak air waybill. Ongkos kirim tercover
                        otomatis oleh escrow garansi (Gratis / Cashless).
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-orange-200/80 bg-orange-50/60 p-3 text-xs dark:border-orange-900/60 dark:bg-orange-950/30">
                    <div className="flex items-center gap-1.5 font-bold text-orange-950 dark:text-orange-100">
                      <Truck className="h-3.5 w-3.5 text-orange-600" />
                      <span>Input Resi Pengiriman Balik</span>
                    </div>
                    <div className="mt-2 space-y-2">
                      <select
                        value={returnCourier || 'JNE'}
                        onChange={(e) => setReturnCourier?.(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="JNE">JNE Express</option>
                        <option value="J&T">J&T Express</option>
                        <option value="SICEPAT">SiCepat</option>
                        <option value="GOJEK">Gojek Instant</option>
                        <option value="GRAB">Grab Express</option>
                        <option value="ANTERAJA">Anteraja</option>
                        <option value="POS">Pos Indonesia</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Nomor resi balik..."
                        value={returnTrackingNumber}
                        onChange={(e) =>
                          setReturnTrackingNumber(e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        onClick={handleSaveReturnTracking}
                        disabled={
                          isSavingReturnTracking || !returnTrackingNumber.trim()
                        }
                        className="w-full rounded-lg bg-orange-600 py-2 text-xs font-bold text-white transition hover:bg-orange-700 disabled:opacity-50"
                      >
                        {isSavingReturnTracking
                          ? 'Menyimpan...'
                          : 'Kirim Resi Pengembalian'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If REJECTED: Show rejection reason clearly */}
            {latestReturnRequest.status === 'REJECTED' && (
              <div className="space-y-2 border-t border-rose-200/60 pt-2.5 dark:border-rose-900/40">
                <div className="rounded-xl border border-rose-200/70 bg-rose-50/80 p-3 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                  <div className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <div className="flex-1">
                      <p className="font-bold text-rose-950 dark:text-rose-100">
                        Pengajuan Retur Ditolak
                      </p>
                      <p className="mt-1 leading-relaxed text-rose-800/90 dark:text-rose-300/90">
                        {latestReturnRequest.storeResponse
                          ? latestReturnRequest.storeResponse.replace(
                              /\[Ditolak After Sales\]\s*/g,
                              ''
                            )
                          : 'Pengajuan tidak memenuhi syarat verifikasi garansi toko.'}
                      </p>
                    </div>
                  </div>
                </div>
                <a
                  href={`/dashboard/customer/chat/admin/${order.id}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50/70 py-2 text-xs font-bold text-orange-600 transition hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Hubungi Admin After Sales</span>
                </a>
              </div>
            )}

            {/* If IN_REVIEW & has tracking number */}
            {latestReturnRequest.status === 'IN_REVIEW' &&
              latestReturnRequest.returnTrackingNumber &&
              (latestReturnRequest.packageReceivedAt ||
              latestReturnRequest.storeResponse?.includes(
                '[Paket Fisik Tiba di Cabang]'
              ) ? (
                <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-3 text-xs text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-100">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Paket Tiba di Toko Cabang &bull; Sedang QC</span>
                    </div>
                    <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9.5px] font-bold text-indigo-700 dark:bg-slate-900 dark:text-indigo-200">
                      QC Fisik
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-indigo-800/90 dark:text-indigo-300/90">
                    Unit telah diterima di toko cabang dan sedang menjalani
                    pemeriksaan teknis (QC) sebelum solusi akhir diproses.
                  </p>
                  {latestReturnRequest.qcNotes && (
                    <p className="mt-1.5 rounded-lg bg-white/70 p-2 text-[10px] italic text-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                      Catatan Teknisi: &ldquo;{latestReturnRequest.qcNotes}
                      &rdquo;
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 font-bold text-blue-950 dark:text-blue-100">
                      <Truck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Unit Sedang Menuju Toko</span>
                    </div>
                    <span className="font-mono font-bold text-blue-900 dark:text-blue-200">
                      {latestReturnRequest.returnCourier || 'JNE'} -{' '}
                      {latestReturnRequest.returnTrackingNumber}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-blue-800/80 dark:text-blue-300/80">
                    Paket fisik dalam perjalanan. Tim After Sales & teknisi toko
                    akan segera melakukan verifikasi fisik (QC) setelah paket
                    tiba.
                  </p>
                  <div className="mt-2.5 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenResiModal(
                          latestReturnRequest.returnTrackingNumber!,
                          latestReturnRequest.returnCourier || 'JNE'
                        )
                      }
                      className="shadow-2xs inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>Lacak Kiriman Retur</span>
                    </button>
                  </div>
                </div>
              ))}

            {/* If COMPLETED */}
            {latestReturnRequest.status === 'COMPLETED' && (
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-xs text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 dark:text-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>
                    {latestReturnRequest.type === 'REFUND'
                      ? 'Refund Berhasil Dicairkan'
                      : 'Unit Baru Pengganti Telah Dikirim'}
                  </span>
                </div>
                {order.trackingNumber &&
                  latestReturnRequest.type !== 'REFUND' && (
                    <p className="mt-1 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Resi Unit Baru: {order.courierCode || 'JNE'} —{' '}
                      {order.trackingNumber}
                    </p>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Tombol ulasan, komplain, dan chat di bawah HANYA tampil jika pembelian 1 produk (order.items.length <= 1). Jika multi-produk (> 1), aksi berada di masing-masing produk */}
        {order.items.length <= 1 && (
          <>
            {showCompletedBadge && (
              <button
                type="button"
                onClick={onOpenRating}
                className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-[#0F172A] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.99] dark:bg-slate-900"
              >
                {currentReview ? 'Edit Ulasan Produk' : 'Beri Ulasan Produk'}
              </button>
            )}

            {/* Primary Action: Ajukan Komplain / Klaim Garansi */}
            {isCompleted && canRequestReturnOrComplaint && !hasActiveClaim && (
              <button
                type="button"
                onClick={onOpenReturn}
                className="shadow-2xs flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-orange-500/30 bg-orange-50/70 px-4 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-100 active:scale-[0.99] dark:border-orange-500/40 dark:bg-orange-950/30 dark:text-orange-400"
              >
                <ShieldCheck className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                <span>Ajukan Komplain / Klaim Garansi</span>
              </button>
            )}

            {!isCompleted && canRequestReturnOrComplaint && !hasActiveClaim && (
              <button
                type="button"
                onClick={onOpenComplaint}
                className="shadow-2xs flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                Laporkan Kendala Pesanan
              </button>
            )}

            {/* Chat Action */}
            <Link
              href={`/dashboard/customer/chat?${chatParams.toString()}${
                isCompleted ? '&type=after_sales' : ''
              }`}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <MessageCircle className="h-3.5 w-3.5 text-slate-500" />
              <span>
                {isCompleted ? 'Chat Admin After Sales' : 'Chat Toko Cabang'}
              </span>
            </Link>
          </>
        )}

        {/* Cancel Order (if eligible) */}
        {canCancel && (
          <button
            type="button"
            onClick={onOpenCancel}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-400 transition hover:text-rose-600"
          >
            <Ban className="h-3.5 w-3.5" />
            <span>Batalkan Pesanan</span>
          </button>
        )}
      </div>
    </div>
  )
}
