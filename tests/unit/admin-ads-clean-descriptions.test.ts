import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Ads Page Clean Descriptions Suite', () => {
  const rootDir = process.cwd()
  const adsPagePath = path.join(
    rootDir,
    'src',
    'app',
    'dashboard',
    'admin',
    'ads',
    'page.tsx'
  )
  const adsContent = fs.readFileSync(adsPagePath, 'utf-8')

  it('1. verifies header subtitle description is removed for clean layout', () => {
    expect(adsContent).not.toContain(
      'Ajukan banner promosi toko Anda untuk tampil di carousel teratas mobile'
    )
    expect(adsContent).not.toContain(
      'Tinjau, setujui, dan kelola slot tayang banner promosi toko cabang'
    )
  })

  it('2. verifies blue callout info banner is removed', () => {
    expect(adsContent).not.toContain('Ketentuan Pengajuan Iklan Cabang Toko')
    expect(adsContent).not.toContain(
      'Admin toko dapat mengajukan banner promosi dan membatalkan pengajuan'
    )
  })

  it('3. verifies header retains title and action buttons', () => {
    expect(adsContent).toContain('Pengajuan & Manajemen Iklan Toko')
    expect(adsContent).toContain('Refresh')
    expect(adsContent).toContain('Ajukan Iklan Baru')
  })
})
