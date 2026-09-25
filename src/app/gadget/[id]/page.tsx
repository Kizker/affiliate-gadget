'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { useCartStore } from '@/lib/store/cart-store'
import { ProductReviewsSection } from '@/components/gadget/product-reviews-section'
import { ShopeeMobileProductDetail } from '@/components/gadget/shopee-mobile-product-detail'
import {
  ShieldCheck,
  Gift,
  Truck,
  Store,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MessageSquare,
  PhoneCall,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Check,
  MapPin,
  Clock,
  Plus,
  Minus,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'

export default function GadgetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { status } = useSession()
  const id = params?.id as string

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const [isDesktopDescExpanded, setIsDesktopDescExpanded] = useState(false)

  const { addItem, setBuyNowItem } = useCartStore()

  // Aggregate all unique images from product and variants for thumbnails (must be before early returns)
  const allImages = useMemo(() => {
    if (!product) return []
    const list: string[] = []
    if (Array.isArray(product.images)) {
      product.images.forEach((img: string) => {
        if (img && !list.includes(img)) list.push(img)
      })
    }
    if (Array.isArray(product.variants)) {
      product.variants.forEach((v: any) => {
        if (v.image && !list.includes(v.image)) list.push(v.image)
      })
    }
    return list
  }, [product])

  useEffect(() => {
    if (id) {
      fetchProductDetail()
    }
  }, [id])

  const fetchProductDetail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/gadgets/${id}?t=${Date.now()}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (data.success && data.data) {
        setProduct(data.data)
        let initialImage =
          data.data.images && data.data.images.length > 0
            ? data.data.images[0]
            : ''
        if (data.data.variants && data.data.variants.length > 0) {
          const firstWithStock = data.data.variants.find(
            (v: any) => (v.stock || 0) > 0
          )
          const chosenVariant = firstWithStock || data.data.variants[0]
          setSelectedVariant(chosenVariant)
          if (chosenVariant.image) {
            initialImage = chosenVariant.image
          }
        }
        if (initialImage) {
          setSelectedImage(initialImage)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    if (status === 'unauthenticated') {
      toast.error(
        'Silakan masuk terlebih dahulu untuk menambahkan produk ke keranjang.'
      )
      router.push(`/login?callbackUrl=${encodeURIComponent(`/gadget/${id}`)}`)
      return
    }

    const priceToUse = selectedVariant ? selectedVariant.price : product.price
    const variantName = selectedVariant ? selectedVariant.name : undefined
    const variantId = selectedVariant ? selectedVariant.id : undefined
    const imageToUse =
      selectedVariant?.image ||
      selectedImage ||
      (product.images && product.images[0]) ||
      ''

    addItem({
      type: 'PRODUCT',
      productId: product.id,
      variantId: variantId,
      variantName: variantName,
      name: `${product.name} ${variantName ? `(${variantName})` : ''}`,
      price: priceToUse,
      image: imageToUse,
      quantity: quantity,
      stock: selectedVariant?.stock || product.stock,
      weightGram: product.weightGram ?? 500,
      pricePerKg: product.pricePerKg ?? 20000,
      notes: `${product.warrantyDays || 30} Hari Garansi Toko + Free Bonus 3-in-1`,
    })

    setIsAddedToCart(true)
    toast.success('Produk berhasil ditambahkan ke keranjang!')
    setTimeout(() => setIsAddedToCart(false), 2500)
  }

  const handleBuyNow = () => {
    if (!product) return

    const priceToUse = selectedVariant ? selectedVariant.price : product.price
    const variantName = selectedVariant ? selectedVariant.name : undefined
    const variantId = selectedVariant ? selectedVariant.id : undefined
    const imageToUse =
      selectedVariant?.image ||
      selectedImage ||
      (product.images && product.images[0]) ||
      ''

    const directItem = {
      id: `buynow-${product.id}-${variantId || 'base'}-${Date.now()}`,
      type: 'PRODUCT' as const,
      productId: product.id,
      variantId: variantId,
      variantName: variantName,
      name: `${product.name} ${variantName ? `(${variantName})` : ''}`,
      price: priceToUse,
      image: imageToUse,
      quantity: quantity,
      stock: selectedVariant?.stock || product.stock,
      weightGram: product.weightGram ?? 500,
      pricePerKg: product.pricePerKg ?? 20000,
      notes: `${product.warrantyDays || 30} Hari Garansi Toko + Free Bonus 3-in-1`,
    }

    // Set Buy Now item langsung tanpa memasukkan ke keranjang belanja umum
    setBuyNowItem(directItem)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'affiliate_gadget_buy_now',
          JSON.stringify(directItem)
        )
      } catch {}
    }

    if (status === 'unauthenticated') {
      toast.info(
        'Silakan masuk terlebih dahulu untuk melanjutkan pembelian langsung.'
      )
      router.push(
        `/login?callbackUrl=${encodeURIComponent('/checkout?buyNow=1')}`
      )
      return
    }

    // Langsung menuju ke checkout khusus item ini!
    router.push('/checkout?buyNow=1')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Navbar variant="light" />
        <div className="flex h-96 items-center justify-center pt-28">
          <div className="text-center text-slate-400">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500" />
            <p className="text-xs font-medium">
              Memuat spesifikasi unit gadget...
            </p>
          </div>
        </div>
        <Footer variant="light" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Navbar variant="light" />
        <div className="container mx-auto max-w-md px-4 py-36 text-center">
          <div className="shadow-xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-10 dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-lg font-bold text-slate-950 dark:text-white">
              Gadget Tidak Ditemukan
            </h1>
            <p className="text-xs text-slate-500">
              Unit mungkin sudah terjual habis atau tautan tidak valid.
            </p>
            <div className="pt-2">
              <Link
                href="/gadget"
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600"
              >
                Kembali ke Katalog Produk
              </Link>
            </div>
          </div>
        </div>
        <Footer variant="light" />
      </div>
    )
  }

  const totalStock =
    product.variants && product.variants.length > 0
      ? product.variants.reduce(
          (acc: number, v: any) => acc + (Number(v.stock) || 0),
          0
        )
      : Number(product.stock) || 0

  const availableStock = selectedVariant
    ? Number(selectedVariant.stock) || 0
    : totalStock
  const isOutOfStock = availableStock <= 0

  const handleSelectVariant = (variant: any) => {
    setSelectedVariant(variant)
    if (variant.image) {
      setSelectedImage(variant.image)
    } else if (product?.images && product.images.length > 0) {
      setSelectedImage(product.images[0])
    }
    const variantStock = Number(variant.stock) || 0
    if (variantStock <= 0) {
      setQuantity(0)
    } else if (quantity > variantStock || quantity === 0) {
      setQuantity(1)
    }
  }

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

  // Desktop handlers for next and previous images with instant variant sync
  const handleNextImageDesktop = () => {
    if (!allImages || allImages.length <= 1) return
    const currentIdx = allImages.indexOf(selectedImage)
    const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % allImages.length : 0
    const nextImg = allImages[nextIdx]
    setSelectedImage(nextImg)

    const matchingVar = findVariantForImage(nextImg)
    if (matchingVar) {
      handleSelectVariant(matchingVar)
    }
  }

  const handlePrevImageDesktop = () => {
    if (!allImages || allImages.length <= 1) return
    const currentIdx = allImages.indexOf(selectedImage)
    const prevIdx =
      currentIdx >= 0
        ? (currentIdx - 1 + allImages.length) % allImages.length
        : allImages.length - 1
    const prevImg = allImages[prevIdx]
    setSelectedImage(prevImg)

    const matchingVar = findVariantForImage(prevImg)
    if (matchingVar) {
      handleSelectVariant(matchingVar)
    }
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product.price
  const discountAmount =
    product.originalPrice && product.originalPrice > currentPrice
      ? product.originalPrice - currentPrice
      : 0

  const handleChatStore = () => {
    if (!product?.store?.id) return

    const storeId = product.store.id
    const productId = product.id
    const productName = encodeURIComponent(product.name || '')
    const productPrice = currentPrice || product.price || 0
    const variantName = encodeURIComponent(selectedVariant?.name || '')
    const productImage = encodeURIComponent(
      selectedImage || (product.images && product.images[0]) || ''
    )

    const chatUrl = `/dashboard/customer/chat?storeId=${storeId}&productId=${productId}&productName=${productName}&productPrice=${productPrice}&variantName=${variantName}&productImage=${productImage}`

    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(chatUrl)}`)
      return
    }

    router.push(chatUrl)
  }

  return (
    <>
      {/* 1. Mobile View: Authentic Shopee Mobile Layout (block lg:hidden) */}
      <div className="block lg:hidden">
        <ShopeeMobileProductDetail
          product={product}
          selectedVariant={selectedVariant}
          onSelectVariant={handleSelectVariant}
          selectedImage={selectedImage}
          onSelectImage={setSelectedImage}
          allImages={allImages}
          quantity={quantity}
          setQuantity={setQuantity}
          availableStock={availableStock}
          isOutOfStock={isOutOfStock}
          currentPrice={currentPrice}
          discountAmount={discountAmount}
          handleAddToCart={handleAddToCart}
          handleBuyNow={handleBuyNow}
          handleChatStore={handleChatStore}
          isAddedToCart={isAddedToCart}
        />
      </div>

      {/* 2. Desktop View: Rich Bento Layout (hidden lg:flex) */}
      <div className="hidden min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:flex">
        <Navbar variant="light" />

        <main className="pb-20 pt-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <nav
              className="mb-6 flex items-center gap-2 text-xs font-normal text-slate-500"
              aria-label="Breadcrumb"
            >
              <Link
                href="/"
                className="transition-colors hover:text-slate-900 dark:hover:text-white"
              >
                Beranda
              </Link>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <Link
                href="/gadget"
                className="transition-colors hover:text-slate-900 dark:hover:text-white"
              >
                Katalog Gadget
              </Link>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                {product.name}
              </span>
            </nav>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
              {/* Left Column: Media Gallery & Store Card (5 cols) */}
              <div className="space-y-4 lg:col-span-5">
                {/* Main Image Container — Desktop only */}
                <div className="shadow-xs group relative hidden aspect-square select-none overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
                  {/* Image clipped with padding effect via absolute inset */}
                  <div className="absolute inset-5 overflow-hidden rounded-2xl">
                    <Image
                      key={selectedImage}
                      src={
                        selectedImage ||
                        product.images?.[0] ||
                        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=80'
                      }
                      alt={product.name}
                      fill
                      sizes="500px"
                      priority
                      unoptimized
                      className="object-contain transition-all duration-300"
                    />
                  </div>
                  {/* Warranty Stamp */}
                  <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Garansi 30 Hari Ganti Baru</span>
                  </div>

                  {/* Desktop Prev & Next Arrows (Direct Variant Referencing) */}
                  {allImages && allImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImageDesktop}
                        className="absolute left-3.5 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-800 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-white active:scale-90 dark:border-slate-700/70 dark:bg-slate-900/85 dark:text-slate-100"
                        aria-label="Gambar Sebelumnya"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImageDesktop}
                        className="absolute right-3.5 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-800 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-white active:scale-90 dark:border-slate-700/70 dark:bg-slate-900/85 dark:text-slate-100"
                        aria-label="Gambar Selanjutnya"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {allImages && allImages.length > 1 && (
                  <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
                    {allImages.map((img: string, i: number) => {
                      const isSelected = selectedImage === img
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSelectedImage(img)
                            const matchingVar = findVariantForImage(img)
                            if (matchingVar) {
                              handleSelectVariant(matchingVar)
                            }
                          }}
                          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border transition-all duration-200 ${
                            isSelected
                              ? 'border-slate-950 ring-2 ring-slate-950/20 dark:border-white dark:ring-white/20'
                              : 'border-slate-200/80 opacity-70 hover:opacity-100 dark:border-slate-800'
                          }`}
                        >
                          <Image
                            src={img}
                            alt="Thumbnail"
                            fill
                            sizes="64px"
                            unoptimized
                            className="object-cover"
                          />
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Mobile-only: Large selected image preview below thumbnails */}
                <div className="shadow-xs relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden">
                  {/* Image clipped with padding effect via absolute inset — same as desktop */}
                  <div className="absolute inset-4 overflow-hidden rounded-2xl">
                    <Image
                      key={selectedImage}
                      src={
                        selectedImage ||
                        product.images?.[0] ||
                        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=80'
                      }
                      alt={product.name}
                      fill
                      sizes="100vw"
                      priority
                      unoptimized
                      className="object-contain transition-all duration-300"
                    />
                  </div>
                  {/* Warranty stamp on mobile */}
                  <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
                    <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Garansi 30 Hari Ganti Baru</span>
                  </div>
                </div>

                {/* Store Identity Mini-Bento */}
                {product.store && (
                  <div className="shadow-xs space-y-3 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        {product.store.logo ? (
                          <img
                            src={product.store.logo}
                            alt={product.store.name}
                            className="shadow-2xs h-10 w-10 shrink-0 rounded-2xl border border-slate-200/60 object-cover dark:border-slate-700"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Store className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-bold text-slate-950 dark:text-white">
                            {product.store.name}
                          </h4>
                          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {product.store.city}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/toko/${product.store.slug}`}
                        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:px-3 sm:text-[11px]"
                      >
                        <span>
                          Profil<span className="hidden sm:inline"> Toko</span>
                        </span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                      </Link>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                      <span className="text-[11px] text-slate-400">
                        📍 {product.store.address}
                      </span>
                      <button
                        type="button"
                        onClick={handleChatStore}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-700 transition-colors hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300"
                      >
                        <MessageSquare className="h-3 w-3 text-orange-500" />
                        <span>Chat Toko</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Unified Showcase Bento (7 cols) */}
              <div className="space-y-4 lg:col-span-7">
                {/* Primary Bento Panel: Product Info, Variants, Bonus & Actions */}
                <div className="shadow-xs space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                  {/* 1. Header & Price */}
                  <div className="space-y-3 border-b border-slate-100 pb-5 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {product.brand || 'Smartphone'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Kondisi:{' '}
                        {product.condition === 'SECOND_MULUS'
                          ? 'Second Mulus (95% - 98%)'
                          : product.condition === 'GRADE_A'
                            ? 'Second Grade A (Normal 100%)'
                            : 'Second Like New (Mulus 99%)'}
                      </span>

                      {/* Total Product Stock Badge */}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Package className="h-3 w-3 shrink-0 text-slate-500" />
                        <span>Total Stok: {totalStock} Unit</span>
                      </span>
                    </div>

                    <h1 className="text-xl font-bold leading-snug tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                      {product.name}
                    </h1>

                    <div className="flex flex-wrap items-baseline gap-3 pt-0.5">
                      <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                        Rp {currentPrice.toLocaleString('id-ID')}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs tabular-nums text-slate-400 line-through">
                          Rp {product.originalPrice.toLocaleString('id-ID')}
                        </span>
                      )}
                      {discountAmount > 0 && (
                        <span className="rounded-full border border-emerald-200/50 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Hemat Rp {discountAmount.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Hardware Variants Selector with Individual Variant Stock */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-500">
                          Pilihan Varian & Ketersediaan Stok
                        </label>
                        {selectedVariant && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                            <span className="max-w-[160px] truncate sm:max-w-[220px]">
                              {selectedVariant.name}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                                (selectedVariant.stock || 0) <= 0
                                  ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                  : (selectedVariant.stock || 0) <= 3
                                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {(selectedVariant.stock || 0) > 0
                                ? `Sisa ${selectedVariant.stock} unit`
                                : 'Stok Habis'}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {product.variants.map((variant: any) => {
                          const isSelected = selectedVariant?.id === variant.id
                          const variantStock = Number(variant.stock) || 0
                          const isVarOutOfStock = variantStock <= 0
                          const hasDuplicateColorInName =
                            variant.color &&
                            variant.name
                              .toLowerCase()
                              .includes(variant.color.toLowerCase())

                          return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => handleSelectVariant(variant)}
                              className={`relative rounded-2xl border p-3 text-left transition-all duration-200 ${
                                isSelected
                                  ? 'shadow-xs border-orange-500 bg-orange-50/20 text-slate-900 ring-1 ring-orange-500/40 dark:border-orange-500 dark:bg-orange-950/15 dark:text-white'
                                  : isVarOutOfStock
                                    ? 'border-slate-200/60 bg-slate-100/40 text-slate-400 opacity-50 dark:border-slate-800 dark:bg-slate-900/40'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                {variant.image && (
                                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800">
                                    <Image
                                      src={variant.image}
                                      alt={variant.name}
                                      fill
                                      sizes="44px"
                                      unoptimized
                                      className="object-contain p-0.5"
                                    />
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div
                                      className={`truncate text-xs leading-tight ${
                                        isSelected
                                          ? 'font-bold text-slate-900 dark:text-white'
                                          : 'font-semibold text-slate-800 dark:text-slate-200'
                                      }`}
                                    >
                                      {variant.name}
                                    </div>
                                    {/* Variant Stock Badge */}
                                    <span
                                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                        variantStock <= 0
                                          ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                          : variantStock <= 3
                                            ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                      }`}
                                    >
                                      {variantStock > 5
                                        ? `Stok: ${variantStock}`
                                        : variantStock > 0
                                          ? `Sisa ${variantStock}`
                                          : 'Habis'}
                                    </span>
                                  </div>

                                  <div className="mt-1 flex items-center justify-between gap-2">
                                    <span
                                      className={`text-[11px] ${
                                        isSelected
                                          ? 'font-bold text-orange-600 dark:text-orange-400'
                                          : 'font-medium text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      Rp {variant.price.toLocaleString('id-ID')}
                                    </span>
                                    {variant.color &&
                                      !hasDuplicateColorInName && (
                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                          {variant.color}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. 3-in-1 Bonus Package Reassurance Box */}
                  <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        <Gift className="h-4 w-4 text-orange-500" /> Paket
                        Aksesoris 3-in-1 Otomatis Disertakan
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        GRATIS (Rp 0)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>Charger GaN 20W</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>Antigores 9D HD</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>Matte Case Presisi</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Purchase Action Row */}
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                      {/* Quantity Stepper */}
                      <div className="flex w-32 shrink-0 items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 dark:border-slate-800 dark:bg-slate-800/60">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={isOutOfStock || quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-700"
                          aria-label="Kurangi jumlah"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                          {isOutOfStock ? 0 : quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(Math.min(availableStock, quantity + 1))
                          }
                          disabled={isOutOfStock || quantity >= availableStock}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-700"
                          aria-label="Tambah jumlah"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Chat Store Button */}
                      <button
                        type="button"
                        onClick={handleChatStore}
                        className="shadow-2xs inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-orange-200 bg-orange-50/80 px-4 py-3.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100 active:scale-[0.99] dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300"
                        title="Tanya unit atau negosiasi ke toko"
                      >
                        <MessageSquare className="h-4 w-4 text-orange-500" />
                        <span>Chat Toko</span>
                      </button>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className="shadow-2xs flex-1 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        {isAddedToCart ? (
                          <span className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <Check className="h-4 w-4" /> Masuk Keranjang
                          </span>
                        ) : isOutOfStock ? (
                          'Stok Varian Habis'
                        ) : (
                          '+ Keranjang'
                        )}
                      </button>

                      {/* Buy Now Button */}
                      <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span>
                          {isOutOfStock ? 'Stok Habis' : 'Beli Sekarang'}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Trust Micro-Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-blue-600" /> Logistik
                        Wajib Asuransi 100% (JNE & Gojek)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />{' '}
                        Garansi 30 Hari Tukar Unit Gadget Second
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secondary Bento Panel: Description & Specifications Section */}
                <div className="shadow-xs space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Deskripsi & Jaminan Unit
                    </h3>
                    <div className="relative mt-2">
                      <div
                        className={`text-xs leading-relaxed text-slate-600 dark:text-slate-400 transition-all duration-300 ${
                          !isDesktopDescExpanded
                            ? 'line-clamp-4 overflow-hidden'
                            : ''
                        }`}
                      >
                        <p className="whitespace-pre-line">
                          {product.description ||
                            'Unit smartphone second original bergaransi toko fisik 30 hari tukar unit. Seluruh unit telah melalui uji fungsi komprehensif teknisi (layar, kamera, baterai, sinyal & IMEI bebas blokir), dan dilengkapi bonus aksesoris 3-in-1.'}
                        </p>
                      </div>

                      {/* Subtle fade overlay when collapsed */}
                      {!isDesktopDescExpanded &&
                        ((product.description || '').length > 200 ||
                          (product.description || '').includes('\n')) && (
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80" />
                        )}
                    </div>

                    {((product.description || '').length > 200 ||
                      (product.description || '').includes('\n')) && (
                      <button
                        type="button"
                        onClick={() =>
                          setIsDesktopDescExpanded(!isDesktopDescExpanded)
                        }
                        className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <span>
                          {isDesktopDescExpanded
                            ? 'Tampilkan Lebih Sedikit'
                            : 'Lihat Selengkapnya'}
                        </span>
                        {isDesktopDescExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Spesifikasi Varian Dinamis */}
                  <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5 dark:border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Spesifikasi Varian{' '}
                          {selectedVariant ? `: ${selectedVariant.name}` : ''}
                        </h4>
                      </div>
                      {selectedVariant?.sku && (
                        <span className="font-mono text-[10px] text-slate-400">
                          SKU: {selectedVariant.sku}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white px-3 py-2 dark:border-slate-700/60 dark:bg-slate-900/60">
                        <span className="text-slate-400">Storage :</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedVariant?.storage ||
                            (product.specs as any)?.['Storage'] ||
                            (product.specs as any)?.['ROM'] ||
                            '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white px-3 py-2 dark:border-slate-700/60 dark:bg-slate-900/60">
                        <span className="text-slate-400">RAM :</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedVariant?.ram ||
                            (product.specs as any)?.['RAM'] ||
                            '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white px-3 py-2 dark:border-slate-700/60 dark:bg-slate-900/60">
                        <span className="text-slate-400">Warna :</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedVariant?.color ||
                            (product.specs as any)?.['Warna'] ||
                            '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white px-3 py-2 dark:border-slate-700/60 dark:bg-slate-900/60">
                        <span className="text-slate-400">Kondisi Fisik :</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {product.condition === 'SECOND_MULUS'
                            ? 'Second Mulus (95% - 98%)'
                            : product.condition === 'GRADE_A'
                              ? 'Second Grade A (Normal 100%)'
                              : product.condition === 'LIKE_NEW'
                                ? 'Second Like New (Mulus 99%)'
                                : product.condition || 'Second Teruji'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white px-3 py-2 dark:border-slate-700/60 dark:bg-slate-900/60">
                        <span className="text-slate-400">Garansi Unit :</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {product.warrantyDays || 30} Hari Tukar Unit
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white px-3 py-2 dark:border-slate-700/60 dark:bg-slate-900/60">
                        <span className="text-slate-400">
                          Ketersediaan Stok :
                        </span>
                        <span
                          className={`font-bold ${
                            (selectedVariant?.stock ?? product.stock) > 0
                              ? 'text-slate-900 dark:text-white'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {(selectedVariant?.stock ?? product.stock) > 0
                            ? `${selectedVariant?.stock ?? product.stock} Unit Siap Kirim`
                            : 'Stok Habis'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spesifikasi Tambahan Hardware (Jika ada) */}
                  {product.specs && Object.keys(product.specs).length > 0 && (
                    <div className="space-y-2.5 border-t border-slate-100 pt-2 dark:border-slate-800">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Spesifikasi Tambahan
                      </h4>
                      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                        {Object.entries(product.specs).map(([key, value]) => {
                          if (['Storage', 'ROM', 'RAM', 'Warna'].includes(key))
                            return null
                          return (
                            <div
                              key={key}
                              className="flex items-baseline justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/30"
                            >
                              <span className="shrink-0 text-slate-400">
                                {key} :
                              </span>
                              <span className="truncate text-right font-medium text-slate-800 dark:text-slate-200">
                                {String(value)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buyer Reviews & Testimonials Section */}
            <ProductReviewsSection
              productId={product.id}
              productName={product.name}
              storeName={product.store?.name}
            />
          </div>
        </main>

        <Footer variant="light" />
      </div>
    </>
  )
}
