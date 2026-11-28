import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('After Sales & Mitra CS Superadmin Consultation Chat Suite', () => {
  const rootDir = process.cwd()

  it('1. verifies sidebar contains Bantuan Superadmin for After Sales and Mitra', () => {
    const sidebarPath = path.join(
      rootDir,
      'src',
      'components',
      'dashboard',
      'sidebar.tsx'
    )
    const content = fs.readFileSync(sidebarPath, 'utf-8')

    // Aftersales navigation must have Bantuan Superadmin
    expect(content).toContain('/dashboard/after-sales/chat?cs=true')
    // Mitra navigation must have Bantuan Superadmin
    expect(content).toContain('mitraNavSections')
    expect(content).toContain('/dashboard/admin/chat?cs=true')
  })

  it('2. verifies Mitra dashboard includes Bantuan Superadmin quick action button', () => {
    const mitraDashboardPath = path.join(
      rootDir,
      'src',
      'app',
      'dashboard',
      'mitra',
      'page.tsx'
    )
    const content = fs.readFileSync(mitraDashboardPath, 'utf-8')
    expect(content).toContain('/dashboard/admin/chat?cs=true')
    expect(content).toContain('Bantuan Superadmin')
  })

  it('3. verifies middleware and auth-guard grant AFTER_SALES and MITRA access to /dashboard/admin/chat', () => {
    const middlewarePath = path.join(rootDir, 'src', 'middleware.ts')
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8')

    const authGuardPath = path.join(rootDir, 'src', 'lib', 'auth-guard.ts')
    const authGuardContent = fs.readFileSync(authGuardPath, 'utf-8')

    expect(middlewareContent).toContain("'AFTER_SALES'")
    expect(middlewareContent).toContain("'MITRA'")
    expect(authGuardContent).toContain("'AFTER_SALES'")
    expect(authGuardContent).toContain("'MITRA'")
  })

  it('4. verifies chat client handles cs parameter for After Sales and Mitra', () => {
    const chatPagePath = path.join(
      rootDir,
      'src',
      'app',
      'dashboard',
      'admin',
      'chat',
      'page.tsx'
    )
    const content = fs.readFileSync(chatPagePath, 'utf-8')
    expect(content).toContain("userRole === 'AFTER_SALES'")
    expect(content).toContain("userRole === 'MITRA'")
    expect(content).toContain('Admin After Sales')
    expect(content).toContain('Mitra Servis')
  })

  it('5. verifies admin chat rooms and messages endpoints allow After Sales and Mitra assistance rooms', () => {
    const roomsRoutePath = path.join(
      rootDir,
      'src',
      'app',
      'api',
      'admin',
      'chat',
      'rooms',
      'route.ts'
    )
    const roomsContent = fs.readFileSync(roomsRoutePath, 'utf-8')
    expect(roomsContent).toContain("user.role === 'MITRA'")
    expect(roomsContent).toContain(
      '{ customerId: session.user.id, storeId: null }'
    )

    const msgRoutePath = path.join(
      rootDir,
      'src',
      'app',
      'api',
      'admin',
      'chat',
      'rooms',
      '[roomId]',
      'messages',
      'route.ts'
    )
    const msgContent = fs.readFileSync(msgRoutePath, 'utf-8')
    expect(msgContent).toContain("user.role === 'MITRA'")
    expect(msgContent).toContain('isSuperAdminHelp')
  })
})
