import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { UserRole, Prisma } from '@prisma/client'
import { normalizeToLocalPhone } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Only ADMIN, SUPER_ADMIN, and STORE_ADMIN can access
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN', 'STORE_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role') || 'ALL'
    const search = searchParams.get('search') || ''
    const mitraStatus = searchParams.get('mitraStatus') || 'ALL'

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.UserWhereInput = {}

    if (role !== 'ALL') {
      if (role === 'TECHNICIAN') {
        // Filter users who have technician profile
        where.technician = { isNot: null }
      } else if (Object.values(UserRole).includes(role as UserRole)) {
        where.role = role as UserRole
      }
    }

    if (mitraStatus !== 'ALL' && role === 'MITRA') {
      where.mitraStatus = mitraStatus as 'PENDING' | 'APPROVED' | 'REJECTED'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          mitraStatus: true,
          createdAt: true,
          updatedAt: true,
          technician: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    // Get stats
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })

    const pendingMitra = await prisma.user.count({
      where: { role: 'MITRA', mitraStatus: 'PENDING' },
    })

    // Count technicians (users with technician profile)
    const technicianCount = await prisma.user.count({
      where: { technician: { isNot: null } },
    })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byRole: stats.reduce((acc: Record<string, number>, stat) => {
          acc[stat.role] = stat._count
          return acc
        }, {}),
        pendingMitra,
        technicians: technicianCount,
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Only ADMIN, SUPER_ADMIN, and STORE_ADMIN can create users
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN', 'STORE_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, phone: rawPhone, role } = body
    const phone = rawPhone ? normalizeToLocalPhone(rawPhone) || null : null

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user (Superadmin creation: MITRA is immediately active & approved with default Mitra profile)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        isActive: true,
        emailVerified: new Date(),
        mitraStatus:
          role === 'MITRA'
            ? 'APPROVED'
            : role === 'STORE_ADMIN'
              ? 'APPROVED'
              : null,
        mitra:
          role === 'MITRA'
            ? {
                create: {
                  businessName: name.trim(),
                  address: 'Alamat workshop belum diatur',
                  city: 'Jakarta',
                  province: 'DKI Jakarta',
                  phone: phone || '-',
                  whatsapp: phone || null,
                  rating: 5.0,
                  totalReview: 0,
                  isApproved: true,
                  isActive: true,
                },
              }
            : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        mitraStatus: true,
        createdAt: true,
      },
    })

    if (role === 'MITRA') {
      try {
        const { invalidateMitraServiceDataCache } =
          await import('@/lib/mitra-service-data')
        invalidateMitraServiceDataCache()
      } catch {}
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
