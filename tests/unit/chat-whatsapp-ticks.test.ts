import { describe, it, expect } from 'vitest'
import {
  isStoreOperational,
  getChatTickStatus,
  StoreContext,
  TechnicianContext,
} from '@/lib/chat-status'

describe('WhatsApp Checkmark Status Engine', () => {
  describe('getChatTickStatus', () => {
    it('returns READ (Ceklis 2 Biru) when isRead is true', () => {
      expect(getChatTickStatus({ isRead: true, isRecipientOnline: true })).toBe(
        'READ'
      )
      expect(
        getChatTickStatus({ isRead: true, isRecipientOnline: false })
      ).toBe('READ')
    })

    it('returns DELIVERED (Ceklis 2 Abu-abu) when unread but recipient is online', () => {
      expect(
        getChatTickStatus({ isRead: false, isRecipientOnline: true })
      ).toBe('DELIVERED')
    })

    it('returns SENT (Ceklis 1 Abu-abu) when recipient is offline', () => {
      expect(
        getChatTickStatus({ isRead: false, isRecipientOnline: false })
      ).toBe('SENT')
      expect(getChatTickStatus({})).toBe('SENT')
    })
  })

  describe('isStoreOperational', () => {
    it('returns false when store is inactive', () => {
      const store: StoreContext = {
        name: 'Toko Offline Permanen',
        isActive: false,
      }
      expect(isStoreOperational(store)).toBe(false)
    })

    it('respects technician isAvailable if technician is passed', () => {
      const techOnline: TechnicianContext = { isAvailable: true }
      const techOffline: TechnicianContext = { isAvailable: false }

      expect(isStoreOperational(null, techOnline)).toBe(true)
      expect(isStoreOperational(null, techOffline)).toBe(false)
    })

    it('evaluates store schedule correctly within open hours (WIB)', () => {
      // Create a fixed date: Monday 2026-09-28 at 14:00 WIB (07:00 UTC)
      const mondayAfternoonUtc = new Date('2026-09-28T07:00:00Z')

      const store: StoreContext = {
        name: 'Roxy Mas Cabang Pusat',
        isActive: true,
        schedules: [
          {
            day: 'MONDAY',
            openTime: '10:00',
            closeTime: '21:00',
            isClosed: false,
          },
        ],
      }

      expect(isStoreOperational(store, null, mondayAfternoonUtc)).toBe(true)
    })

    it('evaluates store schedule correctly outside open hours (WIB)', () => {
      // Monday 2026-09-28 at 22:30 WIB (15:30 UTC)
      const mondayNightUtc = new Date('2026-09-28T15:30:00Z')

      const store: StoreContext = {
        name: 'Roxy Mas Cabang Pusat',
        isActive: true,
        schedules: [
          {
            day: 'MONDAY',
            openTime: '10:00',
            closeTime: '21:00',
            isClosed: false,
          },
        ],
      }

      expect(isStoreOperational(store, null, mondayNightUtc)).toBe(false)
    })

    it('evaluates store as offline when schedule is marked as isClosed', () => {
      // Monday 2026-09-28 at 14:00 WIB (07:00 UTC)
      const mondayAfternoonUtc = new Date('2026-09-28T07:00:00Z')

      const store: StoreContext = {
        name: 'Toko Tutup Senin',
        isActive: true,
        schedules: [
          {
            day: 'MONDAY',
            openTime: '10:00',
            closeTime: '21:00',
            isClosed: true,
          },
        ],
      }

      expect(isStoreOperational(store, null, mondayAfternoonUtc)).toBe(false)
    })

    it('evaluates schedules with dayOfWeek number (0 for Sunday, 1 for Monday)', () => {
      // Monday 2026-09-28 at 11:00 WIB (04:00 UTC)
      const mondayMorningUtc = new Date('2026-09-28T04:00:00Z')

      const store: StoreContext = {
        name: 'Toko Format Angka',
        isActive: true,
        schedules: [
          {
            dayOfWeek: 1, // Monday
            openTime: '09:00',
            closeTime: '18:00',
            isClosed: false,
          },
        ],
      }

      expect(isStoreOperational(store, null, mondayMorningUtc)).toBe(true)
    })

    it('uses standard fallback 09:00-21:00 WIB when no schedules provided', () => {
      // Daytime at 12:00 WIB (05:00 UTC)
      const daytimeUtc = new Date('2026-09-28T05:00:00Z')
      // Midnight at 02:00 WIB (19:00 UTC previous day)
      const midnightUtc = new Date('2026-09-27T19:00:00Z')

      const store: StoreContext = {
        name: 'Toko Default',
        isActive: true,
        schedules: [],
      }

      expect(isStoreOperational(store, null, daytimeUtc)).toBe(true)
      expect(isStoreOperational(store, null, midnightUtc)).toBe(false)
    })
  })
})
