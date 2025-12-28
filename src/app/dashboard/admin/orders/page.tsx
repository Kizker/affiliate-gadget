'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Package,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  user: {
    name: string | null
    email: string
    phone: string | null
  }
  items: Array<{
    id: string
    quantity: number
    rentalDays?: number
    price: number
    product?: {
      name: string
      images: string[]
    }
    service?: {
      name: string
    }
    rentalItem?: {
      name: string
      images: string[]
    }
  }>
}

const statusColors = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PAID: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-700 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
}

const statusLabels = {
  PENDING_PAYMENT: 'Menunggu Pembayaran',
  PAID: 'Dibayar',
  IN_PROGRESS: 'Sedang Dikerjakan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

export default function AdminOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [filter, setFilter] = useState<
    'all' | 'service' | 'sparepart' | 'rental'
  >('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, statusFilter, searchQuery])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setPage(1) // Reset to first page on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const fetchOrders = async () => {
    try {
      // Only show full loading on initial load
      if (orders.length === 0) {
        setLoading(true)
      } else {
        setSearchLoading(true)
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(filter !== 'all' && { type: filter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })

      const res = await fetch(`/api/admin/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: 'Status pesanan berhasil diupdate',
        })
        fetchOrders()
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal update status',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  const getOrderType = (order: Order) => {
    const hasProduct = order.items.some((item) => item.product)
    const hasRental = order.items.some((item) => item.rentalItem)
    if (hasProduct) return 'Sparepart'
    if (hasRental) return 'Rental'
    return 'Service'
  }

  const handleFilterChange = (
    newFilter: 'all' | 'service' | 'sparepart' | 'rental'
  ) => {
    setFilter(newFilter)
    setPage(1)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    setPage(1)
  }

  // Pagination helpers
  const startIndex = (page - 1) * limit + 1
  const endIndex = Math.min(page * limit, total)

  if (loading && page === 1) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">🛒 Kelola Pesanan</h1>
            <p className="mt-2 text-blue-100">
              Kelola semua pesanan service dan sparepart
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm">
              <p className="text-sm font-medium">Total Orders</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {searchLoading && (
        <div className="fixed right-4 top-20 z-50 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Mencari...
        </div>
      )}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari nomor pesanan, nama, atau email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        {/* Filter by Type */}
        <div className="w-auto">
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">
            Tipe
          </label>
          <select
            value={filter}
            onChange={(e) =>
              handleFilterChange(
                e.target.value as 'all' | 'service' | 'sparepart' | 'rental'
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">Semua Tipe</option>
            <option value="service">Service</option>
            <option value="sparepart">Sparepart</option>
            <option value="rental">Rental</option>
          </select>
        </div>

        {/* Filter by Status */}
        <div className="w-auto">
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">Semua Status</option>
            <option value="PENDING_PAYMENT">Menunggu Pembayaran</option>
            <option value="PAID">Dibayar</option>
            <option value="IN_PROGRESS">Sedang Dikerjakan</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Results Counter */}
      {total > 0 && (
        <div className="text-sm text-gray-600">
          Menampilkan {startIndex}-{endIndex} dari {total} pesanan
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <p className="text-xl font-medium text-gray-600">
              {searchQuery
                ? 'Tidak ada pesanan yang cocok'
                : 'Belum ada pesanan'}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg"
            >
              <div className="p-4">
                {/* Order Header */}
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {order.orderNumber}
                      </h3>
                      <span className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-2.5 py-0.5 text-xs font-bold text-white">
                        {getOrderType(order)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <User className="h-3.5 w-3.5" />
                      <p className="text-sm font-medium">
                        {order.user.name || order.user.email}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString('id-ID', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-600">
                      Total Pembayaran
                    </p>
                    <p className="text-xl font-bold text-blue-600">
                      Rp {order.total.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Detail Pesanan
                  </h4>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 p-3"
                    >
                      {(item.product?.images[0] ||
                        item.rentalItem?.images[0]) && (
                        <img
                          src={
                            item.product?.images[0] ||
                            item.rentalItem?.images[0]
                          }
                          alt={
                            item.product?.name ||
                            item.rentalItem?.name ||
                            'Item'
                          }
                          className="h-12 w-12 rounded-md object-cover shadow-sm"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.product?.name ||
                            item.service?.name ||
                            item.rentalItem?.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.rentalItem ? (
                            <>
                              {item.rentalDays} hari x Rp{' '}
                              {item.price.toLocaleString('id-ID')}/hari
                            </>
                          ) : (
                            <>
                              {item.quantity} x Rp{' '}
                              {item.price.toLocaleString('id-ID')}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">
                          Rp{' '}
                          {item.rentalItem
                            ? (
                                item.price * (item.rentalDays || 1)
                              ).toLocaleString('id-ID')
                            : (item.price * item.quantity).toLocaleString(
                                'id-ID'
                              )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full border-2 px-3 py-1 text-xs font-bold ${
                      statusColors[order.status as keyof typeof statusColors]
                    }`}
                  >
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </span>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {order.status === 'PENDING_PAYMENT' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PAID')}
                        disabled={updating === order.id}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:shadow-lg disabled:opacity-50"
                      >
                        {updating === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Konfirmasi Bayar'
                        )}
                      </button>
                    )}
                    {/* Only for SPAREPART and RENTAL orders */}
                    {order.status === 'PAID' &&
                      (getOrderType(order) === 'Sparepart' ||
                        getOrderType(order) === 'Rental') && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, 'IN_PROGRESS')
                          }
                          disabled={updating === order.id}
                          className="rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-purple-200 transition-all hover:shadow-lg disabled:opacity-50"
                        >
                          Mulai Proses
                        </button>
                      )}
                    {/* Only for SPAREPART and RENTAL orders */}
                    {order.status === 'IN_PROGRESS' &&
                      (getOrderType(order) === 'Sparepart' ||
                        getOrderType(order) === 'Rental') && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, 'COMPLETED')
                          }
                          disabled={updating === order.id}
                          className="rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-green-200 transition-all hover:shadow-lg disabled:opacity-50"
                        >
                          <CheckCircle className="mr-1 inline h-4 w-4" />
                          Selesaikan
                        </button>
                      )}

                    {/* For SERVICE orders, show info */}
                    {getOrderType(order) === 'Service' &&
                      order.status !== 'PENDING_PAYMENT' &&
                      order.status !== 'CANCELLED' &&
                      order.status !== 'COMPLETED' && (
                        <div className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700">
                          Status dikontrol oleh teknisi
                        </div>
                      )}
                    {order.status !== 'CANCELLED' &&
                      order.status !== 'COMPLETED' && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, 'CANCELLED')
                          }
                          disabled={updating === order.id}
                          className="rounded-lg border-2 border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle className="mr-1 inline h-4 w-4" />
                          Batalkan
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="mt-8 flex items-center justify-center gap-2 px-4">
          {/* Previous Button */}
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page Numbers */}
          <div className="flex gap-1 sm:gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all sm:px-4 ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <Toaster />
    </div>
  )
}
