import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail! },
      select: {
        id: true,
        role: true,
        mitraStatus: true,
        storeId: true,
        isActive: true,
        storeApplication: {
          select: {
            id: true,
            storeName: true,
            companyName: true,
            rejectionReason: true,
            submittedAt: true,
            updatedAt: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        userId: user.id,
        role: user.role,
        mitraStatus: user.mitraStatus,
        storeId: user.storeId,
        isActive: user.isActive,
        rejectionReason: user.storeApplication?.rejectionReason || null,
        hasStoreApplication: !!user.storeApplication,
        applicationDetails: user.storeApplication,
      },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('[Mitra Status API Error]', error)
    return NextResponse.json(
      { error: 'Gagal mengambil status mitra terbaru.' },
      { status: 500 }
    )
  }
}
