import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  checkBankAccountCooldown,
  normalizeLegalEntityName,
  calculateNameSimilarity,
  validateAccountNameMatch,
  checkWithdrawalRateLimit,
  resetWithdrawalRateLimit,
  WITHDRAWAL_COOLDOWN_HOURS,
} from '@/lib/withdrawal-security'

describe('Modul Keamanan Penarikan Saldo — Unit Tests', () => {
  beforeEach(() => {
    resetWithdrawalRateLimit()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Fase 2: Cooling-down Period 24 Jam', () => {
    it('harus mengizinkan penarikan jika bankAccountUpdatedAt bernilai null (toko belum pernah ubah rekening)', () => {
      const result = checkBankAccountCooldown(null)
      expect(result.isLocked).toBe(false)
      expect(result.remainingHours).toBe(0)
      expect(result.remainingMinutes).toBe(0)
      expect(result.lockedUntil).toBeNull()
    })

    it('harus mengizinkan penarikan jika bankAccountUpdatedAt bernilai undefined', () => {
      const result = checkBankAccountCooldown(undefined)
      expect(result.isLocked).toBe(false)
      expect(result.lockedUntil).toBeNull()
    })

    it('harus menolak penarikan dan mengunci jika rekening baru diubah 2 jam lalu', () => {
      const now = new Date('2026-09-25T14:00:00.000Z')
      const twoHoursAgo = new Date('2026-09-25T12:00:00.000Z')

      const result = checkBankAccountCooldown(twoHoursAgo, now)
      expect(result.isLocked).toBe(true)
      expect(result.remainingHours).toBe(22)
      expect(result.remainingMinutes).toBe(0)
      expect(result.lockedUntil).toBe(
        new Date(twoHoursAgo.getTime() + 24 * 3600 * 1000).toISOString()
      )
    })

    it('harus menghitung sisa jam dan menit secara presisi (misal: 3 jam 45 menit lalu)', () => {
      const now = new Date('2026-09-25T14:00:00.000Z')
      // 3 jam 45 menit lalu = 20 jam 15 menit tersisa
      const updatedAt = new Date(now.getTime() - (3 * 3600 + 45 * 60) * 1000)

      const result = checkBankAccountCooldown(updatedAt, now)
      expect(result.isLocked).toBe(true)
      expect(result.remainingHours).toBe(20)
      expect(result.remainingMinutes).toBe(15)
    })

    it('harus mengizinkan penarikan jika rekening diubah lebih dari 24 jam lalu (25 jam lalu)', () => {
      const now = new Date('2026-09-25T14:00:00.000Z')
      const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 3600 * 1000)

      const result = checkBankAccountCooldown(twentyFiveHoursAgo, now)
      expect(result.isLocked).toBe(false)
      expect(result.remainingHours).toBe(0)
      expect(result.remainingMinutes).toBe(0)
      expect(result.lockedUntil).toBeNull()
    })

    it('harus mengizinkan penarikan tepat pada batas 24 jam (edge case)', () => {
      const now = new Date('2026-09-25T14:00:00.000Z')
      const exact24HoursAgo = new Date(now.getTime() - 24 * 3600 * 1000)

      const result = checkBankAccountCooldown(exact24HoursAgo, now)
      expect(result.isLocked).toBe(false)
    })

    it('harus menangani format string ISO tanggal dengan benar', () => {
      const now = new Date('2026-09-25T14:00:00.000Z')
      const oneHourAgoStr = new Date(now.getTime() - 3600 * 1000).toISOString()

      const result = checkBankAccountCooldown(oneHourAgoStr, now)
      expect(result.isLocked).toBe(true)
      expect(result.remainingHours).toBe(23)
    })
  })

  describe('Fase 3: Validasi Kesesuaian Nama Pemilik Rekening vs Badan Hukum', () => {
    it('harus menormalisasi nama badan usaha dengan menghapus PT/CV/UD dan simbol', () => {
      expect(normalizeLegalEntityName('PT. Gadget Jaya Sentosa, Tbk.')).toBe(
        'gadget jaya sentosa'
      )
      expect(normalizeLegalEntityName('CV SINAR GADGET NUSANTARA')).toBe(
        'sinar gadget nusantara'
      )
      expect(normalizeLegalEntityName('UD. Mega Ponsel (Cabang Jogja)')).toBe(
        'mega ponsel cabang jogja'
      )
    })

    it('harus meloloskan validasi jika nama sama persis', () => {
      const res = validateAccountNameMatch(
        'PT Gadget Jaya Sentosa',
        'PT Gadget Jaya Sentosa'
      )
      expect(res.isValid).toBe(true)
      expect(res.similarityScore).toBe(1.0)
    })

    it('harus meloloskan validasi meski kapitalisasi atau format legalitas berbeda', () => {
      const res = validateAccountNameMatch(
        'gadget jaya sentosa',
        'PT. GADGET JAYA SENTOSA, TBK.'
      )
      expect(res.isValid).toBe(true)
      expect(res.similarityScore).toBeGreaterThanOrEqual(0.85)
    })

    it('harus meloloskan validasi jika nama rekening mengandung nama legal inti', () => {
      const res = validateAccountNameMatch(
        'PT Gadget Jaya Sentosa Pusat',
        'PT Gadget Jaya Sentosa'
      )
      expect(res.isValid).toBe(true)
      expect(res.similarityScore).toBeGreaterThanOrEqual(0.7)
    })

    it('harus menolak validasi jika nama rekening berbeda jauh (indikasi rekening pribadi pihak ketiga)', () => {
      const res = validateAccountNameMatch(
        'Budi Santoso Pribadi',
        'PT Gadget Jaya Sentosa'
      )
      expect(res.isValid).toBe(false)
      expect(res.similarityScore).toBeLessThan(0.4)
      expect(res.reason).toContain('tidak sesuai')
    })

    it('harus meloloskan validasi jika mode bypass diaktifkan lewat argumen', () => {
      const res = validateAccountNameMatch(
        'Rekening Asing',
        'PT Gadget Jaya Sentosa',
        { bypass: true }
      )
      expect(res.isValid).toBe(true)
      expect(res.bypassApplied).toBe(true)
    })

    it('harus meloloskan validasi jika mode bypass diaktifkan via environment variable', () => {
      vi.stubEnv('WITHDRAWAL_NAME_VALIDATION_BYPASS', 'true')

      const res = validateAccountNameMatch(
        'Rekening Random Apapun',
        'PT Gadget Jaya Sentosa'
      )
      expect(res.isValid).toBe(true)
      expect(res.bypassApplied).toBe(true)
    })

    it('harus menolak jika nama rekening atau nama badan hukum kosong', () => {
      const res = validateAccountNameMatch('', 'PT Gadget Jaya Sentosa')
      expect(res.isValid).toBe(false)
      expect(res.reason).toContain('tidak boleh kosong')
    })
  })

  describe('Fase 7: Rate Limiting Permintaan Penarikan Saldo', () => {
    it('harus mengizinkan hingga batas maksimal permintaan (5x per jam)', () => {
      const userId = 'user_admin_roxy_123'

      for (let i = 0; i < 5; i++) {
        const check = checkWithdrawalRateLimit(userId, 5, 3600000)
        expect(check.allowed).toBe(true)
        expect(check.remainingRequests).toBe(4 - i)
      }

      // Permintaan ke-6 harus ditolak 429
      const blocked = checkWithdrawalRateLimit(userId, 5, 3600000)
      expect(blocked.allowed).toBe(false)
      expect(blocked.remainingRequests).toBe(0)
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    })

    it('harus mengisolasi rate limit antar userId yang berbeda', () => {
      const userA = 'user_a'
      const userB = 'user_b'

      // userA habiskan quota
      for (let i = 0; i < 5; i++) {
        checkWithdrawalRateLimit(userA, 5, 3600000)
      }
      expect(checkWithdrawalRateLimit(userA, 5, 3600000).allowed).toBe(false)

      // userB masih memiliki quota penuh
      const checkB = checkWithdrawalRateLimit(userB, 5, 3600000)
      expect(checkB.allowed).toBe(true)
      expect(checkB.remainingRequests).toBe(4)
    })
  })
})
