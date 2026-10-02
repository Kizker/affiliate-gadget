'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useWishlistSafe } from '@/lib/store/wishlist-store'

interface ProductCardProps {
  id: string
  title: string
  image: string
  price?: number
  priceRange?: { min: number; max: number }
  rating?: number
  reviewCount?: number
  badge?: string
  badgeColor?: 'green' | 'blue' | 'orange' | 'red'
  description?: string
  href: string
  actionLabel?: string
  onAction?: () => void
  imageAspect?: string // Optional aspect ratio prop
  priority?: boolean // New prop for LCP optimization
}

export function ProductCard({
  id,
  title,
  image,
  price,
  priceRange,
  rating,
  reviewCount,
  badge,
  badgeColor = 'green',
  description,
  href,
  imageAspect = 'aspect-[3/4]', // Default layout stability
  priority = false, // Default to lazy loading
}: ProductCardProps) {
  const { isInWishlist, toggleItem } = useWishlistSafe()
  const isWishlisted = isInWishlist(id)

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const wasAdded = toggleItem({
      id,
      name: title,
      price: price ?? priceRange?.min ?? 0,
      image,
      href,
      rating,
      reviewCount,
    })
    if (wasAdded) {
      toast.success(`Ditambahkan ke Wishlist: ${title}`)
    } else {
      toast.info(`Dihapus dari Wishlist: ${title}`)
    }
  }

  const badgeColors = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-xl shadow-md transition-shadow hover:shadow-xl ${imageAspect}`}
    >
      {/* Top-Right: Wishlist Love Button */}
      <button
        type="button"
        onClick={handleWishlistClick}
        className="group/wish absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white/90 shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-rose-300 hover:bg-rose-500/80 hover:text-white active:scale-90"
        aria-label="Wishlist"
        title={isWishlisted ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            isWishlisted
              ? 'fill-rose-500 text-rose-500 group-hover/wish:fill-white group-hover/wish:text-white'
              : 'text-white/90 group-hover/wish:text-white'
          }`}
        />
      </button>

      <Link href={href} className="block h-full w-full">
        <Image
          src={image}
          alt={title}
          fill
          priority={priority} // Use priority for LCP images
          quality={60} // Reduce quality for thumbnails
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" // Optimized for 2-col mobile, 3-col tablet, 4-col desktop
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Badge (Top Left) */}
        {badge && (
          <div
            className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${badgeColors[badgeColor]}`}
          >
            {badge}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        {/* Content overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="mb-1.5 line-clamp-2 text-base font-bold text-white">
            {title}
          </h3>
          {description && (
            <p className="mb-2 line-clamp-1 text-sm text-gray-200">
              {description}
            </p>
          )}
          {/* Rating */}
          {rating !== undefined && (
            <div className="mb-2 flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-sm font-medium text-white">
                {rating.toFixed(1)}
              </span>
              {reviewCount !== undefined && (
                <span className="text-xs text-gray-300">({reviewCount})</span>
              )}
            </div>
          )}
          {/* Price */}
          {priceRange ? (
            <p className="text-base font-bold text-cyan-400">
              Rp {priceRange.min.toLocaleString('id-ID')} -{' '}
              {priceRange.max.toLocaleString('id-ID')}
            </p>
          ) : price !== undefined ? (
            <p className="text-base font-bold text-cyan-400">
              Rp {price.toLocaleString('id-ID')}
            </p>
          ) : null}
        </div>
      </Link>
    </div>
  )
}
