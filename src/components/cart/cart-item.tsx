'use client'

import Image from 'next/image'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import type { CartItem as CartItemType } from '@/types/cart'

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem, toggleItemSelection, selectedItems } =
    useCartStore()
  const isSelected = selectedItems.includes(item.id)

  const itemTotal = item.rentalDays
    ? item.price * item.rentalDays * item.quantity
    : item.price * item.quantity

  const handleQuantityChange = (newQuantity: number) => {
    if (item.stock && newQuantity > item.stock) {
      return // Don't allow quantity > stock
    }
    updateQuantity(item.id, newQuantity)
  }

  return (
    <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Checkbox */}
      <div className="flex items-start pt-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleItemSelection(item.id)}
          className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          aria-label={`Select ${item.name}`}
        />
      </div>

      {/* Product Image */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={item.image || '/placeholder.png'}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{item.name}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {item.type === 'PRODUCT' && 'Sparepart'}
            {item.type === 'RENTAL' && `Sewa ${item.rentalDays} hari`}
            {item.type === 'SERVICE' && 'Jasa Servis'}
          </p>
          <p className="mt-1 text-lg font-bold text-blue-600">
            Rp {item.price.toLocaleString('id-ID')}
            {item.type === 'RENTAL' && '/hari'}
          </p>
        </div>

        {/* Quantity Controls & Remove */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-12 text-center font-semibold">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.stock ? item.quantity >= item.stock : false}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => removeItem(item.id)}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Hapus</span>
          </button>
        </div>
      </div>

      {/* Item Total (Desktop) */}
      <div className="hidden flex-col items-end justify-between md:flex">
        <p className="text-lg font-bold text-gray-900">
          Rp {itemTotal.toLocaleString('id-ID')}
        </p>
        {item.stock && (
          <p className="text-xs text-gray-500">Stok: {item.stock}</p>
        )}
      </div>
    </div>
  )
}
