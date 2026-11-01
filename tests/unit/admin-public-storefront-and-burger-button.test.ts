import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Perbaikan Tombol "Lihat Toko Publik" & Alignment Burger Button Admin', () => {
  const adminLayoutPath = path.resolve(
    'src/components/dashboard/admin-layout-client.tsx'
  )
  const sidebarPath = path.resolve('src/components/dashboard/sidebar.tsx')
  const layoutPath = path.resolve('src/app/dashboard/admin/layout.tsx')
  const middlewarePath = path.resolve('src/middleware.ts')

  it('1. Middleware mengizinkan admin staff melihat tampilan web publik tanpa dilempar ke CMS dashboard', () => {
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')

    // isRootPublicRoute tidak lagi memblokir akses admin staff
    expect(middlewareContent).not.toMatch(
      /if\s*\(\s*isRootPublicRoute\s*\|\|\s*isAuthRoute/
    )

    // Admin staff hanya diredirect saat mengakses halaman auth atau generic customer dashboard
    expect(middlewareContent).toMatch(
      /if\s*\(\s*isAuthRoute\s*\|\|\s*isDashboardGenericRoute\s*\)/
    )
  })

  it('2. AdminLayout server component memuat storeSlug dari database dan meneruskannya ke client', () => {
    const layoutContent = fs.readFileSync(layoutPath, 'utf8')

    // Harus mencari slug toko dari user yang login
    expect(layoutContent).toContain('store: {')
    expect(layoutContent).toContain('select: { slug: true }')
    expect(layoutContent).toContain('storeSlug={storeSlug}')
  })

  it('3. AdminLayoutClient mengarahkan Superadmin ke beranda ("/") dan Admin Toko ke halaman toko cabangnya ("/toko/[slug]")', () => {
    const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8')

    // Props storeSlug harus diterima
    expect(adminLayoutContent).toContain('storeSlug?: string | null')

    // Harus mendeteksi role STORE_ADMIN / STORE_SALES
    expect(adminLayoutContent).toContain(
      "userRole === 'STORE_ADMIN' || userRole === 'STORE_SALES'"
    )

    // Link publik mengarah ke /toko/[slug] untuk admin toko dan / untuk superadmin
    expect(adminLayoutContent).toMatch(
      /publicHref\s*=\s*isStoreAdmin\s*\?\s*activeSlug\s*\?\s*`\/toko\/\$\{activeSlug\}`\s*:\s*'\/toko'\s*:\s*'\/'/
    )

    // Tombol di header menggunakan publicHref dengan rel="noopener noreferrer"
    expect(adminLayoutContent).toContain('href={publicHref}')
    expect(adminLayoutContent).toContain('Lihat Toko Publik')
  })

  it('4. Sidebar memperbarui tautan publik desktop & mobile sesuai role Superadmin vs Admin Toko', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8')

    // Sidebar menerima storeSlug
    expect(sidebarContent).toContain('storeSlug?: string | null')

    // Menggunakan publicHref yang mengarah ke /toko/[slug] jika Store Admin
    expect(sidebarContent).toMatch(
      /publicHref\s*=\s*isStoreAdminRole\s*\?\s*activeSlug\s*\?\s*`\/toko\/\$\{activeSlug\}`\s*:\s*'\/toko'\s*:\s*'\/'/
    )

    // Tautan publik di footer sidebar menggunakan publicHref
    expect(sidebarContent).toContain('href={publicHref}')
  })

  it('5. Burger button pada mobile admin dinaikkan ke top-2.5 dan h-9 w-9 agar sejajar sempurna dengan tombol notifikasi', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8')

    // Tidak lagi menggunakan top-4 h-10 w-10 yang menurun dan tidak rata
    expect(sidebarContent).not.toContain('top-4 z-50 flex h-10 w-10')

    // Menggunakan top-2.5 (10px dari atas) dan h-9 w-9 (36px x 36px) sejajar dengan Bell Notification
    expect(sidebarContent).toContain('top-2.5 z-50 flex h-9 w-9')
  })
})
