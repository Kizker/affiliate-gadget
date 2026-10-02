/**
 * Finance Constants for Affiliate Gadget Platform
 *
 * Rules:
 * - Komisi Platform: 2% per transaksi (LOCKED)
 * - Biaya Gateway Midtrans: Flat Rp 4.000 per transaksi (dibebankan ke Toko)
 */

export const PLATFORM_COMMISSION_RATE = 0.02 // 2% per transaksi (Locked)
export const GATEWAY_FEE_PER_TRANSACTION = 4000 // Rp 4.000 flat per transaksi sukses (Beban Toko)

/**
 * Status order yang dianggap transaksi berbayar/aktif
 */
export const ACTIVE_ORDER_STATUSES = [
  'PAID',
  'IN_PROGRESS',
  'SHIPPED',
  'COMPLETED',
  'COMPLAINED',
] as const

/**
 * Status order yang dananya masih tertahan di Escrow (belum selesai)
 */
export const ESCROW_STATUSES = [
  'PAID',
  'IN_PROGRESS',
  'SHIPPED',
  'COMPLAINED',
] as const

/**
 * Status order yang sudah selesai dan dananya masuk ke saldo siap cair toko
 */
export const SETTLED_STATUSES = ['COMPLETED'] as const

/**
 * Status order yang batal / retur / belum dibayar (tidak masuk omzet maupun saldo toko)
 */
export const VOID_STATUSES = [
  'CANCELLED',
  'RETURNED',
  'PENDING_PAYMENT',
] as const
