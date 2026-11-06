import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Isolasi Chat Customer, Click-Outside Dropdown, Unified Purna Jual, & Bagikan Order Scoped', () => {
  const navbarPath = path.resolve('src/components/layouts/navbar.tsx')
  const customerChatPagePath = path.resolve(
    'src/app/dashboard/customer/chat/page.tsx'
  )
  const chatRoomCardPath = path.resolve(
    'src/components/customer/chat/chat-room-card.tsx'
  )
  const chatInputBarPath = path.resolve(
    'src/components/customer/chat/chat-input-bar.tsx'
  )
  const customerOrderPickerModalPath = path.resolve(
    'src/components/customer/chat/customer-order-picker-modal.tsx'
  )
  const scopedOrdersApiPath = path.resolve(
    'src/app/api/customer/chat/orders/route.ts'
  )
  const allRoomsApiPath = path.resolve(
    'src/app/api/customer/chat/all-rooms/route.ts'
  )
  const storeRoomApiPath = path.resolve(
    'src/app/api/customer/chat/store-room/route.ts'
  )

  it('1. Image 1 - Isolasi Chat & Identitas Mitra: Chat Mitra tidak lagi berlabel CS Superadmin melainkan Mitra Servis', () => {
    const cardContent = fs.readFileSync(chatRoomCardPath, 'utf8')
    expect(cardContent).toContain('isMitraRoom')
    expect(cardContent).toContain('Mitra Servis')

    const pageContent = fs.readFileSync(customerChatPagePath, 'utf8')
    expect(pageContent).toContain('isMitraActive')
    expect(pageContent).toContain('Mitra Servis')

    const allRoomsApi = fs.readFileSync(allRoomsApiPath, 'utf8')
    expect(allRoomsApi).toContain('isMitraChat')
    expect(allRoomsApi).toContain('Mitra Servis')
  })

  it('2. Image 2 - Pop-up Dropdown Profil: Tertutup otomatis saat user menekan di luar field (Click Outside)', () => {
    const navbarContent = fs.readFileSync(navbarPath, 'utf8')
    expect(navbarContent).toContain('userDropdownRef')
    expect(navbarContent).toContain('handleClickOutside')
    expect(navbarContent).toContain('mousedown')
    expect(navbarContent).toContain('touchstart')
    expect(navbarContent).toContain('setUserDropdownOpen(false)')
  })

  it('3. Image 3 - After Sales: Room chat terbuat berdasarkan pesanan selesai (5 pesanan selesai = 5 room after sales)', () => {
    const storeRoomApi = fs.readFileSync(storeRoomApiPath, 'utf8')
    expect(storeRoomApi).toContain(
      "isReturnInquiry && assignedAdmin?.role === 'AFTER_SALES'"
    )
    expect(storeRoomApi).toContain('claimedById: assignedAdmin?.id || null')

    const allRoomsApi = fs.readFileSync(allRoomsApiPath, 'utf8')
    expect(allRoomsApi).toContain('aftersales')
    expect(allRoomsApi).toContain('deduplicatedRooms')

    const pageContent = fs.readFileSync(customerChatPagePath, 'utf8')
    expect(pageContent).toContain('aftersales')
  })

  it('4. Image 4 - Tombol (+) & Bagikan Order: Scoping ketat toko cabang & pemisahan order berlangsung vs selesai', () => {
    const inputBarContent = fs.readFileSync(chatInputBarPath, 'utf8')
    expect(inputBarContent).toContain('onOpenOrderPicker')
    expect(inputBarContent).toContain('Bagikan Pesanan')

    const modalContent = fs.readFileSync(customerOrderPickerModalPath, 'utf8')
    expect(modalContent).toContain('CustomerOrderPickerModal')
    expect(modalContent).toContain('isAfterSales')
    expect(modalContent).toContain('storeId')
    expect(modalContent).toContain('onSelectOrder')

    const scopedOrdersApi = fs.readFileSync(scopedOrdersApiPath, 'utf8')
    // Memastikan isolasi toko cabang ketat (toko 1 tidak memunculkan pesanan toko 2)
    expect(scopedOrdersApi).toContain('allowedStoreIds')
    expect(scopedOrdersApi).toContain('storeId: { in: allowedStoreIds }')
    // Pemisahan status: After Sales = COMPLETED/RETURNED, Admin Toko = PAID/IN_PROGRESS/SHIPPED
    expect(scopedOrdersApi).toContain("in: ['COMPLETED', 'RETURNED']")
    expect(scopedOrdersApi).toContain(
      "in: ['PAID', 'IN_PROGRESS', 'SHIPPED', 'PENDING_PAYMENT']"
    )
  })
})
