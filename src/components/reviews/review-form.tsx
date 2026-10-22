'use client'

import { useState, useRef } from 'react'
import {
  Star,
  Image as ImageIcon,
  Video,
  Trash2,
  Play,
  Loader2,
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { processMediaUploadFile } from '@/lib/media-upload-client'

interface ReviewFormProps {
  mitraId: string
  onSuccess?: () => void
}

export default function ReviewForm({ mitraId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const isVideo =
          file.type.startsWith('video/') ||
          file.name.toLowerCase().endsWith('.mp4')
        const isImage = !isVideo

        if (isVideo && videos.length >= 2) {
          toast.error('Maksimal 2 video yang dapat dilampirkan.')
          continue
        }

        if (isImage && images.length >= 5) {
          toast.error('Maksimal 5 foto yang dapat dilampirkan.')
          continue
        }

        // Validasi dan kompresi otomatis jika melebihi batas ukuran
        let fileToUpload = file
        try {
          fileToUpload = await processMediaUploadFile(file)
          if (isImage && file.size > 2 * 1024 * 1024) {
            toast.info(
              `Foto "${file.name}" otomatis dikompres ke ukuran optimal (< 2 MB).`
            )
          }
        } catch (validationErr: any) {
          toast.error(
            validationErr.message || `File "${file.name}" tidak valid`
          )
          continue
        }

        const formData = new FormData()
        formData.append('file', fileToUpload)
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

      toast.success('Review berhasil dikirim!')
      setRating(0)
      setComment('')
      setImages([])
      setVideos([])

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star Rating */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
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
          Komentar (Opsional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Bagikan pengalaman Anda dengan mitra ini..."
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs font-medium leading-relaxed text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
        />
        <p className="mt-1 text-right text-[11px] text-slate-400">
          {comment.length}/500 karakter
        </p>
      </div>

      {/* Photo & Video Attachment Section */}
      <div className="space-y-2">
        <div className="flex flex-col gap-0.5">
          <label className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Lampirkan Foto & Video Servis</span>
            <span className="text-[11px] font-normal text-slate-400">
              ({images.length}/5 foto, {videos.length}/2 video)
            </span>
          </label>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Foto: JPG/PNG maks 2 MB (otomatis kompres) • Video: MP4 maks 30 MB
            (10–60 dtk, maks 1280x1280px)
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,video/mp4"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Upload Zone / Media Previews Grid */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {/* Existing Images Preview */}
          {images.map((url, idx) => (
            <div
              key={`img-${idx}`}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
            >
              <Image
                src={url}
                alt="Lampiran Foto"
                fill
                sizes="100px"
                className="object-cover"
              />
              <div className="absolute left-1 top-1 flex items-center gap-1 rounded-md bg-slate-950/60 px-1 py-0.5 text-[8px] font-bold text-white">
                <ImageIcon className="h-2 w-2" />
                <span>Foto</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute right-1 top-1 cursor-pointer rounded-full bg-rose-600 p-1 text-white opacity-90 shadow-sm transition hover:opacity-100"
                title="Hapus foto"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}

          {/* Existing Videos Preview */}
          {videos.map((url, idx) => (
            <div
              key={`vid-${idx}`}
              className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-orange-200 bg-slate-950 dark:border-orange-800"
            >
              <video
                src={url}
                className="h-full w-full object-cover opacity-70"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-orange-500/90 p-1.5 text-white shadow-lg">
                  <Play className="h-3 w-3 fill-white" />
                </div>
              </div>
              <div className="absolute left-1 top-1 flex items-center gap-1 rounded-md bg-orange-600 px-1 py-0.5 text-[8px] font-bold text-white">
                <Video className="h-2 w-2" />
                <span>Video</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveVideo(idx)}
                className="absolute right-1 top-1 cursor-pointer rounded-full bg-rose-600 p-1 text-white opacity-90 shadow-sm transition hover:opacity-100"
                title="Hapus video"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}

          {/* Add Media Placeholder Trigger */}
          {(images.length < 5 || videos.length < 2) && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-2 text-slate-400 transition hover:border-orange-500 hover:bg-orange-50/30 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-orange-500"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-1 text-[10px] font-bold text-orange-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Unggah...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <Video className="h-3.5 w-3.5" />
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || uploading || rating === 0}
        className="w-full cursor-pointer rounded-full bg-slate-950 py-3 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
      >
        {loading ? 'Mengirim...' : 'Kirim Review'}
      </button>
    </form>
  )
}
