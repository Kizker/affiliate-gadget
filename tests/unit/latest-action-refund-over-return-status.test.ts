import { describe, it, expect } from 'vitest'
import {
  findReturnForOrderItem,
  getOrderStatusMeta,
  splitOrderItemsForDisplay,
  isOrderItemReturnEligible,
  getRemainingReturnableQuantityForItem,
  isReturnEligible,
} from '@/lib/order-return-utils'
import { getOrderContextualTimestamp } from '@/lib/order-date-utils'

describe('Latest Action Status Resolution (Refund over Replacement Return)', () => {
  const sampleItem = {
    id: 'item-iphone-15-pro',
    quantity: 1,
    price: 19999999,
    variantName: '256GB - White Titanium',
    product: {
      id: 'prod-iphone-15',
      name: 'iPhone 15 Pro | IBOX | Second Like New',
      slug: 'iphone-15-pro',
      images: ['/images/iphone15pro.jpg'],
    },
  }

  it('correctly picks the latest action (Refund) when an item had a prior completed Replacement return', () => {
    // Skenario:
    // 1. Dulu pernah tukar unit (REPLACEMENT) selesai jam 10:00
    // 2. Kemudian barang pengganti rusak lagi dan diajukan REFUND jam 14:00 yang disetujui/selesai
    const returnRequests = [
      {
        id: 'ret-2-refund',
        status: 'COMPLETED',
        type: 'REFUND',
        reason: 'DOA',
        reasonLabel: 'Mati Total (DOA)',
        description:
          '[Unit yang Diretur: iPhone 15 Pro | IBOX | Second Like New varian: 256GB - White Titanium - 1 unit @ Rp 19.999.999 | ItemID:item-iphone-15-pro | Qty:1]\n\nBarang pengganti masih mati total',
        createdAt: '2026-11-28T14:00:00.000Z',
        resolvedAt: '2026-11-28T15:00:00.000Z',
      },
      {
        id: 'ret-1-replacement',
        status: 'COMPLETED',
        type: 'REPLACEMENT',
        reason: 'DEFECT',
        reasonLabel: 'Cacat Fisik',
        description:
          '[Unit yang Diretur: iPhone 15 Pro | IBOX | Second Like New varian: 256GB - White Titanium - 1 unit @ Rp 19.999.999 | ItemID:item-iphone-15-pro | Qty:1]\n\nLayar bergaris',
        createdAt: '2026-11-20T10:00:00.000Z',
        resolvedAt: '2026-11-22T10:00:00.000Z',
      },
    ]

    // 1. findReturnForOrderItem harus mengambil tiket terbaru (Refund)
    const matched = findReturnForOrderItem(returnRequests, sampleItem, 1)
    expect(matched).toBeDefined()
    expect(matched?.id).toBe('ret-2-refund')
    expect(matched?.type).toBe('REFUND')
    expect(matched?.status).toBe('COMPLETED')

    // 2. splitOrderItemsForDisplay harus mengikat tiket Refund terbaru ke displayItem
    const displayItems = splitOrderItemsForDisplay([sampleItem], returnRequests)
    expect(displayItems).toHaveLength(1)
    expect(displayItems[0].matchedReturn?.id).toBe('ret-2-refund')
    expect(displayItems[0].matchedReturn?.type).toBe('REFUND')

    // 3. getOrderContextualTimestamp harus menghasilkan label 'Refund Selesai' (bukan 'Retur Selesai')
    const orderObj = {
      status: 'RETURNED',
      createdAt: '2026-11-28T08:00:00.000Z',
      returnRequests,
    }
    const timestampInfo = getOrderContextualTimestamp(orderObj)
    expect(timestampInfo.label).toBe('Refund Selesai')
    expect(timestampInfo.fullLabel).toBe('Waktu Refund Selesai')

    // 4. getOrderStatusMeta juga harus menghasilkan 'Refund Selesai'
    const statusMeta = getOrderStatusMeta(orderObj)
    expect(statusMeta.label).toBe('Refund Selesai')
  })

  it('correctly displays "Refund Disetujui" if the latest refund is APPROVED', () => {
    const returnRequests = [
      {
        id: 'ret-2-refund-approved',
        status: 'APPROVED',
        type: 'REFUND',
        reason: 'DOA',
        reasonLabel: 'Mati Total (DOA)',
        description:
          '[Unit yang Diretur: iPhone 15 Pro | IBOX | Second Like New | ItemID:item-iphone-15-pro | Qty:1]',
        createdAt: '2026-11-28T14:00:00.000Z',
      },
      {
        id: 'ret-1-replacement',
        status: 'COMPLETED',
        type: 'REPLACEMENT',
        description:
          '[Unit yang Diretur: iPhone 15 Pro | IBOX | Second Like New | ItemID:item-iphone-15-pro | Qty:1]',
        createdAt: '2026-11-20T10:00:00.000Z',
      },
    ]

    const orderObj = {
      status: 'RETURNED',
      createdAt: '2026-11-28T08:00:00.000Z',
      returnRequests,
    }
    const timestampInfo = getOrderContextualTimestamp(orderObj)
    expect(timestampInfo.label).toBe('Diajukan Refund')

    const statusMeta = getOrderStatusMeta(orderObj)
    expect(statusMeta.label).toBe('Refund Disetujui')
  })

  it('guarantees that an item with completed or approved refund CANNOT request return again (no Ajukan Pengembalian)', () => {
    const returnRequests = [
      {
        id: 'ret-refund-done',
        status: 'COMPLETED',
        type: 'REFUND',
        description:
          '[Unit yang Diretur: iPhone 15 Pro | IBOX | Second Like New | ItemID:item-iphone-15-pro | Qty:1]',
        createdAt: '2026-11-28T14:00:00.000Z',
      },
    ]

    const orderObj = {
      status: 'COMPLETED',
      customerConfirmedAt: new Date(),
      warrantyExpiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      returnRequests,
      items: [sampleItem],
    }

    // 1. isOrderItemReturnEligible harus false
    expect(isOrderItemReturnEligible(orderObj, sampleItem, 1)).toBe(false)

    // 2. getRemainingReturnableQuantityForItem harus 0
    expect(
      getRemainingReturnableQuantityForItem(
        sampleItem,
        returnRequests,
        orderObj
      )
    ).toBe(0)

    // 3. isReturnEligible untuk order ini harus false
    expect(isReturnEligible(orderObj)).toBe(false)
  })
})
