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
  { id: 'lcd', label: 'Layar & LCD', fullText: 'Kendala Layar LCD / Touchscreen bergaris atau blank' },
  { id: 'battery', label: 'Baterai & Daya', fullText: 'Kendala Baterai / Pengisian Daya tidak masuk' },
  { id: 'hardware', label: 'Kamera & Audio', fullText: 'Kamera / Speaker / Mic bermasalah' },
  { id: 'system', label: 'Mati Total / Mesin', fullText: 'Unit Mati Total / Masalah Mesin & Bootloop' },
  { id: 'other', label: 'Lainnya / Fisik', fullText: 'Fisik / Tombol / Komponen Unit Tidak Berfungsi' },
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

  const handleSelectPreset = (preset: typeof COMMON_ISSUES[0]) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
      {/* Modal Surface */}
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xl duration-200 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                Klaim Garansi 30 Hari
              </h2>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                Tukar Unit
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Preset Issue Quick Select (Segmented Chips) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Pilih Kategori Kendala:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {COMMON_ISSUES.map((preset) => {
                const isSelected = selectedPreset === preset.id || subject === preset.fullText
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold text-center transition cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/70 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300'
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-slate-400 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:text-white transition"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Rincian Masalah / Gejala Kerusakan <span className="text-orange-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan secara singkat kendala yang dialami agar teknisi toko dapat menyiapkan unit pengganti teruji..."
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-slate-400 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:text-white transition leading-relaxed"
              required
            />
          </div>

          {/* Media (Photo & Video) Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
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
                        <div className="relative h-full w-full bg-slate-900 flex items-center justify-center">
                          <video src={url} className="h-full w-full object-cover opacity-80" />
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
                        className="absolute right-1 top-1 rounded-full bg-slate-950/80 p-1 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition cursor-pointer z-10"
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
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 transition cursor-pointer"
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
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !description.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-white px-6 py-2.5 text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-40 cursor-pointer"
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
