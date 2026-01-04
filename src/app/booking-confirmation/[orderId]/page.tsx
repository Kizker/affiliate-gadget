'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import Link from 'next/link'
import {
  CheckCircle,
  Package,
  DollarSign,
  User,
  Phone,
  Loader2,
  ArrowRight,
} from 'lucide-react'

interface OrderItem {
  type: string
  service?: {
    name: string
    category: string
  }
  product?: {
    name: string
    images: string[]
  }
  rentalItem?: {
    name: string
    images: string[]
  }
}

interface OrderDetails {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  items: OrderItem[]
  technician?: {
    user: {
      name: string
      phone: string
    }
  }
}

export default function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { status } = useSession()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState<string>('')

  useEffect(() => {
    params.then((p) => setOrderId(p.orderId))
  }, [params])

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) {
        const data = await res.json()
        const orderData = data.order

        // Detect order type and redirect to appropriate confirmation page
        if (orderData?.items?.length > 0) {
          const firstItem = orderData.items[0]

          // Check if it's a PRODUCT order (sparepart)
          if (firstItem.type === 'PRODUCT' || firstItem.product) {
            router.replace(`/order-confirmation/sparepart/${orderId}`)
            return
          }

          // Check if it's a RENTAL order
          if (firstItem.type === 'RENTAL' || firstItem.rentalItem) {
            router.replace(`/order-confirmation/rental/${orderId}`)
            return
          }
        }

        // Otherwise, it's a SERVICE booking - show this page
        setOrder(orderData)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId, router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && orderId) {
      fetchOrder()
    }
  }, [status, orderId, router, fetchOrder])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Package className="h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">
          Pesanan tidak ditemukan
        </h2>
        <Link
          href="/dashboard/customer"
          className="mt-4 text-blue-600 hover:underline"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="container mx-auto min-h-screen flex-1 px-4 pb-8 pt-24 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {/* Success Header */}
          <div className="mb-4 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">
              Booking Berhasil!
            </h1>
            <p className="text-sm text-gray-600">
              Pesanan Anda telah diterima dan sedang diproses
            </p>
          </div>

          {/* Order Details Card */}
          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <div className="mb-4 border-b border-gray-200 pb-3">
              <h2 className="text-xl font-bold text-gray-900">
                Detail Pesanan
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Nomor Pesanan:{' '}
                <span className="font-semibold text-gray-900">
                  {order.orderNumber}
                </span>
              </p>
            </div>

            <div className="space-y-3">
              {/* Service */}
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Layanan</p>
                  <p className="text-base text-gray-900">
                    {order.items[0]?.service?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.items[0]?.service?.category}
                  </p>
                </div>
              </div>

              {/* Technician */}
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Teknisi</p>
                  <p className="text-base text-gray-900">
                    {order.technician?.user?.name}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Kontak Teknisi
                  </p>
                  <p className="text-base text-gray-900">
                    {order.technician?.user?.phone || '-'}
                  </p>
                </div>
              </div>

              {/* Total - Show only if technician has set price */}
              {order.status === 'IN_PROGRESS' ? (
                <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3">
                  <DollarSign className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-700">
                      Total Pembayaran
                    </p>
                    <p className="text-lg font-bold text-amber-600">
                      Menunggu Teknisi
                    </p>
                    <p className="mt-1 text-xs text-amber-600">
                      Teknisi akan menentukan harga setelah diagnosa
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                  <DollarSign className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      Total Pembayaran
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions - Show different message based on status */}
            {order.status === 'IN_PROGRESS' ? (
              <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
                <h3 className="mb-1 text-sm font-semibold text-purple-900">
                  Pesanan Sedang Diproses
                </h3>
                <ol className="list-inside list-decimal space-y-0.5 text-xs text-purple-800">
                  <li>Teknisi akan mendiagnosa perangkat Anda</li>
                  <li>Setelah diagnosa, teknisi akan menentukan harga final</li>
                  <li>Anda akan diberitahu saat harga sudah ditentukan</li>
                </ol>
              </div>
            ) : order.status === 'PENDING_PAYMENT' ? (
              <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <h3 className="mb-1 text-sm font-semibold text-yellow-900">
                  Instruksi Pembayaran
                </h3>
                <ol className="list-inside list-decimal space-y-0.5 text-xs text-yellow-800">
                  <li>Teknisi sudah menentukan harga final</li>
                  <li>Silakan lakukan pembayaran via transfer atau tunai</li>
                  <li>Admin akan mengkonfirmasi pembayaran Anda</li>
                </ol>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                <h3 className="mb-1 text-sm font-semibold text-green-900">
                  Status Pesanan
                </h3>
                <p className="text-xs text-green-800">
                  {order.status === 'PAID' &&
                    'Pembayaran terkonfirmasi. Pesanan akan segera diselesaikan.'}
                  {order.status === 'COMPLETED' &&
                    'Pesanan telah selesai. Terima kasih!'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/dashboard/customer/orders"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Lihat Pesanan Saya
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/teknisi"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Booking Lagi
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
