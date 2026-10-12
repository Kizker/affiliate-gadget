import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Users Mitra Activation & Nonaktif Lifecycle Suite', () => {
  const usersPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/users/page.tsx'
  )
  const usersApiPath = path.resolve(
    process.cwd(),
    'src/app/api/admin/users/[id]/route.ts'
  )
  const registerApiPath = path.resolve(
    process.cwd(),
    'src/app/api/auth/register/route.ts'
  )

  const usersPageContent = fs.readFileSync(usersPagePath, 'utf-8')
  const usersApiContent = fs.readFileSync(usersApiPath, 'utf-8')
  const registerApiContent = fs.readFileSync(registerApiPath, 'utf-8')

  it('1. Di halaman Superadmin Kelola Pengguna, akun mitra yang belum di-acc (mitraStatus !== APPROVED) berstatus Nonaktif', () => {
    // Helper isUserActive memeriksa mitraStatus APPROVED khusus untuk role MITRA
    expect(usersPageContent).toContain('isUserActive')
    expect(usersPageContent).toContain("if (user.role === 'MITRA')")
    expect(usersPageContent).toContain(
      "user.isActive && user.mitraStatus === 'APPROVED'"
    )

    // Status badge dan button toggle menggunakan isUserActive
    expect(usersPageContent).toContain('isUserActive(user)')
    expect(usersPageContent).toContain(
      "{isUserActive(user) ? 'Aktif' : 'Nonaktif'}"
    )
    expect(usersPageContent).toContain(
      "{isUserActive(user) ? 'Nonaktifkan' : 'Aktifkan'}"
    )
  })

  it('2. Ketika Superadmin menekan tombol Aktifkan pada akun mitra, payload menyertakan mitraStatus APPROVED', () => {
    expect(usersPageContent).toContain(
      "if (user.role === 'MITRA' && newStatus)"
    )
    expect(usersPageContent).toContain("payload.mitraStatus = 'APPROVED'")
  })

  it('3. API PATCH /api/admin/users/[id] otomatis meng-acc pendaftaran mitra saat akun diaktifkan (isActive: true)', () => {
    expect(usersApiContent).toContain("if (targetRole === 'MITRA')")
    expect(usersApiContent).toContain('if (isActive === true)')
    expect(usersApiContent).toContain("updateData.mitraStatus = 'APPROVED'")
    expect(usersApiContent).toContain('isApproved: true')
    expect(usersApiContent).toContain('isActive: true')
  })

  it('4. Pendaftaran mitra baru secara otomatis berstatus nonaktif (isActive: false) hingga diaktifkan Superadmin', () => {
    expect(registerApiContent).toContain(
      "isActive: role === 'MITRA' ? false : true"
    )
  })
})
