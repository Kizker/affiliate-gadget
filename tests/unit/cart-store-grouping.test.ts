import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
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

describe('Cart Store Grouping & Store Checkout Engine', () => {
  const storeA = {
    id: 'store-roxy-mas',
    name: 'PT Gadget Jaya Sentosa (Roxy Mas Pusat)',
    city: 'Jakarta Pusat',
  }

  const storeB = {
    id: 'store-bandung',
    name: 'PT Bandung Gadget Retail (BEC)',
    city: 'Bandung',
  }

  const itemA1: CartItem = {
    id: 'cart-1',
    type: 'PRODUCT',
    productId: 'prod-1',
    name: 'iPhone 15 Pro 128GB',
    price: 18999000,
    quantity: 1,
    image: '/images/iphone15.jpg',
    storeId: storeA.id,
    store: storeA,
  }

  const itemA2: CartItem = {
    id: 'cart-2',
    type: 'PRODUCT',
    productId: 'prod-2',
    name: 'iPad Pro M2 256GB',
    price: 15499000,
    quantity: 1,
    image: '/images/ipad.jpg',
    storeId: storeA.id,
    store: storeA,
  }

  const itemB1: CartItem = {
    id: 'cart-3',
    type: 'PRODUCT',
    productId: 'prod-3',
    name: 'Samsung Galaxy S24 Ultra',
    price: 21999000,
    quantity: 1,
    image: '/images/s24.jpg',
    storeId: storeB.id,
    store: storeB,
  }

  const itemFallback: CartItem = {
    id: 'cart-4',
    type: 'PRODUCT',
    productId: 'prod-4',
    name: 'Xiaomi 14 Ultra',
    price: 13999000,
    quantity: 1,
    image: '/images/xiaomi.jpg',
    storeId: null,
    store: null,
  }

  beforeEach(() => {
    useCartStore.setState({
      items: [itemA1, itemA2, itemB1, itemFallback],
      selectedItems: ['cart-1', 'cart-2', 'cart-3', 'cart-4'],
      userId: 'test-user',
      isLoading: false,
      isSyncing: false,
      buyNowItem: null,
    })
    localStorageMock.clear()
    vi.restoreAllMocks()
  })

  it('mengubah seleksi secara spesifik via setSelectedItems', () => {
    useCartStore.getState().setSelectedItems(['cart-1', 'cart-3'])
    expect(useCartStore.getState().selectedItems).toEqual(['cart-1', 'cart-3'])
  })

  it('toggleStoreSelection: membatalkan seleksi seluruh item toko jika semuanya sedang terpilih', () => {
    // Awal: cart-1, cart-2, cart-3, cart-4 terpilih
    useCartStore.getState().toggleStoreSelection(storeA.id)
    const current = useCartStore.getState().selectedItems
    // cart-1 dan cart-2 harus di-uncheck, sementara cart-3 dan cart-4 tetap terpilih
    expect(current).not.toContain('cart-1')
    expect(current).not.toContain('cart-2')
    expect(current).toContain('cart-3')
    expect(current).toContain('cart-4')
  })

  it('toggleStoreSelection: memilih semua item toko jika sebagian belum terpilih', () => {
    // Kondisi: hanya cart-1 dan cart-3 yang terpilih
    useCartStore.getState().setSelectedItems(['cart-1', 'cart-3'])
    useCartStore.getState().toggleStoreSelection(storeA.id)
    const current = useCartStore.getState().selectedItems
    // Sekarang cart-1, cart-2, dan cart-3 harus terpilih
    expect(current).toContain('cart-1')
    expect(current).toContain('cart-2')
    expect(current).toContain('cart-3')
  })

  it('selectOnlyStore: memilih HANYA item dari toko terpilih untuk checkout per toko', () => {
    // User ingin checkout toko B
    useCartStore.getState().selectOnlyStore(storeB.id)
    expect(useCartStore.getState().selectedItems).toEqual(['cart-3'])
  })

  it('selectOnlyStore: mempertahankan item yang sedang dicentang di toko tersebut jika sudah ada seleksi spesifik', () => {
    // User mencentang cart-1 saja dari toko A, dan cart-3 dari toko B
    useCartStore.getState().setSelectedItems(['cart-1', 'cart-3'])
    // User klik Checkout Toko Ini pada Toko A
    useCartStore.getState().selectOnlyStore(storeA.id)
    // Hanya cart-1 dari Toko A yang terpilih, cart-3 dari Toko B dibuang
    expect(useCartStore.getState().selectedItems).toEqual(['cart-1'])
  })

  it('selectOnlyStore: memilih semua item di toko jika belum ada satupun item di toko tersebut yang dicentang', () => {
    // User hanya mencentang cart-3 (toko B)
    useCartStore.getState().setSelectedItems(['cart-3'])
    // User klik Checkout Toko Ini pada Toko A
    useCartStore.getState().selectOnlyStore(storeA.id)
    // Toko A belum punya item terpilih, maka semua item Toko A otomatis terpilih
    expect(useCartStore.getState().selectedItems).toEqual(['cart-1', 'cart-2'])
  })

  it('selectOnlyStore pada toko fallback official-store', () => {
    useCartStore.getState().selectOnlyStore('official-store')
    expect(useCartStore.getState().selectedItems).toEqual(['cart-4'])
  })

  describe('Integrasi Antarmuka Cart Page & CartItem', () => {
    const cartPagePath = path.resolve(process.cwd(), 'src/app/cart/page.tsx')
    const cartItemPath = path.resolve(
      process.cwd(),
      'src/components/cart/cart-item.tsx'
    )

    it('CartPage mengimplementasikan storeGroups dan pilihan per toko tanpa tombol checkout per toko', () => {
      const content = fs.readFileSync(cartPagePath, 'utf-8')
      expect(content).toContain('storeGroups')
      expect(content).toContain('toggleStoreSelection')
      expect(content).toContain('Store')
      expect(content).toContain('MapPin')
      expect(content).toContain('embedded')
      expect(content).not.toContain('Checkout Toko Ini')
    })

    it('CartItem mendukung prop embedded untuk rendering mulus dalam grup toko', () => {
      const content = fs.readFileSync(cartItemPath, 'utf-8')
      expect(content).toContain('embedded?: boolean')
      expect(content).toContain('embedded = false')
      expect(content).toContain('embedded')
    })
  })
})
