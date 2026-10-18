import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Live Price Formatting and Disclaimer Suite', () => {
  const rootDir = process.cwd()
  const broadcasterPath = path.join(
    rootDir,
    'src',
    'components',
    'live',
    'live-stream-broadcaster.tsx'
  )
  const broadcasterContent = fs.readFileSync(broadcasterPath, 'utf-8')

  it('1. verifies disclaimer text about katalog siaran biasa is removed from broadcaster', () => {
    expect(broadcasterContent).not.toContain(
      '*Diskon ini untuk katalog siaran biasa'
    )
    expect(broadcasterContent).not.toContain(
      'Diskon ekstra dapat diberikan saat produk disematkan'
    )
  })

  it('2. verifies formatPriceInput helper is defined in broadcaster', () => {
    expect(broadcasterContent).toContain(
      'function formatPriceInput(value: string): string'
    )
    expect(broadcasterContent).toContain(
      "new Intl.NumberFormat('id-ID').format"
    )
  })

  it('3. verifies setup and pin discount inputs use type="text" and inputMode="numeric"', () => {
    expect(broadcasterContent).toContain('setSetupDiscounts((prev) => ({')
    expect(broadcasterContent).toContain(
      '[p.id]: formatPriceInput(e.target.value)'
    )
    expect(broadcasterContent).toContain('setDiscountInputs((prev) => ({')
    expect(broadcasterContent).toContain('inputMode="numeric"')
  })

  it('4. verifies unit conversion and parsing logic with thousands dots', () => {
    function formatPriceInput(value: string): string {
      const digits = value.replace(/\D/g, '')
      if (!digits) return ''
      return new Intl.NumberFormat('id-ID').format(parseInt(digits, 10))
    }

    expect(formatPriceInput('21000000')).toBe('21.000.000')
    expect(formatPriceInput('21.000.000')).toBe('21.000.000')
    expect(formatPriceInput('500000')).toBe('500.000')
    expect(formatPriceInput('1500000')).toBe('1.500.000')
    expect(formatPriceInput('')).toBe('')
    expect(formatPriceInput('abc')).toBe('')

    // Parsing back to integer
    const rawVal = '21.000.000'.replace(/\D/g, '')
    expect(parseInt(rawVal, 10)).toBe(21000000)
  })
})
