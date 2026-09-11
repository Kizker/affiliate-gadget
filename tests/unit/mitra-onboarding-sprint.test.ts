import { describe, it, expect } from 'vitest'
import { storeDataSchema, registerSchema } from '../../src/lib/validations/auth'

describe('Mitra Onboarding & Store Application Validations', () => {
  describe('storeDataSchema', () => {
    const validStoreData = {
      storeName: 'Affiliate Gadget Bandung BEC',
      companyName: 'PT Digital Niaga Prima',
      taxId: '01.428.910.4-015.000',
      address: 'Gedung BEC Lantai 2 Blok A-01, Jl. Purnawarman No. 13-15',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40117',
      phone: '081234567890',
      bankName: 'Bank Central Asia (BCA)',
      accountNumber: '1234567890',
      accountName: 'PT Digital Niaga Prima',
    }

    it('should successfully parse valid store application data', () => {
      const result = storeDataSchema.safeParse(validStoreData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.storeName).toBe('Affiliate Gadget Bandung BEC')
        expect(result.data.companyName).toBe('PT Digital Niaga Prima')
        expect(result.data.city).toBe('Bandung')
        expect(result.data.province).toBe('Jawa Barat')
      }
    })

    it('should allow optional fields (taxId, postalCode, bankName, accountNumber, accountName) to be empty', () => {
      const minimalStoreData = {
        storeName: 'Affiliate Gadget Surabaya',
        companyName: 'PT Sinar Gadget Nusantara',
        address: 'WTC Surabaya Lantai 3 No. 302, Jl. Pemuda No. 27-31',
        city: 'Surabaya',
        province: 'Jawa Timur',
        phone: '031-5432109',
      }

      const result = storeDataSchema.safeParse(minimalStoreData)
      expect(result.success).toBe(true)
    })

    it('should reject storeName shorter than 3 characters', () => {
      const result = storeDataSchema.safeParse({
        ...validStoreData,
        storeName: 'AG',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          'Nama toko minimal 3 karakter'
        )
      }
    })

    it('should reject companyName shorter than 3 characters', () => {
      const result = storeDataSchema.safeParse({
        ...validStoreData,
        companyName: 'PT',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          'Nama PT/badan usaha minimal 3 karakter'
        )
      }
    })

    it('should reject address shorter than 10 characters', () => {
      const result = storeDataSchema.safeParse({
        ...validStoreData,
        address: 'Jl. Riau',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          'Alamat fisik toko minimal 10 karakter'
        )
      }
    })

    it('should reject phone shorter than 8 characters', () => {
      const result = storeDataSchema.safeParse({
        ...validStoreData,
        phone: '12345',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          'Nomor telepon minimal 8 karakter'
        )
      }
    })

    it('should auto-trim whitespace from text inputs', () => {
      const result = storeDataSchema.safeParse({
        ...validStoreData,
        storeName: '   Affiliate Gadget Roxy Mas   ',
        city: '  Jakarta Pusat  ',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.storeName).toBe('Affiliate Gadget Roxy Mas')
        expect(result.data.city).toBe('Jakarta Pusat')
      }
    })
  })

  describe('Registration multi-step role behavior', () => {
    it('should support role MITRA in registerSchema', () => {
      const result = registerSchema.safeParse({
        name: 'Mitra Owner',
        email: 'mitra.owner@test.com',
        phone: '081234567890',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'MITRA',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('MITRA')
      }
    })
  })
})
