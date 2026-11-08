import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Orders Simple & Sederhana UI Redesign (Screenshot 2 & 3)', () => {
  const pagePath = path.join(
    process.cwd(),
    'src/app/dashboard/admin/orders/page.tsx'
  )
  const apiPath = path.join(process.cwd(), 'src/app/api/admin/orders/route.ts')
  const content = fs.readFileSync(pagePath, 'utf8')
  const apiContent = fs.readFileSync(apiPath, 'utf8')

  it('1. Header Control Bar: Memiliki Dropdown Status dan Dropdown Rentang Tanggal (bukan deretan tab panjang)', () => {
    // Dropdown Status
    expect(content).toContain('statusDropdownOpen')
    expect(content).toContain('Status:')
    expect(content).toContain('currentStatusLabel')

    // Dropdown Rentang Tanggal
    expect(content).toContain('dateDropdownOpen')
    expect(content).toContain('Rentang:')
    expect(content).toContain('currentDateRangeLabel')
    expect(content).toContain('DATE_RANGE_OPTIONS')

    // Input Search & Refresh
    expect(content).toContain('Cari no. order, customer, produk...')
    expect(content).toContain('fetchOrders')
  })

  it('2. Desktop Table View: Sederhana & Bersih sesuai Screenshot 2 (Tanpa kolom proteksi & kurir berantakan)', () => {
    // Kolom header tabel: Checkbox, Unit Gadget, Pembeli, Total Tagihan, Status, Aksi
    expect(content).toContain('UNIT GADGET')
    expect(content).toContain('PEMBELI')
    expect(content).toContain('TOTAL TAGIHAN')
    expect(content).toContain('STATUS')
    expect(content).toContain('AKSI')

    // Checkbox support
    expect(content).toContain('selectedOrderIds')
    expect(content).toContain('handleToggleSelectAll')
    expect(content).toContain('handleToggleSelectOrder')

    // Kolom Pembeli hanya menampilkan nama & kota (tanpa nomor HP atau icon WA di tabel utama)
    expect(content).toContain('customerName')
    expect(content).toContain('customerCity')

    // Status minimalis titik bulat (dot + teks)
    expect(content).toContain('renderSimpleStatusBadge')
  })

  it('3. Mobile Cards View: Sederhana & Ringkas sesuai Screenshot 2 & 3', () => {
    // Mode mobile menggunakan cards
    expect(content).toContain('space-y-3 md:hidden')

    // Header kartu mobile memiliki order number, tanggal, dan status
    expect(content).toContain('• {formatDate(order.createdAt)}')
    expect(content).toContain('renderSimpleStatusBadge(order)')

    // Thumbnail dan nama produk
    expect(content).toContain('h-12 w-12 rounded-xl')
    expect(content).toContain('fullName')

    // Tombol aksi Rincian
    expect(content).toContain('Rincian')
  })

  it('4. Footer Paginasi: Minimalis, format {length}/{totalCount} dan navigasi satu baris', () => {
    expect(content).toContain('{orders.length}/{totalCount}')
    expect(content).toContain('Sebelumnya')
    expect(content).toContain('{page}/{totalPages}')
    expect(content).toContain('Selanjutnya')
  })

  it('5. Backend API: Mendukung parameter startDate dan endDate untuk filter rentang tanggal', () => {
    expect(apiContent).toContain("searchParams.get('startDate')")
    expect(apiContent).toContain("searchParams.get('endDate')")
    expect(apiContent).toContain('createdAt: {')
    expect(apiContent).toContain('gte: s')
    expect(apiContent).toContain('lte: e')
  })
})
