export type EtalasePriceMode = 'LOWEST' | 'COVER_PRODUCT' | 'CUSTOM'

export interface EtalaseItemRecord {
  id: string
  etalaseId: string
  productId: string
  label: string
  sortOrder: number
  totalStock: number
  minPrice: number
  product: any
}

export interface EvaluatedEtalase {
  id: string
  isEtalase: true
  etalaseId: string
  storeId: string
  name: string
  rawName: string
  customTitle: string | null
  customCoverImage: string | null
  coverProductId: string | null
  priceMode: EtalasePriceMode
  customPrice: number | null
  customOriginalPrice: number | null
  price: number
  originalPrice: number | null
  minPrice: number
  maxPrice: number
  stock: number
  soldCount: number
  rating: number
  totalReview: number
  images: string[]
  brand: string | null
  category: string
  condition: string
  description: string | null
  warrantyDays: number
  includesCharger: boolean
  includesScreenProtector: boolean
  includesCase: boolean
  isPromoted: boolean
  promotionPriority: number
  isActive: boolean
  productCount: number
  etalaseItems: EtalaseItemRecord[]
  defaultProduct: any
  store: any
  variants: any[]
  createdAt: string
  updatedAt: string
}

/**
 * Menghasilkan label tombol singkat bergaya Shopee (misal: "Fold 5 12/512GB" atau "iPhone 15 Pro 256GB")
 */
export function generateShortProductLabel(product: any): string {
  if (!product) return 'Unit Pilihan'
  let raw = String(product.name || product.model || 'Unit').trim()

  // Hapus suffix nomor seri acak seperti "#75" atau "#37"
  raw = raw.replace(/\s*#\d+\b/g, '').trim()

  // Hapus duplikasi merek di awal (misal "Xiaomi Xiaomi 14" -> "Xiaomi 14")
  const brand = String(product.brand || '').trim()
  if (brand) {
    const doubleBrandRegex = new RegExp(`^${brand}\\s+${brand}\\b`, 'i')
    raw = raw.replace(doubleBrandRegex, brand)
  }

  // Persingkat prefix merek umum jika judul terlalu panjang (> 28 karakter)
  if (raw.length > 26) {
    raw = raw
      .replace(/^Apple\s+/i, '')
      .replace(/^Samsung\s+Galaxy\s+/i, 'Galaxy ')
      .replace(/^Samsung\s+/i, '')
      .replace(/^Xiaomi\s+/i, '')
      .replace(/^Asus\s+/i, '')
      .replace(/\bEdition\b/gi, '')
      .replace(/\bSecond\s+Original\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  return raw.slice(0, 38)
}

/**
 * Menghitung stok efektif 1 produk (dari varian bila ada, atau langsung dari product.stock)
 */
export function getProductEffectiveStock(product: any): number {
  if (!product) return 0
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce(
      (sum: number, v: any) => sum + Math.max(0, Number(v.stock) || 0),
      0
    )
  }
  return Math.max(0, Number(product.stock) || 0)
}

/**
 * Menghitung harga efektif termurah dari 1 produk
 */
export function getProductEffectiveMinPrice(product: any): number {
  if (!product) return 0
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const inStockPrices = product.variants
      .filter((v: any) => (Number(v.stock) || 0) > 0 && Number(v.price) > 0)
      .map((v: any) => Number(v.price))
    if (inStockPrices.length > 0) {
      return Math.min(...inStockPrices)
    }
    const allPrices = product.variants
      .filter((v: any) => Number(v.price) > 0)
      .map((v: any) => Number(v.price))
    if (allPrices.length > 0) {
      return Math.min(...allPrices)
    }
  }
  return Math.max(0, Number(product.price) || 0)
}

export function getProductEffectiveMaxPrice(product: any): number {
  if (!product) return 0
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const allPrices = product.variants
      .filter((v: any) => Number(v.price) > 0)
      .map((v: any) => Number(v.price))
    if (allPrices.length > 0) {
      return Math.max(...allPrices)
    }
  }
  return Math.max(0, Number(product.price) || 0)
}

/**
 * Mengevaluasi 1 Etalase beserta daftar produk di dalamnya menjadi objek siap pakai di Katalog & Detail
 */
export function evaluateEtalase(
  rawEtalase: any,
  rawItems: Array<{
    id: string
    etalaseId: string
    productId: string
    label?: string | null
    sortOrder?: number
  }>,
  productsMap: Map<string, any>,
  salesMap?: Map<string, number>,
  requestedProductId?: string | null
): EvaluatedEtalase {
  const sortedRawItems = [...(rawItems || [])].sort(
    (a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)
  )

  const etalaseItems: EtalaseItemRecord[] = []
  for (const item of sortedRawItems) {
    const prod = productsMap.get(item.productId)
    if (!prod) continue
    const totalStock = getProductEffectiveStock(prod)
    const minPrice = getProductEffectiveMinPrice(prod)
    const soldCount = salesMap?.get(prod.id) ?? Number(prod.soldCount || 0)

    etalaseItems.push({
      id: item.id,
      etalaseId: rawEtalase.id,
      productId: prod.id,
      label: item.label?.trim() || generateShortProductLabel(prod),
      sortOrder: Number(item.sortOrder) || 0,
      totalStock,
      minPrice,
      product: {
        ...prod,
        stock: totalStock,
        soldCount,
      },
    })
  }

  // Cari produk cover yang dipilih admin
  const explicitCoverItem = rawEtalase.coverProductId
    ? etalaseItems.find((i) => i.productId === rawEtalase.coverProductId)
    : null
  const coverProduct =
    explicitCoverItem?.product || etalaseItems[0]?.product || null

  // Aturan "Tetap Tampil & Auto-Switch":
  // Jika ada requestedProductId (misal dibuka dari link produk spesifik) dan stoknya > 0, pilih itu.
  // Jika tidak, cek coverProduct: bila stoknya > 0 pilih coverProduct; bila stoknya habis (0),
  // otomatis switch ke produk pertama di dalam etalase yang masih punya stok > 0!
  let defaultProduct = coverProduct
  if (requestedProductId) {
    const reqItem = etalaseItems.find((i) => i.productId === requestedProductId)
    if (reqItem && reqItem.totalStock > 0) {
      defaultProduct = reqItem.product
    } else if (reqItem && !defaultProduct) {
      defaultProduct = reqItem.product
    }
  }

  if (!defaultProduct || getProductEffectiveStock(defaultProduct) <= 0) {
    const firstInStock = etalaseItems.find((i) => i.totalStock > 0)
    if (firstInStock) {
      defaultProduct = firstInStock.product
    }
  }

  // Hitung rentang harga seluruh produk di etalase
  const inStockItemPrices = etalaseItems
    .filter((i) => i.totalStock > 0 && i.minPrice > 0)
    .map((i) => i.minPrice)
  const allItemPrices = etalaseItems
    .filter((i) => i.minPrice > 0)
    .map((i) => i.minPrice)
  const maxItemPrices = etalaseItems
    .map((i) => getProductEffectiveMaxPrice(i.product))
    .filter((p) => p > 0)

  const minPrice =
    inStockItemPrices.length > 0
      ? Math.min(...inStockItemPrices)
      : allItemPrices.length > 0
        ? Math.min(...allItemPrices)
        : Number(coverProduct?.price) || 0

  const maxPrice =
    maxItemPrices.length > 0 ? Math.max(...maxItemPrices) : minPrice

  const priceMode: EtalasePriceMode =
    rawEtalase.priceMode === 'COVER_PRODUCT' ||
    rawEtalase.priceMode === 'CUSTOM'
      ? rawEtalase.priceMode
      : 'LOWEST'

  const customPrice =
    rawEtalase.customPrice !== null && rawEtalase.customPrice !== undefined
      ? Number(rawEtalase.customPrice)
      : null
  const customOriginalPrice =
    rawEtalase.customOriginalPrice !== null &&
    rawEtalase.customOriginalPrice !== undefined
      ? Number(rawEtalase.customOriginalPrice)
      : null

  let resolvedPrice = minPrice
  if (priceMode === 'CUSTOM' && customPrice && customPrice > 0) {
    resolvedPrice = customPrice
  } else if (priceMode === 'COVER_PRODUCT' && coverProduct) {
    const coverMin = getProductEffectiveMinPrice(coverProduct)
    if (coverMin > 0) resolvedPrice = coverMin
  }

  const resolvedOriginalPrice =
    customOriginalPrice && customOriginalPrice > resolvedPrice
      ? customOriginalPrice
      : coverProduct?.originalPrice &&
          Number(coverProduct.originalPrice) > resolvedPrice
        ? Number(coverProduct.originalPrice)
        : Math.round(resolvedPrice * 1.15)

  // Gabungkan semua gambar: customCoverImage di urutan pertama (jika ada), lalu coverProduct, lalu produk lainnya
  const images: string[] = []
  const pushImg = (url?: string | null) => {
    if (url && typeof url === 'string' && !images.includes(url)) {
      images.push(url)
    }
  }

  if (rawEtalase.customCoverImage) {
    pushImg(rawEtalase.customCoverImage)
  }
  if (coverProduct && Array.isArray(coverProduct.images)) {
    coverProduct.images.forEach(pushImg)
  }
  for (const item of etalaseItems) {
    if (Array.isArray(item.product?.images)) {
      item.product.images.forEach(pushImg)
    }
    if (Array.isArray(item.product?.variants)) {
      item.product.variants.forEach((v: any) => pushImg(v.image))
    }
  }

  // Total stok, terjual, rating, dan ulasan gabungan
  const totalStock = etalaseItems.reduce((sum, i) => sum + i.totalStock, 0)
  const totalSold = etalaseItems.reduce(
    (sum, i) => sum + (Number(i.product?.soldCount) || 0),
    0
  )
  const totalReview = etalaseItems.reduce(
    (sum, i) => sum + (Number(i.product?.totalReview) || 0),
    0
  )
  const avgRating =
    etalaseItems.length > 0
      ? Number(
          (
            etalaseItems.reduce(
              (sum, i) => sum + (Number(i.product?.rating) || 5.0),
              0
            ) / etalaseItems.length
          ).toFixed(1)
        )
      : 5.0

  const resolvedTitle =
    rawEtalase.customTitle?.trim() ||
    rawEtalase.name?.trim() ||
    coverProduct?.name ||
    'Etalase Gadget Resmi'

  return {
    id: rawEtalase.id,
    isEtalase: true,
    etalaseId: rawEtalase.id,
    storeId: rawEtalase.storeId,
    name: resolvedTitle,
    rawName: rawEtalase.name || resolvedTitle,
    customTitle: rawEtalase.customTitle || null,
    customCoverImage: rawEtalase.customCoverImage || null,
    coverProductId: rawEtalase.coverProductId || coverProduct?.id || null,
    priceMode,
    customPrice,
    customOriginalPrice,
    price: resolvedPrice,
    originalPrice: resolvedOriginalPrice,
    minPrice,
    maxPrice,
    stock: totalStock,
    soldCount: totalSold,
    rating: avgRating,
    totalReview,
    images,
    brand: rawEtalase.brand || coverProduct?.brand || null,
    category: rawEtalase.category || coverProduct?.category || 'Smartphone',
    condition: coverProduct?.condition || 'LIKE_NEW',
    description:
      rawEtalase.description ||
      coverProduct?.description ||
      defaultProduct?.description ||
      null,
    warrantyDays: Number(coverProduct?.warrantyDays) || 30,
    includesCharger: coverProduct?.includesCharger ?? true,
    includesScreenProtector: coverProduct?.includesScreenProtector ?? true,
    includesCase: coverProduct?.includesCase ?? true,
    isPromoted: Boolean(rawEtalase.isPromoted || coverProduct?.isPromoted),
    promotionPriority:
      Number(rawEtalase.promotionPriority) ||
      Number(coverProduct?.promotionPriority) ||
      0,
    isActive: Boolean(rawEtalase.isActive ?? true),
    productCount: etalaseItems.length,
    etalaseItems,
    defaultProduct: defaultProduct || null,
    store: rawEtalase.store || coverProduct?.store || null,
    variants: defaultProduct?.variants || coverProduct?.variants || [],
    createdAt: rawEtalase.createdAt
      ? new Date(rawEtalase.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: rawEtalase.updatedAt
      ? new Date(rawEtalase.updatedAt).toISOString()
      : new Date().toISOString(),
  }
}
