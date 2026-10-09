'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  Loader2,
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { useWishlistSafe } from '@/lib/store/wishlist-store'
import { toast } from 'sonner'
import { MobileTopNav } from '@/components/layouts/mobile-top-nav'
import { CustomSelect } from '@/components/ui/custom-select'
import {
  InFeedStoreAdCard,
  InFeedAdData,
} from '@/components/ads/in-feed-store-ad-card'
import { MobileTopHeroBanner } from '@/components/ads/mobile-top-hero-banner'
import { SmartAnalysisResult } from '@/lib/smart-search'
import {
  LiveBannerCard,
  LiveBannerData,
} from '@/components/live/live-banner-card'

const INITIAL_COUNT = 8
const BATCH_SIZE = 8

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
  promotedAd?: InFeedAdData | null
  promotedAds?: InFeedAdData[]
  smartAnalysis?: SmartAnalysisResult
  ignoreCorrection?: boolean
  setIgnoreCorrection?: (v: boolean) => void
  liveStreams?: LiveBannerData[]
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
  promotedAd,
  promotedAds,
  smartAnalysis,
  ignoreCorrection = false,
  setIgnoreCorrection,
  liveStreams = [],
}: MobileCatalogViewProps) {
  const { isInWishlist, toggleItem } = useWishlistSafe()
  const { items } = useCartStore()

  // Mobile Lazy Loading State
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Reset lazy load pagination when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_COUNT)
  }, [brand, search, sortBy])

  const hasMore = visibleCount < gadgets.length
  const displayedGadgets = gadgets.slice(0, visibleCount)

  // Distribute items across the 2-column masonry waterfall (Products, Ads, and Live Streams)
  const { leftColumnItems, rightColumnItems } = useMemo(() => {
    const allAdsList = [...(promotedAds || [])]
    if (promotedAd && !allAdsList.some((a) => a.id === promotedAd.id)) {
      allAdsList.unshift(promotedAd)
    }

    const left: Array<
      | { type: 'product'; data: any }
      | { type: 'ad'; data: InFeedAdData }
      | { type: 'live'; data: LiveBannerData }
    > = []
    const right: Array<
      | { type: 'product'; data: any }
      | { type: 'ad'; data: InFeedAdData }
      | { type: 'live'; data: LiveBannerData }
    > = []

    const leftProds = displayedGadgets.filter((_, idx) => idx % 2 === 0)
    const rightProds = displayedGadgets.filter((_, idx) => idx % 2 === 1)

    // Partition live streams between left and right columns
    const leftLive: LiveBannerData[] = []
    const rightLive: LiveBannerData[] = []
    ;(liveStreams || []).forEach((ls, i) => {
      if (i % 2 === 0) {
        leftLive.push(ls)
      } else {
        rightLive.push(ls)
      }
    })

    // Partition ads between left and right columns
    const leftAds: InFeedAdData[] = []
    const rightAds: InFeedAdData[] = []

    allAdsList.forEach((ad, i) => {
      if (i % 2 === 0) {
        leftAds.push(ad)
      } else {
        rightAds.push(ad)
      }
    })

    // Interleave left column:
    // Place live stream early (after first product) or ads periodically
    let lLiveIdx = 0
    let lAdIdx = 0
    leftProds.forEach((prod, pIdx) => {
      left.push({ type: 'product', data: prod })
      // Live stream appears at pIdx === 0 (after 1st product) or every 3 products
      if (
        (pIdx === 0 || (pIdx > 0 && pIdx % 3 === 0)) &&
        lLiveIdx < leftLive.length
      ) {
        left.push({ type: 'live', data: leftLive[lLiveIdx++] })
      }
      // In-feed ad appears at pIdx === 1 or every 3 products
      if (
        (pIdx === 1 || (pIdx > 1 && (pIdx - 1) % 3 === 0)) &&
        lAdIdx < leftAds.length
      ) {
        left.push({ type: 'ad', data: leftAds[lAdIdx++] })
      }
    })
    if (!hasMore) {
      while (lLiveIdx < leftLive.length) {
        left.push({ type: 'live', data: leftLive[lLiveIdx++] })
      }
      while (lAdIdx < leftAds.length) {
        left.push({ type: 'ad', data: leftAds[lAdIdx++] })
      }
    }

    // Interleave right column:
    let rLiveIdx = 0
    let rAdIdx = 0
    rightProds.forEach((prod, pIdx) => {
      right.push({ type: 'product', data: prod })
      // Live stream appears at pIdx === 0 or every 3 products
      if (
        (pIdx === 0 || (pIdx > 0 && pIdx % 3 === 0)) &&
        rLiveIdx < rightLive.length
      ) {
        right.push({ type: 'live', data: rightLive[rLiveIdx++] })
      }
      // In-feed ad appears at pIdx === 2 or every 3 products
      if (
        (pIdx === 2 || (pIdx > 2 && (pIdx - 2) % 3 === 0)) &&
        rAdIdx < rightAds.length
      ) {
        right.push({ type: 'ad', data: rightAds[rAdIdx++] })
      }
    })
    if (!hasMore) {
      while (rLiveIdx < rightLive.length) {
        right.push({ type: 'live', data: rightLive[rLiveIdx++] })
      }
      while (rAdIdx < rightAds.length) {
        right.push({ type: 'ad', data: rightAds[rAdIdx++] })
      }
    }

    return { leftColumnItems: left, rightColumnItems: right }
  }, [displayedGadgets, promotedAds, promotedAd, liveStreams, hasMore])

  const loadMore = useCallback(() => {
    if (isLoadingMore || visibleCount >= gadgets.length) return
    setIsLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, gadgets.length))
      setIsLoadingMore(false)
    }, 300)
  }, [isLoadingMore, visibleCount, gadgets.length])

  // IntersectionObserver for auto lazy loading on scroll
  useEffect(() => {
    if (!hasMore || loading) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '250px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

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

  const renderProductCard = (item: any, isPriority = false) => {
    const badge = getConditionBadge(item)
    const isWishlisted = isInWishlist(item.id)
    const strikePrice =
      item.originalPrice && item.originalPrice > item.price
        ? item.originalPrice
        : Math.round(item.price * 1.25)
    const storeCleanName = (item.store?.name || 'ITC Roxy Mas Jakarta')
      .replace('Affiliate Gadget - ', '')
      .replace('AffiliateGadget Store - ', '')

    const imgSrc =
      (item.images && item.images[0]) ||
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'

    return (
      <div
        key={item.id}
        className="shadow-xs relative flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-slate-200/90 bg-white p-2.5 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      >
        {/* Wishlist Button (Positioned absolutely outside Link to satisfy WCAG interactive control guidelines) */}
        <button
          type="button"
          onClick={(e) => toggleWishlist(item, e)}
          className="backdrop-blur-xs shadow-2xs absolute right-3.5 top-3.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-400 transition-transform hover:text-rose-500 active:scale-90 dark:bg-slate-900/90"
          aria-label={
            isWishlisted
              ? `Hapus ${item.name} dari Wishlist`
              : `Tambah ${item.name} ke Wishlist`
          }
        >
          <Heart
            className={`h-3.5 w-3.5 transition-colors ${
              isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
            }`}
          />
        </button>

        <Link
          href={`/gadget/${item.id}`}
          className="flex w-full flex-col gap-1.5 focus:outline-none"
        >
          <div>
            {/* Natural Aspect Ratio Image Box (Dynamic height based on uploaded photo) */}
            <div className="relative aspect-square w-full max-w-full overflow-hidden rounded-xl border border-slate-100/80 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800/60">
              <Image
                src={imgSrc}
                alt={item.name}
                width={300}
                height={300}
                sizes="(max-width: 640px) 50vw, 300px"
                quality={70}
                priority={isPriority}
                loading={isPriority ? 'eager' : 'lazy'}
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
                }}
                className="h-auto w-full max-w-full object-cover transition-transform duration-300 hover:scale-105"
              />

              {/* Condition Badge (Top Left) */}
              <span
                className={`backdrop-blur-xs shadow-2xs absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[8.5px] font-bold ${badge.color}`}
              >
                <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                <span>{badge.label}</span>
              </span>
            </div>

            {/* Meta Section */}
            <div className="mt-2 space-y-1">
              {/* Rating & Review Count */}
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                  {(item.rating || 5.0).toFixed(1)}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  ({item.totalReview ?? 0})
                </span>
              </div>

              {/* Product Name (Natural Height, not forced) */}
              <h3 className="line-clamp-2 text-xs font-bold leading-4 text-slate-950 dark:text-white">
                {item.name}
              </h3>
            </div>
          </div>

          {/* Price Row & Sold Count */}
          <div className="pt-1.5">
            <span className="block text-sm font-black leading-tight text-orange-500">
              Rp {item.price.toLocaleString('id-ID')}
            </span>
            <div className="mt-0.5 flex items-center justify-between text-[10px]">
              <span className="leading-none text-slate-400 line-through">
                Rp {strikePrice.toLocaleString('id-ID')}
              </span>
              <span className="shrink-0 whitespace-nowrap font-medium text-slate-500 dark:text-slate-400">
                Terjual {item.soldCount ?? 0}
              </span>
            </div>
            {/* Store Location */}
            <div className="flex items-center gap-1 truncate pt-1 text-[10px] text-slate-500 dark:text-slate-400">
              <Store className="h-2.5 w-2.5 shrink-0 text-slate-400" />
              <span className="truncate">{storeCleanName}</span>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md select-none bg-white pb-24 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. TOP HEADER (Komponen Terpisah Reusable) */}
      <MobileTopNav />

      {/* 2. TOP ADVERTISING STORE BANNER (Level 1: Pilihan Tertinggi Iklan Toko) */}
      <section className="px-3.5 pb-1 pt-3">
        <MobileTopHeroBanner />
      </section>

      {/* 3. SEARCH BAR & FILTER ICON ROW */}
      <section className="px-4 pt-2">
        <div className="flex items-center gap-2">
          {/* Search Box Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tipe iPhone, Galaxy, Xiaomi..."
              aria-label="Cari tipe iPhone, Galaxy, Xiaomi atau model smartphone"
              className="shadow-2xs w-full rounded-2xl border border-slate-200/80 bg-slate-50/90 py-2.5 pl-9 pr-8 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-900"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Hapus kata kunci pencarian"
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
              // Toggle through sort: RELEVANCE -> POPULAR -> PRICE_LOW -> PRICE_HIGH -> RATING -> RELEVANCE
              const nextSort =
                sortBy === 'RELEVANCE' || sortBy === 'DEFAULT'
                  ? 'POPULAR'
                  : sortBy === 'POPULAR'
                    ? 'PRICE_LOW'
                    : sortBy === 'PRICE_LOW'
                      ? 'PRICE_HIGH'
                      : sortBy === 'PRICE_HIGH'
                        ? 'RATING'
                        : 'RELEVANCE'
              setSortBy(nextSort)
              const labels: Record<string, string> = {
                RELEVANCE: 'Paling Relevan',
                POPULAR: 'Terlaris',
                PRICE_LOW: 'Harga Terendah',
                PRICE_HIGH: 'Harga Tertinggi',
                RATING: 'Rating Tertinggi',
              }
              toast.info(`Urutan: ${labels[nextSort] || nextSort}`)
            }}
            className="shadow-2xs flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/90 text-orange-500 transition-all hover:bg-orange-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-orange-950/30"
            aria-label="Urutkan dan filter produk katalog"
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
          <h1 className="text-sm font-extrabold text-slate-950 dark:text-white">
            Katalog Gadget
          </h1>
          <span className="text-xs font-medium text-slate-500">
            ({gadgets.length} Pilihan)
          </span>
        </div>

        {/* Sort Pill Dropdown */}
        <div className="shrink-0">
          <CustomSelect
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            ariaLabel="Urutkan katalog smartphone"
            size="sm"
            icon={<ArrowUpDown className="h-3 w-3 text-slate-400" />}
            options={[
              { value: 'RELEVANCE', label: 'Paling Relevan' },
              { value: 'POPULAR', label: 'Terlaris' },
              { value: 'LATEST', label: 'Urutan Terbaru' },
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
          <>
            <div className="grid grid-cols-2 items-start gap-2.5">
              {/* Kolom Kiri */}
              <div className="flex min-w-0 flex-col gap-2.5">
                {leftColumnItems.map((item, idx) => (
                  <div
                    key={
                      item.type === 'product'
                        ? item.data.id || `left-p-${idx}`
                        : item.type === 'ad'
                          ? item.data.id || `left-ad-${idx}`
                          : item.data.id || `left-live-${idx}`
                    }
                    className="w-full min-w-0"
                  >
                    {item.type === 'product' ? (
                      renderProductCard(item.data, idx === 0)
                    ) : item.type === 'ad' ? (
                      <InFeedStoreAdCard ad={item.data} />
                    ) : (
                      <LiveBannerCard stream={item.data} className="w-full" />
                    )}
                  </div>
                ))}
              </div>

              {/* Kolom Kanan */}
              <div className="flex min-w-0 flex-col gap-2.5">
                {rightColumnItems.map((item, idx) => (
                  <div
                    key={
                      item.type === 'product'
                        ? item.data.id || `right-p-${idx}`
                        : item.type === 'ad'
                          ? item.data.id || `right-ad-${idx}`
                          : item.data.id || `right-live-${idx}`
                    }
                    className="w-full min-w-0"
                  >
                    {item.type === 'product' ? (
                      renderProductCard(item.data, idx === 0)
                    ) : item.type === 'ad' ? (
                      <InFeedStoreAdCard ad={item.data} />
                    ) : (
                      <LiveBannerCard stream={item.data} className="w-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Lazy Loading Sentinel & Load More Indicator */}
            {hasMore ? (
              <div
                ref={sentinelRef}
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                {isLoadingMore ? (
                  <div className="shadow-2xs flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/80 px-4 py-2 text-xs font-semibold text-orange-600 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    <span>Memuat gadget berikutnya...</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={loadMore}
                    className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-5 py-2 text-xs font-bold text-slate-700 transition active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <span>Muat Lebih Banyak</span>
                    <span className="text-[10px] text-slate-400">
                      ({visibleCount} / {gadgets.length})
                    </span>
                  </button>
                )}
              </div>
            ) : (
              gadgets.length > INITIAL_COUNT && (
                <div className="py-6 text-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-slate-50 px-4 py-1.5 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Semua {gadgets.length} gadget telah ditampilkan</span>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </section>
    </div>
  )
}
