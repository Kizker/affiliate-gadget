'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Package,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Hand,
  Lock,
  Unlock,
  UserCheck,
  Users,
  UserPlus,
  UserMinus,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  claimedById: string | null
  claimedAt: string | null
  claimedBy: {
    id: string
    name: string | null
    email: string
  } | null
  paymentRequestedById: string | null
  paymentRequestedAt: string | null
  paymentRequestedBy: {
    id: string
    name: string | null
    email: string
  } | null
  technicianPaymentRequestedById: string | null
  technicianPaymentRequestedAt: string | null
  technicianPaymentRequestedBy: {
    id: string
    name: string | null
    email: string
  } | null
  technician?: {
    user: {
      name: string | null
    }
  }
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

interface Stats {
  total: number
  mine: number
  unclaimed: number
  pendingPaymentRequests: number
  pendingTechnicianPaymentRequests: number
}

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PAID: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-700 border-purple-200',
  SHIPPED: 'bg-orange-100 text-orange-700 border-orange-200',
  RENTED: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  RETURNED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
}

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Menunggu Bayar',
  PAID: 'Dibayar',
  IN_PROGRESS: 'Diproses',
  SHIPPED: 'Terkirim',
  RENTED: 'Disewa',
  RETURNED: 'Dikembalikan',
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
  const [claimFilter, setClaimFilter] = useState<
    'all' | 'mine' | 'unclaimed' | 'payment_requests'
  >('mine')
  const [updating, setUpdating] = useState<string | null>(null)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [requestingPayment, setRequestingPayment] = useState<string | null>(
    null
  )
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  // Stats for tabs
  const [stats, setStats] = useState<Stats>({
    total: 0,
    mine: 0,
    unclaimed: 0,
    pendingPaymentRequests: 0,
    pendingTechnicianPaymentRequests: 0,
  })
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchOrders = useCallback(async () => {
    try {
      if (orders.length === 0) {
        setLoading(true)
      } else {
        setSearchLoading(true)
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        claim: claimFilter,
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
        setStats(data.stats || { total: 0, mine: 0, unclaimed: 0 })
        setCurrentUserId(data.currentUserId || '')
        setCurrentUserRole(data.currentUserRole || '')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }, [page, filter, statusFilter, searchQuery, claimFilter, orders.length])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const claimOrder = async (orderId: string) => {
    setClaiming(orderId)
    try {
      const res = await fetch('/api/admin/orders/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: 'Pesanan berhasil diambil',
        })
        fetchOrders()
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal mengambil pesanan',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error claiming order:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      })
    } finally {
      setClaiming(null)
    }
  }

  const unclaimOrder = async (orderId: string) => {
    setClaiming(orderId)
    try {
      const res = await fetch(`/api/admin/orders/claim?orderId=${orderId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: 'Pesanan dilepas',
        })
        fetchOrders()
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal melepas pesanan',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error unclaiming order:', error)
    } finally {
      setClaiming(null)
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
          description: 'Status pesanan diupdate',
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

  const canEditOrder = (order: Order) => {
    // SUPER_ADMIN can edit any order
    if (currentUserRole === 'SUPER_ADMIN') return true
    // ADMIN can only edit their claimed orders
    if (order.claimedById === currentUserId) return true
    // Unclaimed orders CAN be claimed (show claim button instead)
    return false
  }

  // Request payment confirmation (Admin Chat -> Super Admin)
  const requestPaymentConfirmation = async (orderId: string) => {
    setRequestingPayment(orderId)
    try {
      const res = await fetch('/api/admin/orders/payment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (res.ok) {
        toast({
          title: 'Request Terkirim',
          description:
            'Permintaan konfirmasi pembayaran sudah dikirim ke Super Admin',
        })
        fetchOrders()
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal mengirim request',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error requesting payment:', error)
    } finally {
      setRequestingPayment(null)
    }
  }

  // Approve/Reject payment request (Super Admin only)
  const handlePaymentRequest = async (
    orderId: string,
    action: 'approve' | 'reject'
  ) => {
    setUpdating(orderId)
    try {
      const res = await fetch('/api/admin/orders/payment-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      })

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description:
            action === 'approve'
              ? 'Pembayaran dikonfirmasi'
              : 'Request ditolak',
        })
        fetchOrders()
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal memproses request',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error handling payment request:', error)
    } finally {
      setUpdating(null)
    }
  }

  // Approve/Reject TECHNICIAN payment request (Super Admin only)
  const handleTechnicianPaymentRequest = async (
    orderId: string,
    action: 'approve' | 'reject'
  ) => {
    setUpdating(orderId)
    try {
      const res = await fetch('/api/technician/orders/payment-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      })

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description:
            action === 'approve'
              ? 'Pembayaran teknisi dikonfirmasi'
              : 'Request teknisi ditolak',
        })
        fetchOrders()
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal memproses request',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error handling technician payment request:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handleClaimFilterChange = (
    newFilter: 'all' | 'mine' | 'unclaimed' | 'payment_requests'
  ) => {
    setClaimFilter(newFilter)
    setPage(1)
  }

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
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">
              🛒 Kelola Pesanan
            </h1>
            <p className="mt-1 text-sm text-blue-100 lg:text-base">
              Ambil dan kelola pesanan pelanggan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white/20 px-3 py-2 backdrop-blur-sm">
              <p className="text-xs font-medium">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Filter Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-gray-100 p-1.5">
        <button
          onClick={() => handleClaimFilterChange('mine')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            claimFilter === 'mine'
              ? 'bg-white text-blue-600 shadow-md'
              : 'text-gray-600 hover:bg-white/50'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Pesanan Saya
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600">
            {stats.mine}
          </span>
        </button>
        <button
          onClick={() => handleClaimFilterChange('unclaimed')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            claimFilter === 'unclaimed'
              ? 'bg-white text-orange-600 shadow-md'
              : 'text-gray-600 hover:bg-white/50'
          }`}
        >
          <Hand className="h-4 w-4" />
          Belum Diambil
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">
            {stats.unclaimed}
          </span>
        </button>
        {currentUserRole === 'SUPER_ADMIN' && (
          <button
            onClick={() => handleClaimFilterChange('all')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              claimFilter === 'all'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <Users className="h-4 w-4" />
            Semua
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-600">
              {stats.total}
            </span>
          </button>
        )}
        {currentUserRole === 'SUPER_ADMIN' && (
          <button
            onClick={() => handleClaimFilterChange('payment_requests')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              claimFilter === 'payment_requests'
                ? 'bg-white text-green-600 shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            Konfirmasi Bayar
            {stats.pendingPaymentRequests > 0 && (
              <span className="animate-pulse rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-600">
                {stats.pendingPaymentRequests}
              </span>
            )}
          </button>
        )}
        {currentUserRole === 'SUPER_ADMIN' && (
          <button
            onClick={() =>
              handleClaimFilterChange('technician_payment_requests' as any)
            }
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              claimFilter === ('technician_payment_requests' as any)
                ? 'bg-white text-cyan-600 shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <User className="h-4 w-4" />
            Konfirmasi Bayar Teknisi
            {stats.pendingTechnicianPaymentRequests > 0 && (
              <span className="animate-pulse rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-600">
                {stats.pendingTechnicianPaymentRequests}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Search & Filters */}
      {searchLoading && (
        <div className="fixed right-4 top-20 z-50 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Mencari...
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari pesanan..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(
              e.target.value as 'all' | 'service' | 'sparepart' | 'rental'
            )
            setPage(1)
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Semua Tipe</option>
          <option value="service">Service</option>
          <option value="sparepart">Sparepart</option>
          <option value="rental">Rental</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Semua Status</option>
          <option value="PENDING_PAYMENT">Menunggu Bayar</option>
          <option value="PAID">Dibayar</option>
          <option value="IN_PROGRESS">Diproses</option>
          <option value="COMPLETED">Selesai</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
      </div>

      {/* Pagination Info */}
      {total > 0 && (
        <p className="text-sm text-gray-600">
          Menampilkan {startIndex}-{endIndex} dari {total} pesanan
        </p>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Package className="mb-4 h-16 w-16 text-gray-300" />
            <p className="text-lg font-medium">Tidak ada pesanan</p>
            <p className="text-sm">
              {claimFilter === 'mine' && 'Anda belum mengambil pesanan apapun'}
              {claimFilter === 'unclaimed' && 'Semua pesanan sudah diambil'}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${
                order.claimedById === currentUserId
                  ? 'border-blue-200'
                  : order.claimedById && order.claimedById !== currentUserId
                    ? 'border-gray-200 opacity-80'
                    : 'border-orange-200'
              }`}
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Claimed Badge */}
                  {order.claimedBy ? (
                    <div
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        order.claimedById === currentUserId
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {order.claimedById === currentUserId ? (
                        <>
                          <UserCheck className="h-3 w-3" /> Pesanan Anda
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />{' '}
                          {order.claimedBy.name || order.claimedBy.email}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                      <Unlock className="h-3 w-3" /> Belum diambil
                    </div>
                  )}
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100'}`}
                  >
                    {statusLabels[order.status] || order.status}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {getOrderType(order)}
                  </span>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-4">
                {/* Customer Info */}
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {order.user.name || order.user.email}
                  </span>
                  {order.user.phone && <span>• {order.user.phone}</span>}
                </div>

                {/* Items Preview */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map((item) => (
                    <span
                      key={item.id}
                      className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700"
                    >
                      {item.product?.name ||
                        item.service?.name ||
                        item.rentalItem?.name}
                      {item.quantity > 1 && ` (x${item.quantity})`}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-500">
                      +{order.items.length - 3} lainnya
                    </span>
                  )}
                </div>

                {/* Total & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-lg font-bold text-gray-900">
                    Rp {order.total.toLocaleString('id-ID')}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {/* Claim/Unclaim buttons - only for rental/sparepart orders (NOT service) */}
                    {!order.items.some((item) => item.service) && (
                      <>
                        {/* Show "Ambil Pesanan" if order is unclaimed */}
                        {!order.claimedById && (
                          <button
                            onClick={() => claimOrder(order.id)}
                            disabled={claiming === order.id}
                            className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
                          >
                            {claiming === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                            Ambil Pesanan
                          </button>
                        )}
                        {/* Show "Lepas" if order is claimed by current user */}
                        {order.claimedById === currentUserId && (
                          <button
                            onClick={() => unclaimOrder(order.id)}
                            disabled={claiming === order.id}
                            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {claiming === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserMinus className="h-4 w-4" />
                            )}
                            Lepas
                          </button>
                        )}
                      </>
                    )}

                    {/* Status Actions - only if can edit */}
                    {canEditOrder(order) && (
                      <>
                        {order.status === 'PENDING_PAYMENT' && (
                          <>
                            {/* ADMIN: Request konfirmasi (if not already requested) */}
                            {currentUserRole === 'ADMIN' &&
                              !order.paymentRequestedById && (
                                <button
                                  onClick={() =>
                                    requestPaymentConfirmation(order.id)
                                  }
                                  disabled={requestingPayment === order.id}
                                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                                >
                                  {requestingPayment === order.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                  Request Konfirmasi
                                </button>
                              )}
                            {/* ADMIN: Already requested indicator */}
                            {currentUserRole === 'ADMIN' &&
                              order.paymentRequestedById && (
                                <span className="flex items-center gap-1 rounded-lg bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-700">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Menunggu Approval
                                </span>
                              )}
                            {/* SUPER_ADMIN: Direct confirm or approve pending request */}
                            {currentUserRole === 'SUPER_ADMIN' && (
                              <>
                                {/* Admin Chat Payment Request */}
                                {order.paymentRequestedById ? (
                                  <>
                                    <button
                                      onClick={() =>
                                        handlePaymentRequest(
                                          order.id,
                                          'approve'
                                        )
                                      }
                                      disabled={updating === order.id}
                                      className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        handlePaymentRequest(order.id, 'reject')
                                      }
                                      disabled={updating === order.id}
                                      className="flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Tolak
                                    </button>
                                  </>
                                ) : order.technicianPaymentRequestedById ? (
                                  /* Technician Payment Request */
                                  <>
                                    <button
                                      onClick={() =>
                                        handleTechnicianPaymentRequest(
                                          order.id,
                                          'approve'
                                        )
                                      }
                                      disabled={updating === order.id}
                                      className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleTechnicianPaymentRequest(
                                          order.id,
                                          'reject'
                                        )
                                      }
                                      disabled={updating === order.id}
                                      className="flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Tolak
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, 'PAID')
                                    }
                                    disabled={updating === order.id}
                                    className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Konfirmasi Bayar
                                  </button>
                                )}
                                {/* Cancel button for all PENDING_PAYMENT orders */}
                                <button
                                  onClick={() =>
                                    updateOrderStatus(order.id, 'CANCELLED')
                                  }
                                  disabled={updating === order.id}
                                  className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Batal
                                </button>
                              </>
                            )}
                          </>
                        )}
                        {order.status === 'PAID' && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, 'IN_PROGRESS')
                            }
                            disabled={updating === order.id}
                            className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                          >
                            Proses Pesanan
                          </button>
                        )}
                        {order.status === 'IN_PROGRESS' && (
                          <>
                            {/* Check if order has rental items */}
                            {order.items.some((item) => item.rentalItem) ? (
                              <button
                                onClick={() =>
                                  updateOrderStatus(order.id, 'RENTED')
                                }
                                disabled={updating === order.id}
                                className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                              >
                                Mulai Sewa
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  updateOrderStatus(order.id, 'COMPLETED')
                                }
                                disabled={updating === order.id}
                                className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Selesaikan
                              </button>
                            )}
                          </>
                        )}
                        {order.status === 'RENTED' && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, 'RETURNED')
                            }
                            disabled={updating === order.id}
                            className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                          >
                            Tandai Kembali
                          </button>
                        )}
                        {order.status === 'RETURNED' && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, 'COMPLETED')
                            }
                            disabled={updating === order.id}
                            className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Selesaikan
                          </button>
                        )}
                      </>
                    )}

                    {/* Locked indicator for other admin's orders */}
                    {order.claimedById &&
                      order.claimedById !== currentUserId &&
                      currentUserRole !== 'SUPER_ADMIN' && (
                        <div className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">
                          <Lock className="h-4 w-4" />
                          Dikunci
                        </div>
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
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <Toaster />
    </div>
  )
}
