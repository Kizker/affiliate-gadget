'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageLightboxProps {
  images: string[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

export default function ImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentIndex])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex select-none items-center justify-center overflow-hidden bg-black">
      {/* ── AMBIENT BLURRED BACKDROP (Efek samar bayangan foto di belakang) ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={images[currentIndex]}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-150 object-cover opacity-45 blur-3xl brightness-75 transition-all duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:bg-black/75 active:scale-90"
        aria-label="Tutup foto"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Image Counter */}
      <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-white/20 bg-black/50 px-4 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous Button */}
      {images.length > 1 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:bg-black/75 active:scale-90"
          aria-label="Foto sebelumnya"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Main Image Container */}
      <div className="pointer-events-none relative z-20 flex h-full w-full items-center justify-center p-4 sm:p-8">
        <img
          src={images[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          className="pointer-events-auto max-h-[85vh] max-w-full rounded-2xl object-contain shadow-[0_25px_70px_rgba(0,0,0,0.95)] ring-1 ring-white/15 transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Next Button */}
      {images.length > 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:bg-black/75 active:scale-90"
          aria-label="Foto selanjutnya"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Thumbnail Strip (Desktop only) */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-30 hidden -translate-x-1/2 gap-2 sm:flex">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-14 w-14 overflow-hidden rounded-xl border-2 shadow-md transition-all ${
                index === currentIndex
                  ? 'scale-105 border-white ring-2 ring-white/50'
                  : 'border-white/20 opacity-50 hover:opacity-100'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Touch/Swipe area for mobile */}
      <div
        className="absolute inset-0 z-10"
        onClick={onClose}
        onTouchStart={(e) => {
          const touch = e.touches[0]
          const startX = touch.clientX

          const handleTouchMove = (moveEvent: TouchEvent) => {
            const currentX = moveEvent.touches[0].clientX
            const diff = startX - currentX

            if (Math.abs(diff) > 50) {
              if (diff > 0) {
                handleNext()
              } else {
                handlePrevious()
              }
              document.removeEventListener('touchmove', handleTouchMove)
            }
          }

          document.addEventListener('touchmove', handleTouchMove)
          document.addEventListener(
            'touchend',
            () => {
              document.removeEventListener('touchmove', handleTouchMove)
            },
            { once: true }
          )
        }}
      />
    </div>
  )
}
