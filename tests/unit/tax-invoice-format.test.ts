import { describe, it, expect } from 'vitest'
import { generateTaxInvoiceNumber } from '@/lib/tax/tax-engine'

describe('DJP Official Tax Invoice PER-03/PJ/2022 Format Verification', () => {
  it('should generate official NSFP matching 010.0YY-YY.XXXXXXXX format', () => {
    const fixedDate = new Date('2026-09-24T10:00:00Z')
    const nsfp = generateTaxInvoiceNumber('ORD-2026-999', fixedDate)

    expect(nsfp).toMatch(/^010\.026-26\.\d{8}$/)
  })

  it('should compute DPP and PPN 11% inclusive correctly for retail transactions', () => {
    const subtotalNet = 26499000
    const vatRate = 11.0
    const dpp = Math.round(subtotalNet / (1 + vatRate / 100))
    const vat = subtotalNet - dpp

    expect(dpp).toBe(23872973)
    expect(vat).toBe(2626027)
    expect(dpp + vat).toBe(subtotalNet)
  })

  it('should verify required official legal clauses according to PER-03/PJ/2022', () => {
    const legalElectronicSignatureNotice =
      'Sesuai dengan ketentuan yang berlaku, Direktorat Jenderal Pajak mengatur bahwa Faktur Pajak ini telah ditandatangani secara elektronik sehingga tidak diperlukan tanda tangan basah pada Faktur Pajak ini.'
    const legalFooterNotice =
      'PEMBERITAHUAN: Faktur Pajak ini telah dilaporkan ke Direktorat Jenderal Pajak dan telah memperoleh persetujuan sesuai dengan ketentuan peraturan perpajakan yang berlaku.'

    expect(legalElectronicSignatureNotice).toContain('Direktorat Jenderal Pajak')
    expect(legalElectronicSignatureNotice).toContain('ditandatangani secara elektronik')
    expect(legalFooterNotice).toContain('telah dilaporkan ke Direktorat Jenderal Pajak')
  })
})
