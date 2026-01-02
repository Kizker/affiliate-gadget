import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Search technicians and mitra for catalog sharing
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all' // technician, mitra, all

    const searchFilter = search
      ? {
          OR: [
            {
              user: {
                name: { contains: search, mode: 'insensitive' as const },
              },
            },
            {
              user: {
                email: { contains: search, mode: 'insensitive' as const },
              },
            },
          ],
        }
      : {}

    type TechnicianResult = {
      id: string
      user: {
        id: string
        name: string | null
        image: string | null
        email: string
        phone: string | null
      }
      rating: number
      totalReview: number
      experience: number
      specialties: string[]
    }
    type MitraResult = {
      id: string
      name: string | null
      image: string | null
      email: string
      phone: string | null
      createdAt: Date
    }
    let technicians: TechnicianResult[] = []
    let mitra: MitraResult[] = []

    if (type === 'technician' || type === 'all') {
      technicians = await prisma.technician.findMany({
        where: searchFilter,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
              phone: true,
            },
          },
        },
        take: 20,
        orderBy: { rating: 'desc' },
      })
    }

    if (type === 'mitra' || type === 'all') {
      mitra = await prisma.user.findMany({
        where: {
          role: 'MITRA',
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
          phone: true,
          createdAt: true,
        },
        take: 20,
      })
    }

    return NextResponse.json({
      technicians: technicians.map((t) => ({
        id: t.id,
        userId: t.user.id,
        name: t.user.name,
        image: t.user.image,
        email: t.user.email,
        phone: t.user.phone,
        rating: t.rating,
        totalReview: t.totalReview,
        experience: t.experience,
        specialties: t.specialties,
        type: 'technician',
      })),
      mitra: mitra.map((m) => ({
        id: m.id,
        name: m.name,
        image: m.image,
        email: m.email,
        phone: m.phone,
        createdAt: m.createdAt,
        type: 'mitra',
      })),
    })
  } catch (error) {
    console.error('Error searching technicians/mitra:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
