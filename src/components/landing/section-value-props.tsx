'use client'

import { Check, X, ShieldCheck, Gift, Truck, Wrench, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function SectionValueProps() {
  const comparisons = [
    {
      feature: 'Jaminan Garansi Unit',
      us: 'Garansi Toko 30 Hari Tukar Unit Penuh',
      them: 'Garansi Personal 2-3 Hari / Sulit Diklaim',
      benefit: 'Perlindungan fungsional total hardware tanpa biaya servis',
    },
    {
      feature: 'Uji Fungsi & Kualitas',
      us: 'Lolos 30+ Titik Uji Teknisi (Fisik, LCD, BH, Sinyal)',
      them: 'Tanpa Quality Check (Rawan Rekondisi / Ex-Bongkar)',
      benefit: 'Unit dipastikan 100% normal dan bebas kendala sebelum dikirim',
    },
    {
      feature: 'Legalitas IMEI',
      us: 'IMEI Resmi Terdaftar & Garansi Bebas Blokir Seumur Hidup',
      them: 'IMEI Turis / Sering Terkena Pemutihan Sinyal',
      benefit: 'Sinyal seluruh provider Indonesia aktif aman tanpa rasa cemas',
    },
    {
      feature: 'Paket Bonus Aksesoris',
      us: 'Free Charger Fast Charging + Antigores 9D + Case (Rp 0)',
      them: 'Hanya Batangan / Beli Aksesoris Tambahan Sendiri',
      benefit: 'Langsung siap pakai tanpa perlu membeli aksesoris terpisah',
    },
    {
      feature: 'Kredibilitas Toko',
      us: 'Jaringan Toko Fisik Resmi & Terpercaya se-Indonesia',
      them: 'Seller Online Anonim Tanpa Alamat Toko Nyata',
      benefit: 'Bisa datang langsung ke toko fisik untuk verifikasi kondisi barang',
    },
  ]

  return (
    <section className="py-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            STANDAR KUALITAS GADGET SECOND
          </span>
          <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl dark:text-white">
            Mengapa Beli Gadget Second di Affiliate Gadget?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Kami memastikan setiap unit second original teruji secara ketat dengan perlindungan garansi toko 30 hari penuh.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-950">
          <div className="space-y-3">
            {comparisons.map((c, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-xl bg-white p-4 border border-slate-200/70 shadow-xs dark:bg-slate-900 dark:border-slate-800 items-center"
              >
                {/* Feature Label (3 cols) */}
                <div className="md:col-span-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Kategori</span>
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{c.feature}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{c.benefit}</p>
                </div>

                {/* Affiliate Gadget (5 cols) */}
                <div className="md:col-span-5 rounded-lg bg-emerald-50/60 p-3 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                      Affiliate Gadget (Website Resmi)
                    </span>
                    <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100">{c.us}</p>
                  </div>
                </div>

                {/* Marketplace Lain (4 cols) */}
                <div className="md:col-span-4 rounded-lg bg-slate-100/60 p-3 border border-slate-200/60 dark:bg-slate-800/40 dark:border-slate-800 flex items-start gap-2.5 opacity-70">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-400 text-white mt-0.5">
                    <X className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-500">Seller Second Biasa</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-through">{c.them}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Semua unit second dijamin original bukan barang rekondisi dengan verifikasi teknisi toko.
            </span>
            <Link
              href="/gadget"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Belanja Sekarang <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SectionValueProps
