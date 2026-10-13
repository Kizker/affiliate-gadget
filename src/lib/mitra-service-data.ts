import prisma from '@/lib/db'
import { DEFAULT_MITRAS } from '@/lib/mitra-seed-data'

export interface MitraService {
  id: string
  name: string
  icon?: string | null
  price?: string | null
}

export interface MitraData {
  id: string
  businessName: string
  tagline: string | null
  description: string | null
  banner: string | null
  city: string
  province: string
  address: string
  phone: string
  whatsapp: string | null
  rating: number
  totalReview: number
  reviewCount: number
  features: string[]
  services: MitraService[]
  weekdayHours: string | null
  weekendHours: string | null
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string
}

let cachedMitras: { data: MitraData[]; timestamp: number } | null = null
const CACHE_TTL_MS = 60 * 1000 // 60 seconds cache

export function invalidateMitraServiceDataCache() {
  cachedMitras = null
}

/**
 * Fetch approved mitras directly on the server for instant SSR hydration (/servis-lcd).
 * Eliminates client-side network waterfall delay and guarantees frame-1 markup discoverability.
 */
export async function getMitraServiceListData(): Promise<MitraData[]> {
  const now = Date.now()
  if (cachedMitras && now - cachedMitras.timestamp < CACHE_TTL_MS) {
    return cachedMitras.data
  }

  try {
    const mitras = await prisma.mitra.findMany({
      where: {
        isApproved: true,
        isActive: true,
      },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            icon: true,
            price: true,
          },
          take: 5,
        },
        images: {
          where: { isBanner: true },
          take: 1,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: [{ rating: 'desc' }, { totalReview: 'desc' }],
    })

    if (mitras && mitras.length > 0) {
      const result = mitras.map((mitra) => ({
        id: mitra.id,
        businessName: mitra.businessName,
        tagline: mitra.tagline,
        description: mitra.description,
        banner: mitra.banner || mitra.images[0]?.url || null,
        city: mitra.city,
        province: mitra.province,
        address: mitra.address,
        phone: mitra.phone,
        whatsapp: mitra.whatsapp,
        rating: mitra.rating,
        totalReview: mitra.totalReview,
        reviewCount: mitra._count.reviews,
        features: mitra.features || [],
        services: mitra.services || [],
        weekdayHours: mitra.weekdayHours,
        weekendHours: mitra.weekendHours,
        latitude: mitra.latitude,
        longitude: mitra.longitude,
        googleMapsUrl:
          mitra.latitude && mitra.longitude
            ? `https://maps.google.com/?q=${mitra.latitude},${mitra.longitude}`
            : `https://maps.google.com/?q=${encodeURIComponent(mitra.address + ', ' + mitra.city)}`,
      }))
      cachedMitras = { data: result, timestamp: now }
      return result
    }
  } catch (error) {
    console.error('Error fetching mitras in getMitraServiceListData:', error)
  }

  // Resilient fallback to DEFAULT_MITRAS if database is empty or during cold boot
  const fallback = DEFAULT_MITRAS.map((m, idx) => ({
    id: `seed-mitra-${idx + 1}`,
    businessName: m.businessName,
    tagline: m.tagline,
    description: m.description,
    banner: m.banner,
    city: m.city,
    province: m.province,
    address: m.address,
    phone: m.phone,
    whatsapp: m.whatsapp,
    rating: m.rating,
    totalReview: m.totalReview,
    reviewCount: m.totalReview,
    features: m.features || [],
    services: m.services.map((s, sIdx) => ({
      id: `svc-seed-${idx}-${sIdx}`,
      name: s.name,
      icon: s.icon,
      price: s.price,
    })),
    weekdayHours: m.weekdayHours,
    weekendHours: m.weekendHours,
    latitude: m.latitude,
    longitude: m.longitude,
    googleMapsUrl: `https://maps.google.com/?q=${m.latitude},${m.longitude}`,
  }))
  cachedMitras = { data: fallback, timestamp: now }
  return fallback
}
