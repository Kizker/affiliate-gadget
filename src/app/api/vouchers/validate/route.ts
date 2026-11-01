import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { calculateVoucherDiscountAmount } from '@/lib/constants/voucher'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Silakan login terlebih dahulu untuk menggunakan voucher',
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { code, subtotal = 0, orderType = 'PRODUCT', storeId } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, reason: 'Kode voucher tidak boleh kosong' },
        { status: 400 }
      )
    }

    const cleanCode = code.trim().toUpperCase()
    const parsedSubtotal = Math.max(0, parseFloat(String(subtotal)) || 0)

    const voucher = await (prisma.voucher as any).findUnique({
      where: { code: cleanCode },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!voucher) {
      return NextResponse.json({
        valid: false,
        reason: `Kode voucher "${cleanCode}" tidak ditemukan atau salah. Pastikan penulisan kode sudah benar tanpa salah karakter.`,
      })
    }

    if (!voucher.isActive) {
      return NextResponse.json({
        valid: false,
        reason: `Voucher "${voucher.code}" saat ini sedang tidak aktif atau dinonaktifkan oleh platform.`,
      })
    }

    const now = new Date()
    if (now < voucher.validFrom) {
      const formattedDate = voucher.validFrom.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      return NextResponse.json({
        valid: false,
        reason: `Voucher "${voucher.code}" baru dapat digunakan mulai tanggal ${formattedDate}.`,
      })
    }

    if (now > voucher.validUntil) {
      const formattedDate = voucher.validUntil.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      return NextResponse.json({
        valid: false,
        reason: `Masa berlaku voucher "${voucher.code}" telah berakhir pada ${formattedDate}.`,
      })
    }

    if (voucher.usedCount >= voucher.totalQuota) {
      return NextResponse.json({
        valid: false,
        reason: `Kuota penukaran voucher "${voucher.code}" telah habis (${voucher.usedCount}/${voucher.totalQuota} terpakai).`,
      })
    }

    if (voucher.applicableOrderType !== orderType) {
      return NextResponse.json({
        valid: false,
        reason: `Voucher "${voucher.code}" hanya berlaku untuk pesanan produk fisik.`,
      })
    }

    // Store Scoping Check
    if (
      (voucher as any).storeId &&
      storeId &&
      (voucher as any).storeId !== storeId
    ) {
      return NextResponse.json({
        valid: false,
        reason: `Voucher "${voucher.code}" hanya berlaku untuk produk dari ${(voucher as any).store?.name || 'toko cabang terkait'}.`,
      })
    }

    if (parsedSubtotal < voucher.minimumPurchase) {
      return NextResponse.json({
        valid: false,
        reason: `Belanja Rp ${(voucher.minimumPurchase - parsedSubtotal).toLocaleString('id-ID')} lagi untuk menggunakan voucher "${voucher.code}" (Min. belanja Rp ${voucher.minimumPurchase.toLocaleString('id-ID')}).`,
      })
    }

    // Check usage per user
    const userUsageCount = await prisma.voucherUsage.count({
      where: {
        voucherId: voucher.id,
        userId: session.user.id,
      },
    })

    if (userUsageCount >= voucher.usagePerUser) {
      return NextResponse.json({
        valid: false,
        reason: `Anda telah mencapai batas maksimal (${voucher.usagePerUser}x) pemakaian untuk voucher "${voucher.code}".`,
      })
    }

    const discountAmount = calculateVoucherDiscountAmount(
      parsedSubtotal,
      voucher.discountPercent,
      voucher.maxDiscountAmount,
      (voucher as any).discountType || 'PERCENTAGE',
      voucher.discountAmount
    )

    return NextResponse.json({
      valid: true,
      voucherId: voucher.id,
      voucherCode: voucher.code,
      discountType: (voucher as any).discountType || 'PERCENTAGE',
      discountPercent: voucher.discountPercent,
      discountAmount,
      maxDiscountAmount: voucher.maxDiscountAmount,
      minimumPurchase: voucher.minimumPurchase,
      description: voucher.description,
      storeId: (voucher as any).storeId,
      storeName: (voucher as any).store?.name || null,
      isGlobal: !(voucher as any).storeId,
    })
  } catch (error) {
    console.error('Error validating voucher:', error)
    return NextResponse.json(
      {
        valid: false,
        reason: 'Terjadi kesalahan sistem saat memverifikasi voucher.',
      },
      { status: 500 }
    )
  }
}
