import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Chat: No Navbar Context & Auto-Send Card with Typed Caption', () => {
  const adminChatPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/chat/page.tsx'
  )
  const chatContent = fs.readFileSync(adminChatPath, 'utf8')

  it('1. should not auto-stage order context when accessing from navbar without paramOrderId', () => {
    // Pastikan tidak ada else if (selectedRoom.order) yang men-stage context saat paramOrderId null
    expect(chatContent).not.toMatch(
      /else\s+if\s*\(\s*selectedRoom\.order\s*\)\s*\{\s*const\s+firstItem/
    )
    // Harus ada komentar/logika eksplisit: navbar access or room change without ?orderId= -> setActiveOrderContext(null)
    expect(chatContent).toContain('setActiveOrderContext(null)')
  })

  it('2. should eliminate "Kirim Kartu" button from contextual order banner', () => {
    // Banner konteks pesanan di atas kolom chat tidak boleh lagi memiliki tombol "Kirim Kartu"
    expect(chatContent).not.toContain('<span>Kirim Kartu</span>')
    expect(chatContent).not.toContain('Kirim Kartu')
  })

  it('3. should auto-bundle typed text as caption (note) in order_reference and clean context upon send', () => {
    // Saat type === 'text' dan activeOrderContext ada:
    expect(chatContent).toContain("if (type === 'text' && activeOrderContext)")
    expect(chatContent).toContain('const caption = messageInput.trim()')
    expect(chatContent).toContain("type: 'order_reference'")
    expect(chatContent).toContain('note: caption || undefined')
    expect(chatContent).toContain('setActiveOrderContext(null)')
    expect(chatContent).toContain("url.searchParams.delete('orderId')")
  })

  it('4. should render dynamic placeholder informing caption typing + Enter to send', () => {
    expect(chatContent).toContain(
      'Ketik caption untuk pesanan #${activeOrderContext.orderNumber}... (Enter untuk kirim)'
    )
    expect(chatContent).toContain("'Tulis balasan untuk customer...'")
  })

  it('5. should allow sending when activeOrderContext is present even before typing', () => {
    expect(chatContent).toContain(
      'disabled={(!messageInput.trim() && !activeOrderContext) || sending}'
    )
  })
})
