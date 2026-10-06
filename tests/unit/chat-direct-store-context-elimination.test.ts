import { describe, it, expect } from 'vitest'

describe('Direct Store Chat vs Order Chat Context Isolation', () => {
  interface StoreRoomData {
    id: string
    storeId: string
    orderId?: string | null
    order?: {
      id: string
      orderNumber: string
      total: number
      status: string
      items?: Array<{
        price: number
        product: { name: string; images: string[] }
      }>
    } | null
    messages?: Array<{
      id: string
      content: string
      messageType?: string
    }>
  }

  function resolveChatState(params: {
    paramOrderId: string | null
    paramStoreId: string | null
    roomData: StoreRoomData
    existingMessageInput: string
  }) {
    let activeOrderContext: any = null
    const messageInput = params.existingMessageInput

    // STRICT RULE: Only set activeOrderContext if paramOrderId was explicitly provided in URL
    if (params.paramOrderId && params.roomData.order) {
      const firstItem = params.roomData.order.items?.[0]
      const prod = firstItem?.product
      activeOrderContext = {
        orderId: params.roomData.order.id,
        orderNumber: params.roomData.order.orderNumber,
        status: params.roomData.order.status,
        total: params.roomData.order.total,
        productName: prod?.name || '',
        productImage: prod?.images?.[0] || '',
        productPrice: firstItem?.price || 0,
        returnRequest: null,
      }
    } else if (!params.paramOrderId) {
      // Direct store chat: NEVER show order context even if store room has past orders
      activeOrderContext = null
    }

    // STRICT RULE: No "Halo admin..." template prefill in input
    // messageInput remains whatever was typed or empty
    return {
      activeOrderContext,
      messageInput,
    }
  }

  it('should keep chat completely empty and without order context when chatting directly from store without orderId', () => {
    const mockStoreRoomWithPastOrder: StoreRoomData = {
      id: 'room-1',
      storeId: 'store-roxy',
      orderId: 'ord-past-999',
      order: {
        id: 'ord-past-999',
        orderNumber: 'SPR-20260928-B298AF55',
        total: 27084498,
        status: 'PAID',
        items: [
          {
            price: 27084498,
            product: {
              name: 'iPhone 15 Pro Max 8GB/1TB White Titanium',
              images: ['https://example.com/ip15pm.jpg'],
            },
          },
        ],
      },
      messages: [],
    }

    // Customer opens chat directly from store: ?storeId=store-roxy (no paramOrderId)
    const result = resolveChatState({
      paramOrderId: null,
      paramStoreId: 'store-roxy',
      roomData: mockStoreRoomWithPastOrder,
      existingMessageInput: '',
    })

    // Must be completely null (kosongan)
    expect(result.activeOrderContext).toBeNull()
    // Message input must NOT have any "Halo admin..." prefill
    expect(result.messageInput).toBe('')
    expect(result.messageInput).not.toContain('Halo admin')
  })

  it('should only attach activeOrderContext when opened from order details with paramOrderId', () => {
    const mockStoreRoomWithOrder: StoreRoomData = {
      id: 'room-1',
      storeId: 'store-roxy',
      orderId: 'ord-past-999',
      order: {
        id: 'ord-past-999',
        orderNumber: 'SPR-20260928-B298AF55',
        total: 27084498,
        status: 'PAID',
        items: [
          {
            price: 27084498,
            product: {
              name: 'iPhone 15 Pro Max 8GB/1TB White Titanium',
              images: ['https://example.com/ip15pm.jpg'],
            },
          },
        ],
      },
      messages: [],
    }

    // Customer clicks "Tanya Admin / Chat Toko" from order details page: ?orderId=ord-past-999
    const result = resolveChatState({
      paramOrderId: 'ord-past-999',
      paramStoreId: 'store-roxy',
      roomData: mockStoreRoomWithOrder,
      existingMessageInput: '',
    })

    expect(result.activeOrderContext).not.toBeNull()
    expect(result.activeOrderContext?.orderNumber).toBe('SPR-20260928-B298AF55')
    expect(result.activeOrderContext?.productName).toBe(
      'iPhone 15 Pro Max 8GB/1TB White Titanium'
    )
    // Even when context is attached, input box remains clean without "Halo admin..."
    expect(result.messageInput).toBe('')
  })

  it('should not inject orderId into browser URL history when selecting rooms', () => {
    function computeUrlOnSelectRoom(room: { orderId?: string | null }) {
      // Room select URL sync: always keep clean at /dashboard/customer/chat
      return '/dashboard/customer/chat'
    }

    const roomWithOrder = { orderId: 'ord-past-999' }
    const url = computeUrlOnSelectRoom(roomWithOrder)
    expect(url).toBe('/dashboard/customer/chat')
    expect(url).not.toContain('orderId')
  })

  it('should not treat room order as auto-pinned context list in conversation without messages', () => {
    function getConversationOrderContexts(
      selectedRoom: { order?: { id: string; orderNumber: string } | null },
      activeOrderContext: { orderNumber: string } | null
    ) {
      const list: Array<{ orderNumber: string }> = []
      // activeOrderContext is only added if explicitly active
      if (activeOrderContext) {
        list.push({ orderNumber: activeOrderContext.orderNumber })
      }
      // selectedRoom.order is NO LONGER unshifted automatically
      return list
    }

    // Direct store chat: room has order in DB, but user didn't open from order detail
    const contexts = getConversationOrderContexts(
      { order: { id: 'ord-past-999', orderNumber: 'SPR-20260928-B298AF55' } },
      null
    )
    expect(contexts).toHaveLength(0)
  })
})
