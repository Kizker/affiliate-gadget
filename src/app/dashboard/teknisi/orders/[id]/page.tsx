'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  User,
  Calendar,
  Phone,
  Mail,
  Package,
  Clock,
  CheckCircle,
  MessageCircle,
  Wrench,
  DollarSign,
  AlertTriangle,
  Send,
  XCircle,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  total: number
  subtotal: number
  tax: number
  notes: string | null
  createdAt: string
  updatedAt: string
  technicianPaymentRequestedById: string | null
  technicianPaymentRequestedAt: string | null
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    address: string | null
    city: string | null
    province: string | null
    image: string | null
  }
  items: Array<{
    id: string
    type: string
    quantity: number
    price: number
    subtotal: number
    finalPrice: number | null
    notes: string | null
    service?: {
      id: string
      name: string
      category: string
      description: string | null
    }
  }>
}

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: typeof Clock }
> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: Clock,
  },
  PAID: {
    label: 'Dibayar',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    label: 'Sedang Dikerjakan',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: Wrench,
  },
  COMPLETED: {
    label: 'Selesai',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
  },
  COMPLAINED: {
    label: 'Dikomplain',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: AlertTriangle,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
}

const stepConfig = [
  { status: 'PENDING_PAYMENT', label: 'Tentukan Harga', icon: DollarSign },
  { status: 'PAID', label: 'Dikonfirmasi', icon: CheckCircle },
  { status: 'IN_PROGRESS', label: 'Proses', icon: Wrench },
  { status: 'COMPLETED', label: 'Selesai', icon: CheckCircle },
]

export default function TechnicianOrderDetailPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [finalPrice, setFinalPrice] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/technicians/me/orders/${orderId}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        if (res.status === 404) setError('Order tidak ditemukan')
        else if (res.status === 403) setError('Anda tidak memiliki akses')
        else setError('Gagal memuat data')
        return
      }
      const data = await res.json()
      setOrder(data.order)
      setFinalPrice(data.order.total?.toString() || '')
    } catch {
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (authStatus === 'authenticated' && orderId) {
      fetchOrder()
    }
  }, [authStatus, orderId, router, fetchOrder])

  const handleSetFinalPrice = async () => {
    if (!finalPrice || isNaN(Number(finalPrice))) {
      toast.error('Masukkan harga yang valid')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/final-price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalPrice: Number(finalPrice) }),
      })

      if (res.ok) {
        toast.success('Harga final berhasil disimpan')
        fetchOrder()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan harga')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestPayment = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/technician/orders/payment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (res.ok) {
        toast.success('Permintaan pembayaran berhasil dikirim ke Super Admin')
        fetchOrder()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengirim permintaan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        toast.success(
          `Status berhasil diubah ke ${statusConfig[newStatus]?.label || newStatus}`
        )
        fetchOrder()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengubah status')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenChat = async () => {
    if (!order) return

    try {
      // Get existing chat room or create new one
      const roomsRes = await fetch('/api/chat/rooms')
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json()
        const existingRoom = roomsData.rooms?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (room: any) => room.orderId === order.id
        )

        if (existingRoom?.id) {
          router.push(`/chat/${existingRoom.id}`)
          return
        }
      }

      // Create new room with order context
      const serviceName = order.items[0]?.service?.name || 'Order'
      const createRes = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: order.user.id,
          orderId: order.id,
          initialMessage: `Chat untuk order: ${serviceName} (#${order.orderNumber})`,
        }),
      })

      if (createRes.ok) {
        const createData = await createRes.json()
        if (createData.room?.id) {
          router.push(`/chat/${createData.room.id}`)
        }
      } else {
        toast.error('Gagal membuat chat room')
      }
    } catch {
      toast.error('Gagal membuka chat')
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

  const getCurrentStep = () => {
    const statusOrder = ['PENDING_PAYMENT', 'PAID', 'IN_PROGRESS', 'COMPLETED']
    return statusOrder.indexOf(order?.status || 'PENDING_PAYMENT')
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-6 p-6">
        <Link
          href="/dashboard/teknisi"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-lg">
          <Package className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-xl font-semibold text-gray-900">{error}</h3>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[order.status] || statusConfig.PENDING_PAYMENT
  const StatusIcon = statusInfo.icon
  const currentStep = getCurrentStep()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <Link
            href="/dashboard/teknisi"
            className="inline-flex items-center gap-2 rounded-lg bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 ${statusInfo.bgColor} ${statusInfo.color}`}
          >
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">{statusInfo.label}</span>
          </div>
        </motion.div>

        {/* Order Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 text-white shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-indigo-200">Order Number</p>
              <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
              <p className="mt-2 text-indigo-100">
                {order.items[0]?.service?.name || 'Layanan'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-indigo-200">Total</p>
              <p className="text-3xl font-bold">
                {formatCurrency(order.total)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white p-6 shadow-lg"
        >
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Progress Order
          </h2>
          <div className="flex items-center justify-between">
            {stepConfig.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index <= currentStep
              const isCurrent = index === currentStep

              return (
                <div key={step.status} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                        isActive
                          ? isCurrent
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                            : 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <StepIcon className="h-6 w-6" />
                    </div>
                    <p
                      className={`mt-2 text-center text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {index < stepConfig.length - 1 && (
                    <div
                      className={`mx-2 h-1 flex-1 rounded ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Action Panel - Based on Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white p-6 shadow-lg"
        >
          <h2 className="mb-4 text-lg font-bold text-gray-900">Aksi</h2>

          {/* PENDING_PAYMENT - Set Final Price & Request Payment */}
          {order.status === 'PENDING_PAYMENT' && (
            <div className="space-y-4">
              {!order.technicianPaymentRequestedById ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Tentukan Harga Final (Total)
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          Rp
                        </span>
                        <input
                          type="number"
                          value={finalPrice}
                          onChange={(e) => setFinalPrice(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-lg font-semibold focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="0"
                        />
                      </div>
                      <button
                        onClick={handleSetFinalPrice}
                        disabled={actionLoading}
                        className="rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={handleRequestPayment}
                      disabled={actionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                      Request Konfirmasi Pembayaran ke Super Admin
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-yellow-50 p-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-800">
                      Menunggu Konfirmasi Super Admin
                    </p>
                    <p className="text-sm text-yellow-700">
                      Request dikirim{' '}
                      {order.technicianPaymentRequestedAt &&
                        formatDate(order.technicianPaymentRequestedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAID - Start Processing */}
          {order.status === 'PAID' && (
            <button
              onClick={() => handleUpdateStatus('IN_PROGRESS')}
              disabled={actionLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-4 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              <Wrench className="h-5 w-5" />
              {actionLoading ? 'Memproses...' : 'Mulai Kerjakan Order'}
            </button>
          )}

          {/* IN_PROGRESS - Complete */}
          {order.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleUpdateStatus('COMPLETED')}
              disabled={actionLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-5 w-5" />
              {actionLoading ? 'Memproses...' : 'Selesaikan Order'}
            </button>
          )}

          {/* COMPLETED */}
          {order.status === 'COMPLETED' && (
            <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Order Selesai</p>
                <p className="text-sm text-green-700">
                  Menunggu konfirmasi customer
                </p>
              </div>
            </div>
          )}

          {/* COMPLAINED */}
          {order.status === 'COMPLAINED' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-4">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-800">
                    Customer Mengajukan Komplain
                  </p>
                  <p className="text-sm text-orange-700">
                    Silakan tangani komplain di halaman komplain
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/teknisi/complaints"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700"
              >
                <FileText className="h-5 w-5" />
                Lihat Komplain
              </Link>
            </div>
          )}
        </motion.div>

        {/* Customer Info & Details Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-white p-6 shadow-lg"
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Info Customer
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
                  {order.user.image ? (
                    <img
                      src={order.user.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-7 w-7 text-indigo-600" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {order.user.name}
                  </p>
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </div>

              <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                {order.user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a
                      href={`tel:${order.user.phone}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {order.user.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <a
                    href={`mailto:${order.user.email}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {order.user.email}
                  </a>
                </div>
              </div>

              <button
                onClick={handleOpenChat}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                <MessageCircle className="h-5 w-5" />
                Chat Customer
              </button>
            </div>
          </motion.div>

          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-white p-6 shadow-lg"
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Detail Layanan
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                      <Wrench className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {item.service?.name || 'Layanan'}
                      </p>
                      {item.service?.category && (
                        <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                          {item.service.category}
                        </span>
                      )}
                      {item.notes && (
                        <p className="mt-2 text-sm text-gray-600">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.finalPrice || item.price)}
                    </p>
                  </div>
                </div>
              ))}

              {order.notes && (
                <div className="rounded-xl bg-yellow-50 p-4">
                  <p className="text-xs font-semibold text-yellow-800">
                    Catatan Customer
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">{order.notes}</p>
                </div>
              )}

              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Tanggal Order</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
