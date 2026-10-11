import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Service Page Mobile Navbar Consistency (/servis)', () => {
  const servicePagePath = path.join(process.cwd(), 'src/app/servis/page.tsx')
  const serviceViewPath = path.join(
    process.cwd(),
    'src/components/service/integrated-service-view.tsx'
  )

  it('verifies src/app/servis/page.tsx does not leak desktop Navbar & Footer into mobile view', () => {
    const pageContent = fs.readFileSync(servicePagePath, 'utf-8')

    // Page shell directly delegates layout management to IntegratedServiceView
    expect(pageContent).not.toContain('<Navbar')
    expect(pageContent).not.toContain('<Footer')
    expect(pageContent).not.toContain('<MobileBottomNav')
    expect(pageContent).toContain('<IntegratedServiceView')
  })

  it('verifies integrated-service-view.tsx uses MobileTopNav for mobile and Navbar/Footer for desktop', () => {
    const viewContent = fs.readFileSync(serviceViewPath, 'utf-8')

    // 1. Reusable component imports
    expect(viewContent).toContain(
      "import { MobileTopNav } from '@/components/layouts/mobile-top-nav'"
    )
    expect(viewContent).toContain(
      "import { Navbar, Footer, MobileBottomNav } from '@/components/layouts'"
    )

    // 2. Mobile view renders MobileTopNav and MobileBottomNav
    expect(viewContent).toContain('<MobileTopNav')
    expect(viewContent).toContain('<MobileBottomNav activeTab="servis"')

    // 3. Desktop view renders Navbar and Footer
    expect(viewContent).toContain('<Navbar variant="light"')
    expect(viewContent).toContain('<Footer variant="light"')

    // 4. Clean separation using showMobile and showDesktop
    expect(viewContent).toContain('showMobile && (')
    expect(viewContent).toContain('showDesktop && (')
  })

  it('verifies MobileTopNav component does not include profile or login button', () => {
    const mobileTopNavPath = path.join(
      process.cwd(),
      'src/components/layouts/mobile-top-nav.tsx'
    )
    const navContent = fs.readFileSync(mobileTopNavPath, 'utf-8')

    // MobileTopNav only contains Logo + Subtitle and Chat + Cart action icons
    expect(navContent).toContain('chatHref')
    expect(navContent).toContain('/cart')
    expect(navContent).not.toContain('Masuk Akun')
    expect(navContent).not.toContain('Profil Saya')
    expect(navContent).not.toContain('userDropdownOpen')
  })

  it('verifies mitra-detail-client.tsx uses MobileTopNav for mobile and Navbar for desktop', () => {
    const mitraDetailPath = path.join(
      process.cwd(),
      'src/app/rekomendasi/[id]/mitra-detail-client.tsx'
    )
    const detailContent = fs.readFileSync(mitraDetailPath, 'utf-8')

    // 1. Imports MobileTopNav
    expect(detailContent).toContain(
      "import { MobileTopNav } from '@/components/layouts/mobile-top-nav'"
    )

    // 2. Mobile view renders MobileTopNav with backHref to /servis
    expect(detailContent).toContain('<MobileTopNav')
    expect(detailContent).toContain('backHref="/servis"')
    expect(detailContent).toContain('showBack={true}')

    // 3. Desktop view isolates Navbar
    expect(detailContent).toContain('hidden md:block')
    expect(detailContent).toContain('<Navbar variant="light"')
  })
})
