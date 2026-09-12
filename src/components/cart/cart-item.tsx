'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShieldCheck, Gift, Check } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import type { CartItem as CartItemType } from '@/types/cart'

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem, toggleItemSelection, selectedItems } =
    useCartStore()
  const isSelected = selectedItems.includes(item.id)

  const itemTotal = item.rentalDays
    ? item.price * item.rentalDays * item.quantity
    : item.price * item.quantity

  const handleQuantityChange = (newQuantity: number) => {
    if (item.stock && newQuantity > item.stock) {
      return
    }
    updateQuantity(item.id, newQuantity)
  }

  // Extract clean title and variant specification if available
  // e.g. "iPhone 15 Pro Max 256GB Titanium (1TB - White Titanium)"
  const titleParts = item.name.split('(')
  const mainTitle = titleParts[0].trim()
  const variantSubtitle =
    item.variantName ||
    (titleParts.length > 1 ? titleParts[1].replace(')', '').trim() : null)

  return (
    <div
      className={`group relative rounded-3xl border transition-all duration-200 ${
        isSelected
          ? 'shadow-xs border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
          : 'shadow-2xs border-slate-200/80 bg-white/70 opacity-90 hover:opacity-100 dark:border-slate-800/80 dark:bg-slate-900/60'
      } p-4 sm:p-5`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Custom Rounded Checkbox */}
        <div className="shrink-0 pt-1">
          <button
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            onClick={() => toggleItemSelection(item.id)}
            className={`flex h-5 w-5 items-center justify-center rounded-lg border transition-all duration-150 ${
              isSelected
                ? 'shadow-2xs border-slate-950 bg-slate-950 text-white dark:border-blue-600 dark:bg-blue-600'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800'
            }`}
            aria-label={`Pilih ${item.name}`}
          >
            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </button>
        </div>

        {/* Product Thumbnail */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 sm:h-24 sm:w-24">
          <Image
            src={item.image || '/placeholder.png'}
            alt={item.name}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Product Info & Price */}
        <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={item.productId ? `/gadget/${item.productId}` : '/gadget'}
                className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 transition-colors hover:text-orange-600 dark:text-white sm:text-sm"
              >
                {mainTitle}
              </Link>
            </div>

            {/* Variant / Spec Tag */}
            {variantSubtitle && (
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Varian:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {variantSubtitle}
                </span>
              </p>
            )}

            {/* Included Value Badges (Desktop Only) */}
            <div className="hidden flex-wrap items-center gap-1.5 pt-0.5 sm:flex">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/50 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                <ShieldCheck className="h-3 w-3" /> Garansi 30 Hari
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-200/50 bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 dark:border-orange-900/30 dark:bg-orange-950/40 dark:text-orange-300">
                <Gift className="h-3 w-3" /> Bonus 3-in-1 (Rp 0)
              </span>
            </div>
          </div>

          {/* Bottom Row: Stepper, Subtotal Price, and Actions (Desktop Only) */}
          <div className="mt-3 hidden items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 sm:flex">
            {/* Quantity Stepper Capsule */}
            <div className="flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100 p-0.5 dark:border-slate-700/60 dark:bg-slate-800/90">
              <button
                type="button"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                className="shadow-2xs flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-700 transition hover:bg-slate-50 active:scale-90 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:h-7 sm:w-7"
                aria-label="Kurangi jumlah"
              >
                <Minus className="h-3 w-3" />
              </button>

              <span className="w-7 text-center text-xs font-bold tabular-nums text-slate-900 dark:text-white sm:w-8">
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={item.stock ? item.quantity >= item.stock : false}
                className="shadow-2xs flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-700 transition hover:bg-slate-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:h-7 sm:w-7"
                aria-label="Tambah jumlah"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Subtotal & Delete Action */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="whitespace-nowrap text-sm font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-base">
                  Rp {itemTotal.toLocaleString('id-ID')}
                </span>
                {item.quantity > 1 && (
                  <p className="whitespace-nowrap text-[10px] tabular-nums text-slate-400">
                    @Rp {item.price.toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                title="Hapus dari keranjang"
                aria-label="Hapus item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only Section: Moved to left & full width below thumbnail */}
      <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800 sm:hidden">
        {/* Mobile Badges: Start from the left */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/50 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/40 dark:text-emerald-300">
            <ShieldCheck className="h-3 w-3" /> Garansi 30 Hari
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-200/50 bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 dark:border-orange-900/30 dark:bg-orange-950/40 dark:text-orange-300">
            <Gift className="h-3 w-3" /> Bonus 3-in-1 (Rp 0)
          </span>
        </div>

        {/* Mobile Bottom Row: Stepper on left, Price & Delete on right */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Stepper */}
          <div className="flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100 p-0.5 dark:border-slate-700/60 dark:bg-slate-800/90">
            <button
              type="button"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              className="shadow-2xs flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-700 transition hover:bg-slate-50 active:scale-90 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Kurangi jumlah"
            >
              <Minus className="h-3 w-3" />
            </button>

            <span className="w-7 text-center text-xs font-bold tabular-nums text-slate-900 dark:text-white">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.stock ? item.quantity >= item.stock : false}
              className="shadow-2xs flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-700 transition hover:bg-slate-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Tambah jumlah"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Subtotal Price (Single Line) & Delete Button */}
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <span className="whitespace-nowrap text-sm font-black tabular-nums tracking-tight text-slate-950 dark:text-white">
                Rp {itemTotal.toLocaleString('id-ID')}
              </span>
              {item.quantity > 1 && (
                <p className="whitespace-nowrap text-[10px] tabular-nums text-slate-400">
                  @Rp {item.price.toLocaleString('id-ID')}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
              title="Hapus dari keranjang"
              aria-label="Hapus item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
