'use client'

import { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'

export interface ImageWithFallbackProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  fallbackSrc?: string
}

export function ImageWithFallback({
  src,
  alt,
  fill = false,
  className = '',
  sizes,
  priority = false,
  fallbackSrc = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80',
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc)

  useEffect(() => {
    setImgSrc(src || fallbackSrc)
  }, [src, fallbackSrc])

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      onError={() => setImgSrc(fallbackSrc)}
      className={className}
    />
  )
}

export default ImageWithFallback
