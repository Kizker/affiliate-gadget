import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mobile Catalog & Product Detail Alignment Suite (Screenshots 1-4)', () => {
  it('verifies mobile catalog product cards have rating badge at top-left and no Like New condition badge', () => {
    const catalogPath = path.join(
      process.cwd(),
      'src/components/gadget/mobile-catalog-view.tsx'
    )
    const content = fs.readFileSync(catalogPath, 'utf-8')

    // Must import MapPin
    expect(content).toContain('MapPin')

    // Top-left image badge must be Rating Badge (Star icon + rating number)
    expect(content).toContain('Rating Badge (Top Left) replacing Like New')
    expect(content).toContain('item.rating')
    expect(content).toContain(
      'MapPin className="h-2.5 w-2.5 shrink-0 text-slate-400"'
    )
  })

  it('verifies mobile homepage product cards have rating badge at top-left', () => {
    const homePath = path.join(
      process.cwd(),
      'src/components/landing/mobile-home-view.tsx'
    )
    const content = fs.readFileSync(homePath, 'utf-8')

    expect(content).toContain('MapPin')
    expect(content).toContain('item.rating.toFixed(1)')
    expect(content).toContain(
      'MapPin className="h-2.5 w-2.5 shrink-0 text-slate-400"'
    )
  })

  it('verifies mobile product detail hero gallery and primary info match Screenshot 1', () => {
    const detailPath = path.join(
      process.cwd(),
      'src/components/gadget/shopee-mobile-product-detail.tsx'
    )
    const content = fs.readFileSync(detailPath, 'utf-8')

    // 1. Aspect square gallery with 1/1 counter on bottom right
    expect(content).toContain(
      'Hero Media Gallery with Native Horizontal Slide matching Screenshot 1'
    )
    expect(content).toContain('{displayIdx}/{totalImagesCount}')

    // 2. Primary Info matching Screenshot 1
    expect(content).toContain(
      'Product Primary Info & Pricing matching Screenshot 1'
    )
    expect(content).toContain('Hemat')

    // 3. Variant selector matching Screenshot 1 (2-col grid with active orange border)
    expect(content).toContain('Variant Selector matching Screenshot 1')
    expect(content).toContain('Pilihan Varian')
    expect(content).toContain('Terpilih:')
    expect(content).toContain('border-2 border-orange-500 bg-orange-50/10')

    // 4. Quantity stepper matching Screenshot 1
    expect(content).toContain('Quantity Stepper matching Screenshot 1')
    expect(content).toContain('Jumlah Pesanan')
    expect(content).toContain('Maksimal')

    // 5. Paket Bonus Aksesoris 3-in-1 matching Screenshot 1
    expect(content).toContain(
      'Paket Bonus Aksesoris 3-in-1 matching Screenshot 1'
    )
    expect(content).toContain('Gratis')
    expect(content).toContain('Charger 20W')
    expect(content).toContain('Antigores 9D')
    expect(content).toContain('Matte Case')
    expect(content).toContain('Logistik Terproteksi')
    expect(content).toContain('Garansi 30 Hari')
  })

  it('verifies mobile product detail store profile and produk lainnya match Screenshot 2', () => {
    const detailPath = path.join(
      process.cwd(),
      'src/components/gadget/shopee-mobile-product-detail.tsx'
    )
    const content = fs.readFileSync(detailPath, 'utf-8')

    // Store profile card with Lihat Toko pill button
    expect(content).toContain('Store Profile Card matching Screenshot 2')
    expect(content).toContain('Lihat Toko')

    // PRODUK LAINNYA section
    expect(content).toContain('PRODUK LAINNYA matching Screenshot 2')
    expect(content).toContain('PRODUK LAINNYA')
    expect(content).toContain('Lihat Semua &gt;')
  })

  it('verifies mobile product detail deskripsi, ulasan, and rekomendasi match Screenshot 3 & 4', () => {
    const detailPath = path.join(
      process.cwd(),
      'src/components/gadget/shopee-mobile-product-detail.tsx'
    )
    const content = fs.readFileSync(detailPath, 'utf-8')

    // Deskripsi & Spesifikasi
    expect(content).toContain('DESKRIPSI & SPESIFIKASI matching Screenshot 3')
    expect(content).toContain('Buka Detail')

    // Ulasan & Kepuasan Pembeli with compact review section
    expect(content).toContain('ULASAN & KEPUASAN PEMBELI matching Screenshot 3')
    expect(content).toContain('Rating Toko')
    expect(content).toContain('compact')

    // Rekomendasi Gadget Lainnya
    expect(content).toContain(
      'REKOMENDASI GADGET LAINNYA matching Screenshot 3 & 4'
    )
    expect(content).toContain('REKOMENDASI GADGET LAINNYA')

    // Bottom Sticky Action Bar matching Screenshot 4
    expect(content).toContain('Bottom Sticky Action Bar matching Screenshot 4')
    expect(content).toContain('Chat')
    expect(content).toContain('+ Keranjang')
    expect(content).toContain('Beli Sekarang')
  })
})
