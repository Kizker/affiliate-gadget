import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// PATCH - Edit admin chat message
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = await params
    const body = await req.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    // Verify message belongs to current user
    const message = await prisma.adminChatMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.senderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Cannot edit messages from other users' },
        { status: 403 }
      )
    }

    // Update message
    const updatedMessage = await prisma.adminChatMessage.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
      },
      select: {
        id: true,
        content: true,
        messageType: true,
        mediaUrl: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({ message: updatedMessage })
  } catch (error) {
    console.error('Error editing admin message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete admin chat message
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = await params

    // Verify message belongs to current user
    const message = await prisma.adminChatMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.senderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete messages from other users' },
        { status: 403 }
      )
    }

    // Delete message
    await prisma.adminChatMessage.delete({
      where: { id: messageId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting admin message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
