export type AdPlacement = 'HOMEPAGE_HERO' | 'PROMOTED_LIST' | 'BANNER_SPONSOR'

export type AdStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export const AdStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export const AdPlacement = {
  HOMEPAGE_HERO: 'HOMEPAGE_HERO',
  PROMOTED_LIST: 'PROMOTED_LIST',
  BANNER_SPONSOR: 'BANNER_SPONSOR',
} as const

export interface InFeedAdData {
  id: string
  title: string
  subtitle?: string | null
  imageUrl: string
  targetUrl?: string
  priority?: number
  productId?: string | null
  product?: {
    id: string
    name: string
    price: number
    originalPrice?: number | null
    brand?: string | null
    stock?: number
    images?: string[]
    rating?: number
    totalReview?: number
    soldCount?: number
  } | null
  store?: {
    id?: string
    name: string
    slug: string
    city?: string
    logo?: string
    companyName?: string
    banner?: string | null
  } | null
  videoUrl?: string | null
}

export function isProductAdData(ad: InFeedAdData): boolean {
  const storeSlug = ad.store?.slug
  const destination =
    ad.targetUrl || (storeSlug ? `/toko/${storeSlug}` : '/gadget')

  return Boolean(
    ad.productId ||
    ad.product ||
    (destination.startsWith('/gadget/') && destination !== '/gadget')
  )
}

export function isVideoAd(ad: InFeedAdData): boolean {
  return isVideoMedia(ad.videoUrl || ad.imageUrl)
}

export function isVideoMedia(url?: string | null): boolean {
  if (!url) return false
  const clean = url.toLowerCase().split('?')[0]
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.ogg') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.mkv') ||
    url.toLowerCase().includes('/videos/') ||
    url.toLowerCase().includes('/video/') ||
    url.toLowerCase().includes('video/upload')
  )
}
