import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  calculateOrderFinancials,
  formatVariantCode,
} from '@/lib/order-payment-utils'

describe('Transparent Order Payment Breakdown Suite — Admin Toko & Pembeli', () => {
  const rootDir = process.cwd()

  describe('1. Logika Kalkulasi Keuangan Toko (Kalkulator Pembukuan Otomatis)', () => {
    it('menghitung potongan dan estimasi penghasilan bersih sesuai formula referensi', () => {
      // Sesuai referensi gambar: Subtotal Rp 4.499.000
      const fin = calculateOrderFinancials({
        subtotal: 4499000,
        total: 4499000,
        commissionRate: 2.0, // 2%
        shippingCost: 18000,
        insuranceFee: 9000,
        payment: { paymentMethod: 'MANDIRI_VA' },
      })

      expect(fin.subtotal).toBe(4499000)
      expect(fin.subtotalAfterDiscount).toBe(4499000)

      // PPh 22 (0.5% dari subtotal): 4.499.000 * 0.005 = 22.495
      expect(fin.pph22Amount).toBe(22495)
      expect(fin.pph22Rate).toBe(0.5)

      // Biaya Platform (2% dari subtotal): 4.499.000 * 0.02 = 89.980
      expect(fin.platformFee).toBe(89980)

      // Biaya Layanan (Payment Gateway Midtrans VA: Flat Rp 4.000)
      expect(fin.serviceFee).toBe(4000)

      // Pemisahan Logistik (Pass-through kurir)
      expect(fin.shippingCost).toBe(18000)
      expect(fin.insuranceFee).toBe(9000)

      // Estimasi Penghasilan Bersih Toko = 4.499.000 - 89.980 - 4.000 - 22.495 = 4.382.525
      const expectedNet = 4499000 - 89980 - 4000 - 22495
      expect(fin.estimatedNetIncome).toBe(expectedNet)
    })

    it('mendukung komisi khusus dan pemrosesan QRIS 0.7%', () => {
      const fin = calculateOrderFinancials({
        subtotal: 10000000,
        total: 10000000,
        commissionAmount: 200000,
        payment: { paymentMethod: 'QRIS' },
      })

      expect(fin.platformFee).toBe(200000)
      expect(fin.serviceFee).toBe(70000) // 0.7% dari 10.000.000
      expect(fin.pph22Amount).toBe(50000) // 0.5% dari 10.000.000
      expect(fin.estimatedNetIncome).toBe(10000000 - 200000 - 70000 - 50000)
    })

    it('mengosongkan estimasi penghasilan saat pesanan berstatus CANCELLED atau RETURNED', () => {
      const finCancelled = calculateOrderFinancials({
        subtotal: 5000000,
        total: 5000000,
        status: 'CANCELLED',
      })
      expect(finCancelled.estimatedNetIncome).toBe(0)
      expect(finCancelled.isCancelledOrReturned).toBe(true)

      const finReturned = calculateOrderFinancials({
        subtotal: 5000000,
        total: 5000000,
        status: 'RETURNED',
      })
      expect(finReturned.estimatedNetIncome).toBe(0)
      expect(finReturned.isCancelledOrReturned).toBe(true)
    })

    it('memformat kode variasi terstruktur (SKU / Kode Model)', () => {
      const codeWithSku = formatVariantCode({
        variantId: 'var123',
        product: { sku: 'SM-S22', name: 'Samsung Galaxy S22' },
      })
      expect(codeWithSku).toBe('SM-S22-23')

      const codeFallback = formatVariantCode({
        variantId: 'var99',
        product: { name: 'Samsung S22 Ultra 5G', brand: 'Samsung' },
      })
      expect(codeFallback).toContain('SAM-S22-99')
    })
  })

  describe('2. Verifikasi Komponen Admin Toko (AdminOrderPaymentCard)', () => {
    const adminCardPath = path.join(
      rootDir,
      'src/components/admin/orders/admin-order-payment-card.tsx'
    )
    const adminCardContent = fs.readFileSync(adminCardPath, 'utf8')

    it('memuat header "Informasi Pembayaran" dan link "Lihat riwayat transaksi"', () => {
      expect(adminCardContent).toContain('Informasi Pembayaran')
      expect(adminCardContent).toContain('Lihat riwayat transaksi')
      expect(adminCardContent).toContain('/dashboard/admin/finance')
    })

    it('memuat tabel produk dengan kolom No, Produk, Harga Satuan, Jumlah, Subtotal, dan Kode Variasi', () => {
      expect(adminCardContent).toContain('<table')
      expect(adminCardContent).toContain('No.')
      expect(adminCardContent).toContain('Produk')
      expect(adminCardContent).toContain('Harga Satuan')
      expect(adminCardContent).toContain('Jumlah')
      expect(adminCardContent).toContain('Subtotal')
      expect(adminCardContent).toContain('Variasi:')
      expect(adminCardContent).toContain('Kode Variasi:')
    })

    it('memuat pos rincian potongan: Subtotal Pesanan, Pemisahan Ongkir & Asuransi, Biaya Platform, Biaya Layanan, dan Pajak PPh 22', () => {
      expect(adminCardContent).toContain('Subtotal Pesanan')
      expect(adminCardContent).toContain('Ongkos Kirim & Asuransi')
      expect(adminCardContent).toContain('Kurir Rekanan')
      expect(adminCardContent).toContain('Biaya Platform')
      expect(adminCardContent).toContain('Biaya Layanan')
      expect(adminCardContent).toContain('Pajak')
      expect(adminCardContent).toContain('PPh 22')
    })

    it('memuat akordion buka-tutup (Chevron) dan ikon bantuan tanda tanya (?) pada setiap pos', () => {
      expect(adminCardContent).toContain('HelpCircle')
      expect(adminCardContent).toContain('ChevronUp')
      expect(adminCardContent).toContain('ChevronDown')
      expect(adminCardContent).toContain('toggleSection')
      expect(adminCardContent).toContain('toggleHelp')
    })

    it('menutup dengan angka mencolok "Estimasi Total Penghasilan"', () => {
      expect(adminCardContent).toContain('Estimasi Total Penghasilan')
      expect(adminCardContent).toContain('text-orange-600')
      expect(adminCardContent).toContain('font-black')
    })
  })

  describe('3. Verifikasi Komponen Pembeli (CustomerPaymentBreakdown)', () => {
    const customerCardPath = path.join(
      rootDir,
      'src/components/customer/order-detail/customer-payment-breakdown.tsx'
    )
    const customerCardContent = fs.readFileSync(customerCardPath, 'utf8')

    it('menyajikan rincian biaya transparan bagi pembeli', () => {
      expect(customerCardContent).toContain('Subtotal Produk')
      expect(customerCardContent).toContain('Ongkos Kirim Kurir')
      expect(customerCardContent).toContain('Asuransi Pengiriman')
      expect(customerCardContent).toContain('Paket Bonus 3-in-1')
      expect(customerCardContent).toContain('Total Pembayaran')
    })

    it('dilengkapi akordion buka-tutup (Chevron) dan tombol bantuan tanda tanya (?)', () => {
      expect(customerCardContent).toContain('HelpCircle')
      expect(customerCardContent).toContain('ChevronUp')
      expect(customerCardContent).toContain('ChevronDown')
      expect(customerCardContent).toContain('toggleSection')
      expect(customerCardContent).toContain('toggleHelp')
    })
  })

  describe('4. Integrasi Menyeluruh Halaman Admin & Customer', () => {
    it('mengintegrasikan AdminOrderPaymentCard di halaman pesanan Admin Toko', () => {
      const adminOrdersPage = fs.readFileSync(
        path.join(rootDir, 'src/app/dashboard/admin/orders/page.tsx'),
        'utf8'
      )
      expect(adminOrdersPage).toContain('AdminOrderPaymentCard')
      expect(adminOrdersPage).toContain(
        '<AdminOrderPaymentCard order={selectedOrder} />'
      )
    })

    it('mengintegrasikan CustomerPaymentBreakdown di tampilan desktop pesanan pembeli', () => {
      const desktopCard = fs.readFileSync(
        path.join(
          rootDir,
          'src/components/customer/order-detail/order-desktop-payment-card.tsx'
        ),
        'utf8'
      )
      expect(desktopCard).toContain('CustomerPaymentBreakdown')
      expect(desktopCard).toContain('<CustomerPaymentBreakdown order={order}')
    })

    it('mengintegrasikan CustomerPaymentBreakdown di tampilan mobile pesanan pembeli', () => {
      const mobileView = fs.readFileSync(
        path.join(
          rootDir,
          'src/components/customer/order-detail/order-mobile-view.tsx'
        ),
        'utf8'
      )
      expect(mobileView).toContain('CustomerPaymentBreakdown')
      expect(mobileView).toContain('<CustomerPaymentBreakdown')
    })

    it('mengintegrasikan AdminOrderDetailModal langsung di Dashboard Admin saat tombol Rincian diklik', () => {
      const dashboardPage = fs.readFileSync(
        path.join(rootDir, 'src/app/dashboard/admin/page.tsx'),
        'utf8'
      )
      expect(dashboardPage).toContain('AdminOrderDetailModal')
      expect(dashboardPage).toContain('setSelectedOrderDetail')
      expect(dashboardPage).toContain('<AdminOrderDetailModal')
      expect(dashboardPage).toContain(
        'onClick={() => setSelectedOrderDetail(order)}'
      )
    })
  })
})
