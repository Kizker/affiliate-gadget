/**
 * Constants & helper kalkulasi asuransi pengiriman
 * Affiliate Gadget Multi-PT Marketplace Platform
 */

/** Tarif asuransi pengiriman wajib: 0.2% dari subtotal produk fisik */
export const INSURANCE_RATE = 0.002 // 0.2%

/** Persentase asuransi untuk tampilan/audit (0.2%) */
export const INSURANCE_PERCENTAGE = 0.2

/**
 * Kalkulasi biaya asuransi pengiriman (Opsi A: Flat murni 0.2% tanpa minimum floor)
 * @param subtotal Subtotal harga produk fisik
 * @returns Biaya asuransi dalam integer rupiah
 */
export function calculateInsuranceFee(subtotal: number): number {
  if (!subtotal || subtotal <= 0 || isNaN(subtotal)) return 0
  return Math.round(subtotal * INSURANCE_RATE)
}

/**
 * Helper validasi integritas asuransi di sisi server
 * @param subtotal Subtotal harga produk fisik
 * @param fee Biaya asuransi yang dihitung
 * @param isService Apakah pesanan bertipe SERVICE (Servis LCD/Teknisi)
 */
export function isValidInsuranceFee(
  subtotal: number,
  fee: number,
  isService: boolean = false
): boolean {
  if (isService) return fee === 0
  const expectedFee = calculateInsuranceFee(subtotal)
  return fee === expectedFee && Number.isInteger(fee) && fee >= 0
}
