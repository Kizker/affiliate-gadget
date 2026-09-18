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
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { MobileTopNav } from '@/components/layouts/mobile-top-nav'

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

interface HeroSlide {
  id: string
  image: string
  badgeText: string
  badgeIcon: 'shield' | 'check' | 'store'
  title: string
  subtitle: string
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    image: '/images/hero-slide-1.jpg',
    badgeText: 'Garansi Toko 30 Hari',
    badgeIcon: 'shield',
    title: 'Gadget Second Seperti Baru',
    subtitle: 'Free Paket Bonus 3-in-1',
  },
  {
    id: 'slide-2',
    image: '/images/hero-slide-2.jpg',
    badgeText: 'Lolos 32 Titik Uji QC',
    badgeIcon: 'check',
    title: '100% Fungsi Normal Teruji',
    subtitle: 'Pemeriksaan Teknisi Ahli',
  },
  {
    id: 'slide-3',
    image: '/images/hero-slide-3.jpg',
    badgeText: 'Jaringan Toko Fisik PT',
    badgeIcon: 'store',
    title: 'Bisa Cek Unit di Toko',
    subtitle: '5 Kota Besar di Indonesia',
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
    rating: typeof p.rating === 'number' && p.rating > 0 ? p.rating : 4.9,
    reviewCount:
      typeof p.totalReview === 'number' && p.totalReview > 0
        ? p.totalReview
        : 24,
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
  isLoadingMoreRef.current = isLoadingMore
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({})
  const { items } = useCartStore()

  // Hero Slideshow Carousel State
  const [currentSlide, setCurrentSlide] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    if (diff > 40) {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    } else if (diff < -40) {
      setCurrentSlide(
        (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
      )
    }
    setTouchStart(null)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const cartCount =
    mounted && status === 'authenticated'
      ? items.reduce((sum, item) => sum + item.quantity, 0)
      : 0

  const toggleWishlist = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlist((prev) => {
      const next = !prev[id]
      if (next) {
        toast.success(`Ditambahkan ke Wishlist: ${name}`)
      } else {
        toast.info(`Dihapus dari Wishlist: ${name}`)
      }
      return { ...prev, [id]: next }
    })
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

  return (
    <div className="mx-auto min-h-screen w-full max-w-md select-none bg-white pb-24 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. TOP HEADER (Komponen Terpisah Reusable) */}
      <MobileTopNav />

      {/* 2. HERO SECTION (Figma Node 5:484) */}
      <section className="space-y-3 px-3.5 pb-1 pt-3">
        {/* Promo Banner Slideshow Carousel (5:520) */}
        <div
          className="relative aspect-[16/9] w-full select-none overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 shadow-sm dark:border-slate-800"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentSlide
                  ? 'z-10 opacity-100'
                  : 'pointer-events-none z-0 opacity-0'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                priority={idx === 0}
              />
              {/* Subtle Dark Vignette for Text Readability */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              {/* Slide Caption */}
              <div className="pointer-events-none absolute bottom-3 left-3 right-20 z-20">
                <p className="text-[13px] font-extrabold leading-tight tracking-tight text-white drop-shadow-md">
                  {slide.title}
                </p>
                <p className="drop-shadow-xs mt-0.5 text-[10px] font-medium leading-none text-white/85">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          ))}

          {/* Frosted Dynamic Badge Top-Left (5:524) */}
          <div className="absolute left-2.5 top-2.5 z-20 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-2.5 py-1 shadow-sm backdrop-blur-md transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-900/90">
            {HERO_SLIDES[currentSlide].badgeIcon === 'shield' && (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            {HERO_SLIDES[currentSlide].badgeIcon === 'check' && (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
            )}
            {HERO_SLIDES[currentSlide].badgeIcon === 'store' && (
              <Store className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            )}
            <span className="text-[10px] font-bold leading-none text-slate-900 dark:text-white">
              {HERO_SLIDES[currentSlide].badgeText}
            </span>
          </div>

          {/* Interactive Indicator Dots Bottom-Right (5:529) */}
          <div className="backdrop-blur-xs absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-black/30 px-2 py-1">
            {HERO_SLIDES.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentSlide(dotIdx)
                }}
                className={`rounded-full transition-all duration-300 ${
                  dotIdx === currentSlide
                    ? 'h-1.5 w-4 bg-orange-500 shadow-sm'
                    : 'h-1.5 w-1.5 bg-white/70 hover:bg-white'
                }`}
                aria-label={`Slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Flash Sale Ticker Bar (5:507) */}
        <div className="shadow-2xs flex items-center justify-between rounded-xl border border-slate-200/80 bg-gradient-to-r from-orange-50/90 via-white to-orange-50/40 px-3 py-2.5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/30">
          <div className="flex min-w-0 items-center gap-1.5">
            <Zap className="h-4 w-4 shrink-0 fill-orange-500 text-orange-500" />
            <span className="truncate text-[11px] font-extrabold tracking-tight text-slate-950 dark:text-white">
              Flash Sale Gadget Second
            </span>
            <span className="shrink-0 rounded bg-[#020617] px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-white">
              03:24:18
            </span>
          </div>
          <Link
            href="/gadget"
            className="ml-2 flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-orange-500 transition-colors hover:text-orange-600"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
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

        {/* 2-Column Asymmetric Masonry Grid */}
        <div className="grid grid-cols-2 items-start gap-2.5">
          {/* Kolom Kiri */}
          <div className="flex min-w-0 flex-col gap-2.5">
            {allProducts
              .slice(0, visibleCount)
              .filter((_, idx) => idx % 2 === 0)
              .map((item) => {
                const isWishlisted = wishlist[item.id] || false

                return (
                  <div
                    key={item.id}
                    className="shadow-xs relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-2.5 transition-all hover:border-slate-200 dark:border-slate-800/90 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    <Link href={item.href} className="block">
                      {/* Dynamic Resolution Image Box (No Cropping, Natural Height) */}
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

                        {/* Condition Badge (Top Left) */}
                        <span
                          className={`backdrop-blur-xs shadow-2xs absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[8.5px] font-bold ${item.conditionBadgeColor}`}
                        >
                          <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                          <span>{item.conditionBadge}</span>
                        </span>

                        {/* Wishlist Button (Top Right) */}
                        <button
                          type="button"
                          onClick={(e) => toggleWishlist(item.id, item.name, e)}
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
                            {item.rating.toFixed(1)}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            ({item.reviewCount})
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
                            {item.price}
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-none text-slate-400 line-through">
                            {item.originalPrice}
                          </span>
                        </div>

                        {/* Store Location */}
                        <div className="flex items-center gap-1 truncate pt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <Store className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                          <span className="truncate">
                            {item.locationTag.replace(
                              'Affiliate Gadget - ',
                              ''
                            )}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Buy Button CTA */}
                    <Link
                      href={item.href}
                      className="shadow-2xs mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-1.5 text-xs font-bold text-white transition-all hover:bg-orange-600 active:scale-95"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      <span>Beli</span>
                    </Link>
                  </div>
                )
              })}
          </div>

          {/* Kolom Kanan */}
          <div className="flex min-w-0 flex-col gap-2.5">
            {allProducts
              .slice(0, visibleCount)
              .filter((_, idx) => idx % 2 === 1)
              .map((item) => {
                const isWishlisted = wishlist[item.id] || false

                return (
                  <div
                    key={item.id}
                    className="shadow-xs relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-2.5 transition-all hover:border-slate-200 dark:border-slate-800/90 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    <Link href={item.href} className="block">
                      {/* Dynamic Resolution Image Box (No Cropping, Natural Height) */}
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

                        {/* Condition Badge (Top Left) */}
                        <span
                          className={`backdrop-blur-xs shadow-2xs absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[8.5px] font-bold ${item.conditionBadgeColor}`}
                        >
                          <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                          <span>{item.conditionBadge}</span>
                        </span>

                        {/* Wishlist Button (Top Right) */}
                        <button
                          type="button"
                          onClick={(e) => toggleWishlist(item.id, item.name, e)}
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
                            {item.rating.toFixed(1)}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            ({item.reviewCount})
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
                            {item.price}
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-none text-slate-400 line-through">
                            {item.originalPrice}
                          </span>
                        </div>

                        {/* Store Location */}
                        <div className="flex items-center gap-1 truncate pt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <Store className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                          <span className="truncate">
                            {item.locationTag.replace(
                              'Affiliate Gadget - ',
                              ''
                            )}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Buy Button CTA */}
                    <Link
                      href={item.href}
                      className="shadow-2xs mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-1.5 text-xs font-bold text-white transition-all hover:bg-orange-600 active:scale-95"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      <span>Beli</span>
                    </Link>
                  </div>
                )
              })}
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
