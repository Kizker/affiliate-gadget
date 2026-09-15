import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { CartItemType } from '@prisma/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Khusus Super Admin.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        usages: {
          orderBy: { usedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            order: {
              select: {
                id: true,
                orderNumber: true,
                total: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Voucher tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      voucher: {
        ...voucher,
        remainingQuota: Math.max(0, voucher.totalQuota - voucher.usedCount),
      },
    })
  } catch (error) {
    console.error('Error fetching voucher detail:', error)
    return NextResponse.json(
      { error: 'Gagal memuat detail voucher' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Khusus Super Admin.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const existing = await prisma.voucher.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Voucher tidak ditemukan' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      description,
      discountPercent,
      maxDiscountAmount,
      minimumPurchase,
      totalQuota,
      usagePerUser,
      validFrom,
      validUntil,
      applicableOrderType,
      isActive,
    } = body

    const updateData: Record<string, unknown> = {}

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive)
    }

    if (discountPercent !== undefined) {
      const parsedPercent = parseFloat(String(discountPercent))
      if (isNaN(parsedPercent) || parsedPercent <= 0 || parsedPercent > 99) {
        return NextResponse.json(
          { error: 'Persentase diskon harus bernilai 1-99%' },
          { status: 400 }
        )
      }
      updateData.discountPercent = parsedPercent
    }

    if (maxDiscountAmount !== undefined) {
      updateData.maxDiscountAmount =
        maxDiscountAmount !== null && maxDiscountAmount !== ''
          ? Math.max(0, parseFloat(String(maxDiscountAmount)) || 0)
          : null
    }

    if (minimumPurchase !== undefined) {
      updateData.minimumPurchase = Math.max(
        0,
        parseFloat(String(minimumPurchase)) || 0
      )
    }

    if (totalQuota !== undefined) {
      const parsedQuota = parseInt(String(totalQuota), 10)
      if (isNaN(parsedQuota) || parsedQuota < 1) {
        return NextResponse.json(
          { error: 'Total kuota voucher minimal 1' },
          { status: 400 }
        )
      }
      if (parsedQuota < existing.usedCount) {
        return NextResponse.json(
          {
            error: `Total kuota tidak boleh kurang dari jumlah yang sudah terpakai (${existing.usedCount})`,
          },
          { status: 400 }
        )
      }
      updateData.totalQuota = parsedQuota
    }

    if (usagePerUser !== undefined) {
      const parsedUsage = parseInt(String(usagePerUser), 10)
      if (isNaN(parsedUsage) || parsedUsage < 1) {
        return NextResponse.json(
          { error: 'Batas pemakaian per user minimal 1' },
          { status: 400 }
        )
      }
      updateData.usagePerUser = parsedUsage
    }

    if (applicableOrderType !== undefined) {
      updateData.applicableOrderType = applicableOrderType as CartItemType
    }

    let start = existing.validFrom
    let end = existing.validUntil

    if (validFrom !== undefined) {
      const s = new Date(validFrom)
      if (isNaN(s.getTime())) {
        return NextResponse.json(
          { error: 'Format tanggal mulai tidak valid' },
          { status: 400 }
        )
      }
      start = s
      updateData.validFrom = s
    }

    if (validUntil !== undefined) {
      const e = new Date(validUntil)
      if (isNaN(e.getTime())) {
        return NextResponse.json(
          { error: 'Format tanggal berakhir tidak valid' },
          { status: 400 }
        )
      }
      end = e
      updateData.validUntil = e
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'Tanggal berakhir harus lebih besar dari tanggal mulai' },
        { status: 400 }
      )
    }

    const updated = await prisma.voucher.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      voucher: {
        ...updated,
        remainingQuota: Math.max(0, updated.totalQuota - updated.usedCount),
      },
    })
  } catch (error) {
    console.error('Error updating voucher:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui voucher' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Khusus Super Admin.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const voucher = await prisma.voucher.findUnique({
      where: { id },
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Voucher tidak ditemukan' },
        { status: 404 }
      )
    }

    // Soft check: if used, cannot hard delete
    if (voucher.usedCount > 0) {
      return NextResponse.json(
        {
          error:
            'Voucher tidak dapat dihapus karena sudah memiliki riwayat pemakaian. Silakan nonaktifkan voucher ini.',
        },
        { status: 409 }
      )
    }

    await prisma.voucher.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Voucher berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting voucher:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus voucher' },
      { status: 500 }
    )
  }
}
