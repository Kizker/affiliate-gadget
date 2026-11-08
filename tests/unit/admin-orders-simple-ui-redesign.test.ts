import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Orders Simple & Sederhana UI Redesign (Screenshot 1, 2, 3)', () => {
  const pagePath = path.join(
    process.cwd(),
    'src/app/dashboard/admin/orders/page.tsx'
  )
  const apiPath = path.join(process.cwd(), 'src/app/api/admin/orders/route.ts')
  const content = fs.readFileSync(pagePath, 'utf8')
  const apiContent = fs.readFileSync(apiPath, 'utf8')

  it('1. Header Control Bar Mobile: Filter status & rentang waktu berdampingan 1 baris, cukup ikon + nama tanpa kata "Status" atau "Rentang"', () => {
    // Grid 2 kolom di mobile
    expect(content).toContain('grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto')

    // Dropdown Status: ikon + nama (tanpa kata "Status:")
    expect(content).toContain('statusDropdownOpen')
    expect(content).toContain('{currentStatusLabel}')

    // Dropdown Rentang: ikon + nama (tanpa kata "Rentang:")
    expect(content).toContain('dateDropdownOpen')
    expect(content).toContain('{currentDateRangeLabel}')
    expect(content).toContain('DATE_RANGE_OPTIONS')

    // Input Search & Refresh di bawahnya membentang penuh
    expect(content).toContain('Cari no. order, customer, produk...')
    expect(content).toContain('fetchOrders')
  })

  it('2. Eliminasi Total Checkbox: Tidak ada checkbox pada desktop maupun mobile', () => {
    // Header tabel desktop tidak punya checkbox
    expect(content).not.toContain('selectedOrderIds')
    expect(content).not.toContain('handleToggleSelectAll')
    expect(content).not.toContain('handleToggleSelectOrder')

    // Kolom header tabel: Unit Gadget, Pembeli, Total Tagihan, Status, Aksi
    expect(content).toContain('UNIT GADGET')
    expect(content).toContain('PEMBELI')
    expect(content).toContain('TOTAL TAGIHAN')
    expect(content).toContain('STATUS')
    expect(content).toContain('AKSI')

    // Kolom Pembeli hanya menampilkan nama & kota
    expect(content).toContain('customerName')
    expect(content).toContain('customerCity')

    // Status minimalis titik bulat (dot + teks)
    expect(content).toContain('renderSimpleStatusBadge')
  })

  it('3. Mobile Cards View: Sederhana, bersih, dan bebas checkbox', () => {
    // Mode mobile menggunakan cards
    expect(content).toContain('space-y-3 md:hidden')

    // Header kartu mobile memiliki order number, tanggal, dan status
    expect(content).toContain('• {formatDate(order.createdAt)}')
    expect(content).toContain('renderSimpleStatusBadge(order)')

    // Nama produk dan total
    expect(content).toContain('fullName')
    expect(content).toContain('order.total.toLocaleString')

    // Tombol aksi Rincian
    expect(content).toContain('Rincian')
  })

  it('4. Modal Drawer Rincian Pesanan: Sederhana & bersih tanpa tulisan menumpuk atau box-in-box bersarang', () => {
    // Tidak ada kotak bersarang tebal paket bonus
    expect(content).toContain(
      'Bonus 3-in-1 Gratis: Charger, Tempered Glass &amp; Softcase'
    )

    // Penerima & Pengiriman disatukan rapi
    expect(content).toContain('Penerima &amp; Pengiriman')
    expect(content).toContain('recipient.recipientName')
    expect(content).toContain('recipient.recipientPhone')
    expect(content).toContain('recipient.deliveryAddress')
    expect(content).toContain('courierDisplay')

    // Customer & tombol chat
    expect(content).toContain('Hubungi via Chat')
  })

  it('5. Footer Paginasi: Minimalis, format {length}/{totalCount} dan navigasi satu baris', () => {
    expect(content).toContain('{orders.length}/{totalCount}')
    expect(content).toContain('Sebelumnya')
    expect(content).toContain('{page}/{totalPages}')
    expect(content).toContain('Selanjutnya')
  })

  it('6. Backend API: Mendukung parameter startDate dan endDate untuk filter rentang tanggal', () => {
    expect(apiContent).toContain("searchParams.get('startDate')")
    expect(apiContent).toContain("searchParams.get('endDate')")
    expect(apiContent).toContain('createdAt: {')
    expect(apiContent).toContain('gte: s')
    expect(apiContent).toContain('lte: e')
  })
})
