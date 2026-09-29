import { describe, it, expect, vi } from 'vitest'
import { roomManager } from '../../ws-server/room-manager'
import type { WsClientSession } from '../../ws-server/types'

describe('WebSocket Room Manager & Chat Logic', () => {
  const createMockWs = () => ({
    readyState: 1, // OPEN
    send: vi.fn(),
    close: vi.fn(),
    terminate: vi.fn(),
    ping: vi.fn(),
  })

  it('correctly tracks viewer count when clients join and leave a room', () => {
    const streamId = 'stream-test-room-1'
    const mockWs1 = createMockWs()
    const mockWs2 = createMockWs()

    const session1: WsClientSession = {
      ws: mockWs1 as any,
      userName: 'User 1',
      isBroadcaster: false,
      isAlive: true,
      joinedAt: Date.now(),
      lastMessageTime: 0,
      messageCountWindow: 0,
    }

    const session2: WsClientSession = {
      ws: mockWs2 as any,
      userName: 'User 2',
      isBroadcaster: false,
      isAlive: true,
      joinedAt: Date.now(),
      lastMessageTime: 0,
      messageCountWindow: 0,
    }

    // Join session 1
    roomManager.joinRoom(streamId, session1)
    expect(roomManager.getViewerCount(streamId)).toBe(1)

    // Join session 2
    roomManager.joinRoom(streamId, session2)
    expect(roomManager.getViewerCount(streamId)).toBe(2)

    // Leave session 1
    roomManager.leaveRoom(session1)
    expect(roomManager.getViewerCount(streamId)).toBe(1)

    // Leave session 2
    roomManager.leaveRoom(session2)
    expect(roomManager.getViewerCount(streamId)).toBe(0)
  })

  it('broadcasts messages to all connected sockets in a room', () => {
    const streamId = 'stream-test-broadcast'
    const mockWs1 = createMockWs()
    const mockWs2 = createMockWs()

    const session1: WsClientSession = {
      ws: mockWs1 as any,
      userName: 'Broadcaster',
      isBroadcaster: true,
      isAlive: true,
      joinedAt: Date.now(),
      lastMessageTime: 0,
      messageCountWindow: 0,
    }

    const session2: WsClientSession = {
      ws: mockWs2 as any,
      userName: 'Viewer',
      isBroadcaster: false,
      isAlive: true,
      joinedAt: Date.now(),
      lastMessageTime: 0,
      messageCountWindow: 0,
    }

    roomManager.joinRoom(streamId, session1)
    roomManager.joinRoom(streamId, session2)

    roomManager.broadcastToRoom(streamId, {
      type: 'chat',
      streamId,
      payload: { message: 'Halo semuanya!' },
    })

    expect(mockWs1.send).toHaveBeenCalled()
    expect(mockWs2.send).toHaveBeenCalled()

    // Clean up
    roomManager.leaveRoom(session1)
    roomManager.leaveRoom(session2)
  })

  it('manages pinned products per stream room', () => {
    const streamId = 'stream-test-pin'
    const mockWs = createMockWs()

    const session: WsClientSession = {
      ws: mockWs as any,
      userName: 'Admin',
      isBroadcaster: true,
      isAlive: true,
      joinedAt: Date.now(),
      lastMessageTime: 0,
      messageCountWindow: 0,
    }

    roomManager.joinRoom(streamId, session)

    roomManager.setPinnedProduct(streamId, {
      productId: 'prod-iphone-15',
      productTitle: 'iPhone 15 Pro Max',
      productPrice: 18000000,
    })

    expect(roomManager.getPinnedProduct(streamId)).toEqual({
      productId: 'prod-iphone-15',
      productTitle: 'iPhone 15 Pro Max',
      productPrice: 18000000,
    })

    // Unpin
    roomManager.setPinnedProduct(streamId, null)
    expect(roomManager.getPinnedProduct(streamId)).toBeNull()

    roomManager.leaveRoom(session)
  })
})
