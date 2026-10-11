'use client'

import React from 'react'
import Link from 'next/link'
import { RotateCcw, Package, ExternalLink } from 'lucide-react'
import { PinnedOrderContext, statusConfig } from './chat-types'

interface ChatPinnedBannerProps {
  activePinnedOrder: PinnedOrderContext | null
  onScrollToContextMessage: (messageId?: string) => void
}

export function ChatPinnedBanner({
  activePinnedOrder,
  onScrollToContextMessage,
}: ChatPinnedBannerProps) {
  if (!activePinnedOrder) return null

  return (
    <div
      onClick={() => onScrollToContextMessage(activePinnedOrder.messageId)}
      className="flex shrink-0 cursor-pointer items-center justify-between border-b border-blue-100/80 bg-blue-50/70 px-4 py-2 text-xs transition-all hover:bg-blue-100/60 dark:border-blue-900/40 dark:bg-blue-950/40"
      title="Klik untuk melompat ke kartu pesanan ini di chat"
    >
      <div className="flex min-w-0 items-center gap-2 truncate">
        {activePinnedOrder.isReturn ? (
          <RotateCcw className="h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
        ) : (
          <Package className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
        )}
        <span className="truncate font-mono font-bold text-blue-950 dark:text-blue-200">
          Order #{activePinnedOrder.orderNumber}
        </span>
        {(activePinnedOrder.total ?? 0) > 0 && (
          <>
            <span className="hidden text-slate-400 sm:inline">•</span>
            <span className="hidden font-medium text-slate-600 dark:text-slate-300 sm:inline">
              Rp {activePinnedOrder.total!.toLocaleString('id-ID')}
            </span>
          </>
        )}
        {activePinnedOrder.isReturn ? (
          <span className="py-0.2 rounded bg-purple-100 px-1.5 text-[9.5px] font-bold text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
            Retur:{' '}
            {activePinnedOrder.returnStatus === 'APPROVED'
              ? 'Disetujui'
              : activePinnedOrder.returnStatus === 'REJECTED'
                ? 'Ditolak'
                : activePinnedOrder.returnStatus === 'COMPLETED'
                  ? 'Selesai'
                  : 'Verifikasi'}
          </span>
        ) : statusConfig[activePinnedOrder.status || ''] ? (
          <span className="py-0.2 rounded bg-blue-100/80 px-1.5 text-[9.5px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
            {statusConfig[activePinnedOrder.status!].label}
          </span>
        ) : activePinnedOrder.status ? (
          <span className="py-0.2 rounded bg-blue-100/80 px-1.5 text-[9.5px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
            {activePinnedOrder.status}
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <span className="hidden items-center gap-1 text-[10.5px] font-semibold text-blue-600/80 dark:text-blue-400/80 md:inline-flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
          Konteks Pinned
        </span>
        {activePinnedOrder.orderId && (
          <Link
            href={`/dashboard/customer/orders/${activePinnedOrder.orderId}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400"
          >
            <span>Lihat Rincian</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  )
}
