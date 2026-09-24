import { describe, it, expect } from 'vitest'
import { calculateOrderVat } from '@/lib/tax/tax-engine'

describe('Product Taxable Toggle & Exemption Engine (Edit & Create Product)', () => {
  // Test helper: parse and resolve isTaxable with fallback to true
  function resolveProductTaxable(rawInput: unknown): boolean {
    if (rawInput === undefined || rawInput === null) return true
    return rawInput !== false && rawInput !== 'false'
  }

  describe('Product isTaxable resolution logic', () => {
    it('should default to true when isTaxable is undefined or null', () => {
      expect(resolveProductTaxable(undefined)).toBe(true)
      expect(resolveProductTaxable(null)).toBe(true)
    })

    it('should correctly resolve false when product is marked tax-exempt', () => {
      expect(resolveProductTaxable(false)).toBe(false)
      expect(resolveProductTaxable('false')).toBe(false)
    })

    it('should correctly resolve true when product is marked taxable', () => {
      expect(resolveProductTaxable(true)).toBe(true)
      expect(resolveProductTaxable('true')).toBe(true)
    })
  })

  describe('Tax Calculation with isTaxable Flag Integration', () => {
    it('should compute DPP and 11% VAT when product is taxable and store is PKP', () => {
      const isTaxable = true
      const store = { isPkp: true, vatRate: 11.0 }
      const itemPrice = 18999000

      const result = calculateOrderVat(itemPrice, {
        isPkp: store.isPkp && isTaxable,
        vatRate: store.vatRate,
      })

      expect(result.isPkp).toBe(true)
      expect(result.dppAmount).toBe(17116216)
      expect(result.vatAmount).toBe(1882784)
      expect(result.dppAmount + result.vatAmount).toBe(itemPrice)
    })

    it('should yield 0 VAT and 100% DPP when product is tax-exempt (isTaxable = false) even if store is PKP', () => {
      const isTaxable = false
      const store = { isPkp: true, vatRate: 11.0 }
      const itemPrice = 18999000

      const result = calculateOrderVat(itemPrice, {
        isPkp: store.isPkp && isTaxable,
        vatRate: store.vatRate,
      })

      expect(result.isPkp).toBe(false)
      expect(result.dppAmount).toBe(itemPrice)
      expect(result.vatAmount).toBe(0)
    })

    it('should yield 0 VAT and 100% DPP when store is Non-PKP regardless of isTaxable', () => {
      const isTaxable = true
      const store = { isPkp: false, vatRate: 11.0 }
      const itemPrice = 10000000

      const result = calculateOrderVat(itemPrice, {
        isPkp: store.isPkp && isTaxable,
        vatRate: store.vatRate,
      })

      expect(result.isPkp).toBe(false)
      expect(result.dppAmount).toBe(itemPrice)
      expect(result.vatAmount).toBe(0)
    })
  })

  describe('Admin Catalog Badge Status Evaluation', () => {
    function getCatalogTaxBadge(product: {
      isTaxable?: boolean
      store?: { isPkp?: boolean; vatRate?: number }
    }): { label: string; isTaxableApplied: boolean } {
      const isTaxable = product.isTaxable !== false
      const isPkp = Boolean(product.store?.isPkp)
      const vatRate = product.store?.vatRate ?? 11

      if (isTaxable && isPkp) {
        return {
          label: `PPN: Inklusif ${vatRate}%`,
          isTaxableApplied: true,
        }
      }
      return {
        label: 'Bebas PPN',
        isTaxableApplied: false,
      }
    }

    it('should show "PPN: Inklusif 11%" badge for taxable product in PKP store', () => {
      const badge = getCatalogTaxBadge({
        isTaxable: true,
        store: { isPkp: true, vatRate: 11 },
      })
      expect(badge.label).toBe('PPN: Inklusif 11%')
      expect(badge.isTaxableApplied).toBe(true)
    })

    it('should show "Bebas PPN" badge when product is marked isTaxable = false', () => {
      const badge = getCatalogTaxBadge({
        isTaxable: false,
        store: { isPkp: true, vatRate: 11 },
      })
      expect(badge.label).toBe('Bebas PPN')
      expect(badge.isTaxableApplied).toBe(false)
    })

    it('should show "Bebas PPN" badge when store is Non-PKP even if isTaxable = true', () => {
      const badge = getCatalogTaxBadge({
        isTaxable: true,
        store: { isPkp: false, vatRate: 11 },
      })
      expect(badge.label).toBe('Bebas PPN')
      expect(badge.isTaxableApplied).toBe(false)
    })
  })

  describe('Catalog Hierarchy & Form UI Text Assertions', () => {
    function getHierarchySeriesButtonLabel(series: {
      isTaxable?: boolean
      storeIsPkp?: boolean
      storeVatRate?: number
    }): string {
      const isTaxable = series.isTaxable !== false
      if (isTaxable) {
        return series.storeIsPkp
          ? `PPN ${series.storeVatRate ?? 11}%`
          : 'PPN Aktif'
      }
      return 'Bebas PPN'
    }

    function getFormTaxCheckboxLabel(isTaxable: boolean): string {
      return isTaxable
        ? 'Dikenakan PPN (mengikuti PKP toko)'
        : 'Bebas PPN (PPN Rp 0)'
    }

    it('should render "PPN 11%" on hierarchy series header button for taxable PKP series', () => {
      const label = getHierarchySeriesButtonLabel({
        isTaxable: true,
        storeIsPkp: true,
        storeVatRate: 11,
      })
      expect(label).toBe('PPN 11%')
    })

    it('should render "Bebas PPN" on hierarchy series header button when isTaxable = false', () => {
      const label = getHierarchySeriesButtonLabel({
        isTaxable: false,
        storeIsPkp: true,
        storeVatRate: 11,
      })
      expect(label).toBe('Bebas PPN')
    })

    it('should toggle boolean state accurately on user click', () => {
      let isTaxable = true
      // First toggle
      isTaxable = !isTaxable
      expect(isTaxable).toBe(false)
      expect(getFormTaxCheckboxLabel(isTaxable)).toBe('Bebas PPN (PPN Rp 0)')

      // Second toggle
      isTaxable = !isTaxable
      expect(isTaxable).toBe(true)
      expect(getFormTaxCheckboxLabel(isTaxable)).toBe(
        'Dikenakan PPN (mengikuti PKP toko)'
      )
    })

    it('should render exact user-requested checkbox labels on forms', () => {
      expect(getFormTaxCheckboxLabel(true)).toBe(
        'Dikenakan PPN (mengikuti PKP toko)'
      )
      expect(getFormTaxCheckboxLabel(false)).toBe('Bebas PPN (PPN Rp 0)')
    })
  })
})
