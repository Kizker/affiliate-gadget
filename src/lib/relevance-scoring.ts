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
  category?: string | null
  condition?: string | null
  description?: string | null
  price?: number | string | null
  originalPrice?: number | string | null
  rating?: number | null
  totalReview?: number | null
  soldCount?: number | null
  createdAt?: string | Date | null
  storeId?: string | null
  store?: {
    id?: string
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

/**
 * Hitung skor kemiripan / relevansi produk rekomendasi terhadap produk yang sedang dilihat.
 * Memprioritaskan:
 * 1. Merek yang sama (Apple ke iPhone/MacBook/iPad lainnya)
 * 2. Kategori yang sama (SMARTPHONE ke smartphone lainnya)
 * 3. Token nama/tipe serupa (misal "Pro", "Max", "Ultra", "Fold", "Flip")
 * 4. Rentang harga mendekati (price proximity bracket)
 * 5. Toko fisik yang sama (memudahkan pembelian multi-item satu ongkir)
 * 6. Social proof & reputasi e-commerce (soldCount, rating, ulasan, garansi)
 */
export function calculateProductSimilarityScore(
  candidate: ProductRelevanceItem,
  target: ProductRelevanceItem
): number {
  if (candidate.id && target.id && candidate.id === target.id) {
    return -999999
  }

  let score = 0

  const targetBrand = (target.brand || '').trim().toLowerCase()
  const candBrand = (candidate.brand || '').trim().toLowerCase()
  const targetCategory = (target.category || '').trim().toLowerCase()
  const candCategory = (candidate.category || '').trim().toLowerCase()
  const targetName = (target.name || '').toLowerCase()
  const candName = (candidate.name || '').toLowerCase()

  // 1. Kecocokan Merek (Brand) — Bobot Terbesar
  if (targetBrand && candBrand && targetBrand === candBrand) {
    score += 100
  } else if (targetBrand && candName.includes(targetBrand)) {
    score += 75
  }

  // 2. Kecocokan Kategori (mis. Smartphone -> Smartphone)
  if (targetCategory && candCategory && targetCategory === candCategory) {
    score += 60
  }

  // 3. Kecocokan Token Nama (Karakteristik Seri / Model)
  const stopWords = new Set([
    'dan',
    'dengan',
    'yang',
    'atau',
    'untuk',
    'gb',
    'ram',
    'rom',
    'resmi',
    'sein',
    'ibox',
    'second',
    'mulus',
    'original',
  ])
  const targetTokens = targetName
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopWords.has(t))

  for (const token of targetTokens) {
    if (candName.includes(token)) {
      score += 20 // Setiap kata kunci (misal "iphone", "15", "pro", "max", "ultra")
    }
  }

  // 4. Proksimitas Rentang Harga (Price Bracket)
  const targetPrice = Number(target.price) || 0
  const candPrice = Number(candidate.price) || 0
  if (targetPrice > 0 && candPrice > 0) {
    const diffRatio = Math.abs(candPrice - targetPrice) / targetPrice
    if (diffRatio <= 0.25) {
      score += 35 // Sangat dekat (selisih <= 25%)
    } else if (diffRatio <= 0.5) {
      score += 20 // Cukup dekat (selisih <= 50%)
    } else if (diffRatio <= 1.0) {
      score += 10 // Dalam rentang 2x lipat
    }
  }

  // 5. Kesamaan Toko / Cabang PT (Memudahkan bundling ongkir)
  const targetStoreId = target.storeId || target.store?.id
  const candStoreId = candidate.storeId || candidate.store?.id
  if (targetStoreId && candStoreId && targetStoreId === candStoreId) {
    score += 20
  }

  // 6. Social Proof & Penjualan (Shopee style logaritmik)
  const sold = Math.max(0, Number(candidate.soldCount) || 0)
  if (sold > 0) {
    score += Math.min(30, Math.log10(1 + sold) * 15)
  }

  // 7. Rating & Ulasan
  const rating = Number(candidate.rating) || 0
  if (rating >= 4.8) score += 18
  else if (rating >= 4.5) score += 12
  else if (rating >= 4.0) score += 6

  const reviewCount = Math.max(0, Number(candidate.totalReview) || 0)
  if (reviewCount > 0) {
    score += Math.min(12, Math.log10(1 + reviewCount) * 6)
  }

  // 8. Nilai Tambah Garansi & Bonus
  if (candidate.warrantyDays && candidate.warrantyDays >= 30) score += 5
  if (candidate.has3in1Bonus) score += 5

  return Math.round(score * 100) / 100
}

/**
 * Urutkan produk rekomendasi berdasarkan skor relevansi terhadap produk target.
 */
export function sortRelatedProductsByRelevance<T extends ProductRelevanceItem>(
  candidates: T[],
  target: ProductRelevanceItem
): T[] {
  return [...candidates]
    .filter((c) => (c.id && target.id ? c.id !== target.id : true))
    .sort((a, b) => {
      const scoreA = calculateProductSimilarityScore(a, target)
      const scoreB = calculateProductSimilarityScore(b, target)

      if (scoreB !== scoreA) {
        return scoreB - scoreA
      }

      // Tie breaker 1: soldCount
      const soldDiff = (Number(b.soldCount) || 0) - (Number(a.soldCount) || 0)
      if (soldDiff !== 0) return soldDiff

      // Tie breaker 2: rating
      const ratingDiff = (Number(b.rating) || 0) - (Number(a.rating) || 0)
      if (ratingDiff !== 0) return ratingDiff

      // Tie breaker 3: price
      return (Number(b.price) || 0) - (Number(a.price) || 0)
    })
}
