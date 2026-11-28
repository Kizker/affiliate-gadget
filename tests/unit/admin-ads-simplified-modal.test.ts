import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Ads Simplified Modal & Single-Upload Suite', () => {
  const rootDir = process.cwd()
  const modalPath = path.join(
    rootDir,
    'src',
    'components',
    'admin',
    'ads',
    'modals',
    'create-ad-modal.tsx'
  )
  const modalContent = fs.readFileSync(modalPath, 'utf-8')

  const adsPagePath = path.join(
    rootDir,
    'src',
    'app',
    'dashboard',
    'admin',
    'ads',
    'page.tsx'
  )
  const pageContent = fs.readFileSync(adsPagePath, 'utf-8')

  it('1. verifies ad placement is locked based on the initially selected tab (no re-selection of levels in modal)', () => {
    // Modal should not have clickable cards to re-select or switch level
    expect(modalContent).not.toContain(
      "setFormData((p) => ({ ...p, placement: 'HOMEPAGE_HERO' }))"
    )
    expect(modalContent).not.toContain(
      "setFormData((p) => ({ ...p, placement: 'PROMOTED_LIST' }))"
    )
    expect(modalContent).not.toContain('Pilih Tingkat Penempatan Iklan:')
    // Should display clean locked placement indicators
    expect(modalContent).toContain('LEVEL 1 • CAROUSEL')
    expect(modalContent).toContain('LEVEL 2 • GRID PRODUK')
  })

  it('2. verifies banner media source is pure upload only (no tabs for store banner, catalog products, presets, or url input)', () => {
    expect(modalContent).not.toContain('Tab Pilihan Sumber Foto')
    expect(modalContent).not.toContain('Preset Banner Promo')
    expect(modalContent).not.toContain('Katalog Produk (')
    expect(modalContent).not.toContain('Input URL')
    expect(modalContent).toContain('Upload Banner Promosi (Foto / Video)')
    expect(modalContent).toContain('processMediaUploadFile')
  })

  it('3. verifies simple date range with only start and end date (no custom days buttons or impression counters)', () => {
    // Only simple start and end date inputs
    expect(modalContent).toContain('Tanggal Mulai Tayang:')
    expect(modalContent).toContain('Tanggal Berakhir Tayang:')
    // Custom day buttons and target impressions should be completely removed
    expect(modalContent).not.toContain('Atau Masukkan Jumlah Hari Kustom:')
    expect(modalContent).not.toContain('Pilih Berapa Hari Ingin Tayang:')
    expect(modalContent).not.toContain('Target Kemunculan')
    expect(modalContent).not.toContain('Berapa kali iklan ingin muncul')
    expect(modalContent).not.toContain('targetImpressions')
  })

  it('4. verifies ads page synchronizes level to modal button', () => {
    expect(pageContent).toContain(
      "levelFilter === 'LEVEL_1' ? 'Level 1' : 'Level 2'"
    )
    expect(pageContent).toContain('endDate')
  })
})
