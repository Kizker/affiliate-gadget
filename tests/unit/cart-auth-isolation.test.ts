import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCartStore } from '../../src/lib/store/cart-store'

// Mock in-memory localStorage for Node test environment
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

// Attach to global
vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('window', { localStorage: localStorageMock })

describe('Cart Store Authentication & Storage Isolation', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      selectedItems: [],
      userId: null,
      isLoading: false,
      isSyncing: false,
    })
    localStorageMock.clear()
    vi.restoreAllMocks()
  })

  it('should clear all items and remove storage when setUserId(null) is called', async () => {
    // Seed some items into the store
    useCartStore.setState({
      items: [
        {
          id: 'item-1',
          type: 'PRODUCT',
          productId: 'prod-1',
          name: 'iPhone 15 Pro Max',
          image: '/images/iphone-15.jpg',
          price: 22999000,
          quantity: 1,
        },
      ],
      selectedItems: ['item-1'],
      userId: null,
    })

    localStorage.setItem(
      'affiliate-gadget-cart-storage',
      JSON.stringify({ test: 123 })
    )

    // Call setUserId(null)
    await useCartStore.getState().setUserId(null)

    const state = useCartStore.getState()
    expect(state.items).toEqual([])
    expect(state.selectedItems).toEqual([])
    expect(state.userId).toBeNull()
    expect(localStorage.getItem('affiliate-gadget-cart-storage')).toBeNull()
  })

  it('should clear storage and items when clearCart is called', async () => {
    useCartStore.setState({
      items: [
        {
          id: 'item-2',
          type: 'PRODUCT',
          productId: 'prod-2',
          name: 'Samsung Galaxy S24 Ultra',
          image: '/images/s24-ultra.jpg',
          price: 19999000,
          quantity: 1,
        },
      ],
      selectedItems: ['item-2'],
      userId: null,
    })

    localStorage.setItem(
      'affiliate-gadget-cart-storage',
      JSON.stringify({ item: 'sample' })
    )

    await useCartStore.getState().clearCart()

    const state = useCartStore.getState()
    expect(state.items).toEqual([])
    expect(state.selectedItems).toEqual([])
    expect(localStorage.getItem('affiliate-gadget-cart-storage')).toBeNull()
  })

  it('should wipe local state and fetch fresh data from server when user logs in', async () => {
    const fakeServerCart = {
      items: [
        {
          id: 'server-item-1',
          type: 'PRODUCT',
          productId: 'prod-server',
          name: 'MacBook Air M3',
          image: '/images/macbook.jpg',
          price: 18000000,
          quantity: 1,
        },
      ],
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeServerCart,
    } as Response)

    // User logs in with user-123
    await useCartStore.getState().setUserId('user-123')

    const state = useCartStore.getState()
    expect(state.userId).toBe('user-123')
    expect(state.items).toHaveLength(1)
    expect(state.items[0].name).toBe('MacBook Air M3')
    expect(state.selectedItems).toContain('server-item-1')
  })
})
