import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  DEFAULT_INDONESIAN_TAXES,
  calculateActiveTaxesForOrder,
} from '@/lib/tax/tax-config-store'

describe('Admin Tax Management & Indonesian Tax Compliance Suite', () => {
  const rootDir = process.cwd()

  it('1. verifies sidebar contains Pajak navigation for store admin and superadmin', () => {
    const sidebarPath = path.join(
      rootDir,
      'src',
      'components',
      'dashboard',
      'sidebar.tsx'
    )
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8')

    expect(sidebarContent).toContain("label: 'Pajak'")
    expect(sidebarContent).toContain("href: '/dashboard/admin/tax'")
  })

  it('2. verifies middleware and auth-guard configure subroute access for /dashboard/admin/tax', () => {
    const middlewarePath = path.join(rootDir, 'src', 'middleware.ts')
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8')

    const authGuardPath = path.join(rootDir, 'src', 'lib', 'auth-guard.ts')
    const authGuardContent = fs.readFileSync(authGuardPath, 'utf-8')

    expect(middlewareContent).toContain("'/dashboard/admin/tax'")
    expect(authGuardContent).toContain("'/dashboard/admin/tax'")
  })

  it('3. verifies default Indonesian tax compliance rules (PPh 22 PMSE active, legal basis, etc.)', () => {
    const pph22 = DEFAULT_INDONESIAN_TAXES.find(
      (t) => t.id === 'PPH22_ECOMMERCE'
    )
    expect(pph22).toBeDefined()
    expect(pph22?.isEnabled).toBe(true)
    expect(pph22?.rate).toBe(0.5)
    expect(pph22?.legalBasis).toContain('UU No. 7 Tahun 2021')
    expect(pph22?.ebillingKapKjs).toContain('411122')

    const ppn = DEFAULT_INDONESIAN_TAXES.find((t) => t.id === 'PPN_PMSE')
    expect(ppn).toBeDefined()
    expect(ppn?.rate).toBe(11)

    const pphFinal = DEFAULT_INDONESIAN_TAXES.find(
      (t) => t.id === 'PPH_FINAL_UMKM'
    )
    expect(pphFinal).toBeDefined()
    expect(pphFinal?.rate).toBe(0.5)
  })

  it('4. verifies tax calculation helper for orders', () => {
    // Subtotal Rp 10.000.000, commission Rp 200.000
    const calc = calculateActiveTaxesForOrder({
      subtotalAfterDiscount: 10000000,
      platformCommissionAmount: 200000,
      activeTaxes: DEFAULT_INDONESIAN_TAXES,
    })

    // PPh 22 PMSE is 0.5% of 10.000.000 = Rp 50.000
    expect(calc.totalTaxAmount).toBe(50000)
    expect(calc.items.length).toBe(1)
    expect(calc.items[0].id).toBe('PPH22_ECOMMERCE')
    expect(calc.items[0].amount).toBe(50000)
  })

  it('5. verifies admin tax page exists, has page guard, and contains exclusive tax withdrawal', () => {
    const taxPagePath = path.join(
      rootDir,
      'src',
      'app',
      'dashboard',
      'admin',
      'tax',
      'page.tsx'
    )
    expect(fs.existsSync(taxPagePath)).toBe(true)
    const content = fs.readFileSync(taxPagePath, 'utf-8')
    expect(content).toContain("usePageGuard('/dashboard/admin/tax')")
    expect(content).toContain('Tarik Dana Pajak')
    expect(content).toContain('Saldo Pajak Siap Tarik')
    expect(content).toContain('Riwayat Penarikan Dana Pajak')
    // Verifies removal of cumbersome manual NTPN submission button
    expect(content).not.toContain('Catat Bukti Setor NTPN')
  })
})
