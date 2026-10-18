import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Customer Profile Mobile Scroll & VPS DB Sync', () => {
  const mobileCustomerAccountPath = path.resolve(
    process.cwd(),
    'src/components/customer/mobile-customer-account-view.tsx'
  )
  const customerSettingsPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/settings/page.tsx'
  )
  const deployScriptPath = path.resolve(
    process.cwd(),
    'scripts/deploy-hostinger.cjs'
  )

  it('memvalidasi subview mobile customer menggunakan fixed inset-0 dan padding proporsional', () => {
    const content = fs.readFileSync(mobileCustomerAccountPath, 'utf-8')
    expect(content).toContain('fixed inset-0 z-40 flex h-full w-full flex-col')
    expect(content).toContain('main className="p-3 pb-8"')
    expect(content).not.toContain('pb-80')
  })

  it('memvalidasi tombol simpan profil hanya di kanan atas dan form bio ditinggikan', () => {
    const mobileContent = fs.readFileSync(mobileCustomerAccountPath, 'utf-8')
    const pageContent = fs.readFileSync(customerSettingsPagePath, 'utf-8')

    // Tombol simpan di kanan atas mobile header
    expect(mobileContent).toContain('<span>Simpan</span>')
    expect(mobileContent).toContain('onSaveProfile')
    expect(mobileContent).toContain('bg-orange-500')

    // Tombol simpan di kanan atas desktop header
    expect(pageContent).toContain('onClick={handleSaveProfile}')
    expect(pageContent).toContain("{saving ? 'Menyimpan...' : 'Simpan'}")

    // Tombol simpan bawah dieliminasi
    expect(pageContent).not.toContain('Simpan Profil Biodata')

    // Form bio ditinggikan
    expect(pageContent).toContain('rows={4}')
    expect(pageContent).toContain('min-h-[110px]')
  })

  it('memvalidasi tombol perbarui kata sandi dapat diakses di mobile', () => {
    const content = fs.readFileSync(customerSettingsPagePath, 'utf-8')
    expect(content).toContain('Perbarui Kata Sandi')
    expect(content).toContain('bg-orange-500')
    expect(content).toContain('hover:bg-orange-600')
  })

  it('memvalidasi skrip deploy VPS menyertakan sinkronisasi prisma db push otomatis', () => {
    const content = fs.readFileSync(deployScriptPath, 'utf-8')
    expect(content).toContain('prisma@6.19.1 db push')
    expect(content).toContain('affiliate_gadget_network')
  })
})
