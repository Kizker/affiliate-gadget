import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { serviceId, scheduleType, date, description, phoneType } = body

    // Validate required fields
    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service is required' },
        { status: 400 }
      )
    }

    if (!phoneType || phoneType.trim() === '') {
      return NextResponse.json(
        { error: 'Phone type is required' },
        { status: 400 }
      )
    }

    if (!description || description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    if (scheduleType === 'scheduled' && !date) {
      return NextResponse.json(
        { error: 'Date is required for scheduled booking' },
        { status: 400 }
      )
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        technician: true,
      },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Calculate pricing - use minPrice if available, otherwise use price
    const servicePrice =
      ('minPrice' in service && typeof service.minPrice === 'number'
        ? service.minPrice
        : null) ?? service.price
    const subtotal = servicePrice
    const tax = 0 // No tax
    const total = subtotal

    // Create order with order item
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        technicianId: service.technician.id,
        status: 'PENDING_PAYMENT',
        subtotal,
        tax,
        total,
        notes: `Jenis HP: ${phoneType}\n\n${description}`,
        items: {
          create: {
            type: 'SERVICE',
            serviceId: service.id,
            quantity: 1,
            price: servicePrice,
            subtotal: servicePrice,
          },
        },
      },
      include: {
        items: {
          include: {
            service: true,
          },
        },
        technician: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        service: order.items[0]?.service,
        technician: order.technician,
      },
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
