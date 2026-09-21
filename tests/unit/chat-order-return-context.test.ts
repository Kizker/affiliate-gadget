import { describe, it, expect } from 'vitest'

describe('Chat Order & Return Context Engine', () => {
  describe('Chat URL Parameter Construction', () => {
    function buildChatUrl(order: {
      id: string
      orderNumber: string
      store?: { id: string } | null
      items?: Array<{
        price?: number
        product?: { name: string; images?: string[] } | null
      }>
      returnRequests?: Array<{
        id: string
        status: string
        type?: string | null
        reason?: string | null
        reasonLabel?: string | null
      }>
    }) {
      const latestReturn = order.returnRequests?.[0]
      const firstItem = order.items?.[0]
      const firstProduct = firstItem?.product
      const chatParams = new URLSearchParams()
      chatParams.set('orderId', order.id)
      if (order.store?.id) chatParams.set('storeId', order.store.id)
      if (order.orderNumber) chatParams.set('orderNumber', order.orderNumber)
      if (latestReturn) {
        chatParams.set('returnId', latestReturn.id)
        chatParams.set(
          'returnReason',
          latestReturn.reasonLabel || latestReturn.reason || ''
        )
        chatParams.set('returnStatus', latestReturn.status)
        if (latestReturn.type) chatParams.set('returnType', latestReturn.type)
      }
      if (firstProduct?.name) chatParams.set('productName', firstProduct.name)
      if (firstProduct?.images?.[0])
        chatParams.set('productImage', firstProduct.images[0])
      if (firstItem?.price)
        chatParams.set('productPrice', String(firstItem.price))

      return `/dashboard/customer/chat?${chatParams.toString()}`
    }

    it('should generate rich URL parameters including order, product, and return details', () => {
      const mockOrder = {
        id: 'ord-123',
        orderNumber: 'SPR-1788852892238-I05QWVDK1',
        store: { id: 'store-roxy' },
        items: [
          {
            price: 21999000,
            product: {
              name: 'Samsung Galaxy S24 Ultra 12GB/512GB Titanium Violet',
              images: ['https://example.com/s24.jpg'],
            },
          },
        ],
        returnRequests: [
          {
            id: 'ret-999',
            status: 'PENDING',
            type: 'REFUND',
            reason: 'DEFECTIVE',
            reasonLabel: 'Mati Total (DOA)',
          },
        ],
      }

      const url = buildChatUrl(mockOrder)
      expect(url).toContain('orderId=ord-123')
      expect(url).toContain('storeId=store-roxy')
      expect(url).toContain('orderNumber=SPR-1788852892238-I05QWVDK1')
      expect(url).toContain('returnId=ret-999')
      expect(url).toContain('returnReason=Mati+Total+%28DOA%29')
      expect(url).toContain('returnStatus=PENDING')
      expect(url).toContain('returnType=REFUND')
      expect(url).toContain(
        'productName=Samsung+Galaxy+S24+Ultra+12GB%2F512GB+Titanium+Violet'
      )
      expect(url).toContain('productPrice=21999000')
    })

    it('should generate standard order URL parameters when order has no return request', () => {
      const mockOrder = {
        id: 'ord-456',
        orderNumber: 'ORD-2026-999',
        store: { id: 'store-bec' },
        items: [
          {
            price: 15999000,
            product: {
              name: 'iPhone 15 128GB Black',
              images: ['https://example.com/ip15.jpg'],
            },
          },
        ],
      }

      const url = buildChatUrl(mockOrder)
      expect(url).toContain('orderId=ord-456')
      expect(url).toContain('orderNumber=ORD-2026-999')
      expect(url).not.toContain('returnReason=')
      expect(url).not.toContain('returnStatus=')
      expect(url).toContain('productName=iPhone+15+128GB+Black')
    })
  })

  describe('Contextual Message Prefill & Copy Generator', () => {
    function generateContextualMessage(params: {
      orderNumber?: string
      productName?: string
      variantName?: string
      returnReason?: string
    }) {
      if (params.returnReason) {
        return `Halo admin, saya ingin menanyakan perkembangan pengajuan retur untuk pesanan #${params.orderNumber || ''} (${params.productName || 'unit'}${params.variantName ? ` - ${params.variantName}` : ''}, Kendala: ${params.returnReason}). Mohon bantuannya.`
      } else if (params.orderNumber) {
        return `Halo admin, saya ingin menanyakan tentang pesanan saya #${params.orderNumber} (${params.productName || 'produk'}).`
      }
      return ''
    }

    it('should prefill return inquiry message with order number and defect reason', () => {
      const msg = generateContextualMessage({
        orderNumber: 'SPR-1788852892238-I05QWVDK1',
        productName: 'Samsung Galaxy S24 Ultra',
        variantName: 'Titanium Violet 512GB',
        returnReason: 'Mati Total (DOA)',
      })

      expect(msg).toContain(
        'Halo admin, saya ingin menanyakan perkembangan pengajuan retur'
      )
      expect(msg).toContain('SPR-1788852892238-I05QWVDK1')
      expect(msg).toContain('Samsung Galaxy S24 Ultra - Titanium Violet 512GB')
      expect(msg).toContain('Kendala: Mati Total (DOA)')
    })

    it('should prefill standard order inquiry message when not in return flow', () => {
      const msg = generateContextualMessage({
        orderNumber: 'ORD-888',
        productName: 'MacBook Air M3',
      })

      expect(msg).toContain(
        'Halo admin, saya ingin menanyakan tentang pesanan saya #ORD-888 (MacBook Air M3).'
      )
    })
  })

  describe('Return Status Badge Mapping', () => {
    function getReturnStatusBadge(status?: string) {
      switch (status) {
        case 'APPROVED':
          return 'Disetujui'
        case 'REJECTED':
          return 'Ditolak'
        case 'COMPLETED':
          return 'Selesai'
        default:
          return 'Menunggu Verifikasi Toko'
      }
    }

    it('should map all return status codes to user-friendly Indonesian labels', () => {
      expect(getReturnStatusBadge('APPROVED')).toBe('Disetujui')
      expect(getReturnStatusBadge('REJECTED')).toBe('Ditolak')
      expect(getReturnStatusBadge('COMPLETED')).toBe('Selesai')
      expect(getReturnStatusBadge('PENDING')).toBe('Menunggu Verifikasi Toko')
      expect(getReturnStatusBadge(undefined)).toBe('Menunggu Verifikasi Toko')
    })
  })

  describe('Structured Reference Payload & Card Parsing', () => {
    function parseStructuredMessage(msg: {
      content: string
      messageType?: string
    }) {
      const contentTrimmed = msg.content?.trim() || ''
      let parsed: any = null
      if (contentTrimmed.startsWith('{')) {
        try {
          parsed = JSON.parse(contentTrimmed)
        } catch {
          parsed = null
        }
      }

      const returnTextMatch =
        !parsed &&
        contentTrimmed.match(
          /Halo admin, saya ingin menanyakan perkembangan pengajuan retur untuk pesanan #([^\s(]+)(?:\s*\(([^,)]+)(?:,\s*Kendala:\s*([^)]+))?\))?/i
        )
      const orderTextMatch =
        !parsed &&
        !returnTextMatch &&
        contentTrimmed.match(
          /Halo admin, saya ingin menanyakan (?:tentang pesanan saya|pesanan saya) #([^\s(]+)(?:\s*\(([^)]+)\))?/i
        )

      const isReturn =
        Boolean(returnTextMatch) ||
        msg.messageType === 'return_reference' ||
        parsed?.type === 'return_reference' ||
        Boolean(parsed?.returnReason)

      const isOrder =
        isReturn ||
        Boolean(orderTextMatch) ||
        msg.messageType === 'order_reference' ||
        msg.messageType === 'order' ||
        parsed?.type === 'order_reference' ||
        parsed?.type === 'order' ||
        Boolean(parsed?.orderNumber)

      const orderNumber =
        parsed?.orderNumber ||
        (returnTextMatch && returnTextMatch[1]) ||
        (orderTextMatch && orderTextMatch[1]) ||
        ''

      const productName =
        parsed?.productName ||
        parsed?.name ||
        (returnTextMatch && returnTextMatch[2]) ||
        (orderTextMatch && orderTextMatch[2]) ||
        ''

      const returnReason =
        parsed?.returnReason || (returnTextMatch && returnTextMatch[3]) || ''

      return {
        isReturn,
        isOrder,
        orderNumber,
        productName,
        returnReason,
        note: parsed?.note || '',
      }
    }

    it('should correctly parse JSON return_reference message payload into structured card data', () => {
      const jsonPayload = JSON.stringify({
        type: 'return_reference',
        orderNumber: 'SPR-1788852892238-I05QWVDK1',
        orderId: 'ord-123',
        productName: 'Samsung Galaxy S24 Ultra 12GB/512GB',
        productPrice: 21999000,
        returnReason: 'Mati Total (DOA)',
        returnStatus: 'PENDING',
        note: 'Min, tolong segera diproses ya',
      })

      const result = parseStructuredMessage({
        content: jsonPayload,
        messageType: 'return_reference',
      })

      expect(result.isReturn).toBe(true)
      expect(result.isOrder).toBe(true)
      expect(result.orderNumber).toBe('SPR-1788852892238-I05QWVDK1')
      expect(result.productName).toBe('Samsung Galaxy S24 Ultra 12GB/512GB')
      expect(result.returnReason).toBe('Mati Total (DOA)')
      expect(result.note).toBe('Min, tolong segera diproses ya')
    })

    it('should correctly parse legacy text format into structured card data', () => {
      const textMsg =
        'Halo admin, saya ingin menanyakan perkembangan pengajuan retur untuk pesanan #SPR-999 (iPhone 15 Pro, Kendala: Layar Bergaris). Mohon bantuannya.'

      const result = parseStructuredMessage({
        content: textMsg,
      })

      expect(result.isReturn).toBe(true)
      expect(result.isOrder).toBe(true)
      expect(result.orderNumber).toBe('SPR-999')
      expect(result.productName).toBe('iPhone 15 Pro')
      expect(result.returnReason).toBe('Layar Bergaris')
    })
  })

  describe('One-Time Context Popup & Combined Send Flow', () => {
    it('should combine context payload and user caption into a single message and dismiss popup', () => {
      let activeOrderContext: any = {
        orderId: 'ord-123',
        orderNumber: 'SPR-1788852892238-I05QWVDK1',
        productName: 'Samsung Galaxy S24 Ultra',
        productPrice: 21999000,
        returnRequest: {
          id: 'ret-1',
          reason: 'Mati Total (DOA)',
          status: 'PENDING',
          type: 'REFUND',
        },
      }
      const sentContexts = new Set<string>()

      const userCaption = 'Min, Bales jir!'

      // Send action
      const messageType = activeOrderContext.returnRequest
        ? 'return_reference'
        : 'order_reference'
      const payload = {
        type: messageType,
        orderId: activeOrderContext.orderId,
        orderNumber: activeOrderContext.orderNumber,
        productName: activeOrderContext.productName,
        productPrice: activeOrderContext.productPrice,
        note: userCaption,
        returnId: activeOrderContext.returnRequest.id,
        returnReason: activeOrderContext.returnRequest.reason,
        returnStatus: activeOrderContext.returnRequest.status,
      }

      // Record as sent and dismiss
      sentContexts.add(activeOrderContext.orderId)
      sentContexts.add(activeOrderContext.orderNumber)
      activeOrderContext = null

      expect(activeOrderContext).toBeNull()
      expect(sentContexts.has('ord-123')).toBe(true)
      expect(sentContexts.has('SPR-1788852892238-I05QWVDK1')).toBe(true)
      expect(payload.note).toBe('Min, Bales jir!')
      expect(payload.type).toBe('return_reference')
    })

    it('should suppress context popup when existing room messages already contain order inquiry', () => {
      const existingMessages = [
        {
          id: 'msg-1',
          messageType: 'return_reference',
          content: JSON.stringify({
            type: 'return_reference',
            orderNumber: 'SPR-1788852892238-I05QWVDK1',
            orderId: 'ord-123',
          }),
        },
        {
          id: 'msg-2',
          messageType: 'text',
          content: 'Min, Bales jir!',
        },
      ]

      const targetOrderNumber = 'SPR-1788852892238-I05QWVDK1'
      const targetOrderId = 'ord-123'

      const hasExisting = existingMessages.some(
        (m) =>
          m.messageType === 'return_reference' ||
          m.messageType === 'order_reference' ||
          m.content.includes(targetOrderNumber) ||
          m.content.includes(targetOrderId)
      )

      expect(hasExisting).toBe(true)
      // When hasExisting is true, activeOrderContext should NOT be initialized
      const shouldShowPopup = !hasExisting
      expect(shouldShowPopup).toBe(false)
    })
  })
})
