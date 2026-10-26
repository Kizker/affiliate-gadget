import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Store Admin Dashboard, Recipient Details, Thermal Label, & Voucher Picker Suite', () => {
  const rootDir = process.cwd()

  const thermalLabelPath = path.join(
    rootDir,
    'src',
    'components',
    'shipping',
    'thermal-shipping-label.tsx'
  )
  const adminOrdersPagePath = path.join(
    rootDir,
    'src',
    'app',
    'dashboard',
    'admin',
    'orders',
    'page.tsx'
  )
  const adminOrdersApiPath = path.join(
    rootDir,
    'src',
    'app',
    'api',
    'admin',
    'orders',
    'route.ts'
  )
  const checkoutPagePath = path.join(
    rootDir,
    'src',
    'app',
    'checkout',
    'page.tsx'
  )
  const mobileCheckoutViewPath = path.join(
    rootDir,
    'src',
    'components',
    'checkout',
    'mobile-shopee-checkout-view.tsx'
  )
  const voucherPickerModalPath = path.join(
    rootDir,
    'src',
    'components',
    'checkout',
    'voucher-picker-modal.tsx'
  )
  const vouchersApiPath = path.join(
    rootDir,
    'src',
    'app',
    'api',
    'vouchers',
    'route.ts'
  )
  const adminDashboardPagePath = path.join(
    rootDir,
    'src',
    'app',
    'dashboard',
    'admin',
    'page.tsx'
  )

  const thermalContent = fs.readFileSync(thermalLabelPath, 'utf-8')
  const adminOrdersContent = fs.readFileSync(adminOrdersPagePath, 'utf-8')
  const adminOrdersApiContent = fs.readFileSync(adminOrdersApiPath, 'utf-8')
  const checkoutContent = fs.readFileSync(checkoutPagePath, 'utf-8')
  const mobileCheckoutContent = fs.readFileSync(mobileCheckoutViewPath, 'utf-8')
  const voucherPickerContent = fs.readFileSync(voucherPickerModalPath, 'utf-8')
  const vouchersApiContent = fs.readFileSync(vouchersApiPath, 'utf-8')
  const adminDashboardContent = fs.readFileSync(adminDashboardPagePath, 'utf-8')

  describe('1. Thermal Label / Air Waybill Insurance Text', () => {
    it('verifies "(Ganti Unit Baru)" is eliminated and replaced with "100% Terlindungi Asuransi"', () => {
      expect(thermalContent).not.toContain(
        '100% Terlindungi Asuransi Wajib (Ganti Unit Baru)'
      )
      expect(thermalContent).toContain('100% Terlindungi Asuransi')
    })
  })

  describe('2. Admin Order Detail: Nama dan Nomor Penerima', () => {
    it('verifies parseRecipientInfo helper is implemented', () => {
      expect(adminOrdersContent).toContain('function parseRecipientInfo(')
      expect(adminOrdersContent).toContain('recipientName')
      expect(adminOrdersContent).toContain('recipientPhone')
      expect(adminOrdersContent).toContain('deliveryAddress')
    })

    it('verifies recipient card displays Nama Penerima and Nomor HP Penerima', () => {
      expect(adminOrdersContent).toContain('Penerima & Alamat Pengiriman')
      expect(adminOrdersContent).toContain('Nama Penerima')
      expect(adminOrdersContent).toContain('Nomor HP Penerima')
      expect(adminOrdersContent).toContain(
        "toast.success('Nomor penerima disalin!')"
      )
    })

    it('verifies admin orders API includes user addresses for recipient resolution', () => {
      expect(adminOrdersApiContent).toContain('addresses: {')
      expect(adminOrdersApiContent).toContain('recipientName: true')
      expect(adminOrdersApiContent).toContain("isDefault: 'desc'")
    })
  })

  describe('3. Store Admin Dashboard (Pesanan Penting & Status)', () => {
    it('verifies Store Admin KPI cards contain Orders, Shipments, and Returns', () => {
      expect(adminDashboardContent).not.toContain('id="stok-inventori-opsi"')
      expect(adminDashboardContent).toContain('Retur &amp; Pembatalan')
      expect(adminDashboardContent).toContain('Status Pesanan di Dashboard')
    })

    it('verifies Orders are prioritized as primary section for store admin', () => {
      expect(adminDashboardContent).toContain('Pesanan Masuk Cabang Toko')
      expect(adminDashboardContent).toContain('Prioritas Operasional')
    })

    it('verifies dedicated return and cancellation tracking is rendered', () => {
      expect(adminDashboardContent).toContain(
        'Informasi Pengembalian atau Pembatalan'
      )
      expect(adminDashboardContent).toContain('Pengajuan Retur')
    })
  })

  describe('4. Interactive Voucher Selection System', () => {
    it('verifies VoucherPickerModal is defined with validity tags and shortfall calculation', () => {
      expect(voucherPickerContent).toContain(
        'export function VoucherPickerModal'
      )
      expect(voucherPickerContent).toContain(
        'export interface AvailableVoucher'
      )
      expect(voucherPickerContent).toContain('Gunakan')
      expect(voucherPickerContent).toContain('Belum Memenuhi Syarat')
      expect(voucherPickerContent).toContain('Siap Digunakan')
    })

    it('verifies GET /api/vouchers handles validity and quota calculations', () => {
      expect(vouchersApiContent).toContain('export async function GET')
      expect(vouchersApiContent).toContain('potentialDiscount')
      expect(vouchersApiContent).toContain('shortfallAmount')
      expect(vouchersApiContent).toContain('minimumPurchase')
      expect(vouchersApiContent).toContain('isValid')
    })

    it('verifies checkout page integrates VoucherPickerModal and interactive trigger button', () => {
      expect(checkoutContent).toContain('<VoucherPickerModal')
      expect(checkoutContent).toContain('setIsVoucherPickerOpen(true)')
      expect(checkoutContent).toContain('Pilih Dari Voucher Tersedia')
      expect(checkoutContent).toContain(
        'handleApplyVoucher = async (customCode?: string | unknown)'
      )
    })

    it('verifies mobile checkout view supports interactive voucher selection', () => {
      expect(mobileCheckoutContent).toContain('onOpenVoucherPicker')
      expect(mobileCheckoutContent).toContain('Pilih Dari Voucher Tersedia')
      expect(mobileCheckoutContent).toContain('validVouchersCount')
    })
  })
})
