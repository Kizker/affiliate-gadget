'use client'

import React, { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Share2,
  MessageCircle,
  Wrench,
  Clock,
  Phone,
  Mail,
  Globe,
  MapPin,
  ChevronRight,
  ChevronDown,
  PenLine,
} from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { formatServicePrice, isMitraCurrentlyOpen } from '@/lib/mitra-utils'
import type { MitraDetail, ServiceItem, MitraImage } from '@/types/mitra-detail'
import type { Session } from 'next-auth'

// Dynamic import for lightbox modal
const ImageLightbox = dynamic(
  () => import('@/components/gallery/image-lightbox'),
  { ssr: false }
)

// Dynamic import for review modal and review list
const ReviewModal = dynamic(() => import('@/components/reviews/review-modal'), {
  ssr: false,
})
const ReviewList = dynamic(() => import('@/components/reviews/review-list'), {
  ssr: false,
})

export interface MitraMobileViewProps {
  mitra: MitraDetail
  heroImageSrc: string
  whatsAppUrl: string
  mapsUrl: string
  onBookingChat: (e?: React.MouseEvent, serviceName?: string) => void
  onShare: () => void
  userHasReview: boolean
  session: Session | null
  onReviewCreatedOrUpdated?: () => void
}

export function MitraMobileView({
  mitra,
  heroImageSrc,
  whatsAppUrl,
  mapsUrl,
  onBookingChat,
  onShare,
  userHasReview,
  session,
  onReviewCreatedOrUpdated,
}: MitraMobileViewProps) {
  const router = useRouter()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  // Status buka toko real-time
  const isOpen = useMemo(() => {
    return isMitraCurrentlyOpen(mitra.weekdayHours, mitra.weekendHours)
  }, [mitra.weekdayHours, mitra.weekendHours])

  // Foto galeri maksimal 5 foto
  const galleryImages = useMemo(() => {
    if (!mitra.images || mitra.images.length === 0) return []
    return mitra.images.slice(0, 5)
  }, [mitra.images])

  // Keunggulan mitra maksimal 10 item
  const activeFeatures = useMemo(() => {
    if (!mitra.features || mitra.features.length === 0) {
      return [
        'Pengerjaan Kilat 2 Jam di Meja Teknisi',
        'Garansi Unit 30 Hari Bebas Khawatir',
        'Suku Cadang Grade Original Terverifikasi',
        'Pengecekan Kerusakan Gratis di Awal',
        'Keamanan Privasi & Data Pribadi Terjamin',
        'Teknisi Bersertifikasi & Berpengalaman',
        'Peralatan Servis Standar Presisi Tinggi',
        'Konsultasi Kerusakan Ramah & Transparan',
        'Pilihan Suku Cadang Grade Original',
        'Bisa Ditunggu & Pengerjaan Rapi',
      ]
    }
    return mitra.features.slice(0, 10)
  }, [mitra.features])

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      window.history.back()
      setTimeout(() => {
        if (
          typeof window !== 'undefined' &&
          window.location.pathname === currentPath
        ) {
          router.push('/servis')
        }
      }, 250)
      return
    }
    router.push('/servis')
  }

  return (
    <div className="relative min-h-screen w-full bg-white pb-24 text-neutral-900 dark:bg-black dark:text-white">
      {/* ─────────────────────────────────────────────────────────────
          1. FULL-SCREEN 100VH HERO COVER DENGAN NAMA TOKO DI TENGAH
          Gambar muncul penuh satu layar dengan nama toko dead-center
      ───────────────────────────────────────────────────────────── */}
      <div className="relative h-[100dvh] h-screen min-h-screen w-full overflow-hidden bg-black">
        <ImageWithFallback
          src={heroImageSrc}
          alt={mitra.businessName}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center brightness-95"
        />

        {/* Cinematic contrast overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/85" />

        {/* Top Floating Action Icons (Back & Share) */}
        <div className="pt-safe absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition active:scale-90"
            aria-label="Kembali ke halaman servis"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            onClick={onShare}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition active:scale-90"
            aria-label="Bagikan profil mitra"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {/* ── DEAD-CENTER: NAMA TOKO DI TENGAH GAMBAR ── */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white drop-shadow-md sm:text-4xl">
            {mitra.businessName}
          </h1>

          <div className="mt-3.5 flex items-center gap-2 text-xs font-semibold text-white/80">
            <span>{mitra.city || 'Indonesia'}</span>
            <span>•</span>
            <span>★ {mitra.rating.toFixed(1)}</span>
            <span>•</span>
            <span
              className={isOpen ? 'font-bold text-white' : 'text-neutral-400'}
            >
              {isOpen ? 'Buka Sekarang' : 'Tutup'}
            </span>
          </div>
        </div>

        {/* Subtle scroll down indicator */}
        <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex animate-bounce flex-col items-center justify-center text-white/60">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. LOKASI SINGKAT & TAUTAN PETA
          Tombol in-flow dihapus, chat beralih ke tombol melayang kanan bawah
      ───────────────────────────────────────────────────────────── */}
      <div className="px-5 pb-1 pt-5">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs transition active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-black dark:text-white" />
            <p className="truncate text-xs font-medium text-neutral-800 dark:text-neutral-200">
              {mitra.address ||
                `${mitra.city}, ${mitra.province || 'Indonesia'}`}
            </p>
          </div>
          <span className="shrink-0 text-[11px] font-bold text-black dark:text-white">
            Peta ↗
          </span>
        </a>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. LAYANAN & BIAYA (Langsung Nama Servis lalu Bawahnya Harga, Tidak Bersampingan)
      ───────────────────────────────────────────────────────────── */}
      <section id="m-sec-layanan" className="mt-6 px-5">
        <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-white">
          Layanan
        </h2>

        {mitra.services && mitra.services.length > 0 ? (
          <div className="mt-3 space-y-2.5">
            {mitra.services.map((service: ServiceItem) => (
              <div
                key={service.id || service.name}
                className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5 transition dark:border-neutral-800 dark:bg-neutral-950"
              >
                {/* Nama Servis di atas, langsung di bawahnya Harga (tidak bersampingan agar tidak terpotong) */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold leading-snug text-neutral-900 dark:text-white">
                    {service.name}
                  </h3>
                  <p className="mt-1 text-xs font-black text-neutral-900 dark:text-white">
                    {formatServicePrice(service.price)}
                  </p>
                </div>

                <button
                  onClick={(e) => onBookingChat(e, service.name)}
                  className="flex h-8 shrink-0 items-center justify-center rounded-full bg-black px-3.5 text-[11px] font-bold text-white transition active:scale-95 dark:bg-white dark:text-black"
                >
                  <span>Pilih</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-neutral-200 p-5 text-center text-xs dark:border-neutral-800">
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">
              Konsultasi Langsung dengan Teknisi
            </p>
            <button
              onClick={(e) => onBookingChat(e)}
              className="mt-2.5 inline-flex rounded-full bg-black px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-black"
            >
              Chat Sekarang
            </button>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. KEUNGGULAN (Card Melayang-layang, Maksimal 10)
      ───────────────────────────────────────────────────────────── */}
      <section id="m-sec-keunggulan" className="mt-6 px-5">
        <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-white">
          Keunggulan
        </h2>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {activeFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.05)] transition-all active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-black dark:bg-white" />
              <span className="text-xs font-semibold leading-tight text-neutral-800 dark:text-neutral-200">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. DOKUMENTASI WORKSHOP (Carousel Horizontal)
      ───────────────────────────────────────────────────────────── */}
      {galleryImages.length > 0 && (
        <section id="m-sec-galeri" className="mt-6 px-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-white">
              Workshop
            </h2>
            <span className="text-[10px] font-semibold text-neutral-400">
              {galleryImages.length} Foto
            </span>
          </div>

          <div className="scrollbar-none mt-3 flex snap-x gap-2.5 overflow-x-auto pb-1">
            {galleryImages.map((img: MitraImage, idx: number) => (
              <div
                key={img.id || idx}
                onClick={() => {
                  setLightboxIndex(idx)
                  setLightboxOpen(true)
                }}
                className="active:scale-98 relative h-36 w-52 shrink-0 cursor-pointer snap-start overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <ImageWithFallback
                  src={img.url}
                  alt={`Workshop ${mitra.businessName} ${idx + 1}`}
                  fill
                  sizes="210px"
                  className="object-cover"
                />
                <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-md">
                  {idx + 1}/{galleryImages.length}
                </div>
              </div>
            ))}
          </div>

          {lightboxOpen && (
            <ImageLightbox
              images={galleryImages.map((g) => g.url)}
              initialIndex={lightboxIndex}
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
            />
          )}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. LOKASI & JAM OPERASIONAL (Monokrom Bersih)
      ───────────────────────────────────────────────────────────── */}
      <section id="m-sec-info" className="mt-6 px-5">
        <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-white">
          Lokasi &amp; Jam
        </h2>

        <div className="mt-3 space-y-2 rounded-xl border border-neutral-200 bg-white p-3.5 text-xs dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-start justify-between border-b border-neutral-100 pb-2.5 dark:border-neutral-800">
            <span className="text-neutral-500">Hari Kerja:</span>
            <span className="font-bold text-neutral-900 dark:text-white">
              {mitra.weekdayHours || '09:00 - 20:00 WIB'}
            </span>
          </div>

          <div className="flex items-start justify-between border-b border-neutral-100 pb-2.5 dark:border-neutral-800">
            <span className="text-neutral-500">Akhir Pekan:</span>
            <span className="font-bold text-neutral-900 dark:text-white">
              {mitra.weekendHours || '10:00 - 18:00 WIB'}
            </span>
          </div>

          {mitra.phone && (
            <a
              href={`tel:${mitra.phone}`}
              className="flex items-center justify-between border-b border-neutral-100 pb-2.5 dark:border-neutral-800"
            >
              <span className="text-neutral-500">Telepon:</span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {mitra.phone} ↗
              </span>
            </a>
          )}

          {mitra.email && (
            <a
              href={`mailto:${mitra.email}`}
              className="flex items-center justify-between border-b border-neutral-100 pb-2.5 dark:border-neutral-800"
            >
              <span className="text-neutral-500">Email:</span>
              <span className="truncate font-bold text-neutral-900 dark:text-white">
                {mitra.email} ↗
              </span>
            </a>
          )}

          {mitra.website && (
            <a
              href={
                mitra.website.startsWith('http')
                  ? mitra.website
                  : `https://${mitra.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between pt-0.5"
            >
              <span className="text-neutral-500">Website:</span>
              <span className="truncate font-bold text-neutral-900 dark:text-white">
                {mitra.website} ↗
              </span>
            </a>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. ULASAN PELANGGAN
      ───────────────────────────────────────────────────────────── */}
      <section id="m-sec-ulasan" className="mt-6 px-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-white">
            Ulasan ({mitra.totalReview})
          </h2>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1 text-xs font-bold text-neutral-800 transition active:scale-95 dark:border-neutral-700 dark:text-neutral-200"
          >
            <PenLine className="h-3 w-3" />
            <span>Tulis</span>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-neutral-900 dark:text-white">
              {mitra.rating.toFixed(1)}
            </span>
            <span className="text-xs text-neutral-500">
              dari 5.0 bintang ({mitra.totalReview} ulasan)
            </span>
          </div>
        </div>

        <div className="mt-2.5">
          <ReviewList mitraId={mitra.id} maxDisplay={3} />
        </div>

        {isReviewModalOpen && (
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            mitraId={mitra.id}
            onSuccess={() => {
              setIsReviewModalOpen(false)
              if (onReviewCreatedOrUpdated) onReviewCreatedOrUpdated()
            }}
          />
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. TOMBOL MELAYANG DI KANAN BAWAH (CHAT MITRA)
          Tombol aksi melayang di kanan bawah untuk melanjutkan chat mitra
      ───────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-5 z-40">
        <button
          onClick={(e) => onBookingChat(e)}
          className="group flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-bold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)] ring-1 ring-white/20 transition-all duration-200 active:scale-95 dark:bg-white dark:text-black dark:ring-black/20"
          aria-label="Chat Mitra"
        >
          <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span>Chat Mitra</span>
        </button>
      </div>
    </div>
  )
}
