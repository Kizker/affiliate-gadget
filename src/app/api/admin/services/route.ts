import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/admin/services - Create new service
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
      technicianId,
      name,
      description,
      category,
      price,
      duration,
      isActive,
    } = body

    // Validate required fields
    if (!technicianId || !name || !category || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if technician exists
    const technician = await db.technician.findUnique({
      where: { id: technicianId },
    })

    if (!technician) {
      return NextResponse.json(
        { error: 'Technician not found' },
        { status: 404 }
      )
    }

    // Create service
    const service = await db.service.create({
      data: {
        technicianId,
        name,
        description: description || null,
        category,
        price: parseFloat(price),
        duration: duration ? parseInt(duration) : null,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
