import { describe, it, expect } from 'vitest'
import {
  validateBankAccountFormat,
  resolveBankSpec,
} from '@/lib/bank-validation'

describe('Bank Account Validation Engine Suite', () => {
  it('1. Memvalidasi jumlah digit wajib sesuai masing-masing bank di Indonesia', () => {
    // Bank Mandiri wajib 13 digit
    expect(
      validateBankAccountFormat('Bank Mandiri', '1230009876543').valid
    ).toBe(true)
    expect(validateBankAccountFormat('Bank Mandiri', '1230009876').valid).toBe(
      false
    )

    // BCA wajib 10 digit
    expect(
      validateBankAccountFormat('BCA (Bank Central Asia)', '5240987654').valid
    ).toBe(true)
    expect(
      validateBankAccountFormat('BCA (Bank Central Asia)', '5240987654123')
        .valid
    ).toBe(false)

    // BRI wajib 15 digit
    expect(
      validateBankAccountFormat(
        'BRI (Bank Rakyat Indonesia)',
        '034101000743305'
      ).valid
    ).toBe(true)
    expect(
      validateBankAccountFormat('BRI (Bank Rakyat Indonesia)', '0341010007')
        .valid
    ).toBe(false)

    // BNI & BSI wajib 10 digit
    expect(
      validateBankAccountFormat('BNI (Bank Negara Indonesia)', '0842119876')
        .valid
    ).toBe(true)
    expect(
      validateBankAccountFormat('BSI (Bank Syariah Indonesia)', '7148920123')
        .valid
    ).toBe(true)
  })

  it('2. Menolak nomor rekening fiktif / angka berulang / urutan dummy', () => {
    expect(
      validateBankAccountFormat('BCA (Bank Central Asia)', '1111111111').valid
    ).toBe(false)
    expect(
      validateBankAccountFormat('BCA (Bank Central Asia)', '0000000000').valid
    ).toBe(false)
    expect(
      validateBankAccountFormat('BCA (Bank Central Asia)', '1234567890').valid
    ).toBe(false)
    expect(
      validateBankAccountFormat('Bank Mandiri', '1234567890123').valid
    ).toBe(false)
  })

  it('3. Memetakan kode Midtrans Iris dengan benar untuk setiap bank', () => {
    expect(resolveBankSpec('Bank Mandiri').irisCode).toBe('mandiri')
    expect(resolveBankSpec('BCA (Bank Central Asia)').irisCode).toBe('bca')
    expect(resolveBankSpec('BRI (Bank Rakyat Indonesia)').irisCode).toBe('bri')
    expect(resolveBankSpec('BNI (Bank Negara Indonesia)').irisCode).toBe('bni')
    expect(resolveBankSpec('BSI (Bank Syariah Indonesia)').irisCode).toBe('bsi')
    expect(resolveBankSpec('CIMB Niaga').irisCode).toBe('cimb')
  })
})
