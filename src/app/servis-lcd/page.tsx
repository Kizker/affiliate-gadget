'use client'

import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  Wrench,
  Clock,
  ShieldCheck,
  Truck,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Store,
  Sparkles,
} from 'lucide-react'

export default function ServisLcdPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar variant="light" />

      <main className="container mx-auto px-4 py-28 sm:px-6 lg:px-8 max-w-5xl">
        {/* Status Badge */}
        <div className="mb-6 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Sparkles className="h-3.5 w-3.5" /> SISTEM BOOKING ONLINE — SEGERA HADIR
          </span>
        </div>

        {/* Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl font-black sm:text-4xl lg:text-5xl text-slate-900 dark:text-white">
            Layanan Servis LCD Kilat 2 Jam
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Sistem otomatisasi booking servis online & integrasi kurir instan sedang dipersiapkan untuk memberikan kenyamanan terbaik bagi Anda.
          </p>
        </div>

        {/* Informative Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6 text-center max-w-2xl mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950">
            <Wrench className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Butuh Penggantian Layar LCD Hari Ini?
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
              Layanan perbaikan fisik kami tetap beroperasi penuh di seluruh jaringan toko. Anda dapat langsung berkonsultasi dengan teknisi ahli kami melalui WhatsApp atau mengunjungi toko fisik terdekat untuk penggantian layar LCD kilat bergaransi 30 hari.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2 pb-2 border-y border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="h-4 w-4 text-blue-600 shrink-0" /> Pengerjaan 2 Jam
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" /> Garansi Layar 30 Hari
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" /> Sparepart Grade Original
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="https://wa.me/6281198765431?text=Halo%20Teknisi%20Affiliate%20Gadget,%20saya%20mau%20konsultasi%20ganti%20LCD%20di%20toko."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-3 text-xs font-bold text-white hover:bg-green-700 transition shadow-md"
            >
              <PhoneCall className="h-4 w-4" /> Konsultasi Teknisi via WhatsApp
            </a>
            <Link
              href="/toko"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <Store className="h-4 w-4 text-blue-600" /> Lokasi Toko Terdekat
            </Link>
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
