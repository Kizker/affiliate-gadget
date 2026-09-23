/**
 * AWB (Air Waybill) / Nomor Resi Validator
 * Validasi format nomor resi per kurir untuk platform Affiliate Gadget
 * Supported: JNE REG, JNE YES, Gojek Instant
 */

export type CourierCode = 'JNE' | 'GOJEK'
export type CourierService = 'REG' | 'YES' | 'INSTANT'

export interface AWBValidationResult {
  valid: boolean
  courierCode?: CourierCode
  courierService?: CourierService
  formatted: string
  error?: string
}

/**
 * Pola format resi per kurir
 * JNE:   "JNE" diikuti 10-18 digit angka
 * Gojek: "GK-" diikuti 12 digit angka
 */
export const AWB_PATTERNS: Record<
  CourierCode,
  { pattern: RegExp; example: string; label: string }
> = {
  JNE: {
    pattern: /^JNE\d{10,18}$/i,
    example: 'JNE260923123456',
    label: 'JNE Express',
  },
  GOJEK: {
    pattern: /^GK-\d{12}$/i,
    example: 'GK-260923123456',
    label: 'Gojek Instant',
  },
}

/**
 * Validasi format nomor resi
 * Jika courierCode tidak diisi, auto-detect dari prefix
 */
export function validateAWB(
  trackingNumber: string,
  courierCode?: CourierCode
): AWBValidationResult {
  const cleaned = trackingNumber.trim().toUpperCase()

  if (!cleaned) {
    return {
      valid: false,
      formatted: '',
      error: 'Nomor resi tidak boleh kosong',
    }
  }

  if (cleaned.length < 8) {
    return {
      valid: false,
      formatted: cleaned,
      error: 'Nomor resi terlalu pendek (minimal 8 karakter)',
    }
  }

  const detectedCourier: CourierCode | undefined =
    courierCode ||
    (cleaned.startsWith('JNE')
      ? 'JNE'
      : cleaned.startsWith('GK-')
        ? 'GOJEK'
        : undefined)

  if (!detectedCourier) {
    return {
      valid: false,
      formatted: cleaned,
      error:
        'Format resi tidak dikenal. Gunakan format JNExxxxxxxx atau GK-xxxxxxxx',
    }
  }

  const pattern = AWB_PATTERNS[detectedCourier]
  const isValid = pattern.pattern.test(cleaned)

  if (!isValid) {
    return {
      valid: false,
      courierCode: detectedCourier,
      formatted: cleaned,
      error: `Format resi ${pattern.label} tidak valid. Contoh: ${pattern.example}`,
    }
  }

  const service: CourierService =
    detectedCourier === 'GOJEK'
      ? 'INSTANT'
      : cleaned.includes('YES')
        ? 'YES'
        : 'REG'

  return {
    valid: true,
    courierCode: detectedCourier,
    courierService: service,
    formatted: cleaned,
  }
}

export function detectCourierFromAWB(
  trackingNumber: string
): CourierCode | null {
  const cleaned = (trackingNumber || '').trim().toUpperCase()
  if (cleaned.startsWith('JNE')) return 'JNE'
  if (cleaned.startsWith('GK-')) return 'GOJEK'
  return null
}

export function formatAWBDisplay(trackingNumber: string): string {
  return (trackingNumber || '').trim().toUpperCase()
}

export function validateMultipleAWBs(
  trackingNumbers: string[]
): AWBValidationResult[] {
  return trackingNumbers.map((awb) => validateAWB(awb))
}
