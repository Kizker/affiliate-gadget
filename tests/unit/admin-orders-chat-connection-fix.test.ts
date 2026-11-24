import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Orders Chat Connection and Room Rendering Fix Suite', () => {
  it('1. POST /api/admin/chat/rooms meng-include customer lengkap (role, phone, store), messages, dan _count', () => {
    const routePath = path.join(
      process.cwd(),
      'src/app/api/admin/chat/rooms/route.ts'
    )
    const content = fs.readFileSync(routePath, 'utf-8')

    expect(content).toContain('const standardRoomInclude = {')
    expect(content).toContain('role: true')
    expect(content).toContain('phone: true')
    expect(content).toContain('messages: {')
    expect(content).toContain('_count: {')
  })

  it('2. POST /api/admin/chat/rooms secara otomatis menerbitkan kartu referensi order (order_reference) saat dihubungi via tombol pesanan jika belum ada pesan', () => {
    const routePath = path.join(
      process.cwd(),
      'src/app/api/admin/chat/rooms/route.ts'
    )
    const content = fs.readFileSync(routePath, 'utf-8')

    expect(content).toContain("type: 'order_reference'")
    expect(content).toContain("messageType: 'order_reference'")
    expect(content).toContain('fullRoom || room')
  })

  it('3. Admin Chat page menerapkan null-safe optional chaining pada messages dan customer saat render sidebar dan header', () => {
    const chatPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/chat/page.tsx'
    )
    const content = fs.readFileSync(chatPagePath, 'utf-8')

    // Null safe pada formatMessagePreview
    expect(content).toContain('formatMessagePreview(room.messages?.[0])')
    expect(content).not.toContain('formatMessagePreview(room.messages[0])')

    // Null safe pada customer role di sidebar filter dan render
    expect(content).toContain("room.customer?.role === 'STORE_ADMIN'")
    expect(content).toContain('selectedRoom.customer?.image ?')
    expect(content).toContain("selectedRoom.customer?.role === 'STORE_ADMIN'")
  })
})
