import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { CartItemType, Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role
    const isSuperAdmin = role === 'SUPER_ADMIN'
    const isStoreAdmin = role === 'STORE_ADMIN' || role === 'STORE_SALES'

    if (!isSuperAdmin && !isStoreAdmin) {
      return NextResponse.json(
        { error: 'Akses ditolak. Khusus Admin.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const status = searchParams.get('status') || 'ALL' // ALL, ACTIVE, INACTIVE
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
    const limit = Math.max(
      1,
      Math.min(100, parseInt(limitParam || '10', 10) || 10)
    )
    const skip = (page - 1) * limit

    const where: any = {}

    // Store Admin scoping: only see vouchers of their store
    if (isStoreAdmin) {
      if (!session.user.storeId) {
        return NextResponse.json({
          success: true,
          vouchers: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 1,
          },
          stats: {
            total: 0,
            active: 0,
            totalUsages: 0,
          },
        })
      }
      where.storeId = session.user.storeId
    } else if (searchParams.get('storeId')) {
      const filterStoreId = searchParams.get('storeId')
      if (filterStoreId === 'GLOBAL') {
        where.storeId = null
      } else if (filterStoreId) {
        where.storeId = filterStoreId
      }
    }

    if (status === 'ACTIVE') {
      where.isActive = true
    } else if (status === 'INACTIVE') {
      where.isActive = false
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Scoping for overall store stats (so KPI cards show total counts regardless of pagination)
    const baseStatsWhere: any = isStoreAdmin
      ? { storeId: session.user.storeId }
      : searchParams.get('storeId') === 'GLOBAL'
        ? { storeId: null }
        : searchParams.get('storeId')
          ? { storeId: searchParams.get('storeId') }
          : {}

    const [total, totalStatsCount, activeStatsCount, totalUsagesAgg, vouchers] =
      await Promise.all([
        (prisma.voucher as any).count({ where }),
        (prisma.voucher as any).count({ where: baseStatsWhere }),
        (prisma.voucher as any).count({
          where: { ...baseStatsWhere, isActive: true },
        }),
        (prisma.voucher as any).aggregate({
          where: baseStatsWhere,
          _sum: { usedCount: true },
        }),
        (prisma.voucher as any).findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            store: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: { usages: true },
            },
          },
        }),
      ])

    const totalPages = Math.max(1, Math.ceil(total / limit))
    const stats = {
      total: totalStatsCount,
      active: activeStatsCount,
      totalUsages: totalUsagesAgg._sum.usedCount || 0,
    }

    const formattedVouchers = vouchers.map((v: any) => ({
      ...v,
      remainingQuota: Math.max(0, v.totalQuota - v.usedCount),
    }))

    return NextResponse.json({
      success: true,
      vouchers: formattedVouchers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats,
    })
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json(
      { error: 'Gagal memuat data voucher' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role
    const isSuperAdmin = role === 'SUPER_ADMIN'
    const isStoreAdmin = role === 'STORE_ADMIN' || role === 'STORE_SALES'

    if (!isSuperAdmin && !isStoreAdmin) {
      return NextResponse.json(
        { error: 'Akses ditolak. Khusus Admin.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      code,
      description,
      discountType = 'PERCENTAGE', // PERCENTAGE | FIXED_AMOUNT
      discountPercent = 0,
      discountAmount,
      maxDiscountAmount,
      minimumPurchase = 0,
      totalQuota,
      usagePerUser = 1,
      validFrom,
      validUntil,
      applicableOrderType = 'PRODUCT',
      isActive = true,
      storeId,
    } = body

    // Validation
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Kode voucher wajib diisi' },
        { status: 400 }
      )
    }

    const cleanCode = code.trim().toUpperCase()
    if (!/^[A-Z0-9_-]{3,20}$/.test(cleanCode)) {
      return NextResponse.json(
        {
          error:
            'Kode voucher harus 3-20 karakter huruf kapital/angka tanpa spasi.',
        },
        { status: 400 }
      )
    }

    let parsedPercent = 0
    let parsedDiscountAmount: number | null = null

    if (discountType === 'FIXED_AMOUNT') {
      parsedDiscountAmount = parseFloat(String(discountAmount))
      if (isNaN(parsedDiscountAmount) || parsedDiscountAmount <= 0) {
        return NextResponse.json(
          { error: 'Nominal potongan diskon harus lebih besar dari Rp 0' },
          { status: 400 }
        )
      }
    } else {
      parsedPercent = parseFloat(String(discountPercent))
      if (isNaN(parsedPercent) || parsedPercent <= 0 || parsedPercent > 99) {
        return NextResponse.json(
          { error: 'Persentase diskon harus bernilai 1-99%' },
          { status: 400 }
        )
      }
    }

    const parsedTotalQuota = parseInt(String(totalQuota), 10)
    if (isNaN(parsedTotalQuota) || parsedTotalQuota < 1) {
      return NextResponse.json(
        { error: 'Total kuota voucher minimal 1' },
        { status: 400 }
      )
    }

    const parsedUsagePerUser = parseInt(String(usagePerUser), 10)
    if (isNaN(parsedUsagePerUser) || parsedUsagePerUser < 1) {
      return NextResponse.json(
        { error: 'Batas pemakaian per user minimal 1' },
        { status: 400 }
      )
    }

    const parsedMinPurchase = Math.max(
      0,
      parseFloat(String(minimumPurchase)) || 0
    )
    const parsedMaxDiscount =
      maxDiscountAmount !== undefined &&
      maxDiscountAmount !== null &&
      maxDiscountAmount !== ''
        ? Math.max(0, parseFloat(String(maxDiscountAmount)) || 0)
        : null

    if (!validFrom || !validUntil) {
      return NextResponse.json(
        { error: 'Tanggal mulai dan berakhir voucher wajib ditentukan' },
        { status: 400 }
      )
    }

    const startDate = new Date(validFrom)
    const endDate = new Date(validUntil)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Format tanggal tidak valid' },
        { status: 400 }
      )
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'Tanggal berakhir harus lebih besar dari tanggal mulai' },
        { status: 400 }
      )
    }

    // Scoping resolution
    let targetStoreId: string | null = null
    if (isStoreAdmin) {
      if (!session.user.storeId) {
        return NextResponse.json(
          { error: 'Akun admin toko tidak terikat dengan toko manapun.' },
          { status: 400 }
        )
      }
      targetStoreId = session.user.storeId
    } else if (isSuperAdmin && storeId) {
      targetStoreId = storeId === 'GLOBAL' ? null : storeId
    }

    // Check duplicate code
    const existing = await prisma.voucher.findUnique({
      where: { code: cleanCode },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Kode voucher "${cleanCode}" sudah pernah digunakan.` },
        { status: 400 }
      )
    }

    const newVoucher = await (prisma.voucher as any).create({
      data: {
        code: cleanCode,
        description: description?.trim() || null,
        discountType:
          discountType === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
        discountPercent: parsedPercent,
        discountAmount: parsedDiscountAmount,
        maxDiscountAmount: parsedMaxDiscount,
        minimumPurchase: parsedMinPurchase,
        totalQuota: parsedTotalQuota,
        usagePerUser: parsedUsagePerUser,
        applicableOrderType: (applicableOrderType as CartItemType) || 'PRODUCT',
        storeId: targetStoreId,
        isActive: Boolean(isActive),
        validFrom: startDate,
        validUntil: endDate,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        voucher: {
          ...newVoucher,
          remainingQuota: newVoucher.totalQuota - newVoucher.usedCount,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating voucher:', error)
    return NextResponse.json(
      { error: 'Gagal membuat voucher baru' },
      { status: 500 }
    )
  }
}
