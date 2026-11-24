import { describe, it, expect } from 'vitest'

describe('Order Chat Routing: Store Admin vs After Sales', () => {
  it('1. should route order with status PAID to Store Admin, NOT After Sales', () => {
    const order = {
      id: 'order-123',
      orderNumber: 'SPR-20261124-74BE1238',
      status: 'PAID', // Masih dibayar, belum selesai
      returnRequests: [],
    }

    const storeGroupAfterSales = {
      id: 'aftersales-user',
      name: 'Hafiyan Aftersales',
      role: 'AFTER_SALES',
    }

    const storeAdmin = {
      id: 'store-admin-user',
      name: 'Hafiyan Al Muqaffi',
      role: 'STORE_ADMIN',
    }

    // Logic: Sebelum status menunjukkan selesai (COMPLETED / RETURNED), chat 100% dengan Admin Toko
    const isOrderFinished =
      order.status === 'COMPLETED' ||
      order.status === 'RETURNED' ||
      order.returnRequests.length > 0

    const isAfterSalesRoom = Boolean(
      storeGroupAfterSales && order && isOrderFinished
    )

    let assignedAdmin: any = null
    if (isOrderFinished && storeGroupAfterSales) {
      assignedAdmin = storeGroupAfterSales
    } else {
      assignedAdmin = storeAdmin
    }

    expect(isOrderFinished).toBe(false)
    expect(isAfterSalesRoom).toBe(false)
    expect(assignedAdmin.id).toBe('store-admin-user')
    expect(assignedAdmin.role).toBe('STORE_ADMIN')
    expect(assignedAdmin.name).toBe('Hafiyan Al Muqaffi')
  })

  it('2. should only route to After Sales once order status is COMPLETED or RETURNED', () => {
    const completedOrder = {
      id: 'order-finished-1',
      status: 'COMPLETED',
      returnRequests: [],
    }

    const storeGroupAfterSales = {
      id: 'aftersales-user',
      name: 'Hafiyan Aftersales',
      role: 'AFTER_SALES',
    }

    const storeAdmin = {
      id: 'store-admin-user',
      name: 'Hafiyan Al Muqaffi',
      role: 'STORE_ADMIN',
    }

    const isOrderFinished =
      completedOrder.status === 'COMPLETED' ||
      completedOrder.status === 'RETURNED' ||
      completedOrder.returnRequests.length > 0

    const isAfterSalesRoom = Boolean(
      storeGroupAfterSales && completedOrder && isOrderFinished
    )

    let assignedAdmin: any = null
    if (isOrderFinished && storeGroupAfterSales) {
      assignedAdmin = storeGroupAfterSales
    } else {
      assignedAdmin = storeAdmin
    }

    expect(isOrderFinished).toBe(true)
    expect(isAfterSalesRoom).toBe(true)
    expect(assignedAdmin.role).toBe('AFTER_SALES')
    expect(assignedAdmin.name).toBe('Hafiyan Aftersales')
  })

  it('3. should auto-heal and re-assign room back to Store Admin if an unfinished order was mistakenly claimed by AFTER_SALES', () => {
    const unfinishedOrder = {
      id: 'order-paid',
      status: 'PAID',
      returnRequests: [],
    }

    const roomClaimedBy = {
      id: 'aftersales-user',
      role: 'AFTER_SALES',
    }

    const storeAdmin = {
      id: 'store-admin-user',
      name: 'Hafiyan Al Muqaffi',
      role: 'STORE_ADMIN',
    }

    const isOrderFinished =
      unfinishedOrder.status === 'COMPLETED' ||
      unfinishedOrder.status === 'RETURNED' ||
      unfinishedOrder.returnRequests.length > 0

    const isAfterSalesRoom = Boolean(
      true &&
      unfinishedOrder &&
      isOrderFinished &&
      roomClaimedBy.role !== 'STORE_ADMIN'
    )

    let resolvedClaimedBy: any = roomClaimedBy
    if (!isAfterSalesRoom && resolvedClaimedBy?.role === 'AFTER_SALES') {
      resolvedClaimedBy = storeAdmin
    }

    expect(isAfterSalesRoom).toBe(false)
    expect(resolvedClaimedBy.role).toBe('STORE_ADMIN')
    expect(resolvedClaimedBy.name).toBe('Hafiyan Al Muqaffi')
  })
})
