import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, CartSummary } from '@/types/cart'

interface CartStore {
  items: CartItem[]
  selectedItems: string[] // Array of selected item IDs
  userId: string | null
  setUserId: (userId: string | null) => void
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getCartSummary: () => CartSummary
  toggleItemSelection: (id: string) => void
  selectAllItems: () => void
  deselectAllItems: () => void
  getSelectedItems: () => CartItem[]
  getSelectedSummary: () => CartSummary
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      selectedItems: [],
      userId: null,

      setUserId: (userId) => {
        const currentUserId = get().userId
        // Clear cart when user changes (logout or different user login)
        if (currentUserId !== userId) {
          set({ items: [], selectedItems: [], userId })
        }
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
          set({
            items: items.map((i) =>
              i.id === existingItem.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
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
        }
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
          selectedItems: get().selectedItems.filter((itemId) => itemId !== id),
        })
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
      },

      clearCart: () => {
        set({ items: [], selectedItems: [] })
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
        const tax = subtotal * 0.11 // 11% PPN
        const total = subtotal + tax
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
        const tax = subtotal * 0.11 // 11% PPN
        const total = subtotal + tax
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
      // Persist items, selectedItems, and userId
      partialize: (state) => ({
        items: state.items,
        selectedItems: state.selectedItems,
        userId: state.userId,
      }),
    }
  )
)
