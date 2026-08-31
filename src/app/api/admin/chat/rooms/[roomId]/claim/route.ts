import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

import { isAdminStaffRole } from '@/lib/dashboard-utils'

// POST - Claim a chat room
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or staff
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    })

    if (!user || !isAdminStaffRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { roomId } = await params

    // Get the room
    const room = await prisma.adminChatRoom.findUnique({
      where: { id: roomId },
      include: {
        claimedBy: {
          select: { id: true, name: true },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if room is already claimed
    if (room.claimedById) {
      if (room.claimedById === session.user.id) {
        return NextResponse.json({
          message: 'Room already claimed by you',
          room,
        })
      }
      return NextResponse.json(
        {
          error: `Room already claimed by ${room.claimedBy?.name || 'another admin'}`,
        },
        { status: 409 }
      )
    }

    // Claim the room
    const updatedRoom = await prisma.adminChatRoom.update({
      where: { id: roomId },
      data: {
        claimedById: session.user.id,
        claimedAt: new Date(),
      },
      include: {
        claimedBy: {
          select: { id: true, name: true },
        },
        customer: {
          select: { id: true, name: true, email: true },
        },
        order: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
    })

    return NextResponse.json({
      message: 'Room claimed successfully',
      room: updatedRoom,
    })
  } catch (error) {
    console.error('Error claiming room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
