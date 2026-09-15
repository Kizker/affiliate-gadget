import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { CartItemType, Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Strictly SUPER_ADMIN only
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Khusus Super Admin.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const status = searchParams.get('status') || 'ALL' // ALL, ACTIVE, INACTIVE

    const where: Prisma.VoucherWhereInput = {}

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

    const vouchers = await prisma.voucher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    })

    const formattedVouchers = vouchers.map((v) => ({
      ...v,
      remainingQuota: Math.max(0, v.totalQuota - v.usedCount),
    }))

    return NextResponse.json({
      success: true,
      vouchers: formattedVouchers,
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

    // Strictly SUPER_ADMIN only
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Khusus Super Admin.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      code,
      description,
      discountPercent,
      maxDiscountAmount,
      minimumPurchase = 0,
      totalQuota,
      usagePerUser = 1,
      validFrom,
      validUntil,
      applicableOrderType = 'PRODUCT',
      isActive = true,
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

    const parsedPercent = parseFloat(String(discountPercent))
    if (isNaN(parsedPercent) || parsedPercent <= 0 || parsedPercent > 99) {
      return NextResponse.json(
        { error: 'Persentase diskon harus bernilai 1-99%' },
        { status: 400 }
      )
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

    const newVoucher = await prisma.voucher.create({
      data: {
        code: cleanCode,
        description: description?.trim() || null,
        discountPercent: parsedPercent,
        maxDiscountAmount: parsedMaxDiscount,
        minimumPurchase: parsedMinPurchase,
        totalQuota: parsedTotalQuota,
        usagePerUser: parsedUsagePerUser,
        applicableOrderType: (applicableOrderType as CartItemType) || 'PRODUCT',
        isActive: Boolean(isActive),
        validFrom: startDate,
        validUntil: endDate,
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
