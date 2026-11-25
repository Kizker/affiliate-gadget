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
  items?: MatchableOrderItem[] | null
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

export interface DisplayOrderItem<T = any> {
  id: string
  item: T
  displayQuantity: number
  displaySubtotal: number
  matchedReturn?: ReturnRequestSummary | null
  isReturnedUnit: boolean
}

/**
 * Splits an OrderItem into separate display cards when only a partial quantity of that item
 * has been requested for return/complaint.
 * For example:
 * - Product A (quantity 2) with 1 unit returned -> Split into 2 cards:
 *   1. Product A (1 unit) with return information & badge
 *   2. Product A (1 unit) without return information
 * - Items with 0 returns or 100% returns remain a single grouped card.
 */
export function splitOrderItemsForDisplay<T extends MatchableOrderItem>(
  items: T[],
  returnRequests?: ReturnRequestSummary[] | null
): DisplayOrderItem<T>[] {
  const result: DisplayOrderItem<T>[] = []

  for (const item of items) {
    const qty = item.quantity || 1
    const price = item.price || 0
    const matchingReturn = findReturnForOrderItem(
      returnRequests,
      item,
      items.length
    )

    if (matchingReturn) {
      const returnedQty = extractReturnedQuantityFromDescription(
        matchingReturn.description,
        1
      )
      const validReturnedQty = Math.min(qty, Math.max(1, returnedQty))

      if (validReturnedQty < qty) {
        // Partial return: 1 card for returned unit(s), 1 card for remaining unreturned unit(s)
        result.push({
          id: `${item.id || 'item'}-returned`,
          item,
          displayQuantity: validReturnedQty,
          displaySubtotal: price * validReturnedQty,
          matchedReturn: matchingReturn,
          isReturnedUnit: true,
        })

        const remainingQty = qty - validReturnedQty
        result.push({
          id: `${item.id || 'item'}-remaining`,
          item,
          displayQuantity: remainingQty,
          displaySubtotal: price * remainingQty,
          matchedReturn: undefined,
          isReturnedUnit: false,
        })
        continue
      }

      // All units of this item were returned
      result.push({
        id: `${item.id || 'item'}-all-returned`,
        item,
        displayQuantity: qty,
        displaySubtotal: (item as any).subtotal || price * qty,
        matchedReturn: matchingReturn,
        isReturnedUnit: true,
      })
      continue
    }

    // No return request on this item -> keep as single grouped card
    result.push({
      id: `${item.id || 'item'}-normal`,
      item,
      displayQuantity: qty,
      displaySubtotal: (item as any).subtotal || price * qty,
      matchedReturn: undefined,
      isReturnedUnit: false,
    })
  }

  return result
}

/**
 * Menghitung sisa kuantitas suatu OrderItem yang masih dapat diajukan retur / komplain.
 * Memperhitungkan aturan bisnis:
 * 1. Jika retur sudah DITOLAK (REJECTED), unit tersebut TIDAK dapat diajukan retur lagi.
 * 2. Jika retur sedang berlangsung (PENDING, IN_REVIEW, APPROVED), unit tersebut sedang diproses.
 * 3. Jika retur selesai REFUND, dana sudah dicairkan sehingga unit tersebut tidak dapat diretur lagi.
 * 4. Jika retur selesai REPLACEMENT (Tukar Unit Baru):
 *    - Jika unit pengganti sudah diterima pembeli dan garansi masih aktif, unit pengganti dapat diretur kembali jika ternyata rusak lagi,
 *      sampai ditolak atau pesanan diselesaikan secara manual oleh customer.
 */
export function getRemainingReturnableQuantityForItem(
  item: MatchableOrderItem,
  returnRequests?: ReturnRequestSummary[] | null,
  order?: {
    customerConfirmedAt?: Date | string | null
    completedAt?: Date | string | null
    status?: string
  }
): number {
  const totalQty = item.quantity || 1
  if (!returnRequests || returnRequests.length === 0) {
    return totalQty
  }

  // Cari seluruh pengajuan retur yang menargetkan item ini
  const matchingReturns = returnRequests.filter((r) =>
    doesReturnMatchOrderItem(r, item)
  )

  if (matchingReturns.length === 0) {
    return totalQty
  }

  let nonReturnableQty = 0

  for (const ret of matchingReturns) {
    const qtyInRet = extractReturnedQuantityFromDescription(ret.description, 1)

    // 1. REJECTED: Jika retur sudah ditolak, tidak ada opsi untuk retur lagi
    if (ret.status === 'REJECTED') {
      nonReturnableQty += qtyInRet
      continue
    }

    // 2. PENDING, IN_REVIEW, APPROVED: Sedang dalam proses telaah/verifikasi
    if (
      ret.status === 'PENDING' ||
      ret.status === 'IN_REVIEW' ||
      ret.status === 'APPROVED'
    ) {
      nonReturnableQty += qtyInRet
      continue
    }

    // 3. COMPLETED
    if (ret.status === 'COMPLETED') {
      if (ret.type === 'REFUND') {
        // Refund selesai: dana sudah cair, tidak dapat diretur lagi
        nonReturnableQty += qtyInRet
      } else if (ret.type === 'REPLACEMENT') {
        // Tukar unit selesai: Hanya dapat diretur lagi jika unit pengganti telah diterima pembeli dan belum diselesaikan
        const isReplacementReceived = Boolean(order?.customerConfirmedAt)
        const isManuallyCompleted = Boolean(order?.completedAt)
        if (!isReplacementReceived || isManuallyCompleted) {
          nonReturnableQty += qtyInRet
        }
      }
    }
  }

  return Math.max(0, totalQty - nonReturnableQty)
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

  const remainingQty = getRemainingReturnableQuantityForItem(
    item,
    order.returnRequests,
    order
  )
  return remainingQty > 0
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
 * Menghitung sisa hari garansi toko untuk pesanan.
 * Mengembalikan integer >= 1 jika aktif, 0 jika habis, atau null jika tidak dapat ditentukan.
 */
export function getWarrantyRemainingDays(
  order: OrderWarrantyInfo
): number | null {
  if (order.status === 'CANCELLED') return null

  let expiryMs: number | null = null

  if (order.warrantyExpiryDate) {
    expiryMs = new Date(order.warrantyExpiryDate).getTime()
  } else {
    const referenceDate =
      order.completedAt ||
      order.customerConfirmedAt ||
      order.updatedAt ||
      order.createdAt

    if (referenceDate) {
      const startMs = new Date(referenceDate).getTime()
      expiryMs = startMs + 30 * 24 * 60 * 60 * 1000
    }
  }

  if (!expiryMs) return null

  const diffMs = expiryMs - Date.now()
  if (diffMs <= 0) return 0

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Menghasilkan teks label sisa garansi toko untuk badge pesanan.
 * Contoh: "Garansi Tersisa 2 Hari", "Garansi Tersisa 30 Hari", "Garansi Habis"
 */
export function getWarrantyRemainingBadgeText(
  order: OrderWarrantyInfo
): string {
  const days = getWarrantyRemainingDays(order)

  if (days === null) {
    return 'Garansi 30 Hari'
  }

  if (days <= 0) {
    return 'Garansi Habis'
  }

  return `Garansi Tersisa ${days} Hari`
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

  // Jika detail items tersedia, periksa apakah masih ada unit yang dapat diretur
  if (order.items && order.items.length > 0) {
    return order.items.some((it) =>
      isOrderItemReturnEligible(order, it, order.items?.length || 1)
    )
  }

  // Fallback untuk pesanan tanpa detail items:
  // Jika retur sudah ditolak, sedang diproses, atau selesai refund -> tidak dapat diretur lagi
  if (order.returnRequests && order.returnRequests.length > 0) {
    const isBlocked = order.returnRequests.some((r) => {
      if (r.status === 'REJECTED') return true
      if (
        r.status === 'PENDING' ||
        r.status === 'IN_REVIEW' ||
        r.status === 'APPROVED'
      )
        return true
      if (r.status === 'COMPLETED' && r.type === 'REFUND') return true
      return false
    })
    if (isBlocked) return false
  }

  return true
}
