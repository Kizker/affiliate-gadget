'use client'

import React from 'react'
import Link from 'next/link'
import {
  XCircle,
  ShoppingBag,
  ArrowLeft,
  Truck,
  Printer,
  Clock,
} from 'lucide-react'
import { OrderData } from './order-detail-types'
import { LiveCourierTracker } from '@/components/shipping/live-courier-tracker'

interface OrderDesktopShippingCardProps {
  order: OrderData
  backHref: string
  handleViewThermalLabel: () => void
  viewingLabel: boolean
}

export function OrderDesktopShippingCard({
  order,
  backHref,
  handleViewThermalLabel,
  viewingLabel,
}: OrderDesktopShippingCardProps) {
  if (order.status === 'CANCELLED') {
    return (
      <div className="shadow-2xs rounded-3xl border border-rose-200 bg-rose-50/70 p-6 dark:border-rose-900/50 dark:bg-rose-950/30 sm:p-7">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
            <XCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                Pesanan Dibatalkan
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-100/70 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-900/50 dark:text-rose-300">
                Pengiriman Tidak Diproses
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-rose-700 dark:text-rose-300">
              {order.notes?.includes('[Batal Otomatis Sistem]')
                ? 'Pesanan ini otomatis dibatalkan karena batas waktu pembayaran telah habis. Pengiriman kurir ekspedisi dan penyiapan unit di toko fisik tidak dilanjutkan.'
                : 'Pesanan ini telah dibatalkan. Pengiriman kurir ekspedisi dan penyiapan unit di toko cabang fisik tidak dilanjutkan.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/gadget"
                className="shadow-xs inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Pesan Ulang di Katalog</span>
              </Link>
              <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Pesanan Saya</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Pelacakan Pengiriman & Kurir
          </h3>
        </div>
        {order.trackingNumber ? (
          <button
            onClick={handleViewThermalLabel}
            disabled={viewingLabel}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>{viewingLabel ? 'Memuat...' : 'Lihat Label Resi'}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Resi Terbit Saat Pick Up</span>
          </span>
        )}
      </div>

      <LiveCourierTracker orderId={order.id} />
    </div>
  )
}
