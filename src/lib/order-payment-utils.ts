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

export interface ActiveTaxInputItem {
  id: string
  code: string
  name: string
  shortName: string
  rate: number
  isFlatAmount?: boolean
  minTransactionThreshold?: number
  isEnabled: boolean
  ebillingKapKjs?: string
}

export interface OrderTaxLine {
  id: string
  shortName: string
  rate: number
  isFlatAmount?: boolean
  amount: number
  ebillingKapKjs?: string
}

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
  totalTaxAmount: number
  taxLines: OrderTaxLine[]
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
  activeTaxes?: ActiveTaxInputItem[] | null
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

  // 3. Pajak (Mengikuti daftar pajak yang sedang AKTIF di halaman Pajak)
  let pph22Rate = 0.5
  let pph22Amount = 0
  let totalTaxAmount = 0
  const taxLines: OrderTaxLine[] = []

  if (Array.isArray(order.activeTaxes)) {
    for (const tax of order.activeTaxes) {
      if (!tax.isEnabled) continue
      let amt = 0
      if (tax.id === 'PPH22_ECOMMERCE') {
        pph22Rate = tax.rate
        amt = Math.round((subtotalAfterDiscount * tax.rate) / 100)
        pph22Amount = amt
      } else if (
        tax.id === 'PPN_PMSE' ||
        tax.id === 'PPH_FINAL_UMKM' ||
        tax.id === 'PPH21_MITRA'
      ) {
        amt = Math.round((subtotalAfterDiscount * tax.rate) / 100)
      } else if (tax.id === 'PPH23_KOMISI') {
        amt = Math.round((platformFee * tax.rate) / 100)
      } else if (tax.id === 'BEA_MATERAI') {
        const threshold = tax.minTransactionThreshold || 5000000
        if (subtotalAfterDiscount >= threshold) {
          amt = Math.round(tax.rate)
        }
      }

      if (amt > 0) {
        taxLines.push({
          id: tax.id,
          shortName: tax.shortName,
          rate: tax.rate,
          isFlatAmount: tax.isFlatAmount,
          amount: amt,
          ebillingKapKjs: tax.ebillingKapKjs,
        })
        totalTaxAmount += amt
      }
    }
  } else {
    // Fallback default: PPh Pasal 22 e-commerce 0.5%
    pph22Amount = Math.round((subtotalAfterDiscount * pph22Rate) / 100)
    totalTaxAmount = pph22Amount
    if (pph22Amount > 0) {
      taxLines.push({
        id: 'PPH22_ECOMMERCE',
        shortName: `PPh 22 (${pph22Rate}%)`,
        rate: pph22Rate,
        amount: pph22Amount,
        ebillingKapKjs: 'KAP 411122 - KJS 910',
      })
    }
  }

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
  // Subtotal produk dikurangi potongan komisi platform, biaya layanan, dan total pajak aktif
  let estimatedNetIncome = 0
  if (!isCancelledOrReturned) {
    estimatedNetIncome = Math.max(
      0,
      subtotalAfterDiscount - platformFee - serviceFee - totalTaxAmount
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
    totalTaxAmount,
    taxLines,
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
