import { Metadata } from 'next'
import WishlistClient from './wishlist-client'

export const metadata: Metadata = {
  title: 'Wishlist Saya | Affiliate Gadget',
  description: 'Daftar produk smartphone second pilihan favorit Anda',
}

export default function WishlistPage() {
  return <WishlistClient />
}
