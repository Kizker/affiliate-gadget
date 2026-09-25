import { describe, it, expect } from 'vitest'
import {
  normalizePhone,
  isValidIndonesianPhone,
  formatPhoneDisplay,
} from '@/lib/notifications/phone-normalizer'

describe('Indonesian Phone Normalizer Suite', () => {
  it('should normalize standard local 08xx numbers to 628xx', () => {
    expect(normalizePhone('081234567890')).toBe('6281234567890')
    expect(normalizePhone('085712345678')).toBe('6285712345678')
  })

  it('should normalize international +628xx and spaced/dashed formats', () => {
    expect(normalizePhone('+62 812-3456-7890')).toBe('6281234567890')
    expect(normalizePhone('+6281234567890')).toBe('6281234567890')
    expect(normalizePhone('62 812 3456 7890')).toBe('6281234567890')
  })

  it('should normalize numbers starting with 8xx directly', () => {
    expect(normalizePhone('81234567890')).toBe('6281234567890')
  })

  it('should fix erroneous 6208xxx formatting', () => {
    expect(normalizePhone('62081234567890')).toBe('6281234567890')
  })

  it('should validate valid Indonesian mobile phone numbers', () => {
    expect(isValidIndonesianPhone('081234567890')).toBe(true)
    expect(isValidIndonesianPhone('+6281234567890')).toBe(true)
    expect(isValidIndonesianPhone('6281234567890')).toBe(true)
    expect(isValidIndonesianPhone('08991234567')).toBe(true)
  })

  it('should invalidate non-Indonesian, too short, or non-cellular numbers', () => {
    expect(isValidIndonesianPhone('0217654321')).toBe(false) // Landline
    expect(isValidIndonesianPhone('12345')).toBe(false)
    expect(isValidIndonesianPhone('')).toBe(false)
    expect(isValidIndonesianPhone('+14155552671')).toBe(false) // US number
  })

  it('should format numbers for display in 08xx-xxxx-xxxx format', () => {
    expect(formatPhoneDisplay('628123456789')).toBe('0812-3456-789')
    expect(formatPhoneDisplay('+6281234567890')).toBe('0812-3456-7890')
  })
})
