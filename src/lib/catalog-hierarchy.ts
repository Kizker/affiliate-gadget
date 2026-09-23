/**
 * Catalog Hierarchy Utility
 * Builds a 4-level structure: Brand -> Series/Model -> Capacity (RAM/Storage) -> Color Variants
 * Designed for intuitive bulk updates across color variants sharing identical specifications.
 */

export interface ColorVariantItem {
  id: string
  name: string
  color: string
  ram: string
  storage: string
  capacityKey: string
  price: number
  costPrice?: number | null
  stock: number
  sku: string | null
  productId: string
  productName: string
  productActive: boolean
  storeName?: string
  storeCity?: string
  images?: string[]
  condition?: string
  warrantyDays?: number
}

export interface CapacityGroup {
  capacityKey: string // e.g. "12GB / 512GB"
  ram: string
  storage: string
  variants: ColorVariantItem[]
  isAllSamePrice: boolean
  commonPrice: number | null
  minPrice: number
  maxPrice: number
  totalStock: number
}

export interface SeriesGroup {
  seriesName: string // e.g. "Samsung Galaxy S24 FE"
  model: string
  capacities: CapacityGroup[]
  totalVariants: number
  totalStock: number
  minPrice: number
  maxPrice: number
  productId?: string
  productName?: string
  images?: string[]
  storeName?: string
  storeCity?: string
  condition?: string
  warrantyDays?: number
  isActive?: boolean
}

export interface BrandGroup {
  brand: string // e.g. "Samsung"
  series: SeriesGroup[]
  totalSeries: number
  totalVariants: number
  totalStock: number
}

/**
 * Normalizes RAM and Storage into a unified capacity label: e.g. "12GB / 512GB"
 */
export function normalizeCapacity(
  variantName?: string | null,
  ram?: string | null,
  storage?: string | null,
  productName?: string | null
): { ram: string; storage: string; capacityKey: string } {
  const combined = `${variantName || ''} ${ram || ''} ${storage || ''} ${productName || ''}`

  let cleanRam = (ram || '').trim()
  let cleanStorage = (storage || '').trim()

  // Extract from slash pattern (e.g. "12/512" or "12GB/512GB")
  const slashMatch = combined.match(
    /\b([0-9]{1,2})\s*(?:gb)?\s*\/\s*([0-9]{2,4}(?:gb|tb)?|1\s*tb|2\s*tb)\b/i
  )
  if (slashMatch) {
    if (!cleanRam) cleanRam = `${slashMatch[1]}GB`
    if (!cleanStorage) {
      cleanStorage = slashMatch[2].toUpperCase().replace(/\s+/g, '')
      if (!cleanStorage.endsWith('GB') && !cleanStorage.endsWith('TB')) {
        cleanStorage += 'GB'
      }
    }
  }

  // Standalone storage search
  if (!cleanStorage) {
    const tbMatch = combined.match(/\b(1\s*TB|2\s*TB)\b/i)
    if (tbMatch) {
      cleanStorage = tbMatch[1].toUpperCase().replace(/\s+/g, '')
    } else {
      const gbMatch = combined.match(/\b(64|128|256|512)\s*(?:GB)?\b/i)
      if (gbMatch) cleanStorage = `${gbMatch[1]}GB`
    }
  }

  // Standalone RAM search
  if (!cleanRam) {
    const ramMatch = combined.match(/\b([0-9]{1,2})\s*GB\b/i)
    if (ramMatch) cleanRam = `${ramMatch[1]}GB`
  }

  if (!cleanRam && !cleanStorage) {
    return {
      ram: 'Standar',
      storage: 'Standar',
      capacityKey: 'Standar',
    }
  }

  const parts: string[] = []
  if (cleanRam) parts.push(cleanRam)
  if (cleanStorage) parts.push(cleanStorage)
  const capacityKey = parts.join(' / ') || 'Standar'

  return {
    ram: cleanRam || '-',
    storage: cleanStorage || '-',
    capacityKey,
  }
}

/**
 * Extracts clean color name from variant name
 */
export function extractCleanColor(
  variantName?: string | null,
  color?: string | null
): string {
  if (color && color.trim()) return color.trim()
  if (!variantName || !variantName.trim()) return 'Standar'

  const target = variantName.trim()

  // Remove commas or dashes separator: e.g. "12GB/512GB, White" or "12/512 - Pink"
  if (target.includes(',')) {
    const after = target.split(',').slice(1).join(' ').trim()
    if (after) return after
  }

  // Strip RAM/Storage patterns e.g. "12GB/512GB White" -> "White"
  const stripped = target
    .replace(/[0-9]{1,2}\s*(?:gb)?\s*\/\s*[0-9]{2,4}\s*(?:gb|tb)?/gi, '')
    .replace(/\b(?:128|256|512)\s*(?:gb)?\b/gi, '')
    .replace(/\b(?:1|2)\s*tb\b/gi, '')
    .replace(/\b[0-9]{1,2}\s*gb\b/gi, '')
    .replace(/^[-–—|,/\s]+/, '')
    .replace(/[-–—|,/\s]+$/, '')
    .trim()

  return stripped || target || 'Standar'
}

/**
 * Normalizes series / model name into clean, human-readable names
 * e.g. "SEIN | Samsung Galaxy S24 5G..." -> "Samsung Galaxy S24"
 */
export function normalizeSeries(
  productName: string,
  model?: string | null,
  brand?: string | null
): string {
  const cleanBrand = (brand || '').trim()

  // If model is already a clean, specific series (not a messy raw Shopee title)
  if (model && model.trim() && model.trim() !== 'Gadget') {
    const m = model.trim()
    const isMessy =
      /sein|tam|second|resmi|bnob|bnib|fullset|minus|garansi|layar|original/i.test(
        m
      ) || m.includes('|')
    if (!isMessy) {
      return m
    }
  }

  const raw =
    model && model.trim() && model.trim() !== 'Gadget'
      ? model.trim()
      : productName

  let s = raw
    .replace(/^\[\s*tam\s*\]\s*/i, '')
    .replace(/^tam\s*\|\s*/i, '')
    .replace(/^sein\s*\|\s*/i, '')
    .replace(/^sein\s+/i, '')
    .replace(/^resmi\s+sein\s+/i, '')
    .replace(/^bnob\s+/i, '')
    .replace(/^bnib\s+/i, '')
    .replace(/^second\s+/i, '')
    .replace(/^[|/l\-–—\s]+/, '')
    .replace(/\s+second\s+original.*$/i, '')
    .replace(/\s+second\s+fullset.*$/i, '')
    .replace(/\s+second\s+resmi.*$/i, '')
    .replace(/\s+resmi\s+indonesia.*$/i, '')
    .replace(/\s+second\s+indo.*$/i, '')
    .replace(/\s+minus\s+.*$/i, '')
    .replace(/\s+ex\s+display.*$/i, '')
    .replace(/\s+garansi\s+resmi.*$/i, '')
    // ONLY strip actual capacities e.g. " 12/512GB", " 128GB", " 1TB", NOT model numbers like 15 or 24
    .replace(/\s+[0-9]{1,2}\s*(?:gb)?\s*\/\s*[0-9]{2,4}\s*(?:gb|tb)?.*$/i, '')
    .replace(/\s+(?:64|128|256|512)\s*(?:gb)?\b.*$/i, '')
    .replace(/\s+[12]\s*tb\b.*$/i, '')
    .replace(/[|/l\-–—\s]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  // Standardize Samsung naming
  if (/^samsung/i.test(cleanBrand) || /^samsung/i.test(s)) {
    const hasGalaxy = /galaxy/i.test(raw)
    s = s.replace(/^samsung\s+/i, '')
    s = s.replace(/^galaxy\s+/i, '')
    s = s.replace(/^s([0-9]{2})\b/i, 'S$1')
    s = s.replace(/^note\b/i, 'Note')
    s = s.replace(/^z\s*fold\b/i, 'Z Fold')
    s = s.replace(/^z\s*flip\b/i, 'Z Flip')
    s = s.replace(/^fold\b/i, 'Z Fold')
    s = s.replace(/^flip\b/i, 'Z Flip')
    s = s.replace(/\bultra\b/i, 'Ultra')
    s = s.replace(/\bplus\b/i, 'Plus')
    s = s.replace(/\bfe\b/i, 'FE')
    s = s.replace(/\blite\b/i, 'Lite')
    const prefix = hasGalaxy ? 'Samsung Galaxy' : 'Samsung'
    return `${prefix} ${s}`.replace(/\s{2,}/g, ' ').trim()
  }

  // Apple naming
  if (/^apple/i.test(cleanBrand) || /^iphone/i.test(s) || /^ipad/i.test(s)) {
    if (!/^iphone/i.test(s) && !/^ipad/i.test(s)) {
      s = `iPhone ${s}`
    }
    return s.replace(/\s{2,}/g, ' ').trim()
  }

  // Other brands: ensure brand prefix
  if (cleanBrand && !s.toLowerCase().startsWith(cleanBrand.toLowerCase())) {
    s = `${cleanBrand} ${s}`
  }

  return s.replace(/\s{2,}/g, ' ').trim() || productName.slice(0, 30)
}

/**
 * Builds full 4-level catalog hierarchy from raw product & variant records
 */
export function buildCatalogHierarchy(products: any[]): BrandGroup[] {
  const brandMap = new Map<
    string,
    Map<
      string,
      { productMeta: any; capacities: Map<string, ColorVariantItem[]> }
    >
  >()

  for (const product of products) {
    const brand = (product.brand || 'Lainnya').trim()
    const series = normalizeSeries(product.name, product.model, brand)

    if (!brandMap.has(brand)) {
      brandMap.set(brand, new Map())
    }
    const seriesMap = brandMap.get(brand)!

    if (!seriesMap.has(series)) {
      seriesMap.set(series, {
        productMeta: product,
        capacities: new Map(),
      })
    }
    const seriesData = seriesMap.get(series)!
    const capacityMap = seriesData.capacities

    const variants =
      product.variants && product.variants.length > 0
        ? product.variants
        : [
            {
              id: `prod-only-${product.id}`,
              name: 'Standar',
              color: 'Standar',
              ram: null,
              storage: null,
              price: product.price,
              stock: product.stock,
              sku: product.model || null,
            },
          ]

    for (const v of variants) {
      const { ram, storage, capacityKey } = normalizeCapacity(
        v.name,
        v.ram,
        v.storage,
        product.name
      )
      const color = extractCleanColor(v.name, v.color)

      if (!capacityMap.has(capacityKey)) {
        capacityMap.set(capacityKey, [])
      }

      capacityMap.get(capacityKey)!.push({
        id: v.id,
        name: v.name || 'Standar',
        color,
        ram,
        storage,
        capacityKey,
        price: Number(v.price) || 0,
        costPrice:
          v.costPrice !== undefined && v.costPrice !== null
            ? Number(v.costPrice)
            : product.costPrice !== undefined && product.costPrice !== null
              ? Number(product.costPrice)
              : null,
        stock: Number(v.stock) || 0,
        sku: v.sku || null,
        productId: product.id,
        productName: product.name,
        productActive: Boolean(product.isActive),
        storeName: product.store?.name || undefined,
        storeCity: product.store?.city || undefined,
        images: product.images || [],
        condition: product.condition || 'BARU',
        warrantyDays: product.warrantyDays || 30,
      })
    }
  }

  // Transform into nested arrays
  const result: BrandGroup[] = []

  for (const [brand, seriesMap] of brandMap.entries()) {
    const seriesList: SeriesGroup[] = []
    let brandTotalVariants = 0
    let brandTotalStock = 0

    for (const [seriesName, seriesData] of seriesMap.entries()) {
      const capacitiesList: CapacityGroup[] = []
      let seriesTotalVariants = 0
      let seriesTotalStock = 0
      const allSeriesPrices: number[] = []

      for (const [
        capacityKey,
        variantsList,
      ] of seriesData.capacities.entries()) {
        const prices = variantsList.map((v) => v.price)
        allSeriesPrices.push(...prices)
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        const isAllSamePrice = minPrice === maxPrice
        const totalStock = variantsList.reduce((acc, v) => acc + v.stock, 0)
        const firstVariant = variantsList[0]

        capacitiesList.push({
          capacityKey,
          ram: firstVariant?.ram || '-',
          storage: firstVariant?.storage || '-',
          variants: variantsList,
          isAllSamePrice,
          commonPrice: isAllSamePrice ? minPrice : null,
          minPrice,
          maxPrice,
          totalStock,
        })

        seriesTotalVariants += variantsList.length
        seriesTotalStock += totalStock
      }

      // Sort capacities logically
      capacitiesList.sort((a, b) => a.capacityKey.localeCompare(b.capacityKey))

      const pMeta = seriesData.productMeta || {}
      const minSeriesPrice =
        allSeriesPrices.length > 0
          ? Math.min(...allSeriesPrices)
          : pMeta.price || 0
      const maxSeriesPrice =
        allSeriesPrices.length > 0
          ? Math.max(...allSeriesPrices)
          : pMeta.price || 0

      seriesList.push({
        seriesName,
        model: seriesName,
        capacities: capacitiesList,
        totalVariants: seriesTotalVariants,
        totalStock: seriesTotalStock,
        minPrice: minSeriesPrice,
        maxPrice: maxSeriesPrice,
        productId: pMeta.id,
        productName: pMeta.name,
        images: pMeta.images || [],
        storeName: pMeta.store?.name,
        storeCity: pMeta.store?.city,
        condition: pMeta.condition,
        warrantyDays: pMeta.warrantyDays,
        isActive: pMeta.isActive,
      })

      brandTotalVariants += seriesTotalVariants
      brandTotalStock += seriesTotalStock
    }

    // Sort series alphabetically
    seriesList.sort((a, b) => a.seriesName.localeCompare(b.seriesName))

    result.push({
      brand,
      series: seriesList,
      totalSeries: seriesList.length,
      totalVariants: brandTotalVariants,
      totalStock: brandTotalStock,
    })
  }

  // Sort brands alphabetically (Samsung, Apple, ASUS, etc.)
  result.sort((a, b) => a.brand.localeCompare(b.brand))

  return result
}
