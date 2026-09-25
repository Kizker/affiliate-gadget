import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendWhatsApp } from '@/lib/notifications/whatsapp-provider'
import { sendSms } from '@/lib/notifications/sms-provider'
import { sendEmail } from '@/lib/notifications/email-provider'

describe('Notification Providers Suite', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('WhatsApp Provider (Zenziva)', () => {
    it('should return error for invalid phone number', async () => {
      const res = await sendWhatsApp('12345', 'Halo')
      expect(res.success).toBe(false)
      expect(res.errorMessage).toContain('Nomor telepon tidak valid')
    })

    it('should succeed in mock mode', async () => {
      process.env.NOTIFICATION_MOCK_MODE = 'true'
      const res = await sendWhatsApp('081234567890', 'Pesan Test')
      expect(res.success).toBe(true)
      expect(res.provider).toBe('MOCK_WA')
    })

    it('should call Zenziva API and return success in production mode', async () => {
      process.env.NOTIFICATION_MOCK_MODE = 'false'
      process.env.ZENZIVA_USERKEY = 'dummy-userkey'
      process.env.ZENZIVA_PASSKEY = 'dummy-passkey'

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: '1',
          text: 'Success',
          messageId: 'wa-msg-123',
        }),
      } as any)

      const res = await sendWhatsApp('081234567890', 'Test OTP: 123456')
      expect(res.success).toBe(true)
      expect(res.provider).toBe('ZENZIVA')
      expect(res.messageId).toBe('wa-msg-123')
    })
  })

  describe('SMS Provider (Zenziva)', () => {
    it('should return error for invalid phone number', async () => {
      const res = await sendSms('02199999', 'Halo SMS')
      expect(res.success).toBe(false)
    })

    it('should succeed in mock mode', async () => {
      process.env.NOTIFICATION_MOCK_MODE = 'true'
      const res = await sendSms('081234567890', 'Pesan SMS')
      expect(res.success).toBe(true)
      expect(res.provider).toBe('MOCK_SMS')
    })
  })

  describe('Email Provider (Resend)', () => {
    it('should succeed in mock mode', async () => {
      process.env.NOTIFICATION_MOCK_MODE = 'true'
      const res = await sendEmail(
        'customer@example.com',
        'Subject Test',
        '<p>Body</p>'
      )
      expect(res.success).toBe(true)
      expect(res.provider).toBe('MOCK_EMAIL')
    })
  })
})
