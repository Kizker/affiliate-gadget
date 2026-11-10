/**
 * Order Payment Utils — Affiliate Gadget Platform
 *
 * Modul kalkulasi transparan rincian pembayaran untuk Admin Toko dan Pembeli.
 * Menghitung pembukuan otomatis potongan toko:
 * - Subtotal pesanan (nilai bruto produk)
 * - Pemisahan biaya logistik (Ongkir & Asuransi pass-through kurir)
 * - Biaya Platform (komisi 1.5% - 2%)
 * - Biaya Layanan (payment gateway Midtrans flat Rp 4.000 / QRIS 0.7%)
 * - Pajak (PPh Pasal 22 e-commerce 0.5% UU HPP / PMK)
 * - Estimasi Total Penghasilan bersih yang masuk ke saldo dompet toko
 */

export interface OrderFinancialSummary {
  subtotal: number
  discountAmount: number
  subtotalAfterDiscount: number
  platformFee: number
  platformFeeRate: number
  serviceFee: number
  serviceFeeLabel: string
  pph22Amount: number
  pph22Rate: number
  shippingCost: number
  insuranceFee: number
  insuranceRate: number
  estimatedNetIncome: number
  buyerTotal: number
  isCancelledOrReturned: boolean
}

export interface FinancialCalculationInput {
  subtotal?: number | null
  total?: number | null
  discountAmount?: number | null
  commissionAmount?: number | null
  commissionRate?: number | null
  shippingCost?: number | null
  insuranceFee?: number | null
  insuranceRate?: number | null
  status?: string | null
  payment?: {
    paymentMethod?: string | null
    provider?: string | null
    status?: string | null
  } | null
  paymentMethod?: string | null
  notes?: string | null
}

/**
 * Hitung seluruh pos keuangan pesanan secara transparan untuk Admin Toko & Pembeli
 */
export function calculateOrderFinancials(
  order: FinancialCalculationInput
): OrderFinancialSummary {
  const safeSubtotal = Math.max(
    0,
    Math.round(order.subtotal ?? order.total ?? 0)
  )
  const safeDiscount = Math.max(0, Math.round(order.discountAmount ?? 0))
  const subtotalAfterDiscount = Math.max(0, safeSubtotal - safeDiscount)

  const isCancelledOrReturned =
    order.status === 'CANCELLED' || order.status === 'RETURNED'

  // 1. Biaya Platform (Komisi Marketplace)
  const platformFeeRate =
    typeof order.commissionRate === 'number' && order.commissionRate > 0
      ? order.commissionRate
      : 2.0

  let platformFee = 0
  if (
    typeof order.commissionAmount === 'number' &&
    order.commissionAmount > 0
  ) {
    platformFee = Math.round(order.commissionAmount)
  } else {
    platformFee = Math.round((subtotalAfterDiscount * platformFeeRate) / 100)
  }

  // 2. Biaya Layanan (Payment Gateway Midtrans)
  const payMethod = (
    order.payment?.paymentMethod ||
    order.paymentMethod ||
    order.notes ||
    ''
  ).toUpperCase()

  let serviceFee = 4000 // Standar Midtrans Virtual Account / Bank
  let serviceFeeLabel = 'Payment Gateway (Midtrans Flat Rp 4.000)'

  if (payMethod.includes('QRIS')) {
    serviceFee = Math.round((order.total ?? subtotalAfterDiscount) * 0.007)
    serviceFeeLabel = 'QRIS Dinamis 0.7%'
  } else if (
    payMethod.includes('MANUAL') ||
    payMethod.includes('CASH') ||
    payMethod.includes('COD')
  ) {
    serviceFee = 0
    serviceFeeLabel = 'Transfer Manual Direct (Rp 0)'
  }

  // 3. Pajak (PPh Pasal 22 e-commerce: 0.5% dari subtotal barang)
  const pph22Rate = 0.5
  const pph22Amount = Math.round((subtotalAfterDiscount * pph22Rate) / 100)

  // 4. Logistik Kurir (Pass-Through)
  const shippingCost = Math.max(0, Math.round(order.shippingCost ?? 0))
  const insuranceFee = Math.max(0, Math.round(order.insuranceFee ?? 0))
  const insuranceRate =
    typeof order.insuranceRate === 'number' ? order.insuranceRate : 0.2

  // 5. Total Pembayaran Pembeli
  const buyerTotal = Math.max(
    0,
    Math.round(
      order.total ?? subtotalAfterDiscount + shippingCost + insuranceFee
    )
  )

  // 6. Estimasi Total Penghasilan Bersih Toko
  // Subtotal produk dikurangi potongan komisi platform, biaya layanan, dan pajak
  let estimatedNetIncome = 0
  if (!isCancelledOrReturned) {
    estimatedNetIncome = Math.max(
      0,
      subtotalAfterDiscount - platformFee - serviceFee - pph22Amount
    )
  }

  return {
    subtotal: safeSubtotal,
    discountAmount: safeDiscount,
    subtotalAfterDiscount,
    platformFee,
    platformFeeRate,
    serviceFee,
    serviceFeeLabel,
    pph22Amount,
    pph22Rate,
    shippingCost,
    insuranceFee,
    insuranceRate,
    estimatedNetIncome,
    buyerTotal,
    isCancelledOrReturned,
  }
}

/**
 * Format kode variasi / SKU produk terstruktur ala e-commerce (misal: "SM-S22-01")
 */
export function formatVariantCode(item: {
  id?: string
  variantId?: string | null
  variantName?: string | null
  product?: {
    sku?: string | null
    name?: string | null
    brand?: string | null
  } | null
}): string {
  if (item.product?.sku) {
    if (item.variantId) {
      return `${item.product.sku}-${item.variantId.slice(-2).toUpperCase()}`
    }
    return item.product.sku
  }

  // Fallback representatif: [KODE_BRAND]-[MODEL_SUB]-[ID]
  const brand = (item.product?.brand || 'GAD')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase()

  const nameParts = (item.product?.name || '')
    .replace(/[^A-Za-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)

  const modelCode =
    nameParts.length > 1 ? nameParts[1].slice(0, 3).toUpperCase() : '01'

  const idSuffix = (item.variantId || item.id || '01').slice(-2).toUpperCase()

  return `${brand}-${modelCode}-${idSuffix}`
}
