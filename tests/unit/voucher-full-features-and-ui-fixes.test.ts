import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { calculateVoucherDiscountAmount } from '@/lib/constants/voucher'

describe('Penyempurnaan Lengkap Sistem Voucher (5 Poin Perbaikan)', () => {
  const sidebarPath = path.resolve('src/components/dashboard/sidebar.tsx')
  const voucherPagePath = path.resolve(
    'src/app/dashboard/admin/vouchers/page.tsx'
  )
  const voucherClaimPath = path.resolve('src/app/voucher/claim/page.tsx')
  const voucherPickerPath = path.resolve(
    'src/components/checkout/voucher-picker-modal.tsx'
  )
  const voucherAdminApiPath = path.resolve(
    'src/app/api/admin/vouchers/route.ts'
  )
  const voucherAdminIdApiPath = path.resolve(
    'src/app/api/admin/vouchers/[id]/route.ts'
  )
  const middlewarePath = path.resolve('src/middleware.ts')

  it('1. Poin 1 (Header Overlap Bug): Modal voucher menggunakan React Portal z-[99999] agar header tidak menimpa', () => {
    const pageContent = fs.readFileSync(voucherPagePath, 'utf8')

    // createPortal harus diimport dan digunakan pada modal
    expect(pageContent).toContain("import { createPortal } from 'react-dom'")
    expect(pageContent).toContain('createPortal(')

    // Modal menggunakan z-index tinggi z-[99999] dan backdrop-blur
    expect(pageContent).toContain('z-[99999]')
    expect(pageContent).toContain('overflow-y-auto')

    // Lock body scroll saat modal aktif
    expect(pageContent).toContain("document.body.style.overflow = 'hidden'")
  })

  it('2. Poin 2 (Date Inputs Overlap Bug): Grid tanggal menggunakan responsive grid-cols-1 sm:grid-cols-2 min-w-0', () => {
    const pageContent = fs.readFileSync(voucherPagePath, 'utf8')

    // Form tanggal tidak lagi menggunakan grid-cols-2 statis yang menimpa pada mobile
    expect(pageContent).toContain('grid grid-cols-1 gap-3 sm:grid-cols-2')
    expect(pageContent).toContain('w-full min-w-0')
  })

  it('3. Poin 3 (Menu Sidebar & Scoping Admin Toko): Admin Toko memiliki menu voucher mandiri & terisolasi', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8')
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
    const adminApiContent = fs.readFileSync(voucherAdminApiPath, 'utf8')
    const adminIdApiContent = fs.readFileSync(voucherAdminIdApiPath, 'utf8')

    // Menu Voucher Promo muncul di storeAdminNavSections
    expect(sidebarContent).toContain(
      "{ icon: Tag, label: 'Voucher Promo', href: '/dashboard/admin/vouchers' }"
    )

    // Middleware mengizinkan STORE_ADMIN ke /dashboard/admin/vouchers
    expect(middlewareContent).toMatch(
      /'\/dashboard\/admin\/vouchers':\s*\[[^\]]*'STORE_ADMIN'[^\]]*\]/
    )

    // API Voucher mengisolasi toko cabang
    expect(adminApiContent).toContain('isStoreAdmin')
    expect(adminApiContent).toContain('session.user.storeId')

    // Detail/Edit/Delete API memblokir modifikasi antar cabang
    expect(adminIdApiContent).toContain('session.user.storeId')
  })

  it('4. Poin 3 (Diskon Nominal Langsung vs Persentase): Kalkulator diskon mendukung FIXED_AMOUNT & PERCENTAGE', () => {
    // Persentase 10% dari Rp 100.000 = Rp 10.000
    const pctDiscount = calculateVoucherDiscountAmount(
      100000,
      10,
      null,
      'PERCENTAGE',
      null
    )
    expect(pctDiscount).toBe(10000)

    // Persentase dengan max cap Rp 15.000
    const cappedDiscount = calculateVoucherDiscountAmount(
      500000,
      10,
      15000,
      'PERCENTAGE',
      null
    )
    expect(cappedDiscount).toBe(15000)

    // Nominal langsung (FIXED_AMOUNT) Rp 25.000
    const fixedDiscount = calculateVoucherDiscountAmount(
      100000,
      0,
      null,
      'FIXED_AMOUNT',
      25000
    )
    expect(fixedDiscount).toBe(25000)

    // Nominal langsung tidak melebihi subtotal
    const fixedExceed = calculateVoucherDiscountAmount(
      20000,
      0,
      null,
      'FIXED_AMOUNT',
      50000
    )
    expect(fixedExceed).toBe(20000)
  })

  it('5. Poin 4 (Shopee-Style Interactive Voucher Picker): Menampilkan voucher toko vs global dengan feedback kekurangan belanja', () => {
    const pickerContent = fs.readFileSync(voucherPickerPath, 'utf8')

    // Harus menampilkan badge toko vs global
    expect(pickerContent).toContain('v.storeName')
    expect(pickerContent).toContain('Global Platform')

    // Menampilkan potensi penghematan
    expect(pickerContent).toContain('Hemat Rp')

    // Menampilkan bagian belum memenuhi syarat
    expect(pickerContent).toContain('Voucher Belum Memenuhi Syarat')
  })

  it('6. Poin 5 (Fitur Bagikan Voucher): Tombol bagikan dan halaman klaim otomatis /voucher/claim tersedia', () => {
    const pageContent = fs.readFileSync(voucherPagePath, 'utf8')
    const pickerContent = fs.readFileSync(voucherPickerPath, 'utf8')
    const claimExists = fs.existsSync(voucherClaimPath)

    // Halaman klaim voucher publik ada
    expect(claimExists).toBe(true)

    const claimClientPath = path.resolve(
      'src/components/voucher/voucher-claim-view.tsx'
    )
    const claimContent = fs.existsSync(claimClientPath)
      ? fs.readFileSync(claimClientPath, 'utf8')
      : fs.readFileSync(voucherClaimPath, 'utf8')
    expect(claimContent).toContain("searchParams.get('code')")
    expect(claimContent).toMatch(/navigator\.clipboard\s*\.\s*writeText/)
    expect(claimContent).toContain('api.whatsapp.com')

    // Tombol share dan link generate tersedia di dashboard admin dan di picker checkout
    expect(pageContent).toContain('Bagikan Voucher')
    expect(pageContent).toContain('/voucher/claim?code=')
    expect(pickerContent).toContain('handleShareVoucher')
    expect(pickerContent).toContain('/voucher/claim?code=')
  })

  it('7. Perbaikan Modal Mobile & Subtitle Header (Tidak Terpotong, Lebih Pendek, Form Atas Terlihat, Keterangan Dihapus)', () => {
    const pageContent = fs.readFileSync(voucherPagePath, 'utf8')

    // Keterangan subtitle di bawah judul sudah dihapus sesuai instruksi user
    expect(pageContent).not.toContain(
      'Terbitkan kode kupon potongan harga belanja khusus untuk pelanggan cabang toko Anda'
    )

    // Modal dibuat lebih pendek (max-h-[85vh]) agar tidak terpotong
    expect(pageContent).toContain('max-h-[85vh]')

    // Form inputs berada di area scroll tersendiri (overflow-y-auto) dengan header & footer fixed
    expect(pageContent).toContain(
      'flex min-h-0 flex-1 flex-col overflow-hidden'
    )
    expect(pageContent).toContain('flex-1 space-y-4 overflow-y-auto px-5 py-4')
  })

  it('8. Penyederhanaan Statistik 1 Baris & Eliminasi Kolom Cakupan Toko untuk Admin Toko', () => {
    const pageContent = fs.readFileSync(voucherPagePath, 'utf8')

    // Statistik KPI dalam 1 baris (grid-cols-3)
    expect(pageContent).toContain('grid grid-cols-3 gap-2 sm:gap-4')

    // Deskripsi bawah dihilangkan
    expect(pageContent).not.toContain('Voucher milik cabang toko ini')
    expect(pageContent).not.toContain('Siap digunakan saat checkout')
    expect(pageContent).not.toContain('Kupon berhasil ditukarkan pembeli')

    // Kolom Cakupan Toko hanya tampil untuk Super Admin, dihilangkan untuk Admin Toko
    expect(pageContent).toContain('!isStoreAdmin')
    expect(pageContent).toContain(
      '<th className="px-5 py-3.5">Cakupan Toko</th>'
    )
    expect(pageContent).toContain('{!isStoreAdmin && (')
  })

  it('9. Poin 1, 2 & 3 (Penyederhanaan Modal Bagikan: Kartu Tiket + Tombol Salin Saja, Eliminasi Subtitle & Elemen Terpotong)', () => {
    const pageContent = fs.readFileSync(voucherPagePath, 'utf8')

    // Tidak ada lagi tombol hijau Bagikan ke WhatsApp
    expect(pageContent).not.toContain('Bagikan ke WhatsApp')

    // Subtitle modal header dihapus (Screenshot 3)
    expect(pageContent).not.toContain(
      'Bagikan kode kupon & tautan klaim langsung ke calon pembeli'
    )

    // Elemen badge yang terpotong di kanan atas tiket dihapus (Screenshot 2)
    expect(pageContent).not.toContain(
      "{voucherToShare.discountType === 'FIXED_AMOUNT' ? 'Potongan Langsung' : 'Diskon Persen'}"
    )

    // Pratinjau pesan dan input salin tautan sekunder dihapus (Screenshot 1)
    expect(pageContent).not.toContain('Pratinjau Pesan Bagikan')
    expect(pageContent).not.toContain('Atau Salin Tautan Saja')

    // Hanya kartu tiket voucher dan 1 tombol salin tautan voucher di bawahnya
    expect(pageContent).toContain('Salin Tautan Voucher')
    expect(pageContent).toContain('handleCopyShareLink(voucherToShare.code)')

    // Desain modal tiket dengan notch cutouts dan gradient tetap dipertahankan
    expect(pageContent).toContain(
      'absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full'
    )
    expect(pageContent).toContain(
      'absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full'
    )
  })

  it('10. Poin 3 (Keterangan Aksi dan Tombol Berada di Tengah / Centered)', () => {
    const pageContent = fs.readFileSync(voucherPagePath, 'utf8')

    // Header Aksi harus berada di tengah (text-center), bukan text-right
    expect(pageContent).toContain(
      '<th className="px-5 py-3.5 text-center">Aksi</th>'
    )
    expect(pageContent).not.toContain(
      '<th className="px-5 py-3.5 text-right">Aksi</th>'
    )

    // Sel tabel td dan flex container aksi harus di tengah (text-center & justify-center)
    expect(pageContent).toContain('<td className="px-5 py-4 text-center">')
    expect(pageContent).toContain(
      '<div className="flex items-center justify-center gap-1">'
    )
  })

  it('11. Poin 4 (Pagination Aktif: Maksimal 10 Voucher per Halaman di API & UI)', () => {
    const pageContent = fs.readFileSync(voucherPagePath, 'utf8')
    const apiContent = fs.readFileSync(voucherAdminApiPath, 'utf8')

    // API Admin Vouchers mendukung page, limit=10, skip, take, dan pagination metadata
    expect(apiContent).toContain("searchParams.get('page')")
    expect(apiContent).toContain("searchParams.get('limit')")
    expect(apiContent).toContain('skip')
    expect(apiContent).toContain('take: limit')
    expect(apiContent).toContain('pagination: {')
    expect(apiContent).toContain('totalPages')

    // UI Admin Vouchers mengelola pagination & kontrol navigasi
    expect(pageContent).toContain('pagination.total')
    expect(pageContent).toContain('pagination.totalPages')
    expect(pageContent).toContain('Menampilkan')
    expect(pageContent).toContain('Sebelumnya')
    expect(pageContent).toContain('Selanjutnya')
    expect(pageContent).toContain('setCurrentPage')
  })

  it('12. Poin 4 (Screenshoot 4: Pratinjau Tautan WhatsApp / Media Sosial Memuat Gambar, Judul & Deskripsi Lengkap)', () => {
    const claimServerPagePath = path.resolve('src/app/voucher/claim/page.tsx')
    const claimClientPath = path.resolve(
      'src/components/voucher/voucher-claim-view.tsx'
    )
    const ogApiPath = path.resolve('src/app/api/vouchers/og/route.ts')

    // File Server Component claim page ada dan mengekspor generateMetadata
    expect(fs.existsSync(claimServerPagePath)).toBe(true)
    const claimPageContent = fs.readFileSync(claimServerPagePath, 'utf8')
    expect(claimPageContent).toContain('export async function generateMetadata')
    expect(claimPageContent).toContain('openGraph')
    expect(claimPageContent).toContain('/api/vouchers/og?code=')
    expect(claimPageContent).toContain('twitter')

    // Komponen interaktif klaim voucher berjalan di sisi client
    expect(fs.existsSync(claimClientPath)).toBe(true)
    const claimClientContent = fs.readFileSync(claimClientPath, 'utf8')
    expect(claimClientContent).toContain("'use client'")
    expect(claimClientContent).toContain('VoucherClaimView')

    // Endpoint OpenGraph generator gambar PNG voucher tersedia (/api/vouchers/og)
    expect(fs.existsSync(ogApiPath)).toBe(true)
    const ogApiContent = fs.readFileSync(ogApiPath, 'utf8')
    expect(ogApiContent).toContain(
      "headers: {\n        'Content-Type': 'image/png'"
    )
    expect(ogApiContent).toContain('sharp(Buffer.from(svg.trim()))')
  })
})
