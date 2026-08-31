'use client'

import Link from 'next/link'
import { Radio, Eye, Sparkles, ArrowRight, ShieldCheck, Gift } from 'lucide-react'

export function SectionLiveStream() {
  return (
    <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-3xl pointer-events-none rounded-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
          {/* Stream Preview (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=80"
                alt="Live Stream Preview"
                className="h-full w-full object-cover opacity-80 transition group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Status Header */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                  <span>SEDANG LIVE</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  <Eye className="h-3.5 w-3.5 text-red-400" /> 1.420 Penonton
                </div>
              </div>

              {/* Bottom Stream Info */}
              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <span className="text-[11px] font-bold text-orange-400">Roxy Mas (Jakarta Pusat)</span>
                <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                  Flash Sale & Live Unboxing: iPhone 15 Pro Titanium vs Samsung S24 Ultra
                </h3>
              </div>
            </div>
          </div>

          {/* Right Info & Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold uppercase text-red-300 border border-red-500/30">
                <Sparkles className="h-3.5 w-3.5" /> LIVE STREAMING SALES HUB — SEGERA HADIR
              </span>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl lg:text-4xl text-white leading-tight">
                Tonton Live, Konsultasi Langsung & Dapatkan Diskon
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Lihat kondisi unit asli sebelum beli, tanyakan spesifikasi ke sales toko via live chat, dan klaim voucher diskon eksklusif.
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Garansi Toko 30 Hari Tukar Unit tetap berlaku penuh</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-orange-400 shrink-0" />
                <span>Free Paket Bonus 3-in-1 langsung disertakan</span>
              </div>
            </div>

            <div>
              <Link
                href="/live"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700 transition"
              >
                Masuk Ruang Live Streaming <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SectionLiveStream
