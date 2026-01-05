import prisma from '@/lib/db'
import RekomendasiClientPage from './rekomendasi-client'

// Enable ISR - revalidate every 2 minutes
export const revalidate = 120

export const metadata = {
  title: 'Rekomendasi Mitra Terpercaya - HaloTekno',
  description:
    'Temukan rekomendasi toko servis gadget dan komputer terbaik di Indonesia',
}

// Fetch initial mitra data on server
async function getInitialMitras() {
  try {
    const [mitras, total] = await Promise.all([
      prisma.mitra.findMany({
        where: {
          isApproved: true,
          isActive: true,
        },
        take: 12,
        orderBy: [{ rating: 'desc' }, { totalReview: 'desc' }],
        include: {
          services: {
            take: 3,
            select: {
              id: true,
              name: true,
              icon: true,
              price: true,
            },
          },
        },
      }),
      prisma.mitra.count({
        where: {
          isApproved: true,
          isActive: true,
        },
      }),
    ])

    // Transform to expected format
    const transformedMitras = mitras.map((mitra) => ({
      id: mitra.id,
      businessName: mitra.businessName,
      tagline: mitra.tagline,
      description: mitra.description,
      city: mitra.city,
      address: mitra.address,
      phone: mitra.phone,
      rating: mitra.rating,
      totalReview: mitra.totalReview,
      reviewCount: mitra.totalReview,
      services: mitra.services,
      banner: mitra.banner,
      weekdayHours: mitra.weekdayHours,
      weekendHours: mitra.weekendHours,
      latitude: mitra.latitude,
      longitude: mitra.longitude,
    }))

    return {
      mitras: transformedMitras,
      total,
      hasMore: total > 12,
    }
  } catch (error) {
    console.error('Error fetching initial mitras:', error)
    return { mitras: [], total: 0, hasMore: false }
  }
}

export default async function RekomendasiPage() {
  const { mitras, total, hasMore } = await getInitialMitras()

  return (
    <RekomendasiClientPage
      initialMitras={mitras}
      initialTotal={total}
      initialHasMore={hasMore}
    />
  )
}
