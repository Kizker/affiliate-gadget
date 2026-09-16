'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  Gift,
  Store,
  Check,
  Package,
  Star,
} from 'lucide-react'

export function SectionProductShowcase() {
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const categories = [
    { id: 'ALL', label: 'Semua' },
    { id: 'iPhone', label: 'Apple' },
    { id: 'Samsung', label: 'Samsung' },
    { id: 'Gaming', label: 'Gaming' },
  ]

  const products = [
    {
      id: 'prod-iphone-15-pro',
      name: 'iPhone 15 Pro 128GB Titanium',
      brand: 'Apple',
      category: 'iPhone',
      price: 18999000,
      originalPrice: 20999000,
      stock: 12,
      store: 'Roxy Mas Pusat',
      city: 'Jakarta Pusat',
      image:
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
      specs: 'A17 Pro • 8GB RAM • 120Hz OLED',
      rating: 4.9,
      totalReview: 28,
    },
    {
      id: 'prod-samsung-s24-ultra',
      name: 'Samsung Galaxy S24 Ultra 5G 512GB',
      brand: 'Samsung',
      category: 'Samsung',
      price: 21999000,
      originalPrice: 23999000,
      stock: 10,
      store: 'Surabaya WTC',
      city: 'Surabaya',
      image:
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
      specs: 'Snapdragon 8 Gen 3 • 12GB RAM • 200MP',
      rating: 4.8,
      totalReview: 19,
    },
    {
      id: 'prod-rog-phone-8',
      name: 'ASUS ROG Phone 8 Pro 16GB/512GB',
      brand: 'ASUS',
      category: 'Gaming',
      price: 15499000,
      originalPrice: 16999000,
      stock: 6,
      store: 'BEC Bandung',
      city: 'Bandung',
      image:
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
      specs: 'Snapdragon 8 Gen 3 • 165Hz AMOLED • 5500mAh',
      rating: 4.9,
      totalReview: 14,
    },
    {
      id: 'prod-iphone-14',
      name: 'iPhone 14 128GB Midnight Blue',
      brand: 'Apple',
      category: 'iPhone',
      price: 12499000,
      originalPrice: 13999000,
      stock: 8,
      store: 'Roxy Mas Pusat',
      city: 'Jakarta Pusat',
      image:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      specs: 'A15 Bionic • Dual 12MP • Super Retina XDR',
      rating: 4.7,
      totalReview: 32,
    },
  ]

  const filtered =
    selectedCategory === 'ALL'
      ? products
      : products.filter((p) => p.category === selectedCategory)

  return (
    <section className="border-b border-slate-100 bg-slate-50/60 py-14 dark:border-slate-900 dark:bg-slate-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              INVENTORI RESMI TOKO
            </span>
            <h2 className="mt-0.5 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
              Smartphone Pilihan Siap Kirim
            </h2>
          </div>

          <Link
            href="/gadget"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Lihat Seluruh Katalog ({products.length}){' '}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Category Pills */}
        <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-blue-600'
                  : 'border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Product Grid: 2 Columns on Mobile */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          {filtered.map((product) => (
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
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Top-Right: Solid Clean Rating Capsule */}
                  <div className="absolute right-1.5 top-1.5 z-10 flex select-none items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-slate-900 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:border-slate-700/80 dark:bg-slate-900 dark:text-white sm:right-2.5 sm:top-2.5 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11px]">
                    <Star className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400 sm:h-3 sm:w-3" />
                    <span className="font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                      {(product.rating || 4.9).toFixed(1)}
                    </span>
                    <span className="hidden text-[10px] font-normal tabular-nums text-slate-400 dark:text-slate-500 sm:inline">
                      ({product.totalReview || 24})
                    </span>
                  </div>
                </div>

                {/* 2. Details */}
                <div className="space-y-1.5 px-0.5 sm:space-y-2">
                  <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px]">
                    <div className="flex min-w-0 items-center gap-1 truncate font-medium text-slate-400">
                      <Store className="h-2.5 w-2.5 shrink-0 text-slate-400 sm:h-3 sm:w-3" />
                      <span className="truncate text-[10px] sm:text-[11px]">
                        {product.store}
                      </span>
                    </div>

                    {/* Stock Pill */}
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100/90 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:text-[10px]">
                      <span>{product.stock} Unit</span>
                    </span>
                  </div>

                  <h3 className="line-clamp-2 min-h-[2rem] text-xs font-bold leading-tight text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white sm:min-h-[2.5rem] sm:text-sm sm:leading-snug">
                    {product.name}
                  </h3>

                  <div className="flex items-baseline justify-between gap-1 pt-0.5">
                    <div className="flex flex-wrap items-baseline gap-1">
                      <span className="whitespace-nowrap text-xs font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-base sm:text-lg">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
                      {product.originalPrice &&
                        product.originalPrice > product.price && (
                          <span className="hidden whitespace-nowrap text-xs font-normal tabular-nums text-slate-400 line-through sm:inline">
                            Rp {product.originalPrice.toLocaleString('id-ID')}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </Link>

              {/* 3. Action Button (Action Orange) */}
              <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800/80 sm:mt-3.5 sm:pt-3">
                <Link
                  href={`/gadget/${product.id}`}
                  className="flex w-full items-center justify-center gap-1 rounded-xl bg-orange-500 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 active:scale-[0.98] sm:rounded-2xl sm:py-2.5 sm:text-xs"
                >
                  <span>Beli Sekarang</span>
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SectionProductShowcase
