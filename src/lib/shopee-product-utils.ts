/**
 * Shopee-Style Product Evaluation & Catalog Normalization Utilities
 * Implements strict consistency, issue detection ("Perlu Tindakan"),
 * master SKU sync, and price ratio validation.
 */

export interface ProductVariantData {
  id?: string
  name: string
  ram?: string | null
  storage?: string | null
  color?: string | null
  price: number | string
  costPrice?: number | string | null
  stock: number | string
  sku?: string | null
}

export interface ProductIssue {
  type:
    | 'NO_SKU'
    | 'PRICE_BELOW_COST'
    | 'PRICE_RATIO_EXCEEDED'
    | 'OUT_OF_STOCK_ACTIVE'
    | 'SKU_STOCK_DESYNC'
  label: string
  detail: string
  severity: 'error' | 'warning'
}

export interface EvaluatedProduct {
  id: string
  name: string
  brand: string
  category: string
  model: string | null
  condition: string
  price: number
  costPrice: number | null
  stock: number
  totalStock: number
  variantCount: number
  minPrice: number
  maxPrice: number
  minCostPrice: number | null
  maxCostPrice: number | null
  isActive: boolean
  isTaxable: boolean
  images: string[]
  storeId?: string | null
  storeName?: string | null
  storeCity?: string | null
  issues: ProductIssue[]
  statusTab: 'LIVE' | 'ACTION_REQUIRED' | 'HIDDEN'
  hasNoSku: boolean
  hasPriceBelowCost: boolean
  hasPriceRatioExceeded: boolean
  hasOutOfStockActive: boolean
  hasSkuStockDesync: boolean
  variants: ProductVariantData[]
  raw: any
}

/**
 * Calculates unified stats and detects all issues for a single product
 */
export function evaluateProduct(
  product: any,
  allStoreProducts: any[] = []
): EvaluatedProduct {
  const variants: ProductVariantData[] = Array.isArray(product.variants)
    ? product.variants
    : []

  const variantCount = variants.length

  // Calculate prices
  const prices: number[] =
    variants.length > 0
      ? variants.map((v) => Number(v.price) || 0)
      : [Number(product.price) || 0]

  const minPrice =
    prices.length > 0 ? Math.min(...prices) : Number(product.price) || 0
  const maxPrice =
    prices.length > 0 ? Math.max(...prices) : Number(product.price) || 0

  // Calculate cost prices (HPP)
  const costPrices: number[] = []
  if (product.costPrice !== undefined && product.costPrice !== null) {
    costPrices.push(Number(product.costPrice) || 0)
  }
  variants.forEach((v) => {
    if (v.costPrice !== undefined && v.costPrice !== null) {
      costPrices.push(Number(v.costPrice) || 0)
    }
  })
  const minCostPrice = costPrices.length > 0 ? Math.min(...costPrices) : null
  const maxCostPrice = costPrices.length > 0 ? Math.max(...costPrices) : null

  // Calculate unified total stock
  const totalStock =
    variants.length > 0
      ? variants.reduce((sum, v) => sum + (parseInt(String(v.stock)) || 0), 0)
      : parseInt(String(product.stock)) || 0

  // Collect issues
  const issues: ProductIssue[] = []

  // 1. Variasi tanpa SKU
  let hasNoSku = false
  if (variants.length > 0) {
    const missingSkuVars = variants.filter(
      (v) => !v.sku || String(v.sku).trim() === ''
    )
    if (missingSkuVars.length > 0) {
      hasNoSku = true
      issues.push({
        type: 'NO_SKU',
        label: 'Variasi tanpa SKU',
        detail: `${missingSkuVars.length} dari ${variants.length} variasi belum memiliki kode SKU.`,
        severity: 'warning',
      })
    }
  } else {
    // Produk tanpa variasi: cek SKU/model produk
    if (!product.model && (!product.sku || String(product.sku).trim() === '')) {
      hasNoSku = true
      issues.push({
        type: 'NO_SKU',
        label: 'Produk tanpa SKU',
        detail: 'Produk belum memiliki SKU Induk / kode model.',
        severity: 'warning',
      })
    }
  }

  // 2. Harga jual di bawah HPP (modal)
  let hasPriceBelowCost = false
  if (
    product.costPrice !== undefined &&
    product.costPrice !== null &&
    Number(product.costPrice) > 0 &&
    Number(product.price) < Number(product.costPrice)
  ) {
    hasPriceBelowCost = true
  }
  const varsBelowCost = variants.filter((v) => {
    const cp =
      v.costPrice !== undefined && v.costPrice !== null
        ? Number(v.costPrice)
        : Number(product.costPrice) || 0
    return cp > 0 && Number(v.price) < cp
  })
  if (varsBelowCost.length > 0) {
    hasPriceBelowCost = true
  }

  if (hasPriceBelowCost) {
    issues.push({
      type: 'PRICE_BELOW_COST',
      label: 'Harga di bawah HPP',
      detail: 'Harga jual terdeteksi lebih rendah daripada harga modal (HPP).',
      severity: 'error',
    })
  }

  // 3. Rasio harga termahal dan termurah melebihi 7x
  let hasPriceRatioExceeded = false
  if (minPrice > 0 && maxPrice / minPrice > 7) {
    hasPriceRatioExceeded = true
    const ratio = (maxPrice / minPrice).toFixed(1)
    issues.push({
      type: 'PRICE_RATIO_EXCEEDED',
      label: 'Rasio harga > 7x',
      detail: `Rasio harga termahal dan termurah adalah ${ratio}x (batas Shopee maks 7x).`,
      severity: 'error',
    })
  }

  // 4. Produk aktif dengan stok habis
  let hasOutOfStockActive = false
  if (product.isActive && totalStock <= 0) {
    hasOutOfStockActive = true
    issues.push({
      type: 'OUT_OF_STOCK_ACTIVE',
      label: 'Stok habis (Live)',
      detail: 'Produk berstatus aktif di etalase toko tetapi total stoknya 0.',
      severity: 'error',
    })
  }

  // 5. Stok berbeda untuk SKU yang sama (SKU Desync)
  let hasSkuStockDesync = false
  // Map SKU to stocks within this product's variants
  const skuStockMap = new Map<string, number>()
  for (const v of variants) {
    const sku = v.sku?.trim()
    if (!sku) continue
    const currentStock = parseInt(String(v.stock)) || 0
    if (skuStockMap.has(sku)) {
      if (skuStockMap.get(sku) !== currentStock) {
        hasSkuStockDesync = true
        break
      }
    } else {
      skuStockMap.set(sku, currentStock)
    }
  }

  // Cek juga terhadap produk lain di toko yang menggunakan SKU yang sama
  if (!hasSkuStockDesync && allStoreProducts.length > 0) {
    for (const v of variants) {
      const sku = v.sku?.trim()
      if (!sku) continue
      const currentStock = parseInt(String(v.stock)) || 0

      for (const otherP of allStoreProducts) {
        if (otherP.id === product.id) continue
        const otherVars: ProductVariantData[] = otherP.variants || []
        for (const ov of otherVars) {
          if (ov.sku?.trim() === sku) {
            const otherStock = parseInt(String(ov.stock)) || 0
            if (otherStock !== currentStock) {
              hasSkuStockDesync = true
              break
            }
          }
        }
        if (hasSkuStockDesync) break
      }
      if (hasSkuStockDesync) break
    }
  }

  if (hasSkuStockDesync) {
    issues.push({
      type: 'SKU_STOCK_DESYNC',
      label: 'Stok SKU berbeda',
      detail:
        'Ditemukan stok tidak seragam pada variasi yang berbagi kode SKU sama.',
      severity: 'warning',
    })
  }

  // Determine Shopee status tab
  let statusTab: 'LIVE' | 'ACTION_REQUIRED' | 'HIDDEN' = 'LIVE'
  if (!product.isActive) {
    statusTab = 'HIDDEN'
  } else if (issues.length > 0) {
    statusTab = 'ACTION_REQUIRED'
  } else {
    statusTab = 'LIVE'
  }

  return {
    id: product.id,
    name: product.name || '',
    brand: product.brand || 'Lainnya',
    category: product.category || 'Smartphone',
    model: product.model || null,
    condition: product.condition || 'BARU',
    price: Number(product.price) || 0,
    costPrice:
      product.costPrice !== undefined && product.costPrice !== null
        ? Number(product.costPrice)
        : null,
    stock: parseInt(String(product.stock)) || 0,
    totalStock,
    variantCount,
    minPrice,
    maxPrice,
    minCostPrice,
    maxCostPrice,
    isActive: Boolean(product.isActive),
    isTaxable: product.isTaxable !== false,
    images: Array.isArray(product.images) ? product.images : [],
    storeId: product.storeId || product.store?.id || null,
    storeName: product.store?.name || null,
    storeCity: product.store?.city || null,
    issues,
    statusTab,
    hasNoSku,
    hasPriceBelowCost,
    hasPriceRatioExceeded,
    hasOutOfStockActive,
    hasSkuStockDesync,
    variants,
    raw: product,
  }
}

/**
 * Groups and counts products across the 4 Shopee tabs
 */
export function categorizeProductsByTab(evaluatedList: EvaluatedProduct[]) {
  const allCount = evaluatedList.length
  const liveCount = evaluatedList.filter(
    (p) => p.isActive && p.totalStock > 0 && p.issues.length === 0
  ).length
  const actionRequiredCount = evaluatedList.filter(
    (p) => p.issues.length > 0
  ).length
  const hiddenCount = evaluatedList.filter((p) => !p.isActive).length

  return {
    allCount,
    liveCount,
    actionRequiredCount,
    hiddenCount,
  }
}

/**
 * Formats a clean price or price range string (Shopee style)
 * e.g. "Rp 15.000.000" or "Rp 15.000.000 - Rp 18.500.000"
 */
export function formatPriceDisplay(minPrice: number, maxPrice: number): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n)

  if (minPrice === maxPrice || maxPrice <= minPrice) {
    return fmt(minPrice)
  }
  return `${fmt(minPrice)} - ${fmt(maxPrice)}`
}
