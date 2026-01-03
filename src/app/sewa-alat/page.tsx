import { db } from '@/lib/db'
import SewaAlatClientPage from './sewa-alat-client'

// Enable ISR - revalidate every 60 seconds for fresh data
export const revalidate = 60

// Fetch initial data on the server
async function getInitialRentalItems() {
  try {
    const limit = 12
    const page = 1

    const where = {
      isActive: true,
    }

    const [rawRentalItems, total, allActiveItems] = await Promise.all([
      db.rentalItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.rentalItem.count({ where }),
      db.rentalItem.findMany({
        where: { isActive: true },
        select: { stock: true },
      }),
    ])

    // Sanitize images (Hotfix for broken seed data)
    const rentalItems = rawRentalItems.map((item) => ({
      ...item,
      images: item.images.map((img) =>
        img.includes('photo-1582719471384-894fbb16f7ce')
          ? 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=550&fit=crop'
          : img
      ),
    }))

    // Calculate stats from fetched data
    const stats = {
      total: allActiveItems.length,
      available: allActiveItems.filter((item) => item.stock > 0).length,
      unavailable: allActiveItems.filter((item) => item.stock === 0).length,
    }

    return {
      rentalItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    }
  } catch (error) {
    console.error('Error fetching initial rental items:', error)
    return {
      rentalItems: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      },
      stats: {
        total: 0,
        available: 0,
        unavailable: 0,
      },
    }
  }
}

export default async function SewaAlatPage() {
  // Fetch data on server - this runs at build time + revalidates every 60s
  const initialData = await getInitialRentalItems()

  return <SewaAlatClientPage initialData={initialData} />
}
