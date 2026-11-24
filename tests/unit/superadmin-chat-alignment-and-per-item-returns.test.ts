import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Superadmin Chat Alignment & Per-Item Returns in Order Details', () => {
  const adminChatPagePath = path.resolve(
    'src/app/dashboard/admin/chat/page.tsx'
  )
  const orderItemsCardPath = path.resolve(
    'src/components/customer/order-detail/order-desktop-items-card.tsx'
  )
  const orderMobileViewPath = path.resolve(
    'src/components/customer/order-detail/order-mobile-view.tsx'
  )
  const returnModalPath = path.resolve(
    'src/components/customer/return-modal.tsx'
  )
  const orderDetailClientPath = path.resolve(
    'src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx'
  )

  it('1. Superadmin chat tidak lagi dipaksa ke CUSTOMER_CS sehingga riwayat chat toko langsung muncul di sidebar', () => {
    const content = fs.readFileSync(adminChatPagePath, 'utf-8')
    // Efek pemaksaan CUSTOMER_CS sudah dihapus
    expect(content).not.toContain("setRoomFilter('CUSTOMER_CS')")
    // Tab pertama Superadmin adalah Semua Chat
    expect(content).toContain("{ id: 'ALL', label: 'Semua Chat' }")
    // Selected room selalu dipertahankan di sidebar
    expect(content).toContain('selectedRoom && room.id === selectedRoom.id')
  })

  it('2. Chat Superadmin mode pantau membedakan perataan bubble chat: Customer di KIRI dan Toko/Staf di KANAN', () => {
    const content = fs.readFileSync(adminChatPagePath, 'utf-8')
    expect(content).toContain('isCustomerSender =')
    expect(content).toContain(
      'const isRightAligned = isSentByMe || !isCustomerSender'
    )
    expect(content).toContain('const isAdmin = isRightAligned')
  })

  it('3. Rincian Unit Gadget desktop menyediakan tombol Ajukan Retur Unit Ini di masing-masing produk', () => {
    const content = fs.readFileSync(orderItemsCardPath, 'utf-8')
    expect(content).toContain('canRequestReturnOrComplaint')
    expect(content).toContain('onOpenReturnForItem')
    expect(content).toContain('Ajukan Retur Unit Ini')
  })

  it('4. Tampilan mobile menyediakan tombol Ajukan Retur Unit Ini di masing-masing produk pesanan', () => {
    const content = fs.readFileSync(orderMobileViewPath, 'utf-8')
    expect(content).toContain('onOpenReturnForItem')
    expect(content).toContain('Ajukan Retur Unit Ini')
  })

  it('5. ReturnModal menerima items pesanan dan menampilkan selector produk yang ingin diretur secara spesifik', () => {
    const content = fs.readFileSync(returnModalPath, 'utf-8')
    expect(content).toContain('items?: OrderDetailItem[]')
    expect(content).toContain('initialSelectedItemId?: string | null')
    expect(content).toContain(
      'Unit Produk yang Ingin Diretur / Diklaim Garansi *'
    )
    expect(content).toContain('selectedItem')
    expect(content).toContain('[Unit yang Diretur:')
  })

  it('6. OrderDetailClient mengintegrasikan selectedReturnItem dan meneruskannya ke ReturnModal', () => {
    const content = fs.readFileSync(orderDetailClientPath, 'utf-8')
    expect(content).toContain('selectedReturnItem')
    expect(content).toContain('items={order.items}')
    expect(content).toContain(
      'initialSelectedItemId={selectedReturnItem?.id || null}'
    )
  })
})
