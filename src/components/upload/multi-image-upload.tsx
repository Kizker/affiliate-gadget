'use client'

import { Plus, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

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
  folder = 'halotekno/gallery',
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
        const updatedImages = [...imagesRef.current, data.secure_url]
        imagesRef.current = updatedImages
        onChange(updatedImages)
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
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <span className="text-sm text-gray-500">
            {images.length} / {maxImages} images
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Existing Images */}
        {images.map((url, index) => (
          <div
            key={url}
            className="group relative overflow-hidden rounded-xl border-2 border-gray-200"
          >
            <img
              src={url}
              alt={`Gallery ${index + 1}`}
              className="h-40 w-full object-cover"
            />

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute right-2 top-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 transition-all hover:bg-red-700 group-hover:opacity-100"
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
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
          >
            {isUploading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            ) : (
              <>
                <div className="rounded-full bg-blue-100 p-3">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-gray-600">Add Image</p>
              </>
            )}
          </button>
        )}
      </div>

      {!canAddMore && (
        <p className="text-sm text-gray-500">
          Maximum {maxImages} images reached
        </p>
      )}
    </div>
  )
}
