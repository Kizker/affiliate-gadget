'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store, CheckCircle2, Star, Play } from 'lucide-react'

import { InFeedAdData, isProductAdData, isVideoAd } from '@/types/ads'
export type { InFeedAdData }
export { isProductAdData, isVideoAd }

interface InFeedStoreAdCardProps {
  ad: InFeedAdData
  className?: string
}

export function InFeedStoreAdCard({
  ad,
  className = '',
}: InFeedStoreAdCardProps) {
  const router = useRouter()
  const storeSlug = ad.store?.slug
  const destination =
    ad.targetUrl || (storeSlug ? `/toko/${storeSlug}` : '/gadget')

  const isProductAd = isProductAdData(ad)

  const handleClick = (e: React.MouseEvent) => {
    // Record click metric
    if (ad.id) {
      fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: ad.id, action: 'click' }),
      }).catch(() => {})
    }
  }

  const storeName = ad.store?.name || ad.store?.companyName || ''
  const storeCleanName = storeName
    .replace('Affiliate Gadget - ', '')
    .replace('AffiliateGadget Store - ', '')
  const storeCity = ad.store?.city

  const fallbackPoster =
    ad.product?.images?.[0] ||
    ad.store?.banner ||
    '/images/banners/samsung-mobile-hero.jpg'
  const bannerImage =
    ad.imageUrl && ad.imageUrl.trim() !== '' ? ad.imageUrl : fallbackPoster

  // ============================================================
  // 1. PROMOTED PRODUCT CARD (Standardized with Catalog Products)
  // ============================================================
  if (isProductAd) {
    const originalPrice = ad.product?.originalPrice
      ? Number(ad.product.originalPrice)
      : null
    const price = ad.product?.price ? Number(ad.product.price) : 0
    const soldCount = ad.product?.soldCount ?? 0

    return (
      <div
        className={`shadow-2xs sm:shadow-xs group relative col-span-1 flex flex-col justify-between rounded-2xl border-2 border-orange-300 bg-white p-2 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500 hover:shadow-xl dark:border-orange-800/80 dark:bg-slate-900 dark:hover:border-orange-600 sm:rounded-3xl sm:p-4 ${className}`}
        onClick={handleClick}
      >
        <Link
          href={destination}
          className="block cursor-pointer focus:outline-none"
        >
          {/* Media Header (Square Cropped Hero Photo like Catalog) */}
          <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-xl border border-orange-100 bg-slate-100 dark:border-slate-800/80 dark:bg-slate-950/60 sm:mb-3.5 sm:rounded-2xl">
            <Image
              src={bannerImage}
              alt={ad.product?.name || ad.title}
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
                {(ad.product?.rating || 5.0).toFixed(1)}
              </span>
              <span className="hidden text-[10px] font-normal tabular-nums text-slate-400 dark:text-slate-500 sm:inline">
                ({ad.product?.totalReview || 0})
              </span>
            </div>
          </div>

          {/* Product Identity & Details */}
          <div className="space-y-1.5 px-0.5 sm:space-y-2">
            {/* Store Row & Tested Badge */}
            <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs">
              <div className="flex min-w-0 items-center gap-1 truncate font-medium text-slate-400">
                <Store className="h-2.5 w-2.5 shrink-0 text-slate-400 sm:h-3 sm:w-3" />
                <span className="truncate text-[10px] sm:text-[11px]">
                  {storeCleanName || 'Toko Resmi'}
                </span>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-200/60 bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 sm:text-[10px]">
                  <span>Unit Teruji</span>
                </span>
              </div>
            </div>

            {/* Title / Name */}
            <h3 className="line-clamp-2 min-h-[2rem] text-xs font-bold leading-tight text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white sm:min-h-[2.5rem] sm:text-sm sm:leading-snug">
              {ad.product?.name || ad.title}
            </h3>

            {/* Promo Subtitle if provided */}
            {ad.subtitle ? (
              <p className="line-clamp-1 text-[10px] font-medium text-orange-600 dark:text-orange-400 sm:text-xs">
                {ad.subtitle}
              </p>
            ) : (
              <p className="line-clamp-1 text-[10px] font-medium text-slate-400 sm:text-xs">
                Garansi toko 30 hari tukar unit baru
              </p>
            )}

            {/* Price Row */}
            <div className="flex items-baseline justify-between gap-1 pt-0.5">
              <span className="whitespace-nowrap text-xs font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-base sm:text-lg">
                {price > 0
                  ? `Rp ${price.toLocaleString('id-ID')}`
                  : 'Cek Penawaran Toko'}
              </span>
            </div>

            {/* Bottom Row: Strikethrough Price (Left) & Terjual (Right) */}
            <div className="flex items-center justify-between gap-1 pt-0.5 text-[10px] sm:text-[11px]">
              {originalPrice && originalPrice > price ? (
                <span className="whitespace-nowrap font-normal tabular-nums text-slate-400 line-through">
                  Rp {originalPrice.toLocaleString('id-ID')}
                </span>
              ) : (
                <span />
              )}
              <span className="whitespace-nowrap font-medium text-slate-500 dark:text-slate-400">
                Terjual {soldCount}
              </span>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  // ============================================================
  // 2. STORE BANNER AD (Clean Link Card with Video & Image Support)
  // ============================================================
  const isVideo = isVideoAd(ad)
  const videoSrc = ad.videoUrl || (isVideo ? ad.imageUrl || bannerImage : null)

  return (
    <div
      className={`shadow-xs group relative col-span-1 flex h-full min-h-[300px] w-full flex-col justify-between overflow-hidden rounded-2xl border-2 border-orange-200/90 bg-slate-950 p-0 transition-all duration-300 hover:-translate-y-1 hover:border-orange-400 hover:shadow-xl dark:border-slate-800 sm:col-span-2 sm:aspect-auto sm:h-full sm:min-h-[220px] sm:rounded-3xl ${className}`}
      onClick={handleClick}
    >
      <Link
        href={destination}
        className="absolute inset-0 z-30 block focus:outline-none"
      >
        <span className="sr-only">Kunjungi {storeCleanName}</span>
      </Link>

      {isVideo && videoSrc ? (
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <Image
          src={bannerImage}
          alt={ad.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 50vw"
          unoptimized
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          priority={false}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/35" />

      {/* Top-Left: Advertisement Label (Tulisannya saja, tanpa efek background, agak ke kanan) */}
      <div className="pointer-events-none absolute left-3.5 top-3 z-20 sm:left-6 sm:top-4">
        <span className="text-[10px] font-medium tracking-wider text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-xs">
          Advertisement
        </span>
      </div>

      {/* Bottom-Left: Store Name (Tulisannya saja, tanpa efek background, agak ke kanan) */}
      <div className="pointer-events-none absolute bottom-3.5 left-3.5 z-20 sm:bottom-4 sm:left-6">
        <span className="text-xs font-semibold tracking-wide text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] sm:text-sm md:text-base">
          {ad.store?.name ||
            ad.store?.companyName ||
            storeName ||
            'Affiliate Gadget'}
        </span>
      </div>
    </div>
  )
}
