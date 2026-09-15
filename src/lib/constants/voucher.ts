export interface VoucherValidationResult {
  valid: boolean
  reason?: string
  voucherId?: string
  voucherCode?: string
  discountPercent?: number
  discountAmount?: number
  maxDiscountAmount?: number | null
  minimumPurchase?: number
  description?: string | null
}

/**
 * Kalkulasi nominal diskon voucher secara konsisten.
 * discountAmount = min(subtotal * (percent / 100), maxDiscountAmount ?? infinity)
 */
export function calculateVoucherDiscountAmount(
  subtotal: number,
  discountPercent: number,
  maxDiscountAmount?: number | null
): number {
  if (subtotal <= 0 || discountPercent <= 0) return 0
  const rawDiscount = subtotal * (discountPercent / 100)
  const cappedDiscount =
    maxDiscountAmount !== undefined &&
    maxDiscountAmount !== null &&
    maxDiscountAmount > 0
      ? Math.min(rawDiscount, maxDiscountAmount)
      : rawDiscount
  return Math.round(Math.min(subtotal, Math.max(0, cappedDiscount)))
}
