'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useState, useEffect } from 'react'

export interface WishlistItem {
  id: string
  name: string
  price: number | string
  originalPrice?: number | string
  image?: string
  images?: string[]
  href?: string
  conditionBadge?: string
  conditionBadgeColor?: string
  rating?: number
  reviewCount?: number
  originCity?: string
  storeName?: string
  addedAt?: string
}

interface WishlistStore {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  toggleItem: (item: WishlistItem) => boolean
  isInWishlist: (id: string) => boolean
  clearWishlist: () => void
  getTotalItems: () => number
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const currentItems = get().items
        if (!currentItems.some((i) => i.id === newItem.id)) {
          set({
            items: [
              {
                ...newItem,
                addedAt: newItem.addedAt || new Date().toISOString(),
              },
              ...currentItems,
            ],
          })
        }
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((i) => i.id !== id),
        })
      },

      toggleItem: (item) => {
        const currentItems = get().items
        const exists = currentItems.some((i) => i.id === item.id)
        if (exists) {
          set({
            items: currentItems.filter((i) => i.id !== item.id),
          })
          return false
        } else {
          set({
            items: [
              {
                ...item,
                addedAt: item.addedAt || new Date().toISOString(),
              },
              ...currentItems,
            ],
          })
          return true
        }
      },

      isInWishlist: (id) => {
        return get().items.some((i) => i.id === id)
      },

      clearWishlist: () => {
        set({ items: [] })
      },

      getTotalItems: () => {
        return get().items.length
      },
    }),
    {
      name: 'affiliate-gadget-wishlist-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
    }
  )
)

/**
 * Hydration-safe wrapper hook for SSR / Next.js
 */
export function useWishlistSafe() {
  const store = useWishlistStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return {
    ...store,
    items: mounted ? store.items : [],
    totalCount: mounted ? store.items.length : 0,
    mounted,
  }
}
