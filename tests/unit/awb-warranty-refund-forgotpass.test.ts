import { describe, it, expect } from 'vitest'
import { calculateNetRefundAmount } from '@/lib/returns/refund-calculator'

describe('Comprehensive Verification Suite: 4 New Requirements', () => {
  describe('1. Task 1: AWB Thermal Shipping Label Product Concealment', () => {
    it('should NOT leak specific gadget models in generic thermal label packaging', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const filePath = path.join(
        process.cwd(),
        'src/components/shipping/thermal-shipping-label.tsx'
      )
      const content = fs.readFileSync(filePath, 'utf-8')

      // Verifikasi bahwa nama produk spesifik disensor menjadi 'Paket Segel Elektronik & Aksesoris'
      expect(content).toContain('Paket Segel Elektronik & Aksesoris')
      // Pastikan string lama 'Unit: ${itemName}' sudah dihapus dari HTML print
      expect(content).not.toContain('<span>Unit: ${itemName}')
      // Pastikan on-screen preview juga menggunakan Paket Segel Elektronik
      expect(content).toContain('Isi Paket: Paket Segel Elektronik & Aksesoris')
    })
  })

  describe('2. Task 2: Mandatory Checkout Warranty (Cannot Be Unchecked)', () => {
    it('should enforce locked warranty checkbox in desktop checkout', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const checkoutFile = path.join(process.cwd(), 'src/app/checkout/page.tsx')
      const content = fs.readFileSync(checkoutFile, 'utf-8')

      expect(content).toContain(
        'const [termsAccepted, setTermsAccepted] = useState(true)'
      )
      expect(content).toMatch(/disabled=\{true\}\s+readOnly=\{true\}/)
      expect(content).toContain('[Wajib]')
    })

    it('should enforce locked warranty checkbox in mobile checkout view', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const mobileCheckoutFile = path.join(
        process.cwd(),
        'src/components/checkout/mobile-shopee-checkout-view.tsx'
      )
      const content = fs.readFileSync(mobileCheckoutFile, 'utf-8')

      expect(content).toContain('checked={true}')
      expect(content).toContain('disabled={true}')
      expect(content).toContain('readOnly={true}')
      expect(content).toContain('cursor-not-allowed')
      expect(content).toContain('[Wajib]')
    })

    it('should enforce locked warranty checkbox in direct checkout page', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const directCheckoutFile = path.join(
        process.cwd(),
        'src/app/checkout/direct/page.tsx'
      )
      const content = fs.readFileSync(directCheckoutFile, 'utf-8')

      expect(content).toContain(
        'const [termsAccepted, setTermsAccepted] = useState(true)'
      )
      expect(content).toContain('disabled={true}')
      expect(content).toContain('readOnly={true}')
    })
  })

  describe('3. Task 3: Refund Calculations After Operational Deductions (Shipping, Tax, Operational/QC)', () => {
    it('should deduct shipping cost, tax, insurance fee, and operational fee from order total', () => {
      const mockOrder = {
        total: 5_000_000,
        subtotal: 4_900_000,
        shippingCost: 35_000,
        tax: 50_000,
        insuranceFee: 15_000,
      }

      const calc = calculateNetRefundAmount(mockOrder)

      // Expected operational fee: 3% of 4.900.000 = 147.000
      expect(calc.operationalFee).toBe(147_000)
      expect(calc.shippingCost).toBe(35_000)
      expect(calc.taxDeduction).toBe(50_000)
      expect(calc.insuranceFee).toBe(15_000)

      // Total deductions = 35.000 + 50.000 + 15.000 + 147.000 = 247.000
      expect(calc.totalDeductions).toBe(247_000)

      // Net refund = 5.000.000 - 247.000 = 4.753.000
      expect(calc.netRefundAmount).toBe(4_753_000)
    })

    it('should enforce minimum operational fee for small orders', () => {
      const mockSmallOrder = {
        total: 200_000,
        subtotal: 180_000,
        shippingCost: 15_000,
        tax: 0,
        insuranceFee: 5_000,
      }

      const calc = calculateNetRefundAmount(mockSmallOrder)

      // 3% of 180.000 is 5.400, so minimum 25.000 should apply
      expect(calc.operationalFee).toBe(25_000)
      expect(calc.totalDeductions).toBe(15_000 + 0 + 5_000 + 25_000) // 45.000
      expect(calc.netRefundAmount).toBe(155_000)
    })

    it('should never produce negative net refund amount', () => {
      const mockExtremeOrder = {
        total: 30_000,
        subtotal: 10_000,
        shippingCost: 20_000,
        tax: 5_000,
        insuranceFee: 10_000,
      }

      const calc = calculateNetRefundAmount(mockExtremeOrder)
      expect(calc.netRefundAmount).toBe(0)
    })
  })

  describe('4. Task 4: Admin Store Settings Forgot Password Feature', () => {
    it('should have forgot password link and reset action card in admin settings', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const settingsFile = path.join(
        process.cwd(),
        'src/app/dashboard/admin/settings/page.tsx'
      )
      const content = fs.readFileSync(settingsFile, 'utf-8')

      // Verifikasi Link lupa password
      expect(content).toContain('Lupa Password?')
      expect(content).toContain('/forgot-password?email=')
      // Verifikasi card bantuan reset password via email
      expect(content).toContain('Lupa Password Lama?')
      expect(content).toContain('Reset Password')
    })
  })
})
