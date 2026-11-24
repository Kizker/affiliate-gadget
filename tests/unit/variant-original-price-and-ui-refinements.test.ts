import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Penyempurnaan Harga Coret, Single Line Column Header, Etalase Checkbox, & Empty Chart State', () => {
  const productDetailApiPath = path.resolve(
    'src/app/api/products/[id]/route.ts'
  )
  const productCreateApiPath = path.resolve('src/app/api/products/route.ts')
  const productEditPagePath = path.resolve(
    'src/app/dashboard/admin/products/[id]/edit/page.tsx'
  )
  const productNewPagePath = path.resolve(
    'src/app/dashboard/admin/products/new/page.tsx'
  )
  const etalasePagePath = path.resolve(
    'src/app/dashboard/admin/etalase/page.tsx'
  )
  const productsPagePath = path.resolve(
    'src/app/dashboard/admin/products/page.tsx'
  )
  const reportsViewPath = path.resolve(
    'src/components/admin/finance/views/reports-view.tsx'
  )
  const mobileProductDetailPath = path.resolve(
    'src/components/gadget/shopee-mobile-product-detail.tsx'
  )

  it('1. Backend API: Menyimpan originalPrice pada varian saat edit dan create produk', () => {
    const editApi = fs.readFileSync(productDetailApiPath, 'utf-8')
    const createApi = fs.readFileSync(productCreateApiPath, 'utf-8')

    expect(editApi).toContain('originalPrice:')
    expect(editApi).toContain('v.originalPrice')
    expect(createApi).toContain('originalPrice:')
    expect(createApi).toContain('v.originalPrice')
  })

  it('2. Form Edit & Tambah Produk: Deskripsi kolom menjadi 1 baris (Harga Coret, Harga Jual, HPP Modal, Stok)', () => {
    const editPage = fs.readFileSync(productEditPagePath, 'utf-8')
    const newPage = fs.readFileSync(productNewPagePath, 'utf-8')

    expect(editPage).toContain(
      'truncate whitespace-nowrap text-[10px] font-bold text-slate-500'
    )
    expect(editPage).toContain('Harga Coret')
    expect(editPage).not.toContain('Harga Coret (Rp)')

    expect(newPage).toContain(
      'truncate whitespace-nowrap font-semibold text-slate-500'
    )
    expect(newPage).toContain('Harga Coret')
    expect(newPage).not.toContain('Harga Coret (Rp)')
  })

  it('3. Mobile Product Detail: Membaca originalPrice varian aktif untuk harga coret & diskon', () => {
    const mobileDetail = fs.readFileSync(mobileProductDetailPath, 'utf-8')
    expect(mobileDetail).toContain(
      'selectedVariant?.originalPrice || product.originalPrice'
    )
  })

  it('4. Etalase Toko: Mendukung multi-select checkbox & sticky bottom action bar dengan 1 tombol toggle aktif/nonaktif', () => {
    const etalasePage = fs.readFileSync(etalasePagePath, 'utf-8')
    expect(etalasePage).toContain('selectedEtalaseIds')
    expect(etalasePage).toContain('handleSelectAllEtalase')
    expect(etalasePage).toContain('handleToggleSelectEtalase')
    expect(etalasePage).toContain('handleBatchSetEtalaseActive')
    expect(etalasePage).toContain('handleBatchDeleteEtalase')
    expect(etalasePage).toContain('isAllSelectedEtalasesInactive')
    expect(etalasePage).toContain('Etalase terpilih')
  })

  it('5. Katalog Gadget: Tombol aktifkan & nonaktifkan disatukan menjadi 1 tombol sesuai status barang', () => {
    const productsPage = fs.readFileSync(productsPagePath, 'utf-8')
    expect(productsPage).toContain('isAllSelectedProductsInactive')
  })

  it('6. Laporan Keuangan: Chart tren omzet & laba menampilkan empty state bersih saat 0 transaksi tanpa fake dummy data', () => {
    const reportsView = fs.readFileSync(reportsViewPath, 'utf-8')
    expect(reportsView).not.toContain(
      '(reportData.financials?.grossRevenue || 1000000) * 0.2'
    )
    expect(reportsView).toContain('Belum Ada Aktivitas Transaksi')
    expect(reportsView).toContain('BarChart3')
  })
})
