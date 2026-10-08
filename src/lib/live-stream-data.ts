import prisma from '@/lib/db'
import {
  getActiveDealForStream,
  getActiveDealsForStream,
} from '@/lib/live-deals'
import { createLiveKitToken } from '@/lib/livekit'

export interface StoreInfo {
  id: string
  name: string
  companyName: string | null
  slug: string
  logo: string | null
  city: string | null
  whatsapp: string | null
}

export interface ProductHighlight {
  id: string
  name: string
  price: number
  originalPrice?: number | null
  images: string[]
  brand: string | null
  stock: number
  rating?: number | null
  warrantyDays?: number | null
  liveDeal?: {
    dealToken: string
    discountPrice: number
    originalPrice: number
    dealType?: string
    badgeLabel?: string
  }
}

export interface LiveStreamDetail {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  status: 'SCHEDULED' | 'LIVE' | 'ENDED'
  scheduledAt: string | null
  startedAt: string | null
  endedAt: string | null
  viewerCount: number
  store: StoreInfo | null
  featuredProducts?: ProductHighlight[]
  activeDeal?: any
  activeDeals?: any[]
  livekitRoomName?: string | null
}

export interface LiveKitInitialToken {
  token: string
  wsUrl: string
  roomName: string
}

/**
 * Preload stream data on server to eliminate initial client fetch delay and render LCP instantly.
 */
export async function getLiveStreamInitialData(
  id: string
): Promise<LiveStreamDetail | null> {
  try {
    const stream = await prisma.liveStream.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
            slug: true,
            logo: true,
            city: true,
            whatsapp: true,
          },
        },
        host: {
          select: { id: true, name: true, image: true },
        },
      },
    })

    if (!stream) return null

    let featuredProducts: ProductHighlight[] = []
    if (stream.featuredProductIds && stream.featuredProductIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: stream.featuredProductIds }, isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          images: true,
          brand: true,
          stock: true,
          rating: true,
          warrantyDays: true,
        },
      })

      const activeDeals = getActiveDealsForStream(id)
      featuredProducts = products.map((p) => {
        const dealForProd =
          activeDeals.find(
            (d) => d.productId === p.id && d.dealType === 'PINNED_DEAL'
          ) || activeDeals.find((d) => d.productId === p.id)
        if (dealForProd) {
          return {
            ...p,
            liveDeal: {
              dealToken: dealForProd.dealToken,
              discountPrice: dealForProd.discountPrice,
              originalPrice: dealForProd.originalPrice,
              dealType: dealForProd.dealType,
              badgeLabel: dealForProd.badgeLabel,
            },
          }
        }
        return p
      })
    }

    const activeDeal = getActiveDealForStream(id)
    const activeDeals = getActiveDealsForStream(id)

    return {
      id: stream.id,
      title: stream.title,
      description: stream.description,
      coverImage: stream.coverImage,
      status: stream.status as 'SCHEDULED' | 'LIVE' | 'ENDED',
      scheduledAt: stream.scheduledAt?.toISOString() || null,
      startedAt: stream.startedAt?.toISOString() || null,
      endedAt: stream.endedAt?.toISOString() || null,
      viewerCount: stream.viewerCount,
      store: stream.store,
      featuredProducts,
      activeDeal,
      activeDeals,
      livekitRoomName: stream.livekitRoomName,
    }
  } catch (err) {
    console.error('Error fetching stream initial data:', err)
    return null
  }
}

/**
 * Generate guest viewer token on the server for faster first-render connection.
 */
export async function getGuestViewerToken(
  stream: LiveStreamDetail
): Promise<LiveKitInitialToken | null> {
  if (stream.status === 'ENDED') return null

  try {
    const uniqueSuffix = Math.random().toString(36).slice(2, 9)
    const participantIdentity = `guest-${uniqueSuffix}`
    const participantName = 'Penonton'
    const roomName = stream.livekitRoomName || `ag-live-${stream.id}`

    const token = await createLiveKitToken({
      roomName,
      participantIdentity,
      participantName,
      isBroadcaster: false,
      metadata: {
        role: 'viewer',
        storeId: stream.store?.id,
      },
    })

    const livekitWsUrl =
      process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL || ''

    return {
      token,
      wsUrl: livekitWsUrl,
      roomName,
    }
  } catch (err) {
    // If LiveKit credentials are not configured or error happens, fallback gracefully
    console.error('Error preloading guest LiveKit token:', err)
    return null
  }
}
