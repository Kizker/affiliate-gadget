'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MessageSquare,
  ShoppingBag,
  User,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  Heart,
  ShoppingCart,
  X,
  ArrowUpDown,
  Smartphone,
  CheckCircle2,
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { useWishlistSafe } from '@/lib/store/wishlist-store'
import { toast } from 'sonner'
import { MobileTopNav } from '@/components/layouts/mobile-top-nav'
import { CustomSelect } from '@/components/ui/custom-select'

interface MobileCatalogViewProps {
  gadgets: any[]
  loading: boolean
  brand: string
  setBrand: (b: string) => void
  search: string
  setSearch: (s: string) => void
  sortBy: string
  setSortBy: (s: string) => void
  session: any
  status: string
}

export function MobileCatalogView({
  gadgets,
  loading,
  brand,
  setBrand,
  search,
  setSearch,
  sortBy,
  setSortBy,
  session,
  status,
}: MobileCatalogViewProps) {
  const { isInWishlist, toggleItem } = useWishlistSafe()
  const { items } = useCartStore()

  const cartCount =
    status === 'authenticated'
      ? items.reduce((sum, item) => sum + item.quantity, 0)
      : 0

  const accountHref =
    status === 'authenticated'
      ? session?.user?.role === 'SUPER_ADMIN' ||
        session?.user?.role === 'ADMIN' ||
        session?.user?.role === 'STORE_ADMIN'
        ? '/dashboard/admin'
        : '/dashboard/customer'
      : '/login?callbackUrl=/dashboard/customer'

  const brands = ['ALL', 'Apple', 'Samsung', 'Xiaomi', 'ASUS', 'Vivo', 'Oppo']

  const toggleWishlist = (item: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const badge = getConditionBadge(item)
    const wasAdded = toggleItem({
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.images?.[0],
      href: `/gadget/${item.id}`,
      conditionBadge: badge.label,
      conditionBadgeColor: badge.color,
      rating: item.rating,
      reviewCount: item.totalReview,
      originCity: item.store?.city,
      storeName: item.store?.name,
    })
    if (wasAdded) {
      toast.success(`Ditambahkan ke Wishlist: ${item.name}`)
    } else {
      toast.info(`Dihapus dari Wishlist: ${item.name}`)
    }
  }

  // Format Condition Badge
  const getConditionBadge = (item: any) => {
    const desc = (item.description || '').toLowerCase()
    const name = (item.name || '').toLowerCase()
    if (
      desc.includes('99%') ||
      name.includes('99%') ||
      desc.includes('like new')
    ) {
      return {
        label: 'Like New 99%',
        color: 'bg-emerald-50/95 text-emerald-800 border-emerald-200/80',
      }
    }
    if (
      desc.includes('98%') ||
      name.includes('98%') ||
      desc.includes('mulus')
    ) {
      return {
        label: 'Mulus 98%',
        color: 'bg-emerald-50/95 text-emerald-800 border-emerald-200/80',
      }
    }
    if (desc.includes('fullset') || name.includes('fullset')) {
      return {
        label: 'Fullset Box',
        color: 'bg-blue-50/95 text-blue-800 border-blue-200/80',
      }
    }
    return {
      label: 'Like New 99%',
      color: 'bg-emerald-50/95 text-emerald-800 border-emerald-200/80',
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md select-none bg-white pb-24 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. TOP HEADER (Komponen Terpisah Reusable) */}
      <MobileTopNav />

      {/* 2. SEARCH BAR & FILTER ICON ROW */}
      <section className="px-4 pt-3">
        <div className="flex items-center gap-2">
          {/* Search Box Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tipe iPhone, Galaxy, Xiaomi..."
              className="shadow-2xs w-full rounded-2xl border border-slate-200/80 bg-slate-50/90 py-2.5 pl-9 pr-8 text-xs font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-900"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Button Icon */}
          <button
            type="button"
            onClick={() => {
              // Toggle through sort or quick reset
              setSortBy(
                sortBy === 'PRICE_LOW'
                  ? 'PRICE_HIGH'
                  : sortBy === 'PRICE_HIGH'
                    ? 'RATING'
                    : 'PRICE_LOW'
              )
              toast.info(
                `Urutan: ${sortBy === 'PRICE_LOW' ? 'Harga Tertinggi' : sortBy === 'PRICE_HIGH' ? 'Rating Tertinggi' : 'Harga Terendah'}`
              )
            }}
            className="shadow-2xs flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/90 text-orange-500 transition-all hover:bg-orange-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-orange-950/30"
            aria-label="Filter"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* 3. HORIZONTAL BRAND SELECTOR (Pills) */}
      <section className="mt-2.5 px-4">
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1">
          {brands.map((b) => {
            const isSelected = brand === b || (b === 'ALL' && brand === 'ALL')
            return (
              <button
                key={b}
                type="button"
                onClick={() => setBrand(b)}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? 'shadow-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                    : 'border border-slate-200/70 bg-slate-50 text-slate-600 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {b === 'ALL' ? 'Semua' : b}
              </button>
            )
          })}
        </div>
      </section>

      {/* 4. SUMMARY & SORT ROW */}
      <section className="mt-3 flex items-center justify-between px-4">
        <div className="flex items-baseline gap-1">
          <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">
            Katalog Gadget
          </h2>
          <span className="text-xs font-medium text-slate-500">
            ({gadgets.length} Pilihan)
          </span>
        </div>

        {/* Sort Pill Dropdown */}
        <div className="shrink-0">
          <CustomSelect
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            size="sm"
            icon={<ArrowUpDown className="h-3 w-3 text-slate-400" />}
            options={[
              { value: 'DEFAULT', label: 'Terlaris' },
              { value: 'PRICE_LOW', label: 'Harga Terendah' },
              { value: 'PRICE_HIGH', label: 'Harga Tertinggi' },
              { value: 'RATING', label: 'Rating Tertinggi' },
            ]}
          />
        </div>
      </section>

      {/* 5. 2-COLUMN PRODUCT GRID */}
      <section className="mt-3 px-3.5">
        {loading ? (
          <div className="py-24 text-center text-slate-400">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500" />
            <p className="text-xs font-medium">Memuat katalog smartphone...</p>
          </div>
        ) : gadgets.length === 0 ? (
          <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-white p-8 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <Smartphone className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tidak ada produk yang cocok
            </h3>
            <p className="text-xs text-slate-500">
              Coba gunakan kata kunci lain atau pilih filter Semua Merek.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 items-start gap-2.5">
            {/* Kolom Kiri */}
            <div className="flex min-w-0 flex-col gap-2.5">
              {gadgets
                .filter((_, idx) => idx % 2 === 0)
                .map((item) => {
                  const badge = getConditionBadge(item)
                  const isWishlisted = isInWishlist(item.id)
                  const strikePrice =
                    item.originalPrice && item.originalPrice > item.price
                      ? item.originalPrice
                      : Math.round(item.price * 1.25)
                  const storeCleanName = (
                    item.store?.name || 'ITC Roxy Mas Jakarta'
                  )
                    .replace('Affiliate Gadget - ', '')
                    .replace('AffiliateGadget Store - ', '')

                  const imgSrc =
                    (item.images && item.images[0]) ||
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'

                  return (
                    <div
                      key={item.id}
                      className="shadow-xs relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-2.5 transition-all hover:border-slate-200 dark:border-slate-800/90 dark:bg-slate-900 dark:hover:border-slate-700"
                    >
                      <Link href={`/gadget/${item.id}`} className="block">
                        {/* Dynamic Resolution Image Box (No Cropping, Natural Height) */}
                        <div className="relative w-full overflow-hidden rounded-xl border border-slate-100/80 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800">
                          <img
                            src={imgSrc}
                            alt={item.name}
                            loading="lazy"
                            onError={(e) => {
                              ;(e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
                            }}
                            className="block h-auto w-full rounded-xl transition-transform duration-300 hover:scale-105"
                          />

                          {/* Condition Badge (Top Left) */}
                          <span
                            className={`backdrop-blur-xs shadow-2xs absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[8.5px] font-bold ${badge.color}`}
                          >
                            <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                            <span>{badge.label}</span>
                          </span>

                          {/* Wishlist Button (Top Right) */}
                          <button
                            type="button"
                            onClick={(e) =>
                              toggleWishlist(item, e)
                            }
                            className="backdrop-blur-xs shadow-2xs absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-400 transition-transform hover:text-rose-500 active:scale-90 dark:bg-slate-900/90"
                            aria-label="Wishlist"
                          >
                            <Heart
                              className={`h-3.5 w-3.5 transition-colors ${
                                isWishlisted
                                  ? 'fill-rose-500 text-rose-500'
                                  : 'text-slate-400'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Meta Section */}
                        <div className="mt-2 space-y-1">
                          {/* Rating & Review Count */}
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                              {(item.rating || 4.9).toFixed(1)}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              ({item.totalReview || 38})
                            </span>
                          </div>

                          {/* Product Name */}
                          <h3 className="line-clamp-2 min-h-[30px] text-xs font-bold leading-tight text-slate-950 dark:text-white">
                            {item.name}
                          </h3>

                          {/* Feature Perks Pills */}
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                              Garansi 30 Hari
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              Bonus 3-in-1
                            </span>
                          </div>

                          {/* Price Row */}
                          <div className="pt-1">
                            <span className="block text-sm font-black leading-tight text-orange-500">
                              Rp {item.price.toLocaleString('id-ID')}
                            </span>
                            <span className="mt-0.5 block text-[10px] leading-none text-slate-400 line-through">
                              Rp {strikePrice.toLocaleString('id-ID')}
                            </span>
                          </div>

                          {/* Store Location */}
                          <div className="flex items-center gap-1 truncate pt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <Store className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                            <span className="truncate">{storeCleanName}</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                })}
            </div>

            {/* Kolom Kanan */}
            <div className="flex min-w-0 flex-col gap-2.5">
              {gadgets
                .filter((_, idx) => idx % 2 === 1)
                .map((item) => {
                  const badge = getConditionBadge(item)
                  const isWishlisted = isInWishlist(item.id)
                  const strikePrice =
                    item.originalPrice && item.originalPrice > item.price
                      ? item.originalPrice
                      : Math.round(item.price * 1.25)
                  const storeCleanName = (
                    item.store?.name || 'ITC Roxy Mas Jakarta'
                  )
                    .replace('Affiliate Gadget - ', '')
                    .replace('AffiliateGadget Store - ', '')

                  const imgSrc =
                    (item.images && item.images[0]) ||
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'

                  return (
                    <div
                      key={item.id}
                      className="shadow-xs relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-2.5 transition-all hover:border-slate-200 dark:border-slate-800/90 dark:bg-slate-900 dark:hover:border-slate-700"
                    >
                      <Link href={`/gadget/${item.id}`} className="block">
                        {/* Dynamic Resolution Image Box (No Cropping, Natural Height) */}
                        <div className="relative w-full overflow-hidden rounded-xl border border-slate-100/80 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800">
                          <img
                            src={imgSrc}
                            alt={item.name}
                            loading="lazy"
                            onError={(e) => {
                              ;(e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
                            }}
                            className="block h-auto w-full rounded-xl transition-transform duration-300 hover:scale-105"
                          />

                          {/* Condition Badge (Top Left) */}
                          <span
                            className={`backdrop-blur-xs shadow-2xs absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[8.5px] font-bold ${badge.color}`}
                          >
                            <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                            <span>{badge.label}</span>
                          </span>

                          {/* Wishlist Button (Top Right) */}
                          <button
                            type="button"
                            onClick={(e) =>
                              toggleWishlist(item, e)
                            }
                            className="backdrop-blur-xs shadow-2xs absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-400 transition-transform hover:text-rose-500 active:scale-90 dark:bg-slate-900/90"
                            aria-label="Wishlist"
                          >
                            <Heart
                              className={`h-3.5 w-3.5 transition-colors ${
                                isWishlisted
                                  ? 'fill-rose-500 text-rose-500'
                                  : 'text-slate-400'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Meta Section */}
                        <div className="mt-2 space-y-1">
                          {/* Rating & Review Count */}
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                              {(item.rating || 4.9).toFixed(1)}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              ({item.totalReview || 38})
                            </span>
                          </div>

                          {/* Product Name */}
                          <h3 className="line-clamp-2 min-h-[30px] text-xs font-bold leading-tight text-slate-950 dark:text-white">
                            {item.name}
                          </h3>

                          {/* Feature Perks Pills */}
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                              Garansi 30 Hari
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              Bonus 3-in-1
                            </span>
                          </div>

                          {/* Price Row */}
                          <div className="pt-1">
                            <span className="block text-sm font-black leading-tight text-orange-500">
                              Rp {item.price.toLocaleString('id-ID')}
                            </span>
                            <span className="mt-0.5 block text-[10px] leading-none text-slate-400 line-through">
                              Rp {strikePrice.toLocaleString('id-ID')}
                            </span>
                          </div>

                          {/* Store Location */}
                          <div className="flex items-center gap-1 truncate pt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <Store className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                            <span className="truncate">{storeCleanName}</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
