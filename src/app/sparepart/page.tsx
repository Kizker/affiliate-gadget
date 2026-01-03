import { db } from '@/lib/db'
import SparepartClientPage from './sparepart-client'

// Enable ISR - revalidate every 60 seconds for fresh data
export const revalidate = 60

// Fetch initial data on the server
async function getInitialProducts() {
  try {
    const limit = 12
    const page = 1

    const where = {
      isActive: true,
    }

    const [products, total, categories, brands] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.product.count({ where }),
      db.product.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: true,
      }),
      db.product.groupBy({
        by: ['brand'],
        where: { isActive: true, brand: { not: null } },
        _count: true,
      }),
    ])

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        categories: categories.map((c) => ({
          value: c.category,
          label: c.category,
          count: c._count,
        })),
        brands: brands.map((b) => ({
          value: b.brand || '',
          label: b.brand || '',
          count: b._count,
        })),
      },
    }
  } catch (error) {
    console.error('Error fetching initial products:', error)
    return {
      products: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      },
      filters: {
        categories: [],
        brands: [],
      },
    }
  }
}

export default async function SparepartPage() {
  // Fetch data on server - this runs at build time + revalidates every 60s
  const initialData = await getInitialProducts()

  return <SparepartClientPage initialData={initialData} />
}
