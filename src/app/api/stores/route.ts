import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city') || ''

    const where: any = {
      isActive: true,
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    const stores = await prisma.store.findMany({
      where,
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
      orderBy: [
        { isOwnerStore: 'desc' },
        { rating: 'desc' },
      ],
    })

    return NextResponse.json(
      {
        success: true,
        data: stores,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat daftar toko afiliasi' }, { status: 500 })
  }
}
