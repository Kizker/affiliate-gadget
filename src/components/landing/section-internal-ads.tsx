'use client'

import Link from 'next/link'
import { ArrowRight, Tag, ShieldCheck } from 'lucide-react'

export function SectionInternalAds() {
  return (
    <section className="py-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-slate-950 p-6 sm:p-8 text-white border border-slate-800 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-400 border border-orange-500/30">
                <Tag className="h-3 w-3" /> PENAWARAN KHUSUS RESMI
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Cashback Spesial Gadget Second + Paket Bonus 3-in-1 Lengkap
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Berlaku untuk semua pembelian smartphone second like new minggu ini. Didukung perlindungan garansi 30 hari tukar unit dari toko fisik resmi.
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/gadget"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-orange-600 active:scale-[0.98] transition"
              >
                Klaim Promo di Katalog <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SectionInternalAds
