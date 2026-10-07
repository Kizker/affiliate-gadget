import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Customer Mobile Overview Natural Scroll & Logout Accessibility', () => {
  const mobileCustomerAccountPath = path.resolve(
    process.cwd(),
    'src/components/customer/mobile-customer-account-view.tsx'
  )
  const customerSettingsPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/settings/page.tsx'
  )

  it('memvalidasi container mobile di settings page tidak dikunci oleh h-dvh dan overflow-hidden', () => {
    const content = fs.readFileSync(customerSettingsPagePath, 'utf-8')
    expect(content).toContain('div className="block w-full md:hidden"')
    expect(content).not.toContain(
      'div className="block h-dvh max-h-screen w-full overflow-hidden md:hidden"'
    )
  })

  it('memvalidasi overview akun mobile menggunakan natural min-h-screen scrolling tanpa overflow pembatas', () => {
    const content = fs.readFileSync(mobileCustomerAccountPath, 'utf-8')
    expect(content).toContain(
      'className="min-h-screen w-full bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100"'
    )
    // Memastikan tidak ada pengunci flex h-dvh pada overview
    expect(content).not.toContain(
      'className="flex h-dvh max-h-screen min-h-screen w-full flex-col overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100"'
    )
  })

  it('memvalidasi tombol logout memiliki padding bawah memadai agar tidak tertutup bottom nav', () => {
    const content = fs.readFileSync(mobileCustomerAccountPath, 'utf-8')
    // Main container memiliki padding bawah pb-36 (144px) untuk mengangkat tombol logout di atas MobileBottomNav
    expect(content).toContain('main className="space-y-3 p-3 pb-36"')
    expect(content).toContain('Keluar dari Akun')
  })

  it('memvalidasi subview memiliki min-h-0 pada scroll container agar fleksibel', () => {
    const content = fs.readFileSync(mobileCustomerAccountPath, 'utf-8')
    expect(content).toContain(
      'min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]'
    )
  })
})
