'use client'

import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useState, useRef } from 'react'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  label?: string
  folder?: string
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  label = 'Upload Image',
  folder = 'banners',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Quick client-side size check (15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 15MB.')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengunggah gambar.')
      }

      const fileUrl = data.url || data.secure_url
      if (fileUrl) {
        onChange(fileUrl)
        toast.success('Foto berhasil diunggah!')
      } else {
        throw new Error('URL foto tidak ditemukan pada respons server.')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Gagal mengunggah foto. Silakan coba lagi.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative">
        {value ? (
          // Preview Image
          <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <img
              src={value}
              alt="Uploaded banner"
              className="h-48 w-full object-cover sm:h-56"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center gap-2.5 bg-slate-950/60 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{isUploading ? 'Mengunggah...' : 'Ganti Banner'}</span>
              </button>

              {onRemove && !isUploading && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-95"
                >
                  <X className="h-4 w-4" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          // Upload Button
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="relative flex h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 transition-all hover:border-orange-400 hover:bg-orange-50/40 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-orange-500/40 sm:h-56"
          >
            {isUploading ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sedang Mengunggah Banner...
                </p>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 sm:text-sm">
                    Klik untuk Mengunggah Banner Toko
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Format PNG, JPG, atau WebP (Maksimal 15MB)
                  </p>
                </div>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
