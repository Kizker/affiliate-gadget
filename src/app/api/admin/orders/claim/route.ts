import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// Claim an order
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, claimedById: true, orderNumber: true, userId: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if already claimed by someone else
    if (order.claimedById && order.claimedById !== session.user.id) {
      // Only SUPER_ADMIN can override claim
      if (session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          {
            error: 'Order already claimed by another admin',
          },
          { status: 403 }
        )
      }
    }

    // Claim the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        claimedById: session.user.id,
        claimedAt: new Date(),
      },
      include: {
        claimedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Also claim the associated admin chat room if exists, or create if not exists
    const existingRoom = await prisma.adminChatRoom.findFirst({
      where: { orderId: orderId },
    })

    if (existingRoom) {
      // Update existing room
      await prisma.adminChatRoom.update({
        where: { id: existingRoom.id },
        data: {
          claimedById: session.user.id,
          claimedAt: new Date(),
        },
      })
    } else {
      // Create new chat room for this order
      await prisma.adminChatRoom.create({
        data: {
          customerId: order.userId,
          orderId: orderId,
          claimedById: session.user.id,
          claimedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order ${order.orderNumber} claimed successfully`,
    })
  } catch (error) {
    console.error('Error claiming order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Unclaim an order
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, claimedById: true, orderNumber: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only the claimant or SUPER_ADMIN can unclaim
    if (
      order.claimedById !== session.user.id &&
      session.user.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        {
          error: 'Only the claiming admin or SUPER_ADMIN can unclaim',
        },
        { status: 403 }
      )
    }

    // Unclaim the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        claimedById: null,
        claimedAt: null,
      },
    })

    // Also unclaim the associated admin chat room if exists
    await prisma.adminChatRoom.updateMany({
      where: { orderId: orderId },
      data: {
        claimedById: null,
        claimedAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order ${order.orderNumber} unclaimed successfully`,
    })
  } catch (error) {
    console.error('Error unclaiming order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
