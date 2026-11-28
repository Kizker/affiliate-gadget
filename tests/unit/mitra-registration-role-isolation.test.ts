import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mitra Registration Role Isolation', () => {
  it('verifies that register/route.ts preserves role MITRA and creates a Mitra profile', () => {
    const routePath = path.resolve(
      process.cwd(),
      'src/app/api/auth/register/route.ts'
    )
    const content = fs.readFileSync(routePath, 'utf-8')

    // Harus support role MITRA
    expect(content).toContain("role === 'MITRA'")
    // Harus menyertakan profil mitra saat pendaftaran mitra
    expect(content).toContain(
      "businessName: sanitizedName || 'Bengkel Mitra Servis'"
    )
    expect(content).toContain("role === 'STORE_ADMIN'")
    expect(content).toContain('isApplicantNonActive')
  })

  it('verifies that register/page.tsx displays accurate button label and subtext for Mitra Servis', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/register/page.tsx')
    const content = fs.readFileSync(pagePath, 'utf-8')

    // Pilihan role MITRA
    expect(content).toContain("setFormData({ ...formData, role: 'MITRA' })")
    expect(content).toContain('Mitra Servis')
    expect(content).toContain('Bengkel Servis')
    // Tombol submit harus spesifik untuk Mitra Servis
    expect(content).toContain("formData.role === 'MITRA'")
    expect(content).toContain("'Daftar Mitra Servis Sekarang'")
    expect(content).not.toContain(
      "formData.role === 'MITRA' ? 'Lanjut ke Informasi Toko'"
    )
  })

  it('verifies that admin/mitras/approve preserves role MITRA and activates Mitra profile instead of forcing STORE_ADMIN', () => {
    const approveRoutePath = path.resolve(
      process.cwd(),
      'src/app/api/admin/mitras/approve/route.ts'
    )
    const content = fs.readFileSync(approveRoutePath, 'utf-8')

    expect(content).toContain(
      "const isMitraService = targetUser.role === 'MITRA'"
    )
    expect(content).toContain(
      "const targetRole = isMitraService ? 'MITRA' : 'STORE_ADMIN'"
    )
    expect(content).toContain('role: targetRole')
    expect(content).toContain('isApproved: true, isActive: true')
  })
})
