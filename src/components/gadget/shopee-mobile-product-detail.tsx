'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ShoppingBag,
  Share2,
  Heart,
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

  const currentImageIdx = allImages.indexOf(selectedImage)
  const displayIdx = currentImageIdx >= 0 ? currentImageIdx + 1 : 1
  const totalImagesCount = allImages.length > 0 ? allImages.length : 1

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Tautan produk berhasil disalin!')
      }
    } catch {
      toast.info('Bagikan halaman ini ke rekan Anda!')
    }
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

  return (
    <div className="relative min-h-screen bg-slate-50 pb-24 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Sleek Floating Header App Bar */}
      <header
        className={`fixed left-0 right-0 top-0 z-40 transition-all duration-200 ${
          isScrolled
            ? 'shadow-xs border-b border-slate-200/80 bg-white/95 py-2.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95'
            : 'bg-gradient-to-b from-black/40 via-transparent to-transparent py-3'
        }`}
      >
        <div className="flex items-center justify-between px-3">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => router.back()}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
              isScrolled
                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white'
                : 'shadow-xs border border-white/20 bg-white/80 text-slate-900 backdrop-blur-md hover:bg-white dark:bg-slate-900/80 dark:text-white'
            }`}
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

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

      {/* 2. Hero Square Media Gallery */}
      <div className="relative aspect-square w-full border-b border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900">
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
          className="object-contain p-6 transition-all duration-300"
        />

        {/* Subtle Warranty Badge on bottom-left */}
        <div className="shadow-xs backdrop-blur-xs absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1 text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Garansi 30 Hari Tukar Unit</span>
        </div>

        {/* Clean Slide Counter on bottom-right */}
        <div className="shadow-xs backdrop-blur-xs absolute bottom-3 right-3 z-10 rounded-full border border-slate-200/60 bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300">
          {displayIdx} / {totalImagesCount}
        </div>
      </div>

      {/* 3. Product Primary Info & Pricing */}
      <div className="space-y-3 border-b border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {/* Semantic Badges: Brand & Condition */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {product.brand || 'Gadget'}
          </span>
          <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            {conditionLabel}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
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
        <h1 className="text-base font-bold leading-snug text-slate-950 dark:text-white">
          {product.name}
        </h1>

        {/* Price Row */}
        <div className="flex items-baseline justify-between gap-3 pt-0.5">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums tracking-tight text-slate-950 dark:text-white">
              Rp {currentPrice.toLocaleString('id-ID')}
            </span>

            {product.originalPrice && product.originalPrice > currentPrice && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-normal tabular-nums text-slate-400 line-through">
                  Rp {product.originalPrice.toLocaleString('id-ID')}
                </span>
                <span className="rounded-md border border-rose-200/60 bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
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
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-slate-500 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400"
            aria-label="Simpan ke Favorit"
          >
            <Heart
              className={`h-4 w-4 ${
                isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 4. Elegant Variant Selector */}
      {product.variants && product.variants.length > 0 && (
        <div className="mt-2 space-y-2.5 border-y border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              Pilihan Varian ({product.variants.length})
            </span>
            {selectedVariant && (
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Terpilih:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {selectedVariant.name}
                </strong>
              </span>
            )}
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
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
                  type="button"
                  onClick={() => onSelectVariant(v)}
                  disabled={vStock <= 0}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                    isSelected
                      ? 'shadow-xs border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                      : vStock <= 0
                        ? 'border-slate-200/50 bg-slate-50 text-slate-400 opacity-50 dark:border-slate-800 dark:bg-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300'
                  }`}
                >
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={vImg}
                      alt={v.name}
                      fill
                      sizes="36px"
                      unoptimized
                      className="object-contain p-0.5"
                    />
                  </div>
                  <div className="min-w-0 pr-1">
                    <p className="truncate text-xs font-bold leading-tight">
                      {v.name}
                    </p>
                    <p
                      className={`text-[10px] font-medium ${
                        isSelected
                          ? 'text-slate-200 dark:text-slate-700'
                          : 'text-slate-500 dark:text-slate-400'
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
      <div className="mt-2 flex items-center justify-between border-y border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Jumlah Pesanan
          </span>
          <p className="text-[11px] text-slate-400">
            Maksimal pembelian {availableStock} unit
          </p>
        </div>

        <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={isOutOfStock || quantity <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Kurangi jumlah"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-xs font-bold tabular-nums text-slate-900 dark:text-white">
            {isOutOfStock ? 0 : quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
            disabled={isOutOfStock || quantity >= availableStock}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Tambah jumlah"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 6. Paket Bonus 3-in-1 Reassurance Card (Clean Minimalist) */}
      <div className="mt-2 space-y-2.5 border-y border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-orange-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Paket Bonus Aksesoris 3-in-1
            </h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            Gratis (Rp 0)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-800/40">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">Charger 20W</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-800/40">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">Antigores 9D</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-800/40">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">Matte Case</span>
          </div>
        </div>
      </div>

      {/* 7. Shipping & Physical Warranty Info Rows */}
      <div className="mt-2 space-y-0 divide-y divide-slate-100 border-y border-slate-200/70 bg-white text-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 p-3.5">
          <Truck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 dark:text-white">
              Logistik Terproteksi (JNE & Gojek)
            </p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              Wajib Asuransi 100% • Dikirim dari{' '}
              {product.store?.city || 'Toko Cabang'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 dark:text-white">
              Garansi Toko Fisik 30 Hari
            </p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              Tukar Unit Baru • Bebas Blokir IMEI Seumur Hidup
            </p>
          </div>
        </div>
      </div>

      {/* 8. Real Store Profile Card */}
      {product.store && (
        <div className="mt-2 space-y-3 border-y border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {product.store.logo ? (
                <img
                  src={product.store.logo}
                  alt={product.store.name}
                  className="h-11 w-11 shrink-0 rounded-2xl border border-slate-200/80 object-cover dark:border-slate-700"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Store className="h-5 w-5" />
                </div>
              )}

              <div className="min-w-0">
                <h3 className="truncate text-xs font-bold text-slate-950 dark:text-white">
                  {product.store.name}
                </h3>
                {product.store.companyName && (
                  <p className="truncate text-[11px] text-slate-400">
                    {product.store.companyName}
                  </p>
                )}
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="truncate">{product.store.city}</span>
                </div>
              </div>
            </div>

            <Link
              href={`/toko/${product.store.slug}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>Lihat Toko</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Real store metrics */}
          <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 pt-2.5 text-center text-xs dark:divide-slate-800 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {product.store?._count?.products ||
                  otherStoreProducts.length ||
                  1}
              </p>
              <p className="text-[10px] text-slate-400">Katalog Tersedia</p>
            </div>
            <div>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                Terverifikasi
              </p>
              <p className="text-[10px] text-slate-400">Toko Fisik Resmi</p>
            </div>
          </div>
        </div>
      )}

      {/* 9. Produk Lain dari Toko Ini (Jika ada) */}
      {otherStoreProducts.length > 0 && (
        <div className="mt-2 border-y border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Unit Lain di Toko Ini
            </h3>
            <Link
              href={`/toko/${product.store?.slug}`}
              className="flex items-center gap-0.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Lihat Semua
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
            {otherStoreProducts.map((item: any) => {
              const itemImg =
                item.images?.[0] ||
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'
              return (
                <Link
                  key={item.id}
                  href={`/gadget/${item.id}`}
                  className="w-28 shrink-0 rounded-xl border border-slate-200/70 bg-white p-2 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-900">
                    <Image
                      src={itemImg}
                      alt={item.name}
                      fill
                      sizes="112px"
                      unoptimized
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    <p className="line-clamp-2 min-h-[2rem] text-[10px] font-medium leading-tight text-slate-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-[11px] font-bold text-slate-950 dark:text-white">
                      Rp {(item.price || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* 10. Spesifikasi Hardware Accordion */}
      <div className="mt-2 border-y border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Spesifikasi Detail
          </h3>
          <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
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
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
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
      <div className="mt-2 border-y border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
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
          className="mt-2.5 flex w-full items-center justify-center gap-1 border-t border-slate-100 pt-2 text-xs font-bold text-blue-600 dark:border-slate-800 dark:text-blue-400"
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
      <div className="mt-2 border-y border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <ProductReviewsSection
          productId={product.id}
          productName={product.name}
          storeName={product.store?.name}
        />
      </div>

      {/* 13. Rekomendasi Gadget Terkait (2 Kolom Bersih) */}
      {relatedProducts.length > 0 && (
        <div className="mt-4 px-3">
          <div className="mb-3 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rekomendasi Gadget Lainnya
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {relatedProducts.map((rel: any) => {
              const relImg =
                rel.images?.[0] ||
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'
              return (
                <Link
                  key={rel.id}
                  href={`/gadget/${rel.id}`}
                  className="shadow-xs group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-2.5 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950">
                      <Image
                        src={relImg}
                        alt={rel.name}
                        fill
                        sizes="180px"
                        unoptimized
                        className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="mt-2 space-y-1">
                      <h4 className="line-clamp-2 min-h-[2rem] text-xs font-bold leading-tight text-slate-900 dark:text-white">
                        {rel.name}
                      </h4>
                      <p className="text-xs font-black text-slate-950 dark:text-white">
                        Rp {(rel.price || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-400 dark:border-slate-800">
                    <span className="truncate">
                      {rel.store?.city || 'Toko Resmi'}
                    </span>
                    <span className="shrink-0 font-semibold text-emerald-600">
                      Garansi 30H
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Floating Scroll To Top Button */}
      {showBackToTop && (
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
    </div>
  )
}
