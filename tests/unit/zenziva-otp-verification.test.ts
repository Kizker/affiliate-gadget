import { describe, it, expect, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { createWhatsAppOtp, verifyWhatsAppOtp } from '@/lib/two-factor-store'

describe('Zenziva WhatsApp OTP Engine & Modal Verification', () => {
  const customerSettingsPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/settings/page.tsx'
  )
  const securityRoutePath = path.resolve(
    process.cwd(),
    'src/app/api/user/security/route.ts'
  )
  const twoFactorStorePath = path.resolve(
    process.cwd(),
    'src/lib/two-factor-store.ts'
  )

  it('memvalidasi tombol manual "Buka Pesan OTP WhatsApp" telah dihapus dari modal pengaturan', () => {
    const pageContent = fs.readFileSync(customerSettingsPagePath, 'utf-8')
    expect(pageContent).not.toContain('Buka Pesan OTP WhatsApp')
    expect(pageContent).not.toContain('ExternalLink')
    expect(pageContent).toContain('Verifikasi OTP WhatsApp')
    expect(pageContent).toContain('KODE VERIFIKASI 6-DIGIT')
  })

  it('memvalidasi pengiriman OTP WhatsApp otomatis via Zenziva provider di two-factor-store', () => {
    const storeContent = fs.readFileSync(twoFactorStorePath, 'utf-8')
    expect(storeContent).toContain('@/lib/notifications/whatsapp-provider')
    expect(storeContent).toContain('sendWhatsApp(normalizedPhone, message)')
  })

  it('memvalidasi pengiriman OTP WhatsApp otomatis via Zenziva provider di api/user/security', () => {
    const routeContent = fs.readFileSync(securityRoutePath, 'utf-8')
    expect(routeContent).toContain('@/lib/notifications/whatsapp-provider')
    expect(routeContent).toContain('sendWhatsApp(normalizedPhone, message)')
  })

  it('memvalidasi sinkronisasi kode OTP yang digenerate dengan kode yang diverifikasi', () => {
    const phone = '081299887766'
    const identifier = 'user_test_zenziva@example.com'

    const otpData = createWhatsAppOtp(identifier, phone, 'CHANGE_PASSWORD')
    expect(otpData.code).toMatch(/^\d{6}$/)
    expect(otpData.message).toContain(otpData.code)

    // Percobaan kode salah
    const wrongVerify = verifyWhatsAppOtp(
      identifier,
      '000000',
      'CHANGE_PASSWORD'
    )
    expect(wrongVerify.success).toBe(false)

    // Percobaan kode benar
    const correctVerify = verifyWhatsAppOtp(
      identifier,
      otpData.code,
      'CHANGE_PASSWORD'
    )
    expect(correctVerify.success).toBe(true)
  })
})
