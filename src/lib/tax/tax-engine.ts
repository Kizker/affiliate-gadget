/**
 * Tax Engine — Affiliate Gadget Platform
 *
 * Modul kalkulasi PPN (Pajak Pertambahan Nilai) berbasis Skema Inklusif & Eksklusif Murni.
 * Mendukung PPh Pasal 22 & PPh Pasal 23 sesuai regulasi perpajakan e-commerce Indonesia (UU HPP No. 7 Tahun 2021).
 * Dilengkapi kalkulator Payment Gateway Fee dinamis, Maintenance Fee rutin, dan generator Nomor Seri Faktur Pajak (NSFP).
 */

export type TaxType = 'INCLUSIVE' | 'EXCLUSIVE'

export interface TaxConfig {
  isPkp: boolean
  vatRate: number
  taxType?: TaxType
}

export interface TaxCalculationResult {
  dppAmount: number
  vatAmount: number
  vatRate: number
  taxTypeApplied: TaxType
  totalWithVat: number
  isPkp: boolean
}

/**
 * Kalkulasi PPN (Inklusif atau Eksklusif):
 * - INCLUSIVE: DPP = round(subtotal / (1 + vatRate / 100)), PPN = subtotal - DPP, total = subtotal
 * - EXCLUSIVE: DPP = subtotal, PPN = round(subtotal * (vatRate / 100)), total = subtotal + PPN
 * - Jika toko non-PKP, vatRate <= 0, atau subtotal <= 0: PPN = 0, DPP = subtotal
 */
export function calculateOrderVat(
  subtotalAfterDiscount: number,
  taxConfig: TaxConfig
): TaxCalculationResult {
  const safeSubtotal = Math.max(0, Math.round(subtotalAfterDiscount || 0))
  const isPkp = Boolean(taxConfig?.isPkp)
  const vatRate = Math.max(0, Number(taxConfig?.vatRate ?? 11.0))
  const taxType: TaxType = taxConfig?.taxType === 'EXCLUSIVE' ? 'EXCLUSIVE' : 'INCLUSIVE'

  if (!isPkp || vatRate === 0 || safeSubtotal === 0) {
    return {
      dppAmount: safeSubtotal,
      vatAmount: 0,
      vatRate: isPkp ? vatRate : 0,
      taxTypeApplied: taxType,
      totalWithVat: safeSubtotal,
      isPkp,
    }
  }

  if (taxType === 'EXCLUSIVE') {
    const dppAmount = safeSubtotal
    const vatAmount = Math.round((safeSubtotal * vatRate) / 100)
    return {
      dppAmount,
      vatAmount,
      vatRate,
      taxTypeApplied: 'EXCLUSIVE',
      totalWithVat: dppAmount + vatAmount,
      isPkp: true,
    }
  }

  // Rumus Inklusif Standar: DPP = Subtotal / (1 + vatRate/100)
  const dppAmount = Math.round(safeSubtotal / (1 + vatRate / 100))
  const vatAmount = safeSubtotal - dppAmount

  return {
    dppAmount,
    vatAmount,
    vatRate,
    taxTypeApplied: 'INCLUSIVE',
    totalWithVat: safeSubtotal,
    isPkp: true,
  }
}

/**
 * Validasi integritas perhitungan PPN server-side (toleransi pembulatan ± Rp 1)
 */
export function verifyVatIntegrity(
  claimed: { dppAmount: number; vatAmount: number },
  subtotalAfterDiscount: number,
  taxConfig: TaxConfig
): boolean {
  if (!claimed) return false
  const expected = calculateOrderVat(subtotalAfterDiscount, taxConfig)
  const diffDpp = Math.abs((claimed.dppAmount ?? 0) - expected.dppAmount)
  const diffVat = Math.abs((claimed.vatAmount ?? 0) - expected.vatAmount)
  return diffDpp <= 1 && diffVat <= 1
}

export interface Pph23CalculationResult {
  pph23Amount: number
  pph23Rate: number
  commissionVat: number
  netCommissionBurden: number
}

/**
 * Kalkulasi PPh Pasal 23 atas Jasa Perantara / Komisi Platform:
 * - Objek: Nilai bruto komisi platform (1-3%)
 * - Pemotong: Toko PT Cabang (atau CV)
 * - Penerima Penghasilan: Platform Holding PT
 * - Tarif: Standar 2% permanen otomatis
 * - PPN Jasa Komisi: 11% dari komisi bruto
 * - Beban Bersih Komisi Toko = Komisi Bruto + PPN Jasa - PPh 23
 */
export function calculatePph23(
  commissionGross: number,
  pph23Rate: number = 2.0
): Pph23CalculationResult {
  const safeCommission = Math.max(0, Math.round(commissionGross || 0))
  const safeRate = Number(pph23Rate) > 0 ? Number(pph23Rate) : 2.0

  // PPN Jasa Komisi 11% (UU HPP) atas penyerahan JKP dari platform ke toko
  const commissionVat = Math.round(safeCommission * 0.11)

  if (safeCommission === 0) {
    return {
      pph23Amount: 0,
      pph23Rate: safeRate,
      commissionVat: 0,
      netCommissionBurden: 0,
    }
  }

  const pph23Amount = Math.round((safeCommission * safeRate) / 100)
  const netCommissionBurden = safeCommission + commissionVat - pph23Amount

  return {
    pph23Amount,
    pph23Rate: safeRate,
    commissionVat,
    netCommissionBurden,
  }
}

export interface Pph22CalculationResult {
  pph22Amount: number
  pph22Rate: number
  grossAmount: number
}

/**
 * Kalkulasi PPh Pasal 22 (Ketentuan Pemungutan Pembelian Barang E-Commerce):
 * - Standar tarif: 0.5% (atau sesuai ketentuan Kemenkeu PMK)
 */
export function calculatePph22(
  grossAmount: number,
  pph22Rate: number = 0.5
): Pph22CalculationResult {
  const safeGross = Math.max(0, Math.round(grossAmount || 0))
  const safeRate = Number(pph22Rate) > 0 ? Number(pph22Rate) : 0.5

  if (safeGross === 0) {
    return {
      pph22Amount: 0,
      pph22Rate: safeRate,
      grossAmount: 0,
    }
  }

  const pph22Amount = Math.round((safeGross * safeRate) / 100)

  return {
    pph22Amount,
    pph22Rate: safeRate,
    grossAmount: safeGross,
  }
}

export type FullStoreTaxConfig = TaxConfig

export interface FullOrderTaxResult extends TaxCalculationResult {
  pph23Amount: number
  pph23Rate: number
  commissionVat: number
  netCommissionBurden: number
  pph22Amount?: number
}

/**
 * Kalkulasi Pajak Komprehensif Order (PPN Inklusif/Eksklusif + PPh 23 Komisi Otomatis)
 */
export function calculateFullOrderTax(
  subtotalAfterDiscount: number,
  commissionGross: number,
  storeTaxConfig?: FullStoreTaxConfig
): FullOrderTaxResult {
  const vatResult = calculateOrderVat(
    subtotalAfterDiscount,
    storeTaxConfig ?? { isPkp: true, vatRate: 11.0, taxType: 'INCLUSIVE' }
  )
  const pph23Result = calculatePph23(commissionGross)

  return {
    ...vatResult,
    pph23Amount: pph23Result.pph23Amount,
    pph23Rate: pph23Result.pph23Rate,
    commissionVat: pph23Result.commissionVat,
    netCommissionBurden: pph23Result.netCommissionBurden,
  }
}

export interface PaymentGatewayFeeResult {
  method: string
  methodLabel: string
  feeAmount: number
  feeFormula: string
  isPercentage: boolean
}

/**
 * Kalkulasi Biaya Transaksi Payment Gateway Dinamis:
 * - QRIS: 0.7% (Standar Bank Indonesia / ASPI)
 * - Virtual Account (VA): Flat Rp 4.000 / transaksi
 * - Kartu Kredit: 2.9% + Rp 2.000 / transaksi
 * - Transfer Manual / Rekening Bank Mandiri Direct: Rp 0
 * - Default Gateway / E-Wallet: Flat Rp 2.500
 */
export function calculatePaymentGatewayFee(
  paymentMethod: string | null | undefined,
  grossAmount: number
): PaymentGatewayFeeResult {
  const method = (paymentMethod || '').toUpperCase()
  const safeGross = Math.max(0, Math.round(grossAmount || 0))

  if (method.includes('QRIS')) {
    const feeAmount = Math.round(safeGross * 0.007)
    return {
      method: 'QRIS',
      methodLabel: 'QRIS Dinamis (Bank Indonesia)',
      feeAmount,
      feeFormula: '0.7% dari total pembayaran',
      isPercentage: true,
    }
  }

  if (
    method.includes('CREDIT') ||
    method.includes('CARD') ||
    method === 'CC' ||
    method.includes('VISA') ||
    method.includes('MASTERCARD')
  ) {
    const feeAmount = Math.round(safeGross * 0.029) + 2000
    return {
      method: 'CREDIT_CARD',
      methodLabel: 'Kartu Kredit / Debit Online',
      feeAmount,
      feeFormula: '2.9% + Rp 2.000',
      isPercentage: true,
    }
  }

  if (
    method.includes('VA') ||
    method.includes('VIRTUAL') ||
    method.includes('BANK_TRANSFER') ||
    method.includes('BCA') ||
    method.includes('BNI') ||
    method.includes('BRI')
  ) {
    return {
      method: 'VIRTUAL_ACCOUNT',
      methodLabel: 'Virtual Account Bank (VA)',
      feeAmount: 4000,
      feeFormula: 'Flat Rp 4.000 / transaksi',
      isPercentage: false,
    }
  }

  if (method === 'MANUAL_TRANSFER' || method === 'CASH') {
    return {
      method: 'MANUAL_TRANSFER',
      methodLabel: 'Transfer Rekening Bank Mandiri Toko',
      feeAmount: 0,
      feeFormula: 'Rp 0 (Bebas Biaya Gateway)',
      isPercentage: false,
    }
  }

  return {
    method: 'PAYMENT_GATEWAY',
    methodLabel: 'Payment Gateway Midtrans',
    feeAmount: 2500,
    feeFormula: 'Flat Rp 2.500 / transaksi',
    isPercentage: false,
  }
}

export interface MaintenanceFeeResult {
  feeAmount: number
  description: string
}

/**
 * Kalkulasi Biaya Pemeliharaan Sistem E-Commerce (Maintenance Fee):
 * Potongan rutin/berkala untuk server, database, dan pemeliharaan transaksi aman escrow.
 */
export function calculateMaintenanceFee(
  orderSubtotal: number,
  feePerOrder: number = 1000
): MaintenanceFeeResult {
  const feeAmount = orderSubtotal > 0 ? Math.max(0, feePerOrder) : 0
  return {
    feeAmount,
    description: 'Biaya Pemeliharaan Sistem E-Commerce (Server & Escrow)',
  }
}

/**
 * Generator Nomor Seri Faktur Pajak (NSFP) Resmi Format DJP:
 * Format: 010.026-26.XXXXXXXX (010 penyerahan BKP/JKP, 26 tahun pajak, 8 digit nomor urut transaksi)
 */
export function generateTaxInvoiceNumber(
  orderNumber: string,
  orderDate?: Date | string
): string {
  const d = orderDate ? new Date(orderDate) : new Date()
  const yearSuffix = isNaN(d.getTime())
    ? '26'
    : String(d.getFullYear()).slice(-2)
  const numericOnly = orderNumber.replace(/[^0-9]/g, '')
  const sequence = numericOnly.slice(-8).padStart(8, '0')
  return `010.0${yearSuffix}-${yearSuffix}.${sequence}`
}

