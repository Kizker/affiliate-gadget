'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar, Footer, MobileBottomNav } from '@/components/layouts'
import { MobileCatalogView } from '@/components/gadget/mobile-catalog-view'
import { MobileTopHeroBanner } from '@/components/ads/mobile-top-hero-banner'
import {
  ShieldCheck,
  Gift,
  Search,
  Store,
  Smartphone,
  X,
  SlidersHorizontal,
  Package,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Heart,
} from 'lucide-react'
import { toast } from 'sonner'
import { useWishlistSafe } from '@/lib/store/wishlist-store'
import { CustomSelect } from '@/components/ui/custom-select'
import {
  InFeedStoreAdCard,
  InFeedAdData,
} from '@/components/ads/in-feed-store-ad-card'
import {
  buildPaginatedCatalogGrid,
  CatalogGridItem,
} from '@/lib/catalog-grid-layout'
import { sortProductsByRelevance } from '@/lib/relevance-scoring'
import {
  filterGadgetsWithSmartSearch,
  createProductFuseIndex,
  analyzeSmartQuery,
  SmartAnalysisResult,
} from '@/lib/smart-search'
import {
  LiveBannerCard,
  LiveBannerData,
} from '@/components/live/live-banner-card'
import INITIAL_CATALOG_GADGETS from '@/lib/initial-gadgets.json'
import { useIsMobile } from '@/hooks/use-is-mobile'

function GadgetKatalogContent() {
  const isMobile = useIsMobile(768)
  const [mounted, setMounted] = useState(false)
  const { isInWishlist, toggleItem } = useWishlistSafe()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [gadgets, setGadgets] = useState<any[]>(() => INITIAL_CATALOG_GADGETS)
  const [promotedAds, setPromotedAds] = useState<InFeedAdData[]>([])
  const [liveStreams, setLiveStreams] = useState<LiveBannerData[]>([])
  const promotedAd = promotedAds[0] || null
  const [loading, setLoading] = useState(false)
  const [brand, setBrand] = useState('ALL')
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '')
  const [sortBy, setSortBy] = useState('RELEVANCE')
  const [ignoreCorrection, setIgnoreCorrection] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleWishlist = (item: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rawImg =
      (item.images && item.images[0]) ||
      item.image ||
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'

    const storeName =
      typeof item.store === 'object'
        ? item.store?.name || item.store?.companyName
        : item.store

    const wasAdded = toggleItem({
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: rawImg,
      href: `/gadget/${item.id}`,
      rating: item.rating,
      reviewCount: item.totalReview,
      originCity: item.store?.city,
      storeName: storeName || 'Affiliate Gadget Official',
    })

    if (wasAdded) {
      toast.success(`Ditambahkan ke Wishlist: ${item.name}`)
    } else {
      toast.info(`Dihapus dari Wishlist: ${item.name}`)
    }
  }

  // Reset ignore correction when search query changes
  useEffect(() => {
    setIgnoreCorrection(false)
  }, [search])

  // Sync search state jika URL param berubah (mis. navigasi dari navbar)
  useEffect(() => {
    const q = searchParams.get('search') ?? ''
    setSearch(q)
  }, [searchParams])

  useEffect(() => {
    const query = searchParams.get('search')
    if (query) {
      fetchGadgets()
      return
    }

    const timer = setTimeout(() => {
      fetchGadgets()
    }, 2500)

    return () => clearTimeout(timer)
  }, [searchParams])

  const fetchGadgets = async () => {
    if (gadgets.length === 0) {
      setLoading(true)
    }
    try {
      const [gRes, adRes, liveRes] = await Promise.all([
        fetch('/api/gadgets'),
        fetch('/api/ads?placement=PROMOTED_LIST&limit=50'),
        fetch('/api/live-streams?status=LIVE&limit=3'),
      ])
      const data = await gRes.json()
      if (data.success && data.data) {
        setGadgets(data.data)
      }
      const adData = await adRes.json()
      if (
        adData.success &&
        Array.isArray(adData.data) &&
        adData.data.length > 0
      ) {
        setPromotedAds(adData.data)
      }
      const liveData = await liveRes.json()
      if (liveData.success && Array.isArray(liveData.data)) {
        setLiveStreams(liveData.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const brands = ['ALL', 'Apple', 'Samsung', 'Xiaomi', 'ASUS']

  // Smart Search: Analisis Typo Tolerant & Fuzzy Matching (Fuse.js ML-grade)
  const { filtered, smartAnalysis } = useMemo(() => {
    if (ignoreCorrection) {
      const litFiltered = gadgets.filter((g) => {
        if (brand !== 'ALL' && g.brand?.toUpperCase() !== brand.toUpperCase()) {
          return false
        }
        if (!search) return true
        const s = search.toLowerCase()
        return (
          g.name?.toLowerCase().includes(s) ||
          g.brand?.toLowerCase().includes(s) ||
          g.store?.name?.toLowerCase().includes(s)
        )
      })
      return {
        filtered: litFiltered,
        smartAnalysis: {
          originalQuery: search,
          effectiveQuery: search,
          hasCorrection: false,
          corrections: [],
        },
      }
    }

    // Layer 1: Smart Search (dictionary + Levenshtein + Fuse vocab)
    const primaryResult = filterGadgetsWithSmartSearch(gadgets, search, brand)

    // Layer 2: Fuse.js direct product search sebagai ultimate fallback
    // Aktif hanya jika: ada query, hasil primary kosong, dan query >= 2 karakter
    if (primaryResult.filtered.length === 0 && search.trim().length >= 2) {
      // Saring brand dulu sebelum masuk Fuse
      const brandFiltered =
        brand !== 'ALL'
          ? gadgets.filter(
              (g) => g.brand?.toUpperCase() === brand.toUpperCase()
            )
          : gadgets

      const fuseIndex = createProductFuseIndex(brandFiltered)
      const fuseResults = fuseIndex.search(search.trim())

      if (fuseResults.length > 0) {
        const fuseFiltered = fuseResults.map((r) => r.item)
        // Buat smartAnalysis dari koreksi dictionary/Fuse vocab
        const analysis = analyzeSmartQuery(search)
        return {
          filtered: fuseFiltered,
          smartAnalysis: {
            ...analysis,
            // Jika Fuse berhasil tapi tidak ada koreksi dictionary, tandai sebagai hasCorrection
            // agar banner 'Menampilkan hasil untuk...' tetap tampil
            hasCorrection:
              analysis.hasCorrection ||
              analysis.effectiveQuery !== search.toLowerCase(),
          },
        }
      }
    }

    return primaryResult
  }, [gadgets, search, brand, ignoreCorrection])

  // Apply sorting — Default "Paling Relevan" (Shopee-Style Multi-Factor Relevance)
  const sorted = useMemo(() => {
    if (sortBy === 'PRICE_LOW') {
      return [...filtered].sort(
        (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0)
      )
    }
    if (sortBy === 'PRICE_HIGH') {
      return [...filtered].sort(
        (a, b) => (Number(b.price) || 0) - (Number(a.price) || 0)
      )
    }
    if (sortBy === 'RATING') {
      return [...filtered].sort(
        (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)
      )
    }
    if (sortBy === 'POPULAR' || sortBy === 'BEST_SELLER') {
      return [...filtered].sort(
        (a, b) => (Number(b.soldCount) || 0) - (Number(a.soldCount) || 0)
      )
    }
    if (sortBy === 'LATEST') {
      return [...filtered].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })
    }

    // Default: 'RELEVANCE' / 'DEFAULT' (Shopee-Style Multi-Factor Relevance Scoring)
    const effectiveSearch = ignoreCorrection
      ? search
      : smartAnalysis.effectiveQuery || search
    return sortProductsByRelevance(filtered, effectiveSearch)
  }, [filtered, sortBy, search, ignoreCorrection, smartAnalysis])

  // Desktop Pagination with exact 4-column balanced spans
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [brand, search, sortBy])

  const { items: paginatedDesktopGridItems, totalPages } = useMemo(() => {
    return buildPaginatedCatalogGrid(sorted, promotedAds, currentPage, 12)
  }, [sorted, promotedAds, currentPage])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    const el = document.getElementById('desktop-catalog-grid')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 180, behavior: 'smooth' })
    }
  }

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ]
    }
    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ]
  }

  return (
    <>
      {/* 1. Mobile View — Figma Screen 2: Katalog Produk Gadget */}
      {(!mounted || isMobile) && (
        <div
          className={`block md:hidden ${mounted && !isMobile ? 'hidden' : ''}`}
        >
          <MobileCatalogView
            gadgets={sorted}
            loading={loading}
            brand={brand}
            setBrand={setBrand}
            search={search}
            setSearch={setSearch}
            sortBy={sortBy}
            setSortBy={setSortBy}
            session={session}
            status={status}
            promotedAd={promotedAd}
            promotedAds={promotedAds}
            smartAnalysis={smartAnalysis}
            ignoreCorrection={ignoreCorrection}
            setIgnoreCorrection={setIgnoreCorrection}
            liveStreams={liveStreams}
          />
          <MobileBottomNav activeTab="beranda" />
        </div>
      )}

      {/* 2. Desktop View — Clean Responsive Grid */}
      {(!mounted || !isMobile) && (
        <div
          className={`hidden min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:flex ${mounted && isMobile ? '!hidden' : ''}`}
        >
          <Navbar variant="light" />

          <main className="pb-16 pt-20 sm:pb-20 sm:pt-28">
            <h1 className="sr-only">
              Katalog Smartphone & Gadget Original Garansi 30 Hari
            </h1>
            <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8">
              {/* Unified Filter, Search & Sort Control Panel */}
              <div className="shadow-2xs mb-3.5 flex flex-col items-stretch justify-between gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 sm:mb-8 sm:rounded-3xl sm:p-3 lg:flex-row lg:items-center">
                {/* Left: Brand Pills Segment */}
                <div className="no-scrollbar flex items-center gap-1 overflow-x-auto py-0.5">
                  {brands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrand(b)}
                      className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-xs ${
                        brand === b
                          ? 'shadow-xs border border-orange-500 bg-orange-50/80 font-bold text-orange-600 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-400'
                          : 'border border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {b === 'ALL' ? 'Semua Merek' : b}
                    </button>
                  ))}
                </div>

                {/* Right: Search Input & Sort Selector */}
                <div className="flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-800 lg:border-t-0 lg:pt-0">
                  {/* Search Box */}
                  <div className="relative flex-1 sm:w-64 lg:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari iPhone, Samsung, Xiaomi..."
                      aria-label="Cari iPhone, Samsung, Xiaomi atau model smartphone"
                      className="w-full rounded-xl border border-slate-200/70 bg-slate-50/80 py-1.5 pl-8 pr-8 text-[11px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:rounded-2xl sm:py-2 sm:pl-9 sm:text-xs"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        aria-label="Hapus kata kunci pencarian"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="shrink-0">
                    <CustomSelect
                      value={sortBy}
                      onChange={(val) => setSortBy(val)}
                      ariaLabel="Urutkan katalog smartphone"
                      size="sm"
                      options={[
                        { value: 'RELEVANCE', label: 'Paling Relevan' },
                        { value: 'POPULAR', label: 'Terlaris' },
                        { value: 'LATEST', label: 'Urutan Terbaru' },
                        { value: 'PRICE_LOW', label: 'Harga Terendah' },
                        { value: 'PRICE_HIGH', label: 'Harga Tertinggi' },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Level 1 Hero Carousel Video Banner (Desktop & Tablet) */}
              <div className="mb-6 md:mb-8">
                <MobileTopHeroBanner />
              </div>

              {/* Products Grid: 4 Columns on Desktop */}
              {loading ? (
                <div className="py-24 text-center text-slate-400">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500" />
                  <p className="text-xs font-medium">
                    Memuat katalog smartphone...
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="shadow-xs space-y-3 rounded-2xl border border-slate-200/80 bg-white p-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl sm:p-10 sm:py-20">
                  <Smartphone className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tidak ada produk yang cocok
                  </h3>
                  <p className="text-xs text-slate-500">
                    Coba gunakan kata kunci lain atau pilih filter Semua Merek.
                  </p>
                </div>
              ) : (
                <>
                  {/* Live Stream Banner — if any store is LIVE, show at top of grid */}
                  {liveStreams.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
                      {liveStreams.slice(0, 2).map((ls) => (
                        <LiveBannerCard key={ls.id} stream={ls} />
                      ))}
                    </div>
                  )}

                  <div
                    id="desktop-catalog-grid"
                    className="grid scroll-mt-28 grid-cols-2 items-stretch gap-2 sm:gap-4 lg:grid-cols-4"
                  >
                    {paginatedDesktopGridItems.map((gridItem, idx) => {
                      if (gridItem.type === 'ad') {
                        return (
                          <InFeedStoreAdCard
                            key={`ad-${gridItem.data.id}-${idx}`}
                            ad={gridItem.data}
                          />
                        )
                      }

                      const item = gridItem.data
                      const totalStock =
                        item.variants && item.variants.length > 0
                          ? item.variants.reduce(
                              (sum: number, v: any) =>
                                sum + (Number(v.stock) || 0),
                              0
                            )
                          : Number(item.stock) || 0

                      return (
                        <div
                          key={item.id}
                          className="shadow-2xs sm:shadow-xs group relative flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-2 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:rounded-3xl sm:p-4"
                        >
                          {/* Top-Right: Wishlist Love Button */}
                          <button
                            type="button"
                            onClick={(e) => toggleWishlist(item, e)}
                            className="group/wish absolute right-3.5 top-3.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-400 shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-90 dark:border-slate-700/80 dark:bg-slate-900/95 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 sm:right-5 sm:top-5 sm:h-8 sm:w-8"
                            aria-label="Wishlist"
                            title={
                              isInWishlist(item.id)
                                ? 'Hapus dari Wishlist'
                                : 'Tambah ke Wishlist'
                            }
                          >
                            <Heart
                              className={`h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4 ${
                                isInWishlist(item.id)
                                  ? 'fill-rose-500 text-rose-500'
                                  : 'text-slate-400 group-hover/wish:text-rose-500'
                              }`}
                            />
                          </button>

                          <Link
                            href={`/gadget/${item.id}`}
                            className="block cursor-pointer focus:outline-none"
                          >
                            {/* 1. Media Header (Square Cropped Hero Photo) */}
                            <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-100 dark:border-slate-800/80 dark:bg-slate-950/60 sm:mb-3.5 sm:rounded-2xl">
                              <Image
                                src={
                                  (item.images && item.images[0]) ||
                                  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
                                }
                                alt={item.name}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                priority={idx < 4}
                              />

                              {/* Top-Left: Solid Clean Rating Capsule */}
                              <div className="absolute left-1.5 top-1.5 z-10 flex select-none items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-slate-900 shadow-sm backdrop-blur-md transition-transform duration-300 group-hover:scale-105 dark:border-slate-700/80 dark:bg-slate-900 dark:text-white sm:left-2.5 sm:top-2.5 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11px]">
                                <Star className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400 sm:h-3 sm:w-3" />
                                <span className="font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                                  {(item.rating || 5.0).toFixed(1)}
                                </span>
                                <span className="hidden text-[10px] font-normal tabular-nums text-slate-400 dark:text-slate-500 sm:inline">
                                  ({item.totalReview || 0})
                                </span>
                              </div>
                            </div>

                            {/* 2. Product Identity & Details */}
                            <div className="space-y-1.5 px-0.5 sm:space-y-2">
                              {/* Store & Semantic Stock Row */}
                              <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs">
                                <div className="flex min-w-0 items-center gap-1 truncate font-medium text-slate-400">
                                  <Store className="h-2.5 w-2.5 shrink-0 text-slate-400 sm:h-3 sm:w-3" />
                                  <span className="truncate text-[10px] sm:text-[11px]">
                                    {item.store
                                      ? item.store.name
                                      : 'Affiliate Gadget Official'}
                                  </span>
                                </div>

                                {/* Semantic Stock Pill */}
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

                              {/* Title */}
                              <h3 className="line-clamp-2 min-h-[2rem] text-xs font-bold leading-tight text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white sm:min-h-[2.5rem] sm:text-sm sm:leading-snug">
                                {item.name}
                              </h3>

                              {/* Price Row (Solid & Clear Formatting) */}
                              <div className="flex items-baseline justify-between gap-1 pt-0.5">
                                <span className="whitespace-nowrap text-xs font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-base sm:text-lg">
                                  Rp {item.price.toLocaleString('id-ID')}
                                </span>

                                {item.variants && item.variants.length > 1 && (
                                  <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-slate-800 sm:text-[10px]">
                                    {item.variants.length} Varian
                                  </span>
                                )}
                              </div>

                              {/* Bottom Row: Strikethrough Price (Left) & Terjual (Right) */}
                              <div className="flex items-center justify-between gap-1 pt-0.5 text-[10px] sm:text-[11px]">
                                {item.originalPrice &&
                                item.originalPrice > item.price ? (
                                  <span className="whitespace-nowrap font-normal tabular-nums text-slate-400 line-through">
                                    Rp{' '}
                                    {item.originalPrice.toLocaleString('id-ID')}
                                  </span>
                                ) : (
                                  <span />
                                )}
                                <span className="whitespace-nowrap font-medium text-slate-500 dark:text-slate-400">
                                  Terjual {item.soldCount ?? 0}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      )
                    })}
                  </div>

                  {/* Desktop Pagination Bar */}
                  {totalPages > 1 && (
                    <div className="shadow-2xs mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:px-6">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Halaman{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {currentPage}
                        </span>{' '}
                        dari{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {totalPages}
                        </span>{' '}
                        ({sorted.length} total gadget)
                      </p>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          aria-label="Halaman sebelumnya"
                          className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline">Sebelumnya</span>
                        </button>

                        {getPageNumbers().map((p, idx) =>
                          p === '...' ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-2 text-xs font-bold text-slate-400"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={`page-${p}`}
                              type="button"
                              onClick={() => handlePageChange(Number(p))}
                              aria-label={`Ke Halaman ${p}`}
                              aria-current={
                                currentPage === p ? 'page' : undefined
                              }
                              className={`min-w-[36px] cursor-pointer rounded-xl px-3 py-2 text-xs font-bold transition active:scale-95 ${
                                currentPage === p
                                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                              }`}
                            >
                              {p}
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          aria-label="Halaman selanjutnya"
                          className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <span className="hidden sm:inline">Selanjutnya</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          <Footer variant="light" />
        </div>
      )}
    </>
  )
}

export default function GadgetKatalogPage() {
  return (
    <Suspense
      fallback={
        <>
          {/* Mobile Shell Fallback (Instant SSR HTML for Frame-1 LCP without spinner delay) */}
          <div className="block md:hidden">
            <MobileCatalogView
              gadgets={INITIAL_CATALOG_GADGETS}
              loading={false}
              brand="ALL"
              setBrand={() => {}}
              search=""
              setSearch={() => {}}
              sortBy="RELEVANCE"
              setSortBy={() => {}}
              session={null}
              status="unauthenticated"
              promotedAd={null}
              promotedAds={[]}
              liveStreams={[]}
            />
            <MobileBottomNav activeTab="beranda" />
          </div>

          {/* Desktop Shell Fallback */}
          <div className="hidden min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:flex">
            <Navbar variant="light" />
            <div className="flex flex-1 items-center justify-center pt-28">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
            <Footer variant="light" />
          </div>
        </>
      }
    >
      <GadgetKatalogContent />
    </Suspense>
  )
}
