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

  it('1. Di halaman Superadmin Kelola Pengguna, akun mitra/admin toko yang belum di-acc (mitraStatus !== APPROVED) berstatus Nonaktif', () => {
    // Helper isUserActive memeriksa mitraStatus APPROVED untuk role MITRA dan STORE_ADMIN
    expect(usersPageContent).toContain('isUserActive')
    expect(usersPageContent).toContain(
      "if (user.role === 'MITRA' || user.role === 'STORE_ADMIN')"
    )
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

  it('2. Ketika Superadmin menekan tombol Aktifkan pada akun mitra/admin toko, payload menyertakan mitraStatus APPROVED dan mempertahankan role asli', () => {
    expect(usersPageContent).toContain(
      "if (user.role === 'MITRA' && newStatus)"
    )
    expect(usersPageContent).toContain(
      "if (user.role === 'STORE_ADMIN' && newStatus)"
    )
    expect(usersPageContent).toContain("payload.mitraStatus = 'APPROVED'")
    expect(usersPageContent).toContain('role: user.role')
  })

  it('3. API PATCH /api/admin/users/[id] TIDAK mengubah role STORE_ADMIN menjadi MITRA saat mitraStatus APPROVED dikirim', () => {
    expect(usersApiContent).toContain(
      "if (mitraStatus !== undefined && targetRole === 'MITRA')"
    )
    expect(usersApiContent).toContain("if (targetRole === 'STORE_ADMIN')")
    expect(usersApiContent).toContain("updateData.role = 'STORE_ADMIN'")
  })

  it('4. Pendaftaran mitra baru secara otomatis berstatus nonaktif (isActive: false) hingga diaktifkan Superadmin', () => {
    expect(registerApiContent).toContain(
      "const isApplicantNonActive = role === 'MITRA' || role === 'STORE_ADMIN'"
    )
    expect(registerApiContent).toContain(
      'isActive: isApplicantNonActive ? false : true'
    )
  })

  it('5. Modal Tambah & Edit Akun Pengguna menyediakan opsi role MITRA (Mitra Servis)', () => {
    const createModalPath = path.resolve(
      process.cwd(),
      'src/components/admin/create-user-modal.tsx'
    )
    const editModalPath = path.resolve(
      process.cwd(),
      'src/components/admin/edit-user-modal.tsx'
    )
    const createModalContent = fs.readFileSync(createModalPath, 'utf-8')
    const editModalContent = fs.readFileSync(editModalPath, 'utf-8')

    expect(createModalContent).toContain("value: 'MITRA'")
    expect(createModalContent).toContain(
      "label: 'Mitra Servis (Bengkel & Promosi Servis)'"
    )
    expect(editModalContent).toContain("value: 'MITRA'")
    expect(editModalContent).toContain(
      "label: 'Mitra Servis (Bengkel & Promosi Servis)'"
    )
  })
})
