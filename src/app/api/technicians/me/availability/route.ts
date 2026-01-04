import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET: Get current availability status
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { isAvailable: true },
    })

    if (!technician) {
      return NextResponse.json(
        { error: 'Technician profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ isAvailable: technician.isAvailable })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Toggle availability status
export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { isAvailable } = body

    if (typeof isAvailable !== 'boolean') {
      return NextResponse.json(
        { error: 'isAvailable must be a boolean' },
        { status: 400 }
      )
    }

    const technician = await prisma.technician.update({
      where: { userId: session.user.id },
      data: { isAvailable },
      select: {
        id: true,
        isAvailable: true,
        user: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      isAvailable: technician.isAvailable,
      message: technician.isAvailable
        ? 'Status berhasil diaktifkan. Anda sekarang dapat menerima pesanan baru.'
        : 'Status berhasil dinonaktifkan. Anda tidak akan muncul di pencarian pelanggan.',
    })
  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
