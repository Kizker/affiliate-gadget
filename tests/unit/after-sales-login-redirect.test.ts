import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { getDashboardRoute } from '@/lib/dashboard-utils'

describe('After Sales Login & Navigation Redirection', () => {
  it('getDashboardRoute returns /dashboard/after-sales for role AFTER_SALES', () => {
    expect(getDashboardRoute('AFTER_SALES')).toBe('/dashboard/after-sales')
  })

  it('redirects to /dashboard/after-sales upon login in login page', () => {
    const loginPath = path.join(process.cwd(), 'src/app/login/page.tsx')
    const content = fs.readFileSync(loginPath, 'utf8')

    expect(content).toContain("userData.role === 'AFTER_SALES'")
    expect(content).toContain("redirectUrl = '/dashboard/after-sales'")
  })

  it('routes to /dashboard/after-sales in desktop navbar getDashboardLink', () => {
    const navbarPath = path.join(
      process.cwd(),
      'src/components/layouts/navbar.tsx'
    )
    const content = fs.readFileSync(navbarPath, 'utf8')

    expect(content).toContain("role === 'AFTER_SALES'")
    expect(content).toContain("return '/dashboard/after-sales'")
    expect(content).toContain("return '/dashboard/after-sales/chat'")
  })

  it('routes to /dashboard/after-sales in mobile bottom nav accountHref', () => {
    const mobileNavPath = path.join(
      process.cwd(),
      'src/components/layouts/mobile-bottom-nav.tsx'
    )
    const content = fs.readFileSync(mobileNavPath, 'utf8')

    expect(content).toContain("session?.user?.role === 'AFTER_SALES'")
    expect(content).toContain("'/dashboard/after-sales'")
  })
})
