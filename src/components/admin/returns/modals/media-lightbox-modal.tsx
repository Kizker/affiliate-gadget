'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { RotateCcw, ChevronLeft, ChevronRight, Play } from 'lucide-react'

interface MediaLightboxModalProps {
  isOpen: boolean
  images: string[]
  activeIndex: number
  onIndexChange: (updater: number | ((prev: number) => number)) => void
  onClose: () => void
  meta?: { title?: string; subtitle?: string } | null
}

export function MediaLightboxModal({
  isOpen,
  images,
  activeIndex,
  onIndexChange,
  onClose,
  meta,
}: MediaLightboxModalProps) {
  if (!isOpen || typeof document === 'undefined') return null

  const isVideo = (url: string) => /\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(url)

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/45 backdrop-blur-xl duration-300 animate-in fade-in"
      onClick={onClose}
    >
      {/* Top Bar: Monogram & Meta */}
      <div
        className="absolute left-1/2 top-6 z-20 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 shadow-lg backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
          <RotateCcw className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <span>{meta?.title || 'Bukti Unboxing'}</span>
          {meta?.subtitle && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{meta.subtitle}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Stage */}
      <div
        className="relative mx-6 flex max-h-[75vh] w-full max-w-4xl items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo(images[activeIndex]) ? (
          <video
            src={images[activeIndex]}
            controls
            autoPlay
            className="max-h-[72vh] max-w-full rounded-3xl border border-white/60 bg-black shadow-2xl"
          />
        ) : (
          <img
            src={images[activeIndex]}
            alt="Bukti Unboxing"
            className="max-h-[72vh] max-w-full rounded-3xl border border-white/60 bg-white object-contain shadow-2xl"
          />
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                onIndexChange((prev) =>
                  prev > 0 ? prev - 1 : images.length - 1
                )
              }
              className="absolute -left-14 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/80 text-white shadow-xl transition hover:bg-black active:scale-90"
              title="Sebelumnya (Panah Kiri)"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() =>
                onIndexChange((prev) =>
                  prev < images.length - 1 ? prev + 1 : 0
                )
              }
              className="absolute -right-14 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/80 text-white shadow-xl transition hover:bg-black active:scale-90"
              title="Berikutnya (Panah Kanan)"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Filmstrip Thumbnail */}
      {images.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-xl backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              className={`relative h-12 w-12 cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                activeIndex === i
                  ? 'scale-105 border-orange-500 shadow-md'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {isVideo(img) ? (
                <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                  <Play className="h-4 w-4 text-orange-400" />
                </div>
              ) : (
                <img
                  src={img}
                  alt="Thumbnail"
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  )
}
