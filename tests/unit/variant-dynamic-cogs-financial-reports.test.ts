import { describe, it, expect } from 'vitest'
import { resolveOrderItemCostPrice } from '@/lib/order-return-utils'

describe('Dynamic Variant HPP / COGS in Financial Reports', () => {
  it('1. should resolve updated variant costPrice even if snapshot costPrice in orderItem was 0', () => {
    // Skenario pesanan Z Fold 4 dengan varian "GALAXY Z FOLD 4 5G,UNIT ONLY 8/256GB"
    const orderItem = {
      price: 9430000,
      costPrice: 0, // Snapshot lama saat order dibuat bernilai 0
      quantity: 1,
      variantName: 'GALAXY Z FOLD 4 5G,UNIT ONLY 8/256GB',
      product: {
        name: 'SEIN Samsung Galaxy Z Fold 4 5G',
        costPrice: 0,
        variants: [
          {
            id: 'var-1',
            name: 'GALAXY Z FOLD 3 5G,UNIT ONLY 8/256GB',
            costPrice: 13000000,
          },
          {
            id: 'var-2',
            name: 'GALAXY Z FOLD 4 5G,UNIT ONLY 8/256GB',
            costPrice: 8000000, // Baru saja diisi di halaman edit produk
          },
          {
            id: 'var-3',
            name: 'GALAXY Z FOLD 3 5G,UNIT ONLY 12/1TB',
            costPrice: 5000000,
          },
        ],
      },
    }

    const resolvedCost = resolveOrderItemCostPrice(orderItem)
    expect(resolvedCost).toBe(8000000)

    // Kalkulasi laba kotor & laba bersih harus terpotong modal 8.000.000
    const grossRevenue = orderItem.price * orderItem.quantity
    const totalCOGS = resolvedCost * orderItem.quantity
    const grossProfit = grossRevenue - totalCOGS

    expect(totalCOGS).toBe(8000000)
    expect(grossProfit).toBe(9430000 - 8000000) // 1.430.000
  })

  it('2. should resolve variant costPrice matching by variantId', () => {
    const orderItem = {
      price: 14245000,
      costPrice: 0,
      quantity: 2,
      variantId: 'var-1',
      variantName: 'Custom Variant Name',
      product: {
        name: 'Samsung Galaxy Z Fold 3 5G',
        costPrice: 0,
        variants: [
          {
            id: 'var-1',
            name: 'GALAXY Z FOLD 3 5G,UNIT ONLY 8/256GB',
            costPrice: 13000000,
          },
        ],
      },
    }

    const resolvedCost = resolveOrderItemCostPrice(orderItem)
    expect(resolvedCost).toBe(13000000)

    const totalCOGS = resolvedCost * orderItem.quantity
    expect(totalCOGS).toBe(26000000)
  })

  it('3. should fallback to product costPrice if variant has no specific costPrice', () => {
    const orderItem = {
      price: 5000000,
      costPrice: 0,
      quantity: 1,
      variantName: 'Standar',
      product: {
        name: 'Xiaomi 14',
        costPrice: 4200000,
        variants: [
          {
            id: 'var-std',
            name: 'Standar',
            costPrice: 0,
          },
        ],
      },
    }

    const resolvedCost = resolveOrderItemCostPrice(orderItem)
    expect(resolvedCost).toBe(4200000)
  })
})
