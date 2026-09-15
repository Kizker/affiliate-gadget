import { describe, it, expect } from 'vitest'
import {
  calculateWeightShipping,
  calculateBilledKg,
  BASE_SHIPPING_COST,
  DEFAULT_PRICE_PER_KG,
  DEFAULT_WEIGHT_GRAM,
  WEIGHT_THRESHOLD_GRAM,
  COURIER_MULTIPLIERS,
} from '../../src/lib/constants/shipping'

describe('Weight-Based Shipping Flow & Form-to-Checkout Consistency', () => {
  describe('1. Individual Product Weight Scenarios', () => {
    it('should calculate base shipping (Rp 15.000) for default 500g product (<= 1kg)', () => {
      const weightGram = 500
      const billedKg = calculateBilledKg(weightGram)
      const cost = calculateWeightShipping(
        weightGram,
        DEFAULT_PRICE_PER_KG,
        'JNE',
        'REG'
      )

      expect(billedKg).toBe(1)
      expect(cost).toBe(15000)
    })

    it('should calculate Rp 35.000 for product edited to 2000g (2kg) on JNE REG', () => {
      const weightGram = 2000
      const billedKg = calculateBilledKg(weightGram)
      // 2000g -> 2kg -> extraKg = 1 -> 15.000 + (1 * 20.000) = 35.000
      const cost = calculateWeightShipping(
        weightGram,
        DEFAULT_PRICE_PER_KG,
        'JNE',
        'REG'
      )

      expect(billedKg).toBe(2)
      expect(cost).toBe(35000)
    })

    it('should calculate Rp 63.000 for 2000g product on JNE YES (1.8x)', () => {
      const weightGram = 2000
      // 35.000 * 1.8 = 63.000
      const cost = calculateWeightShipping(
        weightGram,
        DEFAULT_PRICE_PER_KG,
        'JNE',
        'YES'
      )

      expect(cost).toBe(63000)
    })

    it('should calculate Rp 77.000 for 2000g product on GOJEK INSTANT (2.2x)', () => {
      const weightGram = 2000
      // 35.000 * 2.2 = 77.000
      const cost = calculateWeightShipping(
        weightGram,
        DEFAULT_PRICE_PER_KG,
        'GOJEK',
        'INSTANT'
      )

      expect(cost).toBe(77000)
    })

    it('should calculate Rp 52.500 for 2000g product on GOJEK SAMEDAY (1.5x)', () => {
      const weightGram = 2000
      // 35.000 * 1.5 = 52.500
      const cost = calculateWeightShipping(
        weightGram,
        DEFAULT_PRICE_PER_KG,
        'GOJEK',
        'SAMEDAY'
      )

      expect(cost).toBe(52500)
    })
  })

  describe('2. Multi-Quantity & Mixed Item Weight Accumulation', () => {
    it('should accumulate 2 x 2000g = 4000g (4kg) -> 15.000 + (3 * 20.000) = Rp 75.000', () => {
      const items = [{ weightGram: 2000, quantity: 2 }]
      const totalWeight = items.reduce(
        (sum, item) => sum + item.weightGram * item.quantity,
        0
      )
      const billedKg = calculateBilledKg(totalWeight)
      const cost = calculateWeightShipping(
        totalWeight,
        DEFAULT_PRICE_PER_KG,
        'JNE',
        'REG'
      )

      expect(totalWeight).toBe(4000)
      expect(billedKg).toBe(4)
      expect(cost).toBe(75000)
    })

    it('should accumulate mixed items (1 x 2000g + 2 x 500g = 3000g = 3kg) -> Rp 55.000', () => {
      const items = [
        { weightGram: 2000, quantity: 1 },
        { weightGram: 500, quantity: 2 },
      ]
      const totalWeight = items.reduce(
        (sum, item) => sum + item.weightGram * item.quantity,
        0
      )
      const billedKg = calculateBilledKg(totalWeight)
      // 3000g -> 3kg -> extraKg = 2 -> 15.000 + (2 * 20.000) = 55.000
      const cost = calculateWeightShipping(
        totalWeight,
        DEFAULT_PRICE_PER_KG,
        'JNE',
        'REG'
      )

      expect(totalWeight).toBe(3000)
      expect(billedKg).toBe(3)
      expect(cost).toBe(55000)
    })

    it('should round up fractional weights (e.g. 1 x 1250g = 1250g -> billed 2kg) -> Rp 35.000', () => {
      const totalWeight = 1250
      const billedKg = calculateBilledKg(totalWeight)
      const cost = calculateWeightShipping(
        totalWeight,
        DEFAULT_PRICE_PER_KG,
        'JNE',
        'REG'
      )

      expect(billedKg).toBe(2)
      expect(cost).toBe(35000)
    })
  })

  describe('3. Custom Store pricePerKg Sensitivity', () => {
    it('should use custom pricePerKg (Rp 25.000) for 2000g item -> 15.000 + 25.000 = Rp 40.000', () => {
      const weightGram = 2000
      const customPricePerKg = 25000
      const cost = calculateWeightShipping(
        weightGram,
        customPricePerKg,
        'JNE',
        'REG'
      )

      expect(cost).toBe(40000)
    })

    it('should maintain base price (Rp 15.000) even with custom pricePerKg if weight <= 1kg', () => {
      const weightGram = 800
      const customPricePerKg = 30000
      const cost = calculateWeightShipping(
        weightGram,
        customPricePerKg,
        'JNE',
        'REG'
      )

      expect(cost).toBe(15000)
    })
  })

  describe('4. Cart Transformation & Weight Consistency', () => {
    it('should preserve product.weightGram and product.pricePerKg in cart item mapping', () => {
      const rawProduct = {
        id: 'prod-2000g',
        name: 'iPad Pro 12.9 M2',
        price: 18000000,
        images: ['https://example.com/ipad.jpg'],
        stock: 5,
        variants: [],
        weightGram: 2000,
        pricePerKg: 25000,
      }

      // Mock the cart mapping logic from /api/cart
      const cartItem = {
        id: 'cart-item-1',
        type: 'PRODUCT',
        productId: rawProduct.id,
        quantity: 1,
        name: rawProduct.name,
        price: rawProduct.price,
        image: rawProduct.images[0],
        stock: rawProduct.stock,
        weightGram: rawProduct.weightGram ?? 500,
        pricePerKg: rawProduct.pricePerKg ?? 20000,
      }

      expect(cartItem.weightGram).toBe(2000)
      expect(cartItem.pricePerKg).toBe(25000)

      // Calculate checkout totals with this item
      const checkoutTotalWeight = cartItem.weightGram * cartItem.quantity
      const checkoutShippingCost = calculateWeightShipping(
        checkoutTotalWeight,
        cartItem.pricePerKg,
        'JNE',
        'REG'
      )

      expect(checkoutTotalWeight).toBe(2000)
      expect(checkoutShippingCost).toBe(40000) // 15.000 + 25.000
    })
  })
})
