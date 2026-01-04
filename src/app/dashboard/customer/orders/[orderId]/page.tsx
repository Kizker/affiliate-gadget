'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Calendar,
  Star,
  ShoppingBag,
  CreditCard,
  Copy,
  Check,
  Truck,
  ShieldCheck,
  Receipt,
} from 'lucide-react'
import { RatingModal } from '@/components/modals/rating-modal'
import { toast } from 'sonner'

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  updatedAt: string
  notes: string | null
  paymentStatus: string
  items: Array<{
    id: string
    type: string
    quantity: number
    price: number
    subtotal: number
    notes?: string | null
    service?: {
      id: string
      name: string
      category: string
    }
    product?: {
      id: string
      name: string
      slug: string
      images: string[]
    }
    rentalItem?: {
      id: string
      name: string
      slug: string
      images: string[]
    }
  }>
  review?: {
    rating: number
    comment: string | null
  } | null
}

const statusConfig: Record<
  string,
  {
    label: string
    color: string
    bgColor: string
    borderColor: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Clock,
  },
  PAID: {
    label: 'Dibayar',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: CheckCircle,
  },
  PROCESSING: {
    label: 'Diproses',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: Package,
  },
  IN_PROGRESS: {
    label: 'Sedang Dikerjakan',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: Truck,
  },
  COMPLETED: {
    label: 'Selesai',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
  },
}

export default function CustomerOrderDetailPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean
    orderId: string
    orderNumber: string
    existingRating?: number
    existingComment?: string
  }>({
    isOpen: false,
    orderId: '',
    orderNumber: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/orders/${orderId}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Pesanan tidak ditemukan')
          } else {
            setError('Gagal memuat detail pesanan')
          }
          return
        }
        const data = await res.json()
        setOrder(data.order)
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Terjadi kesalahan saat memuat pesanan')
      } finally {
        setLoading(false)
      }
    }

    if (orderId && status === 'authenticated') {
      fetchOrder()
    }
  }, [orderId, status])

  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) return 'Rp 0'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '-'
    }
  }

  const getItemImage = (item: OrderDetail['items'][0]) => {
    if (item.product?.images?.[0]) return item.product.images[0]
    if (item.rentalItem?.images?.[0]) return item.rentalItem.images[0]
    return null
  }

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber)
      setCopied(true)
      toast.success('Nomor pesanan disalin!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenRating = () => {
    if (order) {
      setRatingModal({
        isOpen: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        existingRating: order.review?.rating,
        existingComment: order.review?.comment || undefined,
      })
    }
  }

  const handleRatingSuccess = () => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => setOrder(data.order))
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar variant="light" />
        <div className="flex flex-1 flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar variant="light" />
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              {error || 'Pesanan tidak ditemukan'}
            </h2>
            <Link
              href="/dashboard/customer/orders"
              className="text-orange-600 hover:underline"
            >
              Kembali ke Pesanan Saya
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const statusInfo = statusConfig[order.status] || statusConfig.PENDING_PAYMENT

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Navbar variant="light" />

      <main className="flex-1 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30 px-4 py-8 md:py-12">
        <div className="mx-auto max-w-3xl">
          {/* Back Button */}
          <Link
            href="/dashboard/customer/orders"
            className="group mb-6 inline-flex items-center text-sm text-gray-500 transition hover:text-orange-600"
          >
            <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Kembali ke Daftar Pesanan
          </Link>

          {/* Main Receipt Card */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            {/* Top Pattern Decoration */}
            <div className="h-2 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500" />

            {/* Header Section */}
            <div className="border-b border-gray-50 p-6 md:p-8">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                    Detail Pesanan
                    <Receipt className="h-5 w-5 text-gray-400" />
                  </h1>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <div
                  className={`rounded-full border px-4 py-2 ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color} flex items-center gap-2 text-sm font-bold shadow-sm`}
                >
                  <statusInfo.icon className="h-4 w-4" />
                  {statusInfo.label}
                </div>
              </div>

              {/* Order Number & Copy */}
              <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nomor Invoice
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-gray-900">
                    {order.orderNumber}
                  </p>
                </div>
                <button
                  onClick={copyOrderNumber}
                  className="rounded-lg border border-transparent p-2 text-gray-500 shadow-sm transition hover:border-gray-200 hover:bg-white hover:text-orange-600"
                  title="Salin Nomor Pesanan"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Items Section */}
            <div className="bg-white p-6 md:p-8">
              <h3 className="mb-6 flex items-center gap-2 font-bold text-gray-900">
                <ShoppingBag className="h-5 w-5 text-orange-500" />
                Item Pesanan
              </h3>

              <div className="space-y-6">
                {order.items?.map((item) => {
                  const itemImage = getItemImage(item)
                  let itemLink = '#'
                  if (item.product?.slug)
                    itemLink = `/sparepart/${item.product.slug}`
                  if (item.rentalItem?.slug)
                    itemLink = `/sewa-alat/${item.rentalItem.slug}`

                  return (
                    <div key={item.id} className="group flex gap-4">
                      {/* Image */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shadow-sm">
                        {itemImage ? (
                          <Image
                            src={itemImage}
                            alt={
                              item.product?.name ||
                              item.service?.name ||
                              item.rentalItem?.name ||
                              'Product'
                            }
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <Package size={24} />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1 py-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link
                              href={itemLink}
                              className="block truncate pr-4 text-base font-semibold text-gray-900 transition hover:text-orange-600"
                            >
                              {item.product?.name ||
                                item.rentalItem?.name ||
                                item.service?.name ||
                                'Item'}
                            </Link>
                            <div className="mt-1 text-sm text-gray-500">
                              {item.quantity} x {formatPrice(item.price)}
                            </div>
                          </div>
                          <div className="text-base font-bold text-gray-900">
                            {formatPrice(item.subtotal)}
                          </div>
                        </div>
                        {item.notes && (
                          <p className="mt-2 inline-block rounded bg-gray-50 px-2 py-1 text-xs text-gray-500">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t border-gray-100 bg-gray-50/50 p-6 md:p-8">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
                <CreditCard className="h-5 w-5 text-green-500" />
                Rincian Pembayaran
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Produk</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Biaya Layanan</span>
                  <span className="font-medium text-green-600">Gratis</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Ongkos Kirim</span>
                  <span className="font-medium text-green-600">Gratis</span>
                </div>

                <div className="my-4 border-t border-dashed border-gray-300 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        Total Pembayaran
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.status === 'PENDING_PAYMENT'
                          ? 'Belum dibayar'
                          : 'Pembayaran Cash'}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col justify-end gap-4 border-t border-gray-100 bg-white p-6 sm:flex-row md:p-8">
              {/* Review Button */}
              {order.status === 'COMPLETED' && (
                <button
                  onClick={handleOpenRating}
                  className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold transition ${
                    order.review
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : 'bg-yellow-400 text-yellow-900 shadow-md hover:bg-yellow-500 hover:shadow-lg'
                  }`}
                >
                  <Star
                    className={`h-4 w-4 ${order.review ? 'text-gray-500' : 'text-yellow-900'}`}
                  />
                  {order.review ? 'Lihat Ulasan' : 'Beri Ulasan'}
                </button>
              )}

              {/* Chat Button (Only icon based if needed, or keeping it subtle) */}
              {order.items?.some((i) => i.type === 'SERVICE') && (
                <Link
                  href={`/dashboard/customer/chat/teknisi/${order.id}`}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-orange-100 px-6 py-3 font-bold text-orange-600 transition hover:bg-orange-50"
                >
                  Chat Teknisi
                </Link>
              )}
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-8 text-center">
            <p className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <ShieldCheck className="h-4 w-4" />
              Transaksi ini aman dan terenkripsi
            </p>
          </div>
        </div>
      </main>

      <Footer variant="light" />

      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal((prev) => ({ ...prev, isOpen: false }))}
        orderId={ratingModal.orderId}
        orderNumber={ratingModal.orderNumber}
        existingRating={ratingModal.existingRating}
        existingComment={ratingModal.existingComment}
        onSuccess={handleRatingSuccess}
      />
    </div>
  )
}
