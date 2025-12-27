'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Upload, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProductFormModalProps {
  isOpen: boolean
  product: {
    id?: string
    name?: string
    description?: string | null
    price?: number
    stock?: number
    category?: string
    brand?: string | null
    model?: string | null
    images?: string[]
    isActive?: boolean
  } | null
  onClose: () => void
  onSuccess: () => void
}

export default function ProductFormModal({
  isOpen,
  product,
  onClose,
  onSuccess,
}: ProductFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    model: '',
    price: '',
    stock: '',
    images: [] as string[],
    isActive: true,
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        brand: product.brand || '',
        model: product.model || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        images: product.images || [],
        isActive: product.isActive !== undefined ? product.isActive : true,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        brand: '',
        model: '',
        price: '',
        stock: '',
        images: [],
        isActive: true,
      })
    }
  }, [product, isOpen])

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
      const url = product
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products'
      const method = product ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save product')
      }

      toast.success(`Product ${product ? 'updated' : 'created'} successfully!`)
      onSuccess()
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save product'
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
            {product ? 'Edit Product' : 'Create New Product'}
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
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., LCD iPhone 13 Pro"
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
                  placeholder="Product description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., LCD, Baterai, Kamera"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Apple, Samsung"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Model / Compatible Device
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., iPhone 13 Pro"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Price (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="150000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Stock *
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
                  placeholder="10"
                />
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
                  Inactive products won't be shown in the catalog
                </p>
              </div>
            </div>

            {/* Images Section */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Product Images (Max 5)
              </label>

              {/* Image Previews */}
              {formData.images.length > 0 && (
                <div className="mb-3 grid grid-cols-5 gap-2">
                  {formData.images.map((imageData, index) => (
                    <div key={index} className="group relative">
                      <img
                        src={imageData}
                        alt={`Product ${index + 1}`}
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
                    id="product-images"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="product-images"
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
                    {product ? 'Updating...' : 'Creating...'}
                  </span>
                ) : product ? (
                  'Update Product'
                ) : (
                  'Create Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
