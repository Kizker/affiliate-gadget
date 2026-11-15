import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Alur Pendaftaran Admin Toko, Aktivasi Superadmin, Input Toko Mandiri & After Sales Mandiri vs Group', () => {
  const registerPagePath = path.resolve('src/app/register/page.tsx')
  const registerApiPath = path.resolve('src/app/api/auth/register/route.ts')
  const onboardingPagePath = path.resolve(
    'src/app/dashboard/admin/onboarding/page.tsx'
  )
  const onboardingApiPath = path.resolve(
    'src/app/api/admin/onboarding/route.ts'
  )
  const adminLayoutClientPath = path.resolve(
    'src/components/dashboard/admin-layout-client.tsx'
  )
  const storeTablePath = path.resolve(
    'src/components/admin/mitras/store-table.tsx'
  )
  const returnsApiPath = path.resolve('src/app/api/returns/[id]/route.ts')
  const storeRoomApiPath = path.resolve(
    'src/app/api/customer/chat/store-room/route.ts'
  )

  it('1. Halaman /register menyediakan pilihan Customer & Admin Toko (STORE_ADMIN) dan mengarahkan ke halaman onboarding menunggu persetujuan Superadmin', () => {
    const pageContent = fs.readFileSync(registerPagePath, 'utf-8')
    const apiContent = fs.readFileSync(registerApiPath, 'utf-8')

    expect(pageContent).toContain('Admin Toko')
    expect(pageContent).toContain("role: 'STORE_ADMIN'")
    expect(pageContent).toContain("router.push('/dashboard/admin/onboarding')")

    expect(apiContent).toContain(
      "const allowedPublicRoles = ['CUSTOMER', 'STORE_ADMIN', 'MITRA']"
    )
    expect(apiContent).toContain(
      "const isApplicantNonActive = role === 'MITRA' || role === 'STORE_ADMIN'"
    )
    expect(apiContent).toContain(
      'isActive: isApplicantNonActive ? false : true'
    )
  })

  it('2. AdminLayoutClient mengarahkan STORE_ADMIN yang belum aktif atau belum memiliki toko ke /dashboard/admin/onboarding', () => {
    const content = fs.readFileSync(adminLayoutClientPath, 'utf-8')
    expect(content).toContain(
      "userRole === 'STORE_ADMIN' && (!isUserActive || !hasStore)"
    )
    expect(content).toContain("router.replace('/dashboard/admin/onboarding')")
  })

  it('3. Halaman & API Onboarding menyediakan Waiting Page sebelum diaktifkan Superadmin, lalu Form Input Nama & Profil Toko setelah aktif', () => {
    const pageContent = fs.readFileSync(onboardingPagePath, 'utf-8')
    const apiContent = fs.readFileSync(onboardingApiPath, 'utf-8')

    expect(pageContent).toContain('Menunggu Aktivasi Akun oleh Superadmin')
    expect(pageContent).toContain('Lengkapi Profil & Pendaftaran Toko Cabang')
    expect(pageContent).toContain('Simpan & Aktifkan Toko Sekarang')

    expect(apiContent).toContain('if (!user.isActive)')
    expect(apiContent).toContain('tx.store.create')
    expect(apiContent).toContain('storeId: createdStore.id')
  })

  it('4. Superadmin dapat mengatur Group After Sales pada Daftar Toko, dan jika tidak dipilih maka otomatis After Sales Mandiri (Admin Toko)', () => {
    const storeTableContent = fs.readFileSync(storeTablePath, 'utf-8')
    const returnsContent = fs.readFileSync(returnsApiPath, 'utf-8')
    const storeRoomContent = fs.readFileSync(storeRoomApiPath, 'utf-8')

    expect(storeTableContent).toContain('After Sales: Mandiri (Admin Toko)')
    expect(storeTableContent).toContain('onAssignGroup')

    expect(returnsContent).toContain('isSelfManagedStoreAdmin')
    expect(storeRoomContent).toContain(
      'assignedAdmin = groupAfterSales || storeAdmin || fallbackAfterSales'
    )
  })
})
