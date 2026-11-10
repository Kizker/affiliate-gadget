'use client'

import {
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  CheckCircle,
  RotateCcw,
  Star,
  MessageCircle,
  Ban,
  Play,
} from 'lucide-react'
import { CustomerPaymentBreakdown } from './customer-payment-breakdown'
import Link from 'next/link'
import Image from 'next/image'
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
  onOpenMedia?: (index: number) => void
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
  onOpenMedia,
  onPayNow,
  onConfirmReceived,
  onOpenReturn,
  onOpenComplaint,
  onOpenRating,
  onOpenCancel,
}: OrderDesktopPaymentCardProps) {
  return (
    <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      {/* Informasi Pembayaran Transparan */}
      <CustomerPaymentBreakdown order={order} showStatusBadge={true} />

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

        {canRequestReturnOrComplaint && !hasActiveClaim && isCompleted && (
          <button
            onClick={onOpenReturn}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-orange-500/30 bg-orange-50/70 py-3 text-xs font-bold text-orange-600 transition hover:bg-orange-100 active:scale-95 dark:border-orange-500/40 dark:bg-orange-950/30 dark:text-orange-400"
          >
            <ShieldCheck className="h-4 w-4 text-orange-600 dark:text-orange-500" />
            <span>Ajukan Komplain / Klaim Garansi</span>
          </button>
        )}

        {canRequestReturnOrComplaint && !hasActiveClaim && !isCompleted && (
          <button
            onClick={onOpenComplaint}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            <span>Laporkan Kendala Pesanan</span>
          </button>
        )}

        {/* Submitted Review Card */}
        {currentReview && (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Ulasan Anda
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${
                      s <= currentReview.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            {currentReview.comment && (
              <p className="line-clamp-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                &ldquo;{currentReview.comment}&rdquo;
              </p>
            )}
            {((currentReview.images && currentReview.images.length > 0) ||
              (currentReview.videos && currentReview.videos.length > 0)) && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                {currentReview.images?.map((url, i) => (
                  <button
                    key={`rev-img-${i}`}
                    type="button"
                    onClick={() => onOpenMedia?.(i)}
                    className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 transition hover:opacity-90 dark:border-slate-800"
                  >
                    <Image
                      src={url}
                      alt="Foto ulasan"
                      fill
                      sizes="48px"
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
                      className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-orange-300 bg-slate-950 dark:border-orange-800"
                    >
                      <video
                        src={url}
                        className="h-full w-full object-cover opacity-60"
                      />
                      <Play className="absolute h-3.5 w-3.5 fill-white text-white" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
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

        {/* Chat Direct Action */}
        <Link
          href={`/dashboard/customer/chat?${chatParams.toString()}${
            isCompleted ? '&type=after_sales' : ''
          }`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200"
        >
          <MessageCircle className="h-4 w-4 text-slate-500" />
          <span>
            {isCompleted ? 'Chat Admin After Sales' : 'Chat Toko Cabang'}
          </span>
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
