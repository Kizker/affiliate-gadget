import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/mitras - List all mitras
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || ''
    const approved = searchParams.get('approved')

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.businessName = {
        contains: search,
        mode: 'insensitive',
      }
    }

    if (city) {
      where.city = city
    }

    if (approved !== null && approved !== '') {
      where.isApproved = approved === 'true'
    }

    const total = await db.mitra.count({ where })

    const mitras = await db.mitra.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            mitraStatus: true,
          },
        },
        _count: {
          select: {
            services: true,
            images: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate stats for all mitras (not just current page)
    const [approvedCount, pendingCount, uniqueCities] = await Promise.all([
      db.mitra.count({ where: { isApproved: true } }),
      db.mitra.count({ where: { isApproved: false } }),
      db.mitra.findMany({
        select: { city: true },
        distinct: ['city'],
      }),
    ])

    return NextResponse.json({
      mitras,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        approved: approvedCount,
        pending: pendingCount,
        cities: uniqueCities.length,
      },
    })
  } catch (error) {
    console.error('Error fetching mitras:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/mitras - Create new mitra
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      userId,
      businessName,
      tagline,
      description,
      banner,
      address,
      city,
      province,
      latitude,
      longitude,
      phone,
      whatsapp,
      email,
      website,
      features,
      weekdayHours,
      weekendHours,
      isApproved,
      services,
      images,
    } = body

    // Validate required fields
    if (!userId || !businessName || !address || !city || !province || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user exists and doesn't already have a mitra profile
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { mitra: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.mitra) {
      return NextResponse.json(
        { error: 'User already has a mitra profile' },
        { status: 400 }
      )
    }

    // Create mitra with services and images in a transaction
    const mitra = await db.$transaction(async (tx) => {
      // Create mitra
      const newMitra = await tx.mitra.create({
        data: {
          userId,
          businessName,
          tagline: tagline || null,
          description: description || null,
          banner: banner || null,
          address,
          city,
          province,
          latitude: latitude || null,
          longitude: longitude || null,
          phone,
          whatsapp: whatsapp || null,
          email: email || null,
          website: website || null,
          features: features || [],
          weekdayHours: weekdayHours || null,
          weekendHours: weekendHours || null,
          isApproved: isApproved || false,
        },
      })

      // Create services if provided
      if (services && Array.isArray(services) && services.length > 0) {
        await tx.mitraService.createMany({
          data: services.map(
            (svc: {
              name: string
              price: string
              icon?: string
              description?: string
            }) => ({
              mitraId: newMitra.id,
              name: svc.name,
              price: svc.price,
              icon: svc.icon || '💻',
              description: svc.description || null,
            })
          ),
        })
      }

      // Create images if provided
      if (images && Array.isArray(images) && images.length > 0) {
        await tx.mitraImage.createMany({
          data: images.map((img: { url: string }) => ({
            mitraId: newMitra.id,
            url: img.url,
          })),
        })
      }

      // Return mitra with related data
      return tx.mitra.findUnique({
        where: { id: newMitra.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          services: true,
          images: true,
        },
      })
    })

    // Update user mitraStatus if approved
    if (isApproved) {
      await db.user.update({
        where: { id: userId },
        data: { mitraStatus: 'APPROVED' },
      })
    }

    return NextResponse.json(mitra, { status: 201 })
  } catch (error) {
    console.error('Error creating mitra:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
