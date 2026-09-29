import { describe, it, expect } from 'vitest'
import {
  calculateRelevanceScore,
  sortProductsByRelevance,
  ProductRelevanceItem,
} from '@/lib/relevance-scoring'

describe('Shopee-Style E-Commerce Relevance Scoring Engine Suite', () => {
  const sampleProducts: ProductRelevanceItem[] = [
    {
      id: 'p-1',
      name: 'Apple iPhone 15 Pro Max 256GB Natural Titanium',
      brand: 'Apple',
      description: 'Kondisi Like New 99% Garansi Resmi iBox',
      price: 19999000,
      originalPrice: 21999000,
      rating: 4.9,
      totalReview: 85,
      soldCount: 42,
      warrantyDays: 30,
      has3in1Bonus: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-2',
      name: 'Samsung Galaxy S24 Ultra 512GB Titanium Black',
      brand: 'Samsung',
      description: 'Layar Dynamic AMOLED mulus 99%',
      price: 18500000,
      originalPrice: 20000000,
      rating: 4.8,
      totalReview: 40,
      soldCount: 25,
      warrantyDays: 30,
      has3in1Bonus: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-3',
      name: 'Xiaomi 14 Ultra 512GB Leica Camera',
      brand: 'Xiaomi',
      description: 'Flagship kamera Leica',
      price: 14999000,
      originalPrice: 15999000,
      rating: 4.4,
      totalReview: 10,
      soldCount: 8,
      warrantyDays: 30,
      has3in1Bonus: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-4',
      name: 'Case iPhone 15 Pro Max Clear Bumper',
      brand: 'Apple',
      description: 'Aksesoris case pelindung',
      price: 150000,
      originalPrice: 150000,
      rating: 4.2,
      totalReview: 5,
      soldCount: 3,
      warrantyDays: 0,
      has3in1Bonus: false,
      createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    },
  ]

  it('ranks exact product search queries on top of generic or secondary matches', () => {
    // When searching for "iPhone 15 Pro Max"
    const scoreIPhone = calculateRelevanceScore(
      sampleProducts[0],
      'iPhone 15 Pro Max'
    )
    const scoreCase = calculateRelevanceScore(
      sampleProducts[3],
      'iPhone 15 Pro Max'
    )
    const scoreSamsung = calculateRelevanceScore(
      sampleProducts[1],
      'iPhone 15 Pro Max'
    )

    // iPhone smartphone should score higher than case accessory or unrelated Samsung
    expect(scoreIPhone).toBeGreaterThan(scoreCase)
    expect(scoreIPhone).toBeGreaterThan(scoreSamsung)
  })

  it('correctly boosts products with higher sales volume (Shopee social proof logic)', () => {
    const highSales: ProductRelevanceItem = {
      name: 'Smartphone Test',
      soldCount: 150,
      rating: 4.8,
      totalReview: 50,
    }
    const lowSales: ProductRelevanceItem = {
      name: 'Smartphone Test',
      soldCount: 2,
      rating: 4.8,
      totalReview: 50,
    }

    const highSalesScore = calculateRelevanceScore(highSales)
    const lowSalesScore = calculateRelevanceScore(lowSales)

    expect(highSalesScore).toBeGreaterThan(lowSalesScore)
  })

  it('rewards higher customer satisfaction rating and review quantity', () => {
    const highRating: ProductRelevanceItem = {
      name: 'Gadget Model X',
      soldCount: 10,
      rating: 4.9,
      totalReview: 35,
    }
    const lowRating: ProductRelevanceItem = {
      name: 'Gadget Model X',
      soldCount: 10,
      rating: 3.5,
      totalReview: 2,
    }

    expect(calculateRelevanceScore(highRating)).toBeGreaterThan(
      calculateRelevanceScore(lowRating)
    )
  })

  it('rewards products with 30-day warranty, 3-in-1 bonus, and promo discounts', () => {
    const withPerks: ProductRelevanceItem = {
      name: 'Gadget Y',
      soldCount: 10,
      rating: 4.5,
      warrantyDays: 30,
      has3in1Bonus: true,
      price: 1000000,
      originalPrice: 1200000,
    }
    const withoutPerks: ProductRelevanceItem = {
      name: 'Gadget Y',
      soldCount: 10,
      rating: 4.5,
      warrantyDays: 0,
      has3in1Bonus: false,
      price: 1000000,
      originalPrice: 1000000,
    }

    expect(calculateRelevanceScore(withPerks)).toBeGreaterThan(
      calculateRelevanceScore(withoutPerks)
    )
  })

  it('sortProductsByRelevance yields balanced and ordered results for default browsing', () => {
    const sorted = sortProductsByRelevance(sampleProducts)

    // The top product should be the highly-rated, highly-sold flagship (iPhone 15 Pro Max)
    expect(sorted[0].id).toBe('p-1')
    // Followed by Samsung S24 Ultra
    expect(sorted[1].id).toBe('p-2')
    // The accessory with low sales, low rating and old age should be at the bottom
    expect(sorted[sorted.length - 1].id).toBe('p-4')
  })

  it('sortProductsByRelevance correctly prioritizes query intent when search query is specified', () => {
    const sorted = sortProductsByRelevance(sampleProducts, 'Samsung')

    expect(sorted[0].brand).toBe('Samsung')
    expect(sorted[0].name).toContain('Samsung Galaxy S24')
  })
})
