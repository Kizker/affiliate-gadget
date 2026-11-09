import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Arsitektur Grup Cabang & Role After Sales Purna Jual', () => {
  const schemaPath = path.resolve('prisma/schema.prisma')
  const middlewarePath = path.resolve('src/middleware.ts')
  const authGuardPath = path.resolve('src/lib/auth-guard.ts')
  const pageGuardPath = path.resolve('src/hooks/use-page-guard.ts')
  const sidebarPath = path.resolve('src/components/dashboard/sidebar.tsx')
  const groupsApiPath = path.resolve('src/app/api/admin/groups/route.ts')
  const superAdminReturnsPagePath = path.resolve(
    'src/app/dashboard/admin/returns/page.tsx'
  )
  const afterSalesPagePath = path.resolve(
    'src/app/dashboard/after-sales/page.tsx'
  )
  const chatMessagesApiPath = path.resolve(
    'src/app/api/admin/chat/rooms/[roomId]/messages/route.ts'
  )

  it('1. Schema Prisma mendefinisikan Role AFTER_SALES, Model StoreGroup, dan relasi Store', () => {
    const schema = fs.readFileSync(schemaPath, 'utf8')
    expect(schema).toContain('AFTER_SALES')
    expect(schema).toContain('model StoreGroup {')
    expect(schema).toContain('afterSalesUserId')
    expect(schema).toContain('GroupAfterSalesUser')
    expect(schema).toContain('groupId')
    expect(schema).toMatch(/group\s+StoreGroup\?/)
  })

  it('2. RBAC & Page Guard: Akses /dashboard/admin/groups hanya untuk SUPER_ADMIN, /dashboard/after-sales untuk AFTER_SALES & SUPER_ADMIN', () => {
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
    const authGuardContent = fs.readFileSync(authGuardPath, 'utf8')
    const pageGuardContent = fs.readFileSync(pageGuardPath, 'utf8')

    expect(middlewareContent).toContain(
      "'/dashboard/admin/groups': ['SUPER_ADMIN']"
    )
    expect(middlewareContent).toContain(
      "'/dashboard/after-sales': ['SUPER_ADMIN', 'AFTER_SALES']"
    )
    expect(authGuardContent).toContain(
      "'/dashboard/admin/groups': ['SUPER_ADMIN']"
    )
    expect(pageGuardContent).toContain(
      "'/dashboard/admin/groups': ['SUPER_ADMIN']"
    )
  })

  it('3. Pembersihan Hak Akses Admin Toko: Store Admin dihapus dari menu dan izin retur/komplain', () => {
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8')

    // Middleware tidak lagi memuat STORE_ADMIN untuk returns & complaints
    expect(middlewareContent).not.toMatch(
      /'\/dashboard\/admin\/returns':\s*\[[^\]]*'STORE_ADMIN'[^\]]*\]/
    )
    expect(middlewareContent).not.toMatch(
      /'\/dashboard\/admin\/complaints':\s*\[[^\]]*'STORE_ADMIN'[^\]]*\]/
    )

    // Sidebar Store Admin tidak memuat menu Pengembalian & Klaim Garansi
    const storeAdminSection = sidebarContent.substring(
      sidebarContent.indexOf('const storeAdminNavSections'),
      sidebarContent.indexOf('export function Sidebar')
    )
    expect(storeAdminSection).not.toContain('Pengembalian & Klaim Garansi')
    expect(storeAdminSection).not.toContain("href: '/dashboard/admin/returns'")
  })

  it('4. Navigasi Sidebar Superadmin memuat menu Grup Cabang & After Sales (/dashboard/admin/groups)', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8')
    expect(sidebarContent).toContain("href: '/dashboard/admin/groups'")
    expect(sidebarContent).toContain('Grup Cabang & After Sales')
  })

  it('5. Navigasi Sidebar After Sales memuat Live Chat Selesai dan Retur & Komplain', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8')
    expect(sidebarContent).toContain('afterSalesNavSections')
    expect(sidebarContent).toContain('/dashboard/after-sales/chat')
    expect(sidebarContent).toContain('/dashboard/after-sales/returns')
    expect(sidebarContent).toContain("effectiveRole === 'AFTER_SALES'")
  })

  it('6. API Admin Groups (/api/admin/groups) memvalidasi kepemilikan dan penugasan toko ke grup', () => {
    expect(fs.existsSync(groupsApiPath)).toBe(true)
    const apiContent = fs.readFileSync(groupsApiPath, 'utf8')
    expect(apiContent).toContain('prisma.storeGroup')
    expect(apiContent).toContain("session.user.role !== 'SUPER_ADMIN'")
    expect(apiContent).toContain('afterSalesUserId')
    expect(apiContent).toContain('storeIds')
  })

  it('7. Handover Chat: Admin Toko diblokir membalas chat jika pesanan COMPLETED, dialihkan ke After Sales', () => {
    const chatApiContent = fs.readFileSync(chatMessagesApiPath, 'utf8')
    expect(chatApiContent).toContain("user.role === 'STORE_ADMIN'")
    expect(chatApiContent).toContain("order?.status === 'COMPLETED'")
    expect(chatApiContent).toContain(
      'Pesanan telah berstatus selesai. Jalur percakapan telah dialihkan ke Admin After Sales'
    )
    expect(chatApiContent).toContain("user.role === 'AFTER_SALES'")
  })

  it('8. Halaman Retur Superadmin disederhanakan: HANYA menampilkan rincian dan 2 tombol keputusan (Approve / Reject)', () => {
    expect(fs.existsSync(superAdminReturnsPagePath)).toBe(true)
    const pageContent = fs.readFileSync(superAdminReturnsPagePath, 'utf8')
    expect(pageContent).toContain('handleDirectApprove')
    expect(pageContent).toContain('handleDirectRejectAndReturn')
    expect(pageContent).toContain("action: 'APPROVE'")
    expect(pageContent).toContain("action: 'REJECT'")

    // Kontrol manual status tracking courier dan repair stages dieliminasi dari halaman Superadmin
    expect(pageContent).not.toContain('handleExecuteResolution')
    expect(pageContent).not.toContain('ResolutionActionModal')
  })

  it('9. Portal Mandiri After Sales (/dashboard/after-sales) tersedia dengan informasi grup binaan', () => {
    expect(fs.existsSync(afterSalesPagePath)).toBe(true)
    const pageContent = fs.readFileSync(afterSalesPagePath, 'utf8')
    expect(pageContent).toContain('Pusat Layanan Purna Jual')
    expect(pageContent).toContain('/dashboard/after-sales/chat')
    expect(pageContent).toContain('/dashboard/after-sales/returns')
    expect(pageContent).toContain('Live Chat Pesanan Selesai')
  })
})
