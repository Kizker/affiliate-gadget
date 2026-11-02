import { describe, it, expect } from 'vitest'

describe('Unified Single Room per Customer & Deduplication System', () => {
  describe('1. Unified Room Resolution & Reuse', () => {
    it('should reuse existing chat room when inquiring about a new order from the same store and customer', () => {
      const existingRooms = [
        {
          id: 'room-roxy-existing',
          customerId: 'cust-rian',
          storeId: 'store-roxy',
          orderId: 'order-old-123',
          lastMessageAt: new Date('2026-09-08T15:30:00Z'),
          messages: [
            { id: 'm-1', content: 'Halo toko' },
            { id: 'm-2', content: 'Ada stok iPhone 15?' },
          ],
        },
      ]

      // Simulation of POST /api/admin/chat/rooms and /api/customer/chat/store-room logic
      const resolveRoom = (
        customerId: string,
        targetStoreId: string,
        newOrderId: string,
        isReturnInquiry: boolean
      ) => {
        // 1. Search existing room by customerId and targetStoreId
        const matchedRoom = existingRooms.find(
          (r) => r.customerId === customerId && r.storeId === targetStoreId
        )

        if (matchedRoom) {
          // Re-use existing room, update orderId and lastMessageAt
          if (newOrderId && matchedRoom.orderId !== newOrderId) {
            matchedRoom.orderId = newOrderId
          }
          matchedRoom.lastMessageAt = new Date('2026-11-02T16:00:00Z')
          return { room: matchedRoom, isNew: false }
        }

        // Only create if completely absent
        const createdRoom = {
          id: 'room-new',
          customerId,
          storeId: targetStoreId,
          orderId: newOrderId,
          lastMessageAt: new Date(),
          messages: [],
        }
        existingRooms.push(createdRoom)
        return { room: createdRoom, isNew: true }
      }

      // Customer / Admin initiates chat for a new order (e.g. return claim for order-new-456)
      const result = resolveRoom(
        'cust-rian',
        'store-roxy',
        'order-new-456',
        true
      )

      expect(result.isNew).toBe(false)
      expect(result.room.id).toBe('room-roxy-existing')
      expect(result.room.orderId).toBe('order-new-456')
      expect(result.room.messages).toHaveLength(2) // Previous messages intact
      expect(existingRooms).toHaveLength(1) // Still exactly 1 room!
    })

    it('should create return reference message in the existing room without creating a new room', () => {
      const room = {
        id: 'room-roxy-existing',
        customerId: 'cust-rian',
        storeId: 'store-roxy',
        orderId: 'order-new-456',
        messages: [{ id: 'm-1', messageType: 'text', content: 'Halo' }],
      }

      const appendReturnReferenceIfNotPresent = (
        targetRoom: typeof room,
        orderNumber: string,
        returnId: string
      ) => {
        const alreadyHasReturnForThisOrder = targetRoom.messages.some(
          (m) =>
            m.messageType === 'return_reference' &&
            m.content.includes(orderNumber)
        )

        if (!alreadyHasReturnForThisOrder) {
          targetRoom.messages.push({
            id: `ret-msg-${Date.now()}`,
            messageType: 'return_reference',
            content: JSON.stringify({
              type: 'return_reference',
              orderNumber,
              returnId,
              reason: 'Cacat Fisik / Layar Pecah',
            }),
          })
          return true
        }
        return false
      }

      // First call: appends return bubble
      const createdFirst = appendReturnReferenceIfNotPresent(
        room,
        'SPR-20261102-ROXY1Z34G',
        'ret-101'
      )
      expect(createdFirst).toBe(true)
      expect(room.messages).toHaveLength(2)
      expect(room.messages[1].messageType).toBe('return_reference')

      // Second call: does not duplicate return bubble for same order
      const createdSecond = appendReturnReferenceIfNotPresent(
        room,
        'SPR-20261102-ROXY1Z34G',
        'ret-101'
      )
      expect(createdSecond).toBe(false)
      expect(room.messages).toHaveLength(2)
    })
  })

  describe('2. Defensive Deduplication on Room Lists (Sidebar & APIs)', () => {
    it('should deduplicate multiple rooms with same customer and store, retaining most recent', () => {
      const rawRooms = [
        {
          id: 'room-latest',
          customerId: 'cust-rian',
          storeId: 'store-roxy',
          lastMessageAt: '2026-11-02T16:00:00Z',
          _count: { messages: 1 },
        },
        {
          id: 'room-older',
          customerId: 'cust-rian',
          storeId: 'store-roxy',
          lastMessageAt: '2026-11-02T14:00:00Z',
          _count: { messages: 0 },
        },
        {
          id: 'room-other-customer',
          customerId: 'cust-siti',
          storeId: 'store-roxy',
          lastMessageAt: '2026-11-02T15:00:00Z',
          _count: { messages: 1 },
        },
      ]

      // Deduplication by customerId + storeId
      const seen = new Set<string>()
      const deduplicated = rawRooms.filter((r) => {
        const key = `${r.customerId}_${r.storeId || 'CS'}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      expect(deduplicated).toHaveLength(2)
      expect(deduplicated[0].id).toBe('room-latest')
      expect(deduplicated[0].customerId).toBe('cust-rian')
      expect(deduplicated[1].id).toBe('room-other-customer')
      expect(deduplicated[1].customerId).toBe('cust-siti')
    })
  })

  describe('3. Database Consolidation & Message Migration Logic', () => {
    it('should migrate all messages from duplicate rooms into primary room and remove duplicate', () => {
      let roomsDb = [
        {
          id: 'primary-room',
          customerId: 'cust-rian',
          storeId: 'store-roxy',
          orderId: 'old-order-1',
          createdAt: new Date('2026-09-08T00:00:00Z'),
          lastMessageAt: new Date('2026-09-08T12:00:00Z'),
        },
        {
          id: 'duplicate-room',
          customerId: 'cust-rian',
          storeId: 'store-roxy',
          orderId: 'new-return-order-2',
          createdAt: new Date('2026-11-02T15:00:00Z'),
          lastMessageAt: new Date('2026-11-02T15:30:00Z'),
        },
      ]

      let messagesDb = [
        { id: 'm-1', roomId: 'primary-room', content: 'Halo dari September' },
        {
          id: 'm-2',
          roomId: 'duplicate-room',
          content: 'Pengajuan Retur November',
        },
        {
          id: 'm-3',
          roomId: 'duplicate-room',
          content: 'Klaim garansi diterima',
        },
      ]

      // Migration process:
      const primary = roomsDb[0]
      const duplicate = roomsDb[1]

      // 1. Move messages to primary
      messagesDb = messagesDb.map((m) =>
        m.roomId === duplicate.id ? { ...m, roomId: primary.id } : m
      )

      // 2. Update primary room metadata with latest order and timestamp
      primary.orderId = duplicate.orderId
      primary.lastMessageAt = duplicate.lastMessageAt

      // 3. Delete duplicate room
      roomsDb = roomsDb.filter((r) => r.id !== duplicate.id)

      expect(roomsDb).toHaveLength(1)
      expect(roomsDb[0].id).toBe('primary-room')
      expect(roomsDb[0].orderId).toBe('new-return-order-2')

      const primaryMessages = messagesDb.filter(
        (m) => m.roomId === 'primary-room'
      )
      expect(primaryMessages).toHaveLength(3)
      expect(primaryMessages.map((m) => m.content)).toEqual([
        'Halo dari September',
        'Pengajuan Retur November',
        'Klaim garansi diterima',
      ])
    })
  })
})
