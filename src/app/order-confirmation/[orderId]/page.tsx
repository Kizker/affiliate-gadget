'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { CheckCircle, CreditCard, Loader2, ArrowRight } from 'lucide-react'

interface OrderData {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  notes: string | null
  user: {
    name: string | null
    email: string
    phone: string | null
    address: string | null
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      images: string[]
    }
  }>
}

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderData | null>(null)
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

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="flex-1 px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Success Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Pesanan Berhasil Dibuat!
            </h1>
            <p className="text-gray-600">
              Terima kasih telah berbelanja di HaloTekno
            </p>
          </div>

          {/* Order Info Card */}
          <div className="mb-4 rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <p className="text-sm text-gray-600">Nomor Pesanan</p>
                <p className="text-xl font-bold text-gray-900">
                  {order.orderNumber}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 px-4 py-2">
                <p className="text-sm font-semibold text-yellow-700">
                  Menunggu Pembayaran
                </p>
              </div>
            </div>

            {/* Product Items */}
            <div className="mb-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Detail Produk</h3>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg bg-gray-50 p-3"
                >
                  {item.product?.images?.[0] && (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {item.product?.name || 'Produk'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  Rp {order.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="mb-4 rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <CreditCard className="h-5 w-5" />
              Instruksi Pembayaran
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                  1
                </div>
                <p>
                  Transfer ke rekening BCA: <strong>1234567890</strong> a.n.
                  HaloTekno
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                  2
                </div>
                <p>
                  Masukkan jumlah:{' '}
                  <strong>Rp {order.total.toLocaleString('id-ID')}</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                  3
                </div>
                <p>
                  Konfirmasi pembayaran melalui WhatsApp atau email dengan
                  menyertakan nomor pesanan
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/customer/orders"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Lihat Pesanan Saya
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/sparepart"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Belanja Lagi
            </Link>
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
