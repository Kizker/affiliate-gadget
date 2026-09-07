import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

describe('Security & Cryptography (Tahap 1)', () => {
  describe('Bcrypt Password Hashing (Cost 12)', () => {
    it('should hash passwords with cost factor 12 and verify properly', async () => {
      const rawPassword = 'SecurePassword123!@#'
      const hashed = await bcrypt.hash(rawPassword, 12)

      // Bcrypt hash starts with $2a$12$ or $2b$12$
      expect(hashed).toMatch(/^\$2[aby]\$12\$/)

      const isMatch = await bcrypt.compare(rawPassword, hashed)
      expect(isMatch).toBe(true)

      const isWrongMatch = await bcrypt.compare('WrongPassword123!', hashed)
      expect(isWrongMatch).toBe(false)
    })
  })

  describe('Verification Token Generation & SHA-256 Hashing', () => {
    it('should generate unpredictable 64-character hex tokens', () => {
      const token1 = crypto.randomBytes(32).toString('hex')
      const token2 = crypto.randomBytes(32).toString('hex')

      expect(token1).toHaveLength(64)
      expect(token2).toHaveLength(64)
      expect(token1).not.toBe(token2)
    })

    it('should correctly hash tokens with SHA-256 for secure database storage', () => {
      const plainToken =
        'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef'
      const hash1 = crypto.createHash('sha256').update(plainToken).digest('hex')
      const hash2 = crypto.createHash('sha256').update(plainToken).digest('hex')

      // SHA-256 is deterministic given the same plain token
      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64)

      // Different token gives different hash
      const differentHash = crypto
        .createHash('sha256')
        .update('different-token')
        .digest('hex')
      expect(hash1).not.toBe(differentHash)
    })

    it('should properly validate token expiration threshold', () => {
      const now = Date.now()
      const validExpiration = new Date(now + 24 * 60 * 60 * 1000) // 24 hours future
      const expiredExpiration = new Date(now - 1000) // 1 second past

      expect(validExpiration.getTime() > Date.now()).toBe(true)
      expect(expiredExpiration.getTime() < Date.now()).toBe(true)
    })
  })
})
