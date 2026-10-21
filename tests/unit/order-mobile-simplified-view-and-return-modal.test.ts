import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mobile Order Detail & Return Modal Simplified Layout Suite', () => {
  const rootDir = process.cwd()

  it('1. Memvalidasi order-detail-client.tsx menggunakan judul "Rincian Pesanan" pada MobileTopNav', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'app',
      'dashboard',
      'customer',
      'orders',
      '[orderId]',
      'order-detail-client.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('title="Rincian Pesanan"')
  })

  it('2. Memvalidasi order-mobile-view.tsx merender struktur kartu terpisah yang ringkas', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'components',
      'customer',
      'order-detail',
      'order-mobile-view.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // Card 1: Identitas Pesanan
    expect(content).toContain('No. Pesanan')
    expect(content).toContain('Waktu Transaksi')
    expect(content).toContain('Salin')

    // Card 2: Produk Dipesan
    expect(content).toContain('PRODUK DIPESAN')
    expect(content).toContain('Bonus Tambahan')
    expect(content).toContain('Paket Aksesoris 3-in-1 (Gratis)')

    // Card 3: Pengiriman
    expect(content).toContain('PENGIRIMAN')
    expect(content).toContain('Toko Penjual')
    expect(content).toContain('Kurir & Layanan')
    expect(content).toContain('No. Resi')
    expect(content).toContain('Status Pengiriman')

    // Card 4: Rincian Pembayaran
    expect(content).toContain('RINCIAN PEMBAYARAN')
    expect(content).toContain('Subtotal Produk')
    expect(content).toContain('Ongkos Kirim Kurir')
    expect(content).toContain('Asuransi Pengiriman 100%')
    expect(content).toContain('Total Pembayaran')

    // Card 5: Riwayat Transaksi
    expect(content).toContain('RIWAYAT TRANSAKSI')
    expect(content).toContain('Diterima')

    // Tombol Aksi Utama
    expect(content).toContain('Beri Ulasan Produk')
    expect(content).toContain('Klaim Garansi')
    expect(content).toContain('Ajukan Pengembalian (Retur)')

    // Ulasan Anda & Media
    expect(content).toContain('Ulasan Anda')
    expect(content).toContain('currentReview.images?.map')
    expect(content).toContain('currentReview.videos?.map')
    expect(content).toContain('onOpenMedia?: (index: number) => void')
  })

  it('3. Memvalidasi return-modal.tsx merefleksikan form pengembalian yang simpel & presisi', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'components',
      'customer',
      'return-modal.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // Header
    expect(content).toContain('Pengajuan Pengembalian')
    expect(content).toContain('ID Pesanan:')
    expect(content).toContain('#{orderNumber}')

    // Solusi yang Diinginkan (1 baris di setiap mobile resolution)
    expect(content).toContain('Solusi yang Diinginkan')
    expect(content).toContain('Pengembalian Dana')
    expect(content).toContain('Tukar Unit')
    expect(content).toContain('whitespace-nowrap')

    // Kategori Alasan
    expect(content).toContain('Kategori Alasan')
    expect(content).toContain('Cacat Fisik / Pecah')
    expect(content).toContain('Mati Total (DOA)')
    expect(content).toContain('Salah Varian')
    expect(content).toContain('Aksesoris Kurang')
    expect(content).toContain('Kendala Lainnya')

    // Penjelasan Sederhana & Rekening
    expect(content).toContain('Rincian Penjelasan Kendala')
    expect(content).toContain('Unit cacat fisik atau layar retak saat unboxing')
    expect(content).toContain('Rekening Tujuan Pengembalian')
    expect(content).toContain('Nama Bank')
    expect(content).toContain('Nomor Rekening')
    expect(content).toContain('Atas Nama Rekening')

    // Dropdown tidak menempel di footer
    expect(content).toContain('max-h-32')
    expect(content).toContain('pb-16')

    // Tombol Footer
    expect(content).toContain('Batal')
    expect(content).toContain('Kirim Pengajuan')
  })

  it('4. Memvalidasi rating-modal.tsx menampilkan poin kepuasan cepat 2 baris 2 kolom tanpa emot', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'components',
      'modals',
      'rating-modal.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // Poin Kepuasan Cepat 2 baris 2 kolom
    expect(content).toContain('Poin Kepuasan Cepat (Opsional):')
    expect(content).toContain('grid grid-cols-2 gap-2')
    expect(content).toContain('Pengiriman Cepat')
    expect(content).toContain('Packing Aman')
    expect(content).toContain('Unit 100% Original')
    expect(content).toContain('Respon Ramah')

    // Tidak ada emoji di QUICK_TAGS
    expect(content).not.toContain('⚡')
    expect(content).not.toContain('📦')
    expect(content).not.toContain('📱')
    expect(content).not.toContain('🎁')
    expect(content).not.toContain('💬')
  })

  it('5. Memvalidasi complaint-modal.tsx (Klaim Garansi) menggunakan dropdown kategori dan layout bersih', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'components',
      'customer',
      'complaint-modal.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // Header & Subtitle
    expect(content).toContain('Klaim Garansi')
    expect(content).toContain('Pesanan')
    expect(content).toContain('#{orderNumber}')

    // Dropdown Kategori Kendala
    expect(content).toContain('Kategori Kendala')
    expect(content).toContain('ChevronDown')
    expect(content).toContain('Layar & LCD')
    expect(content).toContain('Baterai & Daya')
    expect(content).toContain('Kamera & Audio')
    expect(content).toContain('Mati Total / Mesin')
    expect(content).toContain('Lainnya / Fisik')

    // Subjek & Rincian Masalah
    expect(content).toContain('Subjek Kendala')
    expect(content).toContain('Contoh: Layar sentuh tidak merespons sebagian')
    expect(content).toContain('Rincian Masalah')
    expect(content).toContain(
      'Tuliskan kronologi dan kendala yang dialami secara singkat...'
    )

    // Bukti Foto / Video & Tombol
    expect(content).toContain('Bukti Foto / Video')
    expect(content).toContain('Opsional (Maks. 5 file)')
    expect(content).toContain('Unggah Foto atau Video')
    expect(content).toContain('Batal')
    expect(content).toContain('Ajukan Klaim')
  })
})
