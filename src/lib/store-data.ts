import prisma from '@/lib/db'
import { StorePublicProfile } from '@/types/store-public'

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

/**
 * Fetch complete public store profile and inventory for instant SSR hydration (/toko/[slug])
 */
export async function getStoreDetailData(
  slug: string
): Promise<StorePublicProfile | null> {
  try {
    const store = await prisma.store.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        companyName: true,
        taxId: true,
        tagline: true,
        description: true,
        logo: true,
        banner: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        phone: true,
        whatsapp: true,
        email: true,
        rating: true,
        totalReview: true,
        totalSales: true,
        isActive: true,
        schedules: {
          select: {
            id: true,
            day: true,
            openTime: true,
            closeTime: true,
            isClosed: true,
          },
        },
        products: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            brand: true,
            model: true,
            condition: true,
            price: true,
            originalPrice: true,
            stock: true,
            images: true,
            rating: true,
            totalReview: true,
            isPromoted: true,
            promotionPriority: true,
            variants: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                color: true,
                ram: true,
                storage: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      } as any,
    })

    if (!store || !store.isActive) {
      return null
    }

    if (store && typeof (prisma as any).$queryRawUnsafe === 'function') {
      try {
        const rawStoreCols: any[] = await prisma.$queryRawUnsafe(
          `SELECT "heroImage", "heroMobileImage", "heroTitle", "heroSubtitle", "heroDescription", "campaignKicker", "campaignTitle", "campaignSubtitle", "campaignDescription", "secondaryBanner", "secondaryBannerTitle", "secondaryBannerDesc" FROM stores WHERE id = $1`,
          store.id
        )
        if (rawStoreCols?.[0]) {
          Object.assign(store, rawStoreCols[0])
        }
      } catch (rawErr) {
        console.warn(
          'Raw visual fields query warning in store detail helper:',
          rawErr
        )
      }
    }

    return JSON.parse(JSON.stringify(store))
  } catch (error) {
    console.error('Error fetching store detail data:', error)
    return null
  }
}
