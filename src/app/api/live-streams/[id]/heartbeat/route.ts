import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import {
  recordStreamHeartbeat,
  checkAndAutoEndSingleStream,
} from '@/lib/live-stream-auto-end'

/**
 * POST /api/live-streams/[id]/heartbeat
 * Endpoint detak jantung (heartbeat) aktif host/broadcaster.
 * Dikirim setiap 20-30 detik oleh broadcaster studio untuk menandai siaran aktif.
 * Jika dalam 10 menit tidak ada heartbeat yang masuk, stream otomatis berakhir.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const stream = await prisma.liveStream.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        startedAt: true,
        lastPingAt: true,
        updatedAt: true,
        livekitRoomName: true,
      },
    })

    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Sesi live stream tidak ditemukan' },
        { status: 404 }
      )
    }

    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // Body opsional
    }

    const { action } = body

    // Jika sinyal disconnect dikirim saat host menutup browser (beforeunload / pagehide beacon)
    if (action === 'disconnect') {
      // Jika host menutup sesi secara eksplisit atau keluar
      const now = new Date()
      const updated = await prisma.liveStream.update({
        where: { id },
        data: {
          status: 'ENDED',
          endedAt: now,
        },
      })
      return NextResponse.json({
        success: true,
        message: 'Sesi live telah diakhiri karena host terputus / keluar',
        data: updated,
      })
    }

    // Jika stream sudah berakhir
    if (stream.status === 'ENDED') {
      return NextResponse.json({
        success: false,
        error: 'Sesi live stream sudah berakhir',
        status: 'ENDED',
      })
    }

    // Cek apakah sebelumnya stream terputus >= 10 menit
    const checkResult = await checkAndAutoEndSingleStream(stream)
    if (checkResult.ended) {
      return NextResponse.json({
        success: false,
        error:
          'Sesi live stream telah otomatis diakhiri karena terputus lebih dari 10 menit',
        status: 'ENDED',
      })
    }

    // Catat heartbeat aktif
    const updated = await recordStreamHeartbeat(id)

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      status: updated.status,
    })
  } catch (error) {
    console.error('[LIVE STREAM HEARTBEAT ERROR]:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memproses heartbeat stream' },
      { status: 500 }
    )
  }
}
