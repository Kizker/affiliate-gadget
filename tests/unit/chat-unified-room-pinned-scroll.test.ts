import { describe, it, expect } from 'vitest'

describe('Chat Unified Room & Dynamic Pinned Order Context (Unit Tests)', () => {
  describe('1. Empty Room Filtering & Abandoned Room Cleanup', () => {
    it('should filter out chat rooms that have zero messages from the active sidebar room list', () => {
      const mockRooms = [
        {
          id: 'room-1',
          customer: { name: 'Rian Pratama' },
          messages: [{ id: 'm-1', content: 'Halo gan' }],
          _count: { messages: 1 },
        },
        {
          id: 'room-2',
          customer: { name: 'Affiliate Gadget' },
          messages: [],
          _count: { messages: 0 },
        },
        {
          id: 'room-3',
          customer: { name: 'Siti Aminah' },
          messages: [],
          _count: { messages: 0 },
        },
      ]

      // Filter: only retain rooms with at least 1 message
      const visibleRooms = mockRooms.filter(
        (r) => (r._count?.messages || r.messages.length) > 0
      )

      expect(visibleRooms).toHaveLength(1)
      expect(visibleRooms[0].id).toBe('room-1')
      expect(visibleRooms[0].customer.name).toBe('Rian Pratama')
    })

    it('should detect abandoned empty rooms eligible for deletion', () => {
      const now = Date.now()
      const roomsInDb = [
        {
          id: 'room-active',
          messageCount: 5,
          createdAt: new Date(now - 10 * 60 * 1000),
        },
        {
          id: 'room-empty-fresh',
          messageCount: 0,
          createdAt: new Date(now - 10 * 1000), // 10s ago (fresh user typing)
        },
        {
          id: 'room-empty-abandoned',
          messageCount: 0,
          createdAt: new Date(now - 60 * 1000), // 60s ago (abandoned, did not chat)
        },
      ]

      const cleanupThresholdMs = 30 * 1000
      const toDelete = roomsInDb.filter(
        (r) =>
          r.messageCount === 0 &&
          now - r.createdAt.getTime() > cleanupThresholdMs
      )

      expect(toDelete).toHaveLength(1)
      expect(toDelete[0].id).toBe('room-empty-abandoned')
    })
  })

  describe('2. Unified Room per Customer & Store', () => {
    it('should reuse existing room when inquiring about a new order from the same store', () => {
      const existingRooms = [
        {
          id: 'room-roxy-101',
          customerId: 'cust-123',
          storeId: 'store-roxy',
          orderId: 'order-1',
        },
      ]

      const handleGetOrCreateRoom = (
        customerId: string,
        storeId: string,
        newOrderId: string
      ) => {
        const room = existingRooms.find(
          (r) => r.customerId === customerId && r.storeId === storeId
        )

        if (room) {
          // Update orderId on the SAME room
          room.orderId = newOrderId
          return { room, isNew: false }
        }

        const newRoom = {
          id: 'room-new',
          customerId,
          storeId,
          orderId: newOrderId,
        }
        existingRooms.push(newRoom)
        return { room: newRoom, isNew: true }
      }

      // Customer asks about another order from Roxy Store
      const result = handleGetOrCreateRoom('cust-123', 'store-roxy', 'order-2')

      expect(result.isNew).toBe(false)
      expect(result.room.id).toBe('room-roxy-101')
      expect(result.room.orderId).toBe('order-2')
      expect(existingRooms).toHaveLength(1) // Still exactly 1 room
    })
  })

  describe('3. WhatsApp-Style Dynamic Pinned Order Context on Scroll', () => {
    it('should extract all order context cards from messages and order references', () => {
      const messages = [
        {
          id: 'msg-order-1',
          messageType: 'order_reference',
          content: JSON.stringify({
            orderNumber: 'SPR-20261001-0001',
            orderId: 'order-1',
            orderTotal: 5233398,
            status: 'COMPLETED',
          }),
        },
        {
          id: 'msg-text-1',
          messageType: 'text',
          content: 'Halo admin mau tanya tentang pesanan ini',
        },
        {
          id: 'msg-order-2',
          messageType: 'order_reference',
          content: JSON.stringify({
            orderNumber: 'SPR-20261001-0002',
            orderId: 'order-2',
            orderTotal: 12500000,
            status: 'PROCESSING',
          }),
        },
        {
          id: 'msg-text-2',
          messageType: 'text',
          content: 'Dan untuk pesanan kedua ini bagaimana pengirimannya?',
        },
      ]

      const extractContexts = (msgs: typeof messages) => {
        const list: Array<{
          messageId: string
          orderNumber: string
          total: number
          status: string
        }> = []
        const seen = new Set<string>()

        for (const msg of msgs) {
          if (msg.messageType === 'order_reference') {
            const data = JSON.parse(msg.content)
            if (data.orderNumber && !seen.has(data.orderNumber)) {
              seen.add(data.orderNumber)
              list.push({
                messageId: msg.id,
                orderNumber: data.orderNumber,
                total: data.orderTotal,
                status: data.status,
              })
            }
          }
        }
        return list
      }

      const contexts = extractContexts(messages)
      expect(contexts).toHaveLength(2)
      expect(contexts[0].orderNumber).toBe('SPR-20261001-0001')
      expect(contexts[1].orderNumber).toBe('SPR-20261001-0002')
    })

    it('should update active pinned order context based on scroll position', () => {
      const contexts = [
        { messageId: 'm1', orderNumber: 'SPR-1001', total: 5000000 },
        { messageId: 'm2', orderNumber: 'SPR-1002', total: 7500000 },
      ]

      // Mock DOM positions (rect.top relative to viewport)
      const calculateActiveContext = (
        thresholdY: number,
        elementTops: Record<string, number>
      ) => {
        let active = contexts[0]
        for (const ctx of contexts) {
          const top = elementTops[ctx.messageId]
          if (top !== undefined && top <= thresholdY) {
            active = ctx
          }
        }
        return active
      }

      const thresholdY = 200

      // Scenario A: User is at the top of the chat (Order 1 visible, Order 2 far below at 800px)
      const topState = calculateActiveContext(thresholdY, {
        m1: 150, // <= 200 -> Order 1
        m2: 800, // > 200
      })
      expect(topState.orderNumber).toBe('SPR-1001')

      // Scenario B: User scrolls down past Order 2 (Order 1 scrolled out at -300px, Order 2 reached 180px)
      const scrolledState = calculateActiveContext(thresholdY, {
        m1: -300, // passed
        m2: 180, // <= 200 -> Order 2 is now active pinned context
      })
      expect(scrolledState.orderNumber).toBe('SPR-1002')
    })
  })
})
