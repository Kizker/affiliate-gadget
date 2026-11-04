import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Spesifikasi Terpadu: Klaim Garansi, Resolusi Refund & Replacement, dan After Sales Eksekutor Tunggal', () => {
  const paymentCardPath = path.resolve(
    'src/components/customer/order-detail/order-desktop-payment-card.tsx'
  )
  const mobileViewPath = path.resolve(
    'src/components/customer/order-detail/order-mobile-view.tsx'
  )
  const returnModalPath = path.resolve(
    'src/components/customer/return-modal.tsx'
  )
  const afterSalesReturnsPagePath = path.resolve(
    'src/app/dashboard/after-sales/returns/page.tsx'
  )
  const returnDetailApiPath = path.resolve('src/app/api/returns/[id]/route.ts')
  const returnDesktopCardPath = path.resolve(
    'src/components/customer/order-detail/order-desktop-return-card.tsx'
  )

  it('1. Halaman Detail Pesanan Pembeli (Desktop): Tombol terintegrasi "Ajukan Komplain / Klaim Garansi" hanya aktif setelah pesanan diterima (isCompleted)', () => {
    const content = fs.readFileSync(paymentCardPath, 'utf8')
    expect(content).toContain(
      'canRequestReturnOrComplaint && !hasActiveClaim && isCompleted'
    )
    expect(content).toContain('Ajukan Komplain / Klaim Garansi')
    expect(content).toContain('onClick={onOpenReturn}')
  })

  it('2. Halaman Detail Pesanan Pembeli (Mobile): Tombol terintegrasi "Ajukan Komplain / Klaim Garansi" dan Chat Admin After Sales', () => {
    const content = fs.readFileSync(mobileViewPath, 'utf8')
    expect(content).toContain(
      'isCompleted && canRequestReturnOrComplaint && !hasActiveClaim'
    )
    expect(content).toContain('Ajukan Komplain / Klaim Garansi')
    expect(content).toContain('Chat Admin After Sales')
  })

  it('3. Modal Klaim Garansi Pembeli: Menyediakan 2 bentuk resolusi akhir (Refund vs Replacement) dan unggah bukti cacat (Foto & Video)', () => {
    const content = fs.readFileSync(returnModalPath, 'utf8')
    // Pilihan 2 bentuk resolusi
    expect(content).toContain('Bentuk Resolusi Garansi yang Diinginkan')
    expect(content).toContain("setReturnType('REFUND')")
    expect(content).toContain("setReturnType('REPLACEMENT')")
    expect(content).toMatch(/Retur.*Refund/)
    expect(content).toContain('Tukar Unit Baru')

    // Unggah bukti cacat produk (foto & video)
    expect(content).toContain('processMediaUploadFile')
    expect(content).toContain('images')
    expect(content).toContain('videoUrl')
    expect(content).toContain('Unggah Bukti Cacat Produk (Foto/Video)')
    expect(content).toContain('Admin After Sales Terpusat')
  })

  it('4. Meja Kerja Admin After Sales: Bertindak sebagai eksekutor tunggal (Pencairan Dana, Terbitkan Resi Baru, Tolak, dan Live Chat)', () => {
    const content = fs.readFileSync(afterSalesReturnsPagePath, 'utf8')
    // Eksekutor tunggal validasi & pencairan dana
    expect(content).toContain('Eksekutor tunggal validasi bukti cacat produk')
    expect(content).toMatch(/Cairkan Dana/)
    expect(content).toContain('handleExecuteRefund')
    expect(content).toContain("resolutionAction: 'REFUND'")

    // Penerbitan resi unit baru
    expect(content).toMatch(/Kirim Unit Pengganti/)
    expect(content).toContain('handleExecuteReplacement')
    expect(content).toContain("resolutionAction: 'REPLACEMENT'")

    // Penolakan
    expect(content).toContain('Tolak Pengajuan')
    expect(content).toContain('handleRejectByAfterSales')
    expect(content).toContain("action: 'REJECT'")

    // Live chat terintegrasi purna jual
    expect(content).toContain('Chat Pembeli (Purna Jual)')
    expect(content).toContain('/dashboard/after-sales/chat?orderId=')
  })

  it('5. Hak Akses API Retur: Admin Toko Cabang diblokir dari eksekusi, wewenang penuh di After Sales & Superadmin', () => {
    const content = fs.readFileSync(returnDetailApiPath, 'utf8')
    // Store Admin diblokir
    expect(content).toContain("session.user.role === 'STORE_ADMIN'")
    expect(content).toContain(
      'Admin Toko Cabang tidak memiliki wewenang mengelola klaim garansi dan retur'
    )

    // After Sales diizinkan
    expect(content).toContain("session.user.role !== 'AFTER_SALES'")
  })

  it('6. Kartu Status Retur Pembeli memuat Live Chat terintegrasi langsung ke After Sales', () => {
    const content = fs.readFileSync(returnDesktopCardPath, 'utf8')
    expect(content).toContain('/dashboard/customer/chat?')
    expect(content).toContain('type=after_sales')
    expect(content).toContain('Chat Admin After Sales')
  })
})
