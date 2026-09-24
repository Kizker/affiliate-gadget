'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar, Footer, MobileBottomNav } from '@/components/layouts'
import { MobileCatalogView } from '@/components/gadget/mobile-catalog-view'
import {
  ShieldCheck,
  Gift,
  ArrowRight,
  Search,
  Store,
  Smartphone,
  X,
  SlidersHorizontal,
  Package,
  Star,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'

function GadgetKatalogContent() {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [gadgets, setGadgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [brand, setBrand] = useState('ALL')
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '')
  const [sortBy, setSortBy] = useState('DEFAULT')

  // Sync search state jika URL param berubah (mis. navigasi dari navbar)
  useEffect(() => {
    const q = searchParams.get('search') ?? ''
    setSearch(q)
  }, [searchParams])

  useEffect(() => {
    fetchGadgets()
  }, [])

  const fetchGadgets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gadgets')
      const data = await res.json()
      if (data.success && data.data) {
        setGadgets(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const brands = ['ALL', 'Apple', 'Samsung', 'Xiaomi', 'ASUS']

  const filtered = gadgets.filter((g) => {
    if (brand !== 'ALL' && g.brand?.toUpperCase() !== brand.toUpperCase()) {
      return false
    }
    if (!search) return true
    return (
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.brand && g.brand.toLowerCase().includes(search.toLowerCase())) ||
      (g.store && g.store.name.toLowerCase().includes(search.toLowerCase()))
    )
  })

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'PRICE_LOW')
      return (Number(a.price) || 0) - (Number(b.price) || 0)
    if (sortBy === 'PRICE_HIGH')
      return (Number(b.price) || 0) - (Number(a.price) || 0)
    if (sortBy === 'RATING')
      return (Number(b.rating) || 0) - (Number(a.rating) || 0)
    return 0
  })

  return (
    <>
      {/* 1. Mobile View — Figma Screen 2: Katalog Produk Gadget */}
      <div className="block md:hidden">
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
        />
        <MobileBottomNav activeTab="katalog" />
      </div>

      {/* 2. Desktop View — Clean Responsive Grid */}
      <div className="hidden min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:flex">
        <Navbar variant="light" />

        <main className="pb-16 pt-20 sm:pb-20 sm:pt-28">
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
                    className="w-full rounded-xl border border-slate-200/70 bg-slate-50/80 py-1.5 pl-8 pr-8 text-[11px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:rounded-2xl sm:py-2 sm:pl-9 sm:text-xs"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
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
                    size="sm"
                    options={[
                      { value: 'DEFAULT', label: 'Urutan Terbaru' },
                      { value: 'PRICE_LOW', label: 'Harga Terendah' },
                      { value: 'PRICE_HIGH', label: 'Harga Tertinggi' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Products Grid: 2 Columns on Mobile, fits 2 rows in viewport */}
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
              <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
                {filtered.map((item) => {
                  const totalStock =
                    item.variants && item.variants.length > 0
                      ? item.variants.reduce(
                          (sum: number, v: any) => sum + (Number(v.stock) || 0),
                          0
                        )
                      : Number(item.stock) || 0

                  return (
                    <div
                      key={item.id}
                      className="shadow-2xs sm:shadow-xs group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-2 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:rounded-3xl sm:p-4"
                    >
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
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Top-Right: Solid Clean Rating Capsule */}
                          <div className="absolute right-1.5 top-1.5 z-10 flex select-none items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-slate-900 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:border-slate-700/80 dark:bg-slate-900 dark:text-white sm:right-2.5 sm:top-2.5 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11px]">
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
                            <div className="flex flex-wrap items-baseline gap-1">
                              <span className="whitespace-nowrap text-xs font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-base sm:text-lg">
                                Rp {item.price.toLocaleString('id-ID')}
                              </span>
                              {item.originalPrice &&
                                item.originalPrice > item.price && (
                                  <span className="hidden whitespace-nowrap text-xs font-normal tabular-nums text-slate-400 line-through sm:inline">
                                    Rp{' '}
                                    {item.originalPrice.toLocaleString('id-ID')}
                                  </span>
                                )}
                            </div>

                            {item.variants && item.variants.length > 1 && (
                              <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-slate-800 sm:text-[10px]">
                                {item.variants.length} Varian
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* 3. Action Buttons */}
                      <div className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-800/80 sm:mt-3.5 sm:gap-2 sm:pt-3">
                        <Link
                          href={`/gadget/${item.id}`}
                          className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-bold transition-all duration-200 sm:rounded-2xl sm:py-2.5 sm:text-xs ${
                            totalStock > 0
                              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 active:scale-[0.98]'
                              : 'cursor-not-allowed bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500'
                          }`}
                        >
                          <span>
                            {totalStock > 0 ? 'Lihat Detail' : 'Stok Habis'}
                          </span>
                          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
                        </Link>

                        {item.store?.id && (
                          <Link
                            href={`/dashboard/customer/chat?storeId=${item.store.id}&productId=${item.id}&productName=${encodeURIComponent(item.name || '')}&productPrice=${item.price || 0}&productImage=${encodeURIComponent(item.images?.[0] || '')}`}
                            className="shadow-2xs flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-orange-800 dark:hover:bg-orange-950/40 dark:hover:text-orange-300 sm:h-9 sm:w-9 sm:rounded-2xl"
                            title="Chat Toko tentang produk ini"
                          >
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>

        <Footer variant="light" />
      </div>
    </>
  )
}

export default function GadgetKatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <Navbar variant="light" />
          <div className="flex flex-1 items-center justify-center pt-28">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
          <Footer variant="light" />
        </div>
      }
    >
      <GadgetKatalogContent />
    </Suspense>
  )
}
