import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// In-memory SSE subscriber registry: streamId → Set<ReadableStreamController>
const subscribers = new Map<string, Set<ReadableStreamDefaultController>>()

function broadcast(streamId: string, data: object) {
  const subs = subscribers.get(streamId)
  if (!subs) return
  const payload = `data: ${JSON.stringify(data)}\n\n`
  const encoder = new TextEncoder()
  for (const ctrl of subs) {
    try {
      ctrl.enqueue(encoder.encode(payload))
    } catch {
      // Client disconnected — will be cleaned up in cancel
    }
  }
}

// GET /api/live-streams/[id]/chat — SSE stream for real-time chat
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: streamId } = await params

  const stream = new ReadableStream({
    start(controller) {
      // Register subscriber
      if (!subscribers.has(streamId)) {
        subscribers.set(streamId, new Set())
      }
      subscribers.get(streamId)!.add(controller)

      // Send initial ping to confirm connection
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(`: connected\n\n`))

      // Send viewer count update
      const viewerCount = subscribers.get(streamId)?.size ?? 0
      broadcast(streamId, { type: 'viewers', count: viewerCount })

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        subscribers.get(streamId)?.delete(controller)
        try {
          controller.close()
        } catch {
          /* already closed */
        }
        // Update viewer count after disconnect
        const newCount = subscribers.get(streamId)?.size ?? 0
        broadcast(streamId, { type: 'viewers', count: newCount })
      })
    },
    cancel(controller) {
      for (const [sid, subs] of subscribers) {
        subs.delete(controller)
        if (subs.size === 0) subscribers.delete(sid)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// POST /api/live-streams/[id]/chat — Send a chat message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: streamId } = await params
  try {
    const body = await req.json()
    const { userName, userAvatar, message, isPinned } = body

    if (!message?.trim() || !userName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'userName dan message wajib diisi' },
        { status: 400 }
      )
    }

    // Persist to DB
    const comment = await prisma.liveStreamComment.create({
      data: {
        streamId,
        userName: userName.trim(),
        userAvatar: userAvatar || null,
        message: message.trim(),
        isPinned: isPinned || false,
      },
    })

    // Broadcast to all SSE subscribers
    broadcast(streamId, {
      type: 'chat',
      data: comment,
    })

    // Update viewer count in real-time
    const viewerCount = subscribers.get(streamId)?.size ?? 0
    broadcast(streamId, { type: 'viewers', count: viewerCount })

    return NextResponse.json({ success: true, data: comment })
  } catch (error) {
    console.error('Error posting chat:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengirim pesan' },
      { status: 500 }
    )
  }
}
