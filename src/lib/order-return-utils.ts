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

export interface OrderWarrantyInfo {
  status: string
  warrantyExpiryDate?: string | Date | null
  completedAt?: string | Date | null
  customerConfirmedAt?: string | Date | null
  updatedAt?: string | Date | null
  createdAt?: string | Date | null
  returnRequests?: Array<{ status: string }> | null
}

/**
 * Checks if 30-day warranty has expired for a given order
 */
export function isWarrantyExpired(order: OrderWarrantyInfo): boolean {
  if (order.warrantyExpiryDate) {
    return new Date(order.warrantyExpiryDate).getTime() < Date.now()
  }

  const referenceDate =
    order.completedAt ||
    order.customerConfirmedAt ||
    order.updatedAt ||
    order.createdAt

  if (!referenceDate) return false

  const elapsedMs = Date.now() - new Date(referenceDate).getTime()
  return elapsedMs > 30 * 24 * 60 * 60 * 1000
}

/**
 * Determines if the customer can request a return for the order:
 * 1. Order status is COMPLETED
 * 2. 30-day warranty has NOT expired
 * 3. No active, completed, or approved return requests
 */
export function isReturnEligible(order: OrderWarrantyInfo): boolean {
  if (order.status !== 'COMPLETED') return false
  if (isWarrantyExpired(order)) return false

  if (order.returnRequests && order.returnRequests.length > 0) {
    const activeOrResolved = order.returnRequests.some(
      (r) =>
        r.status === 'PENDING' ||
        r.status === 'IN_REVIEW' ||
        r.status === 'APPROVED' ||
        r.status === 'COMPLETED'
    )
    if (activeOrResolved) return false
  }

  return true
}
