import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Orders Updates: Chat Context, Printer Alignment & Cek Resi Tab', () => {
  const ordersPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/orders/page.tsx'
  )
  const chatPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/chat/page.tsx'
  )
  const chatRoomsApiRoutePath = path.resolve(
    process.cwd(),
    'src/app/api/admin/chat/rooms/route.ts'
  )
  const ordersApiRoutePath = path.resolve(
    process.cwd(),
    'src/app/api/admin/orders/route.ts'
  )

  const ordersPageContent = fs.readFileSync(ordersPagePath, 'utf8')
  const chatPageContent = fs.readFileSync(chatPagePath, 'utf8')
  const chatRoomsApiContent = fs.readFileSync(chatRoomsApiRoutePath, 'utf8')
  const ordersApiContent = fs.readFileSync(ordersApiRoutePath, 'utf8')

  it('1. should replace WhatsApp button with Hubungi via Chat button in order modal', () => {
    expect(ordersPageContent).not.toContain('Hubungi via WhatsApp')
    expect(ordersPageContent).toContain('Hubungi via Chat')
    expect(ordersPageContent).toContain('handleChatCustomer(selectedOrder)')
    expect(ordersPageContent).toContain('MessageSquare')
  })

  it('2. should connect to chat room and stage orderId context when jumping to chat', () => {
    expect(ordersPageContent).toContain('/api/admin/chat/rooms')
    expect(ordersPageContent).toContain('/dashboard/admin/chat?roomId=')
    expect(ordersPageContent).toContain('orderId=')
    expect(chatPageContent).toContain("type: 'order_reference'")
    expect(chatPageContent).toContain('activeOrderContext')
  })

  it('3. should shift printer logo slightly right on Cetak Label Thermal button', () => {
    // Check ml-1.5 or ml-2 on printer icon and gap-2 on button
    expect(ordersPageContent).toMatch(/<Printer[^>]*ml-1\.5[^>]*\/>/)
    expect(ordersPageContent).toMatch(
      /onClick=\{\(\) =>\s*handleOpenThermalLabel\(selectedOrder\)\s*\}[^>]*gap-2/
    )
  })

  it('4. should render Cek Resi modal trigger without navigating away from page', () => {
    expect(ordersPageContent).toContain('CheckResiModal')
    expect(ordersPageContent).toContain('setShowCheckResiModal(true)')
    expect(ordersPageContent).toContain('Cek Resi')
  })

  it('5. should support searchParams (roomId and orderId) in admin chat page', () => {
    expect(chatPageContent).toContain('useSearchParams')
    expect(chatPageContent).toContain("searchParams?.get('roomId')")
    expect(chatPageContent).toContain("searchParams?.get('orderId')")
    expect(chatPageContent).toContain('React.Suspense')
    expect(chatPageContent).toContain('AdminChatContent')
  })

  it('6. should include user id in admin orders API and resolve customerId in chat rooms API', () => {
    expect(ordersApiContent).toContain('id: true')
    expect(chatRoomsApiContent).toContain('effectiveCustomerId = order.userId')
    expect(chatRoomsApiContent).toContain('claimedById: session.user.id')
  })
})
