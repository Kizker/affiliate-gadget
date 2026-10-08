import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Customer Chat Fullscreen Mobile & Header Elimination Suite', () => {
  const customerChatPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/chat/page.tsx'
  )
  const content = fs.readFileSync(customerChatPath, 'utf-8')

  it('1. Tidak me-render MobileTopNav di halaman chat mobile (eliminasi header ganda redundan)', () => {
    // Tidak ada import maupun rendering MobileTopNav
    expect(content).not.toContain('<MobileTopNav')
    expect(content).not.toContain(
      "import { Navbar, MobileTopNav } from '@/components/layouts'"
    )
    expect(content).not.toContain(
      'title={showChatOnMobile ? activeStoreTitle :'
    )
  })

  it('2. Main container chat di mobile menggunakan fullscreen edge-to-edge tanpa padding atau margin mengambang', () => {
    // p-0 di mobile, hanya md:pb-4 md:pt-20 di desktop
    expect(content).toContain(
      'className="flex flex-1 flex-col overflow-hidden p-0 md:pb-4 md:pt-20"'
    )
    // px-0 di mobile
    expect(content).toContain(
      'className="flex h-full w-full flex-1 flex-col px-0 md:mx-auto md:max-w-7xl md:px-6 lg:px-8"'
    )
    // rounded-none dan border-0 di mobile agar memenuhi layar
    expect(content).toContain(
      'grid h-full min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-none border-0 bg-white dark:bg-slate-900 md:rounded-3xl md:border md:border-slate-200/80 md:shadow-xs lg:grid-cols-12'
    )
  })

  it('3. Input bar chat memenuhi bagian bawah layar dengan safe-area inset tanpa gap pb-16', () => {
    expect(content).not.toContain('pb-16 pt-1.5')
    expect(content).toContain(
      'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]'
    )
  })

  it('4. Menyediakan header mobile clean pada list room untuk navigasi kembali ke pengaturan', () => {
    expect(content).toContain('href="/dashboard/customer/settings"')
    expect(content).toContain('Pusat Chat Toko')
  })
})
