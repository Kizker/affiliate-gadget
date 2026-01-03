'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import Link from 'next/link'
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  User,
  Calendar,
  Star,
  MessageCircle,
  ChevronDown,
  Filter,
} from 'lucide-react'
import { RatingModal } from '@/components/modals/rating-modal'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  notes: string | null
  items: Array<{
    type: string
    notes?: string | null
    service?: {
      name: string
      category: string
    }
    product?: {
      name: string
    }
    rentalItem?: {
      name: string
    }
  }>
  technician?: {
    id: string
    user: {
      name: string
      phone: string | null
      image: string | null
    }
  }
  review?: {
    rating: number
    comment: string | null
  } | null
}

const statusConfig = {
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  PAID: {
    label: 'Dibayar',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
  },
  PROCESSING: {
    label: 'Diproses',
    color: 'bg-purple-100 text-purple-800',
    icon: Package,
  },
  COMPLETED: {
    label: 'Selesai',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
}

export default function CustomerOrdersPage() {
  const { status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean
    orderId: string
    orderNumber: string
    existingRating?: number
    existingComment?: string
  }>({ isOpen: false, orderId: '', orderNumber: '' })

  // Filter options
  const filterOptions = [
    {
      value: 'ALL',
      label: 'Semua Pesanan',
      color: 'bg-gray-100 text-gray-700',
    },
    {
      value: 'PENDING_PAYMENT',
      label: 'Menunggu Pembayaran',
      color: 'bg-yellow-100 text-yellow-700',
    },
    {
      value: 'PAID',
      label: 'Sudah Dibayar',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      value: 'IN_PROGRESS',
      label: 'Sedang Diproses',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      value: 'COMPLETED',
      label: 'Selesai',
      color: 'bg-green-100 text-green-700',
    },
    {
      value: 'CANCELLED',
      label: 'Dibatalkan',
      color: 'bg-red-100 text-red-700',
    },
  ]

  // Calculate order counts for each status
  const orderCounts = {
    ALL: orders.length,
    PENDING_PAYMENT: orders.filter((o) => o.status === 'PENDING_PAYMENT')
      .length,
    PAID: orders.filter((o) => o.status === 'PAID').length,
    IN_PROGRESS: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  }

  // Filter orders based on selected status
  const filteredOrders =
    selectedStatus === 'ALL'
      ? orders
      : orders.filter((order) => order.status === selectedStatus)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status, router])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        // Fetch reviews for each order
        const ordersWithReviews = await Promise.all(
          data.orders.map(async (order: Order) => {
            if (order.status === 'COMPLETED') {
              const reviewRes = await fetch(`/api/orders/${order.id}/review`)
              if (reviewRes.ok) {
                const reviewData = await reviewRes.json()
                return { ...order, review: reviewData.review }
              }
            }
            return order
          })
        )
        setOrders(ordersWithReviews)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="container mx-auto min-h-screen flex-1 px-4 pb-8 pt-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard/customer"
              className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Pesanan Saya</h1>
            <p className="text-gray-600">
              Riwayat booking dan status pesanan Anda
            </p>
          </div>

          {/* Filter Section */}
          <div className="mb-6">
            {/* Mobile: Dropdown Menu */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-700">
                    {
                      filterOptions.find((f) => f.value === selectedStatus)
                        ?.label
                    }
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {orderCounts[selectedStatus as keyof typeof orderCounts]}
                  </span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isFilterOpen && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-lg">
                  {filterOptions.map((option) => {
                    const count =
                      orderCounts[option.value as keyof typeof orderCounts]
                    const isActive = selectedStatus === option.value

                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedStatus(option.value)
                          setIsFilterOpen(false)
                        }}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                          isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className={`font-medium ${
                            isActive ? 'text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Desktop: Tabs */}
            <div className="hidden overflow-x-auto sm:block">
              <div className="flex gap-2 pb-2">
                {filterOptions.map((option) => {
                  const count =
                    orderCounts[option.value as keyof typeof orderCounts]
                  const isActive = selectedStatus === option.value

                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedStatus(option.value)}
                      className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? 'scale-105 bg-blue-600 text-white shadow-lg'
                          : `${option.color} hover:scale-105 hover:shadow-md`
                      }`}
                    >
                      {option.label}
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                          isActive ? 'bg-blue-500' : 'bg-white/50'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-lg">
              <Package className="h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                Belum ada pesanan
              </h3>
              <p className="mt-2 text-gray-500">
                Mulai booking layanan teknisi sekarang!
              </p>
              <Link
                href="/teknisi"
                className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Cari Teknisi
              </Link>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-lg">
              <Package className="h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                Tidak ada pesanan
              </h3>
              <p className="mt-2 text-gray-500">
                Tidak ada pesanan dengan status{' '}
                {filterOptions
                  .find((f) => f.value === selectedStatus)
                  ?.label.toLowerCase()}
              </p>
              <button
                onClick={() => setSelectedStatus('ALL')}
                className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Lihat Semua Pesanan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const StatusIcon =
                  statusConfig[order.status as keyof typeof statusConfig]
                    ?.icon || Package
                const statusInfo = statusConfig[
                  order.status as keyof typeof statusConfig
                ] || {
                  label: order.status,
                  color: 'bg-gray-100 text-gray-800',
                  icon: Package,
                }

                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-xl"
                  >
                    <div className="p-4 sm:p-6">
                      {/* Header */}
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 flex-shrink-0 text-blue-600 sm:h-5 sm:w-5" />
                            <h3 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                              {order.items[0]?.product?.name ||
                                order.items[0]?.service?.name ||
                                order.items[0]?.rentalItem?.name ||
                                'Order'}
                            </h3>
                          </div>
                          <p className="mt-1 truncate text-xs text-gray-500 sm:text-sm">
                            {order.orderNumber}
                          </p>
                        </div>
                        <div
                          className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:gap-2 sm:px-3 sm:text-sm ${statusInfo.color}`}
                        >
                          <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Details Grid - Hidden on mobile */}
                      <div className="hidden gap-4 sm:grid sm:grid-cols-2">
                        {/* Technician - Only for service orders */}
                        {order.technician && (
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                              {order.technician.user.image ? (
                                <img
                                  src={order.technician.user.image}
                                  alt={order.technician.user.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Teknisi
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {order.technician.user.name}
                              </p>
                              {order.technician.user.phone && (
                                <p className="text-xs text-gray-500">
                                  {order.technician.user.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Date */}
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                            <Calendar className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">
                              Tanggal Booking
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile: Simple info */}
                      <div className="mb-3 flex items-center gap-2 text-xs text-gray-600 sm:hidden">
                        {order.technician && (
                          <>
                            <User className="h-3.5 w-3.5" />
                            <span className="truncate">
                              {order.technician.user.name}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString(
                            'id-ID',
                            { day: 'numeric', month: 'short' }
                          )}
                        </span>
                      </div>

                      {/* Notes - Hidden on mobile */}
                      {order.notes && (
                        <div className="mt-4 hidden rounded-lg bg-gray-50 p-3 sm:block">
                          <p className="text-xs font-medium text-gray-500">
                            Catatan
                          </p>
                          <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                            {order.notes}
                          </p>
                        </div>
                      )}

                      {/* Item Notes - Show each item's notes */}
                      {order.items.some((item) => item.notes) && (
                        <div className="mt-4 hidden rounded-lg bg-blue-50 p-3 sm:block">
                          <p className="text-xs font-medium text-gray-500">
                            Catatan Item
                          </p>
                          <div className="mt-2 space-y-2">
                            {order.items.map((item, idx) => {
                              if (!item.notes) return null
                              return (
                                <div
                                  key={idx}
                                  className="text-sm text-gray-700"
                                >
                                  {item.notes}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex flex-col gap-3 border-t border-gray-200 pt-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-lg font-bold text-blue-600 sm:text-xl">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {/* Rating button for completed orders */}
                          {order.status === 'COMPLETED' &&
                            (order.review ? (
                              <button
                                onClick={() =>
                                  setRatingModal({
                                    isOpen: true,
                                    orderId: order.id,
                                    orderNumber: order.orderNumber,
                                    existingRating: order.review?.rating,
                                    existingComment:
                                      order.review?.comment || '',
                                  })
                                }
                                className="flex items-center gap-1 rounded-lg border border-yellow-400 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700 hover:bg-yellow-100 sm:px-4 sm:py-2 sm:text-sm"
                              >
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {order.review.rating}
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setRatingModal({
                                    isOpen: true,
                                    orderId: order.id,
                                    orderNumber: order.orderNumber,
                                  })
                                }
                                className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 sm:px-4 sm:py-2 sm:text-sm"
                              >
                                <Star className="h-4 w-4" />
                                Beri Rating
                              </button>
                            ))}
                          {/* Chat button based on order type */}
                          {order.items[0]?.type === 'SERVICE' ? (
                            <button
                              onClick={async () => {
                                if (!order.technician?.id) {
                                  alert(
                                    'Teknisi belum ditugaskan untuk order ini'
                                  )
                                  return
                                }

                                try {
                                  const technicianId = order.technician.id

                                  // Try to get existing chat room
                                  const roomsRes =
                                    await fetch('/api/chat/rooms')
                                  if (roomsRes.ok) {
                                    const roomsData = await roomsRes.json()
                                    const existingRoom = roomsData.rooms?.find(
                                      (room: any) =>
                                        room.type === 'technician' &&
                                        room.technician?.id === technicianId
                                    )

                                    if (existingRoom?.id) {
                                      router.push(`/chat/${existingRoom.id}`)
                                      return
                                    }
                                  }

                                  // Create new room with technicianId
                                  const createRes = await fetch(
                                    '/api/chat/rooms',
                                    {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({ technicianId }),
                                    }
                                  )

                                  if (createRes.ok) {
                                    const createData = await createRes.json()
                                    if (createData.room?.id) {
                                      router.push(`/chat/${createData.room.id}`)
                                    }
                                  } else {
                                    alert('Gagal membuat chat room')
                                  }
                                } catch (error) {
                                  console.error('Error opening chat:', error)
                                  alert(
                                    'Gagal membuka chat. Silakan coba lagi.'
                                  )
                                }
                              }}
                              className="flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 sm:px-4 sm:py-2 sm:text-sm"
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                Chat Teknisi
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                window.dispatchEvent(
                                  new CustomEvent('openFloatingChat', {
                                    detail: { orderId: order.id },
                                  })
                                )
                              }}
                              className="flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 sm:px-4 sm:py-2 sm:text-sm"
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                Chat Admin
                              </span>
                            </button>
                          )}
                          <Link
                            href={`/booking-confirmation/${order.id}`}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 sm:px-4 sm:py-2 sm:text-sm"
                          >
                            Lihat Detail
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() =>
          setRatingModal({ isOpen: false, orderId: '', orderNumber: '' })
        }
        orderId={ratingModal.orderId}
        orderNumber={ratingModal.orderNumber}
        existingRating={ratingModal.existingRating}
        existingComment={ratingModal.existingComment}
        onSuccess={fetchOrders}
      />

      <Footer variant="light" />
    </div>
  )
}
