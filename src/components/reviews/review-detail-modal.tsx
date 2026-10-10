'use client'

import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Star, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

export interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  createdAt: string
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

  if (!isOpen || reviews.length === 0) return null

  const activeReview = reviews[currentIndex] || reviews[0]

  const handlePrevious = () => {
    onIndexChange(currentIndex === 0 ? reviews.length - 1 : currentIndex - 1)
  }

  const handleNext = () => {
    onIndexChange(currentIndex === reviews.length - 1 ? 0 : currentIndex + 1)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detail Ulasan Pelanggan"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:p-7"
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
            className="rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white"
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
          <div className="mt-4 max-h-[40vh] overflow-y-auto rounded-2xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-200">
            {activeReview.comment ? (
              <p className="whitespace-pre-wrap">{activeReview.comment}</p>
            ) : (
              <p className="italic text-neutral-400">
                (Pengguna tidak menyertakan pesan teks ulasan)
              </p>
            )}
          </div>
        </div>

        {/* Footer Navigation Buttons: Back and Next */}
        <div className="flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <button
            onClick={handlePrevious}
            disabled={reviews.length <= 1}
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Sebelumnya</span>
          </button>

          <span className="text-xs font-medium text-neutral-400">
            {currentIndex + 1} dari {reviews.length}
          </span>

          <button
            onClick={handleNext}
            disabled={reviews.length <= 1}
            className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
