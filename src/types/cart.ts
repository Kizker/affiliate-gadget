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
  stock?: number | null
  weightGram?: number // Berat produk dalam gram
  pricePerKg?: number // Tarif dasar ongkir per kg
  notes?: string
  depositAmount?: number
  storeId?: string | null
  store?: {
    id: string
    name: string
    city?: string | null
    province?: string | null
    address?: string | null
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
  } | null
}

export interface CartSummary {
  subtotal: number
  tax: number
  total: number
  itemCount: number
}

export type CartItemType = 'PRODUCT' | 'RENTAL' | 'SERVICE'
