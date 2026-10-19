'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Package,
  Search,
  ChevronRight,
  X,
  RotateCcw,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { MobileTopNav } from '@/components/layouts/mobile-top-nav'
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav'
import {
  ORDER_STATUS_MAP as STATUS_MAP,
  isReturnOrder,
  getOrderStatusMeta,
  isReturnEligible,
} from '@/lib/order-return-utils'
import {
  getOrderPaymentRemainingSeconds,
  formatPaymentCountdown,
} from '@/lib/order-expiration'
import {
  getOrderContextualTimestamp,
  sortOrdersByLatestProcess,
} from '@/lib/order-date-utils'

export interface OrderItem {
  id?: string
  type: string
  notes?: string | null
  variantId?: string | null
  variantName?: string | null
  quantity?: number
  price?: number
  subtotal?: number
  service?: { name: string; category: string }
  product?: {
    id: string
    name: string
    brand?: string | null
    images?: string[]
  }
  rentalItem?: { name: string; images?: string[] }
}

export interface MobileOrder {
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
  createdAt: string
  updatedAt?: string | null
  completedAt?: string | null
  customerConfirmedAt?: string | null
  warrantyExpiryDate?: string | null
  store?: {
    id: string
    name: string
    ptName?: string
    city: string
    phone?: string | null
  } | null
  payment?: {
    id: string
    status: string
    notes?: string | null
    verifiedAt?: string | null
  } | null
  items: OrderItem[]
  returnRequests?: Array<{
    id: string
    status: string
    type?: string | null
    reason?: string | null
    reasonLabel?: string | null
    description?: string | null
    createdAt?: string
    resolvedAt?: string | null
  }>
}

interface MobileOrdersViewProps {
  orders: MobileOrder[]
  onOpenReturnModal?: (order: MobileOrder) => void
  initialTab?: string
  activeTab?: string
  onTabChange?: (tab: string) => void
}

function MobilePaymentCountdown({
  createdAt,
  payment,
  orderNumber,
}: {
  createdAt: string
  payment?: { notes?: string | null } | null
  orderNumber: string
}) {
  const getSecs = () => {
    return getOrderPaymentRemainingSeconds({ createdAt, payment })
  }

  const [timeLeft, setTimeLeft] = useState<number>(getSecs)
  const [hasExpired, setHasExpired] = useState(false)

  useEffect(() => {
    setTimeLeft(getSecs())
    const interval = setInterval(() => {
      const rem = getSecs()
      setTimeLeft(rem)
      if (rem <= 0) {
        clearInterval(interval)
        setHasExpired(true)
        fetch(
          `/api/payment/status?orderNumber=${encodeURIComponent(orderNumber)}`
        )
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [createdAt, payment, orderNumber])

  if (hasExpired || timeLeft <= 0) {
    return (
      <div className="flex flex-col items-end">
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertCircle className="h-2.5 w-2.5" />
          <span>Waktu Habis</span>
        </span>
        <span className="mt-0.5 text-[8px] text-rose-400">Dibatalkan</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end">
      <div className="inline-flex items-center gap-1 rounded-md border border-orange-200/90 bg-orange-50/80 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400">
        <Clock className="h-2.5 w-2.5 animate-pulse text-orange-500" />
        <span>{formatPaymentCountdown(timeLeft)}</span>
      </div>
      <span className="mt-0.5 text-[8px] text-slate-400">Batas Bayar</span>
    </div>
  )
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'

function getStatusBadgeClass(
  order: MobileOrder,
  currentStatus: { label: string; textClass: string }
): string {
  if (isReturnOrder(order)) {
    return 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300'
  }
  switch (order.status) {
    case 'PENDING_PAYMENT':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'
    case 'PAID':
    case 'PROCESSING':
      return 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
    case 'SHIPPED':
    case 'IN_PROGRESS':
      return 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300'
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  }
}

export { STATUS_MAP, isReturnOrder, getOrderStatusMeta, getStatusBadgeClass }

export function MobileOrdersView({
  orders,
  onOpenReturnModal,
  initialTab,
  activeTab: controlledActiveTab,
  onTabChange,
}: MobileOrdersViewProps) {
  const [localActiveTab, setLocalActiveTab] = useState(
    controlledActiveTab || initialTab || 'ALL'
  )
  const activeTab =
    controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab

  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ORDERS_PER_PAGE = 10
  // Prevent SSR/client hydration mismatch on dynamic count badges
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (controlledActiveTab !== undefined) {
      setLocalActiveTab(controlledActiveTab)
    } else if (initialTab) {
      setLocalActiveTab(initialTab)
    }
    setCurrentPage(1)
  }, [controlledActiveTab, initialTab])

  const handleTabClick = (tabKey: string) => {
    setLocalActiveTab(tabKey)
    setCurrentPage(1)
    if (onTabChange) {
      onTabChange(tabKey)
    } else if (typeof window !== 'undefined') {
      const newUrl =
        tabKey === 'ALL'
          ? '/dashboard/customer/orders'
          : `/dashboard/customer/orders?status=${tabKey}`
      window.history.replaceState(null, '', newUrl)
    }
  }

  const getOrderDetailHref = (orderId: string) => {
    const currentTab = activeTab || 'ALL'
    return `/dashboard/customer/orders/${orderId}?fromStatus=${currentTab}`
  }

  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) return 'Rp 0'
    return `Rp ${price.toLocaleString('id-ID')}`
  }

  // Hitung jumlah order per status tab (inklusif & akurat)
  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING_PAYMENT: orders.filter((o) => o.status === 'PENDING_PAYMENT')
        .length,
      PROCESSING: orders.filter(
        (o) =>
          (o.status === 'PROCESSING' || o.status === 'PAID') &&
          !isReturnOrder(o)
      ).length,
      SHIPPED: orders.filter(
        (o) =>
          (o.status === 'SHIPPED' || o.status === 'IN_PROGRESS') &&
          !isReturnOrder(o)
      ).length,
      COMPLETED: orders.filter(
        (o) => o.status === 'COMPLETED' && !isReturnOrder(o)
      ).length,
      CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
      RETURNED: orders.filter(isReturnOrder).length,
    }
  }, [orders])

  const tabs = [
    { key: 'ALL', label: 'Semua', count: counts.ALL },
    {
      key: 'PENDING_PAYMENT',
      label: 'Belum Bayar',
      count: counts.PENDING_PAYMENT,
    },
    { key: 'PROCESSING', label: 'Diproses', count: counts.PROCESSING },
    { key: 'SHIPPED', label: 'Dikirim', count: counts.SHIPPED },
    { key: 'COMPLETED', label: 'Selesai', count: counts.COMPLETED },
    { key: 'CANCELLED', label: 'Dibatalkan', count: counts.CANCELLED },
    { key: 'RETURNED', label: 'Dikembalikan', count: counts.RETURNED },
  ]

  // Filter pesanan berdasarkan tab dan pencarian, lalu urutkan dari yang terbaru
  const filteredOrders = useMemo(() => {
    const list = orders.filter((order) => {
      // Filter status
      if (activeTab !== 'ALL') {
        if (activeTab === 'RETURNED') {
          if (!isReturnOrder(order)) return false
        } else if (activeTab === 'PROCESSING') {
          if (isReturnOrder(order)) return false
          if (order.status !== 'PROCESSING' && order.status !== 'PAID')
            return false
        } else if (activeTab === 'SHIPPED') {
          if (isReturnOrder(order)) return false
          if (order.status !== 'SHIPPED' && order.status !== 'IN_PROGRESS')
            return false
        } else if (order.status !== activeTab) {
          return false
        } else if (activeTab === 'COMPLETED' && isReturnOrder(order)) {
          return false
        }
      }

      // Filter query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNumber = order.orderNumber.toLowerCase().includes(q)
        const matchItem = order.items.some(
          (i) =>
            i.product?.name?.toLowerCase().includes(q) ||
            i.product?.brand?.toLowerCase().includes(q) ||
            i.service?.name?.toLowerCase().includes(q)
        )
        const matchStore = order.store?.name?.toLowerCase().includes(q)
        return matchNumber || matchItem || matchStore
      }

      return true
    })

    return sortOrdersByLatestProcess(list)
  }, [orders, activeTab, searchQuery])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE
    return filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE)
  }, [filteredOrders, currentPage])

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Universal Mobile Top Nav */}
      <MobileTopNav
        showBack={true}
        backHref="/dashboard/customer/settings"
        title="Pesanan Saya"
      />

      {/* 2. Shopee/Tokopedia Horizontal Status Tab Bar (Sticky) */}
      <div className="sticky top-[61px] z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="no-scrollbar flex overflow-x-auto px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabClick(tab.key)}
                className={`relative flex shrink-0 items-center gap-1.5 px-3.5 py-3 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'border-b-2 border-orange-500 font-bold text-orange-500'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {/* Hanya render badge count setelah client mount — mencegah SSR/hydration mismatch */}
                {isMounted && tab.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Search Bar Capsule */}
      <div className="border-b border-slate-200/80 bg-white px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Cari pesanan, nomor resi, atau produk..."
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/90 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Orders List Feed */}
      <main className="mt-2 space-y-2.5 px-3">
        {filteredOrders.length === 0 ? (
          <div className="shadow-2xs rounded-2xl border border-slate-200/70 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <Package className="h-7 w-7" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              Belum Ada Pesanan
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {searchQuery
                ? `Tidak ada transaksi yang cocok dengan "${searchQuery}".`
                : 'Tidak ada pesanan dalam status ini.'}
            </p>
            <Link
              href="/gadget"
              className="shadow-2xs mt-4 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95"
            >
              Belanja Sekarang
            </Link>
          </div>
        ) : (
          paginatedOrders.map((order) => {
            const currentStatus = getOrderStatusMeta(order)
            const firstItem = order.items[0]
            const itemImage =
              firstItem?.product?.images?.[0] ||
              firstItem?.rentalItem?.images?.[0] ||
              DEFAULT_IMAGE

            const totalItemCount = order.items.reduce(
              (sum, it) => sum + (it.quantity || 1),
              0
            )

            const contextualTime = getOrderContextualTimestamp(order)

            return (
              <div
                key={order.id}
                className="shadow-xs rounded-2xl border border-slate-100 bg-white p-4 transition-all dark:border-slate-800/80 dark:bg-slate-900"
              >
                {/* Header: Store Name & Status Badge Pill */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {order.store?.name || 'Cabang Resmi Toko'}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
                      order,
                      currentStatus
                    )}`}
                  >
                    {currentStatus.label}
                  </span>
                </div>

                {/* Body: Clickable Item Preview */}
                <Link
                  href={getOrderDetailHref(order.id)}
                  className="block py-3 transition-opacity active:opacity-75"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-800">
                      <img
                        src={itemImage}
                        alt={firstItem?.product?.name || 'Gadget'}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_IMAGE
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-xs font-bold leading-snug text-slate-900 dark:text-white">
                        {firstItem?.product?.name ||
                          firstItem?.service?.name ||
                          firstItem?.notes ||
                          'Unit Smartphone Original'}
                      </h3>

                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        Varian:{' '}
                        {firstItem?.variantName ||
                          firstItem?.product?.brand ||
                          'Standar Original'}
                      </p>

                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-slate-400 dark:text-slate-500">
                          {totalItemCount} barang
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          x{firstItem?.quantity || 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Limit Waktu Pembayaran Tercepat (Hanya pada Belum Bayar) */}
                {order.status === 'PENDING_PAYMENT' && (
                  <div className="mb-2">
                    <MobilePaymentCountdown
                      createdAt={order.createdAt}
                      payment={order.payment}
                      orderNumber={order.orderNumber}
                    />
                  </div>
                )}

                {/* Footer: Date & Order Number on top, Total Price below, Action Buttons on right */}
                <div className="flex items-center justify-between pt-1">
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      <span className="hidden sm:inline">
                        {contextualTime.label}:{' '}
                      </span>
                      <span>{contextualTime.shortDate}</span>
                      <span className="mx-1">•</span>
                      <span className="font-mono">#{order.orderNumber}</span>
                    </div>
                    <div
                      className={`text-sm font-bold sm:text-base ${
                        order.status === 'CANCELLED'
                          ? 'text-slate-900 dark:text-white'
                          : 'text-orange-600 dark:text-orange-400'
                      }`}
                    >
                      {formatPrice(order.total)}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {(() => {
                      const latestReturn = order.returnRequests?.[0]
                      const firstItem = order.items?.[0]
                      const firstProduct = firstItem?.product
                      const chatParams = new URLSearchParams()
                      chatParams.set('orderId', order.id)
                      if (order.store?.id)
                        chatParams.set('storeId', order.store.id)
                      if (order.orderNumber)
                        chatParams.set('orderNumber', order.orderNumber)
                      if (latestReturn) {
                        chatParams.set('returnId', latestReturn.id)
                        chatParams.set(
                          'returnReason',
                          latestReturn.reasonLabel || latestReturn.reason || ''
                        )
                        chatParams.set('returnStatus', latestReturn.status)
                        if (latestReturn.type)
                          chatParams.set('returnType', latestReturn.type)
                      }
                      if (firstProduct?.name)
                        chatParams.set('productName', firstProduct.name)
                      if (firstProduct?.images?.[0])
                        chatParams.set('productImage', firstProduct.images[0])
                      if (firstItem?.price)
                        chatParams.set('productPrice', String(firstItem.price))

                      return (
                        <Link
                          href={`/dashboard/customer/chat?${chatParams.toString()}`}
                          className="shadow-2xs rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          Chat
                        </Link>
                      )
                    })()}

                    {isReturnEligible(order) && onOpenReturnModal && (
                      <button
                        type="button"
                        onClick={() => onOpenReturnModal(order)}
                        className="rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 transition active:scale-95 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300"
                      >
                        Retur
                      </button>
                    )}

                    {order.status === 'PENDING_PAYMENT' ? (
                      <Link
                        href={getOrderDetailHref(order.id)}
                        className="shadow-2xs rounded-full bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600 active:scale-95"
                      >
                        Bayar
                      </Link>
                    ) : isReturnOrder(order) ? (
                      <Link
                        href={getOrderDetailHref(order.id)}
                        className="flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-semibold text-purple-700 transition active:scale-95 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Status Retur</span>
                      </Link>
                    ) : (
                      <Link
                        href={getOrderDetailHref(order.id)}
                        className="rounded-full border border-slate-900 bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-95 dark:border-white dark:bg-white dark:text-slate-900"
                      >
                        Rincian
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Minimalist Mobile Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 px-1 pt-3.5 dark:border-slate-800">
            <span className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
              {paginatedOrders.length}/{filteredOrders.length}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={currentPage === 1}
                className="shrink-0 cursor-pointer whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              >
                Sebelumnya
              </button>
              <span className="shrink-0 whitespace-nowrap px-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={currentPage === totalPages}
                className="shrink-0 cursor-pointer whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 5. Standard Universal Mobile Bottom Navigation */}
      <MobileBottomNav activeTab="akun" />
    </div>
  )
}
