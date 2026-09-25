import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  dispatchOtp,
  dispatchTransactional,
  dispatchSecurityAlert,
} from '@/lib/notifications/notification-dispatcher'
import { db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  db: {
    otpToken: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({
        id: 'test-otp-token',
        identifier: '628123456789',
        codeHash: 'hash',
        purpose: 'LOGIN',
        channel: 'WHATSAPP',
        expiresAt: new Date(Date.now() + 300000),
      }),
    },
    notificationLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-1' }),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
    },
  },
}))

describe('Notification Dispatcher Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NOTIFICATION_MOCK_MODE = 'true'
  })

  it('should dispatch OTP via WhatsApp and record audit log', async () => {
    const res = await dispatchOtp({
      identifier: '08123456789',
      purpose: 'LOGIN',
      channel: 'WHATSAPP',
      userId: 'user-123',
    })

    expect(res.success).toBe(true)
    expect(res.otpId).toBe('test-otp-token')
    expect(db.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-123',
          channel: 'WHATSAPP',
          status: 'SENT',
        }),
      })
    )
  })

  it('should dispatch transactional events to WA, Email and In-App notification', async () => {
    await dispatchTransactional({
      event: 'ORDER_CREATED',
      orderId: 'ord-123',
      orderNumber: 'AG-20260924-001',
      userId: 'user-123',
      customerName: 'Budi Santoso',
      customerPhone: '081234567890',
      customerEmail: 'budi@example.com',
      totalAmount: 15000000,
    })

    // Should create in-app notification
    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-123',
          type: 'ORDER_CREATED',
        }),
      })
    )

    // Should create notification log entries
    expect(db.notificationLog.create).toHaveBeenCalled()
  })

  it('should dispatch security alerts without throwing', async () => {
    await expect(
      dispatchSecurityAlert({
        userId: 'user-123',
        name: 'Budi',
        email: 'budi@example.com',
        phone: '081234567890',
        deviceLabel: 'iPhone 15 Pro',
        ipAddress: '182.253.12.34',
        location: 'Jakarta',
      })
    ).resolves.not.toThrow()

    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'SECURITY_ALERT',
        }),
      })
    )
  })
})
