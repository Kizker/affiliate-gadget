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

    // Check if user is a mitra
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'MITRA') {
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

    // Check if user is a mitra
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, mitraStatus: true },
    })

    if (user?.role !== 'MITRA') {
      return NextResponse.json(
        { error: 'User is not a mitra' },
        { status: 403 }
      )
    }

    if (user?.mitraStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Mitra account is not approved yet' },
        { status: 403 }
      )
    }

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
          // Delete existing services and images, will be recreated
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
          isApproved: true, // Auto-approve since user is already approved
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
            price?: number
          }) => ({
            mitraId: mitra.id,
            name: service.name,
            description: service.description || null,
            icon: service.icon || null,
            price: service.price || null,
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

    return NextResponse.json(updatedMitra)
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
