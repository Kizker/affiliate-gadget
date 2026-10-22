'use client'

import React from 'react'
import {
  Star,
  MapPin,
  Clock,
  MessageCircle,
  Compass,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2,
  ExternalLink,
} from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { MitraDetail } from '@/types/mitra-detail'

interface MitraHeroProps {
  mitra: MitraDetail
  heroImageSrc: string
  onBookingChat: (e?: React.MouseEvent, serviceName?: string) => void
  onShare: () => void
  whatsAppUrl: string
  mapsUrl: string
  initialIsMobile?: boolean
}

export function MitraHero({
  mitra,
  heroImageSrc,
  onBookingChat,
  onShare,
  whatsAppUrl,
  mapsUrl,
  initialIsMobile,
}: MitraHeroProps) {
  const isMobile = useIsMobile(768, initialIsMobile)

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1A. DESKTOP HERO VIEWPORT: STUDIO SPLIT (Matching /toko/[slug])
          Clean studio aesthetic, workshop photo on left, typography on right.
      ───────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        suppressHydrationWarning
        className="relative hidden w-full overflow-hidden border-b border-neutral-100 bg-[#FBFBFD] px-4 pb-12 pt-24 dark:border-neutral-900 dark:bg-neutral-950 sm:px-6 sm:pb-16 sm:pt-28 md:flex md:items-center md:justify-center lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center">
          {/* Left Column (55%): Workshop/Bengkel Photo Studio Frame */}
          <div className="relative w-[55%] pl-4 lg:pl-8">
            <div
              style={{ height: '420px', minHeight: '380px' }}
              className="relative h-[420px] w-full overflow-hidden rounded-3xl border border-neutral-200/80 bg-neutral-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-900"
            >
              <ImageWithFallback
                src={heroImageSrc}
                alt={mitra.businessName}
                fill
                priority
                sizes="60vw"
                className="object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
              />
              {/* Subtle Gradient Vignette */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {/* Overlaid Badges on Image */}
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 rounded-full bg-black/65 px-4 py-2 backdrop-blur-md">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold tracking-wide">
                    Mitra Servis Resmi Terverifikasi
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-black/65 px-3.5 py-2 backdrop-blur-md">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold">
                    {mitra.rating.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-neutral-300">
                    ({mitra.totalReview} ulasan)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (45%): Sleek Editorial Typography & Action Buttons */}
          <div className="z-10 my-auto flex w-[45%] flex-col items-start justify-center space-y-3.5 pl-6 pr-6 lg:space-y-4 lg:pl-10 lg:pr-12">
            <h1 className="text-2xl font-black leading-[1.1] tracking-tight text-neutral-950 dark:text-white sm:text-3xl lg:text-4xl xl:text-[44px]">
              {mitra.businessName}
            </h1>

            {mitra.tagline && (
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 lg:text-base">
                {mitra.tagline}
              </p>
            )}

            <p className="max-w-lg text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 lg:text-sm">
              {mitra.description ||
                (!mitra.tagline
                  ? `Pusat reparasi gadget profesional di ${mitra.city}. Pengerjaan transparan, teknisi berpengalaman, dan suku cadang berkualitas dengan jaminan garansi servis.`
                  : '')}
            </p>

            {/* Quick Info Chips */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${
                  mitra.isOpen
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    mitra.isOpen
                      ? 'animate-pulse bg-emerald-500'
                      : 'bg-neutral-400'
                  }`}
                />
                {mitra.isOpen ? 'Buka Sekarang' : 'Tutup'}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                <Clock className="h-3.5 w-3.5 text-neutral-500" />
                {mitra.weekdayHours || '09:00 - 20:00 WIB'}
              </span>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/map inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 font-medium text-neutral-700 transition hover:border-black hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-white"
                title="Buka Alamat di Google Maps"
              >
                <MapPin className="h-3.5 w-3.5 text-neutral-500 group-hover/map:text-orange-500" />
                <span className="group-hover/map:underline">
                  {mitra.city}, {mitra.province || 'Indonesia'}
                </span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60 group-hover/map:opacity-100" />
              </a>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={(e) => onBookingChat(e)}
                className="rounded-full bg-black px-7 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Booking Servis / Chat Langsung
              </button>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shadow-2xs inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-3.5 text-xs font-bold text-neutral-900 transition hover:border-black hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-white"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>WhatsApp</span>
              </a>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shadow-2xs inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                title="Buka Petunjuk Arah Google Maps"
              >
                <Compass className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                <span>Peta</span>
              </a>

              <button
                onClick={onShare}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-400 hover:text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                title="Bagikan Halaman Mitra"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          1B. MOBILE HERO & PROFILE CARD: ULTRA-CLEAN & PROFESSIONAL
          Apple Store Support / Airbnb / Tokopedia Official style
          100% partner-customized data (photo, name, tagline, description, address, hours, contact)
      ───────────────────────────────────────────────────────────── */}
      <div className="block md:hidden">
        <section className="relative w-full overflow-hidden bg-white pb-3 dark:bg-neutral-950">
          {/* 1. Header Media Visual: Crisp Edge Banner with Ambient Gradients */}
          <div className="relative h-64 w-full overflow-hidden rounded-b-[28px] bg-neutral-900 shadow-sm sm:h-72">
            <ImageWithFallback
              src={heroImageSrc}
              alt={mitra.businessName}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            {/* Subtle top/bottom contrast vignettes for high readability of floating pills */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

            {/* Top Floating Row: Verified Badge & Share Button */}
            <div className="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between">
              <div className="shadow-2xs flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Mitra Servis Resmi</span>
              </div>

              <button
                onClick={onShare}
                className="shadow-2xs flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition active:scale-90"
                aria-label="Bagikan halaman mitra"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* Bottom Floating Row: Live Open Status & Star Rating Badges */}
            <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between">
              <div className="shadow-2xs flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                <span
                  className={`h-2 w-2 rounded-full ${
                    mitra.isOpen
                      ? 'animate-pulse bg-emerald-400'
                      : 'bg-neutral-400'
                  }`}
                />
                <span>{mitra.isOpen ? 'Buka Hari Ini' : 'Tutup'}</span>
                {mitra.weekdayHours && (
                  <span className="text-[10px] text-neutral-300">
                    •{' '}
                    {mitra.weekdayHours.replace(/^senin\s*-\s*sabtu:\s*/i, '')}
                  </span>
                )}
              </div>

              <div className="shadow-2xs flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{mitra.rating.toFixed(1)}</span>
                <span className="text-[10px] text-neutral-300">
                  ({mitra.totalReview})
                </span>
              </div>
            </div>
          </div>

          {/* 2. Mitra Identity & Custom Information Details */}
          <div className="space-y-3 px-4 pt-4">
            {/* Business Name with Verified Checkmark */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black leading-tight tracking-tight text-neutral-950 dark:text-white sm:text-2xl">
                  {mitra.businessName}
                </h1>
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-blue-600 dark:text-sky-400" />
              </div>

              {/* Custom Tagline Mitra */}
              {mitra.tagline && (
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {mitra.tagline}
                </p>
              )}
            </div>

            {/* Clickable Address / Google Maps Card */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2.5 rounded-2xl border border-neutral-100 bg-neutral-50/90 p-3 text-xs text-neutral-600 transition active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-300"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-sky-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-neutral-900 dark:text-white">
                  {mitra.address ||
                    `${mitra.city}, ${mitra.province || 'Indonesia'}`}
                </p>
                <div className="mt-0.5 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>
                    {mitra.city}, {mitra.province || 'Indonesia'}
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-sky-400">
                    Lihat Peta →
                  </span>
                </div>
              </div>
            </a>

            {/* Custom Description Mitra */}
            {mitra.description && (
              <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                {mitra.description}
              </p>
            )}

            {/* Fast Contact & Booking Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={(e) => onBookingChat(e)}
                className="shadow-2xs flex flex-1 items-center justify-center gap-1.5 rounded-full bg-neutral-950 py-3 text-xs font-bold text-white transition active:scale-95 dark:bg-white dark:text-black"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chat / Booking Servis</span>
              </button>

              {whatsAppUrl && (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shadow-2xs flex items-center justify-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-5 py-3 text-xs font-bold text-emerald-700 transition active:scale-95 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                >
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
