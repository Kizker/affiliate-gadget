import {
  StoreProductPublic,
  StorePublicProfile,
  StoreSchedulePublic,
} from '@/types/store-public'

export const STORE_PAGE_DEFAULTS = {
  hero: {
    desktopImage: '/images/banners/samsung-hero-flagship.jpg',
    mobileImage: '/images/banners/samsung-mobile-hero.jpg',
    desktopKicker: 'Available now',
    mobileKicker: 'Galaxy AI is here',
    desktopTitle: 'Galaxy Z Fold8 | Fold8 | Flip8',
    mobileTitle: 'Galaxy Z Fold8 | Flip8',
    desktopDesc: (storeName: string) =>
      `Eksplorasi kemewahan smartphone lipat generasi terdepan di gerai resmi ${storeName}. Jaminan garansi 30 hari tukar unit baru & paket proteksi penuh kurir.`,
    mobileDesc: (storeName: string) =>
      `Generasi smartphone lipat paling canggih di gerai resmi ${storeName}. Jaminan garansi 30 hari tukar unit baru.`,
  },
  editorial1: {
    defaultImage: '/images/banners/samsung-campaign-banner.jpg',
    defaultKicker: 'Welcome the newest member to',
    defaultTitle: 'Galaxy S26 Series',
    defaultSubtitle: 'Galaxy AI',
    defaultDesc: (storeName: string) =>
      `Didukung prosesor AI cerdas, kamera ultra-presisi, dan baterai tahan seharian. Tersedia di gerai ${storeName} dengan jaminan ganti unit 30 hari.`,
    customKicker: 'Penawaran Eksklusif Cabang',
    customTitle: (storeName: string) => `Koleksi Pilihan Resmi ${storeName}`,
    customDesc:
      'Dapatkan keuntungan langsung belanja di toko resmi: Paket bonus Rp 0, asuransi penuh kurir JNE/Gojek, dan garansi ganti unit 30 hari.',
  },
  editorial2: {
    defaultImage: '/images/banners/samsung-vision-ai.jpg',
    defaultKicker: 'Samsung Vision AI',
    defaultTitle: 'Answering your passions',
    defaultDesc: (storeName: string) =>
      `Integrasi visual tanpa batas dan ekosistem tampilan pintar. Gerai ${storeName} juga melayani Servis Kilat LCD 2 Jam oleh teknisi tersertifikasi resmi.`,
    customTitle: (cityName: string) =>
      `Servis Kilat LCD 2 Jam • Hub ${cityName}`,
    customDesc: (storeName: string, cityName: string) =>
      `Layanan reparasi layar kilat bergaransi 30 hari di gerai resmi ${storeName}, ${cityName}. Dikerjakan teknisi berpengalaman dengan suku cadang teruji.`,
  },
  info: {
    defaultHours: '09:00 - 21:00 WIB',
    fallbackAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    fallbackProductImage:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
  },
} as const

export function sanitizeStoreImageUrl(
  url?: string | null,
  fallbackUrl: string = STORE_PAGE_DEFAULTS.info.fallbackProductImage
): string {
  if (!url || typeof url !== 'string') return fallbackUrl
  const trimmed = url.trim()
  if (
    trimmed === '' ||
    trimmed.includes('placeholder') ||
    trimmed.includes('unsplash.com/photo-1555529669')
  ) {
    return fallbackUrl
  }
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed
  }
  return fallbackUrl
}

export function selectTopFlagshipProduct(
  products?: StoreProductPublic[] | null
): StoreProductPublic | null {
  if (!products || products.length === 0) return null

  const candidates = [...products]
  candidates.sort((a, b) => {
    // 1. Promoted products first
    if (a.isPromoted && !b.isPromoted) return -1
    if (!a.isPromoted && b.isPromoted) return 1
    if (a.isPromoted && b.isPromoted) {
      const pDiff = (b.promotionPriority || 0) - (a.promotionPriority || 0)
      if (pDiff !== 0) return pDiff
    }

    // 2. High rating and review count
    const aScore = (a.rating || 0) * (a.totalReview || 1)
    const bScore = (b.rating || 0) * (b.totalReview || 1)
    if (bScore !== aScore) return bScore - aScore

    // 3. Flagship price (descending)
    return (b.price || 0) - (a.price || 0)
  })

  return candidates[0] || null
}

export interface OperatingHoursResult {
  text: string
  isOpenNow: boolean
  isSpecialSchedule: boolean
}

export function resolveStoreOperatingHours(
  schedules?: StoreSchedulePublic[] | null,
  checkDate?: Date
): OperatingHoursResult {
  if (!schedules || schedules.length === 0) {
    return {
      text: STORE_PAGE_DEFAULTS.info.defaultHours,
      isOpenNow: true,
      isSpecialSchedule: false,
    }
  }

  // Convert to WIB (UTC+7)
  const date = checkDate || new Date()
  const utc = date.getTime() + date.getTimezoneOffset() * 60000
  const wibDate = new Date(utc + 7 * 3600000)

  const dayNames = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ]
  const currentDay = dayNames[wibDate.getDay()]
  const hours = wibDate.getHours()
  const minutes = wibDate.getMinutes()
  const currentTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

  const todaySchedule = schedules.find(
    (s) => s.day?.toUpperCase() === currentDay
  )

  if (!todaySchedule) {
    // Fallback to first schedule or default
    const firstSched = schedules[0]
    if (firstSched?.openTime && firstSched?.closeTime) {
      return {
        text: `${firstSched.openTime} - ${firstSched.closeTime} WIB`,
        isOpenNow: true,
        isSpecialSchedule: true,
      }
    }
    return {
      text: STORE_PAGE_DEFAULTS.info.defaultHours,
      isOpenNow: true,
      isSpecialSchedule: false,
    }
  }

  if (todaySchedule.isClosed) {
    return {
      text: 'Tutup Hari Ini',
      isOpenNow: false,
      isSpecialSchedule: true,
    }
  }

  const isOpenNow =
    Boolean(todaySchedule.openTime && todaySchedule.closeTime) &&
    currentTimeStr >= todaySchedule.openTime &&
    currentTimeStr <= todaySchedule.closeTime

  return {
    text: `${todaySchedule.openTime} - ${todaySchedule.closeTime} WIB`,
    isOpenNow,
    isSpecialSchedule: true,
  }
}

export function buildStoreMapsUrl(
  latitude?: number | null,
  longitude?: number | null,
  address?: string | null,
  city?: string | null
): string | null {
  if (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    (latitude !== 0 || longitude !== 0)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  }

  if (address && typeof address === 'string' && address.trim() !== '') {
    const query = [address.trim(), city?.trim()].filter(Boolean).join(', ')
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }

  return null
}

export interface ResolvedStorePageContent {
  topFlagship: StoreProductPublic | null
  hero: {
    title: string
    kicker: string
    mobileKicker: string
    desktopDesc: string
    mobileDesc: string
    desktopImage: string
    mobileImage: string
    priceText: string | null
    priceNumber: number | null
  }
  editorial1: {
    hasCustomBanner: boolean
    imageUrl: string
    kicker: string
    title: string
    subtitle?: string
    description: string
  }
  editorial2: {
    imageUrl: string
    kicker: string
    title: string
    description: string
  }
  info: {
    operatingHoursText: string
    isOpenNow: boolean
    mapsUrl: string | null
    tagline: string | null
    description: string | null
  }
}

export function resolveStorePageContent(
  store: StorePublicProfile | null,
  checkDate?: Date
): ResolvedStorePageContent {
  const storeName = store?.name || 'Toko Resmi'
  const cityName = store?.city || 'Pusat'
  const topFlagship = selectTopFlagshipProduct(store?.products)

  // 1. Hero Content
  const heroDesktopImage = store?.heroImage
    ? sanitizeStoreImageUrl(
        store.heroImage,
        STORE_PAGE_DEFAULTS.hero.desktopImage
      )
    : STORE_PAGE_DEFAULTS.hero.desktopImage

  const heroMobileImage = store?.heroMobileImage
    ? sanitizeStoreImageUrl(store.heroMobileImage, heroDesktopImage)
    : store?.heroImage
      ? sanitizeStoreImageUrl(
          store.heroImage,
          STORE_PAGE_DEFAULTS.hero.mobileImage
        )
      : STORE_PAGE_DEFAULTS.hero.mobileImage

  const heroTitle =
    store?.heroTitle?.trim() ||
    topFlagship?.name ||
    STORE_PAGE_DEFAULTS.hero.desktopTitle

  const heroKicker =
    store?.heroSubtitle?.trim() ||
    (topFlagship?.brand
      ? `${topFlagship.brand.toUpperCase()} OFFICIAL`
      : STORE_PAGE_DEFAULTS.hero.desktopKicker)

  const heroMobileKicker =
    store?.heroSubtitle?.trim() ||
    (topFlagship?.brand
      ? `${topFlagship.brand.toUpperCase()} FLAGSHIP`
      : STORE_PAGE_DEFAULTS.hero.mobileKicker)

  const heroDesktopDesc =
    store?.heroDescription?.trim() ||
    (topFlagship
      ? `Dapatkan ${topFlagship.name} bergaransi resmi 30 hari ganti unit baru di ${storeName}. Dilengkapi paket proteksi kurir dan bonus aksesoris Rp 0.`
      : STORE_PAGE_DEFAULTS.hero.desktopDesc(storeName))

  const heroMobileDesc =
    store?.heroDescription?.trim() ||
    (topFlagship
      ? `Unit unggulan ${topFlagship.name} di gerai ${storeName}. Garansi 30 hari tukar unit baru.`
      : STORE_PAGE_DEFAULTS.hero.mobileDesc(storeName))

  const priceNumber = topFlagship?.price || null
  const priceText = priceNumber
    ? `Mulai Rp ${Number(priceNumber).toLocaleString('id-ID')}`
    : null

  // 2. Editorial 1 (Campaign Banner)
  const customBannerUrl = store?.banner
    ? sanitizeStoreImageUrl(store.banner, '')
    : ''
  const hasCustomBanner = Boolean(customBannerUrl)

  const ed1ImageUrl = hasCustomBanner
    ? customBannerUrl
    : STORE_PAGE_DEFAULTS.editorial1.defaultImage

  const defaultEd1Kicker = hasCustomBanner
    ? STORE_PAGE_DEFAULTS.editorial1.customKicker
    : STORE_PAGE_DEFAULTS.editorial1.defaultKicker

  const defaultEd1Title = hasCustomBanner
    ? STORE_PAGE_DEFAULTS.editorial1.customTitle(storeName)
    : STORE_PAGE_DEFAULTS.editorial1.defaultTitle

  const defaultEd1Subtitle = hasCustomBanner
    ? undefined
    : STORE_PAGE_DEFAULTS.editorial1.defaultSubtitle

  const defaultEd1Desc = hasCustomBanner
    ? STORE_PAGE_DEFAULTS.editorial1.customDesc
    : STORE_PAGE_DEFAULTS.editorial1.defaultDesc(storeName)

  const ed1Kicker = store?.campaignKicker?.trim() || defaultEd1Kicker
  const ed1Title = store?.campaignTitle?.trim() || defaultEd1Title
  const ed1Subtitle =
    store?.campaignSubtitle !== undefined
      ? store?.campaignSubtitle?.trim() || undefined
      : defaultEd1Subtitle
  const ed1Desc = store?.campaignDescription?.trim() || defaultEd1Desc

  // 3. Editorial 2 (Vision / Service Banner)
  const ed2ImageUrl = store?.secondaryBanner
    ? sanitizeStoreImageUrl(
        store.secondaryBanner,
        STORE_PAGE_DEFAULTS.editorial2.defaultImage
      )
    : STORE_PAGE_DEFAULTS.editorial2.defaultImage

  const ed2Kicker = STORE_PAGE_DEFAULTS.editorial2.defaultKicker
  const ed2Title =
    store?.secondaryBannerTitle?.trim() ||
    STORE_PAGE_DEFAULTS.editorial2.customTitle(cityName)
  const ed2Desc =
    store?.secondaryBannerDesc?.trim() ||
    STORE_PAGE_DEFAULTS.editorial2.customDesc(storeName, cityName)

  // 4. Store Info
  const operatingHours = resolveStoreOperatingHours(store?.schedules, checkDate)
  const mapsUrl = buildStoreMapsUrl(
    store?.latitude,
    store?.longitude,
    store?.address,
    store?.city
  )

  return {
    topFlagship,
    hero: {
      title: heroTitle,
      kicker: heroKicker,
      mobileKicker: heroMobileKicker,
      desktopDesc: heroDesktopDesc,
      mobileDesc: heroMobileDesc,
      desktopImage: heroDesktopImage,
      mobileImage: heroMobileImage,
      priceText,
      priceNumber,
    },
    editorial1: {
      hasCustomBanner,
      imageUrl: ed1ImageUrl,
      kicker: ed1Kicker,
      title: ed1Title,
      subtitle: ed1Subtitle,
      description: ed1Desc,
    },
    editorial2: {
      imageUrl: ed2ImageUrl,
      kicker: ed2Kicker,
      title: ed2Title,
      description: ed2Desc,
    },
    info: {
      operatingHoursText: operatingHours.text,
      isOpenNow: operatingHours.isOpenNow,
      mapsUrl,
      tagline: store?.tagline || null,
      description: store?.description || null,
    },
  }
}
