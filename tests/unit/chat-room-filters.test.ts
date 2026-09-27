import { describe, it, expect } from 'vitest'

interface MockRoom {
  id: string
  order?: { id: string; orderNumber: string } | null
  orderId?: string | null
  hasOrder?: boolean
  totalUnread?: number
  messages?: Array<{
    id?: string
    content: string
    isRead?: boolean
    messageType?: string
  }>
  _count?: {
    messages: number
  }
}

// Logic replicated from customer chat page
function isRoomUnread(room: MockRoom): boolean {
  const incomingUnread = (room._count?.messages || 0) > 0
  const latestMsgUnread =
    room.messages?.[0] && room.messages[0].isRead === false
  const roomTotalUnread = (room.totalUnread || 0) > 0
  return incomingUnread || latestMsgUnread || roomTotalUnread
}

function isRoomOrder(room: MockRoom): boolean {
  return !!room.order || !!room.hasOrder || !!room.orderId
}

describe('Chat Room Filter Engine (Customer & Admin)', () => {
  describe('Belum Dibaca (UNREAD) Filter', () => {
    it('returns true when room has incoming unread messages (_count.messages > 0)', () => {
      const room: MockRoom = {
        id: 'room-1',
        _count: { messages: 2 },
      }
      expect(isRoomUnread(room)).toBe(true)
    })

    it('returns true when latest message sent is unread by other party (isRead === false)', () => {
      const room: MockRoom = {
        id: 'room-2',
        _count: { messages: 0 },
        messages: [{ content: 'Halo mas? Sepong?', isRead: false }],
      }
      expect(isRoomUnread(room)).toBe(true)
    })

    it('returns true when totalUnread > 0 from database aggregation', () => {
      const room: MockRoom = {
        id: 'room-3',
        totalUnread: 1,
        _count: { messages: 0 },
        messages: [{ content: 'Read message', isRead: true }],
      }
      expect(isRoomUnread(room)).toBe(true)
    })

    it('returns false when all messages are read', () => {
      const room: MockRoom = {
        id: 'room-4',
        _count: { messages: 0 },
        totalUnread: 0,
        messages: [{ content: 'Sudah dibaca', isRead: true }],
      }
      expect(isRoomUnread(room)).toBe(false)
    })
  })

  describe('Pesanan (ORDER) Filter', () => {
    it('includes room with direct order attached', () => {
      const room: MockRoom = {
        id: 'room-order-1',
        order: { id: 'ord-123', orderNumber: 'SPR-20260923-F9C71677' },
      }
      expect(isRoomOrder(room)).toBe(true)
    })

    it('includes room with orderId string populated', () => {
      const room: MockRoom = {
        id: 'room-order-2',
        orderId: 'ord-456',
      }
      expect(isRoomOrder(room)).toBe(true)
    })

    it('includes room with resolved hasOrder flag from order_reference messages', () => {
      const room: MockRoom = {
        id: 'room-order-3',
        hasOrder: true,
      }
      expect(isRoomOrder(room)).toBe(true)
    })

    it('excludes room that only has product questions (tanya-tanya produk)', () => {
      const room: MockRoom = {
        id: 'room-inquiry-1',
        order: null,
        orderId: null,
        hasOrder: false,
        messages: [
          {
            content:
              '{"type":"product_reference","productName":"Galaxy S24 Ultra"}',
            messageType: 'product_reference',
          },
        ],
      }
      expect(isRoomOrder(room)).toBe(false)
    })

    it('excludes room that only has general consultation without any order', () => {
      const room: MockRoom = {
        id: 'room-inquiry-2',
        order: null,
        orderId: null,
        hasOrder: false,
        messages: [
          {
            content: 'Halo mas teknisi, apakah bisa ganti baterai iPhone 13?',
            messageType: 'text',
          },
        ],
      }
      expect(isRoomOrder(room)).toBe(false)
    })
  })
})
