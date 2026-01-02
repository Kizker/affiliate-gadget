import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get technician profile
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
            phone: true,
          },
        },
        services: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            description: true,
          },
        },
      },
    })

    if (!technician) {
      return NextResponse.json(
        { error: 'Technician not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ technician })
  } catch (error) {
    console.error('Error fetching technician profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update technician profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bio, experience, specialties, isAvailable } = body

    // Get technician
    const existingTechnician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
    })

    if (!existingTechnician) {
      return NextResponse.json(
        { error: 'Technician not found' },
        { status: 404 }
      )
    }

    // Update technician
    const updatedTechnician = await prisma.technician.update({
      where: { id: existingTechnician.id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(experience !== undefined && { experience }),
        ...(specialties !== undefined && { specialties }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({ technician: updatedTechnician })
  } catch (error) {
    console.error('Error updating technician profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
