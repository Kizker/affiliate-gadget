/**
 * Refund Calculator Module — Affiliate Gadget Platform
 *
 * Aturan Pemotongan Pengembalian Dana Retur:
 * 1. Ongkos Kirim (shippingCost): Jasa ekspedisi yang telah selesai digunakan tidak dapat di-refund.
 * 2. Pajak PPN (tax): Pajak transaksi yang disetorkan ke kas negara.
 * 3. Premi Asuransi Pengiriman (insuranceFee): Jasa proteksi kurir yang telah berjalan.
 * 4. Biaya Operasional & Penanganan Retur (operationalFee): Biaya penanganan administrasi,
 *    inspeksi fisik & uji fungsional teknis di gerai cabang, serta restocking (3% subtotal, min Rp 25.000).
 */

export interface RefundCalculation {
  originalTotal: number
  subtotal: number
  shippingCost: number
  taxDeduction: number
  insuranceFee: number
  operationalFee: number
  totalDeductions: number
  netRefundAmount: number
  deductionBreakdown: {
    shippingCost: number
    tax: number
    insurance: number
    operational: number
  }
}

export function calculateNetRefundAmount(order: {
  total: number
  subtotal?: number | null
  shippingCost?: number | null
  tax?: number | null
  insuranceFee?: number | null
}): RefundCalculation {
  const originalTotal = Math.round(order.total || 0)
  const subtotal = Math.round(
    order.subtotal ??
      Math.max(
        0,
        originalTotal - (order.shippingCost || 0) - (order.insuranceFee || 0)
      )
  )

  // 1. Ongkir ekspedisi hangus
  const shippingCost = Math.round(order.shippingCost || 0)

  // 2. Pajak PPN
  const taxDeduction = Math.round(order.tax || 0)

  // 3. Asuransi pengiriman
  const insuranceFee = Math.round(order.insuranceFee || 0)

  // 4. Biaya operasional penanganan retur & restocking QC (3% dari subtotal, minimal Rp 25.000)
  const operationalFee = Math.max(25_000, Math.round(subtotal * 0.03))

  const totalDeductions =
    shippingCost + taxDeduction + insuranceFee + operationalFee

  // Nominal pengembalian dana bersih setelah dipotong biaya operasional
  const netRefundAmount = Math.max(0, originalTotal - totalDeductions)

  return {
    originalTotal,
    subtotal,
    shippingCost,
    taxDeduction,
    insuranceFee,
    operationalFee,
    totalDeductions,
    netRefundAmount,
    deductionBreakdown: {
      shippingCost,
      tax: taxDeduction,
      insurance: insuranceFee,
      operational: operationalFee,
    },
  }
}
