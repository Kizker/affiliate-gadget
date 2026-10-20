'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Star,
  X,
  Image as ImageIcon,
  Video,
  Trash2,
  Play,
  Loader2,
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface ReviewModalProps {
  mitraId: string
  existingReview?: {
    id: string
    rating: number
    comment: string | null
    images?: string[]
    videos?: string[]
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
  const [images, setImages] = useState<string[]>(existingReview?.images || [])
  const [videos, setVideos] = useState<string[]>(existingReview?.videos || [])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync state when existingReview changes
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating)
      setComment(existingReview.comment || '')
      setImages(existingReview.images || [])
      setVideos(existingReview.videos || [])
    } else {
      setRating(0)
      setComment('')
      setImages([])
      setVideos([])
    }
  }, [existingReview, isOpen])

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
          toast.error('Maksimal 2 video yang dapat dilampirkan.')
          continue
        }

        if (isImage && images.length >= 5) {
          toast.error('Maksimal 5 foto yang dapat dilampirkan.')
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
          images,
          videos,
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
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 cursor-pointer rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h3 className="mb-6 text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
          {existingReview ? 'Edit Review Servis' : 'Berikan Review Servis'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Rating Kepuasan
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'drop-shadow-xs fill-amber-400 text-amber-400'
                        : 'text-slate-200 dark:text-slate-700'
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
              className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Komentar & Pengalaman Servis (Opsional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Bagikan pengalaman hasil servis gadget, kecepatan pengerjaan, atau keramahan teknisi mitra ini..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs font-medium leading-relaxed text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
            />
            <p className="mt-1 text-right text-[11px] text-slate-400">
              {comment.length}/500 karakter
            </p>
          </div>

          {/* Photo & Video Attachment Section */}
          <div className="space-y-3">
            <div className="flex items-center">
              <label className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Lampirkan Foto & Video Servis</span>
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
                    alt="Lampiran Foto Servis"
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
                    className="absolute right-1 top-1 cursor-pointer rounded-full bg-rose-600 p-1 text-white opacity-90 shadow-sm transition hover:opacity-100"
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
                    className="absolute right-1 top-1 cursor-pointer rounded-full bg-rose-600 p-1 text-white opacity-90 shadow-sm transition hover:opacity-100"
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
              disabled={loading || uploading || rating === 0}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : existingReview ? (
                'Perbarui Review'
              ) : (
                'Kirim Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
