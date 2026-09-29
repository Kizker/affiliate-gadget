/**
 * Shopee-Style E-Commerce Relevance Scoring Algorithm
 *
 * Menghitung skor multi-faktor untuk filter/sorting default "Paling Relevan".
 * Memadukan kecocokan kata kunci, validasi pasar (penjualan), kepuasan pelanggan (rating & ulasan),
 * keterbaruan produk (freshness), dan promo/garansi.
 */

import { analyzeSmartQuery } from './smart-search'

export interface ProductRelevanceItem {
  id?: string
  name: string
  brand?: string | null
  description?: string | null
  price?: number | string | null
  originalPrice?: number | string | null
  rating?: number | null
  totalReview?: number | null
  soldCount?: number | null
  createdAt?: string | Date | null
  store?: {
    name?: string
    city?: string
  } | null
  warrantyDays?: number | null
  has3in1Bonus?: boolean | null
  [key: string]: any
}

/**
 * Hitung skor relevansi satu produk berdasarkan query pencarian dan sinyal e-commerce.
 */
export function calculateRelevanceScore(
  product: ProductRelevanceItem,
  searchQuery?: string | null
): number {
  let score = 0
  const q = (searchQuery || '').trim().toLowerCase()
  const name = (product.name || '').toLowerCase()
  const brand = (product.brand || '').toLowerCase()
  const desc = (product.description || '').toLowerCase()
  const storeName = (product.store?.name || '').toLowerCase()
  const storeCity = (product.store?.city || '').toLowerCase()

  // -------------------------------------------------------------
  // 1. TEXT RELEVANCE & SMART TYPO MATCHING
  // -------------------------------------------------------------
  if (q.length > 0) {
    const smart = analyzeSmartQuery(q)
    const queriesToTest = [
      { text: q, weight: 1.0 },
      ...(smart.hasCorrection
        ? [{ text: smart.effectiveQuery.toLowerCase(), weight: 0.95 }]
        : []),
    ]

    let bestTextScore = 0

    for (const item of queriesToTest) {
      const term = item.text
      let subScore = 0

      if (name === term) {
        subScore += 120
      } else if (name.startsWith(term)) {
        subScore += 85
      } else if (name.includes(term)) {
        subScore += 65
      }

      // Pemecahan per kata kunci (tokenized match)
      const tokens = term.split(/\s+/).filter((t) => t.length > 1)
      if (tokens.length > 1) {
        let matchedTokens = 0
        tokens.forEach((token) => {
          if (name.includes(token)) matchedTokens++
        })
        subScore += (matchedTokens / tokens.length) * 40
      }

      // Kecocokan Brand (Merek)
      if (
        brand &&
        (brand === term || brand.includes(term) || term.includes(brand))
      ) {
        subScore += 45
      }

      // Kecocokan Deskripsi Produk
      if (desc && desc.includes(term)) {
        subScore += 15
      }

      // Kecocokan Toko Cabang atau Kota
      if (storeName.includes(term) || storeCity.includes(term)) {
        subScore += 15
      }

      const weighted = subScore * item.weight
      if (weighted > bestTextScore) {
        bestTextScore = weighted
      }
    }

    score += bestTextScore
  } else {
    // Tanpa kata kunci: berikan baseline score untuk browsing katalog
    score += 50
  }

  // -------------------------------------------------------------
  // 2. SOCIAL PROOF & MARKET VALIDATION (Volume Penjualan Terjual)
  // Shopee memprioritaskan barang dengan penjualan terbukti
  // Menggunakan skala logaritmik agar tidak menenggelamkan produk berkualitas baru
  // -------------------------------------------------------------
  const sold = Math.max(0, Number(product.soldCount) || 0)
  if (sold > 0) {
    // log10(1) = 0, log10(10) = 1 (20 pts), log10(50) = ~1.7 (34 pts), log10(100) = 2 (40 pts)
    const salesScore = Math.min(50, Math.log10(1 + sold) * 20)
    score += salesScore
  }

  // -------------------------------------------------------------
  // 3. RATING & REPUTASI (Skor Ulasan & Kepuasan Pelanggan)
  // Produk rating tinggi dengan review banyak mendapatkan ranking teratas
  // -------------------------------------------------------------
  const rating = Number(product.rating) || 0
  const reviewCount = Math.max(0, Number(product.totalReview) || 0)

  if (rating >= 4.8) {
    score += 25
  } else if (rating >= 4.5) {
    score += 18
  } else if (rating >= 4.0) {
    score += 10
  } else if (rating > 0) {
    score += 4
  }

  // Total review confidence multiplier (makin banyak review, makin valid)
  if (reviewCount > 0) {
    const reviewScore = Math.min(15, Math.log10(1 + reviewCount) * 7.5)
    score += reviewScore
  }

  // -------------------------------------------------------------
  // 4. VALUE ADD & PROMO (Garansi, Bonus 3-in-1 & Diskon)
  // -------------------------------------------------------------
  if (product.warrantyDays && product.warrantyDays >= 30) {
    score += 8
  }
  if (product.has3in1Bonus) {
    score += 6
  }

  const price = Number(product.price) || 0
  const originalPrice = Number(product.originalPrice) || 0
  if (originalPrice > price && price > 0) {
    score += 6 // Sedang diskon
  }

  // -------------------------------------------------------------
  // 5. FRESHNESS & RECENCY (Katalog tetap dinamis untuk item baru)
  // -------------------------------------------------------------
  if (product.createdAt) {
    try {
      const createdDate = new Date(product.createdAt).getTime()
      const now = Date.now()
      const daysOld = (now - createdDate) / (1000 * 60 * 60 * 24)
      if (daysOld <= 7) {
        score += 12 // Produk baru minggu ini
      } else if (daysOld <= 30) {
        score += 6 // Produk baru bulan ini
      }
    } catch {
      // Ignore date parse issues
    }
  }

  return Math.round(score * 100) / 100
}

/**
 * Urutkan array produk berdasarkan skor Relevansi (Shopee multi-factor ranking).
 */
export function sortProductsByRelevance<T extends ProductRelevanceItem>(
  products: T[],
  searchQuery?: string | null
): T[] {
  return [...products].sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, searchQuery)
    const scoreB = calculateRelevanceScore(b, searchQuery)

    if (scoreB !== scoreA) {
      return scoreB - scoreA
    }

    // Tie breaker 1: Terjual lebih banyak
    const soldDiff = (Number(b.soldCount) || 0) - (Number(a.soldCount) || 0)
    if (soldDiff !== 0) return soldDiff

    // Tie breaker 2: Rating lebih tinggi
    const ratingDiff = (Number(b.rating) || 0) - (Number(a.rating) || 0)
    if (ratingDiff !== 0) return ratingDiff

    // Tie breaker 3: Review lebih banyak
    const reviewDiff =
      (Number(b.totalReview) || 0) - (Number(a.totalReview) || 0)
    if (reviewDiff !== 0) return reviewDiff

    return 0
  })
}
