'use client'

import { useEffect, useState } from 'react'
import ReviewCard from './review-card'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

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
  onEditReview?: (review: {
    id: string
    rating: number
    comment: string | null
  }) => void
}

const REVIEWS_PER_PAGE = 10

export default function ReviewList({
  mitraId,
  refreshTrigger,
  currentUserId,
  onEditReview,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

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
      setCurrentPage(1) // Reset to first page on new fetch
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setError((error as any).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center">
        <p className="text-red-600">Gagal memuat reviews: {error}</p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-12 text-center">
        <p className="text-gray-600">Belum ada review untuk mitra ini.</p>
        <p className="mt-2 text-sm text-gray-500">
          Jadilah yang pertama memberikan review!
        </p>
      </div>
    )
  }

  // Pagination calculations
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE)
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE
  const endIndex = startIndex + REVIEWS_PER_PAGE
  const currentReviews = reviews.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-6">
      {/* Reviews List */}
      <div className="space-y-4">
        {currentReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            currentUserId={currentUserId}
            onEdit={onEditReview}
            onDelete={fetchReviews}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page Info */}
      {totalPages > 1 && (
        <p className="text-center text-sm text-gray-500">
          Showing {startIndex + 1}-{Math.min(endIndex, reviews.length)} of{' '}
          {reviews.length} reviews
        </p>
      )}
    </div>
  )
}
