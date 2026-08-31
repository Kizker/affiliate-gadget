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
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
      
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
          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
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
        <p className="text-[10px] text-slate-400 pl-5 -mt-1 leading-tight">
          Charger 20W + Tempered Glass + Case
        </p>

        {/* Delivery Insurance */}
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-0.5">
          <span className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-blue-500" />
            <span>Asuransi Pengiriman</span>
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Terproteksi
          </span>
        </div>

        {/* Divider & Total */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Total Pembayaran
            </span>
            <span className="text-[10px] text-slate-400 block">
              Belum termasuk ongkir kurir
            </span>
          </div>

          <span className="text-base sm:text-lg font-bold text-slate-950 dark:text-white tabular-nums tracking-tight whitespace-nowrap">
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
            : 'cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200/80 pointer-events-none dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
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
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Garansi 30 Hari Tukar Unit Gadget Second</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <Truck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Proteksi JNE & Gojek Instant 100%</span>
        </div>
      </div>

    </div>
  )
}
