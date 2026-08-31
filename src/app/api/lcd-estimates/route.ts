import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand') || ''

    const where: any = {
      isActive: true,
    }

    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' }
    }

    const estimates = await prisma.lcdEstimate.findMany({
      where,
      orderBy: [
        { brand: 'asc' },
        { modelName: 'asc' },
      ],
    })

    return NextResponse.json(
      {
        success: true,
        data: estimates,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching LCD estimates:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat daftar estimasi servis LCD' }, { status: 500 })
  }
}
