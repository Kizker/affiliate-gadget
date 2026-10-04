import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// GET /api/admin/mitras/services - List all registered service partners (role MITRA)
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json(
        {
          error:
            'Akses ditolak. Hanya Admin dan Superadmin yang memiliki izin.',
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search')?.trim() || ''
    const status = searchParams.get('status') || 'ALL' // 'ALL' | 'ACTIVE' | 'INACTIVE'

    const skip = (page - 1) * limit

    // Build where filter for users with role MITRA
    const whereClause: any = {
      role: 'MITRA',
    }

    if (status === 'ACTIVE') {
      whereClause.isActive = true
    } else if (status === 'INACTIVE') {
      whereClause.isActive = false
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        {
          mitra: {
            businessName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          mitra: {
            city: { contains: search, mode: 'insensitive' },
          },
        },
      ]
    }

    // Query service mitra accounts
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          mitra: {
            include: {
              _count: {
                select: {
                  services: true,
                  images: true,
                  reviews: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ])

    // Query aggregate statistics
    const [totalMitras, activeMitras, totalServicesCount, allMitraCities] =
      await Promise.all([
        prisma.user.count({ where: { role: 'MITRA' } }),
        prisma.user.count({ where: { role: 'MITRA', isActive: true } }),
        prisma.mitraService.count(),
        prisma.mitra.findMany({
          select: { city: true },
          where: { isActive: true },
        }),
      ])

    const uniqueCities = Array.from(
      new Set(allMitraCities.map((m) => m.city).filter(Boolean))
    )

    const formattedMitras = users.map((u) => ({
      id: u.id,
      userId: u.id,
      username: u.name || 'Mitra Servis',
      name: u.name || 'Mitra Servis',
      email: u.email,
      phone: u.phone || u.mitra?.phone || null,
      isActive: u.isActive,
      mitraStatus:
        u.mitraStatus || (u.mitra?.isApproved ? 'APPROVED' : 'PENDING'),
      createdAt: u.createdAt.toISOString(),
      mitra: u.mitra
        ? {
            id: u.mitra.id,
            businessName: u.mitra.businessName,
            tagline: u.mitra.tagline,
            description: u.mitra.description,
            address: u.mitra.address,
            city: u.mitra.city,
            province: u.mitra.province,
            phone: u.mitra.phone,
            whatsapp: u.mitra.whatsapp,
            rating: u.mitra.rating,
            totalReview: u.mitra.totalReview,
            isApproved: u.mitra.isApproved,
            isActive: u.mitra.isActive,
            servicesCount: u.mitra._count?.services || 0,
            imagesCount: u.mitra._count?.images || 0,
          }
        : null,
    }))

    return NextResponse.json({
      success: true,
      mitras: formattedMitras,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      stats: {
        total: totalMitras,
        active: activeMitras,
        inactive: totalMitras - activeMitras,
        totalServices: totalServicesCount,
        cities: uniqueCities.length,
      },
    })
  } catch (error) {
    console.error('[Admin Mitra Services GET Error]', error)
    return NextResponse.json(
      { error: 'Terjadi kendala saat memuat data mitra servis.' },
      { status: 500 }
    )
  }
}

// POST /api/admin/mitras/services - Create new account with role MITRA
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json(
        {
          error:
            'Akses ditolak. Hanya Admin dan Superadmin yang berwenang membuat akun mitra.',
        },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { username, email, password } = body

    // Validation: Username, Email, Password
    if (
      !username ||
      typeof username !== 'string' ||
      username.trim().length < 2
    ) {
      return NextResponse.json(
        { error: 'Username atau nama mitra wajib diisi minimal 2 karakter.' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Format email tidak valid.' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password wajib diisi minimal 6 karakter.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const cleanUsername = username.trim()

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: `Email "${normalizedEmail}" sudah terdaftar di sistem.` },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Execute atomic creation of User and Mitra profile
    const newUser = await prisma.user.create({
      data: {
        name: cleanUsername,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'MITRA',
        mitraStatus: 'APPROVED',
        isActive: true,
        emailVerified: new Date(),
        mitra: {
          create: {
            businessName: cleanUsername,
            address: 'Alamat workshop belum diatur',
            city: 'Jakarta',
            province: 'DKI Jakarta',
            phone: '-',
            rating: 5.0,
            totalReview: 0,
            isApproved: true,
            isActive: true,
          },
        },
      },
      include: {
        mitra: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: `Akun mitra "${cleanUsername}" berhasil dibuat dengan role MITRA!`,
        user: {
          id: newUser.id,
          username: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive,
          mitraId: newUser.mitra?.id,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Admin Mitra Services POST Error]', error)
    const errorMsg =
      error instanceof Error
        ? error.message
        : 'Terjadi kendala saat membuat akun mitra.'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
