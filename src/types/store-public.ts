export interface StoreSchedulePublic {
  id: string
  day: string
  openTime: string
  closeTime: string
  isClosed: boolean
}

export interface StoreProductVariantPublic {
  id: string
  name: string
  price: number
  stock: number
  color?: string | null
  ram?: string | null
  storage?: string | null
  image?: string | null
}

export interface StoreProductPublic {
  id: string
  name: string
  description?: string | null
  category: string
  brand: string | null
  model?: string | null
  condition?: string
  price: number
  originalPrice?: number | null
  stock: number
  images: string[]
  rating: number
  totalReview: number
  isPromoted?: boolean
  promotionPriority?: number
  variants: StoreProductVariantPublic[]
}

export interface StorePublicProfile {
  id: string
  name: string
  slug: string
  companyName: string
  taxId: string | null
  tagline: string | null
  description: string | null
  logo: string | null
  banner: string | null
  heroImage?: string | null
  heroMobileImage?: string | null
  heroTitle?: string | null
  heroSubtitle?: string | null
  heroDescription?: string | null
  campaignKicker?: string | null
  campaignTitle?: string | null
  campaignSubtitle?: string | null
  campaignDescription?: string | null
  secondaryBanner?: string | null
  secondaryBannerTitle?: string | null
  secondaryBannerDesc?: string | null
  address: string
  city: string
  province: string
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  phone: string
  whatsapp: string | null
  email: string | null
  rating: number
  totalReview: number
  totalSales: number
  isActive: boolean
  schedules: StoreSchedulePublic[]
  products: StoreProductPublic[]
}
