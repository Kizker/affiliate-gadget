'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Package,
  Search,
  X,
  Loader2,
  RotateCcw,
  Store,
  ChevronRight,
} from 'lucide-react'

interface ScopedOrderItem {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  store?: {
    id: string
    name: string
    city: string
  } | null
  items?: Array<{
    id: string
    quantity?: number
    price?: number
    variantName?: string | null
    product?: {
      id: string
      name: string
      images?: string[]
      brand?: string | null
    } | null
  }>
  returnRequests?: Array<{
    id: string
    status: string
    type: string
    reason: string
  }>
}

interface CustomerOrderPickerModalProps {
  isOpen: boolean
  onClose: () => void
  storeId?: string | null
  storeName?: string
  isAfterSales?: boolean
  onSelectOrder: (order: ScopedOrderItem) => void
}

export function CustomerOrderPickerModal({
  isOpen,
  onClose,
  storeId,
  storeName,
  isAfterSales,
  onSelectOrder,
}: CustomerOrderPickerModalProps) {
  const [orders, setOrders] = useState<ScopedOrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const fetchScopedOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (storeId) params.append('storeId', storeId)
      if (isAfterSales) params.append('isAfterSales', 'true')
      if (search.trim()) params.append('search', search.trim())

      const res = await fetch(`/api/customer/chat/orders?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setOrders(json.orders || [])
      }
    } catch (err) {
      console.error('Error loading scoped customer orders:', err)
    } finally {
      setLoading(false)
    }
  }, [storeId, isAfterSales, search])

  useEffect(() => {
    if (isOpen) {
      fetchScopedOrders()
    }
  }, [isOpen, fetchScopedOrders])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAfterSales
                  ? 'Bagikan Pesanan Selesai / Garansi'
                  : 'Bagikan Pesanan Berlangsung'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {storeName
                  ? `Khusus pesanan di ${storeName}`
                  : 'Pilih pesanan untuk dibahas di chat'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="border-b border-slate-100 p-3 dark:border-slate-800 sm:px-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. order atau nama gadget..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Order List */}
        <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto p-3 dark:divide-slate-800 sm:p-4">
          {loading ? (
            <div className="flex h-44 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center p-4 text-center text-slate-400">
              <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tidak ada pesanan ditemukan
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {isAfterSales
                  ? 'Tidak ada pesanan selesai / bergaransi pada toko cabang ini.'
                  : 'Tidak ada pesanan berlangsung pada toko cabang ini.'}
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const firstItem = order.items?.[0]
              const prodName = firstItem?.product?.name || 'Unit Gadget'
              const prodImage = firstItem?.product?.images?.[0]
              const returnReq = order.returnRequests?.[0]

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    onSelectOrder(order)
                    onClose()
                  }}
                  className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl p-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {prodImage ? (
                      <img
                        src={prodImage}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-white object-cover dark:border-slate-700"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
                        <Package className="h-5 w-5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            order.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : order.status === 'RETURNED'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          }`}
                        >
                          {order.status}
                        </span>
                        {returnReq && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            <RotateCcw className="h-2.5 w-2.5" />
                            Retur {returnReq.type}
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {prodName}
                        {firstItem?.variantName
                          ? ` (${firstItem.variantName})`
                          : ''}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-[10.5px] text-slate-400">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Rp {Math.round(order.total).toLocaleString('id-ID')}
                        </span>
                        {order.store?.name && (
                          <>
                            <span>&bull;</span>
                            <span className="inline-flex items-center gap-1">
                              <Store className="h-3 w-3" />
                              {order.store.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="shadow-2xs inline-flex shrink-0 items-center gap-1 rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-bold text-white transition active:scale-95 group-hover:bg-orange-700"
                  >
                    <span>Bagikan</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
