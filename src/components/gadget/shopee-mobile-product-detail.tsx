'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Play,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/lib/store/cart-store'
import { useWishlistSafe } from '@/lib/store/wishlist-store'
import { isVideoMedia } from '@/types/ads'
import { ProductReviewsSection } from './product-reviews-section'
import { ProductShareModal } from './product-share-modal'

const INITIAL_RECOMMENDATIONS = 8
const RECOMMENDATIONS_BATCH_SIZE = 8

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
  const { isInWishlist, toggleItem } = useWishlistSafe()
  const isWishlisted = isInWishlist(item.id)
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

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const wasAdded = toggleItem({
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: (item.images && item.images[0]) || '',
      href: `/gadget/${item.id}`,
      rating: item.rating,
      reviewCount: item.totalReview,
      originCity: item.store?.city,
      storeName: item.store?.name,
    })
    if (wasAdded) {
      toast.success(`Ditambahkan ke Wishlist: ${item.name}`)
    } else {
      toast.info(`Dihapus dari Wishlist: ${item.name}`)
    }
  }

  return (
    <div className="shadow-xs relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-2.5 transition-all hover:border-slate-200 dark:border-slate-800/90 dark:bg-slate-900">
      <Link href={`/gadget/${item.id}`} className="block">
        {/* Image Box */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
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

          {/* Rating Badge (Top Left) matching Screenshots 2, 3, 4 */}
          <div className="backdrop-blur-xs shadow-xs absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-black text-slate-900 shadow-sm dark:bg-slate-900/90 dark:text-white">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{(item.rating || 5.0).toFixed(1)}</span>
          </div>

          {/* Wishlist Button (Top Right) */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className="backdrop-blur-xs shadow-xs absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-400 transition hover:text-rose-500 active:scale-90 dark:bg-slate-900/90"
            aria-label="Wishlist"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
              }`}
            />
          </button>
        </div>

        {/* Meta Section */}
        <div className="mt-2 space-y-1">
          {/* Product Name */}
          <h4 className="line-clamp-2 min-h-[32px] text-xs font-bold leading-tight text-slate-950 dark:text-white">
            {item.name}
          </h4>

          {/* Price */}
          <div className="pt-0.5">
            <span className="block text-sm font-black leading-tight text-orange-500">
              Rp {(item.price || 0).toLocaleString('id-ID')}
            </span>
            <div className="mt-0.5 flex items-center justify-between text-[10px]">
              <span className="leading-none text-slate-400 line-through">
                Rp {strikePrice.toLocaleString('id-ID')}
              </span>
              <span className="shrink-0 whitespace-nowrap font-medium text-slate-500 dark:text-slate-400">
                Terjual {item.soldCount ?? 3}
              </span>
            </div>
          </div>

          {/* Store Location */}
          <div className="flex items-center gap-1 truncate pt-1 text-[10px] text-slate-500 dark:text-slate-400">
            <MapPin className="h-2.5 w-2.5 shrink-0 text-slate-400" />
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
  const { isInWishlist, toggleItem } = useWishlistSafe()
  const isWishlisted = isInWishlist(product?.id || '')

  const handleToggleWishlist = () => {
    if (!product?.id) return
    const priceToUse = selectedVariant ? selectedVariant.price : product.price
    const wasAdded = toggleItem({
      id: product.id,
      name: product.name,
      price: priceToUse,
      originalPrice: selectedVariant
        ? selectedVariant.originalPrice || undefined
        : product.originalPrice,
      image:
        selectedImage ||
        selectedVariant?.image ||
        (product.images && product.images[0]) ||
        '',
      href: `/gadget/${product.id}`,
      rating: product.rating,
      reviewCount: product.totalReview,
      originCity: product.store?.city,
      storeName: product.store?.name,
    })
    if (wasAdded) {
      toast.success(`Ditambahkan ke Wishlist: ${product.name}`)
    } else {
      toast.info(`Dihapus dari Wishlist: ${product.name}`)
    }
  }

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

  // Mobile Lazy Loading State for Recommendations
  const [recommendationsCount, setRecommendationsCount] = useState(
    INITIAL_RECOMMENDATIONS
  )
  const [isLoadingMoreRecommendations, setIsLoadingMoreRecommendations] =
    useState(false)
  const recommendationSentinelRef = useRef<HTMLDivElement | null>(null)

  // Reset pagination when product id changes
  useEffect(() => {
    setRecommendationsCount(INITIAL_RECOMMENDATIONS)
  }, [product?.id])

  const hasMoreRecommendations = recommendationsCount < relatedProducts.length
  const displayedRecommendations = relatedProducts.slice(
    0,
    recommendationsCount
  )

  const loadMoreRecommendations = useCallback(() => {
    if (
      isLoadingMoreRecommendations ||
      recommendationsCount >= relatedProducts.length
    ) {
      return
    }
    setIsLoadingMoreRecommendations(true)
    setTimeout(() => {
      setRecommendationsCount((prev) =>
        Math.min(prev + RECOMMENDATIONS_BATCH_SIZE, relatedProducts.length)
      )
      setIsLoadingMoreRecommendations(false)
    }, 250)
  }, [
    isLoadingMoreRecommendations,
    recommendationsCount,
    relatedProducts.length,
  ])

  // IntersectionObserver for recommendations lazy load
  useEffect(() => {
    if (!hasMoreRecommendations) return
    const el = recommendationSentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRecommendations()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMoreRecommendations, loadMoreRecommendations])

  // Condition Label mapping
  const conditionLabel =
    product.condition === 'SECOND_MULUS'
      ? 'Second Mulus (95% - 98%)'
      : product.condition === 'GRADE_A'
        ? 'Second Grade A (Normal 100%)'
        : product.condition === 'LIKE_NEW'
          ? 'Second Like New (Mulus 99%)'
          : product.condition || 'Second Teruji'

  const [backHref, setBackHref] = useState('/gadget')

  useEffect(() => {
    try {
      const savedBrand = sessionStorage.getItem(
        'affiliate_gadget_selected_brand'
      )
      if (savedBrand && savedBrand !== 'ALL') {
        setBackHref(`/gadget?brand=${encodeURIComponent(savedBrand)}`)
      }
    } catch {}
  }, [])

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      let fallbackUrl = '/gadget'
      try {
        const savedBrand = sessionStorage.getItem(
          'affiliate_gadget_selected_brand'
        )
        if (savedBrand && savedBrand !== 'ALL') {
          fallbackUrl = `/gadget?brand=${encodeURIComponent(savedBrand)}`
        }
      } catch {}

      if (window.history.length > 1) {
        window.history.back()

        // Fallback: If after 250ms page hasn't navigated away, push to fallbackUrl
        setTimeout(() => {
          if (
            typeof window !== 'undefined' &&
            window.location.pathname === currentPath
          ) {
            router.push(fallbackUrl)
          }
        }, 250)
        return
      }

      router.push(fallbackUrl)
      return
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
            href={backHref}
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
            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
              {product.name}
            </p>
          </div>

          {/* Right Action Icons: Wishlist, Cart & Share */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleToggleWishlist}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90 ${
                isScrolled
                  ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white'
                  : 'shadow-xs border border-white/20 bg-white/80 text-slate-900 backdrop-blur-md hover:bg-white dark:bg-slate-900/80 dark:text-white'
              }`}
              aria-label="Wishlist"
              title={
                isWishlisted ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'
              }
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isWishlisted
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              />
            </button>

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

      {/* 2. Hero Media Gallery with Native Horizontal Slide matching Screenshot 1 */}
      <div className="relative aspect-square max-h-[380px] w-full select-none overflow-hidden bg-white dark:bg-slate-900">
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
            allImages.map((imgUrl, idx) => {
              const isVid = isVideoMedia(imgUrl)
              return (
                <div
                  key={imgUrl + idx}
                  className="relative flex h-full w-full min-w-full shrink-0 snap-center items-center justify-center overflow-hidden"
                >
                  {isVid ? (
                    <div className="relative flex h-full w-full items-center justify-center bg-black/5 dark:bg-black/20">
                      <video
                        src={imgUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                        className="max-h-full max-w-full object-contain"
                      />
                      <div className="backdrop-blur-xs shadow-xs absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md bg-orange-600/90 px-1.5 py-0.5 text-[8.5px] font-black text-white">
                        <Play className="h-2.5 w-2.5 fill-white text-white" />
                        <span>VIDEO</span>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={imgUrl}
                      alt={`${product.name} - ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      fetchPriority={idx === 0 ? 'high' : undefined}
                      sizes="(max-width: 640px) 100vw, 400px"
                      className="object-cover transition-all duration-300"
                    />
                  )}
                </div>
              )
            })
          ) : (
            <div className="relative flex h-full w-full min-w-full shrink-0 snap-center items-center justify-center overflow-hidden">
              <Image
                src={
                  selectedImage ||
                  product.images?.[0] ||
                  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=80'
                }
                alt={product.name}
                fill
                priority
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* Clean Slide Counter on bottom-right matching Screenshot 1 */}
        <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-semibold text-white">
          {displayIdx}/{totalImagesCount}
        </div>
      </div>

      {/* 3. Product Primary Info & Pricing matching Screenshot 1 */}
      <div className="space-y-2 border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {/* Row 1: Semantic Badges & Stock */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              {product.brand || 'Gadget'}
            </span>
            <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {product.condition === 'BARU' ? 'Baru' : 'Like New 99%'}
            </span>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {availableStock > 0 ? `Stok: ${availableStock} Unit` : 'Stok Habis'}
          </span>
        </div>

        {/* Row 2: Product Title */}
        <h1 className="text-base font-extrabold leading-snug text-slate-950 dark:text-white sm:text-lg">
          {product.name}
        </h1>

        {/* Row 3: Price Row */}
        <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
          <span className="text-2xl font-black tabular-nums tracking-tight text-slate-950 dark:text-white">
            Rp {currentPrice.toLocaleString('id-ID')}
          </span>

          {product.originalPrice && product.originalPrice > currentPrice && (
            <span className="text-xs font-normal tabular-nums text-slate-400 line-through">
              Rp {product.originalPrice.toLocaleString('id-ID')}
            </span>
          )}

          {discountAmount > 0 && (
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              Hemat{' '}
              {discountAmount >= 1000000
                ? `Rp ${(discountAmount / 1000000).toFixed(1).replace('.0', '')} jt`
                : `Rp ${discountAmount.toLocaleString('id-ID')}`}
            </span>
          )}
        </div>
      </div>

      {/* 4. Variant Selector matching Screenshot 1 */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2.5 border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              Pilihan Varian
            </span>
            {selectedVariant && (
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Terpilih:{' '}
                <span className="font-normal text-slate-600 dark:text-slate-300">
                  {selectedVariant.name}
                </span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
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
                  className={`flex w-full items-center gap-2.5 rounded-2xl p-2.5 text-left transition-all ${
                    isSelected
                      ? 'border-2 border-orange-500 bg-orange-50/10'
                      : 'border border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={vImg}
                      alt={v.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-xs ${isSelected ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}
                    >
                      {v.name}
                    </p>
                    <p
                      className={`text-xs ${isSelected ? 'font-bold text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}
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

      {/* 5. Quantity Stepper matching Screenshot 1 */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Jumlah Pesanan
          </span>
          <p className="text-[11px] text-slate-400">
            Maksimal {availableStock} unit
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={isOutOfStock || quantity <= 1}
            className="cursor-pointer text-slate-500 hover:text-slate-800 disabled:opacity-40"
            aria-label="Kurangi jumlah"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-5 text-center text-xs font-bold tabular-nums text-slate-900 dark:text-white">
            {isOutOfStock ? 0 : quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
            disabled={isOutOfStock || quantity >= availableStock}
            className="cursor-pointer text-slate-500 hover:text-slate-800 disabled:opacity-40"
            aria-label="Tambah jumlah"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 6. Paket Bonus Aksesoris 3-in-1 matching Screenshot 1 */}
      <div className="border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Paket Bonus Aksesoris 3-in-1
            </h3>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              Gratis
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="shadow-2xs rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Charger 20W
            </div>
            <div className="shadow-2xs rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Antigores 9D
            </div>
            <div className="shadow-2xs rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Matte Case
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-200/60 pt-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Logistik Terproteksi
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                JNE & Gojek (Dari {product.store?.city || 'Indonesia'})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Garansi 30 Hari
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Tukar unit & IMEI bebas blokir
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Store Profile Card matching Screenshot 2 */}
      {product.store && (
        <div className="border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {product.store.logo ? (
                <img
                  src={product.store.logo}
                  alt={product.store.name}
                  className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                  {product.store.name?.charAt(0) || 'T'}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                  {product.store.name
                    ?.replace('Affiliate Gadget - ', '')
                    .replace('AffiliateGadget Store - ', '')}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {product.store.city || 'Indonesia'}
                </p>
              </div>
            </div>

            <Link
              href={`/toko/${product.store.slug}`}
              className="shadow-2xs rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
            >
              Lihat Toko
            </Link>
          </div>
        </div>
      )}

      {/* 8. PRODUK LAINNYA matching Screenshot 2 */}
      {otherStoreProducts.length > 0 && (
        <div className="border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              PRODUK LAINNYA
            </h3>
            <Link
              href={`/toko/${product.store?.slug}`}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Lihat Semua &gt;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {otherStoreProducts.slice(0, 4).map((item: any) => (
              <ProductCatalogMiniCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* 9. DESKRIPSI & SPESIFIKASI matching Screenshot 3 */}
      <div className="border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            DESKRIPSI & SPESIFIKASI
          </h3>
          <button
            type="button"
            onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
            className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            {isSpecsExpanded ? 'Tutup Detail' : 'Buka Detail'}
          </button>
        </div>
        <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {product.description ||
            'Ponsel fotografi legendaris quad-camera Leica 1-inch sensor dengan aperture variabel kontinu f/1.63-f/4.0. Dilengkapi Snapdragon 8 Gen 3, baterai 5000mAh, dan layar 120Hz WQHD+ AMOLED.'}
        </p>

        {isSpecsExpanded && (
          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
            <div className="flex justify-between border-b border-slate-50 py-1">
              <span className="text-slate-500">Merek</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {product.brand || '-'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1">
              <span className="text-slate-500">Kapasitas Storage</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedVariant?.storage ||
                  (product.specs as any)?.['Storage'] ||
                  '-'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1">
              <span className="text-slate-500">Kapasitas RAM</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedVariant?.ram || (product.specs as any)?.['RAM'] || '-'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1">
              <span className="text-slate-500">Kondisi Fisik</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {conditionLabel}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1">
              <span className="text-slate-500">Garansi Toko</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {product.warrantyDays || 30} Hari Tukar Unit
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Asal Pengiriman</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {product.store?.city || 'Indonesia'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 10. ULASAN & KEPUASAN PEMBELI matching Screenshot 3 */}
      <div className="border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="shadow-xs space-y-3 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              ULASAN & KEPUASAN PEMBELI
            </h3>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-950 dark:text-white">
                  {(product.rating || 5.0).toFixed(1)}
                </span>
                <span className="text-xs font-medium text-slate-400">/5.0</span>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Rating Toko
              </p>
              <p className="text-[10px] text-slate-400">
                Dari{' '}
                {product.totalReview
                  ? `${product.totalReview} Ulasan`
                  : '1.2k+ Transaksi'}
              </p>
            </div>
          </div>

          <div className="pt-1">
            <ProductReviewsSection
              productId={product.id}
              productName={product.name}
              storeName={product.store?.name}
              onReviewModalChange={setIsReviewModalOpen}
              className="mt-0 border-t-0 pt-0"
              compact
            />
          </div>
        </div>
      </div>

      {/* 11. REKOMENDASI GADGET LAINNYA matching Screenshot 3 & 4 */}
      {relatedProducts.length > 0 && (
        <div className="border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              REKOMENDASI GADGET LAINNYA
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {displayedRecommendations.map((rel: any) => (
              <ProductCatalogMiniCard key={rel.id} item={rel} />
            ))}
          </div>

          {/* Lazy Loading Sentinel */}
          {hasMoreRecommendations && (
            <div
              ref={recommendationSentinelRef}
              className="flex justify-center py-4"
            >
              {isLoadingMoreRecommendations && (
                <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
              )}
            </div>
          )}
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

      {/* 12. Bottom Sticky Action Bar matching Screenshot 4 */}
      {!isReviewModalOpen && !isShareModalOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t border-slate-100 bg-white px-4 py-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {/* Chat Button */}
          <button
            type="button"
            onClick={handleChatStore}
            aria-label="Chat"
            className="flex flex-col items-center justify-center px-3 text-slate-700 transition hover:text-slate-950 active:scale-95 dark:text-slate-300 dark:hover:text-white"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="mt-0.5 text-[10px] font-semibold">Chat</span>
          </button>

          {/* Add To Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label="Tambah ke Keranjang"
            className="relative flex flex-col items-center justify-center px-3 text-slate-700 transition hover:text-slate-950 active:scale-95 disabled:opacity-40 dark:text-slate-300 dark:hover:text-white"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="mt-0.5 text-[10px] font-semibold">
              + Keranjang
            </span>
            {totalCartCount > 0 && (
              <span className="absolute -top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
                {totalCartCount > 99 ? '99+' : totalCartCount}
              </span>
            )}
          </button>

          {/* Buy Now Button (Solid Orange) */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            aria-label="Beli Sekarang"
            className="ml-2 flex h-11 flex-1 items-center justify-center rounded-2xl bg-orange-500 text-sm font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200"
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
