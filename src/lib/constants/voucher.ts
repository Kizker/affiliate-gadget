export interface VoucherValidationResult {
  valid: boolean
  reason?: string
  voucherId?: string
  voucherCode?: string
  discountType?: string
  discountPercent?: number
  discountAmount?: number
  maxDiscountAmount?: number | null
  minimumPurchase?: number
  description?: string | null
  storeId?: string | null
}

/**
 * Kalkulasi nominal diskon voucher secara konsisten.
 * - Jika discountType === 'FIXED_AMOUNT': min(subtotal, discountAmount ?? 0)
 * - Jika discountType === 'PERCENTAGE': min(subtotal * (percent / 100), maxDiscountAmount ?? infinity)
 */
export function calculateVoucherDiscountAmount(
  subtotal: number,
  discountPercent: number,
  maxDiscountAmount?: number | null,
  discountType: string = 'PERCENTAGE',
  fixedDiscountAmount?: number | null
): number {
  if (subtotal <= 0) return 0

  if (discountType === 'FIXED_AMOUNT') {
    const fixed = Math.max(0, fixedDiscountAmount || 0)
    return Math.round(Math.min(subtotal, fixed))
  }

  if (discountPercent <= 0) return 0
  const rawDiscount = subtotal * (discountPercent / 100)
  const cappedDiscount =
    maxDiscountAmount !== undefined &&
    maxDiscountAmount !== null &&
    maxDiscountAmount > 0
      ? Math.min(rawDiscount, maxDiscountAmount)
      : rawDiscount
  return Math.round(Math.min(subtotal, Math.max(0, cappedDiscount)))
}
