'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Store,
  Star,
  Sparkles,
} from 'lucide-react'

export function SectionHeroClean() {
  // Initialized to 1 so the second card (iPhone 15 Pro Max) starts in the front foreground
  const [activeSlide, setActiveSlide] = useState(1)
  const [isPaused, setIsPaused] = useState(false)

  const showcaseItems = [
    {
      id: 'samsung-s24-ultra',
      brand: 'Samsung',
      name: 'Galaxy S24 Ultra 5G',
      tagline: 'Second Like New 99% • Galaxy AI',
      price: 'Rp 16.499.000',
      originalPrice: 'Rp 21.999.000',
      store: 'WTC Surabaya',
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=900&q=80',
      rating: 4.9,
      reviewCount: 38,
      href: '/gadget',
    },
    {
      id: 'iphone-15-pro-max',
      brand: 'Apple',
      name: 'iPhone 15 Pro & Pro Max',
      tagline: 'Second Like New 99% • BH 90%+',
      price: 'Rp 16.999.000',
      originalPrice: 'Rp 20.999.000',
      store: 'Roxy Mas Jakarta Pusat',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&q=80',
      rating: 5.0,
      reviewCount: 52,
      href: '/gadget',
    },
    {
      id: 'xiaomi-14-ultra',
      brand: 'Xiaomi',
      name: 'Xiaomi 14 Ultra Leica',
      tagline: 'Second Mulus 98% • Leica Quad Cam',
      price: 'Rp 13.299.000',
      originalPrice: 'Rp 18.999.000',
      store: 'BEC Bandung',
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=900&q=80',
      rating: 4.8,
      reviewCount: 29,
      href: '/gadget',
    },
  ]

  const totalSlides = showcaseItems.length

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused, totalSlides])

  return (
    <section className="relative overflow-hidden bg-white pt-28 pb-16 lg:pt-36 lg:pb-24 dark:bg-slate-950">
      
      {/* Soft Ambient Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[850px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-orange-100/30 via-slate-100/20 to-blue-100/30 blur-3xl dark:from-orange-950/10 dark:via-slate-900/10 dark:to-blue-950/10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          
          {/* Left Column: Clear Value Proposition & Direct CTAs (6 cols) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* High-Impact Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-slate-950 dark:text-white leading-[1.1]">
              Beli Gadget Second <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-950 via-blue-950 to-orange-600 dark:from-white dark:via-blue-300 dark:to-orange-400">
                Lebih Tenang & Terjamin.
              </span>
            </h1>

            {/* Concise Subtitle */}
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400 max-w-lg">
              Marketplace smartphone & gadget second original berbasis jaringan toko fisik se-Indonesia. Jaminan unit like new, 100% fungsi normal teruji teknisi, garansi toko 30 hari tukar unit, dan paket bonus lengkap 3-in-1.
            </p>

            {/* Primary Action Pill Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/gadget"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 sm:px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 active:scale-98 transition-all duration-200"
              >
                <span>Jelajahi Gadget Second</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              
              <Link
                href="/toko"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white px-5 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300 active:scale-98 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Store className="h-4 w-4 text-slate-500" />
                <span>Lokasi Toko Fisik</span>
              </Link>
            </div>

          </div>

          {/* Right Column: 3-Card 3D Layered Carousel (6 cols) */}
          <div 
            className="lg:col-span-6 select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative mx-auto max-w-md sm:max-w-lg lg:max-w-none">
              
              {/* 3D Depth Cards Stage with Hardware Acceleration & Spatial Perspective */}
              <div 
                className="relative h-[430px] sm:h-[460px] w-full flex items-center justify-center"
                style={{ perspective: '1200px' }}
              >
                
                {showcaseItems.map((item, idx) => {
                  // Calculate circular offset: -1 (left), 0 (center/front), 1 (right)
                  let diff = (idx - activeSlide + totalSlides) % totalSlides
                  if (diff === 2) diff = -1

                  const isCenter = diff === 0
                  const isLeft = diff === -1
                  const isRight = diff === 1

                  // Motion values based on 3D depth position
                  const motionValues = isCenter
                    ? { x: '0%', scale: 1, opacity: 1, rotateY: 0, zIndex: 30, filter: 'blur(0px)' }
                    : isLeft
                    ? { x: '-34%', scale: 0.84, opacity: 0.35, rotateY: 8, zIndex: 10, filter: 'blur(0.3px)' }
                    : { x: '34%', scale: 0.84, opacity: 0.35, rotateY: -8, zIndex: 10, filter: 'blur(0.3px)' }

                  return (
                    <motion.div
                      key={item.id}
                      animate={motionValues}
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 110,
                        damping: 19,
                        mass: 1.1,
                      }}
                      onClick={() => {
                        if (isLeft) setActiveSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
                        if (isRight) setActiveSlide((prev) => (prev + 1) % totalSlides)
                      }}
                      className={`absolute w-[86%] sm:w-[80%] rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xl overflow-hidden will-change-transform ${
                        isCenter ? 'cursor-default shadow-2xl shadow-slate-900/15 dark:shadow-black/70' : 'cursor-pointer hover:opacity-60'
                      }`}
                      style={{
                        transformStyle: 'preserve-3d',
                        transformOrigin: 'center center',
                      }}
                    >
                      {/* Product Image Stage */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          priority={isCenter}
                          sizes="(max-width: 640px) 100vw, 400px"
                          className="h-full w-full object-cover"
                        />

                        {/* Top-Left: Brand Badge */}
                        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full bg-slate-950/85 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur-md tracking-wide uppercase">
                          <Sparkles className="h-2.5 w-2.5 text-orange-400" />
                          <span>{item.brand}</span>
                        </div>

                        {/* Top-Right: Solid Rating Capsule */}
                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-700/80 shadow-md">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                          <span className="font-extrabold tabular-nums">{item.rating.toFixed(1)}</span>
                          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 tabular-nums">({item.reviewCount})</span>
                        </div>
                      </div>

                      {/* Product Metadata & Action (Consistent Fixed Height Layout) */}
                      <div className="mt-3.5 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[170px]">
                            {item.tagline}
                          </span>
                          <span className="text-slate-400 truncate max-w-[140px] text-right">
                            {item.store}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white truncate tracking-tight">
                          {item.name}
                        </h3>

                        {/* Price & Action Button */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex flex-col">
                            <span className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tabular-nums tracking-tight">
                              {item.price}
                            </span>
                            <span className="text-[10px] text-slate-400 line-through tabular-nums">
                              {item.originalPrice}
                            </span>
                          </div>

                          <div className={`transition-opacity duration-300 ${isCenter ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                            <Link
                              href={item.href}
                              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-orange-500/25 transition-all cursor-pointer"
                            >
                              <span>Beli Sekarang</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  )
                })}

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
