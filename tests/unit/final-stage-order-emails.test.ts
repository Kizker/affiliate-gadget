import { describe, it, expect } from 'vitest'
import {
  orderCompletedEmailTemplate,
  orderRefundedEmailTemplate,
  orderComplainedEmailTemplate,
  orderCancelledEmailTemplate,
} from '@/lib/notifications/templates/email-templates'

describe('Final-Stage Order Emails with AWB & Rich Aesthetics', () => {
  const sampleItems = [
    {
      name: 'iPhone 15 Pro Max 256GB',
      variant: 'Natural Titanium',
      quantity: 1,
      price: 21999000,
    },
    {
      name: 'Paket Bonus 3-in-1',
      variant: 'Case + Tempered Glass + Adaptor 20W',
      quantity: 1,
      price: 0,
    },
  ]

  describe('1. Order Completed Email Template (COMPLETED)', () => {
    it('should render green badge, courier AWB card, warranty protection, and financial summary', () => {
      const html = orderCompletedEmailTemplate({
        customerName: 'Budi Santoso',
        orderNumber: 'AG-20260925-001',
        storeName: 'PT Gadget Jaya Sentosa - Roxy Mas Pusat',
        courierName: 'JNE Express',
        courierService: 'YES (Yakin Esok Sampai)',
        awbNumber: 'JNE1234567890ID',
        trackingUrl: 'https://berdu.id/cek-resi?resi=JNE1234567890ID',
        totalAmount: 22025000,
        subtotal: 21999000,
        shippingCost: 26000,
        insuranceFee: 55000,
        discountAmount: 55000,
        items: sampleItems,
        warrantyExpiryDate: '25 Oktober 2026',
        viewOrderUrl: 'http://localhost:3000/dashboard/customer/orders/order-123',
      })

      // Verify core elements
      expect(html).toContain('TRANSAKSI SELESAI & GARANSI AKTIF')
      expect(html).toContain('AG-20260925-001')
      expect(html).toContain('Budi Santoso')
      // AWB Card
      expect(html).toContain('JNE Express')
      expect(html).toContain('JNE1234567890ID')
      expect(html).toContain('Asuransi Wajib 100% Aktif')
      expect(html).toContain('https://berdu.id/cek-resi?resi=JNE1234567890ID')
      expect(html).toContain('Lacak Perjalanan Paket')
      // Warranty
      expect(html).toContain('25 Oktober 2026')
      expect(html).toContain('PT Gadget Jaya Sentosa - Roxy Mas Pusat')
      // Items & Totals
      expect(html).toContain('iPhone 15 Pro Max 256GB')
      expect(html).toContain('Natural Titanium')
      expect(html).toContain('Rp 22.025.000')
      expect(html).toContain('Lihat Invoice & Detail Pesanan')
    })
  })

  describe('2. Order Refunded Email Template (RETURNED)', () => {
    it('should render refund badge, original AWB, return shipment AWB, and bank transfer details', () => {
      const html = orderRefundedEmailTemplate({
        customerName: 'Siti Aminah',
        orderNumber: 'AG-20260925-002',
        storeName: 'PT Sinar Gadget Nusantara - WTC Surabaya',
        courierName: 'JNE Express',
        awbNumber: 'JNE9988776655ID',
        returnCourier: 'J&T Express',
        returnTrackingNumber: 'JT9988112233',
        refundAmount: 21999000,
        refundReason: 'Layar ada dead pixel bawaan pabrik',
        refundBank: 'BCA (Bank Central Asia)',
        refundAccount: '8830123456',
        refundAccountName: 'Siti Aminah',
        items: sampleItems,
        viewOrderUrl: 'http://localhost:3000/dashboard/customer/orders/order-456',
      })

      expect(html).toContain('PENGEMBALIAN DANA (REFUND) SELESAI')
      expect(html).toContain('AG-20260925-002')
      expect(html).toContain('Siti Aminah')
      // Original & Return AWBs
      expect(html).toContain('JNE9988776655ID')
      expect(html).toContain('Resi Retur Balik:')
      expect(html).toContain('JT9988112233')
      expect(html).toContain('J&T Express')
      // Refund details
      expect(html).toContain('Layar ada dead pixel bawaan pabrik')
      expect(html).toContain('BCA (Bank Central Asia)')
      expect(html).toContain('8830123456')
      expect(html).toContain('Rp 21.999.000')
    })
  })

  describe('3. Order Complained Email Template (COMPLAINED)', () => {
    it('should render warning badge, AWB card, problem description, and 1x24h SLA clause', () => {
      const html = orderComplainedEmailTemplate({
        customerName: 'Dimas Setiawan',
        orderNumber: 'AG-20260925-003',
        storeName: 'PT Digital Niaga Prima - BEC Bandung',
        courierName: 'Gojek Instant',
        awbNumber: 'GK-88291039',
        complaintSubject: 'Kamera Belakang Blur',
        complaintDescription: 'Kamera utama tidak bisa autofocus saat mengambil foto indoor.',
        complaintStatus: 'OPEN',
        items: sampleItems,
        viewOrderUrl: 'http://localhost:3000/dashboard/customer/complaints',
      })

      expect(html).toContain('TIKET KOMPLAIN & KLAIM GARANSI DIPROSES')
      expect(html).toContain('AG-20260925-003')
      expect(html).toContain('Dimas Setiawan')
      expect(html).toContain('GK-88291039')
      expect(html).toContain('Kamera Belakang Blur')
      expect(html).toContain('Kamera utama tidak bisa autofocus')
      expect(html).toContain('Maksimal 1x24 jam kerja')
      expect(html).toContain('Pantau Tiket Komplain di Dashboard')
    })
  })

  describe('4. Order Cancelled Email Template (CANCELLED)', () => {
    it('should render cancelled badge, courier/AWB if available, cancellation reason, and escrow safety notice', () => {
      const html = orderCancelledEmailTemplate({
        customerName: 'Reza Pratama',
        orderNumber: 'AG-20260925-004',
        storeName: 'PT Surya Makmur Gadget - Medan',
        courierName: 'JNE Express',
        awbNumber: 'JNE-PENDING-CANCEL',
        cancellationReason: 'Pembeli berubah pikiran memilih warna lain',
        totalAmount: 18500000,
        viewOrderUrl: 'http://localhost:3000/gadget',
      })

      expect(html).toContain('PESANAN DIBATALKAN')
      expect(html).toContain('AG-20260925-004')
      expect(html).toContain('Reza Pratama')
      expect(html).toContain('JNE-PENDING-CANCEL')
      expect(html).toContain('Pembeli berubah pikiran memilih warna lain')
      expect(html).toContain('Dana Anda aman dan tidak tertahan')
      expect(html).toContain('Jelajahi Gadget Pilihan Lainnya')
    })
  })
})
