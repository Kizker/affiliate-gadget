'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Store, Star, Sparkles } from 'lucide-react'

const DEFAULT_SHOWCASE_ITEMS = [
  {
    id: 'samsung-s24-ultra',
    brand: 'Samsung',
    name: 'Galaxy S24 Ultra 5G',
    tagline: 'Second Like New 99% • Galaxy AI',
    price: 'Rp 16.499.000',
    originalPrice: 'Rp 21.999.000',
    store: 'WTC Surabaya',
    image:
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=900&q=80',
    rating: 4.9,
    reviewCount: 38,
    href: '/gadget/cmtqt76dh0027tzfojpizvh7p',
  },
  {
    id: 'iphone-15-pro-max',
    brand: 'Apple',
    name: 'iPhone 15 Pro & Pro Max',
    tagline: 'Second Like New 99% • BH 90%+',
    price: 'Rp 16.999.000',
    originalPrice: 'Rp 20.999.000',
    store: 'Roxy Mas Jakarta Pusat',
    image:
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&q=80',
    rating: 5.0,
    reviewCount: 52,
    href: '/gadget/cmtqt76cv001stzfouf5j42kw',
  },
  {
    id: 'xiaomi-14-ultra',
    brand: 'Xiaomi',
    name: 'Xiaomi 14 Ultra Leica',
    tagline: 'Second Mulus 98% • Leica Quad Cam',
    price: 'Rp 13.299.000',
    originalPrice: 'Rp 18.999.000',
    store: 'BEC Bandung',
    image:
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=900&q=80',
    rating: 4.8,
    reviewCount: 29,
    href: '/gadget/cmtqt76e3002otzfor7zag45n',
  },
]

export function SectionHeroClean() {
  const router = useRouter()
  // Initialized to 1 so the second card (iPhone 15 Pro Max) starts in the front foreground
  const [activeSlide, setActiveSlide] = useState(1)
  const [isPaused, setIsPaused] = useState(false)
  const [showcaseItems, setShowcaseItems] = useState(DEFAULT_SHOWCASE_ITEMS)
  const [mounted, setMounted] = useState(false)

  const totalSlides = showcaseItems.length

  // Dynamically resolve matching product detail URLs from active database
  useEffect(() => {
    async function resolveProductLinks() {
      try {
        const res = await fetch('/api/gadgets')
        const data = await res.json()
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const apiProducts = data.data
          setShowcaseItems((prev) =>
            prev.map((item) => {
              const match = apiProducts.find((p: any) => {
                const bMatch =
                  p.brand?.toLowerCase() === item.brand.toLowerCase()
                if (!bMatch) return false
                const searchWords = item.name.toLowerCase().split(' ')
                const pName = (p.name + ' ' + (p.model || '')).toLowerCase()
                return searchWords.some(
                  (w: string) => w.length > 2 && pName.includes(w)
                )
              })
              if (match && match.id) {
                return {
                  ...item,
                  href: `/gadget/${match.id}`,
                }
              }
              return item
            })
          )
        }
      } catch {
        // Fallback gracefully to default seeded URLs
      }
    }
    resolveProductLinks()
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused, totalSlides])

  return (
    <section className="relative flex h-screen items-center overflow-hidden bg-white pt-16 dark:bg-slate-950">
      {/* Soft Ambient Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[850px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-orange-100/30 via-slate-100/20 to-blue-100/30 blur-3xl dark:from-orange-950/10 dark:via-slate-900/10 dark:to-blue-950/10" />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Clear Value Proposition & Direct CTAs */}
          <div className="space-y-4 text-left sm:space-y-6 lg:col-span-6">
            {/* High-Impact Headline */}
            <h1 className="text-3xl font-black leading-[1.1] tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-[3.25rem]">
              Beli Gadget Second <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-slate-950 via-blue-950 to-orange-600 bg-clip-text text-transparent dark:from-white dark:via-blue-300 dark:to-orange-400">
                Lebih Tenang &amp; Terjamin.
              </span>
            </h1>

            {/* Concise Subtitle — shorter on mobile */}
            <p className="max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="hidden sm:inline">
                Marketplace smartphone &amp; gadget second original berbasis
                jaringan toko fisik se-Indonesia. Jaminan unit like new, 100%
                fungsi normal teruji teknisi, garansi toko 30 hari tukar unit,
                dan paket bonus lengkap 3-in-1.
              </span>
              <span className="sm:hidden">
                Gadget second teruji teknisi, garansi toko 30 hari, bonus
                3-in-1. Jaringan toko resmi se-Indonesia.
              </span>
            </p>

            {/* Primary Action Pill Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/gadget"
                className="active:scale-98 inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 sm:text-sm"
              >
                <span>Jelajahi Gadget Second</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/toko"
                className="shadow-2xs active:scale-98 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white px-5 py-3 text-xs font-semibold text-slate-800 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-sm"
              >
                <Store className="h-4 w-4 text-slate-500" />
                <span>Lokasi Toko Fisik</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 3-Card 3D Carousel — hidden on mobile, visible on desktop */}
          <div
            className="hidden select-none lg:col-span-6 lg:block"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative mx-auto max-w-md sm:max-w-lg lg:max-w-none">
              {/* 3D Depth Cards Stage with Hardware Acceleration & Spatial Perspective */}
              <div
                className="relative flex h-[430px] w-full items-center justify-center sm:h-[460px]"
                style={{ perspective: '1200px' }}
              >
                {!mounted ? (
                  // Skeleton placeholder that matches SSR — prevents hydration mismatch
                  <div className="absolute h-[85%] w-[80%] animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
                ) : (
                  showcaseItems.map((item, idx) => {
                    // Calculate circular offset: -1 (left), 0 (center/front), 1 (right)
                    let diff = (idx - activeSlide + totalSlides) % totalSlides
                    if (diff === 2) diff = -1

                    const isCenter = diff === 0
                    const isLeft = diff === -1
                    const isRight = diff === 1

                    // Motion values based on 3D depth position
                    const motionValues = isCenter
                      ? {
                          x: '0%',
                          scale: 1,
                          opacity: 1,
                          rotateY: 0,
                          zIndex: 30,
                          filter: 'blur(0px)',
                        }
                      : isLeft
                        ? {
                            x: '-34%',
                            scale: 0.84,
                            opacity: 0.35,
                            rotateY: 8,
                            zIndex: 10,
                            filter: 'blur(0.3px)',
                          }
                        : {
                            x: '34%',
                            scale: 0.84,
                            opacity: 0.35,
                            rotateY: -8,
                            zIndex: 10,
                            filter: 'blur(0.3px)',
                          }

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
                        onClick={(e) => {
                          if (isLeft)
                            setActiveSlide(
                              (prev) => (prev - 1 + totalSlides) % totalSlides
                            )
                          if (isRight)
                            setActiveSlide((prev) => (prev + 1) % totalSlides)
                          if (isCenter) {
                            const target = e.target as HTMLElement
                            if (
                              !target.closest('a') &&
                              !target.closest('button')
                            ) {
                              router.push(item.href)
                            }
                          }
                        }}
                        className={`absolute w-[86%] cursor-pointer overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xl will-change-transform dark:border-slate-800 dark:bg-slate-900 sm:w-[80%] sm:p-5 ${
                          isCenter
                            ? 'shadow-2xl shadow-slate-900/15 dark:shadow-black/70'
                            : 'hover:opacity-60'
                        }`}
                        style={{
                          transformStyle: 'preserve-3d',
                          transformOrigin: 'center center',
                        }}
                      >
                        {/* Product Image Stage */}
                        <Link
                          href={isCenter ? item.href : '#'}
                          onClick={(e) => {
                            if (!isCenter) e.preventDefault()
                          }}
                          className={`block ${isCenter ? 'cursor-pointer' : ''}`}
                        >
                          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 dark:border-slate-800/80 dark:bg-slate-950">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              priority={isCenter}
                              sizes="(max-width: 640px) 100vw, 400px"
                              className="h-full w-full object-cover"
                            />

                            {/* Top-Left: Brand Badge */}
                            <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-slate-950/85 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur-md">
                              <Sparkles className="h-2.5 w-2.5 text-orange-400" />
                              <span>{item.brand}</span>
                            </div>

                            {/* Top-Right: Solid Rating Capsule */}
                            <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-md dark:border-slate-700/80 dark:bg-slate-900 dark:text-white">
                              <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                              <span className="font-extrabold tabular-nums">
                                {item.rating.toFixed(1)}
                              </span>
                              <span className="text-[10px] font-normal tabular-nums text-slate-400 dark:text-slate-500">
                                ({item.reviewCount})
                              </span>
                            </div>
                          </div>
                        </Link>

                        {/* Product Metadata & Action (Consistent Fixed Height Layout) */}
                        <div className="mt-3.5 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="max-w-[170px] truncate font-semibold text-blue-600 dark:text-blue-400">
                              {item.tagline}
                            </span>
                            <span className="max-w-[140px] truncate text-right text-slate-400">
                              {item.store}
                            </span>
                          </div>

                          <Link
                            href={isCenter ? item.href : '#'}
                            onClick={(e) => {
                              if (!isCenter) e.preventDefault()
                            }}
                            className={`block ${isCenter ? 'cursor-pointer transition-colors hover:text-orange-600' : ''}`}
                          >
                            <h3 className="truncate text-base font-black tracking-tight text-slate-950 transition-colors dark:text-white sm:text-lg">
                              {item.name}
                            </h3>
                          </Link>

                          {/* Price & Action Button */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-1 dark:border-slate-800/80">
                            <div className="flex flex-col">
                              <span className="text-lg font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">
                                {item.price}
                              </span>
                              <span className="text-[10px] tabular-nums text-slate-400 line-through">
                                {item.originalPrice}
                              </span>
                            </div>

                            <div
                              className={`transition-opacity duration-300 ${isCenter ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
                            >
                              <Link
                                href={item.href}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95"
                              >
                                <span>Beli Sekarang</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
