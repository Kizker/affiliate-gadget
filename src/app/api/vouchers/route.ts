import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { calculateVoucherDiscountAmount } from '@/lib/constants/voucher'

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

    const now = new Date()

    // Find all active vouchers whose expiration date hasn't passed
    const vouchers = await prisma.voucher.findMany({
      where: {
        isActive: true,
        validUntil: { gte: now },
      },
      orderBy: [{ minimumPurchase: 'asc' }, { discountPercent: 'desc' }],
    })

    // If user is authenticated, query their usage per voucher
    const userUsageMap = new Map<string, number>()
    if (session?.user?.id) {
      const userUsages = await prisma.voucherUsage.groupBy({
        by: ['voucherId'],
        where: {
          userId: session.user.id,
          voucherId: { in: vouchers.map((v) => v.id) },
        },
        _count: {
          id: true,
        },
      })
      userUsages.forEach((u) => {
        userUsageMap.set(u.voucherId, u._count.id)
      })
    }

    const processedVouchers = vouchers.map((v) => {
      const userUsageCount = userUsageMap.get(v.id) || 0
      const isStarted = now >= v.validFrom
      const isQuotaAvailable = v.usedCount < v.totalQuota
      const isUserEligible = userUsageCount < v.usagePerUser
      const isTypeEligible = v.applicableOrderType === orderType
      const isSubtotalEligible = subtotal >= v.minimumPurchase

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
      } else if (!isSubtotalEligible) {
        isValid = false
        const deficit = v.minimumPurchase - subtotal
        reason = `Kurang Rp ${deficit.toLocaleString('id-ID')} (Min. belanja Rp ${v.minimumPurchase.toLocaleString('id-ID')})`
      }

      const potentialDiscount = isValid
        ? calculateVoucherDiscountAmount(
            subtotal,
            v.discountPercent,
            v.maxDiscountAmount
          )
        : calculateVoucherDiscountAmount(
            v.minimumPurchase,
            v.discountPercent,
            v.maxDiscountAmount
          )

      return {
        id: v.id,
        code: v.code,
        description: v.description,
        discountPercent: v.discountPercent,
        maxDiscountAmount: v.maxDiscountAmount,
        minimumPurchase: v.minimumPurchase,
        totalQuota: v.totalQuota,
        usedCount: v.usedCount,
        usagePerUser: v.usagePerUser,
        userUsageCount,
        remainingUserQuota: Math.max(0, v.usagePerUser - userUsageCount),
        validFrom: v.validFrom.toISOString(),
        validUntil: v.validUntil.toISOString(),
        isValid,
        reason,
        shortfallAmount: !isSubtotalEligible ? v.minimumPurchase - subtotal : 0,
        potentialDiscount,
      }
    })

    // Sort: valid vouchers first (by highest potential discount), then invalid vouchers
    processedVouchers.sort((a, b) => {
      if (a.isValid && !b.isValid) return -1
      if (!a.isValid && b.isValid) return 1
      if (a.isValid && b.isValid)
        return b.potentialDiscount - a.potentialDiscount
      return a.minimumPurchase - b.minimumPurchase
    })

    return NextResponse.json({
      success: true,
      vouchers: processedVouchers,
      totalAvailable: processedVouchers.filter((v) => v.isValid).length,
    })
  } catch (error) {
    console.error('Error fetching vouchers list:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar voucher' },
      { status: 500 }
    )
  }
}
