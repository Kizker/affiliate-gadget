'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ShoppingBag,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Truck,
  ShieldCheck,
  Store,
  Star,
  MessageSquare,
  Package,
  ArrowUp,
  Gift,
  CheckCircle2,
  Plus,
  Minus,
  Check,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/lib/store/cart-store'
import { ProductReviewsSection } from './product-reviews-section'
import { ProductShareModal } from './product-share-modal'

interface ShopeeMobileProductDetailProps {
  product: any
  selectedVariant: any
  onSelectVariant: (variant: any) => void
  selectedImage: string
  onSelectImage: (img: string) => void
  allImages: string[]
  quantity: number
  setQuantity: (q: number) => void
  availableStock: number
  isOutOfStock: boolean
  currentPrice: number
  discountAmount: number
  handleAddToCart: () => void
  handleBuyNow: () => void
  handleChatStore: () => void
  isAddedToCart: boolean
}

const getConditionBadge = (item: any) => {
  const cond = item.condition || 'LIKE_NEW'
  switch (cond) {
    case 'LIKE_NEW':
      return {
        label: 'Like New 99%',
        color:
          'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      }
    case 'SECOND_MULUS':
      return {
        label: 'Mulus 95-98%',
        color:
          'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      }
    case 'GRADE_A':
      return {
        label: 'Grade A 100%',
        color:
          'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      }
    default:
      return {
        label: 'Teruji Normal',
        color:
          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      }
  }
}

function ProductCatalogMiniCard({ item }: { item: any }) {
  const badge = getConditionBadge(item)
  const strikePrice =
    item.originalPrice && item.originalPrice > item.price
      ? item.originalPrice
      : Math.round((item.price || 0) * 1.25)
  const storeCleanName = (
    item.store?.name ||
    item.store?.city ||
    'Toko Resmi PT'
  )
    .replace('Affiliate Gadget - ', '')
    .replace('AffiliateGadget Store - ', '')

  return (
    <div className="shadow-xs relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-2 transition-all hover:border-slate-200 dark:border-slate-800/90 dark:bg-slate-900 dark:hover:border-slate-700">
      <Link href={`/gadget/${item.id}`} className="block">
        {/* Image Box */}
        <div className="relative aspect-[4/3] max-h-[130px] w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
          <Image
            src={
              (item.images && item.images[0]) ||
              'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
            }
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
          />

          {/* Condition Badge (Top Left) */}
          <span
            className={`backdrop-blur-xs shadow-2xs absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[8.5px] font-bold ${badge.color}`}
          >
            <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
            <span>{badge.label}</span>
          </span>
        </div>

        {/* Meta Section */}
        <div className="mt-1.5 space-y-1">
          {/* Rating & Review Count */}
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span className="text-[10.5px] font-extrabold text-slate-900 dark:text-white">
              {(item.rating || 4.9).toFixed(1)}
            </span>
            <span className="text-[9.5px] font-medium text-slate-400">
              ({item.totalReview || item.reviewCount || 38})
            </span>
          </div>

          {/* Product Name */}
          <h3 className="line-clamp-2 min-h-[28px] text-[11px] font-bold leading-tight text-slate-950 dark:text-white">
            {item.name}
          </h3>

          {/* Feature Perks Pills */}
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[8.5px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              Garansi 30 Hari
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8.5px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Bonus 3-in-1
            </span>
          </div>

          {/* Price Row */}
          <div className="pt-0.5">
            <span className="block text-xs font-black leading-tight text-orange-500">
              Rp {(item.price || 0).toLocaleString('id-ID')}
            </span>
            {strikePrice > (item.price || 0) && (
              <span className="mt-0.5 block text-[9.5px] leading-none text-slate-400 line-through">
                Rp {strikePrice.toLocaleString('id-ID')}
              </span>
            )}
          </div>

          {/* Store Location */}
          <div className="flex items-center gap-1 truncate pt-0.5 text-[9.5px] text-slate-500 dark:text-slate-400">
            <Store className="h-2.5 w-2.5 shrink-0 text-slate-400" />
            <span className="truncate">{storeCleanName}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}

export function ShopeeMobileProductDetail({
  product,
  selectedVariant,
  onSelectVariant,
  selectedImage,
  onSelectImage,
  allImages,
  quantity,
  setQuantity,
  availableStock,
  isOutOfStock,
  currentPrice,
  discountAmount,
  handleAddToCart,
  handleBuyNow,
  handleChatStore,
  isAddedToCart,
}: ShopeeMobileProductDetailProps) {
  const router = useRouter()
  const { items } = useCartStore()
  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const [isScrolled, setIsScrolled] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // Scroll listener for sticky header styling and back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsScrolled(scrollY > 60)
      setShowBackToTop(scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const galleryRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScrollRef = useRef(false)
  const programmaticTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup programmatic scroll timer
  useEffect(() => {
    return () => {
      if (programmaticTimeoutRef.current) {
        clearTimeout(programmaticTimeoutRef.current)
      }
    }
  }, [])

  const currentImageIdx = allImages.indexOf(selectedImage)
  const displayIdx = currentImageIdx >= 0 ? currentImageIdx + 1 : 1
  const totalImagesCount = allImages.length > 0 ? allImages.length : 1

  // Find matching variant that corresponds to the given image
  const findVariantForImage = (imgUrl: string) => {
    if (!product?.variants || product.variants.length === 0) return null
    const exactMatch = product.variants.find(
      (v: any) => v.image && v.image === imgUrl
    )
    if (exactMatch) return exactMatch

    const baseImg = imgUrl.split('?')[0]
    return (
      product.variants.find(
        (v: any) => v.image && v.image.split('?')[0] === baseImg
      ) || null
    )
  }

  // Sync gallery scroll position whenever selectedImage changes (e.g. from variant button)
  useEffect(() => {
    if (!galleryRef.current || !allImages || allImages.length <= 1) return
    let idx = allImages.indexOf(selectedImage)
    if (idx < 0) {
      const baseImg = selectedImage.split('?')[0]
      idx = allImages.findIndex((img) => img.split('?')[0] === baseImg)
    }
    if (idx >= 0) {
      const targetLeft = idx * galleryRef.current.clientWidth
      if (Math.abs(galleryRef.current.scrollLeft - targetLeft) > 5) {
        isProgrammaticScrollRef.current = true
        if (programmaticTimeoutRef.current) {
          clearTimeout(programmaticTimeoutRef.current)
        }
        galleryRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' })
        programmaticTimeoutRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false
        }, 500)
      }
    }
  }, [selectedImage, allImages])

  // Handle native touch swipe / horizontal scroll
  const handleGalleryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const width = target.clientWidth
    if (width <= 0) return

    // If scrolling programmatically (e.g. triggered by variant button click), do NOT revert variant
    if (isProgrammaticScrollRef.current) {
      let currentIdx = allImages.indexOf(selectedImage)
      if (currentIdx < 0) {
        const baseImg = selectedImage.split('?')[0]
        currentIdx = allImages.findIndex((img) => img.split('?')[0] === baseImg)
      }
      if (currentIdx >= 0) {
        const scrolledIdx = Math.round(target.scrollLeft / width)
        if (
          scrolledIdx === currentIdx &&
          Math.abs(target.scrollLeft - currentIdx * width) < 5
        ) {
          isProgrammaticScrollRef.current = false
        }
      }
      return
    }

    const index = Math.round(target.scrollLeft / width)
    if (
      index >= 0 &&
      index < allImages.length &&
      allImages[index] !== selectedImage
    ) {
      const nextImg = allImages[index]
      onSelectImage(nextImg)

      const matchingVariant = findVariantForImage(nextImg)
      if (matchingVariant && matchingVariant.id !== selectedVariant?.id) {
        onSelectVariant(matchingVariant)
      }
    }
  }

  // Handle switching to next image with button
  const handleNextImage = () => {
    if (!galleryRef.current || !allImages || allImages.length <= 1) return
    const currentIdx = allImages.indexOf(selectedImage)
    const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % allImages.length : 0
    const nextImg = allImages[nextIdx]
    onSelectImage(nextImg)

    const matchingVariant = findVariantForImage(nextImg)
    if (matchingVariant && matchingVariant.id !== selectedVariant?.id) {
      onSelectVariant(matchingVariant)
    }
  }

  // Handle switching to previous image with button
  const handlePrevImage = () => {
    if (!galleryRef.current || !allImages || allImages.length <= 1) return
    const currentIdx = allImages.indexOf(selectedImage)
    const prevIdx =
      currentIdx >= 0
        ? (currentIdx - 1 + allImages.length) % allImages.length
        : allImages.length - 1
    const prevImg = allImages[prevIdx]
    onSelectImage(prevImg)

    const matchingVariant = findVariantForImage(prevImg)
    if (matchingVariant && matchingVariant.id !== selectedVariant?.id) {
      onSelectVariant(matchingVariant)
    }
  }

  const handleShare = () => {
    setIsShareModalOpen(true)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const otherStoreProducts = product?.store?.products || []
  const relatedProducts = product?.relatedProducts || []

  // Condition Label mapping
  const conditionLabel =
    product.condition === 'SECOND_MULUS'
      ? 'Second Mulus (95% - 98%)'
      : product.condition === 'GRADE_A'
        ? 'Second Grade A (Normal 100%)'
        : product.condition === 'LIKE_NEW'
          ? 'Second Like New (Mulus 99%)'
          : product.condition || 'Second Teruji'

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (typeof window !== 'undefined') {
      const isFromSameSite =
        document.referrer &&
        document.referrer.includes(window.location.host) &&
        !document.referrer.endsWith(window.location.pathname)

      if (isFromSameSite && window.history.length > 1) {
        window.history.back()

        // Fallback: If after 200ms page hasn't navigated away, push to /gadget
        setTimeout(() => {
          if (
            typeof window !== 'undefined' &&
            window.location.pathname.startsWith('/gadget/')
          ) {
            router.push('/gadget')
          }
        }, 200)
        return
      }
    }

    // Default guaranteed navigation to catalog
    router.push('/gadget')
  }

  return (
    <div className="relative min-h-screen bg-slate-50 pb-24 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Sleek Floating Header App Bar */}
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'shadow-xs border-b border-slate-200/80 bg-white/95 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95'
            : 'bg-gradient-to-b from-black/40 via-transparent to-transparent pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]'
        }`}
      >
        <div className="flex items-center justify-between px-3">
          {/* Back Button: Guaranteed Link with Smart Fallback */}
          <Link
            href="/gadget"
            onClick={handleBack}
            className={`relative z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all active:scale-90 ${
              isScrolled
                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white'
                : 'shadow-xs border border-white/20 bg-white/80 text-slate-900 backdrop-blur-md hover:bg-white dark:bg-slate-900/80 dark:text-white'
            }`}
            aria-label="Kembali ke Katalog"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Center Product Title (revealed when scrolled) */}
          <div
            className={`min-w-0 flex-1 px-3 text-center transition-opacity duration-200 ${
              isScrolled ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <h2 className="truncate text-xs font-bold text-slate-900 dark:text-white">
              {product.name}
            </h2>
          </div>

          {/* Right Action Icons: Cart & Share */}
          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                isScrolled
                  ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white'
                  : 'shadow-xs border border-white/20 bg-white/80 text-slate-900 backdrop-blur-md hover:bg-white dark:bg-slate-900/80 dark:text-white'
              }`}
              aria-label="Keranjang Belanja"
            >
              <ShoppingBag className="h-4 w-4" />
              {totalCartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white shadow-sm">
                  {totalCartCount > 99 ? '99+' : totalCartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                isScrolled
                  ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white'
                  : 'shadow-xs border border-white/20 bg-white/80 text-slate-900 backdrop-blur-md hover:bg-white dark:bg-slate-900/80 dark:text-white'
              }`}
              aria-label="Bagikan"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Media Gallery with Native Horizontal Slide & Next/Prev Controls */}
      <div className="relative aspect-[4/3] max-h-[250px] w-full select-none overflow-hidden border-b border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900 sm:max-h-[280px]">
        {/* Horizontal Slider Track: Bisa di-slide/swipe langsung dengan jari */}
        <div
          ref={galleryRef}
          onScroll={handleGalleryScroll}
          onTouchStart={() => {
            isProgrammaticScrollRef.current = false
            if (programmaticTimeoutRef.current) {
              clearTimeout(programmaticTimeoutRef.current)
            }
          }}
          onPointerDown={() => {
            isProgrammaticScrollRef.current = false
            if (programmaticTimeoutRef.current) {
              clearTimeout(programmaticTimeoutRef.current)
            }
          }}
          className="scrollbar-none no-scrollbar flex h-full w-full touch-pan-x snap-x snap-mandatory overflow-x-auto"
        >
          {allImages.length > 0 ? (
            allImages.map((imgUrl, idx) => (
              <div
                key={imgUrl + idx}
                className="relative flex h-full w-full min-w-full shrink-0 snap-center items-center justify-center p-2.5 sm:p-3"
              >
                <Image
                  src={imgUrl}
                  alt={`${product.name} - ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  unoptimized
                  className="object-contain p-2 transition-all duration-300"
                />
              </div>
            ))
          ) : (
            <div className="relative flex h-full w-full min-w-full shrink-0 snap-center items-center justify-center p-2.5 sm:p-3">
              <Image
                src={
                  selectedImage ||
                  product.images?.[0] ||
                  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=80'
                }
                alt={product.name}
                fill
                priority
                unoptimized
                className="object-contain p-2"
              />
            </div>
          )}
        </div>

        {/* Previous & Next Navigation Buttons */}
        {allImages && allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handlePrevImage()
              }}
              className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-800 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-white active:scale-90 dark:border-slate-700/70 dark:bg-slate-900/85 dark:text-slate-100"
              aria-label="Gambar Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleNextImage()
              }}
              className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-800 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-white active:scale-90 dark:border-slate-700/70 dark:bg-slate-900/85 dark:text-slate-100"
              aria-label="Gambar Selanjutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Subtle Warranty Badge on bottom-left */}
        <div className="shadow-xs backdrop-blur-xs pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/95 px-2.5 py-0.5 text-[9px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300">
          <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>Garansi 30 Hari Tukar Unit</span>
        </div>

        {/* Clean Slide Counter on bottom-right */}
        <div className="shadow-xs backdrop-blur-xs pointer-events-none absolute bottom-2 right-2 z-10 rounded-full border border-slate-200/60 bg-white/90 px-2 py-0.5 text-[9px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300">
          {displayIdx} / {totalImagesCount}
        </div>
      </div>

      {/* 3. Product Primary Info & Pricing */}
      <div className="space-y-2 border-b border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        {/* Semantic Badges: Brand & Condition */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {product.brand || 'Gadget'}
          </span>
          <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            {conditionLabel}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
              availableStock > 5
                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                : availableStock > 0
                  ? 'border border-amber-200/60 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'border border-rose-200/60 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {availableStock > 0 ? `Stok: ${availableStock} Unit` : 'Stok Habis'}
          </span>
        </div>

        {/* Product Title */}
        <h1 className="text-sm font-bold leading-snug text-slate-950 dark:text-white">
          {product.name}
        </h1>

        {/* Price Row */}
        <div className="flex items-baseline justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-xl font-black tabular-nums tracking-tight text-slate-950 dark:text-white">
              Rp {currentPrice.toLocaleString('id-ID')}
            </span>

            {product.originalPrice && product.originalPrice > currentPrice && (
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-normal tabular-nums text-slate-400 line-through">
                  Rp {product.originalPrice.toLocaleString('id-ID')}
                </span>
                <span className="rounded-md border border-rose-200/60 bg-rose-50 px-1 py-0.5 text-[9px] font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
                  Hemat Rp {discountAmount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => {
              setIsWishlisted(!isWishlisted)
              toast.success(
                isWishlisted
                  ? 'Dihapus dari Favorit'
                  : 'Ditambahkan ke Favorit!'
              )
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-slate-500 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400"
            aria-label="Simpan ke Favorit"
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 4. Elegant Variant Selector */}
      {product.variants && product.variants.length > 0 && (
        <div className="mt-1.5 space-y-2 border-y border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              Pilihan Varian ({product.variants.length})
            </span>
            {selectedVariant && (
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Terpilih:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {selectedVariant.name}
                </strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {product.variants.map((v: any) => {
              const isSelected = selectedVariant?.id === v.id
              const vImg =
                v.image ||
                product.images?.[0] ||
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'
              const vStock = Number(v.stock) || 0

              return (
                <button
                  key={v.id}
                  id={`variant-btn-${v.id}`}
                  type="button"
                  onClick={() => onSelectVariant(v)}
                  disabled={vStock <= 0}
                  className={`flex w-full items-center gap-1.5 rounded-xl border p-1.5 text-left transition-all ${
                    isSelected
                      ? 'shadow-xs border-orange-500 bg-orange-50/25 text-slate-900 ring-1 ring-orange-500/40 dark:border-orange-500 dark:bg-orange-950/20 dark:text-white'
                      : vStock <= 0
                        ? 'border-slate-200/50 bg-slate-50 text-slate-400 opacity-50 dark:border-slate-800 dark:bg-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300'
                  }`}
                >
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={vImg}
                      alt={v.name}
                      fill
                      sizes="32px"
                      unoptimized
                      className="object-contain p-0.5"
                    />
                  </div>
                  <div className="min-w-0 flex-1 pr-0.5">
                    <p
                      className={`truncate text-[11px] leading-tight ${
                        isSelected
                          ? 'font-bold text-slate-900 dark:text-white'
                          : 'font-semibold text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {v.name}
                    </p>
                    <p
                      className={`text-[9.5px] ${
                        isSelected
                          ? 'font-bold text-orange-600 dark:text-orange-400'
                          : 'font-medium text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Rp {v.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 5. Quantity Stepper */}
      <div className="mt-1.5 flex items-center justify-between border-y border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Jumlah Pesanan
          </span>
          <p className="text-[10px] text-slate-400">
            Maksimal pembelian {availableStock} unit
          </p>
        </div>

        <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={isOutOfStock || quantity <= 1}
            className="h-6.5 w-6.5 flex items-center justify-center rounded-lg text-slate-600 transition hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Kurangi jumlah"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-7 text-center text-xs font-bold tabular-nums text-slate-900 dark:text-white">
            {isOutOfStock ? 0 : quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
            disabled={isOutOfStock || quantity >= availableStock}
            className="h-6.5 w-6.5 flex items-center justify-center rounded-lg text-slate-600 transition hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Tambah jumlah"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 6. Paket Bonus 3-in-1 Reassurance Card (Clean Minimalist) */}
      <div className="mt-1.5 space-y-2 border-y border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-orange-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Paket Bonus Aksesoris 3-in-1
            </h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            Gratis (Rp 0)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-[10px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/70 p-1.5 dark:border-slate-800 dark:bg-slate-800/40">
            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
            <span className="truncate">Charger 20W</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/70 p-1.5 dark:border-slate-800 dark:bg-slate-800/40">
            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
            <span className="truncate">Antigores 9D</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/70 p-1.5 dark:border-slate-800 dark:bg-slate-800/40">
            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
            <span className="truncate">Matte Case</span>
          </div>
        </div>
      </div>

      {/* 7. Shipping & Physical Warranty Info Rows */}
      <div className="mt-1.5 space-y-0 divide-y divide-slate-100 border-y border-slate-200/70 bg-white text-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5 p-2.5">
          <Truck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Logistik Terproteksi (JNE & Gojek)
            </p>
            <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
              Wajib Asuransi 100% • Dikirim dari{' '}
              {product.store?.city || 'Toko Cabang'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Garansi Toko Fisik 30 Hari
            </p>
            <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
              Tukar Unit Baru • Bebas Blokir IMEI Seumur Hidup
            </p>
          </div>
        </div>
      </div>

      {/* 8. Real Store Profile Card */}
      {product.store && (
        <div className="mt-1.5 space-y-2 border-y border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              {product.store.logo ? (
                <img
                  src={product.store.logo}
                  alt={product.store.name}
                  className="h-9 w-9 shrink-0 rounded-xl border border-slate-200/80 object-cover dark:border-slate-700"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Store className="h-4 w-4" />
                </div>
              )}

              <div className="min-w-0">
                <h3 className="truncate text-xs font-bold text-slate-950 dark:text-white">
                  {product.store.name}
                </h3>
                {product.store.companyName && (
                  <p className="truncate text-[10px] text-slate-400">
                    {product.store.companyName}
                  </p>
                )}
                <div className="flex items-center gap-1 text-[9.5px] text-slate-500">
                  <MapPin className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                  <span className="truncate">{product.store.city}</span>
                </div>
              </div>
            </div>

            <Link
              href={`/toko/${product.store.slug}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>Lihat Toko</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Real store metrics */}
          <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 pt-2 text-center text-xs dark:divide-slate-800 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {product.store?._count?.products ||
                  otherStoreProducts.length ||
                  1}
              </p>
              <p className="text-[9.5px] text-slate-400">Katalog Tersedia</p>
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Terverifikasi
              </p>
              <p className="text-[9.5px] text-slate-400">Toko Fisik Resmi</p>
            </div>
          </div>
        </div>
      )}

      {/* 9. Produk Lain dari Toko Ini (Jika ada - Format Kartu Katalog Konsisten) */}
      {otherStoreProducts.length > 0 && (
        <div className="mt-1.5 border-y border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Unit Lain di Toko Ini
            </h3>
            <Link
              href={`/toko/${product.store?.slug}`}
              className="flex items-center gap-0.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Lihat Semua
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {otherStoreProducts.map((item: any) => (
              <ProductCatalogMiniCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* 10. Spesifikasi Hardware Accordion */}
      <div className="mt-1.5 border-y border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Spesifikasi Detail
          </h3>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
            <span>
              {isSpecsExpanded ? 'Tutup Spesifikasi' : 'Buka Spesifikasi'}
            </span>
            {isSpecsExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </div>
        </button>

        {isSpecsExpanded && (
          <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
            <div className="flex justify-between border-b border-slate-50 py-1 dark:border-slate-800/60">
              <span className="text-slate-400">Merek</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {product.brand || '-'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1 dark:border-slate-800/60">
              <span className="text-slate-400">Kapasitas Storage</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedVariant?.storage ||
                  (product.specs as any)?.['Storage'] ||
                  '-'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1 dark:border-slate-800/60">
              <span className="text-slate-400">Kapasitas RAM</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedVariant?.ram || (product.specs as any)?.['RAM'] || '-'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1 dark:border-slate-800/60">
              <span className="text-slate-400">Kondisi Fisik</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {conditionLabel}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1 dark:border-slate-800/60">
              <span className="text-slate-400">Garansi Toko</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {product.warrantyDays || 30} Hari Tukar Unit
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Asal Pengiriman</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {product.store?.city || 'Indonesia'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 11. Deskripsi Produk */}
      <div className="mt-1.5 border-y border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          Deskripsi & Catatan Unit
        </h3>
        <div
          className={`text-xs leading-relaxed text-slate-600 dark:text-slate-300 ${
            !isDescExpanded ? 'line-clamp-4' : ''
          }`}
        >
          <p className="whitespace-pre-line">
            {product.description ||
              'Unit smartphone second original bergaransi toko fisik 30 hari tukar unit. Seluruh unit telah melalui uji fungsi komprehensif teknisi (layar, kamera, baterai, sinyal & IMEI bebas blokir), dan dilengkapi bonus aksesoris 3-in-1.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDescExpanded(!isDescExpanded)}
          className="mt-2 flex w-full items-center justify-center gap-1 border-t border-slate-100 pt-1.5 text-xs font-bold text-blue-600 dark:border-slate-800 dark:text-blue-400"
        >
          <span>{isDescExpanded ? 'Lebih Sedikit' : 'Baca Selengkapnya'}</span>
          {isDescExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* 12. Ulasan Pembeli */}
      <div className="mt-1.5 border-y border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <ProductReviewsSection
          productId={product.id}
          productName={product.name}
          storeName={product.store?.name}
          onReviewModalChange={setIsReviewModalOpen}
        />
      </div>

      {/* 13. Rekomendasi Gadget Terkait (Format Kartu Katalog Konsisten) */}
      {relatedProducts.length > 0 && (
        <div className="mt-3 px-3">
          <div className="mb-2.5 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rekomendasi Gadget Lainnya
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {relatedProducts.map((rel: any) => (
              <ProductCatalogMiniCard key={rel.id} item={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Floating Scroll To Top Button */}
      {showBackToTop && !isReviewModalOpen && !isShareModalOpen && (
        <button
          type="button"
          onClick={scrollToTop}
          className="bottom-18 fixed right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          aria-label="Kembali ke atas"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* 14. Ergonomic Modern Bottom Action Bar */}
      {!isReviewModalOpen && !isShareModalOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t border-slate-200/80 bg-white px-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {/* Chat Store Button */}
          <button
            type="button"
            onClick={handleChatStore}
            className="flex flex-col items-center justify-center px-3 text-slate-600 transition hover:text-slate-950 active:scale-95 dark:text-slate-400 dark:hover:text-white"
          >
            <MessageSquare className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            <span className="mt-1 text-[10px] font-semibold">Chat Toko</span>
          </button>

          {/* Add To Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="relative flex flex-col items-center justify-center px-3 text-slate-600 transition hover:text-slate-950 active:scale-95 disabled:opacity-40 dark:text-slate-400 dark:hover:text-white"
          >
            <ShoppingBag className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            <span className="mt-1 text-[10px] font-semibold">
              {isAddedToCart ? 'Masuk!' : '+ Keranjang'}
            </span>
            {totalCartCount > 0 && (
              <span className="absolute right-2 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white">
                {totalCartCount > 99 ? '99+' : totalCartCount}
              </span>
            )}
          </button>

          {/* Buy Now Button (Vibrant Action Orange with Crisp Typography) */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="ml-2 flex h-11 flex-1 items-center justify-center rounded-2xl bg-orange-500 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800"
          >
            {isOutOfStock ? 'Stok Habis' : 'Beli Sekarang'}
          </button>
        </div>
      )}

      {/* 15. Clean & Aesthetic Product Share Modal */}
      <ProductShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={product}
        selectedVariant={selectedVariant}
        currentPrice={currentPrice}
        selectedImage={selectedImage}
      />
    </div>
  )
}
