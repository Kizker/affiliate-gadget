/**
 * Tax Engine — Affiliate Gadget Platform
 *
 * Modul kalkulasi PPN (Pajak Pertambahan Nilai) berbasis Skema Inklusif Murni.
 * Pure functions, zero-dependency, deterministik, aman di client & server.
 * Sesuai UU HPP No. 7 Tahun 2021 (standar PPN 11% / tarif dinamis per toko).
 */

export type TaxType = 'INCLUSIVE'

export interface TaxConfig {
  isPkp: boolean
  vatRate: number
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
 * Kalkulasi PPN Inklusif (Silent Backend Extraction):
 * - DPP = round(subtotal / (1 + vatRate / 100))
 * - PPN = subtotal - DPP  (menjamin dppAmount + vatAmount === subtotal secara zero-sum)
 * - Jika toko non-PKP, vatRate <= 0, atau subtotal <= 0: PPN = 0, DPP = subtotal
 */
export function calculateOrderVat(
  subtotalAfterDiscount: number,
  taxConfig: TaxConfig
): TaxCalculationResult {
  const safeSubtotal = Math.max(0, Math.round(subtotalAfterDiscount || 0))
  const isPkp = Boolean(taxConfig?.isPkp)
  const vatRate = Math.max(0, Number(taxConfig?.vatRate ?? 11.0))

  if (!isPkp || vatRate === 0 || safeSubtotal === 0) {
    return {
      dppAmount: safeSubtotal,
      vatAmount: 0,
      vatRate: isPkp ? vatRate : 0,
      taxTypeApplied: 'INCLUSIVE',
      totalWithVat: safeSubtotal,
      isPkp,
    }
  }

  // Rumus Inklusif: DPP = Subtotal / (1 + vatRate/100)
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

export type FullStoreTaxConfig = TaxConfig

export interface FullOrderTaxResult extends TaxCalculationResult {
  pph23Amount: number
  pph23Rate: number
  commissionVat: number
  netCommissionBurden: number
}

/**
 * Kalkulasi Pajak Komprehensif Order (PPN Inklusif + PPh 23 Komisi Otomatis)
 */
export function calculateFullOrderTax(
  subtotalAfterDiscount: number,
  commissionGross: number,
  storeTaxConfig?: FullStoreTaxConfig
): FullOrderTaxResult {
  const vatResult = calculateOrderVat(
    subtotalAfterDiscount,
    storeTaxConfig ?? { isPkp: true, vatRate: 11.0 }
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
