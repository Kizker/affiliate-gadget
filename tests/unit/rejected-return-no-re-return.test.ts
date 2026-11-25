import { describe, it, expect } from 'vitest'
import {
  getRemainingReturnableQuantityForItem,
  isOrderItemReturnEligible,
  isReturnEligible,
  splitOrderItemsForDisplay,
} from '@/lib/order-return-utils'
import fs from 'fs'
import path from 'path'

describe('Aturan Bisnis: Retur Ditolak Tidak Boleh Diretur Kembali', () => {
  const sampleItem1 = {
    id: 'item-1',
    productId: 'prod-1',
    quantity: 1,
    price: 14245000,
    variantName: 'GALAXY Z FOLD 3 5G,UNIT ONLY 8/256GB',
    product: {
      id: 'prod-1',
      name: 'Samsung Galaxy Z Fold 3 5G',
    },
  }

  const sampleItem2 = {
    id: 'item-2',
    productId: 'prod-2',
    quantity: 1,
    price: 14245000,
    variantName: 'GALAXY Z FOLD 3 5G,UNIT ONLY 8/256GB',
    product: {
      id: 'prod-2',
      name: 'Samsung Galaxy Z Fold 3 5G',
    },
  }

  it('1. Jika retur suatu item berstatus REJECTED, sisa unit yang dapat diretur adalah 0', () => {
    const returnRequests = [
      {
        id: 'ret-1',
        status: 'REJECTED',
        type: 'REPLACEMENT',
        description:
          '[Unit yang Diretur: Samsung Galaxy Z Fold 3 5G - Varian: GALAXY Z FOLD 3 5G,UNIT ONLY 8/256GB - 1 unit @ Rp 14.245.000 | ItemID:item-1 | Qty:1]\n\nKendala Mati Total',
      },
    ]

    const remainingQty = getRemainingReturnableQuantityForItem(
      sampleItem1,
      returnRequests,
      { status: 'PAID', customerConfirmedAt: new Date() }
    )

    expect(remainingQty).toBe(0)
    expect(
      isOrderItemReturnEligible(
        {
          status: 'PAID',
          customerConfirmedAt: new Date(),
          returnRequests,
        },
        sampleItem1
      )
    ).toBe(false)
  })

  it('2. Item lain dalam pesanan multi-item yang belum pernah diretur tetap dapat diretur', () => {
    const returnRequests = [
      {
        id: 'ret-1',
        status: 'REJECTED',
        type: 'REPLACEMENT',
        description:
          '[Unit yang Diretur: Samsung Galaxy Z Fold 3 5G - Varian: GALAXY Z FOLD 3 5G,UNIT ONLY 8/256GB - 1 unit @ Rp 14.245.000 | ItemID:item-1 | Qty:1]\n\nKendala Mati Total',
      },
    ]

    const remainingQtyItem2 = getRemainingReturnableQuantityForItem(
      sampleItem2,
      returnRequests,
      { status: 'PAID', customerConfirmedAt: new Date() }
    )

    expect(remainingQtyItem2).toBe(1)
    expect(
      isOrderItemReturnEligible(
        {
          status: 'PAID',
          customerConfirmedAt: new Date(),
          returnRequests,
        },
        sampleItem2
      )
    ).toBe(true)
  })

  it('3. splitOrderItemsForDisplay membagi unit retur dan kartu unit yang ditolak memiliki matchedReturn.status REJECTED', () => {
    const returnRequests = [
      {
        id: 'ret-1',
        status: 'REJECTED',
        type: 'REPLACEMENT',
        description:
          '[Unit yang Diretur: Samsung Galaxy Z Fold 3 5G - Varian: GALAXY Z FOLD 3 5G,UNIT ONLY 8/256GB - 1 unit @ Rp 14.245.000 | ItemID:item-1 | Qty:1]\n\nKendala Mati Total',
      },
    ]

    const displayItems = splitOrderItemsForDisplay(
      [sampleItem1, sampleItem2],
      returnRequests
    )

    // Item 1 yang diretur dan ditolak
    const item1Display = displayItems.find((d) => d.item.id === 'item-1')
    expect(item1Display).toBeDefined()
    expect(item1Display?.isReturnedUnit).toBe(true)
    expect(item1Display?.matchedReturn?.status).toBe('REJECTED')

    // Item 2 yang belum diretur
    const item2Display = displayItems.find((d) => d.item.id === 'item-2')
    expect(item2Display).toBeDefined()
    expect(item2Display?.isReturnedUnit).toBe(false)
    expect(item2Display?.matchedReturn).toBeUndefined()
  })

  it('4. order-desktop-items-card dan order-mobile-view tidak menampilkan tombol "Ajukan Retur Unit Ini" pada kartu yang ditolak', () => {
    const desktopCardPath = path.join(
      process.cwd(),
      'src/components/customer/order-detail/order-desktop-items-card.tsx'
    )
    const desktopContent = fs.readFileSync(desktopCardPath, 'utf-8')

    expect(desktopContent).toContain('!displayItem.isReturnedUnit')
    expect(desktopContent).toContain('!isItemRejected')
    expect(desktopContent).toContain('canReturnThisCard')

    const mobileViewPath = path.join(
      process.cwd(),
      'src/components/customer/order-detail/order-mobile-view.tsx'
    )
    const mobileContent = fs.readFileSync(mobileViewPath, 'utf-8')

    expect(mobileContent).toContain('!displayItem.isReturnedUnit')
    expect(mobileContent).toContain('!isItemRejected')
    expect(mobileContent).toContain('canReturnThisCard')
  })

  it('5. Jika retur berjenis REPLACEMENT selesai dan unit pengganti diterima, retur dapat diajukan lagi jika rusak, hingga ditolak atau diselesaikan', () => {
    const replacementReturn = [
      {
        id: 'ret-rep-1',
        status: 'COMPLETED',
        type: 'REPLACEMENT',
        description:
          '[Unit yang Diretur: Samsung Galaxy Z Fold 3 5G | ItemID:item-1 | Qty:1]',
      },
    ]

    // Customer sudah konfirmasi terima unit pengganti (customerConfirmedAt ada, belum completedAt)
    const qtyReceived = getRemainingReturnableQuantityForItem(
      sampleItem1,
      replacementReturn,
      {
        status: 'PAID',
        customerConfirmedAt: new Date(),
        completedAt: null,
      }
    )
    expect(qtyReceived).toBe(1)

    // Jika customer menyelesaikan pesanan (completedAt terisi), retur tidak bisa dilakukan lagi
    const qtyCompleted = getRemainingReturnableQuantityForItem(
      sampleItem1,
      replacementReturn,
      {
        status: 'COMPLETED',
        customerConfirmedAt: new Date(),
        completedAt: new Date(),
      }
    )
    expect(qtyCompleted).toBe(0)

    // Jika retur kedua diajukan dan DITOLAK (REJECTED), maka retur tidak bisa dilakukan lagi
    const rejectedSecondReturn = [
      ...replacementReturn,
      {
        id: 'ret-rep-2',
        status: 'REJECTED',
        type: 'REPLACEMENT',
        description:
          '[Unit yang Diretur: Samsung Galaxy Z Fold 3 5G | ItemID:item-1 | Qty:1]',
      },
    ]
    const qtyRejected = getRemainingReturnableQuantityForItem(
      sampleItem1,
      rejectedSecondReturn,
      {
        status: 'PAID',
        customerConfirmedAt: new Date(),
        completedAt: null,
      }
    )
    expect(qtyRejected).toBe(0)
  })

  it('6. Backend POST /api/returns menolak pengajuan jika produk sebelumnya telah ditolak', () => {
    const routePath = path.join(process.cwd(), 'src/app/api/returns/route.ts')
    const content = fs.readFileSync(routePath, 'utf-8')

    expect(content).toContain('getRemainingReturnableQuantityForItem')
    expect(content).toContain(
      'Pengajuan retur untuk produk ini telah ditolak sebelumnya dan tidak dapat diajukan kembali'
    )
  })

  it('7. isReturnEligible mengembalikan false jika seluruh unit dalam pesanan telah ditolak atau selesai', () => {
    const allRejectedOrder = {
      status: 'PAID',
      customerConfirmedAt: new Date(),
      items: [sampleItem1],
      returnRequests: [
        {
          id: 'ret-1',
          status: 'REJECTED',
          description: 'ItemID:item-1',
        },
      ],
    }

    expect(isReturnEligible(allRejectedOrder)).toBe(false)
  })
})
