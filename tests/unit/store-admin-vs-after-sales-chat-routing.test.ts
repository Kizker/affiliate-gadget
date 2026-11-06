import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/lib/db'

import { POST as openStoreRoom } from '@/app/api/customer/chat/store-room/route'
import { GET as getAllCustomerRooms } from '@/app/api/customer/chat/all-rooms/route'
import { GET as getAdminRooms } from '@/app/api/admin/chat/rooms/route'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

import { auth } from '@/auth'

describe('Pemisahan Jalur Chat: Admin Toko (1 Room Tunggal) vs After Sales (1 Room per Pesanan Selesai)', () => {
  const storeId = 'store-test-chat-sep-001'
  const customerId = 'cust-test-chat-sep-001'
  const storeAdminId = 'store-admin-chat-sep-001'
  const afterSalesId = 'after-sales-chat-sep-001'
  const groupId = 'group-chat-sep-001'

  const orderCompleted1Id = 'order-comp-1'
  const orderCompleted2Id = 'order-comp-2'

  beforeEach(async () => {
    vi.clearAllMocks()

    // 1. Setup store
    await prisma.store.upsert({
      where: { id: storeId },
      update: {},
      create: {
        id: storeId,
        name: 'Affiliate Gadget - Roxy Mas',
        companyName: 'PT Gadget Jaya Sentosa',
        slug: 'roxy-mas-chat-sep-test',
        city: 'Jakarta Pusat',
        province: 'DKI Jakarta',
        address: 'ITC Roxy Mas Lt. 2',
        phone: '08123456789',
      },
    })

    // 2. Setup Store Admin
    await prisma.user.upsert({
      where: { id: storeAdminId },
      update: { role: 'STORE_ADMIN', storeId },
      create: {
        id: storeAdminId,
        email: 'admin.roxy.test@affiliategadget.com',
        name: 'Bambang S (Admin Toko Roxy Mas)',
        role: 'STORE_ADMIN',
        storeId,
        isActive: true,
      },
    })

    // 3. Setup After Sales User & Group
    await prisma.user.upsert({
      where: { id: afterSalesId },
      update: { role: 'AFTER_SALES' },
      create: {
        id: afterSalesId,
        email: 'budi.aftersales.test@affiliategadget.com',
        name: 'Budi Santoso (After Sales Roxy Group)',
        role: 'AFTER_SALES',
        isActive: true,
      },
    })

    await prisma.storeGroup.upsert({
      where: { id: groupId },
      update: { afterSalesUserId: afterSalesId },
      create: {
        id: groupId,
        name: 'Roxy Group',
        afterSalesUserId: afterSalesId,
      },
    })
    await prisma.store.update({
      where: { id: storeId },
      data: { groupId },
    })

    // 4. Setup Customer
    await prisma.user.upsert({
      where: { id: customerId },
      update: { role: 'CUSTOMER' },
      create: {
        id: customerId,
        email: 'customer.test.sep@affiliategadget.com',
        name: 'Rian Pratama',
        role: 'CUSTOMER',
        isActive: true,
      },
    })

    // 5. Setup 2 Pesanan Selesai (COMPLETED) untuk customer di toko ini
    await prisma.order.upsert({
      where: { id: orderCompleted1Id },
      update: { status: 'COMPLETED', storeId, userId: customerId },
      create: {
        id: orderCompleted1Id,
        orderNumber: 'SPR-COMPLETED-001',
        status: 'COMPLETED',
        total: 15000000,
        subtotal: 15000000,
        storeId,
        userId: customerId,
      },
    })

    await prisma.order.upsert({
      where: { id: orderCompleted2Id },
      update: { status: 'COMPLETED', storeId, userId: customerId },
      create: {
        id: orderCompleted2Id,
        orderNumber: 'SPR-COMPLETED-002',
        status: 'COMPLETED',
        total: 20000000,
        subtotal: 20000000,
        storeId,
        userId: customerId,
      },
    })

    // Clean any existing test rooms
    await prisma.adminChatMessage.deleteMany({
      where: { room: { customerId } },
    })
    await prisma.adminChatRoom.deleteMany({
      where: { customerId },
    })
  })

  it('1. Chat dibuka dari tombol toko (Chat Konsultasi) wajib murni ke 1 room Admin Toko (STORE_ADMIN)', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: customerId,
        role: 'CUSTOMER',
        email: 'customer.test.sep@affiliategadget.com',
      },
    } as any)

    // Request seperti tombol "Chat Konsultasi" di halaman toko (/toko/roxy-mas-jakarta)
    const req = new NextRequest(
      'http://localhost:3000/api/customer/chat/store-room',
      {
        method: 'POST',
        body: JSON.stringify({
          storeId,
        }),
      }
    )

    const res = await openStoreRoom(req)
    expect(res.status).toBe(200)
    const json = await res.json()

    // Verifikasi: Room diklaim oleh Admin Toko, BUKAN After Sales!
    expect(json.claimedBy?.role).toBe('STORE_ADMIN')
    expect(json.claimedBy?.name).toBe('Bambang S (Admin Toko Roxy Mas)')
    expect(json.store?.isAfterSales).toBeFalsy()
    expect(json.store?.name).toBe('Affiliate Gadget - Roxy Mas')
  })

  it('2. Chat dari pesanan selesai terbuat per pesanan (2 pesanan selesai = 2 room After Sales terpisah)', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: customerId,
        role: 'CUSTOMER',
        email: 'customer.test.sep@affiliategadget.com',
      },
    } as any)

    // A. Chat untuk Pesanan Selesai 1
    const req1 = new NextRequest(
      'http://localhost:3000/api/customer/chat/store-room',
      {
        method: 'POST',
        body: JSON.stringify({
          storeId,
          orderId: orderCompleted1Id,
          type: 'after_sales',
        }),
      }
    )
    const res1 = await openStoreRoom(req1)
    expect(res1.status).toBe(200)
    const json1 = await res1.json()

    expect(json1.claimedBy?.role).toBe('AFTER_SALES')
    expect(json1.claimedBy?.name).toBe('Budi Santoso (After Sales Roxy Group)')
    expect(json1.store?.isAfterSales).toBe(true)

    // B. Chat untuk Pesanan Selesai 2
    const req2 = new NextRequest(
      'http://localhost:3000/api/customer/chat/store-room',
      {
        method: 'POST',
        body: JSON.stringify({
          storeId,
          orderId: orderCompleted2Id,
          type: 'after_sales',
        }),
      }
    )
    const res2 = await openStoreRoom(req2)
    expect(res2.status).toBe(200)
    const json2 = await res2.json()

    expect(json2.claimedBy?.role).toBe('AFTER_SALES')
    expect(json2.claimedBy?.name).toBe('Budi Santoso (After Sales Roxy Group)')

    // Verifikasi: Room untuk Pesanan 1 dan Pesanan 2 adalah DUA ROOM YANG BERBEDA!
    expect(json1.roomId).not.toBe(json2.roomId)
  })

  it('3. Room chat kosong tanpa pesan otomatis dibersihkan dan tidak muncul di daftar kamar (all-rooms)', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: customerId,
        role: 'CUSTOMER',
        email: 'customer.test.sep@affiliategadget.com',
      },
    } as any)

    // Buka room toko (belum kirim pesan)
    const reqOpen = new NextRequest(
      'http://localhost:3000/api/customer/chat/store-room',
      {
        method: 'POST',
        body: JSON.stringify({ storeId }),
      }
    )
    const resOpen = await openStoreRoom(reqOpen)
    const jsonOpen = await resOpen.json()
    const emptyRoomId = jsonOpen.roomId

    // Saat fetch all-rooms, room kosong tanpa pesan tidak boleh muncul
    const resAllRooms = await getAllCustomerRooms()
    const jsonAllRooms = await resAllRooms.json()
    const foundRoom = jsonAllRooms.rooms.find((r: any) => r.id === emptyRoomId)
    expect(foundRoom).toBeUndefined()

    // Verifikasi room kosong telah dibersihkan di database
    const dbRoom = await prisma.adminChatRoom.findUnique({
      where: { id: emptyRoomId },
    })
    expect(dbRoom).toBeNull()
  })

  it('4. Admin Toko hanya memiliki 1 room chat dengan customer, sedangkan After Sales memiliki room per pesanan selesai', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: customerId,
        role: 'CUSTOMER',
        email: 'customer.test.sep@affiliategadget.com',
      },
    } as any)

    // 1. Buat room toko dan kirim 1 pesan
    const reqStore = new NextRequest(
      'http://localhost:3000/api/customer/chat/store-room',
      {
        method: 'POST',
        body: JSON.stringify({ storeId }),
      }
    )
    const resStore = await openStoreRoom(reqStore)
    const jsonStore = await resStore.json()
    await prisma.adminChatMessage.create({
      data: {
        roomId: jsonStore.roomId,
        senderId: customerId,
        content: 'Halo admin toko, unit iPhone ready?',
      },
    })

    // 2. Buat room After Sales untuk Pesanan 1 dan kirim 1 pesan
    const reqAs1 = new NextRequest(
      'http://localhost:3000/api/customer/chat/store-room',
      {
        method: 'POST',
        body: JSON.stringify({
          storeId,
          orderId: orderCompleted1Id,
          type: 'after_sales',
        }),
      }
    )
    const resAs1 = await openStoreRoom(reqAs1)
    const jsonAs1 = await resAs1.json()
    await prisma.adminChatMessage.create({
      data: {
        roomId: jsonAs1.roomId,
        senderId: customerId,
        content: 'Halo after sales, klaim garansi pesanan 1',
      },
    })

    // 3. Buat room After Sales untuk Pesanan 2 dan kirim 1 pesan
    const reqAs2 = new NextRequest(
      'http://localhost:3000/api/customer/chat/store-room',
      {
        method: 'POST',
        body: JSON.stringify({
          storeId,
          orderId: orderCompleted2Id,
          type: 'after_sales',
        }),
      }
    )
    const resAs2 = await openStoreRoom(reqAs2)
    const jsonAs2 = await resAs2.json()
    await prisma.adminChatMessage.create({
      data: {
        roomId: jsonAs2.roomId,
        senderId: customerId,
        content: 'Halo after sales, klaim garansi pesanan 2',
      },
    })

    // Verifikasi dari sisi Customer: Ada 1 room toko + 2 room after sales = total 3 room!
    const resCustRooms = await getAllCustomerRooms()
    const jsonCustRooms = await resCustRooms.json()
    expect(jsonCustRooms.rooms.length).toBe(3)

    // Verifikasi dari sisi Admin Toko: HANYA melihat 1 room toko miliknya!
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: storeAdminId,
        role: 'STORE_ADMIN',
        storeId,
        email: 'admin.roxy.test@affiliategadget.com',
      },
    } as any)
    const resAdminRooms = await getAdminRooms()
    const jsonAdminRooms = await resAdminRooms.json()
    expect(jsonAdminRooms.rooms.length).toBe(1)
    expect(jsonAdminRooms.rooms[0].id).toBe(jsonStore.roomId)

    // Verifikasi dari sisi After Sales: Melihat 2 room terpisah per pesanan selesai!
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: afterSalesId,
        role: 'AFTER_SALES',
        email: 'budi.aftersales.test@affiliategadget.com',
      },
    } as any)
    const resAfterSalesRooms = await getAdminRooms()
    const jsonAfterSalesRooms = await resAfterSalesRooms.json()
    expect(jsonAfterSalesRooms.rooms.length).toBe(2)
  })
})
