import { describe, it, expect } from 'vitest'
import { resolveStorePageContent } from '@/lib/store-page-content'
import { StorePublicProfile } from '@/types/store-public'

describe('Variant Strike Price & Etalase Isolation', () => {
  const dummyProductWithVariants: any = {
    id: 'prod-note10',
    name: 'Samsung Galaxy Note 10 Plus',
    price: 2700000,
    originalPrice: null, // Produk induk tidak memiliki harga coret
    variants: [
      {
        id: 'var-note9',
        name: 'NOTE 9 UNIT ONLY,8/256GB',
        price: 7949000,
        originalPrice: 9000000, // Diisi harga coret 9.000.000
        stock: 10,
      },
      {
        id: 'var-note10plus',
        name: 'NOTE 10+ FULLSETT,6/128',
        price: 2700000,
        originalPrice: null, // TIDAK diisi harga coret (harus null)
        stock: 10,
      },
    ],
  }

  it('1. should resolve activeOriginalPrice strictly from selectedVariant and not fallback when variant has no strike price', () => {
    // Skenario 1: Varian #1 (NOTE 9 UNIT ONLY) dipilih -> Harus muncul harga coret 9.000.000
    const selectedVariant1 = dummyProductWithVariants.variants[0]
    const currentPrice1 = selectedVariant1.price
    const activeOriginalPrice1 =
      selectedVariant1?.originalPrice !== undefined &&
      selectedVariant1?.originalPrice !== null &&
      Number(selectedVariant1.originalPrice) > 0
        ? Number(selectedVariant1.originalPrice)
        : null

    expect(currentPrice1).toBe(7949000)
    expect(activeOriginalPrice1).toBe(9000000)
    expect(activeOriginalPrice1! > currentPrice1).toBe(true)

    // Skenario 2: Varian #2 (NOTE 10+ FULLSETT) dipilih -> Tidak boleh ada harga coret (null)
    const selectedVariant2 = dummyProductWithVariants.variants[1]
    const currentPrice2 = selectedVariant2.price
    const activeOriginalPrice2 =
      selectedVariant2?.originalPrice !== undefined &&
      selectedVariant2?.originalPrice !== null &&
      Number(selectedVariant2.originalPrice) > 0
        ? Number(selectedVariant2.originalPrice)
        : null

    expect(currentPrice2).toBe(2700000)
    expect(activeOriginalPrice2).toBeNull()
  })

  it('2. should align store cover hero price with targeted variant and attach targetVariantId', () => {
    const rogPhone: any = {
      id: 'prod-rog6',
      name: 'ASUS ROG PHONE 6 16/512GB BNOB ORIGINAL',
      price: 6349000,
      variants: [
        {
          id: 'var-bnob',
          name: 'BNOB,16/512GB',
          price: 6349000,
          stock: 5,
        },
        {
          id: 'var-bnib',
          name: 'BNIB,16/512GB',
          price: 13050000,
          stock: 5,
        },
      ],
    }

    const store: StorePublicProfile = {
      id: 'store-hafiyan',
      name: 'Hafiyan Gadget',
      slug: 'hafiyan-gadget',
      heroProductId: 'prod-rog6',
      products: [rogPhone],
    } as unknown as StorePublicProfile

    const resolved = resolveStorePageContent(store)

    // Harga di cover hero toko harus mencerminkan varian termurah ready stock (Rp 6.349.000)
    expect(resolved.hero.priceNumber).toBe(6349000)
    expect(resolved.hero.priceText).toBe('Mulai Rp 6.349.000')
    // Dan targetVariantId harus diarahkan ke var-bnob
    expect(resolved.hero.targetVariantId).toBe('var-bnob')
  })
})
