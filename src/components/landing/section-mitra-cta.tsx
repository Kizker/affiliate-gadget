'use client'

import Link from 'next/link'
import { Building2, ArrowRight, CheckCircle2 } from 'lucide-react'

export function SectionMitraCta() {
  return (
    <section className="py-14 bg-slate-50/50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
            {/* Left Copy (8 cols) */}
            <div className="lg:col-span-8 space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Building2 className="h-3.5 w-3.5" /> KEMITRAAN TOKO OFFLINE
              </span>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 dark:text-white leading-tight">
                Miliki Toko Gadget Fisik? Bergabunglah dalam Jaringan Toko Kami
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                Manfaatkan komisi platform efisien (1%–3%), nomor rekening mandiri per toko, dan kanal penjualan digital terpercaya tanpa potongan marketplace yang tinggi.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Komisi Transaksi Rendah 1–3%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Desentralisasi Omzet & Rekening Toko Mandiri</span>
                </div>
              </div>
            </div>

            {/* Right CTA (4 cols) */}
            <div className="lg:col-span-4 flex flex-col sm:items-end justify-center">
              <Link
                href="/hubungi-kami"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 active:scale-[0.98] transition dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Daftar Kemitraan Toko <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="mt-2 text-[10px] text-slate-400 text-center sm:text-right">
                Verifikasi dokumen legalitas resmi & cepat
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SectionMitraCta
