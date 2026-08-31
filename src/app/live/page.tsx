'use client'

import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  Radio,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Store,
  ShieldCheck,
} from 'lucide-react'

export default function LiveStreamingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-orange-500 selection:text-white">
      <Navbar variant="dark" />

      <main className="container mx-auto px-4 py-28 sm:px-6 lg:px-8 max-w-4xl text-center">
        {/* Status Badge */}
        <div className="mb-6 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-300 border border-red-500/30">
            <Sparkles className="h-3.5 w-3.5" /> SEGERA HADIR
          </span>
        </div>

        <h1 className="text-3xl font-black sm:text-4xl lg:text-5xl text-white">
          Live Streaming Sales Hub
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Fitur siaran langsung penjualan dari toko resmi, obrolan interaktif real-time, dan promo flash deal eksklusif sedang dipersiapkan dan akan segera hadir untuk Anda.
        </p>

        {/* Informative Card */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-slate-900/60 p-8 sm:p-12 shadow-2xl space-y-6 max-w-xl mx-auto backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <Radio className="h-8 w-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">
              Jelajahi Katalog Gadget Resmi Kami
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              Sambil menunggu peluncuran siaran langsung, Anda dapat langsung memesan smartphone resmi bergaransi 30 hari ganti baru dengan paket bonus lengkap 3-in-1 melalui katalog kami.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/gadget"
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-orange-500/30 hover:bg-orange-600 transition"
            >
              <ShoppingBag className="h-4 w-4" /> Buka Katalog Gadget <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/toko"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              <Store className="h-4 w-4 text-blue-400" /> Kunjungi Toko Resmi
            </Link>
          </div>
        </div>
      </main>

      <Footer variant="dark" />
    </div>
  )
}
