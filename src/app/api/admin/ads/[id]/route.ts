import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { AdPlacement, AdStatus } from '@prisma/client'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const ad = await prisma.internalAd.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            logo: true,
            banner: true,
          },
        },
      },
    })

    if (!ad) {
      return NextResponse.json(
        { success: false, message: 'Iklan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...ad,
        imageUrl: ad.bannerUrl,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil detail iklan',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = session.user
    if (!['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.internalAd.findUnique({
      where: { id },
      include: { store: true },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Iklan tidak ditemukan' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const updateData: any = {}

    if (role === 'STORE_ADMIN') {
      let storeId = (session.user as any).storeId
      if (!storeId) {
        const userStore = await prisma.store.findFirst({
          where: { users: { some: { id: session.user.id } } },
          select: { id: true },
        })
        storeId = userStore?.id
      }

      if (existing.storeId !== storeId) {
        return NextResponse.json(
          {
            success: false,
            message: 'Anda tidak memiliki hak akses atas iklan ini',
          },
          { status: 403 }
        )
      }

      // Store Admin can toggle isActive
      if (body.isActive !== undefined) {
        updateData.isActive = Boolean(body.isActive)
      }

      // Store Admin can always replace banner image, title, or targetUrl
      if (body.imageUrl || body.bannerUrl) {
        updateData.bannerUrl = (body.imageUrl || body.bannerUrl).trim()
      }
      if (body.title) updateData.title = body.title.trim()
      if (body.targetUrl) updateData.targetUrl = body.targetUrl.trim()
      if (body.subtitle) updateData.subtitle = body.subtitle.trim()

      if (existing.status === 'PENDING') {
        if (body.placement) updateData.placement = body.placement as AdPlacement
      }
    } else {
      // Super Admin or Platform Admin permissions
      if (body.status !== undefined) {
        updateData.status = body.status as AdStatus
        if (body.status === 'APPROVED') {
          updateData.rejectionReason = null
        } else if (body.status === 'REJECTED') {
          updateData.rejectionReason =
            body.rejectionReason?.trim() || 'Ditolak oleh admin platform'
        }
      }

      if (body.rejectionReason !== undefined) {
        updateData.rejectionReason = body.rejectionReason?.trim() || null
      }

      if (body.priority !== undefined) {
        updateData.priority = parseInt(body.priority, 10) || 0
      }

      if (body.isActive !== undefined) {
        updateData.isActive = Boolean(body.isActive)
      }

      if (body.title) updateData.title = body.title.trim()
      if (body.imageUrl || body.bannerUrl)
        updateData.bannerUrl = (body.imageUrl || body.bannerUrl).trim()
      if (body.targetUrl) updateData.targetUrl = body.targetUrl.trim()
      if (body.placement) updateData.placement = body.placement as AdPlacement
      if (body.startDate) updateData.startDate = new Date(body.startDate)
      if (body.endDate) updateData.endDate = new Date(body.endDate)
    }

    const updated = await prisma.internalAd.update({
      where: { id },
      data: updateData,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Iklan berhasil diperbarui',
      data: {
        ...updated,
        imageUrl: updated.bannerUrl,
      },
    })
  } catch (error: any) {
    console.error('Error updating internal ad:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal memperbarui status iklan',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = session.user
    if (!['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.internalAd.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Iklan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (role === 'STORE_ADMIN') {
      let storeId = (session.user as any).storeId
      if (!storeId) {
        const userStore = await prisma.store.findFirst({
          where: { users: { some: { id: session.user.id } } },
          select: { id: true },
        })
        storeId = userStore?.id
      }

      if (existing.storeId !== storeId) {
        return NextResponse.json(
          {
            success: false,
            message: 'Anda tidak memiliki hak akses atas iklan ini',
          },
          { status: 403 }
        )
      }
    }

    await prisma.internalAd.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Iklan berhasil dihapus',
    })
  } catch (error: any) {
    console.error('Error deleting internal ad:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menghapus iklan',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
