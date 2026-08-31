import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/mitras - List all stores & mitras with complete operational & legal data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || ''
    const approved = searchParams.get('approved')

    const skip = (page - 1) * limit

    // First check if we have Store records (Official Stores with PT Legalitas)
    const storeWhere: Record<string, unknown> = {}
    if (search) {
      storeWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (city) {
      storeWhere.city = city
    }
    if (approved !== null && approved !== '') {
      storeWhere.isActive = approved === 'true'
    }

    const storeCount = await db.store.count({ where: storeWhere })

    if (storeCount > 0) {
      const stores = await db.store.findMany({
        where: storeWhere,
        skip,
        take: limit,
        include: {
          bankAccounts: true,
          schedules: true,
          _count: {
            select: {
              products: true,
              orders: true,
              liveStreams: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      const [totalActive, totalInactive, uniqueCities] = await Promise.all([
        db.store.count({ where: { isActive: true } }),
        db.store.count({ where: { isActive: false } }),
        db.store.findMany({
          select: { city: true },
          distinct: ['city'],
        }),
      ])

      const mappedStores = stores.map((s) => ({
        id: s.id,
        businessName: s.name,
        name: s.name,
        slug: s.slug,
        companyName: s.companyName,
        taxId: s.taxId,
        tagline: s.tagline,
        description: s.description,
        address: s.address,
        city: s.city,
        province: s.province,
        postalCode: s.postalCode,
        latitude: s.latitude,
        longitude: s.longitude,
        phone: s.phone,
        whatsapp: s.whatsapp,
        email: s.email,
        rating: s.rating,
        totalReview: s.totalReview,
        totalSales: s.totalSales,
        commissionRate: s.commissionRate,
        isOwnerStore: s.isOwnerStore,
        isApproved: s.isActive,
        isActive: s.isActive,
        createdAt: s.createdAt.toISOString(),
        bankAccounts: s.bankAccounts,
        schedules: s.schedules,
        user: {
          id: s.id,
          name: s.companyName,
          email: s.email || `${s.slug}@affiliategadget.com`,
          phone: s.phone,
          isActive: s.isActive,
          mitraStatus: s.isActive ? 'APPROVED' : 'PENDING',
        },
        _count: {
          services: s._count.products,
          products: s._count.products,
          orders: s._count.orders,
          images: 4,
          reviews: s.totalReview,
        },
      }))

      return NextResponse.json({
        mitras: mappedStores,
        pagination: {
          page,
          limit,
          total: storeCount,
          totalPages: Math.ceil(storeCount / limit),
        },
        stats: {
          total: storeCount,
          approved: totalActive,
          pending: totalInactive,
          cities: uniqueCities.length,
        },
      })
    }

    // Fallback to legacy Mitra table if no store records
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

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
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
