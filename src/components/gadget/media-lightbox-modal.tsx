'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Star } from 'lucide-react'

export interface MediaItem {
  url: string
  type: 'image' | 'video'
  reviewId?: string
  authorName?: string
  rating?: number
  date?: string
}

interface MediaLightboxModalProps {
  isOpen: boolean
  onClose: () => void
  mediaList: MediaItem[]
  initialIndex?: number
}

const isVideoUrl = (url: string) => {
  if (!url) return false
  return (
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    url.endsWith('.mov') ||
    url.includes('/video/') ||
    url.includes('.mp4?') ||
    url.includes('.webm?')
  )
}

export function MediaLightboxModal({
  isOpen,
  onClose,
  mediaList,
  initialIndex = 0,
}: MediaLightboxModalProps) {
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

  // Keyboard navigation & ESC handler
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1))
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, mediaList.length, onClose])

  if (!mounted || !isOpen || mediaList.length === 0) return null

  const currentMedia = mediaList[currentIndex] || mediaList[0]
  const isVideo = currentMedia.type === 'video' || isVideoUrl(currentMedia.url)

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0))
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-white/45 backdrop-blur-xl p-4 sm:p-6 select-none cursor-pointer"
        onClick={onClose}
      >
        {/* Top Floating Info Bar (Centered) */}
        <div
          className="w-full flex items-center justify-center z-20 cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 text-xs text-slate-800 backdrop-blur-xl border border-slate-200/80 shadow-md">
            <span className="font-bold text-slate-950">{currentMedia.authorName || 'Foto Pembeli'}</span>
            {currentMedia.rating && (
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{currentMedia.rating}.0</span>
              </div>
            )}
            <span className="text-slate-400 text-[11px]">
              {currentIndex + 1} / {mediaList.length}
            </span>
          </div>
        </div>

        {/* Middle Main Media Stage (Clicking outside the image directly closes the modal) */}
        <div className="relative flex-1 w-full flex items-center justify-center my-auto px-2 sm:px-14">
          {/* Prev Button (Minimalist Clean Black Circle) */}
          {mediaList.length > 1 && (
            <button
              onClick={handlePrev}
              title="Sebelumnya (◄)"
              className="absolute left-2 sm:left-6 z-30 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/80 hover:bg-black text-white backdrop-blur-md shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5 stroke-[2] text-white" />
            </button>
          )}

          {/* Main Media (Image/Video) Viewport */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[68vh] sm:max-h-[72vh] max-w-[90vw] sm:max-w-[80vw] overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 bg-black/90 flex items-center justify-center cursor-default ring-1 ring-black/5"
            >
              {isVideo ? (
                <video
                  src={currentMedia.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[68vh] sm:max-h-[72vh] w-auto max-w-full rounded-2xl sm:rounded-3xl object-contain shadow-2xl"
                />
              ) : (
                <img
                  src={currentMedia.url}
                  alt={currentMedia.authorName || `Foto Ulasan ${currentIndex + 1}`}
                  className="max-h-[68vh] sm:max-h-[72vh] w-auto max-w-full object-contain rounded-2xl sm:rounded-3xl select-none"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Next Button (Minimalist Clean Black Circle) */}
          {mediaList.length > 1 && (
            <button
              onClick={handleNext}
              title="Selanjutnya (►)"
              className="absolute right-2 sm:right-6 z-30 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/80 hover:bg-black text-white backdrop-blur-md shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <ChevronRight className="h-5 w-5 stroke-[2] text-white" />
            </button>
          )}
        </div>

        {/* Bottom Bar: Filmstrip Thumbnails & Keyboard Helper */}
        <div
          className="w-full max-w-2xl flex flex-col items-center gap-2.5 z-20 cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Filmstrip Carousel if multiple media */}
          {mediaList.length > 1 && (
            <div className="flex items-center gap-2.5 p-1.5 rounded-2xl bg-white/80 border border-slate-200/80 backdrop-blur-xl shadow-lg overflow-x-auto no-scrollbar">
              {mediaList.map((item, idx) => {
                const isItemVideo = item.type === 'video' || isVideoUrl(item.url)
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl transition-all duration-200 cursor-pointer ${
                      currentIndex === idx
                        ? 'ring-2 ring-orange-500 scale-105 opacity-100 shadow-md'
                        : 'opacity-50 hover:opacity-100 ring-1 ring-slate-200'
                    }`}
                  >
                    {isItemVideo ? (
                      <div className="relative h-full w-full bg-black flex items-center justify-center">
                        <video src={item.url} className="h-full w-full object-cover opacity-70" />
                        <Play className="absolute h-3 w-3 fill-white text-white" />
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={`Thumb ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Keyboard Helper Text */}
          <p className="text-[11px] font-medium text-slate-500 tracking-wide text-center">
            Klik di luar gambar atau tekan <span className="text-slate-900 font-bold">ESC</span> untuk menutup • Gunakan panah <span className="text-slate-900 font-bold">◄ ►</span> untuk beralih
          </p>
        </div>

      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
