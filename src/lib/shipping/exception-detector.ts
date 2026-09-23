/**
 * Shipping Exception Detector
 * Mendeteksi kendala pengiriman dari checkpoint timeline
 * dan menyediakan label + rekomendasi aksi untuk customer & admin
 */

import type { TrackingCheckpoint } from './biteship-client'

export type ShippingExceptionType =
  | 'DELAYED'
  | 'ADDRESS_NOT_FOUND'
  | 'DAMAGED'
  | 'RETURNED_TO_SENDER'
  | 'LOST'
  | 'CUSTOMS_HOLD'
  | 'NONE'

export interface ShippingException {
  type: ShippingExceptionType
  label: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  actionRequired: boolean
  customerAction?: string
  adminAction?: string
  showClaimButton: boolean
}

/** Keyword mapping status checkpoint ke exception type */
const EXCEPTION_KEYWORDS: Record<ShippingExceptionType, string[]> = {
  ADDRESS_NOT_FOUND: [
    'address not found',
    'alamat tidak ditemukan',
    'wrong address',
    'alamat salah',
    'tidak ada di tempat',
    'rumah kosong',
    'bad address',
    'undeliverable',
  ],
  LOST: [
    'lost',
    'hilang',
    'missing',
    'paket hilang',
    'barang hilang',
    'paket tidak ditemukan',
  ],
  DAMAGED: [
    'damaged',
    'rusak',
    'broken',
    'pecah',
    'hancur',
    'damage',
    'kerusakan',
  ],
  RETURNED_TO_SENDER: [
    'returned',
    'return to sender',
    'dikembalikan ke pengirim',
    'rts',
    'return shipment',
    'undelivered returned',
    'paket dikembalikan',
  ],
  CUSTOMS_HOLD: ['customs', 'bea cukai', 'held', 'clearance', 'custom hold'],
  DELAYED: [
    'delayed',
    'tertunda',
    'delay',
    'terlambat',
    'pending',
    'hold',
    'ditahan',
    'gagal antar',
    'attempted delivery',
    'failed attempt',
  ],
  NONE: [],
}

const EXCEPTION_DETAILS: Record<
  Exclude<ShippingExceptionType, 'NONE'>,
  Omit<ShippingException, 'type'>
> = {
  DELAYED: {
    label: 'Pengiriman Tertunda',
    description:
      'Paket mengalami penundaan pengiriman. Kurir sedang berusaha menyelesaikan proses pengiriman.',
    severity: 'MEDIUM',
    actionRequired: false,
    customerAction:
      'Tunggu hingga 2x estimasi waktu pengiriman. Jika tidak ada update, hubungi toko.',
    adminAction:
      'Monitor status paket dan hubungi kurir jika tertunda lebih dari 3 hari.',
    showClaimButton: false,
  },
  ADDRESS_NOT_FOUND: {
    label: 'Alamat Tidak Ditemukan',
    description:
      'Kurir tidak dapat menemukan alamat tujuan. Paket akan dikembalikan ke toko jika tidak ada konfirmasi.',
    severity: 'HIGH',
    actionRequired: true,
    customerAction: 'Segera hubungi toko untuk memperbarui alamat pengiriman.',
    adminAction:
      'Konfirmasi ulang alamat customer dan koordinasikan dengan kurir untuk pengiriman ulang.',
    showClaimButton: false,
  },
  DAMAGED: {
    label: 'Paket Rusak',
    description:
      'Paket terindikasi mengalami kerusakan dalam proses pengiriman.',
    severity: 'CRITICAL',
    actionRequired: true,
    customerAction:
      'Jangan terima paket yang terlihat rusak. Dokumentasikan kerusakan dan ajukan klaim asuransi.',
    adminAction:
      'Proses klaim asuransi pengiriman segera. Siapkan unit pengganti.',
    showClaimButton: true,
  },
  RETURNED_TO_SENDER: {
    label: 'Paket Dikembalikan ke Toko',
    description:
      'Paket tidak berhasil dikirimkan dan sedang dalam proses pengembalian ke toko asal.',
    severity: 'HIGH',
    actionRequired: true,
    customerAction:
      'Hubungi toko untuk menjadwalkan ulang pengiriman atau refund.',
    adminAction:
      'Terima paket retur dan koordinasikan dengan customer untuk pengiriman ulang atau refund.',
    showClaimButton: false,
  },
  LOST: {
    label: 'Paket Tidak Ditemukan',
    description:
      'Paket tidak dapat dilacak dan kemungkinan hilang dalam proses pengiriman.',
    severity: 'CRITICAL',
    actionRequired: true,
    customerAction:
      'Laporkan paket hilang ke toko untuk proses klaim asuransi dan penggantian unit.',
    adminAction:
      'Ajukan klaim kehilangan paket ke ekspedisi dan proses penggantian unit ke customer.',
    showClaimButton: true,
  },
  CUSTOMS_HOLD: {
    label: 'Ditahan Bea Cukai',
    description: 'Paket sedang dalam proses pemeriksaan oleh Bea Cukai.',
    severity: 'MEDIUM',
    actionRequired: false,
    customerAction:
      'Tunggu proses clearance Bea Cukai. Siapkan dokumen jika diperlukan.',
    adminAction:
      'Koordinasikan dengan ekspedisi untuk mempercepat proses clearance.',
    showClaimButton: false,
  },
}

/**
 * Deteksi exception dari array checkpoint
 */
export function detectShippingException(
  checkpoints: TrackingCheckpoint[]
): ShippingException {
  if (!checkpoints || checkpoints.length === 0) {
    return {
      type: 'NONE',
      label: '',
      description: '',
      severity: 'LOW',
      actionRequired: false,
      showClaimButton: false,
    }
  }

  // Check dari checkpoint terbaru (index terakhir) ke awal
  for (let i = checkpoints.length - 1; i >= 0; i--) {
    const cp = checkpoints[i]
    const text = `${cp.status} ${cp.description}`.toLowerCase()

    for (const [exType, keywords] of Object.entries(EXCEPTION_KEYWORDS)) {
      if (exType === 'NONE') continue
      const type = exType as Exclude<ShippingExceptionType, 'NONE'>
      if (keywords.some((kw) => text.includes(kw))) {
        return {
          type,
          ...EXCEPTION_DETAILS[type],
        }
      }
    }
  }

  return {
    type: 'NONE',
    label: '',
    description: '',
    severity: 'LOW',
    actionRequired: false,
    showClaimButton: false,
  }
}

/**
 * Deteksi exception dari single status string
 */
export function detectExceptionFromStatus(
  status: string
): ShippingExceptionType {
  const text = (status || '').toLowerCase()
  for (const [exType, keywords] of Object.entries(EXCEPTION_KEYWORDS)) {
    if (exType === 'NONE') continue
    if (keywords.some((kw) => text.includes(kw))) {
      return exType as ShippingExceptionType
    }
  }
  return 'NONE'
}

/**
 * Get severity color class (Tailwind)
 */
export function getExceptionSeverityClass(
  severity: ShippingException['severity']
): string {
  switch (severity) {
    case 'LOW':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'MEDIUM':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'HIGH':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'CRITICAL':
      return 'text-red-700 bg-red-100 border-red-300'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

/**
 * Format string pesan kendala untuk customer
 */
export function formatExceptionForCustomer(
  exception: ShippingException
): string {
  if (exception.type === 'NONE') return ''
  return `[${exception.label}] ${exception.description}${
    exception.customerAction ? ` Rekomendasi: ${exception.customerAction}` : ''
  }`
}

/**
 * Format string pesan kendala untuk admin operasional
 */
export function formatExceptionForAdmin(exception: ShippingException): string {
  if (exception.type === 'NONE') return ''
  return `[${exception.severity}] ${exception.label}: ${exception.description}${
    exception.adminAction ? ` Aksi Admin: ${exception.adminAction}` : ''
  }`
}
