'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import Link from 'next/link'
import {
  CheckCircle,
  Package,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

interface OrderDetails {
  id: string
  orderNumber: string
  total: number
  subtotal: number
  status: string
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    price: number
    subtotal: number
    product?: {
      id: string
      name: string
      images: string[]
    }
  }>
}

export default function SparepartConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { status } = useSession()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    params.then((p) => setOrderId(p.orderId))
  }, [params])

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

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

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order?.orderNumber || '')
    setCopied(true)
    toast.success('Nomor pesanan disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <Package className="h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-xl font-bold text-gray-900">
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

  const productItem = order.items[0]
  const product = productItem?.product

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar variant="light" />

      <main className="flex flex-1 items-center justify-center px-4 pb-8 pt-16">
        <div className="w-full max-w-lg">
          {/* Main Receipt Card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
            {/* Header with Blue Gradient/Solid */}
            <div className="relative overflow-hidden bg-blue-600 px-6 py-8 text-center">
              <div className="absolute left-0 top-0 h-full w-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="mb-1 text-2xl font-bold text-white">
                  Pesanan Diterima!
                </h1>
                <p className="text-sm text-blue-100">
                  Terima kasih telah berbelanja di HaloTekno
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              {/* Order Number Bar */}
              <div className="group mb-6 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:border-blue-100">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Nomor Invoice
                  </p>
                  <p className="font-mono text-lg font-bold text-gray-900">
                    {order.orderNumber}
                  </p>
                </div>
                <button
                  onClick={copyOrderNumber}
                  className="rounded-lg p-2 text-gray-400 shadow-sm transition-all hover:bg-white hover:text-blue-600 hover:ring-1 hover:ring-gray-200 group-hover:shadow"
                  title="Salin Nomor Invoice"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Product Detail */}
              <div className="mb-6 flex gap-4">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                  {product?.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <h3 className="mb-1 truncate font-semibold text-gray-900">
                    {product?.name || 'Produk'}
                  </h3>
                  <p className="mb-2 text-sm text-gray-500">
                    {productItem?.quantity} barang x{' '}
                    {formatCurrency(productItem?.price || 0)}
                  </p>
                  <p className="font-bold text-blue-600">
                    {formatCurrency(productItem?.subtotal || 0)}
                  </p>
                </div>
              </div>

              {/* Divider with dots */}
              <div className="relative my-6 border-t-2 border-dashed border-gray-100">
                <div className="absolute -left-8 -top-3 h-6 w-6 rounded-full bg-gray-50"></div>
                <div className="absolute -right-8 -top-3 h-6 w-6 rounded-full bg-gray-50"></div>
              </div>

              {/* Payment Detail */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Metode Pembayaran</span>
                  <span className="font-medium text-gray-900">
                    Pembayaran Cash
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Status</span>
                  {order.status === 'PENDING_PAYMENT' ? (
                    <span className="rounded bg-yellow-50 px-2 py-1 text-xs font-bold text-yellow-700">
                      Menunggu Konfirmasi
                    </span>
                  ) : order.status === 'PROCESSING' ? (
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                      Diproses
                    </span>
                  ) : order.status === 'COMPLETED' ? (
                    <span className="rounded bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                      LUNAS
                    </span>
                  ) : (
                    <span className="rounded bg-gray-50 px-2 py-1 text-xs font-bold text-gray-700">
                      {order.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-bold text-gray-900">Total Bayar</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <Link
                  href="/sparepart"
                  className="flex items-center justify-center rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  Belanja Lagi
                </Link>
                <Link
                  href={`/dashboard/customer/orders/${order.id}`}
                  className="flex items-center justify-center rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                >
                  Lihat Pesanan
                </Link>
              </div>
            </div>

            {/* Security Footer */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <ShieldCheck className="h-3 w-3" />
                Transaksi Aman & Terenkripsi
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
