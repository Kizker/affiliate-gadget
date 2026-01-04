import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, CartSummary } from '@/types/cart'

interface CartStore {
  items: CartItem[]
  selectedItems: string[]
  userId: string | null
  isLoading: boolean
  isSyncing: boolean
  setUserId: (userId: string | null) => void
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  removeSelectedItems: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getCartSummary: () => CartSummary
  toggleItemSelection: (id: string) => void
  selectAllItems: () => void
  deselectAllItems: () => void
  getSelectedItems: () => CartItem[]
  getSelectedSummary: () => CartSummary
  syncFromServer: () => Promise<void>
  setItems: (items: CartItem[]) => void
}

// Debounce helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }
}

// Sync item to server (debounced to avoid too many requests)
const syncItemToServerFn = async (
  action: 'add' | 'update' | 'remove',
  item: Partial<CartItem> & { id?: string; quantity?: number }
): Promise<void> => {
  try {
    if (action === 'add') {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: item.type,
          productId: item.productId,
          rentalItemId: item.rentalItemId,
          serviceId: item.serviceId,
          quantity: item.quantity,
          rentalDays: item.rentalDays,
        }),
      })
    } else if (action === 'update' && item.id) {
      await fetch(`/api/cart/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: item.quantity }),
      })
    } else if (action === 'remove' && item.id) {
      await fetch(`/api/cart/${item.id}`, {
        method: 'DELETE',
      })
    }
  } catch (error) {
    console.error('Error syncing cart:', error)
  }
}

// Wrap with debounce
const syncItemToServer = debounce(
  (
    action: 'add' | 'update' | 'remove',
    item: Partial<CartItem> & { id?: string; quantity?: number }
  ) => {
    syncItemToServerFn(action, item)
  },
  500
)

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      selectedItems: [],
      userId: null,
      isLoading: false,
      isSyncing: false,

      setUserId: async (userId) => {
        const currentUserId = get().userId

        if (currentUserId === userId) return // No change

        if (userId) {
          // User is logging in - fetch cart from server
          set({ userId, isLoading: true })
          try {
            const res = await fetch('/api/cart')
            if (res.ok) {
              const data = await res.json()
              set({
                items: data.items || [],
                selectedItems: (data.items || []).map(
                  (item: CartItem) => item.id
                ),
                isLoading: false,
              })
            } else {
              set({ isLoading: false })
            }
          } catch (error) {
            console.error('Error fetching cart:', error)
            set({ isLoading: false })
          }
        } else {
          // User is logging out - clear local cart but keep server cart intact
          set({ items: [], selectedItems: [], userId: null })
        }
      },

      syncFromServer: async () => {
        const userId = get().userId
        if (!userId) return

        set({ isLoading: true })
        try {
          const res = await fetch('/api/cart')
          if (res.ok) {
            const data = await res.json()
            set({
              items: data.items || [],
              selectedItems: (data.items || []).map(
                (item: CartItem) => item.id
              ),
              isLoading: false,
            })
          }
        } catch (error) {
          console.error('Error syncing cart:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      setItems: (items) => {
        set({ items, selectedItems: items.map((item) => item.id) })
      },

      addItem: (item) => {
        const items = get().items
        const existingItem = items.find(
          (i) =>
            i.type === item.type &&
            i.productId === item.productId &&
            i.rentalItemId === item.rentalItemId &&
            i.serviceId === item.serviceId
        )

        if (existingItem) {
          // Update quantity if item already exists
          const newQuantity = existingItem.quantity + item.quantity
          set({
            items: items.map((i) =>
              i.id === existingItem.id ? { ...i, quantity: newQuantity } : i
            ),
          })
          // Sync to server
          if (get().userId) {
            syncItemToServer('update', {
              id: existingItem.id,
              quantity: newQuantity,
            })
          }
        } else {
          // Add new item and auto-select it
          const newItem: CartItem = {
            ...item,
            id: `${item.type}-${item.productId || item.rentalItemId || item.serviceId}-${Date.now()}`,
          }
          set({
            items: [...items, newItem],
            selectedItems: [...get().selectedItems, newItem.id],
          })
          // Sync to server
          if (get().userId) {
            syncItemToServer('add', newItem)
          }
        }
      },

      removeItem: (id) => {
        const userId = get().userId
        set({
          items: get().items.filter((item) => item.id !== id),
          selectedItems: get().selectedItems.filter((itemId) => itemId !== id),
        })
        // Sync to server
        if (userId) {
          syncItemToServer('remove', { id })
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id)
          return
        }

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        })
        // Sync to server
        if (get().userId) {
          syncItemToServer('update', { id, quantity })
        }
      },

      clearCart: async () => {
        const userId = get().userId
        set({ items: [], selectedItems: [] })
        // Sync to server
        if (userId) {
          try {
            await fetch('/api/cart', { method: 'DELETE' })
          } catch (error) {
            console.error('Error clearing cart:', error)
          }
        }
      },

      removeSelectedItems: async () => {
        const selectedIds = get().selectedItems
        const userId = get().userId

        set({
          items: get().items.filter((item) => !selectedIds.includes(item.id)),
          selectedItems: [],
        })

        // Sync to server - remove each selected item
        if (userId) {
          for (const id of selectedIds) {
            try {
              await fetch(`/api/cart/${id}`, { method: 'DELETE' })
            } catch (error) {
              console.error('Error removing item:', error)
            }
          }
        }
      },

      toggleItemSelection: (id) => {
        const selectedItems = get().selectedItems
        if (selectedItems.includes(id)) {
          set({
            selectedItems: selectedItems.filter((itemId) => itemId !== id),
          })
        } else {
          set({ selectedItems: [...selectedItems, id] })
        }
      },

      selectAllItems: () => {
        set({ selectedItems: get().items.map((item) => item.id) })
      },

      deselectAllItems: () => {
        set({ selectedItems: [] })
      },

      getSelectedItems: () => {
        const selectedIds = get().selectedItems
        return get().items.filter((item) => selectedIds.includes(item.id))
      },

      getSelectedSummary: () => {
        const selectedItems = get().getSelectedItems()
        const subtotal = selectedItems.reduce((total, item) => {
          const itemPrice = item.rentalDays
            ? item.price * item.rentalDays * item.quantity
            : item.price * item.quantity
          return total + itemPrice
        }, 0)
        const tax = 0
        const total = subtotal
        const itemCount = selectedItems.reduce(
          (count, item) => count + item.quantity,
          0
        )

        return {
          subtotal,
          tax,
          total,
          itemCount,
        }
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const itemPrice = item.rentalDays
            ? item.price * item.rentalDays * item.quantity
            : item.price * item.quantity
          return total + itemPrice
        }, 0)
      },

      getCartSummary: () => {
        const subtotal = get().getTotalPrice()
        const tax = 0
        const total = subtotal
        const itemCount = get().getTotalItems()

        return {
          subtotal,
          tax,
          total,
          itemCount,
        }
      },
    }),
    {
      name: 'halotekno-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        selectedItems: state.selectedItems,
        userId: state.userId,
      }),
    }
  )
)
