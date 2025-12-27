'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Upload, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface RentalItemFormModalProps {
  isOpen: boolean
  rentalItem: {
    id?: string
    name?: string
    description?: string | null
    pricePerDay?: number
    weeklyDiscountPct?: number
    monthlyDiscountPct?: number
    depositAmount?: number | null
    terms?: string[]
    stock?: number
    images?: string[]
    isActive?: boolean
  } | null
  onClose: () => void
  onSuccess: () => void
}

export default function RentalItemFormModal({
  isOpen,
  rentalItem,
  onClose,
  onSuccess,
}: RentalItemFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerDay: '',
    weeklyDiscountPct: '10',
    monthlyDiscountPct: '20',
    depositAmount: '',
    terms: [] as string[],
    stock: '',
    images: [] as string[],
    isActive: true,
  })

  useEffect(() => {
    if (rentalItem) {
      setFormData({
        name: rentalItem.name || '',
        description: rentalItem.description || '',
        pricePerDay: rentalItem.pricePerDay?.toString() || '',
        weeklyDiscountPct: rentalItem.weeklyDiscountPct?.toString() || '10',
        monthlyDiscountPct: rentalItem.monthlyDiscountPct?.toString() || '20',
        depositAmount: rentalItem.depositAmount?.toString() || '',
        terms: rentalItem.terms || [],
        stock: rentalItem.stock?.toString() || '',
        images: rentalItem.images || [],
        isActive:
          rentalItem.isActive !== undefined ? rentalItem.isActive : true,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        pricePerDay: '',
        weeklyDiscountPct: '10',
        monthlyDiscountPct: '20',
        depositAmount: '',
        terms: [],
        stock: '',
        images: [],
        isActive: true,
      })
    }
  }, [rentalItem, isOpen])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (formData.images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    // Convert files to base64
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error('Image size must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, base64String],
        }))
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    e.target.value = ''
  }

  const handleImageRemove = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    setFormData({ ...formData, images: newImages })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = rentalItem
        ? `/api/admin/rental-items/${rentalItem.id}`
        : '/api/admin/rental-items'
      const method = rentalItem ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pricePerDay: parseFloat(formData.pricePerDay),
          weeklyDiscountPct: parseFloat(formData.weeklyDiscountPct),
          monthlyDiscountPct: parseFloat(formData.monthlyDiscountPct),
          depositAmount: formData.depositAmount
            ? parseFloat(formData.depositAmount)
            : null,
          stock: parseInt(formData.stock),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save rental item')
      }

      toast.success(
        `Rental item ${rentalItem ? 'updated' : 'created'} successfully!`
      )
      onSuccess()
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save rental item'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/50 px-4 pb-8 pt-32">
      <div className="flex max-h-full w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex flex-shrink-0 items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {rentalItem ? 'Edit Rental Item' : 'Create New Rental Item'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Obeng Set Lengkap"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Item description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Price per Day (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.pricePerDay}
                  onChange={(e) =>
                    setFormData({ ...formData, pricePerDay: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Available Units *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Diskon Mingguan (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.weeklyDiscountPct}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weeklyDiscountPct: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="10"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Diskon untuk sewa 5 hari (default: 10%)
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Diskon Bulanan (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.monthlyDiscountPct}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyDiscountPct: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="20"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Diskon untuk sewa 20 hari (default: 20%)
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Deposit (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.depositAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, depositAmount: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Kosongkan untuk auto (10x harga harian)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Kosongkan untuk otomatis 10x harga harian
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Syarat & Ketentuan
                </label>
                <div className="space-y-2">
                  {formData.terms.map((term, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={term}
                        onChange={(e) => {
                          const newTerms = [...formData.terms]
                          newTerms[index] = e.target.value
                          setFormData({ ...formData, terms: newTerms })
                        }}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="Contoh: Minimal sewa 1 hari"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newTerms = formData.terms.filter(
                            (_, i) => i !== index
                          )
                          setFormData({ ...formData, terms: newTerms })
                        }}
                        className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        terms: [...formData.terms, ''],
                      })
                    }}
                    className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Syarat
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  Active
                </label>
                <p className="text-xs text-gray-500">
                  Inactive items won't be shown in the rental catalog
                </p>
              </div>
            </div>

            {/* Images Section */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Item Images (Max 5)
              </label>

              {/* Image Previews */}
              {formData.images.length > 0 && (
                <div className="mb-3 grid grid-cols-5 gap-2">
                  {formData.images.map((imageData, index) => (
                    <div key={index} className="group relative">
                      <img
                        src={imageData}
                        alt={`Item ${index + 1}`}
                        className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* File Upload */}
              {formData.images.length < 5 && (
                <div className="space-y-2">
                  <input
                    type="file"
                    id="rental-images"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="rental-images"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-600"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-sm">
                      Click to upload images ({5 - formData.images.length}{' '}
                      remaining)
                    </span>
                  </label>
                  <p className="text-center text-xs text-gray-500">
                    PNG, JPG up to 5MB each
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-shrink-0 gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-medium text-white hover:shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {rentalItem ? 'Updating...' : 'Creating...'}
                  </span>
                ) : rentalItem ? (
                  'Update Rental Item'
                ) : (
                  'Create Rental Item'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
