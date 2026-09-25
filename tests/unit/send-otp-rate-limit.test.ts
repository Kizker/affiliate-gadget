import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/send-otp/route'
import { db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  db: {
    otpToken: {
      findFirst: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    notificationLog: {
      create: vi.fn(),
    },
  },
}))

describe('Send OTP Endpoint & Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NOTIFICATION_MOCK_MODE = 'true'
    process.env.OTP_RESEND_COOLDOWN = '60'
    process.env.OTP_MAX_ATTEMPTS = '5'
  })

  it('should reject request when cooldown period is still active (< 60s)', async () => {
    // Mock latest OTP was created 20 seconds ago
    vi.mocked(db.otpToken.findFirst).mockResolvedValueOnce({
      id: 'recent-otp',
      identifier: '628123456789',
      createdAt: new Date(Date.now() - 20000),
    } as any)

    const req = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({
        identifier: '08123456789',
        channel: 'WHATSAPP',
        purpose: 'LOGIN',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(429)

    const data = await res.json()
    expect(data.error).toContain('Mohon tunggu')
    expect(data.cooldownLeft).toBeGreaterThan(0)
  })

  it('should reject request when daily limit of 5 requests is reached', async () => {
    // Cooldown passed (created 2 minutes ago)
    vi.mocked(db.otpToken.findFirst).mockResolvedValueOnce({
      id: 'old-otp',
      identifier: '628123456789',
      createdAt: new Date(Date.now() - 120000),
    } as any)

    // Daily count is already 5
    vi.mocked(db.otpToken.count).mockResolvedValueOnce(5)

    const req = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({
        identifier: '08123456789',
        channel: 'WHATSAPP',
        purpose: 'LOGIN',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(429)

    const data = await res.json()
    expect(data.error).toContain('Batas permintaan OTP harian telah tercapai')
  })

  it('should accept and dispatch OTP when under rate limits', async () => {
    // No recent OTP
    vi.mocked(db.otpToken.findFirst).mockResolvedValueOnce(null)
    // Daily count is 1
    vi.mocked(db.otpToken.count).mockResolvedValueOnce(1)

    vi.mocked(db.otpToken.updateMany).mockResolvedValueOnce({ count: 0 })
    vi.mocked(db.otpToken.create).mockResolvedValueOnce({
      id: 'new-otp-id',
      identifier: '628123456789',
      purpose: 'LOGIN',
      channel: 'WHATSAPP',
      expiresAt: new Date(Date.now() + 300000),
    } as any)

    const req = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({
        identifier: '08123456789',
        channel: 'WHATSAPP',
        purpose: 'LOGIN',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.cooldown).toBe(60)
  })
})
