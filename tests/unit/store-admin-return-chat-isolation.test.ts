import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Isolasi Chat Toko Cabang vs Admin After Sales: Retur & Pertukaran Produk', () => {
  const roomsRoutePath = path.resolve('src/app/api/admin/chat/rooms/route.ts')
  const messagesRoutePath = path.resolve(
    'src/app/api/admin/chat/rooms/[roomId]/messages/route.ts'
  )
  const storeRoomRoutePath = path.resolve(
    'src/app/api/customer/chat/store-room/route.ts'
  )
  const ordersClientPath = path.resolve(
    'src/app/dashboard/customer/orders/orders-client.tsx'
  )

  it('1. Endpoint /api/admin/chat/rooms: Store Admin mengecualikan (NOT) seluruh chat retur, komplain, kartu return_reference, dan klaim After Sales', () => {
    const content = fs.readFileSync(roomsRoutePath, 'utf8')

    // STORE_ADMIN whereClause memiliki filter NOT untuk retur & komplain
    expect(content).toContain('order: { returnRequests: { some: {} } }')
    expect(content).toContain('order: { complaints: { some: {} } }')
    expect(content).toContain(
      "messages: { some: { messageType: 'return_reference' } }"
    )
    expect(content).toContain("claimedBy: { role: 'AFTER_SALES' }")
  })

  it('2. Endpoint /api/admin/chat/rooms: After Sales memuat seluruh chat terkait retur, pertukaran produk, dan garansi toko', () => {
    const content = fs
      .readFileSync(roomsRoutePath, 'utf8')
      .replace(/\r\n/g, '\n')

    // AFTER_SALES whereClause
    expect(content).toContain("user.role === 'AFTER_SALES'")
    expect(content).toContain(
      'order: {\n              returnRequests: { some: {} },\n            }'
    )
    expect(content).toContain("messageType: 'return_reference'")
  })

  it('3. Endpoint messages API: Store Admin diblokir (403) dari membaca & mengirim pesan pada percakapan retur', () => {
    const content = fs.readFileSync(messagesRoutePath, 'utf8')

    // Store Admin ditolak jika chat terkait retur / klaim garansi
    expect(content).toContain(
      'Percakapan retur dan penukaran barang telah dialihkan secara eksklusif ke Admin After Sales Terpusat.'
    )
  })

  it('4. Endpoint customer store-room API: Menghubungkan & mengklaim chat retur otomatis ke akun After Sales', () => {
    const content = fs.readFileSync(storeRoomRoutePath, 'utf8')

    expect(content).toContain("role: 'AFTER_SALES'")
    expect(content).toContain('Layanan Purna Jual')
    expect(content).toContain('Admin After Sales & Garansi Terpusat')
    expect(content).toContain('assignedAdmin')
  })

  it('5. Halaman Pesanan Saya (orders-client.tsx): Tombol chat pada tab retur menampilkan "Chat Admin After Sales"', () => {
    const content = fs.readFileSync(ordersClientPath, 'utf8')

    expect(content).toContain('isReturnOrExchange')
    expect(content).toContain('Chat Admin After Sales')
    expect(content).toContain("chatParams.set('type', 'after_sales')")
  })
})
