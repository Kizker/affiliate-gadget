/**
 * Constants & helper kalkulasi ongkos kirim berbasis berat
 * Affiliate Gadget Multi-PT Marketplace Platform
 *
 * Aturan berat:
 * - totalWeightGram <= 1.000g (<= 1kg) → Dikenakan ongkos kirim dasar (Rp 15.000) × multiplier kurir
 * - totalWeightGram > 1.000g (> 1kg)   → Ongkos kirim dasar (Rp 15.000) + (kg tambahan × tarif per kg) × multiplier kurir
 */

export const BASE_SHIPPING_COST = 15_000 // Rp 15.000 tarif dasar ongkos kirim
export const DEFAULT_PRICE_PER_KG = 20_000 // Rp 20.000 / kg tambahan
export const DEFAULT_WEIGHT_GRAM = 500 // 500 gram (default unit gadget)

/** Ambang batas berat dasar (dalam gram). 1 kg pertama masuk tarif dasar. */
export const WEIGHT_THRESHOLD_GRAM = 1_000 // 1 kg

/**
 * Multiplier ongkos kirim berdasarkan jenis kurir & layanan
 */
export const COURIER_MULTIPLIERS: Record<string, number> = {
  JNE_REG: 1.0,
  JNE_YES: 1.8,
  GOJEK_INSTANT: 2.2,
  GOJEK_SAMEDAY: 1.5,
}

/**
 * Hitung kilogram yang ditagihkan (pembulatan ke atas, minimum 1 kg).
 * @param totalWeightGram Total berat dalam gram
 * @returns Billed weight dalam kg (integer minimum 1)
 */
export function calculateBilledKg(totalWeightGram: number): number {
  if (!totalWeightGram || totalWeightGram <= 0 || isNaN(totalWeightGram)) {
    return 1
  }
  return Math.max(1, Math.ceil(totalWeightGram / 1000))
}

/**
 * Kalkulasi ongkos kirim:
 * - Berat <= 1kg: Tarif dasar Rp 15.000 × multiplier kurir (minimum Rp 15.000)
 * - Berat > 1kg : (Tarif dasar Rp 15.000 + (extraKg × tarif per kg)) × multiplier kurir
 *
 * Catatan: Ongkos kirim fisik kurir tidak pernah Rp 0 atau gratis.
 *
 * @param totalWeightGram Total berat pesanan dalam gram (default fallback 500g jika 0/invalid)
 * @param pricePerKg Tarif pengiriman per kg tambahan (default: Rp 20.000)
 * @param courierCode Kode kurir ('JNE' | 'GOJEK')
 * @param courierService Layanan kurir ('REG' | 'YES' | 'INSTANT' | 'SAMEDAY')
 * @returns Total ongkos kirim dalam integer rupiah (selalu >= Rp 15.000)
 */
export function calculateWeightShipping(
  totalWeightGram: number,
  pricePerKg: number = DEFAULT_PRICE_PER_KG,
  courierCode: string = 'JNE',
  courierService: string = 'REG'
): number {
  const safeWeight =
    typeof totalWeightGram === 'number' &&
    !isNaN(totalWeightGram) &&
    totalWeightGram > 0
      ? totalWeightGram
      : DEFAULT_WEIGHT_GRAM

  const billedKg = calculateBilledKg(safeWeight)
  const safePricePerKg =
    pricePerKg > 0 && !isNaN(pricePerKg) ? pricePerKg : DEFAULT_PRICE_PER_KG

  const normalizedCourier = (courierCode || 'JNE').toUpperCase()
  const normalizedService = (courierService || 'REG').toUpperCase()
  const key = `${normalizedCourier}_${normalizedService}`

  // Multiplier berdasarkan kurir & layanan
  const multiplier =
    COURIER_MULTIPLIERS[key] ?? (normalizedCourier === 'GOJEK' ? 2.2 : 1.0)

  // 1 kg pertama = BASE_SHIPPING_COST (Rp 15.000)
  // Kg tambahan di atas 1 kg = extraKg * pricePerKg
  const extraKg = Math.max(0, billedKg - 1)
  const weightAddition = extraKg * safePricePerKg
  const baseCostWithAddition = BASE_SHIPPING_COST + weightAddition

  const calculatedCost = Math.round(baseCostWithAddition * multiplier)

  // Jaminan minimum ongkir tidak pernah 0
  return Math.max(BASE_SHIPPING_COST, calculatedCost)
}
