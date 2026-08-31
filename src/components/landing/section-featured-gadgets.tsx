'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Gift, Store, Sparkles, Smartphone, Package, Star } from 'lucide-react'

export function SectionFeaturedGadgets() {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      const res = await fetch('/api/gadgets')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error loading featured gadgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = selectedCategory === 'ALL'
    ? products
    : products.filter((p) => {
        const brandMatch = p.brand?.toLowerCase() === selectedCategory.toLowerCase()
        const catMatch = p.category?.toLowerCase() === selectedCategory.toLowerCase()
        return brandMatch || catMatch
      })

  return (
    <section className="py-16 sm:py-20 bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Streamlined Section Header & Action Toolbar */}
        <div className="space-y-4 mb-8 sm:mb-10">
          
          {/* Row 1: Crisp Section Title */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Smartphone Second Pilihan
            </h2>
          </div>

          {/* Row 2: Unified Balanced Filter & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 pt-0.5">
            {/* Left: Compact Brand Filter Capsule Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((c) => {
                const isSelected = selectedCategory === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-950 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
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
              className="group shrink-0 inline-flex items-center gap-1.5 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-4 py-1.5 text-xs font-bold shadow-sm shadow-orange-500/25 transition-all duration-200 cursor-pointer w-fit"
            >
              <span>Lihat Semua Katalog</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800">
                <div className="aspect-square w-full rounded-xl bg-slate-200 dark:bg-slate-800 mb-3.5" />
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800 mb-2" />
                <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60 mb-3" />
                <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.slice(0, 8).map((product) => {
              const displayImg = product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'
              const storeName = typeof product.store === 'object' ? product.store?.name || product.store?.companyName : product.store
              const specsText = typeof product.specs === 'object' && product.specs !== null
                ? Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`).slice(0, 2).join(' • ')
                : product.specs || `${product.brand || 'Gadget'} Official Flagship`

              const totalStock = product.variants && product.variants.length > 0
                ? product.variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
                : (Number(product.stock) || 0)

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <div>
                    {/* 1. Media Header (Square Cropped Hero Photo) */}
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 mb-3.5">
                      <Image
                        src={displayImg}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      
                      {/* Top-Right: Solid Clean Rating Capsule */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-700/80 shadow-md transition-transform duration-300 group-hover:scale-105 select-none">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                        <span className="font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
                          {(product.rating || 5.0).toFixed(1)}
                        </span>
                        <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 tabular-nums">
                          ({product.totalReview || 0})
                        </span>
                      </div>
                    </div>

                    {/* 2. Info, Store & Stock */}
                    <div className="space-y-2 px-1">
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1 text-slate-400 font-medium truncate min-w-0">
                          <Store className="h-3 w-3 shrink-0" />
                          <span className="truncate text-[11px]">{storeName || 'Toko Resmi'}</span>
                        </div>

                        {/* Stock Pill */}
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

                      <h3 className="text-sm font-bold text-slate-950 dark:text-white line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug min-h-[2.5rem]">
                        {product.name}
                      </h3>

                      <div className="pt-0.5 flex items-baseline justify-between gap-2">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-base sm:text-lg font-black text-slate-950 dark:text-white tabular-nums tracking-tight whitespace-nowrap">
                            Rp {(product.price || 0).toLocaleString('id-ID')}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs text-slate-400 line-through tabular-nums whitespace-nowrap font-normal">
                              Rp {product.originalPrice.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Action Button (Action Orange) */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <Link
                      href={`/gadget/${product.id}`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 active:scale-[0.98]"
                    >
                      <span>Beli Sekarang</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </section>
  )
}

export default SectionFeaturedGadgets
