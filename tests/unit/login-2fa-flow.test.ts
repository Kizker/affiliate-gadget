import { describe, it, expect, beforeEach } from 'vitest'
import {
  is2FaEnabled,
  set2FaEnabled,
  createLoginOtp,
  verifyLoginOtp,
  normalizePhoneForWhatsApp,
} from '@/lib/two-factor-store'

describe('Login WhatsApp 2FA Verification Flow', () => {
  const testUserId = 'test-user-login-2fa'
  const testEmail = 'customer.2fa@test.com'
  const testPhone = '081289901122'

  beforeEach(() => {
    // Reset state before each test
    set2FaEnabled(testUserId, testEmail, false)
  })

  it('should return requires2FA = false for standard accounts without 2FA', () => {
    expect(is2FaEnabled(testUserId)).toBe(false)
    expect(is2FaEnabled(testEmail)).toBe(false)
  })

  it('should return requires2FA = true when customer has activated 2FA in settings', () => {
    set2FaEnabled(testUserId, testEmail, true)

    expect(is2FaEnabled(testUserId)).toBe(true)
    expect(is2FaEnabled(testEmail)).toBe(true)
  })

  it('should normalize Indonesian phone numbers to WhatsApp international format', () => {
    expect(normalizePhoneForWhatsApp('081289901122')).toBe('6281289901122')
    expect(normalizePhoneForWhatsApp('+62 812-8990-1122')).toBe('6281289901122')
    expect(normalizePhoneForWhatsApp('6281289901122')).toBe('6281289901122')
  })

  it('should generate login OTP and authentic wa.me deep link with OTP message template', () => {
    const otpData = createLoginOtp(testEmail, testPhone)

    expect(otpData.code).toMatch(/^\d{6}$/)
    expect(otpData.whatsappUrl).toContain('https://wa.me/6281289901122?text=')
    expect(otpData.whatsappUrl).toContain(otpData.code)
    expect(otpData.expiresInSeconds).toBe(300)
  })

  it('should verify correct OTP code and consume it on success', () => {
    const otpData = createLoginOtp(testEmail, testPhone)

    // Verify with valid code
    const result = verifyLoginOtp(testEmail, otpData.code)
    expect(result.success).toBe(true)

    // Re-verification with same code should fail (one-time use)
    const replayResult = verifyLoginOtp(testEmail, otpData.code)
    expect(replayResult.success).toBe(false)
  })

  it('should reject invalid OTP codes and count failed attempts', () => {
    const otpData = createLoginOtp(testEmail, testPhone)

    const wrongResult1 = verifyLoginOtp(testEmail, '000000')
    expect(wrongResult1.success).toBe(false)
    expect(wrongResult1.error).toContain('tidak cocok')

    const wrongResult2 = verifyLoginOtp(testEmail, '999999')
    expect(wrongResult2.success).toBe(false)

    const wrongResult3 = verifyLoginOtp(testEmail, '888888')
    expect(wrongResult3.success).toBe(false)

    // 4th attempt should be blocked due to max attempts reached
    const wrongResult4 = verifyLoginOtp(testEmail, otpData.code)
    expect(wrongResult4.success).toBe(false)
    expect(wrongResult4.error).toContain('Terlalu banyak percobaan')
  })
})
