import prisma from '@/lib/db'
import { getLiveKitRoomService } from '@/lib/livekit'

/**
 * Batas waktu toleransi stream terputus tanpa heartbeat sebelum otomatis diakhiri (10 Menit).
 */
export const LIVE_STREAM_DISCONNECT_TIMEOUT_MS = 10 * 60 * 1000 // 10 menit dalam milidetik

export interface AutoEndResult {
  endedStreamIds: string[]
  totalChecked: number
  totalEnded: number
}

/**
 * Membersihkan seluruh sesi live stream yang berstatus 'LIVE' namun tidak tersambung
 * (tidak ada heartbeat / ping / snapshot / aktivitas) selama 10 menit atau lebih.
 */
export async function cleanupStaleLiveStreams(): Promise<AutoEndResult> {
  const result: AutoEndResult = {
    endedStreamIds: [],
    totalChecked: 0,
    totalEnded: 0,
  }

  try {
    const cutoffTime = new Date(Date.now() - LIVE_STREAM_DISCONNECT_TIMEOUT_MS)

    // Cari seluruh stream berstatus LIVE
    const liveStreams = await prisma.liveStream.findMany({
      where: {
        status: 'LIVE',
      },
      select: {
        id: true,
        title: true,
        livekitRoomName: true,
        startedAt: true,
        lastPingAt: true,
        updatedAt: true,
        createdAt: true,
      },
    })

    result.totalChecked = liveStreams.length
    if (liveStreams.length === 0) {
      return result
    }

    const streamsToEnd: typeof liveStreams = []

    for (const stream of liveStreams) {
      // Prioritaskan lastPingAt jika ada, fallback ke updatedAt, lalu startedAt/createdAt
      const lastActivityTime =
        stream.lastPingAt ||
        stream.updatedAt ||
        stream.startedAt ||
        stream.createdAt

      if (!lastActivityTime) {
        streamsToEnd.push(stream)
        continue
      }

      const diffMs = Date.now() - new Date(lastActivityTime).getTime()
      if (diffMs >= LIVE_STREAM_DISCONNECT_TIMEOUT_MS) {
        streamsToEnd.push(stream)
      }
    }

    if (streamsToEnd.length === 0) {
      return result
    }

    const streamIdsToEnd = streamsToEnd.map((s) => s.id)
    const now = new Date()

    // Update status di database menjadi ENDED
    await prisma.liveStream.updateMany({
      where: {
        id: { in: streamIdsToEnd },
        status: 'LIVE',
      },
      data: {
        status: 'ENDED',
        endedAt: now,
      },
    })

    result.endedStreamIds = streamIdsToEnd
    result.totalEnded = streamsToEnd.length

    // Bersihkan LiveKit cloud room secara non-blocking
    for (const stream of streamsToEnd) {
      const roomName = stream.livekitRoomName || `ag-live-${stream.id}`
      try {
        const roomService = getLiveKitRoomService()
        roomService.deleteRoom(roomName).catch(() => {})
      } catch {
        // Abaikan jika LiveKit service tidak tersedia
      }

      console.warn(
        `[LIVE STREAM AUTO-END]: Sesi "${stream.title}" (${stream.id}) otomatis diakhiri karena tidak tersambung >= 10 menit.`
      )
    }

    return result
  } catch (error) {
    console.error('[CLEANUP STALE LIVE STREAMS ERROR]:', error)
    return result
  }
}

/**
 * Mengecek dan mengakhiri satu stream secara langsung jika terputus >= 10 menit.
 */
export async function checkAndAutoEndSingleStream(
  stream: {
    id: string
    status: string
    title?: string
    livekitRoomName?: string | null
    startedAt?: Date | null
    lastPingAt?: Date | null
    updatedAt?: Date | null
    createdAt?: Date | null
  } | null
): Promise<{ ended: boolean; stream: any }> {
  if (!stream || stream.status !== 'LIVE') {
    return { ended: false, stream }
  }

  const lastActivityTime =
    stream.lastPingAt ||
    stream.updatedAt ||
    stream.startedAt ||
    stream.createdAt
  const diffMs = lastActivityTime
    ? Date.now() - new Date(lastActivityTime).getTime()
    : Infinity

  if (diffMs >= LIVE_STREAM_DISCONNECT_TIMEOUT_MS) {
    try {
      const now = new Date()
      const updated = await prisma.liveStream.update({
        where: { id: stream.id },
        data: {
          status: 'ENDED',
          endedAt: now,
        },
      })

      const roomName = stream.livekitRoomName || `ag-live-${stream.id}`
      try {
        const roomService = getLiveKitRoomService()
        roomService.deleteRoom(roomName).catch(() => {})
      } catch {
        // Non-blocking
      }

      console.warn(
        `[LIVE STREAM AUTO-END SINGLE]: Sesi "${stream.title || stream.id}" otomatis diakhiri karena tidak tersambung >= 10 menit.`
      )

      return { ended: true, stream: updated }
    } catch (err) {
      console.error('[AUTO END SINGLE STREAM ERROR]:', err)
      return { ended: false, stream }
    }
  }

  return { ended: false, stream }
}

/**
 * Mencatat detak jantung (heartbeat) aktif dari broadcaster.
 */
export async function recordStreamHeartbeat(streamId: string) {
  const now = new Date()
  return await prisma.liveStream.update({
    where: { id: streamId },
    data: {
      lastPingAt: now,
    },
  })
}
