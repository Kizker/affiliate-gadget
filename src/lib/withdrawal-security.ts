/**
 * Modul Keamanan Penarikan Saldo (Withdrawal Security Gate)
 * 1. Cooling-down period 1x24 jam setelah perubahan rekening bank
 * 2. Validasi kesesuaian nama pemilik rekening vs nama legal badan hukum (PT/CV)
 * 3. Tantangan OTP 2FA & verifikasi kredensial
 * 4. Rate limiting & audit logging
 */

export const WITHDRAWAL_COOLDOWN_HOURS = 24
export const WITHDRAWAL_OTP_MAX_PER_DAY = 3
export const WITHDRAWAL_RATE_LIMIT_PER_HOUR = 5

export interface CooldownStatus {
  isLocked: boolean
  remainingHours: number
  remainingMinutes: number
  remainingSeconds: number
  lockedUntil: string | null
}

/**
 * Memeriksa status cooling-down 24 jam rekening bank toko
 */
export function checkBankAccountCooldown(
  bankAccountUpdatedAt: Date | string | null | undefined,
  currentDate = new Date()
): CooldownStatus {
  if (!bankAccountUpdatedAt) {
    return {
      isLocked: false,
      remainingHours: 0,
      remainingMinutes: 0,
      remainingSeconds: 0,
      lockedUntil: null,
    }
  }

  const updatedAt =
    typeof bankAccountUpdatedAt === 'string'
      ? new Date(bankAccountUpdatedAt)
      : bankAccountUpdatedAt

  if (isNaN(updatedAt.getTime())) {
    return {
      isLocked: false,
      remainingHours: 0,
      remainingMinutes: 0,
      remainingSeconds: 0,
      lockedUntil: null,
    }
  }

  const cooldownMs = WITHDRAWAL_COOLDOWN_HOURS * 60 * 60 * 1000
  const elapsedMs = currentDate.getTime() - updatedAt.getTime()

  if (elapsedMs < cooldownMs) {
    const remainingMs = cooldownMs - elapsedMs
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60))
    const remainingMinutes = Math.floor(
      (remainingMs % (1000 * 60 * 60)) / (1000 * 60)
    )
    const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000)
    const lockedUntil = new Date(updatedAt.getTime() + cooldownMs).toISOString()

    return {
      isLocked: true,
      remainingHours,
      remainingMinutes,
      remainingSeconds,
      lockedUntil,
    }
  }

  return {
    isLocked: false,
    remainingHours: 0,
    remainingMinutes: 0,
    remainingSeconds: 0,
    lockedUntil: null,
  }
}

/**
 * Normalisasi nama perusahaan dan nama rekening:
 * - Menghapus prefix/suffix legalitas: PT, CV, UD, TBK, PERSERO, KOPERASI, FA, FIRMA
 * - Menghapus tanda baca, titik, koma, strip, kurung
 * - Lowercase & collapse spasi ganda
 */
export function normalizeLegalEntityName(name: string): string {
  if (!name) return ''

  return name
    .toLowerCase()
    .replace(/\b(pt|cv|ud|tbk|persero|koperasi|fa|firma)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Menghitung Levenshtein Distance antara dua string
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Menghitung skor kemiripan teks (0.0 sampai 1.0)
 * Menggabungkan token overlap (Jaccard) dan Levenshtein distance
 */
export function calculateNameSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeLegalEntityName(str1)
  const norm2 = normalizeLegalEntityName(str2)

  if (!norm1 || !norm2) return 0
  if (norm1 === norm2) return 1.0

  // 1. Cek apakah satu string mengandung string lainnya secara utuh
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length)
    const maxLen = Math.max(norm1.length, norm2.length)
    return Math.max(0.85, minLen / maxLen)
  }

  // 2. Token overlap (Jaccard similarity)
  const tokens1 = new Set(norm1.split(' ').filter(Boolean))
  const tokens2 = new Set(norm2.split(' ').filter(Boolean))

  const intersection = new Set([...tokens1].filter((t) => tokens2.has(t)))
  const union = new Set([...tokens1, ...tokens2])
  const jaccardScore = union.size > 0 ? intersection.size / union.size : 0

  // Jika semua kata penting cocok (misal "gadget jaya sentosa" vs "gadget jaya")
  if (intersection.size >= Math.min(tokens1.size, tokens2.size)) {
    return Math.max(0.8, jaccardScore)
  }

  // 3. Normalized Levenshtein similarity
  const maxLen = Math.max(norm1.length, norm2.length)
  const dist = levenshteinDistance(norm1, norm2)
  const levScore = maxLen > 0 ? (maxLen - dist) / maxLen : 0

  // Gabungkan skor dengan bobot
  return 0.5 * jaccardScore + 0.5 * levScore
}

export interface NameValidationResult {
  isValid: boolean
  reason?: string
  similarityScore: number
  bypassApplied: boolean
}

/**
 * Validasi kesesuaian nama rekening tujuan vs nama legal perusahaan toko
 */
export function validateAccountNameMatch(
  accountName: string,
  companyName: string,
  options?: {
    bypass?: boolean
    threshold?: number
  }
): NameValidationResult {
  const isBypass =
    options?.bypass ?? process.env.WITHDRAWAL_NAME_VALIDATION_BYPASS === 'true'

  if (isBypass) {
    return {
      isValid: true,
      reason:
        'Validasi nama dilewati oleh konfigurasi bypass (development/staging)',
      similarityScore: 1.0,
      bypassApplied: true,
    }
  }

  if (!accountName || !companyName) {
    return {
      isValid: false,
      reason:
        'Nama rekening bank tujuan atau nama perusahaan toko tidak boleh kosong',
      similarityScore: 0,
      bypassApplied: false,
    }
  }

  const score = calculateNameSimilarity(accountName, companyName)
  const threshold = options?.threshold ?? 0.7

  if (score >= threshold) {
    return {
      isValid: true,
      similarityScore: Math.round(score * 100) / 100,
      bypassApplied: false,
    }
  }

  return {
    isValid: false,
    reason: `Nama pemilik rekening "${accountName}" tidak sesuai dengan nama badan usaha toko "${companyName}" (Tingkat kemiripan ${Math.round(score * 100)}%, minimum ${Math.round(threshold * 100)}%). Rekening pencairan wajib atas nama PT/CV resmi.`,
    similarityScore: Math.round(score * 100) / 100,
    bypassApplied: false,
  }
}

/**
 * In-memory Sliding Window Rate Limiter untuk request penarikan saldo per userId
 * Maksimal 5 permintaan penarikan per jam
 */
interface RateLimitEntry {
  timestamps: number[]
}

const withdrawalRateLimitStore = new Map<string, RateLimitEntry>()

export function checkWithdrawalRateLimit(
  userId: string,
  limit = WITHDRAWAL_RATE_LIMIT_PER_HOUR,
  windowMs = 60 * 60 * 1000
): { allowed: boolean; remainingRequests: number; retryAfterSeconds?: number } {
  const now = Date.now()
  const windowStart = now - windowMs

  let entry = withdrawalRateLimitStore.get(userId)
  if (!entry) {
    entry = { timestamps: [] }
    withdrawalRateLimitStore.set(userId, entry)
  }

  // Bersihkan timestamp yang sudah di luar rentang jendela
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart)

  if (entry.timestamps.length >= limit) {
    const oldestTimestamp = entry.timestamps[0]
    const retryAfterMs = oldestTimestamp + windowMs - now
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))

    return {
      allowed: false,
      remainingRequests: 0,
      retryAfterSeconds,
    }
  }

  // Tambahkan timestamp saat ini
  entry.timestamps.push(now)

  return {
    allowed: true,
    remainingRequests: limit - entry.timestamps.length,
  }
}

export function resetWithdrawalRateLimit(userId?: string): void {
  if (userId) {
    withdrawalRateLimitStore.delete(userId)
  } else {
    withdrawalRateLimitStore.clear()
  }
}
