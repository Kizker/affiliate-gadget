'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Gift,
  Truck,
  ArrowRight,
  Store,
  CheckCircle2,
  ChevronRight,
  Layers,
  Zap,
} from 'lucide-react'

export function SectionHero() {
  const [activeSlide, setActiveSlide] = useState(0)

  const slides = [
    {
      category: 'FLAGSHIP SMARTPHONE',
      title: 'iPhone 15 Pro & Pro Max',
      highlight: 'Garansi 30 Hari Ganti Baru + Paket Bonus 3-in-1',
      desc: 'Beli langsung dari toko fisik resmi. Nikmati bonus Charger GaN 20W, Antigores 9D, dan Case Rp 0.',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&q=80',
      price: 'Rp 18.999.000',
      originalPrice: 'Rp 20.999.000',
      stockText: 'Tersedia di Toko Resmi',
      specs: ['A17 Pro Chip', '48MP Main Camera', 'Titanium Frame', 'USB-C 10Gbps'],
    },
    {
      category: 'ULTIMATE PERFORMANCE',
      title: 'Samsung Galaxy S24 Ultra',
      highlight: 'Galaxy AI & Titanium Armor Bergaransi Penuh',
      desc: 'Dapatkan unit second original berkualitas bergaransi toko 30 hari tukar unit + asuransi pengiriman terproteksi 100% via Gojek & JNE.',
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=900&q=80',
      price: 'Rp 16.499.000',
      originalPrice: 'Rp 21.999.000',
      stockText: 'Ready Stock Siap Kirim Hari Ini',
      specs: ['Snapdragon 8 Gen 3', '200MP Camera', 'Titanium Frame', 'S-Pen Included'],
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [slides.length])

  const slide = slides[activeSlide]

  return (
    <section className="relative bg-white pt-28 pb-14 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Status Announcement Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-900 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-900 dark:text-white">Jaringan Toko Fisik Aktif:</span>
            <span className="text-slate-500">Roxy Mas Jakarta, WTC Surabaya & BEC Bandung Buka Hari Ini</span>
          </div>
          <Link
            href="/toko"
            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 text-[11px]"
          >
            Lihat Lokasi Toko Terdekat <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Main Hero Grid */}
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Left Column (6.5 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <Zap className="h-3 w-3 text-orange-500" />
              <span>{slide.category}</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl dark:text-white leading-[1.12]">
                {slide.title}
              </h1>
              <p className="text-sm sm:text-base font-bold text-orange-600 dark:text-orange-400">
                {slide.highlight}
              </p>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 max-w-xl">
              {slide.desc}
            </p>

            {/* Spec Matrix Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {slide.specs.map((spec, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {spec}
                </span>
              ))}
            </div>

            {/* Value Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-900">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Garansi 30 Hari Tukar Unit</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Gift className="h-4 w-4 text-orange-500 shrink-0" />
                <span>Free Paket Bonus 3-in-1 Lengkap Rp 0</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Asuransi Kurir Terproteksi 100% (JNE/Gojek)</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Store className="h-4 w-4 text-purple-600 shrink-0" />
                <span>Toko Fisik Resmi Terpercaya</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                href="/gadget"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.98]"
              >
                Beli Sekarang di Katalog <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/toko"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Store className="h-4 w-4 text-slate-500" /> Cek Toko Terdekat
              </Link>
            </div>
          </div>

          {/* Right Column: Physical Product Showcase Card (5.5 cols) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-slate-200/90 bg-slate-50 p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />

                {/* Top Overlay Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>Garansi Resmi 30 Hari</span>
                </div>

                {/* Bottom Overlay Bonus Bar */}
                <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-orange-500/95 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm flex items-center justify-between shadow-md">
                  <span className="flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5" /> Bonus: Charger 20W + Antigores + Case
                  </span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-black">
                    Rp 0
                  </span>
                </div>
              </div>

              {/* Card Footer: Price & Stock */}
              <div className="mt-3 flex items-center justify-between px-1">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Harga Spesial Website</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-950 dark:text-white">
                      {slide.price}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      {slide.originalPrice}
                    </span>
                  </div>
                </div>

                {/* Slide Switcher Controls */}
                <div className="flex items-center gap-1.5">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        activeSlide === idx
                          ? 'w-6 bg-blue-600'
                          : 'w-2 bg-slate-300 dark:bg-slate-700'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SectionHero
