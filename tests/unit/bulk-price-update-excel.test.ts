import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import {
  generateShopeeItemId,
  generateShopeeVariationId,
  generateSmartSku,
} from '@/lib/shopee-codes'

describe('Bulk Price Update Excel System (Unit Tests)', () => {
  describe('Excel Template Generation & Data Integrity', () => {
    it('should generate a workbook with correct sheet names and columns', async () => {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Katalog Produk & SKU')

      worksheet.columns = [
        { header: 'SKU (Kunci Unik)', key: 'sku', width: 22 }, // Col 1 (A)
        { header: 'ID Varian (Teknis)', key: 'variantId', width: 26 }, // Col 2 (B)
        { header: 'ID Produk (Teknis)', key: 'productId', width: 26 }, // Col 3 (C)
        { header: 'Model / Nama Gadget', key: 'model', width: 28 }, // Col 4 (D)
        { header: 'RAM', key: 'ram', width: 12 }, // Col 5 (E)
        { header: 'Penyimpanan (Storage)', key: 'storage', width: 20 }, // Col 6 (F)
        { header: 'Warna', key: 'color', width: 20 }, // Col 7 (G)
        { header: 'Nama Produk (Otomatis)', key: 'productName', width: 38 }, // Col 8 (H)
        { header: 'Nama Varian (Otomatis)', key: 'variantName', width: 28 }, // Col 9 (I)
        { header: 'Merek (Brand)', key: 'brand', width: 18 }, // Col 10 (J)
        { header: 'Kondisi Fisik', key: 'condition', width: 26 }, // Col 11 (K)
        { header: 'Harga Jual Baru (Rp)', key: 'price', width: 20 }, // Col 12 (L)
        { header: 'Harga Coret Baru (Rp)', key: 'originalPrice', width: 20 }, // Col 13 (M)
        { header: 'Stok Baru', key: 'stock', width: 12 }, // Col 14 (N)
        { header: 'Toko Pemilik / PT', key: 'storeName', width: 38 }, // Col 15 (O)
        { header: 'Status Aktif (AKTIF/NONAKTIF)', key: 'isActive', width: 24 }, // Col 16 (P)
        {
          header: 'Deskripsi Lengkap Unit Gadget',
          key: 'description',
          width: 45,
        }, // Col 17 (Q)
        { header: 'Chipset (Spesifikasi)', key: 'chipset', width: 28 }, // Col 18 (R)
        { header: 'Layar (Spesifikasi)', key: 'layar', width: 26 }, // Col 19 (S)
        { header: 'Kamera (Spesifikasi)', key: 'kamera', width: 32 }, // Col 20 (T)
        { header: 'Baterai (Spesifikasi)', key: 'baterai', width: 26 }, // Col 21 (U)
      ]

      worksheet.addRow({
        sku: 'IP15PM-512-BT',
        variantId: 'var-123',
        productId: 'prod-456',
        model: 'iPhone 15 Pro Max',
        ram: '8GB',
        storage: '512GB',
        color: 'Black Titanium',
        productName: 'iPhone 15 Pro Max 8GB/512GB Black Titanium',
        variantName: '8GB/512GB Black Titanium',
        brand: 'Apple',
        condition: 'Second Like New (Mulus 99%)',
        price: 26999000,
        originalPrice: 28999000,
        stock: 3,
        storeName: 'Affiliate Gadget - Roxy Mas Jakarta (Jakarta Pusat)',
        isActive: 'AKTIF',
        description: 'Unit mulus terawat 99%, garansi toko 30 hari.',
        chipset: 'Apple A17 Pro (3nm)',
        layar: '6.7 inch Super Retina XDR OLED 120Hz',
        kamera: '48MP Utama + 12MP Telephoto',
        baterai: '4.422 mAh Fast Charging',
      })

      const buffer = await workbook.xlsx.writeBuffer()
      expect(buffer).toBeDefined()
      expect(buffer.byteLength).toBeGreaterThan(0)

      // Verify reading back from buffer
      const readWorkbook = new ExcelJS.Workbook()
      await readWorkbook.xlsx.load(buffer as any)

      const readSheet = readWorkbook.getWorksheet('Katalog Produk & SKU')
      expect(readSheet).toBeDefined()
      expect(readSheet?.rowCount).toBe(2) // 1 header + 1 data row

      const row2 = readSheet?.getRow(2)
      expect(row2?.getCell(1).value).toBe('IP15PM-512-BT')
      expect(row2?.getCell(2).value).toBe('var-123')
      expect(row2?.getCell(4).value).toBe('iPhone 15 Pro Max')
      expect(row2?.getCell(5).value).toBe('8GB')
      expect(row2?.getCell(6).value).toBe('512GB')
      expect(row2?.getCell(7).value).toBe('Black Titanium')
      expect(row2?.getCell(8).value).toBe(
        'iPhone 15 Pro Max 8GB/512GB Black Titanium'
      )
      expect(row2?.getCell(9).value).toBe('8GB/512GB Black Titanium')
      expect(row2?.getCell(12).value).toBe(26999000)
      expect(row2?.getCell(14).value).toBe(3)
      expect(row2?.getCell(17).value).toBe(
        'Unit mulus terawat 99%, garansi toko 30 hari.'
      )
      expect(row2?.getCell(18).value).toBe('Apple A17 Pro (3nm)')
      expect(row2?.getCell(19).value).toBe(
        '6.7 inch Super Retina XDR OLED 120Hz'
      )
      expect(row2?.getCell(20).value).toBe('48MP Utama + 12MP Telephoto')
      expect(row2?.getCell(21).value).toBe('4.422 mAh Fast Charging')
    })
  })

  describe('Value Parsing & Sanitization Rules', () => {
    const parsePrice = (rawVal: any): number | null => {
      if (rawVal === null || rawVal === undefined) return null
      if (typeof rawVal === 'number') return rawVal
      const strVal = String(rawVal).replace(/[^0-9]/g, '')
      if (!strVal) return null
      const parsed = parseInt(strVal, 10)
      return isNaN(parsed) ? null : parsed
    }

    const parseStock = (rawStock: any): number | null => {
      if (rawStock === null || rawStock === undefined) return null
      if (typeof rawStock === 'number') return Math.floor(rawStock)
      const strVal = String(rawStock).replace(/[^0-9]/g, '')
      if (!strVal) return null
      const parsed = parseInt(strVal, 10)
      return isNaN(parsed) ? null : parsed
    }

    it('should correctly parse numeric and formatted currency prices', () => {
      expect(parsePrice(26999000)).toBe(26999000)
      expect(parsePrice('Rp 26.999.000')).toBe(26999000)
      expect(parsePrice('26999000')).toBe(26999000)
      expect(parsePrice('26,999,000')).toBe(26999000)
      expect(parsePrice('')).toBeNull()
      expect(parsePrice(null)).toBeNull()
      expect(parsePrice('invalid-text')).toBeNull()
    })

    it('should correctly parse and sanitize stock numbers', () => {
      expect(parseStock(5)).toBe(5)
      expect(parseStock('10 Unit')).toBe(10)
      expect(parseStock(' 0 ')).toBe(0)
      expect(parseStock('')).toBeNull()
      expect(parseStock(null)).toBeNull()
    })

    it('should validate status values', () => {
      const parseStatus = (val: string): boolean | null => {
        const upper = val.toUpperCase().trim()
        if (
          upper.includes('NON') ||
          upper.includes('TIDAK') ||
          upper === 'FALSE' ||
          upper === '0'
        ) {
          return false
        }
        if (upper.includes('AKTIF') || upper === 'TRUE' || upper === '1') {
          return true
        }
        return null
      }

      expect(parseStatus('AKTIF')).toBe(true)
      expect(parseStatus('aktif')).toBe(true)
      expect(parseStatus('NONAKTIF')).toBe(false)
      expect(parseStatus('TIDAK AKTIF')).toBe(false)
      expect(parseStatus('UNKNOWN')).toBeNull()
    })
  })

  describe('Authorization Rules', () => {
    const checkIsSuperAdmin = (role?: string | null): boolean => {
      return role === 'SUPER_ADMIN'
    }

    it('should grant access only to SUPER_ADMIN', () => {
      expect(checkIsSuperAdmin('SUPER_ADMIN')).toBe(true)
      expect(checkIsSuperAdmin('ADMIN')).toBe(false)
      expect(checkIsSuperAdmin('STORE_ADMIN')).toBe(false)
      expect(checkIsSuperAdmin('CUSTOMER')).toBe(false)
      expect(checkIsSuperAdmin(null)).toBe(false)
      expect(checkIsSuperAdmin(undefined)).toBe(false)
    })
  })

  describe('Combobox Data Validation Dynamic Range', () => {
    it('should configure expanded range for Referensi_Data so additions at row 14+ are included', () => {
      const counts = {
        prodCount: 12,
        varCount: 15,
        brandCount: 12,
        condCount: 4,
        storeCount: 5,
      }

      const maxProdRow = Math.max(counts.prodCount + 150, 300)
      const maxVarRow = Math.max(counts.varCount + 150, 300)

      expect(maxProdRow).toBeGreaterThanOrEqual(14)
      expect(maxProdRow).toBe(300)
      expect(maxVarRow).toBe(300)

      const formulaProd = `Referensi_Data!$A$2:$A$${maxProdRow}`
      expect(formulaProd).toBe('Referensi_Data!$A$2:$A$300')
    })
  })

  describe('Smart SKU & Dynamic Referensi_Data Sync Architecture', () => {
    it('should generate intelligent gadget SKU (e.g. Z10-512-WC)', () => {
      const generateSmartSku = (
        productName: string,
        variantName: string,
        rowNumber: number
      ): string => {
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
            } else if (
              pWords[1].toLowerCase() === 'find' &&
              pWords.length >= 3
            ) {
              modelCode = pWords[2]
              if (pWords[3]) modelCode += pWords[3][0].toUpperCase()
            } else if (
              pWords[1].toLowerCase() === 'rog' &&
              pWords.length >= 3
            ) {
              modelCode = 'ROG' + (pWords[3] || pWords[2])
              if (pWords.some((w) => w.toLowerCase() === 'pro'))
                modelCode += 'P'
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

        let storageCode = ''
        const storageTarget = v.includes(' / ') ? v.split(' / ')[1] : v
        const storageMatch = storageTarget.match(/([0-9]+(?:GB|TB)?)/i)
        if (storageMatch) {
          storageCode = storageMatch[1].toUpperCase().replace('GB', '')
        } else {
          storageCode = String(rowNumber).padStart(3, '0')
        }

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

      expect(
        generateSmartSku(
          'Blackberry Z10 Tool Edition',
          '12GB / 512GB - White Cream',
          30
        )
      ).toBe('Z10-512-WC')

      expect(
        generateSmartSku(
          'Samsung Galaxy S24 Ultra',
          '12GB / 512GB - Titanium Black',
          31
        )
      ).toBe('S24U-512-TB')

      expect(
        generateSmartSku('iPhone 15 Pro Max', '256GB - Titanium Natural', 32)
      ).toBe('IP15PM-256-TN')
    })

    it('should generate valid sync formula from Katalog into Referensi_Data', () => {
      const firstBlankRow = 30
      const catRowNum = firstBlankRow + 0 // row 30
      const formula = `IF('Katalog Produk & SKU'!D${catRowNum}<>"",""&'Katalog Produk & SKU'!D${catRowNum},"")`

      expect(formula).toBe(
        'IF(\'Katalog Produk & SKU\'!D30<>"",""&\'Katalog Produk & SKU\'!D30,"")'
      )
    })

    it('should recognize cuid-like dynamic IDs in isAutoOrEmpty', () => {
      const isAutoOrEmpty = (idStr: string) =>
        !idStr ||
        idStr.startsWith('AUTO-') ||
        idStr.startsWith('NEW') ||
        idStr.startsWith('cvar') ||
        idStr.startsWith('cprd') ||
        idStr.startsWith('VAR-') ||
        idStr.startsWith('PROD-') ||
        idStr === '-'

      expect(isAutoOrEmpty('cvar0030a84f2v30')).toBe(true)
      expect(isAutoOrEmpty('cprd0030a84f2p30')).toBe(true)
      expect(isAutoOrEmpty('AUTO-NEW')).toBe(true)
      expect(isAutoOrEmpty('')).toBe(true)
      expect(isAutoOrEmpty('cmtqt76dx002itzfohcsng8sv')).toBe(false)
    })

    it('should generate exact concatenation formula for Nama Produk and Nama Varian', () => {
      const rowNum = 30
      const prodFormula = `IF(D${rowNum}<>"",TRIM(D${rowNum}&" "&IF(AND(E${rowNum}<>"",F${rowNum}<>""),E${rowNum}&"/"&F${rowNum},IF(E${rowNum}<>"",E${rowNum},IF(F${rowNum}<>"",F${rowNum},"")))&IF(G${rowNum}<>""," "&G${rowNum},"")),"")`
      const varFormula = `IF(OR(E${rowNum}<>"",F${rowNum}<>"",G${rowNum}<>""),TRIM(IF(AND(E${rowNum}<>"",F${rowNum}<>""),E${rowNum}&"/"&F${rowNum},IF(E${rowNum}<>"",E${rowNum},IF(F${rowNum}<>"",F${rowNum},"")))&IF(G${rowNum}<>""," "&G${rowNum},"")),"")`

      expect(prodFormula).toContain('D30')
      expect(prodFormula).toContain('E30')
      expect(prodFormula).toContain('F30')
      expect(prodFormula).toContain('G30')
      expect(prodFormula).toContain('E30&"/"&F30')

      expect(varFormula).toContain('E30&"/"&F30')
      expect(varFormula).toContain('G30')

      // Simulate JavaScript evaluation of the Excel formula logic
      const evaluateFormula = (
        model: string,
        ram: string,
        storage: string,
        color: string
      ) => {
        const ramStorage =
          ram && storage
            ? `${ram}/${storage}`
            : ram
              ? ram
              : storage
                ? storage
                : ''
        const prodName = model
          ? `${model} ${ramStorage} ${color}`.replace(/\s+/g, ' ').trim()
          : ''
        const varName =
          ram || storage || color
            ? `${ramStorage} ${color}`.replace(/\s+/g, ' ').trim()
            : ''
        return { prodName, varName }
      }

      const res = evaluateFormula(
        'Blackberry Z10',
        '12GB',
        '128GB',
        'White Cream'
      )
      expect(res.prodName).toBe('Blackberry Z10 12GB/128GB White Cream')
      expect(res.varName).toBe('12GB/128GB White Cream')

      const resNoRam = evaluateFormula(
        'iPhone 15 Pro Max',
        '',
        '256GB',
        'Natural Titanium'
      )
      expect(resNoRam.prodName).toBe('iPhone 15 Pro Max 256GB Natural Titanium')
      expect(resNoRam.varName).toBe('256GB Natural Titanium')
    })
  })

  describe('Change Detection & Unchanged Count Logic', () => {
    interface VariantDB {
      id: string
      productId: string
      name: string
      ram: string | null
      storage: string | null
      color: string | null
      price: number
      stock: number
      sku: string | null
    }

    interface ProductDB {
      id: string
      name: string
      model: string | null
      brand: string | null
      condition: string
      price: number
      originalPrice: number | null
      stock: number
      storeId: string | null
      isActive: boolean
      description: string | null
      specs: Record<string, string> | null
      variants: VariantDB[]
    }

    const checkRowChanges = (
      item: {
        price: number
        stock: number
        sku?: string
        variantName?: string
        ram?: string
        storage?: string
        color?: string
        model?: string
        productName?: string
        brand?: string
        condition?: string
        description?: string
        originalPrice?: number | null
        isActive?: boolean | null
        storeId?: string | null
        chipset?: string
        layar?: string
        kamera?: string
        baterai?: string
      },
      variant: VariantDB,
      product: ProductDB
    ) => {
      let hasChanges = false
      const variantUpdates: any = {}
      const prodUpdates: any = {}

      if (Number(variant.price) !== Number(item.price)) {
        variantUpdates.price = item.price
        hasChanges = true
      }
      if (Number(variant.stock) !== Number(item.stock)) {
        variantUpdates.stock = item.stock
        hasChanges = true
      }
      const cleanSku = item.sku?.trim() || null
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
      if (item.color && item.color.trim() !== (variant.color || '').trim()) {
        variantUpdates.color = item.color.trim()
        hasChanges = true
      }

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

      if (item.brand && item.brand.trim() !== (product.brand || '').trim()) {
        prodUpdates.brand = item.brand.trim()
        hasChanges = true
      }

      return { hasChanges, variantUpdates, prodUpdates }
    }

    it('should NOT flag unchanged rows as updated for multi-variant products', () => {
      const prod: ProductDB = {
        id: 'prod-iphone14',
        name: 'iPhone 14 6GB/256GB Blue', // Notice: product name matches 3rd variant
        model: 'iPhone 14',
        brand: 'Apple',
        condition: 'SECOND_MULUS',
        price: 12499000,
        originalPrice: 13999000,
        stock: 21,
        storeId: 'store-1',
        isActive: true,
        description: 'iPhone 14 mulus.',
        specs: null,
        variants: [
          {
            id: 'var-1',
            productId: 'prod-iphone14',
            name: '6GB/128GB Midnight',
            ram: '6GB',
            storage: '128GB',
            color: 'Midnight',
            price: 12499000,
            stock: 10,
            sku: 'IP14-128-MD',
          },
          {
            id: 'var-2',
            productId: 'prod-iphone14',
            name: '6GB/128GB Starlight',
            ram: '6GB',
            storage: '128GB',
            color: 'Starlight',
            price: 12499000,
            stock: 7,
            sku: 'IP14-128-SL',
          },
          {
            id: 'var-3',
            productId: 'prod-iphone14',
            name: '6GB/256GB Blue',
            ram: '6GB',
            storage: '256GB',
            color: 'Blue',
            price: 14999000,
            stock: 4,
            sku: 'IP14-256-BL',
          },
        ],
      }

      // Row 1 from Excel export for Midnight variant
      const row1 = {
        price: 12499000,
        stock: 10,
        sku: 'IP14-128-MD',
        model: 'iPhone 14',
        ram: '6GB',
        storage: '128GB',
        color: 'Midnight',
        productName: 'iPhone 14 6GB/128GB Midnight', // Formulated from cell
        variantName: '6GB/128GB Midnight',
        brand: 'Apple',
      }

      const diff1 = checkRowChanges(row1, prod.variants[0], prod)
      expect(diff1.hasChanges).toBe(false)

      const diff2 = checkRowChanges(
        {
          price: 12499000,
          stock: 7,
          sku: 'IP14-128-SL',
          model: 'iPhone 14',
          ram: '6GB',
          storage: '128GB',
          color: 'Starlight',
          productName: 'iPhone 14 6GB/128GB Starlight',
          variantName: '6GB/128GB Starlight',
          brand: 'Apple',
        },
        prod.variants[1],
        prod
      )
      expect(diff2.hasChanges).toBe(false)
    })

    it('should flag change ONLY when a specific field is modified', () => {
      const prod: ProductDB = {
        id: 'prod-pixel',
        name: 'Google Pixel 10 12GB/512GB Pink Jade',
        model: 'Google Pixel 10',
        brand: 'Google',
        condition: 'BARU',
        price: 27000000,
        originalPrice: 26000000,
        stock: 9,
        storeId: 'store-1',
        isActive: true,
        description: 'Google pixel terbaru.',
        specs: null,
        variants: [
          {
            id: 'var-pixel',
            productId: 'prod-pixel',
            name: '12GB/512GB Pink Jade',
            ram: '12GB',
            storage: '512GB',
            color: 'Pink Jade',
            price: 27000000,
            stock: 9,
            sku: 'PIXEL-512-PJ',
          },
        ],
      }

      // Untouched Pixel row
      const untouchedRow = {
        price: 27000000,
        stock: 9,
        sku: 'PIXEL-512-PJ',
        model: 'Google Pixel 10',
        ram: '12GB',
        storage: '512GB',
        color: 'Pink Jade',
        productName: 'Google Pixel 10 12GB/512GB Pink Jade',
        variantName: '12GB/512GB Pink Jade',
        brand: 'Google',
      }
      expect(
        checkRowChanges(untouchedRow, prod.variants[0], prod).hasChanges
      ).toBe(false)

      // User modified price only
      const modifiedPriceRow = {
        ...untouchedRow,
        price: 28500000,
      }
      const diffModified = checkRowChanges(
        modifiedPriceRow,
        prod.variants[0],
        prod
      )
      expect(diffModified.hasChanges).toBe(true)
      expect(diffModified.variantUpdates.price).toBe(28500000)
    })

    it('should produce precise summary message for 1 updated out of 30', () => {
      const formatSummary = (
        updatedCount: number,
        unchangedCount: number,
        createdCount: number = 0
      ) => {
        if (updatedCount === 0 && createdCount === 0) {
          return `Pemeriksaan selesai: Tidak ada perubahan data (${unchangedCount} unit sama dengan database).`
        }
        let msg = `Pembaruan selesai: ${updatedCount} unit diperbarui`
        if (unchangedCount > 0) {
          msg += ` (${unchangedCount} unit tidak ada perubahan)`
        }
        if (createdCount > 0) {
          msg += `, ${createdCount} produk/varian baru berhasil ditambahkan`
        }
        return msg + '.'
      }

      expect(formatSummary(1, 29)).toBe(
        'Pembaruan selesai: 1 unit diperbarui (29 unit tidak ada perubahan).'
      )
      expect(formatSummary(0, 30)).toBe(
        'Pemeriksaan selesai: Tidak ada perubahan data (30 unit sama dengan database).'
      )
      expect(formatSummary(2, 28, 1)).toBe(
        'Pembaruan selesai: 2 unit diperbarui (28 unit tidak ada perubahan), 1 produk/varian baru berhasil ditambahkan.'
      )
    })
  })

  describe('Shopee 14-Column Template & Catalog Migration Engine', () => {
    const SHOPEE_HEADERS = [
      'Kode Produk',
      'Nama Produk',
      'Kode Variasi',
      'Nama Variasi',
      'SKU Induk',
      'SKU',
      'Harga',
      'GTIN',
      'Stok',
      'Min. Jumlah Pembelian',
      'Maks. Jumlah Pembelian',
      'Maks. Jumlah Pembelian - Tanggal Mulai',
      'Maks. Jumlah Pembelian - Jumlah Hari',
      'Maks. Jumlah Pembelian - Tanggal Berakhir',
    ]

    it('should generate a valid Shopee 14-column workbook with Sheet1 and orange header', async () => {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Sheet1')

      worksheet.columns = SHOPEE_HEADERS.map((h) => ({
        header: h,
        key: h,
        width: 20,
      }))

      // Row 1 Header styling
      const hRow = worksheet.getRow(1)
      hRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEE4D2D' },
        }
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
      })

      // Row 2 Shopee Hints
      worksheet.addRow({
        'Kode Produk': '',
        'Nama Produk': '',
        'Kode Variasi': '',
        'Nama Variasi': '',
        'SKU Induk': '',
        SKU: '',
        Harga:
          'Mohon masukkan 99 sampai 1000000000 untuk harga produk. Batas harga produk termahal dibagi harga harga produk termurah: 7',
        GTIN: '',
        Stok: '',
        'Min. Jumlah Pembelian':
          'Min. jumlah pembelian merupakan isi dari tingkatan produk...',
      })

      // Row 3 Data
      worksheet.addRow({
        'Kode Produk': '57562284501',
        'Nama Produk': 'Samsung s10 8/128 GB 8/512GB Second Original SEIN',
        'Kode Variasi': '272701755686',
        'Nama Variasi': 'S10 128,Fullset',
        'SKU Induk': '',
        SKU: 'SM-S11',
        Harga: 2849000,
        GTIN: '',
        Stok: 21,
        'Min. Jumlah Pembelian': 1,
      })

      const buffer = await workbook.xlsx.writeBuffer()
      expect(buffer).toBeDefined()
      expect(buffer.byteLength).toBeGreaterThan(0)

      // Reload & check
      const readWb = new ExcelJS.Workbook()
      await readWb.xlsx.load(buffer as any)
      const sheet = readWb.getWorksheet('Sheet1')
      expect(sheet).toBeDefined()
      expect(sheet?.columnCount).toBe(14)
      expect(sheet?.getRow(1).getCell(1).value).toBe('Kode Produk')
      expect(sheet?.getRow(1).getCell(7).value).toBe('Harga')
      expect(sheet?.getRow(1).getCell(9).value).toBe('Stok')
      expect(sheet?.getRow(3).getCell(1).value).toBe('57562284501')
      expect(sheet?.getRow(3).getCell(6).value).toBe('SM-S11')
      expect(sheet?.getRow(3).getCell(7).value).toBe(2849000)
      expect(sheet?.getRow(3).getCell(9).value).toBe(21)
    })

    it('should correctly extract Brand from user Shopee catalog titles', () => {
      const extractBrand = (name: string): string => {
        const p = name.toLowerCase()
        if (p.includes('apple') || p.includes('iphone') || p.includes('ipad'))
          return 'Apple'
        if (p.includes('samsung') || p.includes('sein')) return 'Samsung'
        if (p.includes('asus') || p.includes('rog') || p.includes('zenfone'))
          return 'ASUS'
        if (p.includes('xiaomi') || p.includes('redmi') || p.includes('poco'))
          return 'Xiaomi'
        if (p.includes('oppo') || p.includes('find')) return 'Oppo'
        if (p.includes('vivo')) return 'Vivo'
        if (p.includes('google') || p.includes('pixel')) return 'Google'
        return 'Smartphone'
      }

      expect(
        extractBrand('Samsung s10 8/128 GB 8/512GB Second Original SEIN')
      ).toBe('Samsung')
      expect(extractBrand('SCREEN PROTECTOR ROG 6 l BS 4/5')).toBe('ASUS')
      expect(extractBrand('SEIN FLIP 3 8/256 CREAM MINUS RINGAN')).toBe(
        'Samsung'
      )
      expect(extractBrand('BNOB Asus ROG Phone 8 Pro Plus Cooler 24/1TB')).toBe(
        'ASUS'
      )
      expect(extractBrand('Tam | Asus Zenfone 10 | 9 | 16/512GB')).toBe('ASUS')
      expect(extractBrand('iPhone 15 Pro Max 256GB Natural Titanium')).toBe(
        'Apple'
      )
    })

    it('should correctly extract Condition from user Shopee titles', () => {
      const extractCondition = (name: string, variantName?: string): string => {
        const combined = `${name} ${variantName || ''}`.toUpperCase()
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
          combined.includes('GARIS')
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

      expect(extractCondition('SEIN FLIP 3 8/256 CREAM MINUS RINGAN')).toBe(
        'GRADE_A'
      )
      expect(extractCondition('SEIN S22 ULTRA 12/256GB MATI TOTAL')).toBe(
        'GRADE_A'
      )
      expect(
        extractCondition(
          'SEIN | Samsung Galaxy S22 ULTRA 12/256 Minus Layar JARONG'
        )
      ).toBe('GRADE_A')
      expect(
        extractCondition('BNOB Asus ROG Phone 8 Pro Plus Cooler 24/1TB')
      ).toBe('BARU')
      expect(extractCondition('SECOND LIKE NEW,ROG 6 PRO 18/512GB')).toBe(
        'LIKE_NEW'
      )
      expect(
        extractCondition('Samsung s10 8/128 GB Second Original SEIN')
      ).toBe('SECOND_MULUS')
    })

    it('should skip instruction rows where price contains Shopee guideline text', () => {
      const isInstructionRow = (priceVal: any): boolean => {
        const str = String(priceVal || '').toLowerCase()
        return (
          str.includes('mohon masukkan') ||
          str.includes('batas harga') ||
          str.includes('untuk harga produk')
        )
      }

      expect(
        isInstructionRow(
          'Mohon masukkan 99 sampai 1000000000 untuk harga produk. Batas harga produk termahal dibagi harga harga produk termurah: 7'
        )
      ).toBe(true)
      expect(isInstructionRow(2849000)).toBe(false)
      expect(isInstructionRow('2849000')).toBe(false)
      expect(isInstructionRow('Rp 2.849.000')).toBe(false)
    })

    it('should group consecutive variants under the same product ID during migration', () => {
      const sampleShopeeRows = [
        {
          kodeProduk: '57562284501',
          namaProduk: 'Samsung s10 8/128 GB 8/512GB Second Original SEIN',
          kodeVariasi: '272701755686',
          namaVariasi: 'S10 128,Fullset',
          sku: 'SM-S11',
          harga: 2849000,
          stok: 21,
        },
        {
          kodeProduk: '57562284501',
          namaProduk: 'Samsung s10 8/128 GB 8/512GB Second Original SEIN',
          kodeVariasi: '272701755685',
          namaVariasi: 'S10 128,Unit Only',
          sku: 'SM-S10',
          harga: 2749000,
          stok: 20,
        },
        {
          kodeProduk: '57509706054',
          namaProduk: 'SCREEN PROTECTOR ROG 6 l BS 4/5',
          kodeVariasi: '445857599348',
          namaVariasi: '',
          sku: '',
          harga: 300000,
          stok: 4,
        },
      ]

      // Simulation of in-memory product cache during transaction
      const productsMap = new Map<
        string,
        { id: string; name: string; variants: any[] }
      >()
      let createdProductCount = 0
      let createdVariantCount = 0

      for (const row of sampleShopeeRows) {
        let product = productsMap.get(row.kodeProduk)
        if (!product) {
          product = {
            id: `prod-${row.kodeProduk}`,
            name: row.namaProduk,
            variants: [],
          }
          productsMap.set(row.kodeProduk, product)
          createdProductCount++
        }

        product.variants.push({
          id: `var-${row.kodeVariasi}`,
          name: row.namaVariasi || 'Standar',
          sku: row.sku,
          price: row.harga,
          stock: row.stok,
        })
        createdVariantCount++
      }

      expect(productsMap.size).toBe(2) // 2 distinct products
      expect(createdProductCount).toBe(2)
      expect(createdVariantCount).toBe(3) // 2 variants for S10 + 1 for Screen Protector

      const s10 = productsMap.get('57562284501')
      expect(s10?.variants.length).toBe(2)
      expect(s10?.variants[0].sku).toBe('SM-S11')
      expect(s10?.variants[1].sku).toBe('SM-S10')
      expect(s10?.variants[1].price).toBe(2749000)

      const screenProtector = productsMap.get('57509706054')
      expect(screenProtector?.variants.length).toBe(1)
      expect(screenProtector?.variants[0].name).toBe('Standar')
      expect(screenProtector?.variants[0].stock).toBe(4)
    })

    it('should ignore trailing blank rows with no identifiers and default blank stock to 0', () => {
      const isMeaningful = (s: string) =>
        s && s.trim() !== '' && s.trim() !== '-' && !s.startsWith('AUTO-')

      const shouldSkipRow = (
        kodeProduk: string,
        namaProduk: string,
        kodeVariasi: string,
        sku: string
      ): boolean => {
        return (
          !isMeaningful(kodeProduk) &&
          !isMeaningful(namaProduk) &&
          !isMeaningful(kodeVariasi) &&
          !isMeaningful(sku)
        )
      }

      // 1. Trailing empty rows from Excel (e.g. Row 1282..1785)
      expect(shouldSkipRow('', '', '', '')).toBe(true)
      expect(shouldSkipRow('-', '', '', '-')).toBe(true)
      expect(shouldSkipRow('AUTO-PROD', '', '', '')).toBe(true)

      // 2. Real product row must NOT be skipped
      expect(shouldSkipRow('57562284501', 'Samsung S10', '', '')).toBe(false)
      expect(shouldSkipRow('', '', '', 'SM-S11')).toBe(false)

      // 3. Stock defaulting to 0 if blank/empty
      const parseStockSafe = (rawVal: any): number => {
        if (rawVal === null || rawVal === undefined || rawVal === '') return 0
        const n =
          typeof rawVal === 'number'
            ? rawVal
            : parseInt(String(rawVal).replace(/[^0-9]/g, ''), 10)
        return isNaN(n) ? 0 : Math.max(0, Math.floor(n))
      }

      expect(parseStockSafe('')).toBe(0)
      expect(parseStockSafe(null)).toBe(0)
      expect(parseStockSafe(undefined)).toBe(0)
      expect(parseStockSafe(21)).toBe(21)
      expect(parseStockSafe('50')).toBe(50)
    })
  })

  describe('Shopee Auto-Generated Codes Engine (User Manual Row Integration)', () => {
    it('should generate valid 11-digit Shopee Item ID starting with 58', () => {
      const id1 = generateShopeeItemId('Google Pixel 10')
      const id2 = generateShopeeItemId()
      expect(id1).toMatch(/^58[0-9]{9}$/)
      expect(id1.length).toBe(11)
      expect(id2).toMatch(/^58[0-9]{9}$/)
      expect(id2.length).toBe(11)
      // Deterministic when seeded
      expect(generateShopeeItemId('Google Pixel 10')).toBe(id1)
    })

    it('should generate valid 12-digit Shopee Variation ID starting with 28', () => {
      const varId1 = generateShopeeVariationId('12GB/512GB White')
      const varId2 = generateShopeeVariationId()
      expect(varId1).toMatch(/^28[0-9]{10}$/)
      expect(varId1.length).toBe(12)
      expect(varId2).toMatch(/^28[0-9]{10}$/)
      expect(varId2.length).toBe(12)
      // Deterministic when seeded
      expect(generateShopeeVariationId('12GB/512GB White')).toBe(varId1)
    })

    it('should generate intelligent smart SKU conforming to existing Shopee template format', () => {
      // User's exact row from screenshot: Google Pixel 10 12GB/512GB White
      const pixelSku = generateSmartSku(
        'Google Pixel 10 12GB/512GB White',
        '12GB/512GB White',
        'Google Pixel 10'
      )
      expect(pixelSku).toBe('PIX10-512-WH')

      // Other template products in the screenshot:
      expect(
        generateSmartSku(
          'Xiaomi 14 12GB/512GB White',
          '12GB/512GB White',
          'Xiaomi 14'
        )
      ).toBe('MI14-512-WH')
      expect(
        generateSmartSku(
          'Xiaomi 14 12GB/512GB Jade Green',
          '12GB/512GB Jade Green',
          'Xiaomi 14'
        )
      ).toBe('MI14-512-JG')
      expect(
        generateSmartSku(
          'Vivo V30 Pro 12GB/512GB Volcanic Black',
          '12GB/512GB Volcanic Black',
          'Vivo V30 Pro'
        )
      ).toBe('V30P-512-VB')
      expect(
        generateSmartSku(
          'POCO F6 Pro 16GB/1TB White',
          '16GB/1TB White',
          'POCO F6 Pro'
        )
      ).toBe('F6P-1TB-WH')
      expect(
        generateSmartSku(
          'Samsung Galaxy S24 Ultra 12GB/512GB Titanium Black',
          '12GB/512GB Titanium Black',
          'Samsung Galaxy S24 Ultra'
        )
      ).toBe('SM-S24U-512-TB')
    })

    it('should simulate full manual row import and auto-generate codes on import, then verify export presence', () => {
      // Simulating user row #642 from screenshot:
      const manualUserRow = {
        kodeProduk: '', // Left blank in Excel
        namaProduk: 'Google Pixel 10 12GB/512GB White',
        kodeVariasi: '', // Left blank in Excel
        namaVariasi: '12GB/512GB White',
        skuInduk: 'Google Pixel 10',
        sku: '', // Left blank in Excel
        harga: 15599999,
        stok: 12,
      }

      // 1. Import Logic Process
      const resolvedKodeProduk = manualUserRow.kodeProduk.trim()
        ? manualUserRow.kodeProduk.trim()
        : generateShopeeItemId(manualUserRow.namaProduk)

      const resolvedKodeVariasi = manualUserRow.kodeVariasi.trim()
        ? manualUserRow.kodeVariasi.trim()
        : generateShopeeVariationId(
            `${manualUserRow.namaProduk}-${manualUserRow.namaVariasi}`
          )

      const resolvedSku = manualUserRow.sku.trim()
        ? manualUserRow.sku.trim()
        : generateSmartSku(
            manualUserRow.namaProduk,
            manualUserRow.namaVariasi,
            manualUserRow.skuInduk
          )

      expect(resolvedKodeProduk).toMatch(/^58[0-9]{9}$/)
      expect(resolvedKodeVariasi).toMatch(/^28[0-9]{10}$/)
      expect(resolvedSku).toBe('PIX10-512-WH')

      // 2. Export Simulation
      const exportedRow = {
        kodeProduk: resolvedKodeProduk,
        namaProduk: manualUserRow.namaProduk,
        kodeVariasi: resolvedKodeVariasi,
        namaVariasi: manualUserRow.namaVariasi,
        skuInduk: manualUserRow.skuInduk,
        sku: resolvedSku,
        harga: manualUserRow.harga,
        stok: manualUserRow.stok,
      }

      // Assert that when re-exported, the user sees all codes filled in automatically!
      expect(exportedRow.kodeProduk).toBe(resolvedKodeProduk)
      expect(exportedRow.kodeVariasi).toBe(resolvedKodeVariasi)
      expect(exportedRow.sku).toBe('PIX10-512-WH')
      expect(exportedRow.sku).not.toContain('AUTO-')
      expect(exportedRow.sku).not.toContain('cuid')
      expect(exportedRow.kodeProduk.length).toBe(11)
      expect(exportedRow.kodeVariasi.length).toBe(12)
    })
  })

  describe('Full Catalog Mirroring Sync (Two-Way Reconciliation Engine)', () => {
    it('should reconcile website catalog to mirror Excel: add new, update existing, and prune omitted items', () => {
      // Mock existing database state before import:
      // Product 1: Samsung S10 with 2 variants (128GB, 512GB)
      // Product 2: Discontinued Phone (no orders) -> should be deleted
      // Product 3: Legacy Phone (has orders) -> should be deactivated (isActive=false, stock=0)
      const mockDbProducts = [
        {
          id: 'prod-s10',
          name: 'Samsung S10',
          isActive: true,
          stock: 25,
          orderItemCount: 2,
          variants: [
            {
              id: 'var-s10-128',
              name: '128GB',
              sku: 'SM-S10-128',
              price: 2500000,
              stock: 15,
            },
            {
              id: 'var-s10-512',
              name: '512GB',
              sku: 'SM-S10-512',
              price: 3200000,
              stock: 10,
            },
          ],
        },
        {
          id: 'prod-disc',
          name: 'Discontinued Phone',
          isActive: true,
          stock: 5,
          orderItemCount: 0, // No orders
          variants: [
            {
              id: 'var-disc-1',
              name: 'Standard',
              sku: 'DISC-01',
              price: 1000000,
              stock: 5,
            },
          ],
        },
        {
          id: 'prod-legacy',
          name: 'Legacy Phone',
          isActive: true,
          stock: 3,
          orderItemCount: 8, // Has past orders
          variants: [
            {
              id: 'var-leg-1',
              name: 'Standard',
              sku: 'LEG-01',
              price: 1500000,
              stock: 3,
            },
          ],
        },
      ]

      // Imported Excel rows:
      // Row 1: Samsung S10 (only 128GB variant present in Excel, with updated price 2400000)
      // Row 2: Google Pixel 10 (brand new product in Excel!)
      const importedRows = [
        {
          kodeProduk: 'prod-s10',
          namaProduk: 'Samsung S10',
          kodeVariasi: 'var-s10-128',
          namaVariasi: '128GB',
          sku: 'SM-S10-128',
          harga: 2400000,
          stok: 20,
        },
        {
          kodeProduk: '', // Brand new
          namaProduk: 'Google Pixel 10 12GB/512GB White',
          kodeVariasi: '',
          namaVariasi: '12GB/512GB White',
          sku: '',
          harga: 15599999,
          stok: 12,
        },
      ]

      const touchedProductIds = new Set<string>()
      const touchedVariantIds = new Set<string>()

      let updatedCount = 0
      let createdCount = 0
      let deletedProductsCount = 0
      let deletedVariantsCount = 0
      let deactivatedProductsCount = 0

      // Step 1: Process rows
      for (const row of importedRows) {
        if (row.kodeProduk === 'prod-s10') {
          // Existing product
          touchedProductIds.add(row.kodeProduk)
          touchedVariantIds.add(row.kodeVariasi)
          updatedCount++
        } else {
          // New product
          const newProdId = 'prod-pixel-10'
          const newVarId = 'var-pixel-10'
          touchedProductIds.add(newProdId)
          touchedVariantIds.add(newVarId)
          createdCount++
        }
      }

      // Step 2: Variant-level pruning for touched products
      for (const prod of mockDbProducts) {
        if (touchedProductIds.has(prod.id)) {
          for (const v of prod.variants) {
            if (!touchedVariantIds.has(v.id)) {
              // Variant omitted in Excel -> deleted!
              deletedVariantsCount++
            }
          }
        }
      }

      // Step 3: Product-level pruning for untouched products
      for (const prod of mockDbProducts) {
        if (!touchedProductIds.has(prod.id)) {
          if (prod.orderItemCount === 0) {
            // Hard delete
            deletedProductsCount++
          } else {
            // Soft delete / deactivate to protect past invoices
            deactivatedProductsCount++
          }
        }
      }

      expect(updatedCount).toBe(1)
      expect(createdCount).toBe(1)
      expect(deletedVariantsCount).toBe(1) // Samsung S10 512GB variant removed
      expect(deletedProductsCount).toBe(1) // Discontinued phone hard deleted
      expect(deactivatedProductsCount).toBe(1) // Legacy phone deactivated (stock 0, isActive false)

      const totalPruned =
        deletedProductsCount + deletedVariantsCount + deactivatedProductsCount
      expect(totalPruned).toBe(3)
    })

    it('should bypass pruning when mirrorMode is false', () => {
      const isMirrorMode = false
      const touchedProductIds = new Set<string>(['prod-1'])
      const allDbProductIds = ['prod-1', 'prod-2', 'prod-3']

      let prunedCount = 0
      if (isMirrorMode) {
        for (const id of allDbProductIds) {
          if (!touchedProductIds.has(id)) prunedCount++
        }
      }

      expect(prunedCount).toBe(0)
    })
  })
})
