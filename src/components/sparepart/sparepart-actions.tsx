'use client'

import { useState } from 'react'
import { ShoppingBag, LogIn, ShoppingCart } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import PurchaseModal from '@/components/sparepart/purchase-modal'
import AddToCartModal from '@/components/cart/add-to-cart-modal'

interface SparepartActionsProps {
  product: {
    id: string
    name: string
    price: number
    stock: number
    images: string[]
  }
  isInStock: boolean
}

export default function SparepartActions({
  product,
  isInStock,
}: SparepartActionsProps) {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const { data: session, status } = useSession()

  if (!isInStock) {
    return (
      <div className="sticky bottom-0 space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <button
          disabled
          className="w-full cursor-not-allowed rounded-lg bg-gray-300 py-3 text-center font-semibold text-gray-500"
        >
          Stok Habis
        </button>
        <p className="text-center text-xs text-gray-500">
          Hubungi kami untuk informasi lebih lanjut
        </p>
      </div>
    )
  }

  // Show login button if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="sticky bottom-0 space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        {/* Login Button - Primary */}
        <Link
          href="/auth/login"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700"
        >
          <LogIn className="h-5 w-5" />
          Login untuk Beli
        </Link>

        <p className="text-center text-xs text-gray-500">
          Login terlebih dahulu untuk membeli produk
        </p>
      </div>
    )
  }

  // Show restriction message for non-customers (MITRA, TEKNISI, ADMIN)
  if (session?.user?.role !== 'CUSTOMER' || session.user.isTechnician) {
    return (
      <div className="sticky bottom-0 space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            Hanya customer yang dapat melakukan pembelian
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="sticky bottom-0 space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        {/* Beli Sekarang - Primary Button */}
        <button
          onClick={() => setShowPurchaseModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700"
        >
          <ShoppingBag className="h-5 w-5" />
          Beli Sekarang
        </button>

        {/* Tambahkan ke Keranjang - Secondary Button */}
        <button
          onClick={() => setShowCartModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-blue-600 py-3 font-semibold text-blue-600 transition-all hover:bg-blue-50"
        >
          <ShoppingCart className="h-5 w-5" />
          Tambah ke Keranjang
        </button>

        <p className="text-center text-xs text-gray-500">
          Hubungi kami untuk informasi lebih lanjut
        </p>
      </div>

      {/* Purchase Modal */}
      <PurchaseModal
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          image: product.images[0] || '',
        }}
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />

      {/* Add to Cart Modal */}
      <AddToCartModal
        item={{
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0] || '',
          type: 'PRODUCT',
          stock: product.stock,
        }}
        isOpen={showCartModal}
        onClose={() => setShowCartModal(false)}
      />
    </>
  )
}
