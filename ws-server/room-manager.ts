import { PrismaClient } from '@prisma/client'
import type { WebSocket } from 'ws'
import type { WsClientSession, WsMessage, WsPinProductPayload } from './types'

const prisma = new PrismaClient()

class WsRoomManager {
  // streamId -> Set of active client sessions
  private rooms = new Map<string, Set<WsClientSession>>()
  // streamId -> currently pinned product
  private pinnedProducts = new Map<string, WsPinProductPayload | null>()
  // streamId -> mirror view status (camera front mirror broadcast)
  private mirrorStates = new Map<string, boolean>()
  // streamId -> accumulator for burst likes
  private likeAccumulators = new Map<string, number>()
  // Timer for batch sync to database
  private syncInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startDbSyncLoop()
  }

  /**
   * Registers a client into a stream room
   */
  joinRoom(streamId: string, session: WsClientSession) {
    if (!this.rooms.has(streamId)) {
      this.rooms.set(streamId, new Set())
    }
    const room = this.rooms.get(streamId)!
    session.streamId = streamId
    room.add(session)

    // Broadcast updated viewer count to all clients in the room
    this.broadcastViewerCount(streamId)

    // If there is an active pinned product, send it to the newly joined client
    const pinned = this.pinnedProducts.get(streamId)
    if (pinned) {
      this.sendToClient(session.ws, {
        type: 'pin_product',
        streamId,
        payload: pinned,
        timestamp: Date.now(),
      })
    }

    // If there is an active mirror state, send it to the newly joined client
    const isMirrored = this.mirrorStates.get(streamId)
    if (typeof isMirrored === 'boolean') {
      this.sendToClient(session.ws, {
        type: 'mirror',
        streamId,
        payload: { isMirrored },
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Updates and broadcasts camera mirror state for a stream
   */
  setMirrorState(streamId: string, isMirrored: boolean) {
    this.mirrorStates.set(streamId, isMirrored)
    this.broadcastToRoom(streamId, {
      type: 'mirror',
      streamId,
      payload: { isMirrored },
      timestamp: Date.now(),
    })
  }

  /**
   * Removes a client from their active stream room
   */
  leaveRoom(session: WsClientSession) {
    const streamId = session.streamId
    if (!streamId) return

    const room = this.rooms.get(streamId)
    if (room) {
      room.delete(session)
      session.streamId = undefined

      if (room.size === 0) {
        this.rooms.delete(streamId)
        this.pinnedProducts.delete(streamId)
        this.likeAccumulators.delete(streamId)
      } else {
        this.broadcastViewerCount(streamId)
      }
    }
  }

  /**
   * Calculates current online viewers in a stream
   * Deduplicates by unique user account or client viewerId, excluding broadcasters.
   */
  getViewerCount(streamId: string): number {
    const room = this.rooms.get(streamId)
    if (!room || room.size === 0) return 0

    const uniqueViewers = new Set<string>()
    for (const session of room) {
      // Broadcasters / hosts are excluded from viewer count
      if (session.isBroadcaster) continue

      const key = session.userId
        ? `user:${session.userId}`
        : session.viewerId
          ? `guest:${session.viewerId}`
          : `sock:${session.userName}`

      uniqueViewers.add(key)
    }

    return uniqueViewers.size
  }

  /**
   * Broadcasts a message to all connected clients in a specific room
   */
  broadcastToRoom(streamId: string, message: WsMessage, excludeWs?: WebSocket) {
    const room = this.rooms.get(streamId)
    if (!room || room.size === 0) return

    const json = JSON.stringify({
      ...message,
      timestamp: message.timestamp || Date.now(),
    })

    for (const client of room) {
      if (excludeWs && client.ws === excludeWs) continue
      if (client.ws.readyState === 1 /* OPEN */) {
        try {
          client.ws.send(json)
        } catch {
          // Socket might have closed abruptly
        }
      }
    }
  }

  /**
   * Sends a direct message to a specific client WebSocket
   */
  sendToClient(ws: WebSocket, message: WsMessage) {
    if (ws.readyState === 1 /* OPEN */) {
      try {
        ws.send(
          JSON.stringify({
            ...message,
            timestamp: message.timestamp || Date.now(),
          })
        )
      } catch {
        // Socket closed
      }
    }
  }

  /**
   * Updates and broadcasts current viewer count for a stream
   */
  broadcastViewerCount(streamId: string) {
    const count = this.getViewerCount(streamId)
    this.broadcastToRoom(streamId, {
      type: 'viewer_count',
      streamId,
      payload: { count },
    })
  }

  /**
   * Sets pinned product and broadcasts to the room
   */
  setPinnedProduct(streamId: string, product: WsPinProductPayload | null) {
    this.pinnedProducts.set(streamId, product)
    if (product) {
      this.broadcastToRoom(streamId, {
        type: 'pin_product',
        streamId,
        payload: product,
      })
    } else {
      this.broadcastToRoom(streamId, {
        type: 'unpin_product',
        streamId,
      })
    }
  }

  getPinnedProduct(streamId: string): WsPinProductPayload | null {
    return this.pinnedProducts.get(streamId) || null
  }

  /**
   * Accumulates likes for burst batching
   */
  recordLike(streamId: string, count: number = 1) {
    const current = this.likeAccumulators.get(streamId) || 0
    this.likeAccumulators.set(streamId, current + count)
  }

  /**
   * Periodic background loop to sync viewer count to PostgreSQL
   * without overwhelming the database with high-frequency writes.
   */
  private startDbSyncLoop() {
    this.syncInterval = setInterval(async () => {
      if (this.rooms.size === 0) return

      for (const [streamId] of this.rooms.entries()) {
        const viewerCount = this.getViewerCount(streamId)
        try {
          await prisma.liveStream.update({
            where: { id: streamId },
            data: { viewerCount },
          })
        } catch {
          // Stream might have been deleted or database temporarily busy
        }
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * Clean up background resources on shutdown
   */
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    prisma.$disconnect().catch(() => {})
  }
}

export const roomManager = new WsRoomManager()
export { prisma }
