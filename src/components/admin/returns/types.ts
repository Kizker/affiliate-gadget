import type { ShippingBookingRecord } from '@/lib/shipping/biteship-client'

export interface BiteshipCourier {
  id: string
  name: string
  service: string
  badge: string
  badgeColor: string
  description: string
  courierCode: string
}

export const BITESHIP_COURIERS: BiteshipCourier[] = [
  {
    id: 'JNE',
    name: 'JNE Express',
    service: 'Reguler (Biteship)',
    badge: '2 - 3 Hari',
    badgeColor:
      'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    description:
      'Layanan kurir reguler nasional terpercaya dengan asuransi wajib penuh',
    courierCode: 'JNE',
  },
  {
    id: 'JNE_YES',
    name: 'JNE Express',
    service: 'YES Esok Sampai (Biteship)',
    badge: 'Esok Tiba (24 Jam)',
    badgeColor:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    description:
      'Layanan prioritas esok hari kerja dengan jaminan tiba tepat waktu',
    courierCode: 'JNE',
  },
  {
    id: 'GOJEK',
    name: 'Gojek Instant',
    service: 'Kilat 1-2 Jam (Biteship)',
    badge: 'Kilat 1-2 Jam',
    badgeColor:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    description:
      'Kurir motor instan tiba dalam 1-2 jam langsung dari toko cabang',
    courierCode: 'GOJEK',
  },
]

export interface ReturnRequest {
  id: string
  orderId: string
  userId: string
  storeId?: string | null
  type: 'REFUND' | 'REPLACEMENT'
  reason: string
  reasonLabel?: string | null
  description: string
  images: string[]
  videoUrl?: string | null
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountName?: string | null
  refundAmount?: number | null
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  storeResponse?: string | null
  returnCourier?: string | null
  returnTrackingNumber?: string | null
  createdAt: string
  resolvedAt?: string | null
  order: {
    orderNumber: string
    status: string
    total: number
    courierCode?: string | null
    courierService?: string | null
    trackingNumber?: string | null
    items: Array<{
      product?: {
        id: string
        name: string
        brand?: string | null
        images?: string[]
      } | null
      service?: { id: string; name: string } | null
    }>
    store?: {
      id: string
      name: string
      companyName?: string | null
      city: string
      phone?: string | null
    } | null
  }
  user: {
    id: string
    name: string
    email: string
    phone?: string | null
  }
}

export const statusConfig: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  PENDING: {
    label: 'Perlu Verifikasi',
    badgeClass:
      'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  IN_REVIEW: {
    label: 'Sedang Diperiksa',
    badgeClass:
      'bg-blue-50 text-blue-800 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80',
    dotClass: 'bg-blue-500',
  },
  APPROVED: {
    label: 'Pengajuan Disetujui',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
    dotClass: 'bg-emerald-500',
  },
  COMPLETED: {
    label: 'Pengembalian Selesai',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
    dotClass: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Pengajuan Ditolak',
    badgeClass:
      'bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/80',
    dotClass: 'bg-rose-500',
  },
}

export interface ReturnMetrics {
  total: number
  pending: number
  inReview: number
  approved: number
  completed: number
  rejected: number
  totalRefundAmount: number
}

export interface AwbModalData {
  trackingNumber: string
  courierCode: string
  courierService: string
  orderNumber: string
  customerName: string
  actionType: 'REPLACEMENT' | 'REPAIR'
  bookingRecord?: ShippingBookingRecord | null
}

export interface LightboxMeta {
  title: string
  subtitle: string
}

export type ResolutionActionType = 'REPLACEMENT' | 'REFUND' | 'REPAIR'
export type RepairStage = 'IN_PROGRESS' | 'COMPLETED'
export type ActionModalType =
  | 'APPROVE'
  | 'REJECT'
  | 'RESPONSE'
  | 'COMPLETE'
  | null

export function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function formatPrice(price?: number | null) {
  if (typeof price !== 'number' || isNaN(price)) return 'Rp 0'
  return `Rp ${price.toLocaleString('id-ID')}`
}
