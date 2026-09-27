import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { AdPlacement, AdStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = session.user
    if (!['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get('status')
    const placementParam = searchParams.get('placement')
    const storeIdParam = searchParams.get('storeId')
    const search = searchParams.get('search')?.trim()

    let effectiveStoreId: string | null | undefined = undefined

    if (role === 'STORE_ADMIN') {
      let storeId = (session.user as any).storeId
      if (!storeId) {
        const userStore = await prisma.store.findFirst({
          where: { users: { some: { id: session.user.id } } },
          select: { id: true },
        })
        storeId = userStore?.id
      }
      if (!storeId) {
        return NextResponse.json(
          { error: 'Toko fisik tidak ditemukan untuk akun ini' },
          { status: 400 }
        )
      }
      effectiveStoreId = storeId
    } else if (storeIdParam && storeIdParam !== 'ALL') {
      effectiveStoreId = storeIdParam
    }

    const where: any = {}

    if (effectiveStoreId) {
      where.storeId = effectiveStoreId
    }

    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam as AdStatus
    }

    if (placementParam && placementParam !== 'ALL') {
      where.placement = placementParam as AdPlacement
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { store: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const ads = await prisma.internalAd.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            city: true,
            companyName: true,
            banner: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    // Compute stats for current context
    const baseWhere = effectiveStoreId ? { storeId: effectiveStoreId } : {}
    const [totalCount, pendingCount, approvedCount, rejectedCount] =
      await Promise.all([
        prisma.internalAd.count({ where: baseWhere }),
        prisma.internalAd.count({
          where: { ...baseWhere, status: 'PENDING' },
        }),
        prisma.internalAd.count({
          where: { ...baseWhere, status: 'APPROVED' },
        }),
        prisma.internalAd.count({
          where: { ...baseWhere, status: 'REJECTED' },
        }),
      ])

    const formattedAds = ads.map((a) => ({
      ...a,
      imageUrl: a.bannerUrl,
    }))

    return NextResponse.json({
      success: true,
      data: formattedAds,
      stats: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    })
  } catch (error: any) {
    console.error('Error fetching admin ads:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal memuat data iklan',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = session.user
    if (!['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      placement,
      imageUrl,
      bannerUrl,
      targetUrl,
      startDate,
      endDate,
      priority,
      storeId: reqStoreId,
    } = body

    const finalBannerUrl = (bannerUrl || imageUrl)?.trim()

    if (!title || !placement || !finalBannerUrl) {
      return NextResponse.json(
        {
          success: false,
          message: 'Judul, penempatan iklan, dan URL gambar banner wajib diisi',
        },
        { status: 400 }
      )
    }

    let finalStoreId: string | null = null

    if (role === 'STORE_ADMIN') {
      let storeId = (session.user as any).storeId
      if (!storeId) {
        const userStore = await prisma.store.findFirst({
          where: { users: { some: { id: session.user.id } } },
          select: { id: true, slug: true },
        })
        storeId = userStore?.id
      }
      if (!storeId) {
        return NextResponse.json(
          { error: 'Toko fisik tidak ditemukan untuk akun ini' },
          { status: 400 }
        )
      }
      finalStoreId = storeId
    } else {
      finalStoreId = reqStoreId || null
    }

    // Auto-resolve store slug for target URL if not provided
    let finalTargetUrl = targetUrl?.trim()
    if (!finalTargetUrl && finalStoreId) {
      const storeObj = await prisma.store.findUnique({
        where: { id: finalStoreId },
        select: { slug: true },
      })
      if (storeObj?.slug) {
        finalTargetUrl = `/toko/${storeObj.slug}`
      }
    }
    if (!finalTargetUrl) {
      finalTargetUrl = '/gadget'
    }

    const initialStatus: AdStatus =
      role === 'SUPER_ADMIN'
        ? (body.status as AdStatus) || 'APPROVED'
        : 'PENDING'

    const resolvedStartDate = startDate ? new Date(startDate) : new Date()
    let resolvedEndDate: Date | null = endDate ? new Date(endDate) : null

    if (!resolvedEndDate && body.durationDays) {
      const days = parseInt(body.durationDays, 10) || 7
      resolvedEndDate = new Date(
        resolvedStartDate.getTime() + days * 24 * 60 * 60 * 1000
      )
    }

    let resolvedSubtitle = body.subtitle?.trim() || null
    if (!resolvedSubtitle) {
      if (placement === 'HOMEPAGE_HERO') {
        const days = body.durationDays || 7
        resolvedSubtitle = `Durasi Tayang: ${days} Hari`
      } else if (placement === 'PROMOTED_LIST') {
        const count = body.targetImpressions || 1000
        const days = body.durationDays || 7
        resolvedSubtitle = `Target: ${Number(count).toLocaleString('id-ID')}x Muncul • ${days} Hari`
      }
    }

    const calculatedPriority =
      typeof priority === 'number'
        ? priority
        : body.targetImpressions
          ? Math.min(
              10,
              Math.max(1, Math.round(Number(body.targetImpressions) / 1000))
            )
          : 0

    const newAd = await prisma.internalAd.create({
      data: {
        title: title.trim(),
        subtitle: resolvedSubtitle,
        placement: placement as AdPlacement,
        bannerUrl: finalBannerUrl,
        targetUrl: finalTargetUrl,
        storeId: finalStoreId,
        status: initialStatus,
        priority: calculatedPriority,
        startDate: resolvedStartDate,
        endDate: resolvedEndDate,
        isActive: true,
      },
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
      message:
        role === 'SUPER_ADMIN'
          ? 'Iklan berhasil dibuat'
          : 'Pengajuan iklan berhasil dikirim ke Superadmin untuk ditinjau',
      data: {
        ...newAd,
        imageUrl: newAd.bannerUrl,
      },
    })
  } catch (error: any) {
    console.error('Error creating internal ad:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal membuat pengajuan iklan',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
