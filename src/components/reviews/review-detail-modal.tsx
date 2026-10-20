'use client'

import { useEffect, useState, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, Star, User, Play } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  MediaLightboxModal,
  MediaItem,
} from '@/components/gadget/media-lightbox-modal'

export interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  images?: string[]
  videos?: string[]
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

interface ReviewDetailModalProps {
  reviews: ReviewItem[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onIndexChange: (index: number) => void
}

export default function ReviewDetailModal({
  reviews,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
}: ReviewDetailModalProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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
  }, [isOpen, currentIndex, reviews.length])

  const activeReview = reviews[currentIndex] || reviews[0]

  const mediaList = useMemo<MediaItem[]>(() => {
    if (!activeReview) return []
    const list: MediaItem[] = []
    activeReview.images?.forEach((url) => {
      list.push({
        url,
        type: 'image',
        authorName: activeReview.user.name || 'Pelanggan',
        rating: activeReview.rating,
      })
    })
    activeReview.videos?.forEach((url) => {
      list.push({
        url,
        type: 'video',
        authorName: activeReview.user.name || 'Pelanggan',
        rating: activeReview.rating,
      })
    })
    return list
  }, [activeReview])

  if (!isOpen || reviews.length === 0) return null

  const handlePrevious = () => {
    setLightboxIndex(null)
    onIndexChange(currentIndex === 0 ? reviews.length - 1 : currentIndex - 1)
  }

  const handleNext = () => {
    setLightboxIndex(null)
    onIndexChange(currentIndex === reviews.length - 1 ? 0 : currentIndex + 1)
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detail Ulasan Pelanggan"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all"
        onClick={onClose}
      >
        <div
          className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:p-7"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header: Counter & Close Button */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              <span>Ulasan Pelanggan</span>
              <span className="font-bold text-blue-600 dark:text-sky-400">
                {currentIndex + 1} / {reviews.length}
              </span>
            </div>

            <button
              onClick={onClose}
              aria-label="Tutup modal ulasan"
              className="cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body: Review Details */}
          <div className="py-5">
            {/* User Info */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
                {activeReview.user.image ? (
                  <img
                    src={activeReview.user.image}
                    alt={activeReview.user.name || 'User'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-neutral-500" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="truncate text-base font-bold text-neutral-900 dark:text-white">
                  {activeReview.user.name || 'Pelanggan Terverifikasi'}
                </h4>
                <p className="text-xs text-neutral-500">
                  {formatDistanceToNow(new Date(activeReview.createdAt), {
                    addSuffix: true,
                    locale: id,
                  })}
                </p>
              </div>

              {/* Rating Number Pill */}
              <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{activeReview.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Star Rating Icons */}
            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= activeReview.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-200 dark:text-neutral-700'
                  }`}
                />
              ))}
            </div>

            {/* Comment Content */}
            <div className="mt-4 max-h-[30vh] overflow-y-auto rounded-2xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-200">
              {activeReview.comment ? (
                <p className="whitespace-pre-wrap">{activeReview.comment}</p>
              ) : (
                <p className="italic text-neutral-400">
                  (Pengguna tidak menyertakan pesan teks ulasan)
                </p>
              )}
            </div>

            {/* Media Gallery in Detail Modal */}
            {((activeReview.images && activeReview.images.length > 0) ||
              (activeReview.videos && activeReview.videos.length > 0)) && (
              <div className="mt-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Foto & Video Ulasan ({activeReview.images?.length || 0} Foto,{' '}
                  {activeReview.videos?.length || 0} Video)
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {activeReview.images?.map((url, i) => (
                    <button
                      key={`modal-img-${i}`}
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 transition hover:opacity-90 dark:border-neutral-800 dark:bg-neutral-800"
                    >
                      <Image
                        src={url}
                        alt="Foto ulasan"
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                  {activeReview.videos?.map((url, i) => {
                    const mediaIdx = (activeReview.images?.length || 0) + i
                    return (
                      <button
                        key={`modal-vid-${i}`}
                        type="button"
                        onClick={() => setLightboxIndex(mediaIdx)}
                        className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-orange-300 bg-slate-950 dark:border-orange-800"
                      >
                        <video
                          src={url}
                          className="h-full w-full object-cover opacity-60"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-orange-500/90 p-2 text-white shadow-md">
                            <Play className="h-3.5 w-3.5 fill-white" />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation Buttons: Back and Next */}
          <div className="flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
            <button
              onClick={handlePrevious}
              disabled={reviews.length <= 1}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={handleNext}
              disabled={reviews.length <= 1}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox from Detail Modal */}
      {lightboxIndex !== null && mediaList.length > 0 && (
        <MediaLightboxModal
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          mediaList={mediaList}
          initialIndex={lightboxIndex}
        />
      )}
    </>
  )
}
