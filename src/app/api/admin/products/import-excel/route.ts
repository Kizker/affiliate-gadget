import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import ExcelJS from 'exceljs'
import {
  generateShopeeItemId,
  generateShopeeVariationId,
  generateSmartSku,
  extractModelCode,
} from '@/lib/shopee-codes'

// Helper: Extract brand from product title
function extractBrand(productName: string): string {
  if (!productName) return 'Smartphone'
  const p = productName.toLowerCase()
  if (p.includes('apple') || p.includes('iphone') || p.includes('ipad'))
    return 'Apple'
  if (p.includes('samsung') || p.includes('sein')) return 'Samsung'
  if (p.includes('asus') || p.includes('rog') || p.includes('zenfone'))
    return 'ASUS'
  if (p.includes('xiaomi') || p.includes('redmi') || p.includes('poco'))
    return 'Xiaomi'
  if (p.includes('oppo') || p.includes('find')) return 'Oppo'
  if (p.includes('vivo')) return 'Vivo'
  if (p.includes('infinix')) return 'Infinix'
  if (p.includes('realme')) return 'Realme'
  if (p.includes('pixel') || p.includes('google')) return 'Google'
  if (p.includes('huawei')) return 'Huawei'
  if (p.includes('sony') || p.includes('xperia')) return 'Sony'
  if (p.includes('nothing')) return 'Nothing'
  if (p.includes('blackberry')) return 'Blackberry'
  return 'Smartphone'
}

// Helper: Extract clean model name
function extractModel(productName: string, skuInduk?: string): string {
  if (skuInduk && skuInduk.trim()) return skuInduk.trim()
  if (!productName) return 'Gadget'

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

// Helper: Extract condition from title/variants
function extractCondition(productName: string, variantName?: string): string {
  const combined = `${productName} ${variantName || ''}`.toUpperCase()
  if (combined.includes('LIKE NEW') || combined.includes('99%'))
    return 'LIKE_NEW'
  if (
    combined.includes('MULUS') ||
    combined.includes('95%') ||
    combined.includes('98%')
  )
    return 'SECOND_MULUS'
  if (
    combined.includes('MINUS') ||
    combined.includes('GRADE A') ||
    combined.includes('MATI TOTAL') ||
    combined.includes('TOMPEL') ||
    combined.includes('JARONG') ||
    combined.includes('GARIS') ||
    combined.includes('LECET')
  ) {
    return 'GRADE_A'
  }
  if (
    combined.includes('BARU') ||
    combined.includes('BNIB') ||
    combined.includes('BNOB')
  )
    return 'BARU'
  return 'SECOND_MULUS'
}

// Helper: Parse RAM, Storage, and Color from text
function extractVariantSpecs(variantName: string, productName: string) {
  const target = `${variantName || ''} ${productName || ''}`

  let ram = ''
  let storage = ''
  let color = ''

  // RAM Match (e.g. 8GB or 12/256)
  const ramSlashMatch = target.match(
    /\b([0-9]{1,2})\s*\/\s*([0-9]{2,4}(?:GB|TB)?)/i
  )
  if (ramSlashMatch) {
    ram = `${ramSlashMatch[1]}GB`
    storage = ramSlashMatch[2].toUpperCase()
    if (!storage.endsWith('GB') && !storage.endsWith('TB')) storage += 'GB'
  } else {
    const ramOnlyMatch = target.match(/\b([0-9]{1,2})\s*GB\b/i)
    if (ramOnlyMatch) ram = `${ramOnlyMatch[1]}GB`

    const storageMatch = target.match(/\b(64|128|256|512|1TB|1\s*TB)\b/i)
    if (storageMatch) {
      storage = storageMatch[1].toUpperCase().replace(/\s+/g, '')
      if (!storage.endsWith('GB') && !storage.endsWith('TB')) storage += 'GB'
    }
  }

  // Color / Package
  if (variantName) {
    if (variantName.includes(',')) {
      color = variantName.split(',').slice(1).join(',').trim()
    } else if (variantName.includes('-')) {
      color = variantName.split('-').slice(1).join('-').trim()
    } else {
      color = variantName.trim()
    }
  }

  return { ram, storage, color }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    // Strict Authorization: Only SUPER_ADMIN
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          error:
            'Akses ditolak: Fitur update harga & stok massal hanya dapat diakses oleh Superadmin.',
        },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mirrorModeParam = formData.get('mirrorMode')
    const isMirrorMode =
      mirrorModeParam === null ||
      mirrorModeParam === 'true' ||
      mirrorModeParam === '1'

    if (!file) {
      return NextResponse.json(
        { error: 'Berkas Excel (.xlsx) tidak ditemukan pada permintaan.' },
        { status: 400 }
      )
    }

    const fileName = file.name || ''
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        {
          error:
            'Format berkas tidak valid. Harap unggah berkas spreadsheet Excel (.xlsx).',
        },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as any)

    const worksheet =
      workbook.getWorksheet('Sheet1') ||
      workbook.getWorksheet('Katalog Produk & SKU') ||
      workbook.worksheets[0]

    if (!worksheet) {
      return NextResponse.json(
        {
          error:
            'Lembar kerja (worksheet) tidak ditemukan di dalam berkas Excel.',
        },
        { status: 400 }
      )
    }

    const parseCellString = (cell: ExcelJS.Cell | undefined): string => {
      if (!cell || cell.value === null || cell.value === undefined) return ''
      if (typeof cell.value === 'object') {
        const obj: any = cell.value
        return String(obj.result ?? obj.text ?? obj.richText?.[0]?.text ?? '')
      }
      return String(cell.value).trim()
    }

    const parseCellNumber = (cell: ExcelJS.Cell | undefined): number | null => {
      if (!cell || cell.value === null || cell.value === undefined) return null
      if (typeof cell.value === 'number') return cell.value
      const strVal = parseCellString(cell).replace(/[^0-9]/g, '')
      if (!strVal) return null
      const parsed = parseInt(strVal, 10)
      return isNaN(parsed) ? null : parsed
    }

    // ─────────────────────────────────────────────────────────────
    // DYNAMIC HEADER DETECTION (Rows 1 to 5)
    // ─────────────────────────────────────────────────────────────
    let headerRowNumber = 1
    let isShopeeFormat = false

    // Column mapping pointers
    let kodeProdukCol = -1
    let namaProdukCol = -1
    let kodeVariasiCol = -1
    let namaVariasiCol = -1
    let skuIndukCol = -1
    let skuCol = -1
    let hargaCol = -1
    let gtinCol = -1
    let stokCol = -1
    let minBeliCol = -1
    let maksBeliCol = -1

    // Legacy format columns
    let variantIdCol = -1
    let productIdCol = -1
    let modelCol = -1
    let ramCol = -1
    let storageCol = -1
    let colorCol = -1
    let brandCol = -1
    let conditionCol = -1
    let origPriceCol = -1
    let storeCol = -1
    let statusCol = -1
    let descCol = -1
    let chipsetCol = -1
    let displayCol = -1
    let cameraCol = -1
    let batteryCol = -1

    for (let r = 1; r <= Math.min(worksheet.rowCount, 5); r++) {
      const row = worksheet.getRow(r)
      let foundHeaderCount = 0

      row.eachCell((cell, colNumber) => {
        const text = parseCellString(cell).toLowerCase().trim()
        if (text === 'kode produk' || text.includes('kode produk')) {
          kodeProdukCol = colNumber
          foundHeaderCount++
        } else if (text === 'nama produk' || text.includes('nama produk')) {
          namaProdukCol = colNumber
          foundHeaderCount++
        } else if (text === 'kode variasi' || text.includes('kode variasi')) {
          kodeVariasiCol = colNumber
          foundHeaderCount++
        } else if (text === 'nama variasi' || text.includes('nama variasi')) {
          namaVariasiCol = colNumber
          foundHeaderCount++
        } else if (text === 'sku induk' || text.includes('sku induk')) {
          skuIndukCol = colNumber
        } else if (text === 'sku' || text.includes('sku')) {
          skuCol = colNumber
          foundHeaderCount++
        } else if (text === 'harga' || text.includes('harga')) {
          hargaCol = colNumber
          foundHeaderCount++
        } else if (text === 'stok' || text.includes('stok')) {
          stokCol = colNumber
          foundHeaderCount++
        } else if (text.includes('id varian')) {
          variantIdCol = colNumber
          foundHeaderCount++
        } else if (text.includes('id produk')) {
          productIdCol = colNumber
          foundHeaderCount++
        } else if (text.includes('model')) {
          modelCol = colNumber
        } else if (text === 'ram') {
          ramCol = colNumber
        } else if (text.includes('penyimpanan') || text.includes('storage')) {
          storageCol = colNumber
        } else if (text.includes('warna') || text.includes('color')) {
          colorCol = colNumber
        } else if (text.includes('merek') || text.includes('brand')) {
          brandCol = colNumber
        } else if (text.includes('kondisi')) {
          conditionCol = colNumber
        } else if (text.includes('harga coret')) {
          origPriceCol = colNumber
        } else if (text.includes('toko')) {
          storeCol = colNumber
        } else if (text.includes('status')) {
          statusCol = colNumber
        } else if (text.includes('deskripsi')) {
          descCol = colNumber
        } else if (text.includes('chipset')) {
          chipsetCol = colNumber
        } else if (text.includes('layar')) {
          displayCol = colNumber
        } else if (text.includes('kamera')) {
          cameraCol = colNumber
        } else if (text.includes('baterai')) {
          batteryCol = colNumber
        }
      })

      if (foundHeaderCount >= 3) {
        headerRowNumber = r
        if (
          kodeProdukCol !== -1 ||
          kodeVariasiCol !== -1 ||
          namaVariasiCol !== -1
        ) {
          isShopeeFormat = true
        }
        break
      }
    }

    // Fallback column positions for Shopee format if not discovered
    if (isShopeeFormat) {
      if (kodeProdukCol === -1) kodeProdukCol = 1
      if (namaProdukCol === -1) namaProdukCol = 2
      if (kodeVariasiCol === -1) kodeVariasiCol = 3
      if (namaVariasiCol === -1) namaVariasiCol = 4
      if (skuIndukCol === -1) skuIndukCol = 5
      if (skuCol === -1) skuCol = 6
      if (hargaCol === -1) hargaCol = 7
      if (gtinCol === -1) gtinCol = 8
      if (stokCol === -1) stokCol = 9
      if (minBeliCol === -1) minBeliCol = 10
      if (maksBeliCol === -1) maksBeliCol = 11
    } else {
      // Legacy format fallbacks
      if (skuCol === -1) skuCol = 1
      if (variantIdCol === -1) variantIdCol = 2
      if (productIdCol === -1) productIdCol = 3
      if (modelCol === -1) modelCol = 4
      if (ramCol === -1) ramCol = 5
      if (storageCol === -1) storageCol = 6
      if (colorCol === -1) colorCol = 7
      if (namaProdukCol === -1) namaProdukCol = 8
      if (namaVariasiCol === -1) namaVariasiCol = 9
      if (brandCol === -1) brandCol = 10
      if (conditionCol === -1) conditionCol = 11
      if (hargaCol === -1) hargaCol = 12
      if (origPriceCol === -1) origPriceCol = 13
      if (stokCol === -1) stokCol = 14
      if (storeCol === -1) storeCol = 15
      if (statusCol === -1) statusCol = 16
      if (descCol === -1) descCol = 17
      if (chipsetCol === -1) chipsetCol = 18
      if (displayCol === -1) displayCol = 19
      if (cameraCol === -1) cameraCol = 20
      if (batteryCol === -1) batteryCol = 21
    }

    // Fetch all stores in memory to resolve store matching
    const allStores = await prisma.store.findMany({
      select: { id: true, name: true, city: true },
    })
    const defaultStoreId = allStores[0]?.id || null

    const findStoreId = (rawStore: string): string | null => {
      if (!rawStore || allStores.length === 0) return defaultStoreId
      const q = rawStore.toLowerCase().trim()
      const found = allStores.find(
        (s) =>
          q.includes(s.name.toLowerCase()) ||
          q.includes(s.city.toLowerCase()) ||
          s.name.toLowerCase().includes(q)
      )
      return found?.id || defaultStoreId
    }

    interface ParsedRow {
      rowNumber: number
      kodeProduk: string
      namaProduk: string
      kodeVariasi: string
      namaVariasi: string
      skuInduk: string
      sku: string
      harga: number
      stok: number
      // Optional/Extended fields for legacy support
      ram?: string
      storage?: string
      color?: string
      model?: string
      brand?: string
      condition?: string
      originalPrice?: number | null
      storeName?: string
      isActive?: boolean | null
      description?: string
      chipset?: string
      layar?: string
      kamera?: string
      baterai?: string
    }

    const rowsToProcess: ParsedRow[] = []
    const errors: Array<{ row: number; sku?: string; reason: string }> = []

    worksheet.eachRow((row, rowNumber) => {
      // Skip header row and preceding rows
      if (rowNumber <= headerRowNumber) return

      const rawHargaStr = parseCellString(row.getCell(hargaCol))

      // Check if this is an instruction/guideline row (Shopee Row 2)
      if (
        rawHargaStr.includes('Mohon masukkan') ||
        rawHargaStr.includes('Batas harga') ||
        rawHargaStr.includes('untuk harga produk') ||
        parseCellString(row.getCell(namaProdukCol)).includes(
          'Min. jumlah pembelian'
        )
      ) {
        return // Skip instruction row!
      }

      const kodeProduk = parseCellString(
        row.getCell(kodeProdukCol !== -1 ? kodeProdukCol : productIdCol)
      )
      const namaProduk = parseCellString(row.getCell(namaProdukCol))
      const kodeVariasi = parseCellString(
        row.getCell(kodeVariasiCol !== -1 ? kodeVariasiCol : variantIdCol)
      )
      const namaVariasi = parseCellString(row.getCell(namaVariasiCol))
      const skuInduk = parseCellString(
        row.getCell(skuIndukCol !== -1 ? skuIndukCol : modelCol)
      )
      const sku = parseCellString(row.getCell(skuCol))
      const price = parseCellNumber(row.getCell(hargaCol))

      const isMeaningful = (s: string) =>
        s && s.trim() !== '' && s.trim() !== '-' && !s.startsWith('AUTO-')

      // If row has no meaningful identifiers at all (blank or trailing formatted row), skip immediately!
      if (
        !isMeaningful(kodeProduk) &&
        !isMeaningful(namaProduk) &&
        !isMeaningful(kodeVariasi) &&
        !isMeaningful(sku)
      ) {
        return // Skip blank or trailing decorative rows
      }

      // If price is missing or invalid, record error
      if (price === null || price < 0) {
        errors.push({
          row: rowNumber,
          sku: sku || namaProduk || kodeProduk || '-',
          reason: `Harga wajib berupa angka valid >= 0 (Ditemukan: "${rawHargaStr}").`,
        })
        return
      }

      // Safe stock parsing: if stock cell is blank or empty, safely default to 0 (stok habis)
      const rawStockNum = parseCellNumber(row.getCell(stokCol))
      const stock =
        rawStockNum !== null ? Math.max(0, Math.floor(rawStockNum)) : 0

      // Parse legacy fields if present
      let ram = ''
      let storage = ''
      let color = ''
      let brand = ''
      let condition = ''
      let originalPrice: number | null = null
      let storeName = ''
      let isActive: boolean | null = null
      let description = ''
      let chipset = ''
      let layar = ''
      let kamera = ''
      let baterai = ''

      if (!isShopeeFormat) {
        ram = parseCellString(row.getCell(ramCol))
        storage = parseCellString(row.getCell(storageCol))
        color = parseCellString(row.getCell(colorCol))
        brand = parseCellString(row.getCell(brandCol))
        condition = parseCellString(row.getCell(conditionCol))
        originalPrice = parseCellNumber(row.getCell(origPriceCol))
        storeName = parseCellString(row.getCell(storeCol))
        const statusRaw = parseCellString(row.getCell(statusCol)).toUpperCase()
        if (
          statusRaw.includes('NON') ||
          statusRaw === 'FALSE' ||
          statusRaw === '0'
        ) {
          isActive = false
        } else if (
          statusRaw.includes('AKTIF') ||
          statusRaw === 'TRUE' ||
          statusRaw === '1'
        ) {
          isActive = true
        }
        description = parseCellString(row.getCell(descCol))
        chipset = parseCellString(row.getCell(chipsetCol))
        layar = parseCellString(row.getCell(displayCol))
        kamera = parseCellString(row.getCell(cameraCol))
        baterai = parseCellString(row.getCell(batteryCol))
      } else {
        // In Shopee format, extract RAM, storage, and color from variant/product name
        const specsExtracted = extractVariantSpecs(namaVariasi, namaProduk)
        ram = specsExtracted.ram
        storage = specsExtracted.storage
        color = specsExtracted.color
        brand = extractBrand(namaProduk)
        condition = extractCondition(namaProduk, namaVariasi)
      }

      rowsToProcess.push({
        rowNumber,
        kodeProduk,
        namaProduk,
        kodeVariasi,
        namaVariasi,
        skuInduk,
        sku,
        harga: price,
        stok: Math.floor(stock),
        ram,
        storage,
        color,
        model: skuInduk,
        brand,
        condition,
        originalPrice,
        storeName,
        isActive,
        description,
        chipset,
        layar,
        kamera,
        baterai,
      })
    })

    if (rowsToProcess.length === 0 && errors.length === 0) {
      return NextResponse.json(
        {
          error:
            'Berkas Excel tidak berisi baris produk yang valid untuk diproses.',
        },
        { status: 400 }
      )
    }

    let updatedCount = 0
    let createdCount = 0
    let unchangedCount = 0
    let deletedProductsCount = 0
    let deletedVariantsCount = 0
    let deactivatedProductsCount = 0
    let skippedCount = errors.length

    // ─────────────────────────────────────────────────────────────
    // TRANSACTION: MULTI-TIER MATCHING & CATALOG MIGRATION
    // ─────────────────────────────────────────────────────────────
    await prisma.$transaction(
      async (tx) => {
        const touchedProductIds = new Set<string>()
        const touchedVariantIds = new Set<string>()

        // In-memory cache for newly created or referenced products in this transaction
        // Key: kodeProduk OR normalized namaProduk OR normalized model
        const cachedProducts = new Map<string, any>()

        for (const item of rowsToProcess) {
          let processed = false

          const isAutoOrEmpty = (idStr: string) =>
            !idStr ||
            idStr.startsWith('AUTO-') ||
            idStr.startsWith('NEW') ||
            idStr.startsWith('cvar') ||
            idStr.startsWith('cprd') ||
            idStr.startsWith('VAR-') ||
            idStr.startsWith('PROD-') ||
            idStr === '-'

          const cleanSku =
            item.sku && !item.sku.startsWith('SKU-AUTO-')
              ? item.sku.trim()
              : null
          const cleanKodeVariasi =
            item.kodeVariasi && !isAutoOrEmpty(item.kodeVariasi)
              ? item.kodeVariasi.trim()
              : null
          const cleanKodeProduk =
            item.kodeProduk && !isAutoOrEmpty(item.kodeProduk)
              ? item.kodeProduk.trim()
              : null

          // ─── 1. Match by Existing Variant ID ────────────────────────
          if (cleanKodeVariasi) {
            const variant = await tx.productVariant.findUnique({
              where: { id: cleanKodeVariasi },
              include: { product: true },
            })

            if (variant) {
              let hasChanges = false
              const variantUpdates: any = {}

              if (Number(variant.price) !== Number(item.harga)) {
                variantUpdates.price = item.harga
                hasChanges = true
              }
              if (Number(variant.stock) !== Number(item.stok)) {
                variantUpdates.stock = item.stok
                hasChanges = true
              }
              if (cleanSku && cleanSku !== variant.sku) {
                variantUpdates.sku = cleanSku
                hasChanges = true
              }
              if (
                item.namaVariasi &&
                item.namaVariasi.trim() !== (variant.name || '').trim()
              ) {
                variantUpdates.name = item.namaVariasi.trim()
                hasChanges = true
              }

              if (hasChanges) {
                await tx.productVariant.update({
                  where: { id: variant.id },
                  data: variantUpdates,
                })
                updatedCount++
              } else {
                unchangedCount++
              }

              touchedProductIds.add(variant.productId)
              touchedVariantIds.add(variant.id)
              processed = true
            }
          }

          // ─── 2. Match by Existing SKU ───────────────────────────────
          if (!processed && cleanSku) {
            const variant = await tx.productVariant.findFirst({
              where: { sku: cleanSku },
              include: { product: true },
            })

            if (variant) {
              let hasChanges = false
              const variantUpdates: any = {}

              if (Number(variant.price) !== Number(item.harga)) {
                variantUpdates.price = item.harga
                hasChanges = true
              }
              if (Number(variant.stock) !== Number(item.stok)) {
                variantUpdates.stock = item.stok
                hasChanges = true
              }
              if (
                item.namaVariasi &&
                item.namaVariasi.trim() !== (variant.name || '').trim()
              ) {
                variantUpdates.name = item.namaVariasi.trim()
                hasChanges = true
              }

              if (hasChanges) {
                await tx.productVariant.update({
                  where: { id: variant.id },
                  data: variantUpdates,
                })
                updatedCount++
              } else {
                unchangedCount++
              }

              touchedProductIds.add(variant.productId)
              touchedVariantIds.add(variant.id)
              processed = true
            }
          }

          // ─── 3. Match Product by Kode Produk / Shopee Item ID / Name ─
          if (!processed) {
            let product: any = null

            // Check cache by Kode Produk or Name or Model
            if (cleanKodeProduk && cachedProducts.has(cleanKodeProduk)) {
              product = cachedProducts.get(cleanKodeProduk)
            } else if (
              item.namaProduk &&
              cachedProducts.has(item.namaProduk.toLowerCase().trim())
            ) {
              product = cachedProducts.get(item.namaProduk.toLowerCase().trim())
            } else if (
              item.skuInduk &&
              cachedProducts.has(item.skuInduk.toLowerCase().trim())
            ) {
              product = cachedProducts.get(item.skuInduk.toLowerCase().trim())
            }

            // If not in cache, query database by ID or Shopee Item ID
            if (!product && cleanKodeProduk) {
              product = await tx.product.findUnique({
                where: { id: cleanKodeProduk },
                include: { variants: true },
              })

              if (!product) {
                product = await tx.product.findFirst({
                  where: {
                    specs: {
                      path: ['shopeeItemId'],
                      equals: cleanKodeProduk,
                    },
                  },
                  include: { variants: true },
                })
              }
            }

            // If still not found, query database by Name
            if (!product && item.namaProduk) {
              product = await tx.product.findFirst({
                where: {
                  name: {
                    equals: item.namaProduk.trim(),
                    mode: 'insensitive',
                  },
                },
                include: { variants: true },
              })
            }

            // If still not found and skuInduk is provided, query by model
            if (!product && item.skuInduk) {
              product = await tx.product.findFirst({
                where: {
                  model: {
                    equals: item.skuInduk.trim(),
                    mode: 'insensitive',
                  },
                },
                include: { variants: true },
              })
            }

            if (product) {
              // Product exists: Search for variant inside this product
              const variants: any[] = product.variants || []
              let matchedVariant: any = null

              if (cleanSku) {
                matchedVariant = variants.find((v) => v.sku === cleanSku)
              }
              if (!matchedVariant && item.namaVariasi) {
                matchedVariant = variants.find(
                  (v) =>
                    (v.name || '').toLowerCase().trim() ===
                    item.namaVariasi.toLowerCase().trim()
                )
              }
              if (
                !matchedVariant &&
                variants.length === 1 &&
                (!item.namaVariasi || item.namaVariasi === 'Standar')
              ) {
                matchedVariant = variants[0]
              }

              if (matchedVariant) {
                // Existing variant found -> Update price / stock / sku
                let hasChanges = false
                const variantUpdates: any = {}

                if (Number(matchedVariant.price) !== Number(item.harga)) {
                  variantUpdates.price = item.harga
                  hasChanges = true
                }
                if (Number(matchedVariant.stock) !== Number(item.stok)) {
                  variantUpdates.stock = item.stok
                  hasChanges = true
                }
                if (cleanSku && cleanSku !== matchedVariant.sku) {
                  variantUpdates.sku = cleanSku
                  hasChanges = true
                }

                if (hasChanges) {
                  await tx.productVariant.update({
                    where: { id: matchedVariant.id },
                    data: variantUpdates,
                  })
                  updatedCount++
                } else {
                  unchangedCount++
                }

                touchedProductIds.add(product.id)
                touchedVariantIds.add(matchedVariant.id)
                processed = true
              } else {
                // Variant not found in existing product -> Create new variant
                // Auto-generate smart structured SKU conforming to template
                const finalSku =
                  cleanSku ||
                  generateSmartSku(
                    product.name,
                    item.namaVariasi,
                    item.skuInduk || product.model
                  )

                // Auto-generate Shopee 12-digit variation ID if not provided
                const newVarCode =
                  cleanKodeVariasi || generateShopeeVariationId()

                const newVariant = await tx.productVariant.create({
                  data: {
                    productId: product.id,
                    name: item.namaVariasi || 'Standar',
                    ram: item.ram || null,
                    storage: item.storage || null,
                    color: item.color || null,
                    price: item.harga,
                    stock: item.stok,
                    sku: finalSku,
                  },
                })

                // Save variation code in specs.shopeeVariationMap
                const prodSpecs = (product.specs as any) || {}
                prodSpecs.shopeeVariationMap = {
                  ...(prodSpecs.shopeeVariationMap || {}),
                  [newVariant.id]: newVarCode,
                  [newVariant.name]: newVarCode,
                }
                await tx.product.update({
                  where: { id: product.id },
                  data: { specs: prodSpecs },
                })

                variants.push(newVariant)
                touchedProductIds.add(product.id)
                touchedVariantIds.add(newVariant.id)
                createdCount++
                processed = true
              }
            } else {
              // ─── 4. Product does not exist -> CREATE NEW PRODUCT & VARIANT (Catalog Migration)
              const brand = item.brand || extractBrand(item.namaProduk)
              const model =
                item.skuInduk || extractModel(item.namaProduk, item.model)
              const condition =
                item.condition ||
                extractCondition(item.namaProduk, item.namaVariasi)
              const storeId = findStoreId(item.storeName || '')

              // Auto-generate authentic 11-digit Shopee Item ID if blank
              const finalKodeProduk = cleanKodeProduk || generateShopeeItemId()
              // Auto-generate authentic 12-digit Shopee Variation ID if blank
              const finalKodeVariasi =
                cleanKodeVariasi || generateShopeeVariationId()

              const specsObj: any = {
                shopeeItemId: finalKodeProduk,
                shopeeVariationMap: {},
                Brand: brand,
                Model: model,
              }
              if (item.chipset) specsObj.Chipset = item.chipset
              if (item.layar) specsObj.Layar = item.layar
              if (item.kamera) specsObj.Kamera = item.kamera
              if (item.baterai) specsObj.Baterai = item.baterai

              const newProduct = await tx.product.create({
                data: {
                  name: item.namaProduk || 'Gadget Baru',
                  model: model,
                  brand: brand,
                  category: 'Smartphone',
                  condition: condition,
                  price: item.harga,
                  stock: item.stok,
                  storeId: storeId,
                  description:
                    item.description ||
                    `Unit ${item.namaProduk} resmi teruji fungsional 100%, garansi toko 30 hari tukar unit terjamin.`,
                  specs: specsObj,
                  images: [
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
                  ],
                },
              })

              // Auto-generate smart structured SKU conforming to template
              const finalSku =
                cleanSku ||
                generateSmartSku(newProduct.name, item.namaVariasi, model)

              const newVariant = await tx.productVariant.create({
                data: {
                  productId: newProduct.id,
                  name: item.namaVariasi || 'Standar',
                  ram: item.ram || null,
                  storage: item.storage || null,
                  color: item.color || null,
                  price: item.harga,
                  stock: item.stok,
                  sku: finalSku,
                },
              })

              // Map variation code into specs.shopeeVariationMap
              specsObj.shopeeVariationMap[newVariant.id] = finalKodeVariasi
              specsObj.shopeeVariationMap[newVariant.name] = finalKodeVariasi
              await tx.product.update({
                where: { id: newProduct.id },
                data: { specs: specsObj },
              })

              // Cache product to link subsequent rows of the same product
              const productEntry = {
                id: newProduct.id,
                name: newProduct.name,
                model: newProduct.model,
                specs: specsObj,
                variants: [newVariant],
              }

              cachedProducts.set(finalKodeProduk, productEntry)
              if (item.namaProduk) {
                cachedProducts.set(
                  item.namaProduk.toLowerCase().trim(),
                  productEntry
                )
              }
              if (model) {
                cachedProducts.set(model.toLowerCase().trim(), productEntry)
              }

              touchedProductIds.add(newProduct.id)
              touchedVariantIds.add(newVariant.id)
              createdCount++
              processed = true
            }
          }

          if (!processed) {
            skippedCount++
            errors.push({
              row: item.rowNumber,
              sku: item.sku || item.namaProduk || item.kodeProduk || '-',
              reason: 'Gagal memproses baris produk ke database.',
            })
          }
        }

        // ─── 5. FULL CATALOG MIRRORING (Two-Way Reconciliation Sync) ──
        if (isMirrorMode && rowsToProcess.length > 0) {
          // A. Variant-Level Pruning: Delete old variants from touched products that were NOT in Excel
          for (const prodId of touchedProductIds) {
            const existingVariants = await tx.productVariant.findMany({
              where: { productId: prodId },
            })
            for (const ev of existingVariants) {
              if (!touchedVariantIds.has(ev.id)) {
                await tx.cartItem.deleteMany({ where: { variantId: ev.id } })
                await tx.productVariant.delete({ where: { id: ev.id } })
                deletedVariantsCount++
              }
            }
          }

          // B. Product-Level Pruning: Remove or deactivate products in website NOT present in Excel
          const allDbProducts = await tx.product.findMany({
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  orderItems: true,
                },
              },
            },
          })

          for (const dbProd of allDbProducts) {
            if (!touchedProductIds.has(dbProd.id)) {
              if (dbProd._count.orderItems === 0) {
                // Hard delete: Clean relations and delete product
                try {
                  await tx.cartItem.deleteMany({
                    where: { productId: dbProd.id },
                  })
                  await tx.review.deleteMany({
                    where: { productId: dbProd.id },
                  })
                  await tx.product.delete({ where: { id: dbProd.id } })
                  deletedProductsCount++
                } catch {
                  // Fallback to deactivation if relation constraint met
                  await tx.product.update({
                    where: { id: dbProd.id },
                    data: { isActive: false, stock: 0 },
                  })
                  await tx.productVariant.updateMany({
                    where: { productId: dbProd.id },
                    data: { stock: 0 },
                  })
                  deactivatedProductsCount++
                }
              } else {
                // Past order reference: soft-delete to preserve invoice & legal receipts
                await tx.product.update({
                  where: { id: dbProd.id },
                  data: { isActive: false, stock: 0 },
                })
                await tx.productVariant.updateMany({
                  where: { productId: dbProd.id },
                  data: { stock: 0 },
                })
                deactivatedProductsCount++
              }
            }
          }
        }

        // ─── 6. Synchronize Total Stock & Lowest Price for Touched Products ────
        for (const prodId of touchedProductIds) {
          const variants = await tx.productVariant.findMany({
            where: { productId: prodId },
          })
          if (variants.length > 0) {
            const totalStock = variants.reduce(
              (acc, v) => acc + (Number(v.stock) || 0),
              0
            )
            const minPrice = Math.min(
              ...variants.map((v) => Number(v.price) || 0)
            )
            await tx.product.update({
              where: { id: prodId },
              data: {
                isActive: true, // Re-activate if it was previously inactive
                stock: totalStock,
                ...(minPrice > 0 ? { price: minPrice } : {}),
              },
            })
          }
        }
      },
      { timeout: 60000 }
    )

    const totalDeleted =
      deletedProductsCount + deletedVariantsCount + deactivatedProductsCount

    let summaryMsg = ''
    if (updatedCount === 0 && createdCount === 0 && totalDeleted === 0) {
      summaryMsg = `Pemeriksaan selesai: Katalog website sudah 100% identik dengan Excel (${unchangedCount} unit sama).`
    } else {
      summaryMsg = `Sinkronisasi katalog berhasil:`
      const parts: string[] = []
      if (updatedCount > 0) parts.push(`${updatedCount} unit diperbarui`)
      if (createdCount > 0)
        parts.push(`${createdCount} produk/varian baru ditambahkan`)
      if (totalDeleted > 0)
        parts.push(
          `${totalDeleted} item dihapus dari website (mirroring Excel)`
        )
      if (unchangedCount > 0) parts.push(`${unchangedCount} unit sama`)
      if (skippedCount > 0) parts.push(`${skippedCount} baris dilewati`)
      summaryMsg += ' ' + parts.join(', ') + '.'
    }

    return NextResponse.json({
      success: true,
      message: summaryMsg,
      totalRows: rowsToProcess.length,
      updatedCount,
      unchangedCount,
      createdCount,
      deletedCount: totalDeleted,
      deletedProductsCount,
      deletedVariantsCount,
      deactivatedProductsCount,
      skippedCount,
      errors,
    })
  } catch (error: any) {
    console.error('Error importing Excel catalog:', error)
    return NextResponse.json(
      {
        error:
          'Terjadi kesalahan saat memproses file Excel: ' +
          (error?.message || 'Internal Server Error'),
      },
      { status: 500 }
    )
  }
}
