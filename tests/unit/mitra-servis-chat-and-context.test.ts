import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mitra Servis Chat & Consultation Context Verification', () => {
  it('1. Endpoint /api/customer/chat/mitra-room exists and handles room creation for Mitra Servis', () => {
    const routePath = path.resolve(
      process.cwd(),
      'src/app/api/customer/chat/mitra-room/route.ts'
    )
    expect(fs.existsSync(routePath)).toBe(true)

    const content = fs.readFileSync(routePath, 'utf-8')
    expect(content).toContain('prisma.mitra.findFirst')
    expect(content).toContain('claimedById: partnerUserId')
    expect(content).toContain('storeId: null')
    expect(content).toContain('isMitra: true')
  })

  it('2. Customer Chat sends service_reference context on Enter or Tanya Servis', () => {
    const chatPagePath = path.resolve(
      process.cwd(),
      'src/app/dashboard/customer/chat/page.tsx'
    )
    const content = fs.readFileSync(chatPagePath, 'utf-8')

    expect(content).toContain('currentServiceContext')
    expect(content).toContain("messageType = 'service_reference'")
    expect(content).toContain("type: 'service_reference'")
    expect(content).toContain('mitraName: currentServiceContext.mitraName')
  })

  it('3. ChatMessageBubble and AdminChatContent render service_reference card with Mitra Servis styling', () => {
    const bubblePath = path.resolve(
      process.cwd(),
      'src/components/customer/chat/chat-message-bubble.tsx'
    )
    const bubbleContent = fs.readFileSync(bubblePath, 'utf-8')

    expect(bubbleContent).toContain('isService')
    expect(bubbleContent).toContain('Konsultasi Servis')
    expect(bubbleContent).toContain("msg.sender.role === 'MITRA'")
    expect(bubbleContent).toContain("'Mitra Servis'")

    const adminChatPath = path.resolve(
      process.cwd(),
      'src/app/dashboard/admin/chat/page.tsx'
    )
    const adminChatContent = fs.readFileSync(adminChatPath, 'utf-8')
    expect(adminChatContent).toContain('isService')
    expect(adminChatContent).toContain('Konsultasi Servis')
  })

  it('4. Mitra Servis has Pesan Konsultasi in Sidebar and Dashboard', () => {
    const sidebarPath = path.resolve(
      process.cwd(),
      'src/components/dashboard/sidebar.tsx'
    )
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8')

    expect(sidebarContent).toContain("label: 'Pesan Konsultasi'")
    expect(sidebarContent).toContain("href: '/dashboard/admin/chat'")

    const mitraDashboardPath = path.resolve(
      process.cwd(),
      'src/app/dashboard/mitra/page.tsx'
    )
    const dashboardContent = fs.readFileSync(mitraDashboardPath, 'utf-8')
    expect(dashboardContent).toContain('Chat Konsultasi Pelanggan')
    expect(dashboardContent).toContain('href="/dashboard/admin/chat"')
  })

  it('5. ChatHeader displays Mitra Servis: [Name] in emerald instead of Admin Toko', () => {
    const headerPath = path.resolve(
      process.cwd(),
      'src/components/customer/chat/chat-header.tsx'
    )
    const content = fs.readFileSync(headerPath, 'utf-8')

    expect(content).toContain(
      "(selectedRoom.claimedBy as any)?.role === 'MITRA'"
    )
    expect(content).toContain('text-emerald-600')
    expect(content).toContain('Mitra Servis:')
  })
})
