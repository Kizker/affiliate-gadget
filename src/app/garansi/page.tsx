'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  PhoneCall,
  Search,
  Check,
  XCircle,
  ArrowRight,
  Sparkles,
  Store,
  Clock,
  Smartphone,
} from 'lucide-react'

export default function GaransiPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [checkedOrder, setCheckedOrder] = useState<any>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault()
    setHasSearched(true)
    if (orderNumber.trim()) {
      setCheckedOrder({
        orderNumber: orderNumber.trim().toUpperCase(),
        productName: 'iPhone 15 Pro 128GB Natural Titanium',
        storeName: 'Roxy Mas Jakarta',
        purchaseDate: '15 Agustus 2026',
        expiryDate: '14 September 2026',
        status: 'ACTIVE',
        daysLeft: 20,
        coverageType: '30 Hari Tukar Unit Gadget Second + Bonus 3-in-1',
      })
    } else {
      setCheckedOrder(null)
    }
  }

  // 3-Step Claim Flow
  const claimSteps = [
    {
      step: '01',
      title: 'Verifikasi Pesanan',
      desc: 'Masukkan nomor pesanan transaksi Anda pada kolom pencarian di atas.',
    },
    {
      step: '02',
      title: 'Diagnosa Cepat Teknisi',
      desc: 'Bawa unit ke counter cabang toko fisik terdekat atau hubungi chat toko.',
    },
    {
      step: '03',
      title: 'Tukar Unit Pengganti',
      desc: 'Setelah verifikasi kendala fungsional selesai, unit pengganti teruji diserahkan tanpa biaya servis.',
    },
  ]

  // Covered vs Excluded Matrix
  const coveredItems = [
    'Kerusakan fungsional layar (touchscreen error / flicker / dead pixel non-benturan)',
    'Kamera utama atau depan tidak berfungsi secara normal (kendala hardware)',
    'Masalah mikrofon, speaker, atau audio earpiece hardware',
    'Port pengisian daya atau modul charging tidak dapat mengisi daya normal',
    'Kendala konektivitas motherboard, sinyal provider, Bluetooth & Wi-Fi',
    'Jaminan IMEI resmi terdaftar dan aman seumur hidup',
  ]

  const excludedItems = [
    'Kerusakan fisik akibat benturan keras, terjatuh, atau layar retak setelah penerimaan',
    'Kerusakan akibat terkena cairan (air laut, hujan lebat, atau terendam)',
    'Modifikasi sistem operasi tidak resmi (rooting / jailbreak ilegal)',
    'Segel garansi toko pada baut unit dalam kondisi rusak, robek, atau hilang',
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
      <Navbar variant="light" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Centered Modern Verification Section (Zero Box Clutter) */}
          <div className="mx-auto max-w-2xl text-center mb-14 space-y-3">
            
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Garansi 30 Hari Tukar Unit Gadget Second</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Cek Status & Masa Berlaku Garansi
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Masukkan nomor pesanan transaksi Anda untuk memeriksa sisa masa perlindungan unit.
            </p>

            {/* Seamless Unified Search Capsule */}
            <form onSubmit={handleCheck} className="pt-3 max-w-xl mx-auto">
              <div className="relative flex items-center rounded-full border border-slate-200/80 bg-white p-1.5 shadow-2xs transition-all focus-within:border-slate-400 focus-within:shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <Search className="ml-3.5 h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Contoh: ORD-20260815-1234"
                  className="w-full bg-transparent px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none dark:text-white"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 active:scale-[0.99] transition dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shrink-0"
                >
                  <span>Periksa</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>

            {/* Search Results Display */}
            {hasSearched && checkedOrder && (
              <div className="mt-8 text-left rounded-3xl bg-emerald-50/70 p-6 border border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800 space-y-4 shadow-xs animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-3 dark:border-emerald-800/60">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 items-center rounded-full bg-emerald-600 px-2.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      ✓ Proteksi Aktif
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {checkedOrder.orderNumber}
                    </span>
                  </div>
                  <span className="rounded-full bg-white px-3 py-0.5 text-xs font-bold text-emerald-700 shadow-2xs dark:bg-slate-900 dark:text-emerald-400">
                    Sisa {checkedOrder.daysLeft} Hari Garansi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-500 text-[11px]">Nama Gadget:</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{checkedOrder.productName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px]">Toko Pengirim:</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{checkedOrder.storeName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px]">Tanggal Pembelian:</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{checkedOrder.purchaseDate}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px]">Masa Garansi Hingga:</p>
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">{checkedOrder.expiryDate}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Butuh pergantian unit karena kendala fungsional?
                  </span>
                  <a
                    href={`https://wa.me/6281198765431?text=Halo%20Tim%20Garansi%20Affiliate%20Gadget,%20saya%20ingin%20mengajukan%20klaim%20garansi%20ganti%20unit%20untuk%20pesanan%20${encodeURIComponent(checkedOrder.orderNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition active:scale-95"
                  >
                    <PhoneCall className="h-3.5 w-3.5" /> Ajukan Klaim ke Tim Garansi
                  </a>
                </div>
              </div>
            )}

            {hasSearched && !checkedOrder && (
              <div className="mt-5 rounded-2xl bg-amber-50/80 p-4 text-center text-xs text-amber-900 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
                Nomor pesanan tidak ditemukan. Mohon periksa kembali nomor pesanan pada bukti transaksi Anda.
              </div>
            )}
          </div>

          {/* 3-Step Simple Claim Flow (Horizontal Bento) */}
          <div className="mb-14">
            <div className="text-center mb-8 space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                Alur Klaim 3 Langkah Sederhana
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Proses cepat dan transparan tanpa biaya servis tersembunyi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {claimSteps.map((s, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2.5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-900 dark:bg-slate-800 dark:text-white">
                    {s.step}
                  </span>
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Scope of Protection Matrix (Covered vs Excluded) */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xs dark:border-slate-800 dark:bg-slate-900 mb-12">
            <div className="text-center max-w-2xl mx-auto mb-8 space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                Ketentuan & Ruang Lingkup Garansi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transparansi penuh mengenai apa yang dilindungi selama 30 hari pertama kepemilikan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Covered */}
              <div className="rounded-2xl bg-slate-50/80 p-5 sm:p-6 border border-slate-200/60 dark:bg-slate-800/40 dark:border-slate-700/60 space-y-3.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">
                    Kerusakan yang Dilindungi Penuh
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {coveredItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Excluded */}
              <div className="rounded-2xl bg-slate-50/80 p-5 sm:p-6 border border-slate-200/60 dark:bg-slate-800/40 dark:border-slate-700/60 space-y-3.5">
                <div className="flex items-center gap-2 text-rose-500">
                  <XCircle className="h-4 w-4" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">
                    Pengecualian Klaim (Non-Garansi)
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {excludedItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="text-rose-500 font-bold shrink-0 mt-0.5 text-xs">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Direct Help / Assistance Banner */}
          <div className="rounded-3xl bg-slate-950 p-6 sm:p-8 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="space-y-1 max-w-xl">
              <h3 className="text-base sm:text-lg font-bold">
                Punya Pertanyaan Mengenai Status Garansi Anda?
              </h3>
              <p className="text-xs text-slate-300 dark:text-slate-400">
                Konsultasikan langsung dengan teknisi dan customer service resmi kami untuk bantuan klaim cepat.
              </p>
            </div>
            <Link
              href="/hubungi-kami"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-xs font-bold text-slate-950 shadow-2xs hover:bg-slate-100 active:scale-[0.99] transition shrink-0"
            >
              Hubungi Pusat Bantuan
            </Link>
          </div>

        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
