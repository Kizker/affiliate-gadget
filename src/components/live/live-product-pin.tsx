'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Pin, X, ExternalLink, Zap } from 'lucide-react'
import type { PinnedProduct } from '@/hooks/use-live-chat'

interface LiveProductPinProps {
  product: PinnedProduct | null
  isBroadcaster?: boolean
  onUnpin?: () => void
  className?: string
}

export function LiveProductPin({
  product,
  isBroadcaster = false,
  onUnpin,
  className = '',
}: LiveProductPinProps) {
  if (!product) return null

  const formatPrice = (val?: number) => {
    if (typeof val !== 'number') return 'Rp -'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div
      className={`group relative flex max-w-sm items-center gap-3 rounded-2xl border border-orange-500/40 bg-white/95 p-3 text-slate-900 shadow-2xl shadow-orange-500/10 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${className}`}
    >
      {/* Pinned Badge */}
      <div className="absolute -top-3 left-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
        <Pin className="h-2.5 w-2.5 fill-white" />
        <span>Produk Disorot</span>
      </div>

      {/* Product Image Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-slate-100">
        {product.productImage ? (
          <Image
            src={product.productImage}
            alt={product.productTitle || 'Produk'}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <ShoppingBag className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className="min-w-0 flex-1 pr-1">
        <h4 className="line-clamp-1 truncate text-xs font-bold text-slate-900">
          {product.productTitle || 'Produk Pilihan'}
        </h4>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
          {product.discountPrice &&
          product.discountPrice <
            (product.originalPrice || product.productPrice || 0) ? (
            <>
              <span className="text-sm font-extrabold text-orange-600">
                {formatPrice(product.discountPrice)}
              </span>
              <span className="text-[10px] text-slate-400 line-through">
                {formatPrice(product.originalPrice || product.productPrice)}
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-700">
                <Zap className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />
                DISKON SEMATAN • 1X CHECKOUT
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-extrabold text-orange-600">
                {formatPrice(product.productPrice)}
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                <Zap className="h-2.5 w-2.5 fill-orange-500 text-orange-500" />
                LIVE
              </span>
            </>
          )}
        </div>
      </div>

      {/* Buy Button */}
      <Link
        href={
          product.dealToken
            ? `/gadget/${product.productId}?dealToken=${product.dealToken}`
            : `/gadget/${product.productId}`
        }
        target="_blank"
        className="flex shrink-0 items-center gap-1 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-orange-600 active:scale-95"
      >
        <span>Beli</span>
        <ExternalLink className="h-3 w-3" />
      </Link>

      {/* Unpin button for Host/Broadcaster */}
      {isBroadcaster && onUnpin && (
        <button
          type="button"
          onClick={onUnpin}
          title="Lepas Sematan Produk"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-500"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
