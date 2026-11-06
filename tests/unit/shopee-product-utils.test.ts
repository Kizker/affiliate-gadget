import { describe, it, expect } from 'vitest'
import {
  evaluateProduct,
  categorizeProductsByTab,
  formatPriceDisplay,
} from '@/lib/shopee-product-utils'

describe('Shopee-Style Product Evaluation Utilities', () => {
  it('1. Mendeteksi variasi tanpa SKU', () => {
    const product = {
      id: 'prod-1',
      name: 'iPhone 15 Pro',
      price: 18000000,
      costPrice: 15000000,
      isActive: true,
      variants: [
        {
          id: 'v1',
          name: '128GB Black',
          price: 18000000,
          stock: 5,
          sku: 'IP15P-128-BLK',
        },
        { id: 'v2', name: '256GB Black', price: 20000000, stock: 5, sku: '' }, // Kosong
      ],
    }

    const evalResult = evaluateProduct(product)
    expect(evalResult.hasNoSku).toBe(true)
    expect(evalResult.issues.some((i) => i.type === 'NO_SKU')).toBe(true)
    expect(evalResult.statusTab).toBe('ACTION_REQUIRED')
  })

  it('2. Mendeteksi harga jual di bawah HPP (modal)', () => {
    const product = {
      id: 'prod-2',
      name: 'Samsung Galaxy S24',
      price: 12000000,
      costPrice: 14000000, // HPP > Harga jual
      isActive: true,
      variants: [],
      stock: 5,
    }

    const evalResult = evaluateProduct(product)
    expect(evalResult.hasPriceBelowCost).toBe(true)
    expect(evalResult.issues.some((i) => i.type === 'PRICE_BELOW_COST')).toBe(
      true
    )
    expect(evalResult.statusTab).toBe('ACTION_REQUIRED')
  })

  it('3. Mendeteksi rasio harga termahal dan termurah melebihi 7x', () => {
    const product = {
      id: 'prod-3',
      name: 'Gadget Bundle',
      price: 1000000,
      isActive: true,
      variants: [
        {
          id: 'v1',
          name: 'Case Only',
          price: 1000000,
          stock: 5,
          sku: 'CASE-01',
        },
        {
          id: 'v2',
          name: 'Full Unit 1TB',
          price: 8000000,
          stock: 5,
          sku: 'UNIT-1TB',
        }, // 8x ratio!
      ],
    }

    const evalResult = evaluateProduct(product)
    expect(evalResult.hasPriceRatioExceeded).toBe(true)
    expect(
      evalResult.issues.some((i) => i.type === 'PRICE_RATIO_EXCEEDED')
    ).toBe(true)
    expect(evalResult.statusTab).toBe('ACTION_REQUIRED')
  })

  it('4. Mendeteksi produk aktif dengan stok habis', () => {
    const product = {
      id: 'prod-4',
      name: 'Xiaomi 14',
      price: 11000000,
      costPrice: 9000000,
      isActive: true,
      variants: [
        { id: 'v1', name: 'Black', price: 11000000, stock: 0, sku: 'MI14-BLK' },
      ],
    }

    const evalResult = evaluateProduct(product)
    expect(evalResult.totalStock).toBe(0)
    expect(evalResult.hasOutOfStockActive).toBe(true)
    expect(
      evalResult.issues.some((i) => i.type === 'OUT_OF_STOCK_ACTIVE')
    ).toBe(true)
    expect(evalResult.statusTab).toBe('ACTION_REQUIRED')
  })

  it('5. Mendeteksi stok berbeda untuk SKU yang sama (SKU Desync)', () => {
    const product = {
      id: 'prod-5',
      name: 'Sony WH-1000XM5',
      price: 5000000,
      costPrice: 4000000,
      isActive: true,
      variants: [
        {
          id: 'v1',
          name: 'Varian Toko 1',
          price: 5000000,
          stock: 10,
          sku: 'SONY-WH-BLK',
        },
        {
          id: 'v2',
          name: 'Varian Toko 2',
          price: 5000000,
          stock: 4,
          sku: 'SONY-WH-BLK',
        }, // SKU sama tapi stok 4 != 10
      ],
    }

    const evalResult = evaluateProduct(product)
    expect(evalResult.hasSkuStockDesync).toBe(true)
    expect(evalResult.issues.some((i) => i.type === 'SKU_STOCK_DESYNC')).toBe(
      true
    )
    expect(evalResult.statusTab).toBe('ACTION_REQUIRED')
  })

  it('6. Mengkategorikan tab Shopee secara konsisten (Semua, Live, Perlu tindakan, Disembunyikan)', () => {
    const list = [
      // Normal Live
      evaluateProduct({
        id: 'p1',
        name: 'Normal Live',
        price: 10000000,
        costPrice: 8000000,
        stock: 5,
        isActive: true,
        model: 'NL-01',
      }),
      // Hidden
      evaluateProduct({
        id: 'p2',
        name: 'Hidden Prod',
        price: 10000000,
        costPrice: 8000000,
        stock: 5,
        isActive: false,
        model: 'HP-01',
      }),
      // Has Issue (No SKU)
      evaluateProduct({
        id: 'p3',
        name: 'Issue Prod',
        price: 10000000,
        costPrice: 8000000,
        stock: 5,
        isActive: true,
        variants: [{ id: 'v1', name: 'v', price: 10000000, stock: 5, sku: '' }],
      }),
    ]

    const stats = categorizeProductsByTab(list)
    expect(stats.allCount).toBe(3)
    expect(stats.liveCount).toBe(1)
    expect(stats.hiddenCount).toBe(1)
    expect(stats.actionRequiredCount).toBe(1)
  })

  it('7. Format tampilan rentang harga Shopee', () => {
    expect(formatPriceDisplay(15000000, 15000000)).toMatch(/Rp\s*15\.000\.000/)
    expect(formatPriceDisplay(15000000, 20000000)).toMatch(
      /Rp\s*15\.000\.000\s*-\s*Rp\s*20\.000\.000/
    )
  })
})
