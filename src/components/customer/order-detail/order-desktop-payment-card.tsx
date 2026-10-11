'use client'

import React from 'react'
import Link from 'next/link'
import {
  Receipt,
  ShieldCheck,
  Tag,
  ShoppingBag,
  CreditCard,
  CheckCircle,
  RotateCcw,
  Star,
  MessageCircle,
  Ban,
} from 'lucide-react'
import {
  OrderData,
  OrderReturnRequest,
  OrderReview,
  formatPrice,
} from './order-detail-types'

interface OrderDesktopPaymentCardProps {
  order: OrderData
  chatParams: URLSearchParams
  canCancel: boolean
  canConfirmReceived: boolean
  isCompleted: boolean
  hasActiveClaim: boolean
  canRequestReturnOrComplaint: boolean
  isConfirming: boolean
  latestReturnRequest: OrderReturnRequest | null
  currentReview: OrderReview | null
  onPayNow: () => void
  onConfirmReceived: () => void
  onOpenReturn: () => void
  onOpenComplaint: () => void
  onOpenRating: () => void
  onOpenCancel: () => void
}

export function OrderDesktopPaymentCard({
  order,
  chatParams,
  canCancel,
  canConfirmReceived,
  isCompleted,
  hasActiveClaim,
  canRequestReturnOrComplaint,
  isConfirming,
  latestReturnRequest,
  currentReview,
  onPayNow,
  onConfirmReceived,
  onOpenReturn,
  onOpenComplaint,
  onOpenRating,
  onOpenCancel,
}: OrderDesktopPaymentCardProps) {
  return (
    <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
        <h3 className="flex min-w-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <Receipt className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="truncate">Ringkasan Pembayaran</span>
        </h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300`}
        >
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
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {order.shippingCost && order.shippingCost > 0
              ? formatPrice(order.shippingCost)
              : 'Gratis'}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1">
            Asuransi Pengiriman ({order.insuranceRate ?? 0.2}%)
            <ShieldCheck className="h-3 w-3 text-slate-400" />
          </span>
          <span className="font-mono font-semibold text-slate-900 dark:text-white">
            {order.insuranceFee && order.insuranceFee > 0
              ? formatPrice(order.insuranceFee)
              : 'Rp 0'}
          </span>
        </div>

        <div className="flex items-center justify-between font-medium text-slate-600 dark:text-slate-400">
          <span>Paket Bonus 3-in-1</span>
          <span>Gratis (Rp 0)</span>
        </div>

        {Boolean(order.discountAmount && order.discountAmount > 0) && (
          <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3 text-slate-400" />
              Diskon Voucher {order.voucherCode ? `(${order.voucherCode})` : ''}
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
      {order.status !== 'CANCELLED' && (
        <div className="mt-5 flex items-start gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
              Garansi 30 Hari Resmi Toko
            </h5>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Klaim tukar unit pengganti langsung di toko jika terjadi kendala
              fungsional non-kelalaian.
            </p>
          </div>
        </div>
      )}

      {/* Persistent Action Panel on Right Rail */}
      <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 dark:border-slate-800">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Aksi Pesanan
        </span>

        {/* Pesan Ulang di Katalog (if cancelled) */}
        {order.status === 'CANCELLED' && (
          <Link
            href="/gadget"
            className="shadow-xs flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Pesan Ulang di Katalog</span>
          </Link>
        )}

        {/* Bayar Sekarang (if pending payment) */}
        {order.status === 'PENDING_PAYMENT' && (
          <button
            type="button"
            onClick={onPayNow}
            className="shadow-xs flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950"
          >
            <CreditCard className="h-4 w-4" />
            <span>Bayar Sekarang</span>
          </button>
        )}

        {canConfirmReceived && (
          <button
            onClick={onConfirmReceived}
            disabled={isConfirming}
            className="shadow-xs flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-950"
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RotateCcw className="h-4 w-4 text-slate-500" />
            <span>Ajukan Pengembalian (Retur)</span>
          </button>
        )}

        {canRequestReturnOrComplaint && !hasActiveClaim && (
          <button
            onClick={onOpenComplaint}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Star
              className={`h-4 w-4 ${currentReview ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`}
            />
            <span>
              {currentReview ? 'Ubah Ulasan Produk' : 'Beri Ulasan Produk'}
            </span>
          </button>
        )}

        {/* Chat Toko Direct Action */}
        <Link
          href={`/dashboard/customer/chat?${chatParams.toString()}`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200"
        >
          <MessageCircle className="h-4 w-4 text-slate-500" />
          <span>Chat Toko Cabang</span>
        </Link>

        {/* Batalkan Pesanan (if canCancel) */}
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
  )
}
