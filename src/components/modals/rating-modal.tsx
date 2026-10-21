'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  Star,
  Sparkles,
  Check,
  Loader2,
  Image as ImageIcon,
  Video,
  Trash2,
  Play,
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  existingRating?: number
  existingComment?: string
  existingImages?: string[]
  existingVideos?: string[]
  onSuccess: (updatedReview?: {
    rating: number
    comment: string | null
    images?: string[]
    videos?: string[]
  }) => void
}

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Sangat Kecewa', color: 'text-rose-600 dark:text-rose-400' },
  2: { text: 'Kurang Puas', color: 'text-amber-600 dark:text-amber-400' },
  3: { text: 'Cukup Baik', color: 'text-blue-600 dark:text-blue-400' },
  4: { text: 'Sangat Puas', color: 'text-emerald-600 dark:text-emerald-400' },
  5: {
    text: 'Luar Biasa / Sempurna',
    color: 'text-amber-500 dark:text-amber-400',
  },
}

const QUICK_TAGS = [
  'Pengiriman Cepat',
  'Packing Aman',
  'Unit 100% Original',
  'Respon Ramah',
]

export function RatingModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  existingRating,
  existingComment,
  existingImages,
  existingVideos,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState(existingRating || 5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState(existingComment || '')
  const [images, setImages] = useState<string[]>(existingImages || [])
  const [videos, setVideos] = useState<string[]>(existingVideos || [])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(
    Boolean(existingRating && existingRating > 0)
  )

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state or fetch existing review when modal opens
  useEffect(() => {
    if (!isOpen) return

    if (
      existingRating !== undefined &&
      existingRating !== null &&
      existingRating > 0
    ) {
      setRating(existingRating)
      setComment(existingComment || '')
      setImages(existingImages || [])
      setVideos(existingVideos || [])
      setIsEditing(true)
      setHoveredRating(0)
    } else if (orderId) {
      // Fallback: Fetch existing review for this order from server
      fetch(`/api/orders/${orderId}/review`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.review) {
            setRating(data.review.rating || 5)
            setComment(data.review.comment || '')
            setImages(data.review.images || [])
            setVideos(data.review.videos || [])
            setIsEditing(true)
          } else {
            setRating(5)
            setComment('')
            setImages([])
            setVideos([])
            setIsEditing(false)
          }
        })
        .catch(() => {
          setRating(5)
          setComment('')
          setImages([])
          setVideos([])
          setIsEditing(false)
        })
        .finally(() => {
          setHoveredRating(0)
        })
    } else {
      setRating(5)
      setComment('')
      setImages([])
      setVideos([])
      setIsEditing(false)
      setHoveredRating(0)
    }
  }, [
    isOpen,
    orderId,
    existingRating,
    existingComment,
    existingImages,
    existingVideos,
  ])

  if (!isOpen) return null

  const activeRating = hoveredRating || rating
  const currentFeedback = RATING_LABELS[activeRating] || RATING_LABELS[5]

  const handleAddTag = (tag: string) => {
    if (comment.includes(tag)) {
      setComment((prev) =>
        prev
          .replace(tag, '')
          .replace(/,\s*,/g, ',')
          .replace(/^,\s*/, '')
          .replace(/,\s*$/, '')
          .trim()
      )
    } else {
      setComment((prev) => (prev ? `${prev}, ${tag}` : tag))
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const isVideo = file.type.startsWith('video/')
        const isImage = file.type.startsWith('image/')

        if (!isImage && !isVideo) {
          toast.error(
            `File "${file.name}" tidak didukung. Unggah foto atau video saja.`
          )
          continue
        }

        if (isVideo && videos.length >= 2) {
          toast.error(
            'Maksimal 2 video unboxing/ulasan yang dapat dilampirkan.'
          )
          continue
        }

        if (isImage && images.length >= 5) {
          toast.error('Maksimal 5 foto produk yang dapat dilampirkan.')
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'reviews')

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()
        if (res.ok && data.success) {
          if (isVideo) {
            setVideos((prev) => [...prev, data.url])
            toast.success(`Video "${file.name}" berhasil diunggah!`)
          } else {
            setImages((prev) => [...prev, data.url])
            toast.success(`Foto "${file.name}" berhasil diunggah!`)
          }
        } else {
          toast.error(data.error || `Gagal mengunggah file ${file.name}`)
        }
      }
    } catch (error) {
      console.error('Error uploading review media:', error)
      toast.error('Terjadi kesalahan saat mengunggah lampiran media')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index))
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
        body: JSON.stringify({ rating, comment, images, videos }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(
          isEditing
            ? 'Ulasan Anda berhasil diperbarui!'
            : 'Ulasan dan rating berhasil disimpan!'
        )
        onSuccess(data?.review || { rating, comment, images, videos })
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
    <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/50 p-3 sm:p-4">
      {/* Modal Surface */}
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xl duration-200 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">
                {isEditing ? 'Ubah Ulasan Gadget' : 'Beri Ulasan Gadget'}
              </h2>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                Terverifikasi
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-slate-500">
              Pesanan #{orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Interactive Star Rating Center */}
          <div className="flex flex-col items-center justify-center py-2 text-center">
            <div className="mb-2 flex items-center gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="hover:scale-120 cursor-pointer p-1 transition-all duration-150 active:scale-95"
                  title={`${star} Bintang`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors sm:h-9 sm:w-9 ${
                      star <= activeRating
                        ? 'drop-shadow-xs fill-amber-400 text-amber-400'
                        : 'text-slate-200 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Dynamic Emotion Label */}
            <span
              className={`text-xs font-bold transition-all ${currentFeedback.color}`}
            >
              {activeRating} dari 5 Bintang • {currentFeedback.text}
            </span>
          </div>

          {/* Quick Tag Recommendations: 2 Baris 2 Kolom Tanpa Emot */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Poin Kepuasan Cepat (Opsional):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_TAGS.map((tag) => {
                const isSelected = comment.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className={`cursor-pointer whitespace-nowrap rounded-xl border px-2 py-2 text-center text-[11px] font-semibold transition sm:text-xs ${
                      isSelected
                        ? 'shadow-xs border-orange-500 bg-orange-50/80 font-bold text-orange-600 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-400'
                        : 'border-slate-200/70 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
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
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan Pengalaman (Opsional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
              placeholder="Ceritakan kepuasan Anda mengenai kondisi fisik unit gadget, kelengkapan bonus 3-in-1, atau kecepatan pengiriman..."
            />
          </div>

          {/* Photo & Video Attachment Section */}
          <div className="space-y-3">
            <div className="flex items-center">
              <label className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Lampirkan Foto & Video Unit</span>
                <span className="text-[11px] font-normal text-slate-400">
                  ({images.length}/5 foto, {videos.length}/2 video)
                </span>
              </label>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload Zone / Media Previews Grid */}
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {/* Existing Images Preview */}
              {images.map((url, idx) => (
                <div
                  key={`img-${idx}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
                >
                  <Image
                    src={url}
                    alt="Lampiran Foto"
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  <div className="absolute left-1 top-1 flex items-center gap-1 rounded-md bg-slate-950/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    <ImageIcon className="h-2.5 w-2.5" />
                    <span>Foto</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute right-1 top-1 rounded-full bg-rose-600 p-1 text-white opacity-90 shadow-sm transition hover:opacity-100"
                    title="Hapus foto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Existing Videos Preview */}
              {videos.map((url, idx) => (
                <div
                  key={`vid-${idx}`}
                  className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-orange-200 bg-slate-950 dark:border-orange-800"
                >
                  <video
                    src={url}
                    className="h-full w-full object-cover opacity-70"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-orange-500/90 p-2 text-white shadow-lg">
                      <Play className="h-4 w-4 fill-white" />
                    </div>
                  </div>
                  <div className="absolute left-1 top-1 flex items-center gap-1 rounded-md bg-orange-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    <Video className="h-2.5 w-2.5" />
                    <span>Video</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(idx)}
                    className="absolute right-1 top-1 rounded-full bg-rose-600 p-1 text-white opacity-90 shadow-sm transition hover:opacity-100"
                    title="Hapus video"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Add Media Placeholder Trigger */}
              {(images.length < 5 || videos.length < 2) && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-2 text-slate-400 transition hover:border-orange-500 hover:bg-orange-50/30 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-orange-500"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-1 text-[10px] font-bold text-orange-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Mengunggah...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        <Video className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold leading-tight">
                        + Foto / Video
                      </span>
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || uploading || rating === 0}
              className="shadow-xs inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEditing ? 'Memperbarui...' : 'Menyimpan...'}</span>
                </>
              ) : (
                <span>{isEditing ? 'Perbarui Ulasan' : 'Simpan Ulasan'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
