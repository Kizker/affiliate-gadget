import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import ExcelJS from 'exceljs'

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
      workbook.getWorksheet('Katalog Produk & SKU') || workbook.worksheets[0]

    if (!worksheet) {
      return NextResponse.json(
        {
          error:
            'Lembar kerja (worksheet) tidak ditemukan di dalam berkas Excel.',
        },
        { status: 400 }
      )
    }

    // Dynamic Column Discovery
    let skuCol = 1
    let variantIdCol = 2
    let productIdCol = 3
    let modelCol = 4
    let ramCol = 5
    let storageCol = 6
    let colorCol = 7
    let prodNameCol = 8
    let varNameCol = 9
    let brandCol = 10
    let conditionCol = 11
    let priceCol = 12
    let origPriceCol = 13
    let stockCol = 14
    let storeCol = 15
    let statusCol = 16
    let descCol = 17
    let chipsetCol = 18
    let displayCol = 19
    let cameraCol = 20
    let batteryCol = 21

    const headerRow = worksheet.getRow(1)
    headerRow.eachCell((cell, colNumber) => {
      const val = String(cell.value || '')
        .toLowerCase()
        .trim()
      if (val.includes('sku')) skuCol = colNumber
      else if (val.includes('id varian')) variantIdCol = colNumber
      else if (val.includes('id produk')) productIdCol = colNumber
      else if (val.includes('model') || val.includes('nama dasar'))
        modelCol = colNumber
      else if (val === 'ram' || val.includes('ram')) ramCol = colNumber
      else if (val.includes('penyimpanan') || val.includes('storage'))
        storageCol = colNumber
      else if (val.includes('warna') || val.includes('color'))
        colorCol = colNumber
      else if (val.includes('nama produk')) prodNameCol = colNumber
      else if (val.includes('nama varian')) varNameCol = colNumber
      else if (val.includes('merek') || val.includes('brand'))
        brandCol = colNumber
      else if (val.includes('kondisi')) conditionCol = colNumber
      else if (val.includes('harga jual')) priceCol = colNumber
      else if (val.includes('harga coret')) origPriceCol = colNumber
      else if (val.includes('stok')) stockCol = colNumber
      else if (val.includes('toko')) storeCol = colNumber
      else if (val.includes('status')) statusCol = colNumber
      else if (val.includes('deskripsi')) descCol = colNumber
      else if (val.includes('chipset')) chipsetCol = colNumber
      else if (val.includes('layar') || val.includes('display'))
        displayCol = colNumber
      else if (val.includes('kamera') || val.includes('camera'))
        cameraCol = colNumber
      else if (val.includes('baterai') || val.includes('battery'))
        batteryCol = colNumber
    })

    const parseCellString = (cell: ExcelJS.Cell): string => {
      if (cell.value === null || cell.value === undefined) return ''
      if (typeof cell.value === 'object') {
        const obj: any = cell.value
        return String(obj.result ?? obj.text ?? obj.richText?.[0]?.text ?? '')
      }
      return String(cell.value).trim()
    }

    const parseCellNumber = (cell: ExcelJS.Cell): number | null => {
      if (cell.value === null || cell.value === undefined) return null
      if (typeof cell.value === 'number') return cell.value
      const strVal = parseCellString(cell).replace(/[^0-9]/g, '')
      if (!strVal) return null
      const parsed = parseInt(strVal, 10)
      return isNaN(parsed) ? null : parsed
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

    const mapCondition = (rawCond: string): string => {
      const c = rawCond.toUpperCase().trim()
      if (c.includes('LIKE NEW') || c.includes('99%')) return 'LIKE_NEW'
      if (c.includes('MULUS') || c.includes('95%') || c.includes('98%'))
        return 'SECOND_MULUS'
      if (c.includes('GRADE A') || c.includes('100%')) return 'GRADE_A'
      if (c.includes('BARU') || c.includes('BNIB')) return 'BARU'
      return rawCond || 'LIKE_NEW'
    }

    const generateSmartSku = (
      productName: string,
      variantName: string,
      rowNumber: number
    ): string => {
      if (!productName) return `SKU-${Date.now().toString().slice(-6)}`
      const p = productName.trim()
      const v = (variantName || '').trim()

      const pWords = p.split(/\s+/)
      let modelCode = ''
      if (pWords.length >= 2) {
        const brandLower = pWords[0].toLowerCase()
        if (
          [
            'samsung',
            'oppo',
            'vivo',
            'asus',
            'xiaomi',
            'blackberry',
            'google',
            'realme',
            'infinix',
          ].includes(brandLower)
        ) {
          if (pWords[1].toLowerCase() === 'galaxy' && pWords.length >= 3) {
            modelCode = pWords[2]
            if (pWords[3]) modelCode += pWords[3][0].toUpperCase()
          } else if (pWords[1].toLowerCase() === 'find' && pWords.length >= 3) {
            modelCode = pWords[2]
            if (pWords[3]) modelCode += pWords[3][0].toUpperCase()
          } else if (pWords[1].toLowerCase() === 'rog' && pWords.length >= 3) {
            modelCode = 'ROG' + (pWords[3] || pWords[2])
            if (pWords.some((w) => w.toLowerCase() === 'pro')) modelCode += 'P'
          } else {
            modelCode = pWords[1]
          }
        } else if (brandLower === 'iphone') {
          modelCode = 'IP' + pWords[1]
          if (pWords.some((w) => w.toLowerCase() === 'pro')) modelCode += 'P'
          if (pWords.some((w) => w.toLowerCase() === 'max')) modelCode += 'M'
        } else {
          modelCode = pWords[1] || pWords[0].slice(0, 4)
        }
      } else {
        modelCode = p.slice(0, 4)
      }
      modelCode = modelCode.toUpperCase()

      // Storage
      let storageCode = ''
      const storageTarget = v.includes(' / ') ? v.split(' / ')[1] : v
      const storageMatch = storageTarget.match(/([0-9]+(?:GB|TB)?)/i)
      if (storageMatch) {
        storageCode = storageMatch[1].toUpperCase().replace('GB', '')
      } else {
        storageCode = String(rowNumber).padStart(3, '0')
      }

      // Color
      let colorCode = ''
      if (v.includes('-')) {
        const colorPart = v.split('-').slice(1).join('-').trim()
        const cWords = colorPart.split(/\s+/).filter(Boolean)
        if (cWords.length >= 2) {
          colorCode = (cWords[0][0] + cWords[1][0]).toUpperCase()
        } else if (cWords.length === 1) {
          colorCode = cWords[0].slice(0, 2).toUpperCase()
        }
      } else {
        colorCode = 'DF'
      }

      return `${modelCode}-${storageCode}-${colorCode}`
    }

    const rowsToProcess: Array<{
      rowNumber: number
      sku: string
      variantId: string
      productId: string
      model: string
      ram: string
      storage: string
      color: string
      productName: string
      variantName: string
      brand: string
      condition: string
      price: number
      originalPrice: number | null
      stock: number
      storeName: string
      isActive: boolean | null
      description: string
      chipset: string
      layar: string
      kamera: string
      baterai: string
    }> = []

    const errors: Array<{ row: number; sku?: string; reason: string }> = []

    worksheet.eachRow((row, rowNumber) => {
      // Skip header row
      if (rowNumber === 1) return

      const sku = parseCellString(row.getCell(skuCol))
      const variantId = parseCellString(row.getCell(variantIdCol))
      const productId = parseCellString(row.getCell(productIdCol))
      const model = parseCellString(row.getCell(modelCol))
      const ram = parseCellString(row.getCell(ramCol))
      const storage = parseCellString(row.getCell(storageCol))
      const color = parseCellString(row.getCell(colorCol))
      let productName = parseCellString(row.getCell(prodNameCol))
      let variantName = parseCellString(row.getCell(varNameCol))
      const brand = parseCellString(row.getCell(brandCol))
      const condition = parseCellString(row.getCell(conditionCol))
      const price = parseCellNumber(row.getCell(priceCol))
      const originalPrice = parseCellNumber(row.getCell(origPriceCol))
      const stock = parseCellNumber(row.getCell(stockCol))
      const storeName = parseCellString(row.getCell(storeCol))
      const statusRaw = parseCellString(row.getCell(statusCol)).toUpperCase()
      const description = parseCellString(row.getCell(descCol))
      const chipset = parseCellString(row.getCell(chipsetCol))
      const layar = parseCellString(row.getCell(displayCol))
      const kamera = parseCellString(row.getCell(cameraCol))
      const baterai = parseCellString(row.getCell(batteryCol))

      // Fallback auto-format if formula was not evaluated by spreadsheet editor
      const ramStorage =
        ram && storage
          ? `${ram}/${storage}`
          : ram
            ? ram
            : storage
              ? storage
              : ''
      if (!productName && model) {
        productName = `${model} ${ramStorage} ${color}`
          .replace(/\s+/g, ' ')
          .trim()
      }
      if (!variantName && (ram || storage || color)) {
        variantName = `${ramStorage} ${color}`.replace(/\s+/g, ' ').trim()
      }

      // If entire row is empty or formula produced empty values, skip
      if (
        !productName &&
        !model &&
        !sku &&
        !variantId &&
        !productId &&
        price === null &&
        stock === null
      ) {
        return
      }

      // If price or stock is missing on a row that has a product name or sku, validate
      if (
        !productName &&
        !model &&
        !variantId &&
        !productId &&
        (!sku || sku.startsWith('SKU-AUTO-'))
      ) {
        return // Blank template row
      }

      if (price === null || price < 0) {
        errors.push({
          row: rowNumber,
          sku: sku || productName || model || '-',
          reason: `Harga jual wajib berupa angka valid >= 0 (Ditemukan: "${parseCellString(row.getCell(priceCol))}").`,
        })
        return
      }

      if (stock === null || stock < 0) {
        errors.push({
          row: rowNumber,
          sku: sku || productName || model || '-',
          reason: `Stok wajib berupa angka bulat >= 0 (Ditemukan: "${parseCellString(row.getCell(stockCol))}").`,
        })
        return
      }

      let isActive: boolean | null = null
      if (
        statusRaw.includes('NON') ||
        statusRaw.includes('TIDAK') ||
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

      rowsToProcess.push({
        rowNumber,
        sku,
        variantId,
        productId,
        model,
        ram,
        storage,
        color,
        productName,
        variantName,
        brand,
        condition,
        price,
        originalPrice,
        stock: Math.floor(stock),
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
    let skippedCount = errors.length

    // Execute atomic bulk update and insert in Prisma transaction
    await prisma.$transaction(
      async (tx) => {
        const touchedProductIds = new Set<string>()

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

          // ─── 1. Match by Existing Variant ID ────────────────────────
          if (!isAutoOrEmpty(item.variantId)) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              include: { product: { include: { variants: true } } },
            })

            if (variant) {
              let hasChanges = false
              const variantUpdates: any = {}

              // Variant field comparisons
              if (Number(variant.price) !== Number(item.price)) {
                variantUpdates.price = item.price
                hasChanges = true
              }
              if (Number(variant.stock) !== Number(item.stock)) {
                variantUpdates.stock = item.stock
                hasChanges = true
              }
              const isGeneratedVariantSku =
                cleanSku === `SKU-${variant.id.slice(-8).toUpperCase()}`
              if (
                cleanSku &&
                cleanSku !== (variant.sku || '').trim() &&
                !(isGeneratedVariantSku && !variant.sku)
              ) {
                variantUpdates.sku = cleanSku
                hasChanges = true
              }
              if (
                item.variantName &&
                item.variantName.trim() !== (variant.name || '').trim()
              ) {
                variantUpdates.name = item.variantName.trim()
                hasChanges = true
              }
              if (item.ram && item.ram.trim() !== (variant.ram || '').trim()) {
                variantUpdates.ram = item.ram.trim()
                hasChanges = true
              }
              if (
                item.storage &&
                item.storage.trim() !== (variant.storage || '').trim()
              ) {
                variantUpdates.storage = item.storage.trim()
                hasChanges = true
              }
              if (
                item.color &&
                item.color.trim() !== (variant.color || '').trim()
              ) {
                variantUpdates.color = item.color.trim()
                hasChanges = true
              }

              // Parent Product field comparisons
              const prodUpdates: any = {}
              const prod = variant.product
              const hasMultipleVariants = (prod.variants?.length ?? 1) > 1

              const currentProdModel = (
                prod.model ||
                prod.name
                  .replace(/\s+[0-9]+GB\/[0-9]+(?:GB|TB)?.*$/i, '')
                  .replace(/\s+[0-9]+(?:GB|TB).*$/i, '')
              ).trim()

              if (item.model && item.model.trim() !== currentProdModel) {
                prodUpdates.model = item.model.trim()
                hasChanges = true
              }

              // Product name comparison:
              // For single-variant products, prod.name reflects the full variant title
              // For multi-variant products, prod.name reflects the base model
              if (!hasMultipleVariants) {
                if (
                  item.productName &&
                  item.productName.trim() !== (prod.name || '').trim()
                ) {
                  prodUpdates.name = item.productName.trim()
                  hasChanges = true
                }
              } else if (item.model && item.model.trim() !== currentProdModel) {
                prodUpdates.name = item.model.trim()
                hasChanges = true
              }

              if (
                item.brand &&
                item.brand.trim() !== (prod.brand || '').trim()
              ) {
                prodUpdates.brand = item.brand.trim()
                hasChanges = true
              }
              if (item.condition) {
                const targetCond = mapCondition(item.condition)
                if (targetCond !== prod.condition) {
                  prodUpdates.condition = targetCond
                  hasChanges = true
                }
              }
              if (
                item.description &&
                item.description.trim() !== (prod.description || '').trim()
              ) {
                prodUpdates.description = item.description.trim()
                hasChanges = true
              }
              if (
                item.originalPrice !== null &&
                Number(item.originalPrice) !== Number(prod.originalPrice || 0)
              ) {
                prodUpdates.originalPrice = item.originalPrice
                hasChanges = true
              }
              if (item.isActive !== null && item.isActive !== prod.isActive) {
                prodUpdates.isActive = item.isActive
                hasChanges = true
              }
              if (item.storeName) {
                const storeId = findStoreId(item.storeName)
                if (storeId && storeId !== prod.storeId) {
                  prodUpdates.storeId = storeId
                  hasChanges = true
                }
              }

              // Technical specs comparison
              if (item.chipset || item.layar || item.kamera || item.baterai) {
                const currentSpecs = (prod.specs as any) || {}
                let specsChanged = false
                const nextSpecs = { ...currentSpecs }

                if (
                  item.chipset &&
                  item.chipset.trim() !== (currentSpecs.Chipset || '').trim()
                ) {
                  nextSpecs.Chipset = item.chipset.trim()
                  specsChanged = true
                }
                if (
                  item.layar &&
                  item.layar.trim() !== (currentSpecs.Layar || '').trim()
                ) {
                  nextSpecs.Layar = item.layar.trim()
                  specsChanged = true
                }
                if (
                  item.kamera &&
                  item.kamera.trim() !== (currentSpecs.Kamera || '').trim()
                ) {
                  nextSpecs.Kamera = item.kamera.trim()
                  specsChanged = true
                }
                if (
                  item.baterai &&
                  item.baterai.trim() !== (currentSpecs.Baterai || '').trim()
                ) {
                  nextSpecs.Baterai = item.baterai.trim()
                  specsChanged = true
                }

                if (specsChanged) {
                  prodUpdates.specs = nextSpecs
                  hasChanges = true
                }
              }

              if (hasChanges) {
                if (Object.keys(variantUpdates).length > 0) {
                  await tx.productVariant.update({
                    where: { id: variant.id },
                    data: variantUpdates,
                  })
                }
                if (Object.keys(prodUpdates).length > 0) {
                  await tx.product.update({
                    where: { id: prod.id },
                    data: prodUpdates,
                  })
                }
                touchedProductIds.add(variant.productId)
                updatedCount++
              } else {
                unchangedCount++
              }

              processed = true
            }
          }

          // ─── 2. Match by Existing SKU ───────────────────────────────
          if (!processed && cleanSku) {
            const variant = await tx.productVariant.findFirst({
              where: { sku: cleanSku },
              include: { product: { include: { variants: true } } },
            })

            if (variant) {
              let hasChanges = false
              const variantUpdates: any = {}

              if (Number(variant.price) !== Number(item.price)) {
                variantUpdates.price = item.price
                hasChanges = true
              }
              if (Number(variant.stock) !== Number(item.stock)) {
                variantUpdates.stock = item.stock
                hasChanges = true
              }
              if (
                item.variantName &&
                item.variantName.trim() !== (variant.name || '').trim()
              ) {
                variantUpdates.name = item.variantName.trim()
                hasChanges = true
              }
              if (item.ram && item.ram.trim() !== (variant.ram || '').trim()) {
                variantUpdates.ram = item.ram.trim()
                hasChanges = true
              }
              if (
                item.storage &&
                item.storage.trim() !== (variant.storage || '').trim()
              ) {
                variantUpdates.storage = item.storage.trim()
                hasChanges = true
              }
              if (
                item.color &&
                item.color.trim() !== (variant.color || '').trim()
              ) {
                variantUpdates.color = item.color.trim()
                hasChanges = true
              }

              const prodUpdates: any = {}
              const prod = variant.product
              const hasMultipleVariants = (prod.variants?.length ?? 1) > 1

              const currentProdModel = (
                prod.model ||
                prod.name
                  .replace(/\s+[0-9]+GB\/[0-9]+(?:GB|TB)?.*$/i, '')
                  .replace(/\s+[0-9]+(?:GB|TB).*$/i, '')
              ).trim()

              if (item.model && item.model.trim() !== currentProdModel) {
                prodUpdates.model = item.model.trim()
                hasChanges = true
              }

              if (!hasMultipleVariants) {
                if (
                  item.productName &&
                  item.productName.trim() !== (prod.name || '').trim()
                ) {
                  prodUpdates.name = item.productName.trim()
                  hasChanges = true
                }
              } else if (item.model && item.model.trim() !== currentProdModel) {
                prodUpdates.name = item.model.trim()
                hasChanges = true
              }

              if (
                item.brand &&
                item.brand.trim() !== (prod.brand || '').trim()
              ) {
                prodUpdates.brand = item.brand.trim()
                hasChanges = true
              }
              if (item.condition) {
                const targetCond = mapCondition(item.condition)
                if (targetCond !== prod.condition) {
                  prodUpdates.condition = targetCond
                  hasChanges = true
                }
              }
              if (
                item.description &&
                item.description.trim() !== (prod.description || '').trim()
              ) {
                prodUpdates.description = item.description.trim()
                hasChanges = true
              }
              if (
                item.originalPrice !== null &&
                Number(item.originalPrice) !== Number(prod.originalPrice || 0)
              ) {
                prodUpdates.originalPrice = item.originalPrice
                hasChanges = true
              }
              if (item.isActive !== null && item.isActive !== prod.isActive) {
                prodUpdates.isActive = item.isActive
                hasChanges = true
              }
              if (item.storeName) {
                const storeId = findStoreId(item.storeName)
                if (storeId && storeId !== prod.storeId) {
                  prodUpdates.storeId = storeId
                  hasChanges = true
                }
              }

              if (item.chipset || item.layar || item.kamera || item.baterai) {
                const currentSpecs = (prod.specs as any) || {}
                let specsChanged = false
                const nextSpecs = { ...currentSpecs }

                if (
                  item.chipset &&
                  item.chipset.trim() !== (currentSpecs.Chipset || '').trim()
                ) {
                  nextSpecs.Chipset = item.chipset.trim()
                  specsChanged = true
                }
                if (
                  item.layar &&
                  item.layar.trim() !== (currentSpecs.Layar || '').trim()
                ) {
                  nextSpecs.Layar = item.layar.trim()
                  specsChanged = true
                }
                if (
                  item.kamera &&
                  item.kamera.trim() !== (currentSpecs.Kamera || '').trim()
                ) {
                  nextSpecs.Kamera = item.kamera.trim()
                  specsChanged = true
                }
                if (
                  item.baterai &&
                  item.baterai.trim() !== (currentSpecs.Baterai || '').trim()
                ) {
                  nextSpecs.Baterai = item.baterai.trim()
                  specsChanged = true
                }

                if (specsChanged) {
                  prodUpdates.specs = nextSpecs
                  hasChanges = true
                }
              }

              if (hasChanges) {
                if (Object.keys(variantUpdates).length > 0) {
                  await tx.productVariant.update({
                    where: { id: variant.id },
                    data: variantUpdates,
                  })
                }
                if (Object.keys(prodUpdates).length > 0) {
                  await tx.product.update({
                    where: { id: prod.id },
                    data: prodUpdates,
                  })
                }
                touchedProductIds.add(variant.productId)
                updatedCount++
              } else {
                unchangedCount++
              }

              processed = true
            }
          }

          // ─── 3. Match by Existing Product ID ────────────────────────
          if (!processed && !isAutoOrEmpty(item.productId)) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              include: { variants: true },
            })

            if (product) {
              const storeId = findStoreId(item.storeName)
              let hasChanges = false
              const prodUpdates: any = {}

              const hasMultipleVariants = (product.variants?.length ?? 1) > 1
              const currentProdModel = (
                product.model ||
                product.name
                  .replace(/\s+[0-9]+GB\/[0-9]+(?:GB|TB)?.*$/i, '')
                  .replace(/\s+[0-9]+(?:GB|TB).*$/i, '')
              ).trim()

              if (item.model && item.model.trim() !== currentProdModel) {
                prodUpdates.model = item.model.trim()
                hasChanges = true
              }

              if (!hasMultipleVariants) {
                if (Number(product.price) !== Number(item.price)) {
                  prodUpdates.price = item.price
                  hasChanges = true
                }
                if (
                  item.productName &&
                  item.productName.trim() !== (product.name || '').trim()
                ) {
                  prodUpdates.name = item.productName.trim()
                  hasChanges = true
                }
              } else if (item.model && item.model.trim() !== currentProdModel) {
                prodUpdates.name = item.model.trim()
                hasChanges = true
              }

              if (
                item.brand &&
                item.brand.trim() !== (product.brand || '').trim()
              ) {
                prodUpdates.brand = item.brand.trim()
                hasChanges = true
              }
              if (item.condition) {
                const targetCond = mapCondition(item.condition)
                if (targetCond !== product.condition) {
                  prodUpdates.condition = targetCond
                  hasChanges = true
                }
              }
              if (
                item.description &&
                item.description.trim() !== (product.description || '').trim()
              ) {
                prodUpdates.description = item.description.trim()
                hasChanges = true
              }
              if (
                item.originalPrice !== null &&
                Number(item.originalPrice) !==
                  Number(product.originalPrice || 0)
              ) {
                prodUpdates.originalPrice = item.originalPrice
                hasChanges = true
              }
              if (
                item.isActive !== null &&
                item.isActive !== product.isActive
              ) {
                prodUpdates.isActive = item.isActive
                hasChanges = true
              }
              if (storeId && storeId !== product.storeId) {
                prodUpdates.storeId = storeId
                hasChanges = true
              }

              if (item.chipset || item.layar || item.kamera || item.baterai) {
                const currentSpecs = (product.specs as any) || {}
                let specsChanged = false
                const nextSpecs = { ...currentSpecs }

                if (
                  item.chipset &&
                  item.chipset.trim() !== (currentSpecs.Chipset || '').trim()
                ) {
                  nextSpecs.Chipset = item.chipset.trim()
                  specsChanged = true
                }
                if (
                  item.layar &&
                  item.layar.trim() !== (currentSpecs.Layar || '').trim()
                ) {
                  nextSpecs.Layar = item.layar.trim()
                  specsChanged = true
                }
                if (
                  item.kamera &&
                  item.kamera.trim() !== (currentSpecs.Kamera || '').trim()
                ) {
                  nextSpecs.Kamera = item.kamera.trim()
                  specsChanged = true
                }
                if (
                  item.baterai &&
                  item.baterai.trim() !== (currentSpecs.Baterai || '').trim()
                ) {
                  nextSpecs.Baterai = item.baterai.trim()
                  specsChanged = true
                }

                if (specsChanged) {
                  prodUpdates.specs = nextSpecs
                  hasChanges = true
                }
              }

              // If product has no variants, treat as simple product
              if (!product.variants || product.variants.length === 0) {
                if (Number(product.stock) !== Number(item.stock)) {
                  prodUpdates.stock = item.stock
                  hasChanges = true
                }
                if (hasChanges) {
                  await tx.product.update({
                    where: { id: product.id },
                    data: prodUpdates,
                  })
                  updatedCount++
                } else {
                  unchangedCount++
                }
                processed = true
              } else {
                // If it has variants and user provided a new variant name, create variant!
                if (
                  item.variantName &&
                  item.variantName !== 'Standar' &&
                  !product.variants.some(
                    (v) =>
                      v.name.toLowerCase() === item.variantName.toLowerCase()
                  )
                ) {
                  const newSku =
                    cleanSku ||
                    generateSmartSku(
                      item.productName || item.model,
                      item.variantName,
                      item.rowNumber
                    )
                  await tx.productVariant.create({
                    data: {
                      productId: product.id,
                      name: item.variantName,
                      ram: item.ram || null,
                      storage: item.storage || null,
                      color: item.color || null,
                      price: item.price,
                      stock: item.stock,
                      sku: newSku,
                    },
                  })
                  if (hasChanges) {
                    await tx.product.update({
                      where: { id: product.id },
                      data: prodUpdates,
                    })
                  }
                  touchedProductIds.add(product.id)
                  createdCount++
                  processed = true
                } else {
                  if (hasChanges) {
                    await tx.product.update({
                      where: { id: product.id },
                      data: prodUpdates,
                    })
                    touchedProductIds.add(product.id)
                    updatedCount++
                  } else {
                    unchangedCount++
                  }
                  processed = true
                }
              }
            }
          }

          // ─── 4. NEW PRODUCT / VARIANT (Auto-Creation) ──────────────
          if (!processed) {
            // Check if user provided a product name or model
            const targetName =
              item.productName ||
              (item.model
                ? `${item.model} ${item.ram}/${item.storage} ${item.color}`.trim()
                : 'Gadget Baru')

            const existingByName = await tx.product.findFirst({
              where: { name: { equals: targetName, mode: 'insensitive' } },
              include: { variants: true },
            })

            const storeId = findStoreId(item.storeName)
            const finalSku =
              cleanSku ||
              generateSmartSku(targetName, item.variantName, item.rowNumber)

            if (existingByName) {
              // Add new variant to existing product
              await tx.productVariant.create({
                data: {
                  productId: existingByName.id,
                  name:
                    item.variantName ||
                    `Varian ${existingByName.variants.length + 1}`,
                  ram: item.ram || null,
                  storage: item.storage || null,
                  color: item.color || null,
                  price: item.price,
                  stock: item.stock,
                  sku: finalSku,
                },
              })
              touchedProductIds.add(existingByName.id)
              createdCount++
              processed = true
            } else {
              // Create brand new Product AND its ProductVariant
              const newSpecs: any = {}
              if (item.chipset) newSpecs.Chipset = item.chipset
              if (item.layar) newSpecs.Layar = item.layar
              if (item.kamera) newSpecs.Kamera = item.kamera
              if (item.baterai) newSpecs.Baterai = item.baterai

              const newProduct = await tx.product.create({
                data: {
                  name: targetName,
                  model: item.model || null,
                  brand: item.brand || 'Smartphone',
                  condition: mapCondition(item.condition),
                  category: 'Smartphone',
                  price: item.price,
                  originalPrice: item.originalPrice,
                  stock: item.stock,
                  storeId: storeId,
                  isActive: item.isActive ?? true,
                  description: item.description || null,
                  specs: Object.keys(newSpecs).length > 0 ? newSpecs : null,
                  images: [
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
                  ],
                },
              })

              await tx.productVariant.create({
                data: {
                  productId: newProduct.id,
                  name: item.variantName || 'Standar',
                  ram: item.ram || null,
                  storage: item.storage || null,
                  color: item.color || null,
                  price: item.price,
                  stock: item.stock,
                  sku: finalSku,
                },
              })

              touchedProductIds.add(newProduct.id)
              createdCount++
              processed = true
            }
          }

          if (!processed) {
            skippedCount++
            errors.push({
              row: item.rowNumber,
              sku: item.sku || item.productName || '-',
              reason: 'Gagal memproses baris produk ke database.',
            })
          }
        }

        // ─── 5. Synchronize Total Stock & Display Price for Touched Products ────
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
                stock: totalStock,
                ...(minPrice > 0 ? { price: minPrice } : {}),
              },
            })
          }
        }
      },
      { timeout: 45000 }
    )

    let summaryMsg = ''
    if (updatedCount === 0 && createdCount === 0) {
      summaryMsg = `Pemeriksaan selesai: Tidak ada perubahan data (${unchangedCount} unit sama dengan database).`
    } else {
      summaryMsg = `Pembaruan selesai: ${updatedCount} unit diperbarui`
      if (unchangedCount > 0) {
        summaryMsg += ` (${unchangedCount} unit tidak ada perubahan)`
      }
      if (createdCount > 0) {
        summaryMsg += `, ${createdCount} produk/varian baru berhasil ditambahkan`
      }
      summaryMsg += '.'
    }

    return NextResponse.json({
      success: true,
      message: summaryMsg,
      totalRows: rowsToProcess.length,
      updatedCount,
      unchangedCount,
      createdCount,
      skippedCount,
      errors: errors.slice(0, 50),
    })
  } catch (error: any) {
    console.error('Error importing Excel catalog update:', error)
    return NextResponse.json(
      {
        error:
          'Gagal memproses pembaruan massal: ' +
          (error?.message || 'Terjadi kesalahan server'),
      },
      { status: 500 }
    )
  }
}
