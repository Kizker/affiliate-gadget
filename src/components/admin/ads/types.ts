export type AdTargetType =
  | 'STORE'
  | 'STORE_CATALOG'
  | 'PRODUCT'
  | 'ALL_CATALOG'
  | 'SERVICE_LCD'
  | 'WARRANTY'
  | 'CUSTOM'

export interface CurrentStoreInfo {
  id: string
  name: string
  slug: string
  city?: string
  banner?: string | null
}

export interface AdStore {
  id: string
  name: string
  slug: string
  city?: string
  logo?: string
  banner?: string
  companyName?: string
}

export interface InternalAdItem {
  id: string
  title: string
  subtitle?: string
  placement:
    | 'HOMEPAGE_HERO'
    | 'PROMOTED_LIST'
    | 'BANNER_SPONSOR'
    | 'SIDEBAR_BANNER'
  imageUrl: string
  targetUrl?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string | null
  priority: number
  isActive: boolean
  clicks: number
  impressions: number
  startDate: string
  endDate?: string | null
  createdAt: string
  store?: AdStore | null
}

export interface Level1SlotInfo {
  isOccupied: boolean
  activeAd: {
    id: string
    title: string
    subtitle?: string | null
    startDate: string
    endDate: string | null
    remainingText: string
    remainingDays: number
    store?: {
      id: string
      name: string
      city?: string | null
      slug: string
    } | null
  } | null
}

export const PRESET_BANNERS = [
  {
    label: 'Samsung Flagship Campaign',
    url: '/images/banners/samsung-campaign-banner.jpg',
    category: 'Platform Resmi',
  },
  {
    label: 'Mobile Hero Banner Special',
    url: '/images/banners/samsung-mobile-hero.jpg',
    category: 'Mobile Promo',
  },
  {
    label: 'Vision AI Super Flagship',
    url: '/images/banners/samsung-vision-ai.jpg',
    category: 'Teknologi AI',
  },
  {
    label: 'Garansi Toko 30 Hari Ganti Unit',
    url: '/images/hero-slide-1.jpg',
    category: 'Garansi Resmi',
  },
  {
    label: 'QC Teknisi & Layanan Toko Cabang',
    url: '/images/hero-slide-2.jpg',
    category: 'Mitra PT',
  },
]

export function calculateDurationText(
  startDateStr: string,
  endDateStr?: string | null,
  level?: 'LEVEL_1' | 'LEVEL_2'
): string {
  if (!endDateStr) {
    return level === 'LEVEL_1' ? 'Durasi: 7 Hari' : 'Target Kemunculan Grid'
  }
  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  const diffDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  )
  if (level === 'LEVEL_1') {
    return `Berdasarkan Hari: ${diffDays} Hari`
  }
  return `Target Grid • ${diffDays} Hari`
}

export function computeTargetUrl(
  type: AdTargetType,
  store?: CurrentStoreInfo | null,
  productId?: string,
  customUrl?: string
): string {
  switch (type) {
    case 'STORE':
      return store?.slug ? `/toko/${store.slug}` : '/toko'
    case 'STORE_CATALOG':
      return store?.id ? `/gadget?store=${store.id}` : '/gadget'
    case 'PRODUCT':
      return productId ? `/gadget/${productId}` : '/gadget'
    case 'ALL_CATALOG':
      return '/gadget'
    case 'SERVICE_LCD':
      return '/servis-lcd'
    case 'WARRANTY':
      return '/garansi'
    case 'CUSTOM':
      return customUrl || ''
    default:
      return store?.slug ? `/toko/${store.slug}` : '/gadget'
  }
}

export function getAdTimingInfo(ad: InternalAdItem) {
  const now = Date.now()
  const isApproved = ad.status === 'APPROVED'
  const isPending = ad.status === 'PENDING'
  const isRejected = ad.status === 'REJECTED'

  let isExpired = false
  let remainingMs = 0
  let days = 0
  let hours = 0
  let isUrgent = false // < 3 hari
  let remainingText = ''

  if (ad.endDate) {
    const end = new Date(ad.endDate).getTime()
    remainingMs = end - now
    if (remainingMs <= 0) {
      isExpired = true
      remainingText = 'Masa Tayang Habis'
    } else {
      days = Math.floor(remainingMs / (1000 * 60 * 60 * 24))
      hours = Math.floor(
        (remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      )
      isUrgent = days < 3
      if (days > 0) {
        remainingText = `${days} hari ${hours} jam lagi`
      } else if (hours > 0) {
        remainingText = `${hours} jam lagi`
      } else {
        const mins = Math.max(1, Math.floor(remainingMs / (1000 * 60)))
        remainingText = `${mins} menit lagi`
      }
    }
  } else {
    remainingText = 'Aktif Tanpa Batas Waktu'
  }

  const isCurrentlyActive = isApproved && ad.isActive && !isExpired

  return {
    isApproved,
    isPending,
    isRejected,
    isExpired,
    isCurrentlyActive,
    remainingMs,
    days,
    hours,
    isUrgent,
    remainingText,
  }
}
