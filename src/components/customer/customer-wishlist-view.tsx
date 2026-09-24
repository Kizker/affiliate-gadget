'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart,
  Trash2,
  ExternalLink,
  ShoppingBag,
  Star,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { useWishlistSafe, WishlistItem } from '@/lib/store/wishlist-store'
import { toast } from 'sonner'

interface CustomerWishlistViewProps {
  onBackToOverview?: () => void
  isStandalonePage?: boolean
}

export function CustomerWishlistView({
  onBackToOverview,
  isStandalonePage = false,
}: CustomerWishlistViewProps) {
  const { items, removeItem, clearWishlist, mounted } = useWishlistSafe()

  if (!mounted) {
    return (
      <div className="flex h-64 w-full items-center justify-center p-6 text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  const handleRemove = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    removeItem(id)
    toast.info(`Dihapus dari Wishlist: ${name}`)
  }

  const handleClearAll = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua item dari Wishlist?')) {
      clearWishlist()
      toast.success('Semua item Wishlist berhasil dikosongkan')
    }
  }

  return (
    <div className="w-full space-y-4 pb-20">
      {/* Top Bar / Controls */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {items.length} Gadget Tersimpan
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Daftar produk incaran yang siap Anda bawa pulang
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="h-3 w-3" />
            <span>Kosongkan</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="shadow-2xs flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
            <Heart className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="mt-3.5 text-sm font-bold text-slate-900 dark:text-white">
            Wishlist Anda Masih Kosong
          </h3>
          <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
            Klik ikon hati pada produk smartphone pilihan di beranda atau katalog
            untuk menyimpannya di sini.
          </p>
          <Link
            href="/gadget"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Jelajahi Gadget Sekarang</span>
          </Link>
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item: WishlistItem) => {
            const productHref = item.href || `/gadget/${item.id}`
            const displayPrice =
              typeof item.price === 'number'
                ? `Rp ${item.price.toLocaleString('id-ID')}`
                : String(item.price)

            const displayOriginalPrice =
              item.originalPrice != null
                ? typeof item.originalPrice === 'number'
                  ? `Rp ${item.originalPrice.toLocaleString('id-ID')}`
                  : String(item.originalPrice)
                : null

            const imgSrc =
              item.image ||
              (item.images && item.images[0]) ||
              'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'

            return (
              <div
                key={item.id}
                className="shadow-xs group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex gap-3">
                  {/* Thumbnail Image Box */}
                  <Link
                    href={productHref}
                    className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800"
                  >
                    <img
                      src={imgSrc}
                      alt={item.name}
                      loading="lazy"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
                      }}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Condition Badge */}
                    {item.conditionBadge && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[8.5px] font-bold text-white backdrop-blur-xs">
                        {item.conditionBadge}
                      </span>
                    )}
                  </Link>

                  {/* Product Details */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      {/* Store & City Tag */}
                      {(item.storeName || item.originCity) && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">
                            {item.storeName || item.originCity}
                          </span>
                        </div>
                      )}

                      {/* Title */}
                      <Link href={productHref} className="block">
                        <h4 className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 transition hover:text-orange-600 dark:text-white dark:hover:text-orange-400">
                          {item.name}
                        </h4>
                      </Link>

                      {/* Trust Badges */}
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          Garansi 30H
                        </span>
                        {item.rating != null && item.rating > 0 && (
                          <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                            <Star className="h-2.5 w-2.5 fill-amber-500" />
                            <span>{Number(item.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                        {displayPrice}
                      </span>
                      {displayOriginalPrice && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {displayOriginalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Card */}
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={(e) => handleRemove(item.id, item.name, e)}
                    className="flex h-8 items-center gap-1 rounded-xl border border-slate-200 px-2.5 text-[11px] font-medium text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                    title="Hapus dari Wishlist"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Hapus</span>
                  </button>

                  <Link
                    href={productHref}
                    className="shadow-2xs flex h-8 flex-1 items-center justify-center gap-1 rounded-xl bg-orange-500 px-3 text-[11px] font-bold text-white transition hover:bg-orange-600 active:scale-95"
                  >
                    <span>Lihat Produk</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
