import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/live-streams/[id]/chat — Fetch recent chat history (initial 50 comments)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: streamId } = await params
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const comments = await prisma.liveStreamComment.findMany({
      where: { streamId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: {
        id: true,
        streamId: true,
        userId: true,
        userName: true,
        userAvatar: true,
        message: true,
        type: true,
        metadata: true,
        isPinned: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, data: comments })
  } catch (error) {
    console.error('Error fetching stream chat history:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat riwayat pesan' },
      { status: 500 }
    )
  }
}

// POST /api/live-streams/[id]/chat — HTTP fallback for posting chat message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: streamId } = await params
  try {
    const body = await req.json()
    const { userName, userAvatar, message, isPinned, type, metadata, userId } =
      body

    if (!message?.trim() || !userName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'userName dan message wajib diisi' },
        { status: 400 }
      )
    }

    const cleanMessage = message
      .trim()
      .replace(/<[^>]*>?/gm, '')
      .slice(0, 300)

    // Persist to DB
    const comment = await prisma.liveStreamComment.create({
      data: {
        streamId,
        userId: userId || null,
        userName: userName.trim().slice(0, 50),
        userAvatar: userAvatar || null,
        message: cleanMessage,
        isPinned: isPinned || false,
        type: type || 'CHAT',
        metadata: metadata || null,
      },
    })

    return NextResponse.json({ success: true, data: comment }, { status: 201 })
  } catch (error) {
    console.error('Error posting chat:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan pesan' },
      { status: 500 }
    )
  }
}
