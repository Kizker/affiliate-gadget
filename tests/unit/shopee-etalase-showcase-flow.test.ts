import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { evaluateEtalase, generateShortProductLabel } from '@/lib/etalase-utils'

describe('Shopee-Style Etalase (Showcase) Architecture & Flow Test', () => {
  const sampleProducts = new Map<string, any>([
    [
      'prod-fold-3',
      {
        id: 'prod-fold-3',
        name: 'Samsung Galaxy Z Fold 3 5G 12/256GB #12',
        brand: 'Samsung',
        category: 'Smartphone',
        price: 6500000,
        originalPrice: 7500000,
        stock: 0, // Out of stock!
        images: ['/img/fold3.jpg'],
        rating: 4.9,
        totalReview: 20,
        variants: [
          {
            id: 'v-fold3-256',
            name: '12/256GB Phantom Black',
            price: 6500000,
            stock: 0,
          },
        ],
      },
    ],
    [
      'prod-fold-5',
      {
        id: 'prod-fold-5',
        name: 'Samsung Galaxy Z Fold 5 5G 12/512GB',
        brand: 'Samsung',
        category: 'Smartphone',
        price: 13500000,
        originalPrice: 15500000,
        stock: 5,
        images: ['/img/fold5.jpg'],
        rating: 5.0,
        totalReview: 35,
        variants: [
          {
            id: 'v-fold5-512',
            name: '12/512GB Icy Blue',
            price: 13500000,
            stock: 5,
          },
        ],
      },
    ],
    [
      'prod-flip-5',
      {
        id: 'prod-flip-5',
        name: 'Samsung Galaxy Z Flip 5 5G 8/256GB',
        brand: 'Samsung',
        category: 'Smartphone',
        price: 8200000,
        originalPrice: 9500000,
        stock: 4,
        images: ['/img/flip5.jpg'],
        rating: 4.8,
        totalReview: 15,
        variants: [
          {
            id: 'v-flip5-256',
            name: '8/256GB Mint',
            price: 8200000,
            stock: 4,
          },
        ],
      },
    ],
  ])

  const rawItems = [
    {
      id: 'item-1',
      etalaseId: 'eta-samsung-fold',
      productId: 'prod-fold-3',
      label: 'Fold 3 12/256GB',
      sortOrder: 0,
    },
    {
      id: 'item-2',
      etalaseId: 'eta-samsung-fold',
      productId: 'prod-fold-5',
      label: 'Fold 5 12/512GB',
      sortOrder: 1,
    },
    {
      id: 'item-3',
      etalaseId: 'eta-samsung-fold',
      productId: 'prod-flip-5',
      label: 'Flip 5 8/256GB',
      sortOrder: 2,
    },
  ]

  it('1. Mendukung 3 Mode Harga Cover Etalase (LOWEST, COVER_PRODUCT, CUSTOM) serta Custom Cover Image & Judul', () => {
    // Mode LOWEST: mengambil harga termurah dari produk yang masih ready stock (Flip 5 = 8.200.000)
    const etaLowest = evaluateEtalase(
      {
        id: 'eta-samsung-fold',
        storeId: 'store-roxy',
        name: 'SAMSUNG GALAXY Z FOLD & FLIP 5 | 4 | 3 5G SEIN',
        coverProductId: 'prod-fold-5',
        priceMode: 'LOWEST',
        isActive: true,
      },
      rawItems,
      sampleProducts
    )
    expect(etaLowest.price).toBe(8200000)
    expect(etaLowest.stock).toBe(9) // 0 + 5 + 4
    expect(etaLowest.productCount).toBe(3)

    // Mode COVER_PRODUCT: mengikuti harga produk cover (Fold 5 = 13.500.000)
    const etaCover = evaluateEtalase(
      {
        id: 'eta-samsung-fold',
        storeId: 'store-roxy',
        name: 'SAMSUNG GALAXY Z FOLD & FLIP 5 | 4 | 3 5G SEIN',
        coverProductId: 'prod-fold-5',
        priceMode: 'COVER_PRODUCT',
        isActive: true,
      },
      rawItems,
      sampleProducts
    )
    expect(etaCover.price).toBe(13500000)

    // Mode CUSTOM: menggunakan harga pancingan kustom (Rp 3.924.000) & customCoverImage
    const etaCustom = evaluateEtalase(
      {
        id: 'eta-samsung-fold',
        storeId: 'store-roxy',
        name: 'Default Name',
        customTitle:
          'SAMSUNG GALAXY Z FOLD & FLIP 5 | 4 | 3 5G SEIN Second Fullset Original',
        customCoverImage: '/uploads/custom-banner-fold.jpg',
        coverProductId: 'prod-fold-3',
        priceMode: 'CUSTOM',
        customPrice: 3924000,
        customOriginalPrice: 5500000,
        isActive: true,
      },
      rawItems,
      sampleProducts
    )
    expect(etaCustom.price).toBe(3924000)
    expect(etaCustom.originalPrice).toBe(5500000)
    expect(etaCustom.name).toBe(
      'SAMSUNG GALAXY Z FOLD & FLIP 5 | 4 | 3 5G SEIN Second Fullset Original'
    )
    expect(etaCustom.images[0]).toBe('/uploads/custom-banner-fold.jpg')
  })

  it('2. Aturan Tetap Tampil & Auto-Switch: jika produk cover stoknya habis (0), otomatis memilih produk yang masih ada stok saat dibuka', () => {
    // prod-fold-3 adalah coverProductId, tapi stoknya 0.
    // Sistem wajib tetap menampilkan etalase dan otomatis mengarahkan defaultProduct ke prod-fold-5 (stok 5)
    const evaluated = evaluateEtalase(
      {
        id: 'eta-samsung-fold',
        storeId: 'store-roxy',
        name: 'SAMSUNG GALAXY Z FOLD & FLIP SERIES',
        coverProductId: 'prod-fold-3',
        priceMode: 'LOWEST',
        isActive: true,
      },
      rawItems,
      sampleProducts
    )

    expect(evaluated.stock).toBe(9)
    expect(evaluated.defaultProduct).toBeTruthy()
    expect(evaluated.defaultProduct.id).toBe('prod-fold-5')
  })

  it('3. Relasi Many-to-Many (1 Produk = Banyak Etalase): produk yang sama dapat masuk ke beberapa Etalase berbeda', () => {
    const etaA = evaluateEtalase(
      {
        id: 'eta-a',
        storeId: 'store-roxy',
        name: 'Etalase Promo Samsung',
        coverProductId: 'prod-fold-5',
        priceMode: 'LOWEST',
      },
      [
        {
          id: 'i1',
          etalaseId: 'eta-a',
          productId: 'prod-fold-5',
          label: 'Fold 5',
        },
      ],
      sampleProducts
    )
    const etaB = evaluateEtalase(
      {
        id: 'eta-b',
        storeId: 'store-roxy',
        name: 'Etalase Flagship Pilihan',
        coverProductId: 'prod-fold-5',
        priceMode: 'LOWEST',
      },
      [
        {
          id: 'i2',
          etalaseId: 'eta-b',
          productId: 'prod-fold-5',
          label: 'Galaxy Z Fold 5',
        },
        {
          id: 'i3',
          etalaseId: 'eta-b',
          productId: 'prod-flip-5',
          label: 'Galaxy Z Flip 5',
        },
      ],
      sampleProducts
    )

    expect(etaA.etalaseItems[0].productId).toBe('prod-fold-5')
    expect(etaB.etalaseItems[0].productId).toBe('prod-fold-5')
    expect(etaB.productCount).toBe(2)
    expect(
      generateShortProductLabel({
        name: 'Xiaomi Xiaomi 14 Ultra Leica #37',
        brand: 'Xiaomi',
      })
    ).toBe('Xiaomi 14 Ultra Leica')
  })

  it('4. Halaman Detail Desktop & Mobile merender pemilih Tipe & Memory ala Shopee dan menggunakan activeUnit saat masuk keranjang / beli sekarang', () => {
    const desktopDetail = fs.readFileSync(
      path.resolve('src/app/gadget/[id]/gadget-detail-client.tsx'),
      'utf8'
    )
    const mobileDetail = fs.readFileSync(
      path.resolve('src/components/gadget/shopee-mobile-product-detail.tsx'),
      'utf8'
    )

    expect(desktopDetail).toContain('Tipe &amp; Memory')
    expect(desktopDetail).toContain('handleSelectEtalaseItem')
    expect(desktopDetail).toContain('productId: activeUnit.id')
    expect(mobileDetail).toContain('Tipe &amp; Memory')
    expect(mobileDetail).toContain('onSelectEtalaseItem')
  })

  it('5. Menu Etalase Toko (/dashboard/admin/etalase) dan Katalog Gadget (/dashboard/admin/products) dipisah di Sidebar Admin', () => {
    const etalasePage = fs.readFileSync(
      path.resolve('src/app/dashboard/admin/etalase/page.tsx'),
      'utf8'
    )
    const sidebarContent = fs.readFileSync(
      path.resolve('src/components/dashboard/sidebar.tsx'),
      'utf8'
    )
    const modalContent = fs.readFileSync(
      path.resolve('src/components/admin/etalase-form-modal.tsx'),
      'utf8'
    )
    const apiRoute = fs.readFileSync(
      path.resolve('src/app/api/admin/etalase/[id]/route.ts'),
      'utf8'
    )

    expect(sidebarContent).toContain('/dashboard/admin/etalase')
    expect(sidebarContent).toContain('/dashboard/admin/products')
    expect(etalasePage).toContain('Etalase Toko')
    expect(etalasePage).toContain('Buat Etalase Baru')
    expect(etalasePage).toContain('handleSetEtalaseCoverProduct')
    expect(etalasePage).toContain('EtalaseFormModal')
    expect(modalContent).toContain('Otomatis Termurah')
    expect(modalContent).toContain('Ikut Barang Cover')
    expect(modalContent).toContain('Harga Sendiri')
    expect(modalContent).toContain('Upload Gambar Cover Sendiri')
    expect(apiRoute).toContain('resolveStoreScope')
  })
})
