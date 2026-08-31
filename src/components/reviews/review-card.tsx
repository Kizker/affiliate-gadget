'use client'

import { Star, User, Edit2, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { useState } from 'react'
import { toast } from 'sonner'

interface ReviewCardProps {
  review: {
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
  currentUserId?: string
  onEdit?: (review: {
    id: string
    rating: number
    comment: string | null
  }) => void
  onDelete?: () => void
}

export default function ReviewCard({
  review,
  currentUserId,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const [deleting, setDeleting] = useState(false)
  const isOwnReview = currentUserId === review.user.id

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus review ini?')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/reviews?reviewId=${review.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review')
      }

      toast.success('Review berhasil dihapus')
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((error as any).message || 'Gagal menghapus review')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* User Info */}
      <div className="mb-4 flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          {review.user.image ? (
            <img
              src={review.user.image}
              alt={review.user.name || 'User'}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <User className="h-6 w-6" />
          )}
        </div>

        <div className="flex-1">
          {/* Name and Timestamp */}
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              {review.user.name || 'Anonymous'}
            </h4>
            <span className="ml-auto text-right text-sm text-gray-500">
              {formatDistanceToNow(new Date(review.createdAt), {
                addSuffix: true,
                locale: id,
              })}
            </span>
          </div>

          {/* Rating Stars and Edit/Delete Buttons */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Edit/Delete Buttons - Icon only */}
            {isOwnReview && (
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() =>
                    onEdit?.({
                      id: review.id,
                      rating: review.rating,
                      comment: review.comment,
                    })
                  }
                  className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50"
                  aria-label="Edit review"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  aria-label="Hapus review"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="leading-relaxed text-gray-700">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  )
}
