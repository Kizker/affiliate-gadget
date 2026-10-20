import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Customer Chat Performance & Accessibility Optimization Suite', () => {
  const chatPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/chat/page.tsx'
  )
  const chatSidebarPath = path.resolve(
    process.cwd(),
    'src/components/customer/chat/chat-sidebar.tsx'
  )
  const chatRoomCardPath = path.resolve(
    process.cwd(),
    'src/components/customer/chat/chat-room-card.tsx'
  )
  const chatHeaderPath = path.resolve(
    process.cwd(),
    'src/components/customer/chat/chat-header.tsx'
  )
  const chatInputBarPath = path.resolve(
    process.cwd(),
    'src/components/customer/chat/chat-input-bar.tsx'
  )
  const chatMessageListPath = path.resolve(
    process.cwd(),
    'src/components/customer/chat/chat-message-list.tsx'
  )
  const chatMessageBubblePath = path.resolve(
    process.cwd(),
    'src/components/customer/chat/chat-message-bubble.tsx'
  )
  const allRoomsRoutePath = path.resolve(
    process.cwd(),
    'src/app/api/customer/chat/all-rooms/route.ts'
  )
  const chatRoomsRoutePath = path.resolve(
    process.cwd(),
    'src/app/api/chat/rooms/route.ts'
  )

  it('1. Code Splitting: ChatMediaModal di-load secara dynamic (ssr: false) untuk mereduksi initial bundle', () => {
    const pageContent = fs.readFileSync(chatPagePath, 'utf-8')
    expect(pageContent).toContain("import dynamic from 'next/dynamic'")
    expect(pageContent).toContain('const ChatMediaModal = dynamic(')
    expect(pageContent).toContain(
      "import('@/components/customer/chat/chat-media-modal')"
    )
    expect(pageContent).toContain('ssr: false')
  })

  it('2. Polling Optimization: Polling memiliki initial delay dan mengecek visibilityState tab', () => {
    const pageContent = fs.readFileSync(chatPagePath, 'utf-8')
    expect(pageContent).toContain("document.visibilityState !== 'visible'")
    expect(pageContent).toContain('setTimeout')
    expect(pageContent).toContain('4000') // messages poll
    expect(pageContent).toContain('8000') // rooms poll
  })

  it('3. CLS Elimination: ChatSidebar dan ChatMessageList menyediakan visual skeleton loading', () => {
    const sidebarContent = fs.readFileSync(chatSidebarPath, 'utf-8')
    const listContent = fs.readFileSync(chatMessageListPath, 'utf-8')

    // Sidebar skeleton
    expect(sidebarContent).toContain('loading && rooms.length === 0')
    expect(sidebarContent).toContain('animate-pulse')

    // Message list skeleton
    expect(listContent).toContain('messagesLoading ? (')
    expect(listContent).toContain('animate-pulse')
    expect(listContent).toContain('h-14 w-48 rounded-2xl')
  })

  it('4. Image Optimization: Seluruh avatar dan preview gambar memiliki dimensi eksplisit, lazy loading, dan decoding async', () => {
    const roomCardContent = fs.readFileSync(chatRoomCardPath, 'utf-8')
    const headerContent = fs.readFileSync(chatHeaderPath, 'utf-8')
    const bubbleContent = fs.readFileSync(chatMessageBubblePath, 'utf-8')

    // Room card
    expect(roomCardContent).toContain('width={40}')
    expect(roomCardContent).toContain('height={40}')
    expect(roomCardContent).toContain('loading="lazy"')
    expect(roomCardContent).toContain('decoding="async"')

    // Header
    expect(headerContent).toContain('width={40}')
    expect(headerContent).toContain('height={40}')
    expect(headerContent).toContain('loading="lazy"')
    expect(headerContent).toContain('decoding="async"')

    // Bubble
    expect(bubbleContent).toContain('loading="lazy"')
    expect(bubbleContent).toContain('decoding="async"')
  })

  it('5. Accessibility (WCAG / Lighthouse 100): Tombol dan input memiliki aria-label, role tablist/tab, dan heading semantik valid', () => {
    const pageContent = fs.readFileSync(chatPagePath, 'utf-8')
    const sidebarContent = fs.readFileSync(chatSidebarPath, 'utf-8')
    const roomCardContent = fs.readFileSync(chatRoomCardPath, 'utf-8')
    const headerContent = fs.readFileSync(chatHeaderPath, 'utf-8')
    const inputContent = fs.readFileSync(chatInputBarPath, 'utf-8')

    // Page H1 semantik
    expect(pageContent).toContain(
      '<h1 className="sr-only">Pusat Pesan & Chat Pelanggan</h1>'
    )
    expect(pageContent).toContain('aria-label="Kembali ke Pengaturan"')

    // Sidebar tabs
    expect(sidebarContent).toContain('role="tablist"')
    expect(sidebarContent).toContain('role="tab"')
    expect(sidebarContent).toContain('aria-selected=')

    // Room card: span (bukan h4) di dalam button & aria-label
    expect(roomCardContent).not.toContain(
      '<h4 className="truncate text-xs font-bold text-slate-900'
    )
    expect(roomCardContent).toContain(
      'aria-label={`Buka percakapan dengan ${title}`}'
    )

    // Header & Input
    expect(headerContent).toContain('aria-label="Kembali ke daftar percakapan"')
    expect(inputContent).toContain('aria-label="Kirim foto atau video"')
    expect(inputContent).toContain('aria-label="Ketik pesan ke admin toko"')
    expect(inputContent).toContain('aria-label="Kirim pesan"')
  })

  it('6. Database Performance: Cleanup abandoned room berjalan secara non-blocking di background', () => {
    const allRoomsRoute = fs.readFileSync(allRoomsRoutePath, 'utf-8')
    const chatRoomsRoute = fs.readFileSync(chatRoomsRoutePath, 'utf-8')

    // Tanpa await pada deleteMany
    expect(allRoomsRoute).not.toContain('await prisma.adminChatRoom.deleteMany')
    expect(allRoomsRoute).toMatch(/prisma\.adminChatRoom\s*\.deleteMany/)

    expect(chatRoomsRoute).not.toContain('await prisma.chatRoom.deleteMany')
    expect(chatRoomsRoute).toMatch(/prisma\.chatRoom\s*\.deleteMany/)
  })

  it('7. Mobile Layout Integrity: ChatInputBar dan chat panes memiliki min-w-0 dan w-full untuk mencegah tombol kirim terpotong', () => {
    const inputContent = fs.readFileSync(chatInputBarPath, 'utf-8')
    const pageContent = fs.readFileSync(chatPagePath, 'utf-8')

    // ChatInputBar root & flex row memiliki w-full
    expect(inputContent).toContain('className="w-full shrink-0 border-t')
    expect(inputContent).toContain('className="flex w-full items-center gap-2"')

    // Input field memiliki min-w-0 flex-1 untuk mencegah blowout WebKit flexbox di mobile
    expect(inputContent).toContain('className="min-w-0 flex-1')

    // Chat page container memiliki w-full min-w-0
    expect(pageContent).toContain('h-full min-h-0 w-full min-w-0')
  })
})
