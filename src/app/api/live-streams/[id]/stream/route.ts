import { NextRequest, NextResponse } from 'next/server'

// In-memory registry for real-time live camera streams
// streamId -> { latestFrame: string, updatedAt: number, viewers: Map<string, any> }
interface StreamSession {
  latestFrame: string | null
  updatedAt: number
  offers: Map<string, any> // viewerId -> offer
  answers: Map<string, any> // viewerId -> answer
  candidates: Map<string, any[]> // viewerId -> candidate[]
  pendingViewers: Set<string>
}

// Global in-memory storage (preserved across route invocations in Next.js dev & prod)
const globalStore = global as unknown as {
  __live_sessions?: Map<string, StreamSession>
}
if (!globalStore.__live_sessions) {
  globalStore.__live_sessions = new Map<string, StreamSession>()
}
const sessions = globalStore.__live_sessions

function getSession(streamId: string): StreamSession {
  if (!sessions.has(streamId)) {
    sessions.set(streamId, {
      latestFrame: null,
      updatedAt: Date.now(),
      offers: new Map(),
      answers: new Map(),
      candidates: new Map(),
      pendingViewers: new Set(),
    })
  }
  return sessions.get(streamId)!
}

// GET /api/live-streams/[id]/stream — Get stream state, frame, or WebRTC signaling
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: streamId } = await params
  const { searchParams } = new URL(req.url)
  const viewerId = searchParams.get('viewerId')
  const action = searchParams.get('action') // 'frame' | 'signal' | 'status'

  const session = getSession(streamId)

  // 1. Fetch latest camera frame
  if (action === 'frame') {
    const isStale = Date.now() - session.updatedAt > 5000
    return NextResponse.json({
      success: true,
      frame: isStale ? null : session.latestFrame,
      isLive: !isStale && !!session.latestFrame,
      timestamp: session.updatedAt,
    })
  }

  // 2. Fetch WebRTC signals for viewer
  if (action === 'signal' && viewerId) {
    const offer = session.offers.get(viewerId) || null
    const candidates = session.candidates.get(viewerId) || []
    return NextResponse.json({
      success: true,
      offer,
      candidates,
    })
  }

  // 3. For Broadcaster: check joined viewers who need WebRTC offers
  if (action === 'broadcaster-poll') {
    const pending = Array.from(session.pendingViewers)
    const answers: Record<string, any> = {}
    for (const [vid, ans] of session.answers.entries()) {
      answers[vid] = ans
    }
    return NextResponse.json({
      success: true,
      pendingViewers: pending,
      answers,
    })
  }

  return NextResponse.json({
    success: true,
    isLive: Date.now() - session.updatedAt < 5000 && !!session.latestFrame,
    updatedAt: session.updatedAt,
  })
}

// POST /api/live-streams/[id]/stream — Push camera frame or WebRTC signaling
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: streamId } = await params
  try {
    const body = await req.json()
    const { action, frame, viewerId, offer, answer, candidate } = body
    const session = getSession(streamId)

    // 1. Admin broadcasts live camera frame
    if (action === 'frame' && frame) {
      session.latestFrame = frame
      session.updatedAt = Date.now()
      return NextResponse.json({ success: true })
    }

    // 2. Viewer joins and asks for WebRTC connection
    if (action === 'viewer-join' && viewerId) {
      session.pendingViewers.add(viewerId)
      return NextResponse.json({ success: true })
    }

    // 3. Broadcaster sends WebRTC offer to viewer
    if (action === 'webrtc-offer' && viewerId && offer) {
      session.offers.set(viewerId, offer)
      session.pendingViewers.delete(viewerId)
      return NextResponse.json({ success: true })
    }

    // 4. Viewer sends WebRTC answer to broadcaster
    if (action === 'webrtc-answer' && viewerId && answer) {
      session.answers.set(viewerId, answer)
      return NextResponse.json({ success: true })
    }

    // 5. ICE Candidate exchange
    if (action === 'webrtc-candidate' && viewerId && candidate) {
      const list = session.candidates.get(viewerId) || []
      list.push(candidate)
      session.candidates.set(viewerId, list)
      return NextResponse.json({ success: true })
    }

    // 6. Broadcaster ends stream
    if (action === 'end-stream') {
      session.latestFrame = null
      session.offers.clear()
      session.answers.clear()
      session.candidates.clear()
      session.pendingViewers.clear()
      sessions.delete(streamId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error handling stream signaling:', error)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
