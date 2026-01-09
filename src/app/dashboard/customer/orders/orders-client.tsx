'use client'

import { useState } from 'react'
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
  AlertTriangle,
  Check,
} from 'lucide-react'
import { RatingModal } from '@/components/modals/rating-modal'
import { ComplaintModal } from '@/components/customer/complaint-modal'

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
  completedAt?: string
  customerConfirmedAt?: string
  complaints?: Array<{
    id: string
    status: string
    subject: string
    description: string
    images: string[]
    resolution: string | null
    rejectionNote: string | null
    createdAt: string
    resolvedAt: string | null
    assignedTo?: {
      name: string
      email: string
    } | null
  }>
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
  COMPLAINED: {
    label: 'Dikomplain',
    color: 'bg-orange-100 text-orange-800',
    icon: AlertTriangle,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
}

interface OrdersClientProps {
  initialOrders: Order[]
}

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [loading, setLoading] = useState(false) // Start as false since we have initial data
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean
    orderId: string
    orderNumber: string
    existingRating?: number
    existingComment?: string
  }>({ isOpen: false, orderId: '', orderNumber: '' })
  const [complaintModal, setComplaintModal] = useState<{
    isOpen: boolean
    orderId: string
    orderNumber: string
  }>({ isOpen: false, orderId: '', orderNumber: '' })
  const [complaintDetailModal, setComplaintDetailModal] = useState<{
    isOpen: boolean
    complaint: {
      id: string
      status: string
      subject: string
      description: string
      images: string[]
      resolution: string | null
      rejectionNote: string | null
      createdAt: string
      resolvedAt: string | null
      assignedTo?: { name: string; email: string } | null
    } | null
  }>({ isOpen: false, complaint: null })
  const [confirmLoading, setConfirmLoading] = useState<string | null>(null)

  const handleConfirmOrder = async (orderId: string) => {
    setConfirmLoading(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
      })
      if (res.ok) {
        refreshOrders()
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal mengkonfirmasi pesanan')
      }
    } catch (error) {
      console.error('Error confirming order:', error)
      alert('Terjadi kesalahan')
    } finally {
      setConfirmLoading(null)
    }
  }

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

  // Refresh function for after actions (rating, complaint, etc)
  const refreshOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const ordersWithReviews = data.orders.map(
          (
            order: Order & {
              reviews?: Array<{ rating: number; comment: string | null }>
            }
          ) => ({
            ...order,
            review: order.reviews?.[0] || null,
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
                          {/* Completed order actions - based on customerConfirmedAt */}
                          {order.status === 'COMPLETED' &&
                            (() => {
                              const isConfirmed = !!order.customerConfirmedAt
                              const completedDate = order.completedAt
                                ? new Date(order.completedAt)
                                : new Date(order.createdAt)
                              const daysSinceCompleted = Math.floor(
                                (Date.now() - completedDate.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                              const canComplain =
                                !isConfirmed &&
                                daysSinceCompleted <= 7 &&
                                !order.complaints?.some((c) =>
                                  ['OPEN', 'IN_PROGRESS'].includes(c.status)
                                ) &&
                                order.items[0]?.type !== 'RENTAL' // No complaints for rental orders

                              return (
                                <>
                                  {/* Before confirmation: Show Selesai + Komplain buttons */}
                                  {!isConfirmed && (
                                    <>
                                      {/* Selesai (Confirm) button */}
                                      <button
                                        onClick={() =>
                                          handleConfirmOrder(order.id)
                                        }
                                        disabled={confirmLoading === order.id}
                                        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
                                      >
                                        {confirmLoading === order.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Check className="h-4 w-4" />
                                        )}
                                        <span className="hidden sm:inline">
                                          Selesai
                                        </span>
                                      </button>

                                      {/* Komplain button - only if within 7 days and no active complaints */}
                                      {canComplain && (
                                        <button
                                          onClick={() =>
                                            setComplaintModal({
                                              isOpen: true,
                                              orderId: order.id,
                                              orderNumber: order.orderNumber,
                                            })
                                          }
                                          className="flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 sm:px-4 sm:py-2 sm:text-sm"
                                        >
                                          <AlertTriangle className="h-4 w-4" />
                                          <span className="hidden sm:inline">
                                            Komplain
                                          </span>
                                        </button>
                                      )}
                                    </>
                                  )}

                                  {/* After confirmation: Show Rating button */}
                                  {isConfirmed && (
                                    <>
                                      {order.review ? (
                                        <button
                                          onClick={() =>
                                            setRatingModal({
                                              isOpen: true,
                                              orderId: order.id,
                                              orderNumber: order.orderNumber,
                                              existingRating:
                                                order.review?.rating,
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
                                          className="flex items-center gap-1 rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 sm:px-4 sm:py-2 sm:text-sm"
                                        >
                                          <Star className="h-4 w-4" />
                                          <span className="hidden sm:inline">
                                            Beri Rating
                                          </span>
                                        </button>
                                      )}
                                    </>
                                  )}
                                </>
                              )
                            })()}

                          {/* COMPLAINED status - Show status OR detail button */}
                          {order.status === 'COMPLAINED' &&
                            order.complaints?.[0] &&
                            (() => {
                              const complaint = order.complaints[0]
                              const hasResponse =
                                complaint.status === 'RESOLVED' ||
                                complaint.status === 'REJECTED' ||
                                complaint.resolution ||
                                complaint.rejectionNote
                              const isInProgress =
                                complaint.status === 'IN_PROGRESS'

                              // If NO response yet - show waiting indicator only
                              if (!hasResponse) {
                                return (
                                  <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 sm:px-4 sm:py-2 sm:text-sm">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                      {isInProgress
                                        ? 'Sedang Ditangani'
                                        : 'Menunggu Tanggapan'}
                                    </span>
                                    <span className="sm:hidden">
                                      {isInProgress ? 'Proses' : 'Menunggu'}
                                    </span>
                                  </div>
                                )
                              }

                              // If HAS response - show Lihat Detail button
                              return (
                                <button
                                  onClick={() =>
                                    setComplaintDetailModal({
                                      isOpen: true,
                                      complaint,
                                    })
                                  }
                                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium sm:px-4 sm:py-2 sm:text-sm ${
                                    complaint.status === 'RESOLVED'
                                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                                  }`}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  <span>Lihat Detail</span>
                                </button>
                              )
                            })()}
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
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      (room: any) =>
                                        room.type === 'technician' &&
                                        room.technician?.id === technicianId
                                    )

                                    if (existingRoom?.id) {
                                      router.push(`/chat/${existingRoom.id}`)
                                      return
                                    }
                                  }

                                  // Create new room with technicianId and orderId
                                  const createRes = await fetch(
                                    '/api/chat/rooms',
                                    {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        technicianId,
                                        orderId: order.id, // Include orderId for order reference
                                      }),
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
                            href={
                              order.items[0]?.type === 'RENTAL'
                                ? `/order-confirmation/rental/${order.id}`
                                : order.items[0]?.type === 'PRODUCT'
                                  ? `/dashboard/customer/orders/${order.id}`
                                  : `/booking-confirmation/${order.id}`
                            }
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
        onSuccess={refreshOrders}
      />

      <ComplaintModal
        isOpen={complaintModal.isOpen}
        onClose={() =>
          setComplaintModal({ isOpen: false, orderId: '', orderNumber: '' })
        }
        orderId={complaintModal.orderId}
        orderNumber={complaintModal.orderNumber}
        onSuccess={refreshOrders}
      />

      {/* Complaint Detail Modal */}
      {complaintDetailModal.isOpen && complaintDetailModal.complaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() =>
                setComplaintDetailModal({ isOpen: false, complaint: null })
              }
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>

            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Detail Komplain
            </h2>

            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    complaintDetailModal.complaint.status === 'RESOLVED'
                      ? 'bg-green-100 text-green-700'
                      : complaintDetailModal.complaint.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : complaintDetailModal.complaint.status ===
                            'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {complaintDetailModal.complaint.status === 'RESOLVED'
                    ? 'Selesai'
                    : complaintDetailModal.complaint.status === 'REJECTED'
                      ? 'Ditolak'
                      : complaintDetailModal.complaint.status === 'IN_PROGRESS'
                        ? 'Sedang Ditangani'
                        : 'Menunggu'}
                </span>
              </div>

              {/* Subject */}
              <div>
                <p className="text-xs font-medium text-gray-500">Subjek</p>
                <p className="font-semibold text-gray-900">
                  {complaintDetailModal.complaint.subject}
                </p>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Deskripsi Masalah
                </p>
                <p className="text-sm text-gray-700">
                  {complaintDetailModal.complaint.description}
                </p>
              </div>

              {/* Tanggal Komplain */}
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Tanggal Komplain
                </p>
                <p className="text-sm text-gray-700">
                  {new Date(
                    complaintDetailModal.complaint.createdAt
                  ).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Handler */}
              {complaintDetailModal.complaint.assignedTo && (
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Ditangani Oleh
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {complaintDetailModal.complaint.assignedTo.name}
                  </p>
                </div>
              )}

              {/* Resolution */}
              {complaintDetailModal.complaint.resolution && (
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-xs font-medium text-green-700">Resolusi</p>
                  <p className="mt-1 text-sm text-green-800">
                    {complaintDetailModal.complaint.resolution}
                  </p>
                  {complaintDetailModal.complaint.resolvedAt && (
                    <p className="mt-2 text-xs text-green-600">
                      Diselesaikan pada{' '}
                      {new Date(
                        complaintDetailModal.complaint.resolvedAt
                      ).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Rejection Note */}
              {complaintDetailModal.complaint.rejectionNote && (
                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs font-medium text-red-700">
                    Alasan Penolakan
                  </p>
                  <p className="mt-1 text-sm text-red-800">
                    {complaintDetailModal.complaint.rejectionNote}
                  </p>
                </div>
              )}

              {/* Images */}
              {complaintDetailModal.complaint.images.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">
                    Bukti Foto
                  </p>
                  <div className="flex gap-2 overflow-x-auto">
                    {complaintDetailModal.complaint.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Bukti ${idx + 1}`}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() =>
                setComplaintDetailModal({ isOpen: false, complaint: null })
              }
              className="mt-6 w-full rounded-xl bg-gray-100 py-3 font-semibold text-gray-700 hover:bg-gray-200"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <Footer variant="light" />
    </div>
  )
}
