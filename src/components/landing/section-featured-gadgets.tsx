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
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        {/* Streamlined Section Header & Action Toolbar */}
        <div className="mb-8 space-y-4 sm:mb-10">
          {/* Row 1: Crisp Section Title */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Smartphone Second Pilihan
            </h2>
          </div>

          {/* Row 2: Unified Balanced Filter & Action Bar */}
          <div className="flex flex-col gap-3.5 pt-0.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Compact Brand Filter Capsule Pills */}
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((c) => {
                const isSelected = selectedCategory === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
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
              className="group inline-flex w-fit shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 active:scale-95"
            >
              <span>Lihat Semua Katalog</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Product Grid — inner scrollable area */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:#e2e8f0_transparent] [scrollbar-width:thin]">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-slate-200/60 p-4 dark:border-slate-800"
                >
                  <div className="mb-3.5 aspect-square w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="mb-2 h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="mb-3 h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
                  <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                    className="shadow-xs group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    <Link
                      href={`/gadget/${product.id}`}
                      className="block focus:outline-none cursor-pointer"
                    >
                      {/* 1. Media Header (Square Cropped Hero Photo) */}
                      <div className="relative mb-3.5 aspect-square w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 dark:border-slate-800/80 dark:bg-slate-950/60">
                        <Image
                          src={displayImg}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Top-Right: Solid Clean Rating Capsule */}
                        <div className="absolute right-2.5 top-2.5 z-10 flex select-none items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-md transition-transform duration-300 group-hover:scale-105 dark:border-slate-700/80 dark:bg-slate-900 dark:text-white">
                          <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                          <span className="font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                            {(product.rating || 5.0).toFixed(1)}
                          </span>
                          <span className="text-[10px] font-normal tabular-nums text-slate-400 dark:text-slate-500">
                            ({product.totalReview || 0})
                          </span>
                        </div>
                      </div>

                      {/* 2. Info, Store & Stock */}
                      <div className="space-y-2 px-1">
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <div className="flex min-w-0 items-center gap-1 truncate font-medium text-slate-400">
                            <Store className="h-3 w-3 shrink-0" />
                            <span className="truncate text-[11px]">
                              {storeName || 'Toko Resmi'}
                            </span>
                          </div>

                          {/* Stock Pill */}
                          <div className="shrink-0">
                            {totalStock > 5 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                <Package className="h-2.5 w-2.5 text-slate-500" />
                                <span>{totalStock} Unit</span>
                              </span>
                            ) : totalStock > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                </span>
                                <span>Sisa {totalStock}!</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/60 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                                <span>Habis</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-slate-950 transition-colors group-hover:text-orange-600 dark:text-white">
                          {product.name}
                        </h3>

                        <div className="flex items-baseline justify-between gap-2 pt-0.5">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="whitespace-nowrap text-base font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-lg">
                              Rp {(product.price || 0).toLocaleString('id-ID')}
                            </span>
                            {product.originalPrice &&
                              product.originalPrice > product.price && (
                                <span className="whitespace-nowrap text-xs font-normal tabular-nums text-slate-400 line-through">
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
                    <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                      <Link
                        href={`/gadget/${product.id}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 active:scale-[0.98]"
                      >
                        <span>Beli Sekarang</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>

                      {product.store?.id && (
                        <Link
                          href={`/dashboard/customer/chat?storeId=${product.store.id}&productId=${product.id}&productName=${encodeURIComponent(product.name || '')}&productPrice=${product.price || 0}&productImage=${encodeURIComponent(product.images?.[0] || '')}`}
                          className="shadow-2xs flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-orange-800 dark:hover:bg-orange-950/40 dark:hover:text-orange-300"
                          title="Chat Toko tentang produk ini"
                        >
                          <MessageSquare className="h-4 w-4" />
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
