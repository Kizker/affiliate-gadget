import Link from 'next/link'

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
  actionLabel = 'Lihat Detail',
}: ProductCardProps) {
  const badgeColors = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
  }

  return (
    <>
      {/* Mobile: Overlay style - image with text overlay at bottom */}
      <div className="group relative overflow-hidden rounded-xl md:hidden">
        <Link href={href} className="block">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          {/* Content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-white">
              {title}
            </h3>
            {description && (
              <p className="mb-1 line-clamp-1 text-xs text-gray-200">
                {description}
              </p>
            )}
            {/* Rating */}
            {rating !== undefined && (
              <div className="mb-1 flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                <span className="text-xs font-medium text-white">
                  {rating.toFixed(1)}
                </span>
                {reviewCount !== undefined && (
                  <span className="text-xs text-gray-300">({reviewCount})</span>
                )}
              </div>
            )}
            {/* Price */}
            {priceRange ? (
              <p className="text-sm font-bold text-cyan-400">
                Rp {priceRange.min.toLocaleString('id-ID')} -{' '}
                {priceRange.max.toLocaleString('id-ID')}
              </p>
            ) : price !== undefined ? (
              <p className="text-sm font-bold text-cyan-400">
                Rp {price.toLocaleString('id-ID')}
              </p>
            ) : null}
          </div>
        </Link>
      </div>

      {/* Desktop: Regular card style */}
      <div className="group hidden overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg md:block">
        {/* Image */}
        <Link
          href={href}
          className="relative block aspect-square overflow-hidden bg-gray-100"
        >
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {badge && (
            <div
              className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${badgeColors[badgeColor]}`}
            >
              {badge}
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="p-4">
          <Link href={href}>
            <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900 transition-colors hover:text-blue-600">
              {title}
            </h3>
          </Link>

          {description && (
            <p className="mb-2 line-clamp-2 text-xs text-gray-600">
              {description}
            </p>
          )}

          {/* Rating */}
          {rating !== undefined && (
            <div className="mb-2 flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="text-sm font-medium text-gray-900">
                {rating.toFixed(1)}
              </span>
              {reviewCount !== undefined && (
                <span className="text-xs text-gray-500">({reviewCount})</span>
              )}
            </div>
          )}

          {/* Price */}
          {priceRange ? (
            <p className="mb-3 text-lg font-bold text-blue-600">
              Rp {priceRange.min.toLocaleString('id-ID')} - Rp{' '}
              {priceRange.max.toLocaleString('id-ID')}
            </p>
          ) : price !== undefined ? (
            <p className="mb-3 text-lg font-bold text-blue-600">
              Rp {price.toLocaleString('id-ID')}
            </p>
          ) : null}

          {/* Action Button */}
          <Link
            href={href}
            className="block w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 py-2 text-center font-medium text-white transition-all hover:from-blue-600 hover:to-cyan-600"
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </>
  )
}
