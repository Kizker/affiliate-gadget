import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const streams = await prisma.liveStream.findMany({
      include: {
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
            slug: true,
            logo: true,
            city: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [
        { status: 'asc' }, // LIVE first
        { startedAt: 'desc' },
      ],
    })

    return NextResponse.json(
      {
        success: true,
        data: streams,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching live streams:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat jadwal live streaming' }, { status: 500 })
  }
}
