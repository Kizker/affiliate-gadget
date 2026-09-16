'use client'

import { useState, useEffect } from 'react'
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
  MessageSquare,
} from 'lucide-react'

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

  return (
    <section className="flex h-screen flex-col overflow-hidden bg-white pt-16 dark:bg-slate-950">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-2.5 py-6 sm:px-6 sm:py-10 lg:px-8">
        {/* Streamlined Section Header & Action Toolbar */}
        <div className="mb-4 space-y-3 sm:mb-10 sm:space-y-4">
          {/* Row 1: Crisp Section Title */}
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Smartphone Second Pilihan
            </h2>
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
              className="group inline-flex w-fit shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-orange-500 px-3.5 py-1 text-[11px] font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 active:scale-95 sm:px-4 sm:py-1.5 sm:text-xs"
            >
              <span>Lihat Semua Katalog</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Product Grid — inner scrollable area */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:#e2e8f0_transparent] [scrollbar-width:thin]">
          {loading ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
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
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
              {filtered.slice(0, 8).map((product) => {
                const displayImg =
                  product.images?.[0] ||
                  product.image ||
                  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'
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
                    className="shadow-2xs sm:shadow-xs group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-2 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:rounded-3xl sm:p-4"
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

                        <h3 className="line-clamp-2 min-h-[2rem] text-xs font-bold leading-tight text-slate-950 transition-colors group-hover:text-orange-600 dark:text-white sm:min-h-[2.5rem] sm:text-sm sm:leading-snug">
                          {product.name}
                        </h3>

                        <div className="flex items-baseline justify-between gap-1 pt-0.5">
                          <div className="flex flex-wrap items-baseline gap-1">
                            <span className="whitespace-nowrap text-xs font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-base sm:text-lg">
                              Rp {(product.price || 0).toLocaleString('id-ID')}
                            </span>
                            {product.originalPrice &&
                              product.originalPrice > product.price && (
                                <span className="hidden whitespace-nowrap text-xs font-normal tabular-nums text-slate-400 line-through sm:inline">
                                  Rp{' '}
                                  {product.originalPrice.toLocaleString(
                                    'id-ID'
                                  )}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* 3. Action Buttons (Action Orange) */}
                    <div className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-800/80 sm:mt-3.5 sm:gap-2 sm:pt-3">
                      <Link
                        href={`/gadget/${product.id}`}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-orange-500 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 active:scale-[0.98] sm:rounded-2xl sm:py-2.5 sm:text-xs"
                      >
                        <span>Beli Sekarang</span>
                        <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
                      </Link>

                      {product.store?.id && (
                        <Link
                          href={`/dashboard/customer/chat?storeId=${product.store.id}&productId=${product.id}&productName=${encodeURIComponent(product.name || '')}&productPrice=${product.price || 0}&productImage=${encodeURIComponent(product.images?.[0] || '')}`}
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
      </div>
    </section>
  )
}

export default SectionFeaturedGadgets
