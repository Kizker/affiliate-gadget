import { describe, it, expect } from 'vitest'
import {
  splitOrderItemsForDisplay,
  findReturnForOrderItem,
  doesReturnMatchOrderItem,
} from '@/lib/order-return-utils'

describe('Partial Item Return Split Cards Display Test Suite', () => {
  const itemProductA = {
    id: 'item-prod-a-123',
    productId: 'prod-a',
    quantity: 2,
    price: 15000000,
    subtotal: 30000000,
    product: {
      id: 'prod-a',
      name: 'Samsung Galaxy Z Flip 6',
      slug: 'samsung-galaxy-z-flip-6',
      images: ['/images/flip6.jpg'],
    },
    variantName: '256GB, Mint',
  }

  const itemProductB = {
    id: 'item-prod-b-456',
    productId: 'prod-b',
    quantity: 1,
    price: 8000000,
    subtotal: 8000000,
    product: {
      id: 'prod-b',
      name: 'Xiaomi 14',
      slug: 'xiaomi-14',
      images: ['/images/xiaomi14.jpg'],
    },
    variantName: '256GB, Black',
  }

  it('1. Split 2 unit Product A + 1 unit Product B saat 1 unit Product A diretur -> menghasilkan tepat 3 kartu', () => {
    // 1 unit of Product A is returned
    const returnRequestProductA = {
      id: 'ret-101',
      status: 'PENDING',
      type: 'REPLACEMENT',
      reason: 'CACAT_FISIK',
      reasonLabel: 'Layar Retak / Dead Pixel',
      description:
        '[Unit yang Diretur: Samsung Galaxy Z Flip 6 - 1 unit @ Rp 15.000.000 | ItemID:item-prod-a-123 | Qty:1] Kendala layar dead pixel di lipatan',
    }

    const orderItems = [itemProductA, itemProductB]
    const returnRequests = [returnRequestProductA]

    const displayCards = splitOrderItemsForDisplay(orderItems, returnRequests)

    // Expected: exactly 3 cards
    expect(displayCards).toHaveLength(3)

    // Card 1: 1 unit Product A — DENGAN keterangan retur
    expect(displayCards[0].item.product?.name).toBe('Samsung Galaxy Z Flip 6')
    expect(displayCards[0].displayQuantity).toBe(1)
    expect(displayCards[0].displaySubtotal).toBe(15000000)
    expect(displayCards[0].isReturnedUnit).toBe(true)
    expect(displayCards[0].matchedReturn).toBeDefined()
    expect(displayCards[0].matchedReturn?.status).toBe('PENDING')
    expect(displayCards[0].matchedReturn?.id).toBe('ret-101')

    // Card 2: 1 unit Product A — produk sama, TANPA keterangan retur
    expect(displayCards[1].item.product?.name).toBe('Samsung Galaxy Z Flip 6')
    expect(displayCards[1].displayQuantity).toBe(1)
    expect(displayCards[1].displaySubtotal).toBe(15000000)
    expect(displayCards[1].isReturnedUnit).toBe(false)
    expect(displayCards[1].matchedReturn).toBeUndefined()

    // Card 3: 1 unit Product B — TANPA keterangan retur
    expect(displayCards[2].item.product?.name).toBe('Xiaomi 14')
    expect(displayCards[2].displayQuantity).toBe(1)
    expect(displayCards[2].displaySubtotal).toBe(8000000)
    expect(displayCards[2].isReturnedUnit).toBe(false)
    expect(displayCards[2].matchedReturn).toBeUndefined()
  })

  it('2. Item identik dengan 0 retur tetap 1 grouped card (tidak dipecah ke N kartu kosong)', () => {
    const itemMultiQtyNoReturn = {
      id: 'item-multi-999',
      productId: 'prod-c',
      quantity: 3,
      price: 5000000,
      subtotal: 15000000,
      product: {
        id: 'prod-c',
        name: 'Infinix GT 20 Pro',
      },
    }

    const displayCards = splitOrderItemsForDisplay(
      [itemMultiQtyNoReturn],
      [] // No return requests
    )

    // Tetap 1 kartu dengan kuantitas penuh 3
    expect(displayCards).toHaveLength(1)
    expect(displayCards[0].displayQuantity).toBe(3)
    expect(displayCards[0].displaySubtotal).toBe(15000000)
    expect(displayCards[0].isReturnedUnit).toBe(false)
    expect(displayCards[0].matchedReturn).toBeUndefined()
  })

  it('3. Jika seluruh unit (2 dari 2) diretur, tetap 1 kartu berstatus retur', () => {
    const returnRequestAllUnits = {
      id: 'ret-all-202',
      status: 'APPROVED',
      type: 'REFUND',
      reason: 'MATI_TOTAL',
      reasonLabel: 'Mati Total (DOA)',
      description:
        '[Unit yang Diretur: Samsung Galaxy Z Flip 6 - 2 unit @ Rp 15.000.000 | ItemID:item-prod-a-123 | Qty:2] Dua-duanya tidak bisa dinyalakan',
    }

    const displayCards = splitOrderItemsForDisplay(
      [itemProductA],
      [returnRequestAllUnits]
    )

    // Tetap 1 kartu dengan kuantitas 2 yang diretur semua
    expect(displayCards).toHaveLength(1)
    expect(displayCards[0].displayQuantity).toBe(2)
    expect(displayCards[0].displaySubtotal).toBe(30000000)
    expect(displayCards[0].isReturnedUnit).toBe(true)
    expect(displayCards[0].matchedReturn?.status).toBe('APPROVED')
  })

  it('4. Unit yang tidak diretur mempertahankan referensi item asli untuk aksi retur lanjutan', () => {
    const returnRequest1Unit = {
      id: 'ret-unit-1',
      status: 'PENDING',
      description:
        '[Unit yang Diretur: Samsung Galaxy Z Flip 6 - 1 unit @ Rp 15.000.000 | ItemID:item-prod-a-123 | Qty:1]',
    }

    const [cardReturned, cardRemaining] = splitOrderItemsForDisplay(
      [itemProductA],
      [returnRequest1Unit]
    )

    // Item aslinya tersambung dengan id dan data yang valid
    expect(cardRemaining.item.id).toBe('item-prod-a-123')
    expect(cardRemaining.item.product?.name).toBe('Samsung Galaxy Z Flip 6')
    expect(cardRemaining.displayQuantity).toBe(1)
  })
})
