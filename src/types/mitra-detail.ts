export interface ServiceItem {
  id: string
  name: string
  price: string
  icon: string | null
  description?: string | null
}

export interface MitraImage {
  id: string
  url: string
}

export interface ReviewUser {
  id: string
  name: string | null
  image: string | null
}

export interface MitraReviewItem {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  images?: string[]
  videos?: string[]
  user: ReviewUser
}

export interface MitraDetail {
  id: string
  businessName: string
  tagline: string | null
  description: string | null
  city: string
  province: string
  address: string
  phone: string
  whatsapp: string | null
  email: string | null
  website: string | null
  rating: number
  totalReview: number
  banner: string | null
  features: string[] | null
  weekdayHours: string | null
  weekendHours: string | null
  latitude: number | null
  longitude: number | null
  mapsUrl?: string | null
  services: ServiceItem[]
  images: MitraImage[]
  reviews?: MitraReviewItem[]
  isOpen: boolean
}
