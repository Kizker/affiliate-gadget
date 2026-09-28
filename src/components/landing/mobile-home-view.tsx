'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  MessageSquare,
  ShoppingBag,
  User,
  ArrowRight,
  ArrowUp,
  Store,
  ShieldCheck,
  Star,
  CheckCircle2,
  Heart,
  ShoppingCart,
  Zap,
  Loader2,
  ArrowLeftRight,
  Sparkles,
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { useWishlistSafe } from '@/lib/store/wishlist-store'
import { toast } from 'sonner'
import { MobileTopNav } from '@/components/layouts/mobile-top-nav'
import { MobileTopHeroBanner } from '@/components/ads/mobile-top-hero-banner'
import {
  InFeedStoreAdCard,
  InFeedAdData,
} from '@/components/ads/in-feed-store-ad-card'

interface ProductCardData {
  id: string
  brand: string
  name: string
  locationTag: string
  originalPrice: string
  price: string
  conditionBadge: string
  conditionBadgeColor: string
  rating: number
  reviewCount: number
  soldCount?: number
  image: string
  perkText: string
  perkIcon: 'gift' | 'shield' | 'zap'
  href: string
}

const DEFAULT_MOBILE_PRODUCTS: ProductCardData[] = [
  {
    id: 'samsung-s24-ultra',
    brand: 'SAMSUNG',
    name: 'Galaxy S24 Ultra 5G 256GB',
    locationTag: 'WTC Surabaya',
    originalPrice: 'Rp 21.999.000',
    price: 'Rp 16.499.000',
    conditionBadge: 'Like New 99%',
    conditionBadgeColor:
      'bg-emerald-50/95 text-emerald-800 border-emerald-200/80',
    rating: 4.9,
    reviewCount: 38,
    image:
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=900&q=80',
    perkText: 'Bonus Charger 45W + 9D Glass',
    perkIcon: 'gift',
    href: '/gadget',
  },
  {
    id: 'iphone-15-pro-max',
    brand: 'APPLE',
    name: 'iPhone 15 Pro 128GB Titanium Natural',
    locationTag: 'Roxy Mas Jakarta',
    originalPrice: 'Rp 20.999.000',
    price: 'Rp 16.999.000',
    conditionBadge: '99% BH 94%',
    conditionBadgeColor:
      'bg-emerald-50/95 text-emerald-800 border-emerald-200/80',
    rating: 5.0,
    reviewCount: 52,
    image:
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&q=80',
    perkText: '30 Hari Garansi Toko Resmi',
    perkIcon: 'shield',
    href: '/gadget',
  },
  {
    id: 'xiaomi-14-ultra',
    brand: 'XIAOMI',
    name: 'Xiaomi 14 Ultra Leica 512GB Fullset',
    locationTag: 'BEC Bandung',
    originalPrice: 'Rp 18.999.000',
    price: 'Rp 13.299.000',
    conditionBadge: 'Mulus 98%',
    conditionBadgeColor:
      'bg-emerald-50/95 text-emerald-800 border-emerald-200/80',
    rating: 4.8,
    reviewCount: 29,
    image:
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=900&q=80',
    perkText: 'Fullset Box + 90W HyperCharge',
    perkIcon: 'zap',
    href: '/gadget',
  },
  {
    id: 'iphone-14-pro',
    brand: 'APPLE',
    name: 'iPhone 14 Pro 128GB Deep Purple Resmi',
    locationTag: 'Plaza Medan Fair',
    originalPrice: 'Rp 16.500.000',
    price: 'Rp 12.850.000',
    conditionBadge: '98% BH 89%',
    conditionBadgeColor:
      'bg-emerald-50/95 text-emerald-800 border-emerald-200/80',
    rating: 4.9,
    reviewCount: 41,
    image:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=80',
    perkText: 'Bonus 3-in-1 Lengkap',
    perkIcon: 'gift',
    href: '/gadget',
  },
]

function formatApiProduct(p: any): ProductCardData {
  const brandUpper = (p.brand || 'GADGET').toUpperCase()
  const pName = p.name || p.model || 'Gadget Second'
  const storeLocation = p.store?.city
    ? p.store.city
    : p.store?.name
      ? p.store.name
          .replace('Affiliate Gadget - ', '')
          .replace('AffiliateGadget Store - ', '')
      : 'Toko Resmi'

  const rawDesc = (p.description || '').toLowerCase()
  const rawName = pName.toLowerCase()
  let conditionLabel = 'Like New 99%'
  if (
    rawDesc.includes('98%') ||
    rawName.includes('98%') ||
    p.condition === 'SECOND_MULUS'
  ) {
    conditionLabel = 'Mulus 98%'
  } else if (rawDesc.includes('fullset') || rawName.includes('fullset')) {
    conditionLabel = 'Fullset Box'
  } else if (p.condition === 'BARU') {
    conditionLabel = 'Unit Baru 100%'
  } else if (p.condition === 'GRADE_A') {
    conditionLabel = 'Grade A 98%'
  }

  const fallbackImages = [
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
  ]
  const image =
    Array.isArray(p.images) && p.images.length > 0
      ? p.images[0]
      : fallbackImages[
          Math.abs(p.id?.charCodeAt(0) || 0) % fallbackImages.length
        ]

  return {
    id: p.id,
    brand: brandUpper,
    name: pName,
    locationTag: storeLocation,
    originalPrice: p.originalPrice
      ? `Rp ${p.originalPrice.toLocaleString('id-ID')}`
      : `Rp ${Math.round(p.price * 1.15).toLocaleString('id-ID')}`,
    price: `Rp ${(p.price || 0).toLocaleString('id-ID')}`,
    conditionBadge: conditionLabel,
    conditionBadgeColor:
      'bg-emerald-50/95 text-emerald-800 border-emerald-200/80',
    rating: typeof p.rating === 'number' && p.rating > 0 ? p.rating : 5.0,
    reviewCount:
      typeof p.totalReview === 'number' && p.totalReview >= 0
        ? p.totalReview
        : 0,
    soldCount: typeof p.soldCount === 'number' ? p.soldCount : 0,
    image,
    perkText: 'Bonus 3-in-1 Lengkap',
    perkIcon: 'gift',
    href: `/gadget/${p.id}`,
  }
}

const BATCH_SIZE = 6

export function MobileHomeView() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [allProducts, setAllProducts] = useState<ProductCardData[]>(
    DEFAULT_MOBILE_PRODUCTS
  )
  const [visibleCount, setVisibleCount] = useState(6)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const isLoadingMoreRef = useRef(false)
  const { isInWishlist, toggleItem } = useWishlistSafe()
  const { items } = useCartStore()

  const [promotedInFeedAds, setPromotedInFeedAds] = useState<InFeedAdData[]>([])

  // Fetch Level 2 (In-Feed) Store Ads
  useEffect(() => {
    let isSubscribed = true
    async function loadStoreAds() {
      try {
        const feedRes = await fetch('/api/ads?placement=PROMOTED_LIST&limit=4')
        const feedJson = await feedRes.json()
        if (
          feedJson.success &&
          Array.isArray(feedJson.data) &&
          feedJson.data.length > 0
        ) {
          if (isSubscribed) {
            setPromotedInFeedAds(feedJson.data)
          }
        }
      } catch {
        // Fallback safely
      }
    }
    loadStoreAds()
    return () => {
      isSubscribed = false
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const cartCount =
    mounted && status === 'authenticated'
      ? items.reduce((sum, item) => sum + item.quantity, 0)
      : 0

  const toggleWishlist = (item: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const wasAdded = toggleItem({
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      href: item.href,
      conditionBadge: item.conditionBadge,
      conditionBadgeColor: item.conditionBadgeColor,
      rating: item.rating,
      reviewCount: item.reviewCount,
      originCity: item.originCity,
    })
    if (wasAdded) {
      toast.success(`Ditambahkan ke Wishlist: ${item.name}`)
    } else {
      toast.info(`Dihapus dari Wishlist: ${item.name}`)
    }
  }

  // Dynamically synchronize product links with live database
  useEffect(() => {
    let isSubscribed = true
    async function resolveLiveProducts() {
      try {
        const res = await fetch('/api/gadgets')
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const liveList = json.data
          const mapped = liveList.map(formatApiProduct)
          if (isSubscribed) {
            setAllProducts(mapped)
          }
        }
      } catch {
        // Fallback safely to default URLs
      }
    }
    resolveLiveProducts()
    return () => {
      isSubscribed = false
    }
  }, [])

  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current) return
    if (visibleCount >= allProducts.length) return

    setIsLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, allProducts.length))
      setIsLoadingMore(false)
    }, 200)
  }, [visibleCount, allProducts.length])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first && first.isIntersecting) {
          loadMore()
        }
      },
      {
        root: null,
        rootMargin: '300px',
        threshold: 0.05,
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const accountHref =
    status === 'authenticated'
      ? session?.user?.role === 'SUPER_ADMIN' ||
        session?.user?.role === 'ADMIN' ||
        session?.user?.role === 'STORE_ADMIN'
        ? '/dashboard/admin'
        : '/dashboard/customer'
      : '/login?callbackUrl=/dashboard/customer'

  const renderMobileProductCard = (item: ProductCardData) => {
    const isWishlisted = isInWishlist(item.id)
    return (
      <div
        key={item.id}
        className="shadow-xs relative flex flex-col justify-between rounded-2xl border-2 border-slate-200/90 bg-white p-2.5 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      >
        <Link href={item.href} className="block">
          <div className="relative w-full overflow-hidden rounded-xl border border-slate-100/80 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800">
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80'
              }}
              className="block h-auto w-full rounded-xl transition-transform duration-300 hover:scale-105"
            />
            <span
              className={`backdrop-blur-xs shadow-2xs absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[8.5px] font-bold ${item.conditionBadgeColor}`}
            >
              <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
              <span>{item.conditionBadge}</span>
            </span>
            <button
              type="button"
              onClick={(e) => toggleWishlist(item, e)}
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
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                {item.rating.toFixed(1)}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                ({item.reviewCount})
              </span>
            </div>
            <h3 className="line-clamp-2 min-h-[30px] text-xs font-bold leading-tight text-slate-950 dark:text-white">
              {item.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                Garansi 30 Hari
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Bonus 3-in-1
              </span>
            </div>
            <div className="pt-1">
              <span className="block text-sm font-black leading-tight text-orange-500">
                {item.price}
              </span>
              <div className="mt-0.5 flex items-center justify-between text-[10px]">
                <span className="leading-none text-slate-400 line-through">
                  {item.originalPrice}
                </span>
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Terjual {item.soldCount ?? 0}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 truncate pt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              <Store className="h-2.5 w-2.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {item.locationTag.replace('Affiliate Gadget - ', '')}
              </span>
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

      {/* 2. TOP ADVERTISING STORE BANNER (Level 1: Pilihan Tertinggi Iklan Toko / Hero Carousel) */}
      <section className="px-3.5 pb-1 pt-3">
        <MobileTopHeroBanner />
      </section>

      {/* 3. PRODUCT FEED CARDS (2-Column Grid Matching Catalog Page) */}
      <section className="mt-5 px-3.5">
        {/* Section Header */}
        <div className="mb-2.5 flex items-center justify-between px-1">
          <div>
            <span className="text-[10px] font-bold uppercase leading-none tracking-wider text-orange-500">
              PILIHAN TERBAIK
            </span>
            <h2 className="mt-0.5 text-[17px] font-extrabold leading-tight text-slate-950 dark:text-white">
              Gadget Second Terpopuler
            </h2>
          </div>
          <Link
            href="/gadget"
            className="flex items-center gap-1 text-xs font-bold text-orange-500 transition-colors hover:text-orange-600"
          >
            <span>Lihat Semua ({allProducts.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 2-Column Masonry Feed */}
        <div className="grid grid-cols-2 items-start gap-2.5">
          {/* Kolom Kiri */}
          <div className="flex min-w-0 flex-col gap-2.5">
            {allProducts
              .slice(0, visibleCount)
              .filter((_, idx) => idx % 2 === 0)
              .slice(0, 3)
              .map((item) => renderMobileProductCard(item))}
            {promotedInFeedAds[1] && (
              <InFeedStoreAdCard ad={promotedInFeedAds[1]} />
            )}
            {allProducts
              .slice(0, visibleCount)
              .filter((_, idx) => idx % 2 === 0)
              .slice(3)
              .map((item) => renderMobileProductCard(item))}
          </div>

          {/* Kolom Kanan */}
          <div className="flex min-w-0 flex-col gap-2.5">
            {allProducts
              .slice(0, visibleCount)
              .filter((_, idx) => idx % 2 === 1)
              .slice(0, 1)
              .map((item) => renderMobileProductCard(item))}
            {promotedInFeedAds[0] && (
              <InFeedStoreAdCard ad={promotedInFeedAds[0]} />
            )}
            {allProducts
              .slice(0, visibleCount)
              .filter((_, idx) => idx % 2 === 1)
              .slice(1)
              .map((item) => renderMobileProductCard(item))}
          </div>
        </div>

        {/* Skeleton Loading Indicator for Next Chunk */}
        {isLoadingMore && (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-2xl border border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="aspect-[4/3] w-full rounded-xl bg-slate-200/70 dark:bg-slate-800" />
                <div className="mt-2 space-y-1.5">
                  <div className="h-3 w-1/3 rounded bg-slate-200/70 dark:bg-slate-800" />
                  <div className="h-4 w-full rounded bg-slate-200/70 dark:bg-slate-800" />
                  <div className="h-4 w-1/2 rounded bg-slate-200/70 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Sentinel & Streamlined Trigger */}
        {visibleCount < allProducts.length ? (
          <div
            ref={sentinelRef}
            className="flex flex-col items-center justify-center py-4"
          >
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="shadow-2xs inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                  <span>Memuat gadget berikutnya...</span>
                </>
              ) : (
                <>
                  <span>
                    Scroll untuk melihat lebih banyak (
                    {allProducts.length - visibleCount} unit)
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          allProducts.length > 0 && (
            <div className="mb-2 mt-6 flex flex-col items-center justify-center gap-1 py-4 text-center">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Semua gadget pilihan ({allProducts.length} unit) telah
                ditampilkan
              </p>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-orange-500 transition-all hover:text-orange-600 active:scale-95"
              >
                <span>Kembali ke atas</span>
                <ArrowUp className="h-3 w-3" />
              </button>
            </div>
          )
        )}
      </section>
    </div>
  )
}
