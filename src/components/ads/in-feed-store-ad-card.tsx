'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store, CheckCircle2, Star } from 'lucide-react'

import { InFeedAdData, isProductAdData } from '@/types/ads'
export type { InFeedAdData }
export { isProductAdData }

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
  // 2. STORE BANNER AD (Clean Link Card without Distracting Buttons)
  // ============================================================
  return (
    <div
      className={`shadow-xs group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-orange-200/90 bg-white p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-orange-400 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:col-span-2 sm:h-full sm:min-h-[220px] sm:rounded-3xl sm:bg-slate-950 sm:p-0 ${className}`}
      onClick={handleClick}
    >
      <Link
        href={destination}
        className="absolute inset-0 z-30 block focus:outline-none"
      >
        <span className="sr-only">Kunjungi {storeCleanName}</span>
      </Link>

      {/* MOBILE: 1-COLUMN NATURAL RESOLUTION CARD (< sm) */}
      <div className="flex flex-col justify-between sm:hidden">
        <div className="relative w-full overflow-hidden rounded-xl border border-orange-100/80 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800">
          <img
            src={bannerImage}
            alt={ad.title}
            loading="lazy"
            className="block h-auto w-full rounded-xl transition-transform duration-500 group-hover:scale-105"
          />

          {storeCity && (
            <div className="backdrop-blur-xs absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5 rounded-md border border-white/20 bg-black/60 px-1.5 py-0.5 text-[8.5px] font-semibold text-white/90 shadow-sm">
              <Store className="h-2.5 w-2.5 text-white/70" />
              <span>{storeCity}</span>
            </div>
          )}
        </div>

        <div className="mt-2 space-y-1">
          {storeCleanName && (
            <div className="flex items-center gap-1">
              <h3 className="line-clamp-1 text-xs font-bold leading-tight text-slate-950 dark:text-white">
                {storeCleanName}
              </h3>
              <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-orange-500" />
            </div>
          )}

          <p className="line-clamp-1 text-[11px] font-bold text-slate-900 dark:text-slate-100">
            {ad.title}
          </p>

          {ad.subtitle && (
            <p className="line-clamp-1 text-[10px] font-medium text-orange-600 dark:text-orange-400">
              {ad.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* DESKTOP: 2-COLUMN LANDSCAPE CARD (>= sm) */}
      <div className="hidden sm:flex sm:h-full sm:w-full sm:flex-col sm:justify-between">
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          fill
          sizes="(max-width: 1024px) 50vw, 50vw"
          unoptimized
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          priority={false}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-black/35" />

        <div className="pointer-events-none relative z-20 flex min-h-[36px] items-center justify-end p-4">
          {storeCity && (
            <div className="flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md">
              <Store className="h-3 w-3 text-white/70" />
              <span>Cabang {storeCity}</span>
            </div>
          )}
        </div>

        <div className="pointer-events-none relative z-20 mt-auto space-y-2 p-5">
          <div className="space-y-1">
            {(ad.store?.companyName || storeName) && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-orange-400">
                <span>{ad.store?.companyName || storeName}</span>
                <CheckCircle2 className="h-3 w-3 text-orange-400" />
              </div>
            )}
            <h3 className="line-clamp-2 text-lg font-black leading-tight text-white drop-shadow-md">
              {ad.title}
            </h3>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="line-clamp-1 text-xs font-medium text-slate-300">
              {ad.subtitle || 'Unit second teruji • Garansi toko 30 hari'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
