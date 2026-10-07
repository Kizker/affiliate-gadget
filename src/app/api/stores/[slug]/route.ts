import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
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
      return NextResponse.json(
        { success: false, error: 'Toko tidak ditemukan' },
        { status: 404 }
      )
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
          'Raw visual fields query warning in store public route:',
          rawErr
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: store,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching store by slug:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat profil toko' },
      { status: 500 }
    )
  }
}
