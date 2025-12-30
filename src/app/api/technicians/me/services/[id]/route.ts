import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

// PATCH - Update service
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, category, price, minPrice, description, duration } = body

    // Verify service belongs to technician
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        technician: {
          select: { userId: true },
        },
      },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    if (service.technician.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use minPrice if provided (frontend sends this), otherwise use price
    const servicePrice =
      minPrice !== undefined && minPrice !== null && minPrice !== ''
        ? parseFloat(minPrice)
        : price !== undefined && price !== null && price !== ''
          ? parseFloat(price)
          : undefined

    // Update service
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(servicePrice !== undefined && { price: servicePrice }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration }),
      },
    })

    // Map response to frontend format
    const mappedService = {
      id: updatedService.id,
      name: updatedService.name,
      category: updatedService.category,
      price: updatedService.price,
      minPrice: updatedService.price,
      maxPrice: null,
      description: updatedService.description,
      estimatedDuration: updatedService.duration || 60,
    }

    return NextResponse.json({ service: mappedService })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify service belongs to technician
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        technician: {
          select: { userId: true },
        },
      },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    if (service.technician.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete service
    await prisma.service.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
