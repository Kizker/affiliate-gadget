'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Package,
  CheckCircle2,
  Truck,
  RotateCcw,
  Loader2,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Eye,
  Gift,
  X,
  Store,
  ExternalLink,
  Copy,
  Clock,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface OrderItem {
  id: string
  quantity: number
  price: number
  productId?: string | null
  rentalItemId?: string | null
  serviceId?: string | null
  product?: {
    name: string
    images: string[]
    model?: string | null
    brand?: string | null
  } | null
  service?: {
    name: string
  } | null
  rentalItem?: {
    name: string
    images: string[]
  } | null
}

interface Order {
  id: string
  orderNumber: string
  total: number
  subtotal: number
  shippingCost: number
  insuranceFee: number
  isInsuranceMandatory: boolean
  courierCode: string | null
  courierService: string | null
  trackingNumber: string | null
  bonusChargerIncluded: boolean
  bonusProtectorIncluded: boolean
  bonusCaseIncluded: boolean
  status: string
  createdAt: string
  notes?: string | null
  user: {
    name: string | null
    email: string
    phone: string | null
    address?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
  }
  store?: {
    id: string
    name: string
    companyName: string
    city: string
  } | null
  payment?: {
    status: string
    paymentMethod: string | null
    provider: string | null
  } | null
  items: OrderItem[]
}

const statusConfig: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  PENDING_PAYMENT: {
    label: 'Belum Dibayar',
    badgeClass:
      'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80',
    dotClass: 'bg-amber-500',
  },
  PAID: {
    label: 'Perlu Diproses',
    badgeClass:
      'bg-blue-50 text-blue-800 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80',
    dotClass: 'bg-blue-500',
  },
  IN_PROGRESS: {
    label: 'Sedang Dikirim',
    badgeClass:
      'bg-orange-50 text-orange-800 border border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/80',
    dotClass: 'bg-orange-500',
  },
  COMPLETED: {
    label: 'Selesai',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
    dotClass: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    badgeClass:
      'bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/80',
    dotClass: 'bg-rose-500',
  },
}

function formatDate(dateStr: string, isFull = false) {
  try {
    const d = new Date(dateStr)
    const day = d.getDate()
    const months = isFull
      ? [
          'Januari',
          'Februari',
          'Maret',
          'April',
          'Mei',
          'Juni',
          'Juli',
          'Agustus',
          'September',
          'Oktober',
          'November',
          'Desember',
        ]
      : [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'Mei',
          'Jun',
          'Jul',
          'Agu',
          'Sep',
          'Okt',
          'Nov',
          'Des',
        ]
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day} ${month} ${year}, ${hours}.${minutes}`
  } catch {
    return dateStr
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '10')

      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()

      setOrders(data.orders || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalCount(data.pagination?.total || 0)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Gagal memuat data pesanan')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Update order status
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId)
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Gagal mengubah status pesanan')
      }

      toast.success(
        `Status pesanan berhasil diubah menjadi "${statusConfig[newStatus]?.label || newStatus}"`
      )

      // Update local state optimistically
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    } catch (error: any) {
      console.error('Error updating order:', error)
      toast.error(error.message || 'Terjadi kesalahan saat memperbarui status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCopyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber)
    setCopiedId(true)
    toast.success('Nomor order berhasil disalin!')
    setTimeout(() => setCopiedId(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      
      {/* 1. Unified Control Panel (Identik dengan Manajemen Produk) */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        
        {/* Left: Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/80 rounded-2xl dark:bg-slate-800/80 no-scrollbar">
          {[
            { id: 'ALL', label: 'Semua Status' },
            { id: 'PENDING_PAYMENT', label: 'Belum Dibayar' },
            { id: 'PAID', label: 'Perlu Diproses' },
            { id: 'IN_PROGRESS', label: 'Sedang Dikirim' },
            { id: 'COMPLETED', label: 'Selesai' },
            { id: 'CANCELLED', label: 'Dibatalkan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id)
                setPage(1)
              }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Search & Refresh */}
        <div className="flex items-center gap-2 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-72">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari no. order, customer, produk..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={fetchOrders}
            title="Muat Ulang Data"
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition shrink-0"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* 2. Orders Inventory Bento Table (Identik dengan Tabel Manajemen Produk) */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500 mb-2" />
            <p className="text-xs font-medium">Memuat data pesanan masuk...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
              <Package className="h-7 w-7 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Tidak ada pesanan yang sesuai
              </p>
              <p className="text-xs text-slate-400">
                {searchQuery
                  ? `Tidak ditemukan pesanan dengan kata kunci "${searchQuery}".`
                  : 'Belum ada transaksi pada kategori status ini.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="pb-3 px-3">Unit Gadget</th>
                  <th className="pb-3 px-3">Data Pembeli</th>
                  <th className="pb-3 px-3">Total Tagihan</th>
                  <th className="pb-3 px-3 text-center">Status Pesanan</th>
                  <th className="pb-3 px-3">Proteksi & Kurir</th>
                  <th className="pb-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {orders.map((order) => {
                  const status = statusConfig[order.status] || {
                    label: order.status,
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                    dotClass: 'bg-slate-500',
                  }

                  const firstItem = order.items?.[0]
                  const productImg =
                    firstItem?.product?.images?.[0] ||
                    firstItem?.rentalItem?.images?.[0] ||
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&q=80'

                  const productName =
                    firstItem?.product?.name ||
                    firstItem?.service?.name ||
                    firstItem?.rentalItem?.name ||
                    'Gadget Smartphone'

                  const customerName = order.user?.name || order.user?.email || 'Customer'
                  const courierDisplay = order.courierCode
                    ? `${order.courierCode} ${order.courierService || ''}`
                    : 'Kurir Terproteksi'

                  return (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      {/* Kolom 1: Unit Gadget */}
                      <td className="py-4 px-3 align-middle">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={productImg}
                            alt={productName}
                            className="h-12 w-12 rounded-2xl object-cover border border-slate-100 shadow-2xs dark:border-slate-800 shrink-0"
                          />
                          <div className="min-w-0 max-w-[280px]">
                            <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {productName}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                              <span
                                className="font-mono font-bold text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px]"
                                title={order.orderNumber}
                              >
                                #{order.orderNumber.length > 16 ? `${order.orderNumber.slice(0, 16)}...` : order.orderNumber}
                              </span>
                              <span>•</span>
                              <span suppressHydrationWarning className="font-medium text-slate-500">
                                {formatDate(order.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 2: Data Pembeli */}
                      <td className="py-4 px-3 align-middle">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {customerName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            {order.user?.phone && (
                              <a
                                href={`https://wa.me/${order.user.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(customerName)},%20konfirmasi%20pesanan%20%23${order.orderNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold hover:underline dark:text-emerald-400"
                              >
                                <Phone className="h-3 w-3 text-emerald-600" />
                                <span>{order.user.phone}</span>
                              </a>
                            )}
                            {order.user?.city && (
                              <span className="text-slate-400">
                                ({order.user.city})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kolom 3: Total Tagihan */}
                      <td className="py-4 px-3 align-middle">
                        <div className="space-y-0.5">
                          <span className="font-black text-slate-950 dark:text-white text-sm tabular-nums whitespace-nowrap">
                            Rp {order.total.toLocaleString('id-ID')}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {firstItem?.quantity || 1} Unit {order.items.length > 1 ? `(+${order.items.length - 1} item)` : ''}
                          </p>
                        </div>
                      </td>

                      {/* Kolom 4: Status Pesanan */}
                      <td className="py-4 px-3 text-center align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                          <span>{status.label}</span>
                        </span>
                      </td>

                      {/* Kolom 5: Proteksi & Kurir */}
                      <td className="py-4 px-3 align-middle">
                        <div className="flex flex-col gap-1 text-[11px]">
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
                            <Truck className="h-3.5 w-3.5 text-blue-600" /> {courierDisplay}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-orange-600 font-medium">
                            <Gift className="h-3 w-3 text-orange-500" /> Free Bonus 3-in-1
                          </span>
                        </div>
                      </td>

                      {/* Kolom 6: Aksi (Hanya Rincian) */}
                      <td className="py-4 px-3 text-right align-middle">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          <span>Rincian</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Minimalist Pagination (Identik dengan Manajemen Produk) */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4 dark:border-slate-800">
            <span className="text-xs text-slate-400">
              Menampilkan {orders.length} dari {totalCount} pesanan
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400"
              >
                Sebelumnya
              </button>
              <span className="px-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. REDESIGNED SENIOR UI/UX ORDER DETAILS BENTO MODAL                      */}
      {/* ========================================================================= */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          {selectedOrder && (
            <div className="space-y-6">
              
              {/* Header Dialog: High-Hierarchy Bento Title */}
              <DialogHeader>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <Store className="h-3 w-3 text-slate-400" />
                        <span>{selectedOrder.store?.name || 'Pesanan Toko Cabang'}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <DialogTitle className="text-lg sm:text-xl font-black text-slate-950 dark:text-white font-mono tracking-tight">
                        #{selectedOrder.orderNumber}
                      </DialogTitle>
                      <button
                        onClick={() => handleCopyOrderNumber(selectedOrder.orderNumber)}
                        title="Salin Nomor Order"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                      >
                        {copiedId ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>

                    <DialogDescription
                      suppressHydrationWarning
                      className="text-xs text-slate-400 flex items-center gap-1.5 font-medium"
                    >
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Waktu Transaksi: {formatDate(selectedOrder.createdAt, true)} WIB</span>
                    </DialogDescription>
                  </div>

                  {/* Status Pill in Header */}
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-2xs ${
                      statusConfig[selectedOrder.status]?.badgeClass || ''
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        statusConfig[selectedOrder.status]?.dotClass || ''
                      }`}
                    />
                    <span>{statusConfig[selectedOrder.status]?.label || selectedOrder.status}</span>
                  </div>
                </div>
              </DialogHeader>

              {/* 2-Column Bento Grid Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                
                {/* Column 1: Items List & Financial Summary */}
                <div className="space-y-4">
                  
                  {/* Products Section */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/30">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Unit Gadget Dipesan ({selectedOrder.items?.length || 0})
                    </span>

                    <div className="space-y-2.5">
                      {selectedOrder.items?.map((item, idx) => {
                        const img =
                          item.product?.images?.[0] ||
                          item.rentalItem?.images?.[0] ||
                          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&q=80'
                        const title = item.product?.name || item.service?.name || item.rentalItem?.name || 'Gadget Smartphone'

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-white p-2.5 border border-slate-200/70 shadow-2xs dark:bg-slate-900 dark:border-slate-800"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={img}
                                alt={title}
                                className="h-12 w-12 rounded-xl object-cover border border-slate-100 bg-slate-50 dark:bg-slate-800 dark:border-slate-800 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                  {title}
                                </p>
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                  {item.quantity} Unit × Rp {item.price.toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-slate-950 dark:text-white tabular-nums whitespace-nowrap">
                              Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Bonus 3-in-1 Callout */}
                    <div className="rounded-xl bg-orange-50/90 border border-orange-200/70 p-2.5 text-[11px] text-orange-900 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300">
                      <div className="font-bold flex items-center gap-1.5 text-orange-800 dark:text-orange-200">
                        <Gift className="h-3.5 w-3.5 text-orange-600" />
                        <span>Paket Bonus 3-in-1 (Termasuk Gratis Rp 0):</span>
                      </div>
                      <p className="text-[11px] text-orange-700 dark:text-orange-400 mt-0.5 pl-5">
                        Adaptor Fast Charger + Tempered Glass 9H + Softcase Presisi
                      </p>
                    </div>
                  </div>

                  {/* Financial Breakdown Card */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-800/30">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Rincian Pembayaran
                    </span>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Subtotal Unit:</span>
                      <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                        Rp {selectedOrder.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Ongkos Kirim Kurir:</span>
                      <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                        {selectedOrder.shippingCost ? `Rp ${selectedOrder.shippingCost.toLocaleString('id-ID')}` : 'Gratis'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Asuransi Wajib Pengiriman:</span>
                      <span className="font-semibold text-emerald-600 tabular-nums">
                        {selectedOrder.insuranceFee ? `Rp ${selectedOrder.insuranceFee.toLocaleString('id-ID')}` : 'Termasuk (Rp 0)'}
                      </span>
                    </div>

                    {/* Total Highlight */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-950 text-white p-3 mt-3 shadow-xs dark:bg-white dark:text-slate-950">
                      <span className="font-bold text-xs">Total Tagihan:</span>
                      <span className="font-black text-base tabular-nums">
                        Rp {selectedOrder.total.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Column 2: Customer & Shipping Details */}
                <div className="space-y-4">
                  
                  {/* Customer Card */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/30">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Informasi Pembeli
                    </span>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900">
                        {(selectedOrder.user?.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {selectedOrder.user?.name || 'Customer'}
                        </p>
                        <p className="text-slate-500 text-xs truncate dark:text-slate-400">
                          {selectedOrder.user?.email}
                        </p>
                      </div>
                    </div>

                    {selectedOrder.user?.phone && (
                      <div className="pt-2">
                        <a
                          href={`https://wa.me/${selectedOrder.user.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(selectedOrder.user.name || '')},%20kami%20dari%20${encodeURIComponent(selectedOrder.store?.name || 'Affiliate Gadget')}%20ingin%20mengonfirmasi%20pesanan%20%23${selectedOrder.orderNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 transition dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 w-full"
                        >
                          <Phone className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Hubungi via WhatsApp ({selectedOrder.user.phone})</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Destination Address Card */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-800/30">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>Alamat Tujuan Pengiriman</span>
                    </span>

                    <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed text-xs">
                      {selectedOrder.user?.address || 'Pengambilan langsung di Toko Cabang'}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      {[selectedOrder.user?.city, selectedOrder.user?.province, selectedOrder.user?.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>

                  {/* Courier & Logistic Protection Card */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2.5 dark:border-slate-800 dark:bg-slate-800/30">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Ekspedisi & Garansi Logistik
                    </span>

                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/50 dark:border-blue-900">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">
                          {selectedOrder.courierCode || 'JNE'} {selectedOrder.courierService || 'YES (Yakin Esok Sampai)'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-normal">
                          Layanan Pengiriman Cepat Terlindungi
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-2 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Asuransi 100% Proteksi Kerusakan & Kehilangan Fisik</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Dialog Footer Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                >
                  Tutup
                </button>

                {selectedOrder.status === 'PENDING_PAYMENT' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PAID')}
                    disabled={updatingId === selectedOrder.id}
                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 active:scale-95 transition disabled:opacity-50"
                  >
                    {updatingId === selectedOrder.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>Konfirmasi Pembayaran Lunas</span>
                  </button>
                )}

                {selectedOrder.status === 'PAID' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'IN_PROGRESS')}
                    disabled={updatingId === selectedOrder.id}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 active:scale-95 transition disabled:opacity-50 dark:bg-white dark:text-slate-950"
                  >
                    {updatingId === selectedOrder.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4 text-orange-400" />
                    )}
                    <span>Proses Pesanan Sekarang</span>
                  </button>
                )}

                {selectedOrder.status === 'IN_PROGRESS' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                    disabled={updatingId === selectedOrder.id}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                  >
                    {updatingId === selectedOrder.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>Tandai Selesai & Diterima</span>
                  </button>
                )}
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
