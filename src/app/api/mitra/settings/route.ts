import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET /api/mitra/settings - Get current mitra user settings
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a mitra
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        role: true,
        mitra: {
          select: {
            id: true,
            businessName: true,
            address: true,
            city: true,
            province: true,
            whatsapp: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    })

    if (!user || user.role !== 'MITRA') {
      return NextResponse.json(
        { error: 'User is not a mitra' },
        { status: 403 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching mitra settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/mitra/settings - Update mitra user settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a mitra
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        email: true,
        mitra: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!user || user.role !== 'MITRA') {
      return NextResponse.json(
        { error: 'User is not a mitra' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      phone,
      image,
      email,
      businessName,
      address,
      city,
      province,
      whatsapp,
      latitude,
      longitude,
      currentPassword,
      newPassword,
    } = body

    // If changing email, check if it's already taken
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: session.user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Password saat ini diperlukan' },
          { status: 400 }
        )
      }

      const userWithPassword = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      })

      if (!userWithPassword?.password) {
        return NextResponse.json(
          { error: 'Password tidak ditemukan' },
          { status: 400 }
        )
      }

      const isValid = await bcrypt.compare(
        currentPassword,
        userWithPassword.password
      )

      if (!isValid) {
        return NextResponse.json(
          { error: 'Password saat ini salah' },
          { status: 400 }
        )
      }
    }

    // Prepare user update data
    interface UserUpdateData {
      name?: string
      phone?: string
      image?: string
      email?: string
      password?: string
    }
    const userUpdateData: UserUpdateData = {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(image !== undefined && { image }),
      ...(email !== undefined && { email }),
    }

    // Hash new password if provided
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      userUpdateData.password = hashedPassword
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: userUpdateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        role: true,
      },
    })

    // Update mitra profile if mitra exists and fields are provided
    let updatedMitra = null
    if (user.mitra?.id) {
      interface MitraUpdateData {
        businessName?: string
        address?: string
        city?: string
        province?: string
        whatsapp?: string
        latitude?: number
        longitude?: number
      }
      const mitraUpdateData: MitraUpdateData = {
        ...(businessName !== undefined && { businessName }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(province !== undefined && { province }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      }

      if (Object.keys(mitraUpdateData).length > 0) {
        updatedMitra = await prisma.mitra.update({
          where: { id: user.mitra.id },
          data: mitraUpdateData,
          select: {
            id: true,
            businessName: true,
            address: true,
            city: true,
            province: true,
            whatsapp: true,
            latitude: true,
            longitude: true,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        mitra: updatedMitra,
      },
    })
  } catch (error) {
    console.error('Error updating mitra settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
