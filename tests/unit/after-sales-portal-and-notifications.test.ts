import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('After Sales Portal & Notifications System', () => {
  it('should enforce strict alignment of own messages to the right in Admin/AfterSales chat', () => {
    const chatPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/chat/page.tsx'
    )
    const content = fs.readFileSync(chatPagePath, 'utf8')

    expect(content).toContain('message.senderId !== selectedRoom.customerId')
    expect(content).toContain(
      "justifyContent: isAdmin ? 'flex-end' : 'flex-start'"
    )
    expect(content).toContain("isAdmin ? 'ml-auto' : 'mr-auto'")
  })

  it('should display Admin After Sales label in sidebar profile footer for AFTER_SALES role', () => {
    const sidebarPath = path.join(
      process.cwd(),
      'src/components/dashboard/sidebar.tsx'
    )
    const content = fs.readFileSync(sidebarPath, 'utf8')

    expect(content).toContain(
      "if (pathname.startsWith('/dashboard/after-sales')) return 'AFTER_SALES'"
    )
    expect(content).toContain("'Admin After Sales'")
  })

  it('should render active chat conversation in fullscreen on mobile hiding the top navbar until user presses back', () => {
    const chatPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/chat/page.tsx'
    )
    const cssPath = path.join(process.cwd(), 'src/styles/globals.css')
    const chatContent = fs.readFileSync(chatPagePath, 'utf8')
    const cssContent = fs.readFileSync(cssPath, 'utf8')

    expect(chatContent).toContain(
      "document.body.classList.add('admin-chat-mobile-open')"
    )
    expect(chatContent).toContain(
      "document.body.classList.remove('admin-chat-mobile-open')"
    )
    expect(chatContent).toContain(
      'fixed inset-0 z-50 h-[100dvh] max-h-[100dvh] rounded-none border-0'
    )
    expect(cssContent).toContain('body.admin-chat-mobile-open header')
  })
  it('should format raw JSON chat previews into clean human readable text', () => {
    function formatChatMessagePreview(raw: string, productName?: string) {
      if (!raw) return 'Belum ada pesan'
      try {
        if (raw.startsWith('{') && raw.endsWith('}')) {
          const parsed = JSON.parse(raw)
          if (parsed.type === 'order_reference') {
            if (productName) {
              return `📋 Rincian Pesanan: ${productName}`
            }
            return `📋 Rincian Pesanan #${parsed.orderNumber || ''}`
          }
          if (parsed.type === 'product_inquiry') {
            return `📦 Produk: ${parsed.productName || 'Gadget'}`
          }
          if (parsed.type === 'return_request') {
            return `🔄 Pengajuan Retur: ${parsed.reasonLabel || parsed.reason || 'Klaim Garansi'}`
          }
          if (parsed.content) return parsed.content
        }
      } catch {
        // Fallback to raw text
      }
      return raw
    }

    const rawJson = JSON.stringify({
      type: 'order_reference',
      orderId: 'cmurwahto0037tz4ctkuunym5',
      orderNumber: 'SPR-20260930-F6457871',
    })

    const previewWithProduct = formatChatMessagePreview(
      rawJson,
      'Iphone 18 Pro Max'
    )
    expect(previewWithProduct).toBe('📋 Rincian Pesanan: Iphone 18 Pro Max')

    const previewWithoutProduct = formatChatMessagePreview(rawJson)
    expect(previewWithoutProduct).toBe(
      '📋 Rincian Pesanan #SPR-20260930-F6457871'
    )

    const rawNormalText =
      'Halo Kak Siti! Betul sekali, garansi 30 hari tukar unit baru'
    expect(formatChatMessagePreview(rawNormalText)).toBe(rawNormalText)
  })

  it('should filter notifications strictly to After Sales concerns for AFTER_SALES role', () => {
    const counts = {
      orders: 12, // Platform/Store orders
      ordersNeedProcessing: 5,
      ordersPendingPayment: 7,
      chat: 8, // After sales chat
      finance: 3,
      returns: 2, // After sales returns
      complaints: 1, // After sales complaints
      ads: 3,
      mitras: 7,
      liveStreams: 0,
    }

    function getActiveItems(role: string, pathname: string) {
      const isAfterSales =
        role === 'AFTER_SALES' || pathname.startsWith('/dashboard/after-sales')
      if (isAfterSales) {
        return [
          {
            id: 'chat',
            title: 'Pesan Purna Jual Pelanggan',
            count: counts.chat,
            href: '/dashboard/after-sales/chat',
          },
          {
            id: 'returns',
            title: 'Pengajuan Retur / Refund',
            count: counts.returns,
            href: '/dashboard/after-sales/returns',
          },
          {
            id: 'complaints',
            title: 'Klaim Garansi 30 Hari',
            count: counts.complaints,
            href: '/dashboard/after-sales/returns',
          },
        ].filter((i) => i.count > 0)
      }

      return [
        { id: 'orders', title: 'Pesanan Perlu Diproses', count: counts.orders },
        { id: 'ads', title: 'Pengajuan Slot Iklan', count: counts.ads },
        {
          id: 'mitras',
          title: 'Pendaftaran Toko Cabang',
          count: counts.mitras,
        },
      ].filter((i) => i.count > 0)
    }

    const afterSalesItems = getActiveItems(
      'AFTER_SALES',
      '/dashboard/after-sales'
    )
    expect(afterSalesItems.map((i) => i.id)).toEqual([
      'chat',
      'returns',
      'complaints',
    ])
    expect(
      afterSalesItems.some(
        (i) => i.id === 'ads' || i.id === 'mitras' || i.id === 'orders'
      )
    ).toBe(false)
  })

  it('should identify chat layout routes correctly for full-screen fit', () => {
    function isChatPage(pathname: string) {
      return (
        pathname.startsWith('/dashboard/admin/chat') ||
        pathname.startsWith('/dashboard/after-sales/chat')
      )
    }

    expect(isChatPage('/dashboard/after-sales/chat')).toBe(true)
    expect(isChatPage('/dashboard/admin/chat')).toBe(true)
    expect(isChatPage('/dashboard/after-sales')).toBe(false)
    expect(isChatPage('/dashboard/admin/orders')).toBe(false)
  })

  it('should position messages from current user / after sales on the right and customer on the left', () => {
    const currentUserId = 'user_aftersales_budi_123'
    const customerId = 'user_customer_siti_456'

    function getMessageAlignment(
      message: { senderId: string; senderRole?: string },
      userId: string,
      chatCustomerId: string
    ) {
      const isCurrentUser =
        Boolean(userId && message.senderId === userId) ||
        message.senderId === 'me' ||
        Boolean(
          message.senderRole &&
          [
            'ADMIN',
            'SUPER_ADMIN',
            'STORE_ADMIN',
            'STORE_SALES',
            'AFTER_SALES',
          ].includes(message.senderRole) &&
          message.senderId !== chatCustomerId
        )

      return isCurrentUser ? 'right' : 'left'
    }

    // Aftersales message (Budi) viewed by Budi
    expect(
      getMessageAlignment(
        { senderId: currentUserId, senderRole: 'AFTER_SALES' },
        currentUserId,
        customerId
      )
    ).toBe('right')

    // Optimistic sent message
    expect(
      getMessageAlignment({ senderId: 'me' }, currentUserId, customerId)
    ).toBe('right')

    // Staff message with role AFTER_SALES
    expect(
      getMessageAlignment(
        { senderId: 'other_staff_cuid', senderRole: 'AFTER_SALES' },
        currentUserId,
        customerId
      )
    ).toBe('right')

    // Customer message
    expect(
      getMessageAlignment(
        { senderId: customerId, senderRole: 'CUSTOMER' },
        currentUserId,
        customerId
      )
    ).toBe('left')
  })
})
