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
} from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import type { MitraDetail } from '@/types/mitra-detail'

interface MitraHeroProps {
  mitra: MitraDetail
  heroImageSrc: string
  onBookingChat: (e?: React.MouseEvent, serviceName?: string) => void
  onShare: () => void
  whatsAppUrl: string
  mapsUrl: string
}

export function MitraHero({
  mitra,
  heroImageSrc,
  onBookingChat,
  onShare,
  whatsAppUrl,
  mapsUrl,
}: MitraHeroProps) {
  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1A. DESKTOP HERO VIEWPORT: STUDIO SPLIT (Matching /toko/[slug])
          Clean studio aesthetic, workshop photo on left, typography on right.
      ───────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative hidden w-full scroll-mt-24 overflow-hidden bg-[#FBFBFD] pb-12 pt-8 dark:bg-neutral-950 md:flex md:items-center lg:pb-14 lg:pt-10"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center">
          {/* Left Column (55%): Workshop/Bengkel Photo Studio Frame */}
          <div className="relative flex h-[440px] w-[55%] items-center justify-start overflow-hidden pl-4 lg:h-[480px] lg:pl-8">
            <div className="relative h-full w-full overflow-hidden rounded-3xl border border-neutral-200/80 bg-neutral-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-900">
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
          <div className="z-10 flex w-[45%] flex-col items-start justify-center space-y-4 pl-6 pr-6 lg:space-y-5 lg:pl-10 lg:pr-12">
            <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-neutral-950 dark:text-white lg:text-4xl xl:text-5xl">
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

              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                {mitra.city}, {mitra.province || 'Indonesia'}
              </span>
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
          1B. MOBILE HERO VIEWPORT: LUXURY MOBILE EXPERIENCE
          Centered fading typography on full background image (Pas 1 Layar Penuh)
      ───────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[460px] w-full items-center justify-center overflow-hidden px-4 py-14 md:hidden">
        {/* Full Cover Background Image */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={heroImageSrc}
            alt={mitra.businessName}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Subtle Ambient Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        {/* Center: Fading Backdrop Editorial Card (Mencegah warna tulisan & gambar menyatu) */}
        <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/30 bg-white/85 p-6 text-center shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/85">
          <h1 className="text-2xl font-black leading-[1.15] tracking-tight text-neutral-950 dark:text-white">
            {mitra.businessName}
          </h1>

          {mitra.tagline && (
            <p className="mx-auto mt-2 px-1 text-xs font-bold text-neutral-800 dark:text-neutral-200">
              {mitra.tagline}
            </p>
          )}

          <p className="mx-auto mt-1 line-clamp-3 px-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
            {mitra.description ||
              (!mitra.tagline
                ? `Spesialis servis & pergantian LCD gadget bergaransi di ${mitra.city}.`
                : '')}
          </p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-neutral-100/90 px-2.5 py-0.5 text-[11px] font-bold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{mitra.rating.toFixed(1)}</span>
              <span className="text-[10px] text-neutral-500">
                ({mitra.totalReview})
              </span>
            </div>

            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                mitra.isOpen
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              {mitra.isOpen ? 'Buka Hari Ini' : 'Tutup'}
            </span>
          </div>

          {/* Quick Action Button */}
          <div className="mt-4 flex items-center justify-center">
            <button
              onClick={(e) => onBookingChat(e)}
              className="w-full rounded-full bg-black py-3 text-center text-xs font-bold text-white shadow-lg transition-transform active:scale-95 dark:bg-white dark:text-black"
            >
              Booking Servis Sekarang
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          1C. MOBILE MITRA PROFILE & IDENTITY STRIP (Mobile Only)
      ───────────────────────────────────────────────────────────── */}
      <section className="block border-y border-neutral-100 bg-white px-4 py-3.5 dark:border-neutral-900 dark:bg-neutral-950 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shadow-2xs relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800">
              <ImageWithFallback
                src={heroImageSrc}
                alt={mitra.businessName}
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-sm font-bold text-neutral-950 dark:text-white">
                  {mitra.businessName}
                </h2>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              </div>
              <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                Bengkel Servis Resmi • {mitra.city}
              </p>
            </div>
          </div>

          <a
            href="#informasi-mitra"
            className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] font-semibold text-neutral-700 active:scale-95 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            Info Workshop
          </a>
        </div>
      </section>
    </>
  )
}
