'use client'

import { useState } from 'react'
import { Calendar, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import BookingModal from '@/components/rental/booking-modal'
import AddToCartButton from '@/components/cart/add-to-cart-button'

interface RentalActionsProps {
  rentalItem: {
    id: string
    name: string
    pricePerDay: number
    stock: number
    images: string[]
    depositAmount: number
  }
  isAvailable: boolean
}

export default function RentalActions({
  rentalItem,
  isAvailable,
}: RentalActionsProps) {
  const [showBookingModal, setShowBookingModal] = useState(false)
  const { data: session, status } = useSession()

  if (!isAvailable) {
    return (
      <div className="sticky bottom-0 space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <button
          disabled
          className="w-full cursor-not-allowed rounded-lg bg-gray-300 py-3 text-center font-semibold text-gray-500"
        >
          Tidak Tersedia
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
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 py-3 font-semibold text-white transition-all hover:shadow-lg"
        >
          <LogIn className="h-5 w-5" />
          Login untuk Booking
        </Link>

        <p className="text-center text-xs text-gray-500">
          Login terlebih dahulu untuk melakukan booking
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
            Hanya customer yang dapat melakukan booking
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="sticky bottom-0 space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        {/* Booking Sekarang - Primary Button */}
        <button
          onClick={() => setShowBookingModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 py-3 font-semibold text-white transition-all hover:shadow-lg"
        >
          <Calendar className="h-5 w-5" />
          Booking Sekarang
        </button>

        {/* Masukkan ke Keranjang - Secondary Button */}
        <AddToCartButton
          product={{
            id: rentalItem.id,
            name: rentalItem.name,
            price: rentalItem.pricePerDay,
            image: rentalItem.images[0] || '',
            type: 'RENTAL',
            stock: rentalItem.stock,
          }}
          className="w-full"
        />

        <p className="text-center text-xs text-gray-500">
          Hubungi kami untuk informasi lebih lanjut
        </p>
      </div>

      {/* Booking Modal */}
      <BookingModal
        rentalItem={{
          id: rentalItem.id,
          name: rentalItem.name,
          pricePerDay: rentalItem.pricePerDay,
          stock: rentalItem.stock,
          image: rentalItem.images[0] || '',
          depositAmount: rentalItem.depositAmount,
        }}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />
    </>
  )
}
