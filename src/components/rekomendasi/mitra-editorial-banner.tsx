'use client'

import React from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { MitraDetail } from '@/types/mitra-detail'

interface MitraEditorialBannerProps {
  mitra: MitraDetail
  heroImageSrc: string
  onBookingChat: (e?: React.MouseEvent) => void
}

export function MitraEditorialBanner({
  mitra,
  heroImageSrc,
  onBookingChat,
}: MitraEditorialBannerProps) {
  const isMobile = useIsMobile(768)

  return (
    <section
      id="banner-editorial"
      className="relative px-4 py-6 sm:px-6 sm:py-10 md:flex md:h-screen md:snap-start md:flex-col md:justify-center md:overflow-hidden md:pt-16 lg:px-8"
      style={!isMobile ? { minHeight: '100vh', height: '100vh' } : undefined}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-[#EAF2FA] shadow-sm transition-colors dark:bg-neutral-900 md:min-h-[380px] lg:min-h-[420px]">
          <div className="flex flex-col items-center gap-6 sm:min-h-[360px] lg:grid lg:min-h-[420px] lg:grid-cols-12">
            {/* Left Editorial Copy */}
            <div className="z-10 order-1 flex w-full flex-col justify-center space-y-4 p-7 text-center sm:p-12 md:h-full lg:col-span-6 lg:pl-16 lg:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0070F3] dark:text-sky-400 sm:text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>Standar Reparasi Terverifikasi</span>
              </div>

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
            <div className="relative order-2 h-64 min-h-[240px] w-full sm:h-72 lg:col-span-6 lg:h-full lg:min-h-[420px]">
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
  )
}
