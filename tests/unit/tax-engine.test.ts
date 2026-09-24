import { describe, it, expect } from 'vitest'
import {
  calculateOrderVat,
  verifyVatIntegrity,
  calculatePph22,
  calculatePaymentGatewayFee,
  calculateMaintenanceFee,
  generateTaxInvoiceNumber,
  type TaxConfig,
} from '@/lib/tax/tax-engine'

describe('Tax Engine — calculateOrderVat (Inclusive Only)', () => {
  const pkp11Config: TaxConfig = { isPkp: true, vatRate: 11.0 }

  it('1. Kalkulasi PPN Inklusif 11% pada Subtotal Rp 22.200.000 (DPP: Rp 20.000.000, PPN: Rp 2.200.000)', () => {
    const result = calculateOrderVat(22_200_000, pkp11Config)
    expect(result.dppAmount).toBe(20_000_000)
    expect(result.vatAmount).toBe(2_200_000)
    expect(result.vatRate).toBe(11.0)
    expect(result.taxTypeApplied).toBe('INCLUSIVE')
  })

  it('2. Zero-sum equality: dppAmount + vatAmount === subtotalAfterDiscount', () => {
    const testAmounts = [10_000_000, 15_499_000, 24_999_999, 1_234_567, 99_000]
    for (const amt of testAmounts) {
      const res = calculateOrderVat(amt, pkp11Config)
      expect(res.dppAmount + res.vatAmount).toBe(amt)
    }
  })

  it('3. Total pembayaran customer (totalWithVat) sama dengan subtotal (tidak bertambah)', () => {
    const subtotal = 18_500_000
    const result = calculateOrderVat(subtotal, pkp11Config)
    expect(result.totalWithVat).toBe(subtotal)
  })

  it('4. Status isPkp = false menghasilkan vatAmount = 0 dan dppAmount = subtotal', () => {
    const nonPkpConfig: TaxConfig = { isPkp: false, vatRate: 11.0 }
    const result = calculateOrderVat(15_000_000, nonPkpConfig)
    expect(result.vatAmount).toBe(0)
    expect(result.dppAmount).toBe(15_000_000)
    expect(result.isPkp).toBe(false)
  })

  it('5. Tarif vatRate = 0 menghasilkan vatAmount = 0', () => {
    const zeroRateConfig: TaxConfig = { isPkp: true, vatRate: 0 }
    const result = calculateOrderVat(10_000_000, zeroRateConfig)
    expect(result.vatAmount).toBe(0)
    expect(result.dppAmount).toBe(10_000_000)
  })

  it('6. Tarif dinamis 12% terhitung presisi (subtotal / 1.12)', () => {
    const rate12Config: TaxConfig = { isPkp: true, vatRate: 12.0 }
    const subtotal = 11_200_000
    const result = calculateOrderVat(subtotal, rate12Config)
    expect(result.dppAmount).toBe(10_000_000)
    expect(result.vatAmount).toBe(1_200_000)
    expect(result.vatRate).toBe(12.0)
  })

  it('7. Pembulatan integer: dppAmount dan vatAmount adalah bilangan bulat', () => {
    const oddSubtotal = 13_333_333
    const result = calculateOrderVat(oddSubtotal, pkp11Config)
    expect(Number.isInteger(result.dppAmount)).toBe(true)
    expect(Number.isInteger(result.vatAmount)).toBe(true)
    expect(result.dppAmount + result.vatAmount).toBe(oddSubtotal)
  })

  it('8. Nilai diskon voucher dipotong terlebih dahulu sebelum ekstraksi PPN', () => {
    const grossSubtotal = 20_000_000
    const voucherDiscount = 2_000_000
    const netSubtotal = grossSubtotal - voucherDiscount // 18.000.000
    const result = calculateOrderVat(netSubtotal, pkp11Config)
    // 18.000.000 / 1.11 = 16.216.216,21 -> round: 16.216.216
    expect(result.dppAmount).toBe(16_216_216)
    expect(result.vatAmount).toBe(1_783_784)
    expect(result.dppAmount + result.vatAmount).toBe(18_000_000)
  })

  it('9. verifyVatIntegrity mengembalikan true untuk perhitungan yang tepat', () => {
    const subtotal = 22_200_000
    const validClaim = { dppAmount: 20_000_000, vatAmount: 2_200_000 }
    expect(verifyVatIntegrity(validClaim, subtotal, pkp11Config)).toBe(true)
  })

  it('10. verifyVatIntegrity mengembalikan false jika nominal dimanipulasi (> Rp 1)', () => {
    const subtotal = 22_200_000
    const tamperedClaim = { dppAmount: 20_000_000, vatAmount: 1_500_000 }
    expect(verifyVatIntegrity(tamperedClaim, subtotal, pkp11Config)).toBe(false)
  })

  it('11. Penanganan subtotal 0 menghasilkan seluruh metrik bernilai 0', () => {
    const result = calculateOrderVat(0, pkp11Config)
    expect(result.dppAmount).toBe(0)
    expect(result.vatAmount).toBe(0)
    expect(result.totalWithVat).toBe(0)
  })

  it('12. Penanganan subtotal negatif di-clamp ke 0 (Math.max)', () => {
    const result = calculateOrderVat(-500_000, pkp11Config)
    expect(result.dppAmount).toBe(0)
    expect(result.vatAmount).toBe(0)
    expect(result.totalWithVat).toBe(0)
  })

  it('13. Pembulatan pecahan pada nominal kecil ganjil (Rp 100 dengan PPN 11%)', () => {
    // 100 / 1.11 = 90.09 -> round: 90. PPN = 10.
    const result = calculateOrderVat(100, pkp11Config)
    expect(result.dppAmount).toBe(90)
    expect(result.vatAmount).toBe(10)
    expect(result.dppAmount + result.vatAmount).toBe(100)
  })

  it('14. Integritas pengujian pada nominal besar (> Rp 100.000.000)', () => {
    const largeAmount = 222_000_000
    const result = calculateOrderVat(largeAmount, pkp11Config)
    expect(result.dppAmount).toBe(200_000_000)
    expect(result.vatAmount).toBe(22_000_000)
    expect(result.dppAmount + result.vatAmount).toBe(largeAmount)
  })

  it('15. Snapshot output konsisten mencantumkan taxTypeApplied === INCLUSIVE', () => {
    const result = calculateOrderVat(5_000_000, pkp11Config)
    expect(result.taxTypeApplied).toBe('INCLUSIVE')
    expect(result.vatRate).toBe(11.0)
    expect(result.isPkp).toBe(true)
  })
})

describe('Tax Engine — PPN Skema Eksklusif (EXCLUSIVE)', () => {
  it('16. Menghitung PPN eksklusif 11%: DPP = subtotal, PPN = 11% x DPP, total = DPP + PPN', () => {
    const result = calculateOrderVat(10_000_000, {
      isPkp: true,
      vatRate: 11.0,
      taxType: 'EXCLUSIVE',
    })
    expect(result.dppAmount).toBe(10_000_000)
    expect(result.vatAmount).toBe(1_100_000)
    expect(result.totalWithVat).toBe(11_100_000)
    expect(result.taxTypeApplied).toBe('EXCLUSIVE')
  })
})

describe('Tax Engine — PPh Pasal 22, Gateway Fees & Maintenance', () => {
  it('17. Kalkulasi PPh Pasal 22 (0.5% standar barang e-commerce)', () => {
    const res = calculatePph22(20_000_000, 0.5)
    expect(res.pph22Amount).toBe(100_000)
    expect(res.pph22Rate).toBe(0.5)
    expect(res.grossAmount).toBe(20_000_000)
  })

  it('18. Kalkulasi Payment Gateway dinamis QRIS (0.7%)', () => {
    const res = calculatePaymentGatewayFee('QRIS', 10_000_000)
    expect(res.method).toBe('QRIS')
    expect(res.feeAmount).toBe(70_000)
    expect(res.isPercentage).toBe(true)
  })

  it('19. Kalkulasi Payment Gateway dinamis Virtual Account (Flat Rp 4.000)', () => {
    const res = calculatePaymentGatewayFee('BCA_VA', 10_000_000)
    expect(res.method).toBe('VIRTUAL_ACCOUNT')
    expect(res.feeAmount).toBe(4_000)
    expect(res.isPercentage).toBe(false)
  })

  it('20. Kalkulasi Payment Gateway dinamis Kartu Kredit (2.9% + Rp 2.000)', () => {
    const res = calculatePaymentGatewayFee('CREDIT_CARD', 1_000_000)
    expect(res.method).toBe('CREDIT_CARD')
    expect(res.feeAmount).toBe(29_000 + 2000)
  })

  it('21. Kalkulasi Maintenance Fee (Rp 1.000 per pesanan)', () => {
    const res = calculateMaintenanceFee(5_000_000)
    expect(res.feeAmount).toBe(1_000)
  })

  it('22. Generator Nomor Seri Faktur Pajak resmi (format DJP: 010.026-26.XXXXXXXX)', () => {
    const nsfp = generateTaxInvoiceNumber('ORD-20260924-00123456')
    expect(nsfp).toMatch(/^010\.0\d{2}-\d{2}\.\d{8}$/)
    expect(nsfp).toContain('00123456')
  })
})

