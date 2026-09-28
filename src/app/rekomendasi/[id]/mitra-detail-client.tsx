'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Star,
  MapPin,
  Clock,
  MessageCircle,
  MessageSquare,
  Compass,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  Share2,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import ReviewModal from '@/components/reviews/review-modal'
import ReviewList from '@/components/reviews/review-list'
import ImageLightbox from '@/components/gallery/image-lightbox'
import GoogleMapDisplay from '@/components/maps/google-map-display'
import GoogleMapsProvider from '@/components/maps/google-maps-provider'

interface ServiceItem {
  id: string
  name: string
  price: string
  icon: string | null
  description?: string | null
}

interface MitraImage {
  id: string
  url: string
}

export interface MitraDetail {
  id: string
  businessName: string
  tagline: string | null
  description: string | null
  city: string
  province: string
  address: string
  phone: string
  whatsapp: string | null
  email: string | null
  website: string | null
  rating: number
  totalReview: number
  banner: string | null
  features: string[] | null
  weekdayHours: string | null
  weekendHours: string | null
  latitude: number | null
  longitude: number | null
  services: ServiceItem[]
  images: MitraImage[]
  isOpen: boolean
}

interface MitraDetailClientProps {
  mitra: MitraDetail
}

function ImageWithFallback({
  src,
  alt,
  fill = false,
  className = '',
  sizes,
  priority = false,
  fallbackSrc = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80',
}: {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  fallbackSrc?: string
}) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc)

  useEffect(() => {
    setImgSrc(src || fallbackSrc)
  }, [src, fallbackSrc])

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      unoptimized={imgSrc.startsWith('/')}
      onError={() => setImgSrc(fallbackSrc)}
      className={className}
    />
  )
}

export default function MitraDetailClient({ mitra }: MitraDetailClientProps) {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [refreshReviews, setRefreshReviews] = useState(0)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<{
    id: string
    rating: number
    comment: string | null
  } | null>(null)
  const [userHasReview, setUserHasReview] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showChatPopup, setShowChatPopup] = useState(true)

  const hasTrackedView = useRef(false)

  // Check if current user has already reviewed this mitra
  const checkUserReview = useCallback(async () => {
    if (!session?.user?.id || !mitra.id) return

    try {
      const response = await fetch(`/api/reviews?mitraId=${mitra.id}`)
      const data = await response.json()

      if (response.ok && data.reviews) {
        const userReview = data.reviews.find(
          (review: { user: { id: string } }) =>
            review.user.id === session.user.id
        )
        setUserHasReview(!!userReview)
      }
    } catch (error) {
      console.error('Error checking user review:', error)
    }
  }, [session?.user?.id, mitra.id])

  useEffect(() => {
    checkUserReview()
  }, [checkUserReview])

  // Track page view
  useEffect(() => {
    const trackView = async () => {
      if (hasTrackedView.current) return
      hasTrackedView.current = true

      try {
        await fetch('/api/mitra/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mitraId: mitra.id,
            type: 'view',
          }),
        })
      } catch (error) {
        console.error('Error tracking view:', error)
      }
    }

    if (mitra.id) {
      trackView()
    }
  }, [mitra.id])

  // Track inquiry
  const trackInquiry = async () => {
    try {
      await fetch('/api/mitra/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mitraId: mitra.id,
          type: 'inquiry',
        }),
      })
    } catch (error) {
      console.error('Error tracking inquiry:', error)
    }
  }

  // Build live chat URL
  const getChatUrl = (serviceName?: string) => {
    const greeting = serviceName
      ? `Halo ${mitra.businessName}, saya ingin konsultasi dan estimasi biaya perbaikan "${serviceName}".`
      : `Halo ${mitra.businessName}, saya ingin konsultasi dan booking servis gadget.`
    return `/dashboard/customer/chat?mitraId=${mitra.id}&mitraName=${encodeURIComponent(
      mitra.businessName
    )}&mitraCity=${encodeURIComponent(mitra.city)}&mitraImage=${encodeURIComponent(
      mitra.banner || ''
    )}&serviceContext=${encodeURIComponent(greeting)}`
  }

  // Handle direct booking
  const handleBookingChat = (e?: React.MouseEvent, serviceName?: string) => {
    if (e) e.preventDefault()
    trackInquiry()
    const url = getChatUrl(serviceName)
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(url)}`)
      return
    }
    router.push(url)
  }

  // Share link handler
  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: mitra.businessName,
          text: `Servis gadget profesional di ${mitra.businessName}, ${mitra.city}. Teknisi bersertifikat & bergaransi!`,
          url: typeof window !== 'undefined' ? window.location.href : '',
        })
        .catch(() => {})
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Tautan profil mitra disalin ke clipboard')
    }
  }

  // WhatsApp link generator
  const getWhatsAppUrl = () => {
    const phoneClean = (mitra.whatsapp || mitra.phone).replace(/[^0-9]/g, '')
    const phoneFormatted = phoneClean.startsWith('0')
      ? '62' + phoneClean.slice(1)
      : phoneClean
    const text = encodeURIComponent(
      `Halo ${mitra.businessName}, saya menemukan profil workshop Anda di Affiliate Gadget dan ingin konsultasi servis gadget.`
    )
    return `https://wa.me/${phoneFormatted}?text=${text}`
  }

  // Google Maps URL
  const getMapsUrl = () => {
    if (mitra.latitude && mitra.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${mitra.latitude},${mitra.longitude}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${mitra.businessName} ${mitra.address} ${mitra.city}`
    )}`
  }

  const heroImageSrc =
    mitra.banner ||
    (mitra.images && mitra.images.length > 0 ? mitra.images[0].url : '') ||
    '/images/service/service-roxy.jpg'

  return (
    <div className="min-h-screen bg-white text-black selection:bg-neutral-900 selection:text-white dark:bg-neutral-950 dark:text-white">
      <Navbar variant="light" />

      {/* ─────────────────────────────────────────────────────────────
          1A. DESKTOP HERO VIEWPORT: STUDIO SPLIT (Matching /toko/[slug])
          Clean studio aesthetic, workshop photo on left, typography on right.
      ───────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative hidden min-h-[580px] w-full overflow-hidden bg-[#FBFBFD] pt-20 dark:bg-neutral-950 md:flex lg:h-[78vh] xl:h-[82vh]"
      >
        {/* Left Column (56%): Workshop/Bengkel Photo Studio Frame */}
        <div className="relative flex h-full w-[56%] items-center justify-start overflow-hidden pl-6 lg:pl-10">
          <div className="relative h-[92%] w-full overflow-hidden rounded-3xl border border-neutral-200/80 bg-neutral-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-900">
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

        {/* Right Column (44%): Sleek Editorial Typography & Action Buttons */}
        <div className="z-10 flex h-full w-[44%] flex-col items-start justify-center space-y-5 pl-6 pr-8 lg:pl-10 lg:pr-16">
          <div className="inline-flex items-center gap-2">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#0070F3] dark:text-sky-400 sm:text-sm">
              Spesialis Servis & Reparasi Gadget
            </span>
            <Sparkles className="h-4 w-4 text-[#0070F3] dark:text-sky-400" />
          </div>

          <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-neutral-950 dark:text-white lg:text-4xl xl:text-5xl">
            {mitra.businessName}
          </h1>

          <p className="max-w-lg text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 lg:text-base">
            {mitra.tagline ||
              mitra.description ||
              `Pusat reparasi gadget profesional di ${mitra.city}. Pengerjaan transparan, teknisi berpengalaman, dan suku cadang berkualitas dengan jaminan garansi servis.`}
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
              {mitra.isOpen ? 'Buka Sekarang' : 'Tutup Sementara'}
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
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={(e) => handleBookingChat(e)}
              className="rounded-full bg-black px-7 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              Booking Servis / Chat Langsung
            </button>

            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackInquiry}
              className="shadow-2xs inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-3.5 text-xs font-bold text-neutral-900 transition hover:border-black hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-white"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            <a
              href={getMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="shadow-2xs inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              title="Buka Petunjuk Arah Google Maps"
            >
              <Compass className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              <span>Peta</span>
            </a>

            <button
              onClick={handleShare}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-400 hover:text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              title="Bagikan Halaman Mitra"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          1B. MOBILE HERO VIEWPORT: LUXURY MOBILE EXPERIENCE
          Designed specifically for mobile devices with clean editorial typography
      ───────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[560px] w-full flex-col justify-between overflow-hidden bg-gradient-to-b from-[#F5F6F8] via-[#FAFBFD] to-white pt-20 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 md:hidden">
        {/* Top: Clean Editorial Typography */}
        <div className="z-10 shrink-0 space-y-2 px-5 text-center">
          <div className="inline-flex items-center gap-1 pt-1 text-[11px] font-bold uppercase tracking-widest text-[#0070F3] dark:text-sky-400">
            <span>Mitra Servis Resmi</span>
            <Sparkles className="h-3 w-3" />
          </div>

          <h1 className="text-2xl font-black leading-[1.12] tracking-tight text-neutral-950 dark:text-white">
            {mitra.businessName}
          </h1>

          <p className="mx-auto line-clamp-2 max-w-sm px-3 text-xs text-neutral-500 dark:text-neutral-400">
            {mitra.tagline ||
              `Spesialis servis & pergantian LCD gadget bergaransi di ${mitra.city}.`}
          </p>

          <div className="flex items-center justify-center gap-2 pt-0.5">
            <div className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
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
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={(e) => handleBookingChat(e)}
              className="rounded-full bg-black px-8 py-3 text-center text-xs font-bold text-white shadow-md transition-transform active:scale-95 dark:bg-white dark:text-black"
            >
              Booking Servis Sekarang
            </button>
          </div>
        </div>

        {/* Center/Bottom: Workshop Photo Frame with Smooth Upward Fade */}
        <div
          className="relative mt-4 w-full flex-1 overflow-hidden"
          style={{ minHeight: '260px' }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-[#FAFBFD] via-[#FAFBFD]/70 to-transparent dark:from-neutral-950 dark:via-neutral-950/70" />
          <ImageWithFallback
            src={heroImageSrc}
            alt={mitra.businessName}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_25%,black_100%)] [mask-image:linear-gradient(to_bottom,transparent_0%,black_25%,black_100%)]"
          />
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

      {/* ─────────────────────────────────────────────────────────────
          1D. STICKY MOBILE CATEGORY / SECTION FILTER BAR (Mobile Only)
      ───────────────────────────────────────────────────────────── */}
      <div className="no-scrollbar shadow-2xs sticky top-16 z-30 flex items-center gap-2 overflow-x-auto border-b border-neutral-200/70 bg-white/95 px-4 py-2.5 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95 md:hidden">
        <a
          href="#katalog-layanan"
          className="shadow-xs shrink-0 rounded-full bg-black px-3.5 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-black"
        >
          Layanan ({mitra.services.length})
        </a>
        {mitra.features && mitra.features.length > 0 && (
          <a
            href="#keunggulan"
            className="shrink-0 rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
          >
            Keunggulan
          </a>
        )}
        {mitra.images && mitra.images.length > 0 && (
          <a
            href="#galeri-workshop"
            className="shrink-0 rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
          >
            Galeri
          </a>
        )}
        <a
          href="#informasi-mitra"
          className="shrink-0 rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
        >
          Lokasi & Jam Buka
        </a>
        <a
          href="#ulasan-pelanggan"
          className="shrink-0 rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
        >
          Ulasan ({mitra.totalReview})
        </a>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. EDITORIAL CAMPAIGN BANNER: SERVICE ASSURANCE & WARRANTY
          Matching Toko Section 2
      ───────────────────────────────────────────────────────────── */}
      <section
        id="banner-editorial"
        className="px-4 py-8 sm:px-6 sm:py-14 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-[#EAF2FA] shadow-sm transition-colors dark:bg-neutral-900">
            <div className="flex min-h-[360px] flex-col items-center gap-6 sm:min-h-[420px] lg:grid lg:min-h-[460px] lg:grid-cols-12">
              {/* Left Editorial Copy */}
              <div className="z-10 order-1 w-full space-y-4 p-7 text-center sm:p-12 lg:col-span-6 lg:pl-16 lg:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0070F3] dark:text-sky-400 sm:text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Standar Reparasi Terverifikasi</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black leading-[1.1] tracking-tight text-neutral-950 dark:text-white sm:text-4xl lg:text-5xl">
                    Reparasi Presisi & Bergaransi Resmi
                  </h2>
                </div>

                <p className="mx-auto max-w-md text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-sm lg:mx-0">
                  Dikerjakan langsung di meja kerja teknisi tersertifikasi{' '}
                  {mitra.businessName}. Konsultasi kerusakan gratis di awal,
                  transparansi harga suku cadang, dan jaminan garansi servis
                  setelah perbaikan selesai.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2 sm:gap-4 lg:justify-start">
                  <button
                    onClick={(e) => handleBookingChat(e)}
                    className="rounded-full bg-black px-7 py-3 text-xs font-bold text-white shadow-md transition hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                  >
                    Konsultasi Servis Sekarang
                  </button>
                  <Link
                    href="/garansi"
                    className="text-xs font-bold text-neutral-900 underline underline-offset-4 transition-opacity hover:opacity-75 dark:text-white sm:text-sm"
                  >
                    Pelajari Garansi 30 Hari
                  </Link>
                </div>
              </div>

              {/* Right Illustration / Workbench Visual */}
              <div className="relative order-2 h-64 min-h-[240px] w-full sm:h-80 sm:min-h-[320px] lg:col-span-6 lg:h-full lg:min-h-[460px]">
                <ImageWithFallback
                  src={
                    (mitra.images && mitra.images.length > 1
                      ? mitra.images[1].url
                      : '') || heroImageSrc
                  }
                  alt="Teknisi Servis Presisi"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center lg:rounded-r-3xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. KATALOG LAYANAN & ESTIMASI BIAYA (Replacing Product Grid)
          Matching Toko Section 3: Luxury elevated cards with soft floating shadow
      ───────────────────────────────────────────────────────────── */}
      <section
        id="katalog-layanan"
        className="border-y border-neutral-100 bg-[#F8F9FA] px-4 py-14 dark:border-neutral-900 dark:bg-neutral-950/70 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="space-y-3 pb-8 text-center sm:pb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#0070F3] dark:text-sky-400">
              Katalog Layanan Workshop
            </span>
            <h2 className="text-2xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-3xl lg:text-4xl">
              Pilihan Servis & Estimasi Biaya
            </h2>
            <p className="mx-auto max-w-lg text-xs text-neutral-500 sm:text-sm">
              Semua estimasi biaya terbuka secara transparan. Klik layanan yang
              dibutuhkan untuk langsung terhubung dengan teknisi di{' '}
              {mitra.businessName}.
            </p>
          </div>

          {/* Elevated Service Cards Grid */}
          {mitra.services && mitra.services.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {mitra.services.map((service) => (
                <div
                  key={service.id || service.name}
                  className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-neutral-300 hover:shadow-[0_20px_35px_rgba(0,0,0,0.1)] active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-3xl sm:p-6"
                >
                  <div className="space-y-3">
                    {/* Icon & Category Indicator */}
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                        {service.icon ? (
                          <span className="text-xl">{service.icon}</span>
                        ) : (
                          <Wrench className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        )}
                      </div>
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        Servis Presisi
                      </span>
                    </div>

                    {/* Service Name & Description */}
                    <div>
                      <h3 className="line-clamp-2 text-sm font-bold tracking-tight text-neutral-900 transition-colors group-hover:text-black dark:text-white dark:group-hover:text-neutral-100 sm:text-base">
                        {service.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                        {service.description ||
                          `Layanan perbaikan dan pergantian komponen presisi untuk ${service.name}.`}
                      </p>
                    </div>
                  </div>

                  {/* Price & Action Button */}
                  <div className="mt-5 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                    <div className="mb-3 flex items-baseline justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                        Estimasi Mulai
                      </span>
                      <span className="text-sm font-black tabular-nums text-neutral-950 dark:text-white sm:text-base">
                        {service.price}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleBookingChat(e, service.name)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-full bg-neutral-900 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-black active:scale-95 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Booking Layanan Ini</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-neutral-300 py-16 text-center text-xs text-neutral-400 dark:border-neutral-800">
              Belum ada daftar layanan yang ditampilkan. Silakan hubungi
              langsung mitra via WhatsApp atau Live Chat.
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. KEUNGGULAN WORKSHOP (Features Bento)
      ───────────────────────────────────────────────────────────── */}
      {mitra.features && mitra.features.length > 0 && (
        <section
          id="keunggulan"
          className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 space-y-2 text-center sm:mb-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#0070F3] dark:text-sky-400">
                Standar Kualitas
              </span>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
                Keunggulan Layanan {mitra.businessName}
              </h2>
              <p className="text-xs text-neutral-500 sm:text-sm">
                Fasilitas dan komitmen kerja teknisi untuk kepuasan reparasi
                pelanggan.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {mitra.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="p-4.5 flex items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 sm:text-sm">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. GALERI MEJA REPARASI & WORKSHOP
      ───────────────────────────────────────────────────────────── */}
      {mitra.images && mitra.images.length > 0 && (
        <section
          id="galeri-workshop"
          className="border-t border-neutral-100 bg-[#FBFBFD] px-4 py-12 dark:border-neutral-900 dark:bg-neutral-950/60 sm:px-6 sm:py-16 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 space-y-2 text-center sm:mb-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#0070F3] dark:text-sky-400">
                Dokumentasi Workshop
              </span>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
                Galeri Workshop & Fasilitas Reparasi
              </h2>
              <p className="text-xs text-neutral-500 sm:text-sm">
                Bukti visual transparansi lingkungan kerja, peralatan reparasi
                modern, dan meja kerja teknisi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:gap-6">
              {mitra.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => {
                    setLightboxIndex(index)
                    setLightboxOpen(true)
                  }}
                  className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-100 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <ImageWithFallback
                    src={image.url}
                    alt={`${mitra.businessName} - Foto ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                </button>
              ))}
            </div>

            <ImageLightbox
              images={mitra.images.map((img) => img.url)}
              initialIndex={lightboxIndex}
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
            />
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. PHYSICAL WORKSHOP CREDIBILITY & LOCATION (Matching Toko Section 5)
          3-Column Bento Grid: Credibility, Physical Address, Operating Hours
      ───────────────────────────────────────────────────────────── */}
      <section
        id="informasi-mitra"
        className="border-t border-neutral-100 px-4 py-10 dark:border-neutral-900 sm:px-6 sm:py-16 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 space-y-2 text-center sm:mb-10">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
              Informasi Workshop & Lokasi Resmi
            </h2>
            <p className="text-xs text-neutral-500 sm:text-sm">
              Kunjungi langsung bengkel servis resmi atau pesan antar-jemput
              kurir instan terdekat.
            </p>
          </div>

          {/* Mobile Only: Dedicated Compact Store Hub Card */}
          <div className="block space-y-4 rounded-3xl border border-neutral-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 md:hidden">
            {/* Header: Status Mitra */}
            <div className="flex items-start gap-3 border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  ✓ Mitra Servis Resmi Terdaftar
                </span>
                <h3 className="truncate text-sm font-bold text-neutral-950 dark:text-white">
                  {mitra.businessName}
                </h3>
                <p className="text-[11px] text-neutral-500">
                  {mitra.city}, {mitra.province || 'Indonesia'}
                </p>
              </div>
            </div>

            {/* Address & Google Maps */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900 dark:text-white" />
                <div>
                  <p className="font-medium leading-relaxed text-neutral-900 dark:text-neutral-200">
                    {mitra.address}
                  </p>
                  <p className="text-neutral-500">
                    {mitra.city}, {mitra.province}
                  </p>
                </div>
              </div>

              <a
                href={getMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="shadow-2xs flex w-full items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-bold text-neutral-900 transition-all active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Petunjuk Arah Google Maps</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Hours & Chat Action */}
            <div className="flex items-center justify-between border-t border-neutral-100 pt-2 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-neutral-500" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {mitra.weekdayHours || '09:00 - 20:00 WIB'}
                </span>
              </div>
              <button
                onClick={(e) => handleBookingChat(e)}
                className="text-xs font-bold text-blue-600 underline underline-offset-4 dark:text-sky-400"
              >
                Chat Teknisi →
              </button>
            </div>
          </div>

          {/* Desktop Only: 3 Columns Grid (Intact matching /toko/[slug]) */}
          <div className="hidden gap-5 sm:gap-6 md:grid md:grid-cols-3">
            {/* 1. Kredibilitas & Sertifikasi */}
            <div className="space-y-3 rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                Kredibilitas & Garansi Servis
              </h3>
              <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                <p className="font-semibold text-neutral-900 dark:text-neutral-200">
                  {mitra.businessName}
                </p>
                <p>Mitra Terverifikasi Platform Affiliate Gadget</p>
                <p className="pt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ Garansi Pengerjaan & Suku Cadang Teruji
                </p>
              </div>
            </div>

            {/* 2. Lokasi Fisik Workshop & Peta */}
            <div className="space-y-3 rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                Alamat Fisik Workshop
              </h3>
              <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                <p className="line-clamp-2 leading-relaxed">{mitra.address}</p>
                <p className="font-medium">
                  {mitra.city}, {mitra.province}
                </p>
                <div className="pt-2">
                  <a
                    href={getMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-black underline underline-offset-4 hover:opacity-75 dark:text-white"
                  >
                    Petunjuk Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* 3. Jam Operasional & Kontak Langsung */}
            <div className="space-y-3 rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                Jam Buka & Konsultasi
              </h3>
              <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                <p className="font-medium text-neutral-900 dark:text-neutral-200">
                  Senin - Jumat: {mitra.weekdayHours || '09:00 - 20:00 WIB'}
                </p>
                {mitra.weekendHours && (
                  <p className="text-neutral-500">
                    Sabtu - Minggu: {mitra.weekendHours}
                  </p>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={(e) => handleBookingChat(e)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-black underline underline-offset-4 dark:text-white"
                  >
                    Buka Chat Teknisi →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Embedded Google Maps Container (Desktop & Tablet) */}
          {mitra.latitude && mitra.longitude && (
            <div className="mt-8 hidden overflow-hidden rounded-3xl border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 md:block">
              <div className="h-72 w-full lg:h-96">
                <GoogleMapsProvider>
                  <GoogleMapDisplay
                    latitude={mitra.latitude}
                    longitude={mitra.longitude}
                    address={mitra.address}
                    businessName={mitra.businessName}
                  />
                </GoogleMapsProvider>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. ULASAN PELANGGAN (Reviews Section)
      ───────────────────────────────────────────────────────────── */}
      <section
        id="ulasan-pelanggan"
        className="border-t border-neutral-100 bg-[#FBFBFD] px-4 py-12 dark:border-neutral-900 dark:bg-neutral-950/60 sm:px-6 sm:py-16 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#0070F3] dark:text-sky-400">
                Testimoni Pengguna
              </span>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
                Ulasan Pelanggan Servis
              </h2>
              <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
                <div className="flex items-center text-amber-500">
                  <Star className="h-4 w-4 fill-amber-400" />
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">
                  {mitra.rating.toFixed(1)} / 5.0
                </span>
                <span className="text-xs text-neutral-400">
                  • Berdasarkan {mitra.totalReview} ulasan pelanggan
                  terverifikasi
                </span>
              </div>
            </div>

            {session?.user &&
              session.user.role === 'CUSTOMER' &&
              !userHasReview && (
                <button
                  onClick={() => {
                    setEditingReview(null)
                    setIsReviewModalOpen(true)
                  }}
                  className="rounded-full bg-black px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                >
                  + Tulis Review Servis
                </button>
              )}
          </div>

          <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
            <ReviewList
              mitraId={mitra.id}
              refreshTrigger={refreshReviews}
              currentUserId={session?.user?.id}
              onEditReview={(review) => {
                setEditingReview(review)
                setIsReviewModalOpen(true)
              }}
            />
          </div>

          <ReviewModal
            mitraId={mitra.id}
            existingReview={editingReview}
            isOpen={isReviewModalOpen}
            onClose={() => {
              setIsReviewModalOpen(false)
              setEditingReview(null)
            }}
            onSuccess={() => {
              setRefreshReviews((prev) => prev + 1)
            }}
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8A. DESKTOP FLOATING TECHNICIAN SPECIALIST CHAT POPUP (Matching Toko 6A)
      ───────────────────────────────────────────────────────────── */}
      {showChatPopup && (
        <aside
          aria-label="Konsultasi Teknisi Servis"
          className="fixed bottom-6 right-6 z-40 hidden items-center gap-3 duration-500 animate-in fade-in slide-in-from-bottom-4 md:flex"
        >
          {/* Tooltip Chat Bubble */}
          <div className="relative max-w-xs rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <button
              onClick={() => setShowChatPopup(false)}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-400"
              title="Tutup Pesan"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="text-[11px] font-medium leading-relaxed text-neutral-700 dark:text-neutral-300">
              Ada kendala layar, baterai, atau mesin pada HP Anda? Konsultasikan
              kerusakan gratis ke teknisi <strong>{mitra.businessName}</strong>!
            </p>
            <div className="mt-2">
              <button
                onClick={(e) => handleBookingChat(e)}
                className="text-[11px] font-bold text-sky-600 hover:underline dark:text-sky-400"
              >
                Mulai Chat Langsung →
              </button>
            </div>
          </div>

          {/* Avatar Specialist Button */}
          <button
            onClick={(e) => handleBookingChat(e)}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500 bg-white p-0.5 shadow-2xl transition hover:scale-105 dark:bg-neutral-900"
            title="Chat dengan Teknisi Mitra"
          >
            <div className="relative h-full w-full overflow-hidden rounded-full">
              <ImageWithFallback
                src={heroImageSrc}
                alt="Teknisi Mitra"
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            {/* Active Green Dot */}
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900" />
          </button>
        </aside>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8B. MOBILE STICKY BOTTOM ACTION BAR (Mobile Only)
      ───────────────────────────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95 md:hidden">
        <div className="flex items-center gap-2">
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackInquiry}
            className="flex h-11 w-12 shrink-0 items-center justify-center rounded-2xl border border-neutral-300 bg-white text-emerald-600 active:scale-95 dark:border-neutral-700 dark:bg-neutral-900"
            title="WhatsApp Langsung"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
          <button
            onClick={(e) => handleBookingChat(e)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-black py-3 text-xs font-bold text-white shadow-md active:scale-95 dark:bg-white dark:text-black"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Booking Servis / Chat Sekarang</span>
          </button>
        </div>
      </div>

      <Footer variant="light" />
    </div>
  )
}
