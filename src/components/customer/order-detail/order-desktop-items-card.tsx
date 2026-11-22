'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  Gift,
  Check,
  Building2,
  Truck,
  RotateCcw,
  Star,
  MessageCircle,
} from 'lucide-react'
import {
  OrderData,
  OrderDetailItem,
  OrderReturnRequest,
  DEFAULT_GADGET_IMAGE,
  formatPrice,
} from './order-detail-types'
import { findReturnForOrderItem } from '@/lib/order-return-utils'

interface OrderDesktopItemsCardProps {
  order: OrderData
  canRequestReturnOrComplaint?: boolean
  hasActiveClaim?: boolean
  isCompleted?: boolean
  latestReturnRequest?: OrderReturnRequest | null
  onOpenReturnForItem?: (item: OrderDetailItem) => void
  onOpenRatingForItem?: (item: OrderDetailItem) => void
}

export function OrderDesktopItemsCard({
  order,
  canRequestReturnOrComplaint,
  hasActiveClaim,
  isCompleted,
  latestReturnRequest,
  onOpenReturnForItem,
  onOpenRatingForItem,
}: OrderDesktopItemsCardProps) {
  const isMultiItem = order.items.length > 1
  return (
    <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <ShoppingBag className="h-4 w-4 text-slate-500" />
          Rincian Unit Gadget
        </h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {order.items.reduce((acc, it) => acc + it.quantity, 0)} Unit
        </span>
      </div>

      {/* Items List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {order.items.map((item) => {
          const itemImage =
            item.product?.images?.[0] ||
            item.rentalItem?.images?.[0] ||
            DEFAULT_GADGET_IMAGE
          const itemLink = item.product ? `/gadget/${item.product.slug}` : '#'

          return (
            <div
              key={item.id}
              className="flex items-start gap-4 py-4 first:pt-0 last:pb-0 sm:py-5"
            >
              <div className="sm:h-22 sm:w-22 relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/60">
                <img
                  src={itemImage}
                  alt={item.product?.name || 'Gadget'}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_GADGET_IMAGE
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start sm:gap-4">
                  <div className="min-w-0">
                    {item.product?.brand && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {item.product.brand}
                      </span>
                    )}
                    <Link
                      href={itemLink}
                      className="line-clamp-1 block text-sm font-bold text-slate-900 transition hover:text-slate-600 dark:text-white dark:hover:text-slate-300 sm:text-base"
                    >
                      {item.product?.name ||
                        item.service?.name ||
                        item.notes ||
                        'Unit Gadget Original'}
                    </Link>
                    {item.variantName && (
                      <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Varian: {item.variantName}
                      </span>
                    )}
                    {item.notes && !item.variantName && (
                      <p className="mt-0.5 text-xs italic text-slate-500">
                        Catatan: {item.notes}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      {item.quantity} unit × {formatPrice(item.price)}
                    </p>
                    {/* Aksi Khusus per Produk untuk Pembelian Keranjang / Multi-Item */}
                    {isMultiItem &&
                      (() => {
                        const itemSpecificReturn = findReturnForOrderItem(
                          order.returnRequests,
                          item,
                          order.items.length
                        )
                        const isItemClaimActive = Boolean(
                          itemSpecificReturn &&
                          [
                            'PENDING',
                            'IN_REVIEW',
                            'APPROVED',
                            'COMPLETED',
                          ].includes(itemSpecificReturn.status)
                        )

                        return (
                          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100/80 pt-2.5 dark:border-slate-800/80">
                            {itemSpecificReturn && (
                              <span className="inline-flex items-center gap-1 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-[11px] font-bold text-purple-700 dark:border-purple-800/60 dark:bg-purple-950/40 dark:text-purple-300">
                                <RotateCcw className="h-3.5 w-3.5 text-purple-600" />
                                <span>
                                  {itemSpecificReturn.status === 'PENDING'
                                    ? 'Menunggu Verifikasi Retur'
                                    : itemSpecificReturn.status === 'IN_REVIEW'
                                      ? 'Retur Sedang Ditinjau'
                                      : itemSpecificReturn.status ===
                                          'COMPLETED'
                                        ? 'Retur Selesai'
                                        : itemSpecificReturn.status ===
                                            'REJECTED'
                                          ? 'Retur Ditolak'
                                          : 'Retur Disetujui'}
                                </span>
                              </span>
                            )}

                            {/* 1. Ajukan Komplain / Retur per Item */}
                            {canRequestReturnOrComplaint &&
                              !isItemClaimActive &&
                              isCompleted && (
                                <button
                                  type="button"
                                  onClick={() => onOpenReturnForItem?.(item)}
                                  className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-orange-200/90 bg-orange-50/70 px-3 py-1.5 text-[11px] font-bold text-orange-600 transition-all hover:border-orange-300 hover:bg-orange-100 active:scale-95 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 text-orange-600" />
                                  <span>Ajukan Retur Unit Ini</span>
                                </button>
                              )}

                            {/* 2. Beri Ulasan per Item */}
                            {isCompleted && !isItemClaimActive && (
                              <button
                                type="button"
                                onClick={() => onOpenRatingForItem?.(item)}
                                className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              >
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                <span>Beri Ulasan</span>
                              </button>
                            )}

                            {/* 3. Chat Toko / After Sales per Item */}
                            {(() => {
                              const prod =
                                item.product || item.rentalItem || item.service
                              const itemChatParams = new URLSearchParams()
                              itemChatParams.set('orderId', order.id)
                              if (order.store?.id)
                                itemChatParams.set('storeId', order.store.id)
                              if (order.orderNumber)
                                itemChatParams.set(
                                  'orderNumber',
                                  order.orderNumber
                                )
                              if (prod?.name)
                                itemChatParams.set('productName', prod.name)
                              const prodImg = (prod as any)?.images?.[0]
                              if (prodImg)
                                itemChatParams.set('productImage', prodImg)
                              if (item.price)
                                itemChatParams.set(
                                  'productPrice',
                                  String(item.price)
                                )
                              if (item.variantName)
                                itemChatParams.set(
                                  'variantName',
                                  item.variantName
                                )
                              if (isCompleted)
                                itemChatParams.set('type', 'after_sales')

                              return (
                                <Link
                                  href={`/dashboard/customer/chat?${itemChatParams.toString()}`}
                                  className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200"
                                >
                                  <MessageCircle className="h-3.5 w-3.5 text-slate-500" />
                                  <span>
                                    {isCompleted
                                      ? 'Chat After Sales'
                                      : 'Chat Toko'}
                                  </span>
                                </Link>
                              )
                            })()}
                          </div>
                        )
                      })()}
                  </div>
                  <span className="shrink-0 whitespace-nowrap font-mono text-base font-black text-slate-950 dark:text-white sm:text-lg">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 3-in-1 Bonus Package Bundle Strip */}
      {(order.bonusChargerIncluded ||
        order.bonusProtectorIncluded ||
        order.bonusCaseIncluded) && (
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 shrink-0 text-slate-500" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Paket Bonus 3-in-1 Gratis (Rp 0)
              </h4>
            </div>
            <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              Termasuk
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3">
            <div className="flex items-center gap-1.5 font-medium">
              <Check className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span>Fast Charger Set</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Check className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span>Antigores Terpasang</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Check className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span>Premium Softcase</span>
            </div>
          </div>
        </div>
      )}

      {/* Unified Integrated Logistics Strip */}
      <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-5 text-xs dark:border-slate-800 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="text-slate-600 dark:text-slate-400">
            Toko:{' '}
            <strong className="text-slate-900 dark:text-white">
              {order.store?.name || 'Roxy Mas Jakarta'}
            </strong>{' '}
            ({order.store?.city || 'Jakarta'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="text-slate-600 dark:text-slate-400">
            Kurir:{' '}
            <strong className="text-slate-900 dark:text-white">
              {order.courierCode || 'JNE'}{' '}
              {order.courierService || 'Layanan Cepat'}
            </strong>{' '}
            •{' '}
            {order.status === 'CANCELLED' ? (
              <span className="font-semibold text-rose-600">
                Pengiriman Dibatalkan
              </span>
            ) : (
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                100% Asuransi Wajib
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
