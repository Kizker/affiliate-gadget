import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Customer Profile Mobile Subview & Wishlist Back Routing', () => {
  const customerSettingsPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/settings/page.tsx'
  )
  const mobileCustomerAccountPath = path.resolve(
    process.cwd(),
    'src/components/customer/mobile-customer-account-view.tsx'
  )
  const wishlistClientPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/wishlist/wishlist-client.tsx'
  )
  const customerWishlistViewPath = path.resolve(
    process.cwd(),
    'src/components/customer/customer-wishlist-view.tsx'
  )

  it('memvalidasi sinkronisasi subview dengan query parameter URL dan history back di settings page', () => {
    const content = fs.readFileSync(customerSettingsPath, 'utf-8')
    expect(content).toContain("searchParams?.get('subview')")
    expect(content).toContain(
      'router.push(`/dashboard/customer/settings?subview=${view}`'
    )
    expect(content).toContain('handleBackFromSubView')
    expect(content).toContain('router.back()')
    expect(content).toContain("router.replace('/dashboard/customer/settings'")
    expect(content).toContain('onBack={handleBackFromSubView}')
    expect(content).toContain('<Suspense fallback={null}>')
  })

  it('memvalidasi tombol kembali subview mobile account view tersambung ke onBack handler', () => {
    const content = fs.readFileSync(mobileCustomerAccountPath, 'utf-8')
    expect(content).toContain('onBack?: () => void')
    expect(content).toContain("onBack || (() => setActiveSubView('overview'))")
  })

  it('memvalidasi mobile top nav di halaman wishlist mengarahkan kembali ke profil settings', () => {
    const content = fs.readFileSync(wishlistClientPath, 'utf-8')
    expect(content).toContain('showBack={true}')
    expect(content).toContain('backHref="/dashboard/customer/settings"')
    expect(content).toContain("router.push('/dashboard/customer/settings')")
    expect(content).toContain('onBack={handleBackToProfile}')
    expect(content).toContain('onBackToOverview={handleBackToProfile}')
  })

  it('memvalidasi tombol kembali ke profil tersedia pada empty state customer wishlist view', () => {
    const content = fs.readFileSync(customerWishlistViewPath, 'utf-8')
    expect(content).toContain('onBackToOverview')
    expect(content).toContain('Kembali ke Profil')
  })
})
