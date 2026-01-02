import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can access
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
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
    const where: {
      role?: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'MITRA'
      mitraStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
      technician?: { isNot: null }
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        email?: { contains: string; mode: 'insensitive' }
      }>
    } = {}

    if (role !== 'ALL') {
      if (role === 'TECHNICIAN') {
        // Filter users who have technician profile
        where.technician = { isNot: null }
      } else {
        where.role = role as 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'MITRA'
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

    // Only ADMIN and SUPER_ADMIN can create users
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, phone, role } = body

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

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        mitraStatus: role === 'MITRA' ? 'PENDING' : null,
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

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
