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
  Phone,
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  notes: string | null
  items: Array<{
    service: {
      name: string
      category: string
    }
  }>
  user: {
    name: string
    phone: string | null
    image: string | null
    email: string
  }
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
  IN_PROGRESS: {
    label: 'Sedang Dikerjakan',
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

export default function TechnicianOrdersPage() {
  const { status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status, router])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/technicians/me/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        // Update local state
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        )
      } else {
        alert('Gagal mengupdate status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Terjadi kesalahan')
    } finally {
      setUpdatingStatus(null)
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
              href="/dashboard/teknisi"
              className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Pesanan Saya</h1>
            <p className="text-gray-600">Kelola pesanan dari customer Anda</p>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-lg">
              <Package className="h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                Belum ada pesanan
              </h3>
              <p className="mt-2 text-gray-500">
                Pesanan dari customer akan muncul di sini
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
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
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 flex-shrink-0 text-blue-600" />
                            <h3 className="truncate text-lg font-bold text-gray-900">
                              {order.items[0]?.service.name}
                            </h3>
                          </div>
                          <p className="mt-1 truncate text-sm text-gray-500">
                            {order.orderNumber}
                          </p>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="mb-4 rounded-lg bg-blue-50 p-4">
                        <p className="mb-2 text-xs font-semibold text-blue-900">
                          Informasi Customer
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex items-start gap-2">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                              {order.user.image ? (
                                <img
                                  src={order.user.image}
                                  alt={order.user.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-600">
                                Nama
                              </p>
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {order.user.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone className="mt-1 h-4 w-4 flex-shrink-0 text-blue-600" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-600">
                                Telepon
                              </p>
                              <p className="truncate text-sm text-gray-900">
                                {order.user.phone || '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <div className="mb-4 rounded-lg bg-gray-50 p-3">
                          <p className="text-xs font-medium text-gray-500">
                            Catatan Customer
                          </p>
                          <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                            {order.notes}
                          </p>
                        </div>
                      )}

                      {/* Footer with Status Update */}
                      <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-xl font-bold text-blue-600">
                              {formatCurrency(order.total)}
                            </p>
                          </div>
                          <div className="hidden sm:block">
                            <p className="text-xs text-gray-500">Tanggal</p>
                            <p className="text-sm text-gray-900">
                              {new Date(order.createdAt).toLocaleDateString(
                                'id-ID',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Teknisi hanya bisa update status setelah dibayar */}
                          {order.status === 'PENDING_PAYMENT' ? (
                            <div className="rounded-lg bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-800">
                              Menunggu Konfirmasi Pembayaran
                            </div>
                          ) : (
                            <>
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleStatusUpdate(order.id, e.target.value)
                                }
                                disabled={updatingStatus === order.id}
                                className={`rounded-lg border-2 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusInfo.color} border-transparent`}
                              >
                                {/* Teknisi tidak bisa ubah ke PAID atau PENDING_PAYMENT */}
                                {order.status === 'PAID' && (
                                  <option value="PAID">Dibayar</option>
                                )}
                                <option value="IN_PROGRESS">
                                  Sedang Dikerjakan
                                </option>
                                <option value="COMPLETED">Selesai</option>
                                <option value="CANCELLED">Dibatalkan</option>
                              </select>
                              {updatingStatus === order.id && (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                              )}
                            </>
                          )}
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

      <Footer variant="light" />
    </div>
  )
}
