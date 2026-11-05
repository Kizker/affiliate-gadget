import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Alur Keputusan After Sales Murni: 2 Pilihan (Setuju & Tolak) + QC 5 Foto + ACC Final Superadmin', () => {
  const afterSalesPagePath = path.resolve(
    'src/app/dashboard/after-sales/returns/page.tsx'
  )
  const returnsRoutePath = path.resolve('src/app/api/returns/[id]/route.ts')
  const superAdminReturnsPagePath = path.resolve(
    'src/app/dashboard/admin/returns/page.tsx'
  )

  it('1. Meja Kerja After Sales: Tidak ada dropdown bertingkat atau menu "Eksekusi Solusi"', () => {
    const page = fs.readFileSync(afterSalesPagePath, 'utf8')
    expect(page).not.toContain('DropdownMenuTrigger')
    expect(page).not.toContain('Pilihan Tindakan')
    expect(page).not.toContain('Eksekusi Solusi (Setelah QC)')
    expect(page).not.toContain('QC Lulus: Cairkan Dana')
    expect(page).not.toContain('QC Lulus: Kirim Unit Pengganti')
  })

  it('2. Meja Kerja After Sales: Tombol awal saat paket belum tiba adalah "Barang Diterima & Mulai QC"', () => {
    const page = fs.readFileSync(afterSalesPagePath, 'utf8')
    expect(page).toContain('Barang Diterima &amp; Mulai QC')
    expect(page).toContain('handleConfirmPackageReceived')
    expect(page).toContain("action: 'CONFIRM_PACKAGE_RECEIVED'")
  })

  it('3. Meja Kerja After Sales: Setelah barang tiba, HANYA ADA 2 TOMBOL ("Setujui Permintaan" & "Tolak Permintaan")', () => {
    const page = fs.readFileSync(afterSalesPagePath, 'utf8')
    expect(page).toContain('Setujui Permintaan')
    expect(page).toContain('Tolak Permintaan')
    expect(page).toContain("setDecisionType('APPROVE')")
    expect(page).toContain("setDecisionType('REJECT')")
  })

  it('4. Modal Keputusan After Sales: Menyediakan input alasan dan lampiran gambar maksimal 5 foto yang fleksibel', () => {
    const page = fs.readFileSync(afterSalesPagePath, 'utf8')
    expect(page).toContain('Foto Bukti Pemeriksaan QC (Maksimal 5)')
    expect(page).toContain('decisionImages.length}/5 Foto')
    expect(page).toContain('handleUploadQcImages')
    expect(page).toContain('handleRemoveQcImage')
    expect(page).toContain('processMediaUploadFile')
    expect(page).toContain('Kirim Persetujuan ke Superadmin')
    expect(page).toContain('Kirim Penolakan ke Superadmin')
    expect(page).toContain('handleSubmitDecision')
  })

  it('5. Backend API: Menerima keputusan After Sales dan menyertakan foto bukti QC maksimal 5', () => {
    const route = fs.readFileSync(returnsRoutePath, 'utf8')
    expect(route).toContain("body.action === 'AFTER_SALES_CONFIRM'")
    expect(route).toContain('qcImages')
    expect(route).toContain('[Foto QC:')
    expect(route).toContain('[Rekomendasi After Sales: DISETUJUI]')
    expect(route).toContain('[Rekomendasi After Sales: DITOLAK]')
    expect(route).toContain("status: 'IN_REVIEW'")
  })

  it('6. Backend API: Ketika Superadmin APPROVE (ACC Final), otomatis eksekusi potong stok & resi Biteship (Replacement) atau cairkan dana escrow Midtrans (Refund)', () => {
    const route = fs.readFileSync(returnsRoutePath, 'utf8')
    expect(route).toContain(
      'isSuperAdmin && isApprove && (isPackageArrived || hasAfterSalesRecommendation)'
    )
    expect(route).toContain("resolutionType === 'REPLACEMENT'")
    expect(route).toContain('INVENTORY_DEDUCT_REPLACEMENT')
    expect(route).toContain('bookShippingPickup')
    expect(route).toContain("status: 'SHIPPED'")
    expect(route).toContain('refundMidtransTransaction')
    expect(route).toContain("status: 'RETURNED'")
    expect(route).toContain("status: 'COMPLETED'")
  })

  it('7. Backend API: Ketika Superadmin REJECT, tiket otomatis dikembalikan ke meja kerja After Sales', () => {
    const route = fs.readFileSync(returnsRoutePath, 'utf8')
    expect(route).toContain('isSuperAdmin && !isApprove')
    expect(route).toContain('[Dikembalikan Superadmin ke After Sales]')
    expect(route).toContain("qcStatus: 'NEEDS_REVISION'")
    expect(route).toContain("role: 'AFTER_SALES'")
    expect(route).toContain('Tiket Retur Dikembalikan oleh Superadmin')
  })

  it('8. Meja Kerja Superadmin: Menampilkan galeri foto bukti QC After Sales dan tombol ACC Final vs Tolak & Kembalikan', () => {
    const superAdminPage = fs.readFileSync(superAdminReturnsPagePath, 'utf8')
    expect(superAdminPage).toContain('extractQcImages')
    expect(superAdminPage).toContain('Lampiran Foto Bukti QC After Sales')
    expect(superAdminPage).toContain('ACC Final: Kirim Unit Baru')
    expect(superAdminPage).toContain('ACC Final: Cairkan Dana')
    expect(superAdminPage).toContain('Tolak &amp; Kembalikan')
  })
})
