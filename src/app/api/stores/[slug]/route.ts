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
      include: {
        bankAccounts: true,
        schedules: true,
        products: {
          where: { isActive: true },
          include: { variants: true },
          orderBy: { createdAt: 'desc' },
        },
        liveStreams: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    })

    if (!store) {
      return NextResponse.json({ success: false, error: 'Toko tidak ditemukan' }, { status: 404 })
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
    return NextResponse.json({ success: false, error: 'Gagal memuat profil toko' }, { status: 500 })
  }
}
