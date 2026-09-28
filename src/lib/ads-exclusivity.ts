import prisma from '@/lib/db'

export interface ActiveLevel1AdInfo {
  id: string
  title: string
  subtitle?: string | null
  bannerUrl: string
  startDate: Date
  endDate: Date | null
  store?: {
    id: string
    name: string
    city?: string | null
    slug: string
  } | null
  remainingDays: number
  remainingText: string
  isExpired: boolean
}

/**
 * Memeriksa apakah ada iklan Level 1 (HOMEPAGE_HERO) yang sedang aktif di seluruh platform.
 * Level 1 bersifat eksklusif: hanya 1 iklan yang boleh aktif pada satu waktu.
 */
export async function getActiveLevel1Ad(
  excludeAdId?: string
): Promise<ActiveLevel1AdInfo | null> {
  const now = new Date()

  // Cari iklan HOMEPAGE_HERO yang disetujui, aktif, dan belum kedaluwarsa
  const activeAd = await prisma.internalAd.findFirst({
    where: {
      placement: 'HOMEPAGE_HERO',
      status: 'APPROVED',
      isActive: true,
      ...(excludeAdId ? { id: { not: excludeAdId } } : {}),
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          city: true,
          slug: true,
        },
      },
    },
    orderBy: [{ priority: 'desc' }, { startDate: 'desc' }],
  })

  if (!activeAd) return null

  // Hitung sisa waktu
  let remainingDays = 0
  let remainingText = 'Aktif Tanpa Batas'
  let isExpired = false

  if (activeAd.endDate) {
    const diffMs = activeAd.endDate.getTime() - now.getTime()
    if (diffMs <= 0) {
      isExpired = true
      remainingDays = 0
      remainingText = 'Telah Kedaluwarsa'
    } else {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      )
      remainingDays = days
      remainingText =
        days > 0 ? `${days} hari ${hours} jam lagi` : `${hours} jam lagi`
    }
  }

  return {
    id: activeAd.id,
    title: activeAd.title,
    subtitle: activeAd.subtitle,
    bannerUrl: activeAd.bannerUrl,
    startDate: activeAd.startDate,
    endDate: activeAd.endDate,
    store: activeAd.store,
    remainingDays,
    remainingText,
    isExpired,
  }
}

/**
 * Validasi apakah iklan Level 1 boleh diaktifkan atau disetujui.
 * Mengembalikan objek status dan pesan penolakan jika slot sudah terisi.
 */
export async function validateLevel1Exclusivity(targetAdId?: string): Promise<{
  allowed: boolean
  message?: string
  currentActive?: ActiveLevel1AdInfo | null
}> {
  const currentActive = await getActiveLevel1Ad(targetAdId)

  if (!currentActive || currentActive.isExpired) {
    return { allowed: true }
  }

  const storeLabel = currentActive.store?.name
    ? `"${currentActive.store.name}"`
    : 'toko lain'
  const endFormatted = currentActive.endDate
    ? new Date(currentActive.endDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'batas waktu aktif'

  return {
    allowed: false,
    currentActive,
    message: `Slot Level 1 (Hero Carousel Mobile) bersifat eksklusif (hanya 1 iklan aktif). Saat ini sedang digunakan oleh iklan "${currentActive.title}" (${storeLabel}) hingga ${endFormatted} (${currentActive.remainingText}). Harap tunggu hingga iklan tersebut kedaluwarsa atau nonaktifkan terlebih dahulu sebelum mengaktifkan iklan ini.`,
  }
}
