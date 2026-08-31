'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { useCartStore } from '@/lib/store/cart-store'
import { ProductReviewsSection } from '@/components/gadget/product-reviews-section'
import {
  ShieldCheck,
  Gift,
  Truck,
  Store,
  CheckCircle2,
  ChevronRight,
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
  const id = params?.id as string

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isAddedToCart, setIsAddedToCart] = useState(false)

  const { addItem } = useCartStore()

  useEffect(() => {
    if (id) {
      fetchProductDetail()
    }
  }, [id])

  const fetchProductDetail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/gadgets/${id}`)
      const data = await res.json()
      if (data.success && data.data) {
        setProduct(data.data)
        if (data.data.images && data.data.images.length > 0) {
          setSelectedImage(data.data.images[0])
        }
        if (data.data.variants && data.data.variants.length > 0) {
          const firstWithStock = data.data.variants.find((v: any) => (v.stock || 0) > 0)
          setSelectedVariant(firstWithStock || data.data.variants[0])
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

    const priceToUse = selectedVariant ? selectedVariant.price : product.price
    const variantName = selectedVariant ? selectedVariant.name : undefined
    const variantId = selectedVariant ? selectedVariant.id : undefined

    addItem({
      type: 'PRODUCT',
      productId: product.id,
      variantId: variantId,
      variantName: variantName,
      name: `${product.name} ${variantName ? `(${variantName})` : ''}`,
      price: priceToUse,
      image: selectedImage || (product.images && product.images[0]) || '',
      quantity: quantity,
      stock: selectedVariant?.stock || product.stock,
      notes: `${product.warrantyDays || 30} Hari Garansi Toko + Free Bonus 3-in-1`,
    })

    setIsAddedToCart(true)
    toast.success('Produk berhasil ditambahkan ke keranjang!')
    setTimeout(() => setIsAddedToCart(false), 2500)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    router.push('/cart')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
        <Navbar variant="light" />
        <div className="flex h-96 items-center justify-center pt-28">
          <div className="text-center text-slate-400">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500 mb-3" />
            <p className="text-xs font-medium">Memuat spesifikasi unit gadget...</p>
          </div>
        </div>
        <Footer variant="light" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
        <Navbar variant="light" />
        <div className="container mx-auto px-4 py-36 text-center max-w-md">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-10 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h1 className="text-lg font-bold text-slate-950 dark:text-white">Gadget Tidak Ditemukan</h1>
            <p className="text-xs text-slate-500">Unit mungkin sudah terjual habis atau tautan tidak valid.</p>
            <div className="pt-2">
              <Link
                href="/gadget"
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 transition"
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

  const totalStock = product.variants && product.variants.length > 0
    ? product.variants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0)
    : (Number(product.stock) || 0)

  const availableStock = selectedVariant ? (Number(selectedVariant.stock) || 0) : totalStock
  const isOutOfStock = availableStock <= 0

  const handleSelectVariant = (variant: any) => {
    setSelectedVariant(variant)
    const variantStock = Number(variant.stock) || 0
    if (variantStock <= 0) {
      setQuantity(0)
    } else if (quantity > variantStock || quantity === 0) {
      setQuantity(1)
    }
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product.price
  const discountAmount = product.originalPrice && product.originalPrice > currentPrice ? product.originalPrice - currentPrice : 0

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
      <Navbar variant="light" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <nav className="mb-6 flex items-center gap-2 text-xs font-normal text-slate-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Beranda
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <Link href="/gadget" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Katalog Gadget
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-xs">
              {product.name}
            </span>
          </nav>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            
            {/* Left Column: Media Gallery & Store Card (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Main Image Container */}
              <div className="relative aspect-4/3 sm:aspect-square rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex items-center justify-center">
                <div className="relative h-full w-full">
                  <Image
                    src={selectedImage || product.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=80'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    priority
                    className="object-contain transition-transform duration-300"
                  />
                </div>

                {/* Warranty Stamp */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1 text-[10px] font-semibold text-slate-700 shadow-2xs backdrop-blur-xs dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Garansi 30 Hari Ganti Baru</span>
                </div>
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {product.images.map((img: string, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden border transition-all duration-200 ${
                        selectedImage === img
                          ? 'border-slate-950 ring-2 ring-slate-950/20 dark:border-white dark:ring-white/20'
                          : 'border-slate-200/80 opacity-70 hover:opacity-100 dark:border-slate-800'
                      }`}
                    >
                      <Image src={img} alt="Thumbnail" fill sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Store Identity Mini-Bento */}
              {product.store && (
                <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-950 dark:text-white">
                          {product.store.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {product.store.city}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/toko/${product.store.slug}`}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                    >
                      <span>Profil Toko</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      📍 {product.store.address}
                    </span>
                    <Link
                      href={`/dashboard/customer/chat?storeId=${product.store.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-700 hover:bg-orange-100 transition-colors dark:bg-orange-950/40 dark:text-orange-300 shrink-0"
                    >
                      <MessageSquare className="h-3 w-3 text-orange-500" />
                      <span>Chat Toko</span>
                    </Link>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Unified Showcase Bento (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Primary Bento Panel: Product Info, Variants, Bonus & Actions */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                
                {/* 1. Header & Price */}
                <div className="space-y-3 border-b border-slate-100 pb-5 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {product.brand || 'Smartphone'}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/40">
                      Kondisi: {product.condition === 'SECOND_MULUS' ? 'Second Mulus (95% - 98%)' : product.condition === 'GRADE_A' ? 'Second Grade A (Normal 100%)' : 'Second Like New (Mulus 99%)'}
                    </span>
                    
                    {/* Total Product Stock Badge */}
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-bold border ${
                      totalStock > 5
                        ? 'bg-slate-50 text-slate-700 border-slate-200/90 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                        : totalStock > 0
                        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60'
                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60'
                    }`}>
                      <Package className="h-3 w-3 text-orange-500 shrink-0" />
                      <span>Total Stok: {totalStock} Unit</span>
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white leading-snug">
                    {product.name}
                  </h1>

                  <div className="flex flex-wrap items-baseline gap-3 pt-0.5">
                    <span className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white tabular-nums tracking-tight">
                      Rp {currentPrice.toLocaleString('id-ID')}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-slate-400 line-through tabular-nums">
                        Rp {product.originalPrice.toLocaleString('id-ID')}
                      </span>
                    )}
                    {discountAmount > 0 && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
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
                        <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="truncate max-w-[160px] sm:max-w-[220px]">{selectedVariant.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            (selectedVariant.stock || 0) > 5
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : (selectedVariant.stock || 0) > 0
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/50 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}>
                            {(selectedVariant.stock || 0) > 0 ? `Sisa ${selectedVariant.stock} unit` : 'Stok Habis'}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {product.variants.map((variant: any) => {
                        const isSelected = selectedVariant?.id === variant.id
                        const variantStock = Number(variant.stock) || 0
                        const isVarOutOfStock = variantStock <= 0

                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => handleSelectVariant(variant)}
                            className={`rounded-2xl border p-3 text-left transition-all duration-200 ${
                              isSelected
                                ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950 shadow-2xs'
                                : isVarOutOfStock
                                ? 'border-slate-200/60 bg-slate-100/60 text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900/40'
                                : 'border-slate-200/80 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-xs font-bold leading-tight">{variant.name}</div>
                              {/* Variant Stock Badge */}
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isSelected
                                    ? variantStock > 5
                                      ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950'
                                      : variantStock > 0
                                      ? 'bg-amber-400/30 text-amber-200 dark:bg-amber-500/20 dark:text-amber-800'
                                      : 'bg-rose-400/30 text-rose-200 dark:bg-rose-500/20 dark:text-rose-800'
                                    : variantStock > 5
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : variantStock > 0
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400'
                                }`}
                              >
                                {variantStock > 5
                                  ? `Stok: ${variantStock}`
                                  : variantStock > 0
                                  ? `Sisa ${variantStock}!`
                                  : 'Habis'}
                              </span>
                            </div>
                            <div
                              className={`text-[11px] font-medium mt-1 ${
                                isSelected
                                  ? 'text-slate-300 dark:text-slate-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              Rp {variant.price.toLocaleString('id-ID')}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 3. 3-in-1 Bonus Package Reassurance Box */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Gift className="h-4 w-4 text-orange-500" /> Paket Aksesoris 3-in-1 Otomatis Disertakan
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      GRATIS (Rp 0)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Charger GaN 20W</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Antigores 9D HD</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Matte Case Presisi</span>
                    </div>
                  </div>
                </div>

                {/* 4. Purchase Action Row */}
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    
                    {/* Quantity Stepper */}
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 dark:border-slate-800 dark:bg-slate-800/60 shrink-0 w-32">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={isOutOfStock || quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-700 transition"
                        aria-label="Kurangi jumlah"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                        {isOutOfStock ? 0 : quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                        disabled={isOutOfStock || quantity >= availableStock}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-700 transition"
                        aria-label="Tambah jumlah"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className="flex-1 rounded-2xl border border-slate-200/80 bg-white py-3.5 px-4 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
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
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 px-6 text-xs font-bold text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition"
                    >
                      <span>{isOutOfStock ? 'Stok Habis' : 'Beli Sekarang'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                  </div>

                  {/* Trust Micro-Badges */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-blue-600" /> Logistik Wajib Asuransi 100% (JNE & Gojek)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5 text-emerald-600" /> Garansi 30 Hari Tukar Unit Gadget Second
                    </span>
                  </div>
                </div>

              </div>

              {/* Secondary Bento Panel: Description Section */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Deskripsi & Jaminan Unit
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {product.description || 'Unit smartphone second original bergaransi toko fisik 30 hari tukar unit. Seluruh unit telah melalui uji fungsi komprehensif teknisi (layar, kamera, baterai, sinyal & IMEI bebas blokir), dan dilengkapi bonus aksesoris 3-in-1.'}
                </p>
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
  )
}
