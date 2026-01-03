'use client'

import { useState, useEffect } from 'react'
import { Star, X } from 'lucide-react'
import { toast } from 'sonner'

interface ReviewModalProps {
  mitraId: string
  existingReview?: {
    id: string
    rating: number
    comment: string | null
  } | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ReviewModal({
  mitraId,
  existingReview,
  isOpen,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [loading, setLoading] = useState(false)

  // Sync state when existingReview changes
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating)
      setComment(existingReview.comment || '')
    } else {
      setRating(0)
      setComment('')
    }
  }, [existingReview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Silakan pilih rating bintang')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mitraId,
          rating,
          comment: comment.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      toast.success(
        existingReview
          ? 'Review berhasil diperbarui!'
          : 'Review berhasil dikirim!'
      )
      onClose()

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((error as any).message || 'Gagal mengirim review')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h3 className="mb-6 text-2xl font-bold text-gray-900">
          {existingReview ? 'Edit Review Anda' : 'Berikan Review Anda'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label
              htmlFor="comment"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Komentar (Opsional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Bagikan pengalaman Anda dengan mitra ini..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {comment.length}/500 karakter
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Mengirim...'
              : existingReview
                ? 'Perbarui Review'
                : 'Kirim Review'}
          </button>
        </form>
      </div>
    </div>
  )
}
