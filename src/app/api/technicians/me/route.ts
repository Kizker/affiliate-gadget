import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET /api/technicians/me - Get current user's technician profile
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find technician profile for this user
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        services: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    if (!technician) {
      return NextResponse.json(
        { error: 'Technician profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(technician)
  } catch (error) {
    console.error('Error fetching technician profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
