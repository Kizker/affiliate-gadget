import { NextResponse } from 'next/server'

/**
 * DEPRECATED: Frame-relay streaming has been retired in favor of LiveKit SFU (WebRTC).
 * Connect via LiveKit Cloud using /api/live-streams/[id]/livekit-token
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'STREAM_RELAY_DEPRECATED',
      message: 'Frame-relay HTTP streaming is retired. Use LiveKit SFU.',
    },
    { status: 410 }
  )
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'STREAM_RELAY_DEPRECATED',
      message: 'Frame-relay HTTP streaming is retired. Use LiveKit SFU.',
    },
    { status: 410 }
  )
}
