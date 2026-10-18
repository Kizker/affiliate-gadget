import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Chat Page Superadmin Banner Removal Suite', () => {
  const rootDir = process.cwd()
  const chatPagePath = path.join(
    rootDir,
    'src',
    'app',
    'dashboard',
    'admin',
    'chat',
    'page.tsx'
  )
  const sidebarPath = path.join(
    rootDir,
    'src',
    'components',
    'dashboard',
    'sidebar.tsx'
  )

  const chatContent = fs.readFileSync(chatPagePath, 'utf-8')
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8')

  it('1. verifies Bantuan CS Superadmin button is removed from chat room list header', () => {
    // Should NOT have the button banner above search
    expect(chatContent).not.toContain(
      'Tombol Bantuan CS Superadmin khusus untuk Admin Toko'
    )
    expect(chatContent).not.toContain(
      'Konsultasi kendala & bantuan langsung ke Superadmin'
    )
  })

  it('2. verifies search capsule is immediately rendered at top of chat list header', () => {
    expect(chatContent).toContain('placeholder="Cari customer, no. order..."')
  })

  it('3. verifies sidebar retains Bantuan Superadmin navigation item', () => {
    expect(sidebarContent).toContain("label: 'Bantuan Superadmin'")
    expect(sidebarContent).toContain("href: '/dashboard/admin/chat?cs=true'")
  })

  it('4. verifies handleOpenSuperAdminCsChat handler remains active for ?cs= query parameter', () => {
    expect(chatContent).toContain('handleOpenSuperAdminCsChat')
    expect(chatContent).toContain('if (paramCs && isStoreAdmin && isAllowed)')
  })
})
