'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingBag, Gift, Check, Building2, Truck } from 'lucide-react'
import {
  OrderData,
  DEFAULT_GADGET_IMAGE,
  formatPrice,
} from './order-detail-types'

interface OrderDesktopItemsCardProps {
  order: OrderData
}

export function OrderDesktopItemsCard({ order }: OrderDesktopItemsCardProps) {
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
