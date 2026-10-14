import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { invalidateMitraServiceDataCache } from '@/lib/mitra-service-data'

// GET /api/mitra/profile - Get current user's mitra profile
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a mitra or store admin
    const user = await prisma.user.findFirst({
      where: session.user.id
        ? { id: session.user.id }
        : { email: session.user.email! },
      select: {
        id: true,
        role: true,
        storeApplication: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (
      user.role !== 'MITRA' &&
      user.role !== 'STORE_ADMIN' &&
      user.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { error: 'User is not a mitra' },
        { status: 403 }
      )
    }

    // Fetch mitra profile with relations
    const mitra = await prisma.mitra.findUnique({
      where: { userId: user.id },
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
      if (user.storeApplication) {
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

    const response = NextResponse.json(mitra)
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    )
    return response
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

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a mitra or store admin
    const user = await prisma.user.findFirst({
      where: session.user.id
        ? { id: session.user.id }
        : { email: session.user.email! },
      select: { id: true, role: true, mitraStatus: true, storeId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (
      user.role !== 'MITRA' &&
      user.role !== 'STORE_ADMIN' &&
      user.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { error: 'User is not a mitra' },
        { status: 403 }
      )
    }

    const isAlreadyApproved =
      user.mitraStatus === 'APPROVED' ||
      user.role === 'STORE_ADMIN' ||
      user.role === 'SUPER_ADMIN'

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
      where: { userId: user.id },
    })

    let mitra

    const baseData = {
      businessName: body.businessName,
      tagline: body.tagline || null,
      description: body.description || null,
      banner: body.banner || null,
      address: body.address,
      city: body.city,
      province: body.province || 'DKI Jakarta',
      phone: body.phone,
      whatsapp: body.whatsapp || body.phone || null,
      email: body.email || null,
      website: body.website || null,
      features: Array.isArray(body.features) ? body.features.slice(0, 10) : [],
      weekdayHours: body.weekdayHours || null,
      weekendHours: body.weekendHours || null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      isApproved: isAlreadyApproved ? true : false,
    }

    if (existingMitra) {
      // Update existing profile (safe from in-memory Prisma DMMF lock)
      mitra = await prisma.mitra.update({
        where: { userId: user.id },
        data: baseData,
        include: {
          services: true,
          images: true,
        },
      })

      // Sync mapsUrl directly to database column
      if (body.mapsUrl !== undefined) {
        const cleanMapsUrl = body.mapsUrl ? String(body.mapsUrl).trim() : null
        try {
          await prisma.$executeRawUnsafe(
            'UPDATE "mitras" SET "mapsUrl" = $1 WHERE "userId" = $2',
            cleanMapsUrl,
            user.id
          )
          ;(mitra as any).mapsUrl = cleanMapsUrl
        } catch (rawErr) {
          console.warn('Gagal sync mapsUrl via raw query:', rawErr)
        }
      }

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
          userId: user.id,
          ...baseData,
        },
        include: {
          services: true,
          images: true,
        },
      })

      if (body.mapsUrl !== undefined) {
        const cleanMapsUrl = body.mapsUrl ? String(body.mapsUrl).trim() : null
        try {
          await prisma.$executeRawUnsafe(
            'UPDATE "mitras" SET "mapsUrl" = $1 WHERE "id" = $2',
            cleanMapsUrl,
            mitra.id
          )
          ;(mitra as any).mapsUrl = cleanMapsUrl
        } catch (rawErr) {
          console.warn('Gagal sync mapsUrl on create:', rawErr)
        }
      }
    }

    // Create services if provided
    if (body.services && Array.isArray(body.services)) {
      const validServices = body.services
        .filter((s: { name?: string }) => s && s.name && s.name.trim())
        .map(
          (service: {
            name: string
            description?: string
            icon?: string
            price?: number | string
          }) => ({
            mitraId: mitra.id,
            name: service.name.trim(),
            description: service.description || null,
            icon: service.icon || '📱',
            price: service.price ? String(service.price).trim() : null,
          })
        )

      if (validServices.length > 0) {
        await prisma.mitraService.createMany({
          data: validServices,
        })
      }
    }

    // Create images if provided
    if (body.images && Array.isArray(body.images)) {
      const validImages = body.images
        .map((img: { url?: string } | string) =>
          typeof img === 'string' ? img.trim() : img?.url ? img.url.trim() : ''
        )
        .filter((url: string) => Boolean(url))
        .map((url: string) => ({
          mitraId: mitra.id,
          url,
          isBanner: false,
        }))

      if (validImages.length > 0) {
        await prisma.mitraImage.createMany({
          data: validImages,
        })
      }
    }

    // If unapproved mitra submits profile, mark status as PENDING and upsert StoreApplication
    // so Superadmin can review and approve it in Admin CMS
    if (!isAlreadyApproved) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            mitraStatus: 'PENDING',
          },
        }),
        prisma.storeApplication.upsert({
          where: { userId: user.id },
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

    // Trigger Next.js cache revalidation for public partner page
    try {
      invalidateMitraServiceDataCache()
      revalidatePath(`/rekomendasi/${mitra.id}`)
      revalidatePath('/rekomendasi')
      revalidatePath('/servis')
    } catch (revalError) {
      console.warn('Revalidation warning:', revalError)
    }

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

// PATCH /api/mitra/profile - Instant partial update (e.g. auto-save banner)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: session.user.id
        ? { id: session.user.id }
        : { email: session.user.email! },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existingMitra = await prisma.mitra.findUnique({
      where: { userId: user.id },
    })

    if (!existingMitra) {
      return NextResponse.json(
        { error: 'Mitra profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updateData: Record<string, any> = {}

    if (body.banner !== undefined) {
      updateData.banner = body.banner ? String(body.banner).trim() : null
    }

    if (body.mapsUrl !== undefined) {
      updateData.mapsUrl = body.mapsUrl ? String(body.mapsUrl).trim() : null
    }

    if (body.address !== undefined) {
      updateData.address = String(body.address).trim()
    }

    if (body.city !== undefined) {
      updateData.city = String(body.city).trim()
    }

    if (body.province !== undefined) {
      updateData.province = String(body.province).trim()
    }

    if (body.latitude !== undefined) {
      updateData.latitude =
        body.latitude !== null ? Number(body.latitude) : null
    }

    if (body.longitude !== undefined) {
      updateData.longitude =
        body.longitude !== null ? Number(body.longitude) : null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const mapsUrlValue = updateData.mapsUrl
    delete updateData.mapsUrl

    let updated: any = existingMitra
    if (Object.keys(updateData).length > 0) {
      updated = await prisma.mitra.update({
        where: { id: existingMitra.id },
        data: updateData,
        select: {
          id: true,
          businessName: true,
          banner: true,
          address: true,
          city: true,
        },
      })
    }

    if (mapsUrlValue !== undefined) {
      try {
        await prisma.$executeRawUnsafe(
          'UPDATE "mitras" SET "mapsUrl" = $1 WHERE "id" = $2',
          mapsUrlValue,
          existingMitra.id
        )
        updated.mapsUrl = mapsUrlValue
      } catch (rawErr) {
        console.warn('Gagal update mapsUrl in PATCH via raw SQL:', rawErr)
      }
    }

    // Instant revalidate
    try {
      invalidateMitraServiceDataCache()
      revalidatePath(`/rekomendasi/${updated.id}`)
      revalidatePath('/rekomendasi')
      revalidatePath('/servis')
    } catch (e) {
      console.warn('Revalidation warning:', e)
    }

    return NextResponse.json({
      success: true,
      mitra: updated,
    })
  } catch (error) {
    console.error('Error updating banner in PATCH:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui banner' },
      { status: 500 }
    )
  }
}
