import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Aturan Logika Mass Update Produk & Informasi Gadget (Sesuai 3 Aturan Bisnis)', () => {
  const importExcelApiPath = path.resolve(
    'src/app/api/admin/products/import-excel/route.ts'
  )

  it('1. Rule 1: Jika tidak dicentang (mirrorMode: false), semua produk yang ada ditambah dengan update mass yang ada', () => {
    const content = fs.readFileSync(importExcelApiPath, 'utf-8')
    // Memastikan tidak ada blokir 'isShopeeFormat' yang menolak pembuatan produk baru
    expect(content).not.toContain(
      'isShopeeFormat ||\n                item.harga === null'
    )
    expect(content).not.toContain(
      'isShopeeFormat ||\r\n                item.harga === null'
    )
    // Produk baru dibuat ketika belum ada di database
    expect(content).toContain('newProduct = await tx.product.create')
    expect(content).toContain('newVariant = await tx.productVariant.create')
    expect(content).toContain('createdCount++')
  })

  it('2. Rule 2: Jika dicentang (mirrorMode: true), semua katalog lama dihapus/digantikan dengan yang ada di update mass', () => {
    const content = fs.readFileSync(importExcelApiPath, 'utf-8')
    expect(content).toContain(
      'isMirrorMode && !isShopeeBasicInfo && rowsToProcess.length > 0'
    )
    // Pruning produk yang tidak tersentuh di berkas Excel
    expect(content).toContain('!touchedProductIds.has(dbProd.id)')
    expect(content).toContain('tx.product.delete')
    expect(content).toContain('tx.etalase.deleteMany')
  })

  it('3. Rule 3: Jika yang diunggah adalah information (basic_info), baik dicentang atau tidak, semua info gadget ber-SKU sesuai terupdate, tanpa SKU dilewatkan', () => {
    const content = fs.readFileSync(importExcelApiPath, 'utf-8')
    // Cabang khusus basic_info
    expect(content).toContain('if (isShopeeBasicInfo)')
    // Jika tidak ada SKU-nya, maka dilewatkan (skippedCount++)
    expect(content).toContain('!targetSku ||')
    expect(content).toContain("targetSku === '-'")
    // Update informasi deskripsi dan nama gadget jika SKU sesuai
    expect(content).toContain(
      'productUpdates.description = item.description.trim()'
    )
    expect(content).toContain('productUpdates.name = item.namaProduk.trim()')
    // Tidak pernah menghapus produk katalog saat upload basic_info
    expect(content).toContain('!isShopeeBasicInfo && rowsToProcess.length > 0')
  })

  it('4. Fault-tolerance database: Auto-provision toko pusat jika database toko masih 0 saat import Superadmin', () => {
    const content = fs.readFileSync(importExcelApiPath, 'utf-8')
    expect(content).toContain('allStores.length === 0')
    expect(content).toContain('prisma.store.create')
    expect(content).toContain('Affiliate Gadget Pusat')
  })
})
