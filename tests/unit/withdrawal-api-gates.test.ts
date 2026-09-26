import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  checkBankAccountCooldown,
  validateAccountNameMatch,
  checkWithdrawalRateLimit,
  resetWithdrawalRateLimit,
} from '@/lib/withdrawal-security'
import {
  withdrawalConfirmationEmailTemplate,
  withdrawalSecurityAlertEmailTemplate,
} from '@/lib/notifications'

describe('Withdrawal Security Gates & Flow Verification (Fase 2, 3, 4, 7)', () => {
  beforeEach(() => {
    resetWithdrawalRateLimit()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Gate 1: Cooling-down 24 Jam', () => {
    it('harus memblokir penarikan jika rekening baru diperbarui 10 menit lalu', () => {
      const now = new Date('2026-09-25T15:00:00Z')
      const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000)

      const status = checkBankAccountCooldown(tenMinsAgo, now)
      expect(status.isLocked).toBe(true)
      expect(status.remainingHours).toBe(23)
      expect(status.remainingMinutes).toBe(50)
      expect(status.lockedUntil).toBeDefined()
    })

    it('harus meloloskan penarikan jika rekening diperbarui 24 jam 1 menit lalu', () => {
      const now = new Date('2026-09-25T15:00:00Z')
      const past24Hours = new Date(now.getTime() - (24 * 60 + 1) * 60 * 1000)

      const status = checkBankAccountCooldown(past24Hours, now)
      expect(status.isLocked).toBe(false)
      expect(status.lockedUntil).toBeNull()
    })
  })

  describe('Gate 2: Validasi Nama Pemilik Rekening vs Badan Hukum PT', () => {
    it('harus menerima nama rekening resmi dengan format legal PT standar', () => {
      const res = validateAccountNameMatch(
        'PT. GADGET JAYA SENTOSA',
        'PT Gadget Jaya Sentosa'
      )
      expect(res.isValid).toBe(true)
      expect(res.similarityScore).toBe(1.0)
    })

    it('harus menerima variasi penulisan CV / unit usaha', () => {
      const res = validateAccountNameMatch(
        'CV Sinar Gadget Nusantara',
        'Sinar Gadget Nusantara'
      )
      expect(res.isValid).toBe(true)
      expect(res.similarityScore).toBeGreaterThanOrEqual(0.85)
    })

    it('harus menolak penarikan jika rekening bank atas nama perorangan yang tidak cocok', () => {
      const res = validateAccountNameMatch(
        'Joko Widodo Pribadi',
        'PT Digital Niaga Prima'
      )
      expect(res.isValid).toBe(false)
      expect(res.similarityScore).toBeLessThan(0.3)
      expect(res.reason).toContain('tidak sesuai dengan nama badan usaha')
    })

    it('harus mengizinkan bypass jika environment variable WITHDRAWAL_NAME_VALIDATION_BYPASS=true', () => {
      vi.stubEnv('WITHDRAWAL_NAME_VALIDATION_BYPASS', 'true')
      const res = validateAccountNameMatch(
        'Bambang Susanto',
        'PT Surya Makmur Gadget'
      )
      expect(res.isValid).toBe(true)
      expect(res.bypassApplied).toBe(true)
    })
  })

  describe('Gate 3: Rate Limiting & Keamanan Penarikan', () => {
    it('harus membatasi maksimal 5 penarikan per jam per user', () => {
      const userId = 'usr_admin_jakarta_1'

      // Request 1-5 berhasil
      for (let i = 0; i < 5; i++) {
        const res = checkWithdrawalRateLimit(userId)
        expect(res.allowed).toBe(true)
      }

      // Request ke-6 diblokir
      const blocked = checkWithdrawalRateLimit(userId)
      expect(blocked.allowed).toBe(false)
      expect(blocked.remainingRequests).toBe(0)
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    })
  })

  describe('Notifikasi Email Transaksional & Security Alert (Task 7.3 & 7.4)', () => {
    it('harus menghasilkan template email konfirmasi penarikan yang valid dan lengkap', () => {
      const html = withdrawalConfirmationEmailTemplate({
        storeName: 'Affiliate Gadget Roxy Mas',
        companyName: 'PT Gadget Jaya Sentosa',
        amount: 25000000,
        bankName: 'Bank Mandiri',
        accountNumber: '1180019283741',
        accountName: 'PT Gadget Jaya Sentosa',
        refNumber: 'WD-20260925-001',
        date: '25/09/2026 22:30',
      })

      expect(html).toContain('WD-20260925-001')
      expect(html).toContain('Rp 25.000.000')
      expect(html).toContain('1180019283741')
      expect(html).toContain('PT Gadget Jaya Sentosa')
      expect(html).toContain('Konfirmasi Penarikan Saldo Berhasil')
    })

    it('harus menghasilkan template email peringatan keamanan penarikan saat OTP salah 3 kali', () => {
      const html = withdrawalSecurityAlertEmailTemplate({
        storeName: 'Affiliate Gadget WTC Surabaya',
        userName: 'Kevin Santoso',
        reason:
          'Batas percobaan salah kode OTP penarikan terlampaui (3 kali berturut-turut).',
        attempts: 3,
        time: '25/09/2026 22:31',
      })

      expect(html).toContain('Peringatan Keamanan')
      expect(html).toContain('Affiliate Gadget WTC Surabaya')
      expect(html).toContain('3 kali')
      expect(html).toContain('25/09/2026 22:31')
    })
  })
})
