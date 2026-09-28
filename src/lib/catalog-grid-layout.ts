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
 * Builds paginated catalog items with exact column spans per page (e.g. 12 spans = 3 full 4-col rows).
 * Aturan Desktop: Maksimal 1 pagination memuat 1 iklan saja sebelum berpindah ke halaman berikutnya.
 */
export function buildPaginatedCatalogGrid(
  allProducts: any[],
  ads: InFeedAdData[] = [],
  page: number = 1,
  targetSpanPerPage: number = 12
): { items: CatalogGridItem[]; totalPages: number } {
  if (allProducts.length === 0) {
    if (ads.length > 0 && ads[0]) {
      const isProduct = isProductAdData(ads[0])
      return {
        items: [{ type: 'ad', data: ads[0], isProductAd: isProduct }],
        totalPages: ads.length,
      }
    }
    return { items: [], totalPages: 1 }
  }

  // Desktop Pagination: Maksimal 1 iklan per halaman katalog
  const pages: CatalogGridItem[][] = []
  let prodIndex = 0
  let adIndex = 0

  while (prodIndex < allProducts.length) {
    const pageAd = adIndex < ads.length ? ads[adIndex++] : null
    const adSpan = pageAd ? (isProductAdData(pageAd) ? 1 : 2) : 0
    const prodsNeeded = Math.max(1, targetSpanPerPage - adSpan)

    const pageProducts = allProducts.slice(prodIndex, prodIndex + prodsNeeded)
    prodIndex += prodsNeeded

    // Rakit satu halaman dengan maksimal 1 iklan dan produk pengisi
    const pageItems = assembleCatalogGridItems(
      pageProducts,
      pageAd ? [pageAd] : [],
      { columnsPerRow: 4, maxRows: targetSpanPerPage / 4 }
    )

    pages.push(pageItems)
  }

  const totalPages = Math.max(1, pages.length)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const items = pages[safePage - 1] || []

  return {
    items,
    totalPages,
  }
}
