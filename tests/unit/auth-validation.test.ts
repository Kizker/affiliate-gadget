import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
  resendVerificationSchema,
} from '../../src/lib/validations/auth'

describe('Auth Validation Schemas (Tahap 1)', () => {
  describe('registerSchema', () => {
    const validData = {
      name: 'John Doe',
      email: 'John.Doe@Example.COM',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      phone: '081234567890',
      role: 'CUSTOMER' as const,
    }

    it('should successfully parse valid customer registration', () => {
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('john.doe@example.com') // auto-lowercase & trim
        expect(result.data.name).toBe('John Doe')
      }
    })

    it('should successfully parse valid mitra registration', () => {
      const result = registerSchema.safeParse({
        ...validData,
        role: 'MITRA',
      })
      expect(result.success).toBe(true)
    })

    it('should normalize and lowercase email', () => {
      const result = registerSchema.safeParse({
        ...validData,
        email: '  UsEr.NaMe+Test@GMAIL.com  ',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user.name+test@gmail.com')
      }
    })

    it('should accept valid Indonesian phone formats (+62, 62, 08)', () => {
      const validPhones = [
        '081234567890',
        '+6281234567890',
        '6281987654321',
        '089999999999',
        '',
      ]

      validPhones.forEach((phone) => {
        const result = registerSchema.safeParse({ ...validData, phone })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid phone format', () => {
      const invalidPhones = [
        '07123456789',
        '12345',
        'phone123',
        '0812-3456-7890',
      ]

      invalidPhones.forEach((phone) => {
        const result = registerSchema.safeParse({ ...validData, phone })
        expect(result.success).toBe(false)
      })
    })

    describe('Password Strength Policy', () => {
      it('should reject password less than 8 characters', () => {
        const result = registerSchema.safeParse({
          ...validData,
          password: 'Pass1!',
          confirmPassword: 'Pass1!',
        })
        expect(result.success).toBe(false)
      })

      it('should reject password without uppercase letter', () => {
        const result = registerSchema.safeParse({
          ...validData,
          password: 'password123!',
          confirmPassword: 'password123!',
        })
        expect(result.success).toBe(false)
      })

      it('should reject password without lowercase letter', () => {
        const result = registerSchema.safeParse({
          ...validData,
          password: 'PASSWORD123!',
          confirmPassword: 'PASSWORD123!',
        })
        expect(result.success).toBe(false)
      })

      it('should reject password without digit number', () => {
        const result = registerSchema.safeParse({
          ...validData,
          password: 'PasswordSecret!',
          confirmPassword: 'PasswordSecret!',
        })
        expect(result.success).toBe(false)
      })

      it('should reject password without special symbol', () => {
        const result = registerSchema.safeParse({
          ...validData,
          password: 'Password12345',
          confirmPassword: 'Password12345',
        })
        expect(result.success).toBe(false)
      })

      it('should reject mismatched confirm password', () => {
        const result = registerSchema.safeParse({
          ...validData,
          password: 'Password123!',
          confirmPassword: 'PasswordDifferent123!',
        })
        expect(result.success).toBe(false)
      })
    })

    it('should allow honeypot field if provided in schema', () => {
      const result = registerSchema.safeParse({
        ...validData,
        honeypotField: 'bot-inserted-text',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.honeypotField).toBe('bot-inserted-text')
      }
    })
  })

  describe('resendVerificationSchema', () => {
    it('should accept valid email and normalize it', () => {
      const result = resendVerificationSchema.safeParse({
        email: '  User@Domain.COM  ',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user@domain.com')
      }
    })

    it('should reject invalid email format', () => {
      const result = resendVerificationSchema.safeParse({
        email: 'not-an-email',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should normalize email on login', () => {
      const result = loginSchema.safeParse({
        email: '  Customer@Test.COM ',
        password: 'anypassword',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('customer@test.com')
      }
    })
  })
})
