'use client'

import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart-store'
import { ShieldCheck, Gift, ArrowRight, Truck } from 'lucide-react'

export default function CartSummary() {
  const getSelectedSummary = useCartStore((state) => state.getSelectedSummary)
  const selectedItems = useCartStore((state) => state.selectedItems)

  const { subtotal, total, itemCount } = getSelectedSummary()
  const hasSelectedItems = selectedItems.length > 0

  return (
    <div className="shadow-xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-950 dark:text-white">
          Ringkasan Belanja
        </h2>
        {hasSelectedItems && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {itemCount} barang
          </span>
        )}
      </div>

      {/* Breakdown Items */}
      <div className="space-y-2.5 text-xs">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span>Subtotal ({itemCount} item)</span>
          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
            Rp {subtotal.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Bonus 3-in-1 */}
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-orange-500" />
            <span>Bonus Aksesoris 3-in-1</span>
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            GRATIS (Rp 0)
          </span>
        </div>
        <p className="-mt-1 pl-5 text-[10px] leading-tight text-slate-400">
          Charger 20W + Tempered Glass + Case
        </p>

        {/* Delivery Insurance */}
        <div className="flex items-center justify-between pt-0.5 text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-blue-500" />
            <span>Asuransi Pengiriman (0,2%)</span>
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Terproteksi
          </span>
        </div>

        {/* Divider & Total */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div>
            <span className="block text-xs font-bold text-slate-900 dark:text-white">
              Total Pembayaran
            </span>
            <span className="block text-[10px] text-slate-400">
              Belum termasuk ongkir kurir
            </span>
          </div>

          <span className="whitespace-nowrap text-base font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-lg">
            Rp {total.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Primary Checkout CTA */}
      <Link
        href="/checkout"
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-center text-xs font-bold transition-all duration-200 ${
          hasSelectedItems
            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 active:scale-[0.99]'
            : 'pointer-events-none cursor-not-allowed border border-slate-200/80 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
        }`}
      >
        {hasSelectedItems ? (
          <>
            <span>Lanjut ke Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </>
        ) : (
          'Pilih Barang untuk Checkout'
        )}
      </Link>

      {/* Security & Reassurance Micro-banner */}
      <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800/80 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Garansi 30 Hari Tukar Unit Gadget Second</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <Truck className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>Proteksi JNE & Gojek Instant 100%</span>
        </div>
      </div>
    </div>
  )
}
