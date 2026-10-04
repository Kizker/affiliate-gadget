export interface BankAccount {
  id?: string
  bankName: string
  accountNumber: string
  accountName: string
  isPrimary?: boolean
}

export interface Schedule {
  id?: string
  day: string
  openTime: string
  closeTime: string
}

export interface Mitra {
  id: string
  businessName: string
  name?: string
  slug?: string
  companyName?: string
  taxId?: string | null
  address?: string
  tagline: string | null
  description?: string | null
  city: string
  province: string
  postalCode?: string | null
  phone: string
  whatsapp: string | null
  email: string | null
  website: string | null
  commissionRate?: number
  isOwnerStore?: boolean
  rating: number
  totalReview: number
  totalSales?: number
  totalViews?: number
  totalInquiries?: number
  isApproved: boolean
  isActive: boolean
  source?: 'store' | 'pending_applicant'
  rejectionReason?: string | null
  createdAt: string
  bankAccounts?: BankAccount[]
  schedules?: Schedule[]
  user: {
    id: string
    name: string | null
    email: string
    phone?: string | null
    isActive?: boolean
    mitraStatus: string | null
  }
  _count?: {
    services?: number
    products?: number
    orders?: number
    images?: number
    reviews?: number
  }
}

export interface Stats {
  total: number
  approved: number
  pending: number
  cities: number
}

export interface ServiceStats {
  total: number
  active: number
  inactive: number
  totalServices: number
  cities: number
}

export interface ServiceMitra {
  id: string
  userId: string
  username: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  mitraStatus: string | null
  createdAt: string
  mitra: {
    id: string
    businessName: string
    tagline?: string | null
    description?: string | null
    address: string
    city: string
    province: string
    phone: string
    whatsapp?: string | null
    rating: number
    totalReview: number
    isApproved: boolean
    isActive: boolean
    servicesCount: number
    imagesCount: number
  } | null
}
