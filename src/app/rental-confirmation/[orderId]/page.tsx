'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  CheckCircle,
  CreditCard,
  Loader2,
  ArrowRight,
  Calendar,
  Info,
} from 'lucide-react'

interface RentalOrderData {
  id: string
  orderNumber: string
  total: number
  subtotal: number
  status: string
  createdAt: string
  notes: string | null
  user: {
    name: string | null
    email: string
    phone: string | null
  }
  items: Array<{
    id: string
    rentalDays: number | null
    price: number
    subtotal: number
    rentalItem: {
      id: string
      name: string
      images: string[]
      pricePerDay: number
    }
  }>
}

export default function RentalConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const router = useRouter()
  const [order, setOrder] = useState<RentalOrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState<string>('')

  useEffect(() => {
    params.then((p) => setOrderId(p.orderId))
  }, [params])

  useEffect(() => {
    if (!orderId) return

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data.order)
        } else {
          router.push('/dashboard/customer/orders')
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        router.push('/dashboard/customer/orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!order) {
    return null
  }

  // Calculate pricing breakdown
  const rentalItem = order.items[0]
  const rentalDays = rentalItem.rentalDays || 1
  const basePrice = rentalItem.price * rentalDays
  const discount = basePrice - rentalItem.subtotal
  const deposit = rentalItem.pricePerDay * 10

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="flex-1 px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Success Header */}
          <div className="mb-4 text-center sm:mb-6">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 sm:mb-4 sm:h-20 sm:w-20">
              <CheckCircle className="h-10 w-10 text-green-600 sm:h-12 sm:w-12" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Booking Berhasil Dibuat!
            </h1>
            <p className="text-sm text-gray-600 sm:text-base">
              Terima kasih telah melakukan booking di HaloTekno
            </p>
          </div>

          {/* Order Info Card */}
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-lg sm:p-6">
            <div className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
              <div>
                <p className="text-xs text-gray-600 sm:text-sm">
                  Nomor Booking
                </p>
                <p className="text-base font-bold text-gray-900 sm:text-xl">
                  {order.orderNumber}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 px-3 py-1.5 sm:px-4 sm:py-2">
                <p className="text-xs font-semibold text-yellow-700 sm:text-sm">
                  Menunggu Pembayaran
                </p>
              </div>
            </div>

            {/* Rental Item Details */}
            <div className="mb-4 space-y-2 sm:space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
                Detail Sewa Alat
              </h3>
              <div className="flex gap-3 rounded-lg bg-gray-50 p-3 sm:gap-4">
                {rentalItem.rentalItem.images[0] && (
                  <img
                    src={rentalItem.rentalItem.images[0]}
                    alt={rentalItem.rentalItem.name}
                    className="h-14 w-14 rounded-lg object-cover sm:h-16 sm:w-16"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                    {rentalItem.rentalItem.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Durasi: {rentalDays} hari</span>
                  </div>
                  <p className="text-xs text-gray-600 sm:text-sm">
                    Rp {rentalItem.price.toLocaleString('id-ID')}/hari
                  </p>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Harga Sewa ({rentalDays} hari)</span>
                  <span>Rp {basePrice.toLocaleString('id-ID')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon</span>
                    <span>- Rp {discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Rp {rentalItem.subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-start justify-between text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>Deposit</span>
                    <Info className="h-3 w-3" />
                  </div>
                  <span>Rp {deposit.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base sm:text-lg">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-blue-600 sm:text-2xl">
                    Rp {order.total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-gray-600 sm:text-xs">
                <Info className="mr-1 inline h-3 w-3" />
                Deposit akan dikembalikan setelah alat dikembalikan dalam
                kondisi baik
              </p>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-lg sm:p-6">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900 sm:mb-4 sm:text-lg">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              Instruksi Pembayaran
            </h3>
            <div className="space-y-2.5 text-xs text-gray-700 sm:space-y-3 sm:text-sm">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 sm:h-6 sm:w-6 sm:text-xs">
                  1
                </div>
                <p className="flex-1">
                  Transfer ke rekening BCA: <strong>1234567890</strong> a.n.
                  HaloTekno
                </p>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 sm:h-6 sm:w-6 sm:text-xs">
                  2
                </div>
                <p className="flex-1">
                  Masukkan jumlah:{' '}
                  <strong>Rp {order.total.toLocaleString('id-ID')}</strong>
                </p>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 sm:h-6 sm:w-6 sm:text-xs">
                  3
                </div>
                <p className="flex-1">
                  Konfirmasi pembayaran melalui WhatsApp atau email dengan
                  menyertakan nomor booking
                </p>
              </div>
              <div className="mt-3 rounded-lg bg-yellow-50 p-2.5 sm:mt-4 sm:p-3">
                <p className="text-[10px] text-yellow-800 sm:text-xs">
                  <Info className="mr-1 inline h-3 w-3 sm:h-4 sm:w-4" />
                  <strong>Penting:</strong> Total pembayaran sudah termasuk
                  deposit sebesar Rp {deposit.toLocaleString('id-ID')} yang akan
                  dikembalikan setelah alat dikembalikan.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Link
              href="/dashboard/customer/orders"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:py-3 sm:text-base"
            >
              Lihat Pesanan Saya
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <Link
              href="/sewa-alat"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:py-3 sm:text-base"
            >
              Sewa Alat Lain
            </Link>
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
