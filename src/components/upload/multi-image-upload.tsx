'use client'

import { Plus, X, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface MultiImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  label?: string
  folder?: string
}

export default function MultiImageUpload({
  value,
  onChange,
  maxImages = 8,
  label = 'Upload Images',
  folder = 'gallery',
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use ref to store current images - this persists across re-renders
  const imagesRef = useRef<string[]>(value || [])

  // Sync ref with prop value when it changes from parent
  useEffect(() => {
    imagesRef.current = value || []
  }, [value])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
        throw new Error(data.error || 'Gagal mengunggah foto.')
      }

      const fileUrl = data.url || data.secure_url
      if (fileUrl) {
        const updatedImages = [...imagesRef.current, fileUrl]
        imagesRef.current = updatedImages
        onChange(updatedImages)
        toast.success('Foto berhasil ditambahkan ke galeri!')
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

  const handleRemove = (urlToRemove: string) => {
    const filtered = imagesRef.current.filter((url) => url !== urlToRemove)
    imagesRef.current = filtered
    onChange(filtered)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Use ref value for rendering
  const images = imagesRef.current
  const canAddMore = images.length < maxImages

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {label}
          </label>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
            {images.length} / {maxImages} foto
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Existing Images */}
        {images.map((url, index) => (
          <div
            key={url}
            className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          >
            <img
              src={url}
              alt={`Gallery ${index + 1}`}
              className="h-36 w-full object-cover sm:h-40"
            />

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute right-2 top-2 rounded-xl bg-rose-600 p-1.5 text-white opacity-0 shadow-sm transition-all hover:bg-rose-700 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Upload Button */}
        {canAddMore && (
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 transition-all hover:border-orange-400 hover:bg-orange-50/40 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 sm:h-40"
          >
            {isUploading ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                  <Plus className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tambah Foto
                </p>
              </>
            )}
          </button>
        )}
      </div>

      {!canAddMore && (
        <p className="text-xs text-slate-400">
          Maksimal {maxImages} foto galeri telah tercapai.
        </p>
      )}
    </div>
  )
}
