import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { AdPlacement, AdStatus } from '@/types/ads'
import { validateLevel1Exclusivity } from '@/lib/ads-exclusivity'

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
    const existing: any = await prisma.internalAd.findUnique({
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

    // Security Gate: Hanya SUPER_ADMIN yang berhak mengaktifkan/menonaktifkan atau menyetujui iklan
    if (role !== 'SUPER_ADMIN') {
      if (body.isActive !== undefined) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Hanya Super Admin yang berhak mengaktifkan atau menonaktifkan iklan',
          },
          { status: 403 }
        )
      }
      if (body.status === 'APPROVED') {
        return NextResponse.json(
          {
            success: false,
            message:
              'Hanya Super Admin yang berhak menyetujui dan mengaktifkan iklan',
          },
          { status: 403 }
        )
      }
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

      // Pembatalan pengajuan oleh Admin Toko
      if (body.action === 'cancel' || body.status === 'REJECTED') {
        if (existing.status !== 'PENDING') {
          return NextResponse.json(
            {
              success: false,
              message:
                'Hanya pengajuan berstatus menunggu persetujuan yang dapat dibatalkan',
            },
            { status: 400 }
          )
        }
        updateData.status = 'REJECTED'
        updateData.isActive = false
        updateData.rejectionReason = 'Dibatalkan oleh Admin Toko'
      } else {
        // Admin Toko mengubah foto/video atau detail iklan:
        // Setiap perubahan oleh admin toko WAJIB disetujui ulang oleh Superadmin.
        // Status otomatis diatur ulang ke PENDING, nonaktif, dan hapus alasan penolakan lama.
        updateData.status = 'PENDING'
        updateData.isActive = false
        updateData.rejectionReason = null

        if (body.imageUrl || body.bannerUrl) {
          updateData.bannerUrl = (body.imageUrl || body.bannerUrl).trim()
        }
        if (body.title) updateData.title = body.title.trim()
        if (body.targetUrl) updateData.targetUrl = body.targetUrl.trim()
        if (body.subtitle !== undefined)
          updateData.subtitle = body.subtitle ? body.subtitle.trim() : null
        if (body.productId !== undefined)
          updateData.productId = body.productId ? body.productId.trim() : null
        if (body.placement) updateData.placement = body.placement as AdPlacement
      }
    } else {
      // Super Admin permissions
      if (body.status !== undefined) {
        updateData.status = body.status as AdStatus
        if (body.status === 'APPROVED') {
          updateData.rejectionReason = null
          updateData.isActive = true
          // Boost priority for approved ad if priority was 0 and not explicitly provided
          if (existing.priority === 0 && body.priority === undefined) {
            updateData.priority = 5
          }
        } else if (body.status === 'REJECTED') {
          updateData.isActive = false
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
      if (body.productId !== undefined)
        updateData.productId = body.productId ? body.productId.trim() : null
      if (body.subtitle !== undefined)
        updateData.subtitle = body.subtitle ? body.subtitle.trim() : null
      if (body.placement) updateData.placement = body.placement as AdPlacement
      if (body.startDate) updateData.startDate = new Date(body.startDate)
      if (body.endDate) updateData.endDate = new Date(body.endDate)
    }

    // Exclusivity rule: Level 1 (HOMEPAGE_HERO) is exclusive to 1 active ad at a time
    const effectivePlacement = updateData.placement || existing.placement
    const effectiveStatus = updateData.status || existing.status
    const effectiveIsActive =
      updateData.isActive !== undefined
        ? updateData.isActive
        : existing.isActive

    if (
      effectivePlacement === 'HOMEPAGE_HERO' &&
      effectiveStatus === 'APPROVED' &&
      effectiveIsActive
    ) {
      const exclusivityCheck = await validateLevel1Exclusivity(id)
      if (!exclusivityCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            message: exclusivityCheck.message,
            currentActive: exclusivityCheck.currentActive,
          },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.internalAd.update({
      where: { id },
      data: updateData as any,
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

    const successMessage =
      role === 'STORE_ADMIN'
        ? 'Perubahan media iklan berhasil disimpan dan diajukan ke Superadmin untuk persetujuan'
        : 'Iklan berhasil diperbarui'

    return NextResponse.json({
      success: true,
      message: successMessage,
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
