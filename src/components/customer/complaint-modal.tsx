'use client'

import { useState, useRef } from 'react'
import {
  X,
  Upload,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Play,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

interface ComplaintModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  onSuccess?: () => void
}

const isVideoUrl = (url?: string | null) => {
  if (!url) return false
  return /\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(url)
}

const COMMON_ISSUES = [
  {
    id: 'lcd',
    label: 'Layar & LCD',
    fullText: 'Kendala Layar LCD / Touchscreen bergaris atau blank',
  },
  {
    id: 'battery',
    label: 'Baterai & Daya',
    fullText: 'Kendala Baterai / Pengisian Daya tidak masuk',
  },
  {
    id: 'hardware',
    label: 'Kamera & Audio',
    fullText: 'Kamera / Speaker / Mic bermasalah',
  },
  {
    id: 'system',
    label: 'Mati Total / Mesin',
    fullText: 'Unit Mati Total / Masalah Mesin & Bootloop',
  },
  {
    id: 'other',
    label: 'Lainnya / Fisik',
    fullText: 'Fisik / Tombol / Komponen Unit Tidak Berfungsi',
  },
]

export function ComplaintModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  onSuccess,
}: ComplaintModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectPreset = (preset: (typeof COMMON_ISSUES)[0]) => {
    setSelectedPreset(preset.id)
    setSubject(preset.fullText)
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > 5) {
      toast.error('Maksimal 5 file bukti (foto / video) kerusakan')
      return
    }

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')

        if (!isImage && !isVideo) {
          toast.error(`File ${file.name} bukan foto atau video.`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Upload failed')
        }

        const data = await res.json()
        setImages((prev) => [...prev, data.url])
      }
      toast.success('Bukti berhasil diunggah')
    } catch (error: any) {
      toast.error(error.message || 'Gagal upload media bukti')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || !description.trim()) {
      toast.error('Mohon lengkapi subjek kendala dan rincian klaim garansi')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          subject,
          description,
          images,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengajukan klaim garansi')
      }

      toast.success('Klaim garansi 30 hari berhasil dikirim ke teknisi toko')
      onSuccess?.()
      onClose()

      // Reset form
      setSubject('')
      setDescription('')
      setImages([])
      setSelectedPreset(null)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal mengirim klaim garansi'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/50 p-3 sm:p-4">
      {/* Modal Surface */}
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xl duration-200 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">
                Klaim Garansi 30 Hari
              </h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                Tukar Unit
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Preset Issue Quick Select (Segmented Chips) */}
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Pilih Kategori Kendala:
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {COMMON_ISSUES.map((preset) => {
                const isSelected =
                  selectedPreset === preset.id || subject === preset.fullText
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-xs font-semibold transition ${
                      isSelected
                        ? 'shadow-xs border-orange-500 bg-orange-50/80 font-bold text-orange-600 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-400'
                        : 'border-slate-200/70 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Subjek Kendala <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value)
                setSelectedPreset(null)
              }}
              placeholder="Contoh: Layar LCD blank setelah 5 hari pemakaian"
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Rincian Masalah / Gejala Kerusakan{' '}
              <span className="text-orange-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan secara singkat kendala yang dialami agar teknisi toko dapat menyiapkan unit pengganti teruji..."
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
              required
            />
          </div>

          {/* Media (Photo & Video) Upload */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Bukti Foto / Video Kerusakan (Opsional)
              </label>
              <span className="text-[11px] text-slate-400">Maks. 5 file</span>
            </div>

            {/* Media Preview Grid */}
            {images.length > 0 && (
              <div className="mb-2.5 grid grid-cols-5 gap-2">
                {images.map((url, index) => {
                  const isVideo = isVideoUrl(url)
                  return (
                    <div
                      key={index}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
                    >
                      {isVideo ? (
                        <div className="relative flex h-full w-full items-center justify-center bg-slate-900">
                          <video
                            src={url}
                            className="h-full w-full object-cover opacity-80"
                          />
                          <Play className="absolute h-4 w-4 fill-white text-white" />
                        </div>
                      ) : (
                        <img
                          src={url}
                          alt={`Bukti ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-1 top-1 z-10 cursor-pointer rounded-full bg-slate-950/80 p-1 text-white opacity-0 transition hover:bg-rose-600 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Upload Button */}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/50 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-800/80"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    <span>Mengunggah bukti...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>Upload Foto / Video Kerusakan</span>
                  </>
                )}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !description.trim()}
              className="shadow-xs inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <span>Ajukan Klaim</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
