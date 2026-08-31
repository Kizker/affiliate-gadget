'use client'

import { useState, useEffect } from 'react'
import { X, Star, Sparkles, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  existingRating?: number
  existingComment?: string
  onSuccess: () => void
}

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Sangat Kecewa', color: 'text-rose-600 dark:text-rose-400' },
  2: { text: 'Kurang Puas', color: 'text-amber-600 dark:text-amber-400' },
  3: { text: 'Cukup Baik', color: 'text-blue-600 dark:text-blue-400' },
  4: { text: 'Sangat Puas', color: 'text-emerald-600 dark:text-emerald-400' },
  5: { text: 'Luar Biasa / Sempurna', color: 'text-amber-500 dark:text-amber-400' },
}

const QUICK_TAGS = [
  '⚡ Pengiriman Cepat',
  '📦 Packing Aman & Asuransi',
  '📱 Unit 100% Original',
  '🎁 Bonus 3-in-1 Lengkap',
  '💬 Respon Toko Ramah',
]

export function RatingModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  existingRating,
  existingComment,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState(existingRating || 5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState(existingComment || '')
  const [submitting, setSubmitting] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(existingRating || 5)
      setComment(existingComment || '')
      setHoveredRating(0)
    }
  }, [isOpen, orderId, existingRating, existingComment])

  if (!isOpen) return null

  const activeRating = hoveredRating || rating
  const currentFeedback = RATING_LABELS[activeRating] || RATING_LABELS[5]

  const handleAddTag = (tag: string) => {
    if (comment.includes(tag)) {
      setComment((prev) => prev.replace(tag, '').replace(/,\s*,/g, ',').trim())
    } else {
      setComment((prev) => (prev ? `${prev}, ${tag}` : tag))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Silakan pilih bintang rating terlebih dahulu')
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
        toast.success('Ulasan dan rating berhasil disimpan!')
        onSuccess()
        onClose()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal menyimpan ulasan')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error('Terjadi kesalahan sistem saat menyimpan rating')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
      {/* Modal Surface */}
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xl duration-200 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                {existingRating ? 'Edit Ulasan Gadget' : 'Beri Ulasan Gadget'}
              </h2>
              <span className="rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                Terverifikasi
              </span>
            </div>
            <p className="font-mono text-xs text-slate-500 mt-0.5">
              Pesanan #{orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          
          {/* Interactive Star Rating Center */}
          <div className="flex flex-col items-center justify-center py-2 text-center">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-all duration-150 hover:scale-120 active:scale-95 cursor-pointer"
                  title={`${star} Bintang`}
                >
                  <Star
                    className={`h-8 w-8 sm:h-9 sm:w-9 transition-colors ${
                      star <= activeRating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                        : 'text-slate-200 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Dynamic Emotion Label */}
            <span className={`text-xs font-bold transition-all ${currentFeedback.color}`}>
              {activeRating} dari 5 Bintang • {currentFeedback.text}
            </span>
          </div>

          {/* Quick Tag Recommendations */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Poin Kepuasan Cepat (Opsional):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => {
                const isSelected = comment.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Catatan Pengalaman (Opsional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-slate-400 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:text-white transition leading-relaxed"
              placeholder="Ceritakan kepuasan Anda mengenai kondisi fisik unit gadget, kelengkapan bonus 3-in-1, atau kecepatan pengiriman..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-white px-6 py-2.5 text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Ulasan</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
