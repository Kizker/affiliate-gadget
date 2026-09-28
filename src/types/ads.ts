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
