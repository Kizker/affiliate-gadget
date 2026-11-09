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

  it('1. Sidebar Superadmin: Memuat menu navigasi Persetujuan Retur & Garansi (ACC)', () => {
    const sidebar = fs.readFileSync(sidebarPath, 'utf8').replace(/\r\n/g, '\n')
    expect(sidebar).toContain('superAdminNavSections')
    expect(sidebar).toContain('Persetujuan Retur')
    expect(sidebar).toContain('/dashboard/admin/returns')
    expect(sidebar).toContain("href === '/dashboard/admin/returns'")
  })

  it('2. Backend API: Mendukung aksi AFTER_SALES_CONFIRM dengan alasan fleksibel / foto QC dan notifikasi Superadmin', () => {
    const route = fs
      .readFileSync(returnsRoutePath, 'utf8')
      .replace(/\r\n/g, '\n')

    // Mendukung AFTER_SALES_CONFIRM dan FORWARD_TO_SUPERADMIN
    expect(route).toContain("body.action === 'AFTER_SALES_CONFIRM'")
    expect(route).toContain("body.action === 'FORWARD_TO_SUPERADMIN'")

    // Validasi alasan fleksibel bersama lampiran foto QC
    expect(route).toContain('qcImages')
    expect(route).toContain(
      'Mohon sertakan deskripsi alasan pemeriksaan atau lampirkan minimal 1 foto bukti QC.'
    )

    // Format catatan rekomendasi di storeResponse
    expect(route).toContain('[Rekomendasi After Sales: DISETUJUI]')
    expect(route).toContain('[Rekomendasi After Sales: DITOLAK]')
    expect(route).toContain('[Foto QC:')
    expect(route).toContain("status: 'IN_REVIEW'")

    // Kirim notifikasi ke role SUPER_ADMIN
    expect(route).toContain("role: 'SUPER_ADMIN'")
    expect(route).toContain('/dashboard/admin/returns')
  })

  it('3. Backend API: Putusan Final APPROVE & REJECT didukung untuk Superadmin dengan eksekusi otomatis atau dikembalikan ke After Sales', () => {
    const route = fs
      .readFileSync(returnsRoutePath, 'utf8')
      .replace(/\r\n/g, '\n')

    expect(route).toContain("session.user.role === 'SUPER_ADMIN'")
    expect(route).toContain('[Disetujui Superadmin]')
    expect(route).toContain('[Dikembalikan Superadmin ke After Sales]')
    expect(route).toContain('Pengajuan Retur Disetujui Superadmin')
  })

  it('4. Meja Kerja After Sales: Menyediakan 2 tombol keputusan murni (Setujui Permintaan & Tolak Permintaan) dengan lampiran foto QC maksimal 5', () => {
    const page = fs
      .readFileSync(afterSalesPagePath, 'utf8')
      .replace(/\r\n/g, '\n')

    // 2 Tombol keputusan murni di kartu
    expect(page).toContain('Setujui Permintaan')
    expect(page).toContain('Tolak Permintaan')

    // Handler keputusan & upload foto QC
    expect(page).toContain('handleSubmitDecision')
    expect(page).toContain('handleUploadQcImages')
    expect(page).toContain("action: 'AFTER_SALES_CONFIRM'")

    // Modal keputusan terpadu dengan alasan dan lampiran gambar maksimal 5
    expect(page).toContain('Foto Bukti Pemeriksaan QC (Maksimal 5)')
    expect(page).toContain('Kirim Persetujuan ke Superadmin')
    expect(page).toContain('Kirim Penolakan ke Superadmin')

    // Banner status rekomendasi
    expect(page).toContain('Rekomendasi Terkirim')
    expect(page).toMatch(/Menunggu ACC Final[\s\S]*Superadmin/)
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

    // Tombol aksi Superadmin langsung (1-klik tanpa modal)
    expect(page).toContain('ACC Final')
    expect(page).toContain('Tolak &amp; Kembalikan')
    expect(page).toContain('handleDirectApprove')
    expect(page).toContain('handleDirectRejectAndReturn')
  })
})
