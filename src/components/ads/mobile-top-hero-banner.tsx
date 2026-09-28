'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

export interface HeroSlideData {
  id: string
  adId?: string
  image: string
  badgeText: string
  title: string
  subtitle: string
  storeSlug?: string
  targetUrl?: string
  storeName?: string
}

const DEFAULT_BANNER_SLIDES: HeroSlideData[] = [
  {
    id: 'default-hero-1',
    image: '/images/banners/samsung-campaign-banner.jpg',
    badgeText: '',
    title: 'Flash Sale Gadget Second Resmi',
    subtitle: 'Garansi 30 Hari Tukar Unit Baru di Seluruh Indonesia',
    targetUrl: '/gadget',
  },
]

interface MobileTopHeroBannerProps {
  initialSlides?: HeroSlideData[]
  className?: string
}

export function MobileTopHeroBanner({
  initialSlides,
  className = '',
}: MobileTopHeroBannerProps) {
  const router = useRouter()
  const [slides, setSlides] = useState<HeroSlideData[]>(
    initialSlides && initialSlides.length > 0
      ? initialSlides
      : DEFAULT_BANNER_SLIDES
  )
  const [currentSlide, setCurrentSlide] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  useEffect(() => {
    let isSubscribed = true

    async function loadHeroAds() {
      try {
        const res = await fetch('/api/ads?placement=HOMEPAGE_HERO&limit=5')
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: HeroSlideData[] = json.data.map(
            (ad: any, index: number) => {
              // Rule: Jika admin store menginput custom image, gunakan apa yang diinput admin store.
              // Jika kosong/tidak ada, ambil dari poster toko atau platform poster.
              const fallbackPoster =
                ad.store?.banner ||
                '/images/banners/samsung-campaign-banner.jpg'
              const finalImage =
                ad.imageUrl && ad.imageUrl.trim() !== ''
                  ? ad.imageUrl
                  : fallbackPoster

              return {
                id: ad.id || `hero-ad-${index}`,
                adId: ad.id,
                image: finalImage,
                badgeText: ad.store?.city ? `Cabang ${ad.store.city}` : '',
                title: ad.title || 'Promo Gadget Pilihan',
                subtitle:
                  ad.subtitle || ad.store?.name || 'Garansi Toko 30 Hari',
                storeSlug: ad.store?.slug,
                targetUrl:
                  ad.targetUrl ||
                  (ad.store?.slug ? `/toko/${ad.store.slug}` : '/gadget'),
                storeName: ad.store?.name,
              }
            }
          )

          if (isSubscribed) {
            setSlides(mapped)
          }
        }
      } catch {
        // Fallback safely to default slides
      }
    }

    loadHeroAds()
    return () => {
      isSubscribed = false
    }
  }, [])

  // Auto-play timer (advance every 4.5 seconds)
  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [slides.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    if (diff > 40) {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    } else if (diff < -40) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    }
    setTouchStart(null)
  }

  const handleSlideClick = (slide: HeroSlideData) => {
    if (slide.adId) {
      fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: slide.adId, action: 'click' }),
      }).catch(() => {})
    }
    const destination =
      slide.targetUrl ||
      (slide.storeSlug ? `/toko/${slide.storeSlug}` : '/gadget')
    router.push(destination)
  }

  return (
    <div
      className={`relative aspect-[21/9] w-full select-none overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 shadow-sm transition hover:shadow-md dark:border-slate-800 sm:aspect-[16/7] ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          onClick={() => handleSlideClick(slide)}
          className={`absolute inset-0 cursor-pointer transition-opacity duration-700 ease-in-out ${
            idx === currentSlide
              ? 'z-10 opacity-100'
              : 'pointer-events-none z-0 opacity-0'
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover"
            priority={idx === 0}
            unoptimized
          />

          {/* Vignette gradients for editorial readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-black/30" />

          {/* Bottom Title & Subtitle */}
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 right-14 z-20 space-y-0.5">
            <h3 className="line-clamp-1 text-xs font-black leading-tight text-white drop-shadow-md sm:text-sm">
              {slide.title}
            </h3>
            <p className="line-clamp-1 text-[10px] font-medium text-slate-300 drop-shadow-sm">
              {slide.subtitle}
            </p>
          </div>
        </div>
      ))}

      {/* Indicator Dots */}
      {slides.length > 1 && (
        <div className="backdrop-blur-xs absolute bottom-2.5 right-2.5 z-30 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1">
          {slides.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setCurrentSlide(dotIdx)
              }}
              className={`rounded-full transition-all duration-300 ${
                dotIdx === currentSlide
                  ? 'shadow-xs h-1.5 w-3.5 bg-orange-500'
                  : 'h-1.5 w-1.5 bg-white/70 hover:bg-white'
              }`}
              aria-label={`Slide ${dotIdx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
