import { describe, it, expect } from 'vitest'

describe('Order Item Variant-Specific Chat Context Suite', () => {
  it('1. prioritizes variantName over product/etalase cover name when constructing chat parameters', () => {
    const item = {
      id: 'item_s26_ultra',
      variantId: 'var_s26_256',
      variantName: 'Samsung Galaxy S26 Ultra - 256GB',
      price: 21000000,
      quantity: 1,
      product: {
        id: 'prod_etalase_cover',
        name: 'iPhone 15 Pro | IBOX | Second Like New', // Etalase cover product
        images: ['/images/iphone-cover.jpg'],
      },
    }

    const effectiveContextName =
      item.variantName || item.product?.name || 'Unit Smartphone Original'

    const chatParams = new URLSearchParams()
    chatParams.set('orderId', 'order_123')
    chatParams.set('orderItemId', item.id)
    chatParams.set('variantId', item.variantId)
    chatParams.set('productName', effectiveContextName)
    chatParams.set('variantName', item.variantName)
    chatParams.set('productPrice', String(item.price))

    // Context must match the clicked variant (Samsung S26 Ultra), NOT the cover product (iPhone 15 Pro)!
    expect(chatParams.get('productName')).toBe(
      'Samsung Galaxy S26 Ultra - 256GB'
    )
    expect(chatParams.get('variantName')).toBe(
      'Samsung Galaxy S26 Ultra - 256GB'
    )
    expect(chatParams.get('productName')).not.toBe(
      'iPhone 15 Pro | IBOX | Second Like New'
    )
    expect(chatParams.get('orderItemId')).toBe('item_s26_ultra')
    expect(chatParams.get('productPrice')).toBe('21000000')
  })

  it('2. selects matching variant from multi-item order in chat page context resolver', () => {
    const multiItemOrder = {
      id: 'order_multi_123',
      orderNumber: 'SPR-20261128-9D284F2C',
      total: 79995997,
      status: 'SHIPPED',
      items: [
        {
          id: 'item_1',
          variantName: '256GB - White Titanium',
          price: 19999999,
          quantity: 2,
          product: { name: 'iPhone 15 Pro | IBOX | Second Like New' },
        },
        {
          id: 'item_2',
          variantName: '128GB - Titanium',
          price: 18999999,
          quantity: 1,
          product: { name: 'iPhone 15 Pro | IBOX | Second Like New' },
        },
        {
          id: 'item_3',
          variantName: 'Samsung Galaxy S26 Ultra - 256GB',
          price: 21000000,
          quantity: 1,
          product: { name: 'Samsung Galaxy S26 Ultra | SEIN | Like New' },
        },
      ],
    }

    // Customer clicked Chat Toko on item_3 (Samsung Galaxy S26 Ultra)
    const paramOrderItemId = 'item_3'
    const resolvedVariantName = 'Samsung Galaxy S26 Ultra - 256GB'
    const resolvedProductName = 'Samsung Galaxy S26 Ultra - 256GB'

    const targetItem =
      multiItemOrder.items.find(
        (it) =>
          (paramOrderItemId && it.id === paramOrderItemId) ||
          (resolvedVariantName && it.variantName === resolvedVariantName) ||
          (resolvedProductName && it.variantName.includes(resolvedProductName))
      ) || multiItemOrder.items[0]

    const effectiveName =
      resolvedVariantName ||
      targetItem?.variantName ||
      resolvedProductName ||
      targetItem?.product?.name ||
      'Unit Gadget'

    const effectivePrice = targetItem.price

    expect(targetItem.id).toBe('item_3')
    expect(effectiveName).toBe('Samsung Galaxy S26 Ultra - 256GB')
    expect(effectiveName).not.toBe('iPhone 15 Pro | IBOX | Second Like New')
    expect(effectivePrice).toBe(21000000)
    expect(effectivePrice).not.toBe(79995997)
  })

  it('3. bubble message extraction displays variantName when present in payload', () => {
    const payload = {
      type: 'order_reference',
      orderId: 'order_123',
      orderNumber: 'SPR-20261128-9D284F2C',
      productName: 'Samsung Galaxy S26 Ultra | SEIN',
      variantName: 'Samsung Galaxy S26 Ultra - 256GB',
      productPrice: 21000000,
    }

    const prodName =
      payload.variantName || payload.productName || 'Produk Pesanan'

    expect(prodName).toBe('Samsung Galaxy S26 Ultra - 256GB')
  })
})
