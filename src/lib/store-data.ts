import prisma from '@/lib/db'

export interface StoreDirectoryItem {
  id: string
  name: string
  slug: string
  city: string
  address: string | null
  logo: string | null
  banner: string | null
  rating: number
  totalReview: number
  isOwnerStore: boolean
  phone: string | null
  whatsapp: string | null
  _count?: {
    products: number
    orders: number
  }
  schedules?: any[]
  bankAccounts?: any[]
  [key: string]: any
}

/**
 * Fetch active stores for instant SSR hydration in the store directory (/toko)
 */
export async function getStoresDirectoryData(): Promise<StoreDirectoryItem[]> {
  try {
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
      },
      include: {
        bankAccounts: true,
        schedules: true,
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
      orderBy: [{ isOwnerStore: 'desc' }, { rating: 'desc' }],
    })

    return JSON.parse(JSON.stringify(stores))
  } catch (error) {
    console.error('Error fetching stores directory data:', error)
    return []
  }
}
