'use client'

import { useEffect, useState } from 'react'
import ReviewCard from './review-card'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

import ReviewDetailModal from './review-detail-modal'

interface Review {
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

interface ReviewListProps {
  mitraId: string
  refreshTrigger?: number
  currentUserId?: string
  maxDisplay?: number
  compact?: boolean
  onEditReview?: (review: {
    id: string
    rating: number
    comment: string | null
  }) => void
}

export default function ReviewList({
  mitraId,
  refreshTrigger,
  currentUserId,
  maxDisplay = 5,
  compact = true,
  onEditReview,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReviewIndex, setSelectedReviewIndex] = useState(0)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mitraId, refreshTrigger])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/reviews?mitraId=${mitraId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews')
      }

      setReviews(data.reviews)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = (index: number) => {
    setSelectedReviewIndex(index)
    setIsDetailModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-sky-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-5 text-center dark:bg-red-950/30">
        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
          Gagal memuat ulasan: {error}
        </p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl bg-neutral-50 p-8 text-center dark:bg-neutral-900/60">
        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
          Belum ada review untuk mitra ini.
        </p>
        <p className="mt-1 text-[11px] text-neutral-400">
          Jadilah yang pertama memberikan review!
        </p>
      </div>
    )
  }

  // Tampilkan maksimal 5 ulasan di layar
  const displayedReviews = reviews.slice(0, maxDisplay)

  return (
    <div className="space-y-3">
      {/* Reviews List (Compact & Clickable) */}
      <div className="space-y-2.5">
        {displayedReviews.map((review, index) => (
          <ReviewCard
            key={review.id}
            review={review}
            currentUserId={currentUserId}
            compact={compact}
            onClick={() => handleOpenDetail(index)}
            onEdit={onEditReview}
            onDelete={fetchReviews}
          />
        ))}
      </div>

      {/* Button to view all reviews if more than 5 exist */}
      {reviews.length > maxDisplay && (
        <div className="pt-2 text-center">
          <button
            onClick={() => handleOpenDetail(0)}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-bold text-neutral-800 transition hover:border-black hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          >
            <span>Lihat Semua {reviews.length} Ulasan</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Modal with Back and Next buttons for reading all reviews */}
      <ReviewDetailModal
        reviews={reviews}
        currentIndex={selectedReviewIndex}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onIndexChange={setSelectedReviewIndex}
      />
    </div>
  )
}
