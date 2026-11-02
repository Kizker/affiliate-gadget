import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Sistem Bubble Chat Pengajuan Retur & Penukaran Barang Dua Arah (Customer <-> After Sales)', () => {
  const adminChatRoomsApiPath = path.resolve(
    process.cwd(),
    'src/app/api/admin/chat/rooms/route.ts'
  )
  const afterSalesReturnsPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/after-sales/returns/page.tsx'
  )
  const adminChatPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/chat/page.tsx'
  )

  it('1. Endpoint API Admin Chat Rooms: Menerima returnId dan otomatis membuat bubble return_reference jika belum ada', () => {
    const content = fs.readFileSync(adminChatRoomsApiPath, 'utf8')
    expect(content).toContain('returnId')
    expect(content).toContain('returnReason')
    expect(content).toContain('returnStatus')
    expect(content).toContain('returnType')
    expect(content).toContain('isReturnInquiry')
    expect(content).toContain("messageType: 'return_reference'")
    expect(content).toContain('Klaim Garansi / Retur')
    expect(content).toContain('senderId: effectiveCustomerId')
  })

  it('2. Halaman After Sales Returns: Tombol Chat Pembeli mengeksekusi inisialisasi room chat dan bubble retur', () => {
    const content = fs.readFileSync(afterSalesReturnsPagePath, 'utf8')
    expect(content).toContain('handleOpenCustomerChat')
    expect(content).toContain('Chat Pembeli (Purna Jual)')
    expect(content).toContain('/dashboard/after-sales/chat?orderId=')
    expect(content).toContain('/api/admin/chat/rooms')
    expect(content).toContain('connectingChatId')
  })

  it('3. Halaman Admin/After-Sales Chat: Auto-initiate room dari URL dan mendukung activeOrderContext returnRequest', () => {
    const content = fs
      .readFileSync(adminChatPagePath, 'utf8')
      .replace(/\r\n/g, '\n')
    expect(content).toContain("searchParams?.get('returnId')")
    expect(content).toContain('autoInitOrderIdRef')
    expect(content).toContain('returnRequest?: {')
    expect(content).toContain('Membahas Pengajuan Retur:')
    expect(content).toContain('Kirim Kartu Retur')
    expect(content).toContain(
      "handleSendMessage(\n        isReturn ? 'return_reference' : 'order_reference'"
    )
  })

  it('4. Rendering Bubble Chat: Menampilkan kartu Pengajuan Retur dengan badge ungu, kendala, dan tombol Lihat Pesanan', () => {
    const content = fs.readFileSync(adminChatPagePath, 'utf8')
    expect(content).toContain(
      "isReturnCard ? 'Pengajuan Retur' : 'Rincian Pesanan'"
    )
    expect(content).toContain('Kendala: {data.returnReason}')
    expect(content).toContain('Lihat Pesanan')
  })
})
