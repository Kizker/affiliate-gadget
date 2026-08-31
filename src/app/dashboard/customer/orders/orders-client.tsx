'use client'

import { useState, useMemo } from 'react'
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
  ArrowRight,
  Search,
  Building2,
  Truck,
  ShieldCheck,
  ShoppingBag,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  RotateCcw,
  X,
  CreditCard,
  ChevronRight,
  Undo2,
} from 'lucide-react'
import { ReturnModal } from '@/components/customer/return-modal'
import { toast } from 'sonner'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  subtotal?: number
  shippingCost?: number
  insuranceFee?: number
  courierCode?: string | null
  courierService?: string | null
  trackingNumber?: string | null
  warrantyExpiryDate?: string | null
  createdAt: string
  notes?: string | null
  store?: {
    id: string
    name: string
    ptName?: string
    city: string
    phone?: string | null
  } | null
  items: Array<{
    type: string
    notes?: string | null
    quantity?: number
    price?: number
    subtotal?: number
    service?: { name: string; category: string }
    product?: { id: string; name: string; brand?: string | null; images?: string[] }
    rentalItem?: { name: string; images?: string[] }
  }>
  review?: { rating: number; comment: string | null } | null
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
  }>
  returnRequests?: Array<{
    id: string
    type: string
    reason: string
    reasonLabel?: string | null
    description: string
    images: string[]
    bankName?: string | null
    bankAccountNumber?: string | null
    bankAccountName?: string | null
    refundAmount?: number | null
    status: string
    storeResponse?: string | null
    returnCourier?: string | null
    returnTrackingNumber?: string | null
    createdAt: string
    resolvedAt?: string | null
  }>
}

const statusConfig: Record<
  string,
  {
    label: string
    badgeBg: string
    dotColor: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    badgeBg: 'bg-amber-50/90 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300',
    dotColor: 'bg-amber-500',
    icon: Clock,
  },
  PAID: {
    label: 'Pembayaran Diterima',
    badgeBg: 'bg-blue-50/90 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300',
    dotColor: 'bg-blue-500',
    icon: CheckCircle,
  },
  PROCESSING: {
    label: 'Diproses Toko',
    badgeBg: 'bg-indigo-50/90 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
    icon: Package,
  },
  IN_PROGRESS: {
    label: 'Sedang Dikirim',
    badgeBg: 'bg-orange-50/90 text-orange-700 border-orange-200/80 dark:bg-orange-950/40 dark:border-orange-900/60 dark:text-orange-300',
    dotColor: 'bg-orange-500',
    icon: Truck,
  },
  COMPLETED: {
    label: 'Selesai & Diterima',
    badgeBg: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    badgeBg: 'bg-rose-50/90 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300',
    dotColor: 'bg-rose-500',
    icon: XCircle,
  },
}

const DEFAULT_GADGET_IMAGE = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Return Modal state
  const [returnModal, setReturnModal] = useState<{
    isOpen: boolean
    orderId: string
    orderNumber: string
    totalAmount?: number
  }>({
    isOpen: false,
    orderId: '',
    orderNumber: '',
  })

  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) return 'Rp 0'
    return `Rp ${price.toLocaleString('id-ID')}`
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(`Nomor pesanan #${text} berhasil disalin`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Calculate dynamic tab counts
  const counts = useMemo(() => {
    return {
      ALL: initialOrders.length,
      PENDING_PAYMENT: initialOrders.filter((o) => o.status === 'PENDING_PAYMENT').length,
      PROCESSING: initialOrders.filter((o) => o.status === 'PROCESSING' || o.status === 'PAID').length,
      IN_PROGRESS: initialOrders.filter((o) => o.status === 'IN_PROGRESS').length,
      COMPLETED: initialOrders.filter((o) => o.status === 'COMPLETED').length,
      CANCELLED: initialOrders.filter((o) => o.status === 'CANCELLED').length,
    }
  }, [initialOrders])

  const filterOptions = [
    { value: 'ALL', label: 'Semua Pesanan', count: counts.ALL },
    { value: 'PENDING_PAYMENT', label: 'Belum Bayar', count: counts.PENDING_PAYMENT },
    { value: 'PROCESSING', label: 'Diproses Toko', count: counts.PROCESSING },
    { value: 'IN_PROGRESS', label: 'Sedang Dikirim', count: counts.IN_PROGRESS },
    { value: 'COMPLETED', label: 'Selesai', count: counts.COMPLETED },
    { value: 'CANCELLED', label: 'Dibatalkan', count: counts.CANCELLED },
  ]

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      // Status filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'PROCESSING' && (order.status === 'PROCESSING' || order.status === 'PAID')) {
          // match
        } else if (order.status !== selectedStatus) {
          return false
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNumber = order.orderNumber.toLowerCase().includes(q)
        const matchProduct = order.items.some(
          (i) =>
            i.product?.name?.toLowerCase().includes(q) ||
            i.product?.brand?.toLowerCase().includes(q) ||
            i.service?.name?.toLowerCase().includes(q)
        )
        const matchStore = order.store?.name?.toLowerCase().includes(q)
        return matchNumber || matchProduct || matchStore
      }

      return true
    })
  }, [initialOrders, selectedStatus, searchQuery])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60 dark:bg-slate-950 font-sans">
      <Navbar variant="light" />

      <main className="flex-1 pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Unified Control Panel: Status Filter Pills & Search Capsule (Sesuai Desain Manajemen Produk) */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6">
            {/* Left: Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/80 rounded-2xl dark:bg-slate-800/80 no-scrollbar">
              {filterOptions.map((opt) => {
                const isActive = selectedStatus === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedStatus(opt.value)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.count > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                          isActive
                            ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                            : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Right: Search Capsule */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pesanan, nomor resi..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Orders Bento List */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                <Package className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                Belum Ada Pesanan Ditemukan
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? `Tidak ada transaksi yang cocok dengan kata kunci "${searchQuery}".`
                  : 'Anda belum memiliki transaksi pesanan pada status yang dipilih.'}
              </p>
              <Link
                href="/gadget"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 text-white px-5 py-2.5 text-xs font-bold hover:bg-slate-800 dark:bg-white dark:text-slate-950 shadow-xs transition"
              >
                Jelajahi Katalog Gadget
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const currentStatus = statusConfig[order.status] || statusConfig.PROCESSING
                const StatusIcon = currentStatus.icon
                const firstItem = order.items[0]
                const itemImage =
                  firstItem?.product?.images?.[0] ||
                  firstItem?.rentalItem?.images?.[0] ||
                  DEFAULT_GADGET_IMAGE

                const formattedDate = new Date(order.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })

                return (
                  <div
                    key={order.id}
                    className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all duration-200 dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* 1. Top Meta Bar: Store Badge, Monospace Order Number & Status Pill */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800 px-3 py-1 font-bold text-slate-800 dark:text-slate-200">
                          <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{order.store?.name || 'Cabang Resmi Toko'}</span>
                        </div>

                        <button
                          onClick={() => copyToClipboard(order.orderNumber, order.id)}
                          title="Salin nomor pesanan"
                          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                        >
                          <span>#{order.orderNumber}</span>
                          {copiedId === order.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </button>

                        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

                        <span className="text-slate-400 text-xs hidden sm:inline">
                          {formattedDate}
                        </span>
                      </div>

                      {/* Semantic Status Badge */}
                      <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold border ${currentStatus.badgeBg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dotColor}`} />
                        <span>{currentStatus.label}</span>
                      </div>
                    </div>

                    {/* 2. Main Body: Product Item (Left) & Financial + Action (Right) */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                      
                      {/* Left: Thumbnail & Gadget Details */}
                      <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                        <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800 p-2 flex items-center justify-center">
                          <img
                            src={itemImage}
                            alt={firstItem?.product?.name || 'Gadget'}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_GADGET_IMAGE
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          {firstItem?.product?.brand && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                              {firstItem.product.brand}
                            </span>
                          )}
                          <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-snug line-clamp-1">
                            {firstItem?.product?.name || firstItem?.service?.name || 'Unit Smartphone Original'}
                          </h3>
                          
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{firstItem?.quantity || 1} Unit</span>
                            {order.items.length > 1 && (
                              <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                +{order.items.length - 1} produk lainnya
                              </span>
                            )}
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Paket Bonus 3-in-1
                            </span>
                          </div>

                          {/* Badges: Logistics & 30-Day Guarantee */}
                          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              <Truck className="h-3.5 w-3.5 text-orange-500" />
                              {order.courierCode || 'JNE'} {order.courierService || 'REG'}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              Garansi 30 Hari Ganti Baru
                            </span>

                            {/* Return Status Chip if exists */}
                            {order.returnRequests && order.returnRequests.length > 0 && (
                              <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                                order.returnRequests[0].status === 'APPROVED' || order.returnRequests[0].status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : order.returnRequests[0].status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300'
                              }`}>
                                <RotateCcw className="h-3 w-3" />
                                <span>
                                  {order.returnRequests[0].status === 'APPROVED'
                                    ? 'Retur Disetujui'
                                    : order.returnRequests[0].status === 'COMPLETED'
                                    ? 'Retur Selesai'
                                    : order.returnRequests[0].status === 'REJECTED'
                                    ? 'Retur Ditolak'
                                    : 'Pengajuan Retur Diproses'}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Total Price & Quick Action Buttons */}
                      <div className="flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                        
                        <div className="flex flex-col lg:items-end">
                          <span className="text-xs text-slate-400 font-medium">Total Pembayaran:</span>
                          <span className="font-mono text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                            {formatPrice(order.total)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/dashboard/customer/chat?orderId=${order.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition active:scale-95"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Chat Toko</span>
                          </Link>

                          {/* Ajukan Pengembalian for COMPLETED orders */}
                          {order.status === 'COMPLETED' && (!order.returnRequests || order.returnRequests.length === 0 || order.returnRequests[0].status === 'REJECTED') && (
                            <button
                              onClick={() => setReturnModal({
                                isOpen: true,
                                orderId: order.id,
                                orderNumber: order.orderNumber,
                                totalAmount: order.total,
                              })}
                              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/90 bg-orange-50/70 hover:bg-orange-100 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300 px-3.5 py-2 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                            >
                              <RotateCcw className="h-3.5 w-3.5 text-orange-600" />
                              <span>Ajukan Pengembalian</span>
                            </button>
                          )}

                          {order.status === 'PENDING_PAYMENT' ? (
                            <Link
                              href={`/dashboard/customer/orders/${order.id}`}
                              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 text-xs font-bold shadow-xs transition active:scale-95"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Bayar Sekarang</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/customer/orders/${order.id}`}
                              className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 hover:bg-slate-800 dark:bg-white dark:text-slate-950 text-white px-5 py-2 text-xs font-bold shadow-xs transition active:scale-95"
                            >
                              <span>Rincian Pesanan</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
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

      {/* Return Modal */}
      <ReturnModal
        isOpen={returnModal.isOpen}
        onClose={() => setReturnModal((prev) => ({ ...prev, isOpen: false }))}
        orderId={returnModal.orderId}
        orderNumber={returnModal.orderNumber}
        totalAmount={returnModal.totalAmount}
        onSuccess={() => router.refresh()}
      />

      <Footer variant="light" />
    </div>
  )
}
