import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Store Admin Dashboard Mobile Redesign Sesuai Screenshot', () => {
  const pagePath = path.resolve('src/app/dashboard/admin/page.tsx')
  const mobileViewPath = path.resolve(
    'src/components/dashboard/store-admin-mobile-view.tsx'
  )

  it('1. Memiliki komponen StoreAdminMobileView khusus mobile (sm:hidden)', () => {
    const pageContent = fs.readFileSync(pagePath, 'utf8')
    const mobileContent = fs.readFileSync(mobileViewPath, 'utf8')

    expect(pageContent).toContain('StoreAdminMobileView')
    expect(mobileContent).toContain('sm:hidden')
  })

  it('2. Screenshot 1: Kartu Omset Hari Ini dan 3 Metrik (Perlu Proses, Stok Kritis, Retur / Batal)', () => {
    const content = fs.readFileSync(mobileViewPath, 'utf8')
    expect(content).toContain('OMSET HARI INI')
    expect(content).toContain('Laporan')
    expect(content).toContain('Perlu Proses')
    expect(content).toContain('Stok Kritis')
    expect(content).toContain('Retur / Batal')
  })

  it('3. Screenshot 1: Status Pesanan Grid 2x2 (Perlu Proses, Diproses, Dikirim, Selesai) & Footer Sub-info', () => {
    const content = fs.readFileSync(mobileViewPath, 'utf8')
    expect(content).toContain('STATUS PESANAN')
    expect(content).toContain('Kelola Semua')
    expect(content).toContain('Menunggu:')
    expect(content).toContain('Retur / Batal:')
  })

  it('4. Screenshot 2: Kartu Pesanan Masuk dengan Search Bar, Tabs Status, dan Kartu Pesanan Ramping', () => {
    const content = fs.readFileSync(mobileViewPath, 'utf8')
    expect(content).toContain('PESANAN MASUK')
    expect(content).toContain('Cari ID pesanan atau pembeli...')
    expect(content).toContain('Semua (')
    expect(content).toContain('Perlu Diproses (')
    expect(content).toContain('Diproses (')
    expect(content).toContain('Rincian')
  })

  it('5. Screenshot 3: Kartu Pengembalian & Retur dengan Tab Switcher (Pengajuan Retur vs Dibatalkan) & Tinjau Permintaan', () => {
    const content = fs.readFileSync(mobileViewPath, 'utf8')
    expect(content).toContain('PENGEMBALIAN &amp; RETUR')
    expect(content).toContain('Pengajuan Retur (')
    expect(content).toContain('Dibatalkan (')
    expect(content).toContain('Tinjau Permintaan')
  })
})
