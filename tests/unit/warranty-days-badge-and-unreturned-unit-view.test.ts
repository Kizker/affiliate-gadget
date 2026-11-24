import { describe, it, expect } from 'vitest'
import {
  getWarrantyRemainingDays,
  getWarrantyRemainingBadgeText,
  splitOrderItemsForDisplay,
} from '@/lib/order-return-utils'

describe('Warranty Days Remaining & Unreturned Unit View Test Suite', () => {
  it('1. Menghitung sisa hari garansi dengan tepat: sisa 2 hari menghasilkan "Garansi Tersisa 2 Hari"', () => {
    const now = Date.now()
    const twoDaysLater = new Date(now + 2 * 24 * 60 * 60 * 1000 - 1000)

    const orderWith2DaysLeft = {
      status: 'COMPLETED',
      customerConfirmedAt: new Date(now - 28 * 24 * 60 * 60 * 1000),
      warrantyExpiryDate: twoDaysLater,
    }

    const days = getWarrantyRemainingDays(orderWith2DaysLeft)
    expect(days).toBe(2)

    const badgeText = getWarrantyRemainingBadgeText(orderWith2DaysLeft)
    expect(badgeText).toBe('Garansi Tersisa 2 Hari')
  })

  it('2. Menghitung sisa 30 hari saat pesanan baru selesai hari ini: "Garansi Tersisa 30 Hari"', () => {
    const now = Date.now()
    const thirtyDaysLater = new Date(now + 30 * 24 * 60 * 60 * 1000 - 1000)

    const orderNew = {
      status: 'COMPLETED',
      customerConfirmedAt: new Date(),
      warrantyExpiryDate: thirtyDaysLater,
    }

    const days = getWarrantyRemainingDays(orderNew)
    expect(days).toBe(30)

    const badgeText = getWarrantyRemainingBadgeText(orderNew)
    expect(badgeText).toBe('Garansi Tersisa 30 Hari')
  })

  it('3. Menghasilkan "Garansi Habis" saat masa 30 hari telah terlampaui', () => {
    const now = Date.now()
    const expiredDate = new Date(now - 2 * 24 * 60 * 60 * 1000)

    const orderExpired = {
      status: 'COMPLETED',
      customerConfirmedAt: new Date(now - 35 * 24 * 60 * 60 * 1000),
      warrantyExpiryDate: expiredDate,
    }

    const days = getWarrantyRemainingDays(orderExpired)
    expect(days).toBe(0)

    const badgeText = getWarrantyRemainingBadgeText(orderExpired)
    expect(badgeText).toBe('Garansi Habis')
  })

  it('4. Pemisahan pesanan retur parsial: unit yang tidak diretur memiliki subtotal pembayaran mandiri', () => {
    const orderItems = [
      {
        id: 'item-1',
        productId: 'prod-fold4',
        quantity: 2, // total 2 unit
        price: 14245000,
        subtotal: 28490000,
        product: { id: 'prod-fold4', name: 'Samsung Galaxy Z Fold 4' },
      },
      {
        id: 'item-2',
        productId: 'prod-extra',
        quantity: 1, // 1 unit lain
        price: 9430000,
        subtotal: 9430000,
        product: { id: 'prod-extra', name: 'Unit Normal Lainnya' },
      },
    ]

    // Hanya 1 unit dari item-1 yang diajukan retur
    const returnRequests = [
      {
        id: 'ret-fold-1',
        status: 'APPROVED',
        type: 'REPLACEMENT',
        description:
          '[Unit yang Diretur: Samsung Galaxy Z Fold 4 - 1 unit @ Rp 14.245.000 | ItemID:item-1 | Qty:1] Mati total',
      },
    ]

    const displayItems = splitOrderItemsForDisplay(orderItems, returnRequests)

    // Expected: 3 cards
    expect(displayItems).toHaveLength(3)

    // Item retur
    const returnedItems = displayItems.filter((it) => it.isReturnedUnit)
    expect(returnedItems).toHaveLength(1)
    expect(returnedItems[0].displayQuantity).toBe(1)
    expect(returnedItems[0].displaySubtotal).toBe(14245000)

    // Item tidak diretur (1 unit Z Fold 4 sisa + 1 unit normal lainnya)
    const unreturnedItems = displayItems.filter((it) => !it.isReturnedUnit)
    expect(unreturnedItems).toHaveLength(2)

    // Subtotal khusus unit yang TIDAK diretur saja
    const unreturnedSubtotal = unreturnedItems.reduce(
      (acc, it) => acc + it.displaySubtotal,
      0
    )
    expect(unreturnedSubtotal).toBe(14245000 + 9430000) // 23.675.000

    // Unit normal lainnya memiliki subtotal tepat senilai unit itu sendiri
    const itemExtra = unreturnedItems.find((it) => it.item.id === 'item-2')
    expect(itemExtra?.displaySubtotal).toBe(9430000)
    expect(itemExtra?.displayQuantity).toBe(1)
  })
})
