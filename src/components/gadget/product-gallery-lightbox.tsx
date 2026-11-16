'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductGalleryLightboxProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  initialIndex?: number
  productName?: string
}

export function ProductGalleryLightbox({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  productName,
}: ProductGalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  // Keyboard navigation & ESC
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length, onClose])

  if (!mounted || !isOpen || images.length === 0) return null

  const currentImg = images[currentIndex] || images[0]

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex cursor-pointer select-none flex-col items-center justify-between overflow-hidden bg-slate-900/60 p-4 backdrop-blur-2xl sm:p-6"
        onClick={onClose}
      >
        {/* Soft Colorful Ambient Radial Glows (Simple, modern, not pitch-black) */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-[100px]" />

        {/* Ambient Blurred Companion Layer matching image colors */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <img
            src={currentImg}
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-125 object-cover blur-3xl brightness-110 transition-all duration-700 ease-out"
          />
        </div>

        {/* Top Header Controls */}
        <div
          className="relative z-20 flex w-full max-w-4xl cursor-default items-center justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Centered Image Counter & Name Pill */}
          <div className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/70 px-4 py-1.5 text-xs text-slate-800 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:text-white">
            {productName && (
              <span className="max-w-[200px] truncate font-bold text-slate-950 dark:text-white sm:max-w-xs">
                {productName}
              </span>
            )}
            <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
              {currentIndex + 1} / {images.length}
            </span>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Layar Penuh"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/80 text-slate-700 shadow-md backdrop-blur-xl transition hover:scale-105 hover:bg-white active:scale-95 dark:border-white/10 dark:bg-slate-900/80 dark:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Middle Main Image Stage */}
        <div className="relative z-10 flex w-full flex-1 items-center justify-center px-2 py-4 sm:px-14">
          {/* Prev Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Sebelumnya"
              className="absolute left-2 z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/85 text-slate-800 shadow-xl backdrop-blur-xl transition hover:scale-110 hover:bg-white active:scale-95 dark:border-white/15 dark:bg-slate-900/85 dark:text-white sm:left-6 sm:h-12 sm:w-12"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2]" />
            </button>
          )}

          {/* Main Image Container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[72vh] max-w-[92vw] items-center justify-center overflow-hidden rounded-3xl border border-white/30 bg-white/40 p-2 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/40 sm:max-h-[76vh] sm:max-w-[80vw]"
            >
              <img
                src={currentImg}
                alt={`${productName || 'Gadget'} - ${currentIndex + 1}`}
                className="max-h-[70vh] w-auto max-w-full select-none rounded-2xl object-contain shadow-lg sm:max-h-[74vh]"
              />
            </motion.div>
          </AnimatePresence>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Berikutnya"
              className="absolute right-2 z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/85 text-slate-800 shadow-xl backdrop-blur-xl transition hover:scale-110 hover:bg-white active:scale-95 dark:border-white/15 dark:bg-slate-900/85 dark:text-white sm:right-6 sm:h-12 sm:w-12"
            >
              <ChevronRight className="h-6 w-6 stroke-[2]" />
            </button>
          )}
        </div>

        {/* Bottom Filmstrip Thumbnails */}
        {images.length > 1 && (
          <div
            className="no-scrollbar relative z-20 flex max-w-full cursor-default items-center gap-2 overflow-x-auto rounded-2xl border border-white/20 bg-white/60 p-2 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-14 sm:w-14 ${
                  i === currentIndex
                    ? 'scale-105 border-orange-500 shadow-md ring-2 ring-orange-400/50'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
