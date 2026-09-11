import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET /api/mitra/profile - Get current user's mitra profile
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a mitra or store admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        storeApplication: true,
      },
    })

    if (user?.role !== 'MITRA' && user?.role !== 'STORE_ADMIN') {
      return NextResponse.json(
        { error: 'User is not a mitra' },
        { status: 403 }
      )
    }

    // Fetch mitra profile with relations
    const mitra = await prisma.mitra.findUnique({
      where: { userId: session.user.id },
      include: {
        services: {
          orderBy: { createdAt: 'asc' },
        },
        images: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!mitra) {
      if (user?.storeApplication) {
        return NextResponse.json({
          businessName: user.storeApplication.storeName,
          companyName: user.storeApplication.companyName,
          address: user.storeApplication.address,
          city: user.storeApplication.city,
          province: user.storeApplication.province,
          phone: user.storeApplication.phone,
          services: [],
          images: [],
          features: [],
        })
      }
      return NextResponse.json(
        { error: 'Mitra profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(mitra)
  } catch (error) {
    console.error('Error fetching mitra profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/mitra/profile - Create or update mitra profile
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a mitra or store admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, mitraStatus: true, storeId: true },
    })

    if (user?.role !== 'MITRA' && user?.role !== 'STORE_ADMIN') {
      return NextResponse.json(
        { error: 'User is not a mitra' },
        { status: 403 }
      )
    }

    const isAlreadyApproved =
      user?.mitraStatus === 'APPROVED' || user?.role === 'STORE_ADMIN'

    const body = await request.json()

    // Validate required fields
    if (!body.businessName || !body.address || !body.city || !body.phone) {
      return NextResponse.json(
        {
          error: 'Missing required fields: businessName, address, city, phone',
        },
        { status: 400 }
      )
    }

    // Check if mitra profile exists
    const existingMitra = await prisma.mitra.findUnique({
      where: { userId: session.user.id },
    })

    let mitra

    if (existingMitra) {
      // Update existing profile
      mitra = await prisma.mitra.update({
        where: { userId: session.user.id },
        data: {
          businessName: body.businessName,
          tagline: body.tagline || null,
          description: body.description || null,
          banner: body.banner || null,
          address: body.address,
          city: body.city,
          province: body.province || 'Indonesia',
          phone: body.phone,
          whatsapp: body.whatsapp || null,
          email: body.email || null,
          website: body.website || null,
          features: body.features || [],
          weekdayHours: body.weekdayHours || null,
          weekendHours: body.weekendHours || null,
          latitude: body.latitude || null,
          longitude: body.longitude || null,
          isApproved: isAlreadyApproved ? true : false,
        },
        include: {
          services: true,
          images: true,
        },
      })

      // Delete existing services and images
      await prisma.mitraService.deleteMany({
        where: { mitraId: mitra.id },
      })
      await prisma.mitraImage.deleteMany({
        where: { mitraId: mitra.id },
      })
    } else {
      // Create new profile
      mitra = await prisma.mitra.create({
        data: {
          userId: session.user.id,
          businessName: body.businessName,
          tagline: body.tagline || null,
          description: body.description || null,
          banner: body.banner || null,
          address: body.address,
          city: body.city,
          province: body.province || 'Indonesia',
          phone: body.phone,
          whatsapp: body.whatsapp || null,
          email: body.email || null,
          website: body.website || null,
          features: body.features || [],
          weekdayHours: body.weekdayHours || null,
          weekendHours: body.weekendHours || null,
          latitude: body.latitude || null,
          longitude: body.longitude || null,
          isApproved: isAlreadyApproved ? true : false,
        },
        include: {
          services: true,
          images: true,
        },
      })
    }

    // Create services if provided
    if (body.services && Array.isArray(body.services)) {
      await prisma.mitraService.createMany({
        data: body.services.map(
          (service: {
            name: string
            description?: string
            icon?: string
            price?: number | string
          }) => ({
            mitraId: mitra.id,
            name: service.name,
            description: service.description || null,
            icon: service.icon || null,
            price: service.price ? String(service.price) : null,
          })
        ),
      })
    }

    // Create images if provided
    if (body.images && Array.isArray(body.images)) {
      await prisma.mitraImage.createMany({
        data: body.images.map((image: { url?: string } | string) => ({
          mitraId: mitra.id,
          url: typeof image === 'string' ? image : image.url || '',
          isBanner: false,
        })),
      })
    }

    // If unapproved mitra submits profile, mark status as PENDING and upsert StoreApplication
    // so Superadmin can review and approve it in Admin CMS
    if (!isAlreadyApproved) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.user.id },
          data: {
            mitraStatus: 'PENDING',
          },
        }),
        prisma.storeApplication.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            storeName: body.businessName,
            companyName: body.companyName || body.businessName,
            taxId: body.taxId || null,
            address: body.address,
            city: body.city,
            province: body.province || 'Indonesia',
            postalCode: body.postalCode || null,
            phone: body.phone,
            bankName: body.bankName || null,
            accountNumber: body.accountNumber || null,
            accountName: body.accountName || null,
            rejectionReason: null,
          },
          update: {
            storeName: body.businessName,
            companyName: body.companyName || body.businessName,
            taxId: body.taxId || null,
            address: body.address,
            city: body.city,
            province: body.province || 'Indonesia',
            postalCode: body.postalCode || null,
            phone: body.phone,
            bankName: body.bankName || null,
            accountNumber: body.accountNumber || null,
            accountName: body.accountName || null,
            rejectionReason: null,
          },
        }),
      ])
    } else if (user?.storeId) {
      // If store is already approved and has storeId, keep Store record in sync
      await prisma.store.update({
        where: { id: user.storeId },
        data: {
          name: body.businessName,
          address: body.address,
          city: body.city,
          province: body.province || undefined,
          phone: body.phone,
          tagline: body.tagline || undefined,
          description: body.description || undefined,
        },
      })
    }

    // Fetch updated mitra with relations
    const updatedMitra = await prisma.mitra.findUnique({
      where: { id: mitra.id },
      include: {
        services: {
          orderBy: { createdAt: 'asc' },
        },
        images: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json({
      ...updatedMitra,
      isPendingReview: !isAlreadyApproved,
      mitraStatus: isAlreadyApproved ? 'APPROVED' : 'PENDING',
    })
  } catch (error) {
    console.error('Error saving mitra profile:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    const errorCode = (error as { code?: string }).code
    const errorMeta = (error as { meta?: unknown }).meta
    console.error('Error details:', {
      message: errorMessage,
      code: errorCode,
      meta: errorMeta,
    })
    return NextResponse.json(
      { error: errorMessage || 'Internal server error' },
      { status: 500 }
    )
  }
}
