import { describe, it, expect } from 'vitest'
import { formatRupiahInput, parseRupiahInput } from '../../src/lib/utils'

describe('Rupiah Thousand Separator Input Helpers', () => {
  describe('formatRupiahInput', () => {
    it('should format raw numeric string with dots', () => {
      expect(formatRupiahInput('27750000')).toBe('27.750.000')
      expect(formatRupiahInput('20999000')).toBe('20.999.000')
      expect(formatRupiahInput('18999000')).toBe('18.999.000')
      expect(formatRupiahInput('5000')).toBe('5.000')
      expect(formatRupiahInput('500')).toBe('500')
    })

    it('should handle already formatted strings and clean non-digits', () => {
      expect(formatRupiahInput('27.750.000')).toBe('27.750.000')
      expect(formatRupiahInput('Rp 27.750.000')).toBe('27.750.000')
      expect(formatRupiahInput('Rp 1.500.000')).toBe('1.500.000')
    })

    it('should handle numbers, empty, null, or undefined', () => {
      expect(formatRupiahInput(22999000)).toBe('22.999.000')
      expect(formatRupiahInput('')).toBe('')
      expect(formatRupiahInput(null)).toBe('')
      expect(formatRupiahInput(undefined)).toBe('')
    })
  })

  describe('parseRupiahInput', () => {
    it('should parse formatted strings into pure numbers', () => {
      expect(parseRupiahInput('27.750.000')).toBe(27750000)
      expect(parseRupiahInput('20.999.000')).toBe(20999000)
      expect(parseRupiahInput('500.000')).toBe(500000)
      expect(parseRupiahInput('Rp 18.999.000')).toBe(18999000)
    })

    it('should return 0 for empty or falsy inputs', () => {
      expect(parseRupiahInput('')).toBe(0)
      expect(parseRupiahInput(null)).toBe(0)
      expect(parseRupiahInput(undefined)).toBe(0)
    })
  })
})
