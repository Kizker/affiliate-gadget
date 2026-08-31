'use client'

import Link from 'next/link'
import { MessageSquare, ArrowRight, Store } from 'lucide-react'

export function SectionCtaBanner() {
  return (
    <section className="py-16 sm:py-20 bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 sm:p-12 lg:p-14 text-white border border-slate-800 shadow-2xl text-center">
          
          {/* Subtle Ambient Radial Lighting */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[500px] rounded-full bg-orange-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 h-80 w-[500px] rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-5">
            
            {/* Top Status Capsule */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-semibold text-slate-300 backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sales Counter & Teknisi Toko Standby</span>
            </div>

            {/* High-Impact Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Butuh Rekomendasi Gadget atau <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                Cek Ketersediaan Stok di Toko?
              </span>
            </h2>

            {/* Concise Subtitle */}
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
              Tim toko kami di Roxy Mas Jakarta, WTC Surabaya, dan BEC Bandung siap membantu pengecekan unit dan konsultasi spesifikasi.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Link
                href="/dashboard/customer/chat"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 sm:px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 active:scale-98 transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat Toko</span>
              </Link>
              
              <Link
                href="/gadget"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-white/20 active:scale-98 transition-all duration-200"
              >
                <span>Jelajahi Produk</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Quick Branch Availability Footnote */}
            <div className="pt-4 flex items-center justify-center gap-3 sm:gap-4 flex-wrap text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-blue-400" />
                <span>Roxy Mas (Jakarta)</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-blue-400" />
                <span>WTC (Surabaya)</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-blue-400" />
                <span>BEC (Bandung)</span>
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default SectionCtaBanner
