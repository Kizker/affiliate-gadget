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
  UploadCloud,
  Trash2,
  Play,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface ProductReviewModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  variantName?: string | null
  orderId?: string | null
  existingReview?: {
    id: string
    rating: number
    comment: string | null
    images?: string[]
    videos?: string[]
    variantName?: string | null
  } | null
  onSuccess: () => void
}

const RATING_FEEDBACK: Record<number, { text: string; color: string; desc: string }> = {
  1: {
    text: 'Sangat Kecewa',
    color: 'text-rose-600 dark:text-rose-400',
    desc: 'Unit tidak sesuai harapan atau mengalami kendala fisik.',
  },
  2: {
    text: 'Kurang Puas',
    color: 'text-amber-600 dark:text-amber-400',
    desc: 'Pengalaman kurang memuaskan, unit perlu perbaikan.',
  },
  3: {
    text: 'Cukup Baik',
    color: 'text-blue-600 dark:text-blue-400',
    desc: 'Unit berfungsi standar dan sesuai ekspektasi dasar.',
  },
  4: {
    text: 'Sangat Puas',
    color: 'text-emerald-600 dark:text-emerald-400',
    desc: 'Kondisi unit mulus, performa bagus, bonus lengkap.',
  },
  5: {
    text: 'Luar Biasa / Sempurna',
    color: 'text-amber-500 dark:text-amber-400',
    desc: 'Unit 100% original istimewa, pengiriman super cepat & bergaransi toko!',
  },
}

const QUICK_TAGS = [
  '⚡ Pengiriman Kilat',
  '📦 Packing Kayu & Bubble Tebal',
  '📱 Unit 100% Original Segel',
  '🎁 Bonus 3-in-1 Lengkap',
  '🔋 Baterai Health 100%',
  '🛡️ Garansi Toko 30 Hari Aktif',
  '💬 Respon CS Sangat Ramah',
]

export function ProductReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  variantName,
  orderId,
  existingReview,
  onSuccess,
}: ProductReviewModalProps) {
  const [rating, setRating] = useState(existingReview?.rating || 5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [images, setImages] = useState<string[]>(existingReview?.images || [])
  const [videos, setVideos] = useState<string[]>(existingReview?.videos || [])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setRating(existingReview?.rating || 5)
      setComment(existingReview?.comment || '')
      setImages(existingReview?.images || [])
      setVideos(existingReview?.videos || [])
      setHoveredRating(0)
    }
  }, [isOpen, existingReview])

  if (!isOpen) return null

  const activeRating = hoveredRating || rating
  const currentFeedback = RATING_FEEDBACK[activeRating] || RATING_FEEDBACK[5]

  const handleToggleTag = (tag: string) => {
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

    // Limit check (max 5 images, max 2 videos)
    if (images.length + files.length > 5) {
      // allow remaining slots
    }

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const isVideo = file.type.startsWith('video/')
        const isImage = file.type.startsWith('image/')

        if (!isImage && !isVideo) {
          toast.error(`File "${file.name}" tidak didukung. Unggah foto atau video saja.`)
          continue
        }

        if (isVideo && videos.length >= 2) {
          toast.error('Maksimal 2 video unboxing/ulasan yang dapat dilampirkan.')
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
      toast.error('Silakan tentukan rating bintang terlebih dahulu')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/gadgets/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment,
          images,
          videos,
          variantName: variantName || existingReview?.variantName || null,
          orderId: orderId || null,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(data.message || 'Ulasan berhasil disimpan!')
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Gagal menyimpan ulasan')
      }
    } catch (error) {
      console.error('Error submitting product review:', error)
      toast.error('Terjadi kesalahan sistem saat menyimpan ulasan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xl duration-200 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white tracking-tight">
                {existingReview ? 'Perbarui Ulasan Gadget' : 'Tulis Ulasan & Komentar Pembeli'}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span>Terverifikasi</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 truncate max-w-sm">
              {productName} {variantName ? `(${variantName})` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          
          {/* Star Rating Selector */}
          <div className="flex flex-col items-center justify-center py-2 text-center rounded-2xl bg-slate-50/70 border border-slate-100 p-4 dark:bg-slate-800/40 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Beri Penilaian Unit Gadget
            </span>

            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-all duration-150 hover:scale-125 active:scale-95 cursor-pointer"
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

            <div className="space-y-0.5">
              <span className={`text-xs font-bold transition-all ${currentFeedback.color}`}>
                {activeRating} dari 5 Bintang • {currentFeedback.text}
              </span>
              <p className="text-[11px] text-slate-400">{currentFeedback.desc}</p>
            </div>
          </div>

          {/* Quick Satisfaction Tags */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Poin Kepuasan Produk (Pilih Cepat):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => {
                const isSelected = comment.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Detailed Comment Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ulasan & Pengalaman Pemakaian
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-xs font-medium text-slate-900 outline-none focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:text-white transition leading-relaxed"
              placeholder="Ceritakan kepuasan Anda mengenai kondisi fisik unit, layar, kamera, kelengkapan bonus 3-in-1 (charger, case, antigores), kecepatan kurir JNE/Gojek, dan respon toko..."
            />
          </div>

          {/* Photo & Video Attachment Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Lampirkan Foto & Video Unit</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  ({images.length}/5 foto, {videos.length}/2 video)
                </span>
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || (images.length >= 5 && videos.length >= 2)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>+ Unggah Media</span>
              </button>
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
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              
              {/* Existing Images Preview */}
              {images.map((url, idx) => (
                <div
                  key={`img-${idx}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
                >
                  <Image src={url} alt="Lampiran Foto" fill sizes="120px" className="object-cover" />
                  <div className="absolute top-1 left-1 rounded-md bg-slate-950/60 px-1.5 py-0.5 text-[9px] font-bold text-white flex items-center gap-1">
                    <ImageIcon className="h-2.5 w-2.5" />
                    <span>Foto</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 rounded-full bg-rose-600 p-1 text-white opacity-90 hover:opacity-100 shadow-sm transition"
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
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-orange-200 bg-slate-950 dark:border-orange-800 flex items-center justify-center"
                >
                  <video src={url} className="h-full w-full object-cover opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="rounded-full bg-orange-500/90 p-2 text-white shadow-lg">
                      <Play className="h-4 w-4 fill-white" />
                    </div>
                  </div>
                  <div className="absolute top-1 left-1 rounded-md bg-orange-600 px-1.5 py-0.5 text-[9px] font-bold text-white flex items-center gap-1">
                    <Video className="h-2.5 w-2.5" />
                    <span>Video</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(idx)}
                    className="absolute top-1 right-1 rounded-full bg-rose-600 p-1 text-white opacity-90 hover:opacity-100 shadow-sm transition"
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
                  className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-2 text-slate-400 hover:border-orange-500 hover:bg-orange-50/30 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-orange-500 transition cursor-pointer"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-1 text-[10px] text-orange-500 font-bold">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Mengunggah...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        <Video className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold leading-tight">+ Foto / Video</span>
                    </div>
                  )}
                </button>
              )}

            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || uploading || rating === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-7 py-2.5 text-xs font-bold shadow-sm shadow-orange-500/25 transition disabled:opacity-40 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan Ulasan...</span>
                </>
              ) : (
                <span>{existingReview ? 'Perbarui Ulasan' : 'Kirim Ulasan & Foto/Video'}</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
