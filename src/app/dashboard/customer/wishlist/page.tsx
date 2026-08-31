import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Wishlist | Affiliate Gadget',
  description: 'Daftar keinginan produk dan jasa servis Anda',
}

export default function WishlistPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Wishlist</h2>
          <p className="text-muted-foreground">
            Simpan produk dan layanan favorit Anda di sini
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Fitur wishlist sedang dalam pengembangan. Segera hadir untuk
            memudahkan Anda menyimpan layanan dan produk favorit.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
