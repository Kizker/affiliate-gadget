import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { createLiveKitToken } from '@/lib/livekit'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: streamId } = await params
    const { searchParams } = new URL(req.url)
    const roleParam = searchParams.get('role') || 'viewer'
    const guestNameParam = searchParams.get('name') || 'Penonton'

    // 1. Fetch live stream details
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Sesi live stream tidak ditemukan' },
        { status: 404 }
      )
    }

    if (stream.status === 'ENDED') {
      return NextResponse.json(
        { success: false, error: 'Siaran ini telah berakhir' },
        { status: 400 }
      )
    }

    // 2. Authenticate session
    const session = await auth()
    const user = session?.user

    const wantsBroadcaster = roleParam === 'broadcaster'

    let isBroadcaster = false
    let participantIdentity = ''
    let participantName = ''

    if (wantsBroadcaster) {
      // Broadcaster role guard
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: 'Autentikasi diperlukan untuk menjadi host',
          },
          { status: 401 }
        )
      }

      const isSuperAdmin = user.role === 'SUPER_ADMIN'
      const isStoreAdmin = user.role === 'STORE_ADMIN'

      if (!isSuperAdmin && !isStoreAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: 'Akses ditolak: Hanya admin toko yang dapat menyiarkan',
          },
          { status: 403 }
        )
      }

      // If STORE_ADMIN, ensure ownership of the store
      if (isStoreAdmin && stream.storeId && (user as any).storeId) {
        if (stream.storeId !== (user as any).storeId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Akses ditolak: Anda bukan pemilik toko ini',
            },
            { status: 403 }
          )
        }
      }

      isBroadcaster = true
      participantIdentity = user.id || `host-${stream.storeId || 'unknown'}`
      participantName = user.name || stream.store?.name || 'Host Toko'
    } else {
      // Viewer role
      isBroadcaster = false
      if (user) {
        participantIdentity = user.id || `user-${Date.now()}`
        participantName = user.name || 'Penonton'
      } else {
        const randomId = Math.random().toString(36).slice(2, 9)
        participantIdentity = `guest-${randomId}`
        participantName = guestNameParam.slice(0, 30) || 'Penonton'
      }
    }

    // 3. Resolve room name
    let roomName = stream.livekitRoomName
    if (!roomName) {
      roomName = `ag-live-${stream.id}`
      // Persist generated room name to stream record
      await prisma.liveStream.update({
        where: { id: stream.id },
        data: { livekitRoomName: roomName },
      })
    }

    // 4. Generate LiveKit token
    const token = await createLiveKitToken({
      roomName,
      participantIdentity,
      participantName,
      isBroadcaster,
      metadata: {
        role: isBroadcaster ? 'host' : 'viewer',
        storeId: stream.storeId,
      },
    })

    const livekitWsUrl =
      process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL || ''

    return NextResponse.json({
      success: true,
      data: {
        token,
        wsUrl: livekitWsUrl,
        roomName,
        isBroadcaster,
        identity: participantIdentity,
        name: participantName,
      },
    })
  } catch (error: any) {
    console.error('Error generating LiveKit token:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal menghasilkan token LiveKit',
      },
      { status: 500 }
    )
  }
}
