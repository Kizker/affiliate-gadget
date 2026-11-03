import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Dual-Tier Return Approval: After Sales Confirmation & Superadmin Final ACC Workflow', () => {
  const sidebarPath = path.resolve('src/components/dashboard/sidebar.tsx')
  const returnsRoutePath = path.resolve('src/app/api/returns/[id]/route.ts')
  const afterSalesPagePath = path.resolve(
    'src/app/dashboard/after-sales/returns/page.tsx'
  )
  const superAdminReturnsPagePath = path.resolve(
    'src/app/dashboard/admin/returns/page.tsx'
  )

  it('1. Sidebar Superadmin: Memuat menu navigasi Persetujuan Retur & Garansi', () => {
    const sidebar = fs.readFileSync(sidebarPath, 'utf8').replace(/\r\n/g, '\n')
    expect(sidebar).toContain('superAdminNavSections')
    expect(sidebar).toContain('Persetujuan Retur & Garansi')
    expect(sidebar).toContain('/dashboard/admin/returns')
    expect(sidebar).toContain("href === '/dashboard/admin/returns'")
  })

  it('2. Backend API: Mendukung aksi AFTER_SALES_CONFIRM dengan validasi alasan wajib dan notifikasi Superadmin', () => {
    const route = fs
      .readFileSync(returnsRoutePath, 'utf8')
      .replace(/\r\n/g, '\n')

    // Mendukung AFTER_SALES_CONFIRM dan FORWARD_TO_SUPERADMIN
    expect(route).toContain("body.action === 'AFTER_SALES_CONFIRM'")
    expect(route).toContain("body.action === 'FORWARD_TO_SUPERADMIN'")

    // Validasi alasan wajib minimal 5 karakter
    expect(route).toContain('rawNotes.length < 5')
    expect(route).toContain(
      'Alasan konfirmasi After Sales wajib diisi dengan jelas dan detail (minimal 5 karakter).'
    )

    // Format catatan rekomendasi di storeResponse
    expect(route).toContain('[Rekomendasi After Sales: DISETUJUI]')
    expect(route).toContain('[Rekomendasi After Sales: DITOLAK]')
    expect(route).toContain("status: 'IN_REVIEW'")

    // Kirim notifikasi ke role SUPER_ADMIN
    expect(route).toContain("role: 'SUPER_ADMIN'")
    expect(route).toContain('/dashboard/admin/returns')
  })

  it('3. Backend API: Putusan Final APPROVE & REJECT didukung untuk Superadmin dengan tagging transparan', () => {
    const route = fs
      .readFileSync(returnsRoutePath, 'utf8')
      .replace(/\r\n/g, '\n')

    expect(route).toContain("session.user.role === 'SUPER_ADMIN'")
    expect(route).toContain('[Disetujui Superadmin]')
    expect(route).toContain('[Ditolak Superadmin]')
    expect(route).toContain('Pengajuan Retur Disetujui Superadmin')
    expect(route).toContain('Pengajuan Retur Ditolak Superadmin')
  })

  it('4. Meja Kerja After Sales: Menyediakan tombol modal Rekomendasi Setuju & Tolak ke Superadmin dan banner status', () => {
    const page = fs
      .readFileSync(afterSalesPagePath, 'utf8')
      .replace(/\r\n/g, '\n')

    // Tombol rekomendasi di kartu
    expect(page).toContain('Rekomendasikan Setuju (Kirim ke Superadmin)')
    expect(page).toContain('Rekomendasikan Tolak (Kirim ke Superadmin)')

    // Fungsi handleConfirmRecommendation
    expect(page).toContain('handleConfirmRecommendation')
    expect(page).toContain("action: 'AFTER_SALES_CONFIRM'")

    // Modal rekomendasi setuju & tolak
    expect(page).toMatch(/Konfirmasi Setujui Klaim.*Kirim ke Superadmin/)
    expect(page).toMatch(/Konfirmasi Tolak Klaim.*Kirim ke Superadmin/)
    expect(page).toContain(
      'Alasan &amp; Catatan Rekomendasi Persetujuan After Sales (Wajib)'
    )
    expect(page).toContain('Alasan &amp; Catatan Rekomendasi Penolakan (Wajib)')

    // Banner status rekomendasi
    expect(page).toContain('Rekomendasi After Sales: DISETUJUI')
    expect(page).toContain('Rekomendasi After Sales: DITOLAK')
    expect(page).toContain('Menunggu ACC Final Superadmin')
  })

  it('5. Meja Kerja Superadmin: Menampilkan tab Menunggu ACC Superadmin, nama barang lengkap, banner rekomendasi AS, dan tombol ACC Final', () => {
    const page = fs
      .readFileSync(superAdminReturnsPagePath, 'utf8')
      .replace(/\r\n/g, '\n')

    // Tab filter
    expect(page).toContain('Menunggu ACC Superadmin')
    expect(page).toContain("statusFilter === 'IN_REVIEW'")

    // Informasi nama barang, brand, dan varian
    expect(page).toContain('Unit Gadget / Barang Dipesan')
    expect(page).toContain('prod.brand')
    expect(page).toContain('orderItem.variantName')

    // Banner rekomendasi After Sales
    expect(page).toContain('Rekomendasi Admin After Sales: DISETUJUI')
    expect(page).toContain('Rekomendasi Admin After Sales: DITOLAK')
    expect(page).toContain('Catatan Telaah After Sales:')

    // Tombol aksi Superadmin
    expect(page).toContain('Setujui Pengembalian')
    expect(page).toContain('Tolak')
    expect(page).toMatch(/Setujui Final \(ACC Retur &.*Garansi\)/)
  })
})
