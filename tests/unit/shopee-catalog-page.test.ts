import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Shopee-Style Products Catalog UI & Master SKU Sync Test', () => {
  const pagePath = path.resolve('src/app/dashboard/admin/products/page.tsx')
  const syncSkuRoutePath = path.resolve(
    'src/app/api/admin/products/variants/sync-sku-stock/route.ts'
  )

  it('1. Halaman admin products memiliki 4 Tab Status Shopee: Semua, Live, Perlu tindakan, Disembunyikan', () => {
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain("activeTab === 'ALL'")
    expect(content).toContain("activeTab === 'LIVE'")
    expect(content).toContain("activeTab === 'ACTION_REQUIRED'")
    expect(content).toContain("activeTab === 'HIDDEN'")
    expect(content).toContain('Perlu tindakan')
    expect(content).toContain('Disembunyikan')
  })

  it('2. Halaman admin products mendukung 2 mode: Mode Daftar dan Mode Per merek', () => {
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain("viewMode === 'list'")
    expect(content).toContain("viewMode === 'hierarchy'")
    expect(content).toContain('Mode Daftar')
    expect(content).toContain('Mode Per merek')
  })

  it('3. Mode Daftar menyediakan expandable variations dengan tautan variasi lainnya bila > 3', () => {
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain('displayedVariants')
    expect(content).toContain('p.variants.slice(0, 3)')
    expect(content).toContain('p.variants.length > 3')
    expect(content).toContain('variasi lainnya')
  })

  it('4. Mode Daftar mendukung inline edit harga, HPP, stok, dan 1-klik samakan stok SKU', () => {
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain('handleSaveInlineVariant')
    expect(content).toContain('handleSyncSkuStock')
    expect(content).toContain('Samakan stok')
  })

  it('5. Menu aksi sekunder dipindahkan ke menu tambahan MoreVertical (...)', () => {
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain('MoreVertical')
    expect(content).toContain('Lihat di Web Publik')
    expect(content).toContain('Hapus Produk')
    expect(content).toContain('handleToggleProductActive')
  })

  it('6. Endpoint sync-sku-stock memiliki proteksi kepemilikan toko dan role check', () => {
    const content = fs.readFileSync(syncSkuRoutePath, 'utf8')
    expect(content).toContain('session?.user?.role')
    expect(content).toContain('STORE_ADMIN')
    expect(content).toContain('userStoreId')
    expect(content).toContain('tx.productVariant.updateMany')
  })
})
