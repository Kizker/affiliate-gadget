import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpCode,
  createOtpRecord,
  validateOtpRecord,
} from '@/lib/notifications/otp-generator'
import { db } from '@/lib/db'

// Mock db
vi.mock('@/lib/db', () => ({
  db: {
    otpToken: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

describe('OTP Generator & Verification Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate a 6-digit numeric string', () => {
    const code = generateOtpCode()
    expect(code).toMatch(/^\d{6}$/)
    const num = parseInt(code, 10)
    expect(num).toBeGreaterThanOrEqual(100000)
    expect(num).toBeLessThan(1000000)
  })

  it('should accurately hash and verify matching and non-matching codes', async () => {
    const code = '729183'
    const hash = await hashOtpCode(code)

    expect(hash).not.toBe(code)
    expect(await verifyOtpCode(code, hash)).toBe(true)
    expect(await verifyOtpCode('000000', hash)).toBe(false)
  })

  it('should create an OTP record and invalidate previous unused tokens for the same identifier', async () => {
    const fakeToken = {
      id: 'otp-test-123',
      identifier: '628123456789',
      purpose: 'LOGIN',
      channel: 'WHATSAPP',
      expiresAt: new Date(Date.now() + 300000),
    }

    vi.mocked(db.otpToken.updateMany).mockResolvedValueOnce({ count: 1 })
    vi.mocked(db.otpToken.create).mockResolvedValueOnce(fakeToken as any)

    const res = await createOtpRecord({
      identifier: '08123456789', // will be normalized to 628123456789
      purpose: 'LOGIN',
      channel: 'WHATSAPP',
    })

    expect(db.otpToken.updateMany).toHaveBeenCalledWith({
      where: {
        identifier: '628123456789',
        purpose: 'LOGIN',
        isConsumed: false,
      },
      data: { isConsumed: true },
    })
    expect(db.otpToken.create).toHaveBeenCalled()
    expect(res.code).toMatch(/^\d{6}$/)
    expect(res.otpToken.id).toBe('otp-test-123')
  })

  it('should validate matching OTP correctly', async () => {
    const code = '654321'
    const codeHash = await hashOtpCode(code)

    vi.mocked(db.otpToken.findFirst).mockResolvedValueOnce({
      id: 'token-valid',
      identifier: '628123456789',
      codeHash,
      purpose: 'LOGIN',
      attempts: 0,
      expiresAt: new Date(Date.now() + 200000), // active
      isConsumed: false,
    } as any)

    const result = await validateOtpRecord({
      identifier: '628123456789',
      code: '654321',
      purpose: 'LOGIN',
    })

    expect(result.valid).toBe(true)
    expect(result.otpToken?.id).toBe('token-valid')
  })

  it('should reject expired OTPs', async () => {
    vi.mocked(db.otpToken.findFirst).mockResolvedValueOnce({
      id: 'token-expired',
      identifier: '628123456789',
      codeHash: 'somehash',
      purpose: 'LOGIN',
      attempts: 0,
      expiresAt: new Date(Date.now() - 5000), // expired
      isConsumed: false,
    } as any)

    const result = await validateOtpRecord({
      identifier: '628123456789',
      code: '123456',
      purpose: 'LOGIN',
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('EXPIRED')
  })

  it('should count failed attempts and reject on invalid code', async () => {
    const codeHash = await hashOtpCode('999999')

    vi.mocked(db.otpToken.findFirst).mockResolvedValueOnce({
      id: 'token-wrong',
      identifier: '628123456789',
      codeHash,
      purpose: 'LOGIN',
      attempts: 1,
      expiresAt: new Date(Date.now() + 100000),
      isConsumed: false,
    } as any)

    vi.mocked(db.otpToken.update).mockResolvedValueOnce({
      id: 'token-wrong',
      attempts: 2,
    } as any)

    const result = await validateOtpRecord({
      identifier: '628123456789',
      code: '000000',
      purpose: 'LOGIN',
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('INVALID_CODE')
    expect(result.attemptsLeft).toBe(1)
  })
})
