import { describe, it, expect } from 'vitest'
import { isStoreOperational, getChatTickStatus } from '@/lib/chat-status'

describe('Store Admin Scoping & Onboarding Suite', () => {
  describe('Store Operational & Online Presence', () => {
    it('returns online true for active stores even at midnight WIB (24/7 responsiveness)', () => {
      // Midnight 00:37 WIB (17:37 UTC previous day)
      const midnightDate = new Date('2026-10-24T17:37:00.000Z')
      const store = {
        id: 'store-tangerang',
        name: 'iDegadget Tangerang',
        isActive: true,
      }

      expect(isStoreOperational(store, null, midnightDate)).toBe(true)
    })

    it('returns false when store is explicitly inactive', () => {
      const store = {
        id: 'store-inactive',
        name: 'Toko Nonaktif',
        isActive: false,
      }
      expect(isStoreOperational(store)).toBe(false)
    })

    it('returns false when explicit daily schedule is marked closed', () => {
      // Monday 12:00 WIB (05:00 UTC)
      const mondayUtc = new Date('2026-09-28T05:00:00Z')
      const store = {
        id: 'store-closed-today',
        name: 'Toko Libur',
        isActive: true,
        schedules: [
          {
            day: 'MONDAY',
            openTime: '09:00',
            closeTime: '21:00',
            isClosed: true,
          },
        ],
      }
      expect(isStoreOperational(store, null, mondayUtc)).toBe(false)
    })

    it('respects technician availability when chatting with technician', () => {
      expect(isStoreOperational(null, { isAvailable: true })).toBe(true)
      expect(isStoreOperational(null, { isAvailable: false })).toBe(false)
    })

    it('returns DELIVERED tick when recipient is online and not yet read', () => {
      expect(
        getChatTickStatus({ isRead: false, isRecipientOnline: true })
      ).toBe('DELIVERED')
    })

    it('returns READ tick when message is read regardless of current presence', () => {
      expect(
        getChatTickStatus({ isRead: true, isRecipientOnline: false })
      ).toBe('READ')
    })
  })

  describe('Chat Room Scoping Logic Verification', () => {
    interface ChatRoomRecord {
      id: string
      storeId?: string | null
      claimedById?: string | null
      customerId?: string | null
      order?: {
        storeId?: string | null
        items?: Array<{ product?: { storeId?: string | null } }>
      } | null
    }

    function filterRoomsForUser(
      rooms: ChatRoomRecord[],
      user: { id: string; role: string; storeId?: string | null }
    ): ChatRoomRecord[] {
      if (user.role === 'STORE_ADMIN' || user.role === 'STORE_SALES') {
        const effectiveStoreId = user.storeId
        if (effectiveStoreId) {
          return rooms.filter((room) => {
            const isStoreRoom = room.storeId === effectiveStoreId
            const isOrderStore = room.order?.storeId === effectiveStoreId
            const isOrderItemStore = room.order?.items?.some(
              (i) => i.product?.storeId === effectiveStoreId
            )
            const isClaimedByMe =
              room.claimedById === user.id && room.storeId === effectiveStoreId
            const isSupportToSuperadmin =
              room.customerId === user.id && room.storeId === null

            return (
              isStoreRoom ||
              isOrderStore ||
              isOrderItemStore ||
              isClaimedByMe ||
              isSupportToSuperadmin
            )
          })
        } else {
          // No storeId: ONLY support chat to Superadmin
          return rooms.filter(
            (room) => room.customerId === user.id && room.storeId === null
          )
        }
      } else if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        // Superadmin sees all rooms
        return rooms
      }
      return rooms.filter((room) => room.claimedById === user.id)
    }

    const mockRooms: ChatRoomRecord[] = [
      { id: 'room-1', storeId: 'store-tangerang', claimedById: 'user-dzaky' },
      { id: 'room-2', storeId: 'store-roxy', claimedById: null }, // Unclaimed from Roxy
      { id: 'room-3', storeId: 'store-medan', claimedById: null }, // Unclaimed from Medan
      {
        id: 'room-4',
        storeId: null,
        customerId: 'user-dzaky',
        claimedById: 'user-superadmin',
      }, // Dzaky support to Superadmin
      {
        id: 'room-5',
        storeId: null,
        customerId: 'customer-other',
        claimedById: null,
      }, // General CS platform unclaimed
    ]

    it('strictly isolates rooms so STORE_ADMIN only sees their store and support chat to Superadmin', () => {
      const storeAdminUser = {
        id: 'user-dzaky',
        role: 'STORE_ADMIN',
        storeId: 'store-tangerang',
      }

      const visibleRooms = filterRoomsForUser(mockRooms, storeAdminUser)
      expect(visibleRooms.map((r) => r.id)).toEqual(['room-1', 'room-4'])
      // Must NOT contain other stores' unclaimed or platform chats
      expect(visibleRooms.some((r) => r.id === 'room-2')).toBe(false)
      expect(visibleRooms.some((r) => r.id === 'room-3')).toBe(false)
      expect(visibleRooms.some((r) => r.id === 'room-5')).toBe(false)
    })

    it('prevents STORE_ADMIN without storeId from seeing any platform unclaimed rooms', () => {
      const unlinkedAdminUser = {
        id: 'user-dzaky',
        role: 'STORE_ADMIN',
        storeId: null,
      }

      const visibleRooms = filterRoomsForUser(mockRooms, unlinkedAdminUser)
      // Only sees their own support chat to Superadmin
      expect(visibleRooms.map((r) => r.id)).toEqual(['room-4'])
      expect(visibleRooms.some((r) => r.id === 'room-2')).toBe(false)
      expect(visibleRooms.some((r) => r.id === 'room-3')).toBe(false)
    })

    it('allows SUPER_ADMIN to see all chat rooms across the platform', () => {
      const superAdminUser = {
        id: 'user-superadmin',
        role: 'SUPER_ADMIN',
        storeId: null,
      }

      const visibleRooms = filterRoomsForUser(mockRooms, superAdminUser)
      expect(visibleRooms.length).toBe(mockRooms.length)
    })
  })
})
