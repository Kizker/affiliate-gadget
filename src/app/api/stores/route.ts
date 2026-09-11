import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city') || ''
    const scoped = searchParams.get('scoped') === 'true'

    const where: any = {
      isActive: true,
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    // If scoped=true and request is from a STORE_ADMIN, restrict to their store only
    if (scoped) {
      const session = await auth()
      if (session?.user?.role === 'STORE_ADMIN') {
        let storeId = session.user.storeId
        if (!storeId && session.user.id) {
          const u = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { storeId: true },
          })
          storeId = u?.storeId || null
        }
        if (storeId) {
          where.id = storeId
        }
      }
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
      orderBy: [{ isOwnerStore: 'desc' }, { rating: 'desc' }],
    })

    const headers: Record<string, string> = scoped
      ? { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      : { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }

    return NextResponse.json(
      {
        success: true,
        data: stores,
      },
      { headers }
    )
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar toko afiliasi' },
      { status: 500 }
    )
  }
}
