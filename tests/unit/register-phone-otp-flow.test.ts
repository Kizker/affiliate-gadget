import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as registerHandler } from '@/app/api/auth/register/route'
import { PATCH as profilePatchHandler } from '@/app/api/user/profile/route'
import prisma from '@/lib/db'
import * as twoFactorStore from '@/lib/two-factor-store'

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
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
    validateOtpRecord: vi.fn(),
    consumeOtpRecord: vi.fn().mockResolvedValue(undefined),
  }
})

describe('Register & Profile Phone OTP Verification Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Registration OTP Trigger (Email-First Flow)', () => {
    it('should dispatch OTP to EMAIL and return maskedEmail & hasPhone: true when phone is supplied', async () => {
      const { dispatchOtp } = await import('@/lib/notifications')
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null)
      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(null)
      vi.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 'new-user-001',
        name: 'John Doe',
        email: 'johndoe@test.com',
        role: 'CUSTOMER',
        mitraStatus: null,
      } as any)

      const req = new NextRequest('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'johndoe@test.com',
          phone: '081234567890',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          role: 'CUSTOMER',
        }),
      })

      const res = await registerHandler(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.requiresOtp).toBe(true)
      expect(data.email).toBe('johndoe@test.com')
      expect(data.maskedEmail).toBe('joh***@test.com')
      expect(data.hasPhone).toBe(true)
      expect(data.phone).toBe('081234567890')
      expect(data.userId).toBe('new-user-001')

      // Assert non-blocking dispatch was triggered with EMAIL channel
      expect(dispatchOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'johndoe@test.com',
          purpose: 'REGISTER',
          channel: 'EMAIL',
          userId: 'new-user-001',
        })
      )
    })

    it('should return requiresOtp: true and hasPhone: false when phone number is omitted', async () => {
      const { dispatchOtp } = await import('@/lib/notifications')
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null)
      vi.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 'new-user-002',
        name: 'Jane Doe',
        email: 'janedoe@test.com',
        role: 'CUSTOMER',
        mitraStatus: null,
      } as any)

      const req = new NextRequest('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'janedoe@test.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          role: 'CUSTOMER',
        }),
      })

      const res = await registerHandler(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.requiresOtp).toBe(true)
      expect(data.hasPhone).toBe(false)
      expect(data.phone).toBeNull()
      expect(data.maskedEmail).toBe('jan***@test.com')

      // Assert non-blocking dispatch was triggered with EMAIL channel
      expect(dispatchOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'janedoe@test.com',
          purpose: 'REGISTER',
          channel: 'EMAIL',
          userId: 'new-user-002',
        })
      )
    })
  })

  describe('Profile Phone Change OTP Trigger (TASK 6.3)', () => {
    it('should challenge for WhatsApp OTP when customer changes phone number', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'user@test.com' },
      } as any)

      vi.spyOn(prisma.user, 'findFirst')
        .mockResolvedValueOnce({
          id: 'user-123',
          email: 'user@test.com',
          phone: '081111111111',
        } as any) // existingSelf
        .mockResolvedValueOnce(null) // duplicatePhone check (none)

      const req = new NextRequest('http://localhost:3002/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '089999999999',
        }),
      })

      const res = await profilePatchHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.requiresOtp).toBe(true)
      expect(data.otpPurpose).toBe('CHANGE_PHONE')
      expect(data.phone).toBe('089999999999')
    })

    it('should reject phone update if new phone is already used by another user', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'user@test.com' },
      } as any)

      vi.spyOn(prisma.user, 'findFirst')
        .mockResolvedValueOnce({
          id: 'user-123',
          email: 'user@test.com',
          phone: '081111111111',
        } as any) // existingSelf
        .mockResolvedValueOnce({
          id: 'other-user-456',
          phone: '089999999999',
        } as any) // duplicatePhone found

      const req = new NextRequest('http://localhost:3002/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '089999999999',
        }),
      })

      const res = await profilePatchHandler(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('sudah digunakan')
    })

    it('should verify OTP and successfully update phone with phoneVerified timestamp', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'user@test.com' },
      } as any)

      vi.spyOn(prisma.user, 'findFirst')
        .mockResolvedValueOnce({
          id: 'user-123',
          email: 'user@test.com',
          phone: '081111111111',
        } as any) // existingSelf
        .mockResolvedValueOnce(null) // duplicatePhone check (none)

      vi.spyOn(twoFactorStore, 'verifyWhatsAppOtp').mockReturnValue({
        success: true,
      })

      const updateSpy = vi.spyOn(prisma.user, 'update').mockResolvedValue({
        id: 'user-123',
        phone: '089999999999',
      } as any)

      vi.spyOn(prisma.technician, 'findUnique').mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3002/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '089999999999',
          otp: '123456',
        }),
      })

      const res = await profilePatchHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '089999999999',
            phoneVerified: expect.any(Date),
          }),
        })
      )
    })
  })
})
