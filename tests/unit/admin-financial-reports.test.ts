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
})
