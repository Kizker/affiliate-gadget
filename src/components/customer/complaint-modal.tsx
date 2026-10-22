'use client'

import { useState, useRef, useEffect } from 'react'
import {
  X,
  Upload,
  Loader2,
  ChevronDown,
  Check,
  Play,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { processMediaUploadFile } from '@/lib/media-upload-client'

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

const ISSUE_CATEGORIES = [
  {
    id: 'lcd',
    label: 'Layar & LCD',
    defaultSubject: 'Kendala Layar LCD / Touchscreen',
    placeholder: 'Contoh: Layar sentuh tidak merespons sebagian',
  },
  {
    id: 'battery',
    label: 'Baterai & Daya',
    defaultSubject: 'Kendala Baterai / Pengisian Daya',
    placeholder: 'Contoh: Baterai cepat habis atau tidak bisa diisi daya',
  },
  {
    id: 'hardware',
    label: 'Kamera & Audio',
    defaultSubject: 'Kendala Kamera / Speaker / Mic',
    placeholder: 'Contoh: Kamera blur atau suara speaker kresek-kresek',
  },
  {
    id: 'system',
    label: 'Mati Total / Mesin',
    defaultSubject: 'Kendala Mati Total / Bootloop Mesin',
    placeholder: 'Contoh: Unit mati total dan tidak bisa dinyalakan',
  },
  {
    id: 'other',
    label: 'Lainnya / Fisik',
    defaultSubject: 'Kendala Fisik / Komponen Unit',
    placeholder: 'Contoh: Tombol volume atau fingerprint tidak merespons',
  },
]

export function ComplaintModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  onSuccess,
}: ComplaintModalProps) {
  const [selectedCategory, setSelectedCategory] = useState(
    ISSUE_CATEGORIES[0].id
  )
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  if (!isOpen) return null

  const currentCategory =
    ISSUE_CATEGORIES.find((c) => c.id === selectedCategory) ||
    ISSUE_CATEGORIES[0]

  const handleSelectCategory = (category: (typeof ISSUE_CATEGORIES)[0]) => {
    setSelectedCategory(category.id)
    setIsDropdownOpen(false)
    if (!subject.trim()) {
      setSubject(category.defaultSubject)
    }
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
        const isVideo =
          file.type.startsWith('video/') ||
          file.name.toLowerCase().endsWith('.mp4')
        const isImage = !isVideo

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

    const finalSubject = subject.trim() || currentCategory.defaultSubject
    if (!finalSubject || !description.trim()) {
      toast.error('Mohon lengkapi subjek kendala dan rincian masalah')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          subject: `[${currentCategory.label}] ${finalSubject}`,
          description,
          images,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengajukan klaim garansi')
      }

      toast.success('Klaim garansi berhasil dikirim ke teknisi toko')
      onSuccess?.()
      onClose()

      // Reset form
      setSubject('')
      setDescription('')
      setImages([])
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal mengirim klaim garansi'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 duration-200 animate-in fade-in">
      <div
        className="relative flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
              Klaim Garansi
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Pesanan{' '}
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                #{orderNumber}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-4 pb-12 text-xs">
            {/* 1. Kategori Kendala (Dropdown) */}
            <div className="relative" ref={dropdownRef}>
              <label className="mb-2 block text-xs font-bold text-slate-800 dark:text-white">
                Kategori Kendala
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <span>{currentCategory.label}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-orange-500' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {ISSUE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                        selectedCategory === cat.id
                          ? 'bg-orange-50 font-bold text-orange-600 dark:bg-orange-950/50 dark:text-orange-400'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {selectedCategory === cat.id && (
                        <Check className="h-3.5 w-3.5 text-orange-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Subjek Kendala * */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-800 dark:text-white">
                Subjek Kendala <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={currentCategory.placeholder}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            {/* 3. Rincian Masalah * */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-800 dark:text-white">
                Rincian Masalah <span className="text-orange-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan kronologi dan kendala yang dialami secara singkat..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-3.5 text-xs leading-relaxed text-slate-700 placeholder-slate-400 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                required
              />
            </div>

            {/* 4. Bukti Foto / Video */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-white">
                  Bukti Foto / Video
                </label>
                <span className="text-[11px] font-normal text-slate-400">
                  Opsional (Maks. 5 file)
                </span>
              </div>

              {/* Uploaded Media Thumbnails */}
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
                          title="Hapus"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Upload Trigger Button */}
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-3 text-xs font-medium text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                      <span>Mengunggah bukti...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-slate-500" />
                      <span>Unggah Foto atau Video</span>
                    </>
                  )}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,video/mp4"
                multiple
                onChange={handleMediaUpload}
                className="hidden"
              />
              <p className="mt-1 text-center text-[10px] text-slate-400">
                Foto: JPG/PNG maks 2 MB (otomatis kompres) • Video: MP4 maks 30
                MB (10–60 dtk, maks 1280x1280px)
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 cursor-pointer rounded-xl bg-slate-100 py-3 text-center text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-1/2 cursor-pointer rounded-xl bg-[#0F172A] py-3 text-center text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-40 dark:bg-white dark:text-slate-950"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Mengirim...
                </span>
              ) : (
                'Ajukan Klaim'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ComplaintModal
