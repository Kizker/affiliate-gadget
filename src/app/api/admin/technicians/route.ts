import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET /api/admin/technicians - List all technicians
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    // Check authentication and authorization
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const specialty = searchParams.get('specialty') || ''
    const availability = searchParams.get('availability')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.user = {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }
    }

    if (specialty) {
      where.specialties = {
        has: specialty,
      }
    }

    if (availability !== null && availability !== '') {
      where.isAvailable = availability === 'true'
    }

    // Get total count
    const total = await db.technician.count({ where })

    // Get technicians with user data
    const technicians = await db.technician.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            services: true,
            orders: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    })

    // Calculate real ratings from reviews for each technician
    const techniciansWithRealRatings = await Promise.all(
      technicians.map(async (tech) => {
        const reviews = await db.review.findMany({
          where: {
            order: {
              technicianId: tech.id,
            },
            type: 'TECHNICIAN',
          },
        })

        const totalRating = reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        )
        const averageRating =
          reviews.length > 0 ? totalRating / reviews.length : 0

        return {
          ...tech,
          rating: averageRating,
          totalReview: reviews.length,
        }
      })
    )

    return NextResponse.json({
      technicians: techniciansWithRealRatings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching technicians:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/technicians - Create new technician
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      // User fields
      name,
      email,
      phone,
      image,
      password,
      // Technician fields
      userId,
      bio,
      experience,
      specialties,
      isAvailable,
    } = body

    // Check if creating new user or using existing
    if (userId) {
      // Existing user flow (original logic)
      if (!specialties || specialties.length === 0) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        include: { technician: true },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (user.technician) {
        return NextResponse.json(
          { error: 'User already has a technician profile' },
          { status: 400 }
        )
      }

      const technician = await db.technician.create({
        data: {
          userId,
          bio: bio || null,
          experience: experience || 0,
          specialties,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              phone: true,
            },
          },
        },
      })

      return NextResponse.json(technician, { status: 201 })
    } else {
      // New user + technician flow
      if (!name || !email || !specialties || specialties.length === 0) {
        return NextResponse.json(
          {
            error:
              'Missing required fields: name, email, and specialties are required',
          },
          { status: 400 }
        )
      }

      // Check if email already exists
      const existingUser = await db.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }

      // Hash password if provided, otherwise generate a random one
      const finalPassword = password || Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(finalPassword, 10)

      // Create user and technician in a transaction
      const result = await db.$transaction(async (tx) => {
        // Create user with role TECHNICIAN
        const newUser = await tx.user.create({
          data: {
            name,
            email,
            phone: phone || null,
            image: image || null,
            password: hashedPassword,
            role: 'TECHNICIAN',
            isActive: true,
          },
        })

        // Create technician profile
        const newTechnician = await tx.technician.create({
          data: {
            userId: newUser.id,
            bio: bio || null,
            experience: experience || 0,
            specialties,
            isAvailable: isAvailable !== undefined ? isAvailable : true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                phone: true,
              },
            },
          },
        })

        return newTechnician
      })

      return NextResponse.json(result, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating technician:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
