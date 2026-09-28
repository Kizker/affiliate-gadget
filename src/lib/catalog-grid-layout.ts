import { InFeedAdData, isProductAdData } from '@/types/ads'

export type CatalogGridItem =
  | { type: 'product'; data: any }
  | { type: 'ad'; data: InFeedAdData; isProductAd: boolean }

interface AssembleOptions {
  columnsPerRow?: number
  maxRows?: number
}

/**
 * Merges products and ads into an orderly grid feed where every desktop row
 * totals exactly 4 column spans.
 *
 * Rules:
 * 1. Regular products = 1 column span.
 * 2. Promoted product ads = 1 column span.
 * 3. Promoted store banner ads = 2 column spans on desktop.
 * 4. Store banner ads are strictly placed only when exactly 2 column slots remain
 *    (e.g., after 2 regular products [1, 1, 2], or at the start of a row [2, 1, 1]),
 *    preventing any 1-column leftover that causes awkward 3-item rows or gaps.
 */
export function assembleCatalogGridItems(
  products: any[],
  ads: InFeedAdData[] = [],
  options: AssembleOptions = {}
): CatalogGridItem[] {
  const columnsPerRow = options.columnsPerRow || 4
  const result: CatalogGridItem[] = []

  const prodQueue = [...products]
  const adsQueue = [...ads]

  let currentRowSpan = 0
  let rowIndex = 0

  while (prodQueue.length > 0 || adsQueue.length > 0) {
    if (options.maxRows && rowIndex >= options.maxRows) {
      break
    }

    const remainingInRow = columnsPerRow - currentRowSpan

    // Check if an ad can be placed in current row
    let adToInsert: InFeedAdData | null = null

    if (adsQueue.length > 0) {
      const nextAd = adsQueue[0]
      const isProduct = isProductAdData(nextAd)
      const adSpan = isProduct ? 1 : 2

      if (adSpan === 2) {
        // Store Banner Ad (2 columns):
        // Only insert if exactly 2 or 4 slots remain in this row.
        if (remainingInRow === 2) {
          // Fits at end of row: 2 products (span 2) + banner (span 2) = 4
          adToInsert = adsQueue.shift()!
        } else if (remainingInRow === 4 && rowIndex > 0) {
          // Fits at beginning of row (for subsequent rows): banner (span 2) + 2 products (span 2) = 4
          adToInsert = adsQueue.shift()!
        }
      } else {
        // Product Ad (1 column):
        // Can fit anywhere if space remains, preferably after at least 1 or 2 products
        if (currentRowSpan >= 1 || prodQueue.length === 0) {
          adToInsert = adsQueue.shift()!
        }
      }
    }

    if (adToInsert) {
      const isProduct = isProductAdData(adToInsert)
      const adSpan = isProduct ? 1 : 2
      result.push({
        type: 'ad',
        data: adToInsert,
        isProductAd: isProduct,
      })
      currentRowSpan += adSpan
    } else if (prodQueue.length > 0) {
      const prod = prodQueue.shift()!
      result.push({
        type: 'product',
        data: prod,
      })
      currentRowSpan += 1
    } else {
      break
    }

    if (currentRowSpan >= columnsPerRow) {
      currentRowSpan = 0
      rowIndex++
    }
  }

  return result
}

/**
 * Builds paginated catalog items with exact column spans per page (e.g. 12 spans = 3 full 4-col rows),
 * ensuring ads on page 1 fit seamlessly without leaving any awkward 3-item rows.
 */
export function buildPaginatedCatalogGrid(
  allProducts: any[],
  ads: InFeedAdData[] = [],
  page: number = 1,
  targetSpanPerPage: number = 12
): { items: CatalogGridItem[]; totalPages: number } {
  if (allProducts.length === 0) {
    return { items: [], totalPages: 1 }
  }

  const page1Ads = ads.slice(0, 3)
  const candidateItems = assembleCatalogGridItems(allProducts, page1Ads)

  let currentSpan = 0
  const page1Items: CatalogGridItem[] = []
  const usedProductIds = new Set<string>()

  for (const item of candidateItems) {
    const itemSpan = item.type === 'ad' ? (item.isProductAd ? 1 : 2) : 1
    if (currentSpan + itemSpan > targetSpanPerPage) {
      break
    }
    page1Items.push(item)
    currentSpan += itemSpan
    if (item.type === 'product' && item.data?.id) {
      usedProductIds.add(item.data.id)
    }
  }

  const remainingProducts = allProducts.filter((p) => !usedProductIds.has(p.id))
  const totalPages = Math.max(
    1,
    1 + Math.ceil(remainingProducts.length / targetSpanPerPage)
  )

  if (page <= 1) {
    return {
      items: page1Items,
      totalPages,
    }
  }

  const startIndex = (page - 2) * targetSpanPerPage
  const endIndex = startIndex + targetSpanPerPage
  const pageProducts = remainingProducts.slice(startIndex, endIndex)

  const pageItems: CatalogGridItem[] = pageProducts.map((p) => ({
    type: 'product',
    data: p,
  }))

  return {
    items: pageItems,
    totalPages,
  }
}
