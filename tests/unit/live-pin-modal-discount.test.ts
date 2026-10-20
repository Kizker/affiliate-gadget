import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Live Pin Special Discount Modal Suite', () => {
  const rootDir = process.cwd()
  const broadcasterPath = path.join(
    rootDir,
    'src',
    'components',
    'live',
    'live-stream-broadcaster.tsx'
  )
  const broadcasterContent = fs.readFileSync(broadcasterPath, 'utf-8')

  it('1. verifies inline discount form and notes are removed from drawer and catalog product cards', () => {
    // Should NOT have inline "Diskon Ekstra Saat Disematkan (Rp):" inside product cards list
    expect(broadcasterContent).not.toContain(
      'Diskon Ekstra Saat Disematkan (Rp):'
    )
    expect(broadcasterContent).not.toContain(
      'Diskon Ekstra Saat Sematkan / Diskon (Rp):'
    )
  })

  it('2. verifies Sematkan button opens dedicated pin modal instead of pinning directly with inline form', () => {
    expect(broadcasterContent).toContain('handleOpenPinModal(p)')
    expect(broadcasterContent).toContain(
      'const handleOpenPinModal = (prod: StoreProduct) => {'
    )
    expect(broadcasterContent).toContain('setPinModalProduct(prod)')
    expect(broadcasterContent).toContain("setPinModalDiscount('')")
  })

  it('3. verifies pin modal displays product preview, auto-focused numeric discount input with formatPriceInput', () => {
    expect(broadcasterContent).toContain('pinModalProduct')
    expect(broadcasterContent).toContain('Diskon Spesial Live')
    expect(broadcasterContent).toContain('value={pinModalDiscount}')
    expect(broadcasterContent).toContain(
      'setPinModalDiscount(formatPriceInput(e.target.value))'
    )
    expect(broadcasterContent).toContain('autoFocus')
    expect(broadcasterContent).toContain('inputMode="numeric"')
  })

  it('4. verifies pin modal handles confirmation and cancellation properly', () => {
    expect(broadcasterContent).toContain('const handleCancelPinModal = () => {')
    expect(broadcasterContent).toContain(
      'const handleConfirmPinModal = () => {'
    )
    expect(broadcasterContent).toContain(
      'handlePinProduct(pinModalProduct, discountPrice)'
    )
    expect(broadcasterContent).toContain('Sematkan Sekarang')
  })
})
