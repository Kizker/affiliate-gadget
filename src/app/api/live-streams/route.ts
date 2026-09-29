import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/live-streams — Get all streams (for public hub and grid banner)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // 'LIVE' | 'SCHEDULED' | 'ENDED' | null (all)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const where: any = {}
    if (status) {
      where.status = status
    } else {
      // Default: exclude very old ended streams
      where.OR = [
        { status: 'LIVE' },
        { status: 'SCHEDULED' },
        {
          status: 'ENDED',
          endedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      ]
    }

    const streams = await prisma.liveStream.findMany({
      where,
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
        host: {
          select: { id: true, name: true, image: true },
        },
        _count: { select: { comments: true } },
      },
      orderBy: [
        { status: 'asc' },
        { startedAt: 'desc' },
        { scheduledAt: 'asc' },
      ],
      take: limit,
    })

    return NextResponse.json(
      { success: true, data: streams },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching live streams:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat live streams' },
      { status: 500 }
    )
  }
}

// POST /api/live-streams — Create new live stream session
export async function POST(req: NextRequest) {
  // Dynamic import to avoid circular deps
  const { auth } = await import('@/auth')
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const role = (session.user as any).role
  if (!['STORE_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const { title, description, coverImage, scheduledAt } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Judul live wajib diisi' },
        { status: 400 }
      )
    }

    let storeId: string | null = null
    const hostId = (session.user as any).id

    if (role === 'STORE_ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: hostId },
        select: { storeId: true },
      })
      storeId = user?.storeId || null
    }

    if (!storeId) {
      const firstStore = await prisma.store.findFirst({ select: { id: true } })
      storeId = firstStore?.id || null
    }

    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const livekitRoomName = `ag-live-${Date.now().toString(36)}-${randomSuffix}`

    const stream = await prisma.liveStream.create({
      data: {
        storeId,
        hostId,
        title: title.trim(),
        description: description?.trim() || null,
        coverImage: coverImage || null,
        streamUrl: '',
        status: 'SCHEDULED',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        featuredProductIds: [],
        livekitRoomName,
      },
      include: {
        store: {
          select: { id: true, name: true, slug: true, logo: true, city: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: stream }, { status: 201 })
  } catch (error) {
    console.error('Error creating live stream:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal membuat live stream' },
      { status: 500 }
    )
  }
}
