'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  CheckCircle,
  Package,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Calendar,
  Copy,
  Check,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  type: string
  quantity: number
  rentalDays?: number
  price: number
  subtotal: number
  product?: {
    id: string
    name: string
    images: string[]
    price: number
  }
  rentalItem?: {
    id: string
    name: string
    images: string[]
    pricePerDay: number
    depositAmount?: number
  }
  service?: {
    name: string
    category: string
  }
}

interface Order {
  id: string
  orderNumber: string
  total: number
  subtotal: number
  status: string
  createdAt: string
  items: OrderItem[]
}

function MultipleOrderConfirmationContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchOrders = useCallback(async () => {
    const orderIds = searchParams.get('orders')?.split(',') || []
    if (orderIds.length === 0) {
      setLoading(false)
      return
    }

    try {
      const fetchedOrders: Order[] = []

      for (const orderId of orderIds) {
        const res = await fetch(`/api/orders/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.order) {
            fetchedOrders.push(data.order)
          }
        }
      }

      setOrders(fetchedOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status, router, fetchOrders])

  const currentOrder = orders[currentIndex]

  const getOrderType = (order: Order) => {
    const firstItem = order.items[0]
    if (firstItem?.product) return 'SPAREPART'
    if (firstItem?.rentalItem) return 'RENTAL'
    if (firstItem?.service) return 'SERVICE'
    return 'UNKNOWN'
  }

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'SPAREPART':
        return { label: 'Sparepart', icon: ShoppingBag, color: 'blue' }
      case 'RENTAL':
        return { label: 'Sewa Alat', icon: Calendar, color: 'purple' }
      case 'SERVICE':
        return { label: 'Jasa Service', icon: Package, color: 'green' }
      default:
        return { label: 'Pesanan', icon: Package, color: 'gray' }
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Nomor pesanan disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  const goToNext = () => {
    if (currentIndex < orders.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  if (orders.length === 0) {
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

  const orderType = getOrderType(currentOrder)
  const typeInfo = getOrderTypeLabel(orderType)
  const TypeIcon = typeInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="pb-16 pt-24">
        <div className="mx-auto max-w-2xl px-4">
          {/* Success Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Pesanan Berhasil! 🎉
            </h1>
            <p className="text-gray-600">
              {orders.length} pesanan Anda sedang diproses
            </p>
          </div>

          {/* Order Navigation */}
          {orders.length > 1 && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Sebelumnya
              </button>

              <div className="flex items-center gap-2">
                {orders.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      idx === currentIndex
                        ? 'bg-blue-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={goToNext}
                disabled={currentIndex === orders.length - 1}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Selanjutnya
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Order Counter */}
          <div className="mb-4 text-center text-sm text-gray-500">
            Pesanan {currentIndex + 1} dari {orders.length}
          </div>

          {/* Order Card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            {/* Order Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Nomor Pesanan</p>
                  <p className="font-mono text-lg font-bold text-white">
                    {currentOrder.orderNumber}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(currentOrder.orderNumber)}
                  className="rounded-lg bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
                >
                  {copied ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Order Type Badge */}
            <div className="border-b border-gray-100 p-4">
              <div
                className={`inline-flex items-center gap-2 rounded-full bg-${typeInfo.color}-100 px-3 py-1 text-sm font-medium text-${typeInfo.color}-700`}
              >
                <TypeIcon className="h-4 w-4" />
                {typeInfo.label}
              </div>
            </div>

            {/* Order Items */}
            <div className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Detail Produk
              </h3>
              <div className="space-y-3">
                {currentOrder.items.map((item) => {
                  const name =
                    item.product?.name ||
                    item.rentalItem?.name ||
                    item.service?.name ||
                    'Item'
                  const image =
                    item.product?.images?.[0] || item.rentalItem?.images?.[0]

                  return (
                    <div key={item.id} className="flex gap-3">
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{name}</p>
                        <p className="text-sm text-gray-500">
                          {item.rentalDays
                            ? `${item.rentalDays} hari sewa`
                            : `Qty: ${item.quantity}`}
                        </p>
                        <p className="font-semibold text-blue-600">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Total */}
            <div className="border-t border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Total</span>
                <span className="text-xl font-bold text-blue-600">
                  Rp {currentOrder.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Order Status */}
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-center gap-2 text-yellow-700">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Menunggu Pembayaran</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/customer/orders"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
            >
              Lihat Pesanan
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
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

export default function MultipleOrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      }
    >
      <MultipleOrderConfirmationContent />
    </Suspense>
  )
}
