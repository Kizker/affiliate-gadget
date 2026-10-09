'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Play, Store } from 'lucide-react'

export interface HeroSlideData {
  id: string
  adId?: string
  image: string
  videoUrl?: string | null
  isVideo?: boolean
  badgeText: string
  title: string
  subtitle: string
  storeSlug?: string
  targetUrl?: string
  storeName?: string
}

const DEFAULT_BANNER_SLIDES: HeroSlideData[] = [
  {
    id: 'cmuiftegm0001tzagr48ikekn',
    adId: 'cmuiftegm0001tzagr48ikekn',
    image: '/uploads/ads/1790671997412-zuzb6l-poster.webp',
    videoUrl: '/uploads/ads/1790671997412-zuzb6l.mp4',
    isVideo: true,
    badgeText: 'Cabang Jakarta Pusat',
    title: 'Video Eksklusif: Flash Sale Roxy Mas Pusat',
    subtitle:
      'Tonton Video Review Fisik Mulus & Garansi Toko 30 Hari Tukar Unit Baru',
    targetUrl: '/toko/roxy-mas-jakarta',
    storeName: 'Affiliate Gadget - Roxy Mas Jakarta',
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
  const [canLoadVideo, setCanLoadVideo] = useState(false)

  // Defer video playback until user interaction or after initial critical render
  useEffect(() => {
    let triggered = false
    const enableVideo = () => {
      if (triggered) return
      triggered = true
      setCanLoadVideo(true)
      cleanup()
    }

    const cleanup = () => {
      window.removeEventListener('scroll', enableVideo)
      window.removeEventListener('touchstart', enableVideo)
      window.removeEventListener('pointerdown', enableVideo)
      window.removeEventListener('mousemove', enableVideo)
    }

    window.addEventListener('scroll', enableVideo, {
      once: true,
      passive: true,
    })
    window.addEventListener('touchstart', enableVideo, {
      once: true,
      passive: true,
    })
    window.addEventListener('pointerdown', enableVideo, {
      once: true,
      passive: true,
    })
    window.addEventListener('mousemove', enableVideo, {
      once: true,
      passive: true,
    })

    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    let isSubscribed = true

    async function loadHeroAds() {
      try {
        // Level 1 adalah eksklusif (hanya 1 banner toko aktif pada satu waktu)
        const res = await fetch('/api/ads?placement=HOMEPAGE_HERO&limit=1')
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: HeroSlideData[] = json.data.map(
            (ad: any, index: number) => {
              const fallbackPoster =
                ad.store?.banner ||
                '/images/banners/samsung-campaign-banner.jpg'
              const isVideo = Boolean(
                ad.videoUrl ||
                (ad.bannerUrl &&
                  (ad.bannerUrl.toLowerCase().endsWith('.mp4') ||
                    ad.bannerUrl.toLowerCase().endsWith('.webm') ||
                    ad.bannerUrl.toLowerCase().includes('/video/'))) ||
                (ad.imageUrl &&
                  (ad.imageUrl.toLowerCase().endsWith('.mp4') ||
                    ad.imageUrl.toLowerCase().includes('/video/')))
              )
              const videoUrl =
                ad.videoUrl || (isVideo ? ad.bannerUrl || ad.imageUrl : null)
              const companionPoster = videoUrl
                ? videoUrl.replace(/\.(mp4|webm)$/i, '-poster.webp')
                : null
              const finalImage =
                !isVideo && ad.imageUrl && ad.imageUrl.trim() !== ''
                  ? ad.imageUrl
                  : companionPoster || fallbackPoster

              return {
                id: ad.id || `hero-ad-${index}`,
                adId: ad.id,
                image: finalImage,
                videoUrl: videoUrl,
                isVideo: isVideo,
                badgeText: ad.store?.city ? `Cabang ${ad.store.city}` : '',
                title: ad.title || 'Promo Gadget Pilihan',
                subtitle:
                  ad.subtitle || ad.store?.name || 'Garansi Toko 30 Hari',
                storeSlug: ad.store?.slug,
                targetUrl:
                  ad.targetUrl ||
                  (ad.store?.slug ? `/toko/${ad.store.slug}` : '/gadget'),
                storeName:
                  ad.store?.name || ad.store?.companyName || 'Affiliate Gadget',
              }
            }
          )

          if (isSubscribed) {
            setSlides((prev) => {
              if (
                prev.length === mapped.length &&
                prev[0]?.id === mapped[0]?.id &&
                prev[0]?.image === mapped[0]?.image
              ) {
                return prev
              }
              return mapped
            })
          }
        }
      } catch {
        // Fallback safely to default slides
      }
    }

    const timer = setTimeout(() => {
      loadHeroAds()
    }, 2500)

    return () => {
      isSubscribed = false
      clearTimeout(timer)
    }
  }, [])

  // Auto-play timer (advance every 5 seconds)
  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
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
      className={`relative aspect-[21/9] w-full select-none overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 shadow-sm transition hover:shadow-md dark:border-slate-800 sm:aspect-[16/7] md:aspect-auto md:h-[300px] md:rounded-3xl ${className}`}
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
          {/* Base Poster Layer (Always rendered immediately for instant frame-1 LCP) */}
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover"
            priority={idx === 0}
            fetchPriority={idx === 0 ? 'high' : 'auto'}
            loading={idx === 0 ? 'eager' : 'lazy'}
          />

          {/* Deferred Video Layer: Loaded only on user interaction to prevent critical network saturation */}
          {slide.isVideo && slide.videoUrl && canLoadVideo && (
            <video
              src={slide.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              poster={slide.image}
              preload="none"
              title={slide.title || 'Video Promo Iklan Toko'}
              aria-label={slide.title || 'Video Promo Iklan Toko'}
              className="absolute inset-0 h-full w-full object-cover"
            >
              <track kind="captions" src="/captions/live-empty.vtt" />
            </video>
          )}

          {/* Vignette gradients for editorial readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/30" />

          {/* Top-Left: Advertisement Label (Tulisannya saja, tanpa efek background, agak ke kanan) */}
          <div className="pointer-events-none absolute left-5 top-3.5 z-20 sm:left-7 sm:top-5 md:left-8 md:top-6">
            <span className="text-[11px] font-medium tracking-wider text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-xs">
              Advertisement
            </span>
          </div>

          {/* Bottom-Left: Store Name (Tulisannya saja, tanpa efek background, agak ke kanan) */}
          <div className="pointer-events-none absolute bottom-3.5 left-5 z-20 sm:bottom-5 sm:left-7 md:bottom-6 md:left-8">
            <span className="text-xs font-semibold tracking-wide text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] sm:text-sm md:text-base">
              {slide.storeName || 'Affiliate Gadget'}
            </span>
          </div>
        </div>
      ))}

      {/* Indicator Dots */}
      {slides.length > 1 && (
        <div className="backdrop-blur-xs absolute bottom-3 right-3 z-30 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 sm:bottom-4 sm:right-4">
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
