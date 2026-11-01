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

    const { id } = await params
    const voucher = await (prisma.voucher as any).findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
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

    // Scoping check for Store Admin
    if (isStoreAdmin && (voucher as any).storeId !== session.user.storeId) {
      return NextResponse.json(
        { error: 'Akses ditolak. Voucher ini milik cabang lain.' },
        { status: 403 }
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

    const { id } = await params
    const existing = await (prisma.voucher as any).findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Voucher tidak ditemukan' },
        { status: 404 }
      )
    }

    // Scoping check for Store Admin
    if (isStoreAdmin && (existing as any).storeId !== session.user.storeId) {
      return NextResponse.json(
        { error: 'Akses ditolak. Anda tidak berhak mengubah voucher ini.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      description,
      discountType,
      discountPercent,
      discountAmount,
      maxDiscountAmount,
      minimumPurchase,
      totalQuota,
      usagePerUser,
      validFrom,
      validUntil,
      applicableOrderType,
      isActive,
      storeId,
    } = body

    const updateData: Record<string, unknown> = {}

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive)
    }

    const currentType =
      discountType !== undefined ? discountType : (existing as any).discountType

    if (discountType !== undefined) {
      updateData.discountType =
        discountType === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENTAGE'
    }

    if (currentType === 'FIXED_AMOUNT') {
      if (discountAmount !== undefined) {
        const parsedAmount = parseFloat(String(discountAmount))
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          return NextResponse.json(
            { error: 'Nominal potongan diskon harus lebih besar dari Rp 0' },
            { status: 400 }
          )
        }
        updateData.discountAmount = parsedAmount
      }
      updateData.discountPercent = 0
    } else {
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
      updateData.discountAmount = null
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
      if (parsedQuota < (existing as any).usedCount) {
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

    // Super Admin can reassign storeId, Store Admin cannot
    if (isSuperAdmin && storeId !== undefined) {
      updateData.storeId = storeId === 'GLOBAL' ? null : storeId || null
    }

    let start = (existing as any).validFrom
    let end = (existing as any).validUntil

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

    const updated = await (prisma.voucher as any).update({
      where: { id },
      data: updateData,
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

    // Scoping check for Store Admin
    if (isStoreAdmin && (voucher as any).storeId !== session.user.storeId) {
      return NextResponse.json(
        { error: 'Akses ditolak. Anda tidak berhak menghapus voucher ini.' },
        { status: 403 }
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
