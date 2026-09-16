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
  ArrowUp,
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
      toast.info('Bagikan halaman ini ke teman Anda!')
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const otherStoreProducts = product?.store?.products || []
  const relatedProducts = product?.relatedProducts || []

  return (
    <div className="relative min-h-screen bg-slate-100 pb-24 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Shopee Floating Header App Bar */}
      <header
        className={`fixed left-0 right-0 top-0 z-40 transition-all duration-200 ${
          isScrolled
            ? 'shadow-xs border-b border-slate-200/80 bg-white/95 py-2.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95'
            : 'bg-transparent py-3'
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
                : 'backdrop-blur-xs bg-black/45 text-white hover:bg-black/60'
            }`}
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
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
                  : 'backdrop-blur-xs bg-black/45 text-white hover:bg-black/60'
              }`}
              aria-label="Keranjang Belanja"
            >
              <ShoppingBag className="h-4 w-4" />
              {totalCartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[9px] font-black text-white shadow-sm">
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
                  : 'backdrop-blur-xs bg-black/45 text-white hover:bg-black/60'
              }`}
              aria-label="Bagikan"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Square Media Gallery (Full Width Edge-to-Edge) */}
      <div className="relative aspect-square w-full bg-white dark:bg-slate-900">
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
          className="object-contain p-4 transition-all duration-300"
        />

        {/* Brand watermark / Official pill on bottom-left */}
        <div className="backdrop-blur-xs absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900/90 dark:text-white">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Garansi 30 Hari Ganti Baru</span>
        </div>

        {/* Counter Badge on bottom-right (e.g. 1/4) */}
        <div className="shadow-xs backdrop-blur-xs absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white">
          {displayIdx}/{totalImagesCount}
        </div>
      </div>

      {/* 3. Shopee Variant Quick-Selector Strip (Screenshot 1) */}
      {product.variants && product.variants.length > 0 && (
        <div className="border-b border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{product.variants.length} Variasi Tersedia</span>
            {selectedVariant && (
              <span className="truncate text-slate-800 dark:text-slate-200">
                Pilihan:{' '}
                <strong className="text-orange-600">
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
                  className={`flex shrink-0 items-center gap-2 rounded-xl border p-1.5 pr-3 text-left transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/60 ring-1 ring-orange-500 dark:bg-orange-950/40'
                      : vStock <= 0
                        ? 'border-slate-200/50 bg-slate-50 text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900">
                    <Image
                      src={vImg}
                      alt={v.name}
                      fill
                      sizes="36px"
                      unoptimized
                      className="object-contain p-0.5"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold leading-tight">
                      {v.name}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500">
                      Rp {v.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. Shopee Price & Social Proof Section (Screenshot 1) */}
      <div className="shadow-2xs space-y-3 bg-white p-3.5 dark:bg-slate-900">
        {/* Main Price Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums tracking-tight text-orange-600 dark:text-orange-500">
                Rp {currentPrice.toLocaleString('id-ID')}
              </span>

              {product.originalPrice &&
                product.originalPrice > currentPrice && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-normal tabular-nums text-slate-400 line-through">
                      Rp {product.originalPrice.toLocaleString('id-ID')}
                    </span>
                    <span className="rounded-xs py-0.2 bg-orange-100 px-1 text-[10px] font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                      -
                      {Math.round(
                        ((product.originalPrice - currentPrice) /
                          product.originalPrice) *
                          100
                      )}
                      %
                    </span>
                  </div>
                )}
            </div>

            {/* Installment Simulation */}
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                Rp {Math.round(currentPrice / 12).toLocaleString('id-ID')} x 12
                bulan dengan Cicilan
              </span>
              <ChevronRight className="h-3 w-3 text-slate-400" />
            </div>
          </div>

          {/* Social Proof: Sold Count & Wishlist Heart */}
          <div className="flex items-center gap-2 pt-1 text-slate-500">
            <span className="text-xs font-medium tabular-nums">
              {product.totalSales || 100}+ Terjual
            </span>
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
              className="p-1 text-slate-400 transition-colors hover:text-rose-500"
              aria-label="Favorit"
            >
              <Heart
                className={`h-5 w-5 ${
                  isWishlisted
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-slate-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Hadiah Gratis / Bonus 3-in-1 Banner (Screenshot 1) */}
        <div className="flex items-center justify-between rounded-xl bg-orange-50/70 p-2.5 text-xs text-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
          <div className="flex items-center gap-2">
            <span className="rounded-xs bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              Hadiah Gratis
            </span>
            <span className="truncate text-[11px] font-medium">
              Paket 3-in-1: Charger GaN 20W + Antigores + Case
            </span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-orange-600" />
        </div>

        {/* Product Title Banner */}
        <div className="pt-1">
          <div className="text-sm font-bold leading-snug text-slate-950 dark:text-white">
            <span className="rounded-xs mr-1.5 inline-block bg-red-600 px-1.5 py-0.5 align-middle text-[9px] font-black uppercase tracking-wider text-white">
              Mall
            </span>
            <span className="rounded-xs mr-1.5 inline-block bg-orange-600 px-1.5 py-0.5 align-middle text-[9px] font-black uppercase tracking-wider text-white">
              Ori
            </span>
            {product.name}
          </div>
        </div>
      </div>

      {/* 5. Shipping & Protection Rows (Screenshot 1) */}
      <div className="shadow-2xs mt-2 space-y-0 divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
        {/* Row 1: Shipping Estimate */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-start gap-2.5">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="text-xs">
              <p className="font-bold text-slate-900 dark:text-white">
                Pengiriman Terproteksi (JNE & Gojek)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Wajib Asuransi 100% • Dikirim dari{' '}
                {product.store?.city || 'Toko Cabang'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        </div>

        {/* Row 2: Warranty & Return Policy */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
            <div className="text-xs">
              <p className="font-bold text-slate-900 dark:text-white">
                Garansi 30 Hari Tukar Unit Baru
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                100% Original • Lolos Uji Fungsi 30 Poin • IMEI Bebas Blokir
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        </div>
      </div>

      {/* 6. Shopee Store Profile Bento Card (Screenshot 2) */}
      {product.store && (
        <div className="shadow-2xs mt-2 bg-white p-3.5 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {product.store.logo ? (
                <img
                  src={product.store.logo}
                  alt={product.store.name}
                  className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Store className="h-5 w-5" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {product.store.name}
                  </h3>
                  <span className="rounded-xs py-0.2 bg-red-600 px-1 text-[8px] font-black uppercase text-white">
                    Mall
                  </span>
                </div>
                <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Aktif baru saja • {product.store.city}
                </p>
              </div>
            </div>

            <Link
              href={`/toko/${product.store.slug}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-orange-500 px-3 py-1 text-xs font-bold text-orange-600 transition hover:bg-orange-50 dark:hover:bg-orange-950/40"
            >
              Kunjungi Toko
            </Link>
          </div>

          {/* Store 3-Stats Row (Screenshot 2) */}
          <div className="mt-3.5 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-3 text-center dark:divide-slate-800 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-orange-600 dark:text-orange-500">
                {product.store?._count?.products || 12}
              </p>
              <p className="text-[10px] text-slate-400">Produk</p>
            </div>
            <div>
              <p className="text-xs font-bold text-orange-600 dark:text-orange-500">
                {(product.store?.rating || 4.9).toFixed(1)}
              </p>
              <p className="text-[10px] text-slate-400">Penilaian</p>
            </div>
            <div>
              <p className="text-xs font-bold text-orange-600 dark:text-orange-500">
                100%
              </p>
              <p className="text-[10px] text-slate-400">Chat Dibalas</p>
            </div>
          </div>
        </div>
      )}

      {/* 7. PRODUK LAIN DARI TOKO INI Carousel (Screenshot 2) */}
      {otherStoreProducts.length > 0 && (
        <div className="shadow-2xs mt-2 bg-white p-3.5 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              PRODUK LAIN DARI TOKO INI
            </h3>
            <Link
              href={`/toko/${product.store?.slug}`}
              className="flex items-center gap-0.5 text-xs font-bold text-orange-600"
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
                  className="w-28 shrink-0 rounded-xl border border-slate-100 bg-white p-1.5 transition hover:border-orange-300 dark:border-slate-800 dark:bg-slate-950"
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
                    <p className="text-[11px] font-black text-orange-600">
                      Rp {(item.price || 0).toLocaleString('id-ID')}
                    </p>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      <span>{(item.rating || 5.0).toFixed(1)}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* 8. Spesifikasi Section (Screenshot 2) */}
      <div className="shadow-2xs mt-2 bg-white p-3.5 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Spesifikasi
          </h3>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>
              {product.brand || 'Gadget'}, Stok {availableStock}
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
              <span className="text-slate-400">Storage</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedVariant?.storage ||
                  (product.specs as any)?.['Storage'] ||
                  '-'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1 dark:border-slate-800/60">
              <span className="text-slate-400">RAM</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedVariant?.ram || (product.specs as any)?.['RAM'] || '-'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1 dark:border-slate-800/60">
              <span className="text-slate-400">Kondisi</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {product.condition === 'SECOND_MULUS'
                  ? 'Second Mulus (95% - 98%)'
                  : product.condition === 'GRADE_A'
                    ? 'Second Grade A'
                    : 'Second Like New'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1 dark:border-slate-800/60">
              <span className="text-slate-400">Masa Garansi</span>
              <span className="font-bold text-emerald-600">
                30 Hari Ganti Unit
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Dikirim Dari</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {product.store?.city || 'Indonesia'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 9. Deskripsi Section with Selengkapnya (Screenshot 3) */}
      <div className="shadow-2xs mt-2 bg-white p-3.5 dark:bg-slate-900">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          Deskripsi
        </h3>
        <div
          className={`text-xs leading-relaxed text-slate-600 dark:text-slate-400 ${
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
          className="mt-2.5 flex w-full items-center justify-center gap-1 border-t border-slate-100 pt-2 text-xs font-bold text-orange-600 dark:border-slate-800"
        >
          <span>{isDescExpanded ? 'Lebih Sedikit' : 'Selengkapnya'}</span>
          {isDescExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* 10. Penilaian Produk (Reviews) (Screenshot 3 & 4) */}
      <div className="shadow-2xs mt-2 bg-white p-3.5 dark:bg-slate-900">
        <ProductReviewsSection
          productId={product.id}
          productName={product.name}
          storeName={product.store?.name}
        />
      </div>

      {/* 11. "Kamu Mungkin Juga Suka" Shopee 2-Column Mobile Grid (Screenshot 5) */}
      {relatedProducts.length > 0 && (
        <div className="mt-2 p-2.5">
          <div className="mb-2.5 px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Kamu Mungkin Juga Suka
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
                  className="shadow-2xs group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-2 transition hover:border-orange-400 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-950">
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
                      <p className="text-xs font-black text-orange-600 dark:text-orange-500">
                        Rp {(rel.price || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-slate-50 pt-1 text-[10px] text-slate-400 dark:border-slate-800">
                    <span className="truncate">
                      {rel.store?.city || 'Toko Resmi'}
                    </span>
                    <span className="shrink-0">
                      {rel.totalReview || 0} Terjual
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Floating Scroll To Top Button (Screenshot 4 & 5) */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="bottom-18 fixed right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-orange-600 shadow-md transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
          aria-label="Kembali ke atas"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* 12. Fixed Bottom Floating Action Bar (Shopee Style) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center border-t border-slate-200/90 bg-white px-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        {/* Chat Store Button */}
        <button
          type="button"
          onClick={handleChatStore}
          className="flex flex-col items-center justify-center px-3 py-1 text-slate-600 transition hover:text-orange-600 active:scale-95 dark:text-slate-300"
        >
          <MessageSquare className="h-4 w-4 text-orange-500" />
          <span className="mt-0.5 text-[9.5px] font-semibold">
            Chat Sekarang
          </span>
        </button>

        {/* Add To Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="relative flex flex-col items-center justify-center px-3 py-1 text-slate-600 transition hover:text-orange-600 active:scale-95 disabled:opacity-40 dark:text-slate-300"
        >
          <ShoppingBag className="h-4 w-4 text-slate-700 dark:text-slate-200" />
          <span className="mt-0.5 text-[9.5px] font-semibold">
            {isAddedToCart ? 'Masuk!' : '+ Keranjang'}
          </span>
          {totalCartCount > 0 && (
            <span className="absolute right-2 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-orange-600 px-1 text-[8px] font-black text-white">
              {totalCartCount > 99 ? '99+' : totalCartCount}
            </span>
          )}
        </button>

        {/* Buy Now Button (Solid Action Orange) */}
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="ml-1.5 flex h-10 flex-1 items-center justify-center rounded-lg bg-orange-500 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isOutOfStock ? 'Stok Habis' : 'Beli Sekarang'}
        </button>
      </div>
    </div>
  )
}
