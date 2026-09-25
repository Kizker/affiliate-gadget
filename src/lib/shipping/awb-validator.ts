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
    pattern: /^(JNE-?|AGY)\d{6,18}(ID)?$|^[0-9]{10,20}$/i,
    example: 'JNE260923123456 atau AGY154879552ID',
    label: 'JNE Express',
  },
  GOJEK: {
    pattern: /^(GK-|GOJEK-|AGY)\d{6,16}(ID)?$|^GK-\d{12}$/i,
    example: 'GK-260923123456 atau GOJEK-81980576',
    label: 'Gojek Instant',
  },
}

/**
 * Validasi format nomor resi atau nomor order
 * Jika courierCode tidak diisi, auto-detect dari prefix (mendukung JNE, Gojek, Biteship WYB, AGY, dan Nomor Pesanan SPR/ORD)
 */
export function validateAWB(
  trackingNumber: string,
  courierCode?: CourierCode
): AWBValidationResult {
  const raw = (trackingNumber || '').trim().toUpperCase()
  const cleaned = raw.replace(/^#/, '')

  if (!cleaned) {
    return {
      valid: false,
      formatted: '',
      error: 'Nomor resi atau pesanan tidak boleh kosong',
    }
  }

  if (cleaned.length < 6) {
    return {
      valid: false,
      formatted: cleaned,
      error: 'Nomor resi terlalu pendek (minimal 6 karakter)',
    }
  }

  // 1. Dukungan pelacakan langsung via Nomor Pesanan (SPR-... / ORD-...) jika tanpa batas kurir spesifik
  if (!courierCode) {
    const isOrderNumber = /^(SPR|ORD)-[A-Z0-9-]+$/i.test(cleaned)
    if (isOrderNumber) {
      return {
        valid: true,
        courierCode: 'JNE',
        courierService: 'REG',
        formatted: cleaned,
      }
    }
  }

  // 2. Dukungan resi elektronik Biteship (WYB-1790144159838)
  const isBiteshipWaybill = /^WYB-?[A-Z0-9]{8,24}$/i.test(cleaned)
  if (isBiteshipWaybill) {
    return {
      valid: true,
      courierCode: courierCode || 'JNE',
      courierService: 'REG',
      formatted: cleaned,
    }
  }

  // 3. Dukungan resi internal Affiliate Gadget (AGY...ID)
  if (/^AGY\d{6,16}(ID)?$/i.test(cleaned)) {
    return {
      valid: true,
      courierCode: courierCode || 'JNE',
      courierService: courierCode === 'GOJEK' ? 'INSTANT' : 'REG',
      formatted: cleaned,
    }
  }

  const detectedCourier: CourierCode | undefined =
    courierCode ||
    (cleaned.startsWith('JNE')
      ? 'JNE'
      : cleaned.startsWith('GK-') || cleaned.startsWith('GOJEK-')
        ? 'GOJEK'
        : cleaned.startsWith('AGY')
          ? 'JNE'
          : undefined)

  if (!detectedCourier) {
    return {
      valid: false,
      formatted: cleaned,
      error:
        'Format tidak dikenal. Masukkan nomor resi (JNE, GK-, GOJEK-, AGY, WYB-) atau nomor pesanan (SPR-...)',
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
  const cleaned = (trackingNumber || '').trim().toUpperCase().replace(/^#/, '')
  if (cleaned.startsWith('JNE')) return 'JNE'
  if (cleaned.startsWith('GK-')) return 'GOJEK'
  if (cleaned.startsWith('WYB-') || cleaned.startsWith('WYB')) return 'JNE'
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
