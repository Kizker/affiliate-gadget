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
  Clock,
  Wrench,
  Calendar,
  MessageCircle,
  ChevronRight,
  Mail,
  CreditCard,
  FileText,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface OrderItem {
  type: string
  quantity: number
  price: number
  subtotal: number
  finalPrice?: number
  notes?: string
  service?: {
    name: string
    category: string
    description?: string
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
  subtotal: number
  tax: number
  status: string
  notes?: string
  createdAt: string
  completedAt?: string
  items: OrderItem[]
  technician?: {
    id: string
    user: {
      name: string
      phone: string
      email?: string
      image?: string
    }
  }
  user?: {
    name: string
    phone: string
    email?: string
    address?: string
    city?: string
    province?: string
  }
}

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: typeof Clock }
> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: Clock,
  },
  PAID: {
    label: 'Sudah Dibayar',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: CreditCard,
  },
  IN_PROGRESS: {
    label: 'Sedang Dikerjakan',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: Wrench,
  },
  COMPLETED: {
    label: 'Selesai',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    icon: CheckCircle,
  },
  COMPLAINED: {
    label: 'Dikomplain',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: FileText,
  },
}

const stepConfig = [
  { status: 'PENDING_PAYMENT', label: 'Pembayaran', icon: DollarSign },
  { status: 'PAID', label: 'Dikonfirmasi', icon: CheckCircle },
  { status: 'IN_PROGRESS', label: 'Dikerjakan', icon: Wrench },
  { status: 'COMPLETED', label: 'Selesai', icon: CheckCircle },
]

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
      const res = await fetch(`/api/orders/${orderId}`, {
        cache: 'no-store',
      })
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

  const getCurrentStep = () => {
    const statusOrder = ['PENDING_PAYMENT', 'PAID', 'IN_PROGRESS', 'COMPLETED']
    return statusOrder.indexOf(order?.status || 'PENDING_PAYMENT')
  }

  const handleOpenChat = async () => {
    if (!order?.technician?.id) return

    try {
      // Get existing chat room or create new one
      const roomsRes = await fetch('/api/chat/rooms')
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json()
        const existingRoom = roomsData.rooms?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (room: any) =>
            room.orderId === order.id ||
            room.technician?.id === order.technician?.id
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
          technicianId: order.technician.id,
          orderId: order.id,
          initialMessage: `Chat untuk order: ${serviceName} (#${order.orderNumber})`,
        }),
      })

      if (createRes.ok) {
        const createData = await createRes.json()
        if (createData.room?.id) {
          router.push(`/chat/${createData.room.id}`)
        }
      }
    } catch {
      console.error('Error opening chat')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
        <Navbar variant="light" />
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <Package className="h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Pesanan tidak ditemukan
          </h2>
          <Link
            href="/dashboard/customer/orders"
            className="mt-4 text-indigo-600 hover:underline"
          >
            Kembali ke Pesanan
          </Link>
        </div>
        <Footer variant="light" />
      </div>
    )
  }

  const statusInfo = statusConfig[order.status] || statusConfig.PENDING_PAYMENT
  const StatusIcon = statusInfo.icon
  const currentStep = getCurrentStep()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <Navbar variant="light" />

      <main className="container mx-auto min-h-screen flex-1 px-4 pb-8 pt-24 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <Link
              href="/dashboard/customer/orders"
              className="inline-flex items-center gap-2 rounded-lg bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-indigo-200">Nomor Pesanan</p>
                <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
                <p className="mt-2 text-indigo-100">
                  {order.items[0]?.service?.name || 'Layanan Servis'}
                </p>
                {order.items[0]?.service?.category && (
                  <span className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                    {order.items[0].service.category}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-indigo-200">Total Pembayaran</p>
                {order.status === 'PENDING_PAYMENT' &&
                !order.items[0]?.finalPrice ? (
                  <>
                    <p className="text-2xl font-bold text-amber-300">
                      Menunggu Teknisi
                    </p>
                    <p className="mt-1 text-xs text-indigo-200">
                      Harga final akan ditentukan setelah diagnosa
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-bold">
                    {formatCurrency(order.total)}
                  </p>
                )}
                <p className="mt-1 text-sm text-indigo-200">
                  {format(new Date(order.createdAt), 'dd MMMM yyyy', {
                    locale: idLocale,
                  })}
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
              Progress Pesanan
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
                              : 'bg-emerald-500 text-white'
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
                        className={`mx-2 h-1 flex-1 rounded ${index < currentStep ? 'bg-emerald-500' : 'bg-gray-200'}`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Info Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Technician Info */}
            {order.technician && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl bg-white p-6 shadow-lg"
              >
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Info Teknisi
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
                      {order.technician.user.image ? (
                        <img
                          src={order.technician.user.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-7 w-7 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {order.technician.user.name}
                      </p>
                      <p className="text-sm text-gray-500">Teknisi</p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                    {order.technician.user.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <a
                          href={`tel:${order.technician.user.phone}`}
                          className="text-indigo-600 hover:underline"
                        >
                          {order.technician.user.phone}
                        </a>
                      </div>
                    )}
                    {order.technician.user.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">
                          {order.technician.user.email}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleOpenChat}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Chat Teknisi
                  </button>
                </div>
              </motion.div>
            )}

            {/* Order Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl bg-white p-6 shadow-lg"
            >
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Detail Layanan
              </h2>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="rounded-xl bg-gray-50 p-4">
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
                      {order.status === 'PENDING_PAYMENT' &&
                      !item.finalPrice ? (
                        <p className="text-sm font-medium text-amber-600">
                          Menunggu Teknisi
                        </p>
                      ) : (
                        <p className="font-bold text-gray-900">
                          {formatCurrency(item.finalPrice || item.price)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {order.notes && (
                  <div className="rounded-xl bg-amber-50 p-4">
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800">
                          Catatan Anda
                        </p>
                        <p className="mt-1 text-sm text-amber-700">
                          {order.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Tanggal Order</p>
                      <p className="font-medium text-gray-900">
                        {format(
                          new Date(order.createdAt),
                          'dd MMMM yyyy, HH:mm',
                          { locale: idLocale }
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pricing Summary */}
                {order.status === 'PENDING_PAYMENT' &&
                !order.items[0]?.finalPrice ? (
                  <div className="rounded-xl bg-amber-50 p-4 text-center">
                    <p className="text-sm font-medium text-amber-700">
                      Menunggu Teknisi Menentukan Harga Final
                    </p>
                    <p className="mt-1 text-xs text-amber-600">
                      Teknisi akan menentukan harga setelah diagnosa perangkat
                      Anda
                    </p>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(order.subtotal)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-gray-200 pt-2">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-lg font-bold text-indigo-600">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Status Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`rounded-2xl p-6 shadow-lg ${
              order.status === 'PENDING_PAYMENT'
                ? 'bg-amber-50'
                : order.status === 'IN_PROGRESS'
                  ? 'bg-purple-50'
                  : order.status === 'COMPLETED'
                    ? 'bg-emerald-50'
                    : 'bg-blue-50'
            }`}
          >
            {order.status === 'PENDING_PAYMENT' && (
              <>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-amber-800">
                  <Clock className="h-5 w-5" />
                  Menunggu Pembayaran
                </h3>
                <ol className="list-inside list-decimal space-y-1 text-sm text-amber-700">
                  <li>Teknisi akan menentukan harga final setelah diagnosa</li>
                  <li>
                    Silakan lakukan pembayaran sesuai total yang ditentukan
                  </li>
                  <li>Admin akan mengkonfirmasi pembayaran Anda</li>
                </ol>
              </>
            )}
            {order.status === 'PAID' && (
              <>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-blue-800">
                  <CreditCard className="h-5 w-5" />
                  Pembayaran Terkonfirmasi
                </h3>
                <p className="text-sm text-blue-700">
                  Pembayaran Anda telah dikonfirmasi. Teknisi akan segera
                  memproses pesanan Anda.
                </p>
              </>
            )}
            {order.status === 'IN_PROGRESS' && (
              <>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-purple-800">
                  <Wrench className="h-5 w-5" />
                  Sedang Dikerjakan
                </h3>
                <p className="text-sm text-purple-700">
                  Teknisi sedang mengerjakan pesanan Anda. Anda bisa menghubungi
                  teknisi via chat jika ada pertanyaan.
                </p>
              </>
            )}
            {order.status === 'COMPLETED' && (
              <>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-emerald-800">
                  <CheckCircle className="h-5 w-5" />
                  Pesanan Selesai
                </h3>
                <p className="text-sm text-emerald-700">
                  Pesanan Anda telah selesai. Silakan cek pesanan Anda dan
                  berikan rating untuk teknisi.
                </p>
              </>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/dashboard/customer/orders"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-indigo-700"
            >
              Lihat Semua Pesanan
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/teknisi"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Booking Layanan Lain
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
