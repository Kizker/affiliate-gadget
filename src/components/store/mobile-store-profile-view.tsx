'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  MapPin,
  ShieldCheck,
  PhoneCall,
  Smartphone,
  Star,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  Gift,
  Share2,
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { MobileTopNav } from '@/components/layouts/mobile-top-nav'

interface MobileStoreProfileViewProps {
  store: any
  session: any
  status: string
}

export function MobileStoreProfileView({
  store,
  session,
  status,
}: MobileStoreProfileViewProps) {
  const router = useRouter()
  const { items } = useCartStore()

  const cartCount =
    status === 'authenticated'
      ? items.reduce((sum, item) => sum + item.quantity, 0)
      : 0

  const accountHref =
    status === 'authenticated'
      ? session?.user?.role === 'SUPER_ADMIN' ||
        session?.user?.role === 'ADMIN' ||
        session?.user?.role === 'STORE_ADMIN'
        ? '/dashboard/admin'
        : '/dashboard/customer/settings'
      : '/login?callbackUrl=/dashboard/customer/settings'

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/toko')
    }
  }

  const storeBanner =
    store.banner && !store.banner.includes('placeholder')
      ? store.banner
      : 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=80'

  const storeLogo =
    store.logo && !store.logo.includes('placeholder')
      ? store.logo
      : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'

  const hubCity = (store.city || 'JAKARTA').toUpperCase() + ' HUB'

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: store.name,
          text: `Kunjungi gerai resmi ${store.name} di AffiliateGadget. Unit second bergaransi 30 hari!`,
          url: typeof window !== 'undefined' ? window.location.href : '',
        })
        .catch(() => {})
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Tautan profil toko disalin ke clipboard!')
    }
  }

  // Layanan Toko Resmi (Figma Screen 5: 4 Layanan Siap)
  const storeServices = [
    {
      title: 'Cek Fisik & Battery Health di Tempat',
      desc: 'Uji 32 parameter software, 3uTools verified, dan tes kamera langsung dengan teknisi.',
      icon: Smartphone,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400',
    },
    {
      title: 'Tukar Tambah / Trade-in Gadget',
      desc: 'Taksiran harga transparan di tempat, proses inspeksi cepat 15 menit cair/potong harga.',
      icon: ArrowLeftRight,
      color:
        'text-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-400',
    },
    {
      title: 'Garansi 30 Hari Tukar Unit Langsung',
      desc: 'Kendala fungsi mesin langsung ganti unit sekelas tanpa proses klaim berbelit.',
      icon: ShieldCheck,
      color:
        'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400',
    },
    {
      title: 'Pemasangan Gratis Bonus 3-in-1',
      desc: 'Free presisi tempered glass 9D, casing shockproof, dan kepala charger 20W bawa pulang.',
      icon: Gift,
      color:
        'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400',
    },
  ]

  // Filter or fallback products
  const products =
    store.products && store.products.length > 0 ? store.products : []

  return (
    <div className="mx-auto min-h-screen w-full max-w-md select-none bg-slate-50 pb-28 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. TOP HEADER (Komponen Terpisah Reusable) */}
      <MobileTopNav chatHref={`/dashboard/customer/chat?storeId=${store.id}`} />

      {/* 2. HERO COVER IMAGE & OVERLAYS */}
      <section className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
        <Image
          src={storeBanner}
          alt={store.name}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

        {/* Top Badges Bar: Button Kembali & Share */}
        <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between">
          {/* Button Kembali (Menggantikan Label Toko Resmi) */}
          <button
            type="button"
            onClick={handleBack}
            className="shadow-xs inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/25 bg-black/50 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-black/70 active:scale-95"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4 text-white" />
            <span>Kembali</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-90"
            aria-label="Bagikan profil toko"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Bottom Floating Badges */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex items-center justify-between">
          {/* Operating Hours Status Pill */}
          <div className="shadow-xs inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            <span>Buka Sekarang (10:00 - 20:30 WIB)</span>
          </div>

          {/* Rating Pill */}
          <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>4.9</span>
            <span className="text-[10px] font-normal text-white/70">
              (520+)
            </span>
          </div>
        </div>
      </section>

      {/* 3. STORE IDENTITY CARD */}
      <section className="relative z-20 -mt-3 px-4">
        <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          {/* HUB Badge & Category */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {hubCity}
            </span>
            {store.legalName && (
              <span className="max-w-[180px] truncate text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                {store.legalName}
              </span>
            )}
          </div>

          {/* Store Name */}
          <h1 className="text-lg font-black leading-snug text-slate-950 dark:text-white">
            {store.name}
          </h1>

          {/* Address */}
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {store.address ||
              'Alamat toko resmi terdaftar di sistem AffiliateGadget.'}
          </p>

          {/* Location Landmark */}
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            <span className="truncate">
              {store.city.toLowerCase().includes('jakarta')
                ? 'Dekat Eskalator Utama Selatan'
                : `Area Strategis Pusat Gadget ${store.city}`}
            </span>
          </div>

          {/* 4. ACTION TOOLBAR (Chat Toko Live Chat & Telepon Toko) */}
          <div className="grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-2 dark:border-slate-800">
            {/* Chat Toko (Terhubung Langsung ke Fitur Live Chat) */}
            <Link
              href={`/dashboard/customer/chat?storeId=${store.id}`}
              className="shadow-xs flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-3 py-2.5 text-xs font-bold text-white shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-[0.98]"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[11px] font-black">Chat Toko</span>
                <span className="text-[9px] font-medium opacity-90">
                  Live Chat Resmi
                </span>
              </div>
            </Link>

            {/* Telepon Toko */}
            <a
              href={`tel:${store.phone || '02163851122'}`}
              className="shadow-2xs flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
            >
              <PhoneCall className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="flex flex-col truncate text-left leading-tight">
                <span className="text-[11px] font-black">Telepon Toko</span>
                <span className="truncate text-[9px] font-medium text-slate-500">
                  {store.phone || '(021) 6385-1122'}
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 5. LAYANAN DI TOKO INI (4 Layanan Siap) */}
      <section className="mt-5 space-y-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">
            Layanan di Toko Ini
          </h2>
          <span className="rounded-full border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            4 Layanan Siap
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {storeServices.map((service, idx) => {
            const Icon = service.icon
            return (
              <div
                key={idx}
                className="shadow-2xs flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${service.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h3 className="text-xs font-bold leading-tight text-slate-900 dark:text-white">
                    {service.title}
                  </h3>
                  <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                    {service.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 6. UNIT READY STOCK (ETALASE TOKO INI) */}
      <section className="mt-6 space-y-3 px-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">
                Unit Ready Stock
              </h2>
              <span className="rounded-full border border-orange-200/60 bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-600 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-400">
                Update Hari Ini
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Tersedia langsung di etalase {store.name}
            </p>
          </div>
        </div>

        {/* 2-Column Product Grid (Konsisten dengan Katalog & Beranda) */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {products.map((item: any) => {
              const totalStock =
                item.variants && item.variants.length > 0
                  ? item.variants.reduce(
                      (sum: number, v: any) => sum + (Number(v.stock) || 0),
                      0
                    )
                  : Number(item.stock) || 0

              const itemImage =
                (item.images && item.images[0]) ||
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'

              const brandTag =
                item.brand?.toLowerCase() === 'apple'
                  ? 'Apple Store Unit'
                  : item.brand?.toLowerCase() === 'samsung'
                    ? 'Samsung Resmi SEIN'
                    : `${item.brand || 'Gadget'} Resmi`

              return (
                <div
                  key={item.id}
                  className="shadow-2xs group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-2 transition-all duration-300 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                >
                  <Link
                    href={`/gadget/${item.id}`}
                    className="block cursor-pointer focus:outline-none"
                  >
                    {/* Media Container */}
                    <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-100 dark:border-slate-800/80 dark:bg-slate-950/60">
                      <Image
                        src={itemImage}
                        alt={item.name}
                        fill
                        sizes="50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Top-Right Rating Pill */}
                      <div className="shadow-2xs absolute right-1.5 top-1.5 z-10 flex items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-slate-900 dark:border-slate-700/80 dark:bg-slate-900 dark:text-white">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold tabular-nums">
                          {(item.rating || 5.0).toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-1 px-0.5">
                      {/* Brand Pill */}
                      <span className="block truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {brandTag}
                      </span>

                      {/* Product Name */}
                      <h3 className="line-clamp-2 min-h-[2rem] text-xs font-bold leading-tight text-slate-900 transition-colors group-hover:text-orange-500 dark:text-white">
                        {item.name}
                      </h3>

                      {/* Condition & BH Pill */}
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <span className="py-0.2 rounded border border-emerald-200/60 bg-emerald-50 px-1.5 dark:border-emerald-800/60 dark:bg-emerald-950/50">
                          Like New 99%
                        </span>
                        <span>• BH 98%</span>
                      </div>

                      {/* Price */}
                      <div className="pt-0.5">
                        <span className="block text-xs font-black tabular-nums tracking-tight text-slate-950 dark:text-white">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Bottom Action CTA */}
                  <div className="mt-2.5 border-t border-slate-100 pt-2 dark:border-slate-800">
                    <Link
                      href={`/gadget/${item.id}`}
                      className={`flex w-full items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-bold transition-all ${
                        totalStock > 0
                          ? 'shadow-2xs bg-orange-500 text-white shadow-orange-500/25 hover:bg-orange-600 active:scale-[0.98]'
                          : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800'
                      }`}
                    >
                      <span>
                        {totalStock > 0 ? 'Ambil di Toko' : 'Stok Habis'}
                      </span>
                      {totalStock > 0 && <ArrowRight className="h-3 w-3" />}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2 rounded-2xl border border-dashed border-slate-200/80 bg-white p-6 text-center dark:bg-slate-900">
            <Smartphone className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Stok Etalase Sedang Diperbarui
            </h3>
            <p className="text-[11px] text-slate-500">
              Silakan hubungi WhatsApp teknisi untuk cek ketersediaan unit di
              cabang ini.
            </p>
            <Link
              href="/gadget"
              className="inline-flex items-center gap-1 pt-1 text-xs font-bold text-orange-500 hover:text-orange-600"
            >
              <span>Jelajahi Semua Gadget</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
