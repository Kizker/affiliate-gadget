'use client'

import React, { useState } from 'react'
import {
  Receipt,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldCheck,
  Truck,
  Gift,
} from 'lucide-react'
import { OrderData, formatPrice } from './order-detail-types'

interface CustomerPaymentBreakdownProps {
  order: OrderData
  showStatusBadge?: boolean
  title?: string
}

export function CustomerPaymentBreakdown({
  order,
  showStatusBadge = true,
  title = 'Informasi Pembayaran',
}: CustomerPaymentBreakdownProps) {
  // State akordion buka-tutup per pos biaya
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    subtotal: false,
    shipping: false,
    insurance: false,
    discount: false,
    bonus: false,
    total: false,
  })

  // State bantuan tanda tanya (?) per pos
  const [activeHelp, setActiveHelp] = useState<string | null>(null)

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleHelp = (key: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setActiveHelp((prev) => (prev === key ? null : key))
  }

  const subtotalAmount = order.subtotal || order.total

  return (
    <div className="space-y-3">
      {/* Header Kartu Informasi Pembayaran */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5 dark:border-slate-800">
        <h3 className="flex min-w-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Receipt className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="truncate">{title}</span>
        </h3>

        {showStatusBadge && (
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
        )}
      </div>

      {/* Rincian Pos Biaya dengan Akordion & Tanda Tanya (?) */}
      <div className="space-y-2 text-xs">
        {/* 1. Subtotal Produk */}
        <div>
          <div
            onClick={() => toggleSection('subtotal')}
            className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="font-medium">Subtotal Produk</span>
              <button
                type="button"
                onClick={(e) => toggleHelp('subtotal', e)}
                title="Bantuan Subtotal Produk"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {formatPrice(subtotalAmount)}
              </span>
              <span className="text-slate-400">
                {openSections.subtotal ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            </div>
          </div>
          {openSections.subtotal && (
            <div className="ml-2 mt-1 space-y-1.5 rounded-lg border-l-2 border-slate-300 bg-slate-50/70 p-2.5 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="truncate pr-2">
                    {item.product?.name || item.service?.name || 'Unit Gadget'}
                    {item.variantName ? ` (${item.variantName})` : ''} ×{' '}
                    {item.quantity}
                  </span>
                  <span className="shrink-0 font-mono font-semibold">
                    {formatPrice(item.subtotal || item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {activeHelp === 'subtotal' && (
            <div className="mt-1 rounded-lg border border-blue-200 bg-blue-50/80 p-2 text-[11px] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              Total harga produk original resmi yang Anda beli sebelum biaya
              pengiriman dan asuransi.
            </div>
          )}
        </div>

        {/* 2. Diskon Voucher (Jika ada) */}
        {Boolean(order.discountAmount && order.discountAmount > 0) && (
          <div>
            <div
              onClick={() => toggleSection('discount')}
              className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1 text-emerald-600 transition hover:bg-slate-50/80 dark:text-emerald-400 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                <span className="font-medium">
                  Diskon Voucher{' '}
                  {order.voucherCode ? `(${order.voucherCode})` : ''}
                </span>
                <button
                  type="button"
                  onClick={(e) => toggleHelp('discount', e)}
                  title="Bantuan Diskon Voucher"
                  className="text-emerald-500 hover:text-emerald-700"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold">
                  - {formatPrice(order.discountAmount)}
                </span>
                <span className="text-emerald-500">
                  {openSections.discount ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </span>
              </div>
            </div>
            {openSections.discount && (
              <div className="ml-2 mt-1 rounded-lg border-l-2 border-emerald-300 bg-emerald-50/50 p-2 text-[11px] text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                Kupon promo belanja{' '}
                {order.voucherCode ? `"${order.voucherCode}"` : ''} berhasil
                memotong tagihan sebesar {formatPrice(order.discountAmount)}.
              </div>
            )}
            {activeHelp === 'discount' && (
              <div className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50/80 p-2 text-[11px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                Potongan harga langsung dari kupon promosi marketplace yang
                berhasil digunakan pada pesanan ini.
              </div>
            )}
          </div>
        )}

        {/* 3. Ongkos Kirim Kurir */}
        <div>
          <div
            onClick={() => toggleSection('shipping')}
            className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Truck className="h-3.5 w-3.5" />
              <span className="font-medium">Ongkos Kirim Kurir</span>
              <button
                type="button"
                onClick={(e) => toggleHelp('shipping', e)}
                title="Bantuan Ongkos Kirim"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {order.shippingCost && order.shippingCost > 0
                  ? formatPrice(order.shippingCost)
                  : 'Gratis'}
              </span>
              <span className="text-slate-400">
                {openSections.shipping ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            </div>
          </div>
          {openSections.shipping && (
            <div className="ml-2 mt-1 rounded-lg border-l-2 border-slate-300 bg-slate-50/70 p-2.5 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
              <p>
                Kurir Ekspedisi:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {order.courierCode || 'JNE Express'}{' '}
                  {order.courierService || ''}
                </strong>
              </p>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                Tarif pengiriman resmi terproteksi langsung menuju alamat tujuan
                pembeli.
              </p>
            </div>
          )}
          {activeHelp === 'shipping' && (
            <div className="mt-1 rounded-lg border border-blue-200 bg-blue-50/80 p-2 text-[11px] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              Biaya logistik pengiriman paket gadget aman melalui kurir rekanan
              resmi terverifikasi (JNE / Gojek Instant).
            </div>
          )}
        </div>

        {/* 4. Asuransi Pengiriman Gadget */}
        <div>
          <div
            onClick={() => toggleSection('insurance')}
            className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-medium">
                Asuransi Pengiriman ({order.insuranceRate ?? 0.2}%)
              </span>
              <button
                type="button"
                onClick={(e) => toggleHelp('insurance', e)}
                title="Bantuan Asuransi Pengiriman"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {order.insuranceFee && order.insuranceFee > 0
                  ? formatPrice(order.insuranceFee)
                  : 'Rp 0'}
              </span>
              <span className="text-slate-400">
                {openSections.insurance ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            </div>
          </div>
          {openSections.insurance && (
            <div className="ml-2 mt-1 rounded-lg border-l-2 border-emerald-300 bg-emerald-50/40 p-2.5 text-[11px] text-slate-600 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-slate-300">
              <p className="font-semibold text-emerald-800 dark:text-emerald-400">
                Proteksi 100% Ganti Unit Baru / Refund Penuh
              </p>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                Menjamin ganti rugi 100% apabila paket gadget mengalami
                kerusakan fisik atau kehilangan dalam perjalanan kurir.
              </p>
            </div>
          )}
          {activeHelp === 'insurance' && (
            <div className="mt-1 rounded-lg border border-blue-200 bg-blue-50/80 p-2 text-[11px] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              Asuransi wajib logistik e-commerce gadget untuk perlindungan
              menyeluruh dari risiko pengiriman barang berharga.
            </div>
          )}
        </div>

        {/* 5. Paket Bonus 3-in-1 */}
        <div>
          <div
            onClick={() => toggleSection('bonus')}
            className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Gift className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium">Paket Bonus 3-in-1</span>
              <button
                type="button"
                onClick={(e) => toggleHelp('bonus', e)}
                title="Bantuan Paket Bonus 3-in-1"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Gratis (Rp 0)
              </span>
              <span className="text-slate-400">
                {openSections.bonus ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            </div>
          </div>
          {openSections.bonus && (
            <div className="ml-2 mt-1 rounded-lg border-l-2 border-emerald-300 bg-emerald-50/40 p-2.5 text-[11px] text-slate-600 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-slate-300">
              <p>
                Termasuk:{' '}
                <strong>
                  Charger Adaptor + Tempered Glass Antigores + Softcase
                  Pelindung
                </strong>{' '}
                senilai Rp 350.000 otomatis disertakan di dalam paket.
              </p>
            </div>
          )}
          {activeHelp === 'bonus' && (
            <div className="mt-1 rounded-lg border border-blue-200 bg-blue-50/80 p-2 text-[11px] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              Bonus paket aksesoris original gratis 3-in-1 yang otomatis
              disiapkan toko untuk melengkapi gadget Anda.
            </div>
          )}
        </div>

        {/* 6. Total Pembayaran (Highlight Mencolok) */}
        <div className="mt-4 border-t border-slate-100 pt-3.5 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Total Pembayaran
              </span>
              <button
                type="button"
                onClick={(e) => toggleHelp('total', e)}
                title="Bantuan Total Pembayaran"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="font-mono text-lg font-black tracking-tight text-orange-600 dark:text-orange-500 sm:text-xl">
              {formatPrice(order.total)}
            </span>
          </div>

          {activeHelp === 'total' && (
            <div className="mt-1.5 rounded-lg border border-orange-200 bg-orange-50/80 p-2 text-[11px] text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300">
              Total nominal akhir yang dibayarkan pembeli, mencakup harga
              seluruh unit produk, ongkos kirim resmi kurir, dan asuransi
              proteksi gadget.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
