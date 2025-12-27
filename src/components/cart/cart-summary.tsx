'use client'

import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart-store'

export default function CartSummary() {
  const getSelectedSummary = useCartStore((state) => state.getSelectedSummary)
  const selectedItems = useCartStore((state) => state.selectedItems)

  const { subtotal, tax, total, itemCount } = getSelectedSummary()
  const hasSelectedItems = selectedItems.length > 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-900">
        Ringkasan Pesanan
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} item)</span>
          <span>Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Pajak (PPN 11%)</span>
          <span>Rp {tax.toLocaleString('id-ID')}</span>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total</span>
            <span className="text-blue-600">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      <Link
        href="/checkout"
        className={`mt-6 block w-full rounded-lg py-3 text-center font-semibold text-white transition-all ${
          hasSelectedItems
            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-105 hover:shadow-lg'
            : 'cursor-not-allowed bg-gray-400'
        }`}
        onClick={(e) => {
          if (!hasSelectedItems) {
            e.preventDefault()
          }
        }}
      >
        {hasSelectedItems ? 'Lanjut ke Checkout' : 'Pilih Item untuk Checkout'}
      </Link>

      <p className="mt-4 text-center text-xs text-gray-500">
        {hasSelectedItems
          ? 'Harga sudah termasuk PPN 11%'
          : 'Pilih minimal 1 item untuk melanjutkan'}
      </p>
    </div>
  )
}
