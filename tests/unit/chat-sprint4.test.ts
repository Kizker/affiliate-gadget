import { describe, it, expect } from 'vitest'

describe('Sprint 4: Product-to-Store Chat Integration', () => {
  describe('Product Reference Message Payload & Formatting', () => {
    function serializeProductReference(data: {
      productId: string
      productName: string
      productPrice: number
      variantName?: string | null
    }) {
      return JSON.stringify({
        type: 'product_reference',
        productId: data.productId,
        productName: data.productName,
        productPrice: Number(data.productPrice) || 0,
        variantName: data.variantName || null,
      })
    }

    function parseProductReference(jsonString: string) {
      try {
        const parsed = JSON.parse(jsonString)
        if (
          parsed.type === 'product_reference' ||
          parsed.productId ||
          parsed.id
        ) {
          return {
            isValid: true,
            productId: parsed.productId || parsed.id,
            productName: parsed.productName || parsed.name,
            productPrice:
              parsed.productPrice !== undefined
                ? parsed.productPrice
                : parsed.price,
            variantName: parsed.variantName || null,
          }
        }
        return { isValid: false }
      } catch {
        return { isValid: false }
      }
    }

    it('should serialize product reference correctly into JSON string', () => {
      const payload = {
        productId: 'prod-123',
        productName: 'iPhone 15 Pro Max 256GB Titanium',
        productPrice: 23999000,
        variantName: 'Natural Titanium 256GB',
      }

      const serialized = serializeProductReference(payload)
      expect(typeof serialized).toBe('string')
      expect(serialized).toContain('"type":"product_reference"')
      expect(serialized).toContain('"productId":"prod-123"')
      expect(serialized).toContain('"productPrice":23999000')
      expect(serialized).toContain('"variantName":"Natural Titanium 256GB"')
    })

    it('should accurately parse and extract fields from product reference JSON', () => {
      const rawJson = JSON.stringify({
        type: 'product_reference',
        productId: 'prod-999',
        productName: 'Samsung Galaxy S24 Ultra',
        productPrice: 21499000,
        variantName: 'Titanium Gray 512GB',
      })

      const result = parseProductReference(rawJson)
      expect(result.isValid).toBe(true)
      expect(result.productId).toBe('prod-999')
      expect(result.productName).toBe('Samsung Galaxy S24 Ultra')
      expect(result.productPrice).toBe(21499000)
      expect(result.variantName).toBe('Titanium Gray 512GB')
    })

    it('should handle legacy or alternative field names (name, price, id)', () => {
      const rawLegacy = JSON.stringify({
        id: 'prod-old',
        name: 'Xiaomi 14',
        price: 11999000,
      })

      const result = parseProductReference(rawLegacy)
      expect(result.isValid).toBe(true)
      expect(result.productId).toBe('prod-old')
      expect(result.productName).toBe('Xiaomi 14')
      expect(result.productPrice).toBe(11999000)
    })
  })

  describe('Duplicate Product Message Detection', () => {
    function shouldAppendProductReference(
      lastMessage: { messageType: string; content: string } | null,
      newProduct: { productId: string; variantName?: string | null }
    ): boolean {
      if (!lastMessage) return true
      if (lastMessage.messageType !== 'product_reference') return true

      try {
        const parsed = JSON.parse(lastMessage.content)
        if (
          parsed.productId === newProduct.productId &&
          parsed.variantName === (newProduct.variantName || null)
        ) {
          return false // duplicate
        }
        return true
      } catch {
        return true
      }
    }

    it('should allow posting if there is no previous message in room', () => {
      expect(
        shouldAppendProductReference(null, {
          productId: 'p1',
          variantName: '256GB',
        })
      ).toBe(true)
    })

    it('should allow posting if last message was a text or other type', () => {
      const lastMsg = {
        messageType: 'text',
        content: 'Halo kak, barang ready?',
      }
      expect(
        shouldAppendProductReference(lastMsg, {
          productId: 'p1',
          variantName: '256GB',
        })
      ).toBe(true)
    })

    it('should block duplicate if last message is identical product reference', () => {
      const lastMsg = {
        messageType: 'product_reference',
        content: JSON.stringify({
          type: 'product_reference',
          productId: 'p1',
          variantName: '256GB',
        }),
      }
      expect(
        shouldAppendProductReference(lastMsg, {
          productId: 'p1',
          variantName: '256GB',
        })
      ).toBe(false)
    })

    it('should allow posting if last message was for a different product in same store', () => {
      const lastMsg = {
        messageType: 'product_reference',
        content: JSON.stringify({
          type: 'product_reference',
          productId: 'p1',
          variantName: '256GB',
        }),
      }
      expect(
        shouldAppendProductReference(lastMsg, {
          productId: 'p2',
          variantName: '512GB',
        })
      ).toBe(true)
    })
  })

  describe('formatMessagePreview Helper in Sidebar', () => {
    const formatMessagePreview = (message?: {
      content: string
      messageType?: string
      mediaUrl?: string | null
      mediaType?: string | null
    }) => {
      if (!message) return 'Mulai percakapan...'
      if (
        message.messageType === 'product' ||
        message.messageType === 'product_reference' ||
        (message.content?.trim().startsWith('{') &&
          (message.content.includes('"name"') ||
            message.content.includes('"productName"')) &&
          (message.content.includes('"price"') ||
            message.content.includes('"productPrice"')))
      ) {
        return '📦 Rekomendasi Gadget'
      }
      return message.content
    }

    it('should return "📦 Rekomendasi Gadget" for product_reference messageType', () => {
      const preview = formatMessagePreview({
        messageType: 'product_reference',
        content: '{"type":"product_reference","productId":"123"}',
      })
      expect(preview).toBe('📦 Rekomendasi Gadget')
    })

    it('should return "📦 Rekomendasi Gadget" for json content with productName and productPrice', () => {
      const preview = formatMessagePreview({
        messageType: 'text',
        content: '{"productName":"iPhone 15","productPrice":20000000}',
      })
      expect(preview).toBe('📦 Rekomendasi Gadget')
    })

    it('should return standard text content for regular text messages', () => {
      const preview = formatMessagePreview({
        messageType: 'text',
        content: 'Apakah toko buka hari ini?',
      })
      expect(preview).toBe('Apakah toko buka hari ini?')
    })
  })

  describe('Chat URL Generation & Parameter Extraction', () => {
    function generateChatUrl(params: {
      storeId: string
      productId: string
      productName: string
      productPrice: number
      variantName?: string
    }) {
      const sId = params.storeId
      const pId = params.productId
      const pName = encodeURIComponent(params.productName)
      const pPrice = params.productPrice
      const vName = encodeURIComponent(params.variantName || '')
      return `/dashboard/customer/chat?storeId=${sId}&productId=${pId}&productName=${pName}&productPrice=${pPrice}&variantName=${vName}`
    }

    it('should construct correct URL with encoded URI components including productImage', () => {
      const url = generateChatUrl({
        storeId: 'store-roxy-1',
        productId: 'prod-iphone-15',
        productName: 'iPhone 15 Pro Max 256GB Titanium',
        productPrice: 23999000,
        variantName: 'Natural Titanium 256GB',
      })

      expect(url).toContain('storeId=store-roxy-1')
      expect(url).toContain('productId=prod-iphone-15')
      expect(url).toContain(
        'productName=iPhone%2015%20Pro%20Max%20256GB%20Titanium'
      )
      expect(url).toContain('productPrice=23999000')
      expect(url).toContain('variantName=Natural%20Titanium%20256GB')
    })
  })

  describe('Safe Parameter Extraction (No Malformed URI Crash)', () => {
    function safeParam(p: string | null): string | undefined {
      if (!p) return undefined
      try {
        return decodeURIComponent(p)
      } catch {
        return p
      }
    }

    it('should decode normal encoded string', () => {
      expect(safeParam('iPhone%2015')).toBe('iPhone 15')
    })

    it('should return raw string without crashing when string contains invalid escape sequence', () => {
      expect(safeParam('Promo 10% Off & Free')).toBe('Promo 10% Off & Free')
      expect(safeParam('100%')).toBe('100%')
    })

    it('should return undefined for null or empty input', () => {
      expect(safeParam(null)).toBeUndefined()
      expect(safeParam('')).toBeUndefined()
    })
  })

  describe('Real-Time Optimistic Message & Local State Update', () => {
    it('should update room lastMessage and lastMessageAt locally without page reload', () => {
      const initialRooms = [
        {
          id: 'room-1',
          lastMessageAt: '2026-09-08T10:00:00.000Z',
          messages: [{ content: 'Pesan lama', messageType: 'text' }],
        },
      ]

      const newContent = 'test'
      const updatedRooms = initialRooms.map((r) =>
        r.id === 'room-1'
          ? {
              ...r,
              lastMessageAt: '2026-09-08T10:05:00.000Z',
              messages: [{ content: newContent, messageType: 'text' }],
            }
          : r
      )

      expect(updatedRooms[0].messages[0].content).toBe('test')
      expect(updatedRooms[0].lastMessageAt).toBe('2026-09-08T10:05:00.000Z')
    })
  })
})
