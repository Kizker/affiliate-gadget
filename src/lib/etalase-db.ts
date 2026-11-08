import prisma from '@/lib/db'
import {
  EtalasePriceMode,
  EvaluatedEtalase,
  evaluateEtalase,
  generateShortProductLabel,
  getProductEffectiveMinPrice,
  getProductEffectiveStock,
} from '@/lib/etalase-utils'
import { analyzeSmartQuery } from '@/lib/smart-search'

let isSeededCache = false
let publicGadgetsCacheVersion = 0

export function getPublicGadgetsCacheVersion(): number {
  return publicGadgetsCacheVersion
}

export function invalidatePublicGadgetsCache(): void {
  publicGadgetsCacheVersion++
}

function makeId(prefix = 'eta'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Mengelompokkan produk berdasarkan Seri/Kategori secara cerdas untuk migrasi awal 200+ produk
 */
function classifyProductSeriesGroup(product: any): {
  key: string
  brand: string
  category: string
  seriesTitle: string
} {
  const brand = String(product.brand || 'Lainnya').trim()
  const category = String(product.category || 'Smartphone').trim()
  const isPhone =
    category.toLowerCase() === 'smartphone' ||
    category.toLowerCase() === 'hp' ||
    category.toLowerCase() === 'handphone'

  if (brand.toLowerCase() === 'samsung') {
    if (isPhone) {
      return {
        key: 'samsung-smartphone',
        brand: 'Samsung',
        category: 'Smartphone',
        seriesTitle:
          'SAMSUNG GALAXY Z FOLD & FLIP | S24 ULTRA 5G SEIN Second Fullset Original',
      }
    }
    return {
      key: 'samsung-ecosystem',
      brand: 'Samsung',
      category,
      seriesTitle:
        'SAMSUNG GALAXY TAB & ECOSYSTEM SERIES Resmi SEIN Second Original',
    }
  }

  if (brand.toLowerCase() === 'apple') {
    if (isPhone) {
      return {
        key: 'apple-iphone',
        brand: 'Apple',
        category: 'Smartphone',
        seriesTitle:
          'APPLE IPHONE 15 PRO MAX | 15 PRO | 14 PRO SERIES Resmi iBox Second Original',
      }
    }
    return {
      key: 'apple-ecosystem',
      brand: 'Apple',
      category,
      seriesTitle:
        'APPLE MACBOOK AIR M3 | IPAD PRO | AIRPODS PRO 2 Resmi iBox Original',
    }
  }

  if (brand.toLowerCase() === 'xiaomi' || brand.toLowerCase() === 'poco') {
    return {
      key: 'xiaomi-poco',
      brand: 'Xiaomi',
      category: 'Smartphone',
      seriesTitle:
        'XIAOMI 14 ULTRA LEICA & POCO F-SERIES 5G Flagship Second Fullset Original',
    }
  }

  if (brand.toLowerCase() === 'asus') {
    return {
      key: 'asus-rog',
      brand: 'ASUS',
      category: 'Smartphone',
      seriesTitle:
        'ASUS ROG PHONE 8 PRO & ZENFONE GAMING SERIES 5G Second Fullset Original',
    }
  }

  return {
    key: `${brand.toLowerCase()}-all`,
    brand,
    category,
    seriesTitle: `${brand.toUpperCase()} FLAGSHIP SERIES Pilihan Second Original Bergaransi`,
  }
}

/**
 * Otomatis mengelompokkan 200+ produk existing ke dalam Etalase per Toko + Seri/Merek
 * jika tabel etalases masih kosong.
 */
export async function ensureInitialEtalasesSeeded(): Promise<void> {
  if (isSeededCache) return
  if (typeof (prisma as any)?.$queryRawUnsafe !== 'function') return

  try {
    const countRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS cnt FROM "etalases"`
    )
    const count = Number(countRows?.[0]?.cnt || 0)
    if (count > 0) {
      isSeededCache = true
      return
    }

    const allProducts = await prisma.product.findMany({
      where: { storeId: { not: null } },
      include: { variants: true },
      orderBy: [{ promotionPriority: 'desc' }, { createdAt: 'desc' }],
    })

    if (allProducts.length === 0) {
      isSeededCache = true
      return
    }

    // Kelompokkan berdasarkan storeId + seriesKey (maksimal 6 produk per etalase agar katalog tetap ramai & proporsional)
    const groupsMap = new Map<
      string,
      {
        storeId: string
        brand: string
        category: string
        seriesTitle: string
        products: any[]
      }
    >()

    for (const prod of allProducts) {
      if (!prod.storeId) continue
      const series = classifyProductSeriesGroup(prod)
      let bucketIdx = 1
      let groupKey = `${prod.storeId}__${series.key}__${bucketIdx}`
      while (
        groupsMap.has(groupKey) &&
        groupsMap.get(groupKey)!.products.length >= 5
      ) {
        bucketIdx++
        groupKey = `${prod.storeId}__${series.key}__${bucketIdx}`
      }

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          storeId: prod.storeId,
          brand: series.brand,
          category: series.category,
          seriesTitle:
            bucketIdx === 1
              ? series.seriesTitle
              : `${series.seriesTitle} #${bucketIdx}`,
          products: [],
        })
      }
      groupsMap.get(groupKey)!.products.push(prod)
    }

    const now = new Date()
    for (const grp of groupsMap.values()) {
      if (grp.products.length === 0) continue

      // Pilih produk pertama yang punya stok > 0 sebagai coverProduct
      const firstInStock =
        grp.products.find((p) => getProductEffectiveStock(p) > 0) ||
        grp.products[0]

      // Jika hanya 1 produk di grup, gunakan nama produk asli; jika > 1 produk, gunakan judul gabungan ala Shopee
      let etalaseTitle = grp.seriesTitle
      if (grp.products.length === 1) {
        etalaseTitle = firstInStock.name
      } else {
        etalaseTitle = grp.seriesTitle
      }

      const etalaseId = makeId('etalase')
      const minPrice = Math.min(
        ...grp.products.map((p) => getProductEffectiveMinPrice(p))
      )

      await prisma.$executeRawUnsafe(
        `INSERT INTO "etalases" (
          "id", "storeId", "name", "description", "brand", "category",
          "coverProductId", "customCoverImage", "customTitle",
          "priceMode", "customPrice", "customOriginalPrice",
          "isActive", "isPromoted", "promotionPriority", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT ("id") DO NOTHING`,
        etalaseId,
        grp.storeId,
        etalaseTitle,
        firstInStock.description || null,
        grp.brand,
        grp.category,
        firstInStock.id,
        null,
        etalaseTitle,
        'LOWEST',
        minPrice > 0 ? minPrice : firstInStock.price,
        firstInStock.originalPrice || null,
        true,
        Boolean(firstInStock.isPromoted),
        Number(firstInStock.promotionPriority) || 0,
        now,
        now
      )

      for (let idx = 0; idx < grp.products.length; idx++) {
        const p = grp.products[idx]
        const itemId = makeId('etaitem')
        const label = generateShortProductLabel(p)
        await prisma.$executeRawUnsafe(
          `INSERT INTO "etalase_products" ("id", "etalaseId", "productId", "label", "sortOrder", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT ("etalaseId", "productId") DO NOTHING`,
          itemId,
          etalaseId,
          p.id,
          label,
          idx,
          now
        )
      }
    }

    isSeededCache = true
  } catch (err) {
    console.warn('[ensureInitialEtalasesSeeded Warning]:', err)
  }
}

/**
 * Mengambil daftar Etalase yang sudah dievaluasi lengkap untuk Katalog Publik maupun Dashboard Admin
 */
export async function getEtalases(options?: {
  storeId?: string
  brand?: string
  search?: string
  onlyActive?: boolean
  minPrice?: number
  maxPrice?: number
  sort?: string
}): Promise<EvaluatedEtalase[]> {
  if (typeof (prisma as any)?.$queryRawUnsafe !== 'function') return []
  await ensureInitialEtalasesSeeded()

  const storeId = options?.storeId || ''
  const brand = options?.brand || ''
  const search = options?.search || ''
  const onlyActive = options?.onlyActive ?? false

  const conditions: string[] = []
  const params: any[] = []

  if (storeId && storeId !== 'ALL') {
    params.push(storeId)
    conditions.push(`"storeId" = $${params.length}`)
  }

  if (onlyActive) {
    conditions.push(`"isActive" = true`)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const rawEtalases: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "etalases" ${whereClause} ORDER BY "promotionPriority" DESC, "createdAt" DESC`,
    ...params
  )

  if (rawEtalases.length === 0) return []

  const etalaseIds = rawEtalases.map((e) => e.id)
  const rawItems: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "etalase_products" WHERE "etalaseId" = ANY($1::text[]) ORDER BY "sortOrder" ASC, "createdAt" ASC`,
    etalaseIds
  )

  const productIds = Array.from(
    new Set(
      [
        ...rawItems.map((i) => i.productId),
        ...rawEtalases.map((e) => e.coverProductId).filter(Boolean),
      ].filter(Boolean)
    )
  )

  const storeIds = Array.from(
    new Set(rawEtalases.map((e) => e.storeId).filter(Boolean))
  )

  const [products, stores, salesGroup] = await Promise.all([
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          include: {
            variants: true,
            store: {
              select: {
                id: true,
                name: true,
                slug: true,
                companyName: true,
                city: true,
                rating: true,
                isPkp: true,
                vatRate: true,
                taxType: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    storeIds.length > 0
      ? prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: {
            id: true,
            name: true,
            slug: true,
            companyName: true,
            city: true,
            rating: true,
            isPkp: true,
            vatRate: true,
            taxType: true,
          },
        })
      : Promise.resolve([]),
    productIds.length > 0
      ? prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            productId: { in: productIds },
            order: { status: { not: 'CANCELLED' } },
          },
          _sum: { quantity: true },
        })
      : Promise.resolve([]),
  ])

  const productsMap = new Map<string, any>()
  products.forEach((p) => productsMap.set(p.id, p))

  const storesMap = new Map<string, any>()
  stores.forEach((s) => storesMap.set(s.id, s))

  const salesMap = new Map<string, number>()
  salesGroup.forEach((s) => {
    if (s.productId) salesMap.set(s.productId, s._sum.quantity || 0)
  })

  const itemsByEtalase = new Map<string, any[]>()
  for (const item of rawItems) {
    if (!itemsByEtalase.has(item.etalaseId)) {
      itemsByEtalase.set(item.etalaseId, [])
    }
    itemsByEtalase.get(item.etalaseId)!.push(item)
  }

  let evaluatedList: EvaluatedEtalase[] = []
  for (const raw of rawEtalases) {
    const eItems = itemsByEtalase.get(raw.id) || []
    const storeObj = storesMap.get(raw.storeId) || null
    const evaluated = evaluateEtalase(
      { ...raw, store: storeObj },
      eItems,
      productsMap,
      salesMap
    )

    if (onlyActive && evaluated.productCount === 0) continue
    evaluatedList.push(evaluated)
  }

  // Filter berdasarkan merek jika ada
  if (brand && brand !== 'ALL') {
    const brandLower = brand.toLowerCase()
    evaluatedList = evaluatedList.filter(
      (e) =>
        e.brand?.toLowerCase() === brandLower ||
        e.etalaseItems.some(
          (i) => i.product?.brand?.toLowerCase() === brandLower
        )
    )
  }

  // Filter pencarian pintar (mencakup judul etalase maupun nama/model produk di dalamnya!)
  if (search && search.trim()) {
    const smart = analyzeSmartQuery(search.trim())
    const terms = [search.trim().toLowerCase()]
    if (
      smart.hasCorrection &&
      !terms.includes(smart.effectiveQuery.toLowerCase())
    ) {
      terms.push(smart.effectiveQuery.toLowerCase())
    }

    evaluatedList = evaluatedList.filter((e) => {
      return terms.some((t) => {
        if (e.name.toLowerCase().includes(t)) return true
        if (e.brand?.toLowerCase().includes(t)) return true
        if (e.description?.toLowerCase().includes(t)) return true
        return e.etalaseItems.some(
          (item) =>
            item.label.toLowerCase().includes(t) ||
            item.product?.name?.toLowerCase().includes(t) ||
            item.product?.model?.toLowerCase().includes(t)
        )
      })
    })
  }

  if (options?.minPrice !== undefined) {
    evaluatedList = evaluatedList.filter((e) => e.price >= options.minPrice!)
  }
  if (options?.maxPrice !== undefined) {
    evaluatedList = evaluatedList.filter((e) => e.price <= options.maxPrice!)
  }

  // Sorting
  const sort = options?.sort || ''
  if (sort === 'price_asc') {
    evaluatedList.sort((a, b) => a.price - b.price)
  } else if (sort === 'price_desc') {
    evaluatedList.sort((a, b) => b.price - a.price)
  } else if (sort === 'stock_desc') {
    evaluatedList.sort((a, b) => b.stock - a.stock)
  } else if (sort === 'oldest') {
    evaluatedList.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  } else if (sort === 'latest') {
    evaluatedList.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  return evaluatedList
}

/**
 * Mencari Etalase berdasarkan ID Etalase ATAU ID Produk yang ada di dalamnya
 */
export async function getEtalaseByIdOrProductId(
  id: string
): Promise<EvaluatedEtalase | null> {
  if (typeof (prisma as any)?.$queryRawUnsafe !== 'function') return null
  await ensureInitialEtalasesSeeded()

  let rawEtalase: any = null
  let requestedProductId: string | null = null

  const byIdRows: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "etalases" WHERE "id" = $1 LIMIT 1`,
    id
  )
  if (byIdRows.length > 0) {
    rawEtalase = byIdRows[0]
  } else {
    // Cek apakah id adalah productId di dalam etalase_products
    const byProdRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT e.* FROM "etalases" e
       INNER JOIN "etalase_products" ep ON ep."etalaseId" = e."id"
       WHERE ep."productId" = $1
       ORDER BY e."isActive" DESC, e."updatedAt" DESC
       LIMIT 1`,
      id
    )
    if (byProdRows.length > 0) {
      rawEtalase = byProdRows[0]
      requestedProductId = id
    }
  }

  if (!rawEtalase) return null

  const rawItems: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "etalase_products" WHERE "etalaseId" = $1 ORDER BY "sortOrder" ASC, "createdAt" ASC`,
    rawEtalase.id
  )

  const productIds = Array.from(
    new Set(
      [...rawItems.map((i) => i.productId), rawEtalase.coverProductId].filter(
        Boolean
      )
    )
  )

  const [products, store, salesGroup] = await Promise.all([
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          include: {
            variants: true,
          },
        })
      : Promise.resolve([]),
    prisma.store.findUnique({
      where: { id: rawEtalase.storeId },
      include: {
        bankAccounts: true,
        schedules: true,
        _count: { select: { products: true } },
      },
    }),
    productIds.length > 0
      ? prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            productId: { in: productIds },
            order: { status: { not: 'CANCELLED' } },
          },
          _sum: { quantity: true },
        })
      : Promise.resolve([]),
  ])

  const productsMap = new Map<string, any>()
  products.forEach((p) => productsMap.set(p.id, { ...p, store }))

  const salesMap = new Map<string, number>()
  salesGroup.forEach((s) => {
    if (s.productId) salesMap.set(s.productId, s._sum.quantity || 0)
  })

  return evaluateEtalase(
    { ...rawEtalase, store },
    rawItems,
    productsMap,
    salesMap,
    requestedProductId
  )
}

export interface CreateOrUpdateEtalaseInput {
  storeId: string
  name: string
  description?: string | null
  brand?: string | null
  category?: string
  coverProductId?: string | null
  customCoverImage?: string | null
  customTitle?: string | null
  priceMode?: EtalasePriceMode
  customPrice?: number | null
  customOriginalPrice?: number | null
  isActive?: boolean
  isPromoted?: boolean
  promotionPriority?: number
  items?: Array<{
    productId: string
    label?: string | null
    sortOrder?: number
  }>
}

/**
 * Membuat Etalase Baru beserta daftar Produk di dalamnya
 */
export async function createEtalaseRecord(
  input: CreateOrUpdateEtalaseInput
): Promise<EvaluatedEtalase | null> {
  const id = makeId('etalase')
  const now = new Date()
  const items = Array.isArray(input.items) ? input.items : []
  const effectiveCoverProductId =
    input.coverProductId || items[0]?.productId || null

  await prisma.$executeRawUnsafe(
    `INSERT INTO "etalases" (
      "id", "storeId", "name", "description", "brand", "category",
      "coverProductId", "customCoverImage", "customTitle",
      "priceMode", "customPrice", "customOriginalPrice",
      "isActive", "isPromoted", "promotionPriority", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    id,
    input.storeId,
    input.name.trim(),
    input.description ?? null,
    input.brand ?? null,
    input.category || 'Smartphone',
    effectiveCoverProductId,
    input.customCoverImage ?? null,
    input.customTitle ?? input.name.trim(),
    input.priceMode || 'LOWEST',
    input.customPrice !== undefined && input.customPrice !== null
      ? Number(input.customPrice)
      : null,
    input.customOriginalPrice !== undefined &&
      input.customOriginalPrice !== null
      ? Number(input.customOriginalPrice)
      : null,
    input.isActive ?? true,
    input.isPromoted ?? false,
    Number(input.promotionPriority) || 0,
    now,
    now
  )

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item.productId) continue
    await prisma.$executeRawUnsafe(
      `INSERT INTO "etalase_products" ("id", "etalaseId", "productId", "label", "sortOrder", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("etalaseId", "productId") DO UPDATE SET "label" = EXCLUDED."label", "sortOrder" = EXCLUDED."sortOrder"`,
      makeId('etaitem'),
      id,
      item.productId,
      item.label?.trim() || null,
      item.sortOrder ?? i,
      now
    )
  }

  return getEtalaseByIdOrProductId(id)
}

/**
 * Mengupdate Etalase dengan proteksi kepemilikan Multi-Tenant (storeIdScope)
 */
export async function updateEtalaseRecord(
  id: string,
  storeIdScope: string | null,
  input: Partial<CreateOrUpdateEtalaseInput>
): Promise<EvaluatedEtalase | null> {
  const existingRows: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "etalases" WHERE "id" = $1 LIMIT 1`,
    id
  )
  if (existingRows.length === 0) return null
  const existing = existingRows[0]

  // Penegakan IDOR Multi-Tenant: jika storeIdScope diset dan berbeda, kembalikan null (404)
  if (storeIdScope && existing.storeId !== storeIdScope) {
    return null
  }

  const now = new Date()
  const nextName = input.name !== undefined ? input.name.trim() : existing.name
  const nextDescription =
    input.description !== undefined ? input.description : existing.description
  const nextBrand = input.brand !== undefined ? input.brand : existing.brand
  const nextCategory =
    input.category !== undefined ? input.category : existing.category
  const nextCoverProductId =
    input.coverProductId !== undefined
      ? input.coverProductId
      : existing.coverProductId
  const nextCustomCoverImage =
    input.customCoverImage !== undefined
      ? input.customCoverImage
      : existing.customCoverImage
  const nextCustomTitle =
    input.customTitle !== undefined ? input.customTitle : existing.customTitle
  const nextPriceMode =
    input.priceMode !== undefined ? input.priceMode : existing.priceMode
  const nextCustomPrice =
    input.customPrice !== undefined
      ? input.customPrice !== null
        ? Number(input.customPrice)
        : null
      : existing.customPrice
  const nextCustomOriginalPrice =
    input.customOriginalPrice !== undefined
      ? input.customOriginalPrice !== null
        ? Number(input.customOriginalPrice)
        : null
      : existing.customOriginalPrice
  const nextIsActive =
    input.isActive !== undefined ? Boolean(input.isActive) : existing.isActive

  await prisma.$executeRawUnsafe(
    `UPDATE "etalases" SET
      "name" = $1,
      "description" = $2,
      "brand" = $3,
      "category" = $4,
      "coverProductId" = $5,
      "customCoverImage" = $6,
      "customTitle" = $7,
      "priceMode" = $8,
      "customPrice" = $9,
      "customOriginalPrice" = $10,
      "isActive" = $11,
      "updatedAt" = $12
     WHERE "id" = $13`,
    nextName,
    nextDescription,
    nextBrand,
    nextCategory,
    nextCoverProductId,
    nextCustomCoverImage,
    nextCustomTitle,
    nextPriceMode,
    nextCustomPrice,
    nextCustomOriginalPrice,
    nextIsActive,
    now,
    id
  )

  if (Array.isArray(input.items)) {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "etalase_products" WHERE "etalaseId" = $1`,
      id
    )
    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i]
      if (!item.productId) continue
      await prisma.$executeRawUnsafe(
        `INSERT INTO "etalase_products" ("id", "etalaseId", "productId", "label", "sortOrder", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT ("etalaseId", "productId") DO NOTHING`,
        makeId('etaitem'),
        id,
        item.productId,
        item.label?.trim() || null,
        item.sortOrder ?? i,
        now
      )
    }
  }

  return getEtalaseByIdOrProductId(id)
}

/**
 * Menghapus Etalase dengan proteksi kepemilikan Multi-Tenant (storeIdScope)
 */
export async function deleteEtalaseRecord(
  id: string,
  storeIdScope: string | null
): Promise<boolean> {
  const existingRows: any[] = await prisma.$queryRawUnsafe(
    `SELECT "id", "storeId" FROM "etalases" WHERE "id" = $1 LIMIT 1`,
    id
  )
  if (existingRows.length === 0) return false
  if (storeIdScope && existingRows[0].storeId !== storeIdScope) {
    return false
  }

  await prisma.$executeRawUnsafe(`DELETE FROM "etalases" WHERE "id" = $1`, id)
  return true
}
