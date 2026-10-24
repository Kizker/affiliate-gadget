import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { sendVerificationEmail } from '@/lib/email'
import { POST as sendOtpHandler } from '@/app/api/auth/send-otp/route'
import { POST as verifyOtpHandler } from '@/app/api/auth/verify-otp/route'
import { dispatchOtp } from '@/lib/notifications/notification-dispatcher'
import { db } from '@/lib/db'

vi.mock('@/lib/notifications/email-provider', () => ({
  sendEmail: vi.fn().mockResolvedValue({
    success: true,
    provider: 'RESEND',
    messageId: 'mock-resend-id-123',
  }),
}))

vi.mock('@/lib/db', () => ({
  db: {
    otpToken: {
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({
        id: 'test-otp-token',
        identifier: 'user@example.com',
        codeHash: 'mock-hash',
        purpose: 'REGISTER',
        channel: 'EMAIL',
        expiresAt: new Date(Date.now() + 300000),
      }),
    },
    notificationLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-1' }),
    },
    user: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
  default: {
    otpToken: {
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
    },
    user: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}))

vi.mock('@/lib/notifications/otp-generator', () => ({
  createOtpRecord: vi.fn().mockResolvedValue({
    code: '123456',
    otpToken: { id: 'test-otp-token' },
  }),
  validateOtpRecord: vi.fn().mockResolvedValue({
    valid: true,
    otpToken: { id: 'test-otp-token', userId: 'user-id-1' },
  }),
  consumeOtpRecord: vi.fn().mockResolvedValue(undefined),
  normalizePhone: vi.fn((phone: string) => phone),
  isValidIndonesianPhone: vi.fn(() => true),
}))

describe('Email Verification & Resend OTP Delivery Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NOTIFICATION_MOCK_MODE = 'false'
    process.env.RESEND_API_KEY = 'mock-key'
  })

  it('1. sendVerificationEmail should invoke sendEmail (Resend) as primary provider', async () => {
    const { sendEmail } = await import('@/lib/notifications/email-provider')
    const result = await sendVerificationEmail({
      to: 'pelanggan@example.com',
      name: 'Pelanggan Baru',
      token: 'secret-token-xyz',
    })

    expect(result.success).toBe(true)
    expect(sendEmail).toHaveBeenCalledWith(
      'pelanggan@example.com',
      'Verifikasi Akun Anda — Affiliate Gadget',
      expect.stringContaining('secret-token-xyz')
    )
  })

  it('2. send-otp route should automatically default to EMAIL when identifier contains @', async () => {
    const { sendEmail } = await import('@/lib/notifications/email-provider')
    const req = new NextRequest('http://localhost:3002/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'bincelstore@gmail.com',
        purpose: 'REGISTER',
      }),
    })

    const res = await sendOtpHandler(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.channel).toBe('EMAIL')
    expect(sendEmail).toHaveBeenCalledWith(
      'bincelstore@gmail.com',
      expect.stringContaining(
        '[Affiliate Gadget] 123456 adalah Kode Verifikasi OTP Anda'
      ),
      expect.any(String),
      expect.any(String)
    )
  })

  it('3. verify-otp route should update emailVerified when verifying email OTP for REGISTER', async () => {
    const req = new NextRequest('http://localhost:3002/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'bincelstore@gmail.com',
        code: '123456',
        purpose: 'REGISTER',
      }),
    })

    const res = await verifyOtpHandler(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(db.user.updateMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: 'bincelstore@gmail.com' },
          { phone: undefined },
          { id: 'user-id-1' },
        ],
      },
      data: {
        emailVerified: expect.any(Date),
      },
    })
  })

  it('4. dispatchOtp via EMAIL should include the OTP code and branding in subject', async () => {
    const { sendEmail } = await import('@/lib/notifications/email-provider')
    const res = await dispatchOtp({
      identifier: 'hasriazissimanjuntak@gmail.com',
      purpose: 'REGISTER',
      channel: 'EMAIL',
      userId: 'user-azis',
    })

    expect(res.success).toBe(true)
    expect(sendEmail).toHaveBeenCalledWith(
      'hasriazissimanjuntak@gmail.com',
      '[Affiliate Gadget] 123456 adalah Kode Verifikasi OTP Anda (Pendaftaran Akun)',
      expect.any(String),
      expect.any(String)
    )
  })
})
