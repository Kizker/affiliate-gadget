export interface CartItem {
  id: string
  type: 'PRODUCT' | 'RENTAL' | 'SERVICE'
  productId?: string
  variantId?: string
  variantName?: string
  rentalItemId?: string
  serviceId?: string
  name: string
  image: string
  price: number
  quantity: number
  rentalDays?: number
  stock?: number
  notes?: string
  depositAmount?: number
}

export interface CartSummary {
  subtotal: number
  tax: number
  total: number
  itemCount: number
}

export type CartItemType = 'PRODUCT' | 'RENTAL' | 'SERVICE'
