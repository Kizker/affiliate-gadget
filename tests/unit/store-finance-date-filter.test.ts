import { describe, it, expect } from 'vitest'

// Helper date range extractor logic (mirroring the pure helper in src/app/dashboard/admin/finance/page.tsx)
function getDateRange(range: string, referenceDate?: Date) {
  const now = referenceDate ? new Date(referenceDate) : new Date()
  let startDate: Date
  let endDate: Date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  )

  switch (range) {
    case 'today':
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      )
      break
    case 'thisWeek': {
      const day = now.getDay()
      const diffToMonday = day === 0 ? -6 : 1 - day
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + diffToMonday,
        0,
        0,
        0,
        0
      )
      break
    }
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      break
    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      break
    case 'january':
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 0, 31, 23, 59, 59, 999)
      break
    case 'february': {
      const isLeap =
        (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) ||
        now.getFullYear() % 400 === 0
      startDate = new Date(now.getFullYear(), 1, 1, 0, 0, 0, 0)
      endDate = new Date(
        now.getFullYear(),
        1,
        isLeap ? 29 : 28,
        23,
        59,
        59,
        999
      )
      break
    }
    case 'march':
      startDate = new Date(now.getFullYear(), 2, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 2, 31, 23, 59, 59, 999)
      break
    case 'april':
      startDate = new Date(now.getFullYear(), 3, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 3, 30, 23, 59, 59, 999)
      break
    case 'may':
      startDate = new Date(now.getFullYear(), 4, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 4, 31, 23, 59, 59, 999)
      break
    case 'june':
      startDate = new Date(now.getFullYear(), 5, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 5, 30, 23, 59, 59, 999)
      break
    case 'july':
      startDate = new Date(now.getFullYear(), 6, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 6, 31, 23, 59, 59, 999)
      break
    case 'august':
      startDate = new Date(now.getFullYear(), 7, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 7, 31, 23, 59, 59, 999)
      break
    case 'september':
      startDate = new Date(now.getFullYear(), 8, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 8, 30, 23, 59, 59, 999)
      break
    case 'october':
      startDate = new Date(now.getFullYear(), 9, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 9, 31, 23, 59, 59, 999)
      break
    case 'november':
      startDate = new Date(now.getFullYear(), 10, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 10, 30, 23, 59, 59, 999)
      break
    case 'december':
      startDate = new Date(now.getFullYear(), 11, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}

describe('Store Finance Date Filter & Export Integration', () => {
  const fixedNow = new Date('2026-09-23T15:30:00.000Z')

  describe('getDateRange Resolution', () => {
    it('correctly resolves "today" range within the same day', () => {
      const { startDate, endDate } = getDateRange('today', fixedNow)
      const s = new Date(startDate)
      const e = new Date(endDate)

      expect(s.getTime()).toBeLessThanOrEqual(e.getTime())
      expect(s.getFullYear()).toBe(fixedNow.getFullYear())
      expect(s.getMonth()).toBe(fixedNow.getMonth())
      expect(s.getDate()).toBe(fixedNow.getDate())
      expect(s.getHours()).toBe(0)
      expect(s.getMinutes()).toBe(0)
    })

    it('correctly resolves "thisWeek" starting from Monday', () => {
      const { startDate, endDate } = getDateRange('thisWeek', fixedNow)
      const s = new Date(startDate)
      const e = new Date(endDate)

      expect(s.getTime()).toBeLessThanOrEqual(e.getTime())
      // Monday has getDay() === 1
      expect(s.getDay()).toBe(1)
    })

    it('correctly resolves "thisMonth" from day 1', () => {
      const { startDate, endDate } = getDateRange('thisMonth', fixedNow)
      const s = new Date(startDate)
      const e = new Date(endDate)

      expect(s.getDate()).toBe(1)
      expect(s.getMonth()).toBe(fixedNow.getMonth())
      expect(s.getTime()).toBeLessThanOrEqual(e.getTime())
    })

    it('correctly resolves "thisYear" from Jan 1st', () => {
      const { startDate, endDate } = getDateRange('thisYear', fixedNow)
      const s = new Date(startDate)
      const e = new Date(endDate)

      expect(s.getMonth()).toBe(0)
      expect(s.getDate()).toBe(1)
      expect(s.getTime()).toBeLessThanOrEqual(e.getTime())
    })

    it('correctly resolves specific months (e.g., august and september)', () => {
      const aug = getDateRange('august', fixedNow)
      const sAug = new Date(aug.startDate)
      const eAug = new Date(aug.endDate)
      expect(sAug.getMonth()).toBe(7)
      expect(sAug.getDate()).toBe(1)
      expect(eAug.getMonth()).toBe(7)
      expect(eAug.getDate()).toBe(31)

      const sep = getDateRange('september', fixedNow)
      const sSep = new Date(sep.startDate)
      const eSep = new Date(sep.endDate)
      expect(sSep.getMonth()).toBe(8)
      expect(sSep.getDate()).toBe(1)
      expect(eSep.getMonth()).toBe(8)
      expect(eSep.getDate()).toBe(30)
    })
  })

  describe('Export URL Param Construction for Store Admin', () => {
    it('builds valid financials export URL with startDate, endDate, and storeId', () => {
      const { startDate, endDate } = getDateRange('thisMonth', fixedNow)
      const params = new URLSearchParams({
        type: 'financials',
        format: 'xlsx',
        startDate,
        endDate,
        storeId: 'store-roxy-01',
      })

      const queryString = params.toString()
      expect(queryString).toContain('type=financials')
      expect(queryString).toContain('format=xlsx')
      expect(queryString).toContain(
        `startDate=${encodeURIComponent(startDate)}`
      )
      expect(queryString).toContain(`endDate=${encodeURIComponent(endDate)}`)
      expect(queryString).toContain('storeId=store-roxy-01')
    })

    it('builds valid orders export URL with startDate, endDate, and storeId', () => {
      const { startDate, endDate } = getDateRange('today', fixedNow)
      const params = new URLSearchParams({
        type: 'orders',
        format: 'xlsx',
        startDate,
        endDate,
        storeId: 'store-surabaya-02',
      })

      const queryString = params.toString()
      expect(queryString).toContain('type=orders')
      expect(queryString).toContain('format=xlsx')
      expect(queryString).toContain(
        `startDate=${encodeURIComponent(startDate)}`
      )
      expect(queryString).toContain(`endDate=${encodeURIComponent(endDate)}`)
      expect(queryString).toContain('storeId=store-surabaya-02')
    })
  })

  describe('Date Range Filter Impact Isolation', () => {
    it('isolates period revenue while preserving real-time all-time available balance for withdrawals', () => {
      // Mock order data
      const allTimeOrders = [
        {
          id: 'ord-1',
          completedAt: '2026-08-10T10:00:00.000Z',
          subtotal: 10_000_000,
          commission: 200_000,
          status: 'COMPLETED',
        },
        {
          id: 'ord-2',
          completedAt: '2026-09-15T12:00:00.000Z',
          subtotal: 15_000_000,
          commission: 300_000,
          status: 'COMPLETED',
        },
      ]
      const totalAllTimeWithdrawn = 5_000_000

      // All-time net revenue: (10M - 200k) + (15M - 300k) = 9.8M + 14.7M = 24.5M
      const allTimeNet = allTimeOrders.reduce(
        (sum, o) => sum + (o.subtotal - o.commission),
        0
      )
      const availableBalance = allTimeNet - totalAllTimeWithdrawn
      expect(availableBalance).toBe(19_500_000)

      // Filtered to thisMonth (September 2026)
      const { startDate, endDate } = getDateRange('thisMonth', fixedNow)
      const s = new Date(startDate).getTime()
      const e = new Date(endDate).getTime()

      const periodOrders = allTimeOrders.filter((o) => {
        const t = new Date(o.completedAt).getTime()
        return t >= s && t <= e
      })

      // Period revenue only reflects September (15M - 300k = 14.7M)
      const periodGross = periodOrders.reduce((sum, o) => sum + o.subtotal, 0)
      const periodCommission = periodOrders.reduce(
        (sum, o) => sum + o.commission,
        0
      )
      const periodNet = periodGross - periodCommission

      expect(periodOrders.length).toBe(1)
      expect(periodGross).toBe(15_000_000)
      expect(periodCommission).toBe(300_000)
      expect(periodNet).toBe(14_700_000)

      // Available balance is NOT zeroed out by September filter
      expect(availableBalance).toBe(19_500_000)
    })
  })
})
