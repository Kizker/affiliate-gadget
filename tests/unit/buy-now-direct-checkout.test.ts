import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCartStore } from '../../src/lib/store/cart-store'
import type { CartItem } from '../../src/types/cart'

// Mock in-memory localStorage & sessionStorage
const storageMock: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => storageMock[key] ?? null,
  setItem: (key: string, val: string) => {
    storageMock[key] = val
  },
  removeItem: (key: string) => {
    delete storageMock[key]
  },
  clear: () => {
    for (const k in storageMock) delete storageMock[k]
  },
}

vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('sessionStorage', localStorageMock)
vi.stubGlobal('window', {
  localStorage: localStorageMock,
  sessionStorage: localStorageMock,
})

describe('Buy Now (Direct Checkout) Engine', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      selectedItems: [],
      userId: null,
      isLoading: false,
      isSyncing: false,
      buyNowItem: null,
    })
    localStorageMock.clear()
    vi.restoreAllMocks()
  })

  it('should store buyNowItem directly without adding it to the cart items list', () => {
    const directItem: CartItem = {
      id: 'buynow-iphone-15-1tb',
      type: 'PRODUCT',
      productId: 'prod-iphone-15',
      variantId: 'var-1tb-white',
      variantName: '8GB/1TB White Titanium',
      name: 'iPhone 15 Pro Max (8GB/1TB White Titanium)',
      price: 30999000,
      image: '/images/iphone-15-white.jpg',
      quantity: 1,
      stock: 3,
      weightGram: 500,
      pricePerKg: 20000,
      notes: '30 Hari Garansi Toko + Free Bonus 3-in-1',
    }

    // Set Buy Now item
    useCartStore.getState().setBuyNowItem(directItem)

    const state = useCartStore.getState()
    // 1. buyNowItem is stored
    expect(state.buyNowItem).toEqual(directItem)
    expect(state.buyNowItem?.variantName).toBe('8GB/1TB White Titanium')
    expect(state.buyNowItem?.price).toBe(30999000)

    // 2. Regular cart items must remain completely empty!
    expect(state.items.length).toBe(0)
    expect(state.selectedItems.length).toBe(0)
  })

  it('should not mutate existing cart items when user executes Buy Now on another item', () => {
    // Existing cart has a MacBook
    const macbookCartItem: CartItem = {
      id: 'cart-item-macbook',
      type: 'PRODUCT',
      productId: 'prod-macbook',
      name: 'MacBook Pro M3',
      price: 28999000,
      image: '/images/macbook.jpg',
      quantity: 1,
      stock: 2,
    }

    useCartStore.setState({
      items: [macbookCartItem],
      selectedItems: [macbookCartItem.id],
    })

    // User triggers Buy Now on an iPad
    const ipadBuyNowItem: CartItem = {
      id: 'buynow-ipad-pro',
      type: 'PRODUCT',
      productId: 'prod-ipad',
      name: 'iPad Pro M4',
      price: 18999000,
      image: '/images/ipad.jpg',
      quantity: 1,
      stock: 5,
    }

    useCartStore.getState().setBuyNowItem(ipadBuyNowItem)

    const state = useCartStore.getState()
    // Regular cart still has only 1 item (MacBook)
    expect(state.items.length).toBe(1)
    expect(state.items[0].name).toBe('MacBook Pro M3')

    // Buy now item is isolated to iPad
    expect(state.buyNowItem).toEqual(ipadBuyNowItem)
    expect(state.buyNowItem?.name).toBe('iPad Pro M4')
  })

  it('should clear buyNowItem when clearBuyNowItem is called after successful checkout', () => {
    const directItem: CartItem = {
      id: 'buynow-s24-ultra',
      type: 'PRODUCT',
      productId: 'prod-s24',
      name: 'Samsung Galaxy S24 Ultra',
      price: 21999000,
      image: '/images/s24.jpg',
      quantity: 1,
    }

    useCartStore.getState().setBuyNowItem(directItem)
    expect(useCartStore.getState().buyNowItem).not.toBeNull()

    useCartStore.getState().clearBuyNowItem()
    expect(useCartStore.getState().buyNowItem).toBeNull()
  })

  it('should clear buyNowItem when user logs out (setUserId(null))', async () => {
    useCartStore.setState({
      userId: 'user-123',
      buyNowItem: {
        id: 'buynow-item',
        type: 'PRODUCT',
        productId: 'prod-123',
        name: 'Pixel 9 Pro',
        price: 16999000,
        image: '/images/pixel.jpg',
        quantity: 1,
      },
    })

    await useCartStore.getState().setUserId(null)
    expect(useCartStore.getState().buyNowItem).toBeNull()
  })
})
