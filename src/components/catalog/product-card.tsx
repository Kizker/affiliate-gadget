import Link from 'next/link'
import Image from 'next/image'

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
        {/* Badge */}
        {badge && (
          <div
            className={`absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${badgeColors[badgeColor]}`}
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
