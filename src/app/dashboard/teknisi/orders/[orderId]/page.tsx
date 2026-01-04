'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  User,
  Phone,
  Calendar,
  CreditCard,
  AlertCircle,
  MessageSquare,
  Wrench,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  notes: string | null
  items: Array<{
    id: string
    quantity: number
    price: number
    subtotal: number
    finalPrice?: number | null
    service?: {
      name: string
      category: string
      minPrice?: number | null
      maxPrice?: number | null
    }
    product?: {
      name: string
      images: string[]
    }
    rentalItem?: {
      name: string
      images: string[]
    }
  }>
  user: {
    name: string
    email: string
    phone: string | null
    image: string | null
  }
}

const statusConfig = {
  IN_PROGRESS: {
    label: 'Sedang Dikerjakan',
    color: 'bg-purple-100 text-purple-800',
    borderColor: 'border-purple-200',
    icon: Wrench,
    description: 'Teknisi sedang mengerjakan dan menentukan harga',
    step: 1,
  },
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    color: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-yellow-200',
    icon: Clock,
    description: 'Customer belum melakukan pembayaran',
    step: 2,
  },
  PAID: {
    label: 'Dibayar',
    color: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-200',
    icon: CreditCard,
    description: 'Pembayaran terkonfirmasi',
    step: 3,
  },
  COMPLETED: {
    label: 'Selesai',
    color: 'bg-green-100 text-green-800',
    borderColor: 'border-green-200',
    icon: CheckCircle,
    description: 'Pesanan telah selesai',
    step: 4,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'bg-red-100 text-red-800',
    borderColor: 'border-red-200',
    icon: XCircle,
    description: 'Pesanan dibatalkan',
    step: 0,
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = use(params)
  const { status: sessionStatus } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [finalPriceInput, setFinalPriceInput] = useState('')
  const [settingFinalPrice, setSettingFinalPrice] = useState(false)

  const fetchOrderDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)
      } else {
        toast({
          title: 'Gagal memuat pesanan',
          description: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses',
          variant: 'destructive',
        })
        router.push('/dashboard/teknisi/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId, router, toast])

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login')
    } else if (sessionStatus === 'authenticated') {
      fetchOrderDetail()
    }
  }, [sessionStatus, router, fetchOrderDetail])

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
        toast({
          title: 'Status Diperbarui',
          description: `Status pesanan berhasil diubah menjadi ${statusConfig[newStatus as keyof typeof statusConfig]?.label}`,
        })
      } else {
        throw new Error('Failed to update')
      }
    } catch {
      toast({
        title: 'Gagal memuat detail pesanan',
        description: 'Terjadi kesalahan saat memuat data pesanan',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSetFinalPrice = async () => {
    if (!finalPriceInput) return

    const price = parseFloat(finalPriceInput)
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Harga tidak valid',
        description: 'Masukkan harga yang valid',
        variant: 'destructive',
      })
      return
    }

    setSettingFinalPrice(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalPrice: price }),
      })

      if (res.ok) {
        await res.json()
        // Refresh order data
        fetchOrderDetail()
        toast({
          title: 'Harga Final Disimpan',
          description: `Harga final ${formatCurrency(price)} berhasil disimpan`,
        })
        setFinalPriceInput('')
      } else {
        throw new Error('Failed to set price')
      }
    } catch {
      toast({
        title: 'Gagal menyimpan harga',
        description: 'Terjadi kesalahan saat menyimpan harga final',
        variant: 'destructive',
      })
    } finally {
      setSettingFinalPrice(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent text-indigo-600 shadow-lg"></div>
          <p className="animate-pulse font-medium text-indigo-600">
            Memuat detail pesanan...
          </p>
        </div>
      </div>
    )
  }

  if (!order) return null

  const currentStatus = statusConfig[order.status as keyof typeof statusConfig]

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Elements */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-blue-100/50 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[500px] w-[500px] rounded-full bg-indigo-100/40 blur-[100px]" />
      </div>

      <Navbar variant="light" />

      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 mx-auto min-h-screen max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8"
      >
        {/* Breadcrumb & Navigation */}
        <motion.div
          variants={itemVariants}
          className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Link
              href="/dashboard/teknisi"
              className="group mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-all group-hover:bg-indigo-50 group-hover:text-indigo-600">
                <ArrowLeft className="h-4 w-4" />
              </div>
              Kembali ke Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Detail Pesanan{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                #{order.orderNumber}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold shadow-sm ${currentStatus.color} ${currentStatus.borderColor} bg-opacity-50 backdrop-blur-md`}
            >
              <currentStatus.icon className="h-4 w-4" />
              {currentStatus.label}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Status Card */}
            <motion.div
              variants={itemVariants}
              className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/60 shadow-xl shadow-indigo-100/20 backdrop-blur-xl"
            >
              <div className="border-b border-indigo-50/50 px-6 py-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Clock className="h-5 w-5 text-indigo-500" /> Timeline Status
                </h3>
              </div>
              <div className="p-6">
                <div className="relative">
                  {/* Progress Bar Background */}
                  <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-slate-100"></div>

                  {/* Active Progress */}
                  {order.status !== 'CANCELLED' && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((Math.max(1, currentStatus.step) - 1) / 3) * 100}%`,
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    />
                  )}

                  <div className="relative z-10 flex justify-between">
                    {[
                      'IN_PROGRESS',
                      'PENDING_PAYMENT',
                      'PAID',
                      'COMPLETED',
                    ].map((stepStatus) => {
                      const config =
                        statusConfig[stepStatus as keyof typeof statusConfig]
                      const isActive = order.status === stepStatus
                      const isPast =
                        statusConfig[order.status as keyof typeof statusConfig]
                          ?.step > config.step
                      const isCancelled = order.status === 'CANCELLED'

                      if (isCancelled) return null // Hide normal steps if cancelled, or handle differently

                      return (
                        <div
                          key={stepStatus}
                          className="flex flex-col items-center gap-3"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-4 transition-all duration-500 ${
                              isActive || isPast
                                ? 'border-indigo-100 bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'border-white bg-slate-100 text-slate-400'
                            }`}
                          >
                            <config.icon className="h-4 w-4" />
                          </div>
                          <span
                            className={`text-xs font-bold transition-colors duration-300 ${isActive || isPast ? 'text-indigo-900' : 'text-slate-400'}`}
                          >
                            {config.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {order.status === 'CANCELLED' && (
                  <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-red-50 p-4 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">
                      Pesanan ini telah dibatalkan
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Items Card */}
            <motion.div
              variants={itemVariants}
              className="overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 shadow-xl shadow-indigo-100/20 backdrop-blur-xl"
            >
              <div className="border-b border-indigo-50/50 p-8">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Package className="h-5 w-5 text-indigo-500" /> Detail Layanan
                </h3>
              </div>
              <div className="divide-y divide-indigo-50/50">
                {order.items.map((item) => (
                  <div key={item.id} className="p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-indigo-600 shadow-sm">
                        {item.service ? (
                          <Wrench className="h-8 w-8" />
                        ) : (
                          <Package className="h-8 w-8" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-slate-900">
                          {item.service?.name ||
                            item.product?.name ||
                            item.rentalItem?.name}
                        </h4>
                        <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
                          {item.service?.category?.replace(/_/g, ' ') ||
                            'Produk/Rental'}
                        </p>

                        {/* Price Range Info */}
                        {item.service && (
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-slate-500">
                                Kisaran Harga:
                              </span>
                              <span className="font-semibold text-slate-700">
                                {item.service.minPrice && item.service.maxPrice
                                  ? `${formatCurrency(item.service.minPrice)} - ${formatCurrency(item.service.maxPrice)}`
                                  : item.service.minPrice
                                    ? `Mulai ${formatCurrency(item.service.minPrice)}`
                                    : formatCurrency(item.price)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-slate-500">
                                Harga Final:
                              </span>
                              {item.finalPrice ? (
                                <span className="font-bold text-emerald-600">
                                  {formatCurrency(item.finalPrice)}
                                </span>
                              ) : (
                                <span className="font-medium text-amber-600">
                                  Belum ditentukan
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-right">
                          <p className="text-sm text-slate-500">
                            x {item.quantity}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Notes inside Detail Layanan */}
              {order.notes && (
                <div className="border-t border-indigo-50/50 bg-amber-50/50 p-8">
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-amber-800">
                    <AlertCircle className="h-4 w-4" /> Catatan Customer
                  </h4>
                  <p className="text-sm italic leading-relaxed text-amber-900/80">
                    "{order.notes}"
                  </p>
                </div>
              )}

              {/* Total */}
              <div className="bg-slate-50/50 p-8">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-slate-700">Total Biaya</span>
                  {order.status === 'IN_PROGRESS' &&
                  !order.items.some((i) => i.finalPrice) ? (
                    <span className="text-amber-600">Menunggu harga final</span>
                  ) : (
                    <span className="text-indigo-600">
                      {formatCurrency(order.total)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6 lg:col-span-1">
            {/* Actions / Status Update - FIRST */}
            {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
              <motion.div
                variants={itemVariants}
                className="rounded-[2.5rem] border border-white/60 bg-white/60 p-8 shadow-xl shadow-indigo-100/20 backdrop-blur-xl"
              >
                <h3 className="mb-4 font-bold text-slate-900">Update Status</h3>
                <div className="space-y-3">
                  {order.status === 'PENDING_PAYMENT' && (
                    <div className="rounded-xl bg-yellow-50 p-4 text-center text-sm font-medium text-yellow-800">
                      Menunggu pembayaran customer. Status akan berubah otomatis
                      setelah dibayar.
                    </div>
                  )}

                  {order.status === 'IN_PROGRESS' && (
                    <>
                      {/* Final Price Section */}
                      <div className="rounded-xl bg-indigo-50 p-4">
                        <label className="mb-2 block text-sm font-semibold text-indigo-800">
                          Harga Final
                        </label>

                        {/* Check if final price is already set */}
                        {order.items.some((i) => i.finalPrice) ? (
                          // Price already set - show plain display
                          <div className="p-1">
                            <p className="text-2xl font-bold text-indigo-900">
                              {formatCurrency(
                                order.items.find((i) => i.finalPrice)
                                  ?.finalPrice || 0
                              )}
                            </p>
                            <p className="mt-1 text-xs font-medium text-emerald-600">
                              ✓ Harga final sudah ditentukan
                            </p>
                          </div>
                        ) : (
                          // Price not set - show input with save button
                          <>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-indigo-400">
                                  Rp
                                </span>
                                <input
                                  type="number"
                                  className="w-full rounded-lg border border-indigo-200 bg-white py-3 pl-9 pr-3 text-lg font-bold text-indigo-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                  placeholder="Masukkan harga"
                                  value={finalPriceInput}
                                  onChange={(e) =>
                                    setFinalPriceInput(e.target.value)
                                  }
                                />
                              </div>
                              <button
                                onClick={handleSetFinalPrice}
                                disabled={settingFinalPrice || !finalPriceInput}
                                className="rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {settingFinalPrice ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  'Simpan'
                                )}
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-indigo-600">
                              Simpan harga terlebih dahulu, lalu request
                              pembayaran ke SuperAdmin
                            </p>
                          </>
                        )}
                      </div>

                      {/* Request Pembayaran Button - Only show after price is set */}
                      {order.items.some((i) => i.finalPrice) && (
                        <button
                          onClick={() => handleStatusUpdate('PENDING_PAYMENT')}
                          disabled={updatingStatus}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 font-bold text-white shadow-lg shadow-cyan-200 transition-all hover:shadow-xl active:scale-95 disabled:opacity-70"
                        >
                          {updatingStatus ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <CreditCard className="h-5 w-5" />
                          )}
                          Request Pembayaran
                        </button>
                      )}
                    </>
                  )}

                  {order.status === 'PENDING_PAYMENT' && (
                    <div className="rounded-xl bg-cyan-50 p-4 text-center">
                      <Clock className="mx-auto h-8 w-8 text-cyan-500" />
                      <p className="mt-2 font-semibold text-cyan-700">
                        Menunggu Konfirmasi SuperAdmin
                      </p>
                      <p className="mt-1 text-xs text-cyan-600">
                        Request pembayaran terkirim. SuperAdmin akan
                        mengkonfirmasi pembayaran.
                      </p>
                    </div>
                  )}

                  {order.status === 'PAID' && (
                    <button
                      onClick={() => handleStatusUpdate('COMPLETED')}
                      disabled={updatingStatus}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:shadow-xl active:scale-95 disabled:opacity-70"
                    >
                      {updatingStatus ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                      Selesaikan Pesanan
                    </button>
                  )}

                  <button
                    onClick={() => handleStatusUpdate('CANCELLED')}
                    disabled={updatingStatus || order.status === 'COMPLETED'}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    Batalkan Pesanan
                  </button>
                </div>
              </motion.div>
            )}

            {/* Customer Card - NOW SECOND */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/60 shadow-xl shadow-indigo-100/20 backdrop-blur-xl"
            >
              <div className="absolute top-0 h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
              <div className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  {order.user.image ? (
                    <Image
                      src={order.user.image}
                      alt={order.user.name}
                      width={64}
                      height={64}
                      className="rounded-2xl border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 shadow-inner">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">Customer</p>
                    <h3 className="text-lg font-bold text-slate-900">
                      {order.user.name}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-white hover:shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        Telepon/WhatsApp
                      </p>
                      <a
                        href={`https://wa.me/${order.user.phone?.replace(/^0/, '62')}`}
                        target="_blank"
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600"
                      >
                        {order.user.phone || '-'}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-white hover:shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        Tanggal Pesanan
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl active:scale-95">
                  <MessageSquare className="h-4 w-4" />
                  Hubungi Customer
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.main>

      <Footer variant="light" />
    </div>
  )
}
