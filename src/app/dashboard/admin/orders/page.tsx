'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
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
  Printer,
  Zap,
  Navigation,
  FileEdit,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ThermalShippingLabel } from '@/components/shipping/thermal-shipping-label'
import { LiveCourierTracker } from '@/components/shipping/live-courier-tracker'
import TaxInvoiceModal from '@/components/modals/tax-invoice-modal'
import {
  validateAWB,
  type AWBValidationResult,
} from '@/lib/shipping/awb-validator'

interface OrderItem {
  id: string
  quantity: number
  price: number
  variantName?: string | null
  notes?: string | null
  productId?: string | null
  rentalItemId?: string | null
  serviceId?: string | null
  product?: {
    id?: string
    name: string
    brand?: string | null
    images: string[]
    model?: string | null
    category?: string | null
  } | null
  service?: {
    name: string
    category?: string | null
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
  voucherCode?: string | null
  discountAmount?: number
  shippingCost: number
  insuranceRate?: number
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
    label: 'Sedang Diproses',
    badgeClass:
      'bg-indigo-50 text-indigo-800 border border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/80',
    dotClass: 'bg-indigo-500',
  },
  SHIPPED: {
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

const STATUS_TABS = [
  { id: 'ALL', label: 'Semua Status' },
  { id: 'PENDING_PAYMENT', label: 'Belum Dibayar' },
  { id: 'PAID', label: 'Perlu Diproses' },
  { id: 'IN_PROGRESS', label: 'Sedang Diproses' },
  { id: 'SHIPPED', label: 'Sedang Dikirim' },
  { id: 'COMPLETED', label: 'Selesai' },
  { id: 'CANCELLED', label: 'Dibatalkan' },
] as const

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
  const { data: session } = useSession()
  const isPlatformAdmin =
    session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN'

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
  const [copiedAWB, setCopiedAWB] = useState(false)
  const [requestingPickupId, setRequestingPickupId] = useState<string | null>(
    null
  )
  const [activeThermalLabel, setActiveThermalLabel] = useState<any | null>(null)
  const [showLiveTracker, setShowLiveTracker] = useState(false)
  const [taxInvoiceOrder, setTaxInvoiceOrder] = useState<Order | null>(null)

  // AWB Manual Input Modal
  const [showAWBModal, setShowAWBModal] = useState(false)
  const [awbInput, setAwbInput] = useState('')
  const [awbValidation, setAwbValidation] =
    useState<AWBValidationResult | null>(null)
  const [submittingAWB, setSubmittingAWB] = useState(false)
  const [syncingStatusId, setSyncingStatusId] = useState<string | null>(null)

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
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: newStatus } : null
        )
      }
    } catch (error: any) {
      console.error('Error updating order status:', error)
      toast.error(error.message || 'Gagal mengubah status pesanan')
    } finally {
      setUpdatingId(null)
    }
  }

  // Request Pick Up Kurir (Gojek / JNE) via API
  const handleRequestPickup = async (order: Order) => {
    try {
      setRequestingPickupId(order.id)
      const res = await fetch('/api/shipping/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memanggil kurir logistik')
      }
      toast.success(data.message || 'Kurir logistik berhasil dipesan!')
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({
          ...selectedOrder,
          status: 'IN_PROGRESS',
          trackingNumber: data.data.trackingNumber,
        })
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: 'IN_PROGRESS',
                trackingNumber: data.data.trackingNumber,
              }
            : o
        )
      )
      setActiveThermalLabel(data.data)
    } catch (err: any) {
      console.error('Error requesting pickup:', err)
      toast.error(err.message || 'Gagal memproses request pickup')
    } finally {
      setRequestingPickupId(null)
    }
  }

  // Buka Label Thermal untuk pesanan yang sudah ada
  const handleOpenThermalLabel = async (order: Order) => {
    try {
      const res = await fetch(`/api/shipping/tracking/${order.id}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          setActiveThermalLabel(json.data)
          return
        }
      }
      // Fallback
      toast.info('Menyiapkan template label thermal...')
    } catch {
      toast.error('Gagal memuat label thermal')
    }
  }

  const handleCopyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber)
    setCopiedId(true)
    toast.success('Nomor order berhasil disalin!')
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleCopyAWB = (awb: string) => {
    navigator.clipboard.writeText(awb)
    setCopiedAWB(true)
    toast.success('Nomor resi / AWB berhasil disalin!')
    setTimeout(() => setCopiedAWB(false), 2000)
  }

  // Handle AWB input modal open
  const handleOpenAWBModal = (order: Order) => {
    setSelectedOrder(order)
    setAwbInput(order.trackingNumber || '')
    setAwbValidation(
      order.trackingNumber ? validateAWB(order.trackingNumber) : null
    )
    setShowAWBModal(true)
  }

  // Handle AWB input change with live validation
  const handleAWBChange = (value: string) => {
    setAwbInput(value)
    if (value.trim()) {
      setAwbValidation(
        validateAWB(
          value,
          selectedOrder?.courierCode === 'GOJEK' ? 'GOJEK' : 'JNE'
        )
      )
    } else {
      setAwbValidation(null)
    }
  }

  // Submit manual AWB to order
  const handleSubmitManualAWB = async () => {
    if (!selectedOrder || !awbValidation?.valid) return
    try {
      setSubmittingAWB(true)
      const targetStatus =
        selectedOrder.status === 'PAID' ? 'IN_PROGRESS' : selectedOrder.status
      const res = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          trackingNumber: awbValidation.formatted,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan nomor resi')

      toast.success(
        `Resi ${awbValidation.formatted} berhasil disimpan!`
      )
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                status: targetStatus,
                trackingNumber: awbValidation.formatted,
              }
            : o
        )
      )
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: targetStatus,
              trackingNumber: awbValidation.formatted,
            }
          : null
      )
      setShowAWBModal(false)
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan nomor resi')
    } finally {
      setSubmittingAWB(false)
    }
  }

  // Manual status sync
  const handleSyncStatus = async (orderId: string) => {
    try {
      setSyncingStatusId(orderId)
      const res = await fetch('/api/shipping/status-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal sinkronisasi status')
      toast.success(data.message || 'Status berhasil disinkronisasi')
      if (data.data?.orderStatus) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: data.data.orderStatus } : o
          )
        )
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, status: data.data.orderStatus } : null
          )
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal sinkronisasi status')
    } finally {
      setSyncingStatusId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-16">
      {/* 1. Unified Control Panel (Identik dengan Manajemen Produk) */}
      <div className="shadow-2xs flex flex-col items-stretch justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:p-3 xl:flex-row xl:items-center">
        {/* Left: Status Filter Pills */}
        <div
          suppressHydrationWarning
          className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/80"
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              suppressHydrationWarning
              onClick={() => {
                setStatusFilter(tab.id)
                setPage(1)
              }}
              className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                statusFilter === tab.id
                  ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Search & Refresh */}
        <div className="flex w-full items-center gap-2 xl:w-auto">
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* 2. Orders Inventory Bento Table (Identik dengan Tabel Manajemen Produk) */}
      <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-orange-500" />
            <p className="text-xs font-medium">Memuat data pesanan masuk...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="space-y-4 py-16 text-center text-slate-500">
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
                  <th className="px-3 pb-3">Unit Gadget</th>
                  <th className="px-3 pb-3">Data Pembeli</th>
                  <th className="px-3 pb-3">Total Tagihan</th>
                  <th className="px-3 pb-3 text-center">Status Pesanan</th>
                  <th className="px-3 pb-3">Proteksi & Kurir</th>
                  <th className="px-3 pb-3 text-right">Aksi</th>
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

                  const customerName =
                    order.user?.name || order.user?.email || 'Customer'
                  const courierDisplay = order.courierCode
                    ? `${order.courierCode} ${order.courierService || ''}`
                    : 'Kurir Terproteksi'

                  return (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      {/* Kolom 1: Unit Gadget */}
                      <td className="px-3 py-4 align-middle">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={productImg}
                            alt={productName}
                            className="shadow-2xs h-12 w-12 shrink-0 rounded-2xl border border-slate-100 object-cover dark:border-slate-800"
                          />
                          <div className="min-w-0 max-w-[280px]">
                            {firstItem?.product?.brand && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                {firstItem.product.brand}
                              </span>
                            )}
                            <p className="line-clamp-1 font-bold text-slate-900 dark:text-white">
                              {productName}
                            </p>
                            {firstItem?.variantName && (
                              <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {firstItem.variantName}
                              </span>
                            )}
                            {order.items.length > 1 && (
                              <span className="ml-1 inline-block text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                +{order.items.length - 1} lainnya
                              </span>
                            )}
                            <div className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-slate-400">
                              <span
                                className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                title={order.orderNumber}
                              >
                                #
                                {order.orderNumber.length > 16
                                  ? `${order.orderNumber.slice(0, 16)}...`
                                  : order.orderNumber}
                              </span>
                              <span>â€¢</span>
                              <span
                                suppressHydrationWarning
                                className="font-medium text-slate-500"
                              >
                                {formatDate(order.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 2: Data Pembeli */}
                      <td className="px-3 py-4 align-middle">
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
                                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline dark:text-emerald-400"
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
                      <td className="px-3 py-4 align-middle">
                        <div className="space-y-0.5">
                          <span className="whitespace-nowrap text-sm font-black tabular-nums text-slate-950 dark:text-white">
                            Rp {order.total.toLocaleString('id-ID')}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {firstItem?.quantity || 1} Unit{' '}
                            {order.items.length > 1
                              ? `(+${order.items.length - 1} item)`
                              : ''}
                          </p>
                        </div>
                      </td>

                      {/* Kolom 4: Status Pesanan */}
                      <td className="px-3 py-4 text-center align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.badgeClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`}
                          />
                          <span>{status.label}</span>
                        </span>
                      </td>

                      {/* Kolom 5: Proteksi & Kurir */}
                      <td className="px-3 py-4 align-middle">
                        <div className="flex flex-col gap-1 text-[11px]">
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
                            <Truck className="h-3.5 w-3.5 text-blue-600" />{' '}
                            {courierDisplay}
                          </span>
                          {order.trackingNumber ? (
                            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              <span className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
                                {order.trackingNumber}
                              </span>
                              <button
                                type="button"
                                title="Cetak Label Thermal"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenThermalLabel(order)
                                }}
                                className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                              >
                                <Printer className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            order.status !== 'PENDING_PAYMENT' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenAWBModal(order)
                                }}
                                className="inline-flex w-fit items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline"
                              >
                                <FileEdit className="h-2.5 w-2.5" /> + Resi
                              </button>
                            )
                          )}
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-600">
                            <Gift className="h-3 w-3 text-orange-500" /> Free
                            Bonus 3-in-1
                          </span>
                        </div>
                      </td>

                      {/* Kolom 6: Aksi (Hanya Rincian) */}
                      <td className="px-3 py-4 text-right align-middle">
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowLiveTracker(Boolean(order.status === 'SHIPPED' && order.trackingNumber))
                          }}
                          className="shadow-2xs inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
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
      <Dialog
        modal={!taxInvoiceOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null)
            setShowLiveTracker(false)
          }
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            if (taxInvoiceOrder) {
              e.preventDefault()
            }
          }}
          onInteractOutside={(e) => {
            if (taxInvoiceOrder) {
              e.preventDefault()
            }
          }}
          className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        >
          {selectedOrder && (
            <div className="flex max-h-[90vh] flex-1 flex-col overflow-hidden">
              {/* 1. Header Dialog: Pinned / Sticky Top Bar */}
              <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50 sm:px-7 sm:py-5">
                <DialogHeader className="space-y-0 text-left">
                  <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {selectedOrder.store?.name || 'Pesanan Toko Cabang'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <DialogTitle className="font-mono text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">
                          #{selectedOrder.orderNumber}
                        </DialogTitle>
                        <button
                          onClick={() =>
                            handleCopyOrderNumber(selectedOrder.orderNumber)
                          }
                          title="Salin Nomor Order"
                          className="shadow-2xs inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400"
                      >
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Waktu Transaksi:{' '}
                          {formatDate(selectedOrder.createdAt, true)} WIB
                        </span>
                      </DialogDescription>
                    </div>

                    {/* Status Pill in Header */}
                    <div className="shadow-2xs inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-500 dark:bg-slate-400" />
                      <span>
                        {statusConfig[selectedOrder.status]?.label ||
                          selectedOrder.status}
                      </span>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              {/* 2. Scrollable Body: Bento Grid Details & Live Tracker */}
              <div className="flex-1 space-y-6 overflow-y-auto p-6 sm:p-7">
                {/* 2-Column Bento Grid Details */}
                <div className="grid grid-cols-1 gap-5 text-xs md:grid-cols-2">
                  {/* Column 1: Items List & Financial Summary */}
                  <div className="space-y-4">
                    {/* Products Section */}
                    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Unit Gadget Dipesan ({selectedOrder.items?.length || 0})
                      </span>

                      <div className="space-y-2.5">
                        {selectedOrder.items?.map((item, idx) => {
                          const img =
                            item.product?.images?.[0] ||
                            item.rentalItem?.images?.[0] ||
                            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&q=80'
                          const title =
                            item.product?.name ||
                            item.service?.name ||
                            item.rentalItem?.name ||
                            'Gadget Smartphone'

                          return (
                            <div
                              key={idx}
                              className="shadow-2xs flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <img
                                  src={img}
                                  alt={title}
                                  className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-cover dark:border-slate-800 dark:bg-slate-800"
                                />
                                <div className="min-w-0">
                                  {item.product?.brand && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                      {item.product.brand}
                                    </span>
                                  )}
                                  <p className="line-clamp-1 text-xs font-bold text-slate-900 dark:text-white">
                                    {title}
                                  </p>
                                  {item.variantName && (
                                    <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      Varian: {item.variantName}
                                    </span>
                                  )}
                                  {item.notes && (
                                    <p className="mt-0.5 text-[10px] italic text-slate-500">
                                      Catatan: {item.notes}
                                    </p>
                                  )}
                                  <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    {item.quantity} Unit × Rp{' '}
                                    {item.price.toLocaleString('id-ID')}
                                  </p>
                                </div>
                              </div>
                              <span className="whitespace-nowrap text-xs font-black tabular-nums text-slate-950 dark:text-white">
                                Rp{' '}
                                {(item.price * item.quantity).toLocaleString(
                                  'id-ID'
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Bonus 3-in-1 Callout */}
                      <div className="dark:bg-slate-850 rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-700">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <Gift className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          <span>
                            Paket Bonus 3-in-1 (Termasuk Gratis Rp 0):
                          </span>
                        </div>
                        <p className="mt-1 pl-5 text-[11px] font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                          Adaptor Fast Charger + Tempered Glass 9H + Softcase
                          Presisi
                        </p>
                      </div>
                    </div>

                    {/* Financial Breakdown Card */}
                    <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Rincian Pembayaran
                      </span>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>Subtotal Unit:</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          Rp {selectedOrder.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>Ongkos Kirim Kurir:</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {selectedOrder.shippingCost
                            ? `Rp ${selectedOrder.shippingCost.toLocaleString('id-ID')}`
                            : 'Gratis'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>
                          Asuransi Pengiriman (
                          {selectedOrder.insuranceRate ?? 0.2}%):
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {selectedOrder.insuranceFee
                            ? `Rp ${selectedOrder.insuranceFee.toLocaleString('id-ID')}`
                            : 'Termasuk (Rp 0)'}
                        </span>
                      </div>

                      {selectedOrder.discountAmount !== undefined &&
                        selectedOrder.discountAmount > 0 && (
                          <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                            <span>
                              Diskon Voucher{' '}
                              {selectedOrder.voucherCode
                                ? `(${selectedOrder.voucherCode})`
                                : ''}
                              :
                            </span>
                            <span className="font-semibold tabular-nums">
                              - Rp{' '}
                              {selectedOrder.discountAmount.toLocaleString(
                                'id-ID'
                              )}
                            </span>
                          </div>
                        )}

                      {/* Total Highlight */}
                      <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Total Tagihan:
                        </span>
                        <span className="text-base font-black tabular-nums text-slate-900 dark:text-white">
                          Rp {selectedOrder.total.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Customer & Shipping Details */}
                  <div className="space-y-4">
                    {/* Customer Card */}
                    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Informasi Pembeli
                      </span>

                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {(selectedOrder.user?.name || 'C')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {selectedOrder.user?.name || 'Customer'}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {selectedOrder.user?.email}
                          </p>
                        </div>
                      </div>

                      {selectedOrder.user?.phone && (
                        <div className="pt-1">
                          <a
                            href={`https://wa.me/${selectedOrder.user.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(selectedOrder.user.name || '')},%20kami%20dari%20${encodeURIComponent(selectedOrder.store?.name || 'Affiliate Gadget')}%20ingin%20mengonfirmasi%20pesanan%20%23${selectedOrder.orderNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shadow-2xs flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <Phone className="h-3.5 w-3.5 text-slate-500" />
                            <span>
                              Hubungi via WhatsApp ({selectedOrder.user.phone})
                            </span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Destination Address Card */}
                    <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>Alamat Tujuan Pengiriman</span>
                      </span>

                      <p className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
                        {selectedOrder.user?.address ||
                          'Pengambilan langsung di Toko Cabang'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {[
                          selectedOrder.user?.city,
                          selectedOrder.user?.province,
                          selectedOrder.user?.postalCode,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>

                    {/* Courier & Logistic Protection Card */}
                    <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Ekspedisi & Garansi Logistik
                      </span>

                      <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Truck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">
                            {selectedOrder.courierCode || 'JNE'}{' '}
                            {selectedOrder.courierService ||
                              'YES (Yakin Esok Sampai)'}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            Layanan Pengiriman Cepat Terlindungi
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-slate-500" />
                        <span className="text-[11px]">
                          Asuransi 100% Proteksi Kerusakan & Kehilangan Fisik
                        </span>
                      </div>

                      {selectedOrder.trackingNumber ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800">
                            <span className="text-xs font-bold text-slate-500">
                              Resi / AWB:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                                {selectedOrder.trackingNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyAWB(selectedOrder.trackingNumber!)
                                }
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                                title="Salin Resi"
                              >
                                {copiedAWB ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenThermalLabel(selectedOrder)
                              }
                              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              <Printer className="h-3.5 w-3.5 text-slate-500" />
                              <span>Cetak Label Thermal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setShowLiveTracker(!showLiveTracker)
                              }
                              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200/90 bg-blue-50/80 py-2 text-xs font-bold text-blue-700 shadow-2xs transition hover:bg-blue-100 active:scale-[0.98] dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                            >
                              <Navigation className="h-3.5 w-3.5" />
                              <span>
                                {showLiveTracker
                                  ? 'Tutup Pelacakan'
                                  : 'Lacak Kurir Live'}
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            <span>Belum ada nomor resi AWB</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenAWBModal(selectedOrder)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700 active:scale-95"
                          >
                            <FileEdit className="h-3 w-3" />
                            <span>+ Input Resi</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Tracking Card (if toggled) */}
                {showLiveTracker && (
                  <div className="mt-4 space-y-2 rounded-3xl border border-blue-100 bg-blue-50/20 p-3.5 dark:border-blue-950 dark:bg-blue-950/10 sm:p-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                          Pelacakan Kurir Real-Time
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLiveTracker(false)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Tutup Lacak
                      </button>
                    </div>
                    <LiveCourierTracker orderId={selectedOrder.id} />
                  </div>
                )}
              </div>

              {/* 3. Dialog Footer Actions: Pinned / Sticky Bottom Action Bar */}
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-800/40 sm:px-7">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrder(null)
                      setShowLiveTracker(false)
                    }}
                    className="shadow-2xs rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Tutup
                  </button>

                  {isPlatformAdmin && (
                    <button
                      type="button"
                      onClick={() => setTaxInvoiceOrder(selectedOrder)}
                      className="shadow-2xs inline-flex items-center gap-1.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 hover:text-emerald-950 active:scale-95 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                      title="Cetak Faktur Pajak Elektronik Standar DJP"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Faktur Pajak</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedOrder.status === 'PENDING_PAYMENT' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(selectedOrder.id, 'PAID')
                      }
                      disabled={updatingId === selectedOrder.id}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
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
                    <>
                      <button
                        type="button"
                        onClick={() => handleRequestPickup(selectedOrder)}
                        disabled={requestingPickupId === selectedOrder.id}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      >
                        {requestingPickupId === selectedOrder.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        <span>
                          Request Pick Up (
                          {selectedOrder.courierCode === 'GOJEK'
                            ? 'Gojek Instant'
                            : 'JNE'}
                          )
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAWBModal(selectedOrder)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <FileEdit className="h-3.5 w-3.5 text-slate-500" />
                        <span>Input Resi Manual</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(selectedOrder.id, 'IN_PROGRESS')
                        }
                        disabled={updatingId === selectedOrder.id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <span>Proses Manual</span>
                      </button>
                    </>
                  )}

                  {selectedOrder.status === 'IN_PROGRESS' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSyncStatus(selectedOrder.id)}
                        disabled={syncingStatusId === selectedOrder.id}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {syncingStatusId === selectedOrder.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                        )}
                        <span>Refresh Status</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(selectedOrder.id, 'SHIPPED')
                        }
                        disabled={updatingId === selectedOrder.id}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      >
                        {updatingId === selectedOrder.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Truck className="h-4 w-4" />
                        )}
                        <span>Tandai Sedang Dikirim</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(selectedOrder.id, 'COMPLETED')
                        }
                        disabled={updatingId === selectedOrder.id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {updatingId === selectedOrder.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-slate-600" />
                        )}
                        <span>Tandai Selesai</span>
                      </button>
                    </>
                  )}

                  {selectedOrder.status === 'SHIPPED' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(selectedOrder.id, 'COMPLETED')
                      }
                      disabled={updatingId === selectedOrder.id}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      {updatingId === selectedOrder.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span>Tandai Selesai & Diterima</span>
                    </button>
                  )}

                  {selectedOrder.status === 'COMPLETED' && (
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Pesanan Telah Selesai</span>
                    </div>
                  )}

                  {selectedOrder.status === 'COMPLAINED' && (
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span>Dalam Status Komplain / Retur</span>
                    </div>
                  )}

                  {selectedOrder.status === 'CANCELLED' && (
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                      <X className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      <span>Pesanan Dibatalkan</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Printable Thermal Shipping Label Modal */}
      {activeThermalLabel && (
        <ThermalShippingLabel
          data={activeThermalLabel}
          onClose={() => setActiveThermalLabel(null)}
        />
      )}

      {/* AWB Manual Input Modal */}
      <Dialog open={showAWBModal} onOpenChange={setShowAWBModal}>
        <DialogContent className="max-w-md rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <DialogHeader className="px-6 pb-4 pt-6">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <FileEdit className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              Input Nomor Resi Manual
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-500">
              Masukkan nomor resi dari ekspedisi untuk pesanan{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {selectedOrder?.orderNumber}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 pb-2">
            {/* Courier badge */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <Truck className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500">
                  Kurir Pesanan
                </p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedOrder?.courierCode === 'GOJEK'
                    ? 'Gojek Instant'
                    : 'JNE Express'}
                  {selectedOrder?.courierService
                    ? ` (${selectedOrder.courierService})`
                    : ''}
                </p>
              </div>
            </div>

            {/* AWB Input */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Nomor Resi / AWB
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={awbInput}
                  onChange={(e) =>
                    handleAWBChange(e.target.value.toUpperCase())
                  }
                  placeholder={
                    selectedOrder?.courierCode === 'GOJEK'
                      ? 'GK-260923XXXXXX'
                      : 'JNE260923XXXXXX'
                  }
                  className={`w-full rounded-2xl border py-2.5 pl-4 pr-10 font-mono text-sm font-semibold outline-none transition ${
                    awbValidation?.valid
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-900 focus:border-emerald-500 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200'
                      : awbValidation && !awbValidation.valid
                        ? 'border-red-400 bg-red-50 text-red-900 focus:border-red-500 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200'
                        : 'border-slate-200 bg-white focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                  }`}
                />
                {awbInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setAwbInput('')
                      setAwbValidation(null)
                    }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Validation feedback */}
              {awbValidation && (
                <p
                  className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-medium ${
                    awbValidation.valid ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {awbValidation.valid ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Format resi valid (
                      {awbValidation.courierCode})
                    </>
                  ) : (
                    <>{awbValidation.error}</>
                  )}
                </p>
              )}

              <p className="mt-2 text-[11px] text-slate-400">
                Format: {selectedOrder?.courierCode === 'GOJEK' ? 'GK-' : 'JNE'}{' '}
                diikuti 12 digit angka
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAWBModal(false)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmitManualAWB}
              disabled={!awbValidation?.valid || submittingAWB}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {submittingAWB ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Simpan & Proses Pesanan
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Cetak Faktur Pajak Elektronik Standar DJP */}
      <TaxInvoiceModal
        isOpen={Boolean(taxInvoiceOrder)}
        onClose={() => setTaxInvoiceOrder(null)}
        order={taxInvoiceOrder as any}
      />
    </div>
  )
}
