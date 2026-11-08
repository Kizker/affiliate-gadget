import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Orders: Keterangan & Pelacakan Retur, Refund, dan Tukar Unit Baru', () => {
  const ordersPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/orders/page.tsx'
  )
  const ordersApiPath = path.resolve(
    process.cwd(),
    'src/app/api/admin/orders/route.ts'
  )

  const ordersPageContent = fs
    .readFileSync(ordersPagePath, 'utf8')
    .replace(/\r\n/g, '\n')
  const ordersApiContent = fs
    .readFileSync(ordersApiPath, 'utf8')
    .replace(/\r\n/g, '\n')

  it('1. Endpoint API admin orders memuat field lengkap returnRequests (rekening, refund, resi)', () => {
    expect(ordersApiContent).toContain('returnRequests: {')
    expect(ordersApiContent).toContain('returnTrackingNumber: true')
    expect(ordersApiContent).toContain('returnCourier: true')
    expect(ordersApiContent).toContain('bankName: true')
    expect(ordersApiContent).toContain('bankAccountNumber: true')
    expect(ordersApiContent).toContain('bankAccountName: true')
    expect(ordersApiContent).toContain('refundAmount: true')
    expect(ordersApiContent).toContain('resolvedAt: true')
  })

  it('2. Interface Order di orders page menyertakan field permohonan retur & refund', () => {
    expect(ordersPageContent).toContain('returnRequests?: Array<{')
    expect(ordersPageContent).toContain('bankName?: string | null')
    expect(ordersPageContent).toContain('bankAccountNumber?: string | null')
    expect(ordersPageContent).toContain('bankAccountName?: string | null')
    expect(ordersPageContent).toContain('refundAmount?: number | null')
    expect(ordersPageContent).toContain('resolvedAt?: string | null')
  })

  it('3. Helper getReturnStatusInfo memetakan status tahapan retur secara manusiawi', () => {
    expect(ordersPageContent).toContain('function getReturnStatusInfo(')
    expect(ordersPageContent).toContain('Menunggu Telaah After Sales')
    expect(ordersPageContent).toContain('Paket Menuju Toko (QC Fisik)')
    expect(ordersPageContent).toContain('Menunggu ACC Superadmin')
    expect(ordersPageContent).toContain('ACC Disetujui (Kirim Barang Balik)')
    expect(ordersPageContent).toContain('Refund Selesai Dicairkan')
    expect(ordersPageContent).toContain('Tukar Unit Selesai Diterima')
    expect(ordersPageContent).toContain('Klaim Retur Ditolak')
  })

  it('4. Tabel Pesanan & Modal Detail: Menampilkan status minimalis & pelacakan purna jual', () => {
    // Status minimalis purna jual
    expect(ordersPageContent).toContain('Retur/Refund')
    expect(ordersPageContent).toContain('Tukar Unit')
    expect(ordersPageContent).toContain('renderSimpleStatusBadge')

    // Modal drawer pelacakan resi kurir & purna jual
    expect(ordersPageContent).toContain('Resi Unit Pengganti:')
    expect(ordersPageContent).toContain('Pengiriman Balik dari Pembeli (Retur)')
    expect(ordersPageContent).toContain('Lacak Resi Pembeli (Biteship)')
  })

  it('5. Modal Drawer Detail: Kartu lengkap keterangan & pelacakan purna jual Super Admin', () => {
    // Judul & Header
    expect(ordersPageContent).toContain('Klaim Garansi: Penukaran Unit Baru')
    expect(ordersPageContent).toContain('Klaim Garansi: Retur & Refund Dana')
    expect(ordersPageContent).toContain('/dashboard/admin/returns?search=')
    expect(ordersPageContent).toContain('Meja Kerja Retur')

    // Kendala
    expect(ordersPageContent).toContain('Kendala Cacat Fisik:')
    expect(ordersPageContent).toContain('Telaah After Sales:')

    // Box 1: Resi Kirim Balik
    expect(ordersPageContent).toContain('Pengiriman Balik dari Pembeli (Retur)')
    expect(ordersPageContent).toContain('Lacak Resi Pembeli (Biteship)')

    // Box 2: Resi Unit Pengganti (Tukar Unit)
    expect(ordersPageContent).toContain('Resi Unit Pengganti:')
    expect(ordersPageContent).toContain('Lacak Unit Pengganti (Biteship)')

    // Box 3: Rincian Pengembalian Dana (Refund Escrow)
    expect(ordersPageContent).toContain(
      'Rincian Pengembalian Dana (Refund Escrow)'
    )
    expect(ordersPageContent).toContain('DANA TELAH DICAIRKAN')
    expect(ordersPageContent).toContain('DANA ESCROW DITAHAN')
    expect(ordersPageContent).toContain('Nominal Refund:')
    expect(ordersPageContent).toContain('Rekening Tujuan:')
  })
})
