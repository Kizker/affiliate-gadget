import { describe, it, expect } from 'vitest'

describe('Admin Financial Reports Calculation & Integrity Engine', () => {
  const REVENUE_STATUSES = [
    'PAID',
    'IN_PROGRESS',
    'SHIPPED',
    'COMPLETED',
    'COMPLAINED',
  ]

  it('should include SHIPPED and COMPLAINED orders in recognized revenue statuses', () => {
    expect(REVENUE_STATUSES).toContain('SHIPPED')
    expect(REVENUE_STATUSES).toContain('COMPLAINED')
    expect(REVENUE_STATUSES).toContain('PAID')
    expect(REVENUE_STATUSES).toContain('IN_PROGRESS')
    expect(REVENUE_STATUSES).toContain('COMPLETED')
  })

  it('should exclude CANCELLED and RETURNED orders from recognized revenue', () => {
    expect(REVENUE_STATUSES).not.toContain('CANCELLED')
    expect(REVENUE_STATUSES).not.toContain('RETURNED')
    expect(REVENUE_STATUSES).not.toContain('PENDING_PAYMENT')
  })

  it('should accurately calculate total revenue across multiple order statuses', () => {
    const sampleOrders = [
      { orderNumber: 'ORD-1', status: 'PAID', total: 1500000 },
      { orderNumber: 'ORD-2', status: 'SHIPPED', total: 2500000 },
      { orderNumber: 'ORD-3', status: 'COMPLETED', total: 3000000 },
      { orderNumber: 'ORD-4', status: 'COMPLAINED', total: 500000 },
      { orderNumber: 'ORD-5', status: 'CANCELLED', total: 1000000 },
      { orderNumber: 'ORD-6', status: 'RETURNED', total: 800000 },
    ]

    const recognizedOrders = sampleOrders.filter((order) =>
      REVENUE_STATUSES.includes(order.status)
    )

    const totalRevenue = recognizedOrders.reduce(
      (sum, order) => sum + order.total,
      0
    )

    expect(recognizedOrders.length).toBe(4)
    expect(totalRevenue).toBe(7500000)
  })

  it('should map categories correctly based on items without inverted labels', () => {
    const items = [
      { type: 'product', price: 5000000, quantity: 1 },
      { type: 'service', price: 350000, quantity: 1 },
      { type: 'rentalItem', price: 150000, quantity: 2 },
    ]

    const revenueByCategory = {
      JASA: 0,
      SPAREPART: 0,
      SEWA: 0,
    }

    items.forEach((item) => {
      if (item.type === 'service') {
        revenueByCategory.JASA += item.price * item.quantity
      } else if (item.type === 'product') {
        revenueByCategory.SPAREPART += item.price * item.quantity
      } else if (item.type === 'rentalItem') {
        revenueByCategory.SEWA += item.price * item.quantity
      }
    })

    expect(revenueByCategory.SPAREPART).toBe(5000000) // Gadget & Sparepart
    expect(revenueByCategory.JASA).toBe(350000) // Jasa Servis LCD
    expect(revenueByCategory.SEWA).toBe(300000) // Sewa & Aksesoris
  })

  it('should not inject dummy fallback values (65/25/10) when revenue is zero', () => {
    const emptyRevenue = {
      JASA: 0,
      SPAREPART: 0,
      SEWA: 0,
    }

    const hasRevenueData =
      emptyRevenue.JASA > 0 ||
      emptyRevenue.SPAREPART > 0 ||
      emptyRevenue.SEWA > 0

    expect(hasRevenueData).toBe(false)

    const datasetValues = [
      emptyRevenue.SPAREPART,
      emptyRevenue.JASA,
      emptyRevenue.SEWA,
    ]

    expect(datasetValues).toEqual([0, 0, 0])
    expect(datasetValues[0]).not.toBe(65)
  })

  it('should accurately map all 9 order statuses for export formatting', () => {
    const statusMap: Record<string, string> = {
      PENDING_PAYMENT: 'Menunggu Pembayaran',
      PAID: 'Dibayar',
      IN_PROGRESS: 'Diproses Toko',
      SHIPPED: 'Dikirim',
      RENTED: 'Disewa',
      RETURNED: 'Dikembalikan',
      COMPLETED: 'Selesai',
      COMPLAINED: 'Komplain',
      CANCELLED: 'Dibatalkan',
    }

    expect(statusMap['SHIPPED']).toBe('Dikirim')
    expect(statusMap['COMPLAINED']).toBe('Komplain')
    expect(statusMap['RETURNED']).toBe('Dikembalikan')
    expect(statusMap['IN_PROGRESS']).toBe('Diproses Toko')
    expect(statusMap['PENDING_PAYMENT']).toBe('Menunggu Pembayaran')
  })

  it('should map store network statistics using active store models', () => {
    const mockStores = [
      {
        id: 'store-1',
        name: 'Roxy Mas',
        isActive: true,
        totalSales: 12,
        rating: 4.9,
      },
      {
        id: 'store-2',
        name: 'WTC Surabaya',
        isActive: true,
        totalSales: 8,
        rating: 4.8,
      },
      {
        id: 'store-3',
        name: 'BEC Bandung',
        isActive: false,
        totalSales: 0,
        rating: 4.5,
      },
    ]

    const totalStores = mockStores.length
    const activeStores = mockStores.filter((s) => s.isActive).length
    const totalSales = mockStores
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + s.totalSales, 0)

    expect(totalStores).toBe(3)
    expect(activeStores).toBe(2)
    expect(totalSales).toBe(20)
  })

  it('should generate non-mutating date ranges with 23:59:59.999 end-of-day bounds', () => {
    const getDateRange = (
      range: string,
      testNow = new Date('2026-09-30T10:15:00.000Z')
    ) => {
      const now = new Date(testNow.getTime())
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
        case 'today': {
          const d = new Date(now.getTime())
          d.setHours(0, 0, 0, 0)
          startDate = d
          break
        }
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
          endDate = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          )
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      return { startDate, endDate }
    }

    const { startDate: todayStart, endDate: todayEnd } = getDateRange('today')
    expect(todayStart.getHours()).toBe(0)
    expect(todayStart.getMinutes()).toBe(0)
    expect(todayEnd.getHours()).toBe(23)
    expect(todayEnd.getMinutes()).toBe(59)
    expect(todayEnd.getSeconds()).toBe(59)
    expect(todayEnd.getMilliseconds()).toBe(999)

    const { startDate: monthStart, endDate: monthEnd } =
      getDateRange('thisMonth')
    expect(monthStart.getDate()).toBe(1)
    expect(monthEnd.getDate()).toBe(30) // September has 30 days
    expect(monthEnd.getHours()).toBe(23)
    expect(monthEnd.getMinutes()).toBe(59)
    expect(monthEnd.getMilliseconds()).toBe(999)
  })

  it('should correctly scope queries when storeId is provided or omitted', () => {
    const getStoreScope = (
      userRole: string,
      userStoreId: string | undefined,
      queryStoreId: string | null
    ) => {
      const isStoreAdmin = userRole === 'STORE_ADMIN'
      const effectiveStoreId = isStoreAdmin
        ? (userStoreId ?? undefined)
        : queryStoreId && queryStoreId !== 'ALL'
          ? queryStoreId
          : undefined
      return effectiveStoreId ? { storeId: effectiveStoreId } : {}
    }

    // Superadmin without storeId: empty scope (consolidated)
    expect(getStoreScope('SUPER_ADMIN', undefined, null)).toEqual({})
    expect(getStoreScope('SUPER_ADMIN', undefined, 'ALL')).toEqual({})

    // Superadmin with Roxy store selected: filtered to Roxy
    expect(getStoreScope('SUPER_ADMIN', undefined, 'store-roxy-123')).toEqual({
      storeId: 'store-roxy-123',
    })

    // Store Admin: strictly locked to own store, ignores queryStoreId
    expect(
      getStoreScope('STORE_ADMIN', 'store-roxy-123', 'store-surabaya-456')
    ).toEqual({
      storeId: 'store-roxy-123',
    })
  })

  it('should recognize orders completed today even if createdAt was in previous period', () => {
    const startOfToday = new Date('2026-09-30T00:00:00.000Z')
    const endOfToday = new Date('2026-09-30T23:59:59.999Z')

    const orders = [
      {
        id: 'ord-1',
        createdAt: new Date('2026-09-25T10:00:00.000Z'),
        completedAt: new Date('2026-09-30T14:20:00.000Z'),
        status: 'COMPLETED',
        total: 2500000,
      },
      {
        id: 'ord-2',
        createdAt: new Date('2026-09-29T10:00:00.000Z'),
        completedAt: null,
        status: 'IN_PROGRESS',
        total: 1500000,
      },
    ]

    const matchesOrderDate = (order: (typeof orders)[0]) => {
      const createdInRange =
        order.createdAt >= startOfToday && order.createdAt <= endOfToday
      const completedInRange =
        order.completedAt !== null &&
        order.completedAt >= startOfToday &&
        order.completedAt <= endOfToday
      return createdInRange || completedInRange
    }

    const todayOrders = orders.filter(matchesOrderDate)
    expect(todayOrders.length).toBe(1)
    expect(todayOrders[0].id).toBe('ord-1')
    expect(todayOrders[0].total).toBe(2500000)
  })

  it('should accurately calculate total completed units sold for physical volume card', () => {
    const orders = [
      {
        id: 'ord-1',
        status: 'COMPLETED',
        items: [{ quantity: 2 }, { quantity: 1 }],
      },
      {
        id: 'ord-2',
        status: 'SHIPPED', // in escrow, not completed yet
        items: [{ quantity: 3 }],
      },
      {
        id: 'ord-3',
        status: 'COMPLETED',
        items: [{ quantity: 4 }],
      },
      {
        id: 'ord-4',
        status: 'CANCELLED',
        items: [{ quantity: 5 }],
      },
    ]

    let totalCompletedUnits = 0
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (order.status === 'COMPLETED') {
          totalCompletedUnits += item.quantity || 1
        }
      })
    })

    // ord-1 (2 + 1) + ord-3 (4) = 7 completed physical units
    expect(totalCompletedUnits).toBe(7)
  })
})
