import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { getDashboardRoute } from '@/lib/dashboard-utils'

describe('After Sales Login, Middleware & Navigation Redirection', () => {
  it('getDashboardRoute returns /dashboard/after-sales for role AFTER_SALES', () => {
    expect(getDashboardRoute('AFTER_SALES')).toBe('/dashboard/after-sales')
  })

  it('redirects to /dashboard/after-sales upon login in login page', () => {
    const loginPath = path.join(process.cwd(), 'src/app/login/page.tsx')
    const content = fs.readFileSync(loginPath, 'utf8')

    expect(content).toContain("userData.role === 'AFTER_SALES'")
    expect(content).toContain("redirectUrl = '/dashboard/after-sales'")
    expect(content).toContain("defaultDest = '/dashboard/after-sales'")
  })

  it('routes to /dashboard/after-sales in desktop navbar getDashboardLink and closes dropdown on click', () => {
    const navbarPath = path.join(
      process.cwd(),
      'src/components/layouts/navbar.tsx'
    )
    const content = fs.readFileSync(navbarPath, 'utf8')

    expect(content).toContain("role === 'AFTER_SALES'")
    expect(content).toContain("return '/dashboard/after-sales'")
    expect(content).toContain("return '/dashboard/after-sales/chat'")
    expect(content).toContain('onClick={() => setUserDropdownOpen(false)}')
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

  it('middleware correctly handles AFTER_SALES routing & protection', () => {
    const middlewarePath = path.join(process.cwd(), 'src/middleware.ts')
    const content = fs.readFileSync(middlewarePath, 'utf8')

    // getCmsDashboardUrl returns /dashboard/after-sales
    expect(content).toContain(
      "if (role === 'AFTER_SALES') return '/dashboard/after-sales'"
    )
    // route categories
    expect(content).toContain(
      "const isAfterSalesRoute = pathname.startsWith('/dashboard/after-sales')"
    )
    // requiresAuth
    expect(content).toContain('isAfterSalesRoute')
    // redirect AFTER_SALES away from public root (/), customer pages, and /dashboard/admin
    expect(content).toContain("if (userRole === 'AFTER_SALES')")
    expect(content).toContain('isRootPublicRoute')
    expect(content).toContain("isAdminRoute && userRole === 'AFTER_SALES'")
    expect(content).toContain("new URL('/dashboard/after-sales', req.url)")
    // protect /dashboard/after-sales
    expect(content).toContain(
      "userRole !== 'AFTER_SALES' && userRole !== 'SUPER_ADMIN'"
    )
    // chat subroute access includes AFTER_SALES
    expect(content).toContain("'/dashboard/admin/chat'")
    expect(content).toContain("'AFTER_SALES'")
  })

  it('auth.config.ts protects /dashboard/after-sales', () => {
    const authConfigPath = path.join(process.cwd(), 'src/auth.config.ts')
    const content = fs.readFileSync(authConfigPath, 'utf8')

    expect(content).toContain("'/dashboard/after-sales'")
  })

  it('/api/auth/redirect handles AFTER_SALES redirect to /dashboard/after-sales', () => {
    const redirectApiPath = path.join(
      process.cwd(),
      'src/app/api/auth/redirect/route.ts'
    )
    const content = fs.readFileSync(redirectApiPath, 'utf8')

    expect(content).toContain("user?.role === 'AFTER_SALES'")
    expect(content).toContain("new URL('/dashboard/after-sales', origin)")
  })

  it('use-page-guard and auth-guard include AFTER_SALES for chat and redirect unauthorized to /dashboard/after-sales', () => {
    const pageGuardPath = path.join(
      process.cwd(),
      'src/hooks/use-page-guard.ts'
    )
    const pageGuardContent = fs.readFileSync(pageGuardPath, 'utf8')
    expect(pageGuardContent).toContain(
      "router.replace('/dashboard/after-sales')"
    )

    const authGuardPath = path.join(process.cwd(), 'src/lib/auth-guard.ts')
    const authGuardContent = fs.readFileSync(authGuardPath, 'utf8')
    expect(authGuardContent).toContain("redirect('/dashboard/after-sales')")
  })

  it('/dashboard/admin/page.tsx redirects AFTER_SALES to /dashboard/after-sales', () => {
    const adminPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/page.tsx'
    )
    const content = fs.readFileSync(adminPagePath, 'utf8')

    expect(content).toContain("session?.user?.role === 'AFTER_SALES'")
    expect(content).toContain("router.replace('/dashboard/after-sales')")
  })
})
