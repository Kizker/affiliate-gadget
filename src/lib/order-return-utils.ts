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
  customerConfirmedAt?: string | Date | null
  completedAt?: string | Date | null
  warrantyExpiryDate?: string | Date | null
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
    const isRefund = latestReturn?.type === 'REFUND'
    const actionLabel = isRefund ? 'Refund' : 'Retur'

    if (latestReturn?.status === 'PENDING') {
      return {
        label: `Menunggu Verifikasi ${actionLabel}`,
        textClass: 'text-orange-600 dark:text-orange-400 font-bold',
      }
    }
    if (latestReturn?.status === 'IN_REVIEW') {
      return {
        label: `${actionLabel} Sedang Ditinjau`,
        textClass: 'text-indigo-600 dark:text-indigo-400 font-bold',
      }
    }
    if (latestReturn?.status === 'APPROVED') {
      return {
        label: `${actionLabel} Disetujui`,
        textClass: 'text-emerald-600 dark:text-emerald-400 font-bold',
      }
    }
    if (latestReturn?.status === 'REJECTED') {
      return {
        label: `Pengajuan ${actionLabel} Ditolak`,
        textClass: 'text-rose-600 dark:text-rose-400 font-bold',
      }
    }
    if (latestReturn?.status === 'COMPLETED') {
      return {
        label: isRefund ? 'Refund Selesai' : 'Tukar Unit Selesai',
        textClass: 'text-emerald-600 dark:text-emerald-400 font-bold',
      }
    }
    return {
      label: isRefund ? 'Pengembalian Dana (Refund)' : 'Dikembalikan (Retur)',
      textClass: 'text-purple-600 dark:text-purple-400 font-bold',
    }
  }
  const nowMs = Date.now()
  const isWOver = isWarrantyExpired(order)
  const isUnder30Days =
    order.warrantyExpiryDate &&
    nowMs < new Date(order.warrantyExpiryDate).getTime()
  if (order.customerConfirmedAt && !order.completedAt && isUnder30Days) {
    return {
      label: 'Diterima (Garansi 30H Aktif)',
      textClass: 'text-emerald-700 dark:text-emerald-400 font-bold',
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
  returnRequests?: Array<{
    id?: string
    status: string
    type?: string | null
    reason?: string | null
    reasonLabel?: string | null
    description?: string | null
  }> | null
}

export interface MatchableOrderItem {
  id?: string
  quantity?: number
  price?: number
  variantName?: string | null
  productId?: string | null
  product?: { id?: string; name?: string } | null
  rentalItem?: { id?: string; name?: string } | null
  service?: { id?: string; name?: string } | null
}

/**
 * Extracts how many units were requested for return from the return description prefix.
 * Format: [Unit yang Diretur: ... - X unit @ Rp ... | ItemID:... | Qty:X]
 */
export function extractReturnedQuantityFromDescription(
  description?: string | null,
  fallbackQty: number = 1
): number {
  if (!description) return fallbackQty
  const explicitQtyMatch = description.match(/Qty:(\d+)/i)
  if (explicitQtyMatch) {
    const parsed = parseInt(explicitQtyMatch[1], 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  const headerMatch = description.match(
    /\[Unit yang Diretur:[^\]]*?-\s*(\d+)\s*unit\s*@/i
  )
  if (headerMatch) {
    const parsed = parseInt(headerMatch[1], 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return fallbackQty
}

/**
 * Determines if a specific OrderItem matches a ReturnRequest.
 * Supports explicit ItemID marker, ProductID marker, and product name + variant matching.
 */
export function doesReturnMatchOrderItem(
  ret: { description?: string | null },
  item: MatchableOrderItem,
  totalOrderItemsCount: number = 1
): boolean {
  const desc = ret.description || ''

  // 1. Check explicit ItemID marker
  if (desc.includes('ItemID:')) {
    if (item.id && desc.includes(`ItemID:${item.id}`)) return true
    return false
  }

  // 2. Check explicit [Unit yang Diretur: ...] header
  const itemMatch = desc.match(/\[Unit yang Diretur:\s*([^\]]+)\]/i)
  if (itemMatch) {
    const headerText = itemMatch[1].toLowerCase()
    const itemName = (
      item.product?.name ||
      item.rentalItem?.name ||
      item.service?.name ||
      ''
    )
      .toLowerCase()
      .trim()

    if (itemName && headerText.includes(itemName)) {
      if (item.variantName && headerText.includes('varian:')) {
        return headerText.includes(item.variantName.toLowerCase().trim())
      }
      return true
    }
    return false
  }

  // 3. Fallback if no unit prefix and order only has 1 item
  if (totalOrderItemsCount <= 1) return true
  return true
}

/**
 * Finds the active/latest ReturnRequest targeting a specific OrderItem.
 */
export function findReturnForOrderItem<
  T extends { status: string; description?: string | null },
>(
  returnRequests: T[] | null | undefined,
  item: MatchableOrderItem,
  totalOrderItemsCount: number = 1
): T | undefined {
  if (!returnRequests || returnRequests.length === 0) return undefined
  return returnRequests.find((r) =>
    doesReturnMatchOrderItem(r, item, totalOrderItemsCount)
  )
}

/**
 * Checks if a specific OrderItem is eligible for a new return request.
 * Even if another item in the same order has an active return, this item remains eligible!
 */
export function isOrderItemReturnEligible(
  order: OrderWarrantyInfo,
  item: MatchableOrderItem,
  totalOrderItemsCount: number = 1
): boolean {
  const isReceived =
    order.status === 'COMPLETED' || Boolean(order.customerConfirmedAt)
  if (!isReceived) return false
  if (order.status === 'COMPLETED' && order.completedAt) return false
  if (isWarrantyExpired(order)) return false

  const matchingReturn = findReturnForOrderItem(
    order.returnRequests,
    item,
    totalOrderItemsCount
  )
  if (matchingReturn) {
    const isBlocked =
      matchingReturn.status === 'PENDING' ||
      matchingReturn.status === 'IN_REVIEW' ||
      matchingReturn.status === 'APPROVED' ||
      matchingReturn.status === 'COMPLETED'
    if (isBlocked) return false
  }

  return true
}

/**
 * Menyelesaikan HPP / modal suatu OrderItem secara adaptif dan dinamis:
 * 1. Prioritaskan HPP dari varian produk terkini jika ada (walaupun baru diubah di katalog)
 * 2. Cek HPP dari master produk induk terkini
 * 3. Fallback ke snapshot costPrice pada orderItem saat transaksi dibuat
 */
export function resolveOrderItemCostPrice(item: {
  costPrice?: number | null
  variantId?: string | null
  variantName?: string | null
  product?: {
    costPrice?: number | null
    variants?: Array<{
      id?: string
      name?: string | null
      costPrice?: number | null
    }> | null
  } | null
}): number {
  if (!item) return 0

  // 1. Cek HPP dari varian produk terkini
  if (item.product?.variants && Array.isArray(item.product.variants)) {
    let matchedVariant: any = null
    if (item.variantId) {
      matchedVariant = item.product.variants.find(
        (v) => v.id === item.variantId
      )
    }
    if (!matchedVariant && item.variantName) {
      const cleanTargetName = item.variantName.trim().toLowerCase()
      matchedVariant = item.product.variants.find(
        (v) =>
          v.name &&
          (v.name.trim().toLowerCase() === cleanTargetName ||
            cleanTargetName.includes(v.name.trim().toLowerCase()) ||
            v.name.trim().toLowerCase().includes(cleanTargetName))
      )
    }
    if (matchedVariant && Number(matchedVariant.costPrice) > 0) {
      return Number(matchedVariant.costPrice)
    }
  }

  // 2. Cek HPP dari master produk induk terkini
  if (item.product && Number(item.product.costPrice) > 0) {
    return Number(item.product.costPrice)
  }

  // 3. Fallback ke snapshot costPrice pada orderItem saat transaksi dibuat
  if (item.costPrice && Number(item.costPrice) > 0) {
    return Number(item.costPrice)
  }

  return 0
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
  const isReceived =
    order.status === 'COMPLETED' || Boolean(order.customerConfirmedAt)
  if (!isReceived) return false
  if (order.status === 'COMPLETED' && order.completedAt) return false
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
