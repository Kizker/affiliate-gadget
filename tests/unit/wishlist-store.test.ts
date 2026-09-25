import { describe, it, expect, beforeEach } from 'vitest'
import { useWishlistStore, WishlistItem } from '@/lib/store/wishlist-store'

describe('Customer Wishlist Store (Zustand + LocalStorage)', () => {
  beforeEach(() => {
    useWishlistStore.getState().clearWishlist()
  })

  const dummyGadget1: WishlistItem = {
    id: 'prod-iphone-15-pro-max',
    name: 'iPhone 15 Pro Max 8GB/1TB White Titanium',
    price: 26999000,
    originalPrice: 28999000,
    images: ['https://images.unsplash.com/photo-iphone.jpg'],
    conditionBadge: 'Like New 99%',
    originCity: 'Jakarta Pusat',
    rating: 5.0,
    reviewCount: 14,
  }

  const dummyGadget2: WishlistItem = {
    id: 'prod-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra 12GB/512GB Titanium Gray',
    price: 21999000,
    images: ['https://images.unsplash.com/photo-s24.jpg'],
    conditionBadge: 'Like New 99%',
    originCity: 'Surabaya',
    rating: 5.0,
    reviewCount: 9,
  }

  it('should initialize with empty items', () => {
    const state = useWishlistStore.getState()
    expect(state.items).toEqual([])
    expect(state.getTotalItems()).toBe(0)
  })

  it('should add item to wishlist successfully', () => {
    const store = useWishlistStore.getState()
    store.addItem(dummyGadget1)

    const updated = useWishlistStore.getState()
    expect(updated.items.length).toBe(1)
    expect(updated.items[0].id).toBe('prod-iphone-15-pro-max')
    expect(updated.items[0].name).toBe('iPhone 15 Pro Max 8GB/1TB White Titanium')
    expect(updated.isInWishlist('prod-iphone-15-pro-max')).toBe(true)
    expect(updated.getTotalItems()).toBe(1)
  })

  it('should prevent duplicate items from being added via addItem', () => {
    const store = useWishlistStore.getState()
    store.addItem(dummyGadget1)
    store.addItem(dummyGadget1)

    const updated = useWishlistStore.getState()
    expect(updated.items.length).toBe(1)
  })

  it('should toggle item in and out of wishlist', () => {
    const store = useWishlistStore.getState()

    // 1st toggle: Add
    const added = store.toggleItem(dummyGadget1)
    expect(added).toBe(true)
    expect(useWishlistStore.getState().isInWishlist(dummyGadget1.id)).toBe(true)
    expect(useWishlistStore.getState().getTotalItems()).toBe(1)

    // 2nd toggle: Remove
    const removed = store.toggleItem(dummyGadget1)
    expect(removed).toBe(false)
    expect(useWishlistStore.getState().isInWishlist(dummyGadget1.id)).toBe(false)
    expect(useWishlistStore.getState().getTotalItems()).toBe(0)
  })

  it('should remove specific item by id', () => {
    const store = useWishlistStore.getState()
    store.addItem(dummyGadget1)
    store.addItem(dummyGadget2)
    expect(useWishlistStore.getState().getTotalItems()).toBe(2)

    store.removeItem(dummyGadget1.id)
    const updated = useWishlistStore.getState()
    expect(updated.items.length).toBe(1)
    expect(updated.items[0].id).toBe('prod-s24-ultra')
    expect(updated.isInWishlist(dummyGadget1.id)).toBe(false)
    expect(updated.isInWishlist(dummyGadget2.id)).toBe(true)
  })

  it('should clear all items from wishlist', () => {
    const store = useWishlistStore.getState()
    store.addItem(dummyGadget1)
    store.addItem(dummyGadget2)
    expect(useWishlistStore.getState().getTotalItems()).toBe(2)

    store.clearWishlist()
    const updated = useWishlistStore.getState()
    expect(updated.items).toEqual([])
    expect(updated.getTotalItems()).toBe(0)
  })

  it('should isolate wishlist items between different user accounts', () => {
    const store = useWishlistStore.getState()

    // User A logs in and adds dummyGadget1
    store.setUserId('user-a-123')
    store.addItem(dummyGadget1)
    expect(useWishlistStore.getState().items.length).toBe(1)
    expect(useWishlistStore.getState().isInWishlist(dummyGadget1.id)).toBe(true)

    // User B (brand new account) logs in
    store.setUserId('user-b-456')
    expect(useWishlistStore.getState().items.length).toBe(0)
    expect(useWishlistStore.getState().isInWishlist(dummyGadget1.id)).toBe(false)

    // User B adds dummyGadget2
    store.addItem(dummyGadget2)
    expect(useWishlistStore.getState().items.length).toBe(1)
    expect(useWishlistStore.getState().isInWishlist(dummyGadget2.id)).toBe(true)

    // Switch back to User A -> should restore User A's items
    store.setUserId('user-a-123')
    expect(useWishlistStore.getState().items.length).toBe(1)
    expect(useWishlistStore.getState().isInWishlist(dummyGadget1.id)).toBe(true)
    expect(useWishlistStore.getState().isInWishlist(dummyGadget2.id)).toBe(false)
  })

  it('should ensure newly authenticated user starts with empty wishlist', () => {
    const store = useWishlistStore.getState()

    // Guest adds items before logging in
    store.setUserId(null)
    store.addItem(dummyGadget1)
    expect(useWishlistStore.getState().items.length).toBe(1)

    // New Google account logs in with new userId
    store.setUserId('google-user-new-789')
    expect(useWishlistStore.getState().items.length).toBe(0)
    expect(useWishlistStore.getState().items).toEqual([])
    expect(useWishlistStore.getState().getTotalItems()).toBe(0)
  })
})
