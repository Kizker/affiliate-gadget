'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Check,
  Copy,
  RotateCcw,
  ShieldCheck,
  Gift,
  Building2,
  Truck,
  ChevronDown,
  Search,
  Printer,
  Tag,
  Clock,
  ShoppingBag,
  CreditCard,
  CheckCircle,
  Star,
  MessageCircle,
  Ban,
} from 'lucide-react'
import {
  OrderData,
  OrderReturnRequest,
  OrderComplaint,
  OrderReview,
  StatusBadgeInfo,
  DEFAULT_GADGET_IMAGE,
  formatPrice,
} from './order-detail-types'
import { AuditTimelineStep } from './order-desktop-audit-timeline-card'
import { LiveCourierTracker } from '@/components/shipping/live-courier-tracker'

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
  handleSaveReturnTracking: () => void
  isSavingReturnTracking: boolean
  onOpenResiModal: (waybill: string, courier: string) => void
  handleViewThermalLabel: () => void
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
  onPayNow: () => void
  onConfirmReceived: () => void
  onOpenReturn: () => void
  onOpenComplaint: () => void
  onOpenRating: () => void
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
  handleSaveReturnTracking,
  isSavingReturnTracking,
  onOpenResiModal,
  handleViewThermalLabel,
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
  onPayNow,
  onConfirmReceived,
  onOpenReturn,
  onOpenComplaint,
  onOpenRating,
  onOpenCancel,
}: OrderMobileViewProps) {
  const [isTrackingDropdownOpen, setIsTrackingDropdownOpen] = useState(false)

  return (
    <div className="block md:hidden">
      {/* Mobile Unified Layout: 1 Bagian Saja (Single Integrated Card) */}
      <div className="shadow-2xs divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {/* Bagian 1: Identitas & Status Pesanan */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-mono text-sm font-bold tracking-tight text-slate-950 dark:text-white">
                #{order.orderNumber}
              </span>
              <button
                onClick={copyOrderNumber}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
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
            <div
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${currentStatus.badgeBg}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${currentStatus.dotColor}`}
              />
              <span>{currentStatus.label}</span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>
                <span className="text-slate-400 dark:text-slate-500">
                  {contextualTime.label}:{' '}
                </span>
                {contextualTime.fullDateTime}
              </span>
            </span>
            <span>•</span>
            <span>{order.store?.ptName || 'PT Resmi Terverifikasi'}</span>
          </div>

          {order.trackingNumber && (
            <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60">
              <span className="text-slate-500">No. Resi Kurir:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {order.trackingNumber} ({order.courierCode || 'JNE'}{' '}
                {order.courierService || 'REG'})
              </span>
            </div>
          )}
        </div>

        {/* Bagian 2: Permohonan Retur (jika ada) */}
        {latestReturnRequest && (
          <div className="bg-slate-50/40 p-4 dark:bg-slate-800/20">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {latestReturnRequest.type === 'REFUND'
                    ? 'Pengembalian Dana (Refund)'
                    : 'Penggantian Unit Baru'}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                  latestReturnRequest.status === 'APPROVED' ||
                  latestReturnRequest.status === 'COMPLETED'
                    ? 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    : latestReturnRequest.status === 'REJECTED'
                      ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    latestReturnRequest.status === 'APPROVED' ||
                    latestReturnRequest.status === 'COMPLETED'
                      ? 'bg-slate-700 dark:bg-slate-300'
                      : latestReturnRequest.status === 'REJECTED'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                  }`}
                />
                <span>
                  {latestReturnRequest.status === 'APPROVED'
                    ? 'Disetujui'
                    : latestReturnRequest.status === 'COMPLETED'
                      ? 'Selesai'
                      : latestReturnRequest.status === 'REJECTED'
                        ? 'Ditolak'
                        : latestReturnRequest.status === 'IN_REVIEW'
                          ? 'Ditinjau'
                          : 'Verifikasi'}
                </span>
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <p>
                Kendala:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {latestReturnRequest.reasonLabel ||
                    latestReturnRequest.reason}
                </strong>
              </p>
              {latestReturnRequest.refundAmount && (
                <p>
                  Nilai Refund:{' '}
                  <strong className="font-mono text-slate-900 dark:text-white">
                    {formatPrice(latestReturnRequest.refundAmount)}
                  </strong>
                </p>
              )}
              {latestReturnRequest.status === 'APPROVED' && (
                <div className="mt-2 border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
                  {latestReturnRequest.returnTrackingNumber ? (
                    <p className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                      Resi Balik: {latestReturnRequest.returnCourier || 'JNE'} -{' '}
                      {latestReturnRequest.returnTrackingNumber}
                    </p>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Resi pengiriman balik..."
                        value={returnTrackingNumber}
                        onChange={(e) =>
                          setReturnTrackingNumber(e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        onClick={handleSaveReturnTracking}
                        disabled={isSavingReturnTracking}
                        className="shrink-0 rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950"
                      >
                        {isSavingReturnTracking ? '...' : 'Simpan'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bagian 3: Komplain / Garansi (jika ada) */}
        {latestComplaint && (
          <div className="bg-slate-50/40 p-4 dark:bg-slate-800/20">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Klaim Garansi 30 Hari
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    latestComplaint.status === 'RESOLVED'
                      ? 'bg-slate-700 dark:bg-slate-300'
                      : latestComplaint.status === 'REJECTED'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                  }`}
                />
                <span>
                  {latestComplaint.status === 'RESOLVED'
                    ? 'Disetujui'
                    : latestComplaint.status === 'REJECTED'
                      ? 'Ditolak'
                      : 'Pemeriksaan'}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {latestComplaint.subject}: {latestComplaint.description}
            </p>
          </div>
        )}

        {/* Bagian 4: Rincian Unit Gadget & Toko */}
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Rincian Unit Gadget
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {order.items.reduce((acc, it) => acc + it.quantity, 0)} Unit
            </span>
          </div>

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
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/60">
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
                    {item.product?.brand && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {item.product.brand}
                      </span>
                    )}
                    <Link
                      href={itemLink}
                      className="line-clamp-2 block text-xs font-bold text-slate-900 transition hover:text-slate-600 dark:text-white"
                    >
                      {item.product?.name ||
                        item.service?.name ||
                        item.notes ||
                        'Unit Gadget Original'}
                    </Link>
                    {item.variantName && (
                      <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Varian: {item.variantName}
                      </span>
                    )}
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">
                        {item.quantity} unit × {formatPrice(item.price)}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
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
            <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Paket Bonus 3-in-1 Gratis (Rp 0)
                  </span>
                </div>
                <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Termasuk
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 shrink-0 text-slate-500" />
                  <span>Fast Charger Set</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 shrink-0 text-slate-500" />
                  <span>Antigores Terpasang</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 shrink-0 text-slate-500" />
                  <span>Premium Softcase</span>
                </div>
              </div>
            </div>
          )}

          {/* Toko & Kurir Info Strip */}
          <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>
                Toko:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {order.store?.name || 'Roxy Mas Jakarta'}
                </strong>{' '}
                ({order.store?.city || 'Jakarta'})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>
                Kurir:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {order.courierCode || 'JNE'} {order.courierService || 'REG'}
                </strong>{' '}
                •{' '}
                {order.status === 'CANCELLED' ? (
                  <span className="font-semibold text-rose-600">
                    Pengiriman Dibatalkan
                  </span>
                ) : (
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    100% Asuransi Wajib
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Bagian 5: Pelacakan Kurir (Dropdown Accordion) */}
        <div className="p-4">
          {order.status === 'CANCELLED' ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Pesanan Dibatalkan
                </span>
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  Tidak Diproses
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {order.notes?.includes('[Batal Otomatis Sistem]')
                  ? 'Pesanan otomatis dibatalkan karena batas waktu pembayaran habis.'
                  : 'Pesanan telah dibatalkan. Pengiriman kurir tidak dilanjutkan.'}
              </p>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setIsTrackingDropdownOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-left transition hover:opacity-80"
                aria-expanded={isTrackingDropdownOpen}
              >
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Pelacakan Pengiriman & Kurir
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">
                    {order.trackingNumber
                      ? order.trackingNumber
                      : 'Resi terbit saat pick up'}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      isTrackingDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {isTrackingDropdownOpen && (
                <div className="mt-3.5 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {order.trackingNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Resi:{' '}
                        <strong className="font-mono text-slate-800 dark:text-slate-200">
                          {order.trackingNumber}
                        </strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onOpenResiModal(
                              order.trackingNumber || '',
                              order.courierCode || 'JNE'
                            )
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                        >
                          <Search className="h-3 w-3 text-blue-600" />
                          <span>Cek Resi (Live)</span>
                        </button>
                        <button
                          onClick={handleViewThermalLabel}
                          disabled={viewingLabel}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Printer className="h-3 w-3 text-slate-500" />
                          <span>{viewingLabel ? '...' : 'Thermal AWB'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                  <LiveCourierTracker orderId={order.id} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bagian 6: Ringkasan Pembayaran */}
        <div className="p-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Ringkasan Pembayaran
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  order.status === 'CANCELLED' ||
                  order.paymentStatus === 'CANCELLED' ||
                  order.paymentStatus === 'FAILED'
                    ? 'bg-rose-500'
                    : order.paymentStatus === 'PENDING'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
              />
              <span>
                {order.status === 'CANCELLED' ||
                order.paymentStatus === 'CANCELLED' ||
                order.paymentStatus === 'FAILED'
                  ? 'Dibatalkan'
                  : order.paymentStatus === 'PENDING'
                    ? 'Menunggu Bayar'
                    : 'Lunas'}
              </span>
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal Produk</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                {formatPrice(order.subtotal || order.total)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Ongkos Kirim Kurir</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                {order.shippingCost && order.shippingCost > 0
                  ? formatPrice(order.shippingCost)
                  : 'Gratis'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                Asuransi Pengiriman ({order.insuranceRate ?? 0.2}%)
                <ShieldCheck className="h-3 w-3 text-slate-400" />
              </span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                {order.insuranceFee && order.insuranceFee > 0
                  ? formatPrice(order.insuranceFee)
                  : 'Rp 0'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Paket Bonus 3-in-1</span>
              <span>Gratis (Rp 0)</span>
            </div>

            {Boolean(order.discountAmount && order.discountAmount > 0) && (
              <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3 text-slate-400" />
                  Diskon Voucher{' '}
                  {order.voucherCode ? `(${order.voucherCode})` : ''}
                </span>
                <span className="font-mono">
                  - {formatPrice(order.discountAmount)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Total Tagihan
              </span>
              <span className="font-mono text-base font-bold text-slate-950 dark:text-white">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {order.status !== 'CANCELLED' && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-[11px] dark:border-slate-800 dark:bg-slate-800/40">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white">
                  Garansi 30 Hari Resmi Toko
                </h5>
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                  Klaim tukar unit baru langsung di toko cabang jika terjadi
                  kendala teknis.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bagian Riwayat Waktu Transaksi (Mobile Audit Trail) */}
        <div className="bg-slate-50/50 p-4 dark:bg-slate-800/30">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>Riwayat Transaksi</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {contextualTime.label}
            </span>
          </div>

          <div className="mt-3.5 space-y-3">
            {auditTimeline.map((step, idx) => (
              <div key={step.key} className="relative flex items-start gap-3">
                {idx !== auditTimeline.length - 1 && (
                  <div
                    className={`absolute bottom-0 left-[9px] top-4 w-0.5 ${
                      step.isPassed
                        ? 'bg-emerald-200 dark:bg-emerald-900/60'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    step.isCurrent
                      ? 'shadow-xs bg-orange-500 text-white shadow-orange-500/30 ring-2 ring-orange-100 dark:ring-orange-950/60'
                      : step.isPassed
                        ? 'bg-emerald-500 text-white'
                        : 'border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                  }`}
                >
                  {step.isPassed ? (
                    <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <span
                      className={`text-xs font-bold ${
                        step.isPassed || step.isCurrent
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.dateFormatted && (
                      <span className="font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {step.dateFormatted}
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className="mt-0.5 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bagian 7: Aksi Pesanan */}
        <div className="space-y-2 p-4">
          {order.status === 'CANCELLED' && (
            <Link
              href="/gadget"
              className="shadow-xs flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Pesan Ulang di Katalog</span>
            </Link>
          )}

          {order.status === 'PENDING_PAYMENT' && (
            <button
              type="button"
              onClick={onPayNow}
              className="shadow-xs flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950"
            >
              <CreditCard className="h-4 w-4" />
              <span>Bayar Sekarang</span>
            </button>
          )}

          {canConfirmReceived && (
            <button
              onClick={onConfirmReceived}
              disabled={isConfirming}
              className="shadow-xs flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-950"
            >
              <CheckCircle className="h-4 w-4" />
              <span>
                {isConfirming
                  ? 'Mengonfirmasi...'
                  : 'Konfirmasi Pesanan Diterima'}
              </span>
            </button>
          )}

          {canRequestReturnOrComplaint && !hasActiveClaim && (
            <button
              onClick={onOpenReturn}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RotateCcw className="h-4 w-4 text-slate-500" />
              <span>Ajukan Pengembalian (Retur)</span>
            </button>
          )}

          {canRequestReturnOrComplaint && !hasActiveClaim && (
            <button
              onClick={onOpenComplaint}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <span>
                {isCompleted
                  ? 'Klaim Garansi 30 Hari'
                  : 'Laporkan Kendala / Komplain'}
              </span>
            </button>
          )}

          {isCompleted && !latestReturnRequest && (
            <button
              onClick={onOpenRating}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Star
                className={`h-4 w-4 ${currentReview ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`}
              />
              <span>
                {currentReview ? 'Ubah Ulasan Produk' : 'Beri Ulasan Produk'}
              </span>
            </button>
          )}

          <Link
            href={`/dashboard/customer/chat?${chatParams.toString()}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200"
          >
            <MessageCircle className="h-4 w-4 text-slate-500" />
            <span>Chat Toko Cabang</span>
          </Link>

          {canCancel && (
            <button
              onClick={onOpenCancel}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 pt-1 text-xs font-semibold text-slate-500 transition hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Batalkan Pesanan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
