import { describe, it, expect } from 'vitest'
import {
  normalizeCapacity,
  extractCleanColor,
  normalizeSeries,
  buildCatalogHierarchy,
} from '@/lib/catalog-hierarchy'

describe('Bulk Color Variant Hierarchy Engine (Unit Tests)', () => {
  describe('Capacity Normalization (RAM & Storage)', () => {
    it('should correctly parse combined slash patterns (e.g. 12/512 or 12GB/512GB)', () => {
      const res1 = normalizeCapacity(
        '12GB/512GB White',
        null,
        null,
        'Samsung S24 FE'
      )
      expect(res1.ram).toBe('12GB')
      expect(res1.storage).toBe('512GB')
      expect(res1.capacityKey).toBe('12GB / 512GB')

      const res2 = normalizeCapacity('8/256 Black', null, null, 'Samsung S24')
      expect(res2.ram).toBe('8GB')
      expect(res2.storage).toBe('256GB')
      expect(res2.capacityKey).toBe('8GB / 256GB')

      const res3 = normalizeCapacity(
        '16/1TB Phantom Black',
        null,
        null,
        'ROG Phone 8 Pro'
      )
      expect(res3.ram).toBe('16GB')
      expect(res3.storage).toBe('1TB')
      expect(res3.capacityKey).toBe('16GB / 1TB')
    })

    it('should prioritize explicit fields if present on variant model', () => {
      const res = normalizeCapacity(
        'Custom Variant',
        '12GB',
        '512GB',
        'Samsung S24 FE'
      )
      expect(res.ram).toBe('12GB')
      expect(res.storage).toBe('512GB')
      expect(res.capacityKey).toBe('12GB / 512GB')
    })

    it('should gracefully handle standalone storage or non-specified units', () => {
      const res = normalizeCapacity(
        '512GB White',
        null,
        null,
        'Google Pixel 10'
      )
      expect(res.storage).toBe('512GB')
      expect(res.capacityKey).toBe('512GB')

      const fallback = normalizeCapacity('Unit Only', null, null, 'Gadget')
      expect(fallback.capacityKey).toBe('Standar')
    })
  })

  describe('Color Extraction', () => {
    it('should cleanly extract color names while stripping RAM/storage identifiers', () => {
      expect(extractCleanColor('12GB/512GB White', null)).toBe('White')
      expect(extractCleanColor('12/512 Black', null)).toBe('Black')
      expect(extractCleanColor('12GB/512GB Pink', null)).toBe('Pink')
      expect(extractCleanColor('12GB/1TB, Pink Jade Edit!', null)).toBe(
        'Pink Jade Edit!'
      )
      expect(extractCleanColor('8/256 - Titanium Gray', null)).toBe(
        'Titanium Gray'
      )
      expect(extractCleanColor('Standar', 'White')).toBe('White')
    })
  })

  describe('Series & Model Normalization', () => {
    it('should clean vendor prefixes and isolate the series model name', () => {
      expect(
        normalizeSeries('SEIN Samsung Galaxy S24 FE', 'Samsung S24 FE')
      ).toBe('Samsung S24 FE')
      expect(
        normalizeSeries(
          'Google Pixel 10 Pro 12GB/1TB Pink Jade Edit!',
          'Google Pixel 10 Pro'
        )
      ).toBe('Google Pixel 10 Pro')
      expect(
        normalizeSeries('SEIN Samsung Galaxy S24 12/512GB White', null)
      ).toBe('Samsung Galaxy S24')
    })
  })

  describe('4-Level Hierarchy Tree Construction', () => {
    it('should group mock catalog into Brand -> Series -> Capacity -> Color Variants', () => {
      const mockProducts = [
        {
          id: 'prod-s24fe',
          name: 'Samsung S24 FE',
          model: 'Samsung S24 FE',
          brand: 'Samsung',
          price: 14500000,
          stock: 25,
          isActive: true,
          variants: [
            {
              id: 'var-s24fe-w',
              name: '12GB/512GB White',
              color: 'White',
              ram: '12GB',
              storage: '512GB',
              price: 14500000,
              stock: 12,
              sku: 'S24FE-512-WH',
            },
            {
              id: 'var-s24fe-b',
              name: '12GB/512GB Black',
              color: 'Black',
              ram: '12GB',
              storage: '512GB',
              price: 14500000,
              stock: 8,
              sku: 'S24FE-512-BK',
            },
            {
              id: 'var-s24fe-p',
              name: '12GB/512GB Pink',
              color: 'Pink',
              ram: '12GB',
              storage: '512GB',
              price: 14500000,
              stock: 5,
              sku: 'S24FE-512-PK',
            },
          ],
        },
        {
          id: 'prod-s24',
          name: 'Samsung S24',
          model: 'Samsung S24',
          brand: 'Samsung',
          price: 16000000,
          stock: 15,
          isActive: true,
          variants: [
            {
              id: 'var-s24-w',
              name: '12GB/512GB White',
              color: 'White',
              ram: '12GB',
              storage: '512GB',
              price: 16000000,
              stock: 6,
              sku: 'S24-512-WH',
            },
            {
              id: 'var-s24-b',
              name: '12GB/512GB Black',
              color: 'Black',
              ram: '12GB',
              storage: '512GB',
              price: 16000000,
              stock: 5,
              sku: 'S24-512-BK',
            },
            {
              id: 'var-s24-p',
              name: '12GB/512GB Pink',
              color: 'Pink',
              ram: '12GB',
              storage: '512GB',
              price: 16000000,
              stock: 4,
              sku: 'S24-512-PK',
            },
          ],
        },
      ]

      const hierarchy = buildCatalogHierarchy(mockProducts)

      // 1. Level 1: Brand
      expect(hierarchy.length).toBe(1)
      const samsungBrand = hierarchy[0]
      expect(samsungBrand.brand).toBe('Samsung')
      expect(samsungBrand.series.length).toBe(2)
      expect(samsungBrand.totalVariants).toBe(6)

      // 2. Level 2: Series
      const s24feSeries = samsungBrand.series.find(
        (s) => s.seriesName === 'Samsung S24 FE'
      )
      expect(s24feSeries).toBeDefined()
      expect(s24feSeries?.capacities.length).toBe(1)

      // 3. Level 3: Capacity
      const cap512 = s24feSeries?.capacities[0]
      expect(cap512?.capacityKey).toBe('12GB / 512GB')
      expect(cap512?.isAllSamePrice).toBe(true)
      expect(cap512?.commonPrice).toBe(14500000)
      expect(cap512?.totalStock).toBe(25)

      // 4. Level 4: Color Variants
      expect(cap512?.variants.length).toBe(3)
      const colors = cap512?.variants.map((v) => v.color)
      expect(colors).toEqual(['White', 'Black', 'Pink'])
    })
  })

  describe('Bulk Color Variant Update Simulation', () => {
    it('should update all color variants in a capacity group simultaneously', () => {
      // Current variants under Samsung S24 FE 12/512
      const variants = [
        { id: 'v1', color: 'White', price: 14500000, stock: 10 },
        { id: 'v2', color: 'Black', price: 14500000, stock: 8 },
        { id: 'v3', color: 'Pink', price: 14500000, stock: 5 },
      ]

      // Admin executes bulk price update for this capacity tier
      const targetVariantIds = ['v1', 'v2', 'v3']
      const newPrice = 13999000

      // Execute bulk update
      const updatedVariants = variants.map((v) => {
        if (targetVariantIds.includes(v.id)) {
          return { ...v, price: newPrice }
        }
        return v
      })

      // Verify all colors now have the updated price
      expect(updatedVariants.every((v) => v.price === 13999000)).toBe(true)
      expect(updatedVariants[0].color).toBe('White')
      expect(updatedVariants[1].color).toBe('Black')
      expect(updatedVariants[2].color).toBe('Pink')

      // Recalculate product aggregate price
      const minPrice = Math.min(...updatedVariants.map((v) => v.price))
      expect(minPrice).toBe(13999000)
    })
  })
})
