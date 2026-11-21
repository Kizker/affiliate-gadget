import { describe, it, expect, vi } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Self-Managed Store Admin Returns & Voucher Input Zero Elimination', () => {
  const returnsApiPath = path.resolve('src/app/api/returns/route.ts')
  const returnsIdApiPath = path.resolve('src/app/api/returns/[id]/route.ts')
  const storeRoomApiPath = path.resolve(
    'src/app/api/customer/chat/store-room/route.ts'
  )
  const customerChatPagePath = path.resolve(
    'src/app/dashboard/customer/chat/page.tsx'
  )
  const allRoomsApiPath = path.resolve(
    'src/app/api/customer/chat/all-rooms/route.ts'
  )
  const vouchersPagePath = path.resolve(
    'src/app/dashboard/admin/vouchers/page.tsx'
  )

  it('1. GET /api/returns mengembalikan pengajuan retur toko milik STORE_ADMIN (tidak lagi mengembalikan array kosong [])', () => {
    const content = fs.readFileSync(returnsApiPath, 'utf-8')
    expect(content).toContain("session.user.role === 'STORE_ADMIN'")
    expect(content).toContain('userStoreId')
    expect(content).toContain('where.OR = [')
    expect(content).toContain('{ storeId: userStoreId }')
    expect(content).toContain('{ order: { storeId: userStoreId } }')
    expect(content).not.toContain(
      '// Store admin tidak lagi mengelola retur/komplain\n      return NextResponse.json({ success: true, data: [] })'
    )
  })

  it('2. PUT /api/returns/[id] mengizinkan Admin Toko mandiri (isSelfManagedStoreAdmin) menolak pengajuan retur', () => {
    const content = fs.readFileSync(returnsIdApiPath, 'utf-8')
    expect(content).toContain('isSelfManagedStoreAdmin')
    expect(content).toContain(
      "body.action === 'REJECT' &&\n      (session.user.role === 'AFTER_SALES' || isSelfManagedStoreAdmin)"
    )
  })

  it('3. POST /api/customer/chat/store-room langsung membuat pesan return_reference di DB sehingga room tidak kosong & tidak terhapus saat refresh', () => {
    const content = fs.readFileSync(storeRoomApiPath, 'utf-8')
    expect(content).toContain("messageType: 'return_reference'")
    expect(content).toContain(
      'isReturnInquiry && orderReferencePayload && room'
    )
    expect(content).toContain('await prisma.adminChatMessage.create(')
  })

  it('4. Halaman customer chat mempertahankan parameter roomId pada URL history dan meng-auto-select room yang cocok saat di-refresh', () => {
    const content = fs.readFileSync(customerChatPagePath, 'utf-8')
    expect(content).toContain("searchParams.get('roomId')")
    expect(content).toContain('paramRoomId && rooms.length > 0')
    expect(content).toContain('setSelectedRoom(match)')
    expect(content).toContain('/dashboard/customer/chat?roomId=')
  })

  it('5. GET /api/customer/chat/all-rooms hanya menandai isAfterSalesRoom jika toko memiliki group After Sales eksternal', () => {
    const content = fs.readFileSync(allRoomsApiPath, 'utf-8')
    expect(content).toContain('storeGroupAfterSales &&')
    expect(content).toContain('isAfterSalesRoom = Boolean(')
  })

  it('6. Modal Buat Voucher Baru mengatur default input harga (minimumPurchase) menjadi kosong bukan 0, sehingga tidak diawali angka 0 saat mengetik', () => {
    const content = fs.readFileSync(vouchersPagePath, 'utf-8')
    // Default state awal minimumPurchase adalah ''
    expect(content).toContain("minimumPurchase: '',")
    // Input minimumPurchase terikat dengan string value bukan Number() paksa
    expect(content).toContain('minimumPurchase: e.target.value')
    // Submit handler mengonversi string ke Number secara aman
    expect(content).toContain("formData.minimumPurchase !== ''")
  })
})
