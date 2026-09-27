'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  Store,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  PhoneCall,
  ExternalLink,
  Sparkles,
  Building2,
  CheckCircle2,
  X,
  Share2,
  Star,
  Compass,
} from 'lucide-react'
import { toast } from 'sonner'

function ProductCardImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src)

  useEffect(() => {
    setImgSrc(src)
  }, [src])

  return (
    <Image
      src={
        imgSrc ||
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
      }
      alt={alt}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      unoptimized
      onError={() => {
        setImgSrc(
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
        )
      }}
      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
    />
  )
}

export default function StoreDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { data: session } = useSession()

  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [showChatPopup, setShowChatPopup] = useState<boolean>(true)

  useEffect(() => {
    if (slug) {
      fetchStoreDetail()
    }
  }, [slug])

  const fetchStoreDetail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stores/${slug}`)
      const data = await res.json()
      if (data.success && data.data) {
        setStore(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Find top flagship product for hero context
  const topFlagship = useMemo(() => {
    if (!store?.products || store.products.length === 0) return null
    return (
      store.products.find(
        (p: any) =>
          p.name?.toLowerCase().includes('fold') ||
          p.name?.toLowerCase().includes('pro max') ||
          p.name?.toLowerCase().includes('ultra')
      ) || store.products[0]
    )
  }, [store])

  // Filter products cleanly by category
  const filteredProducts = useMemo(() => {
    if (!store?.products) return []
    if (activeCategory === 'ALL') return store.products
    if (activeCategory === 'PHONE') {
      return store.products.filter(
        (p: any) =>
          p.brand?.toLowerCase() === 'apple' ||
          p.brand?.toLowerCase() === 'samsung' ||
          p.brand?.toLowerCase() === 'xiaomi' ||
          p.brand?.toLowerCase() === 'vivo' ||
          p.brand?.toLowerCase() === 'asus rog' ||
          p.brand?.toLowerCase() === 'google' ||
          p.name?.toLowerCase().includes('phone') ||
          p.name?.toLowerCase().includes('galaxy') ||
          p.name?.toLowerCase().includes('pro max') ||
          p.name?.toLowerCase().includes('pixel')
      )
    }
    if (activeCategory === 'WEARABLE') {
      return store.products.filter(
        (p: any) =>
          p.name?.toLowerCase().includes('watch') ||
          p.name?.toLowerCase().includes('airpods') ||
          p.name?.toLowerCase().includes('headphone') ||
          p.name?.toLowerCase().includes('earphone')
      )
    }
    if (activeCategory === 'ACCESSORY') {
      return store.products.filter(
        (p: any) =>
          p.name?.toLowerCase().includes('powerbank') ||
          p.name?.toLowerCase().includes('case') ||
          p.name?.toLowerCase().includes('charger') ||
          p.brand?.toLowerCase() === 'anker'
      )
    }
    return store.products
  }, [store, activeCategory])

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: store?.name,
          text: `Kunjungi gerai resmi ${store?.name}. Unit bergaransi 30 hari ganti baru!`,
          url: typeof window !== 'undefined' ? window.location.href : '',
        })
        .catch(() => {})
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Tautan gerai toko disalin ke clipboard')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-white text-black dark:bg-neutral-950 dark:text-white">
        <Navbar variant="light" />
        <div className="flex h-96 items-center justify-center pt-28">
          <div className="text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white" />
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Memuat Gerai Resmi...
            </p>
          </div>
        </div>
        <Footer variant="light" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-white text-black dark:bg-neutral-950 dark:text-white">
        <Navbar variant="light" />
        <div className="container mx-auto max-w-md px-4 py-36 text-center">
          <div className="space-y-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-10 dark:border-neutral-800 dark:bg-neutral-900">
            <Store className="mx-auto h-12 w-12 text-neutral-400" />
            <h1 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">
              Toko Tidak Ditemukan
            </h1>
            <p className="text-xs text-neutral-500">
              Tautan toko mungkin tidak valid atau belum terdaftar di sistem.
            </p>
            <div className="pt-2">
              <Link
                href="/toko"
                className="inline-flex items-center gap-1.5 rounded-full bg-black px-6 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Kembali ke Direktori Toko
              </Link>
            </div>
          </div>
        </div>
        <Footer variant="light" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black selection:bg-neutral-900 selection:text-white dark:bg-neutral-950 dark:text-white">
      <Navbar variant="light" />

      {/* ─────────────────────────────────────────────────────────────
          1A. DESKTOP HERO VIEWPORT: EXACTLY 100vh FULL VIEWPORT (pt-16 h-screen)
          Phones are taller, filling top-to-bottom, with right side clean for typography.
      ───────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative hidden h-screen w-full overflow-hidden bg-[#FBFBFD] pt-16 dark:bg-neutral-950 md:flex"
      >
        {/* Left Column (58%): Flagship Cutout Phones Artwork, Scaled Up to Fill Vertically */}
        <div className="relative flex h-full w-[58%] items-center justify-start overflow-hidden pl-4 lg:pl-8">
          <Image
            src="/images/banners/samsung-hero-flagship.jpg"
            alt="Galaxy Z Fold & Flip Flagship"
            fill
            priority
            sizes="60vw"
            className="hover:scale-130 origin-left scale-110 object-cover object-left transition-transform duration-700 lg:scale-125"
          />
        </div>

        {/* Right Column (42%): Sleek Typography & Actions in Clean Studio Whitespace */}
        <div className="z-10 flex h-full w-[42%] flex-col items-start justify-center space-y-5 pl-2 pr-8 lg:pl-6 lg:pr-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#0070F3] dark:text-sky-400 sm:text-sm">
            Available now
          </span>

          <h1 className="text-4xl font-black leading-[1.06] tracking-tight text-neutral-950 dark:text-white lg:text-5xl xl:text-6xl">
            Galaxy Z Fold8 | Fold8 | Flip8
          </h1>

          <p className="max-w-lg text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 lg:text-base">
            Eksplorasi kemewahan smartphone lipat generasi terdepan di gerai
            resmi {store.name}. Jaminan garansi 30 hari tukar unit baru & paket
            proteksi penuh kurir.
          </p>

          {topFlagship && (
            <p className="text-xl font-black tabular-nums text-neutral-900 dark:text-white lg:text-2xl">
              Mulai Rp{' '}
              {Number(topFlagship.price || 26499000).toLocaleString('id-ID')}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            {topFlagship ? (
              <Link
                href={`/gadget/${topFlagship.id}`}
                className="rounded-full bg-black px-8 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Beli Sekarang
              </Link>
            ) : (
              <a
                href="#katalog-produk"
                className="rounded-full bg-black px-8 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Lihat Koleksi
              </a>
            )}

            <Link
              href={`/dashboard/customer/chat?storeId=${store.id}`}
              className="shadow-xs rounded-full border border-neutral-300 bg-white px-7 py-3.5 text-xs font-bold text-neutral-900 transition hover:border-black hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-white"
            >
              Chat Konsultasi
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          1B. MOBILE HERO VIEWPORT: LUXURY FLAGSHIP MOBILE EXPERIENCE
          Designed specifically for mobile devices with Samsung/Apple flagship aesthetics
      ───────────────────────────────────────────────────────────── */}
      <section className="relative flex h-[100dvh] min-h-[580px] w-full flex-col justify-between overflow-hidden bg-gradient-to-b from-[#F5F6F8] via-[#FAFBFD] to-white pt-20 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 md:hidden">
        {/* Top: Clean Editorial Typography */}
        <div className="z-10 shrink-0 space-y-2 px-5 text-center">
          {/* Kicker Tag */}
          <div className="inline-flex items-center gap-1 pt-1 text-[11px] font-bold uppercase tracking-widest text-[#0070F3] dark:text-sky-400">
            <span>Galaxy AI is here</span>
            <Sparkles className="h-3 w-3" />
          </div>

          {/* Main Flagship Title */}
          <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-neutral-950 dark:text-white">
            Galaxy Z Fold8 | Flip8
          </h1>

          <p className="mx-auto line-clamp-2 max-w-sm px-3 text-xs text-neutral-500 dark:text-neutral-400">
            Generasi smartphone lipat paling canggih di gerai resmi {store.name}
            . Jaminan garansi 30 hari tukar unit baru.
          </p>

          {topFlagship && (
            <div className="flex items-center justify-center gap-2 pt-0.5">
              <span className="text-base font-black tabular-nums text-neutral-950 dark:text-white">
                Mulai Rp{' '}
                {Number(topFlagship.price || 26499000).toLocaleString('id-ID')}
              </span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                Garansi 30 Hari
              </span>
            </div>
          )}

          {/* Single Action Button: Beli Sekarang */}
          <div className="flex items-center justify-center pt-2">
            {topFlagship ? (
              <Link
                href={`/gadget/${topFlagship.id}`}
                className="rounded-full bg-black px-8 py-3 text-center text-xs font-bold text-white shadow-md transition-transform active:scale-95 dark:bg-white dark:text-black"
              >
                Beli Sekarang
              </Link>
            ) : (
              <a
                href="#katalog-produk"
                className="rounded-full bg-black px-8 py-3 text-center text-xs font-bold text-white shadow-md transition-transform active:scale-95 dark:bg-white dark:text-black"
              >
                Beli Sekarang
              </a>
            )}
          </div>
        </div>

        {/* Center/Bottom: Full-Width Edge-to-Edge Flagship Phones Image with Smooth Upward Fade */}
        <div className="relative w-full flex-1 overflow-hidden">
          {/* Top Gradient Fade to blend seamlessly with background */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#FAFBFD] via-[#FAFBFD]/70 to-transparent dark:from-neutral-950 dark:via-neutral-950/70 sm:h-32" />

          <Image
            src="/images/banners/samsung-mobile-hero.jpg"
            alt="Galaxy Z Fold & Flip Mobile"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_30%,black_100%)] [mask-image:linear-gradient(to_bottom,transparent_0%,black_30%,black_100%)]"
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          1C. MOBILE STORE PROFILE & CABANG IDENTITY STRIP (Mobile Only)
      ───────────────────────────────────────────────────────────── */}
      <section className="block border-y border-neutral-100 bg-white px-4 py-3.5 dark:border-neutral-900 dark:bg-neutral-950 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shadow-2xs relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800">
              <Image
                src={
                  store.logo ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80'
                }
                alt={store.name}
                fill
                sizes="44px"
                unoptimized={!!store.logo?.startsWith('/')}
                className="object-cover"
              />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-sm font-bold text-neutral-950 dark:text-white">
                  {store.name}
                </h2>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              </div>
              <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                {store.companyName || 'Gerai Resmi PT'} • {store.city}
              </p>
            </div>
          </div>

          <a
            href="#informasi-gerai"
            className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] font-semibold text-neutral-700 active:scale-95 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            Info Cabang
          </a>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          1D. STICKY MOBILE CATEGORY FILTER BAR (Mobile Only)
          Sticks right below navbar for seamless, one-tap navigation
      ───────────────────────────────────────────────────────────── */}
      <div className="no-scrollbar shadow-2xs sticky top-16 z-30 flex items-center gap-2 overflow-x-auto border-b border-neutral-200/70 bg-white/95 px-4 py-2.5 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95 md:hidden">
        {[
          { id: 'ALL', label: `Semua (${filteredProducts.length})` },
          { id: 'PHONE', label: 'Smartphone' },
          { id: 'WEARABLE', label: 'Watch & Audio' },
          { id: 'ACCESSORY', label: 'Aksesoris' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeCategory === cat.id
                ? 'shadow-xs bg-black text-white dark:bg-white dark:text-black'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
        <a
          href="#informasi-gerai"
          className="shrink-0 rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
        >
          Info Gerai
        </a>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. FIRST BIG EDITORIAL CAMPAIGN BANNER (Screenshot 3 Match)
          "saat di scroll ada banner besar yang nanti di input oleh admin toko tersebut"
      ───────────────────────────────────────────────────────────── */}
      <section
        id="banner-editorial"
        className="px-4 py-8 sm:px-6 sm:py-14 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-[#E2ECE6] shadow-sm transition-colors dark:bg-neutral-900">
            {/* If store admin uploaded a custom banner, display the custom banner */}
            {store.banner &&
            !store.banner.includes('placeholder') &&
            !store.banner.includes('unsplash.com/photo-1555529669') ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-[21/9]">
                <Image
                  src={store.banner}
                  alt={store.name}
                  fill
                  priority
                  unoptimized={!!store.banner?.startsWith('/')}
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/85 via-black/45 to-transparent">
                  <div className="max-w-xl space-y-4 p-6 text-white sm:p-14">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
                      <Sparkles className="h-3.5 w-3.5" /> Penawaran Eksklusif
                      Cabang
                    </span>
                    <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                      Koleksi Pilihan Resmi {store.name}
                    </h2>
                    <p className="max-w-md text-xs leading-relaxed text-neutral-200 sm:text-sm">
                      Dapatkan keuntungan langsung belanja di toko resmi: Paket
                      bonus Rp 0, asuransi penuh kurir JNE/Gojek, dan garansi
                      ganti unit 30 hari.
                    </p>
                    <div className="flex items-center gap-4 pt-2 sm:gap-5">
                      <a
                        href="#katalog-produk"
                        className="rounded-full bg-white px-7 py-3 text-xs font-bold text-black shadow-md transition hover:bg-neutral-200"
                      >
                        Beli Sekarang
                      </a>
                      <Link
                        href="/garansi"
                        className="text-xs font-bold text-white underline underline-offset-4 hover:text-neutral-200"
                      >
                        Pelajari Garansi 30 Hari
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Samsung Default Editorial Campaign Banner (Screenshot 3 Match) */
              <div className="flex min-h-[380px] flex-col items-center gap-6 sm:min-h-[460px] lg:grid lg:min-h-[500px] lg:grid-cols-12">
                {/* Left Editorial Copy */}
                <div className="z-10 order-1 w-full space-y-4 p-7 text-center sm:p-12 lg:col-span-5 lg:pl-16 lg:text-left">
                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 sm:text-sm">
                    Welcome the newest member to
                  </p>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-black leading-[1.08] tracking-tight text-neutral-950 dark:text-white sm:text-4xl lg:text-5xl">
                      Galaxy S26 Series
                    </h2>
                    <div className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 dark:text-sky-400 sm:text-base">
                      <span>Galaxy AI</span>
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </div>

                  <p className="mx-auto max-w-md text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-sm lg:mx-0">
                    Didukung prosesor AI cerdas, kamera ultra-presisi, dan
                    baterai tahan seharian. Tersedia di gerai {store.name}{' '}
                    dengan jaminan ganti unit 30 hari.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-4 pt-2 sm:gap-5 lg:justify-start">
                    <Link
                      href="/garansi"
                      className="text-xs font-bold text-neutral-900 underline underline-offset-4 transition-opacity hover:opacity-75 dark:text-white sm:text-sm"
                    >
                      Lebih detail
                    </Link>
                    <a
                      href="#katalog-produk"
                      className="rounded-full border border-black bg-transparent px-8 py-2.5 text-xs font-bold text-black transition hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      Beli
                    </a>
                  </div>
                </div>

                {/* Right Image Container (High-Res Commercial Cutout) */}
                <div className="relative order-2 h-64 min-h-[260px] w-full sm:h-80 sm:min-h-[350px] lg:col-span-7 lg:h-full lg:min-h-[500px]">
                  <Image
                    src="/images/banners/samsung-campaign-banner.jpg"
                    alt="Galaxy S26 Series Campaign"
                    fill
                    priority
                    className="object-contain object-center lg:object-right"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. ULTRA-CLEAN PRODUCT GRID WITH ELEVATED SHADOW (Screenshot 4 Top Match)
          "Dan saya ingin ada semacam shadow atau apapun itu di div setiap produk
          agar tidak terlihat menyatu dengan background utama."
      ───────────────────────────────────────────────────────────── */}
      <section
        id="katalog-produk"
        className="border-y border-neutral-100 bg-[#F8F9FA] px-4 py-14 dark:border-neutral-900 dark:bg-neutral-950/70 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="space-y-3 pb-8 text-center sm:pb-12">
            <h2 className="text-2xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-3xl lg:text-4xl">
              Koleksi Perangkat Siap Beli
            </h2>
            <p className="mx-auto max-w-lg text-xs text-neutral-500 sm:text-sm">
              Seluruh unit telah melalui 32 tahap inspeksi teknisi dengan
              jaminan keaslian dan garansi toko 30 hari ganti unit baru.
            </p>

            {/* Samsung Minimal Category Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
              {[
                { id: 'ALL', label: 'Semua Produk' },
                { id: 'PHONE', label: 'Smartphone' },
                { id: 'WEARABLE', label: 'Watch & Audio' },
                { id: 'ACCESSORY', label: 'Aksesoris' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all sm:px-5 ${
                    activeCategory === cat.id
                      ? 'bg-black text-white shadow-sm dark:bg-white dark:text-black'
                      : 'shadow-2xs bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Elevated Product Grid: Card with Luxury Floating Shadow */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8">
              {filteredProducts.map((item: any) => {
                const imageUrl =
                  (item.images && item.images[0]) ||
                  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'

                return (
                  <Link
                    key={item.id}
                    href={`/gadget/${item.id}`}
                    className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-neutral-300 hover:shadow-[0_20px_35px_rgba(0,0,0,0.1)] active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:shadow-[0_20px_35px_rgba(0,0,0,0.4)] sm:rounded-3xl sm:p-6"
                  >
                    {/* 1. Header: Brand & Product Name */}
                    <div className="space-y-1 text-center">
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 sm:text-[10px]">
                        {item.brand || 'Gadget'}
                      </span>
                      <h3 className="line-clamp-2 min-h-[2rem] text-xs font-bold tracking-tight text-neutral-900 transition-colors group-hover:text-black dark:text-white dark:group-hover:text-neutral-100 sm:min-h-[2.5rem] sm:text-base">
                        {item.name}
                      </h3>
                    </div>

                    {/* 2. Product Image Frame: Perfectly Fitted Edge-to-Edge with Uniform 4:3 Aspect Ratio */}
                    <div className="relative my-2.5 aspect-[4/3] w-full overflow-hidden rounded-xl border border-neutral-200/60 bg-[#F8F9FA] dark:border-neutral-700/60 dark:bg-neutral-800 sm:my-4 sm:rounded-2xl">
                      <ProductCardImage src={imageUrl} alt={item.name} />
                    </div>

                    {/* 3. Understated Price & Clean CTA Pill Button */}
                    <div className="space-y-2 pt-1 text-center">
                      <p className="text-xs font-bold tabular-nums text-neutral-950 dark:text-white sm:text-base">
                        Rp {Number(item.price || 0).toLocaleString('id-ID')}
                      </p>

                      <div className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-700 transition-all duration-200 group-hover:bg-black group-hover:text-white dark:bg-neutral-800 dark:text-neutral-300 dark:group-hover:bg-white dark:group-hover:text-black sm:px-3 sm:py-2 sm:text-xs">
                        <span>Lihat Detail</span>
                        <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-neutral-300 py-16 text-center text-xs text-neutral-400 dark:border-neutral-800">
              Belum ada produk di kategori ini.
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
            4. SECOND EDITORIAL CAMPAIGN BANNER (Screenshot 4 Bottom Match)
            Samsung Vision AI & Bengkel Servis Kilat 2 Jam
        ───────────────────────────────────────────────────────────── */}
      <section
        id="banner-vision"
        className="px-4 py-8 sm:px-6 sm:py-14 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-[#F6F7F9] p-6 shadow-sm transition-colors dark:bg-neutral-900 sm:p-12 lg:p-16">
            <div className="flex min-h-[360px] flex-col items-center gap-8 lg:grid lg:min-h-[440px] lg:grid-cols-12">
              {/* Left Editorial Copy */}
              <div className="z-10 w-full space-y-4 text-center lg:col-span-5 lg:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 sm:text-sm">
                  <span>Samsung Vision AI</span>
                  <Sparkles className="h-3.5 w-3.5" />
                </div>

                <h2 className="text-2xl font-black leading-[1.08] tracking-tight text-neutral-950 dark:text-white sm:text-4xl lg:text-5xl">
                  Answering your passions
                </h2>

                <p className="mx-auto max-w-md text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-sm lg:mx-0">
                  Integrasi visual tanpa batas dan ekosistem tampilan pintar.
                  Gerai {store.name} juga melayani Servis Kilat LCD 2 Jam oleh
                  teknisi tersertifikasi resmi.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-2 sm:gap-5 lg:justify-start">
                  <Link
                    href="/servis-lcd"
                    className="text-xs font-bold text-neutral-900 underline underline-offset-4 transition-opacity hover:opacity-75 dark:text-white sm:text-sm"
                  >
                    Lebih detail
                  </Link>
                  <a
                    href="#katalog-produk"
                    className="rounded-full border border-black bg-transparent px-8 py-2.5 text-xs font-bold text-black transition hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                  >
                    Lihat semua
                  </a>
                </div>
              </div>

              {/* Right Image Container (High-Res Vision AI Studio Display Artwork) */}
              <div className="relative h-60 min-h-[240px] w-full sm:h-80 sm:min-h-[320px] lg:col-span-7 lg:h-full lg:min-h-[400px]">
                <Image
                  src="/images/banners/samsung-vision-ai.jpg"
                  alt="Samsung Vision AI Displays"
                  fill
                  priority
                  className="object-contain object-center lg:object-right"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
            5. PHYSICAL STORE CREDIBILITY & LEGAL ENTITY SECTION
            Legalitas PT, Jam Operasional, Google Maps & Offline Verification
        ───────────────────────────────────────────────────────────── */}
      <section
        id="informasi-gerai"
        className="border-t border-neutral-100 px-4 py-10 dark:border-neutral-900 sm:px-6 sm:py-16 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 space-y-2 text-center sm:mb-10">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
              Informasi Gerai Resmi & Badan Usaha
            </h2>
            <p className="text-xs text-neutral-500 sm:text-sm">
              Operasional toko fisik resmi di bawah naungan badan hukum
              perseroan terdaftar.
            </p>
          </div>

          {/* Mobile Only: Dedicated Compact Store Hub Card */}
          <div className="block space-y-4 rounded-3xl border border-neutral-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 md:hidden">
            {/* Header: Legalitas PT */}
            <div className="flex items-start gap-3 border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  ✓ Badan Hukum Resmi PT (PKP)
                </span>
                <h3 className="truncate text-sm font-bold text-neutral-950 dark:text-white">
                  {store.companyName || 'PT Terverifikasi'}
                </h3>
                <p className="text-[11px] text-neutral-500">
                  NPWP: {store.taxId || 'Terdaftar di KPP Pratama'}
                </p>
              </div>
            </div>

            {/* Address & Google Maps */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900 dark:text-white" />
                <div>
                  <p className="font-medium leading-relaxed text-neutral-900 dark:text-neutral-200">
                    {store.address}
                  </p>
                  <p className="text-neutral-500">
                    {store.city}, {store.province}
                  </p>
                </div>
              </div>
              {store.mapsUrl && (
                <a
                  href={store.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shadow-2xs flex w-full items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-bold text-neutral-900 transition-all active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Petunjuk Arah Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Hours & Chat Action */}
            <div className="flex items-center justify-between border-t border-neutral-100 pt-2 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-neutral-500" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  09:00 - 21:00 WIB
                </span>
              </div>
              <Link
                href={`/dashboard/customer/chat?storeId=${store.id}`}
                className="text-xs font-bold text-blue-600 underline underline-offset-4 dark:text-sky-400"
              >
                Chat Petugas Toko →
              </Link>
            </div>
          </div>

          {/* Desktop Only: 3 Columns Grid (Intact) */}
          <div className="hidden gap-5 sm:gap-6 md:grid md:grid-cols-3">
            {/* 1. Legalitas PT */}
            <div className="space-y-3 rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                Legalitas & Badan Hukum
              </h3>
              <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                <p className="font-semibold text-neutral-900 dark:text-neutral-200">
                  {store.companyName || 'PT Terverifikasi'}
                </p>
                <p>NPWP: {store.taxId || 'Terdaftar di KPP Pratama'}</p>
                <p className="pt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ Pengusaha Kena Pajak (Faktur Resmi)
                </p>
              </div>
            </div>

            {/* 2. Lokasi Fisik Toko */}
            <div className="space-y-3 rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                Alamat Fisik Cabang
              </h3>
              <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                <p className="line-clamp-2 leading-relaxed">{store.address}</p>
                <p className="font-medium">
                  {store.city}, {store.province}
                </p>
                {store.mapsUrl && (
                  <div className="pt-2">
                    <a
                      href={store.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-black underline underline-offset-4 hover:opacity-75 dark:text-white"
                    >
                      Petunjuk Google Maps <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Operasional & Kontak Toko */}
            <div className="space-y-3 rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                Jam Buka & Layanan
              </h3>
              <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                <p className="font-medium text-neutral-900 dark:text-neutral-200">
                  Buka Setiap Hari: 09:00 - 21:00 WIB
                </p>
                <p>Melayani beli di tempat, tes unit, & kirim instan</p>
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href={`/dashboard/customer/chat?storeId=${store.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-black underline underline-offset-4 dark:text-white"
                  >
                    Buka Chat Toko →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
            6A. DESKTOP FLOATING SALES SPECIALIST CHAT POPUP (Intact)
        ───────────────────────────────────────────────────────────── */}
      {showChatPopup && (
        <aside
          aria-label="Pakar Penjualan Gerai"
          className="fixed bottom-6 right-6 z-40 hidden items-center gap-3 duration-500 animate-in fade-in slide-in-from-bottom-4 md:flex"
        >
          {/* Tooltip Chat Bubble */}
          <div className="relative max-w-xs rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <button
              onClick={() => setShowChatPopup(false)}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-400"
              title="Tutup Pesan"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="text-[11px] font-medium leading-relaxed text-neutral-700 dark:text-neutral-300">
              Ingin penawaran eksklusif gerai <strong>{store.name}</strong>?
              Chat konsultan kami sekarang!
            </p>
            <div className="mt-2">
              <Link
                href={`/dashboard/customer/chat?storeId=${store.id}`}
                className="text-[11px] font-bold text-sky-600 hover:underline dark:text-sky-400"
              >
                Mulai Chat Langsung →
              </Link>
            </div>
          </div>

          {/* Avatar Specialist Button */}
          <Link
            href={`/dashboard/customer/chat?storeId=${store.id}`}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500 bg-white p-0.5 shadow-2xl transition hover:scale-105 dark:bg-neutral-900"
            title="Chat dengan Pakar Toko"
          >
            <div className="relative h-full w-full overflow-hidden rounded-full">
              <Image
                src={
                  store.logo ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80'
                }
                alt="Pakar Toko"
                fill
                sizes="56px"
                unoptimized={!!store.logo?.startsWith('/')}
                className="object-cover"
              />
            </div>
            {/* Active Green Dot */}
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900" />
          </Link>
        </aside>
      )}

      <Footer variant="light" />
    </div>
  )
}
