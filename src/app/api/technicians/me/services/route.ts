import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get technician services
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!technician) {
      return NextResponse.json(
        { error: 'Technician not found' },
        { status: 404 }
      )
    }

    const services = await prisma.service.findMany({
      where: { technicianId: technician.id },
      orderBy: { createdAt: 'desc' },
    })

    // Map database fields to frontend expectations
    const mappedServices = services.map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
      price: service.price,
      minPrice: service.price, // Map price to minPrice for frontend
      maxPrice: null, // Not supported in DB
      description: service.description,
      estimatedDuration: service.duration || 60,
    }))

    return NextResponse.json({ services: mappedServices })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new service
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!technician) {
      return NextResponse.json(
        { error: 'Technician not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, category, price, minPrice, description, duration } = body

    // Use minPrice if provided (frontend sends this), otherwise use price
    const servicePrice =
      minPrice !== undefined && minPrice !== null && minPrice !== ''
        ? parseFloat(minPrice)
        : price !== undefined && price !== null && price !== ''
          ? parseFloat(price)
          : 0

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }

    const service = await prisma.service.create({
      data: {
        technicianId: technician.id,
        name,
        category,
        price: servicePrice,
        description: description || '',
        duration: duration || 60,
      },
    })

    // Map response to frontend format
    const mappedService = {
      id: service.id,
      name: service.name,
      category: service.category,
      price: service.price,
      minPrice: service.price,
      maxPrice: null,
      description: service.description,
      estimatedDuration: service.duration || 60,
    }

    return NextResponse.json({ service: mappedService }, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
