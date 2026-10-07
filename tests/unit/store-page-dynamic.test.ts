import { describe, it, expect } from 'vitest'
import {
  selectTopFlagshipProduct,
  resolveStoreOperatingHours,
  buildStoreMapsUrl,
  sanitizeStoreImageUrl,
  resolveStorePageContent,
  STORE_PAGE_DEFAULTS,
} from '@/lib/store-page-content'
import { StorePublicProfile, StoreProductPublic } from '@/types/store-public'

describe('Store Page Dynamic Content Resolution', () => {
  it('should return complete default fallbacks when store is empty or null', () => {
    const resolved = resolveStorePageContent(null)

    expect(resolved.topFlagship).toBeNull()
    expect(resolved.hero.title).toBe(STORE_PAGE_DEFAULTS.hero.desktopTitle)
    expect(resolved.hero.kicker).toBe(STORE_PAGE_DEFAULTS.hero.desktopKicker)
    expect(resolved.hero.priceText).toBeNull()
    expect(resolved.hero.priceNumber).toBeNull()
    expect(resolved.editorial1.hasCustomBanner).toBe(false)
    expect(resolved.editorial1.imageUrl).toBe(
      STORE_PAGE_DEFAULTS.editorial1.defaultImage
    )
    expect(resolved.info.operatingHoursText).toBe(
      STORE_PAGE_DEFAULTS.info.defaultHours
    )
    expect(resolved.info.mapsUrl).toBeNull()
  })

  it('should deterministically prioritize promoted products as top flagship', () => {
    const mockProducts: StoreProductPublic[] = [
      {
        id: 'prod-1',
        name: 'Xiaomi 13T',
        brand: 'Xiaomi',
        category: 'Smartphone',
        price: 6499000,
        stock: 10,
        images: ['https://example.com/xiaomi.jpg'],
        rating: 4.8,
        totalReview: 20,
        isPromoted: false,
        variants: [],
      },
      {
        id: 'prod-2',
        name: 'iPhone 15 Pro Max 256GB',
        brand: 'Apple',
        category: 'Smartphone',
        price: 22999000,
        stock: 5,
        images: ['https://example.com/ip15pm.jpg'],
        rating: 5.0,
        totalReview: 50,
        isPromoted: true,
        promotionPriority: 10,
        variants: [],
      },
      {
        id: 'prod-3',
        name: 'Galaxy S24 Ultra 512GB',
        brand: 'Samsung',
        category: 'Smartphone',
        price: 21999000,
        stock: 8,
        images: ['https://example.com/s24u.jpg'],
        rating: 4.9,
        totalReview: 30,
        isPromoted: true,
        promotionPriority: 5,
        variants: [],
      },
    ]

    const selected = selectTopFlagshipProduct(mockProducts)
    expect(selected?.id).toBe('prod-2')
    expect(selected?.name).toBe('iPhone 15 Pro Max 256GB')
  })

  it('should adapt hero title, kicker, and pricing dynamically for Apple-oriented store', () => {
    const mockStore: StorePublicProfile = {
      id: 'store-bec',
      name: 'Affiliate Gadget BEC Bandung',
      slug: 'affiliate-gadget-bec-bandung',
      companyName: 'PT Digital Niaga Prima',
      taxId: '01.234.567.8-429.000',
      tagline: 'Pusat iPhone & iPad Terlengkap Bandung',
      description: 'Gerai resmi unit second garansi 30 hari di BEC Mall.',
      logo: 'https://example.com/bec-logo.jpg',
      banner: null,
      address: 'Bandung Electronic Center Lt. 1 Blok C-08',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40117',
      latitude: -6.90389,
      longitude: 107.61056,
      phone: '0224201234',
      whatsapp: '081234567890',
      email: 'bec@affiliategadget.com',
      rating: 4.9,
      totalReview: 180,
      totalSales: 450,
      isActive: true,
      schedules: [
        {
          id: 's-1',
          day: 'MONDAY',
          openTime: '10:00',
          closeTime: '21:00',
          isClosed: false,
        },
      ],
      products: [
        {
          id: 'p-apple',
          name: 'iPhone 15 Pro 128GB Natural Titanium',
          brand: 'Apple',
          category: 'Smartphone',
          price: 18499000,
          stock: 3,
          images: ['https://example.com/ip15p.jpg'],
          rating: 5.0,
          totalReview: 12,
          isPromoted: true,
          variants: [],
        },
      ],
    }

    const resolved = resolveStorePageContent(mockStore)

    // Hero title adapts to product
    expect(resolved.hero.title).toBe('iPhone 15 Pro 128GB Natural Titanium')
    expect(resolved.hero.kicker).toBe('APPLE OFFICIAL')
    expect(resolved.hero.priceNumber).toBe(18499000)
    expect(resolved.hero.priceText).toBe('Mulai Rp 18.499.000')

    // Maps URL generated correctly from lat/lng
    expect(resolved.info.mapsUrl).toBe(
      'https://www.google.com/maps/search/?api=1&query=-6.90389,107.61056'
    )
    expect(resolved.info.tagline).toBe('Pusat iPhone & iPad Terlengkap Bandung')
    expect(resolved.info.description).toBe(
      'Gerai resmi unit second garansi 30 hari di BEC Mall.'
    )
  })

  it('should fallback maps URL to address query when lat/long are missing or zero', () => {
    const urlFromCoords = buildStoreMapsUrl(-6.2, 106.81, 'Roxy Mas', 'Jakarta')
    expect(urlFromCoords).toBe(
      'https://www.google.com/maps/search/?api=1&query=-6.2,106.81'
    )

    const urlFromAddress = buildStoreMapsUrl(
      null,
      null,
      'ITC Roxy Mas Lt. 2 No. 15',
      'Jakarta Pusat'
    )
    expect(urlFromAddress).toBe(
      'https://www.google.com/maps/search/?api=1&query=ITC%20Roxy%20Mas%20Lt.%202%20No.%2015%2C%20Jakarta%20Pusat'
    )

    const urlEmpty = buildStoreMapsUrl(null, null, '', null)
    expect(urlEmpty).toBeNull()
  })

  it('should correctly sanitize image URLs and filter placeholders', () => {
    expect(sanitizeStoreImageUrl('/images/banners/custom.jpg')).toBe(
      '/images/banners/custom.jpg'
    )
    expect(sanitizeStoreImageUrl('https://cdn.example.com/banner.png')).toBe(
      'https://cdn.example.com/banner.png'
    )
    expect(
      sanitizeStoreImageUrl(
        'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a'
      )
    ).toBe(STORE_PAGE_DEFAULTS.info.fallbackProductImage)
    expect(sanitizeStoreImageUrl('placeholder-image.jpg')).toBe(
      STORE_PAGE_DEFAULTS.info.fallbackProductImage
    )
    expect(sanitizeStoreImageUrl(null)).toBe(
      STORE_PAGE_DEFAULTS.info.fallbackProductImage
    )
  })

  it('should parse store operating hours in WIB timezone accurately', () => {
    // Test on fixed Wednesday 14:00 WIB
    const fixedWednesdayWib = new Date('2026-10-07T07:00:00Z') // 07:00 UTC = 14:00 WIB (Wednesday)

    const schedules = [
      {
        id: 's-wed',
        day: 'WEDNESDAY',
        openTime: '10:00',
        closeTime: '20:30',
        isClosed: false,
      },
      {
        id: 's-sun',
        day: 'SUNDAY',
        openTime: '10:00',
        closeTime: '18:00',
        isClosed: true,
      },
    ]

    const resultOpen = resolveStoreOperatingHours(schedules, fixedWednesdayWib)
    expect(resultOpen.text).toBe('10:00 - 20:30 WIB')
    expect(resultOpen.isOpenNow).toBe(true)

    // Test on fixed Sunday
    const fixedSundayWib = new Date('2026-10-11T07:00:00Z')
    const resultClosed = resolveStoreOperatingHours(schedules, fixedSundayWib)
    expect(resultClosed.text).toBe('Tutup Hari Ini')
    expect(resultClosed.isOpenNow).toBe(false)
  })

  it('should prioritize store custom hero images and custom hero copywriting over auto-fallbacks', () => {
    const customHeroStore: StorePublicProfile = {
      id: 'store-custom',
      name: 'Affiliate Gadget Roxy Mas',
      slug: 'affiliate-gadget-roxy-mas',
      companyName: 'PT Gadget Jaya Sentosa',
      taxId: '01.428.910.4-015.000',
      tagline: 'Pusat Flagship & Servis Kilat',
      description: 'Gerai resmi terpercaya.',
      logo: 'https://example.com/logo.jpg',
      banner: 'https://example.com/custom-campaign.jpg',
      heroImage: 'https://example.com/custom-hero-desktop.jpg',
      heroMobileImage: 'https://example.com/custom-hero-mobile.jpg',
      heroTitle: 'Spesial Promo iPhone 16 Series',
      heroSubtitle: 'LIMITED EDITION LAUNCH',
      heroDescription: 'Nikmati ekstra cashback dan proteksi kurir terjamin.',
      address: 'ITC Roxy Mas',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10150',
      latitude: -6.1628,
      longitude: 106.8048,
      phone: '02112345678',
      whatsapp: '081234567890',
      email: 'roxy@affiliategadget.com',
      rating: 5.0,
      totalReview: 100,
      totalSales: 200,
      isActive: true,
      schedules: [],
      products: [],
    }

    const resolved = resolveStorePageContent(customHeroStore)

    expect(resolved.hero.desktopImage).toBe(
      'https://example.com/custom-hero-desktop.jpg'
    )
    expect(resolved.hero.mobileImage).toBe(
      'https://example.com/custom-hero-mobile.jpg'
    )
    expect(resolved.hero.title).toBe('Spesial Promo iPhone 16 Series')
    expect(resolved.hero.kicker).toBe('LIMITED EDITION LAUNCH')
    expect(resolved.hero.mobileKicker).toBe('LIMITED EDITION LAUNCH')
    expect(resolved.hero.desktopDesc).toBe(
      'Nikmati ekstra cashback dan proteksi kurir terjamin.'
    )
  })

  it('should handle custom campaign and secondary service banner customizations', () => {
    const customPromoStore: StorePublicProfile = {
      id: 'store-promo',
      name: 'Affiliate Gadget WTC Surabaya',
      slug: 'affiliate-gadget-wtc-surabaya',
      companyName: 'PT Sinar Gadget Nusantara',
      taxId: null,
      tagline: null,
      description: null,
      logo: null,
      banner: 'https://example.com/campaign-wtc.jpg',
      campaignKicker: 'SUPER DEALS JATIM',
      campaignTitle: 'Cuci Gudang Flagship 2026',
      campaignSubtitle: 'Gratis Antar Gojek Instant',
      campaignDescription:
        'Belanja aman dan terproteksi di pusat gadget terlengkap Surabaya.',
      secondaryBanner: 'https://example.com/service-wtc.jpg',
      secondaryBannerTitle: 'Servis LCD Kilat 2 Jam Surabaya Timur',
      secondaryBannerDesc:
        'Layar OEM & Original OLED siap pasang dengan teknisi bersertifikat.',
      address: 'WTC Surabaya Lt. 2',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postalCode: null,
      latitude: null,
      longitude: null,
      phone: '0311234567',
      whatsapp: null,
      email: null,
      rating: 4.8,
      totalReview: 40,
      totalSales: 90,
      isActive: true,
      schedules: [],
      products: [],
    }

    const resolved = resolveStorePageContent(customPromoStore)

    expect(resolved.editorial1.imageUrl).toBe(
      'https://example.com/campaign-wtc.jpg'
    )
    expect(resolved.editorial1.kicker).toBe('SUPER DEALS JATIM')
    expect(resolved.editorial1.title).toBe('Cuci Gudang Flagship 2026')
    expect(resolved.editorial1.subtitle).toBe('Gratis Antar Gojek Instant')
    expect(resolved.editorial1.description).toBe(
      'Belanja aman dan terproteksi di pusat gadget terlengkap Surabaya.'
    )

    expect(resolved.editorial2.imageUrl).toBe(
      'https://example.com/service-wtc.jpg'
    )
    expect(resolved.editorial2.title).toBe(
      'Servis LCD Kilat 2 Jam Surabaya Timur'
    )
    expect(resolved.editorial2.description).toBe(
      'Layar OEM & Original OLED siap pasang dengan teknisi bersertifikat.'
    )
  })
})
