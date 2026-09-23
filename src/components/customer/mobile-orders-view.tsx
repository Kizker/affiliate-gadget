'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Package,
  Search,
  Store,
  Truck,
  ShieldCheck,
  ChevronRight,
  Copy,
  Check,
  X,
  RotateCcw,
} from 'lucide-react'
import { MobileTopNav } from '@/components/layouts/mobile-top-nav'
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav'
import { toast } from 'sonner'
import {
  ORDER_STATUS_MAP as STATUS_MAP,
  isReturnOrder,
  getOrderStatusMeta,
} from '@/lib/order-return-utils'

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
  store?: {
    id: string
    name: string
    ptName?: string
    city: string
    phone?: string | null
  } | null
  items: OrderItem[]
  returnRequests?: Array<{
    id: string
    status: string
    type?: string | null
    reason?: string | null
    reasonLabel?: string | null
    description?: string | null
  }>
}

interface MobileOrdersViewProps {
  orders: MobileOrder[]
  onOpenReturnModal?: (order: MobileOrder) => void
  initialTab?: string
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'

export { STATUS_MAP, isReturnOrder, getOrderStatusMeta }

export function MobileOrdersView({
  orders,
  onOpenReturnModal,
  initialTab,
}: MobileOrdersViewProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  // Prevent SSR/client hydration mismatch on dynamic count badges
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  const copyOrderNumber = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(`Nomor pesanan #${text} disalin`)
    setTimeout(() => setCopiedId(null), 1500)
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

  // Filter pesanan berdasarkan tab dan pencarian
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
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
  }, [orders, activeTab, searchQuery])

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Universal Mobile Top Nav */}
      <MobileTopNav showBack={true} backHref="/" title="Pesanan Saya" />

      {/* 2. Shopee/Tokopedia Horizontal Status Tab Bar (Sticky) */}
      <div className="sticky top-[61px] z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="no-scrollbar flex overflow-x-auto px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pesanan, nomor resi, atau produk..."
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/90 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
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
          filteredOrders.map((order) => {
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

            const formattedDate = new Date(order.createdAt).toLocaleDateString(
              'id-ID',
              {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }
            )

            return (
              <div
                key={order.id}
                className="shadow-2xs rounded-2xl border border-slate-200/70 bg-white p-3.5 transition-all dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Header: Store Name & Status Text */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 shrink-0 text-slate-700 dark:text-slate-300" />
                    <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {order.store?.name || 'Cabang Resmi Toko'}
                    </span>
                    <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
                  </div>
                  <span
                    className={`shrink-0 text-[11px] ${currentStatus.textClass}`}
                  >
                    {currentStatus.label}
                  </span>
                </div>

                {/* Body: Clickable Item Preview */}
                <Link
                  href={`/dashboard/customer/orders/${order.id}`}
                  className="block py-3 transition-opacity active:opacity-75"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-800">
                      <img
                        src={itemImage}
                        alt={firstItem?.product?.name || 'Gadget'}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_IMAGE
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 text-xs font-bold leading-snug text-slate-900 dark:text-white">
                        {firstItem?.product?.name ||
                          firstItem?.service?.name ||
                          firstItem?.notes ||
                          'Unit Smartphone Original'}
                      </h4>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {firstItem?.variantName && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {firstItem.variantName}
                          </span>
                        )}
                        <span>
                          {firstItem?.product?.brand || 'Gadget Terverifikasi'}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          x{firstItem?.quantity || 1}
                        </span>
                      </div>

                      {order.items.length > 1 && (
                        <div className="mt-1.5 space-y-0.5 rounded-lg bg-slate-50 p-1.5 text-[10px] text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                          {order.items.slice(1).map((extra, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate">
                                •{' '}
                                {extra.product?.name ||
                                  extra.service?.name ||
                                  extra.notes ||
                                  'Item Gadget'}
                              </span>
                              <span className="ml-1 shrink-0 font-mono">
                                x{extra.quantity || 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Mini Feature Badges */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <Truck className="h-2.5 w-2.5 text-orange-500" />
                          {order.courierCode || 'JNE'}{' '}
                          {order.courierService || 'REG'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" />
                          Garansi 30 Hari
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Sub-meta: Order Number & Date */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => copyOrderNumber(order.orderNumber, order.id)}
                    className="inline-flex items-center gap-1 font-mono transition hover:text-slate-950 dark:hover:text-white"
                  >
                    <span>#{order.orderNumber}</span>
                    {copiedId === order.id ? (
                      <Check className="h-2.5 w-2.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-2.5 w-2.5 text-slate-400" />
                    )}
                  </button>
                  <span>{formattedDate}</span>
                </div>

                {/* Footer: Total & Actions */}
                <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                  <div className="min-w-0">
                    <span className="block text-[10px] text-slate-400">
                      Total ({totalItemCount} produk):
                    </span>
                    <span className="block text-xs font-black text-orange-600 dark:text-orange-400">
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
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
                          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          Chat Toko
                        </Link>
                      )
                    })()}

                    {order.status === 'COMPLETED' &&
                      (!order.returnRequests ||
                        order.returnRequests.length === 0) &&
                      onOpenReturnModal && (
                        <button
                          type="button"
                          onClick={() => onOpenReturnModal(order)}
                          className="rounded-xl border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[11px] font-bold text-orange-700 transition active:scale-95 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300"
                        >
                          Retur
                        </button>
                      )}

                    {order.status === 'PENDING_PAYMENT' ? (
                      <Link
                        href={`/dashboard/customer/orders/${order.id}`}
                        className="shadow-2xs rounded-xl bg-orange-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-orange-600 active:scale-95"
                      >
                        Bayar Sekarang
                      </Link>
                    ) : isReturnOrder(order) ? (
                      <Link
                        href={`/dashboard/customer/orders/${order.id}`}
                        className="flex items-center gap-1 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-[11px] font-bold text-purple-700 transition active:scale-95 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Status Retur</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/customer/orders/${order.id}`}
                        className="rounded-xl border border-slate-900 bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white transition active:scale-95 dark:border-white dark:bg-white dark:text-slate-900"
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
      </main>

      {/* 5. Standard Universal Mobile Bottom Navigation */}
      <MobileBottomNav activeTab="akun" />
    </div>
  )
}
