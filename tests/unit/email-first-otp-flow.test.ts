import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { maskEmail } from '@/lib/utils'
import { POST as login2FaHandler } from '@/app/api/auth/login-2fa/route'
import { POST as registerHandler } from '@/app/api/auth/register/route'
import { POST as sendOtpHandler } from '@/app/api/auth/send-otp/route'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

// Mock dependencies
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi
    .fn()
    .mockResolvedValue({ success: true, resetInSeconds: 0 }),
}))

vi.mock('@/lib/notifications', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/notifications')>()
  return {
    ...actual,
    dispatchOtp: vi
      .fn()
      .mockResolvedValue({ success: true, otpId: 'mock-otp-123' }),
    validateOtpRecord: vi.fn(),
    consumeOtpRecord: vi.fn().mockResolvedValue(undefined),
  }
})

describe('Email-First OTP Verification Suite (E2E Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. maskEmail Helper Function', () => {
    it('should correctly mask standard email addresses', () => {
      expect(maskEmail('bambangsetiawan@gmail.com')).toBe('bam***@gmail.com')
      expect(maskEmail('johndoe@example.com')).toBe('joh***@example.com')
      expect(maskEmail('alex@domain.id')).toBe('al***@domain.id')
    })

    it('should handle short email usernames gracefully', () => {
      expect(maskEmail('ab@test.com')).toBe('a***@test.com')
      expect(maskEmail('a@test.com')).toBe('a***@test.com')
    })

    it('should handle invalid or empty inputs without crashing', () => {
      expect(maskEmail('')).toBe('')
      expect(maskEmail('not-an-email')).toBe('not-an-email')
    })
  })

  describe('2. Login 2FA Email-First Verification Flow', () => {
    const mockHashedPassword = bcrypt.hashSync('correct-password', 10)

    it('should dispatch OTP to EMAIL on action=check and return maskedEmail & hasPhone', async () => {
      const { dispatchOtp } = await import('@/lib/notifications')
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-2fa-01',
        email: 'bambang@tokoguru.com',
        password: mockHashedPassword,
        phone: '081234567890',
        role: 'CUSTOMER',
        twoFactorEnabled: true,
        isActive: true,
      } as any)

      const req = new NextRequest('http://localhost:3002/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          email: 'bambang@tokoguru.com',
          password: 'correct-password',
        }),
      })

      const res = await login2FaHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.requires2FA).toBe(true)
      expect(data.maskedEmail).toBe('bam***@tokoguru.com')
      expect(data.hasPhone).toBe(true)
      expect(data.phone).toBe('081234567890')

      // Verifikasi bahwa dispatchOtp default ke WHATSAPP
      expect(dispatchOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: '081234567890',
          purpose: 'LOGIN',
          channel: 'WHATSAPP',
          userId: 'user-2fa-01',
        })
      )
    })

    it('should require 2FA (requires2FA = true) for all accounts including store admin', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'store-admin-01',
        email: 'admin.roxy@affiliategadget.com',
        password: mockHashedPassword,
        phone: '081234567890',
        role: 'STORE_ADMIN',
        isActive: true,
        twoFactorEnabled: true,
      } as any)

      const req = new NextRequest('http://localhost:3002/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          email: 'admin.roxy@affiliategadget.com',
          password: 'correct-password',
        }),
      })

      const res = await login2FaHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.requires2FA).toBe(true)
      expect(data.channel).toBe('WHATSAPP')
      expect(data.email).toBe('admin.roxy@affiliategadget.com')
    })

    it('should dispatch to WHATSAPP when action=resend-wa is selected', async () => {
      const { dispatchOtp } = await import('@/lib/notifications')
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-2fa-01',
        email: 'bambang@tokoguru.com',
        phone: '081234567890',
      } as any)

      const req = new NextRequest('http://localhost:3002/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend-wa',
          email: 'bambang@tokoguru.com',
        }),
      })

      const res = await login2FaHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.channel).toBe('WHATSAPP')
      expect(data.maskedPhone).toContain('****')

      // Assert WhatsApp channel used with phone identifier
      expect(dispatchOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: '081234567890',
          purpose: 'LOGIN',
          channel: 'WHATSAPP',
          userId: 'user-2fa-01',
        })
      )
    })

    it('should dispatch to SMS when action=resend-sms is selected', async () => {
      const { dispatchOtp } = await import('@/lib/notifications')
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-2fa-01',
        email: 'bambang@tokoguru.com',
        phone: '081234567890',
      } as any)

      const req = new NextRequest('http://localhost:3002/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend-sms',
          email: 'bambang@tokoguru.com',
        }),
      })

      const res = await login2FaHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.channel).toBe('SMS')

      // Assert SMS channel used with phone identifier
      expect(dispatchOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: '081234567890',
          purpose: 'LOGIN',
          channel: 'SMS',
          userId: 'user-2fa-01',
        })
      )
    })

    it('should verify OTP successfully using identifierUsed = email', async () => {
      const { validateOtpRecord, consumeOtpRecord } =
        await import('@/lib/notifications')
      vi.mocked(validateOtpRecord).mockResolvedValue({
        valid: true,
        otpToken: {
          id: 'token-abc',
          identifier: 'bambang@tokoguru.com',
        } as any,
      })

      const req = new NextRequest('http://localhost:3002/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          email: 'bambang@tokoguru.com',
          otp: '654321',
          identifierUsed: 'bambang@tokoguru.com',
        }),
      })

      const res = await login2FaHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(validateOtpRecord).toHaveBeenCalledWith({
        identifier: 'bambang@tokoguru.com',
        code: '654321',
        purpose: 'LOGIN',
      })
      expect(consumeOtpRecord).toHaveBeenCalledWith('token-abc')
    })

    it('should verify OTP successfully using identifierUsed = phone when user switched to WA/SMS', async () => {
      const { validateOtpRecord, consumeOtpRecord } =
        await import('@/lib/notifications')
      vi.mocked(validateOtpRecord).mockResolvedValue({
        valid: true,
        otpToken: { id: 'token-xyz', identifier: '081234567890' } as any,
      })

      const req = new NextRequest('http://localhost:3002/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          email: 'bambang@tokoguru.com',
          otp: '123456',
          identifierUsed: '081234567890',
        }),
      })

      const res = await login2FaHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(validateOtpRecord).toHaveBeenCalledWith({
        identifier: '081234567890',
        code: '123456',
        purpose: 'LOGIN',
      })
      expect(consumeOtpRecord).toHaveBeenCalledWith('token-xyz')
    })
  })

  describe('3. Registration Email-First with WA/SMS Fallback Endpoint', () => {
    it('should accept /api/auth/send-otp with channel WHATSAPP and phone identifier', async () => {
      const { dispatchOtp } = await import('@/lib/notifications')
      vi.spyOn(prisma.otpToken, 'findFirst').mockResolvedValue(null)
      vi.spyOn(prisma.otpToken, 'count').mockResolvedValue(0)

      const req = new NextRequest('http://localhost:3002/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '081234567890',
          channel: 'WHATSAPP',
          purpose: 'REGISTER',
          userId: 'user-reg-01',
        }),
      })

      const res = await sendOtpHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.channel).toBe('WHATSAPP')
      expect(dispatchOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: '6281234567890',
          purpose: 'REGISTER',
          channel: 'WHATSAPP',
          userId: 'user-reg-01',
        })
      )
    })
  })
})
