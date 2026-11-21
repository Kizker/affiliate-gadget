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
  const [currentPage, setCurrentPage] = React.useState(1)
  const ITEMS_PER_PAGE = 10
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE))

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const paginatedItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [items, currentPage])

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
    if (
      confirm('Apakah Anda yakin ingin menghapus semua item dari Wishlist?')
    ) {
      clearWishlist()
      toast.success('Semua item Wishlist berhasil dikosongkan')
    }
  }

  return (
    <div className="w-full space-y-4 pb-20">
      {/* Top Header Card matching Screenshot 2 (Hidden on standalone desktop header to prevent duplicate Kosongkan button) */}
      <div
        className={`shadow-xs flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${
          isStandalonePage ? 'md:hidden' : ''
        }`}
      >
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {items.length} Gadget Tersimpan
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Daftar produk incaran Anda
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-100 active:scale-95 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Kosongkan</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="shadow-xs flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
            <Heart className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="mt-3.5 text-sm font-bold text-slate-900 dark:text-white">
            Wishlist Anda Masih Kosong
          </h3>
          <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
            Klik ikon hati pada produk smartphone pilihan di beranda atau
            katalog untuk menyimpannya di sini.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {onBackToOverview && (
              <button
                type="button"
                onClick={onBackToOverview}
                className="shadow-xs inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <span>Kembali ke Profil</span>
              </button>
            )}
            <Link
              href="/gadget"
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Jelajahi Gadget Sekarang</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Items List matching Screenshot 2 */
        <div className="flex flex-col space-y-3.5">
          {paginatedItems.map((item: WishlistItem) => {
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
                className="shadow-2xs hover:shadow-xs group relative flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 transition-all hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900 sm:p-4"
              >
                {/* Clickable Area: Redirects directly to product page */}
                <Link
                  href={productHref}
                  className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-4"
                >
                  {/* Clean Thumbnail Image Box */}
                  <div className="h-18 w-18 relative shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800 sm:h-20 sm:w-20">
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
                  </div>

                  {/* Product Details */}
                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 sm:text-sm">
                      {item.name}
                    </h4>

                    {/* Price Row */}
                    <div className="mt-1 flex items-baseline gap-2 font-mono">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400 sm:text-sm">
                        {displayPrice}
                      </span>
                      {displayOriginalPrice && (
                        <span className="text-[11px] text-slate-400 line-through">
                          {displayOriginalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Simple Trash Icon Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRemove(item.id, item.name, e)
                  }}
                  className="shrink-0 cursor-pointer rounded-xl p-2.5 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-90 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  title="Hapus dari Wishlist"
                  aria-label={`Hapus ${item.name} dari Wishlist`}
                >
                  <Trash2 className="sm:h-4.5 sm:w-4.5 h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Minimalist Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3.5 dark:border-slate-800">
          <span className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
            {paginatedItems.length}/{items.length}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1))
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              disabled={currentPage === 1}
              className="shrink-0 cursor-pointer whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            >
              Sebelumnya
            </button>
            <span className="shrink-0 whitespace-nowrap px-1 text-xs font-bold text-slate-800 dark:text-slate-200">
              {currentPage}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1))
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              disabled={currentPage === totalPages}
              className="shrink-0 cursor-pointer whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
