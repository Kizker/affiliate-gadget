import { describe, it, expect } from 'vitest'
import {
  generateDeviceToken,
  extractClientDeviceInfo,
} from '@/lib/device-fingerprint'

describe('Device Fingerprint Engine', () => {
  it('should generate consistent SHA-256 tokens for identical inputs', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    const ip = '182.253.12.34'
    const userId = 'user-test-1'

    const token1 = generateDeviceToken(ua, ip, userId)
    const token2 = generateDeviceToken(ua, ip, userId)

    expect(token1).toBe(token2)
    expect(token1).toHaveLength(64) // SHA-256 hex string
  })

  it('should treat minor dynamic IP variations in the same /24 subnet as the same token', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
    const ip1 = '180.252.100.12'
    const ip2 = '180.252.100.99' // same /24 subnet
    const userId = 'user-test-2'

    const token1 = generateDeviceToken(ua, ip1, userId)
    const token2 = generateDeviceToken(ua, ip2, userId)

    expect(token1).toBe(token2)
  })

  it('should generate different tokens for different user agents or users', () => {
    const ua1 = 'Mozilla/5.0 (Windows NT 10.0)'
    const ua2 = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    const ip = '182.253.12.34'

    const tokenA = generateDeviceToken(ua1, ip, 'user-1')
    const tokenB = generateDeviceToken(ua2, ip, 'user-1')
    const tokenC = generateDeviceToken(ua1, ip, 'user-2')

    expect(tokenA).not.toBe(tokenB)
    expect(tokenA).not.toBe(tokenC)
  })

  it('should correctly parse headers into client device info', () => {
    const headers = new Headers({
      'user-agent':
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'x-forwarded-for': '114.122.20.10, 10.0.0.1',
    })

    const info = extractClientDeviceInfo(headers)

    expect(info.deviceType).toBe('mobile')
    expect(info.ipAddress).toBe('114.122.20.10')
    expect(info.os).toContain('Android')
  })
})
