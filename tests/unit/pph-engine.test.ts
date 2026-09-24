import { describe, it, expect } from 'vitest'
import { calculatePph23, calculateFullOrderTax } from '@/lib/tax/tax-engine'

describe('PPh Engine (Komponen 2: PPh 23 Otomatis & Standar CV)', () => {
  describe('calculatePph23', () => {
    it('1. Menghitung PPh 23 sebesar 2% dari komisi bruto Rp 440.000 -> Rp 8.800', () => {
      const result = calculatePph23(440000)
      expect(result.pph23Amount).toBe(8800)
      expect(result.pph23Rate).toBe(2.0)
      expect(result.commissionVat).toBe(48400) // 11% x 440.000
      expect(result.netCommissionBurden).toBe(479600) // 440.000 + 48.400 - 8.800
    })

    it('2. PPh 23 bernilai 0 jika commissionGross = 0', () => {
      const result = calculatePph23(0)
      expect(result.pph23Amount).toBe(0)
      expect(result.commissionVat).toBe(0)
      expect(result.netCommissionBurden).toBe(0)
    })

    it('3. netCommissionBurden terhitung presisi: komisi + PPN jasa - PPh 23', () => {
      const commission = 1250000
      const result = calculatePph23(commission)
      const expectedVat = Math.round(commission * 0.11)
      const expectedPph23 = Math.round(commission * 0.02)
      expect(result.commissionVat).toBe(expectedVat)
      expect(result.pph23Amount).toBe(expectedPph23)
      expect(result.netCommissionBurden).toBe(
        commission + expectedVat - expectedPph23
      )
    })

    it('4. PPN Jasa Komisi adalah 11% dari komisi bruto', () => {
      const result = calculatePph23(1000000)
      expect(result.commissionVat).toBe(110000)
    })

    it('5. Pembulatan integer: hasil kalkulasi selalu bilangan bulat', () => {
      const result = calculatePph23(333333)
      expect(Number.isInteger(result.pph23Amount)).toBe(true)
      expect(Number.isInteger(result.commissionVat)).toBe(true)
      expect(Number.isInteger(result.netCommissionBurden)).toBe(true)
    })

    it('6. Menangani komisi nominal kecil (Rp 1) secara aman tanpa NaN', () => {
      const result = calculatePph23(1)
      expect(result.pph23Amount).toBe(0)
      expect(result.commissionVat).toBe(0)
      expect(result.netCommissionBurden).toBe(1)
    })

    it('7. Mendukung tarif PPh 23 kustom 4% (untuk non-NPWP)', () => {
      const result = calculatePph23(440000, 4.0)
      expect(result.pph23Amount).toBe(17600) // 4% x 440.000
      expect(result.netCommissionBurden).toBe(440000 + 48400 - 17600)
    })

    it('8. Menangani komisi negatif secara aman (Math.max 0)', () => {
      const result = calculatePph23(-50000)
      expect(result.pph23Amount).toBe(0)
      expect(result.commissionVat).toBe(0)
      expect(result.netCommissionBurden).toBe(0)
    })

    it('9. Memastikan integritas zero-sum: netCommissionBurden + pph23Amount === commissionGross + commissionVat', () => {
      const commission = 789456
      const result = calculatePph23(commission)
      expect(result.netCommissionBurden + result.pph23Amount).toBe(
        commission + result.commissionVat
      )
    })

    it('10. PPh 23 selalu aktif otomatis permanen pada 2% tanpa toggle manual', () => {
      const result = calculatePph23(500000)
      expect(result.pph23Amount).toBe(10000)
      expect(result.pph23Rate).toBe(2.0)
    })
  })

  describe('calculateFullOrderTax', () => {
    it('11. Menghitung PPN inklusif + PPh 23 komisi secara otomatis tanpa PPh Final', () => {
      // Skenario simulasi: HP Rp 22.000.000, komisi 2% = Rp 440.000
      const subtotal = 22000000
      const commission = 440000
      const fullTax = calculateFullOrderTax(subtotal, commission, {
        isPkp: true,
        vatRate: 11.0,
      })

      // PPN Inklusif
      expect(fullTax.dppAmount).toBe(19819820)
      expect(fullTax.vatAmount).toBe(2180180)
      expect(fullTax.totalWithVat).toBe(22000000)

      // PPh 23
      expect(fullTax.pph23Amount).toBe(8800)
      expect(fullTax.commissionVat).toBe(48400)
      expect(fullTax.netCommissionBurden).toBe(479600)
    })

    it('12. Menjaga total customer tidak berubah meski kewajiban pajak aktif', () => {
      const subtotal = 15000000
      const commission = 300000
      const fullTax = calculateFullOrderTax(subtotal, commission)
      expect(fullTax.totalWithVat).toBe(subtotal)
    })
  })
})
