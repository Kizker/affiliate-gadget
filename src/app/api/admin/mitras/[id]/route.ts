import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/mitras/[id] - Get mitra detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mitra = await db.mitra.findUnique({
      where: { id },
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
        services: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        images: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        schedules: {
          orderBy: {
            day: 'asc',
          },
        },
        reviews: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    })

    if (!mitra) {
      return NextResponse.json({ error: 'Mitra not found' }, { status: 404 })
    }

    return NextResponse.json(mitra)
  } catch (error) {
    console.error('Error fetching mitra:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/mitras/[id] - Update mitra
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
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
      isActive,
    } = body

    // Check if mitra exists
    const existing = await db.mitra.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Mitra not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    if (businessName !== undefined) updateData.businessName = businessName
    if (tagline !== undefined) updateData.tagline = tagline
    if (description !== undefined) updateData.description = description
    if (banner !== undefined) updateData.banner = banner
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (province !== undefined) updateData.province = province
    if (latitude !== undefined) updateData.latitude = latitude
    if (longitude !== undefined) updateData.longitude = longitude
    if (phone !== undefined) updateData.phone = phone
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp
    if (email !== undefined) updateData.email = email
    if (website !== undefined) updateData.website = website
    if (features !== undefined) updateData.features = features
    if (weekdayHours !== undefined) updateData.weekdayHours = weekdayHours
    if (weekendHours !== undefined) updateData.weekendHours = weekendHours
    if (isApproved !== undefined) updateData.isApproved = isApproved
    if (isActive !== undefined) updateData.isActive = isActive

    // Update mitra
    const mitra = await db.mitra.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    // Update user mitraStatus and role if approval changed
    if (isApproved !== undefined) {
      await db.user.update({
        where: { id: mitra.userId },
        data: {
          mitraStatus: isApproved ? 'APPROVED' : 'REJECTED',
          role: isApproved ? 'MITRA' : 'CUSTOMER',
        },
      })
    }

    return NextResponse.json(mitra)
  } catch (error) {
    console.error('Error updating mitra:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/mitras/[id] - Delete mitra (hard delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if mitra exists
    const existing = await db.mitra.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Mitra not found' }, { status: 404 })
    }

    // Hard delete - actually remove from database
    await db.mitra.delete({
      where: { id },
    })

    // Update user mitraStatus to null (remove mitra status)
    await db.user.update({
      where: { id: existing.userId },
      data: {
        mitraStatus: null,
        role: 'CUSTOMER', // Reset role to CUSTOMER
      },
    })

    return NextResponse.json({ message: 'Mitra deleted successfully' })
  } catch (error) {
    console.error('Error deleting mitra:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
