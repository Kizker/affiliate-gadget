import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/technicians/[id] - Public technician detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid technician ID' },
        { status: 400 }
      )
    }

    const technician = await db.technician.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            phone: true,
            email: true,
            isActive: true,
          },
        },
        services: {
          where: {
            isActive: true,
          },
          orderBy: {
            category: 'asc',
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

    // Check if user exists and is active
    if (!technician.user) {
      console.error(`Technician ${id} has no associated user`)
      return NextResponse.json(
        { error: 'Technician data is incomplete' },
        { status: 404 }
      )
    }

    if (!technician.user.isActive) {
      return NextResponse.json(
        { error: 'Technician not available' },
        { status: 404 }
      )
    }

    // Get reviews for this technician (from orders) with better error handling
    let reviews: any[] = []
    try {
      reviews = await db.review.findMany({
        where: {
          type: 'TECHNICIAN',
          order: {
            technicianId: id,
          },
        },
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
      })
    } catch (reviewError) {
      console.error(`Error fetching reviews for technician ${id}:`, reviewError)
      // Continue without reviews rather than failing the entire request
      reviews = []
    }

    // Ensure all required fields have fallback values
    const safeResponse = {
      ...technician,
      user: {
        ...technician.user,
        name: technician.user.name || 'Teknisi',
        image: technician.user.image || null,
        phone: technician.user.phone || null,
      },
      bio: technician.bio || null,
      specialties: technician.specialties || [],
      services: technician.services || [],
      reviews: reviews || [],
    }

    return NextResponse.json(safeResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error fetching technician:', error)

    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
