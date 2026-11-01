import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { calculateVoucherDiscountAmount } from '@/lib/constants/voucher'
import { Prisma } from '@prisma/client'

// GET - List available vouchers for user with validity calculation against subtotal
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const subtotal = Math.max(
      0,
      parseFloat(searchParams.get('subtotal') || '0')
    )
    const orderType = searchParams.get('orderType') || 'PRODUCT'
    const targetStoreId = searchParams.get('storeId') || null

    const now = new Date()

    // Find all active vouchers whose expiration date hasn't passed
    const where: any = {
      isActive: true,
      validUntil: { gte: now },
    }

    // If storeId is specified, fetch platform global vouchers OR vouchers of this store
    if (targetStoreId) {
      where.OR = [{ storeId: null }, { storeId: targetStoreId }]
    }

    const vouchers = await (prisma.voucher as any).findMany({
      where,
      orderBy: [{ minimumPurchase: 'asc' }, { createdAt: 'desc' }],
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

    // If user is authenticated, query their usage per voucher
    const userUsageMap = new Map<string, number>()
    if (session?.user?.id) {
      const userUsages = await prisma.voucherUsage.groupBy({
        by: ['voucherId'],
        where: {
          userId: session.user.id,
          voucherId: { in: vouchers.map((v: any) => v.id) },
        },
        _count: {
          id: true,
        },
      })
      userUsages.forEach((u) => {
        userUsageMap.set(u.voucherId, u._count.id)
      })
    }

    const processedVouchers = vouchers.map((v: any) => {
      const userUsageCount = userUsageMap.get(v.id) || 0
      const isStarted = now >= v.validFrom
      const isQuotaAvailable = v.usedCount < v.totalQuota
      const isUserEligible = userUsageCount < v.usagePerUser
      const isTypeEligible = v.applicableOrderType === orderType
      const isSubtotalEligible = subtotal >= v.minimumPurchase
      const isStoreMatched =
        !(v as any).storeId ||
        !targetStoreId ||
        (v as any).storeId === targetStoreId

      let isValid = true
      let reason: string | null = null

      if (!isStarted) {
        isValid = false
        const formattedDate = v.validFrom.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        reason = `Berlaku mulai ${formattedDate}`
      } else if (!isQuotaAvailable) {
        isValid = false
        reason = 'Kuota voucher telah habis'
      } else if (!isUserEligible) {
        isValid = false
        reason = `Batas pemakaian (${v.usagePerUser}x) sudah tercapai`
      } else if (!isTypeEligible) {
        isValid = false
        reason = `Hanya berlaku untuk tipe ${v.applicableOrderType}`
      } else if (!isStoreMatched) {
        isValid = false
        reason = `Hanya berlaku untuk produk dari ${(v as any).store?.name || 'toko cabang terkait'}`
      } else if (!isSubtotalEligible) {
        isValid = false
        const deficit = v.minimumPurchase - subtotal
        reason = `Belanja Rp ${deficit.toLocaleString('id-ID')} lagi untuk menggunakan voucher ini`
      }

      const potentialDiscount = isValid
        ? calculateVoucherDiscountAmount(
            subtotal,
            v.discountPercent,
            v.maxDiscountAmount,
            (v as any).discountType || 'PERCENTAGE',
            (v as any).discountAmount
          )
        : calculateVoucherDiscountAmount(
            Math.max(subtotal, v.minimumPurchase),
            v.discountPercent,
            v.maxDiscountAmount,
            (v as any).discountType || 'PERCENTAGE',
            (v as any).discountAmount
          )

      return {
        id: v.id,
        code: v.code,
        description: v.description,
        discountType: (v as any).discountType || 'PERCENTAGE',
        discountPercent: v.discountPercent,
        discountAmount: (v as any).discountAmount,
        maxDiscountAmount: v.maxDiscountAmount,
        minimumPurchase: v.minimumPurchase,
        totalQuota: v.totalQuota,
        usedCount: v.usedCount,
        usagePerUser: v.usagePerUser,
        userUsageCount,
        remainingUserQuota: Math.max(0, v.usagePerUser - userUsageCount),
        validFrom: v.validFrom.toISOString(),
        validUntil: v.validUntil.toISOString(),
        storeId: (v as any).storeId,
        storeName: (v as any).store?.name || null,
        storeSlug: (v as any).store?.slug || null,
        isGlobal: !(v as any).storeId,
        isValid,
        reason,
        shortfallAmount: !isSubtotalEligible ? v.minimumPurchase - subtotal : 0,
        potentialDiscount,
      }
    })

    // Sort: valid vouchers first (by highest potential discount), then invalid vouchers
    processedVouchers.sort((a: any, b: any) => {
      if (a.isValid && !b.isValid) return -1
      if (!a.isValid && b.isValid) return 1
      if (a.isValid && b.isValid)
        return b.potentialDiscount - a.potentialDiscount
      return a.minimumPurchase - b.minimumPurchase
    })

    return NextResponse.json({
      success: true,
      vouchers: processedVouchers,
      totalAvailable: processedVouchers.filter((v: any) => v.isValid).length,
    })
  } catch (error) {
    console.error('Error fetching vouchers list:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar voucher' },
      { status: 500 }
    )
  }
}
