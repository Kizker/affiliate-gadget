'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Gift, Store, Check, Package, Star } from 'lucide-react'

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
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
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
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
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
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
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
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      specs: 'A15 Bionic • Dual 12MP • Super Retina XDR',
      rating: 4.7,
      totalReview: 32,
    },
  ]

  const filtered = selectedCategory === 'ALL'
    ? products
    : products.filter((p) => p.category === selectedCategory)

  return (
    <section className="py-14 bg-slate-50/60 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              INVENTORI RESMI TOKO
            </span>
            <h2 className="mt-0.5 text-2xl font-black text-slate-950 sm:text-3xl dark:text-white">
              Smartphone Pilihan Siap Kirim
            </h2>
          </div>

          <Link
            href="/gadget"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Lihat Seluruh Katalog ({products.length}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div>
                {/* 1. Media Header (Square Cropped Hero Photo) */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 mb-3.5">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Top-Right: Solid Clean Rating Capsule */}
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-700/80 shadow-md transition-transform duration-300 group-hover:scale-105 select-none">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
                      {(product.rating || 4.9).toFixed(1)}
                    </span>
                    <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 tabular-nums">
                      ({product.totalReview || 24})
                    </span>
                  </div>
                </div>

                {/* 2. Details */}
                <div className="space-y-2 px-1">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-1 text-slate-400 font-medium truncate min-w-0">
                      <Store className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate text-[11px]">{product.store}</span>
                    </div>

                    {/* Stock Pill */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                      <Package className="h-2.5 w-2.5 text-slate-500" />
                      <span>{product.stock} Unit</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 dark:text-white group-hover:text-orange-600 transition-colors leading-snug min-h-[2.5rem]">
                    {product.name}
                  </h3>

                  <div className="pt-0.5 flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-black text-slate-950 dark:text-white tabular-nums tracking-tight whitespace-nowrap">
                        Rp {product.price.toLocaleString('id-ID')}
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
          ))}
        </div>
      </div>
    </section>
  )
}

export default SectionProductShowcase
