'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

export interface InFeedAdData {
  id: string
  title: string
  imageUrl: string
  targetUrl?: string
  priority?: number
  store?: {
    id?: string
    name: string
    slug: string
    city?: string
    logo?: string
    companyName?: string
    banner?: string | null
  } | null
}

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

  const storeName =
    ad.store?.name || ad.store?.companyName || 'Toko Resmi Terverifikasi'
  const storeCleanName = storeName
    .replace('Affiliate Gadget - ', '')
    .replace('AffiliateGadget Store - ', '')
  const storeCity = ad.store?.city

  const fallbackPoster =
    ad.store?.banner || '/images/banners/samsung-mobile-hero.jpg'
  const bannerImage =
    ad.imageUrl && ad.imageUrl.trim() !== '' ? ad.imageUrl : fallbackPoster

  return (
    <div
      className={`shadow-xs group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl border border-orange-200/90 bg-white p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-orange-400 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:col-span-2 sm:h-full sm:min-h-[220px] sm:rounded-3xl sm:bg-slate-950 sm:p-0 ${className}`}
      onClick={handleClick}
    >
      <Link
        href={destination}
        className="absolute inset-0 z-30 block focus:outline-none"
      >
        <span className="sr-only">Kunjungi {storeCleanName}</span>
      </Link>

      {/* ============================================================ */}
      {/* MOBILE: 1-COLUMN NATURAL RESOLUTION CARD (< sm)             */}
      {/* ============================================================ */}
      <div className="flex flex-col justify-between sm:hidden">
        {/* Dynamic Resolution Banner Box (Natural Height Following Image Aspect Ratio) */}
        <div className="relative w-full overflow-hidden rounded-xl border border-orange-100/80 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800">
          <img
            src={bannerImage}
            alt={ad.title}
            loading="lazy"
            className="block h-auto w-full rounded-xl transition-transform duration-500 group-hover:scale-105"
          />

          {/* Top-Left Badge: Iklan Toko */}
          <div className="backdrop-blur-xs absolute left-1.5 top-1.5 z-10 flex items-center gap-1 rounded-md border border-orange-400/40 bg-orange-950/85 px-1.5 py-0.5 text-[8.5px] font-bold text-orange-300 shadow-sm">
            <Sparkles className="h-2.5 w-2.5 shrink-0 text-orange-400" />
            <span>Iklan Toko</span>
          </div>

          {/* Top-Right Badge: Cabang City */}
          {storeCity && (
            <div className="backdrop-blur-xs absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5 rounded-md border border-white/20 bg-black/60 px-1.5 py-0.5 text-[8.5px] font-semibold text-white/90 shadow-sm">
              <Store className="h-2.5 w-2.5 text-white/70" />
              <span>{storeCity}</span>
            </div>
          )}
        </div>

        {/* Store Info Section ('beritahu nama tokonya juga') */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1">
            <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              Toko Resmi PT
            </span>
            <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-orange-500" />
          </div>

          {/* Store Name - prominent and bold */}
          <h3 className="line-clamp-2 min-h-[30px] text-xs font-bold leading-tight text-slate-950 dark:text-white">
            {storeCleanName}
          </h3>

          {/* Campaign Tagline */}
          <p className="line-clamp-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {ad.title}
          </p>

          {/* Store CTA Button */}
          <div className="shadow-2xs mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-1.5 text-xs font-bold text-white transition-all active:scale-95 group-hover:bg-orange-600">
            <span>Kunjungi Toko</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DESKTOP: 2-COLUMN LANDSCAPE CARD (>= sm)                     */}
      {/* ============================================================ */}
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

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30" />

        <div className="pointer-events-none relative z-20 flex items-center justify-between p-4">
          <div className="flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-950/80 px-2.5 py-1 text-[10px] font-bold text-orange-300 shadow-sm backdrop-blur-md">
            <Sparkles className="h-3 w-3 shrink-0 text-orange-400" />
            <span>Iklan Toko Resmi</span>
          </div>

          {storeCity && (
            <div className="flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md">
              <Store className="h-3 w-3 text-white/70" />
              <span>Cabang {storeCity}</span>
            </div>
          )}
        </div>

        <div className="pointer-events-none relative z-20 space-y-2 p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-orange-400">
              <span>{ad.store?.companyName || storeName}</span>
              <CheckCircle2 className="h-3 w-3 text-orange-400" />
            </div>
            <h3 className="line-clamp-2 text-lg font-black leading-tight text-white drop-shadow-md">
              {ad.title}
            </h3>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs font-medium text-slate-300">
              Unit second teruji • Garansi toko 30 hari
            </p>

            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/30 transition-all duration-200 group-hover:bg-orange-600">
              <span>Kunjungi Toko</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
