'use client'

import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { useState, useRef } from 'react'

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
  folder = 'affiliate-gadget',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append(
        'upload_preset',
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''
      )
      formData.append('folder', folder)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (data.secure_url) {
        onChange(data.secure_url)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
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
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative">
        {value ? (
          // Preview Image
          <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200">
            <img
              src={value}
              alt="Uploaded"
              className="h-48 w-full object-cover"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={isUploading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Ganti'}
              </button>

              {onRemove && !isUploading && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                  Hapus
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
            className="relative flex h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                <p className="text-sm font-medium text-gray-600">
                  Uploading...
                </p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-blue-100 p-4">
                  <ImageIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">
                    Click to upload image
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, WEBP up to 10MB
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
