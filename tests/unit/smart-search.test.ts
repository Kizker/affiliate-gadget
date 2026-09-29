import { describe, it, expect } from 'vitest'
import {
  analyzeSmartQuery,
  matchesSmartProduct,
  filterGadgetsWithSmartSearch,
  calculateLevenshtein,
} from '@/lib/smart-search'

describe('Smart Search & Typo-Tolerant Engine Suite', () => {
  const dummyCatalog = [
    {
      id: 'p-iphone-15',
      name: 'Apple iPhone 15 Pro Max 256GB Natural Titanium',
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      description: 'Layar Super Retina XDR Like New 99%',
      store: { name: 'Roxy Mas Jakarta', city: 'Jakarta Pusat' },
    },
    {
      id: 'p-samsung-s24',
      name: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray',
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      description: 'Dynamic AMOLED 2X Snapdragon 8 Gen 3',
      store: { name: 'WTC Surabaya', city: 'Surabaya' },
    },
    {
      id: 'p-xiaomi-14',
      name: 'Xiaomi 14 256GB Leica Optical Camera',
      brand: 'Xiaomi',
      model: 'Xiaomi 14',
      description: 'Compact Flagship Leica Summilux',
      store: { name: 'BEC Bandung', city: 'Bandung' },
    },
    {
      id: 'p-macbook-air',
      name: 'Apple MacBook Air 15 M3 16GB 512GB',
      brand: 'Apple',
      model: 'MacBook Air 15 M3',
      description: 'Liquid Retina Display Midnight',
      store: { name: 'Roxy Mas Jakarta', city: 'Jakarta Pusat' },
    },
  ]

  it('calculates accurate Levenshtein edit distance', () => {
    expect(calculateLevenshtein('ipone', 'iphone')).toBe(1)
    expect(calculateLevenshtein('samsung', 'samsung')).toBe(0)
    expect(calculateLevenshtein('samung', 'samsung')).toBe(1)
    expect(calculateLevenshtein('titanum', 'titanium')).toBe(1)
  })

  it('detects and auto-corrects Indonesian phonetic gadget typos ("Ipone" -> "iphone")', () => {
    const r1 = analyzeSmartQuery('Ipone')
    expect(r1.hasCorrection).toBe(true)
    expect(r1.effectiveQuery.toLowerCase()).toBe('iphone')

    const r2 = analyzeSmartQuery('aifon 15')
    expect(r2.hasCorrection).toBe(true)
    expect(r2.effectiveQuery.toLowerCase()).toBe('iphone 15')

    const r3 = analyzeSmartQuery('samung s24')
    expect(r3.hasCorrection).toBe(true)
    expect(r3.effectiveQuery.toLowerCase()).toBe('samsung s24')

    const r4 = analyzeSmartQuery('somay leica')
    expect(r4.hasCorrection).toBe(true)
    expect(r4.effectiveQuery.toLowerCase()).toBe('xiaomi leica')

    const r5 = analyzeSmartQuery('mekbuk air')
    expect(r5.hasCorrection).toBe(true)
    expect(r5.effectiveQuery.toLowerCase()).toBe('macbook air')
  })

  it('successfully matches iPhone product when user searches with typo "Ipone"', () => {
    const iphoneProduct = dummyCatalog[0]
    const isMatch = matchesSmartProduct(iphoneProduct, 'Ipone')
    expect(isMatch).toBe(true)

    // Should NOT match Samsung product
    const samsungProduct = dummyCatalog[1]
    const isSamsungMatch = matchesSmartProduct(samsungProduct, 'Ipone')
    expect(isSamsungMatch).toBe(false)
  })

  it('successfully matches products with compound typos like "Ipone 15 pormax titanum"', () => {
    const iphoneProduct = dummyCatalog[0]
    const isMatch = matchesSmartProduct(
      iphoneProduct,
      'Ipone 15 pormax titanum'
    )
    expect(isMatch).toBe(true)
  })

  it('filters catalog seamlessly with filterGadgetsWithSmartSearch on "Ipone"', () => {
    const { filtered, smartAnalysis } = filterGadgetsWithSmartSearch(
      dummyCatalog,
      'Ipone'
    )

    expect(smartAnalysis.hasCorrection).toBe(true)
    expect(smartAnalysis.effectiveQuery).toBe('iphone')
    expect(filtered.length).toBeGreaterThanOrEqual(1)
    expect(filtered[0].id).toBe('p-iphone-15')
  })

  it('handles fuzzy typos against catalog vocabulary (e.g. "Galaxt", "Mackbook")', () => {
    const { filtered: samsungResults } = filterGadgetsWithSmartSearch(
      dummyCatalog,
      'Galaxt'
    )
    expect(samsungResults.some((p) => p.name.includes('Galaxy'))).toBe(true)

    const { filtered: macResults } = filterGadgetsWithSmartSearch(
      dummyCatalog,
      'Mackbook'
    )
    expect(macResults.some((p) => p.name.includes('MacBook'))).toBe(true)
  })

  it('preserves exact query behavior when no typo is present', () => {
    const result = analyzeSmartQuery('iPhone 15 Pro')
    expect(result.hasCorrection).toBe(false)
    expect(result.effectiveQuery).toBe('iphone 15 pro')
  })
})
