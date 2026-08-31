import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// PATCH - Update address
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { addressId } = await params
    const body = await req.json()
    const {
      recipientName,
      phone,
      label,
      fullAddress,
      city,
      province,
      district,
      village,
      postalCode,
      latitude,
      longitude,
      isDefault,
    } = body

    // Verify ownership
    const existing = await prisma.userAddress.findFirst({
      where: { id: addressId, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Alamat tidak ditemukan' }, { status: 404 })
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: session.user.id, id: { not: addressId } },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.userAddress.update({
      where: { id: addressId },
      data: {
        ...(recipientName !== undefined && { recipientName }),
        ...(phone !== undefined && { phone }),
        ...(label !== undefined && { label: label === 'Kantor' ? 'Kantor' : 'Rumah' }),
        ...(fullAddress !== undefined && { fullAddress }),
        ...(city !== undefined && { city }),
        ...(province !== undefined && { province }),
        ...(district !== undefined && { district }),
        ...(village !== undefined && { village }),
        ...(postalCode !== undefined && { postalCode }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    // If it is default, sync to user model
    if (updated.isDefault) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          address: updated.fullAddress,
          city: updated.city,
          province: updated.province,
          postalCode: updated.postalCode,
        },
      })
    }

    return NextResponse.json({
      success: true,
      address: updated,
      message: 'Alamat berhasil diperbarui',
    })
  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui alamat' },
      { status: 500 }
    )
  }
}

// DELETE - Remove address
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { addressId } = await params

    const existing = await prisma.userAddress.findFirst({
      where: { id: addressId, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Alamat tidak ditemukan' }, { status: 404 })
    }

    await prisma.userAddress.delete({
      where: { id: addressId },
    })

    // If the deleted address was default, make another one default if available
    if (existing.isDefault) {
      const nextAddress = await prisma.userAddress.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      })

      if (nextAddress) {
        await prisma.userAddress.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        })

        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            address: nextAddress.fullAddress,
            city: nextAddress.city,
            province: nextAddress.province,
            postalCode: nextAddress.postalCode,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Alamat berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus alamat' },
      { status: 500 }
    )
  }
}
