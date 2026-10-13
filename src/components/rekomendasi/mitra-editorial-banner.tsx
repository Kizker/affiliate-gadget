'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { MitraDetail } from '@/types/mitra-detail'

interface MitraEditorialBannerProps {
  mitra: MitraDetail
  heroImageSrc: string
  onBookingChat: (e?: React.MouseEvent) => void
  randomImageSrc?: string | null
}

export function MitraEditorialBanner({
  mitra,
  heroImageSrc,
  onBookingChat,
  randomImageSrc,
}: MitraEditorialBannerProps) {
  const isMobile = useIsMobile(768)

  // Ambil gambar secara acak dari galeri, jika kosong ambil dari banner
  const editorialImage = useMemo(() => {
    if (randomImageSrc) return randomImageSrc
    if (mitra.images && mitra.images.length > 0) {
      const validImages = mitra.images.filter((img) => Boolean(img?.url))
      if (validImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * validImages.length)
        return validImages[randomIndex].url
      }
    }
    return mitra.banner || heroImageSrc || '/images/service/service-roxy.jpg'
  }, [randomImageSrc, mitra.images, mitra.banner, heroImageSrc])
  return (
    <section
      id="banner-editorial"
      className="relative px-4 pb-6 pt-8 sm:px-6 md:flex md:h-screen md:snap-start md:scroll-mt-24 md:flex-col md:justify-center md:overflow-hidden md:pb-8 md:pt-10 lg:px-8"
      style={!isMobile ? { minHeight: '100vh', height: '100vh' } : undefined}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-[#EAF2FA] shadow-sm transition-colors dark:bg-neutral-900 md:min-h-[300px] lg:min-h-[340px]">
          <div className="flex flex-col items-center gap-6 sm:min-h-[300px] lg:grid lg:min-h-[340px] lg:grid-cols-12">
            {/* Left Editorial Copy */}
            <div className="z-10 order-1 flex w-full flex-col justify-center space-y-4 p-6 text-center sm:p-8 md:h-full lg:col-span-6 lg:pl-12 lg:text-left">
              <div className="space-y-1">
                <h2 className="text-2xl font-black leading-[1.1] tracking-tight text-neutral-950 dark:text-white sm:text-4xl lg:text-5xl">
                  Reparasi Presisi &amp; Bergaransi Resmi
                </h2>
              </div>

              <p className="mx-auto max-w-md text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-sm lg:mx-0">
                {mitra.description ||
                  `Dikerjakan langsung di meja kerja teknisi tersertifikasi ${mitra.businessName}. Konsultasi kerusakan gratis di awal, transparansi harga suku cadang, dan jaminan garansi servis setelah perbaikan selesai.`}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2 sm:gap-4 lg:justify-start">
                <button
                  onClick={(e) => onBookingChat(e)}
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
            <div className="relative order-2 h-64 min-h-[240px] w-full sm:h-72 lg:col-span-6 lg:h-full lg:min-h-[340px]">
              <ImageWithFallback
                src={editorialImage}
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
  )
}
