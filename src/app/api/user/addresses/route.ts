import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - List all user addresses
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await prisma.userAddress.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil daftar alamat' },
      { status: 500 }
    )
  }
}

// POST - Create a new address
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      recipientName,
      phone,
      label = 'Rumah',
      fullAddress,
      city,
      province,
      district,
      village,
      postalCode,
      latitude,
      longitude,
      isDefault = false,
    } = body

    if (!recipientName || !phone || !fullAddress || !city || !province || !postalCode) {
      return NextResponse.json(
        { error: 'Lengkapi semua field wajib alamat penerima' },
        { status: 400 }
      )
    }

    // Check existing address count
    const existingCount = await prisma.userAddress.count({
      where: { userId: session.user.id },
    })

    const shouldBeDefault = isDefault || existingCount === 0

    // If setting as default, unset other defaults
    if (shouldBeDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      })
    }

    const newAddress = await prisma.userAddress.create({
      data: {
        userId: session.user.id,
        recipientName,
        phone,
        label: label === 'Kantor' ? 'Kantor' : 'Rumah',
        fullAddress,
        city,
        province,
        district: district || null,
        village: village || null,
        postalCode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        isDefault: shouldBeDefault,
      },
    })

    // Also sync default address to user model for backward compatibility
    if (shouldBeDefault) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          address: fullAddress,
          city,
          province,
          postalCode,
        },
      })
    }

    return NextResponse.json({
      success: true,
      address: newAddress,
      message: 'Alamat baru berhasil ditambahkan',
    })
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json(
      { error: 'Gagal menambahkan alamat baru' },
      { status: 500 }
    )
  }
}
