import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Settings & Forgot Password Inline OTP Enhancement', () => {
  const adminSettingsFile = path.join(
    process.cwd(),
    'src/app/dashboard/admin/settings/page.tsx'
  )
  const forgotPasswordFile = path.join(
    process.cwd(),
    'src/app/forgot-password/page.tsx'
  )

  const adminSettingsContent = fs.readFileSync(adminSettingsFile, 'utf-8')
  const forgotPasswordContent = fs.readFileSync(forgotPasswordFile, 'utf-8')

  describe('1. Admin Settings: Penghapusan Keterangan Red-Lined', () => {
    it('harus menghapus teks penjelasan panjang di dalam kartu Lupa Password Lama', () => {
      expect(adminSettingsContent).not.toContain(
        'Jika Anda lupa password lama, gunakan fitur verifikasi OTP'
      )
    })

    it('harus menghapus teks panduan pengosongan kolom sandi (shield card)', () => {
      expect(adminSettingsContent).not.toContain(
        'Kosongkan kolom sandi jika Anda hanya ingin memperbarui data'
      )
    })
  })

  describe('2. Admin Settings: Alur Reset Password via OTP Inline', () => {
    it('harus memiliki handler untuk memulai request OTP langsung ke email pengelola', () => {
      expect(adminSettingsContent).toContain('handleStartResetPassword')
      expect(adminSettingsContent).toContain("action: 'request-otp'")
    })

    it('harus menampilkan input form untuk memasukkan 6-digit kode OTP', () => {
      expect(adminSettingsContent).toContain('Kode OTP (6 Digit)')
      expect(adminSettingsContent).toContain('handleVerifyResetOtp')
      expect(adminSettingsContent).toContain("action: 'verify-otp'")
    })

    it('harus memunculkan input password baru tepat di bawah OTP setelah kode OTP terverifikasi benar', () => {
      expect(adminSettingsContent).toContain('isResetOtpVerified')
      expect(adminSettingsContent).toContain('Kode OTP Terverifikasi')
      expect(adminSettingsContent).toContain('handleSaveNewPasswordWithOtp')
      expect(adminSettingsContent).toContain("action: 'reset-password'")
    })

    it('harus tetap menjaga string kompatibilitas test dan fallback link', () => {
      expect(adminSettingsContent).toContain('Lupa Password?')
      expect(adminSettingsContent).toContain('/forgot-password?email=')
      expect(adminSettingsContent).toContain('Lupa Password Lama?')
      expect(adminSettingsContent).toContain('Reset Password')
    })
  })

  describe('3. Forgot Password Page: Auto-send OTP & Inline Password Form', () => {
    it('harus otomatis mengirimkan OTP jika query parameter email tersedia', () => {
      expect(forgotPasswordContent).toContain(
        'handleRequestOtp(undefined, emailParam)'
      )
    })

    it('harus merender form kata sandi baru langsung di bawah OTP setelah terverifikasi', () => {
      expect(forgotPasswordContent).toContain('isOtpVerified')
      expect(forgotPasswordContent).toContain('Kode OTP Terverifikasi')
      expect(forgotPasswordContent).toContain('Input Kata Sandi Baru')
      expect(forgotPasswordContent).toContain('Simpan Kata Sandi Baru')
    })
  })
})
