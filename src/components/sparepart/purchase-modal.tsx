'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PurchaseModalProps {
  product: {
    id: string
    name: string
    price: number
    stock: number
    image: string
  }
  isOpen: boolean
  onClose: () => void
}

export default function PurchaseModal({
  product,
  isOpen,
  onClose,
}: PurchaseModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  const totalPrice = product.price * quantity

  const handleProceedToCheckout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (quantity < 1) {
      toast({
        title: 'Error',
        description: 'Jumlah minimal 1',
        variant: 'destructive',
      })
      return
    }

    if (quantity > product.stock) {
      toast({
        title: 'Error',
        description: `Stok tidak mencukupi. Tersedia: ${product.stock}`,
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    // Redirect to direct checkout with product data
    router.push(
      `/checkout/direct?type=product&id=${product.id}&qty=${quantity}`
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Beli Sekarang</h2>
          <p className="text-sm text-gray-600">Lengkapi detail pesanan Anda</p>
        </div>

        {/* Product Info */}
        <div className="mb-6 flex gap-4 rounded-lg bg-gray-50 p-4">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="h-20 w-20 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            <p className="text-lg font-bold text-blue-600">
              Rp {product.price.toLocaleString('id-ID')}
            </p>
            <p className="text-sm text-gray-500">Stok: {product.stock}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleProceedToCheckout} className="space-y-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Jumlah
            </label>
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                min="1"
                max={product.stock}
                className="h-10 w-20 rounded-lg border border-gray-300 text-center focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-blue-200 pt-2">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-blue-600">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <ArrowRight className="h-5 w-5" />
                Lanjut ke Checkout
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
