import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createWhatsAppOtp,
  verifyWhatsAppOtp,
  clearOtp,
} from '@/lib/two-factor-store'
import {
  sendOrderCompletedEmail,
  sendOrderCancelledEmail,
  sendOrderRefundedEmail,
} from '@/lib/email'

describe('WhatsApp OTP Verification for Sensitive Account Actions', () => {
  const testUserId = 'user-account-action-otp-test'
  const testPhone = '081299887766'

  beforeEach(() => {
    clearOtp(testUserId)
  })

  it('should generate and verify OTP specifically for CHANGE_PASSWORD', () => {
    const otp = createWhatsAppOtp(testUserId, testPhone, 'CHANGE_PASSWORD')
    expect(otp.code).toHaveLength(6)
    expect(otp.whatsappUrl).toContain('https://wa.me/6281299887766')

    // Wrong OTP fails
    const failRes = verifyWhatsAppOtp(testUserId, '999999', 'CHANGE_PASSWORD')
    expect(failRes.success).toBe(false)

    // Correct OTP succeeds
    const successRes = verifyWhatsAppOtp(testUserId, otp.code, 'CHANGE_PASSWORD')
    expect(successRes.success).toBe(true)
  })

  it('should generate and verify OTP specifically for CHANGE_EMAIL', () => {
    const otp = createWhatsAppOtp(testUserId, testPhone, 'CHANGE_EMAIL')
    expect(otp.code).toHaveLength(6)
    expect(otp.whatsappUrl).toContain('https://wa.me/6281299887766')

    // Wrong OTP fails
    const failRes = verifyWhatsAppOtp(testUserId, '000000', 'CHANGE_EMAIL')
    expect(failRes.success).toBe(false)

    // Correct OTP succeeds
    const successRes = verifyWhatsAppOtp(testUserId, otp.code, 'CHANGE_EMAIL')
    expect(successRes.success).toBe(true)
  })

  it('should isolate CHANGE_PASSWORD and CHANGE_EMAIL OTPs from each other', () => {
    const pwdOtp = createWhatsAppOtp(testUserId, testPhone, 'CHANGE_PASSWORD')
    
    // Cross-purpose verification must be rejected
    const emailVerify = verifyWhatsAppOtp(testUserId, pwdOtp.code, 'CHANGE_EMAIL')
    expect(emailVerify.success).toBe(false)

    // Correct purpose succeeds
    const pwdVerify = verifyWhatsAppOtp(testUserId, pwdOtp.code, 'CHANGE_PASSWORD')
    expect(pwdVerify.success).toBe(true)
  })
})

describe('Email Transaction Proof & Receipt Engine', () => {
  it('should return simulated email success when sending Order Completed receipt without throwing', async () => {
    // Calling with non-existent or simulated order handles gracefully
    const result = await sendOrderCompletedEmail({ orderId: 'non-existent-order-id' })
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should return simulated email failure gracefully for Order Cancelled with unknown order', async () => {
    const result = await sendOrderCancelledEmail({
      orderId: 'non-existent-order-id',
      reason: 'Dibatalkan oleh pembeli',
    })
    expect(result.success).toBe(false)
  })

  it('should return simulated email failure gracefully for Order Refunded with unknown order', async () => {
    const result = await sendOrderRefundedEmail({
      orderId: 'non-existent-order-id',
      refundAmount: 5000000,
      reason: 'Unit retur diterima toko',
    })
    expect(result.success).toBe(false)
  })
})
