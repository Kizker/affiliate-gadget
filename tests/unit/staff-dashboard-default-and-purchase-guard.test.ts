import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin / Staff Default Dashboard Entry & Read-Only Customer Purchase Guard Suite', () => {
  it('redirects staff, store admin, superadmin, and mitra from login and root entry directly to their CMS dashboards', () => {
    const middlewarePath = path.join(process.cwd(), 'src/middleware.ts')
    const content = fs.readFileSync(middlewarePath, 'utf-8')

    // 1. Cart & checkout always redirect staff to their dashboard
    expect(content).toContain(
      'if (isAuthRoute || isDashboardGenericRoute || isCartOrCheckout)'
    )

    // 2. Root entry ('/') redirects to dashboard unless preview=1 or from internal navigation
    expect(content).toContain('if (isRootPublicRoute) {')
    expect(content).toContain("req.nextUrl.searchParams.get('preview') === '1'")
    expect(content).toContain(
      'return NextResponse.redirect(getSafeRedirectUrl(destinationCms, req))'
    )
  })

  it('ignores redirectParam for staff roles on login page so they always land on their dashboard', () => {
    const loginPath = path.join(process.cwd(), 'src/app/login/page.tsx')
    const content = fs.readFileSync(loginPath, 'utf-8')

    expect(content).toContain('const isStaffOrPartnerRole =')
    expect(content).toContain('let redirectUrl = isStaffOrPartnerRole')
    expect(content).toContain("callbackUrl: '/api/auth/redirect'")
  })

  it('shows toast "Silahkan login menggunakan akun customer" when non-customer tries to buy, add to cart, wishlist, or chat', () => {
    const gadgetDetailPath = path.join(
      process.cwd(),
      'src/app/gadget/[id]/gadget-detail-client.tsx'
    )
    const detailContent = fs.readFileSync(gadgetDetailPath, 'utf-8')

    expect(detailContent).toContain('isNonCustomerRole')
    expect(detailContent).toContain(
      "toast.error('Silahkan login menggunakan akun customer')"
    )

    const mobileDetailPath = path.join(
      process.cwd(),
      'src/components/gadget/shopee-mobile-product-detail.tsx'
    )
    const mobileContent = fs.readFileSync(mobileDetailPath, 'utf-8')
    expect(mobileContent).toContain(
      "toast.error('Silahkan login menggunakan akun customer')"
    )

    const navbarPath = path.join(
      process.cwd(),
      'src/components/layouts/navbar.tsx'
    )
    const navbarContent = fs.readFileSync(navbarPath, 'utf-8')
    expect(navbarContent).toContain(
      "toast.error('Silahkan login menggunakan akun customer')"
    )
  })
})
