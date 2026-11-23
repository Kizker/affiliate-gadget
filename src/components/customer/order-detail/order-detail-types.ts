import React from 'react'
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  RotateCcw,
} from 'lucide-react'

export const DEFAULT_GADGET_IMAGE =
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'

export interface OrderDetailItem {
  id: string
  type: string
  quantity: number
  price: number
  subtotal: number
  notes?: string
  variantId?: string
  variantName?: string
  service?: { id: string; name: string; category: string }
  product?: {
    id: string
    name: string
    brand?: string | null
    slug: string
    images?: string[]
    sku?: string | null
  }
  rentalItem?: {
    id: string
    name: string
    slug: string
    images?: string[]
  }
}

export interface OrderComplaint {
  id: string
  status: string
  subject: string
  description: string
  images: string[]
  resolution: string | null
  rejectionNote: string | null
  createdAt: string
  resolvedAt: string | null
  assignedTo: { name: string; email: string } | null
}

export interface OrderReturnRequest {
  id: string
  type: string
  reason: string
  reasonLabel?: string | null
  description: string
  images: string[]
  videoUrl?: string | null
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountName?: string | null
  refundAmount?: number | null
  status: string
  storeResponse?: string | null
  returnCourier?: string | null
  returnTrackingNumber?: string | null
  packageReceivedAt?: string | null
  qcStatus?: string | null
  qcNotes?: string | null
  createdAt: string
  resolvedAt?: string | null
}

export interface OrderReview {
  id?: string
  rating: number
  comment: string | null
  images?: string[]
  videos?: string[]
}

export interface OrderData {
  id: string
  orderNumber: string
  status: string
  total: number
  subtotal?: number
  voucherCode?: string | null
  discountAmount?: number
  shippingCost?: number
  tax?: number
  insuranceRate?: number
  insuranceFee?: number
  courierCode?: string | null
  courierService?: string | null
  trackingNumber?: string | null
  bonusChargerIncluded?: boolean
  bonusProtectorIncluded?: boolean
  bonusCaseIncluded?: boolean
  warrantyExpiryDate?: string | null
  customerConfirmedAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  notes?: string | null
  paymentStatus?: string
  store?: {
    id: string
    name: string
    ptName?: string
    city: string
    address?: string
    phone?: string | null
  } | null
  items: OrderDetailItem[]
  complaints?: OrderComplaint[]
  returnRequests?: OrderReturnRequest[]
  review?: OrderReview | null
}

export interface OrderDetailProps {
  order: OrderData
}

export interface StatusBadgeInfo {
  label: string
  badgeBg: string
  dotColor: string
  icon: React.ComponentType<{ className?: string }>
}

export const statusConfig: Record<string, StatusBadgeInfo> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    badgeBg:
      'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    dotColor: 'bg-amber-500',
    icon: Clock,
  },
  PAID: {
    label: 'Pembayaran Diterima',
    badgeBg:
      'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    dotColor: 'bg-slate-600 dark:bg-slate-300',
    icon: CheckCircle,
  },
  PROCESSING: {
    label: 'Diproses Toko',
    badgeBg:
      'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    dotColor: 'bg-slate-500',
    icon: Package,
  },
  IN_PROGRESS: {
    label: 'Sedang Dikirim',
    badgeBg:
      'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    dotColor: 'bg-slate-600',
    icon: Truck,
  },
  COMPLETED: {
    label: 'Pesanan Selesai',
    badgeBg:
      'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    dotColor: 'bg-slate-700 dark:bg-slate-300',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    badgeBg:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dotColor: 'bg-rose-500',
    icon: XCircle,
  },
  RETURNED: {
    label: 'Dikembalikan (Retur)',
    badgeBg:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dotColor: 'bg-slate-500',
    icon: RotateCcw,
  },
  RETURN_PENDING: {
    label: 'Pengajuan Retur / Garansi Aktif',
    badgeBg:
      'bg-orange-50 text-orange-700 border-orange-200/80 dark:bg-orange-950/40 dark:border-orange-900/60 dark:text-orange-300',
    dotColor: 'bg-orange-500',
    icon: RotateCcw,
  },
  RETURN_APPROVED: {
    label: 'Retur Disetujui (Siap Kirim Balik)',
    badgeBg:
      'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300',
    dotColor: 'bg-blue-500',
    icon: Truck,
  },
  RETURN_IN_TRANSIT: {
    label: 'Paket Retur Menuju Toko',
    badgeBg:
      'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
    icon: Truck,
  },
  RETURN_IN_QC: {
    label: 'Paket Tiba di Toko (Sedang QC Fisik)',
    badgeBg:
      'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300',
    dotColor: 'bg-amber-500',
    icon: Package,
  },
  RETURN_REJECTED: {
    label: 'Pengajuan Retur Ditolak',
    badgeBg:
      'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300',
    dotColor: 'bg-rose-500',
    icon: XCircle,
  },
  RETURN_COMPLETED: {
    label: 'Retur Selesai',
    badgeBg:
      'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle,
  },
}

export const formatPrice = (price: number | undefined) => {
  if (typeof price !== 'number' || isNaN(price)) return 'Rp 0'
  return `Rp ${price.toLocaleString('id-ID')}`
}
