import { describe, it, expect } from 'vitest'

describe('Admin Products API Cost Price & Variant Validation (Phase 6)', () => {
  function validateProductCostPrice(costPrice: unknown): {
    valid: boolean
    error?: string
    value: number
  } {
    if (costPrice === undefined || costPrice === null || costPrice === '') {
      return { valid: true, value: 0 }
    }
    const num = Number(costPrice)
    if (isNaN(num)) {
      return {
        valid: false,
        error: 'Harga modal harus berupa angka valid',
        value: 0,
      }
    }
    if (num < 0) {
      return {
        valid: false,
        error: 'Harga modal (costPrice) tidak boleh negatif',
        value: 0,
      }
    }
    return { valid: true, value: num }
  }

  function calculateMargin(
    price: number,
    costPrice: number
  ): { grossProfit: number; grossMarginPct: number } {
    const grossProfit = price - costPrice
    const grossMarginPct =
      price > 0 ? Number(((grossProfit / price) * 100).toFixed(2)) : 0
    return { grossProfit, grossMarginPct }
  }

  it('should accept valid positive costPrice and default empty to 0', () => {
    expect(validateProductCostPrice(15000000)).toEqual({
      valid: true,
      value: 15000000,
    })
    expect(validateProductCostPrice('17500000')).toEqual({
      valid: true,
      value: 17500000,
    })
    expect(validateProductCostPrice(0)).toEqual({ valid: true, value: 0 })
    expect(validateProductCostPrice(undefined)).toEqual({
      valid: true,
      value: 0,
    })
    expect(validateProductCostPrice(null)).toEqual({ valid: true, value: 0 })
    expect(validateProductCostPrice('')).toEqual({ valid: true, value: 0 })
  })

  it('should reject negative costPrice', () => {
    const result = validateProductCostPrice(-5000)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Harga modal (costPrice) tidak boleh negatif')
  })

  it('should correctly compute item gross profit and margin percentage', () => {
    const price = 22999000
    const costPrice = 20200000
    const { grossProfit, grossMarginPct } = calculateMargin(price, costPrice)

    expect(grossProfit).toBe(2799000)
    expect(grossMarginPct).toBe(12.17)
  })

  it('should correctly handle zero price or zero cost', () => {
    const { grossProfit, grossMarginPct } = calculateMargin(1000000, 0)
    expect(grossProfit).toBe(1000000)
    expect(grossMarginPct).toBe(100)

    const zeroPrice = calculateMargin(0, 0)
    expect(zeroPrice.grossProfit).toBe(0)
    expect(zeroPrice.grossMarginPct).toBe(0)
  })

  it('should map variant updates with optional costPrice correctly', () => {
    const variantsPayload = [
      { id: 'v1', price: 21999000, costPrice: 19500000, stock: 10 },
      { id: 'v2', price: 23999000, costPrice: null, stock: 5 },
    ]

    const mapped = variantsPayload.map((v) => ({
      id: v.id,
      price: v.price,
      costPrice: v.costPrice != null ? Number(v.costPrice) : null,
      stock: v.stock,
    }))

    expect(mapped[0].costPrice).toBe(19500000)
    expect(mapped[1].costPrice).toBeNull()
  })
})
