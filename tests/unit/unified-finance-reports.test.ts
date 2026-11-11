import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Unified Finance & Financial Reports Suite', () => {
  it('unifies sidebar navigation menus to Keuangan & Laporan linking to /dashboard/admin/finance', () => {
    const sidebarPath = path.join(
      process.cwd(),
      'src/components/dashboard/sidebar.tsx'
    )
    const content = fs.readFileSync(sidebarPath, 'utf-8')

    // Must have the unified menu label
    expect(content).toContain('Keuangan & Laporan')
    expect(content).toContain("href: '/dashboard/admin/finance'")

    // Must NOT have the separate Laporan Keuangan or Laporan Finansial menu pointing to /dashboard/admin/reports in nav items
    expect(content).not.toContain("href: '/dashboard/admin/reports',")
    expect(content).not.toContain("label: 'Laporan Keuangan',")
    expect(content).not.toContain("label: 'Laporan Finansial',")
  })

  it('redirects /dashboard/admin/reports to /dashboard/admin/finance seamlessly', () => {
    const reportsPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/reports/page.tsx'
    )
    const content = fs.readFileSync(reportsPagePath, 'utf-8')

    expect(content).toContain("router.replace('/dashboard/admin/finance')")
  })

  it('verifies the unified finance page contains reports, mutations, and escrow tabs', () => {
    const financePagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/finance/page.tsx'
    )
    const financeDir = path.join(process.cwd(), 'src/components/admin/finance')
    const componentContents = fs.existsSync(financeDir)
      ? fs
          .readdirSync(financeDir, { recursive: true })
          .filter(
            (f): f is string => typeof f === 'string' && f.endsWith('.tsx')
          )
          .map((f) => fs.readFileSync(path.join(financeDir, f), 'utf-8'))
          .join('\n')
      : ''
    const content =
      fs.readFileSync(financePagePath, 'utf-8') + '\n' + componentContents

    // Check main view tabs
    expect(content).toContain('Laporan Laba Rugi & Analitik')
    expect(content).toContain('Buku Kas & Mutasi Transaksi')

    // Check unified top metrics
    expect(content).toContain('SALDO SIAP CAIR')
    expect(content).toContain('TOTAL HPP (MODAL)')
    expect(content).toContain('LABA BERSIH TOKO')
    expect(content).toContain('DANA ESCROW (TERT...')

    // Check financial reports elements
    expect(content).toContain('Rincian Beban Operasional & Logistik')
    expect(content).toContain('Tren Omzet & Laba Bersih')
    expect(content).toContain('Aktivitas Transaksi Terbaru')

    // Check withdrawal 2FA security
    expect(content).toContain('Tarik Saldo ke Rekening PT')
    expect(content).toContain('/api/admin/finance/withdraw')
  })

  it('ensures null-safe unwrapping for reportData and stats in finance page', () => {
    const financePagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/finance/page.tsx'
    )
    const financeDir = path.join(process.cwd(), 'src/components/admin/finance')
    const componentContents = fs.existsSync(financeDir)
      ? fs
          .readdirSync(financeDir, { recursive: true })
          .filter(
            (f): f is string => typeof f === 'string' && f.endsWith('.tsx')
          )
          .map((f) => fs.readFileSync(path.join(financeDir, f), 'utf-8'))
          .join('\n')
      : ''
    const content =
      fs.readFileSync(financePagePath, 'utf-8') + '\n' + componentContents

    // Must safely access reportData.orders with optional chaining or fallback
    expect(content).toContain('reportData.orders?.total ?? 0')
    expect(content).not.toMatch(/\{reportData\.orders\.total\}/)

    // Must safely access stats.courierBreakdown with fallback
    expect(content).toContain('stats?.courierBreakdown ??')
  })
})
