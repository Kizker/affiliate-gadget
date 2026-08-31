import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Retrieve full user profile
export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail! },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        phone: true,
        gender: true,
        birthDate: true,
        bio: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        createdAt: true,
        technician: {
          select: {
            bio: true,
            experience: true,
            specialties: true,
            isAvailable: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Gagal memuat profil pengguna' },
      { status: 500 }
    )
  }
}

// PATCH - Update buyer profile data
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id
    const currentUserEmail = session?.user?.email

    if (!currentUserId && !currentUserEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find current user from DB
    const existingSelf = await prisma.user.findFirst({
      where: currentUserId ? { id: currentUserId } : { email: currentUserEmail! },
    })

    if (!existingSelf) {
      return NextResponse.json({ error: 'User tidak ditemukan di database' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      username,
      email,
      phone,
      gender,
      birthDate,
      bio,
      experience,
      specialties,
      isAvailable,
    } = body

    // Validate email uniqueness if changing email
    const cleanEmail = email ? email.trim().toLowerCase() : undefined
    if (cleanEmail && cleanEmail !== existingSelf.email) {
      const duplicateEmail = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          id: { not: existingSelf.id },
        },
      })

      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Alamat email sudah digunakan oleh akun lain' },
          { status: 400 }
        )
      }
    }

    // Validate username uniqueness if provided
    let cleanUsername: string | null = null
    if (username !== undefined) {
      const raw = typeof username === 'string' ? username.trim().toLowerCase().replace(/^@+/, '') : ''
      cleanUsername = raw || null

      if (cleanUsername) {
        const duplicateUsername = await prisma.user.findFirst({
          where: {
            username: cleanUsername,
            id: { not: existingSelf.id },
          },
        })

        if (duplicateUsername) {
          return NextResponse.json(
            { error: 'Username @' + cleanUsername + ' sudah digunakan, silakan pilih yang lain' },
            { status: 400 }
          )
        }
      }
    }

    // Parse birthDate defensively
    let parsedBirthDate: Date | null | undefined = undefined
    if (birthDate !== undefined) {
      if (!birthDate || typeof birthDate !== 'string' || birthDate.trim() === '') {
        parsedBirthDate = null
      } else {
        const d = new Date(birthDate)
        parsedBirthDate = isNaN(d.getTime()) ? null : d
      }
    }

    // Clean phone
    const cleanPhone = phone !== undefined ? (typeof phone === 'string' ? phone.trim() : null) || null : undefined

    // Clean gender
    const cleanGender = gender !== undefined ? (typeof gender === 'string' ? gender.trim() : null) || null : undefined

    // Clean bio
    const cleanBio = bio !== undefined ? (typeof bio === 'string' ? bio.trim() : null) || null : undefined

    // Clean name
    const cleanName = name !== undefined ? (typeof name === 'string' ? name.trim() : null) || null : undefined

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: existingSelf.id },
      data: {
        ...(cleanName !== undefined && { name: cleanName }),
        ...(cleanUsername !== undefined && { username: cleanUsername }),
        ...(cleanEmail && { email: cleanEmail }),
        ...(cleanPhone !== undefined && { phone: cleanPhone }),
        ...(cleanGender !== undefined && { gender: cleanGender }),
        ...(parsedBirthDate !== undefined && { birthDate: parsedBirthDate }),
        ...(cleanBio !== undefined && { bio: cleanBio }),
      },
    })

    // Update technician if exists
    const technician = await prisma.technician.findUnique({
      where: { userId: existingSelf.id },
    })

    if (technician) {
      await prisma.technician.update({
        where: { userId: existingSelf.id },
        data: {
          ...(bio !== undefined && { bio: cleanBio || undefined }),
          ...(experience !== undefined && { experience: parseInt(experience) || 0 }),
          ...(specialties !== undefined && { specialties }),
          ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Profil biodata berhasil diperbarui',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error updating profile in PATCH /api/user/profile:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memperbarui profil pengguna' },
      { status: 500 }
    )
  }
}
