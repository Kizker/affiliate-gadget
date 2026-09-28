import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as forgotPasswordHandler } from '@/app/api/auth/forgot-password/route'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

vi.mock('@/lib/notifications', () => ({
  dispatchOtp: vi.fn(),
}))

vi.mock('@/lib/notifications/otp-generator', () => ({
  validateOtpRecord: vi.fn(),
  consumeOtpRecord: vi.fn(),
}))

describe('Forgot Password Flow (Resend Email OTP)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Request OTP (action: request-otp)', () => {
    it('harus menolak permintaan jika email kosong atau format tidak valid', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'invalid-email' }),
        }
      )

      const res = await forgotPasswordHandler(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('harus menolak jika email tidak terdaftar di database (404)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null)

      const req = new NextRequest(
        'http://localhost:3000/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'unknown@user.com' }),
        }
      )

      const res = await forgotPasswordHandler(req)
      const data = await res.json()

      expect(res.status).toBe(404)
      expect(data.error).toContain('tidak terdaftar')
    })

    it('harus menolak jika akun dinonaktifkan (403)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'u-123',
        email: 'blocked@user.com',
        name: 'Blocked User',
        isActive: false,
      } as any)

      const req = new NextRequest(
        'http://localhost:3000/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'blocked@user.com' }),
        }
      )

      const res = await forgotPasswordHandler(req)
      const data = await res.json()

      expect(res.status).toBe(403)
      expect(data.error).toContain('dinonaktifkan')
    })

    it('harus berhasil memanggil dispatchOtp via EMAIL dan mengembalikan email tersensor', async () => {
      const { dispatchOtp } = await import('@/lib/notifications')
      vi.mocked(dispatchOtp).mockResolvedValue({
        success: true,
        otpId: 'otp-token-1',
        code: '123456',
      })

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'u-456',
        email: 'customer@test.com',
        name: 'Customer Test',
        isActive: true,
      } as any)

      const req = new NextRequest(
        'http://localhost:3000/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'customer@test.com' }),
        }
      )

      const res = await forgotPasswordHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.maskedEmail).toBe('cu*****r@test.com')
      expect(dispatchOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'customer@test.com',
          purpose: 'CHANGE_PASSWORD',
          channel: 'EMAIL',
          userId: 'u-456',
        })
      )
    })
  })

  describe('2. Verify OTP (action: verify-otp)', () => {
    it('harus menolak jika kode OTP bukan 6 digit', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'verify-otp',
            email: 'customer@test.com',
            otp: '123',
          }),
        }
      )

      const res = await forgotPasswordHandler(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('harus mengembalikan error jika kode OTP salah atau kedaluwarsa', async () => {
      const { validateOtpRecord } =
        await import('@/lib/notifications/otp-generator')
      vi.mocked(validateOtpRecord).mockResolvedValue({
        valid: false,
        error: 'INVALID_CODE',
        attemptsLeft: 2,
      })

      const req = new NextRequest(
        'http://localhost:3000/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'verify-otp',
            email: 'customer@test.com',
            otp: '999999',
          }),
        }
      )

      const res = await forgotPasswordHandler(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('Kode OTP salah')
    })

    it('harus berhasil memverifikasi OTP yang valid', async () => {
      const { validateOtpRecord } =
        await import('@/lib/notifications/otp-generator')
      vi.mocked(validateOtpRecord).mockResolvedValue({
        valid: true,
        otpToken: { id: 'otp-1', codeHash: 'hash' } as any,
      })

      const req = new NextRequest(
        'http://localhost:3000/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'verify-otp',
            email: 'customer@test.com',
            otp: '123456',
          }),
        }
      )

      const res = await forgotPasswordHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('berhasil diverifikasi')
    })
  })

  describe('3. Reset Password (action: reset-password)', () => {
    it('harus menolak jika kata sandi baru dan konfirmasi tidak cocok', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'reset-password',
            email: 'customer@test.com',
            otp: '123456',
            newPassword: 'passwordBaru123',
            confirmPassword: 'passwordBeda123',
          }),
        }
      )

      const res = await forgotPasswordHandler(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('tidak cocok')
    })

    it('harus menolak jika kata sandi baru kurang dari 8 karakter', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'reset-password',
            email: 'customer@test.com',
            otp: '123456',
            newPassword: '123',
            confirmPassword: '123',
          }),
        }
      )

      const res = await forgotPasswordHandler(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('minimal 8 karakter')
    })

    it('harus berhasil mengupdate kata sandi di DB dan mengonsumsi OTP', async () => {
      const { validateOtpRecord, consumeOtpRecord } =
        await import('@/lib/notifications/otp-generator')
      vi.mocked(validateOtpRecord).mockResolvedValue({
        valid: true,
        otpToken: { id: 'otp-consumed-id', codeHash: 'hash' } as any,
      })
      vi.mocked(consumeOtpRecord).mockResolvedValue(undefined)

      const updateSpy = vi
        .spyOn(prisma.user, 'update')
        .mockResolvedValue({ id: 'u-456' } as any)

      const req = new NextRequest(
        'http://localhost:3000/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'reset-password',
            email: 'customer@test.com',
            otp: '123456',
            newPassword: 'newPassword123!',
            confirmPassword: 'newPassword123!',
          }),
        }
      )

      const res = await forgotPasswordHandler(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(consumeOtpRecord).toHaveBeenCalledWith('otp-consumed-id')
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'customer@test.com' },
          data: expect.objectContaining({
            password: expect.any(String),
          }),
        })
      )

      // Verifikasi bahwa password yang disimpan adalah bcrypt hash yang valid
      const updatedData = updateSpy.mock.calls[0][0].data
      const isMatch = bcrypt.compareSync(
        'newPassword123!',
        updatedData.password as string
      )
      expect(isMatch).toBe(true)
    })
  })
})
