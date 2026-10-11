'use client'

import React from 'react'
import { Calendar, Copy, Check } from 'lucide-react'
import { OrderData, StatusBadgeInfo } from './order-detail-types'

interface OrderDesktopHeroHeaderProps {
  order: OrderData
  copied: boolean
  copyOrderNumber: () => void
  contextualTime: {
    label: string
    fullDateTime: string
  }
  currentStatus: StatusBadgeInfo
}

export function OrderDesktopHeroHeader({
  order,
  copied,
  copyOrderNumber,
  contextualTime,
  currentStatus,
}: OrderDesktopHeroHeaderProps) {
  return (
    <div className="shadow-2xs mb-6 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Order Identity & Date */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="break-all font-mono text-sm font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              #{order.orderNumber}
            </h1>
            <button
              onClick={copyOrderNumber}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
              title="Salin Nomor Pesanan"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3 text-slate-400" />
              )}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>
                <span className="text-slate-400 dark:text-slate-500">
                  {contextualTime.label}:{' '}
                </span>
                {contextualTime.fullDateTime}
              </span>
            </span>
            <span>•</span>
            <span>{order.store?.ptName || 'PT Resmi Terverifikasi'}</span>
          </div>
        </div>

        {/* Status Badge & Tracking Code */}
        <div className="flex flex-col gap-1.5 sm:items-end">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold ${currentStatus.badgeBg}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${currentStatus.dotColor}`}
            />
            <span>{currentStatus.label}</span>
          </div>
          {order.trackingNumber && (
            <p className="font-mono text-[11px] text-slate-500">
              Resi:{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {order.trackingNumber}
              </span>{' '}
              ({order.courierCode || 'JNE'} {order.courierService || 'REG'})
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
