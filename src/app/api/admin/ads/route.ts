import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { AdPlacement, AdStatus } from '@/types/ads'
import {
  getActiveLevel1Ad,
  validateLevel1Exclusivity,
} from '@/lib/ads-exclusivity'

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

    // Compute stats for current context and check active Level 1 ad
    const baseWhere: any = effectiveStoreId ? { storeId: effectiveStoreId } : {}
    const [
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      activeLevel1,
    ] = await Promise.all([
      prisma.internalAd.count({ where: baseWhere }),
      prisma.internalAd.count({
        where: { ...baseWhere, status: 'PENDING' } as any,
      }),
      prisma.internalAd.count({
        where: { ...baseWhere, status: 'APPROVED' } as any,
      }),
      prisma.internalAd.count({
        where: { ...baseWhere, status: 'REJECTED' } as any,
      }),
      getActiveLevel1Ad(),
    ])

    const formattedAds = ads.map((a) => ({
      ...a,
      imageUrl: a.bannerUrl,
      isExclusiveLevel1Active:
        a.placement === 'HOMEPAGE_HERO' &&
        a.status === 'APPROVED' &&
        a.isActive &&
        activeLevel1?.id === a.id,
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
      level1Slot: activeLevel1
        ? {
            isOccupied: true,
            activeAd: activeLevel1,
          }
        : {
            isOccupied: false,
            activeAd: null,
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
      productId,
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

    // Auto-resolve target URL if not provided
    let finalTargetUrl = targetUrl?.trim()
    if (!finalTargetUrl) {
      if (productId?.trim()) {
        finalTargetUrl = `/gadget/${productId.trim()}`
      } else if (finalStoreId) {
        const storeObj = await prisma.store.findUnique({
          where: { id: finalStoreId },
          select: { slug: true },
        })
        if (storeObj?.slug) {
          finalTargetUrl = `/toko/${storeObj.slug}`
        }
      }
    }
    if (!finalTargetUrl) {
      finalTargetUrl = '/gadget'
    }

    const isSuperAdmin = role === 'SUPER_ADMIN'
    const initialStatus: AdStatus = isSuperAdmin
      ? (body.status as AdStatus) || 'APPROVED'
      : 'PENDING'
    const initialIsActive = isSuperAdmin
      ? body.isActive !== undefined
        ? Boolean(body.isActive)
        : true
      : false

    // Exclusivity rule: Level 1 (HOMEPAGE_HERO) is exclusive to 1 active ad at a time
    if (
      placement === 'HOMEPAGE_HERO' &&
      initialStatus === 'APPROVED' &&
      initialIsActive
    ) {
      const exclusivityCheck = await validateLevel1Exclusivity()
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

    const resolvedStartDate = startDate ? new Date(startDate) : new Date()
    let resolvedEndDate: Date | null = endDate ? new Date(endDate) : null

    if (!resolvedEndDate && body.durationDays) {
      const days = parseInt(body.durationDays, 10) || 7
      resolvedEndDate = new Date(
        resolvedStartDate.getTime() + days * 24 * 60 * 60 * 1000
      )
    }

    const resolvedSubtitle = body.subtitle?.trim() || null

    const calculatedPriority =
      typeof priority === 'number'
        ? priority
        : body.targetImpressions
          ? Math.min(
              10,
              Math.max(1, Math.round(Number(body.targetImpressions) / 1000))
            )
          : 5

    const newAd = await prisma.internalAd.create({
      data: {
        title: title.trim(),
        subtitle: resolvedSubtitle,
        placement: placement as AdPlacement,
        bannerUrl: finalBannerUrl,
        targetUrl: finalTargetUrl,
        productId: productId?.trim() || null,
        storeId: finalStoreId,
        status: initialStatus,
        priority: calculatedPriority,
        startDate: resolvedStartDate,
        endDate: resolvedEndDate,
        isActive: initialIsActive,
      } as any,
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
