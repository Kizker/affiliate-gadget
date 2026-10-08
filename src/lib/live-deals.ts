import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export interface LiveDeal {
  id: string
  dealToken: string
  streamId: string
  productId: string
  productTitle?: string
  productImage?: string
  productSlug?: string
  originalPrice: number
  discountPrice: number
  dealType?: 'LIVE_FEATURED' | 'PINNED_DEAL'
  badgeLabel?: string
  isActive: boolean
  isUsed: boolean
  usedByUserId?: string | null
  orderId?: string | null
  createdAt: string
  usedAt?: string | null
}

const DEALS_FILE = path.join(process.cwd(), '.data', 'live-deals.json')

// In-memory cache for O(1) fast lookup
let dealsCache: Map<string, LiveDeal> | null = null

function ensureDataDirectory() {
  const dir = path.dirname(DEALS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function loadDeals(): Map<string, LiveDeal> {
  if (dealsCache) return dealsCache
  dealsCache = new Map<string, LiveDeal>()

  try {
    ensureDataDirectory()
    if (fs.existsSync(DEALS_FILE)) {
      const raw = fs.readFileSync(DEALS_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        for (const deal of parsed) {
          if (deal && deal.dealToken) {
            dealsCache.set(deal.dealToken, deal)
          }
        }
      }
    }
  } catch (err) {
    console.error('[LiveDeals] Error loading deals from file:', err)
  }

  return dealsCache
}

function saveDeals() {
  if (!dealsCache) return
  try {
    ensureDataDirectory()
    const arr = Array.from(dealsCache.values())
    fs.writeFileSync(DEALS_FILE, JSON.stringify(arr, null, 2), 'utf-8')
  } catch (err) {
    console.error('[LiveDeals] Error saving deals to file:', err)
  }
}

/**
 * Buat deal diskon khusus live baru saat setup siaran atau saat host menyematkan produk
 */
export function createLiveDeal(params: {
  streamId: string
  productId: string
  productTitle?: string
  productImage?: string
  productSlug?: string
  originalPrice: number
  discountPrice: number
  dealType?: 'LIVE_FEATURED' | 'PINNED_DEAL'
  badgeLabel?: string
}): LiveDeal {
  const deals = loadDeals()
  const dealType = params.dealType || 'PINNED_DEAL'

  // Nonaktifkan deal sebelumnya dengan tipe yang sama untuk produk ini pada stream ini
  for (const existing of deals.values()) {
    if (
      existing.streamId === params.streamId &&
      existing.productId === params.productId &&
      (existing.dealType || 'PINNED_DEAL') === dealType &&
      existing.isActive
    ) {
      existing.isActive = false
    }
  }

  const dealToken = `deal_${dealType === 'PINNED_DEAL' ? 'pin_' : 'live_'}${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`
  const newDeal: LiveDeal = {
    id: `deal-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    dealToken,
    streamId: params.streamId,
    productId: params.productId,
    productTitle: params.productTitle,
    productImage: params.productImage,
    productSlug: params.productSlug,
    originalPrice: params.originalPrice,
    discountPrice: params.discountPrice,
    dealType,
    badgeLabel:
      params.badgeLabel ||
      (dealType === 'PINNED_DEAL'
        ? 'Diskon Spesial Sematan Live'
        : 'Diskon Khusus Siaran Live'),
    isActive: true,
    isUsed: false,
    usedByUserId: null,
    orderId: null,
    createdAt: new Date().toISOString(),
    usedAt: null,
  }

  deals.set(dealToken, newDeal)
  saveDeals()
  return newDeal
}

/**
 * Nonaktifkan deal saat host melepas sematan produk atau mengakhiri sesi live
 */
export function deactivateStreamDeals(
  streamId: string,
  productId?: string,
  dealType?: 'LIVE_FEATURED' | 'PINNED_DEAL'
) {
  const deals = loadDeals()
  let changed = false

  for (const deal of deals.values()) {
    if (deal.streamId === streamId && deal.isActive) {
      if (!productId || deal.productId === productId) {
        if (!dealType || deal.dealType === dealType) {
          deal.isActive = false
          changed = true
        }
      }
    }
  }

  if (changed) {
    saveDeals()
  }
}

/**
 * Verifikasi apakah token deal diskon live masih valid & bisa digunakan
 */
export function verifyDealToken(dealToken: string): {
  valid: boolean
  deal?: LiveDeal
  reason?: 'NOT_FOUND' | 'USED' | 'INACTIVE'
} {
  if (!dealToken) return { valid: false, reason: 'NOT_FOUND' }
  const deals = loadDeals()
  const deal = deals.get(dealToken)

  if (!deal) {
    return { valid: false, reason: 'NOT_FOUND' }
  }

  // Jika token sudah pernah digunakan untuk checkout sebelumnya
  if (deal.isUsed) {
    return { valid: false, reason: 'USED', deal }
  }

  // Jika produk sudah dilepas sematannya oleh host siaran
  if (!deal.isActive) {
    return { valid: false, reason: 'INACTIVE', deal }
  }

  return { valid: true, deal }
}

/**
 * Konsumsi/tandai token diskon live sebagai terpakai setelah order checkout berhasil dibuat & dibayar
 * Setelah fungsi ini dipanggil, token deal tidak akan pernah bisa dipakai lagi.
 */
export function consumeDealToken(
  dealToken: string,
  orderId: string,
  userId?: string | null
): boolean {
  if (!dealToken) return false
  const deals = loadDeals()
  const deal = deals.get(dealToken)

  if (!deal) return false
  if (deal.isUsed) return false // Sudah pernah dipakai sebelumnya

  deal.isUsed = true
  deal.isActive = false
  deal.orderId = orderId
  deal.usedByUserId = userId || null
  deal.usedAt = new Date().toISOString()

  saveDeals()
  return true
}

/**
 * Dapatkan semua deal aktif saat ini untuk live stream tertentu
 */
export function getActiveDealsForStream(streamId: string): LiveDeal[] {
  const deals = loadDeals()
  const list: LiveDeal[] = []
  for (const deal of deals.values()) {
    if (deal.streamId === streamId && deal.isActive && !deal.isUsed) {
      list.push(deal)
    }
  }
  return list
}

/**
 * Dapatkan deal aktif saat ini untuk live stream tertentu (opsional berdasarkan productId dan dealType)
 */
export function getActiveDealForStream(
  streamId: string,
  productId?: string,
  preferredType?: 'PINNED_DEAL' | 'LIVE_FEATURED'
): LiveDeal | null {
  const deals = loadDeals()
  let fallback: LiveDeal | null = null

  for (const deal of deals.values()) {
    if (
      deal.streamId === streamId &&
      deal.isActive &&
      !deal.isUsed &&
      (!productId || deal.productId === productId)
    ) {
      if (preferredType) {
        if (deal.dealType === preferredType) return deal
      } else {
        // Prioritas ke PINNED_DEAL jika produk sedang disematkan
        if (deal.dealType === 'PINNED_DEAL') return deal
        if (!fallback) fallback = deal
      }
    }
  }
  return fallback
}

/**
 * Cek apakah user sudah pernah memakai diskon live stream tertentu (kebijakan 1x checkout)
 */
export function hasUserUsedStreamDeal(
  userId: string,
  streamId: string,
  productId?: string
): boolean {
  if (!userId) return false
  const deals = loadDeals()
  for (const deal of deals.values()) {
    if (
      deal.streamId === streamId &&
      deal.usedByUserId === userId &&
      deal.isUsed &&
      (!productId || deal.productId === productId)
    ) {
      return true
    }
  }
  return false
}
