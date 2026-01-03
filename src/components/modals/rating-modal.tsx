'use client'

import { useState, useEffect } from 'react'
import { X, Star } from 'lucide-react'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  existingRating?: number
  existingComment?: string
  onSuccess: () => void
}

export function RatingModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  existingRating,
  existingComment,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState(existingRating || 0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState(existingComment || '')
  const [submitting, setSubmitting] = useState(false)

  // Reset state when modal opens with new order or existing values change
  useEffect(() => {
    if (isOpen) {
      setRating(existingRating || 0)
      setComment(existingComment || '')
      setHoveredRating(0)
    }
  }, [isOpen, orderId, existingRating, existingComment])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      alert('Pilih rating terlebih dahulu')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      })

      if (res.ok) {
        onSuccess()
        onClose()
      } else {
        const error = await res.json()
        alert(error.error || 'Gagal memberikan rating')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {existingRating ? 'Edit Rating' : 'Beri Rating'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Pesanan: <span className="font-semibold">{orderNumber}</span>
        </p>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-6">
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
                    className={`h-10 w-10 ${
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
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Komentar (Opsional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Bagikan pengalaman Anda..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              {submitting ? 'Menyimpan...' : 'Kirim Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
