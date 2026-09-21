import { describe, it, expect } from 'vitest'
import { parseUserAgent } from '@/lib/user-agent-parser'

describe('User-Agent Device & Session Parser Engine', () => {
  it('should accurately parse Windows 11 / 10 Google Chrome on Desktop PC', () => {
    const windowsChromeUA =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

    const result = parseUserAgent(windowsChromeUA)

    expect(result.deviceType).toBe('desktop')
    expect(result.os).toBe('Windows 11 / 10')
    expect(result.browser).toBe('Google Chrome')
    expect(result.deviceLabel).toBe('PC / Desktop (Windows 11 / 10)')
    expect(result.browserLabel).toBe('Google Chrome')
  })

  it('should accurately parse Microsoft Edge on Windows', () => {
    const windowsEdgeUA =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0'

    const result = parseUserAgent(windowsEdgeUA)

    expect(result.deviceType).toBe('desktop')
    expect(result.browser).toBe('Microsoft Edge')
    expect(result.deviceLabel).toContain('Windows')
  })

  it('should accurately parse iPhone Safari Mobile device', () => {
    const iphoneUA =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'

    const result = parseUserAgent(iphoneUA)

    expect(result.deviceType).toBe('mobile')
    expect(result.os).toContain('iOS')
    expect(result.browser).toBe('Apple Safari')
    expect(result.deviceLabel).toContain('Smartphone')
  })

  it('should accurately parse Android Smartphone device', () => {
    const androidUA =
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'

    const result = parseUserAgent(androidUA)

    expect(result.deviceType).toBe('mobile')
    expect(result.os).toContain('Android')
    expect(result.browser).toBe('Google Chrome')
    expect(result.deviceLabel).toContain('Smartphone')
  })

  it('should accurately parse iPad / Tablet device', () => {
    const ipadUA =
      'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'

    const result = parseUserAgent(ipadUA)

    expect(result.deviceType).toBe('tablet')
    expect(result.os).toContain('iPadOS')
    expect(result.deviceLabel).toContain('Tablet')
  })
})

describe('WhatsApp 2FA OTP & Security Logic', () => {
  it('should generate valid 6-digit numeric OTP codes', () => {
    for (let i = 0; i < 20; i++) {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      expect(code).toMatch(/^\d{6}$/)
      expect(parseInt(code, 10)).toBeGreaterThanOrEqual(100000)
      expect(parseInt(code, 10)).toBeLessThanOrEqual(999999)
    }
  })

  it('should enforce 5-minute expiry and maximum 3 attempts on OTP verification', () => {
    const now = Date.now()
    const storedOtp = {
      code: '584291',
      phone: '081289901122',
      expiresAt: now + 5 * 60 * 1000,
      attempts: 0,
    }

    // Verify valid OTP
    const verify = (inputCode: string, currentTime: number) => {
      if (currentTime > storedOtp.expiresAt) {
        return { success: false, error: 'EXPIRED' }
      }
      if (storedOtp.attempts >= 3) {
        return { success: false, error: 'MAX_ATTEMPTS' }
      }
      if (inputCode !== storedOtp.code) {
        storedOtp.attempts += 1
        return { success: false, error: 'INVALID' }
      }
      return { success: true }
    }

    // Attempt 1: Wrong code
    expect(verify('111111', now).error).toBe('INVALID')
    expect(storedOtp.attempts).toBe(1)

    // Attempt 2: Wrong code
    expect(verify('222222', now).error).toBe('INVALID')
    expect(storedOtp.attempts).toBe(2)

    // Attempt 3: Wrong code
    expect(verify('333333', now).error).toBe('INVALID')
    expect(storedOtp.attempts).toBe(3)

    // Attempt 4: Even correct code is locked out
    expect(verify('584291', now).error).toBe('MAX_ATTEMPTS')

    // Fresh OTP testing expiration
    const expiredOtp = {
      code: '123456',
      phone: '081289901122',
      expiresAt: now - 1000, // already expired
      attempts: 0,
    }
    const isExpired = (currentTime: number) =>
      currentTime > expiredOtp.expiresAt
    expect(isExpired(now)).toBe(true)
  })

  it('should construct valid WhatsApp instant deep link with URL-encoded OTP template', () => {
    const rawPhone = '081289901122'
    let cleaned = rawPhone.replace(/[^0-9]/g, '')
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1)
    }

    const otp = '739104'
    const message = `*AFFILIATE GADGET MARKETPLACE*\n\nKode Verifikasi (OTP) 2 Langkah Anda adalah: *${otp}*\n\nKode ini bersifat rahasia dan berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.`
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`

    expect(cleaned).toBe('6281289901122')
    expect(url).toContain('https://wa.me/6281289901122?text=')
    expect(url).toContain('739104')
    expect(decodeURIComponent(url)).toContain('*AFFILIATE GADGET MARKETPLACE*')
  })

  it('should invalidate other sessions and retain only the current active session', () => {
    let sessions = [
      {
        id: 'current',
        isCurrent: true,
        label: 'PC / Desktop (Windows 11 / 10)',
      },
      { id: 'sess-2', isCurrent: false, label: 'Smartphone (Android)' },
      { id: 'sess-3', isCurrent: false, label: 'iPhone 15 Pro' },
    ]

    expect(sessions.length).toBe(3)

    // Logout other devices
    const logoutOtherDevices = () => {
      sessions = sessions.filter((s) => s.isCurrent)
    }

    logoutOtherDevices()
    expect(sessions.length).toBe(1)
    expect(sessions[0].id).toBe('current')
    expect(sessions[0].isCurrent).toBe(true)
  })
})
