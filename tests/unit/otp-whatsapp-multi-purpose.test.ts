import { describe, it, expect, beforeEach } from 'vitest'
import {
  createWhatsAppOtp,
  verifyWhatsAppOtp,
  clearOtp,
} from '@/lib/two-factor-store'

describe('Multi-Purpose WhatsApp OTP Engine (Login, Password, Email)', () => {
  const testUserId = 'user-otp-multi-test'
  const testPhone = '081234567890'

  beforeEach(() => {
    clearOtp(testUserId)
  })

  it('should generate valid WhatsApp OTP with dedicated purpose for Change Password', () => {
    const otp = createWhatsAppOtp(testUserId, testPhone, 'CHANGE_PASSWORD')

    expect(otp.code).toMatch(/^\d{6}$/)
    expect(otp.expiresInSeconds).toBe(300)
    expect(otp.whatsappUrl).toContain('https://wa.me/6281234567890?text=')
    expect(decodeURIComponent(otp.whatsappUrl)).toContain('Ganti Kata Sandi')
    expect(decodeURIComponent(otp.whatsappUrl)).toContain(otp.code)
  })

  it('should generate valid WhatsApp OTP with dedicated purpose for Change Email', () => {
    const otp = createWhatsAppOtp(testUserId, testPhone, 'CHANGE_EMAIL')

    expect(otp.code).toMatch(/^\d{6}$/)
    expect(otp.expiresInSeconds).toBe(300)
    expect(otp.whatsappUrl).toContain('https://wa.me/6281234567890?text=')
    expect(decodeURIComponent(otp.whatsappUrl)).toContain('Ganti Alamat Email')
    expect(decodeURIComponent(otp.whatsappUrl)).toContain(otp.code)
  })

  it('should enforce purpose isolation (cannot use Password OTP for Email change)', () => {
    const passwordOtp = createWhatsAppOtp(testUserId, testPhone, 'CHANGE_PASSWORD')

    // Trying to verify password OTP under CHANGE_EMAIL purpose must fail
    const crossVerify = verifyWhatsAppOtp(testUserId, passwordOtp.code, 'CHANGE_EMAIL')
    expect(crossVerify.success).toBe(false)
    expect(crossVerify.error).toContain('belum diminta')

    // Verifying under correct purpose succeeds
    const validVerify = verifyWhatsAppOtp(testUserId, passwordOtp.code, 'CHANGE_PASSWORD')
    expect(validVerify.success).toBe(true)
  })

  it('should consume OTP upon successful verification to prevent replay attack', () => {
    const otp = createWhatsAppOtp(testUserId, testPhone, 'CHANGE_PASSWORD')

    const firstTry = verifyWhatsAppOtp(testUserId, otp.code, 'CHANGE_PASSWORD')
    expect(firstTry.success).toBe(true)

    // Second try with same code must fail
    const replayTry = verifyWhatsAppOtp(testUserId, otp.code, 'CHANGE_PASSWORD')
    expect(replayTry.success).toBe(false)
  })

  it('should block verification after 3 failed attempts', () => {
    const otp = createWhatsAppOtp(testUserId, testPhone, 'CHANGE_EMAIL')

    verifyWhatsAppOtp(testUserId, '000000', 'CHANGE_EMAIL')
    verifyWhatsAppOtp(testUserId, '111111', 'CHANGE_EMAIL')
    verifyWhatsAppOtp(testUserId, '222222', 'CHANGE_EMAIL')

    // 4th try even with correct code is rejected
    const blocked = verifyWhatsAppOtp(testUserId, otp.code, 'CHANGE_EMAIL')
    expect(blocked.success).toBe(false)
    expect(blocked.error).toContain('Terlalu banyak percobaan')
  })
})
