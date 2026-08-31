import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// POST - Set address as default
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { addressId } = await params

    const target = await prisma.userAddress.findFirst({
      where: { id: addressId, userId: session.user.id },
    })

    if (!target) {
      return NextResponse.json({ error: 'Alamat tidak ditemukan' }, { status: 404 })
    }

    // Unset other defaults
    await prisma.userAddress.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    })

    // Set target as default
    const updated = await prisma.userAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    })

    // Sync to user model
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        address: updated.fullAddress,
        city: updated.city,
        province: updated.province,
        postalCode: updated.postalCode,
      },
    })

    return NextResponse.json({
      success: true,
      address: updated,
      message: 'Alamat utama berhasil diperbarui',
    })
  } catch (error) {
    console.error('Error setting default address:', error)
    return NextResponse.json(
      { error: 'Gagal mengatur alamat utama' },
      { status: 500 }
    )
  }
}
