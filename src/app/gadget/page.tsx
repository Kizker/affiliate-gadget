'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
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
} from 'lucide-react'

export default function GadgetKatalogPage() {
  const [gadgets, setGadgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [brand, setBrand] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('DEFAULT')

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
      <Navbar variant="light" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Unified Filter, Search & Sort Control Panel */}
          <div className="mb-8 rounded-3xl border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Left: Brand Pills Segment */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {brands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBrand(b)}
                  className={`rounded-2xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    brand === b
                      ? 'bg-slate-950 text-white shadow-2xs dark:bg-white dark:text-slate-950'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                  }`}
                >
                  {b === 'ALL' ? 'Semua Merek' : b}
                </button>
              ))}
            </div>

            {/* Right: Search Input & Sort Selector */}
            <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
              {/* Search Box */}
              <div className="relative flex-1 sm:w-64 lg:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari iPhone, Samsung, Xiaomi..."
                  className="w-full rounded-2xl bg-slate-50/80 border border-slate-200/70 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none rounded-2xl bg-slate-50/80 border border-slate-200/70 py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  <option value="DEFAULT">Urutan Terbaru</option>
                  <option value="PRICE_LOW">Harga Terendah</option>
                  <option value="PRICE_HIGH">Harga Tertinggi</option>
                </select>
                <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="py-24 text-center text-slate-400">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500 mb-3" />
              <p className="text-xs font-medium">Memuat katalog smartphone...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center rounded-3xl border border-slate-200/80 bg-white p-10 dark:border-slate-800 dark:bg-slate-900 space-y-3 shadow-xs">
              <Smartphone className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tidak ada produk yang cocok</h3>
              <p className="text-xs text-slate-500">Coba gunakan kata kunci lain atau pilih filter Semua Merek.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filtered.map((item) => {
                const totalStock = item.variants && item.variants.length > 0
                  ? item.variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
                  : (Number(item.stock) || 0)

                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    <div>
                      {/* 1. Media Header (Square Cropped Hero Photo) */}
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 mb-3.5">
                        <Image
                          src={(item.images && item.images[0]) || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Top-Right: Solid Clean Rating Capsule */}
                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-700/80 shadow-md transition-transform duration-300 group-hover:scale-105 select-none">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                          <span className="font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
                            {(item.rating || 5.0).toFixed(1)}
                          </span>
                          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 tabular-nums">
                            ({item.totalReview || 0})
                          </span>
                        </div>
                      </div>

                      {/* 2. Product Identity & Details */}
                      <div className="space-y-2 px-1">
                        {/* Store & Semantic Stock Row */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1 text-slate-400 font-medium truncate min-w-0">
                            <Store className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate text-[11px]">
                              {item.store ? item.store.name : 'Affiliate Gadget Official'}
                            </span>
                          </div>

                          {/* Semantic Stock Pill */}
                          <div className="shrink-0">
                            {totalStock > 5 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                <Package className="h-2.5 w-2.5 text-slate-500" />
                                <span>{totalStock} Unit</span>
                              </span>
                            ) : totalStock > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                </span>
                                <span>Sisa {totalStock}!</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400">
                                <span>Habis</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 dark:text-white group-hover:text-orange-600 transition-colors leading-snug min-h-[2.5rem]">
                          {item.name}
                        </h3>

                        {/* Price Row (Solid & Clear Formatting) */}
                        <div className="pt-0.5 flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-base sm:text-lg font-black text-slate-950 dark:text-white tabular-nums tracking-tight whitespace-nowrap">
                              Rp {item.price.toLocaleString('id-ID')}
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-xs text-slate-400 line-through tabular-nums whitespace-nowrap font-normal">
                                Rp {item.originalPrice.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>

                          {item.variants && item.variants.length > 1 && (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                              {item.variants.length} Varian
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. Action Button (Action Orange) */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <Link
                        href={`/gadget/${item.id}`}
                        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold transition-all duration-200 ${
                          totalStock > 0
                            ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98] shadow-sm shadow-orange-500/25'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>{totalStock > 0 ? 'Lihat Detail Unit' : 'Stok Habis'}</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>
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
  )
}
