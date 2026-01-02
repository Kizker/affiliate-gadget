'use client'

import { useEffect, useState } from 'react'
import ReviewCard from './review-card'
import { Loader2 } from 'lucide-react'

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

export default function ReviewList({
  mitraId,
  refreshTrigger,
  currentUserId,
  onEditReview,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          currentUserId={currentUserId}
          onEdit={onEditReview}
          onDelete={fetchReviews}
        />
      ))}
    </div>
  )
}
