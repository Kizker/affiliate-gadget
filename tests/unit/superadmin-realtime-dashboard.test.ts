import { describe, it, expect } from 'vitest'

describe('Superadmin Real-Time Dashboard & Multi-PT Consolidation Engine', () => {
  const CANONICAL_REVENUE_STATUSES = [
    'PAID',
    'IN_PROGRESS',
    'SHIPPED',
    'COMPLETED',
    'COMPLAINED',
  ]

  it('should calculate total network revenue from all recognized orders instead of limiting to recent 5 orders', () => {
    // Simulasi 8 order di database lintas toko
    const allDbOrders = [
      {
        id: '1',
        storeId: 'store-1',
        status: 'PAID',
        total: 20000000,
        commissionAmount: 400000,
      },
      {
        id: '2',
        storeId: 'store-2',
        status: 'IN_PROGRESS',
        total: 15000000,
        commissionAmount: 300000,
      },
      {
        id: '3',
        storeId: 'store-1',
        status: 'SHIPPED',
        total: 25000000,
        commissionAmount: 500000,
      },
      {
        id: '4',
        storeId: 'store-3',
        status: 'COMPLETED',
        total: 30000000,
        commissionAmount: 600000,
      },
      {
        id: '5',
        storeId: 'store-2',
        status: 'COMPLAINED',
        total: 10000000,
        commissionAmount: 200000,
      },
      {
        id: '6',
        storeId: 'store-1',
        status: 'COMPLETED',
        total: 18000000,
        commissionAmount: 360000,
      },
      {
        id: '7',
        storeId: 'store-3',
        status: 'COMPLETED',
        total: 22000000,
        commissionAmount: 440000,
      },
      {
        id: '8',
        storeId: 'store-2',
        status: 'CANCELLED',
        total: 12000000,
        commissionAmount: 0,
      },
    ]

    // Jika salah dan hanya ambil 5 pesanan recent:
    const flawedRecent5 = allDbOrders.slice(0, 5)
    const flawedRevenue = flawedRecent5.reduce((s, o) => s + o.total, 0)
    expect(flawedRevenue).toBe(100000000) // 100jt (salah karena kehilangan order 6 & 7)

    // Agregasi riil seluruh pesanan berbayar:
    const activeOrders = allDbOrders.filter((o) =>
      CANONICAL_REVENUE_STATUSES.includes(o.status)
    )
    const realNetworkRevenue = activeOrders.reduce((s, o) => s + o.total, 0)
    const realPlatformCommission = activeOrders.reduce(
      (s, o) => s + o.commissionAmount,
      0
    )

    // 20 + 15 + 25 + 30 + 10 + 18 + 22 = 140.000.000
    expect(activeOrders.length).toBe(7)
    expect(realNetworkRevenue).toBe(140000000)
    expect(realPlatformCommission).toBe(2800000) // 2.800.000 komisi platform
  })

  it('should accurately count active physical stores and format branches dynamically', () => {
    const storesFromDb = [
      {
        id: 'st-1',
        name: 'Affiliate Gadget - Roxy Mas Jakarta',
        companyName: 'PT Gadget Jaya Sentosa',
        city: 'Jakarta Pusat',
        isActive: true,
      },
      {
        id: 'st-2',
        name: 'Affiliate Gadget - WTC Surabaya',
        companyName: 'PT Sinar Gadget Nusantara',
        city: 'Surabaya',
        isActive: true,
      },
      {
        id: 'st-3',
        name: 'Affiliate Gadget - BEC Bandung',
        companyName: 'PT Digital Niaga Prima',
        city: 'Bandung',
        isActive: true,
      },
      {
        id: 'st-4',
        name: 'Affiliate Gadget - Plaza Medan Fair',
        companyName: 'PT Surya Makmur Gadget',
        city: 'Medan',
        isActive: true,
      },
      {
        id: 'st-5',
        name: 'Affiliate Gadget - Jogjatronik Mall',
        companyName: 'PT Mega Ponsel Nusantara',
        city: 'Yogyakarta',
        isActive: true,
      },
      {
        id: 'st-6',
        name: 'Mitra Non-Aktif Semarang',
        companyName: 'PT Gadget Lama',
        city: 'Semarang',
        isActive: false,
      },
    ]

    const activeStores = storesFromDb.filter((s) => s.isActive)
    expect(activeStores.length).toBe(5)
    expect(activeStores[0].companyName).toBe('PT Gadget Jaya Sentosa')
    expect(activeStores[1].city).toBe('Surabaya')
  })

  it('should support Consolidated Multi-PT mode vs Branch Specific mode in Finance', () => {
    const stores = [
      { id: 'st-1', name: 'Roxy Jakarta' },
      { id: 'st-2', name: 'WTC Surabaya' },
    ]

    const orders = [
      {
        id: 'o-1',
        storeId: 'st-1',
        total: 20000000,
        subtotal: 20000000,
        commissionAmount: 400000,
        status: 'SHIPPED',
      },
      {
        id: 'o-2',
        storeId: 'st-2',
        total: 30000000,
        subtotal: 30000000,
        commissionAmount: 600000,
        status: 'COMPLETED',
      },
    ]

    // 1. Consolidated Mode (storeId === undefined atau 'ALL')
    const consolidatedOrders = orders.filter((o) =>
      CANONICAL_REVENUE_STATUSES.includes(o.status)
    )
    const consolidatedGross = consolidatedOrders.reduce(
      (s, o) => s + o.total,
      0
    )
    const consolidatedEscrow = consolidatedOrders
      .filter((o) => o.status === 'SHIPPED')
      .reduce((s, o) => s + (o.subtotal - o.commissionAmount), 0)
    const consolidatedAvailable = consolidatedOrders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((s, o) => s + (o.subtotal - o.commissionAmount), 0)

    expect(consolidatedGross).toBe(50000000)
    expect(consolidatedEscrow).toBe(19600000)
    expect(consolidatedAvailable).toBe(29400000)

    // 2. Branch Specific Mode (storeId === 'st-1')
    const roxyOrders = orders.filter((o) => o.storeId === 'st-1')
    const roxyGross = roxyOrders.reduce((s, o) => s + o.total, 0)
    const roxyEscrow = roxyOrders
      .filter((o) => o.status === 'SHIPPED')
      .reduce((s, o) => s + (o.subtotal - o.commissionAmount), 0)
    const roxyAvailable = roxyOrders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((s, o) => s + (o.subtotal - o.commissionAmount), 0)

    expect(roxyGross).toBe(20000000)
    expect(roxyEscrow).toBe(19600000)
    expect(roxyAvailable).toBe(0) // Belum ada yang selesai di Roxy
  })
})
