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
  stock: number
  sku: string | null
  productId: string
  productName: string
  productActive: boolean
  storeName?: string
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
  seriesName: string // e.g. "Samsung S24 FE"
  model: string
  capacities: CapacityGroup[]
  totalVariants: number
}

export interface BrandGroup {
  brand: string // e.g. "Samsung"
  series: SeriesGroup[]
  totalSeries: number
  totalVariants: number
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
 * Normalizes series / model name: e.g. "Samsung S24 FE"
 */
export function normalizeSeries(
  productName: string,
  model?: string | null
): string {
  if (model && model.trim() && model.trim() !== 'Gadget') {
    return model.trim()
  }

  const cleaned = productName
    .replace(/^sein\s*\|\s*/i, '')
    .replace(/^sein\s+/i, '')
    .replace(/^\[\s*tam\s*\]\s*/i, '')
    .replace(/^tam\s*\|\s*/i, '')
    .replace(/^bnob\s+/i, '')
    .replace(/^bnib\s+/i, '')
    .replace(/^resmi\s+sein\s+/i, '')
    .replace(/\s+second\s+original.*$/i, '')
    .replace(/\s+second\s+fullset.*$/i, '')
    .replace(/\s+second\s+resmi.*$/i, '')
    .replace(/\s+resmi\s+indonesia.*$/i, '')
    .replace(/\s+minus\s+.*$/i, '')
    .replace(/\s+ex\s+display.*$/i, '')
    .replace(/\s+[0-9]+(?:\/[0-9]+)?\s*(?:gb|tb)?.*$/i, '')
    .trim()

  return cleaned || productName.slice(0, 30)
}

/**
 * Builds full 4-level catalog hierarchy from raw product & variant records
 */
export function buildCatalogHierarchy(products: any[]): BrandGroup[] {
  const brandMap = new Map<
    string,
    Map<string, Map<string, ColorVariantItem[]>>
  >()

  for (const product of products) {
    const brand = (product.brand || 'Lainnya').trim()
    const series = normalizeSeries(product.name, product.model)

    if (!brandMap.has(brand)) {
      brandMap.set(brand, new Map())
    }
    const seriesMap = brandMap.get(brand)!

    if (!seriesMap.has(series)) {
      seriesMap.set(series, new Map())
    }
    const capacityMap = seriesMap.get(series)!

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
        stock: Number(v.stock) || 0,
        sku: v.sku || null,
        productId: product.id,
        productName: product.name,
        productActive: Boolean(product.isActive),
        storeName: product.store?.name || undefined,
      })
    }
  }

  // Transform into nested arrays
  const result: BrandGroup[] = []

  for (const [brand, seriesMap] of brandMap.entries()) {
    const seriesList: SeriesGroup[] = []
    let brandTotalVariants = 0

    for (const [seriesName, capacityMap] of seriesMap.entries()) {
      const capacitiesList: CapacityGroup[] = []
      let seriesTotalVariants = 0

      for (const [capacityKey, variantsList] of capacityMap.entries()) {
        const prices = variantsList.map((v) => v.price)
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
      }

      // Sort capacities by storage/ram
      capacitiesList.sort((a, b) => a.capacityKey.localeCompare(b.capacityKey))

      seriesList.push({
        seriesName,
        model: seriesName,
        capacities: capacitiesList,
        totalVariants: seriesTotalVariants,
      })

      brandTotalVariants += seriesTotalVariants
    }

    // Sort series alphabetically
    seriesList.sort((a, b) => a.seriesName.localeCompare(b.seriesName))

    result.push({
      brand,
      series: seriesList,
      totalSeries: seriesList.length,
      totalVariants: brandTotalVariants,
    })
  }

  // Sort brands alphabetically (Samsung, Apple, ASUS, etc.)
  result.sort((a, b) => a.brand.localeCompare(b.brand))

  return result
}
