import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mass Update Basic Info, Varian Original Price, Map 503 Removal & Live Stream Fixes', () => {
  const importExcelApiPath = path.resolve(
    'src/app/api/admin/products/import-excel/route.ts'
  )
  const productEditPagePath = path.resolve(
    'src/app/dashboard/admin/products/[id]/edit/page.tsx'
  )
  const productNewPagePath = path.resolve(
    'src/app/dashboard/admin/products/new/page.tsx'
  )
  const mapPickerPath = path.resolve(
    'src/components/maps/address-map-picker.tsx'
  )
  const liveViewerPath = path.resolve(
    'src/components/live/live-stream-viewer.tsx'
  )

  it('1. Import Excel mendeteksi template Shopee basic_info dan memperbarui deskripsi produk ke database', () => {
    const content = fs.readFileSync(importExcelApiPath, 'utf-8')
    expect(content).toContain('isShopeeBasicInfo')
    expect(content).toContain('et_title_product_description')
    expect(content).toContain(
      'productUpdates.description = item.description.trim()'
    )
    expect(content).toContain('description: item.description')
  })

  it('2. Form Edit Produk dan Tambah Produk menyediakan input Harga Coret (Rp) untuk masing-masing varian', () => {
    const editContent = fs.readFileSync(productEditPagePath, 'utf-8')
    const newContent = fs.readFileSync(productNewPagePath, 'utf-8')

    expect(editContent).toContain('Harga Coret (Rp)')
    expect(editContent).toContain('v.originalPrice')
    expect(newContent).toContain('Harga Coret (Rp)')
    expect(newContent).toContain('v.originalPrice')
  })

  it('3. AddressMapPicker menghapus iframe OSM rentan 503 dan menggunakan peta vektor murni', () => {
    const content = fs.readFileSync(mapPickerPath, 'utf-8')
    expect(content).not.toContain('openstreetmap.org/export/embed.html')
    expect(content).toContain('Vector Street Map')
  })

  it('4. Live Stream Viewer menghapus tombol Chat WhatsApp dan menghapus translateY keyboardInset melayang di Android', () => {
    const content = fs.readFileSync(liveViewerPath, 'utf-8')
    expect(content).not.toContain('Chat WhatsApp')
    expect(content).not.toContain('translateY(-${keyboardInset}px)')
  })
})
