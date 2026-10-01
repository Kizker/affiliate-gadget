import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin & Customer Chat Order Context Refinements', () => {
  const adminChatPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/chat/page.tsx'
  )
  const customerChatPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/chat/page.tsx'
  )
  const adminOrdersPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/orders/page.tsx'
  )

  it('admin chat renders card messages standalone without blue wrapper bubble', () => {
    const adminChatContent = fs.readFileSync(adminChatPath, 'utf8')

    // Harus mendeteksi isCardMessage
    expect(adminChatContent).toContain(
      'const isCardMessage = isOrder || isProduct'
    )

    // Harus merender renderMessageContent secara langsung saat isCardMessage
    expect(adminChatContent).toContain(
      '/* Standalone Card Bubble (No Blue Background Wrapper) */'
    )
    expect(adminChatContent).toContain('isCardMessage ? (')
    expect(adminChatContent).toContain('renderMessageContent(')
  })

  it('admin chat renders order number clearly under product title matching screenshot 2', () => {
    const adminChatContent = fs.readFileSync(adminChatPath, 'utf8')

    // Menampilkan #{orderNum} dengan styling font-mono text-blue-600
    expect(adminChatContent).toContain(
      '<p className="truncate font-mono text-[9.5px] font-bold text-blue-600 dark:text-blue-400">'
    )
    expect(adminChatContent).toContain('#{orderNum}')
  })

  it('admin orders handleChatCustomer routes cleanly to chat room with orderId context', () => {
    const adminOrdersContent = fs.readFileSync(adminOrdersPath, 'utf8')

    // Tidak ada note pesan greeting otomatis
    expect(adminOrdersContent).not.toContain('Halo ${customerName}')
    expect(adminOrdersContent).not.toContain('ingin mengonfirmasi pesanan')
    expect(adminOrdersContent).toContain('/dashboard/admin/chat?roomId=')
    expect(adminOrdersContent).toContain('orderId=${order.id}')
  })

  it('filters out legacy automated confirmation greeting note if present in message data', () => {
    const adminChatContent = fs.readFileSync(adminChatPath, 'utf8')
    const customerChatContent = fs.readFileSync(customerChatPath, 'utf8')

    // Admin chat ignores automated confirmation greetings
    expect(adminChatContent).toContain(
      "!data.note.includes('ingin mengonfirmasi pesanan')"
    )

    // Customer chat ignores automated confirmation greetings
    expect(customerChatContent.replace(/\s+/g, ' ')).toContain(
      "!p.note.includes( 'ingin mengonfirmasi pesanan' )"
    )
  })
})
