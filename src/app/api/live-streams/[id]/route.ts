import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import {
  getActiveDealForStream,
  getActiveDealsForStream,
} from '@/lib/live-deals'

// GET /api/live-streams/[id] — Get single live stream detail with featured products
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const stream = await prisma.liveStream.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
            slug: true,
            logo: true,
            city: true,
            whatsapp: true,
          },
        },
        host: {
          select: { id: true, name: true, image: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    })

    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Live stream tidak ditemukan' },
        { status: 404 }
      )
    }

    // Resolve featured products
    let featuredProducts: any[] = []
    if (stream.featuredProductIds && stream.featuredProductIds.length > 0) {
      featuredProducts = await prisma.product.findMany({
        where: { id: { in: stream.featuredProductIds }, isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          images: true,
          brand: true,
          stock: true,
          rating: true,
          warrantyDays: true,
        },
      })
    }

    const activeDeals = getActiveDealsForStream(id)
    const activeDeal = getActiveDealForStream(id)

    const enrichedFeaturedProducts = featuredProducts.map((p) => {
      const dealForProd = activeDeals.find((d) => d.productId === p.id)
      if (dealForProd) {
        return {
          ...p,
          liveDeal: {
            dealToken: dealForProd.dealToken,
            discountPrice: dealForProd.discountPrice,
            originalPrice: dealForProd.originalPrice,
          },
        }
      }
      return p
    })

    return NextResponse.json({
      success: true,
      data: {
        ...stream,
        featuredProducts: enrichedFeaturedProducts,
        activeDeal,
        activeDeals,
      },
    })
  } catch (error) {
    console.error('Error fetching live stream:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat live stream' },
      { status: 500 }
    )
  }
}

// PATCH /api/live-streams/[id] — Update stream (status, featured products, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    const {
      status,
      featuredProductIds,
      title,
      description,
      coverImage,
      streamUrl,
    } = body

    const stream = await prisma.liveStream.findUnique({ where: { id } })
    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Stream tidak ditemukan' },
        { status: 404 }
      )
    }

    // STORE_ADMIN can only edit their own store's stream
    if (role === 'STORE_ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { storeId: true },
      })
      if (stream.storeId !== user?.storeId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (streamUrl !== undefined) updateData.streamUrl = streamUrl
    if (featuredProductIds !== undefined)
      updateData.featuredProductIds = featuredProductIds

    if (status === 'LIVE') {
      updateData.status = 'LIVE'
      if (!stream.startedAt) updateData.startedAt = new Date()
    } else if (status === 'ENDED') {
      updateData.status = 'ENDED'
      updateData.endedAt = new Date()

      // Gracefully clean up LiveKit cloud room
      const roomName = stream.livekitRoomName || `ag-live-${stream.id}`
      try {
        const { getLiveKitRoomService } = await import('@/lib/livekit')
        const roomService = getLiveKitRoomService()
        await roomService.deleteRoom(roomName)
      } catch {
        // Room might have already ended or closed
      }
    } else if (status === 'SCHEDULED') {
      updateData.status = 'SCHEDULED'
    } else if (status !== undefined) {
      updateData.status = status
    }

    const updated = await prisma.liveStream.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating live stream:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal update stream' },
      { status: 500 }
    )
  }
}

// DELETE /api/live-streams/[id] — Delete a stream
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    await prisma.liveStream.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal hapus stream' },
      { status: 500 }
    )
  }
}
