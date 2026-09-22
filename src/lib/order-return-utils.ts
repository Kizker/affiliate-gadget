export interface ReturnRequestSummary {
  id?: string
  status: string
  type?: string | null
  reason?: string | null
  reasonLabel?: string | null
  description?: string | null
}

export interface BaseOrderForReturn {
  status: string
  returnRequests?: ReturnRequestSummary[] | null
}

export const ORDER_STATUS_MAP: Record<
  string,
  { label: string; textClass: string }
> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    textClass: 'text-orange-500 font-bold',
  },
  PAID: {
    label: 'Pembayaran Diterima',
    textClass: 'text-blue-600 dark:text-blue-400 font-bold',
  },
  PROCESSING: {
    label: 'Sedang Dikemas',
    textClass: 'text-blue-600 dark:text-blue-400 font-bold',
  },
  IN_PROGRESS: {
    label: 'Sedang Dikirim',
    textClass: 'text-amber-600 dark:text-amber-400 font-bold',
  },
  SHIPPED: {
    label: 'Sedang Dikirim',
    textClass: 'text-amber-600 dark:text-amber-400 font-bold',
  },
  COMPLETED: {
    label: 'Selesai',
    textClass: 'text-emerald-600 dark:text-emerald-400 font-bold',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    textClass: 'text-slate-400 font-medium',
  },
  RETURNED: {
    label: 'Dikembalikan',
    textClass: 'text-purple-600 dark:text-purple-400 font-bold',
  },
}

/**
 * Determines if an order belongs to the RETURNED category (either status is RETURNED or has return requests)
 */
export function isReturnOrder(order: BaseOrderForReturn): boolean {
  if (order.status === 'RETURNED') return true
  if (order.returnRequests && order.returnRequests.length > 0) return true
  return false
}

/**
 * Returns contextual status metadata (label, textClass, badge) for mobile order view
 */
export function getOrderStatusMeta(order: BaseOrderForReturn): {
  label: string
  textClass: string
} {
  const latestReturn = order.returnRequests?.[0]
  if (order.status === 'RETURNED' || latestReturn) {
    if (latestReturn?.status === 'PENDING') {
      return {
        label: 'Menunggu Verifikasi Retur',
        textClass: 'text-orange-600 dark:text-orange-400 font-bold',
      }
    }
    if (latestReturn?.status === 'IN_REVIEW') {
      return {
        label: 'Retur Sedang Ditinjau',
        textClass: 'text-indigo-600 dark:text-indigo-400 font-bold',
      }
    }
    if (latestReturn?.status === 'APPROVED') {
      return {
        label: 'Retur Disetujui',
        textClass: 'text-emerald-600 dark:text-emerald-400 font-bold',
      }
    }
    if (latestReturn?.status === 'REJECTED') {
      return {
        label: 'Pengajuan Retur Ditolak',
        textClass: 'text-rose-600 dark:text-rose-400 font-bold',
      }
    }
    return {
      label: 'Dikembalikan (Retur)',
      textClass: 'text-purple-600 dark:text-purple-400 font-bold',
    }
  }
  return (
    ORDER_STATUS_MAP[order.status] || {
      label: order.status,
      textClass: 'text-slate-500 font-medium',
    }
  )
}
