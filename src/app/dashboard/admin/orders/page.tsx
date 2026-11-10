'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  Banknote,
  Filter,
  Calendar,
  ChevronDown,
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
import { CheckResiModal } from '@/components/shipping/check-resi-modal'
import { AdminOrderPaymentCard } from '@/components/admin/orders/admin-order-payment-card'
import { usePageGuard } from '@/hooks/use-page-guard'

interface OrderItem {
  id: string
  quantity: number
  price: number
  variantName?: string | null
  notes?: string | null
  productId?: string | null
  serviceId?: string | null
  product?: {
    id?: string
    name: string
    brand?: string | null
    images: string[]
    model?: string | null
    category?: string | null
    weightGram?: number | null
    sku?: string | null
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
  commissionAmount?: number
  commissionRate?: number
  status: string
  createdAt: string
  notes?: string | null
  userId?: string
  user: {
    id?: string
    name: string | null
    email: string
    phone: string | null
    address?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
    addresses?: Array<{
      recipientName?: string | null
      phone?: string | null
      fullAddress?: string | null
      city?: string | null
      province?: string | null
      district?: string | null
      village?: string | null
      postalCode?: string | null
    }>
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
  returnRequests?: Array<{
    id: string
    status: string
    type: string
    reason?: string | null
    reasonLabel?: string | null
    returnTrackingNumber?: string | null
    returnCourier?: string | null
    storeResponse?: string | null
    bankName?: string | null
    bankAccountNumber?: string | null
    bankAccountName?: string | null
    refundAmount?: number | null
    packageReceivedAt?: string | null
    qcStatus?: string | null
    qcNotes?: string | null
    resolvedAt?: string | null
    createdAt: string
  }>
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

function getReturnStatusInfo(ret: {
  status: string
  type: string
  returnTrackingNumber?: string | null
  packageReceivedAt?: string | null
  storeResponse?: string | null
}) {
  if (ret.status === 'PENDING') {
    return {
      label: 'Menunggu Telaah After Sales',
      shortLabel: 'Telaah After Sales',
      badgeClass:
        'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300',
      dotClass: 'bg-amber-500',
    }
  }
  if (ret.status === 'IN_REVIEW') {
    if (
      ret.packageReceivedAt ||
      ret.storeResponse?.includes('[Paket Fisik Tiba di Cabang]')
    ) {
      return {
        label: 'Paket Tiba di Toko (Sedang QC Fisik)',
        shortLabel: 'Tiba di Toko (QC)',
        badgeClass:
          'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300',
        dotClass: 'bg-emerald-500',
      }
    }
    if (ret.returnTrackingNumber) {
      return {
        label: 'Paket Menuju Toko (QC Fisik)',
        shortLabel: 'Paket Dikirim (QC)',
        badgeClass:
          'border border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300',
        dotClass: 'bg-indigo-500',
      }
    }
    return {
      label: 'Menunggu ACC Superadmin',
      shortLabel: 'Menunggu ACC Superadmin',
      badgeClass:
        'border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/80 dark:bg-blue-950/40 dark:text-blue-300',
      dotClass: 'bg-blue-500',
    }
  }
  if (ret.status === 'APPROVED') {
    return {
      label: 'ACC Disetujui (Kirim Barang Balik)',
      shortLabel: 'ACC Disetujui',
      badgeClass:
        'border border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-800/80 dark:bg-cyan-950/40 dark:text-cyan-300',
      dotClass: 'bg-cyan-500',
    }
  }
  if (ret.status === 'COMPLETED') {
    return {
      label:
        ret.type === 'REFUND'
          ? 'Refund Selesai Dicairkan'
          : 'Tukar Unit Selesai Diterima',
      shortLabel:
        ret.type === 'REFUND' ? 'Refund Selesai' : 'Tukar Unit Selesai',
      badgeClass:
        'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300',
      dotClass: 'bg-emerald-500',
    }
  }
  if (ret.status === 'REJECTED') {
    return {
      label: 'Klaim Retur Ditolak',
      shortLabel: 'Klaim Ditolak',
      badgeClass:
        'border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300',
      dotClass: 'bg-rose-500',
    }
  }
  return {
    label: ret.status,
    shortLabel: ret.status,
    badgeClass:
      'border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300',
    dotClass: 'bg-slate-500',
  }
}

function renderSimpleStatusBadge(order: Order) {
  const activeReturn = order.returnRequests?.[0]
  if (activeReturn) {
    if (activeReturn.status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>Telaah Unit</span>
        </span>
      )
    }
    if (activeReturn.type === 'REFUND') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
          <span>Retur/Refund</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        <span>Tukar Unit</span>
      </span>
    )
  }

  if (order.status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>Selesai</span>
      </span>
    )
  }
  if (order.status === 'PAID') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        <span>Perlu Diproses</span>
      </span>
    )
  }
  if (order.status === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
        <span>Diproses</span>
      </span>
    )
  }
  if (order.status === 'SHIPPED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        <span>Sedang Dikirim</span>
      </span>
    )
  }
  if (order.status === 'PENDING_PAYMENT') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <span>Belum Bayar</span>
      </span>
    )
  }
  if (order.status === 'CANCELLED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        <span>Dibatalkan</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      <span>{order.status}</span>
    </span>
  )
}

const STATUS_OPTIONS = [
  { id: 'ALL', label: 'Semua Status' },
  { id: 'PENDING_PAYMENT', label: 'Belum Dibayar' },
  { id: 'PAID', label: 'Perlu Diproses' },
  { id: 'IN_PROGRESS', label: 'Sedang Diproses' },
  { id: 'SHIPPED', label: 'Sedang Dikirim' },
  { id: 'COMPLETED', label: 'Selesai' },
  { id: 'CANCELLED', label: 'Dibatalkan' },
  { id: 'CHECK_RESI', label: 'Cek Resi' },
] as const

const DATE_RANGE_OPTIONS = [
  { id: 'ALL', label: 'Semua Waktu' },
  { id: 'TODAY', label: 'Hari Ini' },
  { id: '7_DAYS', label: '7 Hari Terakhir' },
  { id: '30_DAYS', label: '30 Hari Terakhir' },
  { id: 'THIS_MONTH', label: 'Bulan Ini' },
  { id: 'LAST_MONTH', label: 'Bulan Lalu' },
] as const

const STATUS_TABS = STATUS_OPTIONS

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

function parseRecipientInfo(order: Order) {
  let recipientName = ''
  let recipientPhone = ''
  let deliveryAddress = ''

  if (order.notes) {
    const nameMatch = order.notes.match(/Penerima:\s*([^|\n\]]+)/i)
    if (nameMatch && nameMatch[1]?.trim()) {
      recipientName = nameMatch[1].trim()
    }
    const phoneMatch = order.notes.match(/HP:\s*([^|\n\]]+)/i)
    if (phoneMatch && phoneMatch[1]?.trim()) {
      recipientPhone = phoneMatch[1].trim()
    }
    const addrMatch = order.notes.match(/Alamat:\s*([^|\n\]]+)/i)
    if (addrMatch && addrMatch[1]?.trim()) {
      deliveryAddress = addrMatch[1].trim()
    }
  }

  const defaultAddr = order.user?.addresses?.[0]
  if (!recipientName && defaultAddr?.recipientName) {
    recipientName = defaultAddr.recipientName
  }
  if (!recipientPhone && defaultAddr?.phone) {
    recipientPhone = defaultAddr.phone
  }

  if (!recipientName) {
    recipientName = order.user?.name || 'Customer'
  }
  if (!recipientPhone) {
    recipientPhone = order.user?.phone || '-'
  }

  if (!deliveryAddress) {
    deliveryAddress =
      defaultAddr?.fullAddress ||
      order.user?.address ||
      'Pengambilan langsung di Toko Cabang'
  }

  return { recipientName, recipientPhone, deliveryAddress }
}

export default function AdminOrdersPage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/orders'
  )
  const { data: session } = useSession()
  const isPlatformAdmin =
    session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN'
  const searchParams = useSearchParams()
  const statusParam = searchParams?.get('status')

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState(statusParam || 'ALL')

  useEffect(() => {
    const qStatus = searchParams?.get('status')
    if (qStatus && qStatus !== statusFilter) {
      setStatusFilter(qStatus)
      setPage(1)
    }
    const qSearch = searchParams?.get('search')
    if (qSearch && qSearch !== searchInput) {
      setSearchInput(qSearch)
      setSearchQuery(qSearch)
      setPage(1)
    }
  }, [searchParams])
  const [searchInput, setSearchInput] = useState(
    searchParams?.get('search') || ''
  )
  const [searchQuery, setSearchQuery] = useState(
    searchParams?.get('search') || ''
  )
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedAWB, setCopiedAWB] = useState(false)
  const [requestingPickupId, setRequestingPickupId] = useState<string | null>(
    null
  )
  const [activeThermalLabel, setActiveThermalLabel] = useState<any | null>(null)
  const [previousOrderForModal, setPreviousOrderForModal] =
    useState<Order | null>(null)
  const [showLiveTracker, setShowLiveTracker] = useState(false)
  const [taxInvoiceOrder, setTaxInvoiceOrder] = useState<Order | null>(null)
  const [showCheckResiModal, setShowCheckResiModal] = useState(false)
  const [checkResiQuery, setCheckResiQuery] = useState('')
  const [confirmingArrivalId, setConfirmingArrivalId] = useState<string | null>(
    null
  )

  // State untuk Filter & Tampilan Baru Sederhana (Screenshot 2 & 3)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('ALL')

  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const dateDropdownRef = useRef<HTMLDivElement>(null)

  // Click outside listener untuk dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node)
      ) {
        setStatusDropdownOpen(false)
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(e.target as Node)
      ) {
        setDateDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleConfirmPackageArrivalInOrdersDrawer = async (
    returnId: string
  ) => {
    setConfirmingArrivalId(returnId)
    try {
      const res = await fetch(`/api/returns/${returnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_PACKAGE_RECEIVED',
          qcNotes:
            'Paket fisik telah diterima di cabang toko via konfirmasi Super Admin. Memulai pemeriksaan fisik (QC).',
          qcStatus: 'IN_QC',
        }),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success('Penerimaan paket fisik retur berhasil dikonfirmasi!')
        fetchOrders()
        if (selectedOrder && selectedOrder.returnRequests) {
          const updated = {
            ...selectedOrder,
            returnRequests: selectedOrder.returnRequests.map((r) =>
              r.id === returnId
                ? {
                    ...r,
                    packageReceivedAt: new Date().toISOString(),
                    qcStatus: 'IN_QC',
                  }
                : r
            ),
          }
          setSelectedOrder(updated)
        }
      } else {
        toast.error(json.error || 'Gagal mengonfirmasi penerimaan paket')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setConfirmingArrivalId(null)
    }
  }

  const [syncingStatusId, setSyncingStatusId] = useState<string | null>(null)
  const [isConnectingChat, setIsConnectingChat] = useState(false)
  const router = useRouter()

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
      params.append('_t', Date.now().toString())

      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      // Filter rentang tanggal
      if (dateRangeFilter === 'TODAY') {
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        params.append('startDate', start.toISOString())
        params.append('endDate', new Date().toISOString())
      } else if (dateRangeFilter === '7_DAYS') {
        const start = new Date(Date.now() - 7 * 86400000)
        params.append('startDate', start.toISOString())
        params.append('endDate', new Date().toISOString())
      } else if (dateRangeFilter === '30_DAYS') {
        const start = new Date(Date.now() - 30 * 86400000)
        params.append('startDate', start.toISOString())
        params.append('endDate', new Date().toISOString())
      } else if (dateRangeFilter === 'THIS_MONTH') {
        const start = new Date()
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        params.append('startDate', start.toISOString())
        params.append('endDate', new Date().toISOString())
      } else if (dateRangeFilter === 'LAST_MONTH') {
        const start = new Date()
        start.setMonth(start.getMonth() - 1, 1)
        start.setHours(0, 0, 0, 0)
        const end = new Date()
        end.setDate(0)
        end.setHours(23, 59, 59, 999)
        params.append('startDate', start.toISOString())
        params.append('endDate', end.toISOString())
      }

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      })
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
  }, [page, statusFilter, searchQuery, dateRangeFilter])

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
      // Tutup modal rincian pesanan dan tampilkan label thermal
      setPreviousOrderForModal(order)
      setSelectedOrder(null)
      setShowLiveTracker(false)
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
    // 1. Simpan referensi order & tutup modal rincian pesanan seketika
    setPreviousOrderForModal(order)
    setSelectedOrder(null)
    setShowLiveTracker(false)

    try {
      const res = await fetch(`/api/shipping/tracking/${order.id}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          setActiveThermalLabel(json.data)
          return
        }
      }

      // 2. Fallback data instan dari object order jika Biteship record belum ada / offline
      const isGojek = (order.courierCode || '').toUpperCase() === 'GOJEK'
      const fallbackRecord: any = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        courierCode: isGojek ? 'GOJEK' : 'JNE',
        courierService: order.courierService || (isGojek ? 'INSTANT' : 'REG'),
        trackingNumber:
          order.trackingNumber || `AGY-${Date.now().toString().slice(-8)}`,
        status: order.status === 'COMPLETED' ? 'DELIVERED' : 'ALLOCATED',
        statusLabel:
          order.status === 'COMPLETED'
            ? 'Paket Telah Diterima'
            : isGojek
              ? 'Driver Sedang Menuju Lokasi'
              : 'Paket Dalam Perjalanan Ekspedisi',
        bookedAt: order.createdAt || new Date().toISOString(),
        originStore: {
          name: order.store?.name || 'Affiliate Gadget Store',
          companyName: order.store?.companyName || 'PT Gadget Jaya Sentosa',
          address: order.store?.city
            ? `Cabang ${order.store.name}, ${order.store.city}`
            : 'Toko Cabang Resmi',
          city: order.store?.city || 'Jakarta Pusat',
          phone: '081234567890',
        },
        destinationCustomer: {
          name: order.user?.name || 'Customer Pembeli',
          address: order.user?.address || 'Alamat Penerima Belum Lengkap',
          city: order.user?.city || 'Jakarta',
          province: order.user?.province || 'DKI Jakarta',
          postalCode: order.user?.postalCode || undefined,
          phone: order.user?.phone || '081298765432',
        },
        items:
          order.items?.map((i) => ({
            name:
              i.product?.name ||
              i.rentalItem?.name ||
              i.service?.name ||
              'Unit Gadget',
            quantity: i.quantity,
            weightGram: i.product?.weightGram || 500,
          })) || [],
        checkpoints: [
          {
            id: 'cp-0',
            status: 'ALLOCATED',
            description:
              'Pesanan siap dicetak label dan dijemput kurir logistik',
            location: order.store?.city || 'Jakarta',
            timestamp: new Date().toISOString(),
          },
        ],
      }
      setActiveThermalLabel(fallbackRecord)
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

  // Hubungi Customer via Chat dengan konteks pesanan utuh
  const handleChatCustomer = async (order: Order) => {
    try {
      setIsConnectingChat(true)
      const customerId = order.user?.id || (order as any).userId

      // 1. Dapatkan atau buat ruang chat
      const res = await fetch('/api/admin/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          customerId,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.room?.id) {
        throw new Error(data.error || 'Gagal membuka ruang chat')
      }

      const roomId = data.room.id

      // 2. Tutup modal pesanan dan arahkan ke admin chat dengan konteks orderId aktif
      setSelectedOrder(null)
      router.push(`/dashboard/admin/chat?roomId=${roomId}&orderId=${order.id}`)
    } catch (err: any) {
      console.error('Error connecting to customer chat:', err)
      toast.error(err.message || 'Gagal menghubungkan ke chat customer')
    } finally {
      setIsConnectingChat(false)
    }
  }

  const currentStatusLabel =
    STATUS_OPTIONS.find((s) => s.id === statusFilter)?.label || 'Semua Status'

  const currentDateRangeLabel =
    DATE_RANGE_OPTIONS.find((d) => d.id === dateRangeFilter)?.label ||
    'Semua Waktu'

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-16">
      {/* 1. Simple & Clean Control Bar (Screenshot 2 & 3) */}
      <div className="shadow-2xs flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        {/* Mobile: 2 Kolom Berdampingan (Filter Status di Kiri, Rentang Waktu di Kanan) */}
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          {/* Status Dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setStatusDropdownOpen(!statusDropdownOpen)
                setDateDropdownOpen(false)
              }}
              className="shadow-2xs flex w-full items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-auto sm:justify-start"
            >
              <div className="flex min-w-0 items-center gap-1.5 truncate">
                <Filter className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="truncate">{currentStatusLabel}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            </button>

            {statusDropdownOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (opt.id === 'CHECK_RESI') {
                        setCheckResiQuery('')
                        setShowCheckResiModal(true)
                      } else {
                        setStatusFilter(opt.id)
                        setPage(1)
                      }
                      setStatusDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                      statusFilter === opt.id
                        ? 'bg-slate-100 font-bold text-slate-950 dark:bg-slate-700 dark:text-white'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {statusFilter === opt.id && (
                      <Check className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Dropdown */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setDateDropdownOpen(!dateDropdownOpen)
                setStatusDropdownOpen(false)
              }}
              className="shadow-2xs flex w-full items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-auto sm:justify-start"
            >
              <div className="flex min-w-0 items-center gap-1.5 truncate">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="truncate">{currentDateRangeLabel}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:left-0 sm:right-auto">
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setDateRangeFilter(opt.id)
                      setPage(1)
                      setDateDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                      dateRangeFilter === opt.id
                        ? 'bg-slate-100 font-bold text-slate-950 dark:bg-slate-700 dark:text-white'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {dateRangeFilter === opt.id && (
                      <Check className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Search & Refresh */}
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari no. order, customer, produk..."
              className="shadow-2xs w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
            className="shadow-2xs flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
          <>
            {/* Desktop Table View (Screenshot 2) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="px-4 pb-3">UNIT GADGET</th>
                    <th className="px-4 pb-3">PEMBELI</th>
                    <th className="px-4 pb-3">TOTAL TAGIHAN</th>
                    <th className="px-4 pb-3">STATUS</th>
                    <th className="px-4 pb-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {orders.map((order) => {
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

                    const variantName = firstItem?.variantName || ''
                    const fullName = variantName
                      ? `${productName} ${variantName}`
                      : productName

                    const customerName =
                      order.user?.name || order.user?.email || 'Customer'
                    const customerCity =
                      order.user?.city || order.user?.addresses?.[0]?.city || ''

                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      >
                        {/* Kolom 1: Unit Gadget */}
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-3">
                            <img
                              src={productImg}
                              alt={productName}
                              className="shadow-2xs h-10 w-10 shrink-0 rounded-xl border border-slate-100 object-cover dark:border-slate-800"
                            />
                            <div className="min-w-0 max-w-[320px]">
                              <p className="line-clamp-1 text-xs font-bold text-slate-800 dark:text-white">
                                {fullName}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                                #
                                {order.orderNumber.length > 16
                                  ? `${order.orderNumber.slice(0, 16)}...`
                                  : order.orderNumber}{' '}
                                • {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Kolom 2: Pembeli */}
                        <td className="px-3 py-3.5 align-middle">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {customerName}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {customerCity || '-'}
                            </p>
                          </div>
                        </td>

                        {/* Kolom 3: Total Tagihan */}
                        <td className="px-3 py-3.5 align-middle">
                          <div>
                            <p className="whitespace-nowrap text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                              Rp {order.total.toLocaleString('id-ID')}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {firstItem?.quantity || 1} Unit
                            </p>
                          </div>
                        </td>

                        {/* Kolom 4: Status (Dot + Teks Minimalis) */}
                        <td className="px-3 py-3.5 align-middle">
                          {renderSimpleStatusBadge(order)}
                        </td>

                        {/* Kolom 5: Aksi */}
                        <td className="px-3 py-3.5 text-right align-middle">
                          <button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowLiveTracker(
                                Boolean(
                                  order.status === 'SHIPPED' &&
                                  order.trackingNumber
                                )
                              )
                            }}
                            className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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

            {/* Mobile Cards View (Screenshot 3 - Simple & Bersih) */}
            <div className="space-y-3 md:hidden">
              {orders.map((order) => {
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

                const variantName = firstItem?.variantName || ''
                const fullName = variantName
                  ? `${productName} ${variantName}`
                  : productName

                const customerName =
                  order.user?.name || order.user?.email || 'Customer'
                const customerCity =
                  order.user?.city || order.user?.addresses?.[0]?.city || ''

                return (
                  <div
                    key={order.id}
                    className="shadow-2xs space-y-2.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* Header Kartu: Order No, Tanggal, dan Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate font-mono text-[10px] font-semibold text-slate-500">
                          #
                          {order.orderNumber.length > 18
                            ? `${order.orderNumber.slice(0, 18)}...`
                            : order.orderNumber}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          • {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="shrink-0">
                        {renderSimpleStatusBadge(order)}
                      </div>
                    </div>

                    {/* Body: Thumbnail & Info */}
                    <div className="flex items-start gap-3">
                      <img
                        src={productImg}
                        alt={productName}
                        className="shadow-2xs h-12 w-12 shrink-0 rounded-xl border border-slate-100 object-cover dark:border-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-xs font-bold text-slate-900 dark:text-white">
                          {fullName}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {customerName}{' '}
                          {customerCity ? `(${customerCity})` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Footer: Total Tagihan & Tombol Rincian */}
                    <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-1 dark:border-slate-800/60">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Rp {order.total.toLocaleString('id-ID')}
                        </span>
                        <span className="ml-1 text-[10px] text-slate-400">
                          ({firstItem?.quantity || 1} Unit)
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowLiveTracker(
                            Boolean(
                              order.status === 'SHIPPED' && order.trackingNumber
                            )
                          )
                        }}
                        className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span>Rincian</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* 3. Minimalist Pagination (Screenshot 2 & 3) */}
        {!loading && orders.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <span className="whitespace-nowrap font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
              {orders.length}/{totalCount}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="shrink-0 whitespace-nowrap rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400"
              >
                Sebelumnya
              </button>
              <span className="shrink-0 whitespace-nowrap px-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                {page}/{totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="shrink-0 whitespace-nowrap rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400"
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
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:w-full lg:max-w-4xl"
        >
          {selectedOrder && (
            <div className="flex max-h-[90vh] flex-1 flex-col overflow-hidden">
              {/* 1. Header Dialog: Pinned / Sticky Top Bar */}
              <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-800/50 sm:px-7 sm:py-5">
                <DialogHeader className="space-y-0 text-left">
                  <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="break-words text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {selectedOrder.store?.name || 'Pesanan Toko Cabang'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <DialogTitle className="break-all font-mono text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">
                          #{selectedOrder.orderNumber}
                        </DialogTitle>
                        <button
                          onClick={() =>
                            handleCopyOrderNumber(selectedOrder.orderNumber)
                          }
                          title="Salin Nomor Order"
                          className="shadow-2xs inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                        className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400"
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="break-words">
                          Waktu Transaksi:{' '}
                          {formatDate(selectedOrder.createdAt, true)} WIB
                        </span>
                      </DialogDescription>
                    </div>

                    {/* Status Pill in Header */}
                    <div className="shadow-2xs inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
              <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:space-y-6 sm:p-7">
                {/* Stacked Vertical Cards Layout (Susun Kebawah, Tidak Sampingan) */}
                <div className="w-full space-y-4 text-xs">
                  {/* Retur / Penukaran Unit Info Banner & Pelacakan Komprehensif */}
                  {selectedOrder.returnRequests &&
                    selectedOrder.returnRequests.length > 0 &&
                    (() => {
                      const ret = selectedOrder.returnRequests[0]
                      const returnInfo = getReturnStatusInfo(ret)
                      const isReplacement = ret.type === 'REPLACEMENT'

                      return (
                        <div className="space-y-3 rounded-2xl border border-blue-200/90 bg-blue-50/70 p-4 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                          {/* Header Retur / Garansi */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-2.5 dark:border-blue-900/60">
                            <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-100">
                              <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-bold">
                                {isReplacement
                                  ? 'Klaim Garansi: Penukaran Unit Baru'
                                  : 'Klaim Garansi: Retur & Refund Dana'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${returnInfo.badgeClass}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${returnInfo.dotClass}`}
                                />
                                <span>{returnInfo.label.toUpperCase()}</span>
                              </span>
                              <Link
                                href={`/dashboard/admin/returns?search=${selectedOrder.orderNumber}`}
                                className="shadow-2xs inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-white px-2 py-1 text-[10.5px] font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800"
                              >
                                <span>Meja Kerja Retur</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>

                          {/* Detail Kendala & Catatan Telaah */}
                          <div className="space-y-1.5 rounded-xl bg-white/70 p-3 text-[11px] text-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                            <div className="flex items-start gap-1.5">
                              <span className="shrink-0 font-bold text-slate-900 dark:text-white">
                                Kendala Cacat Fisik:
                              </span>
                              <span className="text-slate-700 dark:text-slate-300">
                                {ret.reasonLabel ||
                                  ret.reason ||
                                  'Klaim Garansi Toko'}
                              </span>
                            </div>
                            {ret.storeResponse && (
                              <div className="flex items-start gap-1.5 border-t border-slate-100 pt-1 text-[10.5px] dark:border-slate-800">
                                <span className="shrink-0 font-bold text-blue-700 dark:text-blue-400">
                                  Telaah After Sales:
                                </span>
                                <span className="italic text-slate-600 dark:text-slate-400">
                                  {ret.storeResponse}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Pelacakan 1: Resi Kirim Balik Pembeli */}
                          <div className="space-y-1.5 rounded-xl border border-purple-200/80 bg-white p-3 dark:border-purple-900/60 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 font-bold text-purple-950 dark:text-purple-200">
                                <Package className="h-3.5 w-3.5 text-purple-600" />
                                Pengiriman Balik dari Pembeli (Retur)
                              </span>
                              {ret.packageReceivedAt ? (
                                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  Paket Telah Tiba di Toko (QC)
                                </span>
                              ) : ret.returnTrackingNumber ? (
                                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9.5px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                  Paket Dalam Pengiriman
                                </span>
                              ) : (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                  Menunggu Resi Pembeli
                                </span>
                              )}
                            </div>

                            {ret.returnTrackingNumber ? (
                              <div className="space-y-2 pt-1 text-xs">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="font-mono">
                                    <span className="text-[10px] text-slate-400">
                                      Kurir & Resi:{' '}
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {ret.returnCourier || 'JNE'} —{' '}
                                      {ret.returnTrackingNumber}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCheckResiQuery(
                                        ret.returnTrackingNumber || ''
                                      )
                                      setShowCheckResiModal(true)
                                    }}
                                    className="shadow-2xs inline-flex cursor-pointer items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-purple-700 active:scale-95"
                                  >
                                    <Search className="h-3 w-3" />
                                    <span>Lacak Resi Pembeli (Biteship)</span>
                                  </button>
                                </div>

                                {/* Tombol Aksi Konfirmasi Tiba di Toko untuk Super Admin */}
                                {ret.packageReceivedAt ||
                                ret.storeResponse?.includes(
                                  '[Paket Fisik Tiba di Cabang]'
                                ) ? (
                                  <div className="rounded-lg bg-emerald-50 p-2 text-[10.5px] text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                                    <span className="font-bold">
                                      Diterima di Cabang:{' '}
                                    </span>
                                    <span>
                                      {ret.packageReceivedAt
                                        ? new Date(
                                            ret.packageReceivedAt
                                          ).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : ret.createdAt
                                          ? new Date(
                                              ret.createdAt
                                            ).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })
                                          : 'Dikonfirmasi Tiba'}{' '}
                                      &bull; Sedang QC Fisik
                                    </span>
                                  </div>
                                ) : (
                                  ret.status !== 'COMPLETED' &&
                                  ret.status !== 'REJECTED' && (
                                    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-[10.5px] dark:bg-slate-800/50">
                                      <span className="text-slate-500">
                                        Barang sudah diterima staf cabang?
                                      </span>
                                      <button
                                        type="button"
                                        disabled={
                                          confirmingArrivalId === ret.id
                                        }
                                        onClick={() =>
                                          handleConfirmPackageArrivalInOrdersDrawer(
                                            ret.id
                                          )
                                        }
                                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-indigo-600 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300"
                                      >
                                        {confirmingArrivalId === ret.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                        <span>
                                          Konfirmasi Paket Tiba di Toko (Mulai
                                          QC)
                                        </span>
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                Pembeli belum menginput nomor resi pengiriman
                                balik ke toko cabang.
                              </p>
                            )}
                          </div>

                          {/* Pelacakan 2 (Khusus REPLACEMENT): Resi Unit Baru Pengganti */}
                          {isReplacement && (
                            <div className="space-y-1.5 rounded-xl border border-blue-200/80 bg-white p-3 dark:border-blue-900/60 dark:bg-slate-900">
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 font-bold text-blue-950 dark:text-blue-200">
                                  <Truck className="h-3.5 w-3.5 text-blue-600" />
                                  Resi Unit Pengganti:
                                </span>
                                {selectedOrder.trackingNumber ? (
                                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9.5px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                    Unit Baru Dikirim
                                  </span>
                                ) : (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    Menunggu Hasil QC Toko
                                  </span>
                                )}
                              </div>

                              {selectedOrder.trackingNumber ? (
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                                  <div className="font-mono">
                                    <span className="text-[10px] text-slate-400">
                                      Kurir & Resi:{' '}
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {selectedOrder.courierCode || 'JNE'} —{' '}
                                      {selectedOrder.trackingNumber}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCheckResiQuery(
                                        selectedOrder.trackingNumber || ''
                                      )
                                      setShowCheckResiModal(true)
                                    }}
                                    className="shadow-2xs inline-flex cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-blue-700 active:scale-95"
                                  >
                                    <Search className="h-3 w-3" />
                                    <span>Lacak Unit Pengganti (Biteship)</span>
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                  Nomor resi unit baru pengganti akan
                                  diterbitkan toko setelah pemeriksaan fisik
                                  (QC) selesai dan dinyatakan lolos.
                                </p>
                              )}
                            </div>
                          )}

                          {/* Pelacakan 3 (Khusus REFUND): Rincian Rekening & Pengembalian Dana */}
                          {!isReplacement && (
                            <div className="space-y-1.5 rounded-xl border border-emerald-200/80 bg-white p-3 dark:border-emerald-900/60 dark:bg-slate-900">
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-950 dark:text-emerald-200">
                                  <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                                  Rincian Pengembalian Dana (Refund Escrow)
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold ${
                                    ret.status === 'COMPLETED'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  }`}
                                >
                                  {ret.status === 'COMPLETED'
                                    ? 'DANA TELAH DICAIRKAN'
                                    : 'DANA ESCROW DITAHAN'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 gap-2 pt-1 text-[11px] sm:grid-cols-2">
                                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                                  <span className="text-[10px] text-slate-400">
                                    Nominal Refund:
                                  </span>
                                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                                    Rp{' '}
                                    {(
                                      ret.refundAmount || selectedOrder.total
                                    ).toLocaleString('id-ID')}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                                  <span className="text-[10px] text-slate-400">
                                    Rekening Tujuan:
                                  </span>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">
                                    {ret.bankName || 'Bank Pembeli'} —{' '}
                                    {ret.bankAccountNumber || '-'}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    a.n.{' '}
                                    {ret.bankAccountName ||
                                      selectedOrder.user?.name ||
                                      '-'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                  {/* Bonus 3-in-1 Callout - Clean Single Line Pill */}
                  {(selectedOrder.bonusChargerIncluded ||
                    selectedOrder.bonusProtectorIncluded ||
                    selectedOrder.bonusCaseIncluded ||
                    true) && (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      <Gift className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        Bonus 3-in-1 Gratis: Charger, Tempered Glass &amp;
                        Softcase
                      </span>
                    </div>
                  )}

                  {/* Informasi Pembayaran Terpadu — Rincian Produk, Komponen Potongan & Estimasi Penghasilan */}
                  <AdminOrderPaymentCard order={selectedOrder} />

                  {/* Destination Address & Shipping Details */}
                  <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Penerima &amp; Pengiriman
                    </span>

                    {(() => {
                      const recipient = parseRecipientInfo(selectedOrder)
                      const courierDisplay = selectedOrder.courierCode
                        ? `${selectedOrder.courierCode} ${selectedOrder.courierService || ''}`
                        : 'Kurir Terproteksi'

                      return (
                        <div className="space-y-2.5 rounded-xl border border-slate-200/80 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-900">
                          {/* Nama & Telepon */}
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {recipient.recipientName}
                              </p>
                              <p className="font-mono text-[11px] text-slate-500">
                                {recipient.recipientPhone}
                              </p>
                            </div>
                            {recipient.recipientPhone &&
                              recipient.recipientPhone !== '-' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      recipient.recipientPhone
                                    )
                                    toast.success('Nomor penerima disalin!')
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                                >
                                  <Copy className="h-3 w-3" />
                                  <span>Salin</span>
                                </button>
                              )}
                          </div>

                          {/* Alamat Lengkap */}
                          <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                            <p className="text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                              {recipient.deliveryAddress}
                            </p>
                            <p className="mt-0.5 text-[10.5px] text-slate-400">
                              {[
                                selectedOrder.user?.city,
                                selectedOrder.user?.province,
                                selectedOrder.user?.postalCode,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          </div>

                          {/* Kurir & AWB */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                            <div>
                              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                                Ekspedisi
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {courierDisplay}
                              </span>
                            </div>
                            {selectedOrder.trackingNumber ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                  {selectedOrder.trackingNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyAWB(selectedOrder.trackingNumber!)
                                  }
                                  className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                  title="Salin Resi"
                                >
                                  {copiedAWB ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  title="Cetak Label Thermal"
                                  onClick={() =>
                                    handleOpenThermalLabel(selectedOrder)
                                  }
                                  className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                >
                                  <Printer className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Menunggu Pick Up
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Customer Account & Chat */}
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/30">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900 dark:text-white">
                        {selectedOrder.user?.name || 'Customer'}
                      </p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedOrder.user?.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isConnectingChat}
                      onClick={() => handleChatCustomer(selectedOrder)}
                      className="shadow-2xs inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {isConnectingChat ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                      )}
                      <span>Hubungi via Chat</span>
                    </button>
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
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800/40 sm:px-7">
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
          onClose={() => {
            setActiveThermalLabel(null)
            setPreviousOrderForModal(null)
          }}
          onBackToOrder={
            previousOrderForModal
              ? () => {
                  const target = previousOrderForModal
                  setActiveThermalLabel(null)
                  setPreviousOrderForModal(null)
                  setSelectedOrder(target)
                }
              : undefined
          }
        />
      )}

      {/* Modal Cetak Faktur Pajak Elektronik Standar DJP */}
      <TaxInvoiceModal
        isOpen={Boolean(taxInvoiceOrder)}
        onClose={() => setTaxInvoiceOrder(null)}
        order={taxInvoiceOrder as any}
      />

      {/* Modal Cek Resi Pengiriman (Tetap di Halaman Ini) */}
      <CheckResiModal
        isOpen={showCheckResiModal}
        onClose={() => setShowCheckResiModal(false)}
        initialQuery={checkResiQuery}
      />
    </div>
  )
}
