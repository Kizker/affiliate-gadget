'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  Gift,
  Store,
  Sparkles,
  Smartphone,
  Package,
  Star,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import {
  InFeedStoreAdCard,
  InFeedAdData,
} from '@/components/ads/in-feed-store-ad-card'
import {
  assembleCatalogGridItems,
  CatalogGridItem,
} from '@/lib/catalog-grid-layout'

const INITIAL_COUNT = 8
const BATCH_SIZE = 8

const FALLBACK_GADGET_IMAGES = [
  'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
]

export function SectionFeaturedGadgets() {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [products, setProducts] = useState<any[]>([])
  const [promotedAds, setPromotedAds] = useState<InFeedAdData[]>([])
  const [loading, setLoading] = useState(true)

  // Lazy Loading State
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const categories = [
    { id: 'ALL', label: 'Semua' },
    { id: 'Apple', label: 'Apple' },
    { id: 'Samsung', label: 'Samsung' },
    { id: 'Xiaomi', label: 'Xiaomi' },
    { id: 'ASUS', label: 'ASUS' },
    { id: 'Vivo', label: 'Vivo' },
    { id: 'Oppo', label: 'Oppo' },
  ]

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true)
      const [prodRes, adRes] = await Promise.all([
        fetch('/api/gadgets'),
        fetch('/api/ads?placement=PROMOTED_LIST&limit=4'),
      ])
      const prodData = await prodRes.json()
      if (prodData.success && Array.isArray(prodData.data)) {
        setProducts(prodData.data)
      }
      const adData = await adRes.json()
      if (
        adData.success &&
        Array.isArray(adData.data) &&
        adData.data.length > 0
      ) {
        setPromotedAds(adData.data)
      }
    } catch (error) {
      console.error('Error loading featured gadgets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter products by selected category
  const filtered =
    selectedCategory === 'ALL'
      ? products
      : products.filter((p) => {
          const brandMatch =
            p.brand?.toLowerCase() === selectedCategory.toLowerCase()
          const catMatch =
            p.category?.toLowerCase() === selectedCategory.toLowerCase()
          return brandMatch || catMatch
        })

  // Reset pagination when category changes
  useEffect(() => {
    setVisibleCount(INITIAL_COUNT)
  }, [selectedCategory])

  const featuredGridItems = useMemo(() => {
    return assembleCatalogGridItems(
      filtered.slice(0, visibleCount),
      promotedAds
    )
  }, [filtered, visibleCount, promotedAds])

  const hasMore = visibleCount < filtered.length

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filtered.length))
      setIsLoadingMore(false)
    }, 250)
  }, [isLoadingMore, hasMore, filtered.length])

  // IntersectionObserver for seamless auto lazy loading
  useEffect(() => {
    if (!hasMore || loading) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  return (
    <section className="relative w-full bg-white py-12 dark:bg-slate-950 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-2.5 sm:px-6 lg:px-8">
        {/* Streamlined Section Header & Action Toolbar */}
        <div className="mb-6 space-y-3 sm:mb-10 sm:space-y-4">
          {/* Row 1: Crisp Section Title */}
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Smartphone Second Pilihan
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Unit fisik second grade tertinggi, lolos uji QC 32 titik, &
              bergaransi toko 30 hari
            </p>
          </div>

          {/* Row 2: Unified Balanced Filter & Action Bar */}
          <div className="flex flex-col gap-2.5 pt-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3.5">
            {/* Left: Compact Brand Filter Capsule Pills */}
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((c) => {
                const isSelected = selectedCategory === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200 sm:px-3.5 sm:py-1.5 sm:text-xs ${
                      isSelected
                        ? 'shadow-xs border border-orange-500 bg-orange-50/80 font-bold text-orange-600 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-400'
                        : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>

            {/* Right: Action Orange Discovery Capsule */}
            <Link
              href="/gadget"
              className="group inline-flex w-fit shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-orange-500 px-3.5 py-1 text-[11px] font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 active:scale-95 sm:px-4 sm:py-1.5 sm:text-xs"
            >
              <span>Lihat Semua ({products.length} Unit)</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Product Grid — Natural Flow without h-screen or inner scrollbars */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-slate-200/60 p-2 dark:border-slate-800 sm:p-4"
                >
                  <div className="mb-2 aspect-square w-full rounded-xl bg-slate-200 dark:bg-slate-800 sm:mb-3.5" />
                  <div className="mb-2 h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-800 sm:h-4" />
                  <div className="mb-2.5 h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
                  <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800 sm:h-5" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
              <Smartphone className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                Tidak ada produk untuk kategori ini
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 items-stretch gap-2 sm:gap-4 lg:grid-cols-4">
              {featuredGridItems.map((gridItem, idx) => {
                if (gridItem.type === 'ad') {
                  return (
                    <InFeedStoreAdCard
                      key={`ad-${gridItem.data.id}-${idx}`}
                      ad={gridItem.data}
                    />
                  )
                }

                const product = gridItem.data
                const rawImg =
                  Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0]
                    : typeof product.images === 'string' &&
                        product.images.startsWith('http')
                      ? product.images
                      : product.image

                const displayImg =
                  rawImg ||
                  FALLBACK_GADGET_IMAGES[
                    Math.abs(product.id?.charCodeAt(0) || 0) %
                      FALLBACK_GADGET_IMAGES.length
                  ]

                const storeName =
                  typeof product.store === 'object'
                    ? product.store?.name || product.store?.companyName
                    : product.store

                const specsText =
                  typeof product.specs === 'object' && product.specs !== null
                    ? Object.entries(product.specs)
                        .map(([k, v]) => `${k}: ${v}`)
                        .slice(0, 2)
                        .join(' • ')
                    : product.specs ||
                      `${product.brand || 'Gadget'} Official Flagship`

                const totalStock =
                  product.variants && product.variants.length > 0
                    ? product.variants.reduce(
                        (sum: number, v: any) => sum + (Number(v.stock) || 0),
                        0
                      )
                    : Number(product.stock) || 0

                return (
                  <div
                    key={product.id}
                    className="shadow-2xs sm:shadow-xs group relative flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-2 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:rounded-3xl sm:p-4"
                  >
                    <Link
                      href={`/gadget/${product.id}`}
                      className="block cursor-pointer focus:outline-none"
                    >
                      {/* 1. Media Header (Square Cropped Hero Photo) */}
                      <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-100 dark:border-slate-800/80 dark:bg-slate-950/60 sm:mb-3.5 sm:rounded-2xl">
                        <Image
                          src={displayImg}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                          unoptimized
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Top-Right: Solid Clean Rating Capsule */}
                        <div className="absolute right-1.5 top-1.5 z-10 flex select-none items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-slate-900 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:border-slate-700/80 dark:bg-slate-900 dark:text-white sm:right-2.5 sm:top-2.5 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11px]">
                          <Star className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400 sm:h-3 sm:w-3" />
                          <span className="font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                            {(product.rating || 5.0).toFixed(1)}
                          </span>
                          <span className="hidden text-[10px] font-normal tabular-nums text-slate-400 dark:text-slate-500 sm:inline">
                            ({product.totalReview || 0})
                          </span>
                        </div>
                      </div>

                      {/* 2. Info, Store & Stock */}
                      <div className="space-y-1.5 px-0.5 sm:space-y-2">
                        <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px]">
                          <div className="flex min-w-0 items-center gap-1 truncate font-medium text-slate-400">
                            <Store className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                            <span className="truncate text-[10px] sm:text-[11px]">
                              {storeName || 'Toko Resmi'}
                            </span>
                          </div>

                          {/* Stock Pill */}
                          <div className="shrink-0">
                            {totalStock > 5 ? (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100/90 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:gap-1 sm:text-[10px]">
                                <Package className="hidden h-2.5 w-2.5 text-slate-500 sm:inline" />
                                <span>{totalStock} Unit</span>
                              </span>
                            ) : totalStock > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 sm:text-[10px]">
                                <span>Sisa {totalStock}!</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/60 bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 sm:text-[10px]">
                                <span>Habis</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="line-clamp-2 min-h-[32px] text-xs font-bold leading-tight text-slate-900 group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 sm:min-h-[40px] sm:text-sm">
                          {product.name}
                        </h3>

                        <p className="line-clamp-1 text-[10px] font-medium text-slate-400 sm:text-xs">
                          {specsText}
                        </p>

                        <div className="flex items-baseline justify-between gap-1 pt-1">
                          <span className="text-xs font-black tracking-tight text-slate-950 dark:text-white sm:text-base">
                            Rp {(product.price || 0).toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-0.5 text-[10px] sm:text-[11px]">
                          {product.originalPrice &&
                          product.originalPrice > product.price ? (
                            <span className="text-slate-400 line-through">
                              Rp {product.originalPrice.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="font-medium text-slate-500 dark:text-slate-400">
                            Terjual {product.soldCount ?? 0}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          {/* Lazy Loading Sentinel & Interactive Controls */}
          {filtered.length > 0 && (
            <div ref={sentinelRef} className="mt-8 text-center sm:mt-12">
              {isLoadingMore ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  <span>Memuat lebih banyak smartphone...</span>
                </div>
              ) : hasMore ? (
                <button
                  type="button"
                  onClick={loadMore}
                  className="shadow-xs inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white px-6 py-2.5 text-xs font-bold text-slate-800 transition hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ChevronDown className="h-4 w-4" />
                  <span>
                    Tampilkan Lebih Banyak ({filtered.length - visibleCount}{' '}
                    unit tersisa)
                  </span>
                </button>
              ) : (
                <p className="text-xs font-medium text-slate-400">
                  Menampilkan seluruh {filtered.length} unit smartphone pilihan
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default SectionFeaturedGadgets
