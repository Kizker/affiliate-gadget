import { describe, it, expect, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { loginSchema, LOGIN_ERROR_CODES } from '../../src/lib/validations/auth'
import {
  extractClientIp,
  checkLoginRateLimit,
  incrementLoginFailCounter,
  getLoginFailCount,
  checkAccountLockout,
  resetLoginFailCounter,
  calculateProgressiveDelay,
  LOGIN_SECURITY_CONFIG,
} from '../../src/lib/login-security'

describe('Login Security & Validation (Tahap 2)', () => {
  describe('LOGIN_ERROR_CODES Constants', () => {
    it('should contain all required standardized error codes', () => {
      expect(LOGIN_ERROR_CODES.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS')
      expect(LOGIN_ERROR_CODES.ACCOUNT_LOCKED).toBe('ACCOUNT_LOCKED')
      expect(LOGIN_ERROR_CODES.RATE_LIMIT_IP).toBe('RATE_LIMIT_IP')
      expect(LOGIN_ERROR_CODES.RATE_LIMIT_EMAIL).toBe('RATE_LIMIT_EMAIL')
      expect(LOGIN_ERROR_CODES.EMAIL_NOT_VERIFIED).toBe('EMAIL_NOT_VERIFIED')
      expect(LOGIN_ERROR_CODES.ACCOUNT_DISABLED).toBe('ACCOUNT_DISABLED')

      const values = Object.values(LOGIN_ERROR_CODES)
      const uniqueValues = new Set(values)
      expect(values.length).toBe(uniqueValues.size)
    })
  })

  describe('loginSchema Validation & DoS Protection', () => {
    it('should accept valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'ValidPassword123!',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user@example.com')
      }
    })

    it('should sanitize and normalize email (trim and lowercase)', () => {
      const result = loginSchema.safeParse({
        email: '  User.Test@DOMAIN.CoM  ',
        password: 'password123',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user.test@domain.com')
      }
    })

    it('should reject empty email or invalid email format', () => {
      const result1 = loginSchema.safeParse({
        email: '',
        password: 'password123',
      })
      expect(result1.success).toBe(false)

      const result2 = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      })
      expect(result2.success).toBe(false)
    })

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject password exceeding 128 characters (Bcrypt CPU DoS Protection)', () => {
      const longPassword = 'A'.repeat(129)
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: longPassword,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain(
          'Password terlalu panjang'
        )
      }
    })

    it('should allow password up to 128 characters', () => {
      const maxPassword = 'A'.repeat(128)
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: maxPassword,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('extractClientIp Helper', () => {
    it('should extract IP from x-forwarded-for header string (first IP in chain)', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
        },
      }
      expect(extractClientIp(req)).toBe('203.0.113.195')
    })

    it('should extract IP from x-real-ip header when x-forwarded-for is missing', () => {
      const req = {
        headers: {
          'x-real-ip': '198.51.100.4',
        },
      }
      expect(extractClientIp(req)).toBe('198.51.100.4')
    })

    it('should extract IP when headers is a Web API Headers object', () => {
      const headers = new Headers()
      headers.set('x-forwarded-for', '192.0.2.1')
      const req = { headers }
      expect(extractClientIp(req)).toBe('192.0.2.1')
    })

    it('should fallback to 127.0.0.1 when no headers or req is undefined', () => {
      expect(extractClientIp(undefined)).toBe('127.0.0.1')
      expect(extractClientIp({})).toBe('127.0.0.1')
      expect(extractClientIp({ headers: {} })).toBe('127.0.0.1')
    })
  })

  describe('Progressive Delay Calculation', () => {
    it('should return correct progressive delay for various failure counts', () => {
      expect(calculateProgressiveDelay(0)).toBe(0)
      expect(calculateProgressiveDelay(1)).toBe(0)
      expect(calculateProgressiveDelay(2)).toBe(500)
      expect(calculateProgressiveDelay(3)).toBe(1000)
      expect(calculateProgressiveDelay(4)).toBe(2000)
      expect(calculateProgressiveDelay(5)).toBe(4000)
      expect(calculateProgressiveDelay(6)).toBe(5000)
      expect(calculateProgressiveDelay(10)).toBe(5000) // capped at max
    })
  })

  describe('Login Rate Limiter & Account Lockout Flow', () => {
    const testEmail = `test.user.${Date.now()}@example.com`
    const testIp = `192.168.100.${Math.floor(Math.random() * 200 + 10)}`

    beforeEach(async () => {
      await resetLoginFailCounter(testEmail)
    })

    it('should allow login attempt within rate limit', async () => {
      const result = await checkLoginRateLimit(testIp, testEmail)
      expect(result.blocked).toBe(false)
      expect(result.reason).toBeNull()
      expect(result.retryAfterSeconds).toBe(0)
    })

    it('should track and increment consecutive login failure count', async () => {
      expect(await getLoginFailCount(testEmail)).toBe(0)

      const count1 = await incrementLoginFailCounter(testEmail)
      expect(count1).toBe(1)
      expect(await getLoginFailCount(testEmail)).toBe(1)

      const count2 = await incrementLoginFailCounter(testEmail)
      expect(count2).toBe(2)
      expect(await getLoginFailCount(testEmail)).toBe(2)
    })

    it('should lock account when failure count reaches threshold (5 fails)', async () => {
      // 4 fails -> not locked
      for (let i = 1; i <= 4; i++) {
        await incrementLoginFailCounter(testEmail)
        const status = await checkAccountLockout(testEmail)
        expect(status.locked).toBe(false)
      }

      // 5th fail -> locked
      await incrementLoginFailCounter(testEmail)
      const lockStatus = await checkAccountLockout(testEmail)
      expect(lockStatus.locked).toBe(true)
      expect(lockStatus.remainingSeconds).toBeGreaterThan(0)
    })

    it('should reset failed login counter on successful login', async () => {
      await incrementLoginFailCounter(testEmail)
      await incrementLoginFailCounter(testEmail)
      expect(await getLoginFailCount(testEmail)).toBe(2)

      await resetLoginFailCounter(testEmail)
      expect(await getLoginFailCount(testEmail)).toBe(0)
      const lockStatus = await checkAccountLockout(testEmail)
      expect(lockStatus.locked).toBe(false)
    })
  })

  describe('Anti-Enumeration Timing Mitigation (Dummy Hash)', () => {
    const DUMMY_HASH =
      '$2a$10$wT8K8J5p8z9V6d.2k4xO/.ySGe7fF7KkW2Qj5m1nI0t4eQx0fJtKy'

    it('should safely execute bcrypt.compare against dummy hash without throwing', async () => {
      const isMatch = await bcrypt.compare(
        'any_random_attempted_password',
        DUMMY_HASH
      )
      expect(isMatch).toBe(false)
    })
  })
})
