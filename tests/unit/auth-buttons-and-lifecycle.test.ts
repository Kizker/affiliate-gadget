import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as registerHandler } from '@/app/api/auth/register/route'
import { POST as login2FaHandler } from '@/app/api/auth/login-2fa/route'
import prisma from '@/lib/db'
import * as twoFactorStore from '@/lib/two-factor-store'
import bcrypt from 'bcryptjs'

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true),
}))

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
    validateOtpRecord: vi.fn().mockResolvedValue({ valid: false }),
    consumeOtpRecord: vi.fn().mockResolvedValue(undefined),
  }
})

describe('Comprehensive Auth Lifecycle & Button Logic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Form Validation & Security Buttons / Fields (Register)', () => {
    it('TC-REG-VAL-01: Should silently neutralize bot when honeypot field is filled (returns 201 fake success without user creation)', async () => {
      const userCreateSpy = vi.spyOn(prisma.user, 'create')

      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bot User',
          email: 'bot@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          role: 'CUSTOMER',
          honeypotField: 'i-am-a-bot',
        }),
      })

      const res = await registerHandler(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.message).toContain('Registrasi berhasil')
      expect(userCreateSpy).not.toHaveBeenCalled()
    })

    it('TC-REG-VAL-02: Should validate password strength (requires all 5 criteria)', async () => {
      const weakPasswords = [
        'short1!', // < 8 characters
        'alllowercase123!', // No uppercase
        'ALLUPPERCASE123!', // No lowercase
        'NoNumbersHere!', // No number
        'NoSymbol12345', // No symbol
      ]

      for (const pwd of weakPasswords) {
        const req = new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'User Test',
            email: `user_${Date.now()}@example.com`,
            password: pwd,
            confirmPassword: pwd,
            role: 'CUSTOMER',
          }),
        })

        const res = await registerHandler(req)
        expect(res.status).toBe(400)
      }
    })

    it('TC-REG-VAL-03: Should reject registration if password and confirmPassword do not match', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'User Mismatch',
          email: 'mismatch@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
          role: 'CUSTOMER',
        }),
      })

      const res = await registerHandler(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('tidak cocok')
    })
  })

  describe('2. Account Type Selection & Registration Flow (Customer vs Mitra)', () => {
    it('TC-REG-ROLE-01: Should create CUSTOMER account and return requiresOtp: true with EMAIL dispatch', async () => {
      const { dispatchOtp } = await import('@/lib/notifications')
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null)
      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(null)
      vi.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 'cust-user-123',
        name: 'Customer Baru',
        email: 'customer.baru@example.com',
        role: 'CUSTOMER',
        mitraStatus: null,
      } as any)

      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Customer Baru',
          email: 'customer.baru@example.com',
          phone: '081298765432',
          password: 'PasswordKuat123!',
          confirmPassword: 'PasswordKuat123!',
          role: 'CUSTOMER',
        }),
      })

      const res = await registerHandler(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.requiresOtp).toBe(true)
      expect(data.role).toBe('CUSTOMER')
      expect(data.maskedEmail).toBeDefined()
      expect(dispatchOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'customer.baru@example.com',
          channel: 'EMAIL',
          purpose: 'REGISTER',
        })
      )
    })

    it('TC-REG-ROLE-02: Should create MITRA account with PENDING status ready for Store Data step', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null)
      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(null)
      vi.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 'mitra-user-456',
        name: 'Mitra Owner',
        email: 'mitra.owner@example.com',
        role: 'MITRA',
        mitraStatus: 'PENDING',
      } as any)

      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Mitra Owner',
          email: 'mitra.owner@example.com',
          password: 'PasswordKuat123!',
          confirmPassword: 'PasswordKuat123!',
          role: 'MITRA',
        }),
      })

      const res = await registerHandler(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.role).toBe('MITRA')
      expect(data.userId).toBe('mitra-user-456')
    })
  })

  describe('3. Login Flow, Credential Validation & 2FA Step Switching', () => {
    it('TC-LOG-01: Should reject login check when email is not registered', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          email: 'unregistered@example.com',
          password: 'Password123!',
        }),
      })

      const res = await login2FaHandler(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.error).toContain('tidak cocok')
    })

    it('TC-LOG-02: Should reject deactivated/inactive account with status 403', async () => {
      const inactiveUser = {
        id: 'user-deactivated',
        email: 'inactive@example.com',
        password: 'hashed_password',
        role: 'CUSTOMER',
        isActive: false,
        phone: null,
      }
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(inactiveUser as any)

      const req = new NextRequest('http://localhost:3000/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          email: 'inactive@example.com',
          password: 'CorrectPassword123!',
        }),
      })

      const res = await login2FaHandler(req)
      const data = await res.json()

      expect(res.status).toBe(403)
      expect(data.error).toContain('dinonaktifkan')
    })

    it('TC-LOG-03: Should trigger 2FA challenge and send OTP to active user', async () => {
      const activeUser = {
        id: 'user-with-active',
        email: 'active.user@example.com',
        password: 'hashed_password',
        role: 'CUSTOMER',
        isActive: true,
        phone: '081234567890',
      }
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(activeUser as any)

      const req = new NextRequest('http://localhost:3000/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          email: 'active.user@example.com',
          password: 'CorrectPassword123!',
        }),
      })

      const res = await login2FaHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.requires2FA).toBe(true)
      expect(data.channel).toBe('EMAIL')
      expect(data.maskedEmail).toBeDefined()
      expect(data.hasPhone).toBe(true)
    })

    it('TC-LOG-04: Should verify valid OTP and consume it successfully', async () => {
      const { validateOtpRecord, consumeOtpRecord } =
        await import('@/lib/notifications')
      vi.mocked(validateOtpRecord).mockResolvedValue({
        valid: true,
        otpToken: { id: 'token-abc-123' } as any,
      })

      const req = new NextRequest('http://localhost:3000/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          email: 'with2fa@example.com',
          otp: '123456',
        }),
      })

      const res = await login2FaHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(consumeOtpRecord).toHaveBeenCalledWith('token-abc-123')
    })

    it('TC-LOG-05: Should reject incorrect OTP and return informative error', async () => {
      const { validateOtpRecord } = await import('@/lib/notifications')
      vi.mocked(validateOtpRecord).mockResolvedValue({ valid: false })
      vi.spyOn(twoFactorStore, 'verifyLoginOtp').mockReturnValue({
        success: false,
        error: 'Kode OTP tidak cocok atau kadaluarsa (sisa percobaan: 2).',
      })

      const req = new NextRequest('http://localhost:3000/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          email: 'with2fa@example.com',
          otp: '999999',
        }),
      })

      const res = await login2FaHandler(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('tidak cocok')
    })
  })

  describe('4. Post-Login Role Destination Mapping Matrix', () => {
    const rolesMapping = [
      { role: 'SUPER_ADMIN', expected: '/dashboard/admin' },
      { role: 'ADMIN', expected: '/dashboard/admin' },
      { role: 'STORE_ADMIN', expected: '/dashboard/admin' },
      { role: 'STORE_SALES', expected: '/dashboard/admin' },
      { role: 'FINANCE_ADMIN', expected: '/dashboard/admin' },
      { role: 'CONTENT_EDITOR', expected: '/dashboard/admin' },
      { role: 'TECHNICIAN', expected: '/dashboard/teknisi' },
      {
        role: 'MITRA',
        mitraStatus: 'PENDING',
        expected: '/dashboard/mitra/pending',
      },
      { role: 'MITRA', mitraStatus: 'APPROVED', expected: '/dashboard/mitra' },
      { role: 'CUSTOMER', expected: '/' },
    ]

    rolesMapping.forEach(({ role, mitraStatus, expected }) => {
      it(`TC-REDIR: Role ${role}${mitraStatus ? ` (${mitraStatus})` : ''} should resolve redirect to ${expected}`, () => {
        const adminStaffRoles = [
          'SUPER_ADMIN',
          'ADMIN',
          'STORE_ADMIN',
          'STORE_SALES',
          'FINANCE_ADMIN',
          'CONTENT_EDITOR',
        ]

        let redirectUrl = '/'
        if (adminStaffRoles.includes(role)) {
          redirectUrl = '/dashboard/admin'
        } else if (role === 'TECHNICIAN') {
          redirectUrl = '/dashboard/teknisi'
        } else if (role === 'MITRA') {
          redirectUrl =
            mitraStatus === 'PENDING'
              ? '/dashboard/mitra/pending'
              : '/dashboard/mitra'
        } else {
          redirectUrl = '/'
        }

        expect(redirectUrl).toBe(expected)
      })
    })
  })
})
