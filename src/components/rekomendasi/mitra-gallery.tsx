'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { ExternalLink } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { MitraImage } from '@/types/mitra-detail'

// Dynamic import for lightbox modal (Task 2.2)
const ImageLightbox = dynamic(
  () => import('@/components/gallery/image-lightbox'),
  { ssr: false }
)

interface MitraGalleryProps {
  images?: MitraImage[]
  businessName: string
  initialIsMobile?: boolean
}

export function MitraGallery({
  images,
  businessName,
  initialIsMobile,
}: MitraGalleryProps) {
  const isMobile = useIsMobile(768, initialIsMobile)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (!images || images.length === 0) return null

  return (
    <section
      id="galeri-workshop"
      suppressHydrationWarning
      className="border-t border-neutral-100 bg-[#FBFBFD] px-4 dark:border-neutral-900 dark:bg-neutral-950/60 sm:px-6 md:flex md:h-screen md:snap-start md:flex-col md:justify-center md:overflow-hidden lg:px-8"
      style={!isMobile ? { minHeight: '100vh', height: '100vh' } : undefined}
    >
      <div className="mx-auto my-auto w-full max-w-7xl">
        <div className="mb-4 space-y-1.5 text-center sm:mb-5">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
            Galeri Workshop &amp; Fasilitas Reparasi
          </h2>
          <p className="text-xs text-neutral-500 sm:text-sm">
            Bukti visual transparansi lingkungan kerja, peralatan reparasi
            modern, dan meja kerja teknisi.
          </p>
        </div>

        {/* Maksimal 5 foto dokumentasi ditampilkan di layar */}
        <div
          className={`grid grid-cols-2 gap-3 sm:gap-4 ${
            images.slice(0, 5).length <= 2
              ? 'md:mx-auto md:w-full md:max-w-3xl md:grid-cols-2'
              : 'md:grid-cols-3 lg:grid-cols-5'
          }`}
        >
          {images.slice(0, 5).map((image, index) => {
            const isFifthAndMore = index === 4 && images.length > 5
            const remainingCount = images.length - 5

            return (
              <button
                key={image.id}
                onClick={() => {
                  setLightboxIndex(index)
                  setLightboxOpen(true)
                }}
                className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-100 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <ImageWithFallback
                  src={image.url}
                  alt={`${businessName} - Foto ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />

                {/* Overlay badge jika ada lebih dari 5 foto */}
                {isFifthAndMore && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 font-bold text-white backdrop-blur-[2px]">
                    <span className="text-base font-black sm:text-lg">
                      +{remainingCount}
                    </span>
                    <span className="text-[10px] font-semibold sm:text-xs">
                      Foto Lainnya
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Tombol Lihat Semua jika foto lebih dari 5 */}
        {images.length > 5 && (
          <div className="mt-3 text-center">
            <button
              onClick={() => {
                setLightboxIndex(0)
                setLightboxOpen(true)
              }}
              className="shadow-xs inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-bold text-neutral-800 transition hover:border-black hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <span>Lihat Semua {images.length} Dokumentasi</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {lightboxOpen && (
          <ImageLightbox
            images={images.map((img) => img.url)}
            initialIndex={lightboxIndex}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </div>
    </section>
  )
}
