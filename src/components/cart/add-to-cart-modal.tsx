'use client'

import { useState, useMemo } from 'react'
import { ShoppingCart, Minus, Plus, X, Check } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import type { CartItem } from '@/types/cart'

interface AddToCartModalProps {
  item: {
    id: string
    name: string
    price: number
    image: string
    type: 'PRODUCT' | 'RENTAL'
    stock: number
    pricePerDay?: number
    depositAmount?: number
  }
  isOpen: boolean
  onClose: () => void
}

type DurationType = 'daily' | 'weekly' | 'monthly' | 'custom'

export default function AddToCartModal({
  item,
  isOpen,
  onClose,
}: AddToCartModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [rentalDays, setRentalDays] = useState(1)
  const [durationType, setDurationType] = useState<DurationType>('daily')
  const [notes, setNotes] = useState('')
  const [isAdded, setIsAdded] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const isRental = item.type === 'RENTAL'
  const pricePerDay = item.pricePerDay || item.price

  // Calculate pricing for rental
  const pricing = useMemo(() => {
    if (!isRental) {
      return {
        subtotal: item.price * quantity,
        deposit: 0,
        total: item.price * quantity,
      }
    }

    let actualDays = rentalDays
    let discountPercentage = 0

    if (durationType === 'daily') {
      actualDays = 1
    } else if (durationType === 'weekly') {
      actualDays = 5
      discountPercentage = 10
    } else if (durationType === 'monthly') {
      actualDays = 20
      discountPercentage = 20
    }

    const basePrice = pricePerDay * actualDays * quantity
    const discount = Math.round(basePrice * (discountPercentage / 100))
    const subtotal = basePrice - discount
    const deposit = (item.depositAmount || 0) * quantity
    const total = subtotal + deposit

    return {
      actualDays,
      basePrice,
      discount,
      discountPercentage,
      subtotal,
      deposit,
      total,
    }
  }, [
    quantity,
    rentalDays,
    durationType,
    isRental,
    item.price,
    item.depositAmount,
    pricePerDay,
  ])

  const handleDurationTypeChange = (type: DurationType) => {
    setDurationType(type)
    if (type === 'daily') {
      setRentalDays(1)
    } else if (type === 'weekly') {
      setRentalDays(5)
    } else if (type === 'monthly') {
      setRentalDays(20)
    }
  }

  const handleCustomDurationChange = (value: string) => {
    const numValue = parseInt(value) || 1
    const clamped = Math.max(1, Math.min(365, numValue))
    setRentalDays(clamped)
    setDurationType('custom')
  }

  const handleAddToCart = () => {
    const cartItem: Omit<CartItem, 'id'> = {
      type: item.type,
      name: item.name,
      image: item.image,
      price: isRental ? pricePerDay : item.price,
      quantity,
      stock: item.stock,
      notes: notes || undefined,
      ...(item.type === 'PRODUCT' && { productId: item.id }),
      ...(item.type === 'RENTAL' && {
        rentalItemId: item.id,
        rentalDays: pricing.actualDays || rentalDays,
        depositAmount: item.depositAmount,
      }),
    }

    addItem(cartItem)
    setIsAdded(true)

    // Close modal after 1 second
    setTimeout(() => {
      setIsAdded(false)
      onClose()
      // Reset form
      setQuantity(1)
      setRentalDays(1)
      setDurationType('daily')
      setNotes('')
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Tambah ke Keranjang
            </h2>
            <p className="text-xs text-gray-600 sm:text-sm">
              {isRental ? 'Pilih durasi sewa' : 'Pilih jumlah'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100 sm:p-2"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Item Info */}
        <div className="mb-4 flex gap-3 rounded-lg bg-gray-50 p-3 sm:mb-6 sm:gap-4 sm:p-4">
          {item.image && (
            <img
              src={item.image}
              alt={item.name}
              className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
              {item.name}
            </h3>
            <p className="text-base font-bold text-blue-600 sm:text-lg">
              Rp {(isRental ? pricePerDay : item.price).toLocaleString('id-ID')}
              {isRental && '/hari'}
            </p>
            <p className="text-xs text-gray-500 sm:text-sm">
              Stok: {item.stock}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-700 sm:text-sm">
              Jumlah
            </label>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1
                  setQuantity(Math.min(item.stock, Math.max(1, val)))
                }}
                min="1"
                max={item.stock}
                className="w-20 rounded-lg border border-gray-300 p-2 text-center text-sm font-semibold"
              />
              <button
                type="button"
                onClick={() => setQuantity(Math.min(item.stock, quantity + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Duration (for Rental) */}
          {isRental && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 sm:text-sm">
                  Durasi Sewa
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDurationTypeChange('daily')}
                    className={`rounded-lg border-2 p-2 text-center transition-all ${
                      durationType === 'daily'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-900 sm:text-sm">
                      1 Hari
                    </p>
                    <p className="text-[10px] text-gray-600 sm:text-xs">
                      Normal
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationTypeChange('weekly')}
                    className={`rounded-lg border-2 p-2 text-center transition-all ${
                      durationType === 'weekly'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-900 sm:text-sm">
                      5 Hari
                    </p>
                    <p className="text-[10px] text-green-600 sm:text-xs">
                      -10%
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationTypeChange('monthly')}
                    className={`rounded-lg border-2 p-2 text-center transition-all ${
                      durationType === 'monthly'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-900 sm:text-sm">
                      20 Hari
                    </p>
                    <p className="text-[10px] text-green-600 sm:text-xs">
                      -20%
                    </p>
                  </button>
                </div>
              </div>

              {/* Custom Duration */}
              <div>
                <label className="block text-xs font-medium text-gray-700 sm:text-sm">
                  Atau Custom (1-365 hari)
                </label>
                <input
                  type="number"
                  value={rentalDays}
                  onChange={(e) => handleCustomDurationChange(e.target.value)}
                  min="1"
                  max="365"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Masukkan jumlah hari"
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 sm:text-sm">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Tambahkan catatan..."
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Total */}
          <div className="rounded-lg bg-blue-50 p-3 sm:p-4">
            <div className="space-y-2 text-xs sm:text-sm">
              {isRental && (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Durasi</span>
                    <span>
                      {pricing.actualDays} hari × {quantity} unit
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Harga Sewa</span>
                    <span>
                      Rp {(pricing.basePrice || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  {(pricing.discount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Diskon ({pricing.discountPercentage}%)</span>
                      <span>
                        - Rp {pricing.discount?.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {(pricing.deposit || 0) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Deposit</span>
                      <span>Rp {pricing.deposit?.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </>
              )}
              {!isRental && (
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({quantity} item)</span>
                  <span>Rp {pricing.subtotal.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-blue-200 pt-2">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-blue-600 sm:text-lg">
                  Rp {pricing.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAdded}
            className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all sm:text-base ${
              isAdded
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="h-5 w-5" />
                Ditambahkan!
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" />
                Tambah ke Keranjang
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
