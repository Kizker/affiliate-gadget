'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  Store,
  MapPin,
  Clock,
  ShieldCheck,
  Gift,
  ArrowRight,
  MessageSquare,
  PhoneCall,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  Package,
  Star,
} from 'lucide-react'

export default function StoreDetailPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Navbar variant="light" />
        <div className="flex h-96 items-center justify-center pt-28">
          <div className="text-center text-slate-400">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500" />
            <p className="text-xs font-medium">Memuat profil toko resmi...</p>
          </div>
        </div>
        <Footer variant="light" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Navbar variant="light" />
        <div className="container mx-auto max-w-md px-4 py-36 text-center">
          <div className="shadow-xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-10 dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-lg font-bold text-slate-950 dark:text-white">
              Toko Tidak Ditemukan
            </h1>
            <p className="text-xs text-slate-500">
              Tautan toko mungkin tidak valid atau belum terdaftar.
            </p>
            <div className="pt-2">
              <Link
                href="/toko"
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600"
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
    <div className="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
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
              href="/toko"
              className="transition-colors hover:text-slate-900 dark:hover:text-white"
            >
              Daftar Toko
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
              {store.name}
            </span>
          </nav>

          {/* Store Profile Showcase Card with Banner Background & Radiant White Gradient */}
          <div className="shadow-xs group relative mb-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            {/* Background Cover Image with Striking White Radiant Gradient */}
            <div className="absolute inset-0 z-0">
              <Image
                src={
                  store.banner ||
                  'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=80'
                }
                alt={store.name}
                fill
                sizes="(max-width: 1280px) 100vw, 1200px"
                priority
                unoptimized={!!store.banner?.startsWith('/')}
                className="sm:object-right-center object-cover object-right opacity-75 transition-transform duration-700 group-hover:scale-105 dark:opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/20 dark:from-slate-950 dark:via-slate-950/85 dark:to-slate-950/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-white/30 dark:from-slate-950/60 dark:to-transparent" />
            </div>

            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              {/* Left Section: Square Profile Image & Info */}
              <div className="flex min-w-0 flex-1 flex-col items-start gap-5 sm:flex-row sm:items-center">
                {/* Square Profile Photo */}
                <div className="shadow-2xs relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800 sm:h-24 sm:w-24">
                  <Image
                    src={
                      store.logo ||
                      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'
                    }
                    alt={store.name}
                    fill
                    sizes="96px"
                    unoptimized={!!store.logo?.startsWith('/')}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl lg:text-3xl">
                      {store.name}
                    </h1>
                    <span className="shadow-2xs backdrop-blur-xs rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300">
                      {store.city}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {store.tagline ||
                      'Toko Resmi Penjualan & Servis Kilat Smartphone Bergaransi 30 Hari'}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="line-clamp-1">{store.address}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>Buka 09:00 - 21:00 WIB</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>Klaim Garansi 30 Hari & Servis Kilat</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section: Action CTAs */}
              <div className="flex shrink-0 flex-row justify-start gap-2.5 border-t border-slate-200/60 pt-3 dark:border-slate-800 sm:flex-col sm:items-end lg:border-t-0 lg:pt-0">
                <Link
                  href={`/dashboard/customer/chat?storeId=${store.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-[0.99] sm:w-auto"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat Toko</span>
                </Link>

                {store.mapsUrl && (
                  <a
                    href={store.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="backdrop-blur-xs shadow-2xs inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 sm:w-auto"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Petunjuk Lokasi Maps</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Store Specific Inventory Showcase */}
          <div className="space-y-6 pt-2">
            <div className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  Inventori Gadget Ready Stock
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                  Unit smartphone siap beli langsung di toko atau kirim instan
                  dengan garansi 30 hari.
                </p>
              </div>

              {store.products && store.products.length > 0 && (
                <div className="shadow-2xs inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:self-auto">
                  <Smartphone className="h-3.5 w-3.5 text-orange-500" />
                  <span>{store.products.length} Gadget Tersedia</span>
                </div>
              )}
            </div>

            {store.products && store.products.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {store.products.map((item: any) => {
                  const totalStock =
                    item.variants && item.variants.length > 0
                      ? item.variants.reduce(
                          (sum: number, v: any) => sum + (Number(v.stock) || 0),
                          0
                        )
                      : Number(item.stock) || 0

                  return (
                    <div
                      key={item.id}
                      className="shadow-xs group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                    >
                      <Link
                        href={`/gadget/${item.id}`}
                        className="block cursor-pointer focus:outline-none"
                      >
                        {/* 1. Media Header (Square Cropped Hero Photo) */}
                        <div className="relative mb-3.5 aspect-square w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 dark:border-slate-800/80 dark:bg-slate-950/60">
                          <Image
                            src={
                              (item.images && item.images[0]) ||
                              'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
                            }
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Top-Right: Solid Clean Rating Capsule */}
                          <div className="absolute right-2.5 top-2.5 z-10 flex select-none items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-md transition-transform duration-300 group-hover:scale-105 dark:border-slate-700/80 dark:bg-slate-900 dark:text-white">
                            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                            <span className="font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                              {(item.rating || 5.0).toFixed(1)}
                            </span>
                            <span className="text-[10px] font-normal tabular-nums text-slate-400 dark:text-slate-500">
                              ({item.totalReview || 0})
                            </span>
                          </div>
                        </div>

                        {/* 2. Product Identity & Details */}
                        <div className="space-y-2 px-1">
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              {item.brand || 'Gadget'}
                            </span>

                            {/* Semantic Stock Pill */}
                            <div className="shrink-0">
                              {totalStock > 5 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  <Package className="h-2.5 w-2.5 text-slate-500" />
                                  <span>{totalStock} Unit</span>
                                </span>
                              ) : totalStock > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                  </span>
                                  <span>Sisa {totalStock}!</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/60 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                                  <span>Habis</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white">
                            {item.name}
                          </h3>

                          <div className="flex items-baseline justify-between gap-2 pt-0.5">
                            <span className="whitespace-nowrap text-base font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-lg">
                              Rp {item.price.toLocaleString('id-ID')}
                            </span>
                            {item.variants && item.variants.length > 1 && (
                              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800">
                                {item.variants.length} Varian
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* 3. Bottom CTA (Action Orange) */}
                      <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                        <Link
                          href={`/gadget/${item.id}`}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold transition-all duration-200 ${
                            totalStock > 0
                              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 active:scale-[0.98]'
                              : 'cursor-not-allowed bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500'
                          }`}
                        >
                          <span>
                            {totalStock > 0
                              ? 'Lihat Detail Unit'
                              : 'Stok Habis'}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </Link>

                        <Link
                          href={`/dashboard/customer/chat?storeId=${store.id}&productId=${item.id}&productName=${encodeURIComponent(item.name || '')}&productPrice=${item.price || 0}&productImage=${encodeURIComponent(item.images?.[0] || '')}`}
                          className="shadow-2xs flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-orange-800 dark:hover:bg-orange-950/40 dark:hover:text-orange-300"
                          title={`Chat toko tentang ${item.name}`}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3 rounded-3xl border border-dashed border-slate-200/80 bg-white p-12 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                <Smartphone className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Belum ada unit khusus yang diposting untuk toko ini
                </h3>
                <p className="text-slate-500">
                  Anda dapat melihat seluruh inventori gadget ready stock di
                  katalog utama.
                </p>
                <div className="pt-2">
                  <Link
                    href="/gadget"
                    className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600"
                  >
                    Buka Katalog Produk <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
