'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

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
  userWishlists: Record<string, WishlistItem[]>
  userId: string | null
  setUserId: (userId: string | null) => void
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
      userWishlists: {},
      userId: null,

      setUserId: (userId) => {
        const state = get()
        const currentActiveKey = state.userId || 'guest'

        // Save current items into previous user's bucket
        const updatedWishlists = {
          ...state.userWishlists,
          [currentActiveKey]: state.items,
        }

        const newKey = userId || 'guest'
        const nextItems = updatedWishlists[newKey] || []

        set({
          userId: userId || null,
          userWishlists: updatedWishlists,
          items: nextItems,
        })
      },

      addItem: (newItem) => {
        const state = get()
        const currentItems = state.items
        if (!currentItems.some((i) => i.id === newItem.id)) {
          const itemWithDate: WishlistItem = {
            ...newItem,
            addedAt: newItem.addedAt || new Date().toISOString(),
          }
          const nextItems = [itemWithDate, ...currentItems]
          const activeKey = state.userId || 'guest'

          set({
            items: nextItems,
            userWishlists: {
              ...state.userWishlists,
              [activeKey]: nextItems,
            },
          })
        }
      },

      removeItem: (id) => {
        const state = get()
        const nextItems = state.items.filter((i) => i.id !== id)
        const activeKey = state.userId || 'guest'

        set({
          items: nextItems,
          userWishlists: {
            ...state.userWishlists,
            [activeKey]: nextItems,
          },
        })
      },

      toggleItem: (item) => {
        const state = get()
        const currentItems = state.items
        const exists = currentItems.some((i) => i.id === item.id)
        const activeKey = state.userId || 'guest'

        if (exists) {
          const nextItems = currentItems.filter((i) => i.id !== item.id)
          set({
            items: nextItems,
            userWishlists: {
              ...state.userWishlists,
              [activeKey]: nextItems,
            },
          })
          return false
        } else {
          const itemWithDate: WishlistItem = {
            ...item,
            addedAt: item.addedAt || new Date().toISOString(),
          }
          const nextItems = [itemWithDate, ...currentItems]
          set({
            items: nextItems,
            userWishlists: {
              ...state.userWishlists,
              [activeKey]: nextItems,
            },
          })
          return true
        }
      },

      isInWishlist: (id) => {
        return get().items.some((i) => i.id === id)
      },

      clearWishlist: () => {
        const state = get()
        const activeKey = state.userId || 'guest'
        set({
          items: [],
          userWishlists: {
            ...state.userWishlists,
            [activeKey]: [],
          },
        })
      },

      getTotalItems: () => {
        return get().items.length
      },
    }),
    {
      name: 'affiliate-gadget-wishlist-storage',
      version: 2,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1 || !persistedState?.userWishlists) {
          // Migration from un-isolated v1 storage:
          // Keep old unauthenticated items under 'guest' bucket
          // so newly logged-in accounts (e.g. Google) start completely clean
          return {
            ...persistedState,
            userId: null,
            userWishlists: {
              guest: Array.isArray(persistedState?.items) ? persistedState.items : [],
            },
            items: [], // Start empty for clean authentication session
          }
        }
        return persistedState
      },
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
 * Hydration-safe wrapper hook for SSR / Next.js with automatic user session synchronization
 */
export function useWishlistSafe() {
  const store = useWishlistStore()
  const [mounted, setMounted] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      store.setUserId(session.user.id)
    } else if (status === 'unauthenticated') {
      store.setUserId(null)
    }
  }, [status, session?.user?.id])

  return {
    ...store,
    items: mounted ? store.items : [],
    totalCount: mounted ? store.items.length : 0,
    mounted,
  }
}
